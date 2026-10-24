"""
Shared type definitions for Consultations and Chat Messages.
"""
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class ConsultationSession(BaseModel):
    id: str
    user_id: Optional[str] = None
    astrologer_id: str
    chart_id: Optional[str] = None
    language: str = "en"
    title: str = "Astrology Consultation"
    status: str = "active"
    created_at: str
    updated_at: str

class ConsultationMessage(BaseModel):
    id: str
    consultation_id: str
    sender: str  # "user" | "assistant" | "system"
    content: str
    chart_svg: Optional[str] = None
    is_demo_mode: bool = False
    tokens_used: int = 0
    created_at: str
