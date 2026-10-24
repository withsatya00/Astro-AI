# Architecture Audit: Astro AI Platform

## 1. Executive Summary
This document provides a factual, code-level architectural audit of the existing **Astro AI / AstroTalk** repository (`withsatya00/Astro-AI`). The platform is an existing, functional application featuring Swiss Ephemeris astronomical calculations, classical RAG knowledge retrieval (287 indexed chunks across 15 treatises), multi-persona AI consultation (Acharya Shastri, Dr. Sunita, Pandit Ji Maharaj), Kundali Milan (36 Gunas), Aaj Ka Panchang, and PDF Kundli dossier generation.

---

## 2. Technical Stack Audit

### 2.1 Backend Architecture
- **Language & Runtime:** Python 3.11.9
- **Web Framework:** FastAPI 0.109+ with ASGI (Uvicorn 0.27+)
- **ORM & Data Layer:** SQLAlchemy 2.0.25
- **Primary Database:** SQLite (`astro_ai.db`, 4.4MB containing existing production/dev records) with built-in PostgreSQL / pgvector compatibility in `session.py`
- **Astronomical Engine:** `pyswisseph` (NASA JPL ephemeris calculation engine with Lahiri, Raman, KP ayanamsas)
- **AI / LLM Integration:** `google-genai` SDK targeting Gemini 3.5 Flash Lite with multi-model streaming fallback (`gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash`) and offline realistic demo mode
- **RAG & Embeddings:** Chunking, embeddings (`gemini-embedding-001` or `local_dense`), and cosine-similarity vector retrieval
- **PDF Generation:** ReportLab 4.1.0 with North Indian Kundli chart rendering, vimshottari dasha tables, and astrological interpretations
- **Security:** Bcrypt password hashing (`passlib`), JWT access tokens (`python-jose`), prompt injection mitigation, SSRF outbound URL defense, path traversal prevention

### 2.2 Frontend Architecture
- **Framework:** Vanilla HTML5, CSS3, and modern ES6+ JavaScript (no heavy runtime framework overhead, instant load times)
- **Styling:** Custom CSS design system (`frontend/css/styles.css`, 65KB) utilizing CSS custom properties, responsive grid/flexbox, ivory/white backgrounds, royal violet accents, and restrained saffron/gold highlights
- **Components & Modals:**
  - Dynamic consultation workspace with intake form and streaming chat
  - Kundali Milan (Gun Milan & Manglik Dosha) modal
  - Aaj Ka Panchang & Muhurat modal
  - Shani Sade Sati & Transit Tracker modal
  - Astrologer Persona Selector modal
  - Shastriya Grounded Kundli Report modal
  - Birth Details & Kundli Calculator modal
  - Classical Document Upload & Ingestion modal
  - Vedic Tools & Agent Console modal
- **Internationalization:** 8-language client translator (`frontend/js/i18n.js` supporting English, Hindi, Sanskrit, Marathi, Gujarati, Bengali, Tamil, Telugu)

### 2.3 Deployment Architecture
- **Current Frontend:** Vercel static deployment (`vercel.json`) with route rewrites redirecting `/api/v1/:path*` to `https://astro-ai-backend-4f0l.onrender.com/api/v1/:path*`
- **Current Backend:** Render cloud deployment with containerized / Procfile uvicorn execution (`uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`)
- **Docker:** `backend/Dockerfile` and root `docker-compose.yml`

---

## 3. Database State & Existing Records
Authoritative database file: `astro_ai.db` (4,468,736 bytes):
- `documents`: 15 records
- `birth_charts`: 125 records
- `document_chunks`: 287 records
- `chat_sessions`: 134 records
- `reports`: 43 records
- `chat_messages`: 294 records
- `users`: 0 records

**CRITICAL RULE:** All existing tables, chunks, birth charts, reports, and messages must be preserved. Migrations must be non-destructive (`ALTER TABLE` or additive table creation).

---

## 4. Baseline Test Suite Audit
Execution Command: `python -m pytest backend/tests`
- **Total Tests:** 74 tests
- **Passed:** 65 tests
- **Failed:** 9 tests
- **Root Cause of Baseline Failures:** In `backend/app/astrology/chart_context.py`, the `ChartContext.__init__` method accepted `profile_id: Optional[str] = None` but did not execute `self.profile_id = profile_id`. When `ChartContext.to_dict()` accessed `self.profile_id`, an `AttributeError` was triggered in 9 conversational quality test cases (`test_case_1_greeting_only`, `test_case_2_love_without_chart`, etc.).
- **Resolution Plan:** Fix `self.profile_id = profile_id` in `backend/app/astrology/chart_context.py` as part of Phase 1 data foundation, which will immediately bring the baseline tests to 74 passed (100% green).

---

## 5. Architectural Gap Analysis for Multi-Astrologer Platform

| Dimension | Current State | Required Target State | Gap / Action |
| :--- | :--- | :--- | :--- |
| **Astrologer Model** | 3 hardcoded AI personas in `personas.py` | Database-backed Astrologers & AI Personas | Add `astrologers`, `astrologer_reviews`, `ai_astrologer_personas` tables |
| **Directory & Discovery** | Only a persona modal popup in chat | Full-featured Astrologer Directory page with search, filters (language, expertise, price, rating, experience), sort, pagination | Implement Astrologer Directory view & APIs |
| **Astrologer Profiles** | No dedicated profile URLs | Dedicated astrologer profile pages (`/astrologers/{slug}`) with bio, pricing, stats, reviews, similar astrologers | Build dynamic profile pages & endpoints |
| **Consultation Session** | Generic `chat_sessions` loosely linked | Formal `consultations` entity tracking astrologer, mode (AI vs Human), session status, start/end timestamps, pricing snapshot | Implement `/api/v1/consultations` suite |
| **Human Astrologers** | None | Real human astrologer profiles with honest availability (online, busy, offline), real-time messaging, unread counts, no fake AI replies | Human astrologer messaging & presence |
| **User Authentication** | User model in ORM without public auth routes | Complete Auth API (Register, Login, JWT session, Current User) & frontend Auth modal | Implement auth routes & session persistence |
| **Birth Profiles** | Browser localStorage / temporary session | Multiple saved user birth profiles in DB with default selection & switching | Connect `birth_charts` to authenticated `user_id` |
| **Smart Matching** | None | Recommendation engine matching concern, language, budget, and astrologer expertise | Implement `/api/v1/astrologers/match` |
| **Consultation Summary** | Ad-hoc summary | Automated end-of-consultation summary with concern, key insights, chart highlights, remedies | Implement `/consultations/{id}/summary` |
