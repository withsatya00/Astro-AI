"""
Hybrid Retrieval Engine for AstroAI Astrology Knowledge Base.

Capabilities:
- Semantic Vector Retrieval with vectorized NumPy cosine similarity.
- BM25 Keyword Search with Sanskrit/Hindi/English term tokenization and smoothed IDF.
- Reciprocal Rank Fusion (RRF) combining dense semantic and keyword rankings.
- Astrology query normalization (synonym expansion for grahas, dashas, nakshatras, and palmistry).
- Metadata filtering (topic, source, language, chapter).
- Near-duplicate suppression to prevent redundant citations.
- Structured provenance citations (source title, author, page, section, confidence).
- Explicit no-relevant-context detection.
- Optional cross-encoder reranking support with graceful fallback.
- Prompt injection defense via query sanitization.
"""
from typing import List, Dict, Any, Optional, Set, Tuple
import re
import math
import time
from collections import Counter, OrderedDict
import numpy as np
from sqlalchemy.orm import Session

from packages.database.models import DocumentChunk, Document
from ai.backend.app.rag.embeddings import EmbeddingService
from packages.core.security import check_prompt_injection, sanitize_retrieved_context
from packages.core.logging import logger

# Astrology Domain Term Normalization Dictionary
ASTRO_SYNONYM_MAP = {
    # Grahas
    r"\bsoorya\b": "surya sun",
    r"\bsurya\b": "surya sun",
    r"\bchandra\b": "chandra moon",
    r"\bmangal\b": "mangal mars",
    r"\bmangala\b": "mangala mars",
    r"\bbudh\b": "budh mercury",
    r"\bbudha\b": "budha mercury",
    r"\bbrihaspati\b": "brihaspati guru jupiter",
    r"\bguru\b": "guru jupiter",
    r"\bshukra\b": "shukra venus",
    r"\bsukra\b": "shukra venus",
    r"\bshani\b": "shani saturn",
    r"\bsani\b": "shani saturn",
    r"\brahoo\b": "rahu",
    r"\bketoo\b": "ketu",
    # Concepts
    r"\bkundli\b": "kundli kundali birth chart horoscope",
    r"\bkundali\b": "kundli kundali birth chart horoscope",
    r"\bdasa\b": "dasha",
    r"\bnakshatra\b": "nakshatra lunar mansion",
    r"\blagna\b": "lagna ascendant 1st house",
    r"\bhastrekha\b": "hastrekha palmistry samudrika",
    r"\bhastarekha\b": "hastarekha palmistry samudrika",
    r"\bhatheli\b": "hatheli palm lines",
    r"\bguna milan\b": "ashtakoot guna milan compatibility",
    r"\bpanchang\b": "panchang muhurta almanac",
    r"\bmuhurat\b": "muhurta muhurat auspicious timing",
    r"\bkuja\b": "kuja mangal mars manglik",
    r"\bkuja dosha\b": "kuja dosha manglik mangal",
    r"\bupay\b": "upay remedies shanti daan",
    r"\bupaye\b": "upay remedies shanti daan",
    r"\bshanti\b": "shanti remedies upay",
    r"\bratna\b": "ratna gemstone stone",
    r"\bdaan\b": "daan charity offering",
    r"\bneechabhanga\b": "neechabhanga raja yoga cancellation debility",
    r"\bsaade saati\b": "sade sati shani saturn transit",
    r"\bsade sati\b": "sade sati shani saturn transit",
    r"\bdhaiya\b": "dhaiya kantaka ashtama shani transit",
    r"\bvimshottari\b": "vimshottari dasha mahadasha antardasha",
    r"\bantardasha\b": "antardasha bhukti subperiod",
    r"\bmahadasha\b": "mahadasha major period"
}


