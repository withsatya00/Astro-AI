"""Single chadhava items (flower ₹5, matchbox ₹5, diya ...) and puja tiers for every temple.

Each temple gets the items devotees most commonly offer to its deity, the most-offered ones flagged ``popular`` so
they are listed first (for example Ayodhya leads with diya, tulsi dal and pitambar). ``seed_temple_items`` is
idempotent: it only adds rows that are missing, so prices an admin has edited are never overwritten.
"""
from typing import Any, Dict, List, Tuple

# key -> (emoji, hindi title, english title, price in rupees)
ITEMS: Dict[str, Tuple[str, str, str, float]] = {
    "belpatra_108": ("🍃", "108 बेलपत्र अर्पण", "108 Bilva Patra", 51),
    "belpatra": ("🍃", "बिल्वपत्र (बेलपत्र)", "Bilva leaves", 11),
    "gangajal": ("💧", "पवित्र गंगाजल अभिषेक", "Sacred Gangajal Abhishek", 21),
    "milk": ("🥛", "कच्चा गाय का दूध (दुग्धाभिषेक)", "Cow Milk Dugdhabhishek", 31),
    "panchamrit": ("🍯", "पंचामृत अर्पण (दूध, दही, घी, शहद, गंगाजल)", "Panchamrit Abhishek", 51),
    "bhasma": ("🕉️", "पवित्र भस्म अर्पण", "Sacred Bhasma Offering", 21),
    "ghee_diya": ("🪔", "अखंड देशी घी का दीपक", "Akhand Desi Ghee Diya", 51),
    "dhatura": ("🌸", "धतूरा व आंकड़े के पुष्प", "Dhatura & Akada Flowers", 21),
    "mala": ("💐", "सुगंधित ताजे फूलों की माला", "Fresh Flower Garland", 31),
    "dhoop": ("🌿", "गुग्गुल धूप व अगरबत्ती", "Guggul Dhoop & Agarbatti", 21),
    "mustard_oil": ("🛢️", "शुद्ध सरसों का तेल व काले तिल", "Mustard Oil & Black Til", 51),
    "chola": ("🔴", "सिंदूर व चोला अर्पण", "Sindoor & Chola Offering", 51),
    "shringar": ("🧣", "लाल चुनरी, नारियल व 16 श्रृंगार", "Chunri, Coconut & 16 Shringar", 101),
    "durva": ("🌱", "दूर्वा घास व मोदक अर्पण", "Durva Grass & Modak", 51),
    "makhan": ("🌿", "तुलसी दल व माखन-मिश्री", "Tulsi Dal & Makhan-Mishri", 51),
    "bhog": ("🍛", "विशेष महाभोग थाली / पंचमेवा प्रसाद", "Mahabhog Thali & Panchmewa", 151),
    "dhwaja": ("🚩", "केसरिया धर्म ध्वजा", "Saffron Dharma Dhwaja", 51),
    "vastra": ("🧵", "पीतांबर / पवित्र वस्त्र अर्पण", "Pitambar / Holy Vastra", 101),
    "flower": ("🌼", "ताजे गेंदा व गुलाब पुष्प", "Fresh Flowers", 11),
    "tulsi": ("🌿", "पवित्र तुलसी दल", "Tulsi leaves", 11),
    "diya": ("🪔", "मिट्टी का पावन दीप", "Clay diya", 11),
    "agarbatti": ("🪔", "सुगंधित अगरबत्ती", "Incense sticks", 11),
    "kapoor": ("✨", "शुद्ध भीमसेनी कपूर", "Camphor", 11),
    "roli": ("🔴", "रोली-चावल व अक्षत", "Roli & rice", 11),
    "chandan": ("🟤", "अष्टगंध चंदन", "Chandan", 31),
    "coconut": ("🥥", "श्रीफल (नारियल)", "Coconut", 31),
    "mishri": ("🍬", "पंचमेवा व मिश्री भोग", "Mishri & Panchmewa", 21),
    "til": ("⚫", "काले तिल", "Black sesame", 21),
    "urad": ("⚫", "उड़द दाल", "Urad dal", 21),
    "modak": ("🟡", "मोदक", "Modak", 51),
    "laddu": ("🟡", "बेसन के लड्डू प्रसाद", "Laddu prasad", 51),
}

