"""
Comprehensive Regression and Quality Assurance Test Suite for AstroAI RAG Subsystem.

Tests:
- Unicode, Devanagari, and Sanskrit Shloka text cleaning and grouping.
- Table preservation and strict recursive chunk boundary splitting.
- Stable chunk ID reproducibility.
- Normalized embedding generation, vector dimension safety, and query caching.
- Vector semantic retrieval, BM25 keyword retrieval, and Hybrid RRF fusion.
- Metadata filtering (topic, source, chapter, language).
- Query normalization and near-duplicate suppression.
- Ingestion idempotency, dry-run simulation, and atomic document updates.
- Index consistency checker and source manifest verification.
- Quantitative Information Retrieval Evaluation (Recall@k, MRR@k, nDCG@k, Latency).
"""
import pytest
import math
import numpy as np
import time
from pathlib import Path
from sqlalchemy.orm import Session

from backend.app.db.session import SessionLocal, init_db
from backend.app.models.models import Document, DocumentChunk
from backend.app.rag.chunking import (
    clean_text,
    chunk_document_text,
    is_shloka_or_verse,
    is_table_block,
    split_text_strictly,
    generate_stable_chunk_id,
    detect_language
)
from backend.app.rag.embeddings import EmbeddingService, _generate_local_vector, _normalize_l2
from backend.app.rag.retrieval import (
    RetrievalService,
    normalize_astrology_query,
    tokenize_text,
    compute_bm25_scores,
    is_near_duplicate
)
from backend.app.rag.ingestion import IngestionPipeline, compute_sha256
from backend.app.rag.knowledge_tools import (
    check_index_consistency,
    validate_source_manifest,
    get_document_inventory,
    get_knowledge_statistics
)


# ==========================================
# 1. CHUNKING & TEXT NORMALIZATION TESTS
# ==========================================

def test_clean_text_unicode_and_sanskrit():
    raw = "  ॐ नमः शिवाय! \r\n\r\nग्रहाः   सूर्यश्चन्द्रो  मङ्गलश्च ॥ १ ॥ \x00\x08  "
    cleaned = clean_text(raw)
    assert "ॐ नमः शिवाय!" in cleaned
    assert "ग्रहाः सूर्यश्चन्द्रो मङ्गलश्च ॥ १ ॥" in cleaned
    assert "\x00" not in cleaned
    assert "\r" not in cleaned
    assert "   " not in cleaned


def test_shloka_and_verse_detection():
    shloka_1 = "ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात् ॥"
    shloka_2 = "Shloka 1.2: Ravir atma manash chandrah satvam kujah."
    prose = "The Sun represents the soul and vitality in classical Indian astrology."
    assert is_shloka_or_verse(shloka_1) is True
    assert is_shloka_or_verse(shloka_2) is True
    assert is_shloka_or_verse(prose) is False


def test_table_preservation():
    table = "| Graha | Sign | Exaltation |\n|---|---|---|\n| Surya | Mesha | 10° |"
    assert is_table_block(table) is True
    prose = "This is simply text discussing planetary tables."
    assert is_table_block(prose) is False


def test_shloka_grouped_with_translation():
    pages = [{
        "page_number": 1,
        "text": (
            "## Chapter 1: Sacred Shloka\n\n"
            "गुरूर्ब्रह्मा गुरूर्विष्णुः गुरूदेवो महेश्वरः ।\n"
            "गुरूः साक्षात् परं ब्रह्म तस्मै श्री गुरवे नमः ॥\n\n"
            "Translation: Guru is Brahma, Guru is Vishnu, Guru is Shiva. "
            "Salutations to the Supreme Guru who removes darkness.\n\n"
            "Follow-up explanation detailing the role of Jupiter as Brihaspati."
        )
    }]
    chunks = chunk_document_text(pages, chunk_size=500, chunk_overlap=80)
    assert len(chunks) > 0
    # First chunk should contain both shloka and translation
    first_chunk = chunks[0]
    assert "गुरूर्ब्रह्मा" in first_chunk["content"]
    assert "Translation:" in first_chunk["content"]
    assert first_chunk["has_shloka"] is True
    assert first_chunk["section_title"] == "Chapter 1: Sacred Shloka"


def test_oversized_text_deterministic_splitting():
    oversized = "A" * 1500
    slices = split_text_strictly(oversized, max_chars=400, overlap_chars=50)
    assert len(slices) >= 4
    for s in slices:
        assert len(s) <= 400


