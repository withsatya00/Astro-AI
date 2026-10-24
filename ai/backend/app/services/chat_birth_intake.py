"""Persist conversational birth intake and resume the seeker's unanswered question.

Only user-authored messages from the owned conversation supply birth details. No
planetary positions, noon birth times, or fallback Delhi coordinates are invented.
"""
import re
import unicodedata
from datetime import datetime
from typing import Optional

from packages.core.schemas import BirthChartRequest
from packages.database.models import BirthChart, ChatMessage
from packages.core.logging import logger


TOPICS = {
    "career": r"\b(?:career|carrier|job|business|promotion|naukri|naukari|karier|karobar|vyapar|kaam|profession|work|rozgar)\b|करियर|कैरियर|नौकरी|व्यापार|पदोन्नति|रोजगार",
    "marriage": r"\b(?:marriage|marry|shaadi|shadi|vivah|spouse|relationship)\b|शादी|विवाह|जीवनसाथी",
    "wealth": r"\b(?:money|wealth|finance|paisa|dhan|income)\b|पैसा|धन|आय",
    "abroad": r"\b(?:abroad|foreign|videsh)\b|विदेश",
    "health": r"\b(?:health|swasthya|sehat)\b|स्वास्थ्य|सेहत",
    "chart": r"\b(?:kundli|kundali|horoscope|birth chart|lagna|dasha|rajayoga|rajyoga)\b|कुंडली|कुण्डली|दशा|राजयोग",
    "life": r"\b(?:future|bhavishya|fortune|bhagya|gemstone)\b|भविष्य|भाग्य|रत्न",
}
MONTHS = {
    "january": 1, "jan": 1, "जनवरी": 1, "february": 2, "feb": 2, "फरवरी": 2,
    "march": 3, "mar": 3, "मार्च": 3, "april": 4, "apr": 4, "अप्रैल": 4,
    "may": 5, "मई": 5, "june": 6, "jun": 6, "जून": 6, "july": 7, "jul": 7, "जुलाई": 7,
    "august": 8, "aug": 8, "अगस्त": 8, "september": 9, "sep": 9, "sept": 9, "सितंबर": 9, "सितम्बर": 9,
    "october": 10, "oct": 10, "अक्टूबर": 10, "november": 11, "nov": 11, "नवंबर": 11, "नवम्बर": 11,
    "december": 12, "dec": 12, "दिसंबर": 12, "दिसम्बर": 12,
}
# City centres, as in the existing birth-form/Panchang city shortcuts. Unknown or
# ambiguous localities require coordinates, rather than silently using a default.
CITIES = [
    ("New Delhi", 28.6139, 77.2090, r"new delhi|delhi|नई दिल्ली|दिल्ली"),
    ("Mumbai", 19.0760, 72.8777, r"mumbai|bombay|मुंबई"),
    ("Kolkata", 22.5726, 88.3639, r"kolkata|calcutta|कोलकाता"),
    ("Chennai", 13.0827, 80.2707, r"chennai|madras|चेन्नई"),
    ("Bengaluru", 12.9716, 77.5946, r"bengaluru|bangalore|बेंगलुरु|बैंगलोर"),
    ("Hyderabad", 17.3850, 78.4867, r"hyderabad|हैदराबाद"),
    ("Pune", 18.5204, 73.8567, r"pune|पुणे"),
    ("Lucknow", 26.8467, 80.9462, r"lucknow|लखनऊ"),
    ("Gorakhpur", 26.7606, 83.3732, r"gorakhpur|गोरखपुर"),
    ("Varanasi", 25.3176, 82.9739, r"varanasi|banaras|benares|वाराणसी|बनारस"),
    ("Prayagraj", 25.4358, 81.8463, r"prayagraj|allahabad|प्रयागराज|इलाहाबाद"),
    ("Jaipur", 26.9124, 75.7873, r"jaipur|जयपुर"),
    ("Patna", 25.5941, 85.1376, r"patna|पटना"),
    ("Bhopal", 23.2599, 77.4126, r"bhopal|भोपाल"),
    ("Indore", 22.7196, 75.8577, r"indore|इंदौर"),
    ("Ahmedabad", 23.0225, 72.5714, r"ahmedabad|अहमदाबाद"),
    ("Surat", 21.1702, 72.8311, r"surat|सूरत"),
    ("Chandigarh", 30.7333, 76.7794, r"chandigarh|चंडीगढ़"),
    ("Kanpur", 26.4499, 80.3319, r"kanpur|कानपुर"),
    ("Agra", 27.1767, 78.0081, r"agra|आगरा"),
    ("Ayodhya", 26.7922, 82.1998, r"ayodhya|अयोध्या"),
    ("Ujjain", 23.1765, 75.7885, r"ujjain|उज्जैन"),
    ("Haridwar", 29.9457, 78.1642, r"haridwar|हरिद्वार"),
    ("Dehradun", 30.3165, 78.0322, r"dehradun|देहरादून"),
    ("Ranchi", 23.3441, 85.3096, r"ranchi|रांची"),
    ("Tirupati", 13.6288, 79.4192, r"tirupati|तिरुपति"),
]


