"""
Authentic Vedic Kundali Milan (Gun Milan - 36 Gunas) and Manglik Dosha Engine.
Implements classical Ashtakoota Milan according to Maharishi Parashara's Brihat Parashara Hora Shastra (BPHS):
1. Varna (1 Point) - Spiritual & ego compatibility
2. Vashya (2 Points) - Mutual attraction & harmony
3. Tara (3 Points) - Destiny & health/longevity
4. Yoni (4 Points) - Intimacy & biological compatibility
5. Graha Maitri (5 Points) - Psychological & friendship rapport
6. Gana (6 Points) - Temperament & behavioral nature
7. Bhakoot (7 Points) - Emotional welfare, longevity & prosperity
8. Nadi (8 Points) - Genetic compatibility & progeny health
Total: 36 Points (Gunas)
"""
from typing import Dict, Any, List, Tuple, Optional
import math

# -------------------------------------------------------------
# 1. VARNA (1 Point)
# Moon sign classification into 4 Varnas
# Brahmin: Water (Cancer, Scorpio, Pisces) - 4
# Kshatriya: Fire (Aries, Leo, Sagittarius) - 3
# Vaishya: Earth (Taurus, Virgo, Capricorn) - 2
# Shudra: Air (Gemini, Libra, Aquarius) - 1
# -------------------------------------------------------------
VARNA_MAP = {
    # Sign index 0 to 11
    3: ("Brahmin", 4), 7: ("Brahmin", 4), 11: ("Brahmin", 4),
    0: ("Kshatriya", 3), 4: ("Kshatriya", 3), 8: ("Kshatriya", 3),
    1: ("Vaishya", 2), 5: ("Vaishya", 2), 9: ("Vaishya", 2),
    2: ("Shudra", 1), 6: ("Shudra", 1), 10: ("Shudra", 1),
}

def calculate_varna(boy_sign_idx: int, girl_sign_idx: int) -> Dict[str, Any]:
    boy_varna, boy_pts = VARNA_MAP.get(boy_sign_idx % 12, ("Shudra", 1))
    girl_varna, girl_pts = VARNA_MAP.get(girl_sign_idx % 12, ("Shudra", 1))
    
    # Groom's varna should be greater than or equal to bride's varna for 1 point
    obtained = 1.0 if boy_pts >= girl_pts else 0.0
    return {
        "koota": "Varna (वर्ण)",
        "max_points": 1.0,
        "obtained_points": obtained,
        "boy_value": boy_varna,
        "girl_value": girl_varna,
        "description": "Spiritual compatibility & work-nature alignment",
        "verdict": "Auspicious (शुभ)" if obtained == 1.0 else "Inauspicious (अशुभ)"
    }

# -------------------------------------------------------------
# 2. VASHYA (2 Points)
# -------------------------------------------------------------
# Quadruped (Chatushpad): Aries(0), Taurus(1), 2nd half Sag(8), 1st half Cap(9)
# Human (Dwipada/Manav): Gemini(2), Virgo(5), Libra(6), 1st half Sag(8), Aquarius(10)
# Jalchar (Water): Cancer(3), Pisces(11), 2nd half Cap(9)
# Vanachara (Wild): Leo(4)
# Keeta (Insect): Scorpio(7)
VASHYA_MAP = {
    0: "Chatushpad", 1: "Chatushpad",
    2: "Manav", 3: "Jalchar",
    4: "Vanachara", 5: "Manav",
    6: "Manav", 7: "Keeta",
    8: "Manav", 9: "Chatushpad",
    10: "Manav", 11: "Jalchar"
}