def test_stable_chunk_ids():
    id1 = generate_stable_chunk_id("doc_123", 0, "Surya represents vitality and leadership.")
    id2 = generate_stable_chunk_id("doc_123", 0, "Surya represents vitality and leadership.")
    id3 = generate_stable_chunk_id("doc_123", 1, "Chandra represents the mind.")
    assert id1 == id2
    assert id1 != id3
    assert id1.startswith("chk_")


# ==========================================
# 2. EMBEDDINGS & VECTOR SAFETY TESTS
# ==========================================

def test_l2_normalization_and_dimension():
    vec = [1.0, 2.0, 3.0, 4.0]
    norm_vec = _normalize_l2(vec)
    arr = np.array(norm_vec, dtype=np.float32)
    assert abs(np.linalg.norm(arr) - 1.0) < 1e-4

    local_vec = _generate_local_vector("Vedic astrology foundations", dim=64)
    assert len(local_vec) == 64
    assert abs(np.linalg.norm(np.array(local_vec)) - 1.0) < 1e-4


def test_embedding_batching_and_cache():
    texts = [
        "Surya is the significator of father and soul.",
        "Chandra governs the emotional mind and mother.",
        "Mangala confers physical courage and technical skills."
    ]
    batch_embeddings = EmbeddingService.get_embeddings_batch(texts, batch_size=2)
    assert len(batch_embeddings) == 3
    assert len(batch_embeddings[0]) == EmbeddingService.get_expected_dimension()

    # Query caching test
    emb1 = EmbeddingService.get_embedding("Gajakesari Yoga significance")
    emb2 = EmbeddingService.get_embedding("Gajakesari Yoga significance")
    assert emb1 == emb2


# ==========================================
# 3. HYBRID RETRIEVAL & RANKING TESTS
# ==========================================

def test_query_normalization():
    q = "What is the dasha of soorya and sani in my kundli?"
    normalized = normalize_astrology_query(q)
    assert "surya" in normalized
    assert "sun" in normalized
    assert "shani" in normalized
    assert "saturn" in normalized
    assert "kundali" in normalized


def test_near_duplicate_detection():
    t1 = "The Moon is exalted in Taurus 3 degrees and debilitated in Scorpio 3 degrees."
    t2 = "The Moon is exalted in Taurus at 3 degrees and debilitated in Scorpio at 3 degrees."
    t3 = "Saturn represents karma, discipline, duty, and longevity in Capricorn."
    assert is_near_duplicate(t1, t2, threshold=0.8) is True
    assert is_near_duplicate(t1, t3, threshold=0.5) is False


def test_bm25_keyword_scoring():
    corpus = [
        ["surya", "sun", "vitality", "atman", "father"],
        ["gajakesari", "yoga", "jupiter", "moon", "kendra", "elephant"],
        ["shani", "saturn", "sade", "sati", "transit", "karma"]
    ]
    scores = compute_bm25_scores(corpus, ["gajakesari", "yoga"])
    assert scores[1] > scores[0]
    assert scores[1] > scores[2]


def test_hybrid_retrieval_execution():
    db = SessionLocal()
    try:
        # Search for exact yoga term
        hits = RetrievalService.retrieve_relevant_chunks(
            db=db,
            query="Gajakesari Yoga Jupiter and Moon in Kendra",
            top_k=3,
            use_hybrid=True
        )
        assert len(hits) > 0
        assert "Gajakesari" in hits[0]["excerpt"] or "Jupiter" in hits[0]["excerpt"]
        assert "source_title" in hits[0]
        assert "score" in hits[0]
        assert "confidence" in hits[0]
    finally:
        db.close()


def test_metadata_filtering():
    db = SessionLocal()
    try:
        # Filter specifically by palmistry topic
        palm_hits = RetrievalService.retrieve_relevant_chunks(
            db=db,
            query="Life line vitality and mounts",
            top_k=3,
            filter_topic="palmistry"
        )
        assert len(palm_hits) > 0
        for h in palm_hits:
            assert h["topic"] == "palmistry"
            assert "Palmistry" in h["source_title"] or "Hastarekha" in h["source_title"]
    finally:
        db.close()


def test_no_relevant_context_handling():
    db = SessionLocal()
    try:
        # Query on completely un-astrological topic
        hits = RetrievalService.retrieve_relevant_chunks(
            db=db,
            query="Quantum chromodynamics gluon quark interaction cross section",
            top_k=2,
            min_score=0.35  # Require moderate semantic relevance
        )
        # Should gracefully return empty list for unrelated domain
        assert len(hits) == 0
    finally:
        db.close()


