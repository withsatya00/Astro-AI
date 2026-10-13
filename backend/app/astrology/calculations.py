"""
Precision Astrology Calculation Engine for AstroAI Agent.
Powered by Swiss Ephemeris (pyswisseph) astronomical calculations.
Supports Vedic (Sidereal: Lahiri, Raman, Krishnamurti) and Western (Tropical) charts.
"""
from typing import Dict, List, Tuple, Any, Optional
from datetime import datetime, timedelta
import math
import swisseph as swe

# 12 Zodiac Signs in order (0 to 11)
ZODIAC_SIGNS = [
    {"index": 0, "name": "Aries", "sanskrit": "Mesha", "lord": "Mars", "element": "Fire"},
    {"index": 1, "name": "Taurus", "sanskrit": "Vrishabha", "lord": "Venus", "element": "Earth"},
    {"index": 2, "name": "Gemini", "sanskrit": "Mithuna", "lord": "Mercury", "element": "Air"},
    {"index": 3, "name": "Cancer", "sanskrit": "Karkata", "lord": "Moon", "element": "Water"},
    {"index": 4, "name": "Leo", "sanskrit": "Simha", "lord": "Sun", "element": "Fire"},
    {"index": 5, "name": "Virgo", "sanskrit": "Kanya", "lord": "Mercury", "element": "Earth"},
    {"index": 6, "name": "Libra", "sanskrit": "Tula", "lord": "Venus", "element": "Air"},
    {"index": 7, "name": "Scorpio", "sanskrit": "Vrishchika", "lord": "Mars", "element": "Water"},
    {"index": 8, "name": "Sagittarius", "sanskrit": "Dhanu", "lord": "Jupiter", "element": "Fire"},
    {"index": 9, "name": "Capricorn", "sanskrit": "Makara", "lord": "Saturn", "element": "Earth"},
    {"index": 10, "name": "Aquarius", "sanskrit": "Kumbha", "lord": "Saturn", "element": "Air"},
    {"index": 11, "name": "Pisces", "sanskrit": "Meena", "lord": "Jupiter", "element": "Water"},
]

# 27 Nakshatras (Lunar Mansions) - 13° 20' each
NAKSHATRAS = [
    {"index": 0, "name": "Ashwini", "lord": "Ketu"},
    {"index": 1, "name": "Bharani", "lord": "Venus"},
    {"index": 2, "name": "Krittika", "lord": "Sun"},
    {"index": 3, "name": "Rohini", "lord": "Moon"},
    {"index": 4, "name": "Mrigashira", "lord": "Mars"},
    {"index": 5, "name": "Ardra", "lord": "Rahu"},
    {"index": 6, "name": "Punarvasu", "lord": "Jupiter"},
    {"index": 7, "name": "Pushya", "lord": "Saturn"},
    {"index": 8, "name": "Ashlesha", "lord": "Mercury"},
    {"index": 9, "name": "Magha", "lord": "Ketu"},
    {"index": 10, "name": "Purva Phalguni", "lord": "Venus"},
    {"index": 11, "name": "Uttara Phalguni", "lord": "Sun"},
    {"index": 12, "name": "Hasta", "lord": "Moon"},
    {"index": 13, "name": "Chitra", "lord": "Mars"},
    {"index": 14, "name": "Swati", "lord": "Rahu"},
    {"index": 15, "name": "Vishakha", "lord": "Jupiter"},
    {"index": 16, "name": "Anuradha", "lord": "Saturn"},
    {"index": 17, "name": "Jyeshtha", "lord": "Mercury"},
    {"index": 18, "name": "Mula", "lord": "Ketu"},
    {"index": 19, "name": "Purva Ashadha", "lord": "Venus"},
    {"index": 20, "name": "Uttara Ashadha", "lord": "Sun"},
    {"index": 21, "name": "Shravana", "lord": "Moon"},
    {"index": 22, "name": "Dhanishta", "lord": "Mars"},
    {"index": 23, "name": "Shatabhisha", "lord": "Rahu"},
    {"index": 24, "name": "Purva Bhadrapada", "lord": "Jupiter"},
    {"index": 25, "name": "Uttara Bhadrapada", "lord": "Saturn"},
    {"index": 26, "name": "Revati", "lord": "Mercury"},
]

