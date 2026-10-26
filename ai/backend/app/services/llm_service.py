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
import json
from packages.core.config import settings
from packages.core.logging import logger
from ai.backend.app.agents.prompts import ASTROAI_SYSTEM_PROMPT_V2
from ai.backend.app.agents.personas import get_persona, ASTROLOGER_PERSONAS
from packages.astrology.chart_context import ChartContext, validate_and_build_chart_context
from packages.astrology.chart_svg import generate_north_indian_kundli_svg

_GEMINI_CLIENT = None


def _get_gemini_client():
    """One shared client so every request reuses the open HTTPS connection (a new client per call costs ~0.5s)."""
    global _GEMINI_CLIENT
    if _GEMINI_CLIENT is not None:
        return _GEMINI_CLIENT
    try:
        from google import genai
        _GEMINI_CLIENT = genai.Client(api_key=settings.GEMINI_API_KEY)
        return _GEMINI_CLIENT
    except Exception as e:
        logger.warning(f"Could not initialize GenAI client: {e}")
        return None


def warm_up_gemini_async():
    """Fire one tiny request in the background so the first live call does not pay the cold-start delay."""
    import threading

    def _warm():
        try:
            client = _get_gemini_client()
            if client and settings.GEMINI_API_KEY:
                from google.genai import types
                for _ in client.models.generate_content_stream(
                    model="gemini-3.1-flash-lite", contents="hi",
                    config=types.GenerateContentConfig(max_output_tokens=4)
                ):
                    pass
        except Exception as e:  # noqa: BLE001 - warm-up is best effort
            logger.info(f"Gemini warm-up skipped: {e}")

    threading.Thread(target=_warm, daemon=True).start()

async def _hedged_stream(client, models, contents, config, hedge_after: float = 2.0, max_attempts: int = 3):
    """Streams text from Gemini without blocking the event loop.

    Time-to-first-token is very uneven (0.8s to 15s for the same prompt), so if no token has arrived
    after `hedge_after` seconds another request is started (alternating between `models`) and whichever answers first wins.
    """
    import threading
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue = asyncio.Queue()

    def worker(idx: int):
        try:
            for chunk in client.models.generate_content_stream(model=models[idx % len(models)], contents=contents, config=config):
                if chunk.text:
                    loop.call_soon_threadsafe(queue.put_nowait, (idx, "t", chunk.text))
            loop.call_soon_threadsafe(queue.put_nowait, (idx, "end", None))
        except Exception as e:  # noqa: BLE001 - reported to the consumer below
            loop.call_soon_threadsafe(queue.put_nowait, (idx, "err", e))

    started = 0

    def launch():
        nonlocal started
        threading.Thread(target=worker, args=(started,), daemon=True).start()
        started += 1

    launch()
    if len(models) > 1:
        launch()  # race two models from the start; latency is heavy-tailed, the faster draw wins
    winner = None
    finished = set()
    last_error: Optional[Exception] = None
    while True:
        waiting_for_first = winner is None
        timeout = hedge_after if waiting_for_first and started < max_attempts else 45
        try:
            idx, kind, value = await asyncio.wait_for(queue.get(), timeout)
        except asyncio.TimeoutError:
            if waiting_for_first and started < max_attempts:
                launch()
                continue
            raise TimeoutError("Gemini stream timed out")
        if waiting_for_first:
            if kind == "t":
                winner = idx
            else:
                finished.add(idx)
                last_error = value if kind == "err" else last_error
                if len(finished) >= started:
                    if started >= max_attempts:
                        raise last_error or RuntimeError("Gemini returned no text")
                    launch()
                continue
        if idx != winner:
            continue
        if kind == "t":
            yield value
        elif kind == "end":
            return
        else:
            raise value


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
    if re.search(r"[\u0C80-\u0CFF]", text):
        return "kn"
    if re.search(r"[\u0D00-\u0D7F]", text):
        return "ml"
    if re.search(r"[\u0B00-\u0B7F]", text):
        return "or"
    if re.search(r"[\u0600-\u06FF]", text):
        return "ur"
    if re.search(r"[\u0A00-\u0A7F]", text):
        return "pa"
    if re.search(r"[\u0900-\u097F]", text):
        if fallback_lang in ("sa", "mr"):
            return fallback_lang
        # Sanskrit markers
        if any(w in text for w in ["अस्ति", "भवति", "पश्यतु", "वदतु"]):
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


def _response_language(text: str, language: str) -> str:
    """Mirror this question; the website language is only an empty-input fallback."""
    if not text or not text.strip():
        return language or "en"
    return _detect_language(text, fallback_lang="en")



def _is_greeting(text: str) -> bool:
    """Checks if message is solely or primarily a friendly greeting."""
    clean = re.sub(r"[^\w\s]", "", text.strip().lower())
    greetings = {
        "hi", "hello", "hii", "hiii", "hey", "heya", "namaste", "namaskar",
        "pranam", "kaise ho", "kese ho", "hello ji", "hey there", "hola",
        "good morning", "good afternoon", "good evening", "shukriya", "thank you", "thanks"
    }
    return clean in greetings or any(clean.startswith(g) for g in ["hi ", "hello ", "hey ", "namaste "]) and len(clean.split()) <= 4


