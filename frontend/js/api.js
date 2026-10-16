/**
 * AstroAI Agent API Client.
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

const API_BASE = getApiBase();

const API = {
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

  // Astrologer Personas
  async getAstrologers() {
    const res = await fetch(`${API_BASE}/chat/astrologers`);
    if (!res.ok) throw new Error('Failed to fetch astrologer personas');
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
      if (onError) onError(err);
      else throw err;
    }
  }
};

