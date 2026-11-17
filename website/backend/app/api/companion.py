"""
Daily Vedic Companion (WhatsApp & Telegram Proactive Brahmamuhurta Digest Engine)
Delivers daily personalized Shubh Muhurta, Gochar guidance, Ishta Sadhana mantra,
and zero fear-mongering karmic guidance directly to devotees.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta

from packages.database.session import get_db
from packages.database.models import VedicCompanionSubscription, User, utc_now
from website.backend.app.api.auth import get_current_user_optional
from packages.core.identity import Owner, optional_owner
from packages.astrology.panchang import calculate_panchang
from packages.astrology.horoscope import get_horoscope, RASHI_METADATA

router = APIRouter(prefix="/companion", tags=["Daily Vedic Companion"])

# ----------------- Schemas -----------------
class CompanionPreferencesRequest(BaseModel):
    channel: str = Field("whatsapp", description="whatsapp, telegram, push")
    phone_or_handle: str = Field(..., description="Mobile number with country code e.g. +919876543210 or @telegram_handle")
    delivery_time: str = Field("05:30", description="05:30 (Brahmamuhurta) or 07:00 (Morning)")
    language: str = Field("hi", description="hi, en")
    rashi: str = Field("Singh (Leo)", description="Devotee Moon sign / Rashi")
    nakshatra: Optional[str] = None
    is_active: bool = True

class DigestPreviewRequest(BaseModel):
    rashi: Optional[str] = "Singh (Leo)"
    nakshatra: Optional[str] = None
    language: Optional[str] = "hi"

class WebhookMessageRequest(BaseModel):
    sender: str
    message: str
    channel: Optional[str] = "whatsapp"

# ----------------- Ishta Sadhana Knowledge Map -----------------
RASHI_SADHANA_MAP = {
    "Aries": {
        "hi_name": "मेष", "deity": "हनुमान जी एवं भगवान कार्तिकेय",
        "mantra": "ॐ हं हनुमते नमः", "count": "१०८ जप",
        "guideline": "मंगल ऊर्जा को रचनात्मक कर्म में लगाएं। लाल पुष्प अथवा चंदन अर्पित करें।"
    },
    "Taurus": {
        "hi_name": "वृषभ", "deity": "माँ महालक्ष्मी",
        "mantra": "ॐ श्रीं ह्रीं क्लीं महालक्ष्म्यै नमः", "count": "१०८ जप",
        "guideline": "सत्य और मधुर वाणी का पालन करें। श्वेत मिष्ठान्न अथवा गौ सेवा उत्तम है।"
    },
    "Gemini": {
        "hi_name": "मिथुन", "deity": "भगवान श्री गणेश",
        "mantra": "ॐ गं गणपतये नमः", "count": "१०८ जप",
        "guideline": "दूर्वा अर्पित करें और बौद्धिक निर्णयों में धैर्य रखें।"
    },
    "Cancer": {
        "hi_name": "कर्क", "deity": "भगवान शिव (चंद्रमौलेश्वर)",
        "mantra": "ॐ नमः शिवाय", "count": "१०८ जप",
        "guideline": "शिवलिंग पर जल या कच्चा दूध अर्पित करें। मन में शांति एवं करुणा का भाव रखें।"
    },
    "Leo": {
        "hi_name": "सिंह", "deity": "भगवान सूर्य नारायण",
        "mantra": "ॐ घृणि सूर्याय नमः", "count": "१०८ जप",
        "guideline": "प्रातः सूर्य को तांबे के लोटे से जल दें। अहंकार से दूर रहकर सेवा भाव रखें।"
    },
    "Virgo": {
        "hi_name": "कन्या", "deity": "माँ जगदम्बा (दुर्गा जी)",
        "mantra": "ॐ दुं दुर्गायै नमः", "count": "१०८ जप",
        "guideline": "हरे वस्त्र अथवा तुलसी सेवा करें। दूसरों के दोष देखने के बजाय गुण ग्रहण करें।"
    },
    "Libra": {
        "hi_name": "तुला", "deity": "भगवान लक्ष्मीनारायण",
        "mantra": "ॐ नमो नारायणाय", "count": "१०८ जप",
        "guideline": "न्यायपूर्ण और संतुलित आचरण रखें। किसी जरूरतमंद की सहायता करें।"
    },
    "Scorpio": {
        "hi_name": "वृश्चिक", "deity": "संकटमोचन हनुमान जी",
        "mantra": "ॐ क्रां क्रीं क्रौं सः भौमाय नमः", "count": "१०८ जप",
        "guideline": "हनुमान चालीसा का पाठ करें और क्रोध से सर्वथा दूर रहें।"
    },
    "Sagittarius": {
        "hi_name": "धनु", "deity": "भगवान दत्तात्रेय एवं गुरुदेव",
        "mantra": "ॐ बृं बृहस्पतये नमः", "count": "१०८ जप",
        "guideline": "पीले पुष्प अर्पित करें। स्वाध्याय (गीता पाठ) अवश्य करें।"
    },
    "Capricorn": {
        "hi_name": "मकर", "deity": "भगवान शिव एवं कर्मफलदाता शनि",
        "mantra": "ॐ शं शनैश्चराय नमः", "count": "१०८ जप",
        "guideline": "परिश्रमी व्यक्तियों और श्रमिकों का सम्मान करें। तिल या तेल का दीपक प्रज्वलित करें।"
    },
    "Aquarius": {
        "hi_name": "कुम्भ", "deity": "महामृत्युंजय शिव जी",
        "mantra": "ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्", "count": "१०८ जप",
        "guideline": "पक्षियों को दाना-पानी दें। समाज सेवा में निष्काम योगदान दें।"
    },
    "Pisces": {
        "hi_name": "मीन", "deity": "परमेश्वर श्री विष्णु",
        "mantra": "ॐ नमो भगवते वासुदेवाय", "count": "१०८ जप",
        "guideline": "विष्णु सहस्रनाम या नारायण कवच का स्मरण करें। जल स्रोतों की स्वच्छता रखें।"
    }
}

def normalize_rashi_name(raw_name: Optional[str]) -> str:
    if not raw_name:
        return "Leo"
    raw = raw_name.lower()
    for eng_sign in RASHI_METADATA.keys():
        if eng_sign.lower() in raw:
            return eng_sign
    # Check sanskrit/hindi keywords
    hindi_map = {
        "मेष": "Aries", "mesh": "Aries",
        "वृषभ": "Taurus", "vrishabh": "Taurus",
        "मिथुन": "Gemini", "mithun": "Gemini",
        "कर्क": "Cancer", "kark": "Cancer",
        "सिंह": "Leo", "simha": "Leo", "singh": "Leo",
        "कन्या": "Virgo", "kanya": "Virgo",
        "तुला": "Libra", "tula": "Libra",
        "वृश्चिक": "Scorpio", "vrishchik": "Scorpio",
        "धनु": "Sagittarius", "dhanu": "Sagittarius",
        "मकर": "Capricorn", "makar": "Capricorn",
        "कुम्भ": "Aquarius", "kumbh": "Aquarius",
        "मीन": "Pisces", "meen": "Pisces"
    }
    for k, v in hindi_map.items():
        if k in raw:
            return v
    return "Leo"

def generate_brahmamuhurta_digest(rashi_raw: Optional[str], nakshatra_raw: Optional[str], lang: str = "hi") -> Dict[str, Any]:
    norm_rashi = normalize_rashi_name(rashi_raw)
    panchang = calculate_panchang()
    horoscope = get_horoscope(sign=norm_rashi, timeframe="daily")
    sadhana = RASHI_SADHANA_MAP.get(norm_rashi, RASHI_SADHANA_MAP["Leo"])

    # Extract Panchang elements
    tithi_name = panchang.get("tithi", {}).get("name", "शुक्ल पक्ष द्वितीया")
    paksha = panchang.get("tithi", {}).get("paksha", "शुक्ल पक्ष")
    nakshatra = panchang.get("nakshatra", {}).get("name", "रोहिणी")
    yoga = panchang.get("yog", {}).get("name", "शुभ")

    timings = panchang.get("timings", {})
    sunrise = timings.get("sunrise", "06:18 AM")
    sunset = timings.get("sunset", "05:42 PM")

    # Muhurta
    abhijit_obj = timings.get("abhijit_muhurat", {})
    abhijit = f"{abhijit_obj.get('start', '11:45 AM')} - {abhijit_obj.get('end', '12:35 PM')}"
    brahmamuhurta_time = "04:45 AM - 05:33 AM"

    rahu_obj = timings.get("rahu_kaal", {})
    rahu_kaal = f"{rahu_obj.get('start', '04:30 PM')} - {rahu_obj.get('end', '06:00 PM')}"

    # Rashi horoscope specifics
    career = horoscope.get("career", "आज कर्मक्षेत्र में नई ऊर्जा का संचार होगा।")
    lucky_num = horoscope.get("lucky_num", 1)
    lucky_color = horoscope.get("lucky_color", "पीला एवं स्वर्णिम")

    is_hi = lang == "hi"

    # WhatsApp Markdown text format
    if is_hi:
        wa_text = (
            f"🕉️ *शुभ प्रभात! दैनिक वैदिक ब्रह्ममुहूर्त साथी*\n"
            f"_{norm_rashi} ({sadhana['hi_name']}) राशि दैनिक अमृत सन्देश_\n"
            f"──────────────────────\n"
            f"📅 *पंचांग:* {tithi_name}\n"
            f"⭐ *नक्षत्र:* {nakshatra} · *योग:* {yoga}\n"
            f"🌅 *सूर्योदय:* {sunrise} · *सूर्यास्त:* {sunset}\n\n"
            f"⚡ *दिव्य मुहूर्त (Shubh Muhurta):*\n"
            f"• *ब्रह्ममुहूर्त ध्यान काल:* {brahmamuhurta_time}\n"
            f"• *अभिजीत मुहूर्त:* {abhijit} *(सर्वकार्य सिद्धि काल)*\n"
            f"• *राहुकाल ध्यान अवधि:* {rahu_kaal} _(इस समय आंतरिक जप व ध्यान करें)_\n\n"
            f"📿 *आज का इष्ट साधना जप ({sadhana['hi_name']}):*\n"
            f"• *इष्ट देव:* {sadhana['deity']}\n"
            f"• *पवित्र मंत्र:* `{sadhana['mantra']}`\n"
            f"• *जप संख्या:* {sadhana['count']}\n"
            f"• *सात्विक कर्म:* {sadhana['guideline']}\n\n"
            f"🌟 *ग्रह गोचर मार्गदर्शन:*\n"
            f"• {career[:140]}…\n"
            f"• *शुभ रंग:* {lucky_color} · *शुभ अंक:* {lucky_num}\n"
            f"──────────────────────\n"
            f"▶ *नाम जप शुरू करें:* https://astrojyotish.in/bhakti/naam-jaap\n"
            f"▶ *आज की आरती:* https://astrojyotish.in/bhakti/aarti-chalisa\n"
            f"▶ *मंदिर संकल्प:* https://astrojyotish.in/mandir-seva\n\n"
            f"_Astro Jyotish द्वारा निःशुल्क प्रेषित। उत्तर में 'पंचांग' या 'आरती' लिखकर तुरंत जानकारी पाएं।_"
        )
    else:
        wa_text = (
            f"🕉️ *Good Morning! Daily Vedic Brahmamuhurta Companion*\n"
            f"_{norm_rashi} Daily Shastric Transit & Sadhana Digest_\n"
            f"──────────────────────\n"
            f"📅 *Panchang:* {tithi_name}\n"
            f"⭐ *Nakshatra:* {nakshatra} · *Yoga:* {yoga}\n"
            f"🌅 *Sunrise:* {sunrise} · *Sunset:* {sunset}\n\n"
            f"⚡ *Auspicious Timings (Shubh Muhurta):*\n"
            f"• *Brahmamuhurta:* {brahmamuhurta_time}\n"
            f"• *Abhijit Muhurta:* {abhijit} *(Success for all noble deeds)*\n"
            f"• *Rahu Kaal Window:* {rahu_kaal} _(Ideal for quiet inward contemplation)_\n\n"
            f"📿 *Today's Ishta Sadhana Mantra:*\n"
            f"• *Presiding Deity:* {sadhana['deity']}\n"
            f"• *Sacred Mantra:* `{sadhana['mantra']}`\n"
            f"• *Recommended Count:* 108 Repetitions\n"
            f"• *Spiritual Guideline:* {sadhana['guideline']}\n\n"
            f"🌟 *Cosmic Transit Guidance:*\n"
            f"• {career[:140]}…\n"
            f"• *Favorable Color:* {lucky_color} · *Lucky Number:* {lucky_num}\n"
            f"──────────────────────\n"
            f"▶ *Start Naam Jaap:* https://astrojyotish.in/bhakti/naam-jaap\n"
            f"▶ *Temple Sankalp:* https://astrojyotish.in/mandir-seva\n\n"
            f"_Sent with reverence by Astro Jyotish._"
        )

    return {
        "rashi": norm_rashi,
        "rashi_hindi": sadhana["hi_name"],
        "tithi": tithi_name,
        "paksha": paksha,
        "nakshatra": nakshatra,
        "yoga": yoga,
        "sunrise": sunrise,
        "sunset": sunset,
        "abhijit_muhurta": abhijit,
        "brahmamuhurta_time": brahmamuhurta_time,
        "rahu_kaal": rahu_kaal,
        "ishta_deity": sadhana["deity"],
        "ishta_mantra": sadhana["mantra"],
        "ishta_count": sadhana["count"],
        "sadhana_guideline": sadhana["guideline"],
        "career_guidance": career,
        "lucky_color": lucky_color,
        "lucky_num": lucky_num,
        "whatsapp_formatted_text": wa_text,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }


# ----------------- Endpoints -----------------

@router.get("/preferences")
def get_preferences(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Fetches user's current Vedic Companion subscription preferences."""
    sub = None
    if user:
        sub = db.query(VedicCompanionSubscription).filter(
            VedicCompanionSubscription.user_id == user.id
        ).order_by(VedicCompanionSubscription.created_at.desc()).first()
    elif owner:
        sub = db.query(VedicCompanionSubscription).filter(
            VedicCompanionSubscription.owner_key == owner.key
        ).order_by(VedicCompanionSubscription.created_at.desc()).first()

    if sub:
        return {
            "id": sub.id,
            "channel": sub.channel,
            "phone_or_handle": sub.phone_or_handle,
            "delivery_time": sub.delivery_time,
            "language": sub.language,
            "rashi": sub.rashi,
            "nakshatra": sub.nakshatra,
            "is_active": sub.is_active,
            "last_sent_at": sub.last_sent_at.isoformat() if sub.last_sent_at else None
        }

    # Default fallback
    default_phone = (user.phone if user and user.phone else "+919876543210")
    return {
        "id": None,
        "channel": "whatsapp",
        "phone_or_handle": default_phone,
        "delivery_time": "05:30",
        "language": "hi",
        "rashi": "Singh (Leo)",
        "nakshatra": "Magha (मघा)",
        "is_active": True,
        "last_sent_at": None
    }