def calculate_vashya(boy_sign_idx: int, girl_sign_idx: int) -> Dict[str, Any]:
    b_vas = VASHYA_MAP.get(boy_sign_idx % 12, "Manav")
    g_vas = VASHYA_MAP.get(girl_sign_idx % 12, "Manav")
    
    if b_vas == g_vas:
        pts = 2.0
    elif (b_vas == "Manav" and g_vas == "Chatushpad") or (b_vas == "Chatushpad" and g_vas == "Jalchar"):
        pts = 1.0
    elif b_vas == "Vanachara" or g_vas == "Vanachara":
        pts = 0.0 if b_vas != g_vas else 2.0
    elif (b_vas == "Manav" and g_vas == "Jalchar") or (b_vas == "Jalchar" and g_vas == "Manav"):
        pts = 1.0
    elif (b_vas == "Chatushpad" and g_vas == "Keeta") or (b_vas == "Keeta" and g_vas == "Chatushpad"):
        pts = 1.0
    else:
        pts = 0.5
        
    return {
        "koota": "Vashya (वश्य)",
        "max_points": 2.0,
        "obtained_points": pts,
        "boy_value": b_vas,
        "girl_value": g_vas,
        "description": "Mutual attraction, influence & dominance balance",
        "verdict": "Good (अनुकूल)" if pts >= 1.0 else "Average (सामान्य)"
    }

# -------------------------------------------------------------
# 3. TARA / DINA (3 Points)
# -------------------------------------------------------------
def calculate_tara(boy_nak_idx: int, girl_nak_idx: int) -> Dict[str, Any]:
    # Count from girl nakshatra to boy nakshatra
    girl_to_boy = ((boy_nak_idx - girl_nak_idx) % 27) + 1
    boy_to_girl = ((girl_nak_idx - boy_nak_idx) % 27) + 1
    
    rem_g2b = girl_to_boy % 9
    rem_b2g = boy_to_girl % 9
    
    # Auspicious taras: 2 (Sampat), 4 (Kshema), 6 (Sadhana), 8 (Mitra), 0 (Param Mitra/Ati-Mitra)
    # Inauspicious: 1 (Janma), 3 (Vipat), 5 (Pratyak), 7 (Vadha/Naidhana)
    g2b_good = rem_g2b in (2, 4, 6, 8, 0)
    b2g_good = rem_b2g in (2, 4, 6, 8, 0)
    
    if g2b_good and b2g_good:
        pts = 3.0
    elif g2b_good or b2g_good:
        pts = 1.5
    else:
        pts = 0.0
        
    return {
        "koota": "Tara (तारा / दिन)",
        "max_points": 3.0,
        "obtained_points": pts,
        "boy_value": f"Nakshatra #{boy_nak_idx + 1}",
        "girl_value": f"Nakshatra #{girl_nak_idx + 1}",
        "description": "Destiny, longevity, health and mutual good fortune",
        "verdict": "Very Auspicious (शुभ तारा)" if pts == 3.0 else ("Moderate (मध्यम)" if pts > 0 else "Inauspicious (अशुभ)")
    }

# -------------------------------------------------------------
# 4. YONI (4 Points)
# 14 Animal categories
# -------------------------------------------------------------
YONI_MAP = [
    "Horse",     # 0 Ashwini
    "Elephant",  # 1 Bharani
    "Sheep",     # 2 Krittika
    "Serpent",   # 3 Rohini
    "Serpent",   # 4 Mrigashira
    "Dog",       # 5 Ardra
    "Cat",       # 6 Punarvasu
    "Sheep",     # 7 Pushya
    "Cat",       # 8 Ashlesha
    "Rat",       # 9 Magha
    "Rat",       # 10 Purva Phalguni
    "Cow",       # 11 Uttara Phalguni
    "Buffalo",   # 12 Hasta
    "Tiger",     # 13 Chitra
    "Buffalo",   # 14 Swati
    "Tiger",     # 15 Vishakha
    "Deer",      # 16 Anuradha
    "Deer",      # 17 Jyeshtha
    "Dog",       # 18 Mula
    "Monkey",    # 19 Purva Ashadha
    "Mongoose",  # 20 Uttara Ashadha
    "Monkey",    # 21 Shravana
    "Lion",      # 22 Dhanishta
    "Horse",     # 23 Shatabhisha
    "Lion",      # 24 Purva Bhadrapada
    "Cow",       # 25 Uttara Bhadrapada
    "Elephant"   # 26 Revati
]

