"""Bhakti library: official videos shown through YouTube's own embedded player on a text's page (nothing is downloaded or stored)."""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class BhaktiContentEmbed(Base):
    __tablename__ = "bhakti_content_embeds"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    content_id = Column(String(36), ForeignKey("bhakti_content.id"), nullable=False, index=True)
    youtube_id = Column(String(11), nullable=False)
    title = Column(String(200), nullable=False)
    channel = Column(String(200), nullable=False)       # who published it on YouTube
    rights_note = Column(String(300), nullable=False)   # why it may be shown here
    published = Column(Boolean, nullable=False, default=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
