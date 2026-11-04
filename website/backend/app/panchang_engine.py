"""Location-aware panchang helpers for the Bhakti festival calendar. Pure functions, no database.

What is computed, and the assumptions made (all shown to the reader by the calendar):
  * Sun and Moon positions come from the Swiss Ephemeris through the project's existing helper; the Sun's sign uses the Lahiri ayanamsa.
  * A tithi is each 12 degrees of the Moon's lead over the Sun (30 per lunar month; 1-15 Shukla, 16-30 Krishna). The ayanamsa cancels out of it.
  * Sunrise and sunset are real, for the chosen latitude and longitude (disc centre, standard refraction).
  * Lunar months are amanta (new moon to new moon). A month is named from the Sun's sidereal sign at the new moon that starts it, and a
    month in which the Sun changes no sign is an adhika (extra) month, which carries no festivals.
  * A festival falls on the day whose chosen part of the day (sunrise, midday, afternoon, evening or midnight) belongs to the required tithi.
    Traditions, regions and individual panchangs apply this differently, so a date can differ by a day from a local panchang.
"""
import math
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
from typing import Dict, List, Optional, Tuple

import swisseph as swe

from packages.astrology.panchang import get_approx_sun_moon_longitudes

MEAN_ELONGATION_SPEED = 12.19  # degrees per day the Moon gains on the Sun, on average
SYNODIC_DAYS = 29.53

# key -> (label, latitude, longitude, UTC offset hours)
LOCATIONS: Dict[str, Tuple[str, float, float, float]] = {
    "delhi": ("Delhi", 28.6139, 77.2090, 5.5), "mumbai": ("Mumbai", 19.0760, 72.8777, 5.5), "kolkata": ("Kolkata", 22.5726, 88.3639, 5.5),
    "chennai": ("Chennai", 13.0827, 80.2707, 5.5), "bengaluru": ("Bengaluru", 12.9716, 77.5946, 5.5), "varanasi": ("Varanasi", 25.3176, 82.9739, 5.5),
    "ujjain": ("Ujjain", 23.1765, 75.7885, 5.5), "ahmedabad": ("Ahmedabad", 23.0225, 72.5714, 5.5), "jaipur": ("Jaipur", 26.9124, 75.7873, 5.5),
}
DEFAULT_LOCATION = "delhi"

LUNAR_MONTHS = ["Chaitra", "Vaishakha", "Jyeshtha", "Ashadha", "Shravana", "Bhadrapada", "Ashwin", "Kartik", "Margashirsha", "Pausha", "Magha", "Phalguna"]
LUNAR_MONTHS_HI = ["चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद", "आश्विन", "कार्तिक", "मार्गशीर्ष", "पौष", "माघ", "फाल्गुन"]

TITHI_EN = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi",
            "Chaturdashi"]
TITHI_HI = ["प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", "त्रयोदशी", "चतुर्दशी"]


def tithi_name(n: int) -> Tuple[str, str, str]:
    """(English, Hindi, paksha) for tithi number 1..30."""
    if n == 15:
        return "Purnima", "पूर्णिमा", "Shukla"
    if n == 30:
        return "Amavasya", "अमावस्या", "Krishna"
    i = (n - 1) % 15
    return TITHI_EN[i], TITHI_HI[i], "Shukla" if n <= 15 else "Krishna"


def _sun_moon(t: datetime) -> Tuple[float, float]:
    return get_approx_sun_moon_longitudes(t.astimezone(timezone.utc))


