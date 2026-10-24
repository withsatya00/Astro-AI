"""
Database package providing SQLAlchemy models, Session management, and Astrologer seeder.
"""
from packages.database.session import Base, engine, SessionLocal, get_db, init_db
from packages.database.models import (
    User,
    BirthChart,
    ChatSession,
    ChatMessage,
    Astrologer,
    AstrologerReview,
    Consultation,
    Document,
    DocumentChunk,
    Report,
    generate_uuid,
    utc_now,
)
from packages.database.seed_astrologers import seed_astrologers

__all__ = [
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
    "User",
    "BirthChart",
    "ChatSession",
    "ChatMessage",
    "Astrologer",
    "AstrologerReview",
    "Consultation",
    "Document",
    "DocumentChunk",
    "Report",
    "generate_uuid",
    "utc_now",
    "seed_astrologers",
]
