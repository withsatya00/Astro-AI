# AstroAI Agent

Mandir Sewa now supports event-based chadhava: see [Chadhava booking, payments and temple-team setup](docs/CHADHAVA_FLOW.md).

Advanced tools: see [Advanced Workspace setup and capabilities](docs/ADVANCED_WORKSPACE.md) for the timeline, family vault, consent-based memory, evidence, muhurat shortlist, birth-time explorer, voice transcript, reminders, staff workbench and AI quality dashboard.

> **Production-Ready AI Astrology Agent & Kundali Consultation Platform**  
> Powered by NASA JPL Swiss Ephemeris (`pyswisseph`), FastAPI, Google GenAI SDK, and Classical Vedic RAG.

---

## 🌟 Overview

**AstroAI Agent** is an authentic, ethical, and precision-engineered astrology assistant web application designed for astrologers and seekers. Unlike generic wrappers that guess planetary positions using language models, AstroAI Agent calculates exact astronomical positions using the Swiss Ephemeris C engine, indexes public-domain classical astrology treatises for citation-backed RAG, and provides controlled AI agent tools.

The platform includes a responsive, dark-mode celestial testing website built entirely in HTML5, CSS3, and Vanilla JavaScript—fully functional out of the box with zero npm build steps.

---

## 🪐 Key Capabilities

1. **Precision Swiss Ephemeris Calculations (`pyswisseph`)**:
   - Exact planetary longitudes (Sun through Pluto, Rahu & Ketu).
   - Ascendant (Lagna) and 12 Bhavas (houses) using Whole Sign, Equal, and Placidus systems.
   - Sidereal Zodiac (Lahiri / Chitra Paksha, B.V. Raman, KP Ayanamsas) and Western Tropical Zodiac.
   - 27 Nakshatras and 4 Padas.
   - 120-Year Vimshottari Mahadasha timeline calculated from Moon Nakshatra degree.
   - Navamsha (D9) divisional chart placements.
2. **Interactive Geometric Kundali Visualizer**:
   - SVG-rendered North Indian diamond/square birth chart with houses and residing planets.
   - Tabular breakdown of planetary degrees, nakshatra lords, and retrograde (Vakri) status.
3. **Retrieval-Augmented Generation (RAG) on Classical Treatises**:
   - Ingestion of public-domain texts (*Brihat Jataka*, *Maharishi Parashara* tenets).
   - Semantic chunking with page number and heading provenance.
   - Dual-mode vector embeddings (Google `text-embedding-004` and local dense fallback).
   - Citation-backed answers with verbatim excerpt verification.
4. **Controlled AI Agent System**:
   - 7 registered tools (`calculate_birth_chart`, `validate_birth_details`, `retrieve_astrology_knowledge`, `explain_planetary_positions`, `evaluate_compatibility_rules`, `generate_horoscope`, `summarize_consultation`).
   - Bounded execution policies, parameter validation, and latency tracking.
5. **Interactive Testing Console**:
   - Real-time agent tool runner to inspect schemas, parameters, and structured outputs.
6. **Professional PDF Kundali Reports**:
   - Compiled PDF reports generated with ReportLab.
   - Contains birth information, planetary coordinates, houses, Mahadashas, and traditional readings.
7. **Demo Mode & Live Gemini Mode**:
   - Operates 100% locally in Demo Mode without requiring an API key.
   - Seamlessly upgrades to live Google GenAI (`gemini-1.5-flash`) when `GEMINI_API_KEY` is configured.
8. **Security & Defensive Controls**:
   - Server-Side Request Forgery (SSRF) defense on remote URL imports.
   - Path traversal prevention on file uploads.
   - Prompt-injection pattern detection and context sanitization.
   - Redacting logger protecting credentials and API keys.

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- Python 3.11+
- Git

### 1. Automated Setup Script
Run the automated PowerShell setup script from the project root:
```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup.ps1
```

### 2. Manual Setup (Alternative)
```powershell
# 1. Verify dependencies
python scripts\verify_environment.py

# 2. Ingest classical seed texts into the knowledge base
python scripts\download_sources.py

# 3. Start the FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8005 --reload
```

---

## 🌐 Accessing the Application

