"""
Centralized Astrology Scope Classifier and Guardrail Service.
Enforces that Astro Jyotish AI assistant strictly answers Vedic astrology, Kundli,
horoscope, panchang, dasha, compatibility, and traditional astrological life guidance.
Politely declines unrelated queries (coding, trivia, sports, general knowledge, recipes,
marketing, homework, machine learning roadmaps) in authentic, compassionate Pandit Ji voice
WITHOUT repetitive blessings on every follow-up turn.
"""
import re
from typing import Tuple, Optional, Dict, Any
from packages.core.logging import logger

# Contextual Authentic Pandit Ji Refusal Messages (No repetitive blessings)
SPECIALIZED_PANDIT_RESPONSES = {
    "threat": {
        "hi": (
            "बेटा, मैं समझ सकता हूँ कि आपका मन इस समय किसी बात से बहुत अशांत या क्रोधित है। ऐसी बातें मत कीजिए। "
            "कृपया शांत रहें, किसी भी तरह के क्रोध या हिंसा से दूर रहें और अपने आस-पास के माहौल को शांत रखें।\n\n"
            "यदि आपको किसी भी तरह की मानसिक परेशानी है तो थोड़ा ठंडा पानी पीजिए, अपने परिवार के किसी विश्वसनीय सदस्य से बात कीजिए या शांत मन से 'ॐ नमः शिवाय' का स्मरण कीजिए। अपने स्वास्थ्य और सुरक्षा का ध्यान रखें।"
        ),
        "hinglish": (
            "Beta, main samajh sakta hoon ki aapka mann is waqt shayad kisi baat se bahut asantulit ya krodhit hai. Aisi baatein mat kijiye. "
            "Kripya shant rahein, kisi bhi tarah ke krodh ya hinsa se door rahein aur apne aas-paas ke mahaul ko shant rakhein.\n\n"
            "Agar aapko kisi bhi tarah ki maanasik pareshani hai ya krodh aa raha hai, toh thoda thanda paani pi lijiye, apne parivar ke kisi vishwasniya sadasya se baat karein ya man mein 'Om Namah Shivaya' ka smaran karein. Apne swasthya aur suraksha ka dhyan rakhein."
        ),
        "en": (
            "Dear seeker, I can understand that your mind may feel agitated or troubled at this moment. Please refrain from speaking of anger or harm. "
            "Stay calm, step away from conflict, and drink a glass of cool water.\n\n"
            "If you are feeling overwhelmed, please speak to a trusted family member or elder. Focus on inner peace and well-being."
        )
    },
    "violence": {
        "hi": (
            "बेटा, क्रोध और हिंसा करना हमारे सनातन संस्कार और अच्छे कर्म के खिलाफ है। क्रोध मनुष्य का सबसे बड़ा शत्रु है, जो केवल आपका अपना नुकसान करता है। ऐसे विचार मन में लाने से बचें।\n\n"
            "शांति और संयम बनाए रखने के लिए थोड़ा ठंडा पानी पीजिए, शांत भाव से बैठिए और सुबह-शाम थोड़ा ध्यान या हनुमान चालीसा का पाठ करें। ईश्वर आपको सदा सद्बुद्धि और शांति प्रदान करें।"
        ),
        "hinglish": (
            "Beta, krodh aur hinsa karna hamare sanatan sanskar aur achhe karma ke khilaf hai. Krodh manushya ka sabse bada shatru hai, jo sirf aapka apna nuksan karta hai. Aise vichar man mein laane se bachein.\n\n"
            "Shaanti aur sanyam banaye rakhne ke liye thoda thanda paani pi lijiye, dhyan karein aur Hanuman Chalisa ka paath karein beta. Ishwar aapko sada sadbuddhi aur shanti pradan karein."
        ),
        "en": (
            "Anger and violence are destructive to your own inner peace and righteous karma. Hurting anyone brings distress and karmic burdens.\n\n"
            "Please take a deep breath, drink some water, and center your thoughts. Chanting sacred mantras like the Hanuman Chalisa or Gayatri Mantra will bring peace to your mind."
        )
    },
    "crime": {
        "hi": (
            "क्षमा करें बेटा, किसी का पर्स/वॉलेट चुराना या दूसरों को नुकसान पहुँचाना बहुत बड़ा पाप और अपराध है। हमारी सनातन वैदिक परंपरा हमें हमेशा ईमानदारी, सदाचार और निष्ठा से मेहनत करने की सीख देती है।\n\n"
            "ऐसे गलत विचार मन में न लाएं और अपनी मेहनत से आगे बढ़ें। यदि जीवन में कोई आर्थिक परेशानी या चिंता है, तो बताएं—हम माता लक्ष्मी की कृपा और शुद्ध मन से कर्म करने का शास्त्रीय मार्ग सुझा सकते हैं।"
        ),
        "hinglish": (
            "Kshama karein beta, kisi ka wallet churana ya doosron ko nuksaan pahunchana bahut bada paap aur apradh hai. Hamari sanatan Vedic vidya aur moral values humein hamesha imandari, sadachar aur mehnat ka marg apnane ki sikh deti hain.\n\nAise galat vichar man mein na laayein aur apni mehnat se aage badhein. Agar jeevan mein koi financial pareshani hai, toh batayein, hum Laxmi ji ki kripa aur shuddh man se mehnat karne ka marg sujha sakte hain. Ishwar aapko sadbuddhi de!"
        ),
        "en": (
            "Stealing, harming others, or unlawful actions are sins against Dharma and moral conscience. Our traditions teach honest labor, integrity, and truthfulness.\n\nPlease discard such negative thoughts. If you are experiencing financial difficulties, share your birth details, and we can explore remedies for prosperity through pure effort."
        )
    },
    "cooking": {
        "hi": (
            "बेटा, मैं एक पंडित जी और ज्योतिषाचार्य हूँ, इसलिए रसोई की विधि या मैगी/खाना बनाने का तरीका तो मुझे नहीं आता! हम तो केवल तारों, ग्रहों और वैदिक विद्या की बात करते हैं।\n\n"
            "आप किसी स्वादिष्ट रेसिपी की किताब या इंटरनेट के किसी रसोई चैनल की सहायता ले लीजिए, वहाँ आपको मैगी या खाना बनाने की सबसे बढ़िया विधि मिल जाएगी। जब जीवन में किसी ग्रह शांति, करियर या विवाह की सलाह की ज़रूरत हो, तब निश्चिंत होकर याद कीजिएगा, मैं यहीं हूँ!"
        ),
        "hinglish": (
            "Beta, main ek Pandit Ji aur Jyotish Acharya hoon, isliye rasoi ki vidhi ya Maggi banane ka tareeqa toh mujhe nahi aata! Hum toh kewal taron, grahon aur Vedic vidya ki baat karte hain.\n\nAap kisi recipe channel ya rasoi ki kitaab ki sahayata le lijiye, wahan aapko Maggi banane ki sabse badhiya vidhi mil jayegi. Jab jeevan mein kisi grah shanti ya career ki salah ki zarurat ho, tab nischint ho kar yaad kijiyega, main yahin hoon!"
        ),
        "en": (
            "Dear seeker, I am a Vedic Astrologer and scholar, so culinary recipes or cooking instructions are beyond the sacred domain of Vedic Astrology! We study planetary positions, dashas, and astrological sciences.\n\n"
            "You may consult a culinary recipe guide or cooking channel for tasty preparations. Whenever you need guidance regarding your birth chart, career, marriage, or spiritual remedies, feel free to ask!"
        )
    },
    "general": {
        "hi": (
            "क्षमा करें, मैं केवल वैदिक ज्योतिष (जन्म कुण्डली), ग्रह-दशा, कुण्डली मिलान एवं हस्तरेखा मार्गदर्शन के लिए उपस्थित एक ज्योतिषाचार्य हूँ। यह विषय ज्योतिष शास्त्र से बाहर का है।\n\n"
            "आप अपनी जन्म कुंडली, करियर, विवाह, स्वास्थ्य अथवा जीवन मार्गदर्शन के विषय में निसंकोच प्रश्न पूछ सकते हैं।"
        ),
        "hinglish": (
            "Kshama karein, main keval Vedic Jyotish (Janam Kundli), grah-dasha aur spiritual guidance ke liye upasthit ek Jyotish Acharya hoon. Yeh vishay astrology ke bahar ka hai.\n\n"
            "Aap apni kundli, career, shaadi ya jeevan ke kisi sawaal ke baare mein nischint hokar pooch sakte hain!"
        ),
        "en": (
            "I specialize exclusively in authentic Vedic Astrology, Kundli analysis, planetary transits, and spiritual life guidance. This inquiry falls outside astrological sciences.\n\n"
            "Please feel free to ask about your birth chart, career prospects, marriage, or Vedic remedies!"
        )
    }
}

