"""Traditional rashi-lord remedies and weekday/tithi seva suggestions for Mandir Seva and Astro Mall.

This is classical Vedic guidance (rashi lord -> gemstone, deity, temple); it is shown as tradition,
never as a guarantee of outcome.
"""
from typing import Any, Dict, Optional

SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius",
         "Capricorn", "Aquarius", "Pisces"]
SIGNS_HI = ["मेष", "वृषभ", "मिथुन", "कर्क", "सिंह", "कन्या", "तुला", "वृश्चिक", "धनु", "मकर", "कुंभ", "मीन"]
SIGN_LORDS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
              "Saturn", "Jupiter"]

# lord -> (hindi name, gemstone words to match in the catalog, product categories, deity, temple slug, weekday)
LORD_REMEDY: Dict[str, Dict[str, Any]] = {
    "Sun": {"hi": "सूर्य", "gem": "माणिक्य (Ruby)", "gem_en": "Ruby", "deity_en": "Lord Shri Ram / Surya Dev", "match": ["माणिक", "ruby"], "deity": "भगवान श्री राम / सूर्य देव",
            "temple": "ram-janmabhoomi-ayodhya", "day": "Sunday"},
    "Moon": {"hi": "चंद्र", "gem": "मोती (Pearl)", "gem_en": "Pearl", "deity_en": "Lord Shiva", "match": ["मोती", "pearl", "स्फटिक"], "deity": "भगवान शिव",
             "temple": "somnath-jyotirlinga-gujarat", "day": "Monday"},
    "Mars": {"hi": "मंगल", "gem": "मूंगा (Red Coral)", "gem_en": "Red Coral", "deity_en": "Lord Hanuman", "match": ["मूंगा", "coral", "हनुमान"], "deity": "श्री हनुमान जी",
             "temple": "mahakaleshwar-ujjain", "day": "Tuesday"},
    "Mercury": {"hi": "बुध", "gem": "पन्ना (Emerald)", "gem_en": "Emerald", "deity_en": "Lord Shri Ganesh", "match": ["पन्ना", "emerald"], "deity": "भगवान श्री गणेश",
                "temple": "siddhivinayak-mumbai", "day": "Wednesday"},
    "Jupiter": {"hi": "गुरु", "gem": "पुखराज (Yellow Sapphire)", "gem_en": "Yellow Sapphire", "deity_en": "Lord Vishnu", "match": ["पुखराज", "sapphire", "तुलसी"],
                "deity": "भगवान विष्णु", "temple": "tirupati-balaji-andhra", "day": "Thursday"},
    "Venus": {"hi": "शुक्र", "gem": "हीरा / ओपल (Diamond / Opal)", "gem_en": "Diamond / Opal", "deity_en": "Goddess Lakshmi / Devi", "match": ["हीरा", "ओपल", "स्फटिक", "कमलगट्टा"],
              "deity": "मां लक्ष्मी / देवी", "temple": "vaishno-devi-katra", "day": "Friday"},
    "Saturn": {"hi": "शनि", "gem": "नीलम (Blue Sapphire)", "gem_en": "Blue Sapphire", "deity_en": "Lord Shani Dev", "match": ["नीलम", "रुद्राक्ष", "शनि"], "deity": "भगवान शनिदेव",
               "temple": "shani-shingnapur", "day": "Saturday"},
}

# weekday -> (Hindi deity, English deity, temple slug)
WEEKDAY_SEVA = {
    "Monday": ("भगवान शिव", "Lord Shiva", "kashi-vishwanath-varanasi"),
    "Tuesday": ("श्री हनुमान जी", "Lord Hanuman", "mahakaleshwar-ujjain"),
    "Wednesday": ("भगवान श्री गणेश", "Lord Ganesh", "siddhivinayak-mumbai"),
    "Thursday": ("भगवान विष्णु", "Lord Vishnu", "tirupati-balaji-andhra"),
    "Friday": ("मां लक्ष्मी व देवी", "Goddess Lakshmi & Devi", "vaishno-devi-katra"),
    "Saturday": ("भगवान शनिदेव", "Lord Shani Dev", "shani-shingnapur"),
    "Sunday": ("भगवान श्री राम / सूर्य देव", "Lord Shri Ram / Surya Dev", "ram-janmabhoomi-ayodhya"),
}

# tithi keyword -> (Hindi name, Hindi note, English name, English note, temple slug)
TITHI_SPECIAL = {
    "Ekadashi": ("एकादशी", "भगवान विष्णु का व्रत व पूजन", "Ekadashi", "Fast and worship of Lord Vishnu", "tirupati-balaji-andhra"),
    "Trayodashi": ("त्रयोदशी / प्रदोष", "प्रदोष काल में शिव अभिषेक", "Trayodashi / Pradosh", "Shiva abhishek during Pradosh kaal", "kashi-vishwanath-varanasi"),
    "Chaturthi": ("चतुर्थी", "गणेश पूजन व संकष्टी", "Chaturthi", "Ganesh puja and Sankashti", "siddhivinayak-mumbai"),
    "Purnima": ("पूर्णिमा", "सत्यनारायण व चंद्र पूजन", "Purnima", "Satyanarayan and Moon worship", "somnath-jyotirlinga-gujarat"),
    "Amavasya": ("अमावस्या", "पितृ शांति व दान", "Amavasya", "Pitru shanti and charity", "jagannath-temple-puri"),
    "Chaturdashi": ("चतुर्दशी", "शिव आराधना (मासिक शिवरात्रि)", "Chaturdashi", "Shiva worship (Masik Shivratri)", "mahakaleshwar-ujjain"),
    "Ashtami": ("अष्टमी", "देवी पूजन", "Ashtami", "Devi worship", "kamakhya-devi-assam"),
    "Navami": ("नवमी", "श्री राम / देवी पूजन", "Navami", "Shri Ram / Devi worship", "ram-janmabhoomi-ayodhya"),
}


def normalize_sign(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    v = str(value).strip()
    for en, hi in zip(SIGNS, SIGNS_HI):
        if v.lower().startswith(en.lower()) or v.startswith(hi):
            return en
    return None


def remedy_for_sign(sign_en: str) -> Dict[str, Any]:
    lord = SIGN_LORDS[SIGNS.index(sign_en)]
    return {"sign": sign_en, "sign_hi": SIGNS_HI[SIGNS.index(sign_en)], "lord": lord, **LORD_REMEDY[lord]}


def tithi_special(tithi_name: str, english: bool = False) -> Optional[Dict[str, str]]:
    for key, (hi, note_hi, en, note_en, slug) in TITHI_SPECIAL.items():
        if key.lower() in (tithi_name or "").lower():
            return {"name": en if english else hi, "note": note_en if english else note_hi, "temple": slug}
    return None
