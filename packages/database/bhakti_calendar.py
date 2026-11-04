"""Bhakti: puja guides, editor-confirmed festival dates, and each person's reminder preferences."""
from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, ForeignKey, Text, UniqueConstraint
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class BhaktiPuja(Base):
    """A step-by-step puja guide. Publishing needs at least one source and a review date."""
    __tablename__ = "bhakti_pujas"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title_en = Column(String(200), nullable=False)
    title_hi = Column(String(200), nullable=False, default="")
    deity = Column(String(60), nullable=False, default="")        # deity slug, or "" for general guides
    summary = Column(String(500), nullable=False, default="")
    samagri = Column(JSON, nullable=False, default=list)          # [{"item": ..., "note": optional}]
    steps = Column(JSON, nullable=False, default=list)            # [{"title": ..., "text": ...}]
    notes = Column(Text, nullable=False, default="")
    sources = Column(JSON, nullable=False, default=list)          # [{"title": ..., "url": optional, "note": optional}]
    reviewed_on = Column(String(10), nullable=False, default="")  # YYYY-MM-DD
    sort_order = Column(Integer, nullable=False, default=0)
    is_verified = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class BhaktiFestivalDate(Base):
    """A festival date an editor has confirmed from a panchang. It takes precedence over the computed date for that year."""
    __tablename__ = "bhakti_festival_dates"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), nullable=False, index=True)       # matches a computed festival's slug, or a new one
    name_en = Column(String(200), nullable=False)
    name_hi = Column(String(200), nullable=False, default="")
    date = Column(String(10), nullable=False, index=True)       # YYYY-MM-DD
    location = Column(String(20), nullable=False, default="")   # a location key, or "" for everywhere
    description = Column(String(500), nullable=False, default="")
    source = Column(String(300), nullable=False, default="")
    is_verified = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False, index=True)
    __table_args__ = (UniqueConstraint("slug", "date", "location", name="uq_festival_date"),)


class BhaktiReminderPref(Base):
    """What a signed-in person wants to be reminded of. Delivery is in-app (the calendar lists what is coming up)."""
    __tablename__ = "bhakti_reminder_prefs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    kind = Column(String(20), nullable=False)                    # ekadashi | purnima | amavasya | pradosh | festival
    enabled = Column(Boolean, nullable=False, default=True)
    lead_days = Column(Integer, nullable=False, default=1)       # 0..3 days before
    location = Column(String(20), nullable=False, default="delhi")
    __table_args__ = (UniqueConstraint("user_id", "kind", name="uq_reminder_pref"),)
