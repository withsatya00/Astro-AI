"""Bhakti AI Guide: extra reference passages an admin can add for the Guide to draw on, with their own attribution."""
from sqlalchemy import Column, String, Boolean, DateTime, Text
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class BhaktiKnowledge(Base):
    """A curated passage for the AI Guide. `kind` says what it is, so answers never blur scripture, translation and interpretation."""
    __tablename__ = "bhakti_knowledge"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    kind = Column(String(14), nullable=False, default="interpretation")  # scripture | translation | interpretation
    school = Column(String(60), nullable=False, default="")             # e.g. "Advaita Vedanta" for interpretations
    text = Column(Text, nullable=False, default="")
    source = Column(String(300), nullable=False, default="")
    license = Column(String(160), nullable=False, default="")
    is_verified = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
