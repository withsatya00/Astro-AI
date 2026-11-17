// Shared HTTP client for the website API.
// The server keeps every chart, chat and wallet private to one owner: the signed-in account (Bearer token)
// or, before sign-in, this browser's random client id. Every request carries both.

export const API_BASE = '/api/v1';

const TOKEN_KEY = 'astro_access_token';
const USER_KEY = 'astro_user';
const CLIENT_ID_KEY = 'astro_client_id';
const CLIENT_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;

const read = (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } };
const write = (key, value) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch (e) { /* storage blocked: state lives in memory for this tab */ }
};

function createClientId() {
  const rand = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().replace(/-/g, '')
    : Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
  return ('c' + rand).slice(0, 40);
}

let clientId = read(CLIENT_ID_KEY);
if (!clientId || !CLIENT_ID_RE.test(clientId)) {
  clientId = createClientId();
  write(CLIENT_ID_KEY, clientId);
}

export const getClientId = () => clientId;
export const getToken = () => read(TOKEN_KEY) || '';

export function getStoredUser() {
  try { return JSON.parse(read(USER_KEY) || 'null'); } catch (e) { return null; }
}

export function storeSession(token, user) {
  write(TOKEN_KEY, token || null);
  write(USER_KEY, user ? JSON.stringify(user) : null);
}

// Called when the server rejects the token, so the app can drop back to guest mode.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function errorMessage(data, fallback) {
  const detail = data && data.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join('; ');
  return typeof detail === 'string' ? detail : fallback;
}

/** Adds identity headers to a fetch init for any /api/v1 URL. */
export function withIdentity(init = {}) {
  const headers = new Headers(init.headers || undefined);
  if (!headers.has('X-Client-Id')) headers.set('X-Client-Id', clientId);
  const token = getToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

/**
 * JSON request against the website API. `path` is relative to /api/v1.
 * Throws ApiError with the server's `detail` message on failure.
 */
export async function apiRequest(path, { method = 'GET', body, headers, signal, fallbackError = 'Request failed' } = {}) {
  const init = withIdentity({ method, headers, signal, cache: 'no-store' });
  if (body !== undefined) {
    init.headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch (e) {
    throw new ApiError(0, 'Network unavailable. Please check your connection.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && init.headers.has('Authorization') && !/^\/auth\/(login|register)/.test(path)) {
      onUnauthorized();
    }
    const fallback = res.status >= 500 ? 'Service is temporarily unavailable. Please try again shortly.' : fallbackError;
    throw new ApiError(res.status, errorMessage(data, fallback));
  }
  return data;
}