# Ready-to-Offer Thali Combos
THALI_COMBOS = [
    {
        "id": "combo_panchopchar",
        "slug": "combo-panchopchar",
        "title": "पंचोपचार चढ़ावा थाली",
        "title_en": "Panchopchar Offering Thali",
        "price": 101,
        "emoji": "🪔",
        "tag": "पारंपरिक नित्य सेवा",
        "tag_en": "Traditional Daily Seva",
        "description": "गंध (चंदन), पुष्प, गुग्गुल धूप, देशी घी दीपक एवं नैवेद्य (मिश्री/फल) का संपूर्ण शास्त्रीय पंचोपचार अर्पण।",
        "description_en": "Complete 5-fold scriptural offering: Chandan, Fresh Flowers, Guggul Dhoop, Ghee Diya and Naivedya.",
        "items_included": ["अष्टगंध चंदन", "ताजे पुष्प", "गुग्गुल धूप", "देशी घी दीपक", "नैवेद्य/मिश्री"],
        "items_included_en": ["Chandan", "Fresh Flowers", "Guggul Dhoop", "Desi Ghee Lamp", "Naivedya"]
    },
    {
        "id": "combo_rudra_abhishek",
        "slug": "combo-rudra-abhishek",
        "title": "रुद्र अभिषेक व भस्म अर्पण थाली",
        "title_en": "Rudra Abhishek & Bhasma Thali",
        "price": 251,
        "emoji": "🔱",
        "tag": "महाकाल व शिव विशेष",
        "tag_en": "Mahakal & Shiva Special",
        "description": "पवित्र गंगाजल, कच्चा गाय का दूध, पंचामृत, 108 बेलपत्र, सिद्ध भस्म एवं अखंड देशी घी दीपक अर्पण।",
        "description_en": "Holy Gangajal, raw cow milk, panchamrit, 108 bilva patra, energized bhasma & akhand pure ghee lamp dedication.",
        "items_included": ["पवित्र गंगाजल", "कच्चा गाय का दूध", "पंचामृत", "108 बेलपत्र", "सिद्ध भस्म", "अखंड देशी घी दीपक"],
        "items_included_en": ["Gangajal", "Raw Cow Milk", "Panchamrit", "108 Bilva Patra", "Sacred Bhasma", "Akhand Lamp"]
    },
    {
        "id": "combo_mahabhog_shringar",
        "slug": "combo-mahabhog-shringar",
        "title": "संपूर्ण महाभोग व श्रृंगार थाली",
        "title_en": "Sampoorna Mahabhog & Shringar Thali",
        "price": 501,
        "emoji": "🌺",
        "tag": "सर्वमनोकामना सिद्धि",
        "tag_en": "All Desires Fulfilled",
        "description": "विशेष महाभोग थाली (पंचमेवा व मिष्ठान), 16 श्रृंगार सामग्री / पीतांबर वस्त्र, सुगंधित ताजे फूलों की माला, नारियल एवं धूप-दीप।",
        "description_en": "Grand Mahabhog Thali (Panchmewa & Sweets), 16 Shringar Set / Pitambar Vastra, Fresh Garland, Coconut & Dhoop-Deep.",
        "items_included": ["विशेष महाभोग थाली", "16 श्रृंगार / पीतांबर वस्त्र", "सुगंधित पुष्पमाला", "श्रीफल नारियल", "अखंड दीप व धूप"],
        "items_included_en": ["Mahabhog Thali", "16 Shringar / Pitambar", "Fresh Garland", "Coconut", "Akhand Lamp & Dhoop"]
    }
]

# Items for each deity theme, in display order. The first ``POPULAR`` entries are flagged popular.
POPULAR = 4
THEMES: Dict[str, List[str]] = {
    "shiva": ["belpatra_108", "gangajal", "milk", "panchamrit", "bhasma", "ghee_diya", "dhatura", "mala", "dhoop", "chandan", "bhog", "vastra"],
    "shakti": ["shringar", "coconut", "chola", "flower", "mala", "ghee_diya", "dhoop", "kapoor", "mishri", "bhog", "vastra"],
    "shani": ["mustard_oil", "til", "urad", "ghee_diya", "dhoop", "vastra", "coconut", "bhog"],
    "ganesh": ["durva", "modak", "chola", "laddu", "ghee_diya", "dhoop", "mala", "coconut", "bhog", "vastra"],
    "hanuman": ["chola", "laddu", "tulsi", "mala", "ghee_diya", "dhoop", "coconut", "bhog", "dhwaja"],
    "ram": ["dhwaja", "tulsi", "vastra", "ghee_diya", "mala", "dhoop", "laddu", "chandan", "bhog"],
    "krishna": ["makhan", "tulsi", "vastra", "mala", "ghee_diya", "dhoop", "chandan", "bhog"],
    "vishnu": ["tulsi", "ghee_diya", "vastra", "coconut", "mala", "dhoop", "panchamrit", "chandan", "bhog"],
}

