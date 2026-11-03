import { useCallback, useEffect, useRef, useState } from 'react';
import { api, ApiError, newEventId, loadLocal, saveLocal, getToken } from './bhaktiApi.js';

// Re-renders when the signed-in state changes (login, logout, another tab).
export function useSignedIn() {
  const [token, setToken] = useState(getToken());
  useEffect(() => {
    const t = setInterval(() => setToken((cur) => { const n = getToken(); return n === cur ? cur : n; }), 1500);
    return () => clearInterval(t);
  }, []);
  return !!token;
}

export function openLogin() {
  if (window.App && window.App.openAuthModal) window.App.openAuthModal('login');
}

/**
 * Jaap session with optimistic counting. Every tap becomes an event with its own id, queued locally and
 * replayed in batches; the server ignores ids it has already seen, so retries and offline replays never double count.
 */
export function useJaap(signedIn) {
  const [session, setSession] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const ref = useRef({ session: null, pending: [] });
  const flushing = useRef(false);
  const timer = useRef(null);

  const commit = useCallback((s, p) => {
    ref.current = { session: s, pending: p };
    setSession(s);
    setPending(p);
    saveLocal(s ? { session: s, pending: p } : null);
  }, []);

  const flush = useCallback(async () => {
    const { session: s, pending: p } = ref.current;
    if (flushing.current || !s || !p.length) return;
    flushing.current = true;
    const batch = p.slice(0, 500);
    try {
      const r = await api(`/jaap/sessions/${s.id}/events/batch`, { method: 'POST', body: { events: batch } });
      const sent = new Set(batch.map((e) => e.event_id));
      const cur = ref.current;
      const rest = cur.pending.filter((e) => !sent.has(e.event_id));
      // With nothing left unsent, the server's total is authoritative.
      const next = cur.session && cur.session.id === s.id && !rest.length
        ? { ...cur.session, count: r.session.count, status: r.session.status } : cur.session;
      commit(next, rest);
      setError('');
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 409)) {
        const cur = ref.current;
        commit(e.status === 409 && cur.session ? { ...cur.session, status: 'completed' } : null, []);
        setError(e.status === 404 ? 'That session no longer exists. Please start a new one.' : '');
      } else if (e instanceof ApiError && e.status === 401) {
        setError('Please sign in again to sync your jaap.');
      } else {
        setError('Offline: your jaap is saved on this device and will sync automatically.');
      }
    } finally {
      flushing.current = false;
    }
  }, [commit]);

  const schedule = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, 500);
  }, [flush]);

  // Resume: an unfinished session on this device (with unsent taps) first, otherwise the server's.
  useEffect(() => {
    let alive = true;
    if (!signedIn) { commit(null, []); setReady(true); return undefined; }
    (async () => {
      const local = loadLocal();
      if (local && local.session && local.session.status !== 'completed') {
        commit(local.session, local.pending || []);
        if (alive) setReady(true);
        flush();
        return;
      }
      try {
        const r = await api('/jaap/sessions/active');
        if (alive && r.session) commit(r.session, []);
      } catch (e) { /* offline: start fresh when back online */ }
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
  }, [signedIn, commit, flush]);

  useEffect(() => {
    const t = setInterval(flush, 8000);
    window.addEventListener('online', flush);
    return () => { clearInterval(t); clearTimeout(timer.current); window.removeEventListener('online', flush); };
  }, [flush]);

  const start = useCallback(async (mantraId, mode, target) => {
    setError('');
    const s = await api('/jaap/sessions', { method: 'POST', body: { mantra_id: mantraId, mode, target } });
    commit(s, []);
    return s;
  }, [commit]);

  const add = useCallback((delta, source = 'manual', eventId) => {
    const { session: s, pending: p } = ref.current;
    if (!s || s.status === 'completed' || s.status === 'paused') return false;
    if (delta > 0 && s.count >= s.target) return false;
    const applied = Math.max(delta, -s.count);
    if (!applied) return false;
    const count = s.count + applied;
    const next = { ...s, count, status: count >= s.target ? 'completed' : s.status };
    commit(next, [...p, { event_id: eventId || newEventId(), delta: applied, source, occurred_at: new Date().toISOString() }]);
    schedule();
    return true;
  }, [commit, schedule]);

  const setStatus = useCallback(async (status) => {
    const s = ref.current.session;
    if (!s) return;
    commit({ ...s, status }, ref.current.pending); // pausing is local first so taps stop immediately
    try { await flush(); await api(`/jaap/sessions/${s.id}`, { method: 'PATCH', body: { status } }); } catch (e) { /* retried on next action */ }
  }, [commit, flush]);

  const finish = useCallback(async () => {
    const s = ref.current.session;
    if (!s) return;
    await flush();
    try { await api(`/jaap/sessions/${s.id}`, { method: 'DELETE' }); } catch (e) { /* already closed */ }
    commit(null, []);
  }, [commit, flush]);

  return { session, pending: pending.length, error, ready, start, add, setStatus, finish, flush };
}
