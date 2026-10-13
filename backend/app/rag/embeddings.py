"""
Embeddings generation service for AstroAI Agent.
Supports Google GenAI embeddings (text-embedding-004) and local fallback vectorizer.
"""
from typing import List
import math
import hashlib
import re
from backend.app.core.config import settings
from backend.app.core.logging import logger

def _generate_local_vector(text: str, dim: int = 64) -> List[float]:
    """
    Generates a deterministic normalized dense vector using character n-grams and hashing.
    Ensures semantic search functions completely offline and in demo mode.
    """
    clean = re.sub(r"[^\w\s]", "", text.lower())
    words = clean.split()
    vector = [0.0] * dim

    if not words:
        return vector

    # Weight word unigrams and bigrams
    tokens = words + [f"{words[i]}_{words[i+1]}" for i in range(len(words)-1)]
    for token in tokens:
        h = int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16)
        idx = h % dim
        sign = 1.0 if ((h >> 8) % 2 == 0) else -1.0
        vector[idx] += sign

    # L2 normalize
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0.0:
        vector = [round(x / norm, 6) for x in vector]
    return vector

class EmbeddingService:
    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """
        Generates embedding for a string using Google GenAI SDK if configured,
        otherwise falls back to deterministic local dense embedding.
        """
        if settings.is_demo_mode:
            return _generate_local_vector(text)

        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.embed_content(
                model=settings.EMBEDDING_MODEL,
                contents=text
            )
            # Response contains embedding values
            if hasattr(response, "embedding") and hasattr(response.embedding, "values"):
                return [round(float(v), 6) for v in response.embedding.values]
            elif hasattr(response, "embeddings") and response.embeddings:
                return [round(float(v), 6) for v in response.embeddings[0].values]
            else:
                return _generate_local_vector(text)
        except Exception as e:
            logger.warning(f"Google GenAI embedding failed ({e}), using local vector fallback.")
            return _generate_local_vector(text)

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Computes cosine similarity between two float vectors."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        dot = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))
        if norm1 <= 0.0 or norm2 <= 0.0:
            return 0.0
        return dot / (norm1 * norm2)
