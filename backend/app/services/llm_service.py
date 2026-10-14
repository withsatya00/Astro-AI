"""
LLM Service integrating Google GenAI SDK (Gemini 3.5 Flash Lite) with
conversational Indian astrology personality, strict chart provenance,
multi-turn memory, dynamic domain guardrails, and multimodal palmistry (Hastarekha) analysis.
"""
from typing import Dict, Any, List, Optional, Tuple
import re
import base64
from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.agents.prompts import ASTROAI_SYSTEM_PROMPT_V2
from backend.app.astrology.chart_context import ChartContext, validate_and_build_chart_context
from backend.app.astrology.chart_svg import generate_north_indian_kundli_svg

def _detect_language(text: str, fallback_lang: str = "en") -> str:
    """Detects whether user is speaking in Hinglish, Hindi, or English."""
    if not text:
        return fallback_lang

    # Hindi script (Devanagari range: \u0900-\u097F)
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"

    # Hinglish common words
    hinglish_markers = {
        "kya", "kaise", "kese", "hai", "hain", "btao", "batao", "mujhe", "mera", "meri",
        "mere", "apna", "apni", "karo", "karna", "baare", "bare", "mein", "me", "kuch",
        "nahi", "nhi", "rahega", "hoga", "shadi", "shaadi", "pyaar", "prem", "kundli",
        "kundali", "chahiye", "bolo", "bataiye", "namaste", "pranam", "dhanyawad",
        "thik", "theek", "accha", "acha", "samajh", "bhi", "toh", "to", "hatheli",
        "hath", "rekha", "parvat"
    }
    words = set(re.findall(r"\b[a-z]+\b", text.lower()))
    if words.intersection(hinglish_markers):
        return "hinglish"

    if fallback_lang in ("hi", "hinglish"):
        return fallback_lang

    return "en"


def _is_greeting(text: str) -> bool:
    """Checks if message is solely or primarily a friendly greeting."""
    clean = re.sub(r"[^\w\s]", "", text.strip().lower())
    greetings = {
        "hi", "hello", "hii", "hiii", "hey", "heya", "namaste", "namaskar",
        "pranam", "kaise ho", "kese ho", "hello ji", "hey there", "hola",
        "good morning", "good afternoon", "good evening"
    }
    return clean in greetings or any(clean.startswith(g) for g in ["hi ", "hello ", "hey ", "namaste "]) and len(clean.split()) <= 4


