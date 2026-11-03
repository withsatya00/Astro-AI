// Bhakti API client plus the offline queue that lets the counter keep working without a connection.
const BASE = '/api/v1/bhakti';

export const getToken = () => { try { return localStorage.getItem('astro_access_token') || ''; } catch (e) { return ''; } };
export const isSignedIn = () => !!getToken();

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function api(path, { method = 'GET', body, raw } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new ApiError(0, 'Network unavailable');
  }
  if (!res.ok) {
    let detail = res.statusText;
    try { const j = await res.json(); detail = typeof j.detail === 'string' ? j.detail : detail; } catch (e) { /* not json */ }
    throw new ApiError(res.status, detail);
  }
  return raw ? res : res.json();
}

export const newEventId = () => {
  const c = typeof crypto !== 'undefined' ? crypto : null;
  return 'e-' + (c && c.randomUUID ? c.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
};

// ---- local persistence (per signed-in token, so one person's unsent taps never reach another account) ----
const key = () => `bhakti_jaap_state_v1:${getToken().slice(-16)}`;

export function loadLocal() {
  try { return JSON.parse(localStorage.getItem(key()) || 'null'); } catch (e) { return null; }
}
export function saveLocal(state) {
  try {
    if (state) localStorage.setItem(key(), JSON.stringify(state));
    else localStorage.removeItem(key());
  } catch (e) { /* storage unavailable: counter still works in memory */ }
}
