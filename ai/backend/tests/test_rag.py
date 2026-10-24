"""
Unit tests for RAG chunking, embeddings, and retrieval.
"""
import pytest
from ai.backend.app.rag.chunking import clean_text, chunk_document_text
from ai.backend.app.rag.embeddings import EmbeddingService
from ai.backend.app.rag.retrieval import RetrievalService
from packages.database.session import SessionLocal

def test_clean_text():
    raw = "Hello   world!\r\n\r\nTest text."
    cleaned = clean_text(raw)
    assert "Hello world!" in cleaned
    assert "Test text." in cleaned

def test_chunking():
    pages = [{"page_number": 1, "text": "Section 1\nThis is paragraph one.\nThis is paragraph two."}]
    chunks = chunk_document_text(pages, chunk_size=30, chunk_overlap=10)
    assert len(chunks) > 0
    assert chunks[0]["page_number"] == 1

def test_embeddings_and_retrieval():
    v1 = EmbeddingService.get_embedding("Surya represents the soul and vitality")
    v2 = EmbeddingService.get_embedding("Sun represents vitality and self")
    sim = EmbeddingService.cosine_similarity(v1, v2)
    assert sim > 0.0

    db = SessionLocal()
    try:
        hits = RetrievalService.retrieve_relevant_chunks(db, "Surya Sun vitality", top_k=2)
        assert len(hits) > 0
        assert "source_title" in hits[0]
        assert "excerpt" in hits[0]
    finally:
        db.close()