def is_in_astrology_domain(text: str) -> Tuple[bool, Optional[str]]:
    """
    Dynamically checks whether user message is within the realm of astrology, palmistry,
    kundli, horoscope, life advice, relationships, career direction, spiritual wellbeing,
    or simple conversational greetings.
    Blocks queries clearly outside the astrological consultation domain (coding, math, hacking, general trivia).
    """
    if not text or not text.strip():
        return True, None

    clean = text.strip().lower()

    if _is_greeting(clean):
        return True, None

    # Off-topic indicator patterns
    off_topic_patterns = [
        # Programming & Code
        r"\b(python|javascript|typescript|c\+\+|java|golang|rust|html|css|sql|react|vue|node\.?js|docker|git|bash|powershell|regex)\b",
        r"\b(write a script|write code|code snippet|function|algorithm|leetcode|pull request|npm install|pip install|compile|debug this)\b",
        r"\b(stack overflow|syntax error|runtime error|exception handling|database schema|fastapi endpoint)\b",
        # Academic Science & Math
        r"\b(derivative of|integral of|solve the equation|quadratic formula|calculate 2\+|pythagorean theorem|photosynthesis|mitochondria)\b",
        r"\b(newton's laws|thermodynamics|quantum mechanics|chemical formula|periodic table)\b",
        # Non-astrological politics & sports
        r"\b(who won the election|prime minister of|president of|parliament election|political party)\b",
        r"\b(ipl match score|cricket match score|fifa world cup winner|football score)\b",
        # Hacking & exploits
        r"\b(hack wifi|sql injection|bypass password|crack software|ddos attack)\b"
    ]

    for pat in off_topic_patterns:
        if re.search(pat, clean):
            # Check if there is an astrology qualifier
            astrology_qualifiers = {
                "astrology", "kundli", "horoscope", "jyotish", "nakshatra",
                "planet", "graha", "hastrekha", "palmistry", "palm", "hatheli",
                "rashifal", "dasha", "lagna", "career in astrology"
            }
            if any(q in clean for q in astrology_qualifiers):
                return True, None

            # Out of domain! Return dynamic polite refusal
            detected_lang = _detect_language(text)
            if detected_lang == "hi":
                refusal = "मैं केवल ज्योतिष (कुंडली), हस्तरेखा (Palmistry) और आध्यात्मिक जीवन मार्गदर्शन के लिए उपलब्ध हूँ 😊 मैं तकनीकी, कोडिंग या सामान्य ज्ञान के प्रश्नों का उत्तर नहीं दे सकता। कृपया अपनी कुंडली, करियर या जीवन से संबंधित प्रश्न पूछें!"
            elif detected_lang == "hinglish":
                refusal = "Main sirf Astrology (Kundli), Palmistry (Hastrekha) aur spiritual life guidance ke liye trained hoon 😊 Main coding, technical ya general world knowledge ke sawaalon ke jawab nahi de sakta. Kripya apne jeevan, love, career, kundli ya hastrekha se juda koi sawaal poochein!"
            else:
                refusal = "I am dedicated exclusively to Astrology, Kundli, Palmistry (Hastrekha), and spiritual life guidance 😊 I cannot answer technical, coding, or general trivia questions. Please feel free to ask about your horoscope, career path, relationships, or palm lines!"
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
    language: str = "en"
) -> str:
    """
    Generates a natural, conversational response in Demo Mode or when offline/testing.
    Adheres strictly to the warm Indian astrology consultant persona and chart honesty.
    """
    detected_lang = _detect_language(user_message, fallback_lang=language)
    msg_lower = user_message.lower().strip()

    # Dynamic domain check
    in_domain, refusal = is_in_astrology_domain(user_message)
    if not in_domain and refusal:
        return refusal

    # 1. Greeting handling (PART B)
    if _is_greeting(user_message):
        if detected_lang == "hi":
            return "नमस्ते! 😊 आप कैसे हैं? आज प्रेम, करियर या कुंडली के बारे में क्या जानना चाहते हैं?"
        elif detected_lang == "hinglish":
            return "Hey! 😊 Kaise ho? Love, career, ya kundli ke baare mein kuch poochna hai?"
        else:
            return "Hello! 😊 How are you today? What's on your mind—love, career, or your birth chart?"

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

    # 8. General fallback
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
        force_demo_mode: bool = False,
        image_base64: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Coordinates chat generation using Gemini API (gemini-3.5-flash-lite) or demo mode fallback.
        Ensures dynamic domain guardrails, multimodal palmistry analysis, strict chart grounding,
        and multi-turn memory.
        """
        use_demo = force_demo_mode or settings.is_demo_mode
        active_citations = citations or []

        # If palm image was provided, route to palmistry analyzer
        if image_base64:
            return LLMService.analyze_palm_image(
                image_base64=image_base64,
                user_message=user_message,
                language=language,
                force_demo_mode=use_demo
            )

        # Dynamic domain check: block off-topic queries immediately
        in_domain, refusal = is_in_astrology_domain(user_message)
        if not in_domain and refusal:
            return {
                "content": refusal,
                "is_demo_mode": False,
                "calculated_data_used": False,
                "citations": [],
                "chart_svg": None
            }

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
                language=language
            )
            return {
                "content": response_text,
                "is_demo_mode": True,
                "calculated_data_used": chart_context.is_verified,
                "citations": active_citations,
                "chart_svg": chart_svg
            }

        # Live Gemini generation with gemini-3.5-flash-lite
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            # Build grounded system context
            chart_summary_block = chart_context.format_for_prompt()

            citation_blocks = []
            if active_citations:
                for c in active_citations[:3]:
                    citation_blocks.append(f"[{c.get('source_title', 'Classical Text')} - P.{c.get('page_number', 1)}]: {c.get('excerpt', '')}")
            citations_str = "\n\n".join(citation_blocks) if citation_blocks else "None retrieved."

            combined_system_instruction = (
                f"{ASTROAI_SYSTEM_PROMPT_V2}\n\n"
                f"### CURRENT CONTEXT ENVIRONMENT\n"
                f"{chart_summary_block}\n\n"
                f"### RETRIEVED CLASSICAL ASTROLOGICAL & PALMISTRY SOURCES\n"
                f"{citations_str}\n"
            )

            # Build multi-turn contents
            contents: List[types.Content] = []
            if conversation_history:
                for m in conversation_history[-8:]:
                    m_role = "user" if m.get("role") == "user" else "model"
                    m_text = m.get("content", "").strip()
                    if m_text:
                        contents.append(
                            types.Content(
                                role=m_role,
                                parts=[types.Part.from_text(text=m_text)]
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
                    language=language
                )

            return {
                "content": response_content.strip(),
                "is_demo_mode": False,
                "calculated_data_used": chart_context.is_verified,
                "citations": active_citations,
                "chart_svg": chart_svg
            }

        except Exception as e:
            logger.error(f"Live Gemini API call failed: {e}. Executing conversational fallback.")
            response_text = generate_demo_response(
                user_message=user_message,
                chart_context=chart_context,
                citations=active_citations,
                conversation_history=conversation_history,
                language=language
            )
            return {
                "content": response_text,
                "is_demo_mode": True,
                "calculated_data_used": chart_context.is_verified,
                "citations": active_citations,
                "chart_svg": chart_svg
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