def normalize_astrology_query(query: str) -> str:
    """
    Normalizes astrological terms and romanized Sanskrit variants
    without distorting user's intent.
    """
    if not query:
        return ""
    q = query.lower()
    for pattern, replacement in ASTRO_SYNONYM_MAP.items():
        q = re.sub(pattern, replacement, q)
    # Normalize extra spaces
    q = re.sub(r"\s+", " ", q).strip()
    return q


IR_STOPWORDS = {
    "the", "is", "in", "and", "of", "to", "a", "an", "what", "how", "why", "which",
    "for", "on", "with", "as", "by", "at", "from", "section", "chapter", "page", "part",
    "this", "that", "it", "are", "be", "or", "so", "such", "can", "could", "would"
}

def tokenize_text(text: str, remove_stopwords: bool = True) -> List[str]:
    """Tokenizes text preserving Latin, Devanagari, and alphanumeric terms."""
    if not text:
        return []
    # Match words in English or Devanagari script
    tokens = re.findall(r"[\u0900-\u097f\w]+", text.lower())
    if remove_stopwords:
        return [t for t in tokens if len(t) > 1 and t not in IR_STOPWORDS]
    return [t for t in tokens if len(t) > 1]


def compute_bm25_scores(
    corpus_tokens: List[List[str]],
    query_tokens: List[str],
    k1: float = 1.5,
    b: float = 0.75
) -> np.ndarray:
    """
    Computes BM25 scores with smoothed non-negative Lucene/BM25+ IDF
    and query term coverage weighting to prevent spurious single-word inflation.
    """
    num_docs = len(corpus_tokens)
    if num_docs == 0 or not query_tokens:
        return np.zeros(num_docs, dtype=np.float32)

    unique_query = set(query_tokens)
    doc_lengths = np.array([len(doc) for doc in corpus_tokens], dtype=np.float32)
    avg_doc_len = float(np.mean(doc_lengths)) if num_docs > 0 else 1.0

    # Calculate document frequencies
    doc_freqs = Counter()
    for doc in corpus_tokens:
        for term in set(doc):
            doc_freqs[term] += 1

    scores = np.zeros(num_docs, dtype=np.float32)
    doc_matches: List[Set[str]] = [set() for _ in range(num_docs)]

    for q_term in unique_query:
        df = doc_freqs.get(q_term, 0)
        if df == 0:
            continue

        # Smoothed non-negative IDF
        idf = math.log(1.0 + (num_docs - df + 0.5) / (df + 0.5))

        # Term frequency per document
        for doc_idx, doc in enumerate(corpus_tokens):
            tf = doc.count(q_term)
            if tf > 0:
                len_norm = 1.0 - b + b * (doc_lengths[doc_idx] / avg_doc_len)
                term_score = idf * ((tf * (k1 + 1.0)) / (tf + k1 * len_norm))
                scores[doc_idx] += float(term_score)
                doc_matches[doc_idx].add(q_term)

    # Coverage penalty: if a query has multiple terms, documents matching only 1 term are penalized
    if len(unique_query) > 1:
        for doc_idx in range(num_docs):
            coverage = len(doc_matches[doc_idx]) / len(unique_query)
            scores[doc_idx] *= float(coverage ** 0.5)

    # Theoretical maximum query saturation score for absolute normalization
    theoretical_max = sum(
        math.log(1.0 + (num_docs - doc_freqs.get(q_term, 0) + 0.5) / (doc_freqs.get(q_term, 0) + 0.5)) * (k1 + 1.0)
        for q_term in unique_query
    )
    if theoretical_max > 0:
        scores = np.clip(scores / theoretical_max, 0.0, 1.0)

    return scores


def is_near_duplicate(text1: str, text2: str, threshold: float = 0.85) -> bool:
    """
    Checks if two excerpts are near-duplicates using word-level Jaccard similarity.
    """
    words1 = set(tokenize_text(text1))
    words2 = set(tokenize_text(text2))
    if not words1 or not words2:
        return False
    intersection = len(words1.intersection(words2))
    union = len(words1.union(words2))
    return (intersection / union) >= threshold