# ==========================================
# 4. INGESTION, IDEMPOTENCY & QUALITY TOOLS
# ==========================================

def test_ingestion_dry_run_simulation():
    db = SessionLocal()
    try:
        sample_path = "documents/sources/vedic_astrology_foundations.md"
        doc, res = IngestionPipeline.process_and_index_file(
            db=db,
            file_path=sample_path,
            dry_run=True,
            force_reindex=True
        )
        assert doc is None
        assert res["status"] == "dry_run_success"
        assert res["chunk_count"] > 0
        assert res["file_size"] > 0
    finally:
        db.close()


def test_source_manifest_verification():
    res = validate_source_manifest()
    assert res["status"] == "success"
    assert res["valid_count"] >= 10
    assert res["missing_file_count"] == 0
    assert res["checksum_mismatch_count"] == 0


def test_database_index_consistency():
    db = SessionLocal()
    try:
        report = check_index_consistency(db)
        assert report["is_consistent"] is True
        assert report["total_documents"] >= 11
        assert report["total_chunks"] >= 100
        assert report["orphan_chunks"] == 0
        assert report["missing_files_on_disk"] == 0
        assert report["dimension_mismatches"] == 0
    finally:
        db.close()


# ==========================================
# 5. QUANTITATIVE IR EVALUATION BENCHMARK
# ==========================================

EVALUATION_DATASET = [
    {
        "query": "Surya Sun significator of soul atman vitality and father",
        "expected_source": [
            "Classical Vedic Astrology: Foundations, Planets, and Houses (Bhavas)",
            "Classical Vedic Astrology: Graha Bhava Phalam (Planets in the Twelve Houses)"
        ],
        "expected_keywords": ["Surya", "vitality", "Atman"]
    },
    {
        "query": "Vimshottari Dasha planetary years for Venus and Rahu mahadasha",
        "expected_source": [
            "The Classical Handbook of Nakshatras and Vimshottari Dasha",
            "Classical Vedic Astrology: Vimshottari Mahadasha and Antardasha Interpretation"
        ],
        "expected_keywords": ["Vimshottari", "Venus", "Rahu"]
    },
    {
        "query": "Samudrika Shastra hand types Earth Air Fire Water palms",
        "expected_source": "Classical Hastarekha & Samudrika Shastra: Complete Vedic Palmistry Guide",
        "expected_keywords": ["Samudrika", "Earth", "Hands"]
    },
    {
        "query": "Gajakesari Yoga Jupiter Kendra from Moon elephant lion majesty",
        "expected_source": "Classical Vedic Astrology: Houses (Bhavas), House Lords, and Yogas",
        "expected_keywords": ["Gajakesari", "Jupiter", "Kendra"]
    },
    {
        "query": "Pancha Mahapurusha Ruchaka Bhadra Hamsa Malavya Sasa yogas",
        "expected_source": [
            "Classical Vedic Astrology: Houses (Bhavas), House Lords, and Yogas",
            "Classical Vedic Astrology: Graha Bhava Phalam (Planets in the Twelve Houses)"
        ],
        "expected_keywords": ["Mahapurusha", "Ruchaka", "Bhadra"]
    },
    {
        "query": "Ashtakoot 36 Guna Milan Nadi Bhakoot Mangal Kuja Dosha",
        "expected_source": "Classical Vedic Astrology: Marriage Compatibility & Ashtakoot Guna Milan",
        "expected_keywords": ["Ashtakoot", "Nadi", "Bhakoot"]
    },
    {
        "query": "D9 Navamsha Vargottama planets dharma marriage fruit",
        "expected_source": "Classical Vedic Astrology: Divisional Charts (Vargas) - D9 Navamsha and D10 Dashamsha",
        "expected_keywords": ["Navamsha", "Vargottama", "Dharma"]
    },
    {
        "query": "Shani Sade Sati three phases Dhaiya from natal Moon",
        "expected_source": "Classical Vedic Astrology: Planetary Transits (Gochar) and Shani Sade Sati",
        "expected_keywords": ["Sade Sati", "Moon", "Saturn"]
    },
    {
        "query": "Panchang Tithi Vaar Nakshatra Yoga Karana Abhijit Muhurta",
        "expected_source": "Classical Vedic Astrology: Panchang and Muhurta (Electional Astrology)",
        "expected_keywords": ["Panch-Anga", "Tithi", "Muhurta"]
    },
    {
        "query": "Prashna Tantra horary astrology Prashna Lagna Ithasala Yoga",
        "expected_source": "Classical Vedic Astrology: Prashna Jyotish (Horary Astrology)",
        "expected_keywords": ["Prashna", "Ithasala", "Lagna"]
    },
    {
        "query": "Vocation 10th house Karma Amatyakaraka Dhana Yoga wealth",
        "expected_source": "Classical Vedic Astrology: Vocation (Karma), Wealth (Dhana), and Education",
        "expected_keywords": ["Karma", "Dhana", "10th"]
    },
    {
        "query": "Planetary exaltation Uchcha debilitation Neecha Mesha Aries Capricorn",
        "expected_source": "Classical Vedic Astrology: Planetary Dignity, Drishti, and Rashis",
        "expected_keywords": ["Exaltation", "Debilitation", "Aries"]
    },
    {
        "query": "Ashwini Nakshatra Pada 1 Mars Navamsha Aries healing Ketu",
        "expected_source": "Classical Vedic Astrology: The 27 Nakshatras and 108 Padas Shastra",
        "expected_keywords": ["Ashwini", "Navamsha", "Pada"]
    },
    {
        "query": "Aditya Hridaya Stotram Sunday Surya Daan wheat ruby copper",
        "expected_source": "Classical Vedic Astrology: Traditional Remedial Measures (Upay, Shanti, Ratna, and Daan)",
        "expected_keywords": ["Aditya", "Daan", "Surya"]
    }
]

