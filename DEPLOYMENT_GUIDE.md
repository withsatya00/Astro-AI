# 🚀 AstroAI Agent Deployment Guide (Vercel, Render & Docker)

This guide provides step-by-step instructions for deploying the **AstroAI Agent** platform to production.

---

## 🧭 Architecture Overview & Platform Comparison

| Platform | Best For | Pros | Considerations |
| :--- | :--- | :--- | :--- |
| **Vercel (All-in-One)** | Quick testing, demos | Global CDN, instant SSL, zero server management | 10–15s function timeout limit on Free tier; Serverless filesystem is ephemeral (`/tmp`). |
| **Hybrid (Vercel Frontend + Render Backend)** *(Recommended)* | **Production standard** | Instant UI on Vercel CDN; persistent Python backend on Render with no streaming timeout and full PySwissEph support. | 2 free accounts (Vercel + Render). |
| **Render / Railway / Docker** | Single-platform fullstack | Persistent disk, background tasks, native C-extensions, SSE streaming without timeouts. | Cold start on Render free tier (takes ~30s on first spin-up). |

---

## ⚡ Option 1: Deploy Directly to Vercel (Ready Now!)

The repository is pre-configured with:
- [`vercel.json`](file:///c:/Users/og/OneDrive/Desktop/AstroTalk/vercel.json): Routes `/api/v1/*` to the serverless function and serves `/frontend/*` on Vercel's global CDN.
- [`api/index.py`](file:///c:/Users/og/OneDrive/Desktop/AstroTalk/api/index.py): Serverless ASGI bridge exporting the FastAPI app.
- [`requirements.txt`](file:///c:/Users/og/OneDrive/Desktop/AstroTalk/requirements.txt): Pre-configured in the root directory.

### Step-by-Step Vercel Deployment:
1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Configure Vercel and production deployment"
   git push origin main
   ```
2. **Go to Vercel Dashboard**:
   - Open [https://vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository (`AstroTalk`).
3. **Configure Environment Variables**:
   Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `APP_ENV`: `production`
   - `DEBUG`: `False`
4. **Click Deploy**:
   - Vercel will install Python dependencies, deploy the serverless API, and host the frontend on a high-speed CDN URL (e.g. `https://astrotalk.vercel.app`).

---

## 🌟 Option 2: The Recommended Production Setup (Vercel Frontend + Render Backend)

For the most stable user experience with long-form Vedic RAG streaming and real-time horoscope generation:

### Step A: Deploy Backend on Render.com (Free)
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and click **New + > Web Service**.
2. Connect your GitHub repository.
3. Configure settings:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini API Key
   - `APP_ENV`: `production`
5. Click **Create Web Service**. Render will generate a URL like: `https://astrotalk-backend.onrender.com`.

### Step B: Connect Frontend on Vercel
1. In `vercel.json`, set the rewrite destination to your Render backend URL, or
2. Simply set `window.__API_BASE__ = 'https://astrotalk-backend.onrender.com/api/v1'` in `frontend/js/api.js`.

---

## 🐳 Option 3: Deploy via Docker (Railway, Render, Fly.io, or VPS)

A complete standalone Docker container is ready in [`backend/Dockerfile`](file:///c:/Users/og/OneDrive/Desktop/AstroTalk/backend/Dockerfile).

```bash
# Build the Docker image
docker build -t astroai-platform -f backend/Dockerfile .

# Run the container
docker run -d -p 8000:8000 -e GEMINI_API_KEY="your-gemini-key" astroai-platform
```
Open `http://localhost:8000` to view the full application running inside Docker.

---

## ✅ Pre-Deployment Checklist

- [x] **Adaptive API Base**: `frontend/js/api.js` automatically adapts to local dev, Vercel, Render, or custom domains.
- [x] **Serverless Filesystem Protection**: `backend/app/db/session.py` automatically uses `/tmp` when running on Vercel serverless to prevent read-only filesystem errors.
- [x] **Favicon & Metadata**: Astrological SVG icon and OpenGraph social preview tags configured.
- [x] **Classical Vedic Knowledge Base**: 287 chunks indexed in `astro_ai.db`.
- [x] **Test Suite**: All 74 backend tests passing with 100% green status.