@router.post("/preferences")
def save_preferences(
    payload: CompanionPreferencesRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Saves or updates Vedic Companion subscription."""
    sub = None
    if user:
        sub = db.query(VedicCompanionSubscription).filter(
            VedicCompanionSubscription.user_id == user.id
        ).first()
    elif owner:
        sub = db.query(VedicCompanionSubscription).filter(
            VedicCompanionSubscription.owner_key == owner.key
        ).first()

    if not sub:
        sub = VedicCompanionSubscription(
            user_id=user.id if user else None,
            owner_key=owner.key if owner else None
        )
        db.add(sub)

    sub.channel = payload.channel
    sub.phone_or_handle = payload.phone_or_handle
    sub.delivery_time = payload.delivery_time
    sub.language = payload.language
    sub.rashi = payload.rashi
    sub.nakshatra = payload.nakshatra
    sub.is_active = payload.is_active

    db.commit()
    db.refresh(sub)

    return {
        "success": True,
        "message": "वैदिक साथी प्राथमिकताओं को सफलतापूर्वक सहेज लिया गया है।",
        "subscription": {
            "id": sub.id,
            "channel": sub.channel,
            "phone_or_handle": sub.phone_or_handle,
            "delivery_time": sub.delivery_time,
            "rashi": sub.rashi,
            "is_active": sub.is_active
        }
    }


@router.post("/digest/preview")
def preview_digest(payload: DigestPreviewRequest):
    """Generates an instant Brahmamuhurta companion preview."""
    return generate_brahmamuhurta_digest(
        rashi_raw=payload.rashi,
        nakshatra_raw=payload.nakshatra,
        lang=payload.language or "hi"
    )


@router.post("/send-test")
def send_test_digest(
    payload: DigestPreviewRequest,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
    owner: Optional[Owner] = Depends(optional_owner)
):
    """Simulates immediate dispatch of today's Brahmamuhurta digest to the devotee's channel."""
    digest = generate_brahmamuhurta_digest(
        rashi_raw=payload.rashi,
        nakshatra_raw=payload.nakshatra,
        lang=payload.language or "hi"
    )

    now = datetime.now(timezone.utc)
    # Update last_sent_at if subscription exists
    sub = None
    if user:
        sub = db.query(VedicCompanionSubscription).filter(
            VedicCompanionSubscription.user_id == user.id
        ).first()
    elif owner:
        sub = db.query(VedicCompanionSubscription).filter(
            VedicCompanionSubscription.owner_key == owner.key
        ).first()

    if sub:
        sub.last_sent_at = now
        db.commit()

    return {
        "success": True,
        "status": "DELIVERED",
        "delivered_to": sub.phone_or_handle if sub else "+919876543210",
        "channel": sub.channel if sub else "whatsapp",
        "dispatch_timestamp": now.isoformat(),
        "digest": digest
    }


@router.post("/webhook/whatsapp")
def whatsapp_webhook(payload: WebhookMessageRequest):
    """Interactive incoming WhatsApp chatbot webhook."""
    query = payload.message.lower().strip()
    sender = payload.sender

    if "पंचांग" in query or "panchang" in query:
        p = calculate_panchang()
        reply = (
            f"📅 *आज का पंचांग (Aaj Ka Panchang)*\n"
            f"• तिथि: {p.get('tithi', {}).get('name')}\n"
            f"• नक्षत्र: {p.get('nakshatra', {}).get('name')}\n"
            f"• अभिजित मुहूर्त: {p.get('shubh_muhurats', {}).get('abhijit', {}).get('time', '11:45 AM - 12:35 PM')}\n"
            f"• राहुकाल: {p.get('ashubh_muhurats', {}).get('rahu_kaal', {}).get('time', '04:30 PM - 06:00 PM')}\n"
            f"विस्तृत पंचांग: https://astrojyotish.in/panchang"
        )
    elif "मुहूर्त" in query or "muhurta" in query:
        reply = (
            f"⚡ *आज का शुभ अभिजित मुहूर्त:* 11:45 AM - 12:35 PM\n"
            f"यह काल सभी शुभ कार्यों, संकल्प व नवीन उपक्रम के लिए सर्वसिद्धिदायक है।"
        )
    elif "मंत्र" in query or "mantra" in query or "जप" in query:
        reply = (
            f"📿 *आज का पावन नाम जप:* ॐ नमो भगवते वासुदेवाय\n"
            f"माला काउंटर के साथ ऑनलाइन जप करें: https://astrojyotish.in/bhakti/naam-jaap"
        )
    else:
        reply = (
            f"हरि ॐ! 🕉️ वैदिक साथी में आपका स्वागत है।\n"
            f"आप 'पंचांग', 'मुहूर्त', 'मंत्र' या 'कुंडली' लिखकर उत्तर प्राप्त कर सकते हैं।"
        )

    return {
        "status": "replied",
        "sender": sender,
        "reply": reply
    }
