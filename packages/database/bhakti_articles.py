"""Bhakti: Shankaracharya / Vedanta articles and short question-and-answers."""
from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, Text
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class BhaktiArticle(Base):
    """An article or a short question-and-answer. Sources are mandatory before anything is published."""
    __tablename__ = "bhakti_articles"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    section = Column(String(20), nullable=False, index=True)      # shankaracharya | vedanta
    kind = Column(String(10), nullable=False, default="article")  # article | qa
    title_en = Column(String(200), nullable=False)
    title_hi = Column(String(200), nullable=False, default="")
    summary = Column(String(500), nullable=False, default="")
    body = Column(Text, nullable=False, default="")
    sources = Column(JSON, nullable=False, default=list)          # [{"title": ..., "url": optional, "note": optional}]
    reviewed_on = Column(String(10), nullable=False, default="")  # YYYY-MM-DD: when an editor last checked it
    sort_order = Column(Integer, nullable=False, default=0)
    is_verified = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