def is_in_astrology_domain(text: str, language: Optional[str] = None) -> Tuple[bool, Optional[str]]:
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

    # 1. Allow explicit topic changes and conversation redirection (PRIORITY 1)
    if any(m in clean for m in ["stop talking about", "don't talk about", "stop discussing", "change topic", "let's change topic", "topic badlo", "baat mat karo", "chhoro ye", "aage badho", "let's move on"]):
        return True, None

    # 2. Allow safety / threat phrases to pass to the de-escalation safety handler
    threat_markers = ["kill", "murder", "harm someone", "hurt someone", "stab", "attack", "maar dunga", "jaan se maar", "psycho", "revenge", "goli maar", "chaku", "violence"]
    if any(m in clean for m in threat_markers):
        return True, None

    # 3. Strict Astrology Domain: Block cooking/recipe queries (e.g. Maggi, food, cooking)
    if re.search(r"\b(maggi|how to make maggi|recipe for maggi|maggi recipe|maggi kaise banayein|maggi kaise banaye|recipe|noodles|how to cook)\b", clean):
        detected_lang = _response_language(text, language) if language else _detect_language(text)
        if detected_lang == "hi":
            refusal = "क्षमा करें, मैं केवल वैदिक ज्योतिष (जन्म कुण्डली), हस्तरेखा एवं ग्रह-दशा मार्गदर्शन के लिए उपलब्ध हूँ 😊 मैं भोजन पकाने (रेसिपी), सामान्य ज्ञान या अन्य गैर-ज्योतिषीय विषयों का उत्तर नहीं दे सकता। कृपया अपनी जन्म कुंडली, करियर, विवाह या जीवन के ग्रह योग से संबंधित प्रश्न पूछें!"
        elif detected_lang == "hinglish":
            refusal = "Kshama karein, main sirf Vedic Astrology (Kundli), Hastrekha aur graha-dasha guidance ke liye trained hoon 😊 Main cooking recipes (jaise Maggi), general knowledge ya astrology ke bahar kisi topic ka jawab nahi de sakta. Kripya apne jeevan, love, career, kundli ya hastrekha se juda koi sawaal poochein!"
        else:
            refusal = "I specialize exclusively in Vedic Astrology, Kundli analysis, Palmistry (Hastrekha), and astrological life guidance 😊 I cannot answer queries outside astrology (such as cooking recipes, coding, or general trivia). Please feel free to ask about your birth chart, career path, relationships, or planetary influences!"
        return False, refusal

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
            detected_lang = _response_language(text, language) if language else _detect_language(text)
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
        sal_hi = f"{first_name} जी, "
        sal_hgl = f"{first_name} ji, "
    else:
        sal_hi = ""
        sal_hgl = ""

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
    detected_lang = _response_language(user_message, language)
    msg_lower = user_message.lower().strip()
    persona = get_persona(astrologer_id)

    # Dynamic domain check: strictly blocks non-astrology / cooking queries (e.g. Maggi)
    in_domain, refusal = is_in_astrology_domain(user_message, language=language)
    if in_domain and conversation_history:
        from ai.backend.app.services.scope_guard import AstrologyScopeGuard
        _ok, _ref, _why = AstrologyScopeGuard.check_scope(user_message, conversation_history)
        if not _ok and _ref:
            in_domain, refusal = False, _ref
    if not in_domain and refusal:
        return refusal

    # Resolve safe seeker name and traditional respectful salutation (NEVER "User ji")
    first_name, sal_hi, sal_hgl = _resolve_seeker_salutation(chart_context)

    # Dynamic variation seed to guarantee different users and queries NEVER receive identical text
    l_sign = chart_context.ascendant_sign or "Mesha (Aries)" if chart_context.is_verified else "Aries"
    m_sign = chart_context.moon_sign or "Karka (Cancer)" if chart_context.is_verified else "Cancer"
    seed_str = f"{msg_lower}_{first_name}_{l_sign}_{m_sign}_{int(time.time()) // 10}"
    v_seed = int(hashlib.md5(seed_str.encode('utf-8')).hexdigest(), 16)

    # Context awareness: If conversation history exists and this is a follow-up, suppress repetitive blessings
    has_history = bool(conversation_history and len(conversation_history) > 0)
    if has_history or not _is_greeting(user_message):
        sal_hi = f"{first_name} जी, " if first_name else ""
        sal_hgl = f"{first_name} ji, " if first_name else ""

    # A. Explicit Topic Change / Redirection (PRIORITY 1: Always check before topic keywords)
    topic_change_markers = [
        "stop talking about", "don't talk about", "stop discussing", "change topic",
        "let's change topic", "topic badlo", "baat mat karo", "chhoro ye", "aage badho",
        "let's move on", "kuch aur baat", "doosri baat"
    ]
    if any(m in msg_lower for m in topic_change_markers):
        if detected_lang == "hi":
            return "अवश्य, हम उस विषय को यहीं समाप्त करते हैं। कृपया बताइए, अब आप किस नए ज्योतिषीय विषय पर चर्चा या मार्गदर्शन चाहते हैं?"
        elif detected_lang == "hinglish":
            return "Bilkul, us topic ko yahin chhod dete hain. Batayein, ab aap kis vishay ya astrology question par guidance chahte hain?"
        else:
            return "Certainly, let us leave that topic behind. What specific astrological question or topic would you like to explore next?"

    # B. Safety & Threats De-escalation (Calm, non-judgmental, physical distance, emergency helpline)
    threat_keywords = [
        "kill", "murder", "harm someone", "hurt someone", "stab", "attack",
        "maar dunga", "jaan se maar", "psycho", "revenge", "goli maar", "chaku", "violence"
    ]
    if any(k in msg_lower for k in threat_keywords):
        if detected_lang == "hi":
            return (
                "कृपया शांत रहें। क्या इस समय कोई व्यक्ति या आप तत्काल किसी खतरे में हैं? "
                "यदि आप बहुत क्रोधित या तनाव में हैं, तो कृपया उस व्यक्ति, परिस्थिति या किसी भी हथियार से तुरंत दूरी बना लें। "
                "यदि किसी को नुकसान पहुँचने की आशंका है, तो तुरंत आपातकालीन हेल्पलाइन (112) या अपने किसी विश्वसनीय परिजन/मित्र से संपर्क करें। किसी को चोट पहुँचाना कोई समाधान नहीं है।"
            )
        elif detected_lang == "hinglish":
            return (
                "Kripya shant rahein. Kya is samay koi vyakti ya aap immediate physical danger mein hain? "
                "Agar aap bohot zyada gusse ya tanaav mein hain, toh kripya turant us jagah, vyakti ya kisi bhi hathiyar se door ho jayein. "
                "Agar kisi ko chot lagne ka khatra hai, toh turant emergency helpline (112) ya kisi trusted family member ko contact karein. Hinsa kisi samasya ka hal nahi hai."
            )
        else:
            return (
                "Please pause and take a breath. Is anyone in immediate physical danger right now? "
                "If you are experiencing intense anger or distress, please step away from the situation and put physical distance between yourself, others, and any potential weapons. "
                "If someone may be harmed, please immediately contact emergency services (112 or local emergency number) or a trusted person for assistance. Violence is never a safe path."
            )

    if detected_lang == "en":
        if msg_lower in ["continue", "aage", "aage btao"] and not conversation_history:
            return "What would you like guidance on: relationships, career, or your birth chart?"
        if _is_greeting(user_message):
            name = "Pt. Rameshwar Dwivedi" if astrologer_id in ("pt_rameshwar_dwivedi", "pt-rameshwar-dwivedi") else persona["name"]
            return f"Hello! I am {name}. How may I help you with your birth chart or a question about your life today?"
        if any(k in msg_lower for k in ["wealth", "finance", "money", "paisa", "dhan", "debt", "karz"]):
            if not chart_context.is_verified:
                return "Please share your birth date, time, and city for a personal astrological analysis of your financial questions."
            return "Your verified birth chart can be used to examine the second and eleventh houses associated with resources and income. Exact timing requires a detailed analysis of the planetary periods."
        if any(k in msg_lower for k in ["health", "swasthya", "tabiyat", "beemari", "rog"]):
            return "For general wellbeing, make time for rest, balanced meals, and gentle exercise. Astrology cannot diagnose health conditions; consult a qualified clinician about symptoms or treatment."
        if any(k in msg_lower for k in ["moon sign", "chandra rashi", "chandrama", "rashi", "nakshatra"]):
            if not chart_context.is_verified:
                return "Please share your birth date, exact birth time, and city so that your Moon sign and lunar constellation can be calculated."
            return f"Your calculated Moon sign is {chart_context.moon_sign}, and your lunar constellation is {chart_context.moon_nakshatra}."
        if is_kundli_requested(user_message):
            if not chart_context.is_verified:
                return "A birth chart requires your birth date, time, and city. Please add these details to calculate your chart."
            return f"Your calculated birth chart has {chart_context.ascendant_sign} rising and the Moon in {chart_context.moon_sign}. What would you like to explore?"

    # Handle continue when history is empty
    if msg_lower in ["continue", "aage", "aage btao"] and not conversation_history:
        return f"नमस्ते {first_name or 'जातक'}! आप किस विषय पर मार्गदर्शन चाहते हैं? प्रेम, करियर या जन्म कुंडली के बारे में पूछ सकते हैं।"

    # 1. Greeting handling (Persona specific - courteous welcome without excessive blessings)
    if _is_greeting(user_message):
        name_part_hi = f"{first_name} जी" if first_name else ""
        name_part_hgl = f"{first_name} ji" if first_name else ""
        if astrologer_id in ("pt_rameshwar_dwivedi", "pt-rameshwar-dwivedi"):
            if detected_lang == "hi":
                return f"प्रणाम {name_part_hi}! मैं पं. रामेश्वर द्विवेदी। काशी की वैदिक परंपरा अनुसार आपके प्रश्नों के समाधान हेतु उपस्थित हूँ। कहिए क्या मार्गदर्शन चाहते हैं?"
            elif detected_lang == "hinglish":
                return f"Pranam {name_part_hgl}! Main Pt. Rameshwar Dwivedi. Kashi ki Vedic parampara anusaar aapke jeevan ke margdarshan ke liye upastith hoon. Kahiye kya poochna chahte hain?"
            else:
                return f"Pranam {name_part_hgl}! I am Pt. Rameshwar Dwivedi, senior Vedic scholar from Varanasi. How may I assist you with your questions today?"
        elif astrologer_id == "dr_sunita":
            if detected_lang == "hi":
                return f"नमस्ते {name_part_hi}! मैं विदुषी सुनीता शर्मा। जीवन, मन की शांति या संबंधों के विषय में क्या परामर्श चाहते हैं? निसंकोच कहें।"
            elif detected_lang == "hinglish":
                return f"Namaste {name_part_hgl}! Main Vidushi Sunita Sharma. Kaise hain aap? Rishto ya mann ki shanti par guidance chahiye toh freely bataiye."
            else:
                return f"Namaste {name_part_hgl}! I am Vidushi Sunita Sharma. How may I bring peace, clarity, and harmony to your relationships today?"
        elif astrologer_id == "pandit_maharaj":
            if detected_lang == "hi":
                return f"जय श्री राम {name_part_hi}! मैं पंडित जी महाराज। आज अपने कर्म, व्यापार, नौकरी अथवा धन योग के विषय में क्या जानना चाहते हैं?"
            elif detected_lang == "hinglish":
                return f"Jai Shri Ram {name_part_hgl}! Main Pandit Ji Maharaj. Career, vyapar ya dasha ke baare mein kya guidance chahiye?"
            else:
                return f"Jai Shri Ram {name_part_hgl}! I am Pandit Ji Maharaj. How may I assist your career and financial endeavors today?"
        else: # Acharya Shastri
            if detected_lang == "hi":
                return f"नमस्ते {name_part_hi}! कैसे हैं आप? मैं आचार्य शास्त्री। कहिए, आज अपनी जन्म कुण्डली या जीवन के विषय में क्या जानना चाहते हैं?"
            elif detected_lang == "hinglish":
                return f"Hello & Namaste {name_part_hgl}! Kaise ho? Main Acharya Shastri. Kahiye, aaj kundli ya jeevan ke baare mein kya poochna chahte hain?"
            else:
                return f"Hello {name_part_hgl}! I am Acharya Shastri. How may I assist your life queries and Kundli analysis today?"

    # 2. Short answer request
    if any(k in msg_lower for k in ["short me", "short mein", "in short", "briefly", "chota sa"]):
        if detected_lang == "hinglish":
            if chart_context.is_verified:
                return f"{sal_hgl}Sankshep mein: aapka Lagna {chart_context.ascendant_sign} aur Moon sign {chart_context.moon_sign} hai. Yeh sthiti dhairya aur samajhdari darshati hai. Surya dev ko jal arpit karte rahein, kalyankari rahega."
            return f"{sal_hgl}Sankshep mein: bina birth details ke keval saamanya margdarshan ho sakta hai. Sateek faladesh ke liye birth details zaroori hain."
        elif detected_lang == "hi":
            if chart_context.is_verified:
                return f"{sal_hi}संक्षेप में: आपका लग्न {chart_context.ascendant_sign} और चंद्र राशि {chart_context.moon_sign} है। यह स्थिति धैर्य और सूझबूझ दर्शाती है। नित्य सूर्य नारायण को जल अर्पित करें।"
            return f"{sal_hi}संक्षेप में: सटीक फलकथन हेतु जन्म विवरण आवश्यक है, अन्यथा केवल सामान्य मार्गदर्शन ही संभव है।"
        else:
            if chart_context.is_verified:
                return f"In brief: with {chart_context.ascendant_sign} Ascendant and {chart_context.moon_sign} Moon, patient focus and clear wisdom are your natural strengths."
            return "In brief: exact planetary analysis requires birth details, though general wisdom is always here to guide you."

    # 3. Love and relationships (Direct astrological analysis, no repetitive blessings)
    if re.search(r"\b(?:love|relationship|rishta|pyaar|prem|marriage|shaadi|shadi|patni|pati)\b|शादी|विवाह", msg_lower):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return f"{sal_hi}विवाह और प्रेम जीवन के सटीक समय व फलादेश के लिए जन्म तिथि, समय और स्थान आवश्यक हैं। यदि सही समय न भी पता हो, तो अनुमानित समय बताएं, हम उचित मार्गदर्शन करेंगे।"
            elif detected_lang == "hinglish":
                return f"{sal_hgl}Bilkul, love aur prem-vivah ke vishay mein sateek dekhne ke liye date of birth, time aur birth place share karein. Samay anumaanit ho toh bhi batayein, hum ucchit margdarshan karenge."
            else:
                return f"{first_name or 'Seeker'}, to analyze your love life and marriage timing, kindly share your date of birth, birth time, and birth place."
        else:
            venus_p = next((p for p in chart_context.planets if p.get("name") == "Venus"), None)
            v_sign = venus_p.get("sign") if venus_p else "Taurus"
            rel_var = v_seed % 4
            if detected_lang == "hinglish":
                if rel_var == 0:
                    return (
                        f"{sal_hgl}Aapki kundli mein Lagna ({l_sign}), daampatya sthan aur Shukra dev ki sthiti ({v_sign}) aapsi sneh aur samajhdari ko darshati hai. "
                        "Sambandhon mein thoda dhairya aur aapas mein khulkar samvaad rakhne se prem jeevan madhur aur anukool rahega.\n\n"
                        "Saral Upay: Shukravaar ko kisi zarooratmand ko safed vastu (doodh ya mishri) ka daan karein."
                    )
                elif rel_var == 1:
                    return (
                        f"{sal_hgl}Aapki kundli ke Lagna ({l_sign}) aur Chandra sthiti ({m_sign}) ke anusaar, jeevansathi ke prati samman aur vishwas rishte ko sthirta dega. "
                        "Chhoti-moti baaton ko dil se na lagayein, samay ke sath prem aur gehra hoga.\n\n"
                        "Saral Upay: Sandhya samay ghar mein kapoor ka deepak prajwalit karein aur Maa Laxmi ka smaran karein."
                    )
                elif rel_var == 2:
                    return (
                        f"{sal_hgl}Aapke Lagna ({l_sign}) anusaar saptam bhav aur Shukra dev ({v_sign}) yeh sanket de rahe hain ki aane wale samay mein rishto mein aapsi samvaad behtar hoga. "
                        "Apne partner ke vicharon ko dhyan se sunna aur krodh se bachna prem mein madhurta layega.\n\n"
                        "Saral Upay: Somvaar ko shivling par kacha doodh aur jal arpit karein."
                    )
                else:
                    return (
                        f"{sal_hgl}Aapke Lagna ({l_sign}) aur kundli mein grahon ki dasha yeh batati hai ki meethi vaani aur ek-doosre par bharosa hi aapke rishte ki sabse badi taaqat hai. "
                        "Dhairya se kaam lein, vivah aur prem mein sthirta ke shubh yog ban rahe hain.\n\n"
                        "Saral Upay: Shukravaar ko kisi kanya ya zarooratmand ko meetha prasad dein."
                    )
            elif detected_lang == "hi":
                if rel_var == 0:
                    return (
                        f"{sal_hi}आपकी कुण्डली में दांपत्य भाव और शुक्र देव की स्थिति ({v_sign}) प्रेम और समझदारी का शुभ संकेत दे रही है। "
                        "रिश्तों में थोड़ा धैर्य और आपसी विश्वास बनाए रखने से दांपत्य जीवन में सुख और सौहार्द बना रहेगा।\n\n"
                        "सरल उपाय: शुक्रवार के दिन गाय को हरा चारा या गुड़-रोटी खिलाएं और नित्य बड़ों का चरण स्पर्श करें।"
                    )
                elif rel_var == 1:
                    return (
                        f"{sal_hi}आपकी जन्म कुण्डली में लग्न ({l_sign}) और सप्तमेश का प्रभाव यह दर्शाता है कि आपसी बातचीत और एक-दूसरे की भावनाओं का आदर करने से संबंध अत्यंत मधुर रहेंगे। "
                        "क्रोध और जल्दबाजी से बचें, समय आपके अनुकूल हो रहा है।\n\n"
                        "सरल उपाय: संध्या समय घर में घी का दीपक जलाएं और भगवान शिव-पार्वती का ध्यान करें।"
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
                    f"Divine blessings to you 🙏\n\n"
                    f"Your chart has {l_sign} rising and Venus in {v_sign}. These placements are traditionally associated with affection, mutual loyalty, and emotional bonding. "
                    "Gentle patience and open communication will bring lasting harmony to your relationship.\n\n"
                    "Suggested practice: Cultivate gentle patience and offer peaceful prayers on Friday mornings for divine grace."
                )

    # 4. Career and Profession (Direct astrological analysis, no repetitive blessings)
    if any(k in msg_lower for k in ["career", "carrier", "job", "naukri", "business", "vyapar", "kaam", "work", "promotion", "करियर", "कैरियर", "नौकरी", "व्यापार"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return f"{sal_hi}आजीविका और नौकरी की सटीक दशा देखने के लिए अपना जन्म विवरण (तारीख, समय, स्थान) साझा करें। हम दशम भाव और भाग्य स्थान का भलीभांति विश्लेषण करेंगे।"
            elif detected_lang == "hinglish":
                return f"{sal_hgl}Career aur naukri ki sateek sthiti dekhne ke liye birth details (date of birth, time, place) batayein. Hum 10th house ka sateek vishleshan karenge."
            else:
                return f"{first_name or 'Seeker'}, for personal career guidance, kindly share your date of birth, birth time, and birth place."
        else:
            jup_p = next((p for p in chart_context.planets if p.get("name") == "Jupiter"), None)
            j_sign = jup_p.get("sign") if jup_p else "Sagittarius"
            sat_p = next((p for p in chart_context.planets if p.get("name") == "Saturn"), None)
            s_sign = sat_p.get("sign") if sat_p else "Capricorn"
            car_var = v_seed % 4
            if detected_lang == "hinglish":
                if car_var == 0:
                    return (
                        f"{sal_hgl}Aapki kundli mein karm sthan (10th house) aur Devguru Brihaspati ({j_sign}) aapki buddhi aur parishram ko bal de rahe hain. "
                        "Nishtha se kiya gaya prayas ajeevika mein acchi tarakki aur sthirta dilwayega.\n\n"
                        "Saral Upay: Nitya subah Surya Dev ko taambe ke lote se jal arpit karein aur Gayatri mantra ka smaran karein."
                    )
                elif car_var == 1:
                    return (
                        f"{sal_hgl}Aapke Lagna ({l_sign}) aur Shani Dev ({s_sign}) ki sthiti darshati hai ki shuruat mein thodi mehnat lagegi, par parinam dirghkaalik aur majboot honge. "
                        "Apne karya par niyamit dhyan banaye rakhein, aane wale samay mein samman badhega.\n\n"
                        "Saral Upay: Shanivaar ko shramikon ya zarooratmand ko bhojan karayein aur Hanuman Chalisa ka path karein."
                    )
                elif car_var == 2:
                    return (
                        f"{sal_hgl}Dasham sthan aur Chandra rashi ({m_sign}) ke anusaar nayi yojanaon aur karya mein safalta ke yog ban rahe hain. "
                        "Uchhadhikariyon aur sahyogiyon ke sath vinamra vartav rakhein, tarakki ke dwar khulenge.\n\n"
                        "Saral Upay: Guruvaar ke din maathe par chandan ya kesar ka tilak lagayein."
                    )
                else:
                    return (
                        f"{sal_hgl}Kundli mein dasham aur bhagya bhav darshate hain ki aapki kshamta aur lagan aane wale samay mein acche avsar layenge. "
                        "Dhairya aur atmavishwas ke sath prayas karte rahein, aarthik aur vyavasayik sthirta prapt hogi.\n\n"
                        "Saral Upay: Roz subah pakshiyon ko daana daalein aur Surya Narayan ko pranam karein."
                    )
            elif detected_lang == "hi":
                if car_var == 0:
                    return (
                        f"{sal_hi}आपकी कुण्डली में दशम भाव और देवगुरु बृहस्पति ({j_sign}) यह दर्शा रहे हैं कि आपकी मेहनत और विद्या से आजीविका में उत्तम प्रगति होगी। "
                        "धैर्यपूर्वक अपने लक्ष्य पर केंद्रित रहें, मान-सम्मान और पद-प्रतिष्ठा के अच्छे योग बन रहे हैं।\n\n"
                        "सरल उपाय: प्रातःकाल सूर्य नारायण को जल का अर्घ्य दें और गुरुवार को चंदन का तिलक लगाएं।"
                    )
                elif car_var == 1:
                    return (
                        f"{sal_hi}आपकी कुण्डली में लग्न ({l_sign}) और शनि देव ({s_sign}) यह संकेत कर रहे हैं कि निरंतर कर्म और अनुशासन से ही स्थायी सफलता मिलेगी। "
                        "निराश न हों, आपकी मेहनत का मीठा फल आने वाले समय में अवश्य मिलेगा।\n\n"
                        "सरल उपाय: शनिवार के दिन हनुमान चालीसा का पाठ करें और जरूरतमंदों की सहायता करें।"
                    )
                elif car_var == 2:
                    return (
                        f"{sal_hi}दशम भाव की ग्रह स्थिति यह बता रही है कि कार्यक्षेत्र में नई जिम्मेदारियां और पदोन्नति के अनुकूल अवसर बनेंगे। "
                        "अपने वरिष्ठों से मधुर संबंध बनाए रखें और एकाग्रता से अपने कार्य को पूर्ण करें।\n\n"
                        "सरल उपाय: प्रतिदिन पक्षियों को दाना डालें और प्रातः गायत्री मंत्र का 11 बार शांत मन से जप करें।"
                    )
                else:
                    return (
                        f"{sal_hi}आपकी चंद्र राशि ({m_sign}) और कर्म स्थान का संयोग आजीविका में नई ऊर्जा और प्रगति का मार्ग प्रशस्त कर रहा है। "
                        "सकारात्मक सोच के साथ आगे बढ़ें, उचित मार्गदर्शन से परिश्रम का फल मिलेगा।\n\n"
                        "सरल उपाय: गुरुवार को किसी मंदिर में चने की दाल या पीले फल का दान करें।"
                    )
            else:
                return (
                    f"In your birth chart, Jupiter in {j_sign} and the 10th house support professional dignity and gradual growth through consistent work.\n\n"
                    "Suggested practice: Offer water to the rising Sun daily and seek the guidance of elders before starting important projects."
                )

    # 5. Wealth, Finance, Money (Direct astrological analysis, no repetitive blessings)
    if any(k in msg_lower for k in ["money", "paisa", "dhan", "wealth", "finance", "karz", "debt", "laxmi"]):
        if not chart_context.is_verified:
            if detected_lang == "hi":
                return f"{sal_hi}धन, समृद्धि और आर्थिक स्थिति का विश्लेषण करने के लिए अपना जन्म विवरण साझा करें।"
            else:
                return f"{sal_hgl}Dhan aur financial growth ke liye apni birth date, time aur city batayein."
        else:
            w_var = v_seed % 3
            if detected_lang == "hi":
                if w_var == 0:
                    return (
                        f"{sal_hi}आपकी कुण्डली में धन भाव (द्वितीय स्थान) और लाभ भाव (एकादश स्थान) अनुकूल स्थिति दर्शा रहे हैं। अनावश्यक खर्चों पर नियंत्रण रखें, धीरे-धीरे संचित धन में वृद्धि होगी।\n\n"
                        "सरल उपाय: शुक्रवार को श्री सूक्त का पाठ करें अथवा किसी देवी मंदिर में मिश्री का भोग लगाएं।"
                    )
                elif w_var == 1:
                    return (
                        f"{sal_hi}आपकी लग्न ({l_sign}) अनुसार आय के साधन निरंतर बने रहेंगे, किंतु बजट का ध्यान रखना आवश्यक है। जल्दबाजी में कोई जोखिम भरा निवेश न करें।\n\n"
                        "सरल उपाय: प्रतिदिन पक्षियों को दाना-पानी दें और शाम को तुलसी जी के पास घी का दीपक प्रज्वलित करें।"
                    )
                else:
                    return (
                        f"{sal_hi}द्वितीय और एकादश भाव की ग्रह स्थिति यह दर्शाती है कि आपकी सूझबूझ से संचित धन में स्थिरता आएगी।\n\n"
                        "सरल उपाय: शुक्रवार को किसी जरूरतमंद को सफेद अन्न का दान करें।"
                    )
            else:
                if w_var == 0:
                    return (
                        f"{sal_hgl}Aapki kundli mein dhan bhav (2nd house) aur labha bhav (11th house) aarthik sthirta ka sanket de rahe hain. Thoda budget banakar chalein, aane wale samay mein savings badhengi.\n\n"
                        "Saral Upay: Shukravaar ko safed vastu ka daan karein aur Maa Laxmi ka smaran karein."
                    )
                elif w_var == 1:
                    return (
                        f"{sal_hgl}Aapke Lagna ({l_sign}) anusaar aarthik sthiti mein sudhar ke yog ban rahe hain. Bina soche samjhe kisi ko udhaar na dein aur kharchon par santulan banaye rakhein.\n\n"
                        "Saral Upay: Sham ko Tulsi ji ke paas ghee ka deepak jalayein aur Shri Suktam ka path sunein."
                    )
                else:
                    return (
                        f"{sal_hgl}Kundli ke anusaar parishram se dhan ki aawak bani rahegi. Aane wale samay mein aarthik roop se naye avsar milenge, atmavishwas banaye rakhein.\n\n"
                        "Saral Upay: Roz subah pakshiyon ko anaaj dalein."
                    )

    # 6. Health & Wellbeing (Direct guidance)
    if any(k in msg_lower for k in ["health", "swasthya", "tabiyat", "beemari", "rog"]):
        h_var = v_seed % 3
        if detected_lang == "hi":
            if h_var == 0:
                return f"{sal_hi}स्वास्थ्य की रक्षा के लिए नित्य प्रातः सूर्य नमस्कार करें और महामृत्युंजय मंत्र का 11 बार स्मरण करें। संतुलित आहार और सकारात्मक विचार रखें।"
            elif h_var == 1:
                return f"{sal_hi}आपकी लग्न ({l_sign}) अनुसार मन को तनावमुक्त रखना ही उत्तम स्वास्थ्य का मूल मंत्र है। नित्य ताजी हवा में टहलें और जल का सेवन पर्याप्त मात्रा में करें।"
            else:
                return f"{sal_hi}स्वास्थ्य के संबंध में धैर्य रखें। प्रातःकाल सूर्य नारायण को जल अर्पित करें और महामृत्युंजय मंत्र का शांत भाव से स्मरण करें।"
        else:
            if h_var == 0:
                return f"{sal_hgl}Swasthya ke liye subah taaza hawa mein ghoomein aur Mahamrityunjaya Mantra ka shant mann se smaran karein."
            elif h_var == 1:
                return f"{sal_hgl}Tanaav aur chinta se bachein. Nitya subah Surya Dev ko jal arpit karein aur shant mann se prarthana karein. Swasthya anukool rahega."
            else:
                return f"{sal_hgl}Santulit aahar lein aur roz subah thoda dhyan aur pranayam karein. Sharirik aur mansik shanti prapt hogi."

    # 7. Moon sign & Nakshatra
    if any(k in msg_lower for k in ["moon sign", "chandra rashi", "chandrama", "rashi", "nakshatra"]):
        if not chart_context.is_verified:
            return f"{sal_hi}आपकी चंद्र राशि जानने के लिए जन्म तिथि, सही समय और शहर बताएं। हम तुरंत गणना करके आपको बताएंगे।" if detected_lang == "hi" else f"{sal_hgl}Chandra Rashi jaanane ke liye date of birth, time aur city batayein."
        else:
            if detected_lang == "hi":
                return f"{sal_hi}आपकी जन्म चंद्र राशि {chart_context.moon_sign} है, और जन्म नक्षत्र {chart_context.moon_nakshatra} है। यह आपके शांत हृदय और गहरी संवेदनशीलता का प्रतीक है।"
            else:
                return f"{sal_hgl}Aapki janm rashi {chart_context.moon_sign} aur nakshatra {chart_context.moon_nakshatra} hai. Yeh sheetalta aur teekshna buddhi ko darshata hai."

    # 8. Kundli Diagram / Analysis request
    if is_kundli_requested(user_message):
        if not chart_context.is_verified:
            return "कुण्डली चक्र देखने के लिए जन्म विवरण आवश्यक है। कृपया तारीख, समय और शहर बताएं।" if detected_lang == "hi" else "Kundli chakra ke liye birth details (taareekh, samay aur sthan) batayein."
        else:
            if detected_lang == "hi":
                return f"{sal_hi}यह रही आपकी जन्म कुण्डली: लग्न {chart_context.ascendant_sign}, चंद्र राशि {chart_context.moon_sign}। लग्न चक्र प्रस्तुत है, जो भी संशय हो पूछिए।"
            else:
                return f"{sal_hgl}Yeh rahi aapki Janam Kundli: Lagna {chart_context.ascendant_sign}, Moon {chart_context.moon_sign}. Koi prashna ho toh poochiye."

    # 9. General fallback (Direct astrological guidance)
    gen_var = v_seed % 4
    if detected_lang == "hinglish":
        if gen_var == 0:
            return f"{sal_hgl}Vedic Jyotish ke anusaar satkarma aur dhairya se har sthiti anukool ho jati hai. Surya dev ko jal arpit karein aur shant mann se apna prashna poochein."
        elif gen_var == 1:
            return f"{sal_hgl}Aapki kundli ke Lagna ({l_sign}) anusaar parishram aur nishtha hi aapke sabse bade sahayak hain. Jeevan, career ya vivah ke baare mein jo poochna ho batayein."
        elif gen_var == 2:
            return f"{sal_hgl}Samay ke sath har mushkil ka samadhan nikalta hai. Nitya Hanuman Chalisa ka path karein aur apna prashna kahein."
        else:
            return f"{sal_hgl}Shant chitt se kiya gaya karm sadaiv shubh fal deta hai. Kundli se juda koi bhi vishisht prashna poochiye."
    elif detected_lang == "hi":
        if gen_var == 0:
            return f"{sal_hi}वैदिक ज्योतिष अनुसार सत्कर्म और धैर्य से सभी बाधाएं दूर होती हैं। नित्य सूर्य नारायण की उपासना करें। मन में जो भी संशय हो, निसंकोच पूछें।"
        elif gen_var == 1:
            return f"{sal_hi}आपके लग्न ({l_sign}) अनुसार आपका परिश्रम और निष्ठा ही आपकी सफलता की नींव है। जीवन के किसी भी क्षेत्र से संबंधित प्रश्न निसंकोच पूछिए।"
        elif gen_var == 2:
            return f"{sal_hi}धैर्य से हर समस्या का समाधान प्राप्त होता है। नित्य गायत्री मंत्र का स्मरण करें और अपना प्रश्न कहें।"
        else:
            return f"{sal_hi}शांत और निर्मल मन से किए गए कर्म सदैव मंगलकारी होते हैं। कुंडली या जीवन से जुड़ा कोई भी प्रश्न पूछें।"
    else:
        return f"In Vedic tradition, patience and righteous action bring peace and clarity. Feel free to ask any specific query about your life or chart."


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
        language = _response_language(user_message, language)
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
        in_domain, refusal = is_in_astrology_domain(user_message, language=language)
        if in_domain and conversation_history:
            from ai.backend.app.services.scope_guard import AstrologyScopeGuard
            _ok, _ref, _why = AstrologyScopeGuard.check_scope(user_message, conversation_history)
            if not _ok and _ref:
                in_domain, refusal = False, _ref
        if not in_domain and refusal:
            return {
                "content": refusal,
                "is_demo_mode": False,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "astrologer_id": astrologer_id
            }

        # Sub-15ms Semantic Cache Fast-Path for generalized astrological knowledge/remedies (turn 1 only)
        is_special_intent = any(k in user_message.lower() for k in ["maggi", "kill", "murder", "stop", "change topic", "chhoro", "psycho", "threat", "harm"])
        if not chart_data and not image_base64 and not conversation_history and not is_special_intent:
            from ai.backend.app.services.semantic_cache import semantic_cache
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

            detected_lang = _response_language(user_message, language)
            lang_label = "Devanagari Hindi" if detected_lang == "hi" else "Conversational Hinglish (Roman script)" if detected_lang == "hinglish" else "English" if detected_lang == "en" else detected_lang
            language_mandate = (
                f"### MANDATORY USER LANGUAGE REQUIREMENT: {detected_lang.upper()} ({lang_label})\n"
                f"CRITICAL: The current question is in {detected_lang.upper()} ({lang_label}). "
                f"You MUST reply in the language and script of the current question. The website menu language must never override the question language. Do not mix English and Hindi. In English, translate blessings and salutations into English. In Hindi, use Devanagari only except identifiers and proper technical codes. "
                f"The current question language takes priority over UI settings, persona greetings, examples, and previous turns. Speak naturally and respectfully, like a warm Indian astrology scholar in a one-to-one consultation. Avoid theatrical chanting, repetitive blessings, and stiff scripted phrases. "
                f"Do not switch language.\n\n"
            )

            # Resolve seeker name to personalize the Pandit blessing
            seeker_fn, sal_hi_sample, sal_hgl_sample = _resolve_seeker_salutation(chart_context)
            name_instruction = (
                f"Address the seeker warmly as '{seeker_fn} जी' when appropriate."
                if seeker_fn
                else "Address the seeker respectfully. Avoid repetitive 'beta' or 'priye'. NEVER say 'User ji' or 'Guest ji'!"
            )
            has_history = bool(conversation_history and len(conversation_history) > 0)
            greeting_rule = (
                "Do NOT repeat introductory blessings or greetings on this turn because this is an ongoing conversation. Respond directly to the user's latest message."
                if has_history
                else f"Open with authentic traditional greeting/blessing only on the first turn: {sal_hi_sample}. {name_instruction}"
            )
            pandit_mandate = (
                "### MANDATORY CONSULTATION GUIDELINES & BEHAVIORAL RULES:\n"
                f"1. {greeting_rule}\n"
                "2. STRICT SHORT LENGTH (MAX 75-100 WORDS): Write 2 to 3 concise, readable paragraphs. No lengthy essays.\n"
                "3. ZERO BOLD TEXT: Do NOT use markdown bold tags (**text**) or asterisks anywhere in your response. Write natural, gentle text.\n"
                "4. STRICT SCOPE: You only discuss Vedic astrology, Kundli, palmistry, remedies and spiritual life guidance. Politely decline everything else (recipes, coding, trivia, news, homework) in one or two sentences, and decline again if the user insists or says 'you tell me' - never answer it later in the conversation. Then invite an astrology question.\n"
                "5. TOPIC SWITCHING: If the user says to stop discussing a previous topic or change the topic, immediately respect it and never bring up the past topic again.\n"
                "6. SAFETY & THREATS: If the user threatens someone or mentions violence or harming someone/themselves, remain calm, non-judgmental, and de-escalating. Ask briefly if anyone is in immediate physical danger. Encourage putting physical distance between themselves and any conflict or weapon, and recommend contacting emergency services (112) or a trusted person. Never present chanting mantras or drinking water as a sufficient response to violence. Do not diagnose the user.\n"
                "7. ONLY REQUEST BIRTH DETAILS WHEN NEEDED: When birth details are missing, request date/time/place ONLY if the question genuinely requires astronomical planetary calculation (like Moon sign, Kundli analysis, running Dasha). Do NOT demand birth details for general life advice or everyday questions.\n"
                "8. Never claim to have inspected a Kundli or calculated planetary positions unless verified chart data is present in context.\n\n"
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
        image_base64: Optional[str] = None,
        call_mode: bool = False
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams chat tokens via SSE generator for live word-by-word zero-wait typing experience.
        Yields chunk dictionaries:
        - {"type": "start", "astrologer_id": ...}
        - {"type": "delta", "text": "..."}
        - {"type": "done", "content": ..., "chart_svg": ...}
        """
        # Live calls answer in the language the caller's client chose (the astrologer's own language
        # unless the caller switched); chat mirrors the question.
        language = language if (call_mode and language) else _response_language(user_message, language)
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
            full_text = ""
            palm_is_demo = False
            async for event in LLMService.stream_palm_analysis(
                image_base64=image_base64,
                user_message=user_message,
                language=language,
                force_demo_mode=use_demo
            ):
                if event["type"] == "delta":
                    full_text += event["text"]
                    yield {"type": "delta", "text": event["text"]}
                else:
                    palm_is_demo = event.get("is_demo_mode", False)
            yield {
                "type": "done",
                "content": full_text.strip(),
                "is_demo_mode": palm_is_demo,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None,
                "astrologer_id": astrologer_id
            }
            return

        # Dynamic domain check
        in_domain, refusal = is_in_astrology_domain(user_message, language=language)
        if in_domain and conversation_history:
            from ai.backend.app.services.scope_guard import AstrologyScopeGuard
            _ok, _ref, _why = AstrologyScopeGuard.check_scope(user_message, conversation_history)
            if not _ok and _ref:
                in_domain, refusal = False, _ref
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

        # Sub-15ms Semantic Cache Fast-Path for streaming general astrology queries (turn 1 only)
        is_special_intent = any(k in user_message.lower() for k in ["maggi", "kill", "murder", "stop", "change topic", "chhoro", "psycho", "threat", "harm"])
        if not chart_data and not image_base64 and not conversation_history and not is_special_intent:
            from ai.backend.app.services.semantic_cache import semantic_cache
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

                detected_lang = language if call_mode else _response_language(user_message, language)
                lang_label = "Devanagari Hindi" if detected_lang == "hi" else "Conversational Hinglish (Roman script)" if detected_lang == "hinglish" else "English" if detected_lang == "en" else detected_lang
                language_mandate = (
                    f"### MANDATORY USER LANGUAGE REQUIREMENT: {detected_lang.upper()} ({lang_label})\n"
                    f"CRITICAL: The current question is in {detected_lang.upper()} ({lang_label}). "
                    f"You MUST reply in the language and script of the current question. The website menu language must never override the question language. Do not mix English and Hindi. In English, translate blessings and salutations into English. In Hindi, use Devanagari only except identifiers and proper technical codes. "
                    f"The current question language takes priority over UI settings, persona greetings, examples, and previous turns. Speak naturally and respectfully, like a warm Indian astrology scholar in a one-to-one consultation. Avoid theatrical chanting, repetitive blessings, and stiff scripted phrases. "
                    f"Do not switch language.\n\n"
                )

                # Resolve seeker name to personalize the Pandit blessing
                seeker_fn, sal_hi_sample, sal_hgl_sample = _resolve_seeker_salutation(chart_context)
                name_instruction = (
                    f"Address the seeker warmly as '{seeker_fn} जी' when appropriate."
                    if seeker_fn
                    else "Address the seeker respectfully. Avoid repetitive 'beta' or 'priye'. NEVER say 'User ji' or 'Guest ji'!"
                )
                has_history = bool(conversation_history and len(conversation_history) > 0)
                greeting_rule = (
                    "Do NOT repeat introductory blessings or greetings on this turn because this is an ongoing conversation. Respond directly to the user's latest message."
                    if has_history
                    else f"Open with authentic traditional greeting/blessing only on the first turn: {sal_hi_sample}. {name_instruction}"
                )
                pandit_mandate = (
                    "### MANDATORY CONSULTATION GUIDELINES & BEHAVIORAL RULES:\n"
                    f"1. {greeting_rule}\n"
                    "2. STRICT SHORT LENGTH (MAX 75-100 WORDS): Write 2 to 3 concise, readable paragraphs. No lengthy essays.\n"
                    "3. ZERO BOLD TEXT: Do NOT use markdown bold tags (**text**) or asterisks anywhere in your response. Write natural, gentle text.\n"
                    "4. STRICT SCOPE: You only discuss Vedic astrology, Kundli, palmistry, remedies and spiritual life guidance. Politely decline everything else (recipes, coding, trivia, news, homework) in one or two sentences, and decline again if the user insists or says 'you tell me' - never answer it later in the conversation. Then invite an astrology question.\n"
                    "5. TOPIC SWITCHING: If the user says to stop discussing a previous topic or change the topic, immediately respect it and never bring up the past topic again.\n"
                    "6. SAFETY & THREATS: If the user threatens someone or mentions violence or harming someone/themselves, remain calm, non-judgmental, and de-escalating. Ask briefly if anyone is in immediate physical danger. Encourage putting physical distance between themselves and any conflict or weapon, and recommend contacting emergency services (112) or a trusted person. Never present chanting mantras or drinking water as a sufficient response to violence. Do not diagnose the user.\n"
                    "7. ONLY REQUEST BIRTH DETAILS WHEN NEEDED: When birth details are missing, request date/time/place ONLY if the question genuinely requires astronomical planetary calculation (like Moon sign, Kundli analysis, running Dasha). Do NOT demand birth details for general life advice or everyday questions.\n"
                    "8. Never claim to have inspected a Kundli or calculated planetary positions unless verified chart data is present in context.\n\n"
                )
                persona_block = f"### ACTIVE ASTROLOGER PERSONA: {persona['name']} ({persona['title']})\n{persona['system_instruction']}\n\n"
                if call_mode:
                    pandit_mandate += (
                        "### LIVE PHONE CALL MODE:\n"
                        "You are speaking on a live phone call, not writing. Answer ONLY the caller's latest question. "
                        "Use 2 to 3 short spoken sentences (under 60 words), warm and natural like an Indian pandit talking, "
                        "with no lists, headings, markdown or emojis. Start answering at once, no preamble. "
                        "Never mention other astrologers or earlier calls with anyone else. Ask at most one short follow-up question.\n\n"
                    )
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

                if call_mode:
                    # A phone call needs the first words fast: a compact prompt (the full chat prompt is ~8k characters).
                    combined_system_instruction = (
                        f"You are {persona['name']} ({persona['title']}), a Vedic astrologer speaking with a seeker on a live phone call.\n"
                        f"{persona['system_instruction'][:500]}\n\n"
                        f"Reply ONLY in {lang_label}. Answer only the caller's latest question in 2 to 3 short spoken sentences "
                        f"(under 60 words), warm and natural like an Indian pandit talking; no lists, headings, markdown or emojis; "
                        f"start answering at once; ask at most one short follow-up question. "
                        f"{'Do not greet again; the call is already in progress. ' if has_history else ''}"
                        f"{name_instruction} "
                        "Discuss only Vedic astrology, Kundli, palmistry, remedies and spiritual guidance; politely decline anything else "
                        "and decline again if the caller insists. Never claim to have calculated or inspected a Kundli unless verified chart "
                        "data is given below. If verified chart data is not given below, re-read the whole conversation above before asking "
                        "for birth details: the caller may have already given date of birth, time of birth and place of birth across separate "
                        "turns (e.g. date in one answer, time and place in another). Combine everything already said and ask ONLY for whichever "
                        "piece (date, time, or place) is still genuinely missing - never repeat a request for something already given, and never "
                        "ask for the date again after the caller has stated it, even approximately.\n\n"
                        f"### CHART CONTEXT\n{chart_summary_block}\n\n"
                        f"### SOURCES\n{citations_str}\n"
                    )

                contents: List[types.Content] = []
                if conversation_history:
                    # Call mode needs more than one prior turn: birth details are often given piecemeal
                    # (date in one answer, time + place in the next) and the model must remember all of them.
                    for m in conversation_history[-(8 if call_mode else 4):]:
                        m_role = "user" if m.get("role") == "user" else "model"
                        m_text = m.get("content", "").strip()
                        if m_text:
                            compact_text = m_text[:280] + ("..." if len(m_text) > 280 else "")
                            contents.append(types.Content(role=m_role, parts=[types.Part.from_text(text=compact_text)]))

                if not contents or contents[-1].parts[0].text != user_message:
                    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=user_message)]))

                # Multi-model streaming fallback list
                # Chat and voice call share one path and model pair (raced, first token wins);
                # chat additionally keeps older models as a last-resort fallback.
                candidate_models = ["__hedged__"] if call_mode else ["__hedged__", "gemini-2.5-flash", "gemini-2.0-flash"]
                stream_success = False

                for model_name in candidate_models:
                    try:
                        gen_config = types.GenerateContentConfig(
                            system_instruction=combined_system_instruction,
                            temperature=0.75,
                            max_output_tokens=150 if call_mode else 260
                        )
                        if model_name == "__hedged__":
                            async for text in _hedged_stream(client, list(dict.fromkeys(["gemini-3.1-flash-lite", settings.GEMINI_MODEL])), contents, gen_config):
                                full_content += text
                                yield {"type": "delta", "text": text}
                        else:
                            response_stream = client.models.generate_content_stream(
                                model=model_name,
                                contents=contents,
                                config=gen_config
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
    def _palm_prompt(detected_lang: str) -> str:
        return (
            "You are an expert, compassionate Vedic Palmistry (Hastarekha / Samudrika Shastra) astrologer. "
            "Examine this user's uploaded palm photo carefully:\n"
            "1. Observe the palm shape (Earth, Air, Fire, Water), fingers, and skin texture.\n"
            "2. Identify and analyze the key lines visible: Life Line (Jeevan Rekha), Heart Line (Hriday Rekha), Head Line (Mastishk Rekha), Fate Line (Bhagya Rekha).\n"
            "3. Observe key mounts (Mount of Jupiter, Venus, Sun) and any prominent markings.\n"
            "4. Deliver an authentic, structured, encouraging reading focusing on career strengths, emotional relationships, and mental focus.\n"
            f"Language requirement: Respond in natural {detected_lang.upper()} (if Hinglish, speak natural, warm conversational Hinglish like an Indian palmist).\n"
            "Keep formatting clean without excessive bullet spam."
        )

    @staticmethod
    async def stream_palm_analysis(
        image_base64: str,
        user_message: str = "Analyze my palm lines (हस्तरेखा विश्लेषण)",
        language: str = "hinglish",
        force_demo_mode: bool = False
    ):
        """Streams the palm reading: {"type": "delta", "text"} chunks, then {"type": "meta", "is_demo_mode"}.

        The blocking Gemini call in analyze_palm_image froze the whole event loop (every other request waited) and
        nothing reached the user until the full reading was ready. This streams tokens as they arrive instead.
        """
        client = None if (force_demo_mode or settings.is_demo_mode) else _get_gemini_client()
        decoded = None
        try:
            if "," in image_base64:
                header, raw_b64 = image_base64.split(",", 1)
                mime_type = "image/png" if "png" in header else "image/jpeg"
            else:
                raw_b64, mime_type = image_base64, "image/jpeg"
            decoded = (base64.b64decode(raw_b64), mime_type)
        except Exception as e:  # noqa: BLE001 - falls through to the friendly "send a valid photo" reply
            logger.error(f"Failed to decode base64 palm image: {e}")

        streamed = False
        if client is not None and decoded is not None:
            try:
                from google.genai import types
                detected_lang = _response_language(user_message, language)
                contents = [types.Part.from_bytes(data=decoded[0], mime_type=decoded[1]), LLMService._palm_prompt(detected_lang)]
                config = types.GenerateContentConfig(
                    system_instruction=ASTROAI_SYSTEM_PROMPT_V2, temperature=0.4, max_output_tokens=700
                )
                models = list(dict.fromkeys(["gemini-3.1-flash-lite", settings.GEMINI_MODEL]))
                async for text in _hedged_stream(client, models, contents, config):
                    streamed = True
                    yield {"type": "delta", "text": text}
                yield {"type": "meta", "is_demo_mode": False}
                return
            except Exception as e:  # noqa: BLE001
                logger.error(f"Streaming palm analysis failed: {e}")
                if streamed:  # part of the reading already reached the user; end it rather than append a second one
                    yield {"type": "meta", "is_demo_mode": False}
                    return

        fallback = LLMService.analyze_palm_image(
            image_base64=image_base64, user_message=user_message, language=language, force_demo_mode=True
        )
        words = re.findall(r'\S+\s*', fallback["content"])
        for i in range(0, len(words), 2):
            yield {"type": "delta", "text": "".join(words[i:i + 2])}
            await asyncio.sleep(0.005)
        yield {"type": "meta", "is_demo_mode": True}

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

        detected_lang = _response_language(user_message, language)

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

            palm_prompt = LLMService._palm_prompt(detected_lang)

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

    @staticmethod
    async def extract_birth_details(conversation_text: str) -> Dict[str, Any]:
        """
        Reads a (possibly piecemeal, Hindi/Hinglish/English) conversation and pulls out the
        seeker's date of birth, time of birth and birth place - used by the live calling agent
        to build a real Kundli from what the caller has already said, instead of asking again.
        Approximate coordinates/timezone for the named place are included (best-effort; accurate
        for well-known cities, a reasonable guess otherwise).
        """
        empty = {
            "date_of_birth": None, "time_of_birth": None, "place": None, "country": None,
            "latitude": None, "longitude": None, "timezone_offset": None, "complete": False
        }
        client = _get_gemini_client()
        if not client or not settings.GEMINI_API_KEY:
            return empty
        try:
            from google.genai import types
            prompt = (
                "Extract the seeker's birth date, birth time and birth place from this spoken conversation. "
                "Details may be split across turns, in Hindi, Hinglish or English, numerals or words, "
                "12-hour or 24-hour time, exact or approximate day/month order (assume DD-MM for ambiguous "
                "Indian-style dates). Years are between 1930 and 2026.\n\n"
                f"Conversation:\n{conversation_text[:3000]}\n\n"
                "Respond with ONLY compact JSON, no other text:\n"
                '{"date_of_birth": "YYYY-MM-DD" or null, "time_of_birth": "HH:MM" (24h) or null, '
                '"place": "city name" or null, "country": "country name" or null, '
                '"latitude": number or null, "longitude": number or null, "timezone_offset": number or null}\n'
                "Give your best single latitude/longitude/timezone_offset estimate for the named place "
                "(India cities default to their own timezone offset, typically 5.5). "
                "Only fill date_of_birth once a specific day, month and year have all been stated. "
                "Only fill time_of_birth once an actual time has been stated."
            )
            response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-3.1-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(max_output_tokens=200, temperature=0.1)
            )
            raw = (response.text or "").strip()
            raw = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
            data = json.loads(raw)
        except Exception as e:
            logger.info(f"Birth detail extraction skipped: {e}")
            return empty

        result = {**empty, **{k: data.get(k) for k in empty if k in data}}
        result["complete"] = bool(
            result.get("date_of_birth") and result.get("latitude") is not None and result.get("longitude") is not None
        )
        return result
