"""
Traditional astrological interpretations and astrological synthesis rules.
Kept strictly separate from raw astronomical calculations.
Provides multilingual interpretations (English and Hindi).
"""
from typing import Dict, Any, List
from datetime import datetime

LAGNA_INTERPRETATIONS = {
    "Aries": {
        "en": "Dynamic, courageous, pioneering, and natural leadership instincts. You possess high energy and direct communication.",
        "hi": "साहसी, ऊर्जावान, स्वतंत्र विचार वाले और स्वाभाविक नेतृत्व क्षमता रखने वाले।"
    },
    "Taurus": {
        "en": "Reliable, patient, grounded, with a strong aesthetic sense and dedication to financial stability.",
        "hi": "स्थिर, धैर्यवान, कलाप्रेमी और आर्थिक सुरक्षा को महत्व देने वाले।"
    },
    "Gemini": {
        "en": "Intellectually curious, versatile, communicative, with quick analytical abilities and adaptability.",
        "hi": "जिज्ञासु, वाकपटु, बहुमुखी प्रतिभा के धनी और त्वरित विश्लेषण करने वाले।"
    },
    "Cancer": {
        "en": "Intuitive, nurturing, empathetic, deeply connected to family and emotional security.",
        "hi": "भावुक, संवेदनशील, परिवार-उन्मुख और तीव्र अंतर्ज्ञान रखने वाले।"
    },
    "Leo": {
        "en": "Charismatic, magnanimous, confident, driven by self-expression and natural authority.",
        "hi": "तेजस्वी, आत्मविश्वासी, उदार और स्वाभाविक रूप से प्रभावशाली व्यक्तित्व।"
    },
    "Virgo": {
        "en": "Analytical, meticulous, service-oriented, possessing sharp attention to detail and practical intellect.",
        "hi": "विश्लेषणात्मक, सूक्ष्मदर्शी, व्यावहारिक और कार्यकुशल।"
    },
    "Libra": {
        "en": "Diplomatic, harmonious, just, seeking balance in partnerships and possessing refined artistic tastes.",
        "hi": "संतुलित, न्यायप्रिय, कलात्मक और मधुर संबंधों को प्राथमिकता देने वाले।"
    },
    "Scorpio": {
        "en": "Intense, perceptive, transformative, possessing powerful emotional resilience and investigative depth.",
        "hi": "दृढ़ संकल्पी, रहस्यमयी, तीव्र एकाग्रता और परिवर्तनकारी शक्ति संपन्न।"
    },
    "Sagittarius": {
        "en": "Philosophical, optimistic, truth-seeking, with a natural inclination for higher learning and exploration.",
        "hi": "ज्ञानपिपासु, आशावादी, धर्मपरायण और उच्च शिक्षा व यात्राओं में रुचि रखने वाले।"
    },
    "Capricorn": {
        "en": "Disciplined, pragmatic, ambitious, focused on long-term achievement and structural organization.",
        "hi": "अनुशासित, कर्मठ, धैर्यवान और दीर्घकालिक लक्ष्यों के प्रति समर्पित।"
    },
    "Aquarius": {
        "en": "Humanitarian, visionary, innovative, valuing intellectual freedom and societal advancement.",
        "hi": "प्रगतिशील, नवप्रवर्तक, सामाजिक सरोकारों से जुड़े और स्वतंत्र विचारक।"
    },
    "Pisces": {
        "en": "Compassionate, spiritual, imaginative, with deep empathy and connection to universal ideals.",
        "hi": "दयालु, आध्यात्मिक, कल्पनाशील और उच्च आंतरिक संवेदना से युक्त।"
    }
}

PLANET_HOUSE_SIGNIFICANCES = {
    1: "Self, physical vitality, outward personality, and life path.",
    2: "Wealth, family values, speech, and accumulated assets.",
    3: "Courage, communication, siblings, and creative enterprise.",
    4: "Mother, home, inner contentment, vehicles, and real estate.",
    5: "Intellect, creativity, progeny, past-life merits (purva punya), and speculation.",
    6: "Daily work, health management, overcoming obstacles, and service.",
    7: "Marriage, long-term partnerships, public relations, and contracts.",
    8: "Longevity, sudden transformations, occult knowledge, and shared resources.",
    9: "Dharma, fortune (bhagya), higher philosophy, father, and spiritual guides.",
    10: "Career, reputation (karma), achievements, and societal status.",
    11: "Gains (labha), network circles, aspirational fulfillment, and elder siblings.",
    12: "Spiritual liberation (moksha), foreign travels, meditation, and expenditure."
}

def generate_interpretations(chart_data: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    """
    Synthesizes traditional interpretations based on calculated chart data.
    """
    lang = "hi" if language == "hi" else "en"

    asc_sign = chart_data.get("ascendant_sign", "Aries")
    moon_sign = chart_data.get("moon_sign", "Taurus")
    sun_sign = chart_data.get("sun_sign", "Leo")
    planets = chart_data.get("planets", [])
    dashas = chart_data.get("dashas", [])

    # Lagna reading
    lagna_info = LAGNA_INTERPRETATIONS.get(asc_sign, LAGNA_INTERPRETATIONS["Aries"])
    lagna_summary = lagna_info.get(lang, lagna_info["en"])

    # Planetary placement insights
    planetary_insights = []
    for p in planets:
        p_name = p["name"]
        p_house = p["house"]
        p_sign = p["sign"]
        p_retro = " (Vakri/Retrograde)" if p.get("is_retrograde") else ""

        house_meaning = PLANET_HOUSE_SIGNIFICANCES.get(p_house, "Life department")
        if lang == "hi":
            planetary_insights.append(
                f"{p_name}{p_retro} {p_sign} राशि में भाव {p_house} में स्थित है। यह {house_meaning} को प्रभावित करता है।"
            )
        else:
            planetary_insights.append(
                f"{p_name}{p_retro} is situated in {p_sign} in House {p_house}, impacting {house_meaning}"
            )

    # Current Dasha estimation
    today_str = datetime.now().strftime("%Y-%m-%d")
    current_dasha = None
    for d in dashas:
        if d["start_date"] <= today_str <= d["end_date"]:
            current_dasha = d
            break
    if not current_dasha and dashas:
        current_dasha = dashas[0]

    dasha_summary = ""
    if current_dasha:
        planet_lord = current_dasha["planet"]
        if lang == "hi":
            dasha_summary = f"वर्तमान में {planet_lord} की महादशा प्रभावी है ({current_dasha['start_date']} से {current_dasha['end_date']} तक)। यह समय आत्म-विकास और सतर्कता का है।"
        else:
            dasha_summary = f"Currently running Vimshottari Mahadasha of {planet_lord} ({current_dasha['start_date']} to {current_dasha['end_date']}). This planetary period highlights the themes of {planet_lord}."

    return {
        "ascendant_summary": lagna_summary,
        "moon_sign_profile": f"Moon in {moon_sign} defines emotional instincts and inner mind orientation.",
        "sun_sign_profile": f"Sun in {sun_sign} highlights core vitality, willpower, and professional soul-purpose.",
        "current_dasha_summary": dasha_summary,
        "planetary_insights": planetary_insights,
        "disclaimer": "These traditional astrological readings are structured cultural interpretations based on classical Jyotish tenets and are provided for educational and guidance purposes."
    }