# Vimshottari Dasha Lords and their ruling durations in solar years
VIMSHOTTARI_LORDS = [
    ("Ketu", 7),
    ("Venus", 20),
    ("Sun", 6),
    ("Moon", 10),
    ("Mars", 7),
    ("Rahu", 18),
    ("Jupiter", 16),
    ("Saturn", 19),
    ("Mercury", 17),
]

AYANAMSA_MAP = {
    "Lahiri": swe.SIDM_LAHIRI,
    "Raman": swe.SIDM_RAMAN,
    "Krishnamurti": swe.SIDM_KRISHNAMURTI,
}

PLANET_LIST = [
    ("Sun", swe.SUN),
    ("Moon", swe.MOON),
    ("Mars", swe.MARS),
    ("Mercury", swe.MERCURY),
    ("Jupiter", swe.JUPITER),
    ("Venus", swe.VENUS),
    ("Saturn", swe.SATURN),
    ("Rahu", swe.TRUE_NODE),
    ("Uranus", swe.URANUS),
    ("Neptune", swe.NEPTUNE),
    ("Pluto", swe.PLUTO),
]

def calculate_julian_day(
    date_str: str,
    time_str: str,
    timezone_offset: float
) -> float:
    """
    Computes Julian Day in Universal Time (UT).
    date_str: YYYY-MM-DD
    time_str: HH:MM or HH:MM:SS
    timezone_offset: hours offset from UTC (e.g. 5.5 for IST)
    """
    parts = [int(p) for p in date_str.split("-")]
    year, month, day = parts[0], parts[1], parts[2]

    time_parts = [float(p) for p in time_str.split(":")]
    hour = time_parts[0]
    minute = time_parts[1] if len(time_parts) > 1 else 0.0
    second = time_parts[2] if len(time_parts) > 2 else 0.0

    # Local decimal hours
    local_hours = hour + (minute / 60.0) + (second / 3600.0)
    # Convert to Universal Time (UT)
    ut_hours = local_hours - timezone_offset

    # Swiss Ephemeris Julian Day function
    jd = swe.julday(year, month, day, ut_hours)
    return jd

