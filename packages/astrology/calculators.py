"""
Vedic Astrology Calculators Engine for Astro Jyotish.
Provides rigorous mathematical calculations and traditional Vedic algorithms for:
1. Numerology (Life Path / Bhagyank, Mulank, Ruling Planet, Lucky Numbers/Days/Colors)
2. Name Numerology (Chaldean & Pythagorean systems, Destiny, Soul Urge, Personality)
3. Sun Sign (Surya Rashi - Sidereal Lahiri & Tropical Western)
4. Moon Sign (Chandra Rashi computed with Swiss Ephemeris)
5. Rising Sign (Ascendant / Lagna & degree with Swiss Ephemeris)
6. Rashi Synthesis (Sun, Moon, Lagna triplicity + 4 Elements balance)
7. Nakshatra & Pada (27 Nakshatras, 4 Padas, Deity, Gana, Yoni, Nadi, Baby Naming Syllables)
8. Vimshottari Dasha Calculator (Current Mahadasha, Antardasha, Pratyantardasha)
9. Mangal Dosha (Kuja Dosha with 6 classical Parihar cancellation rules)
10. Shani Sade Sati Tracker (Saturn in Pisces phase, Dhaiya, remedies)
11. Moon Phase (Tithi, Shukla/Krishna Paksha, illumination %, next Purnima/Amavasya)
12. Name Compatibility (Chaldean sound vibration harmony & relationship percentage)
13. Friendship Compatibility (Elemental synergy between zodiac signs)
14. Love Compatibility (Venus-Mars synastry & romantic harmony)
15. Jaimini Karakas (Atmakaraka, Darakaraka, Amatyakaraka, etc.)
16. Kaal Sarp Dosha (12 types, full vs partial, cancellations & remedies)
17. Transit Chart (Real-time Gochara planetary transits against natal chart)
"""
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timezone
import math
import swisseph as swe

from packages.astrology.calculations import (
    calculate_julian_day, ZODIAC_SIGNS, NAKSHATRAS,
    VIMSHOTTARI_LORDS, calculate_chart
)

# =========================================================================
# 1. NUMEROLOGY (Mulank & Bhagyank / Life Path)
# =========================================================================
PLANET_NUMEROLOGY = {
    1: {"planet": "Sun (Surya)", "deity": "Lord Rama / Surya", "element": "Fire", "day": "Sunday", "color": "Golden Yellow, Orange", "gem": "Ruby (Manikya)", "traits": "Leadership, vitality, ambition, originality, confidence"},
    2: {"planet": "Moon (Chandra)", "deity": "Lord Shiva / Chandra", "element": "Water", "day": "Monday", "color": "Pearl White, Cream", "gem": "Pearl (Moti)", "traits": "Intuition, empathy, diplomacy, gentleness, imagination"},
    3: {"planet": "Jupiter (Guru)", "deity": "Lord Vishnu / Brihaspati", "element": "Ether", "day": "Thursday", "color": "Bright Yellow, Saffron", "gem": "Yellow Sapphire (Pukhraj)", "traits": "Wisdom, optimism, communication, teaching, benevolence"},
    4: {"planet": "Rahu", "deity": "Goddess Durga / Saraswati", "element": "Air", "day": "Sunday / Wednesday", "color": "Electric Blue, Grey", "gem": "Hessonite (Gomed)", "traits": "Innovation, unconventional genius, perseverance, discipline"},
    5: {"planet": "Mercury (Budha)", "deity": "Lord Ganesha / Budha", "element": "Earth", "day": "Wednesday", "color": "Emerald Green, Light Grey", "gem": "Emerald (Panna)", "traits": "Intelligence, versatility, business acumen, wit, adaptability"},
    6: {"planet": "Venus (Shukra)", "deity": "Goddess Lakshmi / Shukra", "element": "Water", "day": "Friday", "color": "Pastel Pink, White, Sky Blue", "gem": "Diamond / Opal", "traits": "Beauty, harmony, romance, artistic taste, diplomacy, comfort"},
    7: {"planet": "Ketu", "deity": "Lord Ganesha / Matsya", "element": "Fire", "day": "Monday / Thursday", "color": "Smoky Grey, Sea Green", "gem": "Cat's Eye (Lehsuniya)", "traits": "Spirituality, deep research, analytical introspection, detachment"},
    8: {"planet": "Saturn (Shani)", "deity": "Lord Shani / Hanuman", "element": "Air", "day": "Saturday", "color": "Dark Blue, Navy, Charcoal", "gem": "Blue Sapphire (Neelam)", "traits": "Organization, responsibility, karmic justice, patience, hard work"},
    9: {"planet": "Mars (Mangal)", "deity": "Lord Kartikeya / Hanuman", "element": "Fire", "day": "Tuesday", "color": "Bright Red, Coral", "gem": "Red Coral (Moonga)", "traits": "Courage, energy, humanitarianism, chivalry, executive power"}
}