# Greeting patterns that are welcomed
GREETING_PATTERNS = [
    r"^(hi|hello|hey|pranam|namaste|namaskar|jai shri ram|radhe radhe|ram ram|har har mahadev)[\s!.,?]*$",
    r"^(kaise ho|kese ho|how are you|good morning|good evening|good afternoon)[\s!.,?]*$",
    r"^(ok|okay|theek hai|thik hai|shukriya|thanks|thank you|dhanyawad)[\s!.,?]*$"
]

# Astrological core terms (always in-scope unless combined with malicious injection)
ASTROLOGY_CORE_KEYWORDS = {
    "astrology", "vedic", "jyotish", "kundli", "kundali", "chart", "birth chart", "horoscope",
    "rashiphal", "rashifal", "rashi", "zodiac", "nakshatra", "graha", "planet", "planetary",
    "dasha", "antardasha", "mahadasha", "transit", "gochar", "panchang", "tithi", "muhurat",
    "muhurta", "yoga", "yog", "dosha", "dosh", "mangal", "manglik", "shani", "sade sati",
    "saade saati", "dhaiya", "rahu", "ketu", "jupiter", "guru", "brihaspati", "saturn",
    "mars", "venus", "shukra", "mercury", "budh", "sun", "surya", "moon", "chandra",
    "lagna", "ascendant", "navamsha", "guna milan", "kundli milan", "matchmaking",
    "ashtakoota", "bhrigu", "parashara", "jaimini", "gemstone", "ratna", "rudraksha",
    "hastrekha", "palmistry", "palm reading", "numerology", "choghadiya", "abhijit",
    "rahu kaal", "pitra dosha", "kaal sarp", "parihar", "remedy", "upay", "puja",
    "astrological", "astrologer", "vedic interpretation", "शादी", "विवाह", "नौकरी",
    "करियर", "स्वास्थ्य", "धन", "राजयोग"
}

