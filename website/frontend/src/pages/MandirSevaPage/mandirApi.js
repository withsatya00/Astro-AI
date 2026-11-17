// Shared helpers for the Mandir Seva pages (temple list, temple page, event page, my bookings).
// Everything shown on those pages comes from /api/v1/mandir/* ; nothing is invented in the browser.
import { useEffect, useState } from 'react';

export const API = '/api/v1/mandir';

const readLang = () => {
  try { return localStorage.getItem('astro_preferred_lang') === 'hi' ? 'hi' : 'en'; } catch (e) { return 'en'; }
};

// The page language ('en' | 'hi'), kept in step with the language picker.
export function useLang() {
  const [lang, setLang] = useState(readLang);
  useEffect(() => {
    const on = (e) => setLang(e.detail && e.detail.language === 'hi' ? 'hi' : 'en');
    window.addEventListener('astro:languagechange', on);
    return () => window.removeEventListener('astro:languagechange', on);
  }, []);
  return lang;
}

const getToken = () => {
  try { return localStorage.getItem('astro_access_token') || ''; } catch (e) { return ''; }
};

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function call(path, init = {}) {
  let res;
  const headers = { Accept: 'application/json', ...((init && init.headers) || {}) };
  const t = getToken();
  if (t && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${t}`;
  }
  const fullInit = { ...init, headers };

  try {
    res = await fetch(`${API}${path}`, fullInit);
  } catch (e) {
    throw new ApiError(0, 'Could not reach the server. Please try again.');
  }
  let data = null;
  try { data = await res.json(); } catch (e) { /* not json */ }
  if (!res.ok) {
    const d = data && data.detail;
    const text = typeof d === 'string' ? d
      : Array.isArray(d) ? d.map((x) => String(x.msg || '').replace(/^Value error, /, '')).filter(Boolean).join('; ')
      : '';
    throw new ApiError(res.status, text || 'Something went wrong. Please try again.');
  }
  return data;
}

export const post = (path, body, lang) =>
  call(`${path}${lang ? `?lang=${lang}` : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const dateTime = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime())
    ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';
};

export const dateOnly = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

// "2 days 3 hr" / "5 hr 10 min", worked out from a real deadline; null once it has passed.
export function timeLeft(iso, now = Date.now(), lang = 'en') {
  const ms = new Date(iso).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60;
  const hi = lang === 'hi';
  if (d) return hi ? `${d} दिन ${h} घंटे` : `${d} day${d > 1 ? 's' : ''} ${h} hr`;
  if (h) return hi ? `${h} घंटे ${m} मिनट` : `${h} hr ${m} min`;
  return hi ? `${Math.max(1, m)} मिनट` : `${Math.max(1, m)} min`;
}

export function useNow(everyMs = 30000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), everyMs); return () => clearInterval(t); }, [everyMs]);
  return now;
}

// A loader for one request that reloads when its inputs change (language, id, a manual retry).
export function useRequest(path, deps) {
  const [state, setState] = useState({ loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let on = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    call(path).then((data) => on && setState({ data })).catch((error) => on && setState({ error }));
    return () => { on = false; };
  }, [path, tick, ...(deps || [])]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, retry: () => setTick((t) => t + 1) };
}

export const CATEGORY_LABEL = {
  chadawa: 'Chadhava', abhishek: 'Abhishek', sankalp_pooja: 'Sankalp Puja', puja_tier: 'Puja package', item: 'Offering',
};

export const STATUS_LABEL = {
  PAID: 'Booked', SCHEDULED: 'Scheduled', IN_PROGRESS: 'In progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled', REFUNDED: 'Refunded',
  CONFIRMED: 'Confirmed', PENDING: 'Waiting for payment', PAYMENT_REVIEW: 'Under review', PERFORMED: 'Performed',
};
export const statusText = (s) => STATUS_LABEL[String(s || '').toUpperCase()] || String(s || '');