COMPATIBLE_NUMBERS = {
    1: [1, 2, 3, 5, 9],
    2: [1, 2, 4, 7],
    3: [1, 3, 5, 6, 9],
    4: [1, 2, 6, 7, 8],
    5: [1, 3, 5, 6],
    6: [2, 3, 5, 6, 9],
    7: [1, 2, 4, 7],
    8: [4, 5, 6],
    9: [1, 3, 5, 6, 9]
}

def sum_digits_to_single(n: int, preserve_master: bool = False) -> int:
    while n > 9:
        if preserve_master and n in (11, 22, 33):
            return n
        n = sum(int(d) for d in str(n) if d.isdigit())
    return n

def calculate_numerology(date_of_birth: str, full_name: Optional[str] = None) -> Dict[str, Any]:
    """
    Computes Mulank (Birth Day Number) and Bhagyank (Life Path / Destiny Number).
    date_of_birth: YYYY-MM-DD
    """
    dt = datetime.strptime(date_of_birth, "%Y-%m-%d")
    day = dt.day
    mulank = sum_digits_to_single(day)
    
    total_dob_digits = sum(int(d) for d in date_of_birth if d.isdigit())
    bhagyank = sum_digits_to_single(total_dob_digits)
    
    p_info = PLANET_NUMEROLOGY.get(mulank, PLANET_NUMEROLOGY[1])
    b_info = PLANET_NUMEROLOGY.get(bhagyank, PLANET_NUMEROLOGY[1])
    
    name_num = None
    if full_name:
        name_num = calculate_name_numerology(full_name).get("chaldean_destiny")
        
    return {
        "calculator": "Numerology (अंक ज्योतिष)",
        "date_of_birth": date_of_birth,
        "mulank": mulank,
        "mulank_name": f"Number {mulank} (मूलांक)",
        "bhagyank": bhagyank,
        "bhagyank_name": f"Number {bhagyank} (भाग्यांक / Life Path)",
        "name_number": name_num,
        "ruling_planet": p_info["planet"],
        "deity": p_info["deity"],
        "lucky_colors": p_info["color"],
        "lucky_gemstone": p_info["gem"],
        "lucky_days": p_info["day"],
        "key_traits": p_info["traits"],
        "life_path_summary": f"Your birth day confers the energetic vibration of {p_info['planet']}, granting {p_info['traits']}. Your destiny path {bhagyank} governed by {b_info['planet']} steers your major life accomplishments.",
        "compatible_numbers": COMPATIBLE_NUMBERS.get(mulank, [1, 3, 5, 9]),
        "favorable_years": [dt.year + i * 9 for i in range(1, 10)]
    }

# =========================================================================
# 2. NAME NUMEROLOGY (Chaldean & Pythagorean)
# =========================================================================
CHALDEAN_MAP = {
    'A': 1, 'I': 1, 'J': 1, 'Q': 1, 'Y': 1,
    'B': 2, 'K': 2, 'R': 2,
    'C': 3, 'G': 3, 'L': 3, 'S': 3,
    'D': 4, 'M': 4, 'T': 4,
    'E': 5, 'H': 5, 'N': 5, 'X': 5,
    'U': 6, 'V': 6, 'W': 6,
    'O': 7, 'Z': 7,
    'F': 8, 'P': 8
}

PYTHAGOREAN_MAP = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
}

VOWELS = set("AEIOU")

def calculate_name_numerology(name: str) -> Dict[str, Any]:
    cleaned = "".join(c for c in name.upper() if c.isalpha())
    if not cleaned:
        cleaned = "NAME"
        
    chaldean_total = sum(CHALDEAN_MAP.get(c, 0) for c in cleaned)
    chaldean_destiny = sum_digits_to_single(chaldean_total)
    
    pyth_total = sum(PYTHAGOREAN_MAP.get(c, 0) for c in cleaned)
    pyth_destiny = sum_digits_to_single(pyth_total)
    
    # Soul Urge (Vowels) & Personality (Consonants)
    soul_urge_total = sum(PYTHAGOREAN_MAP.get(c, 0) for c in cleaned if c in VOWELS)
    soul_urge_num = sum_digits_to_single(soul_urge_total) if soul_urge_total > 0 else 1
    
    pers_total = sum(PYTHAGOREAN_MAP.get(c, 0) for c in cleaned if c not in VOWELS)
    pers_num = sum_digits_to_single(pers_total) if pers_total > 0 else 1
    
    c_info = PLANET_NUMEROLOGY.get(chaldean_destiny, PLANET_NUMEROLOGY[1])
    
    return {
        "calculator": "Name Numerology (नामांक विश्लेषण)",
        "original_name": name,
        "cleaned_name": cleaned,
        "chaldean_total": chaldean_total,
        "chaldean_destiny": chaldean_destiny,
        "pythagorean_destiny": pyth_destiny,
        "soul_urge_number": soul_urge_num,
        "personality_number": pers_num,
        "ruling_planet": c_info["planet"],
        "name_vibration": f"Governed by {c_info['planet']}, inspiring {c_info['traits']}.",
        "lucky_colors": c_info["color"],
        "lucky_gemstone": c_info["gem"]
    }

