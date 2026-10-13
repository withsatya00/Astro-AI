"""
SQLAlchemy ORM models for AstroAI Agent.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

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
    role = Column(String(50), default="client")  # client, astrologer, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    charts = relationship("BirthChart", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")

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
    created_at = Column(DateTime(timezone=True), default=utc_now)

    user = relationship("User", back_populates="charts")
    sessions = relationship("ChatSession", back_populates="chart")
    reports = relationship("Report", back_populates="chart")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    chart_id = Column(String(36), ForeignKey("birth_charts.id"), nullable=True, index=True)
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
    session_id = Column(String(36), ForeignKey("chat_sessions.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)          # user, assistant, system, tool
    content = Column(Text, nullable=False)
    msg_metadata = Column(JSON, nullable=True)         # citations, tool execution traces, calculation references
    created_at = Column(DateTime(timezone=True), default=utc_now)

    session = relationship("ChatSession", back_populates="messages")

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