# Enemy pairs (0 points)
SWORN_ENEMIES = {
    frozenset({"Cow", "Tiger"}),
    frozenset({"Elephant", "Lion"}),
    frozenset({"Horse", "Buffalo"}),
    frozenset({"Dog", "Deer"}),
    frozenset({"Serpent", "Mongoose"}),
    frozenset({"Monkey", "Sheep"}),
    frozenset({"Cat", "Rat"}),
}

def calculate_yoni(boy_nak_idx: int, girl_nak_idx: int) -> Dict[str, Any]:
    b_yoni = YONI_MAP[boy_nak_idx % 27]
    g_yoni = YONI_MAP[girl_nak_idx % 27]
    
    pair = frozenset({b_yoni, g_yoni})
    if b_yoni == g_yoni:
        pts = 4.0
    elif pair in SWORN_ENEMIES:
        pts = 0.0
    else:
        # Friendly / neutral
        friendly_pairs = {
            frozenset({"Horse", "Elephant"}), frozenset({"Cow", "Buffalo"}),
            frozenset({"Deer", "Monkey"}), frozenset({"Elephant", "Sheep"})
        }
        if pair in friendly_pairs:
            pts = 3.0
        else:
            pts = 2.0
            
    return {
        "koota": "Yoni (योनि)",
        "max_points": 4.0,
        "obtained_points": pts,
        "boy_value": b_yoni,
        "girl_value": g_yoni,
        "description": "Biological rapport, physical attraction & intimacy compatibility",
        "verdict": "Harmonious (उत्तम)" if pts >= 3.0 else ("Neutral (सामान्य)" if pts >= 2.0 else "Hostile (शत्रु योनि)")
    }

# -------------------------------------------------------------
# 5. GRAHA MAITRI (5 Points)
# Planetary friendship of Moon sign lords
# -------------------------------------------------------------
SIGN_LORDS = [
    "Mars",    # 0 Aries
    "Venus",   # 1 Taurus
    "Mercury", # 2 Gemini
    "Moon",    # 3 Cancer
    "Sun",     # 4 Leo
    "Mercury", # 5 Virgo
    "Venus",   # 6 Libra
    "Mars",    # 7 Scorpio
    "Jupiter", # 8 Sagittarius
    "Saturn",  # 9 Capricorn
    "Saturn",  # 10 Aquarius
    "Jupiter", # 11 Pisces
]

# Natural Friendships: (Friends, Neutrals, Enemies)
PLANET_RELATIONS = {
    "Sun":     {"friends": {"Moon", "Mars", "Jupiter"}, "neutrals": {"Mercury"}, "enemies": {"Venus", "Saturn"}},
    "Moon":    {"friends": {"Sun", "Mercury"}, "neutrals": {"Mars", "Jupiter", "Venus", "Saturn"}, "enemies": set()},
    "Mars":    {"friends": {"Sun", "Moon", "Jupiter"}, "neutrals": {"Venus", "Saturn"}, "enemies": {"Mercury"}},
    "Mercury": {"friends": {"Sun", "Venus"}, "neutrals": {"Mars", "Jupiter", "Saturn"}, "enemies": {"Moon"}},
    "Jupiter": {"friends": {"Sun", "Moon", "Mars"}, "neutrals": {"Saturn"}, "enemies": {"Mercury", "Venus"}},
    "Venus":   {"friends": {"Mercury", "Saturn"}, "neutrals": {"Mars", "Jupiter"}, "enemies": {"Sun", "Moon"}},
    "Saturn":  {"friends": {"Mercury", "Venus"}, "neutrals": {"Jupiter"}, "enemies": {"Sun", "Moon", "Mars"}},
}