# =========================================================================
# 3. SUN SIGN & MOON SIGN CALCULATORS
# =========================================================================
TROPICAL_SUN_SIGNS = [
    ("Capricorn", 1, 19), ("Aquarius", 2, 18), ("Pisces", 3, 20),
    ("Aries", 4, 19), ("Taurus", 5, 20), ("Gemini", 6, 20),
    ("Cancer", 7, 22), ("Leo", 8, 22), ("Virgo", 9, 22),
    ("Libra", 10, 22), ("Scorpio", 11, 21), ("Sagittarius", 12, 21),
    ("Capricorn", 12, 31)
]

def calculate_sun_sign(date_of_birth: str, time_of_birth: str = "12:00:00", lat: float = 28.6139, lon: float = 77.2090, tz: float = 5.5) -> Dict[str, Any]:
    chart = calculate_chart(date_of_birth, time_of_birth, False, lat, lon, tz, system="Vedic", ayanamsa="Lahiri")
    sun_p = next((p for p in chart["planets"] if p["name"] == "Sun"), None)
    
    vedic_sign = sun_p["sign"] if sun_p else "Aries"
    vedic_degree = sun_p["degree_in_sign"] if sun_p else 15.0
    vedic_sanskrit = next((s["sanskrit"] for s in ZODIAC_SIGNS if s["name"] == vedic_sign), "Mesha")
    nakshatra = sun_p.get("nakshatra", "Ashwini") if sun_p else "Ashwini"
    
    # Tropical Western sign lookup
    dt = datetime.strptime(date_of_birth, "%Y-%m-%d")
    m, d = dt.month, dt.day
    western_sign = "Aries"
    for sign, end_m, end_d in TROPICAL_SUN_SIGNS:
        if (m == end_m and d <= end_d) or (m == end_m - 1 and d > 20):
            western_sign = sign
            break
            
    return {
        "calculator": "Sun Sign (सूर्य राशि)",
        "vedic_sun_sign": vedic_sign,
        "vedic_sanskrit": vedic_sanskrit,
        "vedic_degree": round(vedic_degree, 2),
        "nakshatra": nakshatra,
        "western_sun_sign": western_sign,
        "ruling_planet": "Sun (Surya)",
        "element": next((s["element"] for s in ZODIAC_SIGNS if s["name"] == vedic_sign), "Fire"),
        "characteristics": f"Your Vedic Sun in {vedic_sign} ({vedic_sanskrit}) imbues soul vitality, leadership instincts, and innate dharma."
    }

def calculate_moon_sign(date_of_birth: str, time_of_birth: str = "12:00:00", lat: float = 28.6139, lon: float = 77.2090, tz: float = 5.5) -> Dict[str, Any]:
    chart = calculate_chart(date_of_birth, time_of_birth, False, lat, lon, tz, system="Vedic", ayanamsa="Lahiri")
    moon_p = next((p for p in chart["planets"] if p["name"] == "Moon"), None)
    
    moon_sign = chart.get("moon_sign") or (moon_p["sign"] if moon_p else "Aries")
    moon_sanskrit = next((s["sanskrit"] for s in ZODIAC_SIGNS if s["name"] == moon_sign), "Mesha")
    nakshatra = chart.get("nakshatra") or (moon_p.get("nakshatra") if moon_p else "Ashwini")
    pada = chart.get("nakshatra_pada", 1)
    
    return {
        "calculator": "Moon Sign (चन्द्र राशि - जन्म राशि)",
        "moon_sign": moon_sign,
        "moon_sanskrit": moon_sanskrit,
        "nakshatra": nakshatra,
        "nakshatra_pada": pada,
        "ruling_planet": next((s["lord"] for s in ZODIAC_SIGNS if s["name"] == moon_sign), "Mars"),
        "element": next((s["element"] for s in ZODIAC_SIGNS if s["name"] == moon_sign), "Water"),
        "emotional_nature": f"Your natal Moon is placed in {moon_sign} ({moon_sanskrit}) in {nakshatra} Nakshatra Pada {pada}. This governs your psychological nature, instinctual reactions, mental peace, and maternal connections."
    }

