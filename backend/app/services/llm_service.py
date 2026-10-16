"""
LLM Service integrating Google GenAI SDK (Gemini 3.5 Flash Lite) with
conversational Indian astrology personality, strict chart provenance,
multi-turn memory, dynamic domain guardrails, and multimodal palmistry (Hastarekha) analysis.
"""
from typing import Dict, Any, List, Optional, Tuple, AsyncGenerator
import asyncio
import re
import base64
import time
import hashlib
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


def _resolve_seeker_salutation(chart_context: Optional[ChartContext]) -> Tuple[str, str, str]:
    """
    Returns (first_name, salutation_hindi, salutation_hinglish).
    Guarantees that generic names ('User', 'Guest', 'Seeker', etc.) are sanitized to empty,
    so that we NEVER output 'User ji' or 'Guest ji'.
    """
    first_name = ""
    if chart_context and chart_context.profile_name:
        cand = chart_context.profile_name.strip()
        if cand.lower() not in ["user", "guest", "guest user", "temp-profile", "seeker", "temp", "client", "none", "anonymous"]:
            # Pick first word as first name, e.g. "Shivam", "Rahul", "Priya"
            first_name = cand.split()[0].capitalize()

    if first_name:
        sal_hi = f"आयुष्मान भव {first_name} जी! "
        sal_hgl = f"Ayushman Bhava {first_name} ji! "
    else:
        sal_hi = "आयुष्मान भव बेटा! "
        sal_hgl = "Ayushman Bhava beta! "

    return first_name, sal_hi, sal_hgl


