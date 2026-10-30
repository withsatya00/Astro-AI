"""Authenticated advanced workspace. Every subject is checked against its owner."""
from packages.core.advanced import option
from datetime import date, datetime, timedelta, timezone
from typing import Literal
from importlib.util import find_spec
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
from packages.database.session import get_db
from packages.database.models import User, BirthChart, Consultation, ConsultationSummary, ChatMessage, Astrologer
from packages.database.advanced import AdvancedRecord, ScheduledReminder, QualityEvent
from packages.astrology import advanced as calculations
from website.backend.app.api.auth import get_current_user_required

router = APIRouter(prefix="/advanced", tags=["Advanced workspace"])


def own_chart(db, user, chart_id):
    chart = db.query(BirthChart).filter(BirthChart.id == chart_id, BirthChart.user_id == user.id).first()
    if not chart:
        raise HTTPException(404, "Birth profile not found")
    return chart


def record(db, user_id, kind, subject=None):
    return db.query(AdvancedRecord).filter_by(user_id=user_id, kind=kind, subject_id=subject or "").first()


def save_record(db, user_id, kind, data, subject=None):
    row = record(db, user_id, kind, subject)
    if row is None:
        row = AdvancedRecord(user_id=user_id, kind=kind, subject_id=subject or "")
        db.add(row)
    row.data = data
    db.commit()
    return data


class FamilyLabel(BaseModel):
    relationship: Literal["self", "partner", "child", "parent", "sibling", "other"] = "self"
    label: str = Field("", max_length=80)


