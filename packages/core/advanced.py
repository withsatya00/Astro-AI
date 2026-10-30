"""Consent-aware context, response diagnostics, and scheduled notification delivery."""
import json
import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from packages.database.advanced import AdvancedRecord, ScheduledReminder, QualityEvent
from packages.database.models import Notification, BirthChart
from packages.core.config import settings


def option(name, default=""):
    return os.getenv(name, getattr(settings, name, default))


def memory_context(db, user_id, chart_id):
    if not user_id or not chart_id:
        return ""
    if not db.query(BirthChart).filter_by(id=chart_id, user_id=user_id).first():
        return ""
    row = db.query(AdvancedRecord).filter_by(user_id=user_id, kind="memory", subject_id=chart_id).first()
    return str(row.data.get("content", ""))[:2000] if row and row.data.get("enabled") else ""


def quality_data(content, citations, grounded, demo, usage=None, chart=None):
    """Observable diagnostics only; do not claim to detect factual correctness."""
    flags = []
    if chart:
        import re
        for p in chart.get("planets", []):
            claimed = re.findall(r"\b" + re.escape(p["name"]) + r"\s+is\s+in\s+(Aries|Taurus|Gemini|Cancer|Leo|Virgo|Libra|Scorpio|Sagittarius|Capricorn|Aquarius|Pisces)\b", content, re.I)
            if any(sign.lower() != p["sign"].lower() for sign in claimed):
                flags.append(f"Review possible placement mismatch: {p['name']} (may describe a transit)")
    cost = 0.0 if demo else None
    if usage and not demo:
        try:
            rates = json.loads(option("AI_MODEL_PRICING_JSON", "{}"))[usage["model"]]
            cost = (usage["input_tokens"] * float(rates["input_per_million"]) + usage["output_tokens"] * float(rates["output_per_million"])) / 1_000_000
        except (KeyError, TypeError, ValueError):
            pass
    return dict(character_count=len(content), citation_count=len(citations or []), chart_grounded=bool(grounded),
                demo=bool(demo), missing_citations=not bool(citations),
                review_flags=(["No retrieved sources"] if not citations else []) +
                (["Chart grounding absent"] if not grounded else []) +
                (["Absolute prediction language"] if any(w in content.lower() for w in ("guaranteed", "100% certain", "definitely will")) else []) + flags,
                estimated_cost=cost, cost_currency=option("AI_PRICING_CURRENCY", "USD"), token_usage=usage,
                cost_scope="Reported successful request only; discarded hedges, failed attempts, and unreported provider charges excluded")


def quiet_now(now, prefs):
    local = now.astimezone(ZoneInfo(prefs.get("timezone", "Asia/Kolkata")))
    start, end = prefs.get("quiet_start", 22), prefs.get("quiet_end", 7)
    return (start <= local.hour < end if start < end else local.hour >= start or local.hour < end) if start != end else False


def send_due(db, now=None):
    """Claim reminders atomically before delivery so multiple workers do not duplicate them.

    The in-app notification is durable; optional push is best effort and contains no private title.
    """
    now = now or datetime.now(timezone.utc)
    due = db.query(ScheduledReminder).filter(ScheduledReminder.active == True, ScheduledReminder.due_at <= now).limit(100).all()  # noqa
    for reminder in due:
        pref_row = db.query(AdvancedRecord).filter_by(user_id=reminder.user_id, kind="reminder_preferences").first()
        prefs = pref_row.data if pref_row else {}
        if not prefs.get("enabled", True) or quiet_now(now, prefs):
            continue
        local = now.astimezone(ZoneInfo(prefs.get("timezone", "Asia/Kolkata")))
        day_start = local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(timezone.utc)
        count = db.query(Notification).filter(Notification.owner_key == "u:" + reminder.user_id,
            Notification.kind == "advanced_reminder", Notification.created_at >= day_start).count()
        if count >= prefs.get("max_per_day", 3):
            continue
        old_due = reminder.due_at
        next_due = old_due
        if reminder.repeat_days:
            while next_due.replace(tzinfo=timezone.utc) <= now:
                next_due += timedelta(days=reminder.repeat_days)
        claimed = db.query(ScheduledReminder).filter_by(id=reminder.id, active=True, due_at=old_due).update(
            {"delivered_at": now, "active": bool(reminder.repeat_days), "due_at": next_due}, synchronize_session=False)
        if not claimed:
            db.rollback()
            continue
        db.add(Notification(owner_key="u:" + reminder.user_id, title="Astro reminder", body=reminder.title,
                            kind="advanced_reminder", link="/dashboard", created_at=now))
        db.commit()
        if not option("VAPID_PRIVATE_KEY"):
            continue
        for sub in db.query(AdvancedRecord).filter_by(user_id=reminder.user_id, kind="push").all():
            try:
                from pywebpush import webpush
                webpush(subscription_info=sub.data, data=json.dumps({"title": "Astro Jyotish", "body": "You have a scheduled reminder", "url": "/dashboard"}),
                        vapid_private_key=option("VAPID_PRIVATE_KEY"),
                        vapid_claims={"sub": option("VAPID_SUBJECT", "mailto:admin@example.com")}, timeout=5)
            except Exception as exc:
                response = getattr(exc, "response", None)
                if response is not None and response.status_code in (404, 410):
                    db.delete(sub)
                    db.commit()
