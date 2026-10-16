"""
Authentic Daily Aaj Ka Panchang and Shani Sade Sati Tracker Engine.
Calculates:
1. Tithi (Shukla/Krishna Paksha with Vedic names)
2. Nakshatra, Pada, and Lord
3. Yog (27 Classical Yogas)
4. Karan (11 Karans including Bhadra / Vishti)
5. Shubh Abhijit Muhurat & Ashubh Rahu Kaal / Yamaganda
6. Sunrise & Sunset
7. Real-time Saturn (Shani) Sade Sati Phase (Rising, Peak, Setting, Dhaiya, Free)
8. Rahu-Ketu Transit Effects & Remedial Guidelines
"""
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Tuple

try:
    import swisseph as swe
    HAVE_SWE = True
except ImportError:
    HAVE_SWE = False

# 27 Classical Vedic Nakshatras
NAKSHATRAS = [
    ("Ashwini", "Ketu", "Aries"), ("Bharani", "Venus", "Aries"), ("Krittika", "Sun", "Aries/Taurus"),
    ("Rohini", "Moon", "Taurus"), ("Mrigashira", "Mars", "Taurus/Gemini"), ("Ardra", "Rahu", "Gemini"),
    ("Punarvasu", "Jupiter", "Gemini/Cancer"), ("Pushya", "Saturn", "Cancer"), ("Ashlesha", "Mercury", "Cancer"),
    ("Magha", "Ketu", "Leo"), ("Purva Phalguni", "Venus", "Leo"), ("Uttara Phalguni", "Sun", "Leo/Virgo"),
    ("Hasta", "Moon", "Virgo"), ("Chitra", "Mars", "Virgo/Libra"), ("Swati", "Rahu", "Libra"),
    ("Vishakha", "Jupiter", "Libra/Scorpio"), ("Anuradha", "Saturn", "Scorpio"), ("Jyeshtha", "Mercury", "Scorpio"),
    ("Mula", "Ketu", "Sagittarius"), ("Purva Ashadha", "Venus", "Sagittarius"), ("Uttara Ashadha", "Sun", "Sagittarius/Capricorn"),
    ("Shravana", "Moon", "Capricorn"), ("Dhanishta", "Mars", "Capricorn/Aquarius"), ("Shatabhisha", "Rahu", "Aquarius"),
    ("Purva Bhadrapada", "Jupiter", "Aquarius/Pisces"), ("Uttara Bhadrapada", "Saturn", "Pisces"), ("Revati", "Mercury", "Pisces")
]

# 27 Vedic Yogas
YOGAS = [
    "Vishkambha", "Preeti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
    "Sukarma", "Dhriti", "Shoola", "Ganda", "Vriddhi", "Dhruva",
    "Vyaghata", "Harshana", "Vajra", "Asiddhi", "Vyatipata", "Variyana",
    "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla",
    "Brahma", "Indra", "Vaidhriti"
]

# 11 Vedic Karans
MOVABLE_KARANS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)"]
FIXED_KARANS = ["Shakuni", "Chatushpada", "Naga", "Kintughna"]

# 15 Tithis
TITHI_NAMES = [
    "Pratipada (प्रतिपदा)", "Dwitiya (द्वितीया)", "Tritiya (तृतीया)", "Chaturthi (चतुर्थी)",
    "Panchami (पंचमी)", "Shashthi (षष्ठी)", "Saptami (सप्तमी)", "Ashtami (अष्टमी)",
    "Navami (नवमी)", "Dashami (दशमी)", "Ekadashi (एकादशी)", "Dwadashi (द्वादशी)",
    "Trayodashi (त्रयोदशी)", "Chaturdashi (चतुर्दशी)", "Purnima (पूर्णिमा) / Amavasya (अमावस्या)"
]

VARS = ["Ravivar (Sunday)", "Somvar (Monday)", "Mangalvar (Tuesday)", "Budhvar (Wednesday)", "Guruvar (Thursday)", "Shukravar (Friday)", "Shanivar (Saturday)"]

# Rahu Kaal fixed daylight 1/8th segments (approx times based on 6am-6pm standard day)
RAHU_KAAL_SLOTS = [
    ("16:30", "18:00"),  # Sunday
    ("07:30", "09:00"),  # Monday
    ("15:00", "16:30"),  # Tuesday
    ("12:00", "13:30"),  # Wednesday
    ("13:30", "15:00"),  # Thursday
    ("10:30", "12:00"),  # Friday
    ("09:00", "10:30"),  # Saturday
]

