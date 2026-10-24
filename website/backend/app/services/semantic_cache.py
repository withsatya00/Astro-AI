"""
Semantic & In-Memory Response Cache for AstroAI Agent.
Provides ultra-low-latency (sub-15ms) responses for recurrent astrological queries,
classical concept definitions, and Vedic remedy inquiries.
"""
from typing import Dict, Any, Optional, Tuple, AsyncGenerator
import time
import re
import hashlib
from collections import OrderedDict
from packages.core.logging import logger

# Bounded LRU Cache Configuration
DEFAULT_MAX_CACHE_SIZE = 512
DEFAULT_TTL_SECONDS = 7200  # 2 Hours


class SemanticCacheService:
    def __init__(self, maxsize: int = DEFAULT_MAX_CACHE_SIZE, default_ttl: int = DEFAULT_TTL_SECONDS):
        self._maxsize = maxsize
        self._default_ttl = default_ttl
        self._cache: OrderedDict[str, Tuple[float, Dict[str, Any]]] = OrderedDict()
        self._hits = 0
        self._misses = 0
        self._seed_classical_knowledge()

    def _normalize_key(self, query: str, language: str, astrologer_id: str) -> str:
        """
        Normalizes conversational queries into an invariant astrological intent key.
        Strips conversational filler, greeting particles, and punctuation.
        """
        import unicodedata
        clean = unicodedata.normalize("NFKC", query.strip().lower())
        clean = re.sub(r"[^\w\s\u0900-\u097F\u0980-\u09FF\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F]", " ", clean)

        # Canonical astrology concept mappings (Multilingual: Roman and Devanagari)
        concept_patterns = [
            (r"(sade\s*sati|shani\s*sade|saade\s*saati|साढ़े|साढ़े|साडे)", "concept:sade_sati"),
            (r"(mangal\s*dosha|manglik|manglik\s*dosh|kuja\s*dosha|मंगल\s*दोष|मांगलिक)", "concept:mangal_dosha"),
            (r"(gajakesari|gaja\s*kesari|gajkesari|गजकेसरी|गज\s*केसरी)", "concept:gajakesari_yoga"),
            (r"(budhaditya|budh\s*aditya|बुधादित्य|बुध\s*आदित्य)", "concept:budhaditya_yoga"),
            (r"(kaal\s*sarp|kalsarp|kal\s*sarp|कालसर्प|काल\s*सर्प)", "concept:kaalsarp_dosha"),
            (r"(panchang|aaj\s*ka\s*panchang|tithi\s*nakshatra|पंचांग)", "concept:panchang_basics"),
            (r"(kundali\s*milan|gun\s*milan|ashtakoot|36\s*gun|कुंडली\s*मिलान|गुण\s*मिलान)", "concept:kundali_milan"),
            (r"(navamsha|navamsha\s*chart|d9\s*chart|नवांश)", "concept:navamsha_d9"),
            (r"(ratna|gemstone|anukul\s*ratna|manek|panna|pukhraj|रत्न)", "concept:gemstones_rules"),
            (r"(shani\s*upay|shani\s*ke\s*upay|saturn\s*remedies|शनि\s*के\s*उपाय)", "concept:shani_remedies")
        ]

        for pattern, canonical in concept_patterns:
            if re.search(pattern, clean):
                return f"{canonical}::{language}::{astrologer_id}"

        # General invariant query hash
        tokens = sorted([t for t in clean.split() if len(t) > 2])
        hash_str = "_".join(tokens[:8])
        return f"gen::{hash_str}::{language}::{astrologer_id}"

    def get(self, query: str, language: str = "en", astrologer_id: str = "acharya_shastri") -> Optional[Dict[str, Any]]:
        """Retrieves cached response if present and unexpired."""
        key = self._normalize_key(query, language, astrologer_id)
        if key in self._cache:
            expires_at, data = self._cache[key]
            if time.time() < expires_at:
                self._cache.move_to_end(key)
                self._hits += 1
                logger.info(f"Semantic Cache Hit for query: '{query[:40]}' (Key: {key})")
                return dict(data)
            else:
                del self._cache[key]

        self._misses += 1
        return None

    def set(
        self,
        query: str,
        response_data: Dict[str, Any],
        language: str = "en",
        astrologer_id: str = "acharya_shastri",
        ttl: Optional[int] = None
    ) -> None:
        """Stores a response in the cache with LRU eviction."""
        # Never cache personalized birth-chart calculations
        if response_data.get("calculated_data_used", False):
            return

        key = self._normalize_key(query, language, astrologer_id)
        expires_at = time.time() + (ttl or self._default_ttl)

        if len(self._cache) >= self._maxsize:
            self._cache.popitem(last=False)  # Evict oldest LRU

        self._cache[key] = (expires_at, response_data)
        self._cache.move_to_end(key)

    async def stream_cached(self, cached_data: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
        """Rapidly streams a cached response in small bursts (instantaneous delivery)."""
        import asyncio
        full_text = cached_data.get("content", "")
        words = re.findall(r'\S+\s*', full_text)
        chunk_size = 4
        for i in range(0, len(words), chunk_size):
            yield {"type": "delta", "text": "".join(words[i:i+chunk_size])}
            await asyncio.sleep(0.003)

        yield {
            "type": "done",
            "content": full_text,
            "is_demo_mode": cached_data.get("is_demo_mode", False),
            "calculated_data_used": False,
            "citations": cached_data.get("citations", []),
            "chart_svg": None,
            "astrologer_id": cached_data.get("astrologer_id", "acharya_shastri"),
            "cached": True
        }

    def _seed_classical_knowledge(self) -> None:
        """Pre-warms the cache with authentic, concise Vedic explanations without bold tags."""
        pre_seeded = [
            (
                "concept:sade_sati::en::acharya_shastri",
                "Hari Om! Ayushman Bhava, divine blessings to you 🙏\n\n"
                "Dear seeker, Shani Sade Sati is a 7.5-year sacred transit of Saturn (Shani Dev) across the 12th, 1st, and 2nd houses from your natal Moon sign. "
                "In traditional Vedic Shastras, Sade Sati is not a curse. It is a time for patience, discipline, and karma purification.\n\n"
                "Simple Upay: Recite Hanuman Chalisa peacefully, light a mustard oil lamp near a Peepal tree on Saturdays, and serve the needy with humility. Shani Dev always blesses sincere effort."
            ),
            (
                "concept:sade_sati::hi::acharya_shastri",
                "हरि ॐ! आयुष्मान भव, कल्याणमस्तु! 🙏\n\n"
                "प्रिय जातक, शनि साढ़े साती चंद्र राशि से 12वें, 1ले और 2रे भाव में न्यायप्रिय शनिदेव का 7.5 वर्ष का गोचर काल है। "
                "वैदिक ज्योतिष अनुसार यह कोई अभिशाप नहीं, बल्कि आत्म-मंथन, धैर्य और कर्म शुद्धि का पावन समय है। सच्ची मेहनत का फल शनिदेव अवश्य देते हैं।\n\n"
                "सरल उपाय: नित्य हनुमान चालीसा का शांत भाव से पाठ करें और शनिवार को पीपल के पास सरसों के तेल का दीपक प्रज्वलित करें। चिंता न करें, सब मंगल होगा।"
            ),
            (
                "concept:sade_sati::hinglish::acharya_shastri",
                "Hari Om! Ayushman Bhava, Kalyanmastu beta 🙏\n\n"
                "Shani Sade Sati janam kundli mein Moon sign se 12th, 1st aur 2nd house mein Shani Dev ka 7.5 saal ka transit hota hai. "
                "Vedic shastro ke mutabiq yeh koi shraap nahi hai, balki dhairya, imandari aur karma sudhaar ka samay hai.\n\n"
                "Saral Upay: Roz subah ya shaam Hanuman Chalisa padhein aur Shanivaar ko peepal ke paas tel ka deepak jalayein. Ishwar par bharosa rakhein, sab kalyan hoga beta."
            ),
            (
                "concept:mangal_dosha::en::acharya_shastri",
                "Hari Om! Blessings dear seeker 🙏\n\n"
                "Mangal Dosha occurs when Mars is placed in the 1st, 4th, 7th, 8th, or 12th house. "
                "Mars represents courage and vitality. In classical Parashara Shastra, there are many natural cancellations like Jupiter aspect or own sign placement. "
                "Mutual respect and sweet communication turn this into protective energy.\n\n"
                "Simple Upay: Chant Hanuman Chalisa peacefully and offer fresh water to Lord Surya every morning."
            ),
            (
                "concept:mangal_dosha::hi::acharya_shastri",
                "हरि ॐ! आयुष्मान भव बेटा 🙏\n\n"
                "मंगल दोष तब माना जाता है जब कुंडली में लग्न या चंद्र से 1, 4, 7, 8 या 12वें भाव में मंगल देव स्थित हों। "
                "महर्षि पराशर अनुसार मंगल देव साहस और पराक्रम के स्वामी हैं। कुंडली में इसके कई स्वतः परिहार भी होते हैं। दांपत्य जीवन में थोड़ा धैर्य और मधुर वाणी रखने से यह ऊर्जा परिवार की रक्षक बन जाती है।\n\n"
                "सरल उपाय: नित्य हनुमान चालीसा का पाठ करें और मंगलवार को गाय को गुड़-रोटी खिलाएं। सब शुभ होगा।"
            ),
            (
                "concept:gajakesari_yoga::en::acharya_shastri",
                "Hari Om! Shubham Bhavatu dear seeker 🙏\n\n"
                "Gajakesari Yoga is an auspicious royal yoga formed when Devguru Jupiter is in a Kendra (1st, 4th, 7th, or 10th house) from the Moon. "
                "It bestows noble wisdom, righteous character, societal respect, and steady prosperity like the majesty of an elephant and the courage of a lion."
            ),
            (
                "concept:gajakesari_yoga::hi::acharya_shastri",
                "हरि ॐ! कल्याणमस्तु बेटा 🙏\n\n"
                "गजकेसरी योग देवगुरु बृहस्पति और चंद्रमा के केंद्र संबंध से बनने वाला अत्यंत शुभ राजयोग है। "
                "महर्षि पराशर अनुसार यह योग जातक को उच्च विद्या, मान-सम्मान, उत्तम बुद्धि एवं जीवन में अखंड यश-कीर्ति प्रदान करता है।"
            )
        ]

        far_future = time.time() + 86400 * 30  # 30 days
        for key, text in pre_seeded:
            self._cache[key] = (
                far_future,
                {
                    "content": text,
                    "is_demo_mode": False,
                    "calculated_data_used": False,
                    "citations": [],
                    "chart_svg": None,
                    "astrologer_id": "acharya_shastri",
                    "from_semantic_cache": True
                }
            )


# Global singleton instance
semantic_cache = SemanticCacheService()