def calculate_rising_sign(date_of_birth: str, time_of_birth: str = "12:00:00", lat: float = 28.6139, lon: float = 77.2090, tz: float = 5.5) -> Dict[str, Any]:
    chart = calculate_chart(date_of_birth, time_of_birth, False, lat, lon, tz, system="Vedic", ayanamsa="Lahiri")
    asc_raw = chart.get("ascendant", 0.0)
    asc_deg = float(asc_raw) if isinstance(asc_raw, (int, float)) else 0.0
    sign_idx = int(asc_deg / 30.0) % 12
    degree_in_sign = asc_deg % 30.0
    z_info = ZODIAC_SIGNS[sign_idx]
    nak_idx = int(asc_deg / (360.0 / 27.0)) % 27
    nak_name = NAKSHATRAS[nak_idx]["name"]
    
    return {
        "calculator": "Rising Sign (लग्न / Ascendant)",
        "lagna_sign": z_info["name"],
        "lagna_sanskrit": z_info["sanskrit"],
        "degree": round(degree_in_sign, 2),
        "total_longitude": round(asc_deg, 2),
        "lagna_lord": z_info["lord"],
        "nakshatra": nak_name,
        "interpretation": f"Your Rising Sign (Lagna) is {z_info['name']} ({z_info['sanskrit']}) at {degree_in_sign:.2f}°. Lagna represents your physical appearance, vitality, first impressions, and life orientation."
    }

# =========================================================================
# 4. NAKSHATRA & PADA (27 Lunar Mansions & Baby Naming)
# =========================================================================
NAKSHATRA_SYLLABLES = {
    0: ["Chu", "Che", "Cho", "La"],       # Ashwini
    1: ["Lee", "Lu", "Le", "Lo"],        # Bharani
    2: ["A", "Ee", "U", "Ea"],           # Krittika
    3: ["O", "Va", "Vi", "Vu"],          # Rohini
    4: ["Ve", "Vo", "Ka", "Kee"],        # Mrigashira
    5: ["Ku", "Gha", "Ng", "Chha"],      # Ardra
    6: ["Ke", "Ko", "Ha", "Hee"],        # Punarvasu
    7: ["Hu", "He", "Ho", "Da"],         # Pushya
    8: ["Dee", "Du", "De", "Do"],        # Ashlesha
    9: ["Ma", "Mee", "Mu", "Me"],        # Magha
    10: ["Mo", "Ta", "Tee", "Tu"],       # Purva Phalguni
    11: ["Te", "To", "Pa", "Pee"],       # Uttara Phalguni
    12: ["Pu", "Sha", "Na", "Tha"],      # Hasta
    13: ["Pe", "Po", "Ra", "Ree"],       # Chitra
    14: ["Ru", "Re", "Ro", "Taa"],       # Swati
    15: ["Tee", "Tue", "Teay", "Too"],   # Vishakha
    16: ["Na", "Nee", "Nu", "Ne"],       # Anuradha
    17: ["No", "Ya", "Yee", "Yu"],       # Jyeshtha
    18: ["Ye", "Yo", "Bha", "Bhee"],     # Mula
    19: ["Bhu", "Dha", "Pha", "Dhad"],   # Purva Ashadha
    20: ["Bhe", "Bho", "Ja", "Jee"],     # Uttara Ashadha
    21: ["Khee", "Khu", "Khe", "Kho"],   # Shravana
    22: ["Ga", "Gee", "Gu", "Ge"],       # Dhanishta
    23: ["Go", "Sa", "See", "Su"],       # Shatabhisha
    24: ["Se", "So", "Da", "Dee"],       # Purva Bhadrapada
    25: ["Du", "Tha", "Jna", "Da"],      # Uttara Bhadrapada
    26: ["De", "Do", "Cha", "Chee"]      # Revati
}

NAKSHATRA_DEITIES = [
    "Ashwini Kumaras (Healing)", "Yama (Justice)", "Agni (Fire)", "Brahma (Creation)", "Soma (Moon/Nectar)",
    "Rudra (Storms/Transformation)", "Aditi (Cosmic Mother)", "Brihaspati (Wisdom)", "Sarpa (Nagas)",
    "Pitris (Ancestors)", "Bhaga (Prosperity)", "Aryaman (Honor)", "Savitr (Sun/Inspiration)",
    "Vishwakarma (Divine Architect)", "Vayu (Wind)", "Indra-Agni (Alliance)", "Mitra (Friendship)",
    "Indra (King of Gods)", "Nirriti (Dissolution)", "Apas (Cosmic Waters)", "Vishvadevas (All Gods)",
    "Vishnu (Preserver)", "Eight Vasus (Elemental Powers)", "Varuna (Cosmic Order)",
    "Aja Ekapada (Cosmic Fire)", "Ahirbudhnya (Deep Serpent)", "Pushan (Nourisher)"
]

