"""
Astrology calculations and Vedic engines.
Powered by Swiss Ephemeris (PySwissEph) with high-precision sidereal calculations.
"""
from packages.astrology.calculations import (
    calculate_chart,
    calculate_julian_day,
    ZODIAC_SIGNS,
    NAKSHATRAS,
    VIMSHOTTARI_LORDS,
)
from packages.astrology.aspects import calculate_planetary_aspects
from packages.astrology.chart_svg import generate_north_indian_kundli_svg
from packages.astrology.chart_context import ChartContext, validate_and_build_chart_context
from packages.astrology.chart_validation import validate_birth_coordinates, validate_birth_datetime
from packages.astrology.grounding_critic import GroundingCritic
from packages.astrology.horoscope import get_horoscope, RASHI_METADATA
from packages.astrology.kundali_milan import perform_kundali_milan
calculate_ashtakoota_milan = perform_kundali_milan
from packages.astrology.panchang import calculate_panchang
from packages.astrology.yoga_detection import analyze_all_chart_yogas
from packages.astrology.calculators import (
    calculate_numerology,
    calculate_name_numerology,
    calculate_sun_sign,
    calculate_moon_sign,
    calculate_rising_sign,
    calculate_nakshatra_details,
    calculate_mangal_dosha_full,
    calculate_jaimini_karakas,
    calculate_kaal_sarp_dosha,
    calculate_moon_phase_data,
    calculate_friendship_compatibility,
    calculate_love_compatibility,
    calculate_name_compatibility,
)

__all__ = [
    "calculate_chart",
    "calculate_julian_day",
    "ZODIAC_SIGNS",
    "NAKSHATRAS",
    "VIMSHOTTARI_LORDS",
    "calculate_planetary_aspects",
    "generate_north_indian_kundli_svg",
    "ChartContext",
    "validate_and_build_chart_context",
    "validate_birth_coordinates",
    "validate_birth_datetime",
    "GroundingCritic",
    "get_horoscope",
    "RASHI_METADATA",
    "calculate_ashtakoota_milan",
    "calculate_panchang",
    "analyze_all_chart_yogas",
    "calculate_numerology",
    "calculate_sade_sati",
    "calculate_kaal_sarp",
    "calculate_pitra_dosha",
    "calculate_mangal_dosha",
    "calculate_gemstone_recommendation",
]
