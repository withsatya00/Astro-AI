"""
LLM Service integrating Google GenAI SDK (Gemini) with robust fallback Demo Mode.
Distinguishes between calculated data, retrieved classical citations, and traditional interpretations.
"""
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings
from backend.app.core.logging import logger

SYSTEM_INSTRUCTION = """
You are AstroAI Agent, an authentic, ethical, and knowledgeable Vedic and Western astrology assistant.
Follow these mandatory principles in every response:
1. TRUTH & GROUNDING: You must strictly distinguish between:
   - [Calculated Astronomical Data]: verified positions (degrees, signs, houses, nakshatras, dashas).
   - [Classical Retrieved Knowledge]: teachings directly cited from classical treatises.
   - [Traditional Interpretation]: philosophical and symbolic meanings.
   - [Uncertainties & Limitations]: clearly state when birth time is approximate or information is missing.
2. NO FABRICATION: Never invent planetary longitudes, dasha dates, nakshatras, or book citations.
3. MULTILINGUAL SUPPORT: Respond fluently in the user's requested language (English, Hindi, or Hinglish).
4. EMPOWERING TONE: Offer guidance that encourages self-awareness, mindfulness, and constructive action rather than fatalism.
"""

def generate_demo_response(
    user_message: str,
    chart_data: Optional[Dict[str, Any]],
    citations: List[Dict[str, Any]],
    language: str = "en"
) -> str:
    """
    Generates a deterministic response in Demo Mode when Gemini API key is not present.
    Incorporates actual calculated chart data and real retrieved citations.
    """
    is_hindi = language == "hi"
    is_hinglish = language == "hinglish"

    intro = "🌟 [DEMO MODE - Simulated AI Synthesis with Real Calculations & Retrieved Citations]"
    if is_hindi:
        intro = "🌟 [डेमो मोड - वास्तविक गणनाओं और संदर्भित ग्रंथों पर आधारित उत्तर]"

    body_parts = [intro]

    # Include chart facts if available
    if chart_data:
        asc = chart_data.get("ascendant_sign", "Unknown")
        sun = chart_data.get("sun_sign", "Unknown")
        moon = chart_data.get("moon_sign", "Unknown")
        nak = chart_data.get("moon_nakshatra", "Unknown")

        if is_hindi:
            chart_summary = (
                f"\n**सत्यापित जन्म-कुंडली गणनाएं (Swiss Ephemeris):**\n"
                f"- **लग्न (Ascendant):** {asc}\n"
                f"- **सूर्य राशि (Sun Sign):** {sun}\n"
                f"- **चंद्र राशि (Moon Sign):** {moon}\n"
                f"- **जन्म नक्षत्र (Moon Nakshatra):** {nak}\n"
            )
        elif is_hinglish:
            chart_summary = (
                f"\n**Verified Birth Chart Calculations (Swiss Ephemeris):**\n"
                f"- **Lagna (Ascendant):** {asc}\n"
                f"- **Surya Rashi (Sun Sign):** {sun}\n"
                f"- **Chandra Rashi (Moon Sign):** {moon} ({nak} Nakshatra)\n"
            )
        else:
            chart_summary = (
                f"\n**Verified Astronomical Birth Chart Data (Swiss Ephemeris):**\n"
                f"- **Ascendant (Lagna):** {asc}\n"
                f"- **Sun Sign:** {sun}\n"
                f"- **Moon Sign:** {moon}\n"
                f"- **Moon Nakshatra:** {nak}\n"
            )
        body_parts.append(chart_summary)

    # Include classical citations if available
    if citations:
        cite_header = "\n**प्राचीन ग्रंथों से उद्धरण (Retrieved Knowledge):**" if is_hindi else "\n**Classical References Retrieved from Knowledge Base:**"
        body_parts.append(cite_header)
        for c in citations[:2]:
            body_parts.append(f"> \"{c.get('excerpt', '')[:200]}...\"\n*— {c.get('source_title', 'Classical Text')}, Page {c.get('page_number', 1)}*")

    # Astrological synthesis
    if is_hindi:
        synthesis = (
            f"\n**पारंपरिक ज्योतिषीय विश्लेषण:**\n"
            f"आपके प्रश्न ('{user_message}') के संदर्भ में, ग्रहों की स्थिति यह संकेत देती है कि आपके व्यक्तित्व में "
            f"स्वाभाविक गहराई और विवेकशीलता है। वर्तमान समय में आत्म-चिंतन और धैर्यपूर्ण निर्णय लेना फलदायी रहेगा।"
        )
    elif is_hinglish:
        synthesis = (
            f"\n**Traditional Astrological Synthesis:**\n"
            f"Aapke question ('{user_message}') ke context mein, aapke planetary alignments clarity aur focus demand kar rahe hain. "
            f"Apne core strengths par dhyan dekar decisions lena beneficial hoga."
        )
    else:
        synthesis = (
            f"\n**Traditional Astrological Interpretation:**\n"
            f"Regarding your inquiry ('{user_message}'), your verified planetary positions and classical tenets "
            f"indicate a strong potential for purposeful growth when aligned with patience and mindful action."
        )
    body_parts.append(synthesis)

    note = (
        "\n*(नोट: लाइव AI मोड सक्षम करने के लिए `.env` फ़ाइल में GEMINI_API_KEY कॉन्फ़िगर करें।)*"
        if is_hindi
        else "\n*(Note: Configure `GEMINI_API_KEY` in `.env` to enable real-time generative responses.)*"
    )
    body_parts.append(note)

    return "\n".join(body_parts)