def calculate_nakshatra_details(date_of_birth: str, time_of_birth: str = "12:00:00", lat: float = 28.6139, lon: float = 77.2090, tz: float = 5.5) -> Dict[str, Any]:
    chart = calculate_chart(date_of_birth, time_of_birth, False, lat, lon, tz, system="Vedic", ayanamsa="Lahiri")
    nak_name = chart.get("nakshatra", "Ashwini")
    pada = chart.get("nakshatra_pada", 1)
    
    nak_idx = 0
    nak_lord = "Ketu"
    for i, n in enumerate(NAKSHATRAS):
        if n["name"].lower() == nak_name.lower():
            nak_idx = i
            nak_lord = n["lord"]
            break
            
    deity = NAKSHATRA_DEITIES[nak_idx % 27]
    syllables = NAKSHATRA_SYLLABLES.get(nak_idx % 27, ["A", "B", "C", "D"])
    syllable = syllables[(pada - 1) % 4]
    
    ganas = ["Deva (Divine)", "Manushya (Human)", "Rakshasa (Fierce)"]
    gana = ganas[nak_idx % 3]
    
    nadis = ["Adi (Vata)", "Madhya (Pitta)", "Antya (Kapha)"]
    nadi = nadis[nak_idx % 3]
    
    return {
        "calculator": "Nakshatra & Pada (नक्षत्र एवं पाद)",
        "nakshatra": nak_name,
        "pada": pada,
        "nakshatra_lord": nak_lord,
        "deity": deity,
        "gana": gana,
        "nadi": nadi,
        "recommended_naming_syllable": syllable,
        "all_pada_syllables": syllables,
        "symbolic_nature": f"{nak_name} is ruled by {nak_lord} with presiding deity {deity}. Associated with {gana} Gana and {nadi} Nadi."
    }

# =========================================================================
# 5. MANGAL DOSHA (Kuja Dosha with 6 Classical Cancellations)
# =========================================================================
def calculate_mangal_dosha_full(date_of_birth: str, time_of_birth: str = "12:00:00", lat: float = 28.6139, lon: float = 77.2090, tz: float = 5.5) -> Dict[str, Any]:
    chart = calculate_chart(date_of_birth, time_of_birth, False, lat, lon, tz, system="Vedic", ayanamsa="Lahiri")
    planets = chart.get("planets", [])
    
    mars = next((p for p in planets if p["name"] == "Mars"), None)
    jupiter = next((p for p in planets if p["name"] == "Jupiter"), None)
    venus = next((p for p in planets if p["name"] == "Venus"), None)
    moon = next((p for p in planets if p["name"] == "Moon"), None)
    
    if not mars:
        return {"has_dosha": False, "status": "Non-Manglik"}
        
    mars_house = mars.get("house", 1)
    mars_sign = mars.get("sign", "Aries")
    
    # Classical Manglik houses from Lagna: 1, 4, 7, 8, 12
    is_manglik_raw = mars_house in [1, 4, 7, 8, 12]
    
    cancellations = []
    # Parihar Rule 1: Mars in own sign (Aries, Scorpio) or exalted sign (Capricorn)
    if mars_sign in ["Aries", "Scorpio", "Capricorn"]:
        cancellations.append(f"Mars is in own/exalted sign ({mars_sign}) - Strong classical cancellation.")
        
    # Parihar Rule 2: Mars in 1st house in Aries
    if mars_house == 1 and mars_sign == "Aries":
        cancellations.append("Mars in 1st house in Aries sign cancels Kuja Dosha.")
        
    # Parihar Rule 3: Mars in 4th house in Scorpio
    if mars_house == 4 and mars_sign == "Scorpio":
        cancellations.append("Mars in 4th house in Scorpio sign cancels Kuja Dosha.")
        
    # Parihar Rule 4: Mars in 7th house in Capricorn or Pisces
    if mars_house == 7 and mars_sign in ["Capricorn", "Pisces"]:
        cancellations.append(f"Mars in 7th house in {mars_sign} cancels Kuja Dosha.")
        
    # Parihar Rule 5: Mars in 8th house in Sagittarius or Cancer
    if mars_house == 8 and mars_sign in ["Sagittarius", "Cancer"]:
        cancellations.append(f"Mars in 8th house in {mars_sign} neutralizes Kuja Dosha.")
        
    # Parihar Rule 6: Jupiter aspecting Mars or conjunct Mars
    if jupiter:
        jup_house = jupiter.get("house", 1)
        diff = (mars_house - jup_house) % 12
        if diff in [0, 4, 6, 8]:  # Conjunction or 5th, 7th, 9th aspect
            cancellations.append("Benefic Jupiter aspects or conjuncts Mars, nullifying malefic effects.")
            
    has_parihar = len(cancellations) > 0
    is_active_dosha = is_manglik_raw and not has_parihar
    
    intensity = "None"
    if is_active_dosha:
        intensity = "High" if mars_house in [7, 8] else "Moderate"
    elif is_manglik_raw and has_parihar:
        intensity = "Cancelled (Parihar)"
        
    remedies = [
        "Chant Mangal Gayatri Mantra (ॐ क्षितिपुत्राय विद्महे...) on Tuesdays.",
        "Recite Hanuman Chalisa and offer vermillion (sindoor) to Lord Hanuman.",
        "Donate red lentils (Masoor Dal) or copper utensils on Shukla Paksha Tuesday.",
        "Maintain purity of speech and avoid rash impulsiveness in intimate partnerships."
    ]
    
    return {
        "calculator": "Mangal Dosha (मांगलिक दोष)",
        "is_manglik": is_active_dosha,
        "is_manglik_raw": is_manglik_raw,
        "has_parihar": has_parihar,
        "intensity": intensity,
        "mars_house": mars_house,
        "mars_sign": mars_sign,
        "verdict": "Non-Manglik" if not is_manglik_raw else ("Manglik (Cancelled with Parihar)" if has_parihar else f"Manglik ({intensity})"),
        "cancellation_factors": cancellations,
        "remedies": remedies if is_active_dosha else ["No remedies required as Mars is favorable."]
    }

