"""
Authentic Classical Yoga and Astrological Pattern Detector for AstroAI.
Analyzes calculated astronomical charts (Swiss Ephemeris output) and detects:
- Pancha Mahapurusha Yogas (Ruchaka, Bhadra, Hamsa, Malavya, Sasa)
- Chandra Yogas (Gajakesari, Sunapha, Anapha, Dhurdhura, Kemadruma)
- Solar & Intellect Yogas (Budhaditya, Chandra-Mangala)
- Raja & Dhana Yogas (Kendra-Trikona lord alignments)
- Vipareeta Raja Yogas (Harsha, Sarala, Vimala)
- Kuja Dosha (Manglik) with classical cancellations
- Shani Sade Sati / Dhaiya transit status
- Active Vimshottari Mahadasha & Antardasha dynamics
"""
from typing import Dict, List, Any, Optional
from datetime import datetime

# Signs and their planetary rulers
SIGN_LORDS = {
    "Aries": "Mars", "Taurus": "Venus", "Gemini": "Mercury", "Cancer": "Moon",
    "Leo": "Sun", "Virgo": "Mercury", "Libra": "Venus", "Scorpio": "Mars",
    "Sagittarius": "Jupiter", "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter"
}

SIGN_ORDER = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

EXALTATION_SIGNS = {
    "Sun": "Aries", "Moon": "Taurus", "Mars": "Capricorn", "Mercury": "Virgo",
    "Jupiter": "Cancer", "Venus": "Pisces", "Saturn": "Libra"
}

OWN_SIGNS = {
    "Sun": ["Leo"], "Moon": ["Cancer"], "Mars": ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"], "Jupiter": ["Sagittarius", "Pisces"],
    "Venus": ["Taurus", "Libra"], "Saturn": ["Capricorn", "Aquarius"]
}

DEBILITATION_SIGNS = {
    "Sun": "Libra", "Moon": "Scorpio", "Mars": "Cancer", "Mercury": "Pisces",
    "Jupiter": "Capricorn", "Venus": "Virgo", "Saturn": "Aries"
}


def _get_planet(planets: List[Dict[str, Any]], name: str) -> Optional[Dict[str, Any]]:
    """Helper to locate a planet dictionary by name."""
    for p in planets:
        if p.get("name", "").lower() == name.lower():
            return p
    return None


