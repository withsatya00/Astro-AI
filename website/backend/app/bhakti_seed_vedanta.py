"""Starter Shankaracharya / Vedanta content, written in our own words.

Nothing here is a quotation attributed to a historical teacher. Dates and biographical details are framed as tradition, because
scholars disagree about them. Contemporary officeholders are deliberately NOT listed. Everything is seeded as unverified: an editor
must review it before turning `is_verified` on. Seeding only adds missing rows and never overwrites admin edits."""

# Traditional associations of the four Amnaya Peethas (place, state, direction, Veda, Mahavakya and its Upanishad).
PEETHAS = [
    {"name": "Sringeri Sharada Peetham", "place": "Sringeri", "state": "Karnataka", "direction": "South", "veda": "Yajurveda",
     "mahavakya": "Aham Brahmasmi", "mahavakya_source": "Brihadaranyaka Upanishad"},
    {"name": "Dwaraka Sharada Peetham", "place": "Dwarka", "state": "Gujarat", "direction": "West", "veda": "Samaveda",
     "mahavakya": "Tat Tvam Asi", "mahavakya_source": "Chandogya Upanishad"},
    {"name": "Jyotir Math (Jyotishpeeth)", "place": "Joshimath", "state": "Uttarakhand", "direction": "North", "veda": "Atharvaveda",
     "mahavakya": "Ayam Atma Brahma", "mahavakya_source": "Mandukya Upanishad"},
    {"name": "Govardhana Math", "place": "Puri", "state": "Odisha", "direction": "East", "veda": "Rigveda",
     "mahavakya": "Prajnanam Brahma", "mahavakya_source": "Aitareya Upanishad"},
]
PEETHA_NOTE = ("These are the traditional associations of the four Amnaya Peethas. Who currently holds each seat, and in a few cases which "
               "claimant is recognised, is a matter for each math and is not listed here; please consult the math's own official channels.")

REVIEWED_ON = "2026-11-03"
_PRIMARY = {"title": "Shankaracharya's own commentaries (bhashya) on the Brahma Sutras, the principal Upanishads and the Bhagavad Gita",
            "note": "Primary texts; read in a reliable edition with commentary"}
_BIO = {"title": "Traditional biographies such as the Shankara Digvijaya, and modern scholarly surveys of Advaita Vedanta",
        "note": "Dates and many details differ between sources"}