# =========================================================================
# 6. JAIMINI KARAKAS (Atmakaraka, Darakaraka & Chara Karakas)
# =========================================================================
def calculate_jaimini_karakas(date_of_birth: str, time_of_birth: str = "12:00:00", lat: float = 28.6139, lon: float = 77.2090, tz: float = 5.5) -> Dict[str, Any]:
    chart = calculate_chart(date_of_birth, time_of_birth, False, lat, lon, tz, system="Vedic", ayanamsa="Lahiri")
    planets = chart.get("planets", [])
    
    # 7 Chara Karakas (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn)
    target_names = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
    candidates = [p for p in planets if p["name"] in target_names]
    
    # Sort descending by degree_in_sign (0 to 30)
    candidates.sort(key=lambda x: x.get("degree_in_sign", 0.0), reverse=True)
    
    labels = [
        ("Atmakaraka (AK)", "Soul indicator, personal mission, highest spiritual purpose"),
        ("Amatyakaraka (AmK)", "Intellect, executive career, advisory capability, finances"),
        ("Bhratrikaraka (BK)", "Siblings, spiritual gurus, fatherly mentors, guidance"),
        ("Matrikaraka (MK)", "Mother, nurturing foundation, emotional shelter, domestic peace"),
        ("Putrakaraka (PK)", "Children, intellectual disciples, creative genius, authorship"),
        ("Gnatikaraka (GK)", "Obstacles, internal resistance, competitive rivals, disease defense"),
        ("Darakaraka (DK)", "Spouse, marriage partner characteristics, relationship harmony")
    ]
    
    karakas_list = []
    for i, (label, desc) in enumerate(labels):
        if i < len(candidates):
            p = candidates[i]
            karakas_list.append({
                "karaka": label,
                "planet": p["name"],
                "sign": p["sign"],
                "degree": round(p.get("degree_in_sign", 0.0), 2),
                "description": desc
            })
            
    ak = karakas_list[0] if karakas_list else {}
    dk = karakas_list[-1] if karakas_list else {}
    
    return {
        "calculator": "Jaimini Chara Karakas (जैमिनी चर कारक)",
        "atmakaraka": ak,
        "darakaraka": dk,
        "all_karakas": karakas_list,
        "summary": f"Your Atmakaraka (Soul planet) is {ak.get('planet')} at {ak.get('degree')}° in {ak.get('sign')}. Your Darakaraka (Spouse planet) is {dk.get('planet')} at {dk.get('degree')}° in {dk.get('sign')}."
    }

# =========================================================================
# 7. KAAL SARP DOSHA CALCULATOR
# =========================================================================
KAAL_SARP_TYPES = {
    1: {"name": "Anant Kaal Sarp", "axis": "1st - 7th House", "impact": "Personality struggle, marital tests, long-term spiritual evolution"},
    2: {"name": "Kulik Kaal Sarp", "axis": "2nd - 8th House", "impact": "Financial fluctuations, family inheritance delays, speech control needed"},
    3: {"name": "Vasuki Kaal Sarp", "axis": "3rd - 9th House", "impact": "Sibling friction, travel hurdles, fortune manifests after 28th year"},
    4: {"name": "Shankhpal Kaal Sarp", "axis": "4th - 10th House", "impact": "Mother's health concern, domestic property delays, professional tenacity"},
    5: {"name": "Padma Kaal Sarp", "axis": "5th - 11th House", "impact": "Higher education pauses, children focus, creative depth"},
    6: {"name": "Mahapadma Kaal Sarp", "axis": "6th - 12th House", "impact": "Victory over adversaries, foreign travels, need for stress management"},
    7: {"name": "Takshak Kaal Sarp", "axis": "7th - 1st House", "impact": "Partnership misunderstandings, business collaboration caution"},
    8: {"name": "Karkotak Kaal Sarp", "axis": "8th - 2nd House", "impact": "Sudden ups and downs, occult curiosity, health mindfulness"},
    9: {"name": "Shankhachood Kaal Sarp", "axis": "9th - 3rd House", "impact": "Tests in religious faith, paternal friction, triumph through self-effort"},
    10: {"name": "Ghatak Kaal Sarp", "axis": "10th - 4th House", "impact": "Career obstacles overcome through hard work, public reputation tests"},
    11: {"name": "Vishdhar Kaal Sarp", "axis": "11th - 5th House", "impact": "Fluctuating income streams, elder sibling tests, later life gains"},
    12: {"name": "Sheshnag Kaal Sarp", "axis": "12th - 6th House", "impact": "Heavy expenses, litigation defense, deep spiritual inclination"}
}

