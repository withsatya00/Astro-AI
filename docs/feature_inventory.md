# Feature Inventory: Astro AI Platform

## 1. Feature Status Matrix

| Feature | Subsystem | Current State | Functionality Level | Target Action |
| :--- | :--- | :--- | :--- | :--- |
| **Swiss Ephemeris Chart Calculation** | Astrology Engine | Working | Fully functional (D1, D9, D10, Dashas) | Preserve & reuse |
| **Kundali Milan (Gun Milan 36 Gunas)** | Astrology Engine | Working | Fully functional with Manglik Dosha | Preserve & reuse |
| **Aaj Ka Panchang** | Astrology Engine | Working | Fully functional (Tithi, Nakshatra, Yoga, Karan, Muhurat) | Preserve & reuse |
| **Shani Sade Sati Tracker** | Astrology Engine | Working | Fully functional (3 phases & remedies) | Preserve & reuse |
| **Classical Yoga Detection** | Astrology Engine | Working | Detects 18+ classical yogas | Preserve & reuse |
| **Classical RAG Retrieval** | RAG Engine | Working | 287 chunks indexed across 15 treatises | Preserve & reuse |
| **PDF Kundli Report Generation** | Reports Service | Working | ReportLab PDF with chart SVG | Preserve & reuse |
| **Multi-Lingual Translation** | Localization | Working | 8 Indian languages supported | Preserve & reuse |
| **Chat SSE Streaming** | AI Backend | Working | Word-by-word streaming with fallback | Preserve & reuse |
| **Persona Switching (Acharya/Sunita/Maharaj)** | AI Backend | Working | In-memory persona prompts | Connect to persistent DB records |
| **Astrologer Directory** | Website Frontend | Incomplete | Only a modal popup exists; no catalog view | **GENUINELY NEEDED:** Build directory page with search, filters, pagination |
| **Astrologer Individual Profiles** | Website Frontend | Broken / Missing | No dedicated profile page or slug routes | **GENUINELY NEEDED:** Build full astrologer profile view |
| **Consultation Sessions Management** | Website Backend | Incomplete | Minimal `chat_sessions` without astrologer association | **GENUINELY NEEDED:** Build `/api/v1/consultations` suite |
| **Human Astrologer Chat Mode** | Consultation System | Missing | Only AI simulation exists | **GENUINELY NEEDED:** Dual-mode consultation (Human vs AI persona) |
| **Honest Astrologer Availability** | Consultation System | Incomplete | Hardcoded "Online" pill | **GENUINELY NEEDED:** Real presence (Online, Busy, Offline) & no fake AI replies |
| **User Authentication & Session** | Website Backend | Partial | Models & JWT exist; no public endpoints | **GENUINELY NEEDED:** Register, Login, Current User, Token refresh |
| **Saved Birth Profiles Management** | Website Frontend | Partial | LocalStorage only; no DB persistence per user | **GENUINELY NEEDED:** Multi-profile manager linked to user account |
| **Smart Astrologer Matching** | Advanced Features | Missing | None | **GENUINELY NEEDED:** Recommendation engine for concerns & budget |
| **Consultation Summary Generation** | Advanced Features | Missing | None | **GENUINELY NEEDED:** Summary card with concern, chart points & remedies |
| **Booking & Billing Test Mode** | Payments | Missing | None | **GENUINELY NEEDED:** Test-mode booking, pricing snapshot & session status |
| **Admin Astrologer Management** | Website Backend | Missing | None | **GENUINELY NEEDED:** Role-protected profile & pricing management |

---

## 2. Reusability Assessment

### Completely Reusable Components (Do Not Re-architect)
1. **`backend/app/astrology/`:** Calculations (`calculations.py`), Kundali Milan (`kundali_milan.py`), Panchang (`panchang.py`), Aspects (`aspects.py`), Yoga detection (`yoga_detection.py`), SVG chart generator (`chart_svg.py`).
2. **`backend/app/rag/`:** Ingestion, chunking, embeddings, and vector retrieval.
3. **`backend/app/reports/pdf_generator.py`:** Comprehensive Kundli dossier generation.
4. **`backend/app/services/llm_service.py`:** Streaming LLM execution, offline demo fallback, language detection, and palmistry analysis.
5. **Existing `astro_ai.db` SQLite database:** 287 chunks, 125 charts, 15 documents.

### Components Needing Modification / Extension
1. **`backend/app/models/models.py`:** Extend ORM with `Astrologer`, `AstrologerReview`, `Consultation`, `ConsultationFeedback`, and `ConsultationSummary`.
2. **`backend/app/db/session.py`:** Add safe auto-migration for newly introduced tables.
3. **`backend/app/astrology/chart_context.py`:** Fix `self.profile_id = profile_id` bug (resolves 9 baseline test failures).
4. **`frontend/index.html` & `frontend/css/styles.css`:** Add dedicated Astrologer Directory view, Astrologer Profile view, User Account/Auth modal, and Consultation Header.
5. **`frontend/js/api.js`:** Add endpoints for auth, consultations, astrologers directory, matching, and summary.