# (slug, section, kind, title_en, title_hi, sort_order, summary, body, sources)
ARTICLES = [
    ("adi-shankaracharya-life", "shankaracharya", "article", "Adi Shankaracharya: life in outline", "आदि शंकराचार्य: जीवन की रूपरेखा", 10,
     "A short, cautious outline of the traditional account of Adi Shankaracharya's life.",
     "Adi Shankaracharya is remembered as one of the most influential teachers of Advaita Vedanta.\n\n"
     "Traditional accounts say he was born in Kalady in present-day Kerala and took up the life of a renunciant while still very young. "
     "He is said to have studied under Govindapada, who is described as a disciple of Gaudapada, and then travelled widely across the Indian subcontinent, teaching and debating.\n\n"
     "Scholars do not agree on his dates; the 8th century CE is commonly cited, but other estimates exist. Accounts of a short life belong to the tradition rather than being settled history.\n\n"
     "His lasting contribution is a body of commentaries on the foundational texts of Vedanta, and the tradition credits him with founding four monastic centres (see the Four Peethas above). "
     "Some works traditionally attributed to him are debated by scholars, so check an edition's notes on authorship.",
     [_BIO, _PRIMARY]),
    ("guru-parampara", "shankaracharya", "article", "The guru parampara", "गुरु परंपरा", 20,
     "The traditional line of teachers through which the Advaita teaching is said to have come down.",
     "In the Advaita tradition, teaching is understood as passing from teacher to student in an unbroken line, the guru parampara.\n\n"
     "The traditional list begins with Narayana and moves through Brahma, Vasishtha, Shakti, Parashara and Vyasa to Shuka, then Gaudapada, Govindapada and Shankara. "
     "Shankara's four best-known disciples in the tradition are Padmapada, Hastamalaka, Sureshvara and Totaka.\n\n"
     "The earliest names are traditional and express the lineage's claim to ancient origin; history cannot confirm them. "
     "Gaudapada, Govindapada and Shankara are the figures scholars usually discuss historically.",
     [_BIO]),
    ("advaita-vedanta-introduction", "vedanta", "article", "Advaita Vedanta in brief", "अद्वैत वेदांत संक्षेप में", 10,
     "What 'non-dual' means in Advaita, explained plainly.",
     "Advaita means 'not two'. In this school of Vedanta the central claim is that the individual self (Atman) and the ultimate reality (Brahman) are not different.\n\n"
     "The everyday world of many separate things is understood as appearance (maya) that depends on Brahman, rather than a second, independent reality. "
     "Ignorance of one's real nature is seen as the root of suffering, and knowledge gained through study of the Upanishads under a qualified teacher is seen as the means of freedom (moksha).\n\n"
     "Other Vedanta schools, such as Vishishtadvaita and Dvaita, read the same texts differently and hold that God, souls and the world remain distinct in some way. "
     "This page presents the Advaita reading only.",
     [_PRIMARY]),
    ("prasthanatrayi", "vedanta", "article", "The three foundations (Prasthanatrayi)", "प्रस्थानत्रयी", 20,
     "The three texts on which Vedanta teachers traditionally comment.",
     "Vedanta traditions rest on three sources, together called the Prasthanatrayi: the Upanishads, the Brahma Sutras and the Bhagavad Gita.\n\n"
     "Shankaracharya is traditionally credited with commentaries on all three: on the Brahma Sutras, on the principal Upanishads (commonly listed as Isha, Kena, Katha, Prashna, Mundaka, "
     "Mandukya, Taittiriya, Aitareya, Chandogya and Brihadaranyaka), and on the Gita.\n\n"
     "Reading a commentary beside its root text, ideally with a teacher, is the traditional way to study them.",
     [_PRIMARY]),
    ("brahma-sutras", "vedanta", "article", "The Brahma Sutras", "ब्रह्मसूत्र", 30,
     "A short guide to the Brahma Sutras and why they matter to Vedanta.",
     "The Brahma Sutras are a collection of very short aphorisms that organise and defend the teaching of the Upanishads. Tradition attributes them to Badarayana.\n\n"
     "They are arranged in four chapters, and they are so compact that they have always been studied together with a commentary. "
     "The opening aphorism is commonly understood as an invitation to begin the inquiry into Brahman.\n\n"
     "Different schools of Vedanta have written their own commentaries, which is why the same sutras are read in different ways.",
     [_PRIMARY]),
    ("mahavakyas", "vedanta", "article", "The four Mahavakyas", "चार महावाक्य", 40,
     "Four short Upanishadic statements that the Advaita tradition treats as summing up its teaching.",
     "In the Advaita tradition four statements from the Upanishads are called Mahavakyas, 'great statements'.\n\n"
     "They are Prajnanam Brahma (Aitareya Upanishad), Aham Brahmasmi (Brihadaranyaka Upanishad), Tat Tvam Asi (Chandogya Upanishad) and Ayam Atma Brahma (Mandukya Upanishad). "
     "Each is traditionally linked with one of the four Vedas and, in the monastic tradition, with one of the four Peethas.\n\n"
     "Their meaning is explained in detail in commentaries; a one-line translation can mislead, so treat them as starting points for study rather than slogans.",
     [_PRIMARY]),
    ("qa-is-advaita-atheism", "vedanta", "qa", "Does Advaita Vedanta deny God?", "", 110, "A short answer.",
     "No. Advaita does not treat the world as a creation separate from a God who stands apart from it. It teaches that the one reality, Brahman, is the basis of everything, "
     "and it makes room for devotion and worship as helpful stages on the path. Other Vedanta schools describe the relation of God and the self differently.",
     [_PRIMARY]),
    ("qa-who-can-study", "vedanta", "qa", "Do I need to be a monk to study Vedanta?", "", 120, "A short answer.",
     "No. The tradition has always had householder students as well as monastics. It does recommend learning from a qualified teacher and studying the texts steadily, "
     "because the ideas are easy to misunderstand when read alone.",
     [_BIO]),
    ("qa-what-is-maya", "vedanta", "qa", "What does 'maya' mean in Advaita?", "", 130, "A short answer.",
     "Maya is often translated as 'illusion', but in Advaita it is closer to 'appearance that depends on something deeper'. The world is not claimed to be nothing; "
     "it is said to depend on Brahman and, from the highest standpoint, not to be a separate reality.",
     [_PRIMARY]),
    ("qa-peethas-officeholders", "shankaracharya", "qa", "Who is the current Shankaracharya of each Peetha?", "", 110, "A short answer.",
     "This site does not list current officeholders. Succession is decided by each math, the names change over time, and in some cases different groups claim the same seat. "
     "For reliable and current information, please consult the official channels of the math itself.",
     [{"title": "The official channels of each math", "note": "Not a single authority; check the specific math"}]),
]
