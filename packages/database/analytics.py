"""First-party, cookie-free product analytics: one row per event, no IP address, no name or contact details."""
from typing import Any, Dict, Optional

from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.orm import Session
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class SiteEvent(Base):
    __tablename__ = "site_events"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(40), nullable=False, index=True)
    path = Column(String(200), nullable=False, default="")
    session_id = Column(String(40), nullable=False, default="", index=True)  # random per browser tab session; not linked to an account
    props = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)


def record_event(db: Session, name: str, props: Optional[Dict[str, Any]] = None, path: str = "", session_id: str = "") -> None:
    """Adds an event to the caller's transaction (the caller commits). Never raises into a payment or sign-up flow."""
    try:
        db.add(SiteEvent(name=name, path=path[:200], session_id=session_id[:40], props=props or {}))
    except Exception:  # analytics must never break a payment or booking
        pass
