/**
 * Astro Jyotish Agent API Client.
 * Modular interface for backend communication with error handling and demo mode support.
 */

const getApiBase = () => {
  // 1. Explicit override from global variable
  if (typeof window !== 'undefined' && window.__API_BASE__) {
    return window.__API_BASE__.replace(/\/+$/, '');
  }

  // 2. Explicit override saved in localStorage
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('astro_backend_url');
    if (saved) return saved.replace(/\/+$/, '') + (saved.endsWith('/api/v1') ? '' : '/api/v1');
  }

  // 3. Local dev on alternate ports (e.g., Live Server on 5500 or Vite on 3000)
  if (typeof window !== 'undefined' && window.location) {
    const port = window.location.port;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    if (isLocalhost && port && port !== '8005' && port !== '80' && port !== '443') {
      return `http://${hostname}:8005/api/v1`;
    }
  }

  // 4. In production (FastAPI single server, Vercel rewrites, Docker, Render) use relative /api/v1
  return '/api/v1';
};

// ---------------------------------------------------------------------------------------------
// Request identity. The server keeps every chat, chart and report private to one owner: the signed-in
// account (Bearer token) or, before sign-in, this browser's random client id. Every API call carries
// both, so two people never see each other's data.
// ---------------------------------------------------------------------------------------------
(function () {
  if (window.__astroIdentityInstalled) return;
  window.__astroIdentityInstalled = true;
  const ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
  const read = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  let clientId = read('astro_client_id');
  if (!clientId || !ID_RE.test(clientId)) {
    const rand = (window.crypto && crypto.randomUUID) ? crypto.randomUUID().replace(/-/g, '')
      : Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
    clientId = ('c' + rand).slice(0, 40);
    try { localStorage.setItem('astro_client_id', clientId); } catch (e) { /* storage blocked: per-tab id */ }
  }
  window.ASTRO_CLIENT_ID = clientId;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (!url.includes('/api/v1/')) return nativeFetch(input, init);
    const headers = new Headers((init && init.headers) || (typeof input !== 'string' && input.headers) || undefined);
    if (!headers.has('X-Client-Id')) headers.set('X-Client-Id', clientId);
    const token = read('astro_access_token');
    if (token && !headers.has('Authorization')) headers.set('Authorization', 'Bearer ' + token);
    const request = typeof input === 'string' ? nativeFetch(input, Object.assign({}, init, { headers }))
      : nativeFetch(new Request(input, { headers }), init);
    return request.then(res => {
      // Token expired or invalid: drop it once and reload as a guest instead of failing every call.
      if (res.status === 401 && token && !/\/auth\/(login|register)/.test(url)) {
        try {
          localStorage.removeItem('astro_access_token');
          localStorage.removeItem('astro_user');
          if (!sessionStorage.getItem('astro_session_expired')) {
            sessionStorage.setItem('astro_session_expired', '1');
            location.reload();
          }
        } catch (e) { /* ignore */ }
      }
      return res;
    });
  };
})();

const API_BASE = getApiBase();

// Short-lived GET cache with in-flight de-duplication. Errors are never cached and carry `status`
// so callers can tell "does not exist" (404) from a transient failure.
const _getCache = new Map();
function cachedGet(url, ttlMs, failMessage) {
  const hit = _getCache.get(url);
  if (hit && Date.now() - hit.at < ttlMs) return hit.promise;
  const promise = fetch(url).then(res => {
    if (!res.ok) {
      const err = new Error(failMessage);
      err.status = res.status;
      throw err;
    }
    return res.json();
  });
  _getCache.set(url, { at: Date.now(), promise });
  promise.catch(() => { if (_getCache.get(url)?.promise === promise) _getCache.delete(url); });
  return promise;
}
async function authResponse(res, fallback) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail) ? detail.map(item => item.msg).join('; ') : detail;
    throw new Error(message || (res.status >= 500 ? 'Sign-in service is temporarily unavailable. Please try again shortly.' : fallback));
  }
  if (!data?.access_token || !data?.user) throw new Error('Invalid sign-in response. Please try again.');
  return data;
}