def calculate_graha_maitri(boy_sign_idx: int, girl_sign_idx: int) -> Dict[str, Any]:
    b_lord = SIGN_LORDS[boy_sign_idx % 12]
    g_lord = SIGN_LORDS[girl_sign_idx % 12]
    
    if b_lord == g_lord:
        pts = 5.0
    else:
        b_rel = PLANET_RELATIONS.get(b_lord, {})
        g_rel = PLANET_RELATIONS.get(g_lord, {})
        
        b_to_g = "friend" if g_lord in b_rel.get("friends", set()) else ("enemy" if g_lord in b_rel.get("enemies", set()) else "neutral")
        g_to_b = "friend" if b_lord in g_rel.get("friends", set()) else ("enemy" if b_lord in g_rel.get("enemies", set()) else "neutral")
        
        if b_to_g == "friend" and g_to_b == "friend":
            pts = 5.0
        elif (b_to_g == "friend" and g_to_b == "neutral") or (g_to_b == "friend" and b_to_g == "neutral"):
            pts = 4.0
        elif b_to_g == "neutral" and g_to_b == "neutral":
            pts = 3.0
        elif (b_to_g == "friend" and g_to_b == "enemy") or (g_to_b == "friend" and b_to_g == "enemy"):
            pts = 1.0
        elif (b_to_g == "neutral" and g_to_b == "enemy") or (g_to_b == "neutral" and b_to_g == "enemy"):
            pts = 0.5
        else:
            pts = 0.0
            
    return {
        "koota": "Graha Maitri (ग्रह मैत्री)",
        "max_points": 5.0,
        "obtained_points": pts,
        "boy_value": f"{b_lord} (Rashi Lord)",
        "girl_value": f"{g_lord} (Rashi Lord)",
        "description": "Psychological harmony, mutual respect & natural friendship",
        "verdict": "Excellent (मित्र भाव)" if pts >= 4.0 else ("Moderate (सम भाव)" if pts >= 1.0 else "Inimical (शत्रु भाव)")
    }

# -------------------------------------------------------------
# 6. GANA (6 Points)
# -------------------------------------------------------------
GANA_MAP = [
    "Deva",     # 0 Ashwini
    "Manushya", # 1 Bharani
    "Rakshasa", # 2 Krittika
    "Manushya", # 3 Rohini
    "Deva",     # 4 Mrigashira
    "Manushya", # 5 Ardra
    "Deva",     # 6 Punarvasu
    "Deva",     # 7 Pushya
    "Rakshasa", # 8 Ashlesha
    "Rakshasa", # 9 Magha
    "Manushya", # 10 Purva Phalguni
    "Manushya", # 11 Uttara Phalguni
    "Deva",     # 12 Hasta
    "Rakshasa", # 13 Chitra
    "Deva",     # 14 Swati
    "Rakshasa", # 15 Vishakha
    "Deva",     # 16 Anuradha
    "Rakshasa", # 17 Jyeshtha
    "Rakshasa", # 18 Mula
    "Manushya", # 19 Purva Ashadha
    "Manushya", # 20 Uttara Ashadha
    "Deva",     # 21 Shravana
    "Rakshasa", # 22 Dhanishta
    "Rakshasa", # 23 Shatabhisha
    "Manushya", # 24 Purva Bhadrapada
    "Manushya", # 25 Uttara Bhadrapada
    "Deva"      # 26 Revati
]

def calculate_gana(boy_nak_idx: int, girl_nak_idx: int) -> Dict[str, Any]:
    b_gana = GANA_MAP[boy_nak_idx % 27]
    g_gana = GANA_MAP[girl_nak_idx % 27]
    
    if b_gana == g_gana:
        pts = 6.0
    elif (b_gana == "Deva" and g_gana == "Manushya") or (b_gana == "Manushya" and g_gana == "Deva"):
        pts = 5.0
    elif b_gana == "Manushya" and g_gana == "Rakshasa":
        pts = 0.0
    elif b_gana == "Deva" and g_gana == "Rakshasa":
        pts = 1.0
    elif b_gana == "Rakshasa" and g_gana in ("Deva", "Manushya"):
        pts = 1.0
    else:
        pts = 0.0
        
    return {
        "koota": "Gana (गण)",
        "max_points": 6.0,
        "obtained_points": pts,
        "boy_value": b_gana,
        "girl_value": g_gana,
        "description": "Temperamental alignment, behavioral nature & lifestyle outlook",
        "verdict": "Very Compatible (अनुकूल गण)" if pts >= 5.0 else ("Acceptable (मध्यम)" if pts > 0 else "Gana Dosha (गण दोष)")
    }

