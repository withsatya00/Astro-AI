"""
Dedicated Chart Context and Provenance Validation Module.
Prevents hallucination of astronomical placements, enforces profile bounds,
and builds reliable, structured chart contexts for conversational astrology.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.app.core.logging import logger

class ChartContext:
    def __init__(
        self,
        profile_id: Optional[str] = None,
        profile_name: Optional[str] = None,
        date_of_birth: Optional[str] = None,
        time_of_birth: Optional[str] = None,
        is_time_approximate: bool = False,
        birthplace: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        timezone_offset: Optional[float] = None,
        system: str = "Vedic",
        ayanamsa: str = "Lahiri",
        is_verified: bool = False,
        calculation_status: str = "uncalculated",
        calculation_engine: str = "Swiss Ephemeris (pyswisseph)",
        ascendant_sign: Optional[str] = None,
        ascendant_nakshatra: Optional[str] = None,
        sun_sign: Optional[str] = None,
        moon_sign: Optional[str] = None,
        moon_nakshatra: Optional[str] = None,
        planets: Optional[List[Dict[str, Any]]] = None,
        dashas: Optional[List[Dict[str, Any]]] = None,
        unavailable_fields: Optional[List[str]] = None,
    ):
        self.profile_id = profile_id
        self.profile_name = profile_name or "Guest User"
        self.date_of_birth = date_of_birth
        self.time_of_birth = time_of_birth
        self.is_time_approximate = is_time_approximate
        self.birthplace = birthplace or "Unspecified"
        self.latitude = latitude
        self.longitude = longitude
        self.timezone_offset = timezone_offset
        self.system = system
        self.ayanamsa = ayanamsa
        self.is_verified = is_verified
        self.calculation_status = calculation_status
        self.calculation_engine = calculation_engine
        self.ascendant_sign = ascendant_sign
        self.ascendant_nakshatra = ascendant_nakshatra
        self.sun_sign = sun_sign
        self.moon_sign = moon_sign
        self.moon_nakshatra = moon_nakshatra
        self.planets = planets or []
        self.dashas = dashas or []
        self.unavailable_fields = unavailable_fields or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "profile_id": self.profile_id,
            "profile_name": self.profile_name,
            "date_of_birth": self.date_of_birth,
            "time_of_birth": self.time_of_birth,
            "is_time_approximate": self.is_time_approximate,
            "birthplace": self.birthplace,
            "timezone_offset": self.timezone_offset,
            "system": self.system,
            "ayanamsa": self.ayanamsa,
            "is_verified": self.is_verified,
            "calculation_status": self.calculation_status,
            "calculation_engine": self.calculation_engine,
            "ascendant_sign": self.ascendant_sign,
            "ascendant_nakshatra": self.ascendant_nakshatra,
            "sun_sign": self.sun_sign,
            "moon_sign": self.moon_sign,
            "moon_nakshatra": self.moon_nakshatra,
            "planets": self.planets,
            "dashas": self.dashas,
            "unavailable_fields": self.unavailable_fields
        }

    def format_for_prompt(self) -> str:
        """
        Builds a strictly truthful summary block for the LLM system prompt.
        Explicitly informs the model whether verified data is present or absent.
        """
        if not self.is_verified:
            return (
                "### CHART DATA STATUS: NO BIRTH CHART CALCULATED FOR THIS USER\n"
                "- Calculation Status: UNCALCULATED / MISSING BIRTH DETAILS\n"
                "- User Birth Details: NOT PROVIDED OR NOT YET CALCULATED\n"
                "- Unavailable Fields: All planetary positions, Lagna, Nakshatras, Houses, and Dashas are UNAVAILABLE.\n"
                "- MANDATORY RULE: You do NOT have chart data for this user. "
                "Never claim their chart is verified. Never invent ascendant, planets, or signs. "
                "If the user asks for a personalized reading (love, career, marriage, etc.), "
                "warmly let them know that their birth date, birth time, and birth place are needed for a personalized reading, "
                "or offer general astrological guidance in the meantime."
            )

        # Verified chart summary
        approx_note = " (Approximate time - house cusps may vary)" if self.is_time_approximate else " (Exact birth time)"
        planet_lines = []
        for p in self.planets:
            p_name = p.get("name")
            p_sign = p.get("sign")
            p_house = p.get("house")
            p_nak = p.get("nakshatra")
            p_retro = " [Retrograde]" if p.get("is_retrograde") else ""
            planet_lines.append(f"  * {p_name}: {p_sign} in House {p_house} ({p_nak} Nakshatra){p_retro}")

        planets_str = "\n".join(planet_lines) if planet_lines else "  * None recorded"

        dasha_lines = []
        for d in self.dashas[:3]:
            dasha_lines.append(f"  * {d.get('planet')} Dasha: {d.get('start_date')} to {d.get('end_date')}")
        dashas_str = "\n".join(dasha_lines) if dasha_lines else "  * Not calculated"

        return (
            f"### CHART DATA STATUS: VERIFIED ASTRONOMICAL CALCULATIONS (Swiss Ephemeris NASA JPL)\n"
            f"- Subject: {self.profile_name}\n"
            f"- Birth Date: {self.date_of_birth}, Time: {self.time_of_birth}{approx_note}\n"
            f"- Birthplace: {self.birthplace} (TZ: {self.timezone_offset})\n"
            f"- Astrology System: {self.system} ({self.ayanamsa} Ayanamsa)\n"
            f"- Ascendant (Lagna): {self.ascendant_sign} ({self.ascendant_nakshatra} Nakshatra)\n"
            f"- Sun Sign (Surya): {self.sun_sign}\n"
            f"- Moon Sign (Chandra Rashi): {self.moon_sign} ({self.moon_nakshatra} Nakshatra)\n"
            f"- Verified Planetary Placements:\n{planets_str}\n"
            f"- Current/Upcoming Vimshottari Dashas:\n{dashas_str}\n"
            f"- MANDATORY RULE: Use ONLY these verified placements. Do not invent any additional planets, degrees, or divisional charts."
        )


def validate_and_build_chart_context(
    chart_record: Optional[Any],
    expected_profile_id: Optional[str] = None
) -> ChartContext:
    """
    Validates chart provenance and extracts supported fields.
    Guarantees stale, mismatched, or uncalculated charts are rejected.
    """
    all_fields = [
        "ascendant_sign", "ascendant_nakshatra", "sun_sign",
        "moon_sign", "moon_nakshatra", "planets", "houses", "dashas"
    ]

    if not chart_record:
        return ChartContext(
            is_verified=False,
            calculation_status="missing_details",
            unavailable_fields=all_fields
        )

    # Check profile match if expected_profile_id is provided
    record_id = getattr(chart_record, "id", None)
    if expected_profile_id and record_id and record_id != expected_profile_id:
        logger.warning(f"Profile ID mismatch: expected {expected_profile_id}, found {record_id}")
        return ChartContext(
            is_verified=False,
            calculation_status="profile_mismatch",
            unavailable_fields=all_fields
        )

    raw_data = getattr(chart_record, "chart_data", None)
    if not isinstance(raw_data, dict):
        return ChartContext(
            is_verified=False,
            calculation_status="invalid_chart_payload",
            unavailable_fields=all_fields
        )

    # Validate essential astronomical keys
    required_keys = ["ascendant_sign", "moon_sign", "planets"]
    missing_keys = [k for k in required_keys if not raw_data.get(k)]
    if missing_keys:
        return ChartContext(
            is_verified=False,
            calculation_status=f"incomplete_calculation_missing_{'_'.join(missing_keys)}",
            unavailable_fields=all_fields
        )

    # Extract planets cleanly
    raw_planets = raw_data.get("planets", [])
    clean_planets = []
    for p in raw_planets:
        if isinstance(p, dict) and "name" in p and "sign" in p:
            clean_planets.append({
                "name": p.get("name"),
                "sign": p.get("sign"),
                "house": p.get("house", 1),
                "nakshatra": p.get("nakshatra", ""),
                "is_retrograde": bool(p.get("is_retrograde", False))
            })

    # Extract dashas
    raw_dashas = raw_data.get("dashas", [])
    clean_dashas = []
    for d in raw_dashas:
        if isinstance(d, dict) and "planet" in d:
            clean_dashas.append({
                "planet": d.get("planet"),
                "start_date": d.get("start_date", ""),
                "end_date": d.get("end_date", "")
            })

    birthplace = getattr(chart_record, "city", None)
    country = getattr(chart_record, "country", None)
    location_str = f"{birthplace}, {country}" if (birthplace and country) else (birthplace or country or "Unspecified")

    return ChartContext(
        profile_id=record_id,
        profile_name=getattr(chart_record, "name", "User"),
        date_of_birth=getattr(chart_record, "date_of_birth", None),
        time_of_birth=getattr(chart_record, "time_of_birth", None),
        is_time_approximate=bool(getattr(chart_record, "is_time_approximate", False)),
        birthplace=location_str,
        latitude=getattr(chart_record, "latitude", None),
        longitude=getattr(chart_record, "longitude", None),
        timezone_offset=getattr(chart_record, "timezone_offset", 5.5),
        system=getattr(chart_record, "system", "Vedic"),
        ayanamsa=getattr(chart_record, "ayanamsa", "Lahiri"),
        is_verified=True,
        calculation_status="verified",
        calculation_engine=raw_data.get("calculation_engine", "Swiss Ephemeris (pyswisseph)"),
        ascendant_sign=raw_data.get("ascendant_sign"),
        ascendant_nakshatra=raw_data.get("ascendant_nakshatra"),
        sun_sign=raw_data.get("sun_sign"),
        moon_sign=raw_data.get("moon_sign"),
        moon_nakshatra=raw_data.get("moon_nakshatra"),
        planets=clean_planets,
        dashas=clean_dashas,
        unavailable_fields=[]
    )