def _normalise(text):
    return "".join(str(unicodedata.digit(c)) if c.isdecimal() else c for c in text).lower()


def _topic_question(text, contains_details=False):
    topic = any(re.search(pattern, text, re.I) for pattern in TOPICS.values())
    if not topic or not contains_details:
        return topic
    # "Birth chart details: ..." supplies context; it does not replace a pending
    # career question. An explicit question in the same message still takes priority.
    return bool(re.search(r"\?|\b(?:when|how|will|should|can|tell|explain|analy[sz]e|kab|kaisa|kaisi|kaise|batao|bataye|bataiye)\b|बताएं|बताओ|कब|कैसा", text, re.I))


def parse_birth_fields(text: str, previous=None):
    """Parse explicit date, time and locality; retain partial values across turns."""
    fields = dict(previous or {})
    text = _normalise(text)
    changed = False
    date_span = None
    date_match = re.search(r"\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b", text)
    parts = None
    if date_match:
        parts = tuple(map(int, date_match.groups()))
    else:
        date_match = re.search(r"\b(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{4})\b", text)
        if date_match:
            day, month, year = map(int, date_match.groups())
            parts = year, month, day
        else:
            months = "|".join(MONTHS)
            date_match = re.search(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+({months})[ ,]+(\d{{4}})\b", text)
            if date_match:
                parts = int(date_match[3]), MONTHS[date_match[2]], int(date_match[1])
            else:
                date_match = re.search(rf"\b({months})\s+(\d{{1,2}})(?:st|nd|rd|th)?[ ,]+(\d{{4}})\b", text)
                if date_match:
                    parts = int(date_match[3]), MONTHS[date_match[1]], int(date_match[2])
    if parts:
        date_span = date_match.span()
        try:
            dob = datetime(*parts).date()
            if 1800 <= dob.year <= datetime.now().year and dob <= datetime.now().date():
                fields["date_of_birth"] = dob.isoformat()
                changed = True
        except ValueError:
            pass
    without_date = text if not date_span else text[:date_span[0]] + " " + text[date_span[1]:]
    clock = re.search(r"(?<!\d)(\d{1,2})[:.](\d{2})(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?(?!\d)", without_date)
    if not clock:
        clock = re.search(r"(?<!\d)(\d{1,2})\s*(a\.?m\.?|p\.?m\.?|baje|बजे)(?![a-z])", without_date)
        hour = int(clock[1]) if clock else None
        minute = 0
        suffix = clock[2] if clock else ""
    else:
        hour, minute, suffix = int(clock[1]), int(clock[2]), clock[3] or ""
    if clock and hour <= 23 and minute <= 59:
        am = bool(re.search(r"\b(?:am|a\.m\.?|subah|morning)\b|सुबह|प्रातः", suffix + " " + without_date))
        pm = bool(re.search(r"\b(?:pm|p\.m\.?|shaam|sham|evening|afternoon|dopahar|raat|night)\b|शाम|दोपहर|रात", suffix + " " + without_date))
        if am or pm:
            if 1 <= hour <= 12:
                hour = hour % 12 + (12 if pm else 0)
            else:
                hour = None
        elif hour < 13 and hour != 0:
            # "8:30" alone must not silently become AM.
            fields["ambiguous_time"] = f"{hour:02d}:{minute:02d}"
            hour = None
        if hour is not None:
            fields["time_of_birth"] = f"{hour:02d}:{minute:02d}"
            fields.pop("ambiguous_time", None)
            changed = True
    elif fields.get("ambiguous_time") and re.fullmatch(r"\s*(am|pm|subah|shaam|sham|सुबह|शाम)\s*[.!]?", text):
        hour, minute = map(int, fields["ambiguous_time"].split(":"))
        hour = hour % 12 + (12 if text.strip(" .!") in {"pm", "shaam", "sham", "शाम"} else 0)
        fields["time_of_birth"] = f"{hour:02d}:{minute:02d}"
        fields.pop("ambiguous_time", None)
        changed = True
    hits = [(name, lat, lon) for name, lat, lon, aliases in CITIES
            if re.search(rf"(?<!\w)(?:{aliases})(?!\w)", text)]
    if len(hits) == 1:
        name, lat, lon = hits[0]
        fields.update(place=name, latitude=lat, longitude=lon, timezone_offset=5.5, country="India")
        fields.pop("place_unresolved", None)
        changed = True
    elif not hits:
        place = re.search(r"(?:\b(?:birth\s*place|place|city)\s*[:=]?|janm\s*(?:sthan|sthal)|जन्म\s*स्थान)\s*([^;\n\d]{2,90})", text)
        if place:
            fields["place_unresolved"] = place[1].strip(" ,.")
            changed = True
        elif re.search(r"maharajganj|महाराजगंज", text):
            fields["place_unresolved"] = "Maharajganj"
            changed = True
        elif (fields.get("date_of_birth") and fields.get("time_of_birth")
              and not fields.get("place") and not fields.get("place_unresolved")
              and re.fullmatch(r"[^\d:;?!\n]{2,65}", text)
              and len(text.split()) <= 5
              and not any(re.search(pattern, text, re.I) for pattern in TOPICS.values())):
            fields["place_unresolved"] = text.strip(" ,.")
            changed = True
        locality = fields.get("place_unresolved", "") + " " + text
        if re.search(r"maharajganj|महाराजगंज", locality, re.I) and re.search(r"\b(?:up|uttar pradesh)\b|उत्तर प्रदेश", locality, re.I):
            fields.update(place="Maharajganj, Uttar Pradesh", latitude=27.14, longitude=83.56,
                          timezone_offset=5.5, country="India")
            fields.pop("place_unresolved", None)
            changed = True
    # Explicit coordinates support localities outside the shortcut list.
    for field, pattern in {
        "latitude": r"\b(?:latitude|lat)\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "longitude": r"\b(?:longitude|lon|lng)\s*[:=]?\s*(-?\d+(?:\.\d+)?)",
        "timezone_offset": r"\b(?:timezone_offset|utc|gmt|tz)\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)",
    }.items():
        match = re.search(pattern, text)
        if match:
            fields[field] = float(match[1])
            changed = True
    name = re.search(r"(?:\bname\s*[:=]|mera naam|मेरा नाम)\s*([^,;\n\d]{1,70})", text)
    if name:
        fields["name"] = re.split(r"\s+(?:hai|dob|birth)\b", name[1])[0].strip()
    return fields, changed


def _missing_reply(fields, message, language):
    missing = []
    if not fields.get("date_of_birth"):
        missing.append(("birth date", "janm tareekh", "जन्म तिथि"))
    if not fields.get("time_of_birth"):
        missing.append(("AM/PM for the birth time" if fields.get("ambiguous_time") else "birth time with AM/PM",
                        "janm samay ka AM/PM" if fields.get("ambiguous_time") else "janm samay (AM/PM ke saath)",
                        "जन्म समय सुबह या शाम" if fields.get("ambiguous_time") else "जन्म समय (सुबह/शाम सहित)"))
    if any(fields.get(k) is None for k in ("latitude", "longitude", "timezone_offset")):
        if fields.get("place_unresolved", "").lower() == "maharajganj":
            missing.append(("the state/country for Maharajganj", "Maharajganj ka rajya/desh", "महाराजगंज का राज्य/देश"))
        elif fields.get("place_unresolved"):
            missing.append(("latitude, longitude and UTC offset to locate the birthplace you already shared precisely (you can also select a nearby listed city in Birth Details)",
                            "diye hue janm sthan ke latitude, longitude aur UTC offset (ya Birth Details mein nazdeeki listed shehar chunein)",
                            "दिए हुए जन्म स्थान के अक्षांश, देशांतर और UTC अंतर (या जन्म विवरण में पास का सूचीबद्ध शहर चुनें)"))
        else:
            missing.append(("birth city and state (or latitude, longitude and UTC offset)",
                        "janm ka shehar aur rajya (ya latitude, longitude aur UTC offset)",
                        "जन्म का शहर और राज्य (या अक्षांश, देशांतर और UTC अंतर)"))
    from ai.backend.app.services.llm_service import _response_language
    lang = _response_language(message, language)
    if lang == "hi":
        return "आपकी दी हुई जानकारी सुरक्षित है। कुंडली बनाने के लिए अब केवल " + ", ".join(m[2] for m in missing) + " बताएं। उसके बाद आपके इसी प्रश्न का उत्तर दूंगा।"
    if lang == "hinglish":
        return "Aapki di hui details save hain. Kundli banane ke liye ab sirf " + ", ".join(m[1] for m in missing) + " batayein. Phir aapke isi sawaal ka jawab dunga."
    return "I have kept the details you shared. To calculate your chart, I still need only " + ", ".join(m[0] for m in missing) + ". Then I will answer your original question."


def reply_result(content):
    return {"content": content, "citations": [], "calculated_data_used": False,
            "is_demo_mode": False, "chart_svg": None, "tool_trace": []}


def prepare_birth_turn(db, conversation, owner, user_message, language="en", user_name=None, image_base64=None):
    """Returns (question to answer, optional clarification); persists the linked chart."""
    original = user_message.content
    if image_base64:
        return original, None
    if re.search(r"\b(?:what is|what are|meaning of|define)\b|kya hota hai|क्या होता है", original, re.I) and not re.search(r"\b(?:my|mera|meri|mere)\b|मेरी|मेरा|मेरे", original, re.I):
        return original, None
    from ai.backend.app.services.scope_guard import AstrologyScopeGuard
    if not AstrologyScopeGuard.check_scope(original)[0]:
        return original, None
    column = ChatMessage.consultation_id if hasattr(conversation, "consultation_metadata") else ChatMessage.session_id
    prior = (db.query(ChatMessage).filter(column == conversation.id, ChatMessage.id != user_message.id,
                                         ChatMessage.role == "user")
             .order_by(ChatMessage.created_at.desc()).limit(30).all())
    state = next(((m.msg_metadata or {}).get("birth_intake") for m in prior
                  if (m.msg_metadata or {}).get("birth_intake")), None)
    fields = dict((state or {}).get("fields", {}))
    pending = (state or {}).get("pending_question")
    if not state:
        for earlier in reversed(prior):
            fields, earlier_details = parse_birth_fields(earlier.content, fields)
            if _topic_question(earlier.content, earlier_details):
                pending = earlier.content
    fields, supplied = parse_birth_fields(original, fields)
    topic = _topic_question(original, supplied)
    if topic:
        pending = original
    question = pending if supplied and not topic and pending else original
    existing = db.query(BirthChart).filter(BirthChart.id == conversation.chart_id, BirthChart.owner_key == owner.key).first() if conversation.chart_id else None
    result = None
    if not existing and (pending or supplied or fields.get("ambiguous_time")):
        complete = fields.get("date_of_birth") and fields.get("time_of_birth") and all(
            fields.get(k) is not None for k in ("latitude", "longitude", "timezone_offset"))
        if complete:
            from website.backend.app.services.astrology_service import AstrologyService
            try:
                chart = AstrologyService.calculate_and_save_chart(db, BirthChartRequest(
                    name=user_name or fields.get("name") or "Seeker",
                    date_of_birth=fields["date_of_birth"], time_of_birth=fields["time_of_birth"],
                    latitude=fields["latitude"], longitude=fields["longitude"], timezone_offset=fields["timezone_offset"],
                    city=fields.get("place") or fields.get("place_unresolved"), country=fields.get("country"),
                ), user_id=owner.user_id, owner_key=owner.key)
                conversation.chart_id = chart["id"]
                pending = None
                if question == original and supplied and not topic:
                    from ai.backend.app.services.llm_service import _response_language
                    question = {"hi": "मेरी गणना की गई जन्म कुंडली समझाएं।",
                                "hinglish": "Meri calculated janm kundli samjhaiye."}.get(
                                    _response_language(original, language), "Explain my calculated birth chart.")
            except ValueError:
                result = reply_result("Your birth details are saved, but the date, time or location could not be validated. Please check these values.")
            except Exception:
                db.rollback()
                logger.exception("Could not calculate chart during conversational birth intake")
                result = reply_result("Your birth details are saved. Chart calculation is temporarily unavailable; please try your question again shortly.")
        else:
            result = reply_result(_missing_reply(fields, question, language))
    elif existing:
        pending = None
    user_message.msg_metadata = {**(user_message.msg_metadata or {}), "birth_intake": {
        "fields": fields, "pending_question": pending,
    }}
    db.commit()
    return re.sub(r"\bcarrier\b", "career", question, flags=re.I), result


async def stream_birth_turn(intake_result: Optional[dict], **kwargs):
    if intake_result:
        yield {"type": "delta", "text": intake_result["content"]}
        yield {"type": "done", **intake_result}
        return
    from ai.backend.app.services.llm_service import LLMService
    async for chunk in LLMService.stream_chat_response(**kwargs):
        yield chunk