def test_quantitative_retrieval_benchmark():
    """
    Executes benchmark queries and computes actual measured Information Retrieval metrics:
    - Recall@1, Recall@3, Recall@5
    - Mean Reciprocal Rank (MRR@5)
    - Normalized Discounted Cumulative Gain (nDCG@5)
    - Mean Latency per query in milliseconds
    """
    db = SessionLocal()
    reciprocal_ranks = []
    recall_at_1 = 0
    recall_at_3 = 0
    recall_at_5 = 0
    ndcg_list = []
    latencies = []

    try:
        for item in EVALUATION_DATASET:
            q = item["query"]
            expected_title = item["expected_source"]
            expected_list = expected_title if isinstance(expected_title, (list, tuple)) else [expected_title]

            t0 = time.time()
            hits = RetrievalService.retrieve_relevant_chunks(
                db=db,
                query=q,
                top_k=5,
                use_hybrid=True
            )
            dur_ms = (time.time() - t0) * 1000.0
            latencies.append(dur_ms)

            # Find rank of expected document
            hit_rank = None
            for idx, h in enumerate(hits):
                if any(exp.lower() in h["source_title"].lower() for exp in expected_list):
                    hit_rank = idx + 1
                    break

            if hit_rank is not None:
                reciprocal_ranks.append(1.0 / hit_rank)
                if hit_rank <= 1:
                    recall_at_1 += 1
                if hit_rank <= 3:
                    recall_at_3 += 1
                if hit_rank <= 5:
                    recall_at_5 += 1
                # DCG = 1 / log2(rank + 1)
                ndcg = 1.0 / math.log2(hit_rank + 1)
                ndcg_list.append(ndcg)
            else:
                reciprocal_ranks.append(0.0)
                ndcg_list.append(0.0)

        total = len(EVALUATION_DATASET)
        mrr = float(np.mean(reciprocal_ranks))
        mean_ndcg = float(np.mean(ndcg_list))
        avg_latency = float(np.mean(latencies))
        r1 = recall_at_1 / total
        r3 = recall_at_3 / total
        r5 = recall_at_5 / total

        print(f"\n==================================================")
        print(f"  QUANTITATIVE RAG BENCHMARK RESULTS ({total} Queries)")
        print(f"==================================================")
        print(f"  Recall@1:  {r1 * 100:.2f}% ({recall_at_1}/{total})")
        print(f"  Recall@3:  {r3 * 100:.2f}% ({recall_at_3}/{total})")
        print(f"  Recall@5:  {r5 * 100:.2f}% ({recall_at_5}/{total})")
        print(f"  MRR@5:     {mrr:.4f}")
        print(f"  nDCG@5:    {mean_ndcg:.4f}")
        print(f"  Avg Latency: {avg_latency:.2f} ms")
        print(f"==================================================\n")

        # Rigorous assertions
        assert r3 >= 0.90, f"Recall@3 should be at least 90%, got {r3}"
        assert mrr >= 0.85, f"MRR@5 should be at least 0.85, got {mrr}"
        assert avg_latency < 50.0, f"Average retrieval latency should be under 50ms, got {avg_latency}ms"

    finally:
        db.close()