# -------------------------------------------------------------
# 7. BHAKOOT (7 Points)
# Rashi relative distances
# -------------------------------------------------------------
def calculate_bhakoot(boy_sign_idx: int, girl_sign_idx: int) -> Dict[str, Any]:
    diff = ((girl_sign_idx - boy_sign_idx) % 12) + 1
    # Auspicious: 1/1, 3/11, 4/10, 7/7
    # Inauspicious: 2/12 (Dwirdwadash), 6/8 (Shadashtak), 5/9 (Navapancham)
    
    b_lord = SIGN_LORDS[boy_sign_idx % 12]
    g_lord = SIGN_LORDS[girl_sign_idx % 12]
    
    # Check cancellation rules
    # If lords are same (e.g. Aries-Scorpio Mars, Taurus-Libra Venus) or mutual friends
    same_or_friendly_lords = (b_lord == g_lord) or (
        g_lord in PLANET_RELATIONS.get(b_lord, {}).get("friends", set()) and
        b_lord in PLANET_RELATIONS.get(g_lord, {}).get("friends", set())
    )
    
    if diff in (1, 7, 3, 11, 4, 10):
        pts = 7.0
        dosha = False
        cancel = False
    else:
        # Inauspicious positioning
        if same_or_friendly_lords:
            pts = 7.0
            dosha = True
            cancel = True # Bhakoot dosha parihar
        else:
            pts = 0.0
            dosha = True
            cancel = False
            
    v_text = "Auspicious (शुभ भकूट)"
    if dosha and cancel:
        v_text = "Dosha Cancelled (भकूट दोष परिहार प्राप्त)"
    elif dosha and not cancel:
        v_text = "Bhakoot Dosha (भकूट दोष)"
        
    return {
        "koota": "Bhakoot (भकूट)",
        "max_points": 7.0,
        "obtained_points": pts,
        "boy_value": f"Sign #{boy_sign_idx + 1}",
        "girl_value": f"Sign #{girl_sign_idx + 1} ({diff}/{(14 - diff) % 12 or 12})",
        "description": "Emotional welfare, prosperity, family expansion and financial growth",
        "verdict": v_text
    }

# -------------------------------------------------------------
# 8. NADI (8 Points)
# Progeny and genetics
# -------------------------------------------------------------
NADI_MAP = [
    "Aadi",    # 0 Ashwini
    "Madhya",  # 1 Bharani
    "Antya",   # 2 Krittika
    "Antya",   # 3 Rohini
    "Madhya",  # 4 Mrigashira
    "Aadi",    # 5 Ardra
    "Aadi",    # 6 Punarvasu
    "Madhya",  # 7 Pushya
    "Antya",   # 8 Ashlesha
    "Antya",   # 9 Magha
    "Madhya",  # 10 Purva Phalguni
    "Aadi",    # 11 Uttara Phalguni
    "Aadi",    # 12 Hasta
    "Madhya",  # 13 Chitra
    "Antya",   # 14 Swati
    "Antya",   # 15 Vishakha
    "Madhya",  # 16 Anuradha
    "Aadi",    # 17 Jyeshtha
    "Aadi",    # 18 Mula
    "Madhya",  # 19 Purva Ashadha
    "Antya",   # 20 Uttara Ashadha
    "Antya",   # 21 Shravana
    "Madhya",  # 22 Dhanishta
    "Aadi",    # 23 Shatabhisha
    "Aadi",    # 24 Purva Bhadrapada
    "Madhya",  # 25 Uttara Bhadrapada
    "Antya"    # 26 Revati
]

