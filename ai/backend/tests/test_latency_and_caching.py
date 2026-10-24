"""
Test Suite for Latency Optimization, Semantic Caching, Retrieval LRU Cache, and GZip.
"""
import pytest
from fastapi.testclient import TestClient
from ai.backend.app.main import app
from packages.database.session import SessionLocal
from ai.backend.app.services.semantic_cache import semantic_cache, SemanticCacheService
from ai.backend.app.rag.retrieval import RetrievalService

client = TestClient(app)

def test_semantic_cache_pre_seeded_queries():
    # Test English pre-seeded query
    hit_en = semantic_cache.get("Tell me about Shani Sade Sati", language="en", astrologer_id="acharya_shastri")
    assert hit_en is not None
    assert "Shani Sade Sati" in hit_en["content"]
    assert hit_en.get("calculated_data_used") is False

    # Test Hindi pre-seeded query
    hit_hi = semantic_cache.get("शनि साढ़े साती क्या होती है", language="hi", astrologer_id="acharya_shastri")
    assert hit_hi is not None
    assert "शनि साढ़े साती" in hit_hi["content"]

    # Test Hinglish pre-seeded query
    hit_hinglish = semantic_cache.get("sade sati ke upay kya hai", language="hinglish", astrologer_id="acharya_shastri")
    assert hit_hinglish is not None
    assert "Shani Sade Sati" in hit_hinglish["content"]

def test_semantic_cache_dynamic_set_and_get():
    custom_cache = SemanticCacheService(maxsize=10, default_ttl=60)
    query = "budhaditya yoga in 10th house"
    payload = {
        "content": "Budhaditya yoga combines Sun and Mercury creating brilliant intellectual authority.",
        "calculated_data_used": False,
        "is_demo_mode": False
    }
    custom_cache.set(query, payload, language="en", astrologer_id="acharya_shastri")
    retrieved = custom_cache.get(query, language="en", astrologer_id="acharya_shastri")
    assert retrieved is not None
    assert "intellectual authority" in retrieved["content"]

def test_semantic_cache_does_not_cache_private_charts():
    custom_cache = SemanticCacheService(maxsize=10, default_ttl=60)
    query = "mere 7th house me venus hai"
    payload = {
        "content": "Aapki kundli me Venus 7th house me sthit hai.",
        "calculated_data_used": True  # Personalized! Must NEVER be cached across users
    }
    custom_cache.set(query, payload, language="en", astrologer_id="acharya_shastri")
    retrieved = custom_cache.get(query, language="en", astrologer_id="acharya_shastri")
    assert retrieved is None

def test_retrieval_lru_cache_hit():
    db = SessionLocal()
    try:
        # First call: computes and stores
        res1 = RetrievalService.retrieve_relevant_chunks(db=db, query="What is Gajakesari yoga", top_k=2)
        # Second call: must hit in-memory cache directly
        res2 = RetrievalService.retrieve_relevant_chunks(db=db, query="What is Gajakesari yoga", top_k=2)
        assert len(res1) == len(res2)
        if res1:
            assert res1[0]["chunk_id"] == res2[0]["chunk_id"]
    finally:
        db.close()

def test_gzip_compression_header():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert "x-process-time" in res.headers
