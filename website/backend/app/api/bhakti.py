"""Bhakti: deity/mantra catalogue and the signed-in user's naam-jaap sessions, history, analytics and report."""
import csv
import io
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from packages.core.logging import logger
from packages.database.bhakti import BhaktiDeity, BhaktiMantra, JaapEvent, JaapRecord, JaapSession
from packages.database.models import User, utc_now
from packages.database.session import get_db
from website.backend.app.api.auth import get_current_user_optional, get_current_user_required

router = APIRouter(prefix="/bhakti", tags=["Bhakti"])

IST = timezone(timedelta(hours=5, minutes=30))  # day boundaries for streaks and daily totals
MALA = 108
MAX_DELTA = 108
MAX_TARGET = 1_000_000
MAX_BACKFILL = timedelta(days=7)
MAX_CUSTOM_MANTRAS = 20

SEED_DEITIES = [
    ("krishna", "Shri Krishna", "श्री कृष्ण"), ("shiva", "Bhagwan Shiva", "भगवान शिव"), ("ram", "Shri Ram", "श्री राम"),
    ("hanuman", "Hanuman Ji", "हनुमान जी"), ("ganesh", "Ganesh Ji", "गणेश जी"), ("durga", "Maa Durga", "माँ दुर्गा"),
    ("lakshmi", "Maa Lakshmi", "माँ लक्ष्मी"), ("vishnu", "Bhagwan Vishnu", "भगवान विष्णु"),
]
# (slug, deity, Devanagari, roman, accepted spoken forms)
SEED_MANTRAS = [
    ("radhe-radhe", "krishna", "राधे राधे", "Radhe Radhe", ["radhe radhe", "radhey radhey", "राधे राधे"]),
    ("hare-krishna", "krishna", "हरे कृष्ण", "Hare Krishna", ["hare krishna", "hare krishn", "हरे कृष्ण", "हरे कृष्णा"]),
    ("om-namah-shivaya", "shiva", "ॐ नमः शिवाय", "Om Namah Shivaya", ["om namah shivaya", "om namah shivay", "ओम नमः शिवाय", "ॐ नमः शिवाय", "ओम नमः शिवाय"]),
    ("shri-ram", "ram", "श्री राम", "Shri Ram", ["shri ram", "shree ram", "sri ram", "श्री राम", "श्रीराम"]),
    ("jai-shri-ram", "ram", "जय श्री राम", "Jai Shri Ram", ["jai shri ram", "jai shree ram", "jai sri ram", "जय श्री राम", "जय श्रीराम"]),
    ("jai-hanuman", "hanuman", "जय हनुमान", "Jai Hanuman", ["jai hanuman", "jay hanuman", "जय हनुमान"]),
    ("om-gan-ganapataye-namah", "ganesh", "ॐ गं गणपतये नमः", "Om Gam Ganapataye Namah", ["om gam ganapataye namah", "ओम गं गणपतये नमः", "ॐ गं गणपतये नमः"]),
    ("jai-mata-di", "durga", "जय माता दी", "Jai Mata Di", ["jai mata di", "jay mata di", "जय माता दी"]),
    ("om-namo-narayanaya", "vishnu", "ॐ नमो नारायणाय", "Om Namo Narayanaya", ["om namo narayanaya", "ओम नमो नारायणाय", "ॐ नमो नारायणाय"]),
]


def seed_bhakti_if_empty(db: Session) -> None:
    """Idempotent: adds any catalogue deity or mantra that is missing, never touches existing rows."""
    by_slug = {d.slug: d for d in db.query(BhaktiDeity).all()}
    for i, (slug, en, hi) in enumerate(SEED_DEITIES):
        if slug not in by_slug:
            d = BhaktiDeity(slug=slug, name_en=en, name_hi=hi, sort_order=i)
            db.add(d)
            by_slug[slug] = d
    db.flush()
    have = {m.slug for m in db.query(BhaktiMantra.slug).all()}
    for slug, deity, hi, roman, phrases in SEED_MANTRAS:
        if slug not in have:
            db.add(BhaktiMantra(slug=slug, deity_id=by_slug[deity].id, text_hi=hi, text_roman=roman, match_phrases=phrases))
    db.commit()


