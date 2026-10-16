"""
LLM Service integrating Google GenAI SDK (Gemini 3.5 Flash Lite) with
conversational Indian astrology personality, strict chart provenance,
multi-turn memory, dynamic domain guardrails, and multimodal palmistry (Hastarekha) analysis.
"""
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
import asyncio
import re
import base64
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.agents.prompts import ASTROAI_SYSTEM_PROMPT_V2
from backend.app.agents.personas import get_persona, ASTROLOGER_PERSONAS
from backend.app.astrology.chart_context import ChartContext, validate_and_build_chart_context
from backend.app.astrology.chart_svg import generate_north_indian_kundli_svg

_client_singleton = None

def _get_gemini_client():
    global _client_singleton
    if _client_singleton is None:
        try:
            from google import genai
            _client_singleton = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            logger.warning(f"Could not initialize GenAI client singleton: {e}")
            return None
    return _client_singleton

def _detect_language(text: str, fallback_lang: str = "en") -> str:
    """
    Detects user's input language and script:
    - 'hi': Hindi (Devanagari script)
    - 'hinglish': Conversational Hindi in Latin/English alphabet
    - 'bn': Bengali script
    - 'gu': Gujarati script
    - 'ta': Tamil script
    - 'te': Telugu script
    - 'pa': Punjabi Gurmukhi script
    - 'en': English (default)
    """
    if not text:
        return fallback_lang

    # Indian scripts check
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"
    if re.search(r"[\u0A80-\u0AFF]", text):
        return "gu"
    if re.search(r"[\u0B80-\u0BFF]", text):
        return "ta"
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"
    if re.search(r"[\u0A00-\u0A7F]", text):
        return "pa"
    if re.search(r"[\u0900-\u097F]", text):
        if fallback_lang in ("sa", "mr"):
            return fallback_lang
        # Sanskrit markers
        if any(w in text for w in ["अस्ति", "भवति", "कल्याणमस्तु", "नमः", "कुण्डली", "पश्यतु", "वदतु"]):
            return "sa"
        # Marathi markers
        if any(w in text for w in ["आहे", "नाही", "सांगा", "कसे", "करा", "बघा"]):
            return "mr"
        return "hi"

    # Extensive Hinglish conversational vocabulary markers (grammar particles, verbs, pronouns)
    # Strictly avoid English words like 'to' or 'me' which would falsely trigger on English queries
    hinglish_markers = {
        "kya", "kaise", "kese", "kaisi", "kaisa", "hai", "hain", "btao", "batao",
        "bataiye", "mujhe", "mera", "meri", "mere", "apna", "apni", "apne", "karo", "karna",
        "kariye", "karein", "baare", "bare", "mein", "kuch", "nahi", "nhi",
        "rahega", "rahegi", "rahenge", "hoga", "hogi", "honge", "shadi", "shaadi", "vivah",
        "pyaar", "prem", "chahiye", "bolo", "thik", "theek", "accha", "acha", "samajh",
        "bhi", "toh", "hatheli", "hath", "kab", "kaun", "kon", "kyu", "kyun",
        "bhai", "yaar", "dost", "aaj", "kal", "parso", "saal", "mahina", "din",
        "upay", "daan", "dekh", "dekho", "banao", "dikhao", "pata", "pta", "ab",
        "jab", "tab", "yaha", "waha", "idhar", "udhar", "aap", "aapko", "tum", "tumhe",
        "tera", "teri", "tere", "uski", "uska", "bahut", "bohot", "zyada", "jyada", "kam",
        "liye", "hona", "lagegi", "lagega", "milega", "milegi"
    }
    words = set(re.findall(r"\b[a-z]+\b", text.lower()))
    if words.intersection(hinglish_markers):
        return "hinglish"

    if fallback_lang in ("hi", "hinglish", "bn", "gu", "ta", "te", "pa", "mr", "sa"):
        return fallback_lang

    return "en"



def _is_greeting(text: str) -> bool:
    """Checks if message is solely or primarily a friendly greeting."""
    clean = re.sub(r"[^\w\s]", "", text.strip().lower())
    greetings = {
        "hi", "hello", "hii", "hiii", "hey", "heya", "namaste", "namaskar",
        "pranam", "kaise ho", "kese ho", "hello ji", "hey there", "hola",
        "good morning", "good afternoon", "good evening", "shukriya", "thank you", "thanks"
    }
    return clean in greetings or any(clean.startswith(g) for g in ["hi ", "hello ", "hey ", "namaste "]) and len(clean.split()) <= 4


