"""Single chadhava items (flower ₹5, matchbox ₹5, diya ...) and puja tiers for every temple.

Each temple gets the items devotees most commonly offer to its deity, the most-offered ones flagged ``popular`` so
they are listed first (for example Ayodhya leads with diya, tulsi dal and pitambar). ``seed_temple_items`` is
idempotent: it only adds rows that are missing, so prices an admin has edited are never overwritten.
"""
from typing import Dict, List, Tuple

# key -> (emoji, hindi title, english title, price in rupees)
ITEMS: Dict[str, Tuple[str, str, str, float]] = {
    "flower": ("🌼", "फूल", "Flowers", 5),
    "matchbox": ("🔥", "माचिस", "Matchbox", 5),
    "tulsi": ("🌿", "तुलसी दल", "Tulsi leaves", 5),
    "belpatra": ("🍃", "बेलपत्र", "Bilva leaves", 5),
    "dhatura": ("🌸", "धतूरा", "Dhatura", 5),
    "durva": ("🌱", "दूर्वा", "Durva grass", 11),
    "agarbatti": ("🪔", "अगरबत्ती", "Incense sticks", 11),
    "kapoor": ("✨", "कपूर", "Camphor", 11),
    "roli": ("🔴", "रोली-चावल", "Roli & rice", 11),
    "diya": ("🪔", "मिट्टी का दीपक", "Clay diya", 11),
    "mishri": ("🍬", "मिश्री", "Mishri", 21),
    "gangajal": ("💧", "गंगाजल", "Gangajal", 21),
    "sindoor": ("🔴", "सिंदूर", "Sindoor", 21),
    "til": ("⚫", "काले तिल", "Black sesame", 21),
    "urad": ("⚫", "उड़द दाल", "Urad dal", 21),
    "banana": ("🍌", "केला", "Banana", 21),
    "elaichi": ("🟢", "इलायची दाना", "Elaichi dana", 21),
    "bhasma": ("🕉️", "भस्म", "Bhasma", 21),
    "mala": ("💐", "फूलमाला", "Flower garland", 21),
    "chandan": ("🟤", "चंदन", "Chandan", 31),
    "milk": ("🥛", "दूध", "Milk", 31),
    "coconut": ("🥥", "नारियल", "Coconut", 31),
    "ghee_diya": ("🪔", "घी का दीपक", "Ghee lamp", 51),
    "laddu": ("🟡", "लड्डू प्रसाद", "Laddu prasad", 51),
    "peda": ("🤍", "पेड़ा", "Peda", 51),
    "modak": ("🟡", "मोदक", "Modak", 51),
    "chunri": ("🧣", "लाल चुनरी", "Red chunri", 51),
    "mustard_oil": ("🛢️", "सरसों का तेल", "Mustard oil", 51),
    "bell": ("🔔", "घंटी", "Temple bell", 51),
    "makhan": ("🧈", "माखन-मिश्री", "Makhan mishri", 51),
    "chola": ("🟠", "सिंदूर-चोला", "Sindoor chola", 51),
    "khaja": ("🍥", "खाजा प्रसाद", "Khaja prasad", 51),
    "ghee": ("🧈", "शुद्ध घी", "Pure ghee", 101),
    "vastra": ("🧵", "वस्त्र", "Cloth (vastra)", 101),
    "shringar": ("💄", "श्रृंगार सामग्री", "Shringar set", 101),
    "bhog": ("🍛", "भोग थाली", "Bhog thali", 151),
}

# Items for each deity theme, in display order. The first ``POPULAR`` entries are flagged popular.
POPULAR = 4
THEMES: Dict[str, List[str]] = {
    "shiva": ["belpatra", "gangajal", "milk", "dhatura", "flower", "bhasma", "ghee_diya", "matchbox", "agarbatti", "chandan", "mishri", "bhog"],
    "shakti": ["chunri", "coconut", "sindoor", "flower", "mala", "diya", "matchbox", "kapoor", "mishri", "shringar", "agarbatti", "bhog"],
    "shani": ["mustard_oil", "til", "urad", "flower", "diya", "matchbox", "vastra", "agarbatti", "coconut", "bhog"],
    "ganesh": ["durva", "modak", "flower", "sindoor", "laddu", "diya", "matchbox", "mala", "agarbatti", "coconut", "bhog"],
    "hanuman": ["chola", "laddu", "flower", "tulsi", "mala", "diya", "matchbox", "sindoor", "agarbatti", "coconut", "bhog"],
    "ram": ["diya", "tulsi", "vastra", "elaichi", "flower", "mala", "matchbox", "laddu", "chandan", "agarbatti", "kapoor", "bhog"],
    "krishna": ["tulsi", "makhan", "peda", "mala", "flower", "diya", "matchbox", "vastra", "agarbatti", "chandan", "bhog"],
    "vishnu": ["tulsi", "diya", "laddu", "coconut", "flower", "mala", "matchbox", "vastra", "agarbatti", "ghee_diya", "bhog"],
}

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
    keys = list(THEMES.get(TEMPLE_THEME.get(slug, ""), ["flower", "matchbox", "diya", "agarbatti", "coconut", "mishri", "bhog"]))
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
