// API client for the consultation room. Identity (guest client id or the signed-in token) is added to every
// /api/v1 request by the site's fetch wrapper in js/api.js, so a visitor's chats stay private to them.
const BASE = '/api/v1';

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function call(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal });
  } catch (e) {
    if (e && e.name === 'AbortError') throw e;
    throw new ApiError(0, 'Network unavailable');
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = await res.json();
      if (typeof j.detail === 'string') detail = j.detail;
      else if (Array.isArray(j.detail)) detail = j.detail.map((d) => String(d.msg || '').replace(/^Value error, /, '')).join('; ');
    } catch (e) { /* not json */ }
    throw new ApiError(res.status, detail);
  }
  return res.status === 204 ? null : res.json();
}

// The server stores times as UTC without a zone suffix; read them as UTC so they show in the viewer's own time.
export const parseUtc = (iso) => {
  if (!iso) return new Date();
  const s = String(iso);
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);
};

export const getAstrologer = (slug, signal) => call(`/astrologers/${encodeURIComponent(slug)}`, { signal });

export const listAstrologers = ({ isAi, availability, limit = 24 } = {}, signal) => {
  const q = new URLSearchParams({ limit: String(limit), sort_by: 'popular' });
  if (isAi !== undefined) q.set('is_ai', String(isAi));
  if (availability) q.set('availability', availability);
  return call(`/astrologers?${q}`, { signal }).then((d) => d.items || []);
};

// Creates the conversation with this astrologer, or resumes the one that is still open.
export const openConsultation = (astrologerId, language) =>
  call('/consultations', { method: 'POST', body: { astrologer_id: astrologerId, mode: 'chat', language } });

export const listConsultations = (limit = 30) => call(`/consultations?limit=${limit}`);

export const getMessages = (consultationId, { beforeId, limit = 25 } = {}, signal) => {
  const q = new URLSearchParams({ limit: String(limit) });
  if (beforeId) q.set('before_id', beforeId);
  return call(`/consultations/${consultationId}/messages?${q}`, { signal });
};

export const sendMessage = (consultationId, { message, language, userName }) =>
  call(`/consultations/${consultationId}/messages`, { method: 'POST', body: { message, language, user_name: userName || undefined } });

export const endConsultation = (consultationId) => call(`/consultations/${consultationId}/end`, { method: 'POST', body: {} });

export const sendFeedback = (consultationId, rating, text) =>
  call(`/consultations/${consultationId}/feedback`, { method: 'POST', body: { rating, feedback_text: text || '' } });

export const busySlots = (astrologerId) => call(`/wallet/bookings/busy?astrologer_id=${encodeURIComponent(astrologerId)}`);

export const createBooking = (payload) => call('/wallet/bookings', { method: 'POST', body: payload });