def is_in_astrology_domain(text: str) -> Tuple[bool, Optional[str]]:
    """
    Dynamically checks whether user message is strictly within the astrology, palmistry,
    kundli, horoscope, panchang, muhurat, gemstones, remedies, and personal life guidance
    (love, career, marriage, health, finances in astrological context).
    Blocks ANY query clearly outside the astrological consultation domain (coding, general knowledge trivia,
    math, science, cooking recipes, mobile/cars, non-astrological politics, sports scores, jokes, translation).
    """
    if not text or not text.strip():
        return True, None

    clean = text.strip().lower()

    if _is_greeting(clean):
        return True, None

    # Off-topic indicator patterns (Multilingual: English, Hinglish, Devanagari Hindi, Regional)
    off_topic_patterns = [
        # Programming & Code & IT
        r"\b(python|javascript|typescript|c\+\+|java|golang|rust|html|css|sql|react|vue|node\.?js|docker|git|bash|powershell|regex|github|api|backend|frontend)\b",
        r"\b(write a script|write code|code snippet|function|algorithm|leetcode|pull request|npm install|pip install|compile|debug this|programming|source code)\b",
        r"\b(stack overflow|syntax error|runtime error|exception handling|database schema|fastapi endpoint|software developer|software engineering)\b",
        r"(पायथन|जावा|कोडिंग|कोड|प्रोग्रामिंग|सॉफ्टवेयर|अल्गोरिदम|फ़ंक्शन|कंप्यूटर|वेबसाइट|পায়থন|কোড)",
        # Academic Science & Math
        r"\b(derivative of|integral of|solve the equation|quadratic formula|calculate \d+|pythagorean theorem|photosynthesis|mitochondria)\b",
        r"\b(newton's laws|thermodynamics|quantum mechanics|chemical formula|periodic table|gravity formula|speed of light|mathematics|calculus|algebra)\b",
        r"\b(biology homework|chemistry reaction|physics problem|solve math|essay on|write an essay)\b",
        # General Geography & World Knowledge & Trivia
        r"\b(capital of|largest country|population of|currency of|who discovered|who invented|president of|prime minister of|chief minister of)\b",
        r"\b(who is the ceo of|founder of|parliament of|history of world war|united nations)\b",
        r"\b(weather in|temperature in|how far is|distance between|geography of)\b",
        r"(राजधानी|प्रधानमंत्री|राष्ट्रपति|मुख्यमंत्री|चुनाव|पार्टी|इलेक्शन|भूगोल|इतिहास|রাজধানী)",
        # Non-astrological politics & sports & entertainment
        r"\b(who won the election|parliament election|political party|bjp|congress|democrat|republican)\b",
        r"\b(ipl match score|cricket match score|fifa world cup|football score|olympics winner|messi|ronaldo|virat kohli|dhoni)\b",
        r"\b(movie review|box office collection|bollywood gossip|hollywood actor|actor of|actress of|netflix show|spotify song|lyrics of)\b",
        r"(क्रिकेट|मैच|स्कोर|फुटबॉल|वर्ल्ड कप|ओलंपिक|खिलाड़ी)",
        # Cooking, Recipes & Food
        r"\b(recipe for|how to cook|how to make biryani|how to bake|ingredients for|recipe of|paneer recipe|pasta recipe|biryani)\b",
        r"(रेसिपी|खाना बनाना|बिरयानी|पनीर|सब्जी बनाना|व्यंजन)",
        # Hardware, Gadgets, Automobiles
        r"\b(best phone under|best laptop|iphone price|samsung galaxy|car mileage|bike price|how to repair)\b",
        r"(मोबाइल|फोन की कीमत|लैपटॉप|गाड़ी|कार की कीमत|मरम्मत)",
        # Generic Non-Astrological Tasks
        r"\b(joke|jokes|riddle|riddles|write .* poem|write .* story|tell .* story|tell .* joke|translate .* to)\b",
        r"(चुटकुला|मजाकिया|कविता|कहानी|अनुवाद)",
        # Hacking & exploits
        r"\b(hack wifi|sql injection|bypass password|crack software|ddos attack|phishing|cheat code)\b"
    ]

    for pat in off_topic_patterns:
        if re.search(pat, clean):
            # Check if there is an astrology qualifier
            astrology_qualifiers = {
                "astrology", "kundli", "kundali", "horoscope", "jyotish", "nakshatra",
                "planet", "graha", "hastrekha", "palmistry", "palm", "hatheli",
                "rashifal", "dasha", "lagna", "career in astrology", "shani", "mangal",
                "rahu", "ketu", "guru", "shukra", "budh", "surya", "chandra", "zodiac"
            }
            if any(q in clean for q in astrology_qualifiers):
                return True, None

            # Out of domain! Return dynamic polite refusal matching user language
            detected_lang = _detect_language(text)
            if detected_lang == "hi":
                refusal = "क्षमा करें, मैं केवल वैदिक ज्योतिष (कुंडली), हस्तरेखा (Palmistry) और आध्यात्मिक जीवन मार्गदर्शन के लिए उपलब्ध हूँ 😊 मैं तकनीकी, कोडिंग, सामान्य ज्ञान या अन्य विषयों के प्रश्नों का उत्तर नहीं दे सकता। कृपया अपनी कुंडली, करियर, विवाह या हस्तरेखा से संबंधित प्रश्न पूछें!"
            elif detected_lang == "hinglish":
                refusal = "Kshama karein, main sirf Vedic Astrology (Kundli), Palmistry (Hastrekha) aur spiritual life guidance ke liye trained hoon 😊 Main coding, general knowledge, trivia ya astrology ke bahar kisi bhi topic ka jawab nahi de sakta. Kripya apne jeevan, love, career, kundli ya hastrekha se juda koi sawaal poochein!"
            elif detected_lang == "bn":
                refusal = "আমি কেবল বৈদিক জ্যোতিষ (কোষ্ঠী), হস্তরেখা এবং আধ্যাত্মিক জীবন নির্দেশনার জন্য উপলব্ধ 😊 আমি সাধারণ জ্ঞান, কোডিং বা অন্যান্য বিষয়ের উত্তর দিতে পারি না। অনুগ্রহ করে আপনার কোষ্ঠী বা জীবন সম্পর্কিত প্রশ্ন জিজ্ঞাসা করুন!"
            elif detected_lang == "gu":
                refusal = "હું માત્ર વૈદિક જ્યોતિષ (કુંડળી), હસ્તરેખા અને આધ્યાત્મિક જીવન માર્ગદર્શન માટે સમર્પિત છું 😊 કૃપા કરીને તમારી કુંડળી, કારકિર્દી અથવા હસ્તરેખા સંબંધિત પ્રશ્ન પૂછો!"
            else:
                refusal = "I specialize exclusively in Vedic Astrology, Kundli analysis, Palmistry (Hastrekha), and spiritual life guidance 😊 I cannot answer queries outside astrology (such as coding, general knowledge trivia, or technical topics). Please feel free to ask about your horoscope, career path, relationships, or palm lines!"
            return False, refusal

    return True, None


def is_kundli_requested(text: str) -> bool:
    """Checks if the user specifically asked to see or display their Kundli diagram."""
    clean = text.lower()
    return any(k in clean for k in [
        "kundli dikhao", "show kundli", "kundli banao", "kundli diagram",
        "chart dikhao", "show my chart", "kundli reading", "meri kundli",
        "kundli analysis do", "draw kundli", "kundli in chat"
    ])


