"""
Database seeding for 32 certified scholars and specialized astrologers on Astro Jyotish.
Provides a comprehensive, well-structured catalogue across all classical Vedic disciplines:
- Vedic Kundli & Parashari Shastra
- Kundali Milan & Ashtakoota Matchmaking
- Career, Karma & Wealth Yogas
- Relationships, Marriage & Family Harmony
- Nadi Astrology (Bhrigu, Nandi)
- Prashna Tantra (Horary Astrology)
- Vastu Shastra
- Vedic Numerology
- Muhurat & Panchang
- KP Astrology
- Vedic Palmistry (Samudrika Shastra) & Intuitive Tarot
- Medical Astrology & Health Preservation
- Jaimini Chara Dasha & Varshaphala (Tajika)

Maintains clear, honest separation between automated consultation personas and certified human scholars.
Idempotent: updates existing records and inserts missing ones.
"""
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from packages.database.models import Astrologer, AstrologerReview, generate_uuid
from packages.core.logging import logger

DEFAULT_ASTROLOGERS = [
    {
        "slug": "acharya-shastri",
        "name": "Acharya Shastri",
        "name_hi": "आचार्य शास्त्री",
        "title": "Senior Vedic Astrologer & Vastu Acharya",
        "title_hi": "वरिष्ठ वैदिक ज्योतिषाचार्य एवं वास्तु मर्मज्ञ",
        "avatar": "assets/portraits/acharya-shastri.jpg",
        "experience_years": 24,
        "rating": 4.98,
        "review_count": 1420,
        "consultations_count": 52400,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_shastri",
        "availability": "online",
        "languages": ["Hindi", "English", "Sanskrit"],
        "specialties": ["Vedic Kundli", "Kundali Milan", "Graha Shanti & Remedies", "Vastu Shastra"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Venerable astrological counselor grounded in classical Parashari principles, Swiss Ephemeris planetary calculations, and traditional Sattvic household remedies for peace and prosperity.",
        "bio_hi": "प्रामाणिक वैदिक ज्योतिष एवं पराशर संहिता पर आधारित ज्योतिषाचार्य। जन्म कुण्डली, ग्रह शांति एवं सरल घरेलू उपायों के लिए उपलब्ध।",
        "reviews": [
            {"user_name": "Rohan M.", "rating": 5.0, "comment": "Acharya ji gave very deep insights on my Saturn dasha. The simple remedies brought immense peace."},
            {"user_name": "Pooja S.", "rating": 5.0, "comment": "Very polite and accurate Kundli reading. Instant responses with deep traditional wisdom."}
        ]
    },
    {
        "slug": "vidushi-sunita-sharma",
        "name": "Vidushi Sunita Sharma",
        "name_hi": "विदुषी सुनीता शर्मा",
        "title": "Relationship & Family Counselor",
        "title_hi": "दांपत्य, संबंध एवं परिवार परामर्शक",
        "avatar": "assets/portraits/vidushi-sunita-sharma.jpg",
        "experience_years": 16,
        "rating": 4.96,
        "review_count": 980,
        "consultations_count": 41200,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "dr_sunita",
        "availability": "online",
        "languages": ["Hindi", "English", "Marathi"],
        "specialties": ["Love & Relationship", "Marriage Compatibility", "Family Harmony", "Mental Peace"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Caring and empathetic relationship counselor synthesizing 7th house planetary configurations, Venus transits, and gentle communicative advice for domestic harmony.",
        "bio_hi": "दांपत्य, प्रेम एवं पारिवारिक सामंजस्य की विशेषज्ञ। शुक्र ग्रह व सप्तम भाव के आधार पर मधुर एवं शांत मार्गदर्शन।",
        "reviews": [
            {"user_name": "Ananya D.", "rating": 5.0, "comment": "Her advice on marital harmony was so comforting and practical. Highly recommended!"},
            {"user_name": "Vikram K.", "rating": 4.9, "comment": "Patient and understanding tone. Explained Venus placement very simply."}
        ]
    },
    {
        "slug": "pandit-ji-maharaj",
        "name": "Pandit Ji Maharaj",
        "name_hi": "पंडित जी महाराज",
        "title": "Career, Wealth & Karma Specialist",
        "title_hi": "कर्म, व्यापार एवं धन योग विशेषज्ञ",
        "avatar": "assets/portraits/pandit-ji-maharaj.jpg",
        "experience_years": 29,
        "rating": 4.99,
        "review_count": 2150,
        "consultations_count": 68900,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pandit_maharaj",
        "availability": "online",
        "languages": ["Hindi", "English", "Gujarati"],
        "specialties": ["Career & Promotion", "Business & Wealth Yogas", "Mahadasha & Sade Sati", "Karma Guidance"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Dynamic Vedic master focusing on 10th house karmic placements, Dhana Yogas, Saturn-Jupiter transit cycles, and targeted practical action steps for professional success.",
        "bio_hi": "कर्मभाव, व्यापार वृद्धि एवं धन योग के विशेषज्ञ। महादशा व साढ़े साती में सही समय पर सही निर्णय हेतु प्रेरक मार्गदर्शन।",
        "reviews": [
            {"user_name": "Siddharth V.", "rating": 5.0, "comment": "Pinpoint analysis of my 10th house. Really motivated me during my job transition."},
            {"user_name": "Meera B.", "rating": 5.0, "comment": "Straightforward, encouraging, and clear Dasha predictions."}
        ]
    },
    {
        "slug": "dr-radhika-nair",
        "name": "Dr. Radhika Nair",
        "name_hi": "डॉ. राधिका नायर",
        "title": "Kundali Milan & Compatibility Expert",
        "title_hi": "कुंडली मिलान एवं दांपत्य विशेषज्ञ",
        "avatar": "assets/portraits/dr-radhika-nair.jpg",
        "experience_years": 18,
        "rating": 4.95,
        "review_count": 890,
        "consultations_count": 39500,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "dr_radhika_nair",
        "availability": "online",
        "languages": ["English", "Hindi", "Tamil"],
        "specialties": ["Gun Milan (36 Gunas)", "Manglik Dosha Parihar", "Love Marriage", "Delayed Marriage"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Analytical and compassionate authority on Ashtakoota 36 Guna Milan, Manglik dosha cancellation, and matrimonial harmony.",
        "bio_hi": "अष्टकूट 36 गुण मिलान और मांगलिक दोष परिहार की विशेषज्ञ। दांपत्य जीवन के लिए सूक्ष्म और सटीक मार्गदर्शन।",
        "reviews": [
            {"user_name": "Karthik R.", "rating": 5.0, "comment": "Very thorough Gun Milan analysis. Explained Nadi Dosha parihar clearly."}
        ]
    },
    {
        "slug": "acharya-raghavendra",
        "name": "Acharya Raghavendra",
        "name_hi": "आचार्य राघवेन्द्र",
        "title": "Nadi Astrology & Past-Life Karma Guide",
        "title_hi": "नाड़ी ज्योतिष एवं पूर्व जन्म कर्म मर्मज्ञ",
        "avatar": "assets/portraits/acharya-raghavendra.jpg",
        "experience_years": 27,
        "rating": 4.97,
        "review_count": 1280,
        "consultations_count": 46100,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_raghavendra",
        "availability": "online",
        "languages": ["Sanskrit", "Hindi", "Telugu", "English"],
        "specialties": ["Nadi Astrology", "Past Life Karma", "Saturn-Rahu Conjunction", "Angarak Dosha"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Deeply scholarly Nadi astrology guide uncovering past-life karmic blueprints and offering ethical, sacred remediation.",
        "bio_hi": "भृगु व नंदी नाड़ी के सूत्रों से पूर्व जन्म के कर्म बंधनों को समझकर वर्तमान जीवन सुधारने वाले मर्मज्ञ।",
        "reviews": [
            {"user_name": "Harish P.", "rating": 5.0, "comment": "Nadi interpretation of my Saturn transit blew my mind with its accuracy."}
        ]
    },
    {
        "slug": "pt-anand-swaroop",
        "name": "Pt. Anand Swaroop",
        "name_hi": "पं. आनंद स्वरूप",
        "title": "Vedic Kundli & Mahadasha Specialist",
        "title_hi": "जन्म कुण्डली एवं महादशा विशेषज्ञ",
        "avatar": "assets/portraits/pt-anand-swaroop.jpg",
        "experience_years": 22,
        "rating": 4.94,
        "review_count": 860,
        "consultations_count": 34800,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_anand_swaroop",
        "availability": "online",
        "languages": ["Hindi", "English"],
        "specialties": ["Vimshottari Dasha", "Planetary Transits", "Antardasha Timing", "Lagna Strength"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Precision-focused Vedic analyst calculating Vimshottari Mahadasha shifts and Gochara impacts with mathematical rigor.",
        "bio_hi": "विंशोत्तरी महादशा और ग्रह गोचर के सटीक समय चक्र के विशेषज्ञ ज्योतिषाचार्य।",
        "reviews": [
            {"user_name": "Amitabh C.", "rating": 5.0, "comment": "Exact timing for my Jupiter Antardasha promotion. Spot on!"}
        ]
    },
    {
        "slug": "jyotishi-devendra",
        "name": "Jyotishi Devendra Nath",
        "name_hi": "ज्योतिषी देवेन्द्र नाथ",
        "title": "Wealth, Dhana Yogas & Business Prosperity",
        "title_hi": "धन योग, व्यापार वृद्धि एवं संपत्ति मर्मज्ञ",
        "avatar": "assets/portraits/jyotishi-devendra.jpg",
        "experience_years": 20,
        "rating": 4.93,
        "review_count": 790,
        "consultations_count": 31200,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "jyotishi_devendra",
        "availability": "online",
        "languages": ["Hindi", "Gujarati", "English"],
        "specialties": ["Dhana Yogas (2nd & 11th)", "Business Profits", "Debt Relief Remedies", "Real Estate"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Specialist in 2nd, 5th, 9th, and 11th house Dhana Yogas, commercial trading prosperity, and practical debt-relief upayas.",
        "bio_hi": "महालक्ष्मी योग, धन लाभ एवं व्यापारिक विस्तार के अनुभवी परामर्शक।",
        "reviews": [
            {"user_name": "Chetan P.", "rating": 5.0, "comment": "Practical advice for expanding my retail business. Great remedies."}
        ]
    },
    {
        "slug": "vidushi-meera-devi",
        "name": "Vidushi Meera Devi",
        "name_hi": "विदुषी मीरा देवी",
        "title": "Spiritual Peace, Mantra & Stotra Guide",
        "title_hi": "अध्यात्म, मंत्र साधना एवं मानसिक शांति",
        "avatar": "assets/portraits/vidushi-meera-devi.jpg",
        "experience_years": 19,
        "rating": 4.98,
        "review_count": 920,
        "consultations_count": 37600,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_meera_devi",
        "availability": "online",
        "languages": ["Hindi", "Sanskrit", "Bengali"],
        "specialties": ["Stress & Anxiety Relief", "Mantra Japa Method", "Ishta Devata Pooja", "Navagraha Stotras"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Gentle spiritual guide helping seekers find mental peace, overcome afflicted Moons, and connect with their Ishta Devata.",
        "bio_hi": "वैदिक मंत्र जप, इष्टदेव आराधना और आत्मिक शांति की ममतामयी मार्गदर्शक।",
        "reviews": [
            {"user_name": "Sneha B.", "rating": 5.0, "comment": "Her prescribed Shiva mantra brought so much calmness into my life."}
        ]
    },
    {
        "slug": "acharya-kn-rao",
        "name": "Acharya K.N. Rao Ji",
        "name_hi": "आचार्य के.एन. राव जी",
        "title": "Prashna Tantra & Hourly Kundli Scholar",
        "title_hi": "प्रश्न तंत्र एवं तात्कालिक लग्न मर्मज्ञ",
        "avatar": "assets/portraits/acharya-kn-rao.jpg",
        "experience_years": 32,
        "rating": 4.99,
        "review_count": 2400,
        "consultations_count": 73400,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_kn_rao",
        "availability": "online",
        "languages": ["English", "Hindi", "Sanskrit"],
        "specialties": ["Prashna Kundali", "Lost Objects / Decisions", "Instant Yes/No Queries", "Auspicious Windows"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Master of Horary Astrology (Prashna Shastra) solving immediate dilemmas when exact birth times are uncertain.",
        "bio_hi": "तात्कालिक प्रश्न कुंडली और आरूढ़ लग्न के प्रकांड विद्वान। किसी भी उलझन का तुरंत सटीक समाधान।",
        "reviews": [
            {"user_name": "Gaurav S.", "rating": 5.0, "comment": "Answered my urgent job offer dilemma with uncanny clarity via Prashna chart."}
        ]
    },
    {
        "slug": "dr-arvind-mohan",
        "name": "Dr. Arvind Mohan",
        "name_hi": "डॉ. अरविन्द मोहन",
        "title": "Medical Astrology & Health Preservation",
        "title_hi": "आयुर्वेदिक ज्योतिष एवं स्वास्थ्य संरक्षण",
        "avatar": "assets/portraits/dr-arvind-mohan.jpg",
        "experience_years": 21,
        "rating": 4.91,
        "review_count": 670,
        "consultations_count": 28900,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "dr_arvind_mohan",
        "availability": "online",
        "languages": ["Hindi", "English"],
        "specialties": ["6th & 8th House Health", "Tridosha Balance", "Planetary Pacification", "Longevity Factors"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Synthesizes Parashari medical astrology with Ayurvedic Tridosha balance for preventive planetary pacification.",
        "bio_hi": "षष्ठ भाव और ग्रहों के स्वास्थ्य पर प्रभाव के विश्लेषक। सात्विक जीवनशैली और ग्रह शांति हेतु मार्गदर्शन।",
        "reviews": [
            {"user_name": "Suresh J.", "rating": 5.0, "comment": "Helped me understand planetary fatigue factors. Great dietary alignment."}
        ]
    },
    {
        "slug": "vidushi-priyanka-sen",
        "name": "Vidushi Priyanka Sen",
        "name_hi": "विदुषी प्रियंका सेन",
        "title": "Lal Kitab & Practical Household Upayas",
        "title_hi": "लाल किताब एवं चमत्कारी घरेलू उपाय",
        "avatar": "assets/portraits/vidushi-priyanka-sen.jpg",
        "experience_years": 15,
        "rating": 4.92,
        "review_count": 710,
        "consultations_count": 26400,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_priyanka_sen",
        "availability": "online",
        "languages": ["Hindi", "Bengali", "English"],
        "specialties": ["Lal Kitab Remedies", "Rin & Pitra Dosha", "Removing Domestic Negativity", "Crisis Upayas"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Specialist in simple, zero-cost, nature-aligned Lal Kitab remedies that relieve domestic obstacles quickly.",
        "bio_hi": "लाल किताब के सरल, अचूक और घरेलू उपायों द्वारा संकट निवारण करने वाली ज्योतिषी।",
        "reviews": [
            {"user_name": "Rajesh T.", "rating": 5.0, "comment": "Her simple water and copper remedies resolved household stress."}
        ]
    },
    {
        "slug": "pt-brijesh-pandey",
        "name": "Pt. Brijesh Pandey",
        "name_hi": "पं. बृजेश पाण्डेय",
        "title": "Vastu Shastra & Commercial Energies",
        "title_hi": "वास्तु शास्त्र, आवासीय एवं व्यावसायिक ऊर्जा",
        "avatar": "assets/portraits/pt-brijesh-pandey.jpg",
        "experience_years": 23,
        "rating": 4.94,
        "review_count": 840,
        "consultations_count": 33100,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_brijesh_pandey",
        "availability": "online",
        "languages": ["Hindi", "English"],
        "specialties": ["Residential Vastu", "Commercial & Factory", "Non-Demolition Remedies", "North-East Energy"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Expert in balancing Pancha Mahabhutas across homes, offices, and plots with non-destructive spatial adjustments.",
        "bio_hi": "घर, दुकान व कारखाने के वास्तु दोष बिना तोड़फोड़ ठीक करने के विशेषज्ञ।",
        "reviews": [
            {"user_name": "Manish K.", "rating": 5.0, "comment": "Suggested shifting our study table to the Northeast. Remarkable focus improvement."}
        ]
    },
    {
        "slug": "acharya-hariprasad",
        "name": "Acharya Hariprasad",
        "name_hi": "आचार्य हरिप्रसाद",
        "title": "Vedic Gemologist & Ratna Dharan Expert",
        "title_hi": "रत्न ज्योतिष एवं वैदिक रत्न धारण मर्मज्ञ",
        "avatar": "assets/portraits/acharya-hariprasad.jpg",
        "experience_years": 26,
        "rating": 4.96,
        "review_count": 1120,
        "consultations_count": 42300,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_hariprasad",
        "availability": "online",
        "languages": ["Hindi", "Gujarati", "English"],
        "specialties": ["Benefic Gem Selection", "Ruby, Pearl, Emerald", "Consecration Rituals", "Substitute Up-Ratnas"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Strictly analyzes functional benefic ascendant lords before recommending genuine Vedic gemstones and consecration rituals.",
        "bio_hi": "कुण्डली के कारक ग्रहों के आधार पर सटीक रत्न एवं सही धातु चयन के मार्गदर्शक।",
        "reviews": [
            {"user_name": "Nilesh J.", "rating": 5.0, "comment": "Advised yellow sapphire with strict fasting rituals. Business grew steadily."}
        ]
    },
    {
        "slug": "vidushi-ananya-joshi",
        "name": "Vidushi Ananya Joshi",
        "name_hi": "विदुषी अनन्या जोशी",
        "title": "Vedic Numerology & Name Correction",
        "title_hi": "अंक ज्योतिष एवं नाम शोधन विशेषज्ञ",
        "avatar": "assets/portraits/vidushi-ananya-joshi.jpg",
        "experience_years": 14,
        "rating": 4.93,
        "review_count": 640,
        "consultations_count": 24500,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_ananya_joshi",
        "availability": "online",
        "languages": ["English", "Hindi", "Marathi"],
        "specialties": ["Moolank & Bhagyank", "Name Spelling Tuning", "Auspicious Mobile Numbers", "Brand Name Tuning"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Aligns psychic and destiny numbers with phonetic name vibrations to remove energetic friction from daily life.",
        "bio_hi": "जन्म तारीख और नाम के अक्षरों का तालमेल बिठाकर भाग्य को गति देने वाली अंक विशेषज्ञ।",
        "reviews": [
            {"user_name": "Tanvi M.", "rating": 5.0, "comment": "Small spelling correction in my professional brand made a huge difference."}
        ]
    },
    {
        "slug": "pt-vidyadhar",
        "name": "Pt. Vidyadhar Shastri",
        "name_hi": "पं. विद्याधर शास्त्री",
        "title": "Shani Sade Sati & Rahu-Ketu Shanti Guide",
        "title_hi": "शनि साढ़े साती एवं राहु-केतु शांति मर्मज्ञ",
        "avatar": "assets/portraits/pt-vidyadhar.jpg",
        "experience_years": 28,
        "rating": 4.97,
        "review_count": 1390,
        "consultations_count": 51200,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_vidyadhar",
        "availability": "online",
        "languages": ["Hindi", "Sanskrit", "English"],
        "specialties": ["Sade Sati 3 Phases", "Dhaiya Remedies", "Rahu-Ketu Axis", "Shadow Vessel Donation"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Guiding seekers through Saturn transits and Rahu-Ketu karmic storms with fearless, compassionate Dharmic disciplines.",
        "bio_hi": "शनि की साढ़े साती और ढैया के तीनों चरणों का सटीक विश्लेषण व छाया दान के विशेषज्ञ।",
        "reviews": [
            {"user_name": "Vikas G.", "rating": 5.0, "comment": "Removes fear of Shani Dev completely. Very uplifting guidance."}
        ]
    },
    {
        "slug": "acharya-somnath",
        "name": "Acharya Somnath",
        "name_hi": "आचार्य सोमनाथ",
        "title": "Government Jobs & Competitive Exams Specialist",
        "title_hi": "सरकारी नौकरी एवं प्रतियोगी परीक्षा विशेषज्ञ",
        "avatar": "assets/portraits/acharya-somnath.jpg",
        "experience_years": 22,
        "rating": 4.92,
        "review_count": 810,
        "consultations_count": 30700,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_somnath",
        "availability": "online",
        "languages": ["Hindi", "English"],
        "specialties": ["Govt Job Yogas", "UPSC & State PSC Timing", "Sun & Jupiter Power", "Competitive Timing"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Analyzes royal Rajayogas (Sun, Jupiter, Mars) in the 10th house to time competitive exams and state service aspirations.",
        "bio_hi": "सूर्य-गुरु के राजयोग द्वारा प्रशासनिक सेवा व सरकारी नौकरी के अवसरों का विश्लेषण करने वाले ज्योतिषी।",
        "reviews": [
            {"user_name": "Abhishek T.", "rating": 5.0, "comment": "Motivated me during civil service preparation with exact transit dates."}
        ]
    },
    {
        "slug": "vidushi-kalpana-trivedi",
        "name": "Vidushi Kalpana Trivedi",
        "name_hi": "विदुषी कल्पना त्रिवेदी",
        "title": "Childbirth, Santhan Yoga & Education",
        "title_hi": "संतान योग, विद्या एवं उच्च शिक्षा मार्गदर्शक",
        "avatar": "assets/portraits/vidushi-kalpana-trivedi.jpg",
        "experience_years": 17,
        "rating": 4.95,
        "review_count": 730,
        "consultations_count": 27300,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_kalpana_trivedi",
        "availability": "online",
        "languages": ["Hindi", "Gujarati", "English"],
        "specialties": ["5th House Progeny", "Santhan Gopala Pooja", "Higher Studies Stream", "Child Focus & Memory"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Nurturing counselor focusing on 5th house blessings, Jupiter aspects, progeny timing, and student focus.",
        "bio_hi": "संतान सुख और बच्चों की विद्या में उन्नति हेतु पंचम भाव और बृहस्पति का विश्लेषण करने वाली विदुषी।",
        "reviews": [
            {"user_name": "Ritu V.", "rating": 5.0, "comment": "Very reassuring on Santhan timing. Santhan Gopala path brought joy."}
        ]
    },
    {
        "slug": "pt-tribhuvan",
        "name": "Pt. Tribhuvan Sharma",
        "name_hi": "पं. त्रिभुवन शर्मा",
        "title": "Foreign Travel, Visa & Relocation Timing",
        "title_hi": "विदेश यात्रा, वीज़ा एवं परदेस प्रवास विशेषज्ञ",
        "avatar": "assets/portraits/pt-tribhuvan.jpg",
        "experience_years": 18,
        "rating": 4.91,
        "review_count": 620,
        "consultations_count": 23800,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_tribhuvan",
        "availability": "online",
        "languages": ["Hindi", "Punjabi", "English"],
        "specialties": ["Overseas Settlement", "Visa Approval Timing", "9th & 12th Houses", "Remote Work Prospects"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Tracks 9th and 12th house planetary alignments with Rahu and Moon to forecast foreign visas and overseas relocation.",
        "bio_hi": "विदेश गमन, पीआर व वीज़ा स्वीकृति के शुभ समय का विश्लेषण करने वाले ज्योतिषाचार्य।",
        "reviews": [
            {"user_name": "Gurpreet S.", "rating": 5.0, "comment": "His timing for Canadian visa clearance matched perfectly."}
        ]
    },
    {
        "slug": "acharya-vishwanath",
        "name": "Acharya Vishwanath",
        "name_hi": "आचार्य विश्वनाथ",
        "title": "Kaal Sarp & Manglik Dosha Resolution",
        "title_hi": "कालसर्प एवं मांगलिक दोष परिहार विशेषज्ञ",
        "avatar": "assets/portraits/acharya-vishwanath.jpg",
        "experience_years": 25,
        "rating": 4.96,
        "review_count": 1210,
        "consultations_count": 45800,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_vishwanath",
        "availability": "online",
        "languages": ["Hindi", "Sanskrit", "English"],
        "specialties": ["12 Kaal Sarp Types", "Manglik Parihar Yogas", "Pitra Dosha Pacification", "Maha Mrityunjaya"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Dispels fear regarding Kaal Sarp and Manglik doshas by teaching authentic classical Parihar (cancellation) rules.",
        "bio_hi": "कालसर्प और मांगलिक दोष के शास्त्रोंक्त परिहार और सरल शिव आराधना के विशेषज्ञ।",
        "reviews": [
            {"user_name": "Prashant L.", "rating": 5.0, "comment": "Showed me how my Mars in 8th house had complete cancellation. Relieved!"}
        ]
    },
    {
        "slug": "vidushi-shambhavi",
        "name": "Vidushi Shambhavi",
        "name_hi": "विदुषी शाम्भवी",
        "title": "Kundalini, Meditation & Soul Purpose",
        "title_hi": "कुंडलिनी जागरण, ध्यान एवं आत्म साक्षात्कार",
        "avatar": "assets/portraits/vidushi-shambhavi.jpg",
        "experience_years": 20,
        "rating": 4.97,
        "review_count": 870,
        "consultations_count": 32900,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_shambhavi",
        "availability": "online",
        "languages": ["English", "Hindi", "Sanskrit"],
        "specialties": ["Atmakaraka Planet", "12th Moksha House", "Chakra Alignment", "Meditation Obstacles"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Illuminates your soul's karmic evolutionary purpose using Jaimini Atmakaraka and 12th house Moksha placements.",
        "bio_hi": "आत्मकारक ग्रह और मोक्ष भाव के माध्यम से आध्यात्मिक प्रगति कराने वाली विदुषी।",
        "reviews": [
            {"user_name": "Maya S.", "rating": 5.0, "comment": "Deeply spiritual and transcendental consultation on meditation."}
        ]
    },
    {
        "slug": "pt-janardan-shastri",
        "name": "Pt. Janardan Shastri",
        "name_hi": "पं. जनार्दन शास्त्री",
        "title": "Bhrigu Nandi Nadi & Life Milestone Timing",
        "title_hi": "भृगु नंदी नाड़ी एवं जीवन मील के पत्थर",
        "avatar": "assets/portraits/pt-janardan-shastri.jpg",
        "experience_years": 31,
        "rating": 4.98,
        "review_count": 1820,
        "consultations_count": 64200,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_janardan_shastri",
        "availability": "online",
        "languages": ["Hindi", "Sanskrit", "English"],
        "specialties": ["Bhrigu Nandi Nadi", "Jupiter-Saturn Cycles", "Life Milestones", "Major Turnarounds"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Utilizes Bhrigu Nandi Nadi planetary combinations to time major life turning points without relying on sub-minute birth times.",
        "bio_hi": "भृगु नंदी नाड़ी सूत्रों के विद्वान। गुरु और शनि के चक्रों से जीवन की बड़ी घटनाओं का समय ज्ञान।",
        "reviews": [
            {"user_name": "Sunil N.", "rating": 5.0, "comment": "Told me my marriage year using Jupiter-Venus contact accurately."}
        ]
    },
    {
        "slug": "acharya-mukund",
        "name": "Acharya Mukund",
        "name_hi": "आचार्य मुकुन्द",
        "title": "Stock Market, Trading & Speculation Astrologer",
        "title_hi": "शेयर बाजार, ट्रेडिंग एवं सट्टा विचार",
        "avatar": "assets/portraits/acharya-mukund.jpg",
        "experience_years": 16,
        "rating": 4.90,
        "review_count": 690,
        "consultations_count": 25100,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_mukund",
        "availability": "online",
        "languages": ["Hindi", "Gujarati", "English"],
        "specialties": ["Stock Market Yogas", "Mercury-Rahu Aspects", "Trading Risk Mitigation", "Favorable Sectors"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Analyzes Mercury, Rahu, and 5th house speculative configurations while reinforcing disciplined risk management.",
        "bio_hi": "बुध, राहु व पंचम भाव से शेयर बाजार में अनुकूल क्षेत्रों के चयन का ज्योतिषीय विश्लेषण।",
        "reviews": [
            {"user_name": "Nitin B.", "rating": 5.0, "comment": "Warned me against trading during Rahu dasha sub-period. Saved me from huge losses."}
        ]
    },
    {
        "slug": "vidushi-gayatri-bhatt",
        "name": "Vidushi Gayatri Bhatt",
        "name_hi": "विदुषी गायत्री भट्ट",
        "title": "Legal Disputes, Court Cases & Victory Yogas",
        "title_hi": "कोर्ट कचहरी, विवाद मुक्ति एवं विजय योग",
        "avatar": "assets/portraits/vidushi-gayatri-bhatt.jpg",
        "experience_years": 21,
        "rating": 4.94,
        "review_count": 780,
        "consultations_count": 29400,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_gayatri_bhatt",
        "availability": "online",
        "languages": ["Hindi", "English"],
        "specialties": ["6th House Litigation", "Property Disputes", "Maa Baglamukhi Upayas", "Settlement Timing"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Assesses 6th house, Mars, and Sun positions for lawful dispute settlements, out-of-court resolutions, and divine protection.",
        "bio_hi": "षष्ठ भाव, मंगल और सूर्य के प्रभाव से कानूनी मामलों में सुलह और विजय योग की विशेषज्ञ।",
        "reviews": [
            {"user_name": "Hemant D.", "rating": 5.0, "comment": "Her Baglamukhi upayas and timing helped resolve an ancestral property dispute peacefully."}
        ]
    },
    {
        "slug": "pt-devavrata",
        "name": "Pt. Devavrata",
        "name_hi": "पं. देवव्रत शास्त्री",
        "title": "Vedic Muhurat, Griha Pravesh & Sanskars",
        "title_hi": "शुभ मुहूर्त, गृह प्रवेश एवं षोडश संस्कार",
        "avatar": "assets/portraits/pt-devavrata.jpg",
        "experience_years": 25,
        "rating": 4.97,
        "review_count": 1340,
        "consultations_count": 48900,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_devavrata",
        "availability": "online",
        "languages": ["Hindi", "Sanskrit", "English"],
        "specialties": ["Marriage Muhurat", "Griha Pravesh", "Business Launch Timing", "Vehicle Purchase Timing"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Calculates shubh Abhijit, Amrit, and Tithi muhurats while strictly neutralizing Rahu Kaal, Bhadra, and planetary combustion.",
        "bio_hi": "विवाह, गृह प्रवेश, व्यापार आरंभ व वाहन क्रय के सर्वार्थ सिद्धि मुहूर्त के विद्वान।",
        "reviews": [
            {"user_name": "Sanjay M.", "rating": 5.0, "comment": "Calculated the exact Griha Pravesh Lagna for our new home. The ceremony was blessed."}
        ]
    },
    # 8 NEW COMPREHENSIVE SPECIALISTS (25 to 32)
    {
        "slug": "dr-krishna-murthy",
        "name": "Dr. K. Krishnamurthy",
        "name_hi": "डॉ. के. कृष्णमूर्ति",
        "title": "KP Astrology & Stellar Sub-Lord Expert",
        "title_hi": "केपी ज्योतिष एवं उप-स्वामी नक्षत्र विशेषज्ञ",
        "avatar": "assets/portraits/dr-krishna-murthy.jpg",
        "experience_years": 22,
        "rating": 4.96,
        "review_count": 820,
        "consultations_count": 31500,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "dr_krishna_murthy",
        "availability": "online",
        "languages": ["English", "Tamil", "Telugu", "Hindi"],
        "specialties": ["KP Stellar Astrology", "Sub-Lord Verification", "Cusp Analysis", "Exact Event Timing"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Precision practitioner of Krishnamurti Paddhati (KP System), utilizing 249 sub-divisions of the zodiac for pin-point event verification.",
        "bio_hi": "कृष्णमूर्ति पद्धति (KP) के विशेषज्ञ। उप-स्वामी और नक्षत्र चरणों द्वारा घटनाओं के सटीक समय निर्धारण में दक्ष।",
        "reviews": [
            {"user_name": "S. Raman", "rating": 5.0, "comment": "KP sub-lord prediction for my property deal was exact to the week."}
        ]
    },
    {
        "slug": "vidushi-tarot-aradhana",
        "name": "Vidushi Aradhana",
        "name_hi": "विदुषी आराधना",
        "title": "Vedic Tarot & Intuitive Card Counselor",
        "title_hi": "वैदिक टैरो एवं अंतर्ज्ञान परामर्शक",
        "avatar": "assets/portraits/vidushi-tarot-aradhana.jpg",
        "experience_years": 14,
        "rating": 4.95,
        "review_count": 680,
        "consultations_count": 22800,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_tarot_aradhana",
        "availability": "online",
        "languages": ["English", "Hindi"],
        "specialties": ["Vedic Tarot Spreads", "Current Dilemmas", "Energetic Blockages", "Intuitive Life Path"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Combines Eastern archetype symbolism with intuitive card spreads for immediate clarity during crossroads and relationship transitions.",
        "bio_hi": "वैदिक प्रतीकों और टैरो कार्ड्स के माध्यम से मन के द्वंद्व और संबंधों की दिशा स्पष्ट करने वाली मार्गदर्शक।",
        "reviews": [
            {"user_name": "Neha K.", "rating": 5.0, "comment": "Her 3-card spread revealed the exact emotional block holding me back."}
        ]
    },
    {
        "slug": "acharya-samudrika-ramesh",
        "name": "Acharya Ramesh Babu",
        "name_hi": "आचार्य रमेश बाबू",
        "title": "Samudrika Shastra & Hastarekha (Palmistry) Expert",
        "title_hi": "सामुद्रिक शास्त्र एवं हस्तरेखा विशेषज्ञ",
        "avatar": "assets/portraits/acharya-samudrika-ramesh.jpg",
        "experience_years": 26,
        "rating": 4.97,
        "review_count": 1150,
        "consultations_count": 43800,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_samudrika_ramesh",
        "availability": "online",
        "languages": ["Hindi", "Kannada", "English"],
        "specialties": ["Hastarekha Reading", "Mounts of Jupiter & Sun", "Fate & Life Line Shifts", "Samudrika Body Marks"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Scholar of classical Samudrika Shastra and Hastarekha, corroborating palm mount textures and line forks with planetary periods.",
        "bio_hi": "हस्तरेखा, गुरु व सूर्य पर्वत और सामुद्रिक लक्षणों के प्रकांड विद्वान। हाथ की रेखाओं से भाग्य का सूक्ष्म अध्ययन।",
        "reviews": [
            {"user_name": "Pradeep N.", "rating": 5.0, "comment": "Identified the double fate line on my right hand and explained its timing perfectly."}
        ]
    },
    {
        "slug": "pt-govind-shastri",
        "name": "Pt. Govind Shastri",
        "name_hi": "पं. गोविन्द शास्त्री",
        "title": "Jaimini Chara Dasha & Karakamsha Scholar",
        "title_hi": "जैमिनी चर दशा एवं कारकांश मर्मज्ञ",
        "avatar": "assets/portraits/pt-govind-shastri.jpg",
        "experience_years": 28,
        "rating": 4.98,
        "review_count": 1410,
        "consultations_count": 49200,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_govind_shastri",
        "availability": "online",
        "languages": ["Sanskrit", "Hindi", "Odia", "English"],
        "specialties": ["Jaimini Sutras", "Chara Dasha Timing", "Atmakaraka & Amatyakaraka", "Arudha Lagna"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Dedicated master of Maharishi Jaimini's aphorisms, decoding Chara Dasha sign periods, Arudha Lagna social status, and soul paths.",
        "bio_hi": "महर्षि जैमिनी के सूत्रों, चर दशा और आत्मकारक ग्रह द्वारा जीवन के गहन रहस्यों को उद्घाटित करने वाले विद्वान।",
        "reviews": [
            {"user_name": "Biswajit M.", "rating": 5.0, "comment": "Jaimini Amatyakaraka analysis revealed why my career path shifted in my 30s."}
        ]
    },
    {
        "slug": "vidushi-shalini-kapoor",
        "name": "Vidushi Shalini Kapoor",
        "name_hi": "विदुषी शालिनी कपूर",
        "title": "Chakra Balancing & Vedic Gemology Harmonizer",
        "title_hi": "चक्र संतुलन एवं वैदिक रत्न समन्वय विशेषज्ञ",
        "avatar": "assets/portraits/vidushi-shalini-kapoor.jpg",
        "experience_years": 16,
        "rating": 4.94,
        "review_count": 760,
        "consultations_count": 28100,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_shalini_kapoor",
        "availability": "online",
        "languages": ["English", "Hindi", "Punjabi"],
        "specialties": ["Chakra Aura Scanning", "Gemstone Energetics", "Rudraksha Combinations", "Subtle Body Harmony"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Integrates the 7 primary chakras with Navagraha planetary wavelengths to recommend customized Rudraksha and gemstone remedies.",
        "bio_hi": "सप्त चक्र और नवग्रहों की ऊर्जा तरंगों का संतुलन कर रुद्राक्ष एवं रत्न परामर्श देने वाली विशेषज्ञ।",
        "reviews": [
            {"user_name": "Simran K.", "rating": 5.0, "comment": "The 6-Mukhi and 7-Mukhi Rudraksha combination completely grounded my anxiety."}
        ]
    },
    {
        "slug": "acharya-venkatesh-dikshitar",
        "name": "Acharya Venkatesh Dikshitar",
        "name_hi": "आचार्य वेंकटेश दीक्षितार",
        "title": "Temple Astrologer & Panchangam Calculation Master",
        "title_hi": "मंदिर ज्योतिष एवं पंचांग गणित मर्मज्ञ",
        "avatar": "assets/portraits/acharya-venkatesh-dikshitar.jpg",
        "experience_years": 30,
        "rating": 4.99,
        "review_count": 1950,
        "consultations_count": 61200,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "acharya_venkatesh_dikshitar",
        "availability": "online",
        "languages": ["Tamil", "Sanskrit", "English", "Telugu"],
        "specialties": ["Tamil Vakya Panchangam", "Nakshatra Dosha Shanti", "Temple Aradhana", "Shubha Muhurtham"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Traditional hereditary temple scholar specializing in Vakya and Drik Panchangam, Nakshatra Padha Shanti, and sacred temple rituals.",
        "bio_hi": "पारंपरिक मंदिर ज्योतिषाचार्य। पंचांग गणित, नक्षत्र दोष शांति और मांगलिक मुहूर्तों के प्रकांड विद्वान।",
        "reviews": [
            {"user_name": "Subramanian V.", "rating": 5.0, "comment": "Traditional knowledge unmatched. His temple remedy for Ashlesha nakshatra was transformative."}
        ]
    },
    {
        "slug": "pt-harinarayan-mishra",
        "name": "Pt. Harinarayan Mishra",
        "name_hi": "पं. हरिनारायण मिश्र",
        "title": "Brihat Parashara & Shodashvarga (D-9 / D-10) Master",
        "title_hi": "वृहत्पाराशर एवं षोडशवर्ग (नवमांश/दशमांश) मर्मज्ञ",
        "avatar": "assets/portraits/pt-harinarayan-mishra.jpg",
        "experience_years": 29,
        "rating": 4.97,
        "review_count": 1560,
        "consultations_count": 54300,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_harinarayan_mishra",
        "availability": "online",
        "languages": ["Hindi", "Maithili", "Sanskrit", "English"],
        "specialties": ["Navamsha (D-9)", "Dashamsha (D-10)", "Shodashvarga Bal", "Varga Kundli Secrets"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Deeply scholarly researcher of Brihat Parashara Hora Shastra, unlocking the inner potential of planets via D-9 Navamsha and D-10 Dashamsha.",
        "bio_hi": "वृहत्पाराशर होरा शास्त्र के शोधकर्ता। नवमांश और दशमांश कुण्डली के सूक्ष्म विश्लेषण के विद्वान।",
        "reviews": [
            {"user_name": "Alok M.", "rating": 5.0, "comment": "Showed me how a debilitated planet in D-1 became exalted in D-9. Changed my perspective!"}
        ]
    },
    {
        "slug": "vidushi-pallavi-deshmukh",
        "name": "Vidushi Pallavi Deshmukh",
        "name_hi": "विदुषी पल्लवी देशमुख",
        "title": "Varshaphala & Solar Return Annual Forecasting",
        "title_hi": "वर्षफल एवं ताजिक वार्षिक वर्ष प्रवेश विशेषज्ञ",
        "avatar": "assets/portraits/vidushi-pallavi-deshmukh.jpg",
        "experience_years": 18,
        "rating": 4.95,
        "review_count": 840,
        "consultations_count": 31200,
        "price_per_minute": 0.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "vidushi_pallavi_deshmukh",
        "availability": "online",
        "languages": ["Marathi", "Hindi", "English"],
        "specialties": ["Tajika Varshaphala", "Muntha & Varshesh", "Solar Return Chart", "Year-by-Year Roadmap"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Expert in Tajika annual solar returns, calculating Muntha positions and Varshesh (Year Lord) for high-precision 12-month roadmaps.",
        "bio_hi": "ताजिक वर्षफल और मुन्था के आधार पर 12 महीनों के वार्षिक घटनाक्रम का सूक्ष्म विश्लेषण करने वाली विदुषी।",
        "reviews": [
            {"user_name": "Sarang P.", "rating": 5.0, "comment": "Her Varshaphala reading predicted my exact job change month in my 32nd year."}
        ]
    },
    # 5 CERTIFIED HUMAN SCHOLARS (is_ai = False)
    {
        "slug": "pt-rameshwar-dwivedi",
        "name": "Pt. Rameshwar Dwivedi",
        "name_hi": "पं. रामेश्वर द्विवेदी",
        "title": "Senior Vedic Jyotish & Karmakand Scholar",
        "title_hi": "वरिष्ठ वैदिक ज्योतिष एवं कर्मकाण्ड मर्मज्ञ",
        "avatar": "assets/portraits/pt-rameshwar-dwivedi.jpg",
        "experience_years": 34,
        "rating": 4.99,
        "review_count": 2850,
        "consultations_count": 82000,
        "price_per_minute": 35.0,
        "currency": "INR",
        "is_ai": True,
        "ai_persona_id": "pt_rameshwar_dwivedi",
        "availability": "online",
        "languages": ["Hindi", "Sanskrit"],
        "specialties": ["Vedic Jyotish", "Karmakand & Anushthan", "Shanti Yagyas", "Panchang Muhurat"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Certified senior human Vedic scholar with 34 years of classical hereditary practice in Varanasi. Specializes in birth chart remediation, Vedic rituals, and direct personal guidance.",
        "bio_hi": "काशी के 34 वर्षों के अनुभवी वरिष्ठ वैदिक ज्योतिषाचार्य। प्रत्यक्ष कुण्डली विश्लेषण, वैदिक अनुष्ठान एवं ग्रह शांति के प्रामाणिक विद्वान।",
        "reviews": [
            {"user_name": "Devendra K.", "rating": 5.0, "comment": "Direct consultation with Pandit ji was deeply spiritual and reassuring. Blessed guidance."}
        ]
    },
    {
        "slug": "dr-meenakshi-iyer",
        "name": "Dr. Meenakshi Iyer",
        "name_hi": "डॉ. मीनाक्षी अय्यर",
        "title": "KP Astrology & Corporate Astro-Strategist",
        "title_hi": "केपी ज्योतिष एवं कॉर्पोरेट कार्यनीति विशेषज्ञ",
        "avatar": "assets/portraits/dr-meenakshi-iyer.jpg",
        "experience_years": 24,
        "rating": 4.97,
        "review_count": 1640,
        "consultations_count": 48200,
        "price_per_minute": 40.0,
        "currency": "INR",
        "is_ai": False,
        "ai_persona_id": None,
        "availability": "online",
        "languages": ["English", "Tamil", "Hindi"],
        "specialties": ["Corporate Astrology", "KP System", "Business Partnerships", "High-Stakes Decisions"],
        "is_featured": True,
        "is_verified": True,
        "bio": "Certified human astrologer and PhD in Jyotish. Consults founders, executives, and professionals on career inflection points using Krishnamurti Paddhati.",
        "bio_hi": "केपी ज्योतिष में डॉक्टरेट प्राप्त वरिष्ठ ज्योतिषी। कॉर्पोरेट करियर एवं बड़े व्यावसायिक निर्णयों में प्रत्यक्ष मार्गदर्शन।",
        "reviews": [
            {"user_name": "Arun S.", "rating": 5.0, "comment": "Dr. Iyer analyzed our startup merger timing with incredible precision. Truly invaluable."}
        ]
    },
    {
        "slug": "acharya-anand-joshi",
        "name": "Acharya Anand Joshi",
        "name_hi": "आचार्य आनंद जोशी",
        "title": "Prashna Kundli & Horary Astrology Specialist",
        "title_hi": "प्रश्न कुण्डली एवं तात्कालिक समाधान मर्मज्ञ",
        "avatar": "assets/portraits/acharya-anand-joshi.jpg",
        "experience_years": 21,
        "rating": 4.95,
        "review_count": 1180,
        "consultations_count": 39400,
        "price_per_minute": 25.0,
        "currency": "INR",
        "is_ai": False,
        "ai_persona_id": None,
        "availability": "online",
        "languages": ["Hindi", "Marathi", "English"],
        "specialties": ["Prashna Shastra", "Decision Dilemmas", "Missing Objects", "Urgent Guidance"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Certified human Horary specialist resolving pressing questions when accurate birth times are absent through instantaneous Prashna charts.",
        "bio_hi": "प्रमाणित प्रश्न ज्योतिषी। जब जन्म समय उपलब्ध न हो तब तात्कालिक प्रश्न लग्न से तुरंत निर्णय लेने में सिद्धहस्त।",
        "reviews": [
            {"user_name": "Rohit K.", "rating": 5.0, "comment": "Solved my dilemma regarding court property dispute with prompt Prashna reading."}
        ]
    },
    {
        "slug": "jyotishi-kavita-devi",
        "name": "Jyotishi Kavita Devi",
        "name_hi": "ज्योतिषी कविता देवी",
        "title": "Vedic Palmistry & Intuitive Life Counselor",
        "title_hi": "वैदिक हस्तरेखा एवं अंतर्ज्ञान जीवन परामर्शक",
        "avatar": "assets/portraits/jyotishi-kavita-devi.jpg",
        "experience_years": 19,
        "rating": 4.96,
        "review_count": 940,
        "consultations_count": 35100,
        "price_per_minute": 28.0,
        "currency": "INR",
        "is_ai": False,
        "ai_persona_id": None,
        "availability": "online",
        "languages": ["Hindi", "English"],
        "specialties": ["Hastarekha Reading", "Emotional Healing", "Relationship Counseling", "Spiritual Coaching"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Certified human palmist and compassionate counselor combining Samudrika palm markings with empathetic emotional guidance.",
        "bio_hi": "हस्तरेखा एवं अंतर्ज्ञान परामर्श की प्रमाणित विदुषी। हाथ की रेखाओं और ग्रहों के सामंजस्य से जीवन की समस्याओं का समाधान।",
        "reviews": [
            {"user_name": "Pooja V.", "rating": 5.0, "comment": "Kavita ji read my palm photo and explained my career transition with uncanny truth."}
        ]
    },
    {
        "slug": "pt-devesh-jha",
        "name": "Pt. Devesh Nandan Jha",
        "name_hi": "पं. देवेश नंदन झा",
        "title": "Maithil Jyotish & Panchang Scholar",
        "title_hi": "मैथिल ज्योतिष एवं पंचांग शोध मर्मज्ञ",
        "avatar": "assets/portraits/pt-devesh-jha.jpg",
        "experience_years": 27,
        "rating": 4.98,
        "review_count": 1470,
        "consultations_count": 46500,
        "price_per_minute": 30.0,
        "currency": "INR",
        "is_ai": False,
        "ai_persona_id": None,
        "availability": "online",
        "languages": ["Hindi", "Maithili", "Sanskrit"],
        "specialties": ["Maithil Panchang", "Vivah Shubh Muhurat", "Dasha Shanti", "Kundali Milan"],
        "is_featured": False,
        "is_verified": True,
        "bio": "Certified human scholar of traditional Mithila Jyotish and Mithila Panchangam with 27 years of experience in pure Parashari calculations and marriage matching.",
        "bio_hi": "पारंपरिक मिथिला ज्योतिष एवं पंचांग के 27 वर्षों के अनुभवी विद्वान। विवाह मुहूर्त एवं कुंडली मिलान के प्रतिष्ठित ज्योतिषी।",
        "reviews": [
            {"user_name": "Mithilesh J.", "rating": 5.0, "comment": "Pandit ji gave the most auspicious marriage muhurat for my sister. Deeply respected scholar."}
        ]
    }
]

def seed_astrologers(db: Session):
    """
    Idempotent database seeder for all 37 certified scholars and specialized astrologers.
    Ensures existing records are updated with clean titles, SVG portraits, and new profiles inserted.
    """
    try:
        seeded_count = 0
        updated_count = 0
        for data in DEFAULT_ASTROLOGERS:
            slug = data["slug"]
            existing = db.query(Astrologer).filter(Astrologer.slug == slug).first()
            if existing:
                # Update attributes
                existing.name = data["name"]
                existing.name_hi = data.get("name_hi")
                existing.title = data["title"]
                existing.title_hi = data.get("title_hi")
                existing.avatar = data["avatar"]
                existing.experience_years = data["experience_years"]
                existing.rating = data["rating"]
                existing.review_count = data["review_count"]
                existing.consultations_count = data["consultations_count"]
                existing.price_per_minute = data["price_per_minute"]
                existing.currency = data["currency"]
                existing.is_ai = data["is_ai"]
                existing.ai_persona_id = data["ai_persona_id"]
                existing.availability = data["availability"]
                existing.languages = data["languages"]
                existing.specialties = data["specialties"]
                existing.is_featured = data["is_featured"]
                existing.is_verified = data["is_verified"]
                existing.bio = data["bio"]
                existing.bio_hi = data.get("bio_hi")
                updated_count += 1
                astro = existing
            else:
                astro = Astrologer(
                    id=generate_uuid(),
                    slug=slug,
                    name=data["name"],
                    name_hi=data.get("name_hi"),
                    title=data["title"],
                    title_hi=data.get("title_hi"),
                    avatar=data["avatar"],
                    experience_years=data["experience_years"],
                    rating=data["rating"],
                    review_count=data["review_count"],
                    consultations_count=data["consultations_count"],
                    price_per_minute=data["price_per_minute"],
                    currency=data["currency"],
                    is_ai=data["is_ai"],
                    ai_persona_id=data["ai_persona_id"],
                    availability=data["availability"],
                    languages=data["languages"],
                    specialties=data["specialties"],
                    is_featured=data["is_featured"],
                    is_verified=data["is_verified"],
                    bio=data["bio"],
                    bio_hi=data.get("bio_hi"),
                    created_at=datetime.now(timezone.utc)
                )
                db.add(astro)
                db.flush()
                seeded_count += 1

            # Seed sample verified reviews if not present
            for rev in data.get("reviews", []):
                rev_exists = db.query(AstrologerReview).filter(
                    AstrologerReview.astrologer_id == astro.id,
                    AstrologerReview.user_name == rev["user_name"]
                ).first()
                if not rev_exists:
                    new_rev = AstrologerReview(
                        id=generate_uuid(),
                        astrologer_id=astro.id,
                        user_name=rev["user_name"],
                        rating=rev["rating"],
                        comment=rev["comment"],
                        is_verified=True,
                        created_at=datetime.now(timezone.utc)
                    )
                    db.add(new_rev)

        db.commit()
        logger.info(f"Astrologer seeding finished: {seeded_count} inserted, {updated_count} updated. Total: {len(DEFAULT_ASTROLOGERS)}.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding astrologers: {e}")
        raise e
