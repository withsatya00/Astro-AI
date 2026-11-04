"""Bhakti Puja Vidhi guides, the festival calendar (computed per location, with editor-confirmed dates taking precedence), and reminders."""
import calendar as _cal
import re
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from packages.database.bhakti import BhaktiAuditLog
from packages.database.bhakti_calendar import BhaktiFestivalDate, BhaktiPuja, BhaktiReminderPref
from packages.database.models import User
from packages.database.session import get_db
from website.backend.app import bhakti_seed_puja as seed
from website.backend.app import panchang_engine as pe
from website.backend.app.api.auth import get_current_user_required
from website.backend.app.api.mandir import require_admin

router = APIRouter(prefix="/bhakti/calendar", tags=["Bhakti Calendar"])
puja_router = APIRouter(prefix="/bhakti/puja", tags=["Puja Vidhi"])

SLUG_RE = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
MIN_YEAR, MAX_YEAR = 2020, 2060
REMINDER_KINDS = ("ekadashi", "purnima", "amavasya", "pradosh", "festival")
ASSUMPTIONS = ("Dates are computed for the chosen place from the real sunrise and the Moon's and Sun's positions (Lahiri ayanamsa), with amanta lunar months. "
               "Traditions and panchangs apply the rules a little differently, so a date can differ by a day from your local panchang. "
               "Dates marked Confirmed were checked against a panchang by an editor.")


# ---------------------------------------------------------------- puja guides
def seed_puja_if_missing(db: Session) -> None:
    have = {s for (s,) in db.query(BhaktiPuja.slug).all()}
    for slug, en, hi, deity, order, summary, samagri, steps, notes in seed.PUJAS:
        if slug not in have:
            db.add(BhaktiPuja(slug=slug, title_en=en, title_hi=hi, deity=deity, sort_order=order, summary=summary, notes=notes,
                              samagri=[{"item": i, "note": n} for i, n in samagri], steps=[{"title": t, "text": x} for t, x in steps],
                              sources=[seed._COMMON], reviewed_on=seed.REVIEWED_ON, is_verified=False, published=True))
    db.commit()