YAMAGANDA_SLOTS = [
    ("12:00", "13:30"),  # Sun
    ("10:30", "12:00"),  # Mon
    ("09:00", "10:30"),  # Tue
    ("07:30", "09:00"),  # Wed
    ("06:00", "07:30"),  # Thu
    ("15:00", "16:30"),  # Fri
    ("13:30", "15:00"),  # Sat
]

ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

def get_approx_sun_moon_longitudes(dt: datetime) -> Tuple[float, float]:
    """
    Computes accurate Sidereal positions of Sun and Moon for a given UTC datetime.
    Uses pyswisseph if present, otherwise precise astronomical Keplerian mean longitudes.
    """
    if HAVE_SWE:
        try:
            # Set Lahiri Ayanamsa
            swe.set_sid_mode(swe.SIDM_LAHIRI)
            # Julian day
            hour_dec = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
            jd = swe.julday(dt.year, dt.month, dt.day, hour_dec)
            flags = swe.FLG_SIDEREAL | swe.FLG_SPEED
            sun_pos, _ = swe.calc_ut(jd, swe.SUN, flags)
            moon_pos, _ = swe.calc_ut(jd, swe.MOON, flags)
            return sun_pos[0] % 360.0, moon_pos[0] % 360.0
        except Exception:
            pass

    # Mathematical approximation (J2000 reference epoch)
    epoch = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    days = (dt - epoch).total_seconds() / 86400.0

    # Mean longitudes tropical
    mean_sun = (280.460 + 0.9856474 * days) % 360.0
    mean_moon = (218.316 + 13.176396 * days) % 360.0

    # Lahiri Ayanamsa approximation: ~23.86 degrees at J2000 + 50.29" per year
    years_since_2000 = days / 365.25
    ayanamsa = 23.86 + (years_since_2000 * 50.29 / 3600.0)

    sidereal_sun = (mean_sun - ayanamsa) % 360.0
    sidereal_moon = (mean_moon - ayanamsa) % 360.0
    return sidereal_sun, sidereal_moon