def get_zodiac_sign(degree: float) -> Tuple[Dict[str, Any], float]:
    """Returns sign dictionary and relative degree inside sign (0° to 30°)."""
    norm = degree % 360.0
    sign_idx = int(norm // 30)
    deg_in_sign = norm % 30.0
    return ZODIAC_SIGNS[sign_idx], deg_in_sign

def get_nakshatra_info(degree: float) -> Tuple[str, str, int]:
    """
    Calculates Nakshatra name, Lord, and Pada (1-4).
    Each Nakshatra is 13° 20' = 13.333333333°
    Each Pada is 3° 20' = 3.333333333°
    """
    norm = degree % 360.0
    nak_span = 360.0 / 27.0  # 13.333333333 degrees
    pada_span = nak_span / 4.0 # 3.333333333 degrees

    nak_idx = int(norm // nak_span)
    deg_in_nak = norm % nak_span
    pada = int(deg_in_nak // pada_span) + 1

    nak = NAKSHATRAS[nak_idx % 27]
    return nak["name"], nak["lord"], min(pada, 4)

def calculate_navamsha(degree: float) -> str:
    """
    Calculates Navamsha (D9) sign from longitude.
    Each sign (30°) has 9 navamshas of 3°20'.
    Movable signs (Aries, Cancer, Libra, Capricorn): start from sign itself.
    Fixed signs (Taurus, Leo, Scorpio, Aquarius): start from 9th sign.
    Dual signs (Gemini, Virgo, Sagittarius, Pisces): start from 5th sign.
    """
    norm = degree % 360.0
    sign_idx = int(norm // 30)
    deg_in_sign = norm % 30.0
    nav_idx = int(deg_in_sign // (30.0 / 9.0)) # 0 to 8

    # Sign nature
    if sign_idx in (0, 3, 6, 9):       # Movable
        start_sign = sign_idx
    elif sign_idx in (1, 4, 7, 10):     # Fixed
        start_sign = (sign_idx + 8) % 12
    else:                               # Dual
        start_sign = (sign_idx + 4) % 12

    d9_sign_idx = (start_sign + nav_idx) % 12
    return ZODIAC_SIGNS[d9_sign_idx]["name"]

def calculate_vimshottari_dashas(
    moon_degree: float,
    birth_date_str: str
) -> List[Dict[str, Any]]:
    """
    Calculates Vimshottari Mahadasha sequence for 120 years starting from birth date.
    Uses exact Moon Nakshatra position to compute the balance of the first Dasha.
    """
    norm = moon_degree % 360.0
    nak_span = 360.0 / 27.0
    nak_idx = int(norm // nak_span)
    deg_in_nak = norm % nak_span

    # Fraction of nakshatra traversed
    fraction_traversed = deg_in_nak / nak_span
    fraction_remaining = 1.0 - fraction_traversed

    # Find starting lord in the 9-planet cycle
    # Ketu is lord of nakshatra 0, 9, 18
    cycle_index = nak_idx % 9
    start_lord, full_years = VIMSHOTTARI_LORDS[cycle_index]
    first_dasha_remaining_years = full_years * fraction_remaining

    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%d")
    current_date = birth_date
    dashas = []

    # First dasha (balance)
    first_end_days = first_dasha_remaining_years * 365.25
    first_end_date = current_date + timedelta(days=first_end_days)
    dashas.append({
        "planet": start_lord,
        "start_date": current_date.strftime("%Y-%m-%d"),
        "end_date": first_end_date.strftime("%Y-%m-%d"),
        "duration_years": round(first_dasha_remaining_years, 2)
    })
    current_date = first_end_date

    # Subsequent full dashas
    for i in range(1, 9):
        idx = (cycle_index + i) % 9
        lord, years = VIMSHOTTARI_LORDS[idx]
        end_date = current_date + timedelta(days=years * 365.25)
        dashas.append({
            "planet": lord,
            "start_date": current_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "duration_years": float(years)
        })
        current_date = end_date

    return dashas

def calculate_chart(
    date_of_birth: str,
    time_of_birth: Optional[str],
    is_time_approximate: bool,
    latitude: float,
    longitude: float,
    timezone_offset: float,
    system: str = "Vedic",
    ayanamsa: str = "Lahiri"
) -> Dict[str, Any]:
    """
    Computes complete birth chart with planetary coordinates, houses, nakshatras, and dashas.
    """
    effective_time = time_of_birth or "12:00:00"
    jd = calculate_julian_day(date_of_birth, effective_time, timezone_offset)

    is_vedic = system.lower() == "vedic"
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED

    if is_vedic:
        flags |= swe.FLG_SIDEREAL
        ayan_code = AYANAMSA_MAP.get(ayanamsa, swe.SIDM_LAHIRI)
        swe.set_sid_mode(ayan_code)

    # 1. Calculate Houses & Ascendant
    # Vedic traditionally uses Whole Sign (b'W') or Equal Houses (b'E').
    # For Western, Placidus (b'P') is standard.
    house_system_char = b'W' if is_vedic else b'P'
    cusps, ascmc = swe.houses_ex(jd, latitude, longitude, house_system_char, flags)
    asc_deg = ascmc[0] % 360.0

    asc_sign, asc_deg_in_sign = get_zodiac_sign(asc_deg)
    asc_nak, asc_nak_lord, asc_pada = get_nakshatra_info(asc_deg)
    navamsha_lagna = calculate_navamsha(asc_deg)

    # 2. Ascendant house sign index for house placement (Vedic whole sign: Lagna sign is 1st house)
    lagna_sign_idx = asc_sign["index"]

    houses_result = []
    for h_num in range(1, 13):
        if is_vedic:
            # Whole sign houses: house 1 is lagna sign, house 2 is lagna sign + 1, etc.
            h_sign_idx = (lagna_sign_idx + (h_num - 1)) % 12
            h_sign = ZODIAC_SIGNS[h_sign_idx]
            h_deg = (h_sign_idx * 30.0)
        else:
            h_deg = cusps[h_num - 1] % 360.0
            h_sign, _ = get_zodiac_sign(h_deg)

        houses_result.append({
            "house_number": h_num,
            "sign": h_sign["name"],
            "sign_lord": h_sign["lord"],
            "degree": round(h_deg, 4)
        })

    # 3. Calculate Planetary Positions
    planets_result = []
    moon_lon = 0.0

    for name, p_code in PLANET_LIST:
        res, ret_flag = swe.calc_ut(jd, p_code, flags)
        lon = res[0] % 360.0
        speed = res[3]
        is_retro = speed < 0.0

        sign_info, deg_in_sign = get_zodiac_sign(lon)
        nak_name, nak_lord, pada = get_nakshatra_info(lon)

        if is_vedic:
            # House relative to lagna sign (1-indexed)
            planet_house = ((sign_info["index"] - lagna_sign_idx) % 12) + 1
        else:
            # Find which house cusp it falls into
            planet_house = 1
            for h in range(1, 12):
                if cusps[h - 1] <= lon < cusps[h]:
                    planet_house = h
                    break
            else:
                planet_house = 12

        if name == "Moon":
            moon_lon = lon

        planets_result.append({
            "name": name,
            "longitude": round(lon, 4),
            "sign": sign_info["name"],
            "sign_lord": sign_info["lord"],
            "degree_in_sign": round(deg_in_sign, 4),
            "house": planet_house,
            "nakshatra": nak_name,
            "nakshatra_lord": nak_lord,
            "pada": pada,
            "is_retrograde": is_retro
        })

    # Add Ketu (opposite to Rahu, 180 degrees)
    rahu_obj = next(p for p in planets_result if p["name"] == "Rahu")
    ketu_lon = (rahu_obj["longitude"] + 180.0) % 360.0
    ketu_sign, ketu_deg_in_sign = get_zodiac_sign(ketu_lon)
    ketu_nak, ketu_nak_lord, ketu_pada = get_nakshatra_info(ketu_lon)
    ketu_house = ((ketu_sign["index"] - lagna_sign_idx) % 12) + 1 if is_vedic else 1

    planets_result.append({
        "name": "Ketu",
        "longitude": round(ketu_lon, 4),
        "sign": ketu_sign["name"],
        "sign_lord": ketu_sign["lord"],
        "degree_in_sign": round(ketu_deg_in_sign, 4),
        "house": ketu_house,
        "nakshatra": ketu_nak,
        "nakshatra_lord": ketu_nak_lord,
        "pada": ketu_pada,
        "is_retrograde": True  # Ketu always moves retrograde in Vedic astrology
    })

    # Sun & Moon Sign info
    sun_obj = next(p for p in planets_result if p["name"] == "Sun")
    moon_obj = next(p for p in planets_result if p["name"] == "Moon")

    # 4. Calculate Dashas
    dashas = calculate_vimshottari_dashas(moon_lon, date_of_birth)

    return {
        "ascendant": round(asc_deg, 4),
        "ascendant_sign": asc_sign["name"],
        "ascendant_nakshatra": asc_nak,
        "ascendant_pada": asc_pada,
        "sun_sign": sun_obj["sign"],
        "moon_sign": moon_obj["sign"],
        "moon_nakshatra": moon_obj["nakshatra"],
        "moon_pada": moon_obj["pada"],
        "planets": planets_result,
        "houses": houses_result,
        "dashas": dashas,
        "navamsha_lagna": navamsha_lagna,
        "system": system,
        "ayanamsa": ayanamsa if is_vedic else "None (Tropical)",
        "julian_day": round(jd, 6),
        "calculation_engine": f"Swiss Ephemeris v{swe.version}",
        "is_time_approximate": is_time_approximate
    }
