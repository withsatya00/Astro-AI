"""
Vector and semantic retrieval engine for astrology knowledge base.
Provides citation provenance and prompt injection defense for retrieved contexts.
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.models.models import DocumentChunk, Document
from backend.app.rag.embeddings import EmbeddingService
from backend.app.core.security import check_prompt_injection, sanitize_retrieved_context
from backend.app.core.logging import logger

class RetrievalService:
    @staticmethod
    def retrieve_relevant_chunks(
        db: Session,
        query: str,
        top_k: int = 4,
        min_score: float = 0.12
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top_k most relevant chunks matching the query across all indexed documents.
        Computes cosine similarity between query embedding and indexed chunk embeddings.
        """
        # Guard against prompt injection in user query
        is_injection = check_prompt_injection(query)
        if is_injection:
            logger.warning(f"Suspicious prompt pattern detected in retrieval query: {query[:80]}")

        query_vector = EmbeddingService.get_embedding(query)

        # Query all indexed chunks with their parent document
        chunks = (
            db.query(DocumentChunk, Document)
            .join(Document, DocumentChunk.document_id == Document.id)
            .filter(Document.status == "INDEXED")
            .all()
        )

        scored_results = []
        for chunk, doc in chunks:
            if not chunk.embedding:
                continue

            sim = EmbeddingService.cosine_similarity(query_vector, chunk.embedding)
            if sim >= min_score:
                safe_text = sanitize_retrieved_context(chunk.content)
                scored_results.append({
                    "chunk_id": chunk.id,
                    "document_id": doc.id,
                    "source_title": doc.title,
                    "author": doc.author or "Classical Sage / Traditional Astrologer",
                    "publisher": doc.publisher,
                    "page_number": chunk.page_number,
                    "section_title": chunk.section_title,
                    "excerpt": safe_text,
                    "score": round(sim, 4)
                })

        # Sort by similarity score descending
        scored_results.sort(key=lambda x: x["score"], reverse=True)
        top_results = scored_results[:top_k]

        return top_results