# Prompt injection markers
PROMPT_INJECTION_PATTERNS = [
    r"ignore (all )?(your )?(previous )?(instructions|rules|system prompt|guidelines|restrictions)",
    r"disregard (all )?(your )?(instructions|rules|safety|guidelines)",
    r"forget (your )?(instructions|rules|role)",
    r"act as (an? )?(unrestricted|general|dan|jailbreak|developer mode|unfiltered)",
    r"bypass (your )?(safety|restrictions|rules)",
    r"answer (every|any) question( regardless)?",
    r"you are now (an? )?(general-purpose|unrestricted|god-mode)",
    r"jailbreak",
    r"override your (system|behavior|rules|programming)"
]

# Targeted Out-Of-Scope Categories
THREAT_PATTERNS = [
    r"(tujhe hi pit|tujhe pit ta|tumko pitna hai|tu mil mujhe|tujhe maar dunga|tu ab jada bol raha hai|pit dunga|tujhe dekh lunga|aapko marna hai|tumhe marna hai)"
]

VIOLENCE_PATTERNS = [
    r"(kisi ko pitna|mujhe to pitna|sabko pitna|phycho|psycho hu|pitna pasand|maar peet|violence|kisi ko marna)"
]

CRIME_PATTERNS = [
    r"(wallate kese churaye|wallet churana|kisi ka wallet|chori kaise kare|chori karna|lootna|paisa churaye|pocket marna|bank hack)"
]