def generate_demo_response(
    user_message: str,
    chart_context: ChartContext,
    citations: List[Dict[str, Any]],
    conversation_history: Optional[List[Dict[str, str]]] = None,
    language: str = "en",
    astrologer_id: str = "acharya_shastri"
) -> str:
    """
    Generates a natural, conversational, non-repetitive response in Demo Mode or when offline/testing.
    Dynamically personalizes with seeker's real name and precise astrological placements,
    with zero bold tags and strict 75-100 word concise length.
    """
    detected_lang = _detect_language(user_message, fallback_lang=language)
    msg_lower = user_message.lower().strip()
    persona = get_persona(astrologer_id)

    # Dynamic domain check
    in_domain, refusal = is_in_astrology_domain(user_message)
    if not in_domain and refusal:
        return refusal

    # Resolve safe seeker name and traditional respectful salutation (NEVER "User ji")
    first_name, sal_hi, sal_hgl = _resolve_seeker_salutation(chart_context)

    # Dynamic variation seed to guarantee different users and queries NEVER receive identical text
    l_sign = chart_context.ascendant_sign or "Mesha (Aries)" if chart_context.is_verified else "Aries"
    m_sign = chart_context.moon_sign or "Karka (Cancer)" if chart_context.is_verified else "Cancer"
    seed_str = f"{msg_lower}_{first_name}_{l_sign}_{m_sign}_{int(time.time()) // 10}"
    v_seed = int(hashlib.md5(seed_str.encode('utf-8')).hexdigest(), 16)

    # 1. Greeting handling (Persona specific)
    if _is_greeting(user_message):
        name_part_hi = f"{first_name} जी" if first_name else "बेटा"
        name_part_hgl = f"{first_name} ji" if first_name else "beta"
        if astrologer_id == "dr_sunita":
            if detected_lang == "hi":
                return f"नमस्ते {name_part_hi}! शुभम भवतु 🙏 मैं विदुषी सुनीता शर्मा। जीवन, मन की शांति या संबंधों के विषय में क्या परामर्श चाहते हैं? निसंकोच कहें।"
            elif detected_lang == "hinglish":
                return f"Namaste {name_part_hgl}! Shubham Bhavatu 🙏 Main Vidushi Sunita Sharma. Kaise hain aap? Rishto ya mann ki shanti par guidance chahiye toh freely bataiye."
            else:
                return f"Namaste {name_part_hgl}! Shubham Bhavatu 🙏 I am Vidushi Sunita Sharma. How may I bring peace, clarity, and harmony to your relationships today?"
        elif astrologer_id == "pandit_maharaj":
            if detected_lang == "hi":
                return f"जय श्री राम! आयुष्मान भव {name_part_hi} 🙏 मैं पंडित जी महाराज। आज अपने कर्म, व्यापार, नौकरी अथवा धन योग के विषय में क्या जानना चाहते हैं?"
            elif detected_lang == "hinglish":
                return f"Jai Shri Ram! Ayushman Bhava {name_part_hgl} 🙏 Main Pandit Ji Maharaj. Career, vyapar ya dasha ke baare mein kya guidance chahiye?"
            else:
                return f"Jai Shri Ram! Divine blessings {name_part_hgl} 🙏 I am Pandit Ji Maharaj. How may I assist your career and financial endeavors today?"
        else: # Acharya Shastri
            if detected_lang == "hi":
                return f"हरि ॐ! आयुष्मान भव, कल्याणमस्तु {name_part_hi}! 🙏 मैं आचार्य शास्त्री। ईश्वर की कृपा आप पर सदैव बनी रहे। कहिए, आज अपनी जन्म कुण्डली या जीवन के विषय में क्या जानना चाहते हैं?"
            elif detected_lang == "hinglish":
                return f"Hari Om! Ayushman Bhava, Kalyanmastu {name_part_hgl}! 🙏 Main Acharya Shastri. Ishwar ki kripa aap par bani rahe. Kahiye, aaj kundli ya jeevan ke baare mein kya poochna chahte hain?"
            else:
                return f"Hari Om! Ayushman Bhava, Kalyanmastu {name_part_hgl}! 🙏 I am Acharya Shastri. May divine grace illuminate your path. What astrological guidance may I assist you with today?"

    # 2. Short answer request
    if any(k in msg_lower for k in ["short me", "short mein", "in short", "briefly", "chota sa"]):
        if detected_lang == "hinglish":
            if chart_context.is_verified:
                return f"Hari Om! {sal_hgl}🙏 Sankshep mein: aapka Lagna {chart_context.ascendant_sign} aur Moon sign {chart_context.moon_sign} hai. Yeh sthiti dhairya aur samajhdari darshati hai. Surya dev ko jal arpit karte rahein, sab kalyan hoga."
            return f"Kalyanmastu {sal_hgl}🙏 Sankshep mein: bina birth details ke keval saamanya margdarshan ho sakta hai. Sateek faladesh ke liye birth details zaroori hain."
        elif detected_lang == "hi":
            if chart_context.is_verified:
                return f"हरि ॐ! {sal_hi}🙏 संक्षेप में: आपका लग्न {chart_context.ascendant_sign} और चंद्र राशि {chart_context.moon_sign} है। यह स्थिति धैर्य और सूझबूझ दर्शाती है। नित्य सूर्य नारायण को जल अर्पित करें, सब शुभ होगा।"
            return f"कल्याणमस्तु {sal_hi}🙏 संक्षेप में: सटीक फलकथन हेतु जन्म विवरण आवश्यक है, अन्यथा केवल सामान्य मार्गदर्शन ही संभव है।"
        else:
            if chart_context.is_verified:
                return f"Hari Om! Blessings 🙏 In brief: with {chart_context.ascendant_sign} Ascendant and {chart_context.moon_sign} Moon, patient focus and clear wisdom are your natural strengths."
            return "Blessings! In brief: exact planetary analysis requires birth details, though general wisdom is always here to guide you."

    # 3. Love and relationships (4 distinct dynamic variations)
    if any(k in msg_lower for k in ["love", "relationship", "rishta", "pyaar", "prem", "marriage", "shaadi", "patni", "pati"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return f"हरि ॐ! {sal_hi}🙏 विवाह और प्रेम जीवन के सटीक समय व फलादेश के लिए जन्म तिथि, समय और स्थान आवश्यक हैं। यदि सही समय न भी पता हो, तो अनुमानित समय बताएं, हम प्रभु कृपा से उचित मार्गदर्शन करेंगे।"
            elif detected_lang == "hinglish":
                return f"Hari Om! {sal_hgl}🙏 Prem aur vivah ke vishay mein sateek dekhne ke liye date of birth, time aur birth place share karein. Samay anumaanit ho toh bhi batayein, hum ucchit margdarshan karenge."
            else:
                return f"Hari Om! Divine blessings {first_name or 'seeker'} 🙏 To analyze your marriage timing and compatibility, kindly share your birth date, time, and city."
        else:
            venus_p = next((p for p in chart_context.planets if p.get("name") == "Venus"), None)
            v_sign = venus_p.get("sign") if venus_p else "Taurus"
            rel_var = v_seed % 4
            if detected_lang == "hinglish":
                if rel_var == 0:
                    return (
                        f"Hari Om! {sal_hgl}🙏\n\n"
                        f"Aapki kundli mein daampatya sthan aur Shukra dev ki sthiti ({v_sign}) aapsi sneh aur samajhdari ko darshati hai. "
                        "Sambandhon mein thoda dhairya aur aapas mein khulkar samvaad rakhne se prem jeevan madhur aur anukool rahega.\n\n"
                        "Saral Upay: Shukravaar ko kisi zarooratmand ko safed vastu (doodh ya mishri) ka daan karein aur mata-pita ka aashirwad lein. Ishwar kalyan karenge."
                    )
                elif rel_var == 1:
                    return (
                        f"Jai Shri Ram! {sal_hgl}🙏\n\n"
                        f"Aapki kundli ke Lagna ({l_sign}) aur Chandra sthiti ({m_sign}) ke anusaar, jeevansathi ke prati samman aur vishwas rishte ko sthirta dega. "
                        "Chhoti-moti baaton ko dil se na lagayein, samay ke sath prem aur gehra hoga.\n\n"
                        "Saral Upay: Sandhya samay ghar mein kapoor ka deepak prajwalit karein aur Maa Laxmi ka smaran karein. Grihastha jeevan mein shanti rahegi."
                    )
                elif rel_var == 2:
                    return (
                        f"Radhe Radhe! {sal_hgl}🙏\n\n"
                        f"Saptam bhav aur Shukra dev ({v_sign}) yeh sanket de rahe hain ki aane wale samay mein rishto mein aapsi samvaad behtar hoga. "
                        "Apne partner ke vicharon ko dhyan se sunna aur krodh se bachna prem mein madhurta layega.\n\n"
                        "Saral Upay: Somvaar ko shivling par kacha doodh aur jal arpit karein. Bholenath ki kripa se sambandhon mein anukoolta aayegi."
                    )
                else:
                    return (
                        f"Hari Om! {sal_hgl}🙏\n\n"
                        f"Kundli mein grahon ki dasha yeh batati hai ki meethi vaani aur ek-doosre par bharosa hi aapke rishte ki sabse badi taaqat hai. "
                        "Dhairya se kaam lein, vivah aur prem mein sthirta ke shubh yog ban rahe hain.\n\n"
                        "Saral Upay: Shukravaar ko kisi kanya ya zarooratmand ko meetha prasad dein aur bado ke charan sparsh karein. Ishwar kalyan karenge."
                    )
            elif detected_lang == "hi":
                if rel_var == 0:
                    return (
                        f"हरि ॐ! {sal_hi}🙏\n\n"
                        f"आपकी कुण्डली में दांपत्य भाव और शुक्र देव की स्थिति ({v_sign}) प्रेम और समझदारी का शुभ संकेत दे रही है। "
                        "रिश्तों में थोड़ा धैर्य और आपसी विश्वास बनाए रखने से दांपत्य जीवन में सुख और सौहार्द बना रहेगा।\n\n"
                        "सरल उपाय: शुक्रवार के दिन गाय को हरा चारा या गुड़-रोटी खिलाएं और नित्य बड़ों का चरण स्पर्श करें। ईश्वर सब मंगल करेंगे।"
                    )
                elif rel_var == 1:
                    return (
                        f"जय श्री राम! {sal_hi}🙏\n\n"
                        f"आपकी जन्म कुण्डली में लग्न ({l_sign}) और सप्तमेश का प्रभाव यह दर्शाता है कि आपसी बातचीत और एक-दूसरे की भावनाओं का आदर करने से संबंध अत्यंत मधुर रहेंगे। "
                        "क्रोध और जल्दबाजी से बचें, समय आपके अनुकूल हो रहा है।\n\n"
                        "सरल उपाय: संध्या समय घर में घी का दीपक जलाएं और भगवान शिव-पार्वती का ध्यान करें। दांपत्य में सुख-शांति बनी रहेगी।"
                    )
                elif rel_var == 2:
                    return (
                        f"राधे राधे! {sal_hi}🙏\n\n"
                        f"कुण्डली में शुक्र देव ({v_sign}) और चंद्र राशि ({m_sign}) यह संकेत कर रहे हैं कि जीवनसाथी के साथ सामंजस्य बिठाने से गृहस्थी में आनंद रहेगा। "
                        "पारस्परिक सम्मान और धैर्य ही आपके वैवाहिक सुख की कुंजी है।\n\n"
                        "सरल उपाय: शुक्रवार को सफेद पुष्प या मिश्री देवी मंदिर में अर्पित करें। माता लक्ष्मी की कृपा से सब मंगल होगा।"
                    )
                else:
                    return (
                        f"हरि ॐ! {sal_hi}🙏\n\n"
                        f"सप्तम भाव का अवलोकन करने पर यह स्पष्ट है कि प्रेम और विवाह के क्षेत्र में सकारात्मक ऊर्जा का संचार हो रहा है। "
                        "सहानुभूति और मधुर वाणी से किया गया संवाद हर संशय को दूर करेगा।\n\n"
                        "सरल उपाय: नित्य माता-पिता का आशीर्वाद लें और शुक्रवार को जरूरतमंदों को अन्न या दूध का दान करें। प्रभु कल्याण करेंगे।"
                    )
            else:
                return (
                    f"Hari Om! Divine blessings to you 🙏\n\n"
                    f"In your chart, Venus in {v_sign} supports affection, mutual loyalty, and emotional bonding. "
                    "Gentle patience and open communication will bring lasting harmony to your relationship.\n\n"
                    "Simple Upay: Cultivate gentle patience and offer peaceful prayers on Friday mornings for divine grace."
                )

    # 4. Career and Profession (4 distinct dynamic variations)
    if any(k in msg_lower for k in ["career", "job", "naukri", "business", "vyapar", "kaam", "work", "promotion"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return f"जय श्री राम! {sal_hi}🙏 आजीविका और नौकरी की सटीक दशा देखने के लिए अपना जन्म विवरण साझा करें। हम दशम भाव और भाग्य स्थान का भलीभांति विश्लेषण करेंगे।"
            elif detected_lang == "hinglish":
                return f"Jai Shri Ram! {sal_hgl}🙏 Career aur naukri ki sateek sthiti dekhne ke liye date of birth, time aur birth place batayein. Hum 10th house ka sateek vishleshan karenge."
            else:
                return f"Hari Om! Divine blessings {first_name or 'seeker'} 🙏 To analyze your professional prospects, kindly share your birth date, time, and location."
        else:
            jup_p = next((p for p in chart_context.planets if p.get("name") == "Jupiter"), None)
            j_sign = jup_p.get("sign") if jup_p else "Sagittarius"
            sat_p = next((p for p in chart_context.planets if p.get("name") == "Saturn"), None)
            s_sign = sat_p.get("sign") if sat_p else "Capricorn"
            car_var = v_seed % 4
            if detected_lang == "hinglish":
                if car_var == 0:
                    return (
                        f"Hari Om! {sal_hgl}🙏\n\n"
                        f"Aapki kundli mein karm sthan (10th house) aur Devguru Brihaspati ({j_sign}) aapki buddhi aur parishram ko bal de rahe hain. "
                        "Nishtha se kiya gaya prayas ajeevika mein acchi tarakki aur sthirta dilwayega.\n\n"
                        "Saral Upay: Nitya subah Surya Dev ko taambe ke lote se jal arpit karein aur Gayatri mantra ka smaran karein. Samay shubh hoga."
                    )
                elif car_var == 1:
                    return (
                        f"Jai Shri Ram! {sal_hgl}🙏\n\n"
                        f"Aapke Lagna ({l_sign}) aur Shani Dev ({s_sign}) ki sthiti darshati hai ki shuruat mein thodi mehnat lagegi, par parinam dirghkaalik aur majboot honge. "
                        "Apne karya par niyamit dhyan banaye rakhein, aane wale samay mein samman badhega.\n\n"
                        "Saral Upay: Shanivaar ko shramikon ya zarooratmand ko bhojan karayein aur Hanuman Chalisa ka path karein. Karyakshetra mein safalta milegi."
                    )
                elif car_var == 2:
                    return (
                        f"Hari Om! {sal_hgl}🙏\n\n"
                        f"Dasham sthan aur Chandra rashi ({m_sign}) ke anusaar nayi yojanaon aur karya mein safalta ke yog ban rahe hain. "
                        "Uchhadhikariyon aur sahyogiyon ke sath vinamra vartav rakhein, tarakki ke dwar khulenge.\n\n"
                        "Saral Upay: Guruvaar ke din maathe par chandan ya kesar ka tilak lagayein aur bado ka aashirwad lein. Bhagya sahayak hoga."
                    )
                else:
                    return (
                        f"Kalyanmastu! {sal_hgl}🙏\n\n"
                        f"Kundli mein dasham aur bhagya bhav darshate hain ki aapki kshamta aur lagan aane wale samay mein acche avsar layenge. "
                        "Dhairya aur atmavishwas ke sath prayas karte rahein, aarthik aur vyavasayik sthirta prapt hogi.\n\n"
                        "Saral Upay: Roz subah pakshiyon ko daana daalein aur Surya Narayan ko pranam karein. Ruke hue kaam banne lagenge."
                    )
            elif detected_lang == "hi":
                if car_var == 0:
                    return (
                        f"हरि ॐ! {sal_hi}🙏\n\n"
                        f"आपकी कुण्डली में दशम भाव और देवguru बृहस्पति ({j_sign}) यह दर्शा रहे हैं कि आपकी मेहनत और विद्या से आजीविका में उत्तम प्रगति होगी। "
                        "धैर्यपूर्वक अपने लक्ष्य पर केंद्रित रहें, मान-सम्मान और पद-प्रतिष्ठा के अच्छे योग बन रहे हैं।\n\n"
                        "सरल उपाय: प्रातःकाल सूर्य नारायण को जल का अर्घ्य दें और गुरुवार को चंदन का तिलक लगाएं। प्रभु कृपा से सब शुभ होगा।"
                    )
                elif car_var == 1:
                    return (
                        f"जय श्री राम! {sal_hi}🙏\n\n"
                        f"आपकी कुण्डली में लग्न ({l_sign}) और शनि देव ({s_sign}) यह संकेत कर रहे हैं कि निरंतर कर्म और अनुशासन से ही स्थायी सफलता मिलेगी। "
                        "निराश न हों, आपकी मेहनत का मीठा फल आने वाले समय में अवश्य मिलेगा।\n\n"
                        "सरल उपाय: शनिवार के दिन हनुमान चालीसा का पाठ करें और जरूरतमंदों की सहायता करें। कार्यक्षेत्र की बाधाएं दूर होंगी।"
                    )
                elif car_var == 2:
                    return (
                        f"कल्याणमस्तु! {sal_hi}🙏\n\n"
                        f"दशम भाव की ग्रह स्थिति यह बता रही है कि कार्यक्षेत्र में नई जिम्मेदारियां और पदोन्नति के अनुकूल अवसर बनेंगे। "
                        "अपने वरिष्ठों से मधुर संबंध बनाए रखें और एकाग्रता से अपने कार्य को पूर्ण करें।\n\n"
                        "सरल उपाय: प्रतिदिन पक्षियों को दाना डालें और प्रातः गायत्री मंत्र का 11 बार शांत मन से जप करें। यश में वृद्धि होगी।"
                    )
                else:
                    return (
                        f"हरि ॐ! {sal_hi}🙏\n\n"
                        f"आपकी चंद्र राशि ({m_sign}) और कर्म स्थान का संयोग आजीविका में नई ऊर्जा और प्रगति का मार्ग प्रशस्त कर रहा है। "
                        "सकारात्मक सोच के साथ आगे बढ़ें, ईश्वर आपके परिश्रम को उचित फल प्रदान करेंगे।\n\n"
                        "सरल उपाय: गुरुवार को किसी मंदिर में चने की दाल या पीले फल का दान करें और गुरुजनों का आशीर्वाद लें। मंगल होगा।"
                    )
            else:
                return (
                    f"Hari Om! Divine blessings to you 🙏\n\n"
                    f"In your birth chart, Jupiter in {j_sign} and the 10th house support professional dignity and gradual growth through consistent work.\n\n"
                    "Simple Upay: Offer water to the rising Sun daily and seek the guidance of elders before starting important projects."
                )

    # 5. Wealth, Finance, Money (3 distinct dynamic variations)
    if any(k in msg_lower for k in ["money", "paisa", "dhan", "wealth", "finance", "karz", "debt", "laxmi"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return f"हरि ॐ! {sal_hi}🙏 धन, समृद्धि और आर्थिक स्थिति का विश्लेषण करने के लिए अपना जन्म विवरण साझा करें।"
            else:
                return f"Hari Om! {sal_hgl}🙏 Dhan aur financial growth ke liye apni birth date, time aur city batayein."
        else:
            w_var = v_seed % 3
            if detected_lang == "hi":
                if w_var == 0:
                    return (
                        f"हरि ॐ! {sal_hi}🙏\n\n"
                        f"आपकी कुण्डली में धन भाव (द्वितीय स्थान) और लाभ भाव (एकादश स्थान) अनुकूल स्थिति दर्शा रहे हैं। अनावश्यक खर्चों पर नियंत्रण रखें, धीरे-धीरे संचित धन में वृद्धि होगी।\n\n"
                        "सरल उपाय: शुक्रवार को श्री सूक्त का पाठ करें अथवा किसी देवी मंदिर में मिश्री का भोग लगाएं। मां लक्ष्मी की कृपा आप पर बनी रहे।"
                    )
                elif w_var == 1:
                    return (
                        f"जय श्री राम! {sal_hi}🙏\n\n"
                        f"आपकी लग्न ({l_sign}) अनुसार आय के साधन निरंतर बने रहेंगे, किंतु बजट का ध्यान रखना आवश्यक है। जल्दबाजी में कोई जोखिम भरा निवेश न करें।\n\n"
                        "सरल उपाय: प्रतिदिन पक्षियों को दाना-पानी दें और शाम को तुलसी जी के पास घी का दीपक प्रज्वलित करें। धन धान्य की वृद्धि होगी।"
                    )
                else:
                    return (
                        f"कल्याणमस्तु! {sal_hi}🙏\n\n"
                        f"द्वितीय और एकादश भाव की ग्रह स्थिति यह दर्शाती है कि आपकी सूझबूझ से पैतृक या संचित धन में स्थिरता आएगी। ईमानदारी से किया गया कार्य स्थायी समृद्धि देगा।\n\n"
                        "सरल उपाय: शुक्रवार को किसी जरूरतमंद को सफेद अन्न का दान करें। ईश्वर धन और समृद्धि प्रदान करेंगे।"
                    )
            else:
                if w_var == 0:
                    return (
                        f"Hari Om! {sal_hgl}🙏\n\n"
                        f"Aapki kundli mein dhan bhav (2nd house) aur labha bhav (11th house) aarthik sthirta ka sanket de rahe hain. Thoda budget banakar chalein, aane wale samay mein savings badhengi.\n\n"
                        "Saral Upay: Shukravaar ko safed vastu ka daan karein aur Maa Laxmi ka smaran karein. Sab kalyan hoga."
                    )
                elif w_var == 1:
                    return (
                        f"Jai Shri Ram! {sal_hgl}🙏\n\n"
                        f"Aapke Lagna ({l_sign}) anusaar aarthik sthiti mein sudhar ke yog ban rahe hain. Bina soche samjhe kisi ko udhaar na dein aur kharchon par santulan banaye rakhein.\n\n"
                        "Saral Upay: Sham ko Tulsi ji ke paas ghee ka deepak jalayein aur Shri Suktam ka path sunein. Dhan mein barkat hogi."
                    )
                else:
                    return (
                        f"Radhe Radhe! {sal_hgl}🙏\n\n"
                        f"Kundli ke anusaar parishram se dhan ki aawak bani rahegi. Aane wale samay mein aarthik roop se naye avsar milenge, atmavishwas banaye rakhein.\n\n"
                        "Saral Upay: Roz subah pakshiyon ko anaaj dalein aur mata-pita ka aashirwad lein. Ishwar kalyan karenge."
                    )

    # 6. Health & Wellbeing (3 distinct dynamic variations)
    if any(k in msg_lower for k in ["health", "swasthya", "tabiyat", "beemari", "rog"]):
        h_var = v_seed % 3
        if detected_lang == "hi":
            if h_var == 0:
                return f"हरि ॐ! {sal_hi}🙏 स्वास्थ्य की रक्षा के लिए नित्य प्रातः सूर्य नमस्कार करें और महामृत्युंजय मंत्र का 11 बार स्मरण करें। संतुलित आहार और सकारात्मक विचार रखें, ईश्वर आपको आरोग्य प्रदान करेंगे।"
            elif h_var == 1:
                return f"जय श्री राम! {sal_hi}🙏 आपकी लग्न ({l_sign}) अनुसार मन को तनावमुक्त रखना ही उत्तम स्वास्थ्य का मूल मंत्र है। नित्य ताजी हवा में टहलें और जल का सेवन पर्याप्त मात्रा में करें। सब शुभ होगा।"
            else:
                return f"कल्याणमस्तु! {sal_hi}🙏 स्वास्थ्य के संबंध में धैर्य रखें। प्रातःकाल सूर्य नारायण को जल अर्पित करें और महामृत्युंजय मंत्र का शांत भाव से स्मरण करें। भगवान शिव की कृपा से आरोग्य लाभ होगा।"
        else:
            if h_var == 0:
                return f"Hari Om! {sal_hgl}🙏 Swasthya ke liye subah taaza hawa mein ghoomein aur Mahamrityunjaya Mantra ka shant mann se smaran karein. Ishwar aapko uttam aarogya de."
            elif h_var == 1:
                return f"Jai Shri Ram! {sal_hgl}🙏 Tanaav aur chinta se bachein. Nitya subah Surya Dev ko jal arpit karein aur shant mann se prarthana karein. Swasthya anukool rahega."
            else:
                return f"Hari Om! {sal_hgl}🙏 Santulit aahar lein aur roz subah thoda dhyan aur pranayam karein. Bhagwan Bholenath ki kripa se sharirik aur mansik shanti prapt hogi."

    # 7. Moon sign & Nakshatra
    if any(k in msg_lower for k in ["moon sign", "chandra rashi", "chandrama", "rashi", "nakshatra"]):
        if not chart_context.is_verified:
            return f"कल्याणमस्तु {sal_hi}🙏 आपकी चंद्र राशि जानने के लिए जन्म तिथि, सही समय और शहर बताएं। हम तुरंत गणना करके आपको बताएंगे।" if detected_lang == "hi" else f"Kalyanmastu {sal_hgl}🙏 Chandra Rashi jaanane ke liye date of birth, time aur city batayein."
        else:
            if detected_lang == "hi":
                return f"हरि ॐ! {sal_hi}🙏 आपकी जन्म चंद्र राशि {chart_context.moon_sign} है, और जन्म नक्षत्र {chart_context.moon_nakshatra} है। यह आपके शांत हृदय और गहरी संवेदनशीलता का प्रतीक है।"
            else:
                return f"Hari Om! {sal_hgl}🙏 Aapki janm rashi {chart_context.moon_sign} aur nakshatra {chart_context.moon_nakshatra} hai. Yeh sheetalta aur teekshna buddhi ko darshata hai."

    # 8. Kundli Diagram / Analysis request
    if is_kundli_requested(user_message):
        if not chart_context.is_verified:
            return "कुण्डली चक्र देखने के लिए जन्म विवरण आवश्यक है बेटा। कृपया तारीख, समय और शहर बताएं।" if detected_lang == "hi" else "Kundli chakra ke liye birth details (taareekh, samay aur sthan) batayein beta."
        else:
            if detected_lang == "hi":
                return f"हरि ॐ! {sal_hi}🙏 यह रही आपकी जन्म कुण्डली: लग्न {chart_context.ascendant_sign}, चंद्र राशि {chart_context.moon_sign}। लग्न चक्र प्रस्तुत है, जो भी संशय हो पूछिए।"
            else:
                return f"Hari Om! {sal_hgl}🙏 Yeh rahi aapki Janam Kundli: Lagna {chart_context.ascendant_sign}, Moon {chart_context.moon_sign}. Koi prashna ho toh poochiye."

    # 9. General fallback (4 distinct variations)
    gen_var = v_seed % 4
    if detected_lang == "hinglish":
        if gen_var == 0:
            return f"Hari Om! {sal_hgl}🙏 Vedic Jyotish ke anusaar satkarma aur dhairya se har sthiti anukool ho jati hai. Surya dev ko jal arpit karein aur shant mann se apna prashna poochein."
        elif gen_var == 1:
            return f"Jai Shri Ram! {sal_hgl}🙏 Aapki kundli ke Lagna ({l_sign}) anusaar parishram aur nishtha hi aapke sabse bade sahayak hain. Jeevan, career ya vivah ke baare mein jo poochna ho batayein."
        elif gen_var == 2:
            return f"Radhe Radhe! {sal_hgl}🙏 Ishwar par vishwas rakhein, samay ke sath har mushkil ka samadhan nikalta hai. Nitya Hanuman Chalisa ka path karein aur apna prashna kahein."
        else:
            return f"Hari Om! {sal_hgl}🙏 Shant chitt se kiya gaya karm sadaiv shubh fal deta hai. Kisi zarooratmand ki sahayata karein aur kundli se juda koi bhi vishisht prashna poochiye."
    elif detected_lang == "hi":
        if gen_var == 0:
            return f"हरि ॐ! {sal_hi}🙏 वैदिक ज्योतिष अनुसार सत्कर्म और धैर्य से सभी बाधाएं दूर होती हैं। नित्य सूर्य नारायण की उपासना करें। मन में जो भी संशय हो, निसंकोच पूछें।"
        elif gen_var == 1:
            return f"जय श्री राम! {sal_hi}🙏 आपके लग्न ({l_sign}) अनुसार आपका परिश्रम और निष्ठा ही आपकी सफलता की नींव है। जीवन के किसी भी क्षेत्र से संबंधित प्रश्न निसंकोच पूछिए।"
        elif gen_var == 2:
            return f"कल्याणमस्तु! {sal_hi}🙏 ईश्वर पर अडिग विश्वास रखें, धैर्य से हर समस्या का समाधान प्राप्त होता है। नित्य गायत्री मंत्र का स्मरण करें और अपना प्रश्न कहें।"
        else:
            return f"हरि ॐ! {sal_hi}🙏 शांत और निर्मल मन से किए गए कर्म सदैव मंगलकारी होते हैं। माता-पिता का आशीर्वाद लें और कुंडली या जीवन से जुड़ा कोई भी प्रश्न पूछें।"
    else:
        return f"Hari Om! Divine blessings {first_name or 'dear seeker'} 🙏 In Vedic tradition, patience and righteous action bring peace and clarity. Feel free to ask any specific query about your life or chart."


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
                        self.name = d.get("name", "")
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

            # Resolve seeker name to personalize the Pandit blessing
            seeker_fn, sal_hi_sample, sal_hgl_sample = _resolve_seeker_salutation(chart_context)
            name_instruction = (
                f"Address the seeker warmly as '{seeker_fn} जी' in your blessing and advice."
                if seeker_fn
                else "Address the seeker affectionately as 'बेटा' (or 'priye' / 'beta'). NEVER say 'User ji' or 'Guest ji'!"
            )
            pandit_mandate = (
                "### MANDATORY PANDIT JI PERSONA & SHORT ANSWER MANDATE:\n"
                f"1. Open with authentic traditional blessings: {sal_hi_sample} (or 'जय श्री राम!' / 'शुभम भवतु!'). {name_instruction}\n"
                "2. STRICT SHORT LENGTH (MAX 75-100 WORDS): Write ONLY 2 to 3 short paragraphs. No lengthy essays. Common people want quick, sweet, readable answers.\n"
                "3. ZERO BOLD TEXT: Do NOT use markdown bold tags (**text**) or asterisks anywhere in your response. Write plain, natural, gentle text.\n"
                "4. STRICT NON-REPETITION & DEEP PERSONALIZATION: Every seeker is unique. NEVER output standard boilerplate or repetitive template phrases. Vary your greetings, phrasing, and explanations dynamically based on their specific Lagna, Moon sign, and house lords.\n"
                "5. Always offer 1 easy, practical home remedy (e.g. Surya Arghya, Hanuman Chalisa, Gayatri mantra, kindness/charity) that brings peace and hope.\n"
                "6. Never say you are an AI or robot. Speak as a wise, loving, venerable Vedic Astrologer.\n\n"
            )
            persona_block = f"### ACTIVE ASTROLOGER PERSONA: {persona['name']} ({persona['title']})\n{persona['system_instruction']}\n\n"
            combined_system_instruction = (
                f"{ASTROAI_SYSTEM_PROMPT_V2}\n\n"
                f"{pandit_mandate}"
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

            # Resilient multi-model fallback list (handles 503 high demand seamlessly)
            candidate_models = [settings.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
            response_content = ""
            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=contents,
                        config=types.GenerateContentConfig(
                            system_instruction=combined_system_instruction,
                            temperature=0.75,
                            max_output_tokens=260
                        )
                    )
                    if response and response.text:
                        response_content = response.text
                        break
                except Exception as model_err:
                    logger.warning(f"Live Gemini call failed on {model_name}: {model_err}. Trying fallback model...")
                    continue

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
                        self.name = d.get("name", "")
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

                # Resolve seeker name to personalize the Pandit blessing
                seeker_fn, sal_hi_sample, sal_hgl_sample = _resolve_seeker_salutation(chart_context)
                name_instruction = (
                    f"Address the seeker warmly as '{seeker_fn} जी' in your blessing and advice."
                    if seeker_fn
                    else "Address the seeker affectionately as 'बेटा' (or 'priye' / 'beta'). NEVER say 'User ji' or 'Guest ji'!"
                )
                pandit_mandate = (
                    "### MANDATORY PANDIT JI PERSONA & SHORT ANSWER MANDATE:\n"
                    f"1. Open with authentic traditional blessings: {sal_hi_sample} (or 'जय श्री राम!' / 'शुभम भवतु!'). {name_instruction}\n"
                    "2. STRICT SHORT LENGTH (MAX 75-100 WORDS): Write ONLY 2 to 3 short paragraphs. No lengthy essays. Common people want quick, sweet, readable answers.\n"
                    "3. ZERO BOLD TEXT: Do NOT use markdown bold tags (**text**) or asterisks anywhere in your response. Write plain, natural, gentle text.\n"
                    "4. STRICT NON-REPETITION & DEEP PERSONALIZATION: Every seeker is unique. NEVER output standard boilerplate or repetitive template phrases. Vary your greetings, phrasing, and explanations dynamically based on their specific Lagna, Moon sign, and house lords.\n"
                    "5. Always offer 1 easy, practical home remedy (e.g. Surya Arghya, Hanuman Chalisa, Gayatri mantra, kindness/charity) that brings peace and hope.\n"
                    "6. Never say you are an AI or robot. Speak as a wise, loving, venerable Vedic Astrologer.\n\n"
                )
                persona_block = f"### ACTIVE ASTROLOGER PERSONA: {persona['name']} ({persona['title']})\n{persona['system_instruction']}\n\n"
                combined_system_instruction = (
                    f"{ASTROAI_SYSTEM_PROMPT_V2}\n\n"
                    f"{pandit_mandate}"
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

                # Multi-model streaming fallback list
                candidate_models = [settings.GEMINI_MODEL, "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
                stream_success = False

                for model_name in candidate_models:
                    try:
                        response_stream = client.models.generate_content_stream(
                            model=model_name,
                            contents=contents,
                            config=types.GenerateContentConfig(
                                system_instruction=combined_system_instruction,
                                temperature=0.75,
                                max_output_tokens=260
                            )
                        )

                        for chunk in response_stream:
                            if chunk.text:
                                full_content += chunk.text
                                yield {"type": "delta", "text": chunk.text}

                        if full_content.strip():
                            stream_success = True
                            break
                    except Exception as model_err:
                        logger.warning(f"Live Gemini streaming failed on {model_name}: {model_err}. Trying fallback model...")
                        continue

                if not stream_success:
                    logger.error("All live Gemini models failed or unavailable. Falling back to dynamic offline synthesis.")
                    is_demo = True

            except Exception as e:
                logger.error(f"Live Gemini initialization failed: {e}. Falling back to demo stream.")
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
                    "हरि ॐ! आयुष्मान भव बेटा 🙏\n\n"
                    "आपकी हथेली की रेखाओं का सामुद्रिक शास्त्र अनुसार ध्यानपूर्वक अवलोकन किया गया है:\n\n"
                    "१. **हस्त स्वरूप:** आपकी हथेली कर्मठ और परिश्रमी स्वभाव को दर्शाती है। आप जो भी काम मन लगाकर करेंगे, उसमें प्रभु कृपा से सिद्धि मिलेगी।\n"
                    "२. **जीवन रेखा:** शुक्र पर्वत के चारों ओर सुंदर घुमावदार जीवन रेखा उत्तम प्राणशक्ति, दीर्घायु और निरोगी जीवन का शुभ संकेत है।\n"
                    "३. **हृदय रेखा:** गुरु पर्वत की ओर अग्रसर हृदय रेखा निष्ठावान, दयालु और रिश्तों में सच्चा समर्पण दर्शाती है।\n"
                    "४. **मस्तिष्क रेखा:** गहरी और स्पष्ट रेखा आपकी व्यावहारिक समझ और सटीक निर्णय क्षमता को प्रकट करती है।\n"
                    "५. **भाग्य रेखा:** शनि पर्वत की ओर बढ़ रही रेखा आपके स्वयं के पुरुषार्थ और मेहनत से निरंतर उन्नति का मार्ग प्रशस्त कर रही है।\n\n"
                    "✨ **सरल एवं कल्याणकारी उपाय:**\n"
                    "प्रातःकाल सूर्य नारायण को तांबे के लोटे से अर्घ्य दें और प्रतिदिन माता-पिता का चरण स्पर्श करें। ईश्वर आपका कल्याण करेंगे।"
                )
            else:
                demo_text = (
                    "Hari Om! Ayushman Bhava beta 🙏\n\n"
                    "Aapki hatheli ki rekhaon ka Samudrika Shastra ke niyam anusar dhyanpurvak adhyayan kiya gaya hai:\n\n"
                    "१. **Hatheli ka Swaroop:** Aapki hatheli practical aur parishrami nature darshati hai. Mehnat se aap har karya mein safalta praapt karenge.\n"
                    "२. **Jeevan Rekha:** Shukra Parvat ke aas-paas clear curved line achhi vitality, swasthya aur utsah ko darshati hai.\n"
                    "३. **Hriday Rekha:** Guru Parvat ki taraf badhti रेखा aapki imaandari, sneh aur rishto ke prati vafadari ka prateek hai.\n"
                    "४. **Mastishk Rekha:** Saaf aur seedhi rekha batati hai ki aapka dhyan aur faisla lene ki shakti bohot vyavaharik hai.\n"
                    "५. **Bhagya Rekha:** Shani Parvat ki taraf badhna aapke swayam ke balbute par vikas aur unnati ka sanket deta hai.\n\n"
                    "✨ **Saral Kalyankari Upay:**\n"
                    "Pratidin subah Surya Dev ko jal arpit karein aur shant mann se Gayatri Mantra ka smaran karein. Ishwar sab mangal karenge."
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