TRADITIONAL_OFFERING_KEYS = [
    "belpatra_108", "gangajal", "milk", "panchamrit", "bhasma", "ghee_diya",
    "dhatura", "mala", "dhoop", "mustard_oil", "chola", "shringar",
    "durva", "makhan", "bhog", "dhwaja", "vastra", "coconut", "chandan", "kapoor"
]

def all_traditional_items(english: bool = False) -> List[Dict[str, Any]]:
    """Returns the full 20 traditional sacred mandir offerings."""
    TAGS_HI = {
        "belpatra_108": "महादेव हेतु", "gangajal": "पावन अभिषेक", "milk": "दुग्धाभिषेक",
        "panchamrit": "पंचामृत अभिषेक", "bhasma": "महाकाल विशेष", "ghee_diya": "अखंड दीप",
        "dhatura": "शिव साधना", "mala": "पुष्प श्रृंगार", "dhoop": "वास्तु शुद्धि",
        "mustard_oil": "शनि शांति", "chola": "हनुमान कृपा", "shringar": "शक्तिपीठ विशेष",
        "durva": "विघ्नहर्ता", "makhan": "माखन भोग", "bhog": "अन्नपूर्णा प्रसाद",
        "dhwaja": "धर्म रक्षा", "vastra": "दिव्य वस्त्र", "coconut": "श्रीफल अर्पण",
        "chandan": "सुगंध अर्पण", "kapoor": "दिव्य आरती"
    }
    TAGS_EN = {
        "belpatra_108": "For Lord Shiva", "gangajal": "Sacred Abhishek", "milk": "Milk Abhishek",
        "panchamrit": "Panchamrit Abhishek", "bhasma": "Mahakal Special", "ghee_diya": "Akhand Lamp",
        "dhatura": "Shiva Sadhana", "mala": "Flower Shringar", "dhoop": "Sanctum Purification",
        "mustard_oil": "Shani Shanti", "chola": "Hanuman Blessings", "shringar": "Shaktipeeth Special",
        "durva": "Obstacle Removal", "makhan": "Makhan Bhog", "bhog": "Annapurna Prasad",
        "dhwaja": "Dharma Flag", "vastra": "Divine Attire", "coconut": "Sacred Coconut",
        "chandan": "Aroma Offering", "kapoor": "Holy Aarti"
    }
    res = []
    for key in TRADITIONAL_OFFERING_KEYS:
        if key in ITEMS:
            emoji, hi, en, price = ITEMS[key]
            tag = TAGS_EN.get(key, "Holy Offering") if english else TAGS_HI.get(key, "पावन अर्पण")
            desc = f"{en} offered in the sanctum in your name & gotra." if english else f"{hi} आपके नाम व गोत्र से गर्भगृह में विधि-विधान से अर्पित किया जाएगा।"
            res.append({
                "id": f"item_{key}",
                "key": key,
                "emoji": emoji,
                "title": en if english else hi,
                "title_en": en,
                "tag": tag,
                "price": price,
                "category": "item",
                "description": desc,
                "includes_video_proof": True,
            })
    return res

TEMPLE_THEME: Dict[str, str] = {
    **{s: "shiva" for s in ("mahakaleshwar-ujjain", "kashi-vishwanath-varanasi", "somnath-jyotirlinga-gujarat", "kedarnath-dham-uttarakhand",
                           "trimbakeshwar-nashik", "baidyanath-deoghar", "mallikarjuna-srisailam", "omkareshwar-madhya-pradesh",
                           "bhimashankar-maharashtra", "ramanathaswamy-rameswaram", "brihadeeswara-thanjavur")},
    **{s: "shakti" for s in ("vaishno-devi-katra", "kamakhya-devi-assam", "meenakshi-amman-madurai", "mahalakshmi-kolhapur",
                            "kalighat-kali-kolkata", "mansa-devi-haridwar")},
    "shani-shingnapur": "shani",
    "sankat-mochan-hanuman-varanasi": "hanuman",
    "siddhivinayak-mumbai": "ganesh",
    "ram-janmabhoomi-ayodhya": "ram",
    **{s: "krishna" for s in ("banke-bihari-vrindavan", "krishna-janmabhoomi-mathura", "dwarkadhish-dwarka", "khatu-shyam-rajasthan")},
    **{s: "vishnu" for s in ("tirupati-balaji-andhra", "jagannath-temple-puri", "badrinath-dham-uttarakhand", "padmanabhaswamy-thiruvananthapuram")},
}