// Browser-side leftovers of the previous person (draft, open conversation, remembered charts) must not
// carry over to whoever signs in or out next on this device.
const USER_SCOPED_KEYS = ['astroai_active_consultation', 'astroai_chat_draft', 'astroai_user_remedies', 'astro_my_chart_ids', 'astroai_astrologer_slug'];
function clearUserScopedState() {
  try { USER_SCOPED_KEYS.forEach(k => localStorage.removeItem(k)); sessionStorage.removeItem('astro_session_expired'); } catch (e) { /* ignore */ }
}

// After sign-in, what this browser did as a guest (charts, chats) moves into the account.
async function claimGuestData() {
  try { await fetch(`${API_BASE}/auth/claim-guest`, { method: 'POST', signal: AbortSignal.timeout(5000) }); } catch (e) { /* best effort */ }
}

var API = {
  async synthesizeSpeech(payload, signal) {
    // The CDN keys cached responses by URL only (not the POST body). Without a per-request key,
    // every sentence got the first cached audio, so the caller kept hearing the same "ji".
    const body = JSON.stringify(payload);
    let h = 5381;
    for (let i = 0; i < body.length; i++) h = ((h << 5) + h + body.charCodeAt(i)) | 0;
    const response = await fetch(`${API_BASE}/voice/tts?k=${(h >>> 0).toString(36)}${body.length}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body, signal, cache: 'no-store'
    });
    if (!response.ok) throw new Error('Indian voice service is unavailable');
    return response.blob();
  },
  // Server-side speech-to-text (fallback when the browser recogniser is missing or deaf)
  async transcribeSpeech(blob, language = '') {
    const res = await fetch(`${API_BASE}/voice/stt?language=${encodeURIComponent(language)}`, {
      method: 'POST', headers: { 'Content-Type': blob.type || 'audio/webm' }, body: blob, cache: 'no-store'
    });
    if (!res.ok) throw new Error('Speech transcription unavailable');
    const data = await res.json();
    return (data.text || '').trim();
  },
  // Health & Readiness
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },

  async getReadiness() {
    const res = await fetch(`${API_BASE}/readiness`);
    if (!res.ok) throw new Error('Failed to fetch readiness status');
    return res.json();
  },

  // Birth Charts
  async calculateChart(payload) {
    const res = await fetch(`${API_BASE}/charts/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Chart calculation failed');
    }
    return res.json();
  },

  async getRecentCharts() {
    const res = await fetch(`${API_BASE}/charts`);
    if (!res.ok) throw new Error('Failed to fetch recent charts');
    return res.json();
  },

  // Pulls birth date/time/place already stated across call turns (given directly as `transcript`,
  // or read from the consultation's saved history when omitted), so the calling agent can build a
  // chart without asking again.
  async extractBirthDetails(consultationId, transcript) {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/extract-birth-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transcript ? { transcript } : {})
    });
    if (!res.ok) return { complete: false };
    return res.json();
  },

  async getChartById(chartId) {
    const res = await fetch(`${API_BASE}/charts/${chartId}`);
    if (!res.ok) throw new Error('Failed to fetch chart details');
    return res.json();
  },

  // Chart-to-RAG Fusion Grounded Reports
  async getGroundedReport(chartId, language = 'en') {
    const res = await fetch(`${API_BASE}/charts/${chartId}/grounded-report?language=${encodeURIComponent(language)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch grounded report');
    }
    return res.json();
  },

  async generateGroundedReport(payload, language = 'en') {
    const res = await fetch(`${API_BASE}/charts/grounded-report?language=${encodeURIComponent(language)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate grounded report');
    }
    return res.json();
  },

  // Consultation Chat
  async sendMessage(payload) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send message');
    }
    return res.json();
  },

  async getChatSessions() {
    const res = await fetch(`${API_BASE}/chat/sessions`);
    if (!res.ok) throw new Error('Failed to fetch chat sessions');
    return res.json();
  },

  async getSessionHistory(sessionId) {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch session history');
    return res.json();
  },

  // Knowledge Base Documents
  async uploadDocument(formData) {
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Document upload failed');
    }
    return res.json();
  },

  async importDocument(payload) {
    const res = await fetch(`${API_BASE}/documents/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Document URL import failed');
    }
    return res.json();
  },

  async getDocuments() {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to fetch documents list');
    return res.json();
  },

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete document');
    return res.json();
  },

  // Reports
  async generateReport(payload) {
    const res = await fetch(`${API_BASE}/reports/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Report generation failed');
    }
    return res.json();
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/reports`);
    if (!res.ok) throw new Error('Failed to fetch reports list');
    return res.json();
  },

  // Agent Console
  async getAgentTools() {
    const res = await fetch(`${API_BASE}/agent/tools`);
    if (!res.ok) throw new Error('Failed to fetch agent tools');
    return res.json();
  },

  async executeAgentTool(payload) {
    const res = await fetch(`${API_BASE}/agent/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Tool execution failed');
    }
    return res.json();
  },

  // Expert Astrologers
  async getAstrologers() {
    const res = await fetch(`${API_BASE}/chat/astrologers`);
    if (!res.ok) throw new Error('Failed to fetch astrologers');
    return res.json();
  },

  // Kundali Milan (36 Gunas & Manglik Dosha)
  async calculateMilan(payload) {
    let body = payload;
    if (!payload.boy && payload.boy_name) {
      body = {
        boy: {
          name: payload.boy_name,
          date_of_birth: payload.boy_dob,
          time_of_birth: payload.boy_tob || '12:00:00',
          latitude: payload.boy_lat || 28.6139,
          longitude: payload.boy_lon || 77.2090,
          timezone_offset: payload.boy_tz || 5.5,
          city: payload.boy_city || 'New Delhi',
          country: payload.boy_country || 'India'
        },
        girl: {
          name: payload.girl_name,
          date_of_birth: payload.girl_dob,
          time_of_birth: payload.girl_tob || '12:00:00',
          latitude: payload.girl_lat || 19.0760,
          longitude: payload.girl_lon || 72.8777,
          timezone_offset: payload.girl_tz || 5.5,
          city: payload.girl_city || 'Mumbai',
          country: payload.girl_country || 'India'
        }
      };
    }

    const res = await fetch(`${API_BASE}/charts/milan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Kundali Milan calculation failed');
    }
    return res.json();
  },

  // Aaj Ka Panchang
  async getPanchang(param1, param2, param3, param4) {
    let date = null, lat = 28.6139, lon = 77.2090, tz = 5.5;
    if (typeof param1 === 'object' && param1 !== null) {
      date = param1.date;
      lat = param1.lat ?? param1.latitude ?? 28.6139;
      lon = param1.lon ?? param1.longitude ?? 77.2090;
      tz = param1.tz ?? param1.timezone_offset ?? 5.5;
    } else if (typeof param1 === 'string' && param1.includes('-')) {
      date = param1;
      if (param2 !== undefined) lat = param2;
      if (param3 !== undefined) lon = param3;
      if (param4 !== undefined) tz = param4;
    } else {
      if (param1 !== undefined) lat = param1;
      if (param2 !== undefined) lon = param2;
      if (param3 !== undefined) tz = param3;
      if (param4 !== undefined) date = param4;
    }
    let url = `${API_BASE}/charts/panchang?latitude=${lat}&longitude=${lon}&timezone_offset=${tz}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch Aaj Ka Panchang');
    return res.json();
  },

  // Shani Sade Sati & Transit Tracker
  async getSadeSati(payload) {
    const body = typeof payload === 'string' ? { moon_sign: payload } : payload;
    const res = await fetch(`${API_BASE}/charts/sade-sati`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to fetch Sade Sati analysis');
    }
    return res.json();
  },

  // Daily & Periodic Vedic Rashifal (Horoscope)
  async getHoroscope(sign = 'Aries', timeframe = 'today') {
    const tfMap = {
      'today': 'daily',
      'tomorrow': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'yearly': 'yearly'
    };
    const normTf = tfMap[timeframe] || timeframe || 'daily';
    const res = await fetch(`${API_BASE}/horoscope/${encodeURIComponent(sign)}?timeframe=${encodeURIComponent(normTf)}`);
    if (!res.ok) throw new Error('Failed to load horoscope');
    return res.json();
  },

  async getPersonalizedHoroscope(chartId) {
    const res = await fetch(`${API_BASE}/horoscope/personalized/${encodeURIComponent(chartId)}`);
    if (!res.ok) throw new Error('Failed to load personalized horoscope');
    return res.json();
  },

  // Real-time Streaming Consultation (SSE)
  async streamConsultation(payload, onSession, onDelta, onDone, onError) {
    try {
      const res = await fetch(`${API_BASE}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Streaming connection failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep last incomplete chunk

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const evtType = data.type || data.event;
            if (evtType === 'session' && onSession) {
              onSession(data);
            } else if (evtType === 'delta' && onDelta) {
              onDelta(data.text);
            } else if (evtType === 'done' && onDone) {
              onDone(data);
            }
          } catch (e) {
            console.warn('SSE JSON parse error:', e, jsonStr);
          }
        }
      }
    } catch (err) {
      if (onError) await onError(err);
      else console.error('Streaming error:', err);
    }
  },

  // Astrologer Directory & Profiles API
  async getAstrologers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.expertise) query.append('expertise', params.expertise);
    if (params.language) query.append('language', params.language);
    if (params.availability) query.append('availability', params.availability);
    if (params.is_ai !== undefined && params.is_ai !== null && params.is_ai !== '') query.append('is_ai', params.is_ai);
    if (params.min_price) query.append('min_price', params.min_price);
    if (params.max_price) query.append('max_price', params.max_price);
    if (params.sort_by) query.append('sort_by', params.sort_by);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const url = `${API_BASE}/astrologers${query.toString() ? '?' + query.toString() : ''}`;
    // The home page, directory and chat all ask for the same list at once: share one request and reuse it briefly.
    return cachedGet(url, 60000, 'Failed to load astrologers directory');
  },

  async getAstrologerProfile(slugOrId) {
    return cachedGet(`${API_BASE}/astrologers/${encodeURIComponent(slugOrId)}`, 60000, 'Failed to load astrologer profile');
  },

  async smartMatchAstrologers(params = {}) {
    const query = new URLSearchParams();
    if (params.concern) query.append('concern', params.concern);
    if (params.preferred_language) query.append('preferred_language', params.preferred_language);
    if (params.consultation_mode) query.append('consultation_mode', params.consultation_mode);
    if (params.max_price) query.append('max_price', params.max_price);

    const res = await fetch(`${API_BASE}/astrologers/match?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to compute astrologer recommendations');
    return res.json();
  },

  async updateAstrologerAvailability(astrologerId, availability) {
    const res = await fetch(`${API_BASE}/astrologers/${astrologerId}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability })
    });
    if (!res.ok) throw new Error('Failed to update availability');
    return res.json();
  },

  async addAstrologerReview(astrologerId, payload) {
    const res = await fetch(`${API_BASE}/astrologers/${astrologerId}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },

  // Persistent Consultation Session API
  async createOrResumeConsultation(payload) {
    // The hosted backend can be asleep (502/503/504 or a dropped connection); retry while it wakes up.
    const delays = [1500, 3000, 6000, 10000];
    let res;
    for (let attempt = 0; ; attempt++) {
      try {
        res = await fetch(`${API_BASE}/consultations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (![502, 503, 504].includes(res.status) || attempt >= delays.length) break;
      } catch (e) {
        if (attempt >= delays.length) throw e;
      }
      await new Promise(r => setTimeout(r, delays[attempt]));
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start consultation');
    }
    return res.json();
  },

  async getConsultations(userId = null) {
    const url = userId ? `${API_BASE}/consultations?user_id=${encodeURIComponent(userId)}` : `${API_BASE}/consultations`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch consultations history');
    return res.json();
  },

  async getConsultationDetails(consultationId) {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}`);
    if (!res.ok) throw new Error('Failed to fetch consultation details');
    return res.json();
  },

  async getConsultationMessages(consultationId, beforeId = null, limit = 20) {
    let url = `${API_BASE}/consultations/${consultationId}/messages?limit=${limit}`;
    if (beforeId) {
      url += `&before_id=${encodeURIComponent(beforeId)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch consultation messages');
    return res.json();
  },

  async sendConsultationMessage(consultationId, payload) {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to send consultation message');
    }
    return res.json();
  },

  async streamConsultationSession(consultationId, payload, onSession, onDelta, onDone, onError) {
    try {
      const res = await fetch(`${API_BASE}/consultations/${consultationId}/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Streaming connection failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const data = JSON.parse(jsonStr);
            const evtType = data.type || data.event;
            if (evtType === 'session' && onSession) onSession(data);
            else if (evtType === 'delta' && onDelta) onDelta(data.text);
            else if (evtType === 'done' && onDone) onDone(data);
          } catch (e) {
            console.warn('SSE JSON parse error:', e, jsonStr);
          }
        }
      }
    } catch (err) {
      if (onError) await onError(err);
      else throw err;
    }
  },

  async endConsultation(consultationId, reason = 'User completed') {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to conclude consultation');
    return res.json();
  },

  async getConsultationSummary(consultationId) {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/summary`);
    if (!res.ok) throw new Error('Failed to retrieve consultation summary');
    return res.json();
  },

  async submitConsultationFeedback(consultationId, payload) {
    const res = await fetch(`${API_BASE}/consultations/${consultationId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit consultation feedback');
    return res.json();
  },

  // Authentication & Profile Management API
  async register(payload) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await authResponse(res, 'Registration failed');
    if (data.access_token) {
      localStorage.setItem('astro_access_token', data.access_token);
      localStorage.setItem('astro_user', JSON.stringify(data.user));
      sessionStorage.removeItem('astro_session_expired');
      await claimGuestData();
    }
    return data;
  },

  async login(payload) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      cache: 'no-store',
      signal: AbortSignal.timeout(30000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await authResponse(res, 'Invalid email or password');
    if (data.access_token) {
      localStorage.setItem('astro_access_token', data.access_token);
      localStorage.setItem('astro_user', JSON.stringify(data.user));
      sessionStorage.removeItem('astro_session_expired');
      await claimGuestData();
    }
    return data;
  },

  // Private files (report PDFs) cannot be opened with a plain link: the browser would not send the identity
  // headers. Fetch with them, then show the result from a temporary blob URL.
  async openPrivateFile(url, newTab = true) {
    const popup = newTab ? window.open('', '_blank') : null;   // opened synchronously so it is not popup-blocked
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('File not available');
      const blobUrl = URL.createObjectURL(await res.blob());
      if (popup) popup.location.href = blobUrl; else window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
    } catch (e) {
      if (popup) popup.close();
      if (window.App && App.showToast) App.showToast('Could not open the file. Please try again.', 'error');
    }
  },

  // Sign out: forget the account on this device. The caller reloads the page so no in-memory chat or chart
  // of the previous person survives for whoever signs in next.
  logout() {
    try {
      localStorage.removeItem('astro_access_token');
      localStorage.removeItem('astro_user');
    } catch (e) { /* ignore */ }
    clearUserScopedState();
  },

  async getMe() {
    const token = localStorage.getItem('astro_access_token');
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      localStorage.removeItem('astro_access_token');
      localStorage.removeItem('astro_user');
      return null;
    }
    return res.json();
  },

  async getSavedProfiles() {
    const token = localStorage.getItem('astro_access_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/auth/profiles`, { headers });
    if (!res.ok) throw new Error('Failed to fetch saved profiles');
    return res.json();
  },

  async setDefaultProfile(profileId) {
    const token = localStorage.getItem('astro_access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE}/auth/profiles/${profileId}/default`, {
      method: 'PATCH',
      headers
    });
    if (!res.ok) throw new Error('Failed to set default profile');
    return res.json();
  },

  async deleteSavedProfile(profileId) {
    const token = localStorage.getItem('astro_access_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/auth/profiles/${profileId}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete saved profile');
    return res.json();
  },

  // =========================================================================
  // Vedic Calculators API
  // =========================================================================
  async getNumerology(payload) {
    const res = await fetch(`${API_BASE}/calculators/numerology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Numerology calculation failed');
    return res.json();
  },

  async getNameNumerology(payload) {
    const res = await fetch(`${API_BASE}/calculators/name-numerology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Name numerology calculation failed');
    return res.json();
  },

  async getSunSign(payload) {
    const res = await fetch(`${API_BASE}/calculators/sun-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Sun sign calculation failed');
    return res.json();
  },

  async getMoonSign(payload) {
    const res = await fetch(`${API_BASE}/calculators/moon-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Moon sign calculation failed');
    return res.json();
  },

  async getRisingSign(payload) {
    const res = await fetch(`${API_BASE}/calculators/rising-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Rising sign calculation failed');
    return res.json();
  },

  async getNakshatra(payload) {
    const res = await fetch(`${API_BASE}/calculators/nakshatra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Nakshatra calculation failed');
    return res.json();
  },

  async getMangalDosha(payload) {
    const res = await fetch(`${API_BASE}/calculators/mangal-dosha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Mangal dosha calculation failed');
    return res.json();
  },

  async getJaiminiKarakas(payload) {
    const res = await fetch(`${API_BASE}/calculators/jaimini-karakas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Jaimini karakas calculation failed');
    return res.json();
  },

  async getKaalSarp(payload) {
    const res = await fetch(`${API_BASE}/calculators/kaal-sarp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || 'Kaal sarp calculation failed');
    return res.json();
  },

  async getMoonPhase(dateStr) {
    const url = dateStr ? `${API_BASE}/calculators/moon-phase?date=${dateStr}` : `${API_BASE}/calculators/moon-phase`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Moon phase calculation failed');
    return res.json();
  },

  async getFriendshipCompatibility(payload) {
    const res = await fetch(`${API_BASE}/calculators/friendship-compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Friendship compatibility calculation failed');
    return res.json();
  },

  async getLoveCompatibility(payload) {
    const res = await fetch(`${API_BASE}/calculators/love-compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Love compatibility calculation failed');
    return res.json();
  },

  async getNameCompatibility(payload) {
    const res = await fetch(`${API_BASE}/calculators/name-compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Name compatibility calculation failed');
    return res.json();
  },

  // =========================================================================
  // Horoscope (Rashifal) API
  // =========================================================================
  async getHoroscope(sign, timeframe = 'daily') {
    const tf = (timeframe === 'today') ? 'daily' : timeframe;
    const res = await fetch(`${API_BASE}/horoscope/${encodeURIComponent(sign)}?timeframe=${tf}`);
    if (!res.ok) throw new Error('Failed to fetch horoscope');
    return res.json();
  },

  async getAllRashis() {
    const res = await fetch(`${API_BASE}/horoscope`);
    if (!res.ok) throw new Error('Failed to list rashis');
    return res.json();
  },

  async getPersonalizedHoroscope(chartId) {
    const res = await fetch(`${API_BASE}/horoscope/personalized/${chartId}`);
    if (!res.ok) throw new Error('Failed to fetch personalized horoscope');
    return res.json();
  },

  // =========================================================================
  // Wallet & Bookings API
  // =========================================================================
  async getWalletStatus() {
    const token = localStorage.getItem('astro_access_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/wallet`, { headers });
    if (!res.ok) throw new Error('Failed to fetch wallet status');
    return res.json();
  },

  async getWallet() {
    return this.getWalletStatus();
  },

  async rechargeWallet(amount, method = 'UPI (Test Mode)') {
    const token = localStorage.getItem('astro_access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE}/wallet/recharge`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ amount, payment_method: method })
    });
    if (!res.ok) throw new Error('Wallet recharge failed');
    return res.json();
  },

  async createBooking(payload) {
    const token = localStorage.getItem('astro_access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    const res = await fetch(`${API_BASE}/wallet/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Booking appointment failed');
    }
    return res.json();
  },

  async getBookings() {
    const token = localStorage.getItem('astro_access_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/wallet/bookings`, { headers });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
  },

  async cancelBooking(bookingId) {
    const token = localStorage.getItem('astro_access_token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE}/wallet/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to cancel booking');
    return res.json();
  },

  // Vedic Calculators City Coordinates Helper
  getCityCoords(cityName) {
    const coordsMap = {
      'Delhi': { lat: 28.6139, lon: 77.2090, tz: 5.5 },
      'New Delhi': { lat: 28.6139, lon: 77.2090, tz: 5.5 },
      'Mumbai': { lat: 19.0760, lon: 72.8777, tz: 5.5 },
      'Varanasi': { lat: 25.3176, lon: 82.9739, tz: 5.5 },
      'Kashi': { lat: 25.3176, lon: 82.9739, tz: 5.5 },
      'Bengaluru': { lat: 12.9716, lon: 77.5946, tz: 5.5 },
      'Bangalore': { lat: 12.9716, lon: 77.5946, tz: 5.5 },
      'Kolkata': { lat: 22.5726, lon: 88.3639, tz: 5.5 },
      'Chennai': { lat: 13.0827, lon: 80.2707, tz: 5.5 },
      'Jaipur': { lat: 26.9124, lon: 75.7873, tz: 5.5 },
      'Haridwar': { lat: 29.9457, lon: 78.1642, tz: 5.5 },
      'Ayodhya': { lat: 26.7922, lon: 82.1998, tz: 5.5 },
      'Ujjain': { lat: 23.1765, lon: 75.7885, tz: 5.5 },
      'Pune': { lat: 18.5204, lon: 73.8567, tz: 5.5 },
      'Hyderabad': { lat: 17.3850, lon: 78.4867, tz: 5.5 },
      'Ahmedabad': { lat: 23.0225, lon: 72.5714, tz: 5.5 },
      'Lucknow': { lat: 26.8467, lon: 80.9462, tz: 5.5 }
    };
    return coordsMap[cityName] || { lat: 28.6139, lon: 77.2090, tz: 5.5 };
  },

  // Vedic Calculators Real API Implementations
  async calculateNumerology(name, dob) {
    const res = await fetch(`${API_BASE}/calculators/numerology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date_of_birth: dob || '1995-10-15', full_name: name || 'Seeker' })
    });
    if (!res.ok) throw new Error('Numerology calculation failed');
    return res.json();
  },

  async calculateNameNumerology(name) {
    const res = await fetch(`${API_BASE}/calculators/name-numerology`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || 'Astro' })
    });
    if (!res.ok) throw new Error('Name numerology failed');
    return res.json();
  },

  async calculateMangalDosha(payload) {
    const c = this.getCityCoords(payload.city || 'Delhi');
    const res = await fetch(`${API_BASE}/calculators/mangal-dosha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: payload.date_of_birth || '1995-10-15',
        time_of_birth: payload.time_of_birth || '12:00:00',
        latitude: c.lat,
        longitude: c.lon,
        timezone_offset: c.tz
      })
    });
    if (!res.ok) throw new Error('Mangal Dosha calculation failed');
    return res.json();
  },

  async calculateRisingSign(payload) {
    const c = this.getCityCoords(payload.city || 'Delhi');
    const res = await fetch(`${API_BASE}/calculators/rising-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: payload.date_of_birth || '1995-10-15',
        time_of_birth: payload.time_of_birth || '12:00:00',
        latitude: c.lat,
        longitude: c.lon,
        timezone_offset: c.tz
      })
    });
    if (!res.ok) throw new Error('Rising sign calculation failed');
    return res.json();
  },

  async calculateNakshatra(payload) {
    const c = this.getCityCoords(payload.city || 'Delhi');
    const res = await fetch(`${API_BASE}/calculators/nakshatra`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: payload.date_of_birth || '1995-10-15',
        time_of_birth: payload.time_of_birth || '12:00:00',
        latitude: c.lat,
        longitude: c.lon,
        timezone_offset: c.tz
      })
    });
    if (!res.ok) throw new Error('Nakshatra calculation failed');
    return res.json();
  },

  async calculateAtmakaraka(payload) {
    const c = this.getCityCoords(payload.city || 'Delhi');
    const res = await fetch(`${API_BASE}/calculators/jaimini-karakas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: payload.date_of_birth || '1995-10-15',
        time_of_birth: payload.time_of_birth || '12:00:00',
        latitude: c.lat,
        longitude: c.lon,
        timezone_offset: c.tz
      })
    });
    if (!res.ok) throw new Error('Jaimini Karakas calculation failed');
    return res.json();
  },

  async calculateKaalSarp(payload) {
    const c = this.getCityCoords(payload.city || 'Delhi');
    const res = await fetch(`${API_BASE}/calculators/kaal-sarp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: payload.date_of_birth || '1995-10-15',
        time_of_birth: payload.time_of_birth || '12:00:00',
        latitude: c.lat,
        longitude: c.lon,
        timezone_offset: c.tz
      })
    });
    if (!res.ok) throw new Error('Kaal Sarp calculation failed');
    return res.json();
  },

  async calculateMoonSign(payload) {
    const c = this.getCityCoords(payload.city || 'Delhi');
    const res = await fetch(`${API_BASE}/calculators/moon-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: payload.date_of_birth || '1995-10-15',
        time_of_birth: payload.time_of_birth || '12:00:00',
        latitude: c.lat,
        longitude: c.lon,
        timezone_offset: c.tz
      })
    });
    if (!res.ok) throw new Error('Moon sign calculation failed');
    return res.json();
  },

  async calculateSunSign(dob, system) {
    const res = await fetch(`${API_BASE}/calculators/sun-sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date_of_birth: dob || '1995-10-15',
        time_of_birth: '12:00:00',
        latitude: 28.6139,
        longitude: 77.2090,
        timezone_offset: 5.5
      })
    });
    if (!res.ok) throw new Error('Sun sign calculation failed');
    return res.json();
  },

  async calculateMoonPhase(dateStr) {
    const q = dateStr ? `?date=${encodeURIComponent(dateStr)}` : '';
    const res = await fetch(`${API_BASE}/calculators/moon-phase${q}`);
    if (!res.ok) throw new Error('Moon phase calculation failed');
    return res.json();
  },

  async calculateLoveCompatibility(sign1, sign2) {
    const res = await fetch(`${API_BASE}/calculators/love-compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sign_1: sign1 || 'Aries',
        sign_2: sign2 || 'Leo',
        partner_1_name: 'Partner 1',
        partner_2_name: 'Partner 2'
      })
    });
    if (!res.ok) throw new Error('Love compatibility calculation failed');
    return res.json();
  },

  async calculateFriendshipCompatibility(sign1, sign2) {
    const res = await fetch(`${API_BASE}/calculators/friendship-compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sign_1: sign1 || 'Aries',
        sign_2: sign2 || 'Leo'
      })
    });
    if (!res.ok) throw new Error('Friendship compatibility calculation failed');
    return res.json();
  },

  async calculateNameCompatibility(name1, name2) {
    const res = await fetch(`${API_BASE}/calculators/name-compatibility`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_1: name1 || 'Aarav',
        name_2: name2 || 'Diya'
      })
    });
    if (!res.ok) throw new Error('Name compatibility calculation failed');
    return res.json();
  }
};

if (typeof window !== 'undefined') {
  window.API = API;
}
if (typeof globalThis !== 'undefined') {
  globalThis.API = API;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}


