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
from website.backend.app.api import health, astrologers, calculators, horoscope, charts, auth, wallet, reports, voice, mandir, marketplace, notifications, rewards, cart, seller, shop_admin, verify, experience, gau_sewa, bhakti, bhakti_content

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
    # The page shell and unhashed scripts are revalidated on every load (ETag keeps that cheap), so an update is visible
    # immediately. Vite bundles under /static have content hashes in their names, so they never change and are cached
    # for a year. Images and fonts under /assets keep the browser's default caching.
    path = request.url.path
    if path.startswith("/static/") and response.status_code in (200, 304):
        response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
    elif not path.startswith(("/api/", "/assets/", "/uploads/", "/docs", "/redoc", "/openapi")) and response.status_code in (200, 304):
        if path.startswith("/legacy/") or path in ("/sw.js", "/index.html", "/manifest.webmanifest") or "." not in path.rsplit("/", 1)[-1]:
            response.headers["Cache-Control"] = "no-cache"
    return response



@app.get("/sitemap.xml", include_in_schema=False)
def sitemap(request: Request):
    """Public pages for search engines. Set SITE_URL when the site is served from a different host than this API."""
    import os
    from xml.sax.saxutils import escape
    from packages.database.models import Astrologer, MarketplaceProduct, Temple
    from packages.database.session import SessionLocal
    base = (os.environ.get("SITE_URL") or str(request.base_url)).rstrip("/")
    paths = ["/", "/astrologers", "/calculators", "/panchang", "/rashiphal", "/mandir-seva", "/astro-mall", "/gau-sewa", "/gifts"]
    with SessionLocal() as db:
        paths += [f"/astrologers/{a.slug}" for a in db.query(Astrologer.slug).all()]
        paths += [f"/mandir-seva/{t.slug}" for t in db.query(Temple.slug).filter(Temple.is_active == True).all()]  # noqa: E712
        paths += [f"/astro-mall/product/{p.id}" for p in db.query(MarketplaceProduct.id).filter(
            MarketplaceProduct.is_active == True, MarketplaceProduct.listing_status == "APPROVED").all()]  # noqa: E712
    body = "".join(f"<url><loc>{escape(base + p)}</loc></url>" for p in paths)
    from fastapi.responses import Response
    return Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + body + "</urlset>", media_type="application/xml")

PRIVATE_PATHS = ("/admin", "/dashboard", "/seller", "/my-account", "/rewards", "/gau-sewa/receipt/")


@app.get("/robots.txt", include_in_schema=False)
def robots(request: Request):
    """Crawler rules: public pages open, account/admin/receipt pages closed, sitemap advertised with an absolute URL."""
    import os
    from fastapi.responses import PlainTextResponse
    base = (os.environ.get("SITE_URL") or str(request.base_url)).rstrip("/")
    lines = ["User-agent: *", "Allow: /"] + [f"Disallow: {p}" for p in PRIVATE_PATHS] + ["", f"Sitemap: {base}/sitemap.xml", ""]
    return PlainTextResponse(chr(10).join(lines))


API_V1_PREFIX = "/api/v1"
from website.backend.app.api import advanced
app.include_router(advanced.router, prefix=API_V1_PREFIX)
from website.backend.app.api import chadhava
app.include_router(chadhava.router, prefix=API_V1_PREFIX)
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
for _router in (rewards.router, cart.router, seller.router, shop_admin.router, verify.router, experience.router, gau_sewa.router, bhakti.router, bhakti_content.router):
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

# Frontend Static Serving: the React website is built by Vite into website/frontend/dist
# (`npm run build:react`). During development run `npm run dev` (port 3000) instead.
frontend_dir = Path(__file__).resolve().parent.parent.parent.parent / "website" / "frontend"
dist_dir = frontend_dir / "dist"
public_dir = frontend_dir / "public"
# Built output when present, otherwise the raw public folder so images and the manifest still load.
static_root = dist_dir if (dist_dir / "index.html").exists() else public_dir

uploads_dir = Path(__file__).resolve().parents[3] / "storage" / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

if static_root.exists():
    for folder in ("assets", "static", "legacy"):
        if (static_root / folder).exists():
            app.mount(f"/{folder}", StaticFiles(directory=str(static_root / folder)), name=f"site-{folder}")

    def _site_index():
        index_file = dist_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse(
            {"message": "Astro Jyotish Website Backend is running. Build the React site with `npm run build:react`, or use `npm run dev` on port 3000."}
        )

    @app.get("/", include_in_schema=False)
    async def serve_index():
        return _site_index()

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_clean_routes(full_path: str):
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        target_file = (static_root / full_path).resolve()
        if target_file.is_file() and static_root.resolve() in target_file.parents:
            return FileResponse(str(target_file))
        return _site_index()

async def _reminder_loop():
    """Scheduled reminders every minute; existing occasion reminders every six hours."""
    import asyncio
    from packages.database.session import SessionLocal
    last_occasion_run = 0
    def run(occasions):
        with SessionLocal() as db:
            if occasions:
                mandir.send_due_reminders(db)
            from packages.core.advanced import send_due
            send_due(db)
            chadhava.expire_holds(db)
            db.commit()
    while True:
        try:
            occasions = time.monotonic() - last_occasion_run >= 6 * 3600 or not last_occasion_run
            await asyncio.to_thread(run, occasions)
            if occasions:
                last_occasion_run = time.monotonic()
        except Exception as e:  # never let a failed run stop the loop
            logger.warning(f"Reminder run failed: {e}")
        await asyncio.sleep(60)


@app.on_event("startup")
async def start_reminder_loop():
    import asyncio
    app.state.reminder_task = asyncio.create_task(_reminder_loop())


@app.on_event("shutdown")
async def stop_reminder_loop():
    import asyncio
    task = getattr(app.state, "reminder_task", None)
    if task:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


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
            experience.ensure_pack_coupons(db)
            gau_sewa.seed_gaushalas_if_empty(db)
            bhakti.seed_bhakti_if_empty(db)
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