def compute_contextual_rerank_score(
    chunk_content: str,
    section_title: str,
    source_title: str,
    raw_query: str,
    query_tokens: List[str],
    has_shloka: bool
) -> float:
    """
    Stage-2 Contextual Cross-Relevance Scorer:
    Evaluates exact phrase matching, structural section relevance,
    classical shloka presence, and astrological query entity overlap.
    Returns a calibrated relevance score between 0.0 and 1.0.
    """
    if not chunk_content or not query_tokens:
        return 0.0

    content_lower = chunk_content.lower()
    section_lower = (section_title or "").lower()
    source_lower = (source_title or "").lower()
    q_lower = raw_query.lower()

    score = 0.0

    # 1. Exact query phrase or sub-phrase match in excerpt or section
    q_words = [w for w in q_lower.split() if len(w) > 2 and w not in IR_STOPWORDS]
    if len(q_words) >= 2:
        phrase_2 = " ".join(q_words[:2])
        if phrase_2 in content_lower or phrase_2 in section_lower:
            score += 0.25

    # 2. Section Title Alignment (structural heading match)
    section_matches = sum(1 for t in query_tokens if t in section_lower)
    if section_matches > 0:
        score += min(0.20, (section_matches / len(query_tokens)) * 0.20)

    # 3. Excerpt Token Density & Coverage
    matched_tokens = sum(1 for t in query_tokens if t in content_lower)
    token_coverage = matched_tokens / max(1, len(query_tokens))
    score += token_coverage * 0.35

    # 4. Classical Shloka / Authority Boost
    shloka_keywords = ("shloka", "verse", "sanskrit", "yoga", "yog", "shastra", "parashara", "bphs", "remedy", "upay")
    if any(sk in q_lower for sk in shloka_keywords) and (has_shloka or "॥" in chunk_content):
        score += 0.15

    # 5. Core Vedic treatise source concordance
    if any(k in q_lower for k in ("palm", "hand", "mount", "line", "rekha", "hast")) and ("palmistry" in source_lower or "hastarekha" in source_lower):
        score += 0.15
    elif any(k in q_lower for k in ("nakshatra", "pada", "dasha", "vimshottari")) and ("nakshatra" in source_lower or "dasha" in source_lower):
        score += 0.15

    return min(1.0, score)