def _day(dt: datetime) -> str:
    return dt.astimezone(IST).strftime("%Y-%m-%d")


def _today() -> str:
    return _day(utc_now())


class SessionCreate(BaseModel):
    mantra_id: str
    mode: str = Field("manual", pattern="^(manual|voice|mala)$")
    target: int = Field(MALA, ge=1, le=MAX_TARGET)


class SessionUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(active|paused|completed)$")
    target: Optional[int] = Field(None, ge=1, le=MAX_TARGET)


class EventIn(BaseModel):
    event_id: str = Field(..., min_length=8, max_length=64, pattern=r"^[A-Za-z0-9_\-:.]+$")
    delta: int = Field(..., ge=-MAX_DELTA, le=MAX_DELTA)
    source: str = Field("manual", pattern="^(manual|voice|mala)$")
    occurred_at: Optional[datetime] = None


class BatchIn(BaseModel):
    events: List[EventIn] = Field(..., min_length=1, max_length=500)


class CustomMantra(BaseModel):
    text: str = Field(..., min_length=2, max_length=120)
    text_roman: Optional[str] = Field(None, max_length=120)


def _norm_phrase(s: str) -> str:
    return " ".join(s.lower().split())


def _mantra_out(m: BhaktiMantra, deities: dict) -> dict:
    d = deities.get(m.deity_id)
    return {"id": m.id, "slug": m.slug, "text_hi": m.text_hi, "text_roman": m.text_roman, "match_phrases": m.match_phrases or [],
            "is_custom": m.is_custom, "deity": {"slug": d.slug, "name_en": d.name_en, "name_hi": d.name_hi} if d else None}


