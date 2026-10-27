"""
Website Backend Application Entrypoint
Dedicated FastAPI service for Public Website, Astrologer Directory, Calculators, Horoscope, and Reports.
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
from website.backend.app.api import health, astrologers, calculators, horoscope, charts, auth, wallet, reports, voice, mandir, marketplace, notifications, rewards, cart, seller, shop_admin, verify

app = FastAPI(
    title="Astro Jyotish Website Backend",
    version="2.0.0",
    description="Dedicated Public Website API Service for Astrologers, Calculators, and Horoscope.",
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
app.include_router(astrologers.router, prefix=API_V1_PREFIX)
app.include_router(calculators.router, prefix=API_V1_PREFIX)
app.include_router(horoscope.router, prefix=API_V1_PREFIX)
app.include_router(charts.router, prefix=API_V1_PREFIX)
app.include_router(auth.router, prefix=API_V1_PREFIX)
app.include_router(wallet.router, prefix=API_V1_PREFIX)
app.include_router(reports.router, prefix=API_V1_PREFIX)
app.include_router(voice.router, prefix=API_V1_PREFIX)
app.include_router(mandir.router, prefix=API_V1_PREFIX)
app.include_router(marketplace.router, prefix=API_V1_PREFIX)
app.include_router(notifications.router, prefix=API_V1_PREFIX)
for _router in (rewards.router, cart.router, seller.router, shop_admin.router, verify.router):
    app.include_router(_router, prefix=API_V1_PREFIX)

# Optional inclusion of AI routers for unified production gateway
try:
    from ai.backend.app.api import chat, consultations, documents, agent
    app.include_router(chat.router, prefix=API_V1_PREFIX)
    app.include_router(consultations.router, prefix=API_V1_PREFIX)
    app.include_router(documents.router, prefix=API_V1_PREFIX)
    app.include_router(agent.router, prefix=API_V1_PREFIX)
except Exception as e:
    logger.warning(f"AI backend routes not mounted on website gateway: {e}")

# Frontend Static Serving from website/frontend
frontend_dir = Path(__file__).resolve().parent.parent.parent.parent / "website" / "frontend"
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
    uploads_dir = Path(__file__).resolve().parents[3] / "storage" / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
    src_dir = frontend_dir / "src"
    if src_dir.exists():
        app.mount("/src", StaticFiles(directory=str(src_dir)), name="src")

    @app.get("/", include_in_schema=False)
    async def serve_index():
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({"message": "Astro Jyotish Website Backend is running."})

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_clean_routes(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        target_file = frontend_dir / full_path
        if target_file.is_file():
            return FileResponse(str(target_file))
        index_file = frontend_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({"detail": "Website frontend index.html not found"}, status_code=404)

async def _reminder_loop():
    """Once every few hours, notify users about birthdays/anniversaries coming up (see mandir.send_due_reminders)."""
    import asyncio
    from packages.database.session import SessionLocal
    while True:
        try:
            db = SessionLocal()
            try:
                mandir.send_due_reminders(db)
            finally:
                db.close()
        except Exception as e:  # never let a failed run stop the loop
            logger.warning(f"Reminder run failed: {e}")
        await asyncio.sleep(6 * 3600)


@app.on_event("startup")
async def start_reminder_loop():
    import asyncio
    app.state.reminder_task = asyncio.create_task(_reminder_loop())


@app.on_event("startup")
def on_startup():
    logger.info("Initializing Astro Jyotish Website Backend...")
    init_db()
    # Refresh the Mandir Seva / Astro Mall starter catalog (photos, status text) so old databases pick up current data.
    try:
        from packages.database.session import SessionLocal
        db = SessionLocal()
        try:
            mandir.seed_temples_if_empty(db)
            marketplace.seed_products_if_empty(db)
            mandir.seed_packages_and_coupons(db)
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Catalog seed skipped: {e}")
    try:
        from ai.backend.app.services.llm_service import warm_up_gemini_async
        warm_up_gemini_async()
    except Exception as e:  # AI routes are optional on the website gateway
        logger.info(f"Gemini warm-up not started: {e}")
    try:
        from ai.backend.app.services.llm_service import warm_up_gemini_async
        warm_up_gemini_async()
    except Exception as e:  # AI routes are optional on the website gateway
        logger.info(f"Gemini warm-up not started: {e}")
    logger.info("Website Backend initialized.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("website.backend.app.main:app", host="0.0.0.0", port=8002, reload=True)