@router.get("/family")
def family(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    labels = {r.subject_id: r.data for r in db.query(AdvancedRecord).filter_by(user_id=user.id, kind="family").all()}
    return [dict(id=c.id, name=c.name, date_of_birth=c.date_of_birth, city=c.city,
                 is_default=c.is_default, **labels.get(c.id, {"relationship": "self", "label": ""}))
            for c in db.query(BirthChart).filter_by(user_id=user.id).order_by(BirthChart.created_at.desc()).all()]


@router.put("/family/{chart_id}")
def label_family(chart_id: str, payload: FamilyLabel, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    own_chart(db, user, chart_id)
    return save_record(db, user.id, "family", payload.model_dump(), chart_id)


class MemoryInput(BaseModel):
    enabled: bool = False
    content: str = Field("", max_length=2000)


@router.get("/memory/{chart_id}")
def memory(chart_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    own_chart(db, user, chart_id)
    row = record(db, user.id, "memory", chart_id)
    return row.data if row else {"enabled": False, "content": ""}


@router.put("/memory/{chart_id}")
def put_memory(chart_id: str, payload: MemoryInput, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    own_chart(db, user, chart_id)
    return save_record(db, user.id, "memory", payload.model_dump(), chart_id)


@router.delete("/memory/{chart_id}")
def delete_memory(chart_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    own_chart(db, user, chart_id)
    db.query(AdvancedRecord).filter_by(user_id=user.id, kind="memory", subject_id=chart_id).delete()
    db.commit()
    return {"enabled": False, "content": ""}


@router.get("/memory/{chart_id}/suggestion")
def memory_suggestion(chart_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    own_chart(db, user, chart_id)
    summary = (db.query(ConsultationSummary).join(Consultation, ConsultationSummary.consultation_id == Consultation.id)
               .filter(Consultation.user_id == user.id, Consultation.chart_id == chart_id)
               .order_by(ConsultationSummary.created_at.desc()).first())
    if not summary:
        raise HTTPException(404, "No consultation summary exists for this profile yet")
    parts = [summary.concern or ""] + list(summary.key_insights or []) + list(summary.follow_ups or [])
    return {"content": "\n".join(str(p) for p in parts if p)[:2000], "consultation_id": summary.consultation_id,
            "note": "Review this draft and explicitly save/enable it to use it as memory"}


@router.get("/charts/{chart_id}/timeline")
def timeline(chart_id: str, selected: date, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    chart = own_chart(db, user, chart_id)
    try:
        return calculations.timeline(chart, selected)
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@router.get("/charts/{chart_id}/uncertainty")
def uncertainty(chart_id: str, minutes: int = Query(15, ge=2, le=60), db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    chart = own_chart(db, user, chart_id)
    try:
        return calculations.uncertainty(chart, minutes)
    except ValueError as exc:
        raise HTTPException(422, str(exc))


@router.get("/charts/{chart_id}/evidence")
def evidence(chart_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return calculations.evidence(own_chart(db, user, chart_id))


@router.get("/charts/{chart_id}/muhurat")
def muhurat(chart_id: str, start: date, days: int = Query(7, ge=1, le=31), event: Literal["marriage", "housewarming", "business", "vehicle"] = "business",
            db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return calculations.muhurat(own_chart(db, user, chart_id), start, days, event)


class ReminderPreferences(BaseModel):
    enabled: bool = True
    quiet_start: int = Field(22, ge=0, le=23)
    quiet_end: int = Field(7, ge=0, le=23)
    timezone: str = "Asia/Kolkata"
    max_per_day: int = Field(3, ge=1, le=20)

    @field_validator("timezone")
    @classmethod
    def valid_zone(cls, value):
        from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise ValueError("Unknown IANA timezone")
        return value


@router.get("/reminder-preferences")
def preferences(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    row = record(db, user.id, "reminder_preferences")
    return dict(preferences=row.data if row else ReminderPreferences().model_dump(),
                push_public_key=option("VAPID_PUBLIC_KEY"),
                push_configured=bool(option("VAPID_PRIVATE_KEY") and option("VAPID_PUBLIC_KEY") and find_spec("pywebpush")))


@router.put("/reminder-preferences")
def put_preferences(payload: ReminderPreferences, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return save_record(db, user.id, "reminder_preferences", payload.model_dump())


class ReminderInput(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    due_at: datetime
    repeat_days: int = Field(0, ge=0, le=365)

    @field_validator("due_at")
    @classmethod
    def aware_future(cls, value):
        if value.tzinfo is None or value <= datetime.now(timezone.utc):
            raise ValueError("Reminder must be a future timestamp with timezone")
        return value.astimezone(timezone.utc)


def reminder_json(row):
    return dict(id=row.id, title=row.title, due_at=row.due_at.replace(tzinfo=timezone.utc).isoformat(), repeat_days=row.repeat_days, active=row.active)


@router.get("/reminders")
def reminders(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    return [reminder_json(r) for r in db.query(ScheduledReminder).filter_by(user_id=user.id, active=True).order_by(ScheduledReminder.due_at).limit(100).all()]


@router.post("/reminders", status_code=201)
def create_reminder(payload: ReminderInput, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if db.query(ScheduledReminder).filter_by(user_id=user.id, active=True).count() >= 100:
        raise HTTPException(409, "Maximum 100 active reminders")
    row = ScheduledReminder(user_id=user.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return reminder_json(row)


@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    row = db.query(ScheduledReminder).filter_by(id=reminder_id, user_id=user.id).first()
    if not row:
        raise HTTPException(404, "Reminder not found")
    db.delete(row)
    db.commit()
    return {"deleted": True}


class PushInput(BaseModel):
    endpoint: str = Field(max_length=2048)
    keys: dict[str, str]

    @field_validator("endpoint")
    @classmethod
    def safe_push_host(cls, value):
        from urllib.parse import urlparse
        u = urlparse(value)
        host = u.hostname or ""
        allowed = ("fcm.googleapis.com", "updates.push.services.mozilla.com", "push.apple.com", "notify.windows.com")
        if u.scheme != "https" or u.username or u.password or u.port not in (None, 443) or not any(host == h or host.endswith("." + h) for h in allowed):
            raise ValueError("Unsupported browser push endpoint")
        return value

    @field_validator("keys")
    @classmethod
    def valid_keys(cls, value):
        import base64
        for key, size in (("p256dh", 65), ("auth", 16)):
            try:
                decoded = base64.urlsafe_b64decode(value[key] + "=" * (-len(value[key]) % 4))
                if len(decoded) != size:
                    raise ValueError()
            except Exception:
                raise ValueError("Invalid push subscription keys")
        return value


@router.post("/push-subscription")
def subscribe(payload: PushInput, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if not option("VAPID_PRIVATE_KEY") or not option("VAPID_PUBLIC_KEY"):
        raise HTTPException(503, "Web push requires server VAPID keys")
    if find_spec("pywebpush") is None:
        raise HTTPException(503, "Install updated requirements to enable web push")
    import hashlib
    subject = hashlib.sha256(payload.endpoint.encode()).hexdigest()[:36]
    # A browser subscription can belong to only the most recently signed-in account.
    db.query(AdvancedRecord).filter_by(kind="push", subject_id=subject).delete()
    save_record(db, user.id, "push", payload.model_dump(), subject)
    return {"subscribed": True}


@router.delete("/push-subscription")
def unsubscribe(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    db.query(AdvancedRecord).filter_by(user_id=user.id, kind="push").delete()
    db.commit()
    return {"subscribed": False}


def work_consultation(db, user, consultation_id):
    c = db.query(Consultation).filter_by(id=consultation_id).first()
    if not c:
        raise HTTPException(404, "Consultation not found")
    astro = db.query(Astrologer).filter_by(id=c.astrologer_id).first()
    assignment = record(db, user.id, "astrologer_assignment", c.astrologer_id)
    assigned = user.role == "astrologer" and astro and assignment is not None
    if user.role != "admin" and not assigned:
        raise HTTPException(403, "Only the assigned astrologer or an admin can use this workbench")
    return c


@router.get("/workbench")
def work_list(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if user.role not in ("admin", "astrologer"):
        raise HTTPException(403, "Astrologer access required")
    q = db.query(Consultation)
    if user.role != "admin":
        ids = [r.subject_id for r in db.query(AdvancedRecord).filter_by(user_id=user.id, kind="astrologer_assignment").all()]
        q = q.filter(Consultation.astrologer_id.in_(ids))
    return [dict(id=c.id, title=c.title, status=c.status) for c in q.order_by(Consultation.started_at.desc()).limit(100).all()]


class WorkNotes(BaseModel):
    private_notes: str = Field("", max_length=10000)
    annotations: str = Field("", max_length=10000)
    follow_up: str = Field("", max_length=10000)


@router.put("/staff/{user_id}/{astrologer_id}")
def assign_staff(user_id: str, astrologer_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    staff = db.query(User).filter_by(id=user_id, role="astrologer").first()
    if not staff or not db.query(Astrologer).filter_by(id=astrologer_id).first():
        raise HTTPException(404, "Astrologer account or profile not found")
    return save_record(db, staff.id, "astrologer_assignment", {"assigned": True}, astrologer_id)


@router.delete("/staff/{user_id}/{astrologer_id}")
def revoke_staff(user_id: str, astrologer_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    db.query(AdvancedRecord).filter_by(user_id=user_id, kind="astrologer_assignment", subject_id=astrologer_id).delete()
    db.commit()
    return {"assigned": False}


@router.get("/workbench/{consultation_id}")
def workbench(consultation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    c = work_consultation(db, user, consultation_id)
    chart = db.query(BirthChart).filter_by(id=c.chart_id).first() if c.chart_id else None
    notes = record(db, user.id, "workbench", c.id)
    from packages.astrology.chart_svg import generate_north_indian_kundli_svg
    return dict(id=c.id, title=c.title, chart=chart.chart_data if chart else None,
                chart_svg=generate_north_indian_kundli_svg(chart.chart_data) if chart else "",
                notes=notes.data if notes else WorkNotes().model_dump(),
                messages=[dict(role=m.role, content=m.content, citations=(m.msg_metadata or {}).get("citations", [])) for m in db.query(ChatMessage).filter_by(consultation_id=c.id).order_by(ChatMessage.created_at).limit(200).all()])


@router.put("/workbench/{consultation_id}")
def put_workbench(consultation_id: str, payload: WorkNotes, db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    c = work_consultation(db, user, consultation_id)
    return save_record(db, user.id, "workbench", payload.model_dump(), c.id)


@router.get("/quality")
def quality(db: Session = Depends(get_db), user: User = Depends(get_current_user_required)):
    if user.role != "admin":
        raise HTTPException(403, "Admin access required")
    events = db.query(QualityEvent).order_by(QualityEvent.created_at.desc()).limit(500).all()
    sessions = {}
    for event in events:
        currency = event.data.get("cost_currency", "USD")
        group = sessions.setdefault((event.consultation_id, currency), {"consultation_id": event.consultation_id, "currency": currency, "turns": 0, "reported_cost": 0, "unpriced_turns": 0})
        group["turns"] += 1
        if event.data.get("estimated_cost") is None:
            group["unpriced_turns"] += 1
        else:
            group["reported_cost"] += event.data["estimated_cost"]
    return dict(sample_size=len(events), average_latency_ms=round(sum(e.latency_ms for e in events) / len(events), 1) if events else None,
                sessions=list(sessions.values()),
                events=[dict(id=e.id, consultation_id=e.consultation_id, latency_ms=e.latency_ms, created_at=e.created_at.isoformat(), **e.data) for e in events],
                note="Heuristic review flags, not factual verdicts. Cost is unavailable unless the provider reports token usage and pricing is configured.")
