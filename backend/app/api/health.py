"""
Health and readiness check endpoints for AstroAI Agent.
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.core.config import settings
from backend.app.db.session import get_db
from backend.app.schemas.schemas import HealthResponse, ReadinessResponse
from backend.app.models.models import Document
import swisseph as swe

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    """Liveness probe returning application metadata and demo mode state."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        app_name=settings.APP_NAME,
        environment=settings.APP_ENV,
        demo_mode=settings.is_demo_mode,
        timestamp=datetime.now(timezone.utc)
    )

@router.get("/readiness", response_model=ReadinessResponse)
def readiness_check(db: Session = Depends(get_db)):
    """
    Readiness probe validating database connectivity, Swiss Ephemeris engine,
    and knowledge base indexing status.
    """
    components = {}

    # 1. Database check
    try:
        db.execute(text("SELECT 1"))
        components["database"] = {"status": "healthy", "details": settings.DATABASE_URL.split("///")[0]}
    except Exception as e:
        components["database"] = {"status": "unhealthy", "details": str(e)}

    # 2. Swiss Ephemeris check
    try:
        ver = swe.version
        components["astrology_engine"] = {"status": "healthy", "details": f"Swiss Ephemeris v{ver}"}
    except Exception as e:
        components["astrology_engine"] = {"status": "unhealthy", "details": str(e)}

    # 3. Knowledge base check
    try:
        doc_count = db.query(Document).filter(Document.status == "INDEXED").count()
        components["knowledge_base"] = {"status": "healthy", "details": f"{doc_count} documents indexed"}
    except Exception as e:
        components["knowledge_base"] = {"status": "unhealthy", "details": str(e)}

    # 4. AI Provider state
    if settings.is_demo_mode:
        components["ai_provider"] = {"status": "demo_mode", "details": "Operating in local demo mode without Gemini API key"}
    else:
        components["ai_provider"] = {"status": "live", "details": f"Configured model: {settings.GEMINI_MODEL}"}

    all_healthy = all(c["status"] in ("healthy", "demo_mode", "live") for c in components.values())
    overall_status = "ready" if all_healthy else "degraded"

    return ReadinessResponse(
        status=overall_status,
        components=components,
        timestamp=datetime.now(timezone.utc)
    )