def tithi_at(t: datetime) -> int:
    sun, moon = _sun_moon(t)
    return int(((moon - sun) % 360.0) // 12.0) + 1


def _elong_signed(t: datetime) -> float:
    sun, moon = _sun_moon(t)
    return ((moon - sun + 180.0) % 360.0) - 180.0  # 0 at new moon, rising through zero


def _refine_new_moon(guess: datetime) -> datetime:
    t = guess
    for _ in range(14):
        e = _elong_signed(t)
        t = t - timedelta(days=e / MEAN_ELONGATION_SPEED)
        if abs(e) < 0.0005:
            break
    return t


def new_moon_before(t: datetime) -> datetime:
    sun, moon = _sun_moon(t)
    since = ((moon - sun) % 360.0) / MEAN_ELONGATION_SPEED
    nm = _refine_new_moon(t - timedelta(days=since))
    return nm if nm <= t else _refine_new_moon(nm - timedelta(days=SYNODIC_DAYS))


def new_moon_after(nm: datetime) -> datetime:
    return _refine_new_moon(nm + timedelta(days=SYNODIC_DAYS))


def bhadra_at(t: datetime) -> bool:
    """True while the Vishti (Bhadra) karana is running: karanas 2..57 of the 60 in a lunar month repeat in sevens, the seventh being Vishti."""
    sun, moon = _sun_moon(t)
    num = int(((moon - sun) % 360.0) // 6.0) + 1
    return 2 <= num <= 57 and (num - 2) % 7 == 6


def _sign(t: datetime) -> int:
    return int(_sun_moon(t)[0] // 30.0) % 12


@dataclass
class Month:
    start: datetime
    end: datetime
    name: str
    name_hi: str
    adhika: bool


@lru_cache(maxsize=4096)
def _month_cached(nm_key: int) -> Month:
    start = datetime.fromtimestamp(nm_key, tz=timezone.utc)
    end = new_moon_after(start)
    s_start, s_end = _sign(start + timedelta(minutes=1)), _sign(end - timedelta(minutes=1))
    idx = (s_start + 1) % 12
    return Month(start, end, LUNAR_MONTHS[idx], LUNAR_MONTHS_HI[idx], adhika=(s_start == s_end))


def lunar_month(t: datetime) -> Month:
    nm = new_moon_before(t)
    return _month_cached(int(round(nm.timestamp() / 60.0)) * 60)  # whole minutes, so the cache key is stable


def sunrise_sunset(day: date, lat: float, lon: float, tz_hours: float) -> Tuple[datetime, datetime]:
    """Local sunrise and sunset for a calendar day (timezone-aware, in the location's own offset)."""
    tz = timezone(timedelta(hours=tz_hours))
    midnight_utc = datetime(day.year, day.month, day.day, tzinfo=tz).astimezone(timezone.utc)
    jd = swe.julday(midnight_utc.year, midnight_utc.month, midnight_utc.day, midnight_utc.hour + midnight_utc.minute / 60.0)
    out = []
    for flag in (swe.CALC_RISE, swe.CALC_SET):
        res, tret = swe.rise_trans(jd, swe.SUN, flag | swe.BIT_DISC_CENTER, (lon, lat, 0.0), 1013.25, 15.0)
        if res != 0:
            raise ValueError("The Sun does not rise and set on this date at this latitude")
        y, mo, d, h = swe.revjul(tret[0])
        base = datetime(int(y), int(mo), int(d), tzinfo=timezone.utc)
        out.append((base + timedelta(hours=h)).astimezone(tz))
    return out[0], out[1]


@dataclass
class Day:
    date: date
    sunrise: datetime
    sunset: datetime
    tithi_sunrise: int
    at: Dict[str, int]       # tithi number at each named part of the day
    bhadra: Dict[str, bool]  # whether Bhadra is running at each named part of the day
    month_name: str
    month_name_hi: str
    adhika: bool


def build_day(day: date, lat: float, lon: float, tz_hours: float) -> Day:
    sr, ss = sunrise_sunset(day, lat, lon, tz_hours)
    next_sr, _ = sunrise_sunset(day + timedelta(days=1), lat, lon, tz_hours)
    length = ss - sr
    points = {
        "sunrise": sr, "madhyahna": sr + length * 0.5, "aparahna": sr + length * 0.7,
        "pradosh": ss + timedelta(minutes=30), "nishita": ss + (next_sr - ss) * 0.5,
    }
    m = lunar_month(sr)
    return Day(day, sr, ss, tithi_at(sr), {k: tithi_at(v) for k, v in points.items()}, {k: bhadra_at(v) for k, v in points.items()}, m.name, m.name_hi, m.adhika)


@lru_cache(maxsize=16)
def build_days(start: date, end: date, lat: float, lon: float, tz_hours: float) -> Tuple[Day, ...]:
    out, d = [], start
    while d <= end:
        out.append(build_day(d, lat, lon, tz_hours))
        d += timedelta(days=1)
    return tuple(out)


# ---------------------------------------------------------------- observances and festivals
# (slug, English, Hindi, lunar month (amanta), tithi number 1..30, part of the day, days after the matching day)
FESTIVAL_RULES = [
    ("vasant-panchami", "Vasant Panchami", "वसंत पंचमी", "Magha", 5, "madhyahna", 0),
    ("maha-shivratri", "Mahashivratri", "महाशिवरात्रि", "Magha", 29, "nishita", 0),
    ("holika-dahan", "Holika Dahan", "होलिका दहन", "Phalguna", 15, "pradosh", 0),
    ("holi", "Holi (Rangwali)", "होली (रंगवाली)", "Phalguna", 15, "pradosh", 1),
    ("chaitra-navratri-begins", "Chaitra Navratri begins", "चैत्र नवरात्रि आरंभ", "Chaitra", 1, "sunrise", 0),
    ("ram-navami", "Ram Navami", "राम नवमी", "Chaitra", 9, "madhyahna", 0),
    ("akshaya-tritiya", "Akshaya Tritiya", "अक्षय तृतीया", "Vaishakha", 3, "madhyahna", 0),
    ("guru-purnima", "Guru Purnima", "गुरु पूर्णिमा", "Ashadha", 15, "sunrise", 0),
    ("raksha-bandhan", "Raksha Bandhan", "रक्षा बंधन", "Shravana", 15, "aparahna", 0),
    ("janmashtami", "Janmashtami", "जन्माष्टमी", "Shravana", 23, "nishita", 0),
    ("ganesh-chaturthi", "Ganesh Chaturthi", "गणेश चतुर्थी", "Bhadrapada", 4, "madhyahna", 0),
    ("sharad-navratri-begins", "Sharad Navratri begins", "शारदीय नवरात्रि आरंभ", "Ashwin", 1, "sunrise", 0),
    ("dussehra", "Dussehra (Vijayadashami)", "दशहरा (विजयादशमी)", "Ashwin", 10, "aparahna", 0),
    ("diwali", "Diwali (Lakshmi Puja)", "दीपावली (लक्ष्मी पूजा)", "Ashwin", 30, "pradosh", 0),
    ("dev-deepawali", "Kartik Purnima (Dev Deepawali)", "कार्तिक पूर्णिमा (देव दीपावली)", "Kartik", 15, "pradosh", 0),
    ("gita-jayanti", "Gita Jayanti (Mokshada Ekadashi)", "गीता जयंती (मोक्षदा एकादशी)", "Margashirsha", 11, "sunrise", 0),
]
PART_LABEL = {"sunrise": "at sunrise", "madhyahna": "at midday", "aparahna": "in the afternoon", "pradosh": "in the evening (after sunset)", "nishita": "at midnight"}


def _tithi_label(n: int) -> str:
    en, _hi, paksha = tithi_name(n)
    return f"{paksha} {en}"


BHADRA_SENSITIVE = {"holika-dahan", "holi", "raksha-bandhan"}
CAUTION = {
    "holika-dahan": "Holika Dahan is kept on the Purnima evening when Bhadra is not running. Panchangs differ by a day, so please confirm the muhurat with a local panchang.",
    "holi": "Holi follows Holika Dahan. Panchangs can differ by a day, so please confirm locally.",
    "raksha-bandhan": "Rakhi is tied while Bhadra is not running. Panchangs can differ by a day, so please confirm locally.",
    "janmashtami": "Smarta and Vaishnava traditions can keep different days.",
    "maha-shivratri": "Kept in the night of Chaturdashi; some traditions differ by a day.",
    "diwali": "Lakshmi Puja is kept in the evening of Amavasya; some regions keep a different day.",
}


def find_festivals(days: Tuple[Day, ...], year: int) -> List[dict]:
    """Applies each festival's rule to the daily table. Only dates falling in `year` are reported."""
    n = len(days)
    results = []
    for slug, en, hi, month, tithi, part, offset in FESTIVAL_RULES:
        def in_year(i: int) -> bool:
            return i + offset < n and days[i + offset].date.year == year

        def month_ok(d: Day) -> bool:
            return (not d.adhika) and d.month_name == month

        notes: List[str] = []
        exact = True
        cands = [i for i, d in enumerate(days) if in_year(i) and month_ok(d) and d.at[part] == tithi]
        idx: Optional[int] = None
        if cands:
            idx = cands[0]
            if slug in BHADRA_SENSITIVE:
                good = [i for i in cands if not days[i].bhadra[part]]
                if good:
                    idx = good[0]
                elif idx + 1 < n:
                    idx, exact = idx + 1, False
                    notes.append("Bhadra runs through the usual time, so the next day is shown.")
            elif len(cands) > 1 and cands[1] == cands[0] + 1 and part != "sunrise":
                notes.append("The tithi covers this time on two consecutive days; the first is shown. Some panchangs choose the second.")
        else:
            alt = [i for i, d in enumerate(days) if in_year(i) and month_ok(d) and d.tithi_sunrise == tithi]
            if alt:
                idx, exact = alt[0], False
                notes.append("The tithi is not present at the usual time; the day it is present at sunrise is shown.")
            else:
                prev_t, next_t = (tithi - 2) % 30 + 1, tithi % 30 + 1  # neighbouring tithis, wrapping 30 -> 1
                # the month is read from the following sunrise: Pratipada can begin on the last day of the previous month's sunrise
                between = [i for i in range(n - 1) if in_year(i) and month_ok(days[i + 1]) and days[i].tithi_sunrise == prev_t and days[i + 1].tithi_sunrise == next_t]
                if between:
                    idx, exact = between[0], False
                    notes.append("This tithi begins and ends between two sunrises; the day it occurs in is shown.")
        if idx is None or not in_year(idx):
            continue
        d = days[idx + offset]
        if slug in CAUTION:
            notes.append(CAUTION[slug])
        elif not exact:
            notes.append("Please confirm with a local panchang.")
        results.append({"slug": slug, "name_en": en, "name_hi": hi, "date": d.date.isoformat(), "weekday": d.date.strftime("%A"), "month": month,
                        "tithi": _tithi_label(tithi), "rule": f"{month} {_tithi_label(tithi)} {PART_LABEL[part]}" + (" (the day after)" if offset else ""),
                        "exact_rule": exact, "note": " ".join(notes)})
    return sorted(results, key=lambda x: x["date"])


def observances_for(d: Day, next_day: Optional[Day] = None) -> List[dict]:
    """Monthly observances for one day. A tithi is kept on the day it is present at sunrise (the Smarta rule). When a tithi begins and ends
    between two sunrises it is shown on the day it occurs, marked as approximate, because traditions then differ."""
    out: List[dict] = []
    t = d.tithi_sunrise

    def between(target: int) -> bool:
        return bool(next_day) and t == (target - 2) % 30 + 1 and next_day.tithi_sunrise == target % 30 + 1

    def add(kind, en, hi, detail, approx=False):
        out.append({"kind": kind, "name_en": en, "name_hi": hi, "detail": detail, "approx": approx})

    again = " The tithi also covers the next sunrise, so some traditions keep the next day." if next_day and next_day.tithi_sunrise == t else ""
    for target, pak in ((11, "Shukla"), (26, "Krishna")):
        if t == target:
            add("ekadashi", "Ekadashi", "एकादशी", f"{pak} Ekadashi at sunrise (Vaishnava traditions may keep the next day)." + again)
        elif between(target):
            add("ekadashi", "Ekadashi", "एकादशी", f"{pak} Ekadashi begins and ends between two sunrises; please confirm the day locally", True)
    if t == 15:
        add("purnima", "Purnima", "पूर्णिमा", "Purnima at sunrise." + again)
    elif between(15):
        add("purnima", "Purnima", "पूर्णिमा", "Purnima begins and ends between two sunrises; please confirm the day locally", True)
    if t == 30:
        add("amavasya", "Amavasya", "अमावस्या", "Amavasya at sunrise." + again)
    elif between(30):
        add("amavasya", "Amavasya", "अमावस्या", "Amavasya begins and ends between two sunrises; please confirm the day locally", True)
    if d.at["pradosh"] in (13, 28):
        add("pradosh", "Pradosh Vrat", "प्रदोष व्रत", f"{'Shukla' if d.at['pradosh'] == 13 else 'Krishna'} Trayodashi in the evening")
    return out


def resolve_location(key: Optional[str], lat: Optional[float], lon: Optional[float], tz: Optional[float]) -> Tuple[str, float, float, float, str]:
    """(label, lat, lon, tz_hours, key). A preset key wins; otherwise a custom point must be fully and sensibly given."""
    if lat is not None or lon is not None or tz is not None:
        if lat is None or lon is None or tz is None:
            raise ValueError("Give latitude, longitude and timezone offset together")
        if not (-60.0 <= lat <= 60.0) or not (-180.0 <= lon <= 180.0) or not (-12.0 <= tz <= 14.0):
            raise ValueError("Latitude must be within 60 degrees, longitude within 180, and the timezone offset between -12 and 14")
        return f"Custom ({lat:.2f}, {lon:.2f})", lat, lon, tz, "custom"
    k = (key or DEFAULT_LOCATION).lower()
    if k not in LOCATIONS:
        raise ValueError("Unknown location")
    label, la, lo, z = LOCATIONS[k]
    return label, la, lo, z, k