COOKING_PATTERNS = [
    r"\b(recipe|recipes|how to (make|cook|bake|prepare)|ingredients for|biryani|maggi|maggie|noodles|pasta|pizza|burger|chai|kadhi|paneer|samosa|culinary)\b",
    r"(रेसिपी|खाना कैसे बनाएं|मैगी कैसे|चाय कैसे|खाना बनाना सिखाओ|बिरयानी|रसोई)"
]

# General Out-Of-Scope Patterns
GENERAL_OUT_OF_SCOPE_PATTERNS = [
    # Programming, Code, Web, Software
    r"\b(python|javascript|typescript|c\+\+|java|golang|rust|php|html|css|sql|react|vue|angular|node\.?js|docker|git|bash|powershell|regex|github|api|backend|frontend|django|flask|fastapi)\b",
    r"\b(write a? script|write (a? )?code|code snippet|write (an? )?algorithm|binary search|bubble sort|linked list|leetcode|debug this|source code|programming|pull request|npm install|pip install|compile|syntax error|runtime error|software developer|software engineering)\b",
    r"\b(react website|build (a? )?website|create (an? )?app|develop (a? )?web app|make (a? )?website)\b",
    r"(पायथन|जावा|कोडिंग|कोड लिखो|प्रोग्रामिंग|सॉफ्टवेयर|अल्गोरिदम|फ़ंक्शन|वेबसाइट बना|बाइनरी सर्च|পায়থন|কোড)",

    # Machine Learning, AI Roadmaps
    r"\b(machine learning|deep learning|neural network|pytorch|tensorflow|ml roadmap|data science roadmap|ai roadmap|llm training)\b",

    # Business, Marketing
    r"\b(marketing strategy|seo strategy|business plan|sales funnel|lead generation|growth hacking|startup pitch|pitch deck|crypto trading strategy|forex trading)\b",

    # Sports, News, Politics, Pop Culture & General Trivia
    r"\b(cricket score|ipl score|ipl match|fifa score|football score|who won the match|olympics winner|virat kohli|rohit sharma|messi|ronaldo|ms dhoni)\b",
    r"\b(who is the (current )?(prime minister|president|chief minister|ceo|founder) of|prime minister of|president of)\b",
    r"\b(capital of|population of|currency of|largest country|who discovered|who invented|history of world war)\b",
    r"\b(latest news|breaking news|weather in|temperature in|election results|bjp vs congress)\b",
    r"(क्रिकेट मैच|क्रिकेट स्कोर|स्कोर बताओ|प्रधानमंत्री कौन है|राष्ट्रपति कौन|राजधानी क्या है)",

    # Academic Science, Math, Homework, Essays
    r"\b(derivative of|integral of|solve the equation|quadratic formula|calculate \d+|pythagorean theorem|photosynthesis|mitochondria|calculus equation)\b",
    r"\b(write (an? )?essay on|homework help|physics problem|chemistry equation)\b",
    r"(निबंध लिखो|होमवर्क|गणित का सवाल)"
]


