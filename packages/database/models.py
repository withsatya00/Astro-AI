"""
SQLAlchemy ORM models for AstroAI Consultation Platform.
Supports Astrologer Profiles, Consultations, Personas, Users,
Birth Charts, Sessions, Knowledge Base Documents, and Reports.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from packages.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), default="client")  # client, astrologer, admin
    wallet_balance = Column(Float, default=250.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    charts = relationship("BirthChart", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    consultations = relationship("Consultation", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("AstrologerReview", back_populates="user")

class BirthChart(Base):
    __tablename__ = "birth_charts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    date_of_birth = Column(String(10), nullable=False)  # YYYY-MM-DD
    time_of_birth = Column(String(8), nullable=True)   # HH:MM:SS or HH:MM
    is_time_approximate = Column(Boolean, default=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timezone_offset = Column(Float, nullable=False)    # e.g., 5.5 for IST
    city = Column(String(255), nullable=True)
    country = Column(String(255), nullable=True)
    system = Column(String(50), default="Vedic")       # Vedic, Western
    ayanamsa = Column(String(50), default="Lahiri")
    chart_data = Column(JSON, nullable=False)          # Full structured planetary & house calculations
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="charts")
    sessions = relationship("ChatSession", back_populates="chart")
    reports = relationship("Report", back_populates="chart")
    consultations = relationship("Consultation", back_populates="chart")

class Astrologer(Base):
    __tablename__ = "astrologers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    name_hi = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    title_hi = Column(String(255), nullable=True)
    avatar = Column(String(500), nullable=False, default="🕉️")
    bio = Column(Text, nullable=True)
    bio_hi = Column(Text, nullable=True)
    experience_years = Column(Integer, default=10)
    rating = Column(Float, default=4.95)
    review_count = Column(Integer, default=0)
    consultations_count = Column(Integer, default=0)
    price_per_minute = Column(Float, default=25.0)
    currency = Column(String(10), default="INR")
    is_ai = Column(Boolean, default=False)             # True = AI Persona, False = Human Astrologer
    ai_persona_id = Column(String(100), nullable=True) # e.g., acharya_shastri, dr_sunita, pandit_maharaj
    availability = Column(String(50), default="online")# online, busy, offline
    languages = Column(JSON, default=list)             # ["Hindi", "English", "Sanskrit", ...]
    specialties = Column(JSON, default=list)           # ["Vedic Kundli", "Love & Marriage", ...]
    is_featured = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    reviews = relationship("AstrologerReview", back_populates="astrologer", cascade="all, delete-orphan", order_by="desc(AstrologerReview.created_at)")
    consultations = relationship("Consultation", back_populates="astrologer")

class AstrologerReview(Base):
    __tablename__ = "astrologer_reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    user_name = Column(String(255), default="Seeker")
    rating = Column(Float, default=5.0)
    comment = Column(Text, nullable=False)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    astrologer = relationship("Astrologer", back_populates="reviews")
    user = relationship("User", back_populates="reviews")

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=False, index=True)
    astrologer_type = Column(String(20), default="ai")  # "ai" or "human"
    status = Column(String(50), default="active")       # active, completed, cancelled
    mode = Column(String(50), default="chat")           # chat, call
    title = Column(String(255), default="Astrology Consultation")
    language = Column(String(20), default="en")         # en, hi, sa, mr, gu, bn, ta, te
    chart_id = Column(String(36), ForeignKey("birth_charts.id"), nullable=True, index=True)
    price_per_minute = Column(Float, default=0.0)
    duration_seconds = Column(Integer, default=0)
    total_amount = Column(Float, default=0.0)
    consultation_metadata = Column(JSON, nullable=True) # concern, notes, custom tags
    started_at = Column(DateTime(timezone=True), default=utc_now)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="consultations")
    astrologer = relationship("Astrologer", back_populates="consultations")
    chart = relationship("BirthChart", back_populates="consultations")
    messages = relationship("ChatMessage", back_populates="consultation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")
    feedback = relationship("ConsultationFeedback", back_populates="consultation", uselist=False, cascade="all, delete-orphan")
    summary = relationship("ConsultationSummary", back_populates="consultation", uselist=False, cascade="all, delete-orphan")

class ConsultationFeedback(Base):
    __tablename__ = "consultation_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=False, unique=True, index=True)
    rating = Column(Integer, default=5)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    consultation = relationship("Consultation", back_populates="feedback")

class ConsultationSummary(Base):
    __tablename__ = "consultation_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=False, unique=True, index=True)
    concern = Column(String(255), nullable=True)
    key_insights = Column(JSON, nullable=True)          # ["Dasha is favorable for career", ...]
    chart_summary = Column(JSON, nullable=True)         # Placements discussed
    remedies = Column(JSON, nullable=True)              # Suggested Vedic remedies
    follow_ups = Column(JSON, nullable=True)            # Recommended next actions
    created_at = Column(DateTime(timezone=True), default=utc_now)

    consultation = relationship("Consultation", back_populates="summary")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    chart_id = Column(String(36), ForeignKey("birth_charts.id"), nullable=True, index=True)
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=True, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=True, index=True)
    status = Column(String(50), default="active")
    title = Column(String(255), default="Astrology Consultation")
    language = Column(String(20), default="en")        # en, hi, hinglish
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    user = relationship("User", back_populates="sessions")
    chart = relationship("BirthChart", back_populates="sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=True, index=True)
    consultation_id = Column(String(36), ForeignKey("consultations.id"), nullable=True, index=True)
    role = Column(String(20), nullable=False)          # user, assistant, system, tool
    content = Column(Text, nullable=False)
    msg_metadata = Column(JSON, nullable=True)         # citations, tool execution traces, calculation references
    created_at = Column(DateTime(timezone=True), default=utc_now)

    session = relationship("ChatSession", back_populates="messages")
    consultation = relationship("Consultation", back_populates="messages")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=True)
    publisher = Column(String(255), nullable=True)
    source_url = Column(String(1024), nullable=True)
    license = Column(String(255), default="Public Domain / CC")
    permission_status = Column(String(50), default="PERMITTED")  # PERMITTED, RESTRICTED, REVIEW_REQUIRED
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(50), nullable=False)     # pdf, txt, md, docx
    file_size_bytes = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=False, index=True) # SHA256
    status = Column(String(50), default="PENDING")     # PENDING, PROCESSING, INDEXED, FAILED
    error_details = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    doc_metadata = Column(JSON, nullable=True)         # Structured provenance, chapter, topic, language
    created_at = Column(DateTime(timezone=True), default=utc_now)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    section_title = Column(String(255), nullable=True)
    embedding = Column(JSON, nullable=True)            # List of floats (embedding vector)
    chunk_metadata = Column(JSON, nullable=True)       # Topic, language, verse_id, shloka, hierarchy
    created_at = Column(DateTime(timezone=True), default=utc_now)

    document = relationship("Document", back_populates="chunks")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    chart_id = Column(String(36), ForeignKey("birth_charts.id"), nullable=False, index=True)
    report_type = Column(String(50), default="comprehensive_kundali") # comprehensive_kundali, career, relationship
    title = Column(String(255), nullable=False)
    pdf_path = Column(String(1024), nullable=False)
    status = Column(String(50), default="COMPLETED")   # GENERATING, COMPLETED, FAILED
    report_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="reports")
    chart = relationship("BirthChart", back_populates="reports")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(50), default="credit")  # credit, debit, refund
    description = Column(String(255), nullable=False)
    reference_id = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    astrologer_id = Column(String(36), ForeignKey("astrologers.id"), nullable=False, index=True)
    user_name = Column(String(255), nullable=False)
    user_phone = Column(String(50), nullable=True)
    scheduled_at = Column(String(50), nullable=False)
    duration_minutes = Column(Integer, default=15)
    mode = Column(String(50), default="chat")  # chat, call, video
    status = Column(String(50), default="confirmed")  # confirmed, completed, cancelled
    total_amount = Column(Float, default=0.0)
    concern = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)