def calculate_nadi(boy_nak_idx: int, girl_nak_idx: int, boy_sign_idx: int, girl_sign_idx: int) -> Dict[str, Any]:
    b_nadi = NADI_MAP[boy_nak_idx % 27]
    g_nadi = NADI_MAP[girl_nak_idx % 27]
    
    if b_nadi != g_nadi:
        pts = 8.0
        verdict = "Auspicious (उत्कृष्ट नाड़ी मिलान)"
    else:
        # Check classic Nadi Dosha cancellations:
        # 1. Same Rashi but different Nakshatras
        # 2. Same Nakshatra but different Rashis (e.g. Krittika in Aries vs Taurus)
        # 3. Same Nakshatra with different Padas
        if boy_sign_idx == girl_sign_idx and boy_nak_idx != girl_nak_idx:
            pts = 8.0
            verdict = "Nadi Dosha Cancelled (समान राशि भिन्न नक्षत्र परिहार)"
        else:
            pts = 0.0
            verdict = "Nadi Dosha Present (नाड़ी दोष)"
            
    return {
        "koota": "Nadi (नाड़ी)",
        "max_points": 8.0,
        "obtained_points": pts,
        "boy_value": b_nadi,
        "girl_value": g_nadi,
        "description": "Genetic harmony, progeny health, physiological vitality",
        "verdict": verdict
    }