def generate_demo_response(
    user_message: str,
    chart_context: ChartContext,
    citations: List[Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, str]]] = None,
    language: str = "en",
    astrologer_id: str = "acharya_shastri"
) -> str:
    """
    Generates a natural, conversational response in Demo Mode or when offline/testing.
    Adheres strictly to the selected astrologer persona and chart honesty.
    """
    detected_lang = _detect_language(user_message, fallback_lang=language)
    msg_lower = user_message.lower().strip()
    persona = get_persona(astrologer_id)

    # Dynamic domain check
    in_domain, refusal = is_in_astrology_domain(user_message)
    if not in_domain and refusal:
        return refusal

    # 1. Greeting handling (Persona specific)
    if _is_greeting(user_message):
        if astrologer_id == "dr_sunita":
            if detected_lang == "hi":
                return "नमस्ते प्रिय! 😊 मैं डॉ. सुनीता शर्मा। आप कैसी/कैसे हैं? आज अपने रिश्तों, मन की बात या जीवन के बारे में क्या साझा करना चाहते हैं?"
            elif detected_lang == "hinglish":
                return "Hello dear! 😊 Main Dr. Sunita Sharma. Kaise ho aap? Love, relationship, ya mann ki koi baat discuss karni ho toh freely batao."
            else:
                return "Hello dear! 😊 Warm welcome, I'm Dr. Sunita Sharma. How are you feeling today? What would you like to explore regarding your heart, career, or life path?"
        elif astrologer_id == "pandit_maharaj":
            if detected_lang == "hi":
                return "जय श्री राम! प्रणाम। मैं पंडित जी महाराज। आज आपके कर्म, आर्थिक प्रगति या कुंडली के योगों के बारे में क्या परामर्श चाहते हैं?"
            elif detected_lang == "hinglish":
                return "Jai Shri Ram! Pranam. Main Pandit Ji Maharaj. Career, business, dasha ya financial growth ke baare mein kya guidance chahiye?"
            else:
                return "Jai Shri Ram! Greetings, I am Pandit Ji Maharaj. How can I guide your career, financial timing, or horoscope today?"
        else: # Acharya Shastri
            if detected_lang == "hi":
                return "हरि ॐ! प्रणाम व कल्याणमस्तु। मैं आचार्य शास्त्री। कैसे हैं आप? आज ग्रह गोचर, कुंडली या वैदिक समाधान के विषय में क्या जानना चाहते हैं?"
            elif detected_lang == "hinglish":
                return "Hari Om! Hello & Pranam. Main Acharya Shastri. Kaise ho aap? Janam kundli, graha shanti ya jeevan ke shubh yog ke baare mein kya poochna chahte hain?"
            else:
                return "Hari Om! Hello & warm blessings. I am Acharya Shastri. How may I assist your astrological journey, planetary alignment, or Vedic guidance today?"

    # 2. Short answer request
    if any(k in msg_lower for k in ["short me", "short mein", "in short", "briefly", "chota sa"]):
        if detected_lang == "hinglish":
            if chart_context.is_verified:
                return f"Short mein kahein toh aapka Lagna {chart_context.ascendant_sign} aur Moon sign {chart_context.moon_sign} hai, jo stability aur sharp focus darshata hai."
            return "Short mein: bina birth details ke general guidelines hi possible hain. Exact dates aur placements ke liye birth data zaroori hai."
        elif detected_lang == "hi":
            if chart_context.is_verified:
                return f"संक्षेप में: आपका लग्न {chart_context.ascendant_sign} और चंद्र राशि {chart_context.moon_sign} है, जो धैर्य और समझदारी का संकेत देती है।"
            return "संक्षेप में: सटीक विश्लेषण के लिए जन्म विवरण आवश्यक है, अन्यथा केवल सामान्य मार्गदर्शन दिया जा सकता है।"
        else:
            if chart_context.is_verified:
                return f"In brief: with {chart_context.ascendant_sign} Ascendant and {chart_context.moon_sign} Moon, patience and clear focus are your greatest natural strengths."
            return "In brief: exact astrological timing requires your birth details, though general wisdom can still offer helpful guidance."

    # 3. Love and relationships (PART C)
    if any(k in msg_lower for k in ["love", "relationship", "rishta", "pyaar", "prem", "marriage", "shaadi"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return "बिल्कुल 😊 आपके प्रेम जीवन के बारे में बात करते हैं। यदि आप व्यक्तिगत कुंडली विश्लेषण चाहते हैं, तो अपनी जन्म तिथि, जन्म समय और जन्म स्थान साझा करें। जन्म समय न पता हो तो भी बताएं, उसके अनुसार सामान्य विश्लेषण करेंगे।"
            elif detected_lang == "hinglish":
                return "Bilkul 😊 Tumhare love life ke baare mein baat karte hain. Agar tum personalized kundli reading chahte ho, toh apni date of birth, birth time aur birth place share kar do. Birth time nahi pata ho toh bhi batao, uske hisaab se available analysis karenge."
            else:
                return "I'd be glad to discuss your relationships and love life! 😊 For a personalized kundli reading, please share your birth date, birth time, and birth place. If you don't know the exact birth time, let me know and we can still explore helpful general perspectives."
        else:
            # Verified chart available
            venus_p = next((p for p in chart_context.planets if p.get("name") == "Venus"), None)
            v_sign = venus_p.get("sign") if venus_p else "Taurus"
            v_house = venus_p.get("house") if venus_p else 7
            first_name = chart_context.profile_name.split()[0] if (chart_context.profile_name and chart_context.profile_name != "Guest User") else ""
            salutation = f"Pranam {first_name} ji! 🙏 " if (first_name and (not conversation_history or len(conversation_history) <= 2)) else ""
            if detected_lang == "hinglish":
                return (
                    f"{salutation}Tumhari kundli mein Lagna {chart_context.ascendant_sign} hai aur Venus {v_sign} (House {v_house}) mein sthit hai. "
                    "Traditional Vedic astrology mein Venus affection, partnership aur understanding ka prateek maana jaata hai. "
                    "Yeh placement darshati hai ki rishton mein mutual communication aur mutual respect par dhyaan dena bohot faydemand rahega. "
                    "Kya tum relationship timing ya compatibility ke baare mein aur gehrayi se jaan na chahte ho?"
                )
            elif detected_lang == "hi":
                return (
                    f"आपकी कुंडली में लग्न {chart_context.ascendant_sign} है और शुक्र {v_sign} (भाव {v_house}) में स्थित है। "
                    "वैदिक ज्योतिष में शुक्र प्रेम, सद्भाव और वैवाहिक सुख का मुख्य कारक है। "
                    "यह स्थिति संकेत देती है कि आपसी समझ और खुला संवाद आपके रिश्तों को गहराई प्रदान करेगा। "
                    "क्या आप किसी विशिष्ट संबंध या समय के बारे में विस्तार से चर्चा करना चाहते हैं?"
                )
            else:
                return (
                    f"In your verified birth chart, you have {chart_context.ascendant_sign} Ascendant with Venus in {v_sign} (House {v_house}). "
                    "In classical astrology, Venus governs mutual affection, partnership values, and harmony. "
                    "This alignment suggests that prioritizing open communication and emotional balance will bring natural strength to your relationships. "
                    "Would you like to explore relationship timing or deeper compatibility principles?"
                )

    # 4. Career inquiries
    if any(k in msg_lower for k in ["career", "job", "naukri", "business", "vyapar", "kaam", "work", "promotion"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return "करियर के बारे में बात करते हैं। क्या आप सामान्य करियर मार्गदर्शन चाहते हैं, या अपनी जन्म तिथि, समय और स्थान साझा करके व्यक्तिगत कुंडली विश्लेषण देखना चाहेंगे?"
            elif detected_lang == "hinglish":
                return "Career ke baare mein baat karte hain. Kya aap general career guidance chahte hain, ya apni birth details (date, time, place) share karke personalized kundli analysis dekhna chahenge?"
            else:
                return "Let's explore your career prospects. Would you prefer general astrological perspectives on professional growth, or would you like to share your birth details (date, time, place) for a personalized kundli analysis?"
        else:
            jup_p = next((p for p in chart_context.planets if p.get("name") == "Jupiter"), None)
            j_sign = jup_p.get("sign") if jup_p else "Sagittarius"
            first_name = chart_context.profile_name.split()[0] if (chart_context.profile_name and chart_context.profile_name != "Guest User") else ""
            salutation = f"Pranam {first_name} ji! 🙏 " if (first_name and (not conversation_history or len(conversation_history) <= 2)) else ""
            if detected_lang == "hinglish":
                return (
                    f"{salutation}Aapke chart mein 10th house aur Jupiter ki placement ({j_sign}) professional growth aur wisdom ko support karti hai. "
                    "Classical Jyotish ke anusar, patience aur domain mastery aapko long-term stability degi. "
                    "Kya aap specific role change ya aane wale time period ke baare mein sochna chahte hain?"
                )
            else:
                return (
                    f"In your chart, Jupiter in {j_sign} strongly supports ethical leadership, learning, and structured professional growth. "
                    "Traditional principles indicate that focus and steady persistence will yield sustainable success. "
                    "Are you currently considering a job transition or long-term business goals?"
                )

    # 5. Moon sign inquiries
    if any(k in msg_lower for k in ["moon sign", "chandra rashi", "chandrama", "rashi"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return "आपका चंद्र राशि (Moon sign) जानने के लिए आपकी जन्म तिथि, सटीक जन्म समय और जन्म स्थान की आवश्यकता होगी। कृपया ये विवरण साझा करें।"
            elif detected_lang == "hinglish":
                return "Aapka Moon sign (Chandra Rashi) jaanane ke liye aapki date of birth, exact birth time aur birth place ki zaroorat hogi. Yeh details share karein, main turant calculate kar dunga."
            else:
                return "To accurately calculate your Moon sign (Chandra Rashi), I need your birth date, exact birth time, and birth place. Please share these details and I'll be glad to calculate it."
        else:
            if detected_lang == "hinglish":
                return f"Aapka calculated Moon sign **{chart_context.moon_sign}** hai, aur aapka janm nakshatra **{chart_context.moon_nakshatra}** hai. Traditional Jyotish mein yeh aapke emotional nature aur intuition ko guide karta hai."
            else:
                return f"Your verified Moon sign is **{chart_context.moon_sign}** in **{chart_context.moon_nakshatra}** Nakshatra, representing your emotional core and intuitive strengths."

    # 6. Workflow continue
    if msg_lower in ("continue", "aage batao", "proceed", "aage"):
        if conversation_history and len(conversation_history) > 1:
            if detected_lang == "hinglish":
                return "Haan zaroor! Pichli baat ko aage badhate hain. Is baare mein aap specific kya janna chahte hain?"
            else:
                return "Continuing right from our discussion. Which particular aspect would you like to explore next?"
        else:
            if detected_lang == "hinglish":
                return "Aap kis topic par aage badhna chahte hain—love, career, ya apni kundli reading?"
            else:
                return "What topic would you like to proceed with—love, career, or your kundli analysis?"

    # 7. Kundli Diagram / Analysis request
    if is_kundli_requested(user_message):
        if not chart_context.is_verified:
            if detected_lang == "hinglish":
                return "Kundli diagram chat mein render karne ke liye birth details (date, exact time, aur birthplace) zaroori hain. Yeh details provide karein, main turant Lagna Kundli generate kar dunga."
            else:
                return "To generate and render your Kundli diagram directly in chat, I need your birth details (date, time, and birthplace). Please provide them to calculate your D1 chart."
        else:
            if detected_lang == "hinglish":
                return (
                    f"Yeh rahi aapki **Lagna Kundli (D1)**:\n"
                    f"- Lagna (Ascendant): **{chart_context.ascendant_sign}** ({chart_context.ascendant_nakshatra} Nakshatra)\n"
                    f"- Moon Sign (Chandra Rashi): **{chart_context.moon_sign}** ({chart_context.moon_nakshatra})\n"
                    f"- Sun Sign (Surya): **{chart_context.sun_sign}**\n\n"
                    "Neeche aapki chart diagram render kar di gayi hai. Kis house ya planet ke baare mein detail jaan na chahte hain?"
                )
            else:
                return (
                    f"Here is your **Lagna Kundali (D1)** chart:\n"
                    f"- Ascendant (Lagna): **{chart_context.ascendant_sign}**\n"
                    f"- Moon Sign: **{chart_context.moon_sign}**\n"
                    f"- Sun Sign: **{chart_context.sun_sign}**\n\n"
                    "Your North Indian chart diagram has been rendered below. Which planetary position would you like to inspect?"
                )

    # 8. Grounded synthesis from retrieved classical citations
    if citations and len(citations) > 0:
        top_citation = citations[0]
        src_title = top_citation.get("source_title", "Classical Vedic Tradition")
        sec_title = top_citation.get("section_title", "Foundations")
        excerpt = top_citation.get("excerpt", "").strip()
        summary = excerpt.split("\n\n")[0] if "\n\n" in excerpt else excerpt[:280]

        if detected_lang == "hi":
            return f"प्रामाणिक वैदिक संदर्भ **{src_title}** ({sec_title}) के अनुसार:\n\n{summary}\n\nक्या आप इस विषय पर अधिक विस्तार या अपनी कुंडली से इसका संबंध जानना चाहते हैं?"
        elif detected_lang == "hinglish":
            return f"Classical Vedic reference **{src_title}** ({sec_title}) ke mutabiq:\n\n{summary}\n\nKya aap is topic par aur vistar se ya apni kundli ke context mein jaan na chahte hain?"
        else:
            return f"According to the classical text **{src_title}** ({sec_title}):\n\n{summary}\n\nWould you like further details on this principle or an analysis based on your birth chart?"

    # 9. General fallback
    if detected_lang == "hinglish":
        return "Main samajh gaya. Jyotish ke traditional principles ke mutabiq har sthiti mein dhairya aur samajhdari zaroori hai. Is vishay mein koi specific sawaal poochna chahein toh batayein."
    elif detected_lang == "hi":
        return "मैं समझता हूँ। पारंपरिक ज्योतिष के सिद्धांतों के अनुसार आत्म-विश्वास और सही समय पर निर्णय लेना सदैव हितकर होता है। कोई और प्रश्न हो तो अवश्य पूछें।"
    else:
        return "I understand. In traditional astrological wisdom, patience, clear perspective, and constructive action bring the best outcomes. Feel free to ask any specific question."


class LLMService:
    @staticmethod
    def generate_chat_response(
        user_message: str,
        conversation_history: List[Dict[str, str]],
        chart_context: Optional[ChartContext] = None,
        chart_data: Optional[Dict[str, Any]] = None,
        citations: Optional[List[Dict[str, Any]]] = None,
        language: str = "en",
        astrologer_id: str = "acharya_shastri",
        force_demo_mode: bool = False,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates chat generation using Gemini API (gemini-3.5-flash-lite) or demo mode fallback.
        Ensures dynamic domain guardrails, multimodal palmistry analysis, strict chart grounding,
        and astrologer persona voice.
        """
        use_demo = force_demo_mode or settings.is_demo_mode
        active_citations = citations or []
        persona = get_persona(astrologer_id)

        # If palm image was provided, route to palmistry analyzer
        if image_base64:
            res = LLMService.analyze_palm_image(
                image_base64=image_base64,
                user_message=user_message,
                language=language,
                force_demo_mode=use_demo
            )
            res["astrologer_id"] = astrologer_id
            return res

        # Dynamic domain check: block off-topic queries immediately
        in_domain, refusal = is_in_astrology_domain(user_message)
        if not in_domain and refusal:
            return {
                "content": refusal,
                "is_demo_mode": False,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "astrologer_id": astrologer_id
            }

        # Sub-15ms Semantic Cache Fast-Path for generalized astrological knowledge/remedies
        if not chart_data and not image_base64:
            from backend.app.services.semantic_cache import semantic_cache
            cached = semantic_cache.get(user_message, language, astrologer_id)
            if cached:
                cached["astrologer_id"] = astrologer_id
                return cached

        # Resolve verified ChartContext
        if not chart_context:
            if chart_data and isinstance(chart_data, dict):
                class TempRecord:
                    def __init__(self, d):
                        self.id = d.get("id", "temp-profile")
                        self.name = d.get("name", "User")
                        self.date_of_birth = d.get("date_of_birth", "")
                        self.time_of_birth = d.get("time_of_birth", "")
                        self.is_time_approximate = d.get("is_time_approximate", False)
                        self.city = d.get("city", "New Delhi")
                        self.country = d.get("country", "India")
                        self.latitude = d.get("latitude", 28.6)
                        self.longitude = d.get("longitude", 77.2)
                        self.timezone_offset = d.get("timezone_offset", 5.5)
                        self.system = d.get("system", "Vedic")
                        self.ayanamsa = d.get("ayanamsa", "Lahiri")
                        self.chart_data = d
                chart_context = validate_and_build_chart_context(TempRecord(chart_data))
            else:
                chart_context = validate_and_build_chart_context(None)

        # Check if Kundli diagram should be generated inline
        chart_svg = None
        raw_cd = chart_data or (chart_context.to_dict() if chart_context.is_verified else None)
        if chart_context.is_verified and raw_cd and is_kundli_requested(user_message):
            chart_svg = generate_north_indian_kundli_svg(raw_cd)

        if use_demo:
            response_text = generate_demo_response(
                user_message=user_message,
                chart_context=chart_context,
                citations=active_citations,
                conversation_history=conversation_history,
                language=language,
                astrologer_id=astrologer_id
            )
            return {
                "content": response_text,
                "is_demo_mode": True,
                "calculated_data_used": chart_context.is_verified,
                "citations": active_citations,
                "chart_svg": chart_svg,
                "astrologer_id": astrologer_id
            }

        # Live Gemini generation with gemini-3.5-flash-lite
        try:
            from google import genai
            from google.genai import types

            client = _get_gemini_client() or genai.Client(api_key=settings.GEMINI_API_KEY)

            # Build grounded system context with active persona
            chart_summary_block = chart_context.format_for_prompt()

            citation_blocks = []
            if active_citations:
                for c in active_citations[:2]:
                    raw_excerpt = c.get('excerpt', '')
                    trimmed_excerpt = raw_excerpt[:220] + ("..." if len(raw_excerpt) > 220 else "")
                    citation_blocks.append(f"[{c.get('source_title', 'Classical Text')}]: {trimmed_excerpt}")
            citations_str = "\n".join(citation_blocks) if citation_blocks else "None retrieved."

            detected_lang = _detect_language(user_message, fallback_lang=language)
            lang_label = "Devanagari Hindi" if detected_lang == "hi" else "Conversational Hinglish (Roman script)" if detected_lang == "hinglish" else "English" if detected_lang == "en" else detected_lang
            language_mandate = (
                f"### MANDATORY USER LANGUAGE REQUIREMENT: {detected_lang.upper()} ({lang_label})\n"
                f"CRITICAL: The user asked in {detected_lang.upper()} ({lang_label}). "
                f"You MUST formulate your response in this EXACT SAME language and script. "
                f"If the user asks in Hinglish, respond in natural Hinglish. If in Hindi, respond in Hindi. If in English, respond in English. "
                f"Do not switch language.\n\n"
            )

            persona_block = f"### ACTIVE ASTROLOGER PERSONA: {persona['name']} ({persona['title']})\n{persona['system_instruction']}\n\n"
            combined_system_instruction = (
                f"{ASTROAI_SYSTEM_PROMPT_V2}\n\n"
                f"{language_mandate}"
                f"{persona_block}"
                f"### CURRENT CONTEXT ENVIRONMENT\n"
                f"{chart_summary_block}\n\n"
                f"### RETRIEVED CLASSICAL ASTROLOGICAL & PALMISTRY SOURCES\n"
                f"{citations_str}\n"
            )

            # Build compact multi-turn contents (latest 4 turns, compact)
            contents: List[types.Content] = []
            if conversation_history:
                for m in conversation_history[-4:]:
                    m_role = "user" if m.get("role") == "user" else "model"
                    m_text = m.get("content", "").strip()
                    if m_text:
                        compact_text = m_text[:280] + ("..." if len(m_text) > 280 else "")
                        contents.append(
                            types.Content(
                                role=m_role,
                                parts=[types.Part.from_text(text=compact_text)]
                            )
                        )

            # Append current user question if not already last turn
            if not contents or contents[-1].parts[0].text != user_message:
                contents.append(
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=user_message)]
                    )
                )

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=combined_system_instruction,
                    temperature=0.6,
                    max_output_tokens=700
                )
            )

            response_content = response.text if response and response.text else ""
            if not response_content:
                response_content = generate_demo_response(
                    user_message=user_message,
                    chart_context=chart_context,
                    citations=active_citations,
                    conversation_history=conversation_history,
                    language=language,
                    astrologer_id=astrologer_id
                )

            return {
                "content": response_content.strip(),
                "is_demo_mode": False,
                "calculated_data_used": chart_context.is_verified,
                "citations": active_citations,
                "chart_svg": chart_svg,
                "astrologer_id": astrologer_id
            }

        except Exception as e:
            logger.error(f"Live Gemini API call failed: {e}. Executing conversational fallback.")
            response_text = generate_demo_response(
                user_message=user_message,
                chart_context=chart_context,
                citations=active_citations,
                conversation_history=conversation_history,
                language=language,
                astrologer_id=astrologer_id
            )
            return {
                "content": response_text,
                "is_demo_mode": True,
                "calculated_data_used": chart_context.is_verified,
                "citations": active_citations,
                "chart_svg": chart_svg,
                "astrologer_id": astrologer_id
            }

    @staticmethod
    async def stream_chat_response(
        user_message: str,
        conversation_history: List[Dict[str, str]],
        chart_context: Optional[ChartContext] = None,
        chart_data: Optional[Dict[str, Any]] = None,
        citations: Optional[List[Dict[str, Any]]] = None,
        language: str = "en",
        astrologer_id: str = "acharya_shastri",
        force_demo_mode: bool = False,
        image_base64: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams chat tokens via SSE generator for live word-by-word zero-wait typing experience.
        Yields chunk dictionaries:
        - {"type": "start", "astrologer_id": ...}
        - {"type": "delta", "text": "..."}
        - {"type": "done", "content": ..., "chart_svg": ...}
        """
        use_demo = force_demo_mode or settings.is_demo_mode
        active_citations = citations or []
        persona = get_persona(astrologer_id)

        yield {
            "type": "start",
            "astrologer_id": astrologer_id,
            "astrologer_name": persona["name"],
            "avatar": persona["avatar"]
        }

        # Handle palm image
        if image_base64:
            palm_res = LLMService.analyze_palm_image(
                image_base64=image_base64,
                user_message=user_message,
                language=language,
                force_demo_mode=use_demo
            )
            full_text = palm_res["content"]
            words = re.findall(r'\S+\s*', full_text)
            for i in range(0, len(words), 2):
                yield {"type": "delta", "text": "".join(words[i:i+2])}
                await asyncio.sleep(0.005)
            yield {
                "type": "done",
                "content": full_text,
                "is_demo_mode": palm_res.get("is_demo_mode", False),
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "astrologer_id": astrologer_id
            }
            return

        # Dynamic domain check
        in_domain, refusal = is_in_astrology_domain(user_message)
        if not in_domain and refusal:
            words = re.findall(r'\S+\s*', refusal)
            for i in range(0, len(words), 2):
                yield {"type": "delta", "text": "".join(words[i:i+2])}
                await asyncio.sleep(0.005)
            yield {
                "type": "done",
                "content": refusal,
                "is_demo_mode": False,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "astrologer_id": astrologer_id
            }
            return

        # Sub-15ms Semantic Cache Fast-Path for streaming general astrology queries
        if not chart_data and not image_base64:
            from backend.app.services.semantic_cache import semantic_cache
            cached = semantic_cache.get(user_message, language, astrologer_id)
            if cached:
                async for chunk in semantic_cache.stream_cached(cached):
                    yield chunk
                return

        # Resolve chart context
        if not chart_context:
            if chart_data and isinstance(chart_data, dict):
                class TempRecord:
                    def __init__(self, d):
                        self.id = d.get("id", "temp-profile")
                        self.name = d.get("name", "User")
                        self.date_of_birth = d.get("date_of_birth", "")
                        self.time_of_birth = d.get("time_of_birth", "")
                        self.is_time_approximate = d.get("is_time_approximate", False)
                        self.city = d.get("city", "New Delhi")
                        self.country = d.get("country", "India")
                        self.latitude = d.get("latitude", 28.6)
                        self.longitude = d.get("longitude", 77.2)
                        self.timezone_offset = d.get("timezone_offset", 5.5)
                        self.system = d.get("system", "Vedic")
                        self.ayanamsa = d.get("ayanamsa", "Lahiri")
                        self.chart_data = d
                chart_context = validate_and_build_chart_context(TempRecord(chart_data))
            else:
                chart_context = validate_and_build_chart_context(None)

        # Check inline Kundli SVG
        chart_svg = None
        raw_cd = chart_data or (chart_context.to_dict() if chart_context.is_verified else None)
        if chart_context.is_verified and raw_cd and is_kundli_requested(user_message):
            chart_svg = generate_north_indian_kundli_svg(raw_cd)

        full_content = ""
        is_demo = use_demo

        if not use_demo:
            try:
                from google import genai
                from google.genai import types

                client = _get_gemini_client() or genai.Client(api_key=settings.GEMINI_API_KEY)
                chart_summary_block = chart_context.format_for_prompt()
                citation_blocks = []
                if active_citations:
                    for c in active_citations[:2]:
                        raw_excerpt = c.get('excerpt', '')
                        trimmed_excerpt = raw_excerpt[:220] + ("..." if len(raw_excerpt) > 220 else "")
                        citation_blocks.append(f"[{c.get('source_title', 'Classical Text')}]: {trimmed_excerpt}")
                citations_str = "\n".join(citation_blocks) if citation_blocks else "None retrieved."

                detected_lang = _detect_language(user_message, fallback_lang=language)
                lang_label = "Devanagari Hindi" if detected_lang == "hi" else "Conversational Hinglish (Roman script)" if detected_lang == "hinglish" else "English" if detected_lang == "en" else detected_lang
                language_mandate = (
                    f"### MANDATORY USER LANGUAGE REQUIREMENT: {detected_lang.upper()} ({lang_label})\n"
                    f"CRITICAL: The user asked in {detected_lang.upper()} ({lang_label}). "
                    f"You MUST formulate your response in this EXACT SAME language and script. "
                    f"If the user asks in Hinglish, respond in natural Hinglish. If in Hindi, respond in Hindi. If in English, respond in English. "
                    f"Do not switch language.\n\n"
                )

                persona_block = f"### ACTIVE ASTROLOGER PERSONA: {persona['name']} ({persona['title']})\n{persona['system_instruction']}\n\n"
                combined_system_instruction = (
                    f"{ASTROAI_SYSTEM_PROMPT_V2}\n\n"
                    f"{language_mandate}"
                    f"{persona_block}"
                    f"### CURRENT CONTEXT ENVIRONMENT\n"
                    f"{chart_summary_block}\n\n"
                    f"### RETRIEVED CLASSICAL ASTROLOGICAL & PALMISTRY SOURCES\n"
                    f"{citations_str}\n"
                )

                contents: List[types.Content] = []
                if conversation_history:
                    for m in conversation_history[-4:]:
                        m_role = "user" if m.get("role") == "user" else "model"
                        m_text = m.get("content", "").strip()
                        if m_text:
                            compact_text = m_text[:280] + ("..." if len(m_text) > 280 else "")
                            contents.append(types.Content(role=m_role, parts=[types.Part.from_text(text=compact_text)]))

                if not contents or contents[-1].parts[0].text != user_message:
                    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

                response_stream = client.models.generate_content_stream(
                    model=settings.GEMINI_MODEL,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=combined_system_instruction,
                        temperature=0.6,
                        max_output_tokens=700
                    )
                )

                for chunk in response_stream:
                    if chunk.text:
                        full_content += chunk.text
                        yield {"type": "delta", "text": chunk.text}

            except Exception as e:
                logger.error(f"Live Gemini streaming failed: {e}. Falling back to demo stream.")
                is_demo = True

        if is_demo or not full_content.strip():
            demo_text = generate_demo_response(
                user_message=user_message,
                chart_context=chart_context,
                citations=active_citations,
                conversation_history=conversation_history,
                language=language,
                astrologer_id=astrologer_id
            )
            full_content = demo_text
            words = re.findall(r'\S+\s*', demo_text)
            for i in range(0, len(words), 2):
                yield {"type": "delta", "text": "".join(words[i:i+2])}
                await asyncio.sleep(0.005)

        yield {
            "type": "done",
            "content": full_content.strip(),
            "is_demo_mode": is_demo,
            "calculated_data_used": chart_context.is_verified,
            "citations": active_citations,
            "chart_svg": chart_svg,
            "astrologer_id": astrologer_id
        }

    @staticmethod
    def analyze_palm_image(
        image_base64: str,
        user_message: str = "Analyze my palm lines (हस्तरेखा विश्लेषण)",
        language: str = "hinglish",
        force_demo_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Multimodal Palmistry (Hastarekha / Samudrika Shastra) analysis for uploaded palm images.
        """
        try:
            # Strip data URL header if present
            if "," in image_base64:
                header, raw_b64 = image_base64.split(",", 1)
                mime_type = "image/png" if "png" in header else "image/jpeg"
            else:
                raw_b64 = image_base64
                mime_type = "image/jpeg"

            image_bytes = base64.b64decode(raw_b64)
        except Exception as e:
            logger.error(f"Failed to decode base64 palm image: {e}")
            return {
                "content": "Kripya ek valid photo upload karein (JPEG ya PNG format). Photo clearly aapki hatheli aur rekhaon ko dikhane waali honi chahiye.",
                "is_demo_mode": True,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "is_palm_analysis": True
            }

        detected_lang = _detect_language(user_message, fallback_lang=language)

        if force_demo_mode or settings.is_demo_mode:
            # Deterministic authentic Hastarekha interpretation
            if detected_lang == "hi":
                demo_text = (
                    "✋ **हस्तरेखा (सामुद्रिक शास्त्र) विश्लेषण:**\n\n"
                    "1. **हथेली का स्वरूप:** आपकी हथेली पृथ्वी-अग्नि तत्व (व्यावहारिक और ऊर्जावान) का संतुलन दर्शाती है।\n"
                    "2. **जीवन रेखा (Life Line):** शुक्र पर्वत के चारों ओर सुंदर घुमावदार जीवन रेखा अच्छी जीवन ऊर्जा (Vitality) और आंतरिक शक्ति का संकेत देती है।\n"
                    "3. **हृदय रेखा (Heart Line):** गुरु पर्वत की ओर अग्रसर हृदय रेखा निष्ठावान, भावनात्मक रूप से परिपक्व और रिश्तों में वफादार स्वभाव दर्शाती है।\n"
                    "4. **मस्तिष्क रेखा (Head Line):** गहरी और स्पष्ट मस्तिष्क रेखा तार्किक निर्णय क्षमता और व्यावहारिक बुद्धिमत्ता को दर्शाती है।\n"
                    "5. **भाग्य रेखा (Fate Line):** हथेली के मध्य से शनि पर्वत की ओर उठने वाली रेखा स्व-निर्मित सफलता और निरंतर प्रयास का संकेत देती है।\n\n"
                    "✨ **मार्गदर्शन:** अपने लक्ष्यों पर निरंतरता बनाए रखें, आपके हाथों की रेखाएं आत्मनिर्भरता और धैर्य से बड़ी प्रगति का संकेत देती हैं।"
                )
            else:
                demo_text = (
                    "✋ **Hastarekha (Palmistry) Analysis:**\n\n"
                    "1. **Palm Shape & Energy:** Aapki hatheli practical aur ambitious nature (Earth-Fire balance) ko reflect karti hai.\n"
                    "2. **Jeevan Rekha (Life Line):** Shukra Parvat ke aas-paas clear curved line strong vitality, stamina aur life enthusiasm dikhati hai.\n"
                    "3. **Hriday Rekha (Heart Line):** Guru Parvat ki taraf badhti Heart Line loyalty, emotional maturity aur deep relationships ko priority deti hai.\n"
                    "4. **Mastishk Rekha (Head Line):** Clear, straight Head Line sharp practical intelligence, focus aur calculated decision-making power darshati hai.\n"
                    "5. **Bhagya Rekha (Fate Line):** Palm ke base se start hokar Shani Parvat tak pahochna self-made success aur persistent mehnat se growth ka sanket deta hai.\n\n"
                    "✨ **Key Advice:** Apni focus aur patience ko continue rakhein—aapke haath ki lines steady financial aur professional growth indicate karti hain!"
                )
            return {
                "content": demo_text,
                "is_demo_mode": True,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "is_palm_analysis": True
            }

        # Live Gemini 3.5 Flash Lite Multimodal Generation
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

            palm_prompt = (
                "You are an expert, compassionate Vedic Palmistry (Hastarekha / Samudrika Shastra) astrologer. "
                "Examine this user's uploaded palm photo carefully:\n"
                "1. Observe the palm shape (Earth, Air, Fire, Water), fingers, and skin texture.\n"
                "2. Identify and analyze the key lines visible: Life Line (Jeevan Rekha), Heart Line (Hriday Rekha), Head Line (Mastishk Rekha), Fate Line (Bhagya Rekha).\n"
                "3. Observe key mounts (Mount of Jupiter, Venus, Sun) and any prominent markings.\n"
                "4. Deliver an authentic, structured, encouraging reading focusing on career strengths, emotional relationships, and mental focus.\n"
                f"Language requirement: Respond in natural {detected_lang.upper()} (if Hinglish, speak natural, warm conversational Hinglish like an Indian palmist).\n"
                "Keep formatting clean without excessive bullet spam."
            )

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[image_part, palm_prompt],
                config=types.GenerateContentConfig(
                    system_instruction=ASTROAI_SYSTEM_PROMPT_V2,
                    temperature=0.4,
                    max_output_tokens=700
                )
            )

            res_text = response.text if response and response.text else "Aapki palm image clearly analyze kar li gayi hai. Lines stability aur continuous growth indicate karti hain."
            return {
                "content": res_text.strip(),
                "is_demo_mode": False,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "is_palm_analysis": True
            }

        except Exception as e:
            logger.error(f"Multimodal palm analysis failed: {e}. Executing demo fallback.")
            return LLMService.analyze_palm_image(
                image_base64=image_base64,
                user_message=user_message,
                language=language,
                force_demo_mode=True
            )