class LLMService:
    @staticmethod
    def generate_chat_response(
        user_message: str,
        conversation_history: List[Dict[str, str]],
        chart_data: Optional[Dict[str, Any]] = None,
        citations: Optional[List[Dict[str, Any]]] = None,
        language: str = "en",
        force_demo_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Coordinates chat generation using Gemini API or demo mode fallback.
        """
        use_demo = force_demo_mode or settings.is_demo_mode
        active_citations = citations or []

        if use_demo:
            response_text = generate_demo_response(
                user_message=user_message,
                chart_data=chart_data,
                citations=active_citations,
                language=language
            )
            return {
                "content": response_text,
                "is_demo_mode": True,
                "calculated_data_used": chart_data is not None,
                "citations": active_citations
            }

        # Live Gemini generation using google.genai
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            # Build grounded context
            context_blocks = []
            if chart_data:
                context_blocks.append(f"### VERIFIED CHART DATA:\n{chart_data}")
            if active_citations:
                cite_texts = "\n\n".join([
                    f"[{c['source_title']} - P.{c.get('page_number', 1)}]: {c['excerpt']}"
                    for c in active_citations
                ])
                context_blocks.append(f"### RETRIEVED CLASSICAL CITATIONS:\n{cite_texts}")

            grounded_context = "\n\n".join(context_blocks)
            lang_prompt = f"Respond in {language.upper()}."

            full_prompt = (
                f"{grounded_context}\n\n"
                f"{lang_prompt}\n\n"
                f"User Question: {user_message}"
            )

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=full_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.3
                )
            )

            return {
                "content": response.text,
                "is_demo_mode": False,
                "calculated_data_used": chart_data is not None,
                "citations": active_citations
            }

        except Exception as e:
            logger.error(f"Live Gemini API call failed: {e}. Falling back to demo mode response.")
            response_text = generate_demo_response(
                user_message=user_message,
                chart_data=chart_data,
                citations=active_citations,
                language=language
            )
            return {
                "content": response_text + f"\n\n*(Provider notice: live fallback activated due to {type(e).__name__})*",
                "is_demo_mode": True,
                "calculated_data_used": chart_data is not None,
                "citations": active_citations
            }
