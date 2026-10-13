/**
 * AstroAI Agent API Client.
 * Modular interface for backend communication with error handling and demo mode support.
 */

const API_BASE = (window.location.protocol.startsWith('http') && window.location.port === '8005')
  ? '/api/v1'
  : `${window.location.protocol.startsWith('http') ? window.location.protocol : 'http:'}//${window.location.hostname || '127.0.0.1'}:8005/api/v1`;

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
  }
};
