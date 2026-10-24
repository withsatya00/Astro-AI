"""
Shared type definitions for Astrologer Personas.
Used across ai-backend and website-backend.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

class AstrologerPersonaBase(BaseModel):
    id: str
    slug: str
    name: str
    name_hi: Optional[str] = None
    title: str
    title_hi: Optional[str] = None
    avatar: str = "🕉️"
    bio: str
    bio_hi: Optional[str] = None
    experience_years: int = 15
    rating: float = 4.9
    review_count: int = 250
    consultations_count: int = 1200
    price_per_minute: int = 0
    currency: str = "INR"
    is_ai: bool = True
    ai_persona_id: Optional[str] = None
    availability: str = "online"
    languages: List[str] = Field(default_factory=lambda: ["Hindi", "English"])
    specialties: List[str] = Field(default_factory=lambda: ["Vedic Kundli"])
    is_featured: bool = False
    is_verified: bool = True
