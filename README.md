# AstroAI Agent

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

## 🧪 Running Automated Tests

Run the complete test suite (unit tests, calculations, RAG, PDF generator, and API smoke tests):
```powershell
powershell -ExecutionPolicy Bypass -File scripts\run_tests.ps1
```
Or with pytest directly:
```powershell
python -m pytest backend/tests/ -v
```

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
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic v2 schemas
│   │   ├── services/            # Astrology, LLM, RAG, Report services
│   │   ├── agents/              # Orchestrator, registered tools, policies
│   │   ├── rag/                 # Chunking, embeddings, retrieval, ingestion
│   │   ├── astrology/           # Swiss Ephemeris calculations & interpretations
│   │   └── reports/             # ReportLab PDF generator
│   ├── tests/                   # Pytest test suite (15 tests passing)
│   ├── requirements.txt         # Pinned backend dependencies
│   └── Dockerfile               # Production container image
├── frontend/
│   ├── index.html               # Main accessible UI
│   ├── css/styles.css           # Modern celestial design system
│   └── js/                      # api.js, chart.js, chat.js, reports.js, app.js
├── documents/
│   ├── sources/                 # Legal classical astrology seed texts
│   ├── approved/                # Validated imported texts
│   └── manifests/               # Ingestion metadata & provenance
├── scripts/
│   ├── setup.ps1                # Idempotent setup script
│   ├── run_tests.ps1            # Automated test runner
│   ├── download_sources.py      # Source acquisition pipeline
│   └── verify_environment.py    # Environment check script
├── docker-compose.yml           # Multi-container orchestration
└── .env.example                 # Environment configuration template
```

---

## 📜 Ethical & Astrological Notice

Astrological readings generated by this platform are traditional cultural interpretations based on classical Jyotish tenets and are provided for educational, philosophical, and personal contemplation. Astronomical calculations are verified against NASA JPL ephemeris data.
