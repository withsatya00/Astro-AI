"""Bhakti module: deities, mantras and the user's naam-jaap sessions, idempotent events and daily records."""
from sqlalchemy import Column, String, Integer, Boolean, JSON, DateTime, ForeignKey, UniqueConstraint, Index, Text
from packages.database.session import Base
from packages.database.models import generate_uuid, utc_now


class BhaktiDeity(Base):
    __tablename__ = "bhakti_deities"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(60), unique=True, nullable=False, index=True)
    name_en = Column(String(120), nullable=False)
    name_hi = Column(String(120), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True)


class BhaktiMantra(Base):
    __tablename__ = "bhakti_mantras"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    deity_id = Column(String(36), ForeignKey("bhakti_deities.id"), nullable=True, index=True)
    text_hi = Column(String(300), nullable=False)
    text_roman = Column(String(300), nullable=False)
    # Normalised phrases the voice counter accepts as one repetition (Devanagari and Roman spellings).
    match_phrases = Column(JSON, nullable=False, default=list)
    is_custom = Column(Boolean, nullable=False, default=False)
    owner_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)  # set for a user's own mantra
    is_active = Column(Boolean, nullable=False, default=True)


class JaapSession(Base):
    __tablename__ = "bhakti_jaap_sessions"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    mantra_id = Column(String(36), ForeignKey("bhakti_mantras.id"), nullable=False, index=True)
    mode = Column(String(10), nullable=False, default="manual")  # manual | voice | mala
    target = Column(Integer, nullable=False, default=108)
    count = Column(Integer, nullable=False, default=0)
    status = Column(String(12), nullable=False, default="active")  # active | paused | completed
    started_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    __table_args__ = (Index("ix_jaap_sessions_user_status", "user_id", "status"),)


