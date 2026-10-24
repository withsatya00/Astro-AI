"""
API routes for all 17 Vedic Astrology and Numerology Calculators.
Provides validated endpoints for frontend tools and interactive widgets.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from packages.astrology.calculators import (
    calculate_numerology, calculate_name_numerology, calculate_sun_sign,
    calculate_moon_sign, calculate_rising_sign, calculate_nakshatra_details,
    calculate_mangal_dosha_full, calculate_jaimini_karakas,
    calculate_kaal_sarp_dosha, calculate_moon_phase_data,
    calculate_friendship_compatibility, calculate_love_compatibility,
    calculate_name_compatibility
)

router = APIRouter(prefix="/calculators", tags=["Astrology Calculators"])

# ----------------- Request Schemas -----------------
class BirthInput(BaseModel):
    date_of_birth: str = Field(..., description="YYYY-MM-DD")
    time_of_birth: Optional[str] = Field("12:00:00", description="HH:MM:SS")
    latitude: Optional[float] = 28.6139
    longitude: Optional[float] = 77.2090
    timezone_offset: Optional[float] = 5.5

class NumerologyRequest(BaseModel):
    date_of_birth: str = Field(..., description="YYYY-MM-DD")
    full_name: Optional[str] = None

class NameNumerologyRequest(BaseModel):
    name: str = Field(..., min_length=1)

class CompatibilityRequest(BaseModel):
    sign_1: str
    sign_2: str
    partner_1_name: Optional[str] = "Partner 1"
    partner_2_name: Optional[str] = "Partner 2"

class NameCompatibilityRequest(BaseModel):
    name_1: str
    name_2: str

# ----------------- Endpoints -----------------

@router.post("/numerology")
def get_numerology(payload: NumerologyRequest):
    """Calculates Mulank and Bhagyank with ruling planet and lucky attributes."""
    try:
        return calculate_numerology(payload.date_of_birth, payload.full_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/name-numerology")
def get_name_numerology(payload: NameNumerologyRequest):
    """Computes Chaldean and Pythagorean numeric vibrations for a name."""
    try:
        return calculate_name_numerology(payload.name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/sun-sign")
def get_sun_sign(payload: BirthInput):
    """Computes Vedic Sidereal Sun sign and Western Tropical sign."""
    try:
        return calculate_sun_sign(
            date_of_birth=payload.date_of_birth,
            time_of_birth=payload.time_of_birth or "12:00:00",
            lat=payload.latitude or 28.6139,
            lon=payload.longitude or 77.2090,
            tz=payload.timezone_offset or 5.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/moon-sign")
def get_moon_sign(payload: BirthInput):
    """Computes Swiss Ephemeris exact Moon sign and Nakshatra."""
    try:
        return calculate_moon_sign(
            date_of_birth=payload.date_of_birth,
            time_of_birth=payload.time_of_birth or "12:00:00",
            lat=payload.latitude or 28.6139,
            lon=payload.longitude or 77.2090,
            tz=payload.timezone_offset or 5.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/rising-sign")
def get_rising_sign(payload: BirthInput):
    """Computes Ascendant (Lagna) sign and exact degree."""
    try:
        return calculate_rising_sign(
            date_of_birth=payload.date_of_birth,
            time_of_birth=payload.time_of_birth or "12:00:00",
            lat=payload.latitude or 28.6139,
            lon=payload.longitude or 77.2090,
            tz=payload.timezone_offset or 5.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/nakshatra")
def get_nakshatra(payload: BirthInput):
    """Calculates 27 Nakshatras, Pada, Lord, Deity, Gana, Nadi, and baby naming syllable."""
    try:
        return calculate_nakshatra_details(
            date_of_birth=payload.date_of_birth,
            time_of_birth=payload.time_of_birth or "12:00:00",
            lat=payload.latitude or 28.6139,
            lon=payload.longitude or 77.2090,
            tz=payload.timezone_offset or 5.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/mangal-dosha")
def get_mangal_dosha(payload: BirthInput):
    """Calculates Kuja Dosha with 6 classical Parihar cancellation rules."""
    try:
        return calculate_mangal_dosha_full(
            date_of_birth=payload.date_of_birth,
            time_of_birth=payload.time_of_birth or "12:00:00",
            lat=payload.latitude or 28.6139,
            lon=payload.longitude or 77.2090,
            tz=payload.timezone_offset or 5.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/jaimini-karakas")
def get_jaimini_karakas(payload: BirthInput):
    """Computes Jaimini 7 Chara Karakas including Atmakaraka and Darakaraka."""
    try:
        return calculate_jaimini_karakas(
            date_of_birth=payload.date_of_birth,
            time_of_birth=payload.time_of_birth or "12:00:00",
            lat=payload.latitude or 28.6139,
            lon=payload.longitude or 77.2090,
            tz=payload.timezone_offset or 5.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/kaal-sarp")
def get_kaal_sarp(payload: BirthInput):
    """Identifies Kaal Sarp Dosha types (1-12) and cancellation conditions."""
    try:
        return calculate_kaal_sarp_dosha(
            date_of_birth=payload.date_of_birth,
            time_of_birth=payload.time_of_birth or "12:00:00",
            lat=payload.latitude or 28.6139,
            lon=payload.longitude or 77.2090,
            tz=payload.timezone_offset or 5.5
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/moon-phase")
def get_moon_phase(date: Optional[str] = None):
    """Calculates Tithi, lunar illumination, and days to next Purnima/Amavasya."""
    try:
        return calculate_moon_phase_data(date)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/friendship-compatibility")
def get_friendship_compatibility(payload: CompatibilityRequest):
    """Calculates elemental compatibility between two zodiac signs."""
    try:
        return calculate_friendship_compatibility(payload.sign_1, payload.sign_2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/love-compatibility")
def get_love_compatibility(payload: CompatibilityRequest):
    """Calculates romance and communication harmony between two zodiac signs."""
    try:
        return calculate_love_compatibility(
            payload.sign_1, payload.sign_2,
            payload.partner_1_name or "Partner 1",
            payload.partner_2_name or "Partner 2"
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/name-compatibility")
def get_name_compatibility(payload: NameCompatibilityRequest):
    """Calculates Chaldean vibrational score between two personal names."""
    try:
        return calculate_name_compatibility(payload.name_1, payload.name_2)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
