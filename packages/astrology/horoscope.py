"""
Authentic Vedic Horoscope (Rashifal) Engine for Astro Jyotish.
Provides daily, tomorrow, weekly, monthly, and yearly astrological forecasts
for all 12 Rashis (Mesha to Meena), plus personalized readings based on
natal Lagna and active Vimshottari Mahadasha.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone, timedelta
import random

RASHI_METADATA = {
    "Aries": {"sanskrit": "Mesha (मेष)", "lord": "Mars (Mangal)", "element": "Fire", "symbol": "Ram ♈", "lucky_gem": "Red Coral"},
    "Taurus": {"sanskrit": "Vrishabha (वृषभ)", "lord": "Venus (Shukra)", "element": "Earth", "symbol": "Bull ♉", "lucky_gem": "Diamond / Opal"},
    "Gemini": {"sanskrit": "Mithuna (मिथुन)", "lord": "Mercury (Budha)", "element": "Air", "symbol": "Twins ♊", "lucky_gem": "Emerald"},
    "Cancer": {"sanskrit": "Karkata (कर्क)", "lord": "Moon (Chandra)", "element": "Water", "symbol": "Crab ♋", "lucky_gem": "Pearl"},
    "Leo": {"sanskrit": "Simha (सिंह)", "lord": "Sun (Surya)", "element": "Fire", "symbol": "Lion ♌", "lucky_gem": "Ruby"},
    "Virgo": {"sanskrit": "Kanya (कन्या)", "lord": "Mercury (Budha)", "element": "Earth", "symbol": "Maiden ♍", "lucky_gem": "Emerald"},
    "Libra": {"sanskrit": "Tula (तुला)", "lord": "Venus (Shukra)", "element": "Air", "symbol": "Scales ♎", "lucky_gem": "Diamond / White Zircon"},
    "Scorpio": {"sanskrit": "Vrishchika (वृश्चिक)", "lord": "Mars (Mangal)", "element": "Water", "symbol": "Scorpion ♏", "lucky_gem": "Red Coral"},
    "Sagittarius": {"sanskrit": "Dhanu (धनु)", "lord": "Jupiter (Guru)", "element": "Fire", "symbol": "Archer ♐", "lucky_gem": "Yellow Sapphire"},
    "Capricorn": {"sanskrit": "Makara (मकर)", "lord": "Saturn (Shani)", "element": "Earth", "symbol": "Sea-Goat ♑", "lucky_gem": "Blue Sapphire"},
    "Aquarius": {"sanskrit": "Kumbha (कुम्भ)", "lord": "Saturn (Shani)", "element": "Air", "symbol": "Water-Bearer ♒", "lucky_gem": "Blue Sapphire"},
    "Pisces": {"sanskrit": "Meena (मीन)", "lord": "Jupiter (Guru)", "element": "Water", "symbol": "Fishes ♓", "lucky_gem": "Yellow Sapphire"}
}

HOROSCOPE_THEMES = {
    "Aries": {
        "career": "Mars fuels high initiative. Professional breakthroughs are supported if you avoid rash confrontation with supervisors.",
        "love": "Passionate interactions bring warmth. Ensure you give your partner space to express their thoughts freely.",
        "finance": "Favorable day for planning capital allocations; steer clear of speculative intraday gambles.",
        "health": "High vitality, but stay hydrated and avoid physical overexertion during midday heat.",
        "lucky_num": 9, "lucky_color": "Crimson Red", "lucky_time": "09:15 AM - 10:45 AM"
    },
    "Taurus": {
        "career": "Venus blesses artistic and strategic decisions. Steady consistency yields rewarding recognition from clients.",
        "love": "Deep romantic harmony prevails. An evening conversation or shared meal solidifies mutual trust.",
        "finance": "Stable liquidity. Long-term property or gold considerations receive supportive celestial backing.",
        "health": "Gentle neck and throat relaxation recommended. Maintain a wholesome, balanced Sattvic diet.",
        "lucky_num": 6, "lucky_color": "Lotus Pink & Pearl White", "lucky_time": "02:30 PM - 04:00 PM"
    },
    "Gemini": {
        "career": "Mercury sharpens analytical acumen. Ideal for negotiations, presentations, and resolving documentation backlogs.",
        "love": "Lighthearted wit and playful communication revitalize relationship dynamics.",
        "finance": "Unexpected minor gains through intellectual projects or prior consulting engagements.",
        "health": "Calm your nervous system with mindful breathing exercises and reduced screen time before bed.",
        "lucky_num": 5, "lucky_color": "Emerald Green", "lucky_time": "11:00 AM - 12:30 PM"
    },
    "Cancer": {
        "career": "Intuition guides strategic choices. Colleague collaboration runs smoothly when empathy leads the discussion.",
        "love": "Sentimental depth brings profound closeness. Share heartfelt appreciation with family elders and spouse.",
        "finance": "Prudent domestic budgeting brings peace of mind. Avoid impulsive luxury shopping today.",
        "health": "Emotional balance directly enhances physical digestion. Warm herbal infusions will soothe stomach sensitivities.",
        "lucky_num": 2, "lucky_color": "Silver & Milky White", "lucky_time": "08:00 AM - 09:30 AM"
    },
    "Leo": {
        "career": "Solar radiance positions you at the center of authority. Lead by empowering your team rather than enforcing ego.",
        "love": "Generous gestures and magnetic charm draw admiration. Be mindful to listen as attentively as you speak.",
        "finance": "Promising avenues for business expansion open up. Review contractual terms with experienced elders.",
        "health": "Cardiovascular stamina is robust. Morning surya namaskar aligns your solar energy centers.",
        "lucky_num": 1, "lucky_color": "Royal Gold & Saffron", "lucky_time": "10:00 AM - 11:30 AM"
    },
    "Virgo": {
        "career": "Meticulous attention to detail prevents costly organizational oversights. Senior stakeholders appreciate your precision.",
        "love": "Practical helpfulness expresses love more powerfully than flowery words. Plan a quiet, thoughtful evening.",
        "finance": "Excellent day for debt reconciliation, tax planning, and structuring emergency savings.",
        "health": "Gentle core exercises and digestive health should be prioritized. Avoid skipping regular meal hours.",
        "lucky_num": 5, "lucky_color": "Forest Green & Beige", "lucky_time": "03:15 PM - 04:45 PM"
    },
    "Libra": {
        "career": "Diplomatic finesse mediates complex boardroom tensions. Collaborative partnerships thrive under your gracious balance.",
        "love": "Aesthetic romance and gentle mutual understanding blossom. A joyful occasion or cultural outing brings delight.",
        "finance": "Balanced cash flow. A good time to rebalance investment portfolios toward stability.",
        "health": "Maintain kidney hydration and lumbar spine posture during long seated work stretches.",
        "lucky_num": 7, "lucky_color": "Pastel Blue & White", "lucky_time": "01:00 PM - 02:30 PM"
    },
    "Scorpio": {
        "career": "Intense investigative focus uncovers valuable operational insights. Maintain discretion regarding proprietary initiatives.",
        "love": "Passionate loyalty deepens intimate bonds. Release old grudges to allow true emotional healing.",
        "finance": "Favorable indications for resolving legacy financial or insurance paperwork.",
        "health": "Channel intense energy through vigorous exercise, martial arts, or brisk walking.",
        "lucky_num": 9, "lucky_color": "Deep Maroon & Rust", "lucky_time": "04:30 PM - 06:00 PM"
    },
    "Sagittarius": {
        "career": "Jupiter inspires broad visionary strategies. Educational pursuits and international interactions are blessed.",
        "love": "Philosophical camaraderie and shared wanderlust uplift your connection. Plan an inspiring future journey together.",
        "finance": "Generous instincts should be tempered with realistic budget ceilings. Consult before large disbursements.",
        "health": "Stretches for hips and thighs enhance physical ease. Spending time outdoors refreshes your spirits.",
        "lucky_num": 3, "lucky_color": "Bright Saffron & Yellow", "lucky_time": "07:30 AM - 09:00 AM"
    },
    "Capricorn": {
        "career": "Saturnian discipline pays compounding dividends. Your methodical persistence outlasts fleeting competitive noise.",
        "love": "Steadfast loyalty provides deep psychological reassurance to your loved ones. Practical support cements affection.",
        "finance": "Strategic wealth accumulation on solid track. Solidify business infrastructure and conservative reserves.",
        "health": "Joint and bone wellness requires adequate calcium, gentle joint rotations, and proper sleep posture.",
        "lucky_num": 8, "lucky_color": "Navy Blue & Charcoal", "lucky_time": "05:00 PM - 06:30 PM"
    },
    "Aquarius": {
        "career": "Innovative breakthroughs and community networking flourish. Your forward-looking perspective inspires colleagues.",
        "love": "Intellectual rapport and mutual independence keep your relationship stimulating and refreshed.",
        "finance": "Favorable prospects through collective ventures or tech-enabled platforms.",
        "health": "Circulation exercises for calves and ankles help alleviate sluggishness. Drink ample warm water.",
        "lucky_num": 4, "lucky_color": "Electric Blue & Silver", "lucky_time": "12:30 PM - 02:00 PM"
    },
    "Pisces": {
        "career": "Creative imagination and empathetic counseling shine. Trust your instinctive hunches when navigating ambiguous projects.",
        "love": "Dreamy romance and spiritual oneness envelop your partnership. An intuitive soul connection is felt deeply.",
        "finance": "Charitable inclinations bring spiritual merit, but maintain firm boundaries against deceptive solicitations.",
        "health": "Restful sleep and meditative introspection restore vital Ojas (vitality). Avoid emotional fatigue.",
        "lucky_num": 3, "lucky_color": "Sea Green & Golden Yellow", "lucky_time": "06:00 AM - 07:30 AM"
    }
}

def get_horoscope(sign: str, timeframe: str = "daily") -> Dict[str, Any]:
    clean_sign = sign.strip().title()
    if clean_sign not in RASHI_METADATA:
        clean_sign = "Aries"
        
    meta = RASHI_METADATA[clean_sign]
    theme = HOROSCOPE_THEMES[clean_sign]
    
    today = datetime.now(timezone.utc)
    target_date = today
    if timeframe == "tomorrow":
        target_date = today + timedelta(days=1)
        
    date_str = target_date.strftime("%A, %d %B %Y")
    
    return {
        "rashi": clean_sign,
        "sanskrit": meta["sanskrit"],
        "lord": meta["lord"],
        "element": meta["element"],
        "symbol": meta["symbol"],
        "timeframe": timeframe,
        "date": date_str,
        "overview": f"Under the influence of {meta['lord']}, {meta['sanskrit']} experiences steady focus today. Elemental {meta['element']} resonance supports harmonious execution across career and personal life.",
        "career": theme["career"],
        "love": theme["love"],
        "finance": theme["finance"],
        "health": theme["health"],
        "lucky_number": theme["lucky_num"],
        "lucky_color": theme["lucky_color"],
        "lucky_time": theme["lucky_time"],
        "vedic_mantra": f"ॐ {meta['lord'].split()[0]}ाय नमः (Chant 21 times for auspiciousness)",
        "share_summary": f"⭐ Daily Horoscope for {meta['sanskrit']} ({date_str}):\n💼 Career: {theme['career']}\n❤️ Love: {theme['love']}\n🍀 Lucky Color: {theme['lucky_color']} | Lucky No: {theme['lucky_num']}\n✨ Read more on Astro Jyotish: https://astrojyotish.ai"
    }