# -------------------------------------------------------------
# 9. MANGLIK DOSHA (KUJA DOSHA) CHECKER
# -------------------------------------------------------------
def check_manglik_dosha(chart_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Checks Mars in houses 1, 2, 4, 7, 8, 12 from Lagna, Moon, and Venus.
    Applies classical parihar (cancellation) rules.
    """
    cd = chart_data.get("chart_data") if isinstance(chart_data.get("chart_data"), dict) else chart_data
    planets_list = cd.get("planets", []) if isinstance(cd, dict) else []
    planets = {p["name"]: p for p in planets_list if isinstance(p, dict) and "name" in p}
    mars = planets.get("Mars")
    moon = planets.get("Moon")
    venus = planets.get("Venus")
    asc_sign = cd.get("ascendant_sign", "")
    
    if not mars:
        return {"is_manglik": False, "intensity": "None", "reason": "Mars data unavailable"}
        
    mars_house = mars.get("house", 1)
    mars_sign = mars.get("sign", "")
    
    # Houses from Lagna that cause Manglik dosha
    manglik_houses = {1, 2, 4, 7, 8, 12}
    is_lagna_manglik = mars_house in manglik_houses
    
    # Calculate houses from Moon and Venus
    moon_house = moon.get("house", 1) if moon else 1
    venus_house = venus.get("house", 1) if venus else 1
    
    mars_from_moon = ((mars_house - moon_house) % 12) + 1
    mars_from_venus = ((mars_house - venus_house) % 12) + 1
    
    is_chandra_manglik = mars_from_moon in manglik_houses
    is_shukra_manglik = mars_from_venus in manglik_houses
    
    is_manglik_raw = is_lagna_manglik or is_chandra_manglik
    
    # Cancellation rules (Parihar):
    # 1. Mars in Aries in 1st house
    # 2. Mars in Scorpio in 4th house
    # 3. Mars in Capricorn (Exalted) in any house
    # 4. Mars in Cancer (Debilitated) in 7th/8th
    # 5. Mars in Sagittarius/Pisces in 8th
    # 6. Mars in Aquarius in 12th
    cancellations = []
    if mars_sign == "Capricorn":
        cancellations.append("Mars is Exalted (उच्च का मंगल) - Dosha neutralized")
    if mars_sign == "Aries" and mars_house == 1:
        cancellations.append("Mars in own sign (Mesha) in Lagna - Parihar")
    if mars_sign == "Scorpio" and mars_house == 4:
        cancellations.append("Mars in own sign (Vrishchika) in 4th - Parihar")
    if mars_house == 7 and mars_sign in ("Cancer", "Capricorn"):
        cancellations.append("7th house Mars special parihar")
    if mars_house == 8 and mars_sign in ("Sagittarius", "Pisces"):
        cancellations.append("8th house Jupiterian sign parihar")
        
    is_cancelled = len(cancellations) > 0
    
    if not is_lagna_manglik and not is_chandra_manglik:
        status = "Non-Manglik (अमांगलिक)"
        intensity = "None"
    elif is_cancelled:
        status = "Manglik with Full Parihar (मांगलिक दोष परिहार प्राप्त)"
        intensity = "Neutralized"
    elif is_lagna_manglik and is_chandra_manglik:
        status = "Double Manglik (पूर्ण मांगलिक)"
        intensity = "High"
    elif is_lagna_manglik:
        status = "Lagna Manglik (लग्नानुसार मांगलिक)"
        intensity = "Moderate"
    else:
        status = "Chandra Manglik (चंद्रानुसार आंशिक मांगलिक)"
        intensity = "Mild"
        
    return {
        "is_manglik": is_manglik_raw and not is_cancelled,
        "raw_manglik": is_manglik_raw,
        "is_cancelled": is_cancelled,
        "cancellations": cancellations,
        "status": status,
        "intensity": intensity,
        "mars_house_lagna": mars_house,
        "mars_house_moon": mars_from_moon,
        "mars_sign": mars_sign
    }

# -------------------------------------------------------------
# 10. COMPLETE KUNDALI MILAN ORCHESTRATOR
# -------------------------------------------------------------
def perform_kundali_milan(
    boy_chart_data: Dict[str, Any],
    girl_chart_data: Dict[str, Any],
    boy_name: str = "Groom (वर)",
    girl_name: str = "Bride (वधू)"
) -> Dict[str, Any]:
    """
    Computes complete 36 Guna Ashtakoota Milan and Manglik compatibility.
    """
    # Extract Moon signs and Nakshatras safely
    cd_b = boy_chart_data.get("chart_data") if isinstance(boy_chart_data.get("chart_data"), dict) else boy_chart_data
    cd_g = girl_chart_data.get("chart_data") if isinstance(girl_chart_data.get("chart_data"), dict) else girl_chart_data

    planets_list_b = cd_b.get("planets", []) if isinstance(cd_b, dict) else []
    planets_list_g = cd_g.get("planets", []) if isinstance(cd_g, dict) else []

    planets_b = {p["name"]: p for p in planets_list_b if isinstance(p, dict) and "name" in p}
    planets_g = {p["name"]: p for p in planets_list_g if isinstance(p, dict) and "name" in p}
    
    moon_b = planets_b.get("Moon", {})
    moon_g = planets_g.get("Moon", {})
    
    # Calculate indices
    # Nakshatra index from longitude
    deg_b = moon_b.get("longitude", 0.0)
    deg_g = moon_g.get("longitude", 0.0)
    
    nak_idx_b = int((deg_b % 360.0) // (360.0 / 27.0))
    nak_idx_g = int((deg_g % 360.0) // (360.0 / 27.0))
    
    sign_idx_b = int((deg_b % 360.0) // 30.0)
    sign_idx_g = int((deg_g % 360.0) // 30.0)
    
    # Calculate 8 Kootas
    varna = calculate_varna(sign_idx_b, sign_idx_g)
    vashya = calculate_vashya(sign_idx_b, sign_idx_g)
    tara = calculate_tara(nak_idx_b, nak_idx_g)
    yoni = calculate_yoni(nak_idx_b, nak_idx_g)
    graha_maitri = calculate_graha_maitri(sign_idx_b, sign_idx_g)
    gana = calculate_gana(nak_idx_b, nak_idx_g)
    bhakoot = calculate_bhakoot(sign_idx_b, sign_idx_g)
    nadi = calculate_nadi(nak_idx_b, nak_idx_g, sign_idx_b, sign_idx_g)
    
    kootas = [varna, vashya, tara, yoni, graha_maitri, gana, bhakoot, nadi]
    total_score = sum(k["obtained_points"] for k in kootas)
    
    # Manglik analysis for both
    manglik_b = check_manglik_dosha(boy_chart_data)
    manglik_g = check_manglik_dosha(girl_chart_data)
    
    # Mutual Manglik compatibility
    # Rule: If both are Manglik, dosha is canceled!
    both_manglik = manglik_b["is_manglik"] and manglik_g["is_manglik"]
    manglik_mismatch = (manglik_b["is_manglik"] != manglik_g["is_manglik"])
    
    # Overall Verdict
    if total_score >= 28.0 and not manglik_mismatch:
        verdict = "Sarvottam Milan (सर्वोत्तम मिलान / Highly Recommended)"
        recommendation = "दाम्पत्य जीवन अत्यंत सुखमय, समृद्ध और दीर्घायु रहेगा। दोनों की कुंडलियां अत्यंत उत्तम मेल खाती हैं।"
        category = "excellent"
    elif total_score >= 18.0 and not manglik_mismatch:
        verdict = "Madhyam Milan (मध्यम मिलान / Auspicious & Acceptable)"
        recommendation = "विवाह के लिए शुभ एवं उत्तम मिलान है। 18 से अधिक गुण प्राप्त हुए हैं। दांपत्य जीवन में सामंजस्य रहेगा।"
        category = "good"
    elif total_score >= 18.0 and manglik_mismatch:
        verdict = "Madhyam Milan with Manglik Consideration (मांगलिक विचारणीय)"
        recommendation = "गुण मिलान शुभ (18+) है, परन्तु एक पक्ष में मांगलिक प्रभाव है। कुंभ विवाह या मंगल शांति अनुष्ठान के बाद विवाह शुभ फलदायी होगा।"
        category = "warning"
    else:
        verdict = "Asadhya / Varjya Milan (अशुभ मिलान / Remedial Consultation Required)"
        recommendation = "18 से कम गुण प्राप्त हुए हैं अथवा गंभीर नाड़ी/भकूट दोष है। अनुभवी ज्योतिषी से विशेष शांति अनुष्ठान पर परामर्श अवश्य लें।"
        category = "danger"
        
    return {
        "boy_name": boy_name,
        "girl_name": girl_name,
        "total_score": round(total_score, 1),
        "max_score": 36.0,
        "percentage": round((total_score / 36.0) * 100, 1),
        "verdict": verdict,
        "recommendation": recommendation,
        "category": category,
        "kootas": kootas,
        "boy_summary": {
            "rashi": boy_chart_data.get("chart_data", {}).get("moon_sign") or boy_chart_data.get("moon_sign", "Aries"),
            "nakshatra": boy_chart_data.get("chart_data", {}).get("moon_nakshatra") or boy_chart_data.get("moon_nakshatra", "Ashwini"),
            "lagna": boy_chart_data.get("chart_data", {}).get("ascendant_sign") or boy_chart_data.get("ascendant_sign", "Aries"),
            "manglik": manglik_b
        },
        "girl_summary": {
            "rashi": girl_chart_data.get("chart_data", {}).get("moon_sign") or girl_chart_data.get("moon_sign", "Taurus"),
            "nakshatra": girl_chart_data.get("chart_data", {}).get("moon_nakshatra") or girl_chart_data.get("moon_nakshatra", "Bharani"),
            "lagna": girl_chart_data.get("chart_data", {}).get("ascendant_sign") or girl_chart_data.get("ascendant_sign", "Taurus"),
            "manglik": manglik_g
        },
        "manglik_compatibility": {
            "both_manglik": both_manglik,
            "mismatch": manglik_mismatch,
            "note": "Both partners are Manglik — mutual cancellation applies!" if both_manglik else (
                "One partner has active Manglik dosha — remedies recommended" if manglik_mismatch else "No Manglik conflict"
            )
        }
    }
