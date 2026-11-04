// First-party, cookie-free usage events (see website/backend/app/api/events.py). No account id or IP is sent. Off when the browser says Do Not Track.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const URL = '/api/v1/events';
// Pages whose path can carry a token or private data are never reported.
const PRIVATE = /^\/(admin|dashboard|seller|my-account|rewards|profile|wallet|consult|consultation|gau-sewa\/receipt|bhakti\/admin|bhakti\/my-bhakti)/;

const optedOut = () => {
  try { return navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true; } catch (e) { return false; }
};

const sessionId = () => {
  try {
    let id = sessionStorage.getItem('aj_sid');
    if (!id) { id = `s${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`; sessionStorage.setItem('aj_sid', id); }
    return id;
  } catch (e) { return ''; }
};

export function track(name, props = {}) {
  if (optedOut()) return;
  const path = window.location.pathname;
  if (PRIVATE.test(path)) return;
  const body = JSON.stringify({ name, path: path.slice(0, 200), session_id: sessionId(), props });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(URL, new Blob([body], { type: 'application/json' }))) return;
    fetch(URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch (e) { /* analytics must never affect the page */ }
}

// Mount once inside the router: reports page views, and clicks on anything marked data-track="name".
export function Analytics() {
  const { pathname } = useLocation();
  useEffect(() => { track('page_view'); }, [pathname]);
  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest && e.target.closest('[data-track]');
      if (el) track('cta_click', { target: String(el.getAttribute('data-track')).slice(0, 60) });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
