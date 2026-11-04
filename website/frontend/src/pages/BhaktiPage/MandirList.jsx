import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';

export default function MandirList() {
  const [states, setStates] = useState([]);
  const [state, setState] = useState('');
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api('/temples/states').then(setStates).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams();
      if (state) qs.set('state', state);
      if (q.trim()) qs.set('q', q.trim());
      api(`/temples?${qs}`).then((d) => { setItems(d); setErr(''); }).catch((e) => setErr(e.message || 'Could not load temples'));
    }, 250);
    return () => clearTimeout(t);
  }, [state, q]);

  return (
    <div>
      <div className="bh-sec-title"><h2>Mandir Darshan (मंदिर दर्शन)</h2></div>
      <div className="bh-panel">
        <div className="bh-form">
          <label>Search<input type="search" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder="Temple, city or deity…" /></label>
          <label>State
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {!items && !err && <p className="bh-small" style={{ marginTop: 12 }}>Loading…</p>}
      {items && items.length === 0 && <div className="bh-panel bh-signin" style={{ marginTop: 16 }}><h3>No temples match</h3><p className="bh-small">Try a different search or state.</p></div>}
      {items && items.length > 0 && (
        <div className="bh-cards" style={{ marginTop: 16 }}>
          {items.map((t) => (
            <Link key={t.slug} to={`/bhakti/mandir-darshan/${t.slug}`} className="bh-card">
              <div className="bh-card-ic" aria-hidden="true">🛕</div>
              <div style={{ minWidth: 0 }}>
                <h3>{t.name_hi}</h3>
                <p>{t.name_en} · {t.city}, {t.state}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="bh-small" style={{ marginTop: 16 }}>Timings, entry rules and special services change. Always confirm them with the temple’s own official channel before you travel.</p>
    </div>
  );
}