def _session_out(s: JaapSession) -> dict:
    return {"id": s.id, "mantra_id": s.mantra_id, "mode": s.mode, "target": s.target, "count": s.count, "status": s.status,
            "malas": s.count // MALA, "started_at": s.started_at.isoformat() if s.started_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None}


def _own_session(db: Session, user: User, session_id: str, lock: bool = False) -> JaapSession:
    q = db.query(JaapSession).filter(JaapSession.id == session_id, JaapSession.user_id == user.id)
    s = (q.with_for_update() if lock else q).first()
    if not s:  # same answer for "missing" and "someone else's", so ids cannot be probed
        raise HTTPException(status_code=404, detail="Session not found")
    return s


@router.get("/deities")
def list_deities(db: Session = Depends(get_db)):
    rows = db.query(BhaktiDeity).filter(BhaktiDeity.is_active == True).order_by(BhaktiDeity.sort_order).all()  # noqa: E712
    return [{"slug": d.slug, "name_en": d.name_en, "name_hi": d.name_hi} for d in rows]


@router.get("/mantras")
def list_mantras(db: Session = Depends(get_db), user: Optional[User] = Depends(get_current_user_optional)):
    """Catalogue mantras for everyone, plus the caller's own custom ones when signed in."""
    deities = {d.id: d for d in db.query(BhaktiDeity).all()}
    q = db.query(BhaktiMantra).filter(BhaktiMantra.is_active == True)  # noqa: E712
    rows = [m for m in q.all() if not m.is_custom or (user and m.owner_user_id == user.id)]
    return [_mantra_out(m, deities) for m in rows]


@router.post("/mantras/custom", status_code=201)
def add_custom_mantra(payload: CustomMantra, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    text = " ".join(payload.text.split())
    if db.query(BhaktiMantra).filter(BhaktiMantra.owner_user_id == user.id, BhaktiMantra.is_custom == True).count() >= MAX_CUSTOM_MANTRAS:  # noqa: E712
        raise HTTPException(status_code=400, detail=f"You can save up to {MAX_CUSTOM_MANTRAS} custom mantras")
    roman = " ".join((payload.text_roman or text).split())
    import uuid
    m = BhaktiMantra(slug=f"custom-{uuid.uuid4().hex[:12]}", text_hi=text, text_roman=roman, is_custom=True, owner_user_id=user.id,
                     match_phrases=sorted({_norm_phrase(text), _norm_phrase(roman)}))
    db.add(m)
    db.commit()
    return _mantra_out(m, {})


@router.post("/jaap/sessions", status_code=201)
def start_session(payload: SessionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    m = db.query(BhaktiMantra).filter(BhaktiMantra.id == payload.mantra_id, BhaktiMantra.is_active == True).first()  # noqa: E712
    if not m or (m.is_custom and m.owner_user_id != user.id):
        raise HTTPException(status_code=404, detail="Mantra not found")
    s = JaapSession(user_id=user.id, mantra_id=m.id, mode=payload.mode, target=payload.target)
    db.add(s)
    db.commit()
    return _session_out(s)


@router.get("/jaap/sessions/active")
def active_session(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """The latest unfinished session, so a reload or another device resumes where the user stopped."""
    s = (db.query(JaapSession).filter(JaapSession.user_id == user.id, JaapSession.status.in_(("active", "paused")))
         .order_by(JaapSession.updated_at.desc()).first())
    return {"session": _session_out(s) if s else None}


@router.patch("/jaap/sessions/{session_id}")
def update_session(session_id: str, payload: SessionUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    s = _own_session(db, user, session_id, lock=True)
    if payload.target is not None:
        s.target = payload.target
    if payload.status:
        s.status = payload.status
        s.ended_at = utc_now() if payload.status == "completed" else None
    db.commit()
    return _session_out(s)


@router.delete("/jaap/sessions/{session_id}")
def discard_session(session_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Reset: closes the session. Counts already recorded stay in history; nothing is silently erased."""
    s = _own_session(db, user, session_id, lock=True)
    s.status = "completed"
    s.ended_at = utc_now()
    db.commit()
    return _session_out(s)


def _apply_event(db: Session, user: User, s: JaapSession, ev: EventIn, now: datetime) -> dict:
    """Applies one event inside the caller's transaction. Returns {event_id, status: applied|duplicate}."""
    if db.query(JaapEvent.id).filter(JaapEvent.user_id == user.id, JaapEvent.event_id == ev.event_id).first():
        return {"event_id": ev.event_id, "status": "duplicate"}
    when = ev.occurred_at.astimezone(timezone.utc) if ev.occurred_at and ev.occurred_at.tzinfo else now
    if when > now + timedelta(minutes=5) or now - when > MAX_BACKFILL:
        when = now  # implausible client clock: count it today instead of rewriting history
    applied = max(ev.delta, -s.count)
    s.count += applied
    if s.count >= s.target and s.status == "active":
        s.status = "completed"
        s.ended_at = now
    rec = db.query(JaapRecord).filter(JaapRecord.user_id == user.id, JaapRecord.mantra_id == s.mantra_id, JaapRecord.day == _day(when)).with_for_update().first()
    if not rec:
        rec = JaapRecord(user_id=user.id, mantra_id=s.mantra_id, day=_day(when), count=0)
        db.add(rec)
    rec.count = max(0, (rec.count or 0) + applied)
    db.add(JaapEvent(event_id=ev.event_id, session_id=s.id, user_id=user.id, delta=ev.delta, applied=applied, source=ev.source, created_at=now))
    return {"event_id": ev.event_id, "status": "applied"}


def _post_events(db: Session, user: User, session_id: str, events: List[EventIn]) -> dict:
    s = _own_session(db, user, session_id, lock=True)
    if s.status == "completed":
        raise HTTPException(status_code=409, detail="This session is already completed")
    now = utc_now()
    results = []
    try:
        for ev in events:
            results.append(_apply_event(db, user, s, ev, now))
            db.flush()
        db.commit()
    except IntegrityError:
        # A concurrent retry won the race on the unique (user_id, event_id); redo cleanly so the answer is "duplicate".
        db.rollback()
        s = _own_session(db, user, session_id, lock=True)
        results = [_apply_event(db, user, s, ev, now) for ev in events]
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("jaap event write failed")
        raise
    return {"session": _session_out(s), "results": results}


@router.post("/jaap/sessions/{session_id}/events")
def post_event(session_id: str, payload: EventIn, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return _post_events(db, user, session_id, [payload])


@router.post("/jaap/sessions/{session_id}/events/batch")
def post_events_batch(session_id: str, payload: BatchIn, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """Offline sync: replays queued events; already-seen event ids are reported as duplicates and not recounted."""
    return _post_events(db, user, session_id, payload.events)


@router.get("/jaap/history")
def jaap_history(page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db),
                 user: User = Depends(get_current_user_required)):
    q = db.query(JaapSession).filter(JaapSession.user_id == user.id, JaapSession.count > 0)
    total = q.count()
    rows = q.order_by(JaapSession.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    mantras = {m.id: m for m in db.query(BhaktiMantra).filter(BhaktiMantra.id.in_([r.mantra_id for r in rows] or [""])).all()}
    return {"total": total, "page": page, "page_size": page_size,
            "items": [{**_session_out(r), "mantra": mantras[r.mantra_id].text_roman if r.mantra_id in mantras else ""} for r in rows]}


def _streak(days: set) -> tuple:
    """(current, best) consecutive-day streaks. Today may still be empty without breaking the current streak."""
    today = datetime.now(IST).date()
    cur, d = 0, today if today.isoformat() in days else today - timedelta(days=1)
    while d.isoformat() in days:
        cur += 1
        d -= timedelta(days=1)
    best = run = 0
    prev = None
    for s in sorted(days):
        dt = datetime.strptime(s, "%Y-%m-%d").date()
        run = run + 1 if prev and dt - prev == timedelta(days=1) else 1
        best = max(best, run)
        prev = dt
    return cur, best


MILESTONES = [(108, "First mala"), (1_008, "1,008 jaap"), (10_008, "10,008 jaap"), (100_008, "1 lakh jaap")]


@router.get("/jaap/analytics")
def jaap_analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    today = datetime.now(IST).date()
    recs = db.query(JaapRecord).filter(JaapRecord.user_id == user.id, JaapRecord.count > 0).all()
    by_day, by_mantra = {}, {}
    for r in recs:
        by_day[r.day] = by_day.get(r.day, 0) + r.count
        by_mantra[r.mantra_id] = by_mantra.get(r.mantra_id, 0) + r.count
    total = sum(by_day.values())

    def window(n):
        start = (today - timedelta(days=n - 1)).isoformat()
        return sum(c for d, c in by_day.items() if d >= start)

    mantras = {m.id: m for m in db.query(BhaktiMantra).filter(BhaktiMantra.id.in_(list(by_mantra) or [""])).all()}
    cur, best = _streak(set(by_day))
    heat_start = (today - timedelta(days=364)).isoformat()
    return {
        "today": by_day.get(today.isoformat(), 0), "week": window(7), "month": window(30), "lifetime": total,
        "malas": total // MALA, "streak": cur, "best_streak": best, "timezone": "Asia/Kolkata",
        "by_mantra": sorted([{"mantra_id": k, "mantra": mantras[k].text_roman if k in mantras else "", "text_hi": mantras[k].text_hi if k in mantras else "", "count": v}
                             for k, v in by_mantra.items()], key=lambda x: -x["count"]),
        "daily": [{"day": d, "count": c} for d, c in sorted(by_day.items()) if d >= heat_start],
        "milestones": [{"at": n, "label": label, "reached": total >= n} for n, label in MILESTONES],
    }


@router.get("/jaap/report.csv")
def jaap_report(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    rows = (db.query(JaapRecord, BhaktiMantra).join(BhaktiMantra, BhaktiMantra.id == JaapRecord.mantra_id)
            .filter(JaapRecord.user_id == user.id, JaapRecord.count > 0).order_by(JaapRecord.day).all())
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["date_ist", "mantra", "count"])
    for r, m in rows:
        w.writerow([r.day, m.text_roman, r.count])
    return Response(buf.getvalue(), media_type="text/csv", headers={"Content-Disposition": 'attachment; filename="my-bhakti-report.csv"'})
