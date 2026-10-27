// Small helpers shared by Mandir Seva, Astro Mall and the admin page.

import { translateError, t, applyI18n } from './shop-i18n.js';

export { t, applyI18n };

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const money = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export const isHindi = () => window.I18n?.currentLang === 'hi';

export function toast(message, type = 'info') {
  if (window.Toast && window.Toast.show) window.Toast.show(message, type);
  else console.log(`[${type}] ${message}`);
}

export const backendOrigin = () => (typeof window !== 'undefined' && window.ASTRO_BACKEND_ORIGIN) || '';

/** Photos and videos uploaded to the backend live under /uploads; on a separate frontend port they need the API origin. */
export const mediaUrl = (u) => (u && u.startsWith('/uploads/') ? backendOrigin() + u : u);

/** fetch + JSON against the backend. Throws an Error carrying the server's message and status. */
export async function api(url, options) {
  const target = url.startsWith('/api/') ? backendOrigin() + url : url;
  let res;
  try {
    res = await fetch(target, options);
  } catch (e) {
    const err = new Error(translateError('Could not reach the server. Please check that the backend is running and try again.'));
    err.status = 0;
    throw err;
  }
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : {}; } catch (e) { /* not JSON */ }
  if (json === null) {
    const err = new Error(translateError('The server returned an unexpected response. Please check that the backend is running.'));
    err.status = res.status || 502;
    throw err;
  }
  if (!res.ok) {
    const detail = Array.isArray(json.detail) ? json.detail.map(d => d.msg).join(', ') : json.detail;
    const err = new Error(translateError(typeof detail === 'string' ? detail : 'Something went wrong. Please try again.'));
    err.status = res.status;
    throw err;
  }
  return json;
}

export const postJson = (url, body) => api(url, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

/**
 * Moves a page's modals/drawers to <body>. A transformed ancestor (the page fade-in animation) would otherwise make
 * `position: fixed` relative to the page instead of the viewport.
 */
export function hoistOverlays(root, key) {
  const id = `shop-overlays-${key}`;
  let host = document.getElementById(id);
  if (!host) {
    host = document.createElement('div');
    host.id = id;
    host.className = 'shop-overlays';
    host.setAttribute('translate', 'no');
    document.body.appendChild(host);
  }
  root.querySelectorAll('.shop-modal, .shop-drawer, .shop-fab').forEach(el => host.appendChild(el));
  return host;
}

export function openModal(el) {
  if (!el) return;
  el.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

export function closeModal(el) {
  if (!el) return;
  el.classList.remove('is-open');
  if (!document.querySelector('.shop-modal.is-open, .shop-drawer.is-open')) document.body.style.overflow = '';
}

/** Click on the dimmed backdrop or Escape closes the open modal. */
export function wireDismiss(root) {
  root.querySelectorAll('.shop-modal, .shop-drawer').forEach(m => {
    m.addEventListener('mousedown', (e) => { if (e.target === m) closeModal(m); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    root.querySelectorAll('.shop-modal.is-open, .shop-drawer.is-open').forEach(closeModal);
  });
}

let creditsCache = null;
export async function loadCredits(group) {
  if (!creditsCache) {
    try { creditsCache = await (await fetch('/assets/img/credits.json')).json(); } catch (e) { creditsCache = []; }
  }
  return creditsCache.filter(c => c.file.startsWith(group + '/'));
}

export async function showCredits(modal, listEl, group) {
  const rows = await loadCredits(group);
  listEl.innerHTML = rows.map(c =>
    `<li><a href="${esc(c.page)}" target="_blank" rel="noopener">${esc(c.title)}</a> - ${esc(c.author)} (${esc(c.license)})</li>`
  ).join('') || `<li>${esc(t('credits.fallback'))}</li>`;
  openModal(modal);
}

/** Current rashi-based suggestion needs a signed-in or returning visitor with a saved kundli. */
export const stars = (rating) => {
  const full = Math.round(rating || 0);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

// ---------- sign-in, navigation and shared helpers ----------
export const isSignedIn = () => { try { return !!localStorage.getItem('astro_access_token'); } catch (e) { return false; } };

/** Orders, bookings and anything paid need an account. Opens the sign-in dialog and returns false when signed out. */
export function requireLogin(messageKey = 'auth.needed') {
  if (isSignedIn()) return true;
  toast(t(messageKey), 'info');
  if (window.App && typeof window.App.openAuthModal === 'function') window.App.openAuthModal('login');
  return false;
}

export const goTo = (path) => {
  if (window.Router && typeof window.Router.navigate === 'function') window.Router.navigate(path);
  else window.location.assign(path);
};

export const qrUrl = (code) => `${backendOrigin()}/api/v1/verify/${encodeURIComponent(code)}/qr.svg`;

/** Authenticated file download (PDF certificates): fetch with the user's token, then save the blob. */
export async function downloadFile(url, filename) {
  const res = await fetch(backendOrigin() + url);
  if (!res.ok) {
    let msg = 'Could not download the file.';
    try { msg = (await res.json()).detail || msg; } catch (e) { /* not JSON */ }
    throw new Error(translateError(msg));
  }
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

export const fmtDate = (iso, lang) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d) ? d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

export const fmtDateTime = (iso, lang) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d) ? d.toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
};

/** Creates (once) a hidden dialog host on <body>; returns the container element. `html` is only used on first call. */
export function ensureOverlay(id, html) {
  let el = document.getElementById(id);
  if (el) return el;
  el = document.createElement('div');
  el.id = id;
  el.className = 'shop-overlays';
  el.setAttribute('translate', 'no');
  el.innerHTML = html;
  document.body.appendChild(el);
  wireDismiss(el);
  el.addEventListener('click', (e) => {
    const close = e.target.closest('[data-close]');
    if (close) closeModal(el.querySelector('#' + close.getAttribute('data-close')));
  });
  return el;
}