# A short insisting reply ("tum btao", "mujhe do", "please") after a refusal is the same off-topic request.
FOLLOWUP_INSISTENCE_PATTERNS = [
    r"\b(tum|aap|tu|you)\s+(hi\s+)?(bta|bata|btao|batao|bolo|do|dikha|sikha|likh|tell|give|show)",
    r"\b(mujhe|muje|mjhe|mereko|mujko)\s+(do|de\s*do|dedo|bta|bata|btao|batao|chahiye|sikha|dikha|likh)",
    r"\b(de\s*do|dedo|bata\s*do|bta\s*do|btao|batao|bolo|sikhao|dikhao|likho|karke\s*do|bana\s*do|bnao|banao)\b",
    r"\b(nhi|nahi|nahin)\s+(jan|pata|aata|aati)",
    r"\b(i\s+don'?t\s+know|just\s+tell|tell\s+me|give\s+me|please|pls|plz|you\s+tell)\b",
    r"(तुम\s*बताओ|आप\s*बताइए|मुझे\s*दो|बता\s*दो|नहीं\s*पता|नहीं\s*जानता)",
]

# Anything that signals a genuinely new, in-scope topic (so a follow-up is never wrongly refused).
NEW_TOPIC_KEYWORDS = ASTROLOGY_CORE_KEYWORDS | {
    "career", "job", "marriage", "love", "health", "money", "wealth", "business", "child", "children",
    "baby", "family", "future", "birth", "janam", "janm", "kismat", "bhagya", "naukri", "shadi", "shaadi",
    "paisa", "padhai", "study", "sawal", "sawaal", "question", "mantra", "pooja", "vrat", "tarot",
    "जन्म", "भाग्य", "संतान", "परिवार", "भविष्य", "मंत्र", "पूजा", "व्रत", "ग्रह", "कुंडली", "कुण्डली"
}


