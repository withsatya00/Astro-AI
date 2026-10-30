"""Additive tables for the advanced workspace; no destructive schema migration."""
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, Boolean, Float, UniqueConstraint
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class AdvancedRecord(Base):
    __tablename__ = "advanced_records"
    __table_args__ = (UniqueConstraint("user_id", "kind", "subject_id", name="uq_advanced_subject"),)
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    kind = Column(String(32), nullable=False, index=True)
    subject_id = Column(String(36), nullable=False, default="", index=True)
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ScheduledReminder(Base):
    __tablename__ = "advanced_reminders"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(160), nullable=False)
    due_at = Column(DateTime(timezone=True), nullable=False, index=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    repeat_days = Column(Float, nullable=False, default=0)
    active = Column(Boolean, default=True)


class QualityEvent(Base):
    __tablename__ = "ai_quality_events"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), index=True)
    user_id = Column(String(36), ForeignKey("users.id"), index=True, nullable=True)
    latency_ms = Column(Float, nullable=False)
    data = Column(JSON, nullable=False, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)