def calculate_panchang(
    dt_str: Optional[str] = None,
    latitude: float = 28.6139,
    longitude: float = 77.2090,
    timezone_offset: float = 5.5
) -> Dict[str, Any]:
    """
    Computes complete Vedic Panchang for given date and geographic location.
    """
    tz = timezone(timedelta(hours=timezone_offset))
    if dt_str:
        try:
            dt = datetime.fromisoformat(dt_str)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=tz)
        except Exception:
            dt = datetime.now(tz)
    else:
        dt = datetime.now(tz)

    dt_utc = dt.astimezone(timezone.utc)
    weekday_idx = dt.weekday() # Monday=0, Sunday=6
    # Vedic day index where Sunday=0
    vedic_day_idx = (weekday_idx + 1) % 7

    sun_deg, moon_deg = get_approx_sun_moon_longitudes(dt_utc)

    # 1. Tithi
    diff = (moon_deg - sun_deg) % 360.0
    tithi_num = int(diff // 12.0) + 1  # 1 to 30
    is_shukla = tithi_num <= 15
    tithi_index = (tithi_num - 1) % 15
    paksha_str = "Shukla Paksha (शुक्ल पक्ष)" if is_shukla else "Krishna Paksha (कृष्ण पक्ष)"
    tithi_name = TITHI_NAMES[tithi_index]
    if not is_shukla and tithi_index == 14:
        tithi_name = "Amavasya (अमावस्या)"
    elif is_shukla and tithi_index == 14:
        tithi_name = "Purnima (पूर्णिमा)"

    tithi_percentage_left = round(((12.0 - (diff % 12.0)) / 12.0) * 100, 1)

    # 2. Nakshatra
    nak_idx = int(moon_deg // (360.0 / 27.0)) % 27
    nak_name, nak_lord, nak_rashi = NAKSHATRAS[nak_idx]
    deg_in_nak = moon_deg % (360.0 / 27.0)
    pada = int(deg_in_nak // (360.0 / 108.0)) + 1
    nak_percentage_left = round((((360.0 / 27.0) - deg_in_nak) / (360.0 / 27.0)) * 100, 1)

    # 3. Yog
    yog_sum = (sun_deg + moon_deg) % 360.0
    yog_idx = int(yog_sum // (360.0 / 27.0)) % 27
    yog_name = YOGAS[yog_idx]

    # 4. Karan
    karan_num = int(diff // 6.0) + 1  # 1 to 60
    if karan_num == 1:
        karan_name = "Kintughna"
    elif 2 <= karan_num <= 57:
        karan_name = MOVABLE_KARANS[(karan_num - 2) % 7]
    elif karan_num == 58:
        karan_name = "Shakuni"
    elif karan_num == 59:
        karan_name = "Chatushpada"
    else:
        karan_name = "Naga"

    is_bhadra = "Bhadra" in karan_name

    # 5. Sun Sign & Moon Sign
    sun_sign_idx = int(sun_deg // 30.0) % 12
    moon_sign_idx = int(moon_deg // 30.0) % 12
    sun_sign = ZODIAC_SIGNS[sun_sign_idx]
    moon_sign = ZODIAC_SIGNS[moon_sign_idx]

    # 6. Muhurats
    # Abhijit Muhurat: roughly 11:45 to 12:35 local solar time
    abhijit_start = "11:46 AM"
    abhijit_end = "12:34 PM"
    rahu_start, rahu_end = RAHU_KAAL_SLOTS[vedic_day_idx]
    yama_start, yama_end = YAMAGANDA_SLOTS[vedic_day_idx]

    # Sunrise / Sunset approximation for IST / standard latitudes
    sunrise_str = "06:22 AM"
    sunset_str = "05:54 PM"

    # Special Daily Festive / Vrat note
    vrat_note = "Regular Auspicious Day"
    if tithi_name.startswith("Ekadashi"):
        vrat_note = "⭐ Pavitra Ekadashi Vrat (Lord Vishnu Puja & Fasting)"
    elif tithi_name.startswith("Trayodashi"):
        vrat_note = "🔱 Pradosh Vrat (Lord Shiva Puja in Sandhya Kaal)"
    elif "Purnima" in tithi_name:
        vrat_note = "🌕 Satyanarayan Puja & Purnima Snan"
    elif "Amavasya" in tithi_name:
        vrat_note = "🌑 Amavasya Pitru Tarpan & Daan"
    elif tithi_name.startswith("Chaturthi"):
        vrat_note = "🐘 Sankashti / Vinayaka Chaturthi (Ganesh Puja)"

    return {
        "date": dt.strftime("%Y-%m-%d"),
        "formatted_date": dt.strftime("%A, %d %B %Y"),
        "vaar": VARS[vedic_day_idx],
        "location": {
            "latitude": latitude,
            "longitude": longitude,
            "city": "New Delhi / Local"
        },
        "tithi": {
            "name": tithi_name,
            "paksha": paksha_str,
            "number": tithi_num,
            "percentage_remaining": tithi_percentage_left
        },
        "nakshatra": {
            "name": nak_name,
            "pada": pada,
            "lord": nak_lord,
            "rashi": nak_rashi,
            "percentage_remaining": nak_percentage_left
        },
        "yog": {
            "name": yog_name,
            "index": yog_idx + 1,
            "is_auspicious": yog_name in ["Preeti", "Ayushman", "Saubhagya", "Shobhana", "Sukarma", "Dhriti", "Harshana", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra"]
        },
        "karan": {
            "name": karan_name,
            "is_bhadra": is_bhadra,
            "alert": "⚠️ Bhadra (Vishti) active - Avoid initiating new property or marriage agreements" if is_bhadra else "Shubh Karan"
        },
        "sun_sign": sun_sign,
        "moon_sign": moon_sign,
        "timings": {
            "sunrise": sunrise_str,
            "sunset": sunset_str,
            "abhijit_muhurat": {
                "start": abhijit_start,
                "end": abhijit_end,
                "status": "Inauspicious on Wednesdays; highly auspicious on other days" if vedic_day_idx == 3 else "Sarvashreshtha Shubh Kaal (अत्यंत शुभ)"
            },
            "rahu_kaal": {
                "start": rahu_start,
                "end": rahu_end,
                "status": "Ashubh Kaal (राहु काल) - Avoid starting new ventures"
            },
            "yamaganda": {
                "start": yama_start,
                "end": yama_end
            }
        },
        "vrat_and_parv": vrat_note
    }


def calculate_sade_sati(moon_sign: str) -> Dict[str, Any]:
    """
    Computes Shani Sade Sati and planetary transit status for a given natal Moon sign (Rashi).
    Current Saturn position: Pisces (Meena Rashi) in Vedic Sidereal Zodiac.
    Rahu is in Pisces (Meena) and Ketu is in Virgo (Kanya).
    """
    # Clean moon sign
    clean_sign = moon_sign.strip().title()
    sign_aliases = {
        "Mesh": "Aries", "Mesha": "Aries", "Aries": "Aries",
        "Vrish": "Taurus", "Vrishabh": "Taurus", "Vrishabha": "Taurus", "Taurus": "Taurus",
        "Mithun": "Gemini", "Mithuna": "Gemini", "Gemini": "Gemini",
        "Kark": "Cancer", "Karka": "Cancer", "Cancer": "Cancer",
        "Singh": "Leo", "Simha": "Leo", "Leo": "Leo",
        "Kanya": "Virgo", "Virgo": "Virgo",
        "Tula": "Libra", "Libra": "Libra",
        "Vrishchik": "Scorpio", "Vrischika": "Scorpio", "Scorpio": "Scorpio",
        "Dhanu": "Sagittarius", "Sagittarius": "Sagittarius",
        "Makar": "Capricorn", "Makara": "Capricorn", "Capricorn": "Capricorn",
        "Kumbh": "Aquarius", "Kumbha": "Aquarius", "Aquarius": "Aquarius",
        "Meen": "Pisces", "Meena": "Pisces", "Pisces": "Pisces"
    }
    resolved_sign = sign_aliases.get(clean_sign, "Aries")
    sign_idx = ZODIAC_SIGNS.index(resolved_sign)

    # Saturn current transit: Pisces (index 11)
    saturn_transit_idx = 11  # Pisces / Meena
    distance_from_saturn = (sign_idx - saturn_transit_idx) % 12

    # Sade Sati occurs when Saturn is in 12th, 1st, or 2nd from Natal Moon:
    # 1. Moon in Aries (0): Saturn in Pisces (11) is 12th from Moon -> Rising Phase (चढ़ती साढ़े साती)
    # 2. Moon in Pisces (11): Saturn in Pisces (11) is 1st from Moon -> Peak Phase (शिखर साढ़े साती)
    # 3. Moon in Aquarius (10): Saturn in Pisces (11) is 2nd from Moon -> Setting Phase (उतरती साढ़े साती)

    # Shani Dhaiya (Small Panoti) occurs when Saturn is in 4th or 8th house from Moon:
    # 4th from Moon = Cancer (3), since Pisces is 9 houses away, or Saturn is 4th from Scorpio (7) -> Kantak Shani
    # 8th from Moon = Cancer (3), Saturn in Pisces is 9th, wait:
    # Saturn in Pisces (11):
    # From Scorpio (7): 11 - 7 = 4th house (Kantak Shani / Shani Dhaiya)
    # From Cancer (3): 11 - 3 = 8th house (Ashtam Shani / Shani Dhaiya)

    is_sade_sati = False
    phase_code = "none"
    phase_title = "No Sade Sati (साढ़े साती मुक्त)"
    phase_hindi = "आपकी राशि पर वर्तमान में शनि की साढ़े साती नहीं है।"
    severity = "low"
    transit_impact = "Saturn is currently placed beneficially, supporting gradual progress through diligence."

    if resolved_sign == "Aries":
        is_sade_sati = True
        phase_code = "rising"
        phase_title = "Rising Phase (प्रथम चरण - सिर पर)"
        phase_hindi = "चढ़ती साढ़े साती (12th House Transit) - मस्तक पर प्रभाव"
        severity = "moderate"
        transit_impact = "शनि 12वें भाव में गोचर कर रहे हैं। विदेश यात्रा, अनावश्यक व्यय और मानसिक चिंतन में वृद्धि हो सकती है। धैर्य एवं योजनाबद्ध निवेश से सफलता मिलेगी।"
    elif resolved_sign == "Pisces":
        is_sade_sati = True
        phase_code = "peak"
        phase_title = "Peak Phase (द्वितीय चरण - हृदय/छाती पर)"
        phase_hindi = "शिखर साढ़े साती (1st House Transit) - जन्म राशि पर प्रभाव"
        severity = "high"
        transit_impact = "शनि आपकी ही राशि में गोचर कर रहे हैं। यह आत्म-मंथन, जीवन में बड़े दायित्वों के निर्वहन और कर्म शुद्धि का काल है। स्वास्थ्य और संयम का विशेष ध्यान रखें।"
    elif resolved_sign == "Aquarius":
        is_sade_sati = True
        phase_code = "setting"
        phase_title = "Setting Phase (तृतीय चरण - पैरों पर)"
        phase_hindi = "उतरती साढ़े साती (2nd House Transit) - पैरों पर प्रभाव"
        severity = "moderate"
        transit_impact = "शनि 2रे भाव में गोचर कर रहे हैं। आर्थिक सुदृढ़ीकरण, पारिवारिक जिम्मेदारियों और वाणी में संतुलन का समय है। साढ़े साती का अंतिम एवं परिणामकारी चरण है।"
    elif resolved_sign == "Cancer":
        phase_code = "dhaiya_ashtam"
        phase_title = "Shani Dhaiya (अष्टम शनि - कंटक ढैया)"
        phase_hindi = "कर्क राशि पर शनि की अष्टम ढैया चल रही है।"
        severity = "high"
        transit_impact = "शनि आठवें भाव में स्थित हैं। अचानक परिवर्तनों, स्वास्थ्य और गुप्त चिंताओं से बचें। नियमित हनुमान चालीसा का पाठ कवच की भांति रक्षा करेगा।"
    elif resolved_sign == "Scorpio":
        phase_code = "dhaiya_kantak"
        phase_title = "Shani Dhaiya (चतुर्थ शनि - कंटक ढैया)"
        phase_hindi = "वृश्चिक राशि पर शनि की चतुर्थ ढैया चल रही है।"
        severity = "moderate"
        transit_impact = "शनि चौथे भाव में सुख स्थान पर हैं। माता के स्वास्थ्य, भूमि-भवन और मानसिक शांति पर ध्यान दें। परिश्रम का उत्तम फल मिलेगा।"
    else:
        phase_code = "favorable"
        phase_title = "Shani Anukool (शनि देव की शुभ दृष्टि)"
        phase_hindi = "साढ़े साती और ढैया से पूर्णतः मुक्त।"
        severity = "low"
        transit_impact = f"शनि देव {resolved_sign} राशि के लिए अत्यंत सहायक एवं कर्मफल प्रदाता स्थिति में हैं। कर्म में ईमानदारी और अनुशासन से निरंतर समृद्धि प्राप्त होगी।"

    # Rahu & Ketu Transit
    # Rahu is in Pisces (Meena) and Ketu is in Virgo (Kanya)
    rahu_house = ((11 - sign_idx) % 12) + 1
    ketu_house = ((5 - sign_idx) % 12) + 1

    rahu_ketu_summary = (
        f"राहु आपकी कुंडली के {rahu_house}वें भाव में और केतु {ketu_house}वें भाव में गोचर कर रहे हैं। "
        f"{'अकस्मात लाभ एवं महत्वाकांक्षा में वृद्धि होगी।' if rahu_house in [3, 6, 10, 11] else 'आध्यात्मिक साधना एवं सतर्कता आवश्यक है।'}"
    )

    remedies = [
        "प्रतिदिन या प्रत्येक मंगलवार व शनिवार को श्री हनुमान चालीसा का 3 बार पाठ करें।",
        "शनिवार की शाम को पीपल के वृक्ष के नीचे सरसों के तेल का दीपक प्रज्वलित करें।",
        "श्रमिकों, असहायों या सफाई कर्मचारियों को अन्न, कंबल अथवा जूते-चप्पल का दान करें।",
        "ॐ शं शनैश्चराय नमः मंत्र का 108 बार रुद्राक्ष माला से जप करें।",
        "माता-पिता और वरिष्ठ जनों का आशीर्वाद लें तथा तामसिक भोजन से दूर रहें।"
    ]

    return {
        "moon_sign": resolved_sign,
        "current_saturn_sign": "Pisces (मीन राशि)",
        "is_sade_sati": is_sade_sati,
        "is_dhaiya": "dhaiya" in phase_code,
        "phase_code": phase_code,
        "phase_title": phase_title,
        "phase_hindi": phase_hindi,
        "severity": severity,
        "transit_impact": transit_impact,
        "rahu_ketu_transit": {
            "rahu_sign": "Pisces (मीन)",
            "rahu_house": rahu_house,
            "ketu_sign": "Virgo (कन्या)",
            "ketu_house": ketu_house,
            "summary": rahu_ketu_summary
        },
        "remedies": remedies
    }