class JaapEvent(Base):
    """One client-generated increment. (user_id, event_id) is unique, so a retried request can never count twice."""
    __tablename__ = "bhakti_jaap_events"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_id = Column(String(64), nullable=False)
    session_id = Column(String(36), ForeignKey("bhakti_jaap_sessions.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    delta = Column(Integer, nullable=False)
    applied = Column(Integer, nullable=False)  # what actually changed the count after clamping at zero
    source = Column(String(10), nullable=False, default="manual")
    created_at = Column(DateTime(timezone=True), default=utc_now)
    __table_args__ = (UniqueConstraint("user_id", "event_id", name="uq_jaap_event_user_event"),)


class JaapRecord(Base):
    """Per-user, per-mantra, per-day total (day in IST) so analytics never scans raw events."""
    __tablename__ = "bhakti_jaap_records"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    mantra_id = Column(String(36), ForeignKey("bhakti_mantras.id"), nullable=False)
    day = Column(String(10), nullable=False)  # YYYY-MM-DD
    count = Column(Integer, nullable=False, default=0)
    __table_args__ = (UniqueConstraint("user_id", "mantra_id", "day", name="uq_jaap_record_day"),
                      Index("ix_jaap_records_user_day", "user_id", "day"))


class BhaktiContent(Base):
    """An aarti, chalisa or stotra. Text and attribution are managed by admins; nothing is shown until published."""
    __tablename__ = "bhakti_content"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    kind = Column(String(12), nullable=False, index=True)  # aarti | chalisa | stotra
    deity_id = Column(String(36), ForeignKey("bhakti_deities.id"), nullable=True, index=True)
    title_hi = Column(String(200), nullable=False)
    title_en = Column(String(200), nullable=False)
    body_hi = Column(Text, nullable=False, default="")
    body_roman = Column(Text, nullable=False, default="")
    meaning_hi = Column(Text, nullable=False, default="")
    meaning_en = Column(Text, nullable=False, default="")
    source = Column(String(300), nullable=False, default="")   # where the text was taken from
    license = Column(String(120), nullable=False, default="")  # e.g. "Public domain"
    is_verified = Column(Boolean, nullable=False, default=False)  # reviewed against the cited source by an admin
    published = Column(Boolean, nullable=False, default=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class BhaktiAudio(Base):
    __tablename__ = "bhakti_audio"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    content_id = Column(String(36), ForeignKey("bhakti_content.id"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    url = Column(String(300), nullable=False)
    source = Column(String(300), nullable=False)   # who recorded / published it
    license = Column(String(120), nullable=False)  # the right to stream it, e.g. "Own recording", "CC0"
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    published = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class BhaktiFavourite(Base):
    __tablename__ = "bhakti_favourites"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    content_id = Column(String(36), ForeignKey("bhakti_content.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    __table_args__ = (UniqueConstraint("user_id", "content_id", name="uq_bhakti_fav"),)


class BhaktiAuditLog(Base):
    __tablename__ = "bhakti_audit_logs"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(40), nullable=False)
    entity = Column(String(40), nullable=False)
    entity_id = Column(String(100), nullable=False)
    detail = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)


class GitaChapter(Base):
    __tablename__ = "bhakti_gita_chapters"
    number = Column(Integer, primary_key=True)
    name_sa = Column(String(120), nullable=False)
    name_hi = Column(String(120), nullable=False)
    name_en = Column(String(120), nullable=False)
    verse_count = Column(Integer, nullable=False)
    summary_en = Column(String(400), nullable=False, default="")


class GitaVerse(Base):
    """One shloka. Only published rows are public; publishing needs a source and licence, like the library."""
    __tablename__ = "bhakti_gita_verses"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    chapter = Column(Integer, ForeignKey("bhakti_gita_chapters.number"), nullable=False)
    verse = Column(Integer, nullable=False)
    text_sa = Column(Text, nullable=False)
    transliteration = Column(Text, nullable=False, default="")
    meaning_hi = Column(Text, nullable=False, default="")
    meaning_en = Column(Text, nullable=False, default="")
    source = Column(String(300), nullable=False, default="")
    license = Column(String(160), nullable=False, default="")
    is_verified = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
    __table_args__ = (UniqueConstraint("chapter", "verse", name="uq_gita_verse"), Index("ix_gita_verses_pub", "published", "chapter"))


class GitaBookmark(Base):
    __tablename__ = "bhakti_gita_bookmarks"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    verse_id = Column(String(36), ForeignKey("bhakti_gita_verses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    __table_args__ = (UniqueConstraint("user_id", "verse_id", name="uq_gita_bookmark"),)


class GitaRead(Base):
    """Verses a user has marked as read; chapter progress is read-count over the verses that exist."""
    __tablename__ = "bhakti_gita_reads"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    verse_id = Column(String(36), ForeignKey("bhakti_gita_verses.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    __table_args__ = (UniqueConstraint("user_id", "verse_id", name="uq_gita_read"),)


class BhajanTrack(Base):
    """A bhajan played through YouTube's own embedded player. No media is stored or downloaded; only the video id."""
    __tablename__ = "bhakti_bhajan_tracks"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    youtube_id = Column(String(11), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(30), nullable=False, index=True)
    channel = Column(String(200), nullable=False)  # who published it on YouTube
    rights_note = Column(String(300), nullable=False)  # why it may be shown here, e.g. "Official channel; embedding enabled"
    published = Column(Boolean, nullable=False, default=True, index=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class BhajanFavourite(Base):
    __tablename__ = "bhakti_bhajan_favourites"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    track_id = Column(String(36), ForeignKey("bhakti_bhajan_tracks.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    __table_args__ = (UniqueConstraint("user_id", "track_id", name="uq_bhajan_fav"),)


class BhaktiTemple(Base):
    """A temple page. Timings are never invented: only an admin-entered note with a source link is shown."""
    __tablename__ = "bhakti_temples"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name_en = Column(String(200), nullable=False)
    name_hi = Column(String(200), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    deity = Column(String(200), nullable=False, default="")
    summary = Column(Text, nullable=False, default="")        # history, in our own words
    significance = Column(Text, nullable=False, default="")
    festivals = Column(JSON, nullable=False, default=list)    # list of festival names
    official_url = Column(String(300), nullable=True)
    virtual_darshan_url = Column(String(300), nullable=True)
    image_url = Column(String(300), nullable=True)
    image_credit = Column(String(300), nullable=True)
    timings_note = Column(String(500), nullable=True)
    timings_source_url = Column(String(300), nullable=True)
    source = Column(String(300), nullable=False, default="")
    is_verified = Column(Boolean, nullable=False, default=False)
    published = Column(Boolean, nullable=False, default=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