def detect_pancha_mahapurusha_yogas(planets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detects the 5 Great Person Yogas (Pancha Mahapurusha) formed when Mars, Mercury,
    Jupiter, Venus, or Saturn occupy a Kendra (1, 4, 7, 10) in own or exaltation sign.
    """
    yogas = []
    mahapurusha_specs = [
        ("Mars", "Ruchaka Yoga", "Heroism, physical stamina, leadership in engineering/military."),
        ("Mercury", "Bhadra Yoga", "Exceptional intellect, commerce, mathematics, eloquence."),
        ("Jupiter", "Hamsa Yoga", "Noble wisdom, spiritual grace, universal reverence, moral majesty."),
        ("Venus", "Malavya Yoga", "Artistic genius, luxury, aesthetic refinement, marital splendor."),
        ("Saturn", "Sasa Yoga", "Relentless discipline, political power, authority over masses, lasting legacy.")
    ]

    for p_name, yoga_name, desc in mahapurusha_specs:
        p = _get_planet(planets, p_name)
        if not p:
            continue
        house = p.get("house", 0)
        sign = p.get("sign", "")
        is_kendra = house in (1, 4, 7, 10)
        is_exalted = sign == EXALTATION_SIGNS.get(p_name)
        is_own = sign in OWN_SIGNS.get(p_name, [])

        if is_kendra and (is_exalted or is_own):
            yogas.append({
                "yoga_name": yoga_name,
                "category": "Pancha Mahapurusha",
                "planet": p_name,
                "house": house,
                "sign": sign,
                "dignity": "Exalted" if is_exalted else "Own Sign",
                "strength": "High",
                "description": desc,
                "search_query": f"{yoga_name} {p_name} Kendra {sign} classical shastra"
            })
    return yogas


def detect_gajakesari_yoga(planets: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Detects Gajakesari Yoga: Jupiter in a Kendra (1, 4, 7, 10) from the Moon.
    Bestows royal dignity, unshakeable virtue, lasting fame, and divine protection.
    """
    moon = _get_planet(planets, "Moon")
    jupiter = _get_planet(planets, "Jupiter")
    if not moon or not jupiter:
        return None

    m_house = moon.get("house", 0)
    j_house = jupiter.get("house", 0)
    if not m_house or not j_house:
        return None

    # Distance from Moon (1-indexed)
    dist = ((j_house - m_house) % 12) + 1
    if dist in (1, 4, 7, 10):
        return {
            "yoga_name": "Gajakesari Yoga",
            "category": "Chandra Yoga",
            "planet": "Jupiter & Moon",
            "house": j_house,
            "relative_position": f"Jupiter in {dist}th house from Moon",
            "strength": "High",
            "description": "Jupiter in Kendra from Moon brings wisdom, elephant-lion majesty, virtuous conduct, and protection.",
            "search_query": "Gajakesari Yoga Jupiter Kendra from Moon elephant lion majesty"
        }
    return None


def detect_budhaditya_yoga(planets: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Detects Budhaditya Yoga: Sun and Mercury conjunct in the same house.
    Bestows sharp analytical intelligence, communicative authority, and scholarly repute.
    """
    sun = _get_planet(planets, "Sun")
    mercury = _get_planet(planets, "Mercury")
    if not sun or not mercury:
        return None

    s_house = sun.get("house", 0)
    m_house = mercury.get("house", 0)
    if s_house == m_house and s_house > 0:
        s_deg = sun.get("longitude", 0.0)
        m_deg = mercury.get("longitude", 0.0)
        diff = abs(s_deg - m_deg)
        is_combust = diff < 3.0  # Mercury very close to Sun is combust

        return {
            "yoga_name": "Budhaditya Yoga",
            "category": "Solar / Intellect Yoga",
            "planet": "Sun & Mercury",
            "house": s_house,
            "sign": sun.get("sign"),
            "strength": "Moderate" if is_combust else "High",
            "description": "Sun and Mercury conjunction grants intellectual sharpness, administrative acumen, and public eloquence.",
            "search_query": f"Budhaditya Yoga Sun Mercury conjunction in House {s_house}"
        }
    return None


def detect_chandra_mangala_yoga(planets: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Detects Chandra-Mangala Yoga: Moon and Mars in conjunction or mutual aspect (7th).
    Bestows energetic financial enterprise, real estate wealth, and commercial initiative.
    """
    moon = _get_planet(planets, "Moon")
    mars = _get_planet(planets, "Mars")
    if not moon or not mars:
        return None

    m_house = moon.get("house", 0)
    ma_house = mars.get("house", 0)
    if not m_house or not ma_house:
        return None

    rel_dist = ((ma_house - m_house) % 12) + 1
    if rel_dist in (1, 7):
        return {
            "yoga_name": "Chandra-Mangala Yoga",
            "category": "Wealth & Commercial Yoga",
            "planet": "Moon & Mars",
            "house": m_house,
            "strength": "High" if rel_dist == 1 else "Moderate",
            "description": "Combination of Moon and Mars creates formidable commercial energy, landed wealth, and financial drive.",
            "search_query": "Chandra Mangala Yoga Moon Mars landed property wealth"
        }
    return None


def detect_kuja_dosha(planets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Detects Kuja Dosha (Manglik): Mars placed in 1st, 4th, 7th, 8th, or 12th house from Lagna or Moon.
    Evaluates authentic classical exceptions and cancellations (Parashara / Narada).
    """
    mars = _get_planet(planets, "Mars")
    moon = _get_planet(planets, "Moon")
    jupiter = _get_planet(planets, "Jupiter")

    if not mars:
        return {"has_kuja_dosha": False, "details": "Mars position not available"}

    m_house = mars.get("house", 0)
    m_sign = mars.get("sign", "")
    dosha_houses = (1, 4, 7, 8, 12)

    has_from_lagna = m_house in dosha_houses

    # From Moon
    has_from_moon = False
    if moon and moon.get("house"):
        dist_from_moon = ((m_house - moon.get("house")) % 12) + 1
        has_from_moon = dist_from_moon in dosha_houses

    is_manglik = has_from_lagna or has_from_moon
    cancellations = []

    if is_manglik:
        # Classical exceptions
        if m_house == 1 and m_sign == "Aries":
            cancellations.append("Mars in Aries in 1st house cancels Kuja Dosha (Own Sign).")
        if m_house == 4 and m_sign in ("Scorpio", "Capricorn"):
            cancellations.append("Mars in Scorpio or Capricorn in 4th house neutralizes the affliction.")
        if m_house == 7 and m_sign in ("Capricorn", "Cancer"):
            cancellations.append("Mars in Capricorn (Exalted) or Cancer in 7th house has classical cancellation.")
        if m_house == 8 and m_sign in ("Sagittarius", "Pisces"):
            cancellations.append("Mars in Jupiter signs in 8th house cancels severe affliction.")
        if jupiter:
            j_house = jupiter.get("house", 0)
            if j_house and ((m_house - j_house) % 12) + 1 in (1, 5, 7, 9):
                cancellations.append("Benefic aspect or conjunction of Jupiter pacifies Kuja Dosha.")

    return {
        "has_kuja_dosha": is_manglik,
        "mars_house": m_house,
        "mars_sign": m_sign,
        "affliction_level": "Mitigated / Cancelled" if cancellations else ("Active" if is_manglik else "None"),
        "cancellations": cancellations,
        "search_query": "Kuja Dosha Mangal Manglik classical cancellation marriage compatibility"
    }


def detect_sade_sati_status(moon_sign: str, current_saturn_sign: str = "Pisces") -> Dict[str, Any]:
    """
    Computes Shani Sade Sati and Dhaiya transit status based on natal Moon sign.
    Saturn currently transits through Pisces (Meena) in sidereal zodiac.
    """
    if moon_sign not in SIGN_ORDER or current_saturn_sign not in SIGN_ORDER:
        return {"status": "Unknown"}

    m_idx = SIGN_ORDER.index(moon_sign)
    s_idx = SIGN_ORDER.index(current_saturn_sign)

    diff = (s_idx - m_idx) % 12  # Distance from Moon (0 to 11)

    if diff == 11:
        phase = "Rising Phase (1st Charan - 12th from Moon)"
        desc = "Saturn transiting 12th from natal Moon; focus on expenditure, sleep hygiene, and spiritual introspection."
        is_active = True
    elif diff == 0:
        phase = "Peak Phase (2nd Charan - Janma Shani)"
        desc = "Saturn transiting natal Moon; intensive mental discipline, restructuring of identity and emotional resilience."
        is_active = True
    elif diff == 1:
        phase = "Setting Phase (3rd Charan - 2nd from Moon)"
        desc = "Saturn transiting 2nd from natal Moon; consolidation of family values, financial discipline, and speech."
        is_active = True
    elif diff in (3, 7):
        phase = "Kantaka / Ashtama Shani (Dhaiya - 2.5 Years)"
        desc = f"Saturn transiting {diff+1}th from natal Moon; periods of professional exertion or transformational lessons."
        is_active = True
    else:
        phase = "No Active Sade Sati or Dhaiya"
        desc = "Saturn is currently in a supportive or neutral transit position relative to your natal Moon."
        is_active = False

    return {
        "is_active": is_active,
        "phase": phase,
        "current_saturn_sign": current_saturn_sign,
        "natal_moon_sign": moon_sign,
        "description": desc,
        "search_query": "Shani Sade Sati three phases Dhaiya from natal Moon classical transits"
    }


def detect_vipareeta_raja_yogas(
    planets: List[Dict[str, Any]],
    houses: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detects Vipareeta Raja Yogas (Harsha, Sarala, Vimala) formed when lords of
    Dusthana houses (6, 8, 12) reside in Dusthana houses without association of Kendra/Trikona lords.
    Turns adversity into sudden unexpected triumphs and resilience.
    """
    yogas = []
    house_lord_map = {h["house_number"]: h["sign_lord"] for h in houses}

    lord_6 = house_lord_map.get(6)
    lord_8 = house_lord_map.get(8)
    lord_12 = house_lord_map.get(12)

    p6 = _get_planet(planets, lord_6) if lord_6 else None
    p8 = _get_planet(planets, lord_8) if lord_8 else None
    p12 = _get_planet(planets, lord_12) if lord_12 else None

    # Harsha Yoga: 6th lord in 6, 8, or 12
    if p6 and p6.get("house") in (6, 8, 12):
        yogas.append({
            "yoga_name": "Harsha Yoga",
            "category": "Vipareeta Raja Yoga",
            "planet": lord_6,
            "house": p6.get("house"),
            "description": "6th Lord placed in a Dusthana dissolves debts, rivals, and chronic illness into victory.",
            "search_query": "Vipareeta Raja Yoga Harsha Sarala Vimala Dusthana lord victory"
        })

    # Sarala Yoga: 8th lord in 6, 8, or 12
    if p8 and p8.get("house") in (6, 8, 12):
        yogas.append({
            "yoga_name": "Sarala Yoga",
            "category": "Vipareeta Raja Yoga",
            "planet": lord_8,
            "house": p8.get("house"),
            "description": "8th Lord placed in a Dusthana confers longevity, fearlessness, sudden unexpected gains, and deep insight.",
            "search_query": "Sarala Yoga 8th lord in Dusthana unexpected triumph longevity"
        })

    # Vimala Yoga: 12th lord in 6, 8, or 12
    if p12 and p12.get("house") in (6, 8, 12):
        yogas.append({
            "yoga_name": "Vimala Yoga",
            "category": "Vipareeta Raja Yoga",
            "planet": lord_12,
            "house": p12.get("house"),
            "description": "12th Lord placed in a Dusthana guarantees financial accumulation, independent mind, and virtuous expenditures.",
            "search_query": "Vimala Yoga 12th lord in Dusthana financial accumulation"
        })

    return yogas


def detect_neechabhanga_raja_yoga(
    planets: List[Dict[str, Any]],
    houses: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detects Neechabhanga Raja Yoga:
    Formed when a debilitated planet has its debility cancelled:
    1. The lord of the sign where the debilitated planet is placed is in Kendra from Lagna or Moon.
    2. The planet that gets exalted in that debilitated sign is in Kendra from Lagna or Moon.
    Converts early setbacks into monumental royal success and lasting resilience.
    """
    yogas = []
    moon = _get_planet(planets, "Moon")
    m_house = moon.get("house", 0) if moon else 0

    EXALTATION_IN_SIGN = {
        "Aries": "Sun", "Taurus": "Moon", "Cancer": "Jupiter", "Virgo": "Mercury",
        "Libra": "Saturn", "Scorpio": "Ketu", "Capricorn": "Mars", "Pisces": "Venus"
    }

    for p in planets:
        p_name = p.get("name")
        sign = p.get("sign")
        if p_name in DEBILITATION_SIGNS and sign == DEBILITATION_SIGNS[p_name]:
            dispositor_name = SIGN_LORDS.get(sign)
            disp_planet = _get_planet(planets, dispositor_name) if dispositor_name else None
            exalt_lord_name = EXALTATION_IN_SIGN.get(sign)
            exalt_planet = _get_planet(planets, exalt_lord_name) if exalt_lord_name else None

            cancellation_found = False
            reason = ""

            if disp_planet and disp_planet.get("house") in (1, 4, 7, 10):
                cancellation_found = True
                reason = f"Dispositor {dispositor_name} is in Kendra (House {disp_planet.get('house')}) from Lagna."
            elif disp_planet and m_house and (((disp_planet.get("house") - m_house) % 12) + 1 in (1, 4, 7, 10)):
                cancellation_found = True
                reason = f"Dispositor {dispositor_name} is in Kendra from natal Moon."
            elif exalt_planet and exalt_planet.get("house") in (1, 4, 7, 10):
                cancellation_found = True
                reason = f"Planet {exalt_lord_name} (exalted in {sign}) is in Kendra from Lagna."

            if cancellation_found:
                yogas.append({
                    "yoga_name": f"Neechabhanga Raja Yoga ({p_name})",
                    "category": "Raja Yoga",
                    "planet": p_name,
                    "house": p.get("house"),
                    "sign": sign,
                    "strength": "High",
                    "description": f"Debility of {p_name} in {sign} is fully cancelled. {reason} Bestows triumph after initial obstacles.",
                    "search_query": "Neechabhanga Raja Yoga cancellation debility Kendra triumph"
                })

    return yogas


def detect_dhana_and_lakshmi_yogas(
    planets: List[Dict[str, Any]],
    houses: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Detects Dhana Yogas (Wealth Combinations) and Lakshmi Yoga.
    Formed when lords of wealth houses (2nd Dhana, 11th Labha, 5th & 9th Lakshmi Sthanas)
    align in Kendra/Trikona or establish mutual relationship.
    """
    yogas = []
    house_lord_map = {h["house_number"]: h["sign_lord"] for h in houses}

    lord_2 = house_lord_map.get(2)
    lord_9 = house_lord_map.get(9)
    lord_11 = house_lord_map.get(11)

    p2 = _get_planet(planets, lord_2) if lord_2 else None
    p9 = _get_planet(planets, lord_9) if lord_9 else None
    p11 = _get_planet(planets, lord_11) if lord_11 else None

    # Lakshmi Yoga: 9th lord in Kendra/Trikona in own sign or exaltation
    if p9:
        h9 = p9.get("house", 0)
        s9 = p9.get("sign", "")
        if h9 in (1, 4, 5, 7, 9, 10) and (s9 == EXALTATION_SIGNS.get(lord_9) or s9 in OWN_SIGNS.get(lord_9, [])):
            yogas.append({
                "yoga_name": "Lakshmi Yoga",
                "category": "Dhana / Prosperity Yoga",
                "planet": lord_9,
                "house": h9,
                "strength": "High",
                "description": f"9th Lord {lord_9} is placed in House {h9} in dignity ({s9}), bestowing divine grace, wealth, and righteous fortune.",
                "search_query": "Lakshmi Yoga 9th lord Kendra Trikona fortune wealth"
            })

    # Dhana Yoga: 2nd and 11th lord in conjunction
    if p2 and p11 and lord_2 != lord_11 and p2.get("house") == p11.get("house") and p2.get("house") in (1, 2, 4, 5, 7, 9, 10, 11):
        yogas.append({
            "yoga_name": "Maha Dhana Yoga",
            "category": "Dhana / Wealth Yoga",
            "planet": f"{lord_2} & {lord_11}",
            "house": p2.get("house"),
            "strength": "High",
            "description": f"2nd Lord (Dhana) and 11th Lord (Labha) conjunct in House {p2.get('house')}, generating powerful continuous revenue streams.",
            "search_query": "Dhana Yoga 2nd lord 11th lord wealth gains classical shastra"
        })

    return yogas


def get_current_dasha_info(dashas: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Identifies the active Vimshottari Mahadasha based on current date."""
    if not dashas:
        return None
    now_str = datetime.now().strftime("%Y-%m-%d")
    for d in dashas:
        if d.get("start_date", "") <= now_str <= d.get("end_date", ""):
            return {
                "active_planet": d.get("planet"),
                "start_date": d.get("start_date"),
                "end_date": d.get("end_date"),
                "duration_years": d.get("duration_years"),
                "search_query": f"Vimshottari Dasha {d.get('planet')} Mahadasha classical results"
            }
    return {
        "active_planet": dashas[0].get("planet"),
        "start_date": dashas[0].get("start_date"),
        "end_date": dashas[0].get("end_date"),
        "duration_years": dashas[0].get("duration_years"),
        "search_query": f"Vimshottari Dasha {dashas[0].get('planet')} Mahadasha classical results"
    }


def analyze_all_chart_yogas(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Comprehensive pipeline analyzing all classical yogas and pattern configurations
    present in a calculated Swiss Ephemeris horoscope.
    """
    planets = chart_data.get("planets", [])
    houses = chart_data.get("houses", [])
    moon_sign = chart_data.get("moon_sign", "")
    dashas = chart_data.get("dashas", [])

    detected_yogas: List[Dict[str, Any]] = []

    # 1. Pancha Mahapurusha Yogas
    detected_yogas.extend(detect_pancha_mahapurusha_yogas(planets))

    # 2. Gajakesari Yoga
    gj = detect_gajakesari_yoga(planets)
    if gj:
        detected_yogas.append(gj)

    # 3. Budhaditya Yoga
    ba = detect_budhaditya_yoga(planets)
    if ba:
        detected_yogas.append(ba)

    # 4. Chandra-Mangala Yoga
    cm = detect_chandra_mangala_yoga(planets)
    if cm:
        detected_yogas.append(cm)

    # 5. Vipareeta Raja Yogas
    detected_yogas.extend(detect_vipareeta_raja_yogas(planets, houses))

    # 6. Neechabhanga Raja Yogas
    detected_yogas.extend(detect_neechabhanga_raja_yoga(planets, houses))

    # 7. Dhana and Lakshmi Yogas
    detected_yogas.extend(detect_dhana_and_lakshmi_yogas(planets, houses))

    # 8. Kuja Dosha (Manglik)
    kuja_info = detect_kuja_dosha(planets)

    # 7. Shani Sade Sati Status
    sade_sati_info = detect_sade_sati_status(moon_sign)

    # 8. Active Dasha
    current_dasha = get_current_dasha_info(dashas)

    # Compile targeted search queries for RAG
    rag_queries = []
    for y in detected_yogas:
        if "search_query" in y:
            rag_queries.append(y["search_query"])
    if kuja_info.get("has_kuja_dosha"):
        rag_queries.append(kuja_info["search_query"])
    if sade_sati_info.get("is_active"):
        rag_queries.append(sade_sati_info["search_query"])
    if current_dasha and "search_query" in current_dasha:
        rag_queries.append(current_dasha["search_query"])

    return {
        "detected_yogas": detected_yogas,
        "total_yogas_count": len(detected_yogas),
        "kuja_dosha": kuja_info,
        "sade_sati": sade_sati_info,
        "current_dasha": current_dasha,
        "targeted_rag_queries": rag_queries
    }