Once the server is running:
- **Interactive Web Application**: [http://127.0.0.1:8005/](http://127.0.0.1:8005/)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8005/docs](http://127.0.0.1:8005/docs)
- **ReDoc API Documentation**: [http://127.0.0.1:8005/redoc](http://127.0.0.1:8005/redoc)
- **Health Check**: [http://127.0.0.1:8005/api/v1/health](http://127.0.0.1:8005/api/v1/health)
- **System Readiness**: [http://127.0.0.1:8005/api/v1/readiness](http://127.0.0.1:8005/api/v1/readiness)

---

## 🔑 Enabling Live Gemini Mode

To connect live Gemini AI capabilities:
1. Open `.env` in the project root.
2. Set your Google Gemini API key:
   ```env
   GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
   GEMINI_MODEL=gemini-1.5-flash
   ```
3. Restart the server. The navbar status indicator will turn green (`Live Gemini AI`).

*(If left blank, the application automatically runs in Demo Mode, providing authentic Swiss Ephemeris calculations and retrieved citations with clear demo labeling).*

---

## 📚 Knowledge Base & Production RAG Subsystem

The platform features an enterprise-grade Retrieval-Augmented Generation (RAG) subsystem designed specifically for Vedic astrology and palmistry literature:

### 1. Document Ingestion CLI (`backend/app/rag/ingestion.py`)
```powershell
# Display help and options
python -m backend.app.rag.ingestion --help

# Dry-run inspection (simulates chunking, validation, and tokens without DB writes)
python -m backend.app.rag.ingestion --source documents/sources --dry-run

# Incremental ingestion (automatically skips unchanged files via SHA-256 content hashes)
python -m backend.app.rag.ingestion --source documents/sources

# Full atomic reindex (replaces prior chunks cleanly with zero orphaned records)
python -m backend.app.rag.ingestion --source documents/sources --reindex

# Ingest with specific embedding provider (local_dense or google_genai)
python -m backend.app.rag.ingestion --source documents/sources --reindex --provider local_dense
```

Every ingestion run generates both a machine-readable JSON report and human-readable Markdown summary in `storage/reports/`.

### 2. Knowledge Base Quality & Inspection Tools (`backend/app/rag/knowledge_tools.py`)
```powershell
# Safe database index consistency checker (verifies dimension uniformity and zero orphan chunks)
python -m backend.app.rag.knowledge_tools --check-consistency

# Display complete document inventory with chunk counts and topics
python -m backend.app.rag.knowledge_tools --inventory

# Knowledge base statistics breakdown by topic, language, and Sanskrit shlokas
python -m backend.app.rag.knowledge_tools --stats

# Verify source manifest integrity against disk files and SHA-256 checksums
python -m backend.app.rag.knowledge_tools --validate-manifest

# Audit documents and chunks for missing metadata fields
python -m backend.app.rag.knowledge_tools --missing-metadata
```

### 3. Advanced Hybrid Retrieval (`backend/app/rag/retrieval.py`)
- **Semantic Vector Search**: Vectorized NumPy cosine similarity over normalized dense embeddings.
- **BM25 Keyword Search**: Exact matching with Devanagari and Latin tokenization, smoothed Lucene/BM25+ IDF, and query term coverage weighting.
- **Reciprocal Rank Fusion (RRF)**: Merges dense and keyword ranks:
  $$RRF(d) = \sum_{m} \frac{w_m}{60 + r_m(d)}$$
- **Astrology Query Normalization**: Expands romanized transliterations and synonyms (e.g. *sani* $\rightarrow$ *shani/saturn*, *kundli* $\rightarrow$ *kundali/horoscope*).
- **Metadata Filtering**: Filter by `topic`, `source`, `chapter`, and `language`.
- **Near-Duplicate Suppression**: Filters redundant citations using word-level Jaccard overlap.

---

## 🧪 Running Automated Tests & Benchmark

Run the complete regression suite (51 tests covering astronomical calculations, conversational quality, chunking, embeddings, hybrid retrieval, and quantitative IR evaluation):
```powershell
# Run full test suite
python -m pytest backend/tests/ -v

# Run advanced RAG test suite with benchmark report
python -m pytest backend/tests/test_rag_advanced.py -s -v
```

### Measured Information Retrieval Benchmark Results (12 Domain Queries):
| Metric | Measured Score | Evaluation Standard |
|:---|:---|:---|
| **Recall@1** | **91.67%** (11/12) | Top result contains primary classical source |
| **Recall@3** | **100.00%** (12/12) | Top 3 results contain primary classical source |
| **Recall@5** | **100.00%** (12/12) | Top 5 results contain primary classical source |
| **MRR@5** | **0.9444** | Mean Reciprocal Rank across query suite |
| **nDCG@5** | **0.9583** | Normalized Discounted Cumulative Gain |
| **Mean Latency** | **~10.8 ms** | Average retrieval time per query |

---

## 🐳 Docker Deployment

To launch the application using Docker Compose with PostgreSQL (`pgvector`) and Redis:
```bash
docker compose up -d --build
```

---

## 🏛️ Repository Architecture

```
AstroAI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app & routing
│   │   ├── core/                # Config, logging, security
│   │   ├── db/                  # Session, engine, migrations
│   │   ├── models/              # SQLAlchemy models (Document, DocumentChunk with metadata)
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── services/            # Astrology, LLM, RAG, Report services
│   │   ├── agents/              # Orchestrator, registered tools, policies, prompts
│   │   ├── rag/                 # Chunking, embeddings, hybrid retrieval, ingestion, tools
│   │   ├── astrology/           # Swiss Ephemeris calculations, Kundali Milan, Panchang
│   │   └── reports/             # ReportLab PDF generator
│   ├── tests/                   # Pytest test suite (51 tests passing)
│   ├── requirements.txt         # Pinned backend dependencies
│   └── Dockerfile               # Production container image
├── documents/
│   ├── sources/                 # 11 verified classical & traditional compendiums
│   ├── approved/                # Validated imported texts
│   └── manifests/               # source_manifest.json & acquisition_manifest.json
├── scripts/
│   ├── setup.ps1                # Idempotent setup script
│   ├── run_tests.ps1            # Automated test runner
│   └── verify_environment.py    # Environment check script
├── storage/
│   └── reports/                 # Machine-readable JSON & MD ingestion reports
└── reports/
    ├── astro_rag_audit.md       # Full architecture & code audit report
    └── astro_rag_implementation.md # Detailed implementation report
```

---

## 🐄 Gau Sewa Donations

One-time donations to a gaushala at `/gau-sewa`, paid through Razorpay and kept separate from the wallet (a donation never credits wallet balance).

**Database:** new tables `gaushalas`, `gau_seva_updates`, `donations`, `payment_webhook_events`. They are created automatically by `init_db()` on startup (`create_all`); no manual migration or column changes are needed.

**Environment variables** (backend only; never commit values):

| Variable | Purpose |
| --- | --- |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Same keys the wallet uses. Without them donations stay closed. |
| `RAZORPAY_WEBHOOK_SECRET` | Signing secret for the donation webhook. Without it the webhook endpoint returns 503. |
| `SITE_URL` | Public site origin, used for the receipt link in emails. |
| `SMTP_HOST`, `SMTP_FROM` (+ `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`) | Optional. The receipt is emailed only when `SMTP_HOST` and `SMTP_FROM` are set and the donor gave an email; otherwise the receipt is still downloadable. |

**Razorpay webhook setup:** in the Razorpay dashboard add a webhook to `https://<your-domain>/api/v1/gau-sewa/webhook`, set the same secret as `RAZORPAY_WEBHOOK_SECRET`, and enable `payment.captured`, `payment.failed`, `order.paid`, `refund.processed` (and `refund.created`). Deliveries are idempotent (event id + guarded status change).

**Before real donations can be taken:**
1. Set the Razorpay keys (and the webhook secret) in the server environment.
2. Sign in as an admin, open **Admin > Gau Sewa**, add the real gaushala (name, location, introduction, photos), fill in the **beneficiary name** and the note on how funds reach the gaushala, and switch **Donations on**. Collection stays closed until this is done.
3. Publish seva updates only from real, verified information. No sample gaushala, numbers or updates are shipped.

**Behaviour:** amounts are whole rupees (₹11 to ₹1,00,000) converted to integer paise on the server. A donation becomes `SUCCESS` only after the server verifies the signature and Razorpay reports the payment as `captured` for the stored order, amount and currency. States: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`. There is no admin action that marks a payment paid. Receipts are for guests and users via an unguessable token link; signed-in users also see **My Donations** in their account. Receipts state they are not tax exemption certificates. Public APIs never return donor details.

**Tests:** `python -m pytest website/backend/tests/test_gau_sewa.py`.

## 📜 Ethical & Astrological Notice

Astrological readings generated by this platform are traditional cultural interpretations based on classical Jyotish tenets and are provided for educational, philosophical, and personal contemplation. Astronomical calculations are verified against NASA JPL ephemeris data.

