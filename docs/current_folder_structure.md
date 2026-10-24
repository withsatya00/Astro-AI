# Current Folder Structure & Layer Mapping

## 1. Physical Directory Tree
```
AstroTalk/
├── .env                              # Active local environment variables
├── .env.example                      # Environment template with placeholders
├── .gitignore                        # Git exclusion rules
├── .pytest_cache/                    # Pytest cache artifacts
├── API_DOCUMENTATION.md              # Existing API reference documentation
├── ARCHITECTURE.md                   # Existing system architecture description
├── DEPLOYMENT_GUIDE.md               # Deployment instructions (Vercel + Render)
├── PROJECT_STATUS.md                 # Historic implementation status notes
├── Procfile                          # Render execution command
├── README.md                         # Project overview and run commands
├── SECURITY.md                       # Security considerations and rules
├── TEST_REPORT.md                    # Prior test run reports
├── astro_ai.db                       # Active SQLite database (4.4 MB)
├── docker-compose.yml                # Multi-container orchestration (FastAPI + Redis + Postgres)
├── requirements.txt                  # Python dependencies
├── vercel.json                       # Vercel deployment & rewrite configuration
│
├── api/                              # Vercel serverless gateway
│   └── index.py                      # ASGI handler export for Vercel Python runtime
│
├── backend/                          # FastAPI Backend Application
│   ├── Dockerfile                    # Containerization configuration
│   ├── requirements.txt              # Backend dependencies
│   ├── app/
│   │   ├── main.py                   # FastAPI initialization & route registry
│   │   ├── agents/                   # Multi-turn agents & persona prompts
│   │   │   ├── orchestrator.py       # Turn processing & tool integration
│   │   │   ├── personas.py           # Acharya Shastri, Dr. Sunita, Pandit Maharaj
│   │   │   ├── policies.py           # Guardrails and ethical policies
│   │   │   ├── prompts.py            # System prompts & guidelines
│   │   │   └── tools.py              # Astrological calculation tools for agents
│   │   ├── api/                      # Version 1 HTTP Routers
│   │   │   ├── agent.py              # Agent tool inspection & manual execution
│   │   │   ├── charts.py             # Birth charts, Milan, Panchang, Sade Sati
│   │   │   ├── chat.py               # Streaming chat, persona sessions, history
│   │   │   ├── documents.py          # Document upload, parsing & RAG ingestion
│   │   │   ├── health.py             # Health check & readiness probes
│   │   │   └── reports.py            # PDF report generation & download
│   │   ├── astrology/                # Core Vedic Astrological Calculation Engine
│   │   │   ├── aspects.py            # Classical Graha Drishti (aspects)
│   │   │   ├── calculations.py       # Swiss Ephemeris calculations (D1, D9, D10)
│   │   │   ├── chart_context.py      # Strict chart provenance validation
│   │   │   ├── chart_rag_fusion.py   # Chart-to-RAG knowledge grounding
│   │   │   ├── chart_svg.py          # North Indian diamond chart SVG renderer
│   │   │   ├── chart_validation.py   # Astronomical boundary checking
│   │   │   ├── grounding_critic.py   # Hallucination detector & placement critic
│   │   │   ├── interpretations.py    # Sign, house, and planetary delineations
│   │   │   ├── kundali_milan.py      # Ashtakoota 36 Gunas & Manglik Dosha
│   │   │   ├── panchang.py           # Daily Panchang, Muhurat & Sade Sati
│   │   │   └── yoga_detection.py     # Classical Yoga detection (Gajakesari, etc.)
│   │   ├── core/                     # Infrastructure & Core Services
│   │   │   ├── config.py             # Pydantic Settings & environment loader
│   │   │   ├── logging.py            # Structured logging configuration
│   │   │   └── security.py           # JWT, Bcrypt, SSRF & prompt defense
│   │   ├── db/                       # Database Session Management
│   │   │   └── session.py            # Engine, sessionmaker, Base, migrations
│   │   ├── models/                   # SQLAlchemy ORM Models
│   │   │   └── models.py             # User, BirthChart, ChatSession, ChatMessage, etc.
│   │   ├── rag/                      # Knowledge Base & Retrieval Pipeline
│   │   │   ├── chunking.py           # Semantic astrological chunking
│   │   │   ├── embeddings.py         # Vector embeddings generator
│   │   │   ├── ingestion.py          # PDF/DOCX/TXT/MD document ingestion
│   │   │   ├── knowledge_tools.py    # Classical quotation tools
│   │   │   └── retrieval.py          # Cosine similarity search & reranking
│   │   ├── reports/                  # Report Generation Engines
│   │   │   └── pdf_generator.py      # ReportLab comprehensive Kundli PDF
│   │   ├── schemas/                  # Pydantic Request & Response Schemas
│   │   │   └── schemas.py            # Validation schemas for all endpoints
│   │   └── services/                 # Business Logic Services
│   │       ├── astrology_service.py  # Chart persistence & calculation service
│   │       ├── llm_service.py        # Gemini SDK, multi-model streaming, demo mode
│   │       ├── report_service.py     # Background PDF generation management
│   │       └── semantic_cache.py     # High-speed semantic response caching
│   └── tests/                        # Pytest Test Suite
│       ├── test_accuracy_and_critic.py
│       ├── test_calculations.py
│       ├── test_chart_rag_fusion.py
│       ├── test_conversational_quality.py
│       ├── test_domain_and_language.py
│       ├── test_latency_and_caching.py
│       ├── test_new_features.py
│       ├── test_rag.py
│       ├── test_rag_advanced.py
│       ├── test_reports.py
│       └── test_smoke.py
│
├── documents/                        # RAG Knowledge Base Sources
│   ├── approved/                     # Reviewed documents
│   ├── manifests/                    # Ingestion manifests
│   ├── metadata/                     # Classical treatise metadata
│   └── sources/                      # Raw astrology source texts (15 files)
│
├── frontend/                         # Vanilla Modern Frontend
│   ├── index.html                    # Main consultation application shell
│   ├── css/
│   │   └── styles.css                # Design system & responsive layout
│   └── js/
│       ├── api.js                    # HTTP/SSE client for backend APIs
│       ├── app.js                    # Shell controls, modals, pickers
│       ├── chart.js                  # Client SVG chart rendering
│       ├── chat.js                   # Chat controller & streaming handler
│       ├── i18n.js                   # 8-language localization engine
│       └── reports.js                # PDF generation & document exports
│
├── reports/                          # Stored generated PDF reports
├── scripts/                          # Utility & environment setup scripts
│   ├── download_sources.py
│   ├── run_tests.ps1
│   ├── setup.ps1
│   └── verify_environment.py
└── storage/                          # Local file storage for uploads & reports
```