class SourceIn(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    url: Optional[str] = Field(None, max_length=300)
    note: Optional[str] = Field(None, max_length=300)

    @field_validator("url")
    @classmethod
    def _https(cls, v):
        v = (v or "").strip()
        if v and not v.lower().startswith("https://"):
            raise ValueError("Source links must start with https://")
        return v or None


class SamagriIn(BaseModel):
    item: str = Field(..., min_length=1, max_length=200)
    note: str = Field("", max_length=200)


class StepIn(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    text: str = Field("", max_length=2000)


class PujaIn(BaseModel):
    slug: str = Field(..., max_length=100, pattern=SLUG_RE)
    title_en: str = Field(..., min_length=1, max_length=200)
    title_hi: str = Field("", max_length=200)
    deity: str = Field("", max_length=60)
    summary: str = Field("", max_length=500)
    samagri: List[SamagriIn] = Field(default_factory=list, max_length=60)
    steps: List[StepIn] = Field(default_factory=list, max_length=40)
    notes: str = Field("", max_length=4000)
    sources: List[SourceIn] = Field(default_factory=list, max_length=20)
    reviewed_on: str = Field("", max_length=10)
    sort_order: int = Field(0, ge=0, le=100000)
    is_verified: bool = False
    published: bool = False

    @field_validator("reviewed_on")
    @classmethod
    def _date(cls, v):
        if v and not DATE_RE.match(v):
            raise ValueError("reviewed_on must be YYYY-MM-DD")
        return v


def _puja_out(p: BhaktiPuja, full: bool = True) -> dict:
    d = {"slug": p.slug, "title_en": p.title_en, "title_hi": p.title_hi, "deity": p.deity, "summary": p.summary, "is_verified": p.is_verified,
         "reviewed_on": p.reviewed_on, "sort_order": p.sort_order}
    if full:
        d.update({"samagri": p.samagri or [], "steps": p.steps or [], "notes": p.notes, "sources": p.sources or [], "published": p.published})
    return d


@puja_router.get("")
def list_pujas(db: Session = Depends(get_db)):
    rows = db.query(BhaktiPuja).filter(BhaktiPuja.published == True).order_by(BhaktiPuja.sort_order, BhaktiPuja.title_en).all()  # noqa: E712
    return [_puja_out(p, full=False) for p in rows]


@puja_router.get("/admin/list")
def admin_list_pujas(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return [_puja_out(p) for p in db.query(BhaktiPuja).order_by(BhaktiPuja.sort_order, BhaktiPuja.title_en).all()]


@puja_router.get("/{slug}")
def get_puja(slug: str, db: Session = Depends(get_db)):
    p = db.query(BhaktiPuja).filter(BhaktiPuja.slug == slug, BhaktiPuja.published == True).first()  # noqa: E712
    if not p:
        raise HTTPException(status_code=404, detail="Puja guide not found")
    return _puja_out(p)


@puja_router.put("/admin/guide")
def admin_upsert_puja(payload: PujaIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if payload.published and (not payload.steps or not payload.sources or not payload.reviewed_on):
        raise HTTPException(status_code=422, detail="To publish, the steps, at least one source and the review date are required")
    p = db.query(BhaktiPuja).filter(BhaktiPuja.slug == payload.slug).first()
    created = p is None
    if created:
        p = BhaktiPuja(slug=payload.slug)
        db.add(p)
    for f in ("title_en", "title_hi", "deity", "summary", "notes", "reviewed_on", "sort_order", "is_verified", "published"):
        setattr(p, f, getattr(payload, f))
    p.samagri = [s.model_dump() for s in payload.samagri]
    p.steps = [s.model_dump() for s in payload.steps]
    p.sources = [s.model_dump() for s in payload.sources]
    db.flush()
    db.add(BhaktiAuditLog(actor_id=admin.id, action="create" if created else "update", entity="puja", entity_id=p.slug, detail={"published": p.published}))
    db.commit()
    return _puja_out(p)


@puja_router.delete("/admin/guide/{slug}")
def admin_delete_puja(slug: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    p = db.query(BhaktiPuja).filter(BhaktiPuja.slug == slug).first()
    if not p:
        raise HTTPException(status_code=404, detail="Puja guide not found")
    db.delete(p)
    db.add(BhaktiAuditLog(actor_id=admin.id, action="delete", entity="puja", entity_id=slug))
    db.commit()
    return {"deleted": slug}


# ---------------------------------------------------------------- calendar
def _loc(location: Optional[str], lat: Optional[float], lon: Optional[float], tz: Optional[float]):
    try:
        return pe.resolve_location(location, lat, lon, tz)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


def _year_days(year: int, lat: float, lon: float, tz: float):
    """The day table for a year plus a margin on both sides, so lunar months and festivals near the edges are right."""
    return pe.build_days(date(year - 1, 12, 1), date(year + 1, 1, 31), round(lat, 4), round(lon, 4), tz)


def _check_year(year: int) -> None:
    if not (MIN_YEAR <= year <= MAX_YEAR):
        raise HTTPException(status_code=422, detail=f"Year must be between {MIN_YEAR} and {MAX_YEAR}")


def _festivals_for(db: Session, days, year: int, loc_key: str) -> List[dict]:
    """Computed festivals, with any editor-confirmed date for the same festival and year taking precedence."""
    computed = {f["slug"]: dict(f, status="computed") for f in pe.find_festivals(days, year)}
    rows = (db.query(BhaktiFestivalDate).filter(BhaktiFestivalDate.published == True, BhaktiFestivalDate.date.like(f"{year}-%"))  # noqa: E712
            .filter(BhaktiFestivalDate.location.in_(["", loc_key])).all())
    out = dict(computed)
    for r in rows:
        base = computed.get(r.slug)
        d = datetime.strptime(r.date, "%Y-%m-%d").date()
        item = {"slug": r.slug, "name_en": r.name_en, "name_hi": r.name_hi or (base or {}).get("name_hi", ""), "date": r.date, "weekday": d.strftime("%A"),
                "month": (base or {}).get("month", ""), "tithi": (base or {}).get("tithi", ""), "rule": (base or {}).get("rule", ""), "exact_rule": True,
                "note": r.description, "status": "confirmed", "source": r.source, "is_verified": r.is_verified}
        if base and base["date"] != r.date:
            item["computed_date"] = base["date"]
        out[r.slug + ("" if r.slug not in out or out[r.slug]["status"] == "computed" else f"@{r.date}")] = item
    return sorted(out.values(), key=lambda x: x["date"])


def _day_out(d: pe.Day, nxt: Optional[pe.Day], fests: List[dict]) -> dict:
    en, hi, paksha = pe.tithi_name(d.tithi_sunrise)
    return {"date": d.date.isoformat(), "weekday": d.date.strftime("%A"), "sunrise": d.sunrise.strftime("%H:%M"), "sunset": d.sunset.strftime("%H:%M"),
            "tithi": {"number": d.tithi_sunrise, "name_en": en, "name_hi": hi, "paksha": paksha}, "lunar_month": d.month_name, "lunar_month_hi": d.month_name_hi,
            "adhika": d.adhika, "observances": pe.observances_for(d, nxt), "festivals": [f for f in fests if f["date"] == d.date.isoformat()]}


def _context(label, lat, lon, tz, key):
    off = f"UTC{tz:+g}"
    return {"location": {"key": key, "label": label, "latitude": lat, "longitude": lon, "utc_offset_hours": tz, "timezone": off},
            "assumptions": ASSUMPTIONS, "ayanamsa": "Lahiri", "month_system": "amanta"}


@router.get("/locations")
def locations():
    return [{"key": k, "label": v[0], "latitude": v[1], "longitude": v[2], "utc_offset_hours": v[3]} for k, v in pe.LOCATIONS.items()]


@router.get("/month")
def month(year: int = Query(...), month: int = Query(..., ge=1, le=12), location: Optional[str] = Query(None, max_length=20),
          lat: Optional[float] = None, lon: Optional[float] = None, tz: Optional[float] = None, db: Session = Depends(get_db)):
    _check_year(year)
    label, la, lo, z, key = _loc(location, lat, lon, tz)
    try:
        days = _year_days(year, la, lo, z)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    fests = _festivals_for(db, days, year, key)
    last = _cal.monthrange(year, month)[1]
    rows = [(i, d) for i, d in enumerate(days) if d.date.year == year and d.date.month == month]
    return {**_context(label, la, lo, z, key), "year": year, "month": month, "days_in_month": last,
            "days": [_day_out(d, days[i + 1] if i + 1 < len(days) else None, fests) for i, d in rows]}


@router.get("/festivals")
def festivals(year: int = Query(...), location: Optional[str] = Query(None, max_length=20), lat: Optional[float] = None, lon: Optional[float] = None,
              tz: Optional[float] = None, db: Session = Depends(get_db)):
    _check_year(year)
    label, la, lo, z, key = _loc(location, lat, lon, tz)
    try:
        days = _year_days(year, la, lo, z)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {**_context(label, la, lo, z, key), "year": year, "festivals": _festivals_for(db, days, year, key)}


def _upcoming(db: Session, kinds: set, location, lat, lon, tz, horizon: int, today: Optional[date] = None) -> dict:
    label, la, lo, z, key = _loc(location, lat, lon, tz)
    today = today or datetime.now(timezone(timedelta(hours=z))).date()
    end = today + timedelta(days=horizon)
    items: List[dict] = []
    for y in sorted({today.year, end.year}):
        days = _year_days(y, la, lo, z)
        if "festival" in kinds:
            items += [dict(f, kind="festival", name=f["name_en"]) for f in _festivals_for(db, days, y, key) if today.isoformat() <= f["date"] <= end.isoformat()]
        for i, d in enumerate(days):
            if d.date.year != y or not (today <= d.date <= end):
                continue
            for o in pe.observances_for(d, days[i + 1] if i + 1 < len(days) else None):
                if o["kind"] in kinds:
                    items.append({"kind": o["kind"], "name": o["name_en"], "name_hi": o["name_hi"], "name_en": o["name_en"], "date": d.date.isoformat(),
                                  "weekday": d.date.strftime("%A"), "note": o["detail"], "status": "computed"})
    return {"label": label, "key": key, "today": today.isoformat(), "items": sorted(items, key=lambda x: (x["date"], x["kind"]))}


@router.get("/upcoming")
def upcoming(days: int = Query(30, ge=1, le=120), location: Optional[str] = Query(None, max_length=20), lat: Optional[float] = None, lon: Optional[float] = None,
             tz: Optional[float] = None, db: Session = Depends(get_db)):
    r = _upcoming(db, set(REMINDER_KINDS), location, lat, lon, tz, days)
    return {**r, "assumptions": ASSUMPTIONS}


# ---------------------------------------------------------------- reminders (in-app)
class ReminderIn(BaseModel):
    kind: str = Field(..., pattern="^(ekadashi|purnima|amavasya|pradosh|festival)$")
    enabled: bool = True
    lead_days: int = Field(1, ge=0, le=3)
    location: str = Field("delhi", max_length=20)


def _pref_out(p: BhaktiReminderPref) -> dict:
    return {"kind": p.kind, "enabled": p.enabled, "lead_days": p.lead_days, "location": p.location}


@router.get("/reminders")
def get_reminders(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    saved = {p.kind: p for p in db.query(BhaktiReminderPref).filter(BhaktiReminderPref.user_id == user.id).all()}
    return {"delivery": "in-app", "prefs": [_pref_out(saved[k]) if k in saved else {"kind": k, "enabled": False, "lead_days": 1, "location": "delhi"} for k in REMINDER_KINDS]}


@router.put("/reminders")
def set_reminder(payload: ReminderIn, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if payload.location not in pe.LOCATIONS:
        raise HTTPException(status_code=422, detail="Unknown location")
    p = db.query(BhaktiReminderPref).filter(BhaktiReminderPref.user_id == user.id, BhaktiReminderPref.kind == payload.kind).first()
    if not p:
        p = BhaktiReminderPref(user_id=user.id, kind=payload.kind)
        db.add(p)
    p.enabled, p.lead_days, p.location = payload.enabled, payload.lead_days, payload.location
    db.commit()
    return _pref_out(p)


@router.get("/reminders/upcoming")
def reminders_upcoming(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    """What is coming up for the signed-in person: each enabled kind, with the day to be reminded (the date minus the lead days)."""
    prefs = [p for p in db.query(BhaktiReminderPref).filter(BhaktiReminderPref.user_id == user.id, BhaktiReminderPref.enabled == True).all()]  # noqa: E712
    out: List[dict] = []
    for p in prefs:
        r = _upcoming(db, {p.kind}, p.location, None, None, None, 60)
        today = date.fromisoformat(r["today"])
        for it in r["items"]:
            on = date.fromisoformat(it["date"]) - timedelta(days=p.lead_days)
            out.append({**it, "remind_on": on.isoformat(), "lead_days": p.lead_days, "days_to_remind": (on - today).days, "location": r["label"]})
    out = sorted([o for o in out if o["days_to_remind"] >= 0], key=lambda x: (x["remind_on"], x["date"]))
    return {"delivery": "in-app", "items": out[:20]}


# ---------------------------------------------------------------- admin: confirmed festival dates
class FestivalDateIn(BaseModel):
    slug: str = Field(..., max_length=100, pattern=SLUG_RE)
    name_en: str = Field(..., min_length=1, max_length=200)
    name_hi: str = Field("", max_length=200)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    location: str = Field("", max_length=20)
    description: str = Field("", max_length=500)
    source: str = Field("", max_length=300)
    is_verified: bool = False
    published: bool = False

    @field_validator("date")
    @classmethod
    def _real_date(cls, v):
        datetime.strptime(v, "%Y-%m-%d")
        return v


def _fd_out(r: BhaktiFestivalDate) -> dict:
    return {"id": r.id, "slug": r.slug, "name_en": r.name_en, "name_hi": r.name_hi, "date": r.date, "location": r.location, "description": r.description,
            "source": r.source, "is_verified": r.is_verified, "published": r.published}


@router.get("/admin/dates")
def admin_dates(db: Session = Depends(get_db), _a: User = Depends(require_admin)):
    return [_fd_out(r) for r in db.query(BhaktiFestivalDate).order_by(BhaktiFestivalDate.date).all()]


@router.put("/admin/date")
def admin_upsert_date(payload: FestivalDateIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    if payload.location and payload.location not in pe.LOCATIONS:
        raise HTTPException(status_code=422, detail="Unknown location (leave blank for everywhere)")
    if payload.published and not payload.source.strip():
        raise HTTPException(status_code=422, detail="To publish a confirmed date, the panchang or source it was checked against is required")
    r = db.query(BhaktiFestivalDate).filter(BhaktiFestivalDate.slug == payload.slug, BhaktiFestivalDate.date == payload.date,
                                            BhaktiFestivalDate.location == payload.location).first()
    created = r is None
    if created:
        r = BhaktiFestivalDate(slug=payload.slug, date=payload.date, location=payload.location)
        db.add(r)
    for f in ("name_en", "name_hi", "description", "source", "is_verified", "published"):
        setattr(r, f, getattr(payload, f))
    db.flush()
    db.add(BhaktiAuditLog(actor_id=admin.id, action="create" if created else "update", entity="festival_date", entity_id=f"{r.slug}@{r.date}", detail={"published": r.published}))
    db.commit()
    return _fd_out(r)


@router.delete("/admin/date/{date_id}")
def admin_delete_date(date_id: str, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    r = db.query(BhaktiFestivalDate).filter(BhaktiFestivalDate.id == date_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Date not found")
    db.delete(r)
    db.add(BhaktiAuditLog(actor_id=admin.id, action="delete", entity="festival_date", entity_id=f"{r.slug}@{r.date}"))
    db.commit()
    return {"deleted": date_id}