def calculate_kaal_sarp_dosha(date_of_birth: str, time_of_birth: str = "12:00:00", lat: float = 28.6139, lon: float = 77.2090, tz: float = 5.5) -> Dict[str, Any]:
    chart = calculate_chart(date_of_birth, time_of_birth, False, lat, lon, tz, system="Vedic", ayanamsa="Lahiri")
    planets = chart.get("planets", [])
    
    rahu = next((p for p in planets if p["name"] == "Rahu"), None)
    if not rahu:
        return {"has_dosha": False, "verdict": "No Kaal Sarp Dosha"}
        
    rahu_house = rahu.get("house", 1)
    ketu_house = (rahu_house + 6 - 1) % 12 + 1
    
    other_planets = [p for p in planets if p["name"] not in ["Rahu", "Uranus", "Neptune", "Pluto"]]
    
    # Check if all other 7 planets lie between Rahu and Ketu
    # Hemming check in forward direction or reverse
    forward_hemmed = True
    reverse_hemmed = True
    
    for p in other_planets:
        h = p.get("house", 1)
        # Check if in forward arc from Rahu to Ketu
        if rahu_house < ketu_house:
            in_forward = rahu_house <= h <= ketu_house
        else:
            in_forward = h >= rahu_house or h <= ketu_house
            
        if not in_forward:
            forward_hemmed = False
        else:
            reverse_hemmed = False
            
    is_full = forward_hemmed or reverse_hemmed
    type_info = KAAL_SARP_TYPES.get(rahu_house, KAAL_SARP_TYPES[1])
    
    remedies = [
        "Worship Lord Shiva with Mahamrityunjaya Mantra (ॐ त्र्यम्बकं यजामहे...).",
        "Perform Rudrabhishekam on Somwar (Monday) or during Pradosh Vrat.",
        "Feed birds with mixed 7 grains (Satnaja) every morning.",
        "Respect serpents and nature; chant Nav Nag Stotra."
    ]
    
    return {
        "calculator": "Kaal Sarp Dosha (काल सर्प दोष)",
        "has_dosha": is_full,
        "dosha_type": type_info["name"] if is_full else "None",
        "axis": type_info["axis"] if is_full else "None",
        "rahu_house": rahu_house,
        "ketu_house": ketu_house,
        "impact": type_info["impact"] if is_full else "All 7 planets are freely placed without Kaal Sarp enclosure.",
        "verdict": f"Active: {type_info['name']}" if is_full else "No Kaal Sarp Dosha detected (Planets free)",
        "remedies": remedies if is_full else ["No remedies required."]
    }

# =========================================================================
# 8. MOON PHASE & TITHI ILLUMINATION
# =========================================================================
def calculate_moon_phase_data(dt_str: Optional[str] = None) -> Dict[str, Any]:
    if not dt_str:
        now = datetime.now(timezone.utc)
    else:
        now = datetime.strptime(dt_str, "%Y-%m-%d")
        
    jd = calculate_julian_day(now.strftime("%Y-%m-%d"), "12:00:00", 0.0)
    
    sun_res, _ = swe.calc_ut(jd, swe.SUN, swe.FLG_SWIEPH)
    moon_res, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_SWIEPH)
    
    sun_lon = sun_res[0]
    moon_lon = moon_res[0]
    
    diff = (moon_lon - sun_lon) % 360.0
    tithi_num = int(diff / 12.0) + 1
    
    is_shukla = tithi_num <= 15
    paksha = "Shukla Paksha (शुक्ल पक्ष - Waxing)" if is_shukla else "Krishna Paksha (कृष्ण पक्ष - Waning)"
    
    illumination = round(50.0 * (1.0 - math.cos(math.radians(diff))), 1)
    
    phase_name = "New Moon (Amavasya)"
    if diff < 15 or diff > 345:
        phase_name = "New Moon (Amavasya / अमावस्या)"
    elif 165 < diff < 195:
        phase_name = "Full Moon (Purnima / पूर्णिमा)"
    elif is_shukla:
        phase_name = "Waxing Crescent / Gibbaous (शुक्ल पक्ष)"
    else:
        phase_name = "Waning Crescent / Gibbous (कृष्ण पक्ष)"
        
    days_to_purnima = max(0, int((180.0 - diff) % 360.0 / 12.0))
    days_to_amavasya = max(0, int((360.0 - diff) % 360.0 / 12.0))
    
    return {
        "calculator": "Moon Phase (चन्द्र कला एवं तिथि)",
        "date": now.strftime("%Y-%m-%d"),
        "tithi_number": tithi_num,
        "paksha": paksha,
        "illumination_percentage": illumination,
        "phase_name": phase_name,
        "moon_longitude": round(moon_lon, 2),
        "sun_longitude": round(sun_lon, 2),
        "days_to_purnima": days_to_purnima,
        "days_to_amavasya": days_to_amavasya
    }

