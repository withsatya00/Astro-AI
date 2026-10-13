# AstroAI Agent - Version 1 REST API Documentation

Base URL: `http://127.0.0.1:8005/api/v1`  
Interactive Swagger UI: `http://127.0.0.1:8005/docs`  
ReDoc Reference: `http://127.0.0.1:8005/redoc`  

---

## 1. System Health & Readiness

### `GET /health`
Liveness probe returning application metadata and demo mode state.

**Response `200 OK`**:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "app_name": "AstroAI Agent",
  "environment": "development",
  "demo_mode": true,
  "timestamp": "2026-10-13T10:24:46Z"
}
```

### `GET /readiness`
Deep readiness check verifying database connectivity, Swiss Ephemeris engine, knowledge base index count, and AI provider status.

**Response `200 OK`**:
```json
{
  "status": "ready",
  "components": {
    "database": { "status": "healthy", "details": "sqlite" },
    "astrology_engine": { "status": "healthy", "details": "Swiss Ephemeris v2.10.03" },
    "knowledge_base": { "status": "healthy", "details": "2 documents indexed" },
    "ai_provider": { "status": "demo_mode", "details": "Operating in local demo mode without Gemini API key" }
  },
  "timestamp": "2026-10-13T10:24:46Z"
}
```

---

## 2. Birth Chart Endpoints

### `POST /charts/calculate`
Calculates complete birth chart using Swiss Ephemeris, synthesizes traditional interpretations, and saves the chart.

**Request Body**:
```json
{
  "name": "Rohit Sharma",
  "date_of_birth": "1990-10-24",
  "time_of_birth": "07:30:00",
  "is_time_approximate": false,
  "latitude": 28.6139,
  "longitude": 77.2090,
  "timezone_offset": 5.5,
  "city": "New Delhi",
  "country": "India",
  "system": "Vedic",
  "ayanamsa": "Lahiri"
}
```

**Response `200 OK`**:
```json
{
  "id": "e2f7b1c3-4d5e-6a7b-8c9d-0e1f2a3b4c5d",
  "name": "Rohit Sharma",
  "date_of_birth": "1990-10-24",
  "time_of_birth": "07:30:00",
  "is_time_approximate": false,
  "city": "New Delhi",
  "country": "India",
  "chart_data": {
    "ascendant": 199.2977,
    "ascendant_sign": "Libra",
    "ascendant_nakshatra": "Swati",
    "ascendant_pada": 4,
    "sun_sign": "Libra",
    "moon_sign": "Sagittarius",
    "moon_nakshatra": "Mula",
    "moon_pada": 1,
    "planets": [
      {
        "name": "Sun",
        "longitude": 186.72,
        "sign": "Libra",
        "sign_lord": "Venus",
        "degree_in_sign": 6.72,
        "house": 1,
        "nakshatra": "Chitra",
        "nakshatra_lord": "Mars",
        "pada": 3,
        "is_retrograde": false
      }
    ],
    "houses": [ ... ],
    "dashas": [ ... ],
    "navamsha_lagna": "Pisces",
    "system": "Vedic",
    "ayanamsa": "Lahiri",
    "calculation_engine": "Swiss Ephemeris v2.10.03"
  }
}
```

### `GET /charts/{chart_id}`
Retrieves a saved birth chart record by ID.

### `GET /charts`
Lists recent saved birth charts.

---

## 3. Consultation Chat Endpoints

### `POST /chat`
Submits a user question for grounded astrological consultation.

**Request Body**:
```json
{
  "session_id": "optional-uuid",
  "chart_id": "optional-chart-uuid",
  "message": "What does my current Mahadasha indicate for career?",
  "language": "en",
  "force_demo_mode": false
}
```

**Response `200 OK`**:
```json
{
  "id": "msg-uuid",
  "session_id": "session-uuid",
  "role": "assistant",
  "content": "Astrological interpretation text...",
  "citations": [
    {
      "source_title": "Classical Vedic Astrology: Foundations, Planets, and Houses",
      "author": "Vedic Tradition Compendium",
      "page_number": 1,
      "excerpt": "In classical Vedic astrology (Jyotish), the celestial bodies or Grahas represent specific psychological..."
    }
  ],
  "calculated_data_used": true,
  "is_demo_mode": true,
  "tool_trace": [
    {
      "tool": "retrieve_astrology_knowledge",
      "status": "success",
      "retrieved_count": 2
    }
  ],
  "created_at": "2026-10-13T10:24:46Z"
}
```

### `GET /chat/sessions`
Lists recent consultation sessions.

### `GET /chat/sessions/{session_id}`
Retrieves complete conversation history for a consultation session.

---

## 4. Knowledge Base Endpoints

### `POST /documents/upload`
Multipart upload for PDF, TXT, Markdown, or DOCX documents.
- Form fields: `file` (binary), `title` (string), `author` (string), `license_type` (string).

### `POST /documents/import`
Imports a public-domain document from a verified URL (SSRF-protected).
- Body: `{"url": "...", "title": "...", "author": "..."}`.

### `GET /documents`
Lists all indexed documents with checksums, chunk counts, and status.

### `DELETE /documents/{document_id}`
Deletes an indexed document and all its corresponding vector embeddings.

---

## 5. PDF Reports Endpoints

### `POST /reports/generate`
Generates a PDF report for a birth chart.
- Body: `{"chart_id": "...", "report_type": "comprehensive_kundali", "language": "en"}`.

### `GET /reports/{report_id}/download`
Downloads the compiled binary PDF report (`application/pdf`).

### `GET /reports`
Lists all generated reports.

---

## 6. AI Agent Console Endpoints

### `GET /agent/tools`
Lists all registered agent tools with descriptions and parameter schemas.

### `POST /agent/execute`
Executes an agent tool directly through the controlled orchestrator.

**Request Body**:
```json
{
  "tool_name": "evaluate_compatibility_rules",
  "arguments": {
    "person1_moon_sign": "Taurus",
    "person1_nakshatra": "Rohini",
    "person2_moon_sign": "Virgo",
    "person2_nakshatra": "Hasta"
  }
}
```

**Response `200 OK`**:
```json
{
  "tool_name": "evaluate_compatibility_rules",
  "status": "success",
  "duration_ms": 1.45,
  "result": {
    "harmony_grade": "Strong Mutual Resonance",
    "compatibility_index_score": 82,
    "relative_house_distance": 5
  },
  "safety_notes": "Execution completed within authorized policies."
}
```
