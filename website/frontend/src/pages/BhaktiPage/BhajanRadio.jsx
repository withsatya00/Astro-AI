import React, { useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';
import { useRadio } from './RadioContext.jsx';

function AdminAdd({ categories, onAdded }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ url: '', title: '', category: 'krishna', channel: '', rights_note: '' });
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    try { const r = await api('/radio/admin/tracks', { method: 'PUT', body: f }); setMsg(r.embed_checked ? 'Added. YouTube confirmed embedding is allowed.' : 'Added, but YouTube could not be reached to confirm embedding.'); setF({ ...f, url: '', title: '' }); onAdded(); }
    catch (err) { setMsg(err.message || 'Could not add'); }
  };
  return (
    <div className="bh-panel" style={{ marginTop: 16 }}>
      <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Close' : '＋ Add a bhajan (admin)'}</button>
      {open && (
        <form className="bh-form" style={{ marginTop: 12 }} onSubmit={submit}>
          <label>YouTube link<input required value={f.url} onChange={set('url')} placeholder="https://www.youtube.com/watch?v=…" /></label>
          <label>Title<input required maxLength={200} value={f.title} onChange={set('title')} /></label>
          <label>Category<select value={f.category} onChange={set('category')}>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}</select></label>
          <label>Channel / artist<input required maxLength={200} value={f.channel} onChange={set('channel')} /></label>
          <label>Why we may show it<input required minLength={3} maxLength={300} value={f.rights_note} onChange={set('rights_note')} placeholder="e.g. Our own channel; embedding enabled" /></label>
          <div style={{ display: 'flex', alignItems: 'end' }}><button className="bh-btn bh-btn-maroon" type="submit">Add bhajan</button></div>
          {msg && <div className="bh-msg" role="status" style={{ gridColumn: '1 / -1' }}>{msg}</div>}
        </form>
      )}
    </div>
  );
}

export default function BhajanRadio() {
  const signedIn = useSignedIn();
  const radio = useRadio();
  const [cats, setCats] = useState([]);
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [tracks, setTracks] = useState(null);
  const [err, setErr] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { api('/radio/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    if (!signedIn) { setIsAdmin(false); return; }
    api('/radio/admin/tracks').then(() => setIsAdmin(true)).catch((e) => { if (!(e instanceof ApiError)) setIsAdmin(false); else setIsAdmin(false); });
  }, [signedIn]);

  const load = useCallback(() => {
    setErr('');
    if (tab === 'recent') { setTracks(radio.recent); return Promise.resolve(); }
    if (tab === 'favourites') {
      if (!signedIn) { setTracks([]); return Promise.resolve(); }
      return api('/radio/favourites').then(setTracks).catch((e) => setErr(e.message));
    }
    const qs = new URLSearchParams();
    if (tab !== 'all') qs.set('category', tab);
    if (q.trim()) qs.set('q', q.trim());
    return api(`/radio/tracks?${qs}`).then(setTracks).catch((e) => setErr(e.message || 'Could not load bhajans'));
  }, [tab, q, signedIn, radio.recent]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const toggleFav = async (t) => {
    if (!signedIn) { openLogin(); return; }
    try {
      await api(`/radio/favourites/${t.id}`, { method: t.is_favourite ? 'DELETE' : 'PUT' });
      setTracks((cur) => (tab === 'favourites' ? cur.filter((x) => x.id !== t.id) : cur.map((x) => (x.id === t.id ? { ...x, is_favourite: !t.is_favourite } : x))));
    } catch (e) { setErr(e.message); }
  };

  const tabs = [['all', 'All'], ...cats.map((c) => [c.slug, c.label]), ['favourites', '♥ Favourites'], ['recent', 'Recently played']];
  return (
    <div>
      <div className="bh-sec-title"><h2>Bhajan Radio (भजन रेडियो)</h2></div>
      <div className="bh-panel">
        <div className="bh-tabs" role="tablist" aria-label="Category">
          {tabs.map(([k, l]) => <button key={k} role="tab" type="button" className="bh-tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}
        </div>
        {tab !== 'recent' && tab !== 'favourites' && <div className="bh-form" style={{ marginTop: 12 }}><label>Search<input type="search" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder="Bhajan title…" /></label></div>}
      </div>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {tracks && tracks.length === 0 && (
        <div className="bh-panel bh-signin" style={{ marginTop: 16 }}>
          <h3>{tab === 'favourites' ? (signedIn ? 'No favourites yet' : 'Sign in to see favourites') : tab === 'recent' ? 'Nothing played yet' : 'No bhajans here yet'}</h3>
          <p className="bh-small">{tab === 'all' || cats.some((c) => c.slug === tab) ? 'Bhajans appear here once they are added with their source.' : 'Play a bhajan and it will show up here.'}</p>
        </div>
      )}
      {tracks && tracks.length > 0 && (
        <ul className="bh-list" style={{ marginTop: 16 }}>
          {tracks.map((t, i) => {
            const active = radio.current && radio.current.youtube_id === t.youtube_id;
            return (
              <li key={t.youtube_id} className="bh-track" data-active={active || undefined}>
                <button type="button" className="bh-track-play" onClick={() => radio.play(tracks, i)} aria-label={`Play ${t.title}`}>
                  <img src={`https://i.ytimg.com/vi/${t.youtube_id}/mqdefault.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                  <span aria-hidden="true">{active && radio.playing ? '⏸' : '▶'}</span>
                </button>
                <div style={{ minWidth: 0, flex: 1 }}><b className="bh-track-t">{t.title}</b><div className="bh-small">{t.channel}</div></div>
                {tab !== 'recent' && <button type="button" className="bh-btn bh-btn-ghost" aria-pressed={!!t.is_favourite} onClick={() => toggleFav(t)} aria-label={t.is_favourite ? 'Remove favourite' : 'Add favourite'}>{t.is_favourite ? '♥' : '♡'}</button>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="bh-small" style={{ marginTop: 16 }}>Bhajans play in YouTube’s own player and remain the property of their publishers. This page only links to videos whose publishers allow embedding.</p>
      {isAdmin && <AdminAdd categories={cats} onAdded={load} />}
    </div>
  );
}