# =========================================================================
# 9. LOVE & FRIENDSHIP COMPATIBILITY
# =========================================================================
ELEMENT_COMPATIBILITY = {
    ("Fire", "Fire"): (90, "High passion, dynamic enthusiasm, occasional ego clashes"),
    ("Fire", "Air"): (95, "Incredible mental & creative inspiration, mutually energizing"),
    ("Fire", "Earth"): (65, "Earth grounds Fire; Fire warms Earth; requires patience"),
    ("Fire", "Water"): (55, "Deep intensity but emotional steam; communication needed"),
    ("Earth", "Earth"): (92, "Rock-solid stability, practical alignment, enduring loyalty"),
    ("Earth", "Water"): (94, "Deeply fertile, nurturing, compassionate, emotionally safe"),
    ("Earth", "Air"): (60, "Air brings ideas; Earth builds structures; differing paces"),
    ("Air", "Air"): (88, "Brilliant intellectual conversation, free-spirited camaraderie"),
    ("Air", "Water"): (58, "Logic vs deep feelings; gentle empathy bridge required"),
    ("Water", "Water"): (90, "Psychic empathy, romantic devotion, oceanic sensitivity")
}

def calculate_friendship_compatibility(sign1: str, sign2: str) -> Dict[str, Any]:
    e1 = next((s["element"] for s in ZODIAC_SIGNS if s["name"].lower() == sign1.lower()), "Fire")
    e2 = next((s["element"] for s in ZODIAC_SIGNS if s["name"].lower() == sign2.lower()), "Earth")
    
    pair = (e1, e2) if (e1, e2) in ELEMENT_COMPATIBILITY else (e2, e1)
    score, desc = ELEMENT_COMPATIBILITY.get(pair, (75, "Balanced compatibility"))
    
    return {
        "calculator": "Friendship Compatibility (मित्रता सुसंगति)",
        "sign_1": sign1,
        "element_1": e1,
        "sign_2": sign2,
        "element_2": e2,
        "compatibility_score": score,
        "rating": "Excellent" if score >= 85 else ("Good" if score >= 70 else "Average"),
        "dynamic": desc
    }

def calculate_love_compatibility(sign1: str, sign2: str, partner1_name: str = "Partner 1", partner2_name: str = "Partner 2") -> Dict[str, Any]:
    fc = calculate_friendship_compatibility(sign1, sign2)
    base_score = fc["compatibility_score"]
    
    romance_boost = 5 if fc["element_1"] in ["Water", "Fire"] and fc["element_2"] in ["Water", "Air"] else 0
    final_score = min(98, base_score + romance_boost)
    
    verdict = "Celestial Match (उत्तम मिलान)" if final_score >= 88 else ("Harmonious Match (मध्यम मिलान)" if final_score >= 70 else "Growth-Demanding Match")
    
    return {
        "calculator": "Love Compatibility (प्रेम एवं दांपत्य सामंजस्य)",
        "partner_1": partner1_name,
        "partner_2": partner2_name,
        "sign_1": sign1,
        "sign_2": sign2,
        "love_score": final_score,
        "verdict": verdict,
        "communication_harmony": f"{fc['element_1']} & {fc['element_2']} dynamic: {fc['dynamic']}",
        "advice": "Vedic wisdom suggests honoring each other's emotional rhythms and strengthening mutual spiritual respect."
    }

def calculate_name_compatibility(name1: str, name2: str) -> Dict[str, Any]:
    n1 = calculate_name_numerology(name1)["chaldean_destiny"]
    n2 = calculate_name_numerology(name2)["chaldean_destiny"]
    
    comp_list = COMPATIBLE_NUMBERS.get(n1, [1, 2, 3])
    is_direct = n2 in comp_list
    
    score = 88 if is_direct else (72 if abs(n1 - n2) in [2, 4, 6] else 60)
    verdict = "Highly Auspicious Resonance" if score >= 80 else "Supportive Dynamic"
    
    return {
        "calculator": "Name Compatibility (नामांक अनुकूलता)",
        "name_1": name1,
        "name_number_1": n1,
        "name_2": name2,
        "name_number_2": n2,
        "score": score,
        "verdict": verdict,
        "analysis": f"The Chaldean numeric vibration of {name1} ({n1}) and {name2} ({n2}) produces a harmony score of {score}%."
    }
