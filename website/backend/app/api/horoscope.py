"""
Horoscope (Rashifal) API routes for Astro Jyotish.
Supports 12 Rashis, multiple timeframes (daily, tomorrow, weekly, monthly, yearly),
and personalized astrological readings based on birth chart.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from packages.astrology.horoscope import get_horoscope, RASHI_METADATA
from packages.database.session import get_db
from website.backend.app.services.astrology_service import AstrologyService

router = APIRouter(prefix="/horoscope", tags=["Horoscope (Rashifal)"])

@router.get("/{sign}")
def get_rashi_horoscope(
    sign: str,
    timeframe: str = Query("daily", pattern="^(daily|today|tomorrow|weekly|monthly|yearly)$")
):
    """
    Returns authentic Vedic Horoscope for a given Moon/Sun Sign (Aries to Pisces).
    Includes Career, Love, Finance, Health, Lucky Number, Color, and WhatsApp shareable summary.
    """
    try:
        norm_tf = "daily" if timeframe in ["daily", "today"] else timeframe
        return get_horoscope(sign=sign, timeframe=norm_tf)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("")
def list_all_rashis():
    """Returns metadata and symbol directory for all 12 Rashis."""
    return [
        {
            "name": name,
            "sanskrit": info["sanskrit"],
            "lord": info["lord"],
            "element": info["element"],
            "symbol": info["symbol"],
            "lucky_gem": info["lucky_gem"]
        }
        for name, info in RASHI_METADATA.items()
    ]

@router.get("/personalized/{chart_id}")
def get_personalized_horoscope(
    chart_id: str,
    db: Session = Depends(get_db)
):
    """
    Returns personalized horoscope synthesized against user's actual birth chart,
    Lagna (Ascendant), Moon sign, and active Vimshottari Mahadasha.
    """
    chart = AstrologyService.get_chart_by_id(db=db, chart_id=chart_id)
    if not chart:
        raise HTTPException(status_code=404, detail="Birth chart not found")

    moon_sign = chart.chart_data.get("moon_sign", "Aries")
    ascendant = chart.chart_data.get("ascendant", {}).get("sign", "Aries")
    active_dasha = chart.chart_data.get("vimshottari_dasha", {}).get("active_mahadasha", "Jupiter")

    base = get_horoscope(sign=moon_sign, timeframe="daily")
    base["is_personalized"] = True
    base["user_name"] = chart.name
    base["lagna_sign"] = ascendant
    base["active_mahadasha"] = active_dasha
    base["personalized_insight"] = (
        f"For {chart.name}, with {ascendant} Lagna and {moon_sign} Moon sign, your active {active_dasha} Mahadasha "
        f"catalyzes steady expansion. Prioritize strategic decisions during your auspicious morning hours."
    )
    return base