---

## 2. Four Logical Layer Mapping

To achieve clear separation of concerns as mandated by the architecture guidelines, the repository maps to the 4 logical layers as follows:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ASTRO AI PLATFORM LAYERS                        │
├──────────────────────────────────┬─────────────────────────────────────┤
│ 1. AI BACKEND                    │ 2. AI FRONTEND                      │
│ - backend/app/agents/            │ - frontend/js/chat.js (Chat UI)     │
│ - backend/app/astrology/         │ - frontend/js/chart.js (Kundli SVG) │
│ - backend/app/rag/               │ - frontend/index.html (Chat Studio) │
│ - backend/app/services/llm_...   │ - frontend/css/styles.css (Chat UI) │
│ - backend/app/reports/           │ - Streaming SSE event consumer      │
├──────────────────────────────────┼─────────────────────────────────────┤
│ 3. WEBSITE BACKEND               │ 4. WEBSITE FRONTEND                 │
│ - backend/app/api/auth.py (new)  │ - Astrologer Directory View (new)   │
│ - backend/app/api/astrologers.py │ - Astrologer Profile View (new)     │
│ - backend/app/api/consultations. │ - User Account & Saved Profiles     │
│ - backend/app/services/matching. │ - Smart Astrologer Matching View    │
│ - backend/app/models/models.py   │ - Homepage & Navigation             │
└──────────────────────────────────┴─────────────────────────────────────┘
```
