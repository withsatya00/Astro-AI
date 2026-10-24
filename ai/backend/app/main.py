"""
AI Backend Application Entrypoint
Dedicated FastAPI service for AI Chatbot, Astrologer Personas, RAG, and Consultation Streaming.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
import time
from packages.core.logging import logger
from packages.database.session import init_db
from ai.backend.app.api import health, chat, consultations, documents, agent
from website.backend.app.api import auth

app = FastAPI(
    title="Astro Jyotish AI Backend",
    version="2.0.0",
    description="Dedicated AI Astrologer Consultation, RAG, and Streaming Chat Service.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Compression & CORS Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_timing_and_security(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    response.headers["X-Process-Time"] = f"{time.time() - start:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

API_V1_PREFIX = "/api/v1"
app.include_router(health.router, prefix=API_V1_PREFIX)
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(chat.router, prefix=API_V1_PREFIX)
app.include_router(consultations.router, prefix=API_V1_PREFIX)
app.include_router(documents.router, prefix=API_V1_PREFIX)
app.include_router(agent.router, prefix=API_V1_PREFIX)

# Frontend Static Serving from ai/frontend
frontend_dir = Path(__file__).resolve().parent.parent.parent.parent / "ai" / "frontend"
if frontend_dir.exists():
    css_dir = frontend_dir / "css"
    js_dir = frontend_dir / "js"
    assets_dir = frontend_dir / "assets"

    if css_dir.exists():
        app.mount("/css", StaticFiles(directory=str(css_dir)), name="css")
    if js_dir.exists():
        app.mount("/js", StaticFiles(directory=str(js_dir)), name="js")
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")
    src_dir = frontend_dir / "src"
    if src_dir.exists():
        app.mount("/src", StaticFiles(directory=str(src_dir)), name="src")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({"message": "Astro Jyotish AI Backend is running."})

@app.on_event("startup")
def on_startup():
    logger.info("Initializing Astro Jyotish AI Backend...")
    init_db()
    logger.info("AI Backend initialized.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("ai.backend.app.main:app", host="0.0.0.0", port=8001, reload=True)