# Temple-specific replacements for generic items (same key replaced in place, new keys added before "bhog").
TEMPLE_OVERRIDES: Dict[str, Dict[str, Tuple[str, str, str, float]]] = {
    "tirupati-balaji-andhra": {"laddu": ("🟡", "तिरुपति लड्डू प्रसाद", "Tirupati laddu prasad", 51)},
    "jagannath-temple-puri": {"khaja": ("🍥", "खाजा प्रसाद", "Khaja prasad", 51)},
    "ram-janmabhoomi-ayodhya": {"dhwaja": ("🚩", "केसरिया ध्वजा", "Saffron flag (dhwaja)", 51)},
    "banke-bihari-vrindavan": {"poshak": ("🧵", "बाँके बिहारी पोशाक", "Poshak for Bihari ji", 101)},
}

# Puja tiers: (key, hindi title, english title, hindi desc, english desc, members, price multiplier on the base price)
PUJA_TIERS = [
    ("single", "व्यक्तिगत पूजा", "Individual puja", "एक यजमान के नाम व गोत्र से संकल्प सहित पूजा।",
     "Puja with sankalp in the name and gotra of one devotee.", 1, 1.0),
    ("couple", "दंपति पूजा", "Couple puja", "पति-पत्नी दोनों के नाम से संकल्प सहित पूजा।",
     "Puja with sankalp in the names of both spouses.", 2, 1.8),
    ("family4", "परिवार पूजा (4 सदस्य)", "Family puja (4 members)", "परिवार के 4 सदस्यों के नाम से संकल्प सहित पूजा।",
     "Puja with sankalp for up to 4 family members.", 4, 3.0),
    ("family6", "परिवार पूजा (6 सदस्य)", "Family puja (6 members)", "परिवार के 6 सदस्यों के नाम से संकल्प सहित पूजा।",
     "Puja with sankalp for up to 6 family members.", 6, 4.0),
]
PUJA_BASE_PRICE = 251


def items_for(slug: str) -> List[Tuple[str, str, str, str, float, bool]]:
    """[(key, emoji, hindi, english, price, popular)] for a temple, popular items first."""
    keys = list(THEMES.get(TEMPLE_THEME.get(slug, ""), ["ghee_diya", "dhoop", "mala", "chandan", "coconut", "bhog", "vastra"]))
    over = TEMPLE_OVERRIDES.get(slug, {})
    rows = []
    for key in keys:
        rows.append((key, *over.get(key, ITEMS[key]), False))
    for key, spec in over.items():
        if key not in keys:
            rows.insert(min(POPULAR, len(rows)), (key, *spec, False))
    return [(*r[:5], i < POPULAR) for i, r in enumerate(rows)]


def seed_temple_items(db) -> int:
    """Add the item catalogue and puja tiers to every active temple. Returns the number of rows added."""
    from packages.database.models import Temple, TempleOffering
    added = 0
    for temple in db.query(Temple).all():
        have = {o.title: o for o in db.query(TempleOffering).filter(TempleOffering.temple_id == temple.id).all()}
        for order, (key, emoji, hi, en, price, popular) in enumerate(items_for(temple.slug)):
            if hi in have:
                continue
            db.add(TempleOffering(temple_id=temple.id, title=hi, title_en=en, description=f"{hi} आपके नाम से अर्पित।",
                                  description_en=f"{en} offered in your name.", category="item", price=price, emoji=emoji,
                                  popular=popular, sort_order=order, has_prasad_delivery=False, delivery_fee=0.0,
                                  includes_video_proof=True))
            added += 1
        for order, (key, hi, en, desc_hi, desc_en, members, mult) in enumerate(PUJA_TIERS):
            if hi in have:
                continue
            db.add(TempleOffering(temple_id=temple.id, title=hi, title_en=en, description=desc_hi, description_en=desc_en,
                                  category="puja_tier", price=round(PUJA_BASE_PRICE * mult / 10) * 10 + 1, max_members=members,
                                  sort_order=order, has_prasad_delivery=False, delivery_fee=0.0, includes_video_proof=True))
            added += 1
    db.commit()
    return added