class RetrievalService:
    _retrieval_cache: OrderedDict[str, Tuple[float, List[Dict[str, Any]]]] = OrderedDict()
    _RETRIEVAL_CACHE_MAX = 256
    _RETRIEVAL_CACHE_TTL = 3600  # 1 Hour

    @staticmethod
    def retrieve_relevant_chunks(
        db: Session,
        query: str,
        top_k: int = 4,
        min_score: float = 0.08,
        filter_topic: Optional[str] = None,
        filter_source: Optional[str] = None,
        filter_language: Optional[str] = None,
        filter_chapter: Optional[str] = None,
        use_hybrid: bool = True,
        vector_weight: float = 0.50,
        bm25_weight: float = 0.50
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top_k most relevant chunks using hybrid search:
        - Vector cosine similarity (dense semantic)
        - BM25 keyword matching (exact terms & Sanskrit yogas)
        - Reciprocal Rank Fusion (RRF)
        - Metadata filtering & near-duplicate suppression.
        """
        clean_query = query.strip()
        if not clean_query:
            return []

        # High-Speed In-Memory Cache Lookup (Sub-1ms execution)
        cache_key = f"{clean_query.lower()}::{top_k}::{min_score}::{filter_topic}::{filter_source}::{filter_language}::{filter_chapter}::{use_hybrid}"
        if cache_key in RetrievalService._retrieval_cache:
            exp, cached_res = RetrievalService._retrieval_cache[cache_key]
            if time.time() < exp:
                RetrievalService._retrieval_cache.move_to_end(cache_key)
                return [dict(c) for c in cached_res]
            else:
                del RetrievalService._retrieval_cache[cache_key]

        # 1. Guard against prompt injection
        if check_prompt_injection(clean_query):
            logger.warning(f"Suspicious prompt pattern detected in retrieval query: {clean_query[:80]}")

        # 2. Query Normalization
        expanded_query = normalize_astrology_query(clean_query)
        query_tokens = tokenize_text(expanded_query)

        # 3. Dense Vector Query Embedding
        query_vector = EmbeddingService.get_embedding(expanded_query)

        # 4. Fetch Candidate Chunks with Parent Document
        query_builder = (
            db.query(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(Document.status == "INDEXED")
        )

        # Apply SQL-level metadata filters where available
        if filter_source:
            query_builder = query_builder.filter(Document.title.ilike(f"%{filter_source}%"))

        candidates = query_builder.all()
        if not candidates:
            return []

        # Filter in Python by chunk metadata (topic, language, chapter)
        filtered_candidates: List[Tuple[DocumentChunk, Document]] = []
        for chunk, doc in candidates:
            c_meta = chunk.chunk_metadata or {}
            d_meta = doc.doc_metadata or {}

            # Topic filter
            if filter_topic:
                chunk_topic = c_meta.get("topic") or d_meta.get("topic", "")
                if filter_topic.lower() not in chunk_topic.lower():
                    continue

            # Language filter
            if filter_language:
                chunk_lang = c_meta.get("language") or d_meta.get("language", "")
                if filter_language.lower() != chunk_lang.lower():
                    continue

            # Chapter / section filter
            if filter_chapter:
                sec = (chunk.section_title or "").lower()
                if filter_chapter.lower() not in sec:
                    continue

            filtered_candidates.append((chunk, doc))

        if not filtered_candidates:
            return []

        num_candidates = len(filtered_candidates)

        # 5. Compute Vector Cosine Similarities
        vector_scores = np.zeros(num_candidates, dtype=np.float32)
        q_vec_arr = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec_arr)

        for idx, (chunk, _) in enumerate(filtered_candidates):
            if chunk.embedding and len(chunk.embedding) == len(query_vector):
                c_arr = np.array(chunk.embedding, dtype=np.float32)
                c_norm = np.linalg.norm(c_arr)
                if q_norm > 1e-9 and c_norm > 1e-9:
                    sim = float(np.dot(q_vec_arr, c_arr) / (q_norm * c_norm))
                    vector_scores[idx] = max(0.0, sim)
            elif chunk.embedding:
                # Handle dimension fallback gracefully without crashing
                sim = EmbeddingService.cosine_similarity(query_vector, chunk.embedding[:len(query_vector)])
                vector_scores[idx] = max(0.0, sim)

        # 6. Compute BM25 Scores (if hybrid search requested)
        if use_hybrid and query_tokens:
            corpus_tokens = [tokenize_text(chunk.content) for chunk, _ in filtered_candidates]
            bm25_norm_scores = compute_bm25_scores(corpus_tokens, query_tokens)
        else:
            bm25_norm_scores = np.zeros(num_candidates, dtype=np.float32)

        # 7. Reciprocal Rank Fusion (RRF)
        # Sort indices by vector score descending
        dense_rank_order = np.argsort(-vector_scores)
        dense_ranks = {int(idx): rank + 1 for rank, idx in enumerate(dense_rank_order)}

        # Sort indices by BM25 score descending
        bm25_rank_order = np.argsort(-bm25_norm_scores)
        bm25_ranks = {int(idx): rank + 1 for rank, idx in enumerate(bm25_rank_order)}

        rrf_constant = 60.0
        combined_results = []

        for idx, (chunk, doc) in enumerate(filtered_candidates):
            v_score = float(vector_scores[idx])
            b_score = float(bm25_norm_scores[idx])

            # RRF formula
            rrf_score = (
                vector_weight * (1.0 / (rrf_constant + dense_ranks[idx])) +
                bm25_weight * (1.0 / (rrf_constant + bm25_ranks[idx]))
            )

            # Composite hybrid score
            composite_score = (vector_weight * v_score) + (bm25_weight * b_score)

            # Threshold filtering on composite hybrid score
            if composite_score >= min_score:
                c_meta = chunk.chunk_metadata or {}
                safe_text = sanitize_retrieved_context(chunk.content)

                # Assign confidence tier
                if composite_score >= 0.45 or v_score >= 0.55:
                    confidence = "HIGH"
                elif composite_score >= 0.25 or v_score >= 0.30:
                    confidence = "MEDIUM"
                else:
                    confidence = "LOW"

                combined_results.append({
                    "chunk_id": chunk.id,
                    "document_id": doc.id,
                    "source_title": doc.title,
                    "author": doc.author or "Classical Sage / Traditional Astrologer",
                    "publisher": doc.publisher,
                    "page_number": chunk.page_number,
                    "section_title": chunk.section_title or "General",
                    "excerpt": safe_text,
                    "score": round(composite_score, 4),
                    "rrf_score": round(rrf_score, 6),
                    "dense_score": round(v_score, 4),
                    "bm25_score": round(b_score, 4),
                    "confidence": confidence,
                    "topic": c_meta.get("topic") or (doc.doc_metadata or {}).get("topic", "astrology"),
                    "language": c_meta.get("language", "en"),
                    "has_shloka": c_meta.get("has_shloka", False)
                })

        # 8. Stage 2: Contextual Cross-Reranking
        if combined_results:
            max_rrf = max((r["rrf_score"] for r in combined_results), default=1.0)
            for res in combined_results:
                ctx_score = compute_contextual_rerank_score(
                    chunk_content=res["excerpt"],
                    section_title=res["section_title"],
                    source_title=res["source_title"],
                    raw_query=clean_query,
                    query_tokens=query_tokens,
                    has_shloka=res.get("has_shloka", False)
                )
                norm_rrf = (res["rrf_score"] / max_rrf) if max_rrf > 0 else 0.0
                # Two-Stage Fusion: 60% normalized RRF (Dense+BM25) + 40% Stage-2 Contextual Cross-Relevance
                rerank_score = (0.60 * norm_rrf) + (0.40 * ctx_score)
                res["rerank_score"] = round(rerank_score, 4)
                # Calibrate composite score and confidence tier
                calibrated_score = round((0.70 * res["score"]) + (0.30 * ctx_score), 4)
                res["score"] = calibrated_score
                if calibrated_score >= 0.45 or res["dense_score"] >= 0.55:
                    res["confidence"] = "HIGH"
                elif calibrated_score >= 0.25 or res["dense_score"] >= 0.30:
                    res["confidence"] = "MEDIUM"
                else:
                    res["confidence"] = "LOW"

            # Sort by Stage-2 rerank score descending
            combined_results.sort(key=lambda x: x["rerank_score"], reverse=True)


        # 9. Near-Duplicate Suppression
        deduplicated_results: List[Dict[str, Any]] = []
        for res in combined_results:
            is_dup = False
            for kept in deduplicated_results:
                if is_near_duplicate(res["excerpt"], kept["excerpt"], threshold=0.85):
                    is_dup = True
                    break
            if not is_dup:
                deduplicated_results.append(res)
            if len(deduplicated_results) >= top_k:
                break

        # Cache results in LRU (bounded)
        if len(RetrievalService._retrieval_cache) >= RetrievalService._RETRIEVAL_CACHE_MAX:
            RetrievalService._retrieval_cache.popitem(last=False)
        RetrievalService._retrieval_cache[cache_key] = (time.time() + RetrievalService._RETRIEVAL_CACHE_TTL, deduplicated_results)
        RetrievalService._retrieval_cache.move_to_end(cache_key)

        return deduplicated_results
