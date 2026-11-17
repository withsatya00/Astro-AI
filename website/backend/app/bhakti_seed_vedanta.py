"""Starter Shankaracharya / Vedanta content, written in our own words.

Nothing here is a quotation attributed to a historical teacher. Dates and biographical details are framed as tradition, because
scholars disagree about them. Contemporary officeholders are deliberately NOT listed. Everything is seeded as unverified: an editor
must review it before turning `is_verified` on. Seeding only adds missing rows and never overwrites admin edits."""

# Traditional associations of the four Amnaya Peethas (place, state, direction, Veda, Mahavakya and its Upanishad).
PEETHAS = [
    {
        "id": "sringeri",
        "name": "Sringeri Sharada Peetham",
        "name_hi": "दक्षिण आम्नाय शृंगेरी शारदा पीठम्",
        "place": "Sringeri",
        "place_hi": "शृंगेरी (चिकमगलूर)",
        "state": "Karnataka",
        "state_hi": "कर्नाटक",
        "direction": "South",
        "direction_hi": "दक्षिण दिशा",
        "veda": "Yajurveda (Krishna)",
        "veda_hi": "यजुर्वेद (कृष्ण यजुर्वेद)",
        "mahavakya": "Aham Brahmasmi",
        "mahavakya_hi": "अहं ब्रह्मास्मि (मैं ही परब्रह्म हूँ)",
        "mahavakya_source": "Brihadaranyaka Upanishad 1.4.10",
        "first_acharya": "Sri Sureshvaracharya",
        "first_acharya_hi": "श्री सुरेश्वराचार्य जी (पूर्व नाम: मण्डन मिश्र)",
        "first_acharya_desc": "Renowned scholar Mandana Mishra became Shankara's disciple after a historic philosophical debate (Shastrartha) in Mahishmati, refereed by Ubhaya Bharati. As Sureshvara, he composed the monumental commentary Brihadaranyakopanishad Bhashya Vartika and Naishkarmya Siddhi.",
        "first_acharya_desc_hi": "महिष्मती के प्रख्यात प्रकांड विद्वान मण्डन मिश्र जी ने आदि शंकराचार्य जी से शास्त्रार्थ के उपरांत संन्यास ग्रहण किया और सुरेश्वराचार्य नाम से दक्षिण पीठ के प्रथम आचार्य बने। उन्होंने नैष्कर्म्यसिद्धि और बृहदारण्यकोपनिषद भाष्य वार्तिक जैसे अद्वितीय ग्रंथों की रचना की।",
        "deities": "Sri Sharadamba & Sri Chandramouleshwara",
        "deities_hi": "माँ शारदाम्बा (विद्या की देवी) एवं श्री चन्द्रमौलीश्वर (स्फटिक लिंग)",
        "sampradaya": "Bhurivala Sampradaya",
        "sampradaya_hi": "भूरिवाल सम्प्रदाय",
        "tirtha": "Tunga River (तुंगा तीर्थ)",
        "significance": "Established on the peaceful banks of the sacred Tunga River where Adi Shankara witnessed a cobra protecting a spawning frog from the scorching sun. It preserves the Yajurveda and is famous for its unbroken, venerable lineage of Jagadgurus.",
        "significance_hi": "पवित्र तुंगा नदी के सुरम्य तट पर स्थापित जहाँ आदि शंकराचार्य जी ने एक फन फैलाए सर्प को प्रसव-वेदना से पीड़ित मेंढक को धूप से छाया देते देखा। इस पावन स्थल पर उन्होंने यजुर्वेद और अद्वैत दर्शन के संरक्षण हेतु यह प्रथम पीठ स्थापित किया।"
    },
    {
        "id": "puri",
        "name": "Govardhana Math, Puri",
        "name_hi": "पूर्व आम्नाय गोवर्धन पीठम्, पुरी",
        "place": "Puri",
        "place_hi": "श्री जगन्नाथ पुरी",
        "state": "Odisha",
        "state_hi": "ओडिशा",
        "direction": "East",
        "direction_hi": "पूर्व दिशा",
        "veda": "Rigveda",
        "veda_hi": "ऋग्वेद",
        "mahavakya": "Prajnanam Brahma",
        "mahavakya_hi": "प्रज्ञानं ब्रह्म (चेतना/ज्ञान ही ब्रह्म है)",
        "mahavakya_source": "Aitareya Upanishad 3.1.3",
        "first_acharya": "Sri Padmapadacharya",
        "first_acharya_hi": "श्री पद्मपादाचार्य जी (सनन्दन)",
        "first_acharya_desc": "Originally Sanandana from Chola country. When Shankara summoned him across the flooded river, divine lotuses bloomed beneath each of his footsteps, earning him the name Padmapada. He authored Panchapadika, the foundational sub-commentary on Shankara's Brahma Sutra Bhashya.",
        "first_acharya_desc_hi": "आदि शंकराचार्य जी के अनन्य प्रथम शिष्य सनन्दन जी। जब गुरुदेव ने उन्हें बाढ़ वाली नदी के पार बुलाया, तो उनके प्रत्येक कदम के नीचे साक्षात कमल के पुष्प खिलते गए, जिससे उनका नाम पद्मपाद पड़ा। उन्होंने ब्रह्मसूत्र भाष्य पर 'पञ्चपादिका' जैसा कालजयी ग्रंथ लिखा।",
        "deities": "Lord Jagannath & Goddess Vimala",
        "deities_hi": "भगवान श्री जगन्नाथ जी एवं माँ विमला देवी",
        "sampradaya": "Bhogavala Sampradaya",
        "sampradaya_hi": "भोगवाल सम्प्रदाय",
        "tirtha": "Mahodadhi (Bay of Bengal / महोदधि तीर्थ)",
        "significance": "Located in the holy Dham of Jagannath Puri on the eastern seaboard, this math safeguards the oldest Veda, the Rigveda, and connects the intellectual brilliance of Advaita with the ocean of deep Jagannath Bhakti.",
        "significance_hi": "पूर्वी समुद्र तट पर श्री पुरुषोत्तम क्षेत्र (जगन्नाथ पुरी) में स्थित यह पीठ संसार के प्राचीनतम वेद 'ऋग्वेद' का संरक्षण करता है और अद्वैत तत्वज्ञान को जगन्नाथ महाप्रभु की अनन्य भक्ति से जोड़ता है।"
    },
    {
        "id": "dwarka",
        "name": "Dwaraka Sharada Peetham",
        "name_hi": "पश्चिम आम्नाय द्वारका शारदा पीठम्",
        "place": "Dwarka",
        "place_hi": "श्री द्वारका धाम",
        "state": "Gujarat",
        "state_hi": "गुजरात",
        "direction": "West",
        "direction_hi": "पश्चिम दिशा",
        "veda": "Samaveda",
        "veda_hi": "सामवेद",
        "mahavakya": "Tat Tvam Asi",
        "mahavakya_hi": "तत्त्वमसि (वह ब्रह्म तुम ही हो)",
        "mahavakya_source": "Chandogya Upanishad 6.8.7",
        "first_acharya": "Sri Hastamalakacharya",
        "first_acharya_hi": "श्री हस्तामलकाचार्य जी",
        "first_acharya_desc": "Born in Karnataka, he remained silent until age 13. When Adi Shankara asked 'Who are you?', the boy spontaneously sang the 12 philosophical verses of Hastamalakiyam Stotra, proving he held realization as clearly as an amla fruit in one's hand (Hasta-amalaka).",
        "first_acharya_desc_hi": "बचपन से मौन रहने वाले बालक को जब शंकराचार्य जी ने पूछा 'तुम कौन हो?', तो उन्होंने तत्क्षण अद्वैत आत्मज्ञान के 12 गूढ़ श्लोक (हस्तामलकीय स्तोत्र) सुनाए। गुरुदेव ने कहा कि आत्मज्ञान इनके हाथ में रखे आंवले (हस्तामलक) की तरह प्रत्यक्ष है।",
        "deities": "Sri Dvarakadhisha & Goddess Bhadrakali",
        "deities_hi": "श्री द्वारकाधीश जी (सिद्ध्येश्वर) एवं माँ भद्रकाली",
        "sampradaya": "Kitavala Sampradaya",
        "sampradaya_hi": "कीटवाल सम्प्रदाय",
        "tirtha": "Gomati River & Arabian Sea (गोमती तीर्थ)",
        "significance": "Established in the legendary kingdom of Lord Krishna on the western coast, protecting the musical Samaveda. The peeth represents the truth that the individual soul and the Supreme Reality are non-different.",
        "significance_hi": "पश्चिमी समुद्र तट पर भगवान श्रीकृष्ण की पावन लीलाभूमि द्वारका में स्थापित यह पीठ संगीत एवं छंद के पावन 'सामवेद' का संरक्षण करता है तथा जीव और ब्रह्म के अभेद सत्य का उद्घोष करता है।"
    },
    {
        "id": "joshimath",
        "name": "Jyotir Math (Jyotishpeeth)",
        "name_hi": "उत्तर आम्नाय ज्योतिर्मठ (ज्योतिष्पीठ), बद्रिकाश्रम",
        "place": "Joshimath",
        "place_hi": "जोशीमठ (चमोली / बद्रिकाश्रम)",
        "state": "Uttarakhand",
        "state_hi": "उत्तराखंड",
        "direction": "North",
        "direction_hi": "उत्तर दिशा",
        "veda": "Atharvaveda",
        "veda_hi": "अथर्ववेद",
        "mahavakya": "Ayam Atma Brahma",
        "mahavakya_hi": "अयमात्मा ब्रह्म (यह अंतरात्मा ही ब्रह्म है)",
        "mahavakya_source": "Mandukya Upanishad 1.2",
        "first_acharya": "Sri Totakacharya",
        "first_acharya_hi": "श्री तोटकाचार्य जी (आनंदगिरि)",
        "first_acharya_desc": "Known originally as Giri, he was the humblest disciple who quietly served his Guru washing clothes and collecting firewood. When fellow students doubted his scholarship, Shankara blessed him, and Giri spontaneously composed the metrically dazzling 'Totakashtakam' in praise of the Guru.",
        "first_acharya_desc_hi": "गुरु सेवा में रात-दिन लीन रहने वाले परम निष्ठावान शिष्य गिरि। जब अन्य शिष्यों ने उनकी विद्वता पर शंका की, तब शंकराचार्य जी के कृपा-प्रसाद से उन्होंने अति-कठिन तोटक छंद में विश्वप्रसिद्ध 'तोटकाष्टकम्' रचकर सबको चकित कर दिया।",
        "deities": "Sri Badrinarayana & Goddess Purnagiri",
        "deities_hi": "भगवान श्री बद्रीनारायण एवं माँ पूर्णागिरि देवी",
        "sampradaya": "Anandavala Sampradaya",
        "sampradaya_hi": "आनन्दवाल सम्प्रदाय",
        "tirtha": "Alaknanda River (अलकनंदा तीर्थ)",
        "significance": "Nestled high in the Garhwal Himalayas beneath the Kalpavriksha tree where Adi Shankara attained enlightenment. Situated at the gateway to Badrinath Dham, it preserves the Atharvaveda and deep meditative yogic silence.",
        "significance_hi": "हिमालय की गगनचुंबी बर्फीली चोटियों के मध्य बद्रीनाथ धाम के प्रवेश द्वार पर कल्पवृक्ष की पावन छत्रछाया में स्थापित। यह पीठ अथर्ववेद, योग साधना एवं उच्च आत्म-चिन्तन का सर्वोच्च केंद्र है।"
    }
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
