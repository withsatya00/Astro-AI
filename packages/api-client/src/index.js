/**
 * Universal Astro AI API Client
 * Supports isomorphic browser/node execution with configurable base URL and SSE streaming.
 */

export class AstroApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || (typeof window !== 'undefined' && window.location.port !== '8005' && window.location.port !== '80' && window.location.port !== '443' ? `http://${window.location.hostname}:8005/api/v1` : '/api/v1');
    this.token = options.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('astro_access_token') : null);
  }

  setToken(token) {
    this.token = token;
    if (typeof localStorage !== 'undefined' && token) {
      localStorage.setItem('astro_access_token', token);
    }
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Health
  async getHealth() {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json();
  }

  // Astrologers Directory
  async getAstrologers(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${this.baseUrl}/astrologers${query.toString() ? '?' + query.toString() : ''}`);
    if (!res.ok) throw new Error('Failed to load astrologers');
    return res.json();
  }

  async getAstrologerProfile(slugOrId) {
    const res = await fetch(`${this.baseUrl}/astrologers/${encodeURIComponent(slugOrId)}`);
    if (!res.ok) throw new Error('Failed to load astrologer profile');
    return res.json();
  }

  async smartMatchAstrologers(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${this.baseUrl}/astrologers/match?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to match astrologers');
    return res.json();
  }

  // Consultations
  async createConsultation(payload) {
    const res = await fetch(`${this.baseUrl}/consultations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to start consultation');
    return res.json();
  }

  async getConsultation(consultationId) {
    const res = await fetch(`${this.baseUrl}/consultations/${consultationId}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch consultation details');
    return res.json();
  }

  async getConsultations(params = {}) {
    const query = new URLSearchParams(params);
    const res = await fetch(`${this.baseUrl}/consultations${query.toString() ? '?' + query.toString() : ''}`, {
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch consultation list');
    return res.json();
  }

  // Astrological Calculations
  async calculateChart(payload) {
    const res = await fetch(`${this.baseUrl}/charts/calculate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Chart calculation failed');
    return res.json();
  }

  async calculateMilan(payload) {
    const res = await fetch(`${this.baseUrl}/charts/milan`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Kundali Milan calculation failed');
    return res.json();
  }

  async getPanchang(date, lat, lon) {
    const res = await fetch(`${this.baseUrl}/charts/panchang?date=${date}&latitude=${lat}&longitude=${lon}`);
    if (!res.ok) throw new Error('Panchang fetch failed');
    return res.json();
  }
}

export default AstroApiClient;