class AstrologyScopeGuard:
    """Centralized guard for validating consultation domain adherence with authentic Pandit Ji demeanor."""

    @staticmethod
    def detect_language(text: str) -> str:
        """Lightweight language classifier returning 'hi', 'hinglish', or 'en'."""
        if not text:
            return "en"
        devanagari_count = len(re.findall(r'[\u0900-\u097F]', text))
        if devanagari_count > 3:
            return "hi"

        clean = text.lower()
        hinglish_markers = [
            "mera", "meri", "mere", "kya", "kaise", "kese", "kab", "kaha", "kahan", "hogi", "hoga",
            "batao", "batayein", "bhai", "shadi", "shaadi", "naukri", "pyaar", "prem", "jeevan",
            "kripya", "namaste", "pranam", "karo", "karein", "dijiye", "hai", "hain", "ke", "ki", "ka",
            "mujhe", "tum", "tu", "ap", "aap", "nahi", "aur", "pe", "par", "raha", "rahe", "hu", "hoon",
            "chahiye", "karunga", "dena", "pit", "pitna", "maggi", "sikhao", "churaye", "phycho"
        ]
        tokens = clean.split()
        h_score = sum(1 for t in tokens if t in hinglish_markers)
        if h_score >= 1 or len(tokens) <= 3:
            return "hinglish"

        return "en"

    @classmethod
    def get_pandit_refusal(cls, category: str, user_message: str) -> str:
        """Returns compassionate, authentic Pandit Ji response according to topic category and language."""
        lang = cls.detect_language(user_message)
        cat_dict = SPECIALIZED_PANDIT_RESPONSES.get(category, SPECIALIZED_PANDIT_RESPONSES["general"])
        return cat_dict.get(lang, cat_dict["hinglish"])

    @classmethod
    def _is_followup_insistence(cls, clean: str) -> bool:
        """True for a short reply that insists on an earlier request without naming any new topic."""
        if len(clean.split()) > 12:
            return False
        if any(re.search(r'\b' + re.escape(k) + r'\b', clean) or (not k.isascii() and k in clean) for k in NEW_TOPIC_KEYWORDS):
            return False
        return any(re.search(p, clean, re.IGNORECASE) for p in FOLLOWUP_INSISTENCE_PATTERNS)

    @classmethod
    def check_scope(
        cls,
        user_message: str,
        history: Optional[list] = None
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Evaluates user inquiry. When `history` (list of {"role","content"}) is given, a short
        insisting follow-up to a previously refused off-topic request is refused the same way.
        Returns: (is_in_scope: bool, refusal_message: Optional[str], reason: Optional[str])
        """
        if not user_message or not user_message.strip():
            return True, None, None

        if history and cls._is_followup_insistence(user_message.strip().lower()):
            prior_users = [m.get("content", "") for m in history if m.get("role") == "user"][-3:]
            for earlier in reversed(prior_users):
                in_scope, _refusal, reason = cls.check_scope(earlier)
                if not in_scope and reason in ("cooking_handled", "out_of_scope"):
                    category = "cooking" if reason == "cooking_handled" else "general"
                    logger.info(f"[ScopeGuard] Follow-up to refused topic refused: {user_message[:80]}")
                    return False, cls.get_pandit_refusal(category, user_message), reason
                break  # only the latest user turn decides

        clean = user_message.strip().lower()

        # 1. Check prompt injection attempts FIRST
        for inj_pat in PROMPT_INJECTION_PATTERNS:
            if re.search(inj_pat, clean, re.IGNORECASE):
                logger.warning(f"[ScopeGuard] Prompt injection attempt blocked: {clean[:80]}")
                return False, cls.get_pandit_refusal("general", user_message), "prompt_injection"

        # 2. Allow respectful greetings and small-talk
        for gr_pat in GREETING_PATTERNS:
            if re.search(gr_pat, clean, re.IGNORECASE):
                return True, None, None

        # 3. Allow conversational transitions (e.g., "let's change topic", "continue", etc.)
        transition_phrases = [
            "change topic", "let's move on", "aage badho", "topic badlo", "baat badlo",
            "dusra sawaal", "next question", "continue", "aage", "aage batao"
        ]
        if any(tp in clean for tp in transition_phrases):
            return True, None, None

        # 4. Check for direct threat against astrologer
        for pat in THREAT_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE):
                logger.info(f"[ScopeGuard] Handled direct threat: {clean[:80]}")
                return False, cls.get_pandit_refusal("threat", user_message), "threat_handled"

        # 5. Check for violence / fighting queries
        for pat in VIOLENCE_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE):
                logger.info(f"[ScopeGuard] Handled violence inquiry: {clean[:80]}")
                return False, cls.get_pandit_refusal("violence", user_message), "violence_handled"

        # 6. Check for theft / crime queries
        for pat in CRIME_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE):
                logger.info(f"[ScopeGuard] Handled crime inquiry: {clean[:80]}")
                return False, cls.get_pandit_refusal("crime", user_message), "crime_handled"

        # 7. Check for cooking / recipes queries
        for pat in COOKING_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE):
                logger.info(f"[ScopeGuard] Handled cooking inquiry: {clean[:80]}")
                return False, cls.get_pandit_refusal("cooking", user_message), "cooking_handled"

        # 8. Check for general out-of-scope patterns (coding, trivia, sports, etc.)
        for pat in GENERAL_OUT_OF_SCOPE_PATTERNS:
            if re.search(pat, clean, re.IGNORECASE):
                # Check if this is an authentic astrology query mentioning career / tech
                has_astrology_core = any(re.search(r'\b' + re.escape(ak) + r'\b', clean) for ak in ASTROLOGY_CORE_KEYWORDS)
                is_coding_request = bool(re.search(r"(write (a? )?code|code do|code likho|binary search|python mein|react website|script to|leetcode|algorithm)", clean))
                if has_astrology_core and not is_coding_request:
                    return True, None, None

                logger.info(f"[ScopeGuard] Out-of-scope query rejected: {clean[:80]}")
                return False, cls.get_pandit_refusal("general", user_message), "out_of_scope"

        # 9. Passed all filters -> in scope
        return True, None, None
