"""Dated chadhava events and immutable checkout snapshots; legacy bookings remain intact."""
from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, ForeignKey, UniqueConstraint
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class ChadhavaEvent(Base):
    __tablename__ = "chadhava_events"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    temple_id = Column(String(36), ForeignKey("temples.id"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    title_hi = Column(String(180), nullable=False, default="")
    description = Column(String(2000), nullable=False, default="")
    description_hi = Column(String(2000), nullable=False, default="")
    starts_at = Column(DateTime(timezone=True), nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False, index=True)
    cancellation_deadline = Column(DateTime(timezone=True), nullable=False)
    capacity = Column(Integer, nullable=False)
    reserved = Column(Integer, nullable=False, default=0)
    mode = Column(String(20), nullable=False, default="collective")
    kind = Column(String(12), nullable=False, default="chadhava", server_default="chadhava")  # chadhava | puja
    benefits = Column(JSON, nullable=True)  # puja page bullets: {"en": [...], "hi": [...]}
    offering_ids = Column(JSON, nullable=False)
    video_hours = Column(Integer, nullable=False, default=72)
    unknown_gotra_allowed = Column(Boolean, nullable=False, default=False)
    partner_confirmed = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ChadhavaOrder(Base):
    __tablename__ = "chadhava_orders"
    __table_args__ = (UniqueConstraint("user_id", "idempotency_key", name="uq_chadhava_checkout"),)
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(String(36), ForeignKey("chadhava_events.id"), nullable=False, index=True)
    idempotency_key = Column(String(100), nullable=False)
    request_hash = Column(String(64), nullable=False)
    snapshot = Column(JSON, nullable=False)
    amount_paise = Column(Integer, nullable=False)
    payment_status = Column(String(30), nullable=False, default="PENDING")
    service_status = Column(String(30), nullable=False, default="AWAITING_PAYMENT")
    payment_method = Column(String(20), nullable=False)
    provider_order_id = Column(String(100), unique=True, nullable=True, index=True)
    provider_payment_id = Column(String(100), unique=True, nullable=True)
    booking_id = Column(String(36), ForeignKey("chadawa_bookings.id"), unique=True, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    capacity_held = Column(Boolean, nullable=False, default=True)
    video_url = Column(String(1024), nullable=True)
    performed_at = Column(DateTime(timezone=True), nullable=True)
    video_uploaded_at = Column(DateTime(timezone=True), nullable=True)
    refund_reference = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class TempleStaff(Base):
    __tablename__ = "temple_staff_assignments"
    __table_args__ = (UniqueConstraint("user_id", "temple_id", name="uq_temple_staff"),)
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    temple_id = Column(String(36), ForeignKey("temples.id"), nullable=False, index=True)


class PujaInterest(Base):
    """A devotee asking to be told when booking opens for a calendar puja (a date listed before the temple confirms it)."""
    __tablename__ = "puja_interests"
    __table_args__ = (UniqueConstraint("user_id", "calendar_id", name="uq_puja_interest"),)
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    calendar_id = Column(String(60), nullable=False)
    calendar_date = Column(String(10), nullable=False, index=True)  # IST date, YYYY-MM-DD
    title = Column(String(180), nullable=False)
    notified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
