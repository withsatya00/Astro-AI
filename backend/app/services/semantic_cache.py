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
from backend.app.core.logging import logger

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
        """Pre-warms the cache with authentic Vedic explanations for top queries."""
        pre_seeded = [
            (
                "concept:sade_sati::en::acharya_shastri",
                "Shani Sade Sati is a 7.5-year transit of Saturn across the 12th, 1st, and 2nd houses from your natal Moon sign. "
                "In classical Vedic astrology, it is not a curse but a transformative period of karma clearance, discipline, and grounding. "
                "### Classical Guidance:\n"
                "- **Rising Phase (12th House):** Focus on introspection and foreign affairs.\n"
                "- **Peak Phase (1st House/Moon):** Mental resilience and hard work are rewarded.\n"
                "- **Setting Phase (2nd House):** Family wealth stabilization.\n"
                "Reciting Hanuman Chalisa or Dasharatha Shani Stotram on Saturdays brings peace and clarity."
            ),
            (
                "concept:sade_sati::hi::acharya_shastri",
                "शनि साढ़े साती जन्मकालीन चंद्र राशि से 12वें, 1ले और 2रे भाव में शनिदेव का 7.5 वर्ष का गोचर काल होता है। "
                "वैदिक ज्योतिष में यह कोई अभिशाप नहीं, बल्कि आत्म-शुद्धि, धैर्य और कर्म-शोधन का अत्यंत फलदायी समय है।\n\n"
                "### मुख्य चरण एवं समाधान:\n"
                "- **उदय चरण:** चिंतन और अनावश्यक व्यय से बचना।\n"
                "- **शिखर चरण:** मानसिक शांति और निरंतर परिश्रम।\n"
                "- **अस्त चरण:** पारिवारिक संतुलन और आर्थिक स्थिरता।\n"
                "प्रति शनिवार पीपल वृक्ष पर जल अर्पण, हनुमान चालीसा का पाठ और जरूरतमंदों की सेवा से शनिदेव की असीम कृपा प्राप्त होती है।"
            ),
            (
                "concept:sade_sati::hinglish::acharya_shastri",
                "Shani Sade Sati janam kundli mein Moon sign se 12th, 1st aur 2nd house mein Saturn ke 7.5 saal ke transit ko kehte hain. "
                "Vedic Jyotish mein yeh koi darr ka kaal nahi, balki karma shuddhi aur patience seekhne ka waqt hota hai.\n\n"
                "### Classical Guidance:\n"
                "- **Rising Phase:** Unnecessary stress se bachein aur thoughtful decisions lein.\n"
                "- **Peak Phase:** Hard work aur discipline aapko bohot strong banata hai.\n"
                "- **Setting Phase:** Financial stability aur parivaar mein sudhaar hota hai.\n"
                "Shanivaar ko Hanuman Chalisa padhna aur til ka daan karna bohot shubh mana jata hai."
            ),
            (
                "concept:mangal_dosha::en::acharya_shastri",
                "Mangal Dosha (Kuja Dosha) occurs when Mars is placed in the 1st, 4th, 7th, 8th, or 12th house from the Lagna, Moon, or Venus. "
                "It signifies intense energy, dynamic courage, and passion. "
                "According to Brihat Parashara Hora Shastra, numerous cancellations exist (e.g. Mars in Aries, Capricorn, or aspected by benefic Jupiter). "
                "Mutual understanding and respect in partnerships turn this into strong collaborative vitality."
            ),
            (
                "concept:mangal_dosha::hi::acharya_shastri",
                "मंगल दोष (कुज दोष) तब बनता है जब लग्न, चंद्र या शुक्र से मंगल 1, 4, 7, 8 या 12वें भाव में स्थित हो। "
                "यह दोष व्यक्ति में अत्यधिक ऊर्जा, साहस और स्पष्टवादिता का प्रतीक है। "
                "महर्षि पराशर के अनुसार मंगल यदि अपनी स्वराशि (मेष/वृश्चिक) या उच्च (मकर) में हो, तो दोष स्वतः निष्प्रभावी हो जाता है। "
                "सुंदरकांड का पाठ और मंगलवार को लाल दाल का दान शास्त्रीय दृष्टि से कल्याणकारी है।"
            ),
            (
                "concept:gajakesari_yoga::en::acharya_shastri",
                "Gajakesari Yoga is formed when Jupiter (Guru) is in a Kendra (1st, 4th, 7th, or 10th house) from the Moon, and free from debility or severe affliction. "
                "In classical Phaladeepika, it bestows lasting wisdom, royal honor, virtuous intellect, and steadfast prosperity."
            ),
            (
                "concept:gajakesari_yoga::hi::acharya_shastri",
                "गजकेसरी योग देवगुरु बृहस्पति और चंद्रमा के केंद्र संबंध (1, 4, 7 या 10वें भाव) से निर्मित होता है। "
                "फलदीपिका एवं सारावली के अनुसार यह योग जातक को गज (हाथी) के समान गरिमा और केसरी (सिंह) के समान अदम्य आत्मविश्वास, विद्या और अखंड यश प्रदान करता है।"
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
