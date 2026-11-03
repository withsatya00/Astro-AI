import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';

const PREF_KEY = 'bhakti_reader_prefs_v1';
const loadPrefs = () => { try { return { size: 22, ...(JSON.parse(localStorage.getItem(PREF_KEY) || '{}')) }; } catch (e) { return { size: 22 }; } };

export default function AartiDetail() {
  const { slug } = useParams();
  const signedIn = useSignedIn();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('hi');
  const [prefs, setPrefs] = useState(loadPrefs);
  const [fav, setFav] = useState(false);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(0);
  const [track, setTrack] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef(null);
  const body = useRef(null);

  useEffect(() => {
    setC(null); setErr('');
    api(`/content/${slug}`).then((d) => { setC(d); setFav(d.is_favourite); setTab('hi'); setTrack(0); })
      .catch((e) => setErr(e instanceof ApiError && e.status === 404 ? 'This text is not available.' : (e.message || 'Could not load')));
  }, [slug, signedIn]);

  useEffect(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }, [prefs]);

  // Reading progress follows how far the text has scrolled past the top of the viewport.
  useEffect(() => {
    const onScroll = () => {
      const el = body.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight * 0.5);
      setProgress(Math.min(100, Math.max(0, Math.round(((window.innerHeight * 0.3 - r.top) / total) * 100))));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [c, tab]);

  useEffect(() => () => { if (audio.current) audio.current.pause(); }, []);

  const toggleFav = async () => {
    if (!signedIn) { openLogin(); return; }
    try { await api(`/favourites/${c.id}`, { method: fav ? 'DELETE' : 'PUT' }); setFav(!fav); }
    catch (e) { setNote(e.message || 'Could not update favourite'); }
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: c.title_en, url });
      else { await navigator.clipboard.writeText(url); setNote('Link copied'); }
    } catch (e) { /* user cancelled */ }
  };
  const playPause = () => { const a = audio.current; if (!a) return; if (a.paused) a.play().catch(() => setNote('Could not play this audio')); else a.pause(); };

  if (err) return <div className="bh-panel bh-signin"><h2>{err}</h2><Link className="bh-btn bh-btn-maroon" to="/bhakti/aarti-chalisa">Back to library</Link></div>;
  if (!c) return <div className="bh-panel">Loading…</div>;

  const tabs = [['hi', 'हिन्दी', c.body_hi], ['roman', 'Roman', c.body_roman], ['mhi', 'अर्थ', c.meaning_hi], ['men', 'Meaning', c.meaning_en]].filter((t) => t[2]);
  const text = (tabs.find((t) => t[0] === tab) || tabs[0] || [0, 0, ''])[2];
  const tr = c.audio[track];

  return (
    <div>
      <div className="bh-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Reading progress"><i style={{ width: `${progress}%` }} /></div>
      <div className="bh-sec-title">
        <div><h2>{c.title_hi}</h2><div className="bh-small">{c.title_en}{c.deity ? ` · ${c.deity.name_en}` : ''}</div></div>
        <div className="bh-row" style={{ margin: 0 }}>
          <button type="button" className="bh-btn bh-btn-ghost" onClick={toggleFav} aria-pressed={fav}>{fav ? '♥ Saved' : '♡ Save'}</button>
          <button type="button" className="bh-btn bh-btn-ghost" onClick={share}>Share</button>
        </div>
      </div>
      {note && <div className="bh-msg ok" role="status">{note}</div>}
      {!c.is_verified && <div className="bh-msg" role="note">This text has not yet been checked against its source by our editors.</div>}

      {c.audio.length > 0 && (
        <div className="bh-panel" style={{ marginBottom: 16 }}>
          <audio ref={audio} key={tr.url} src={tr.url} preload="none" loop={repeat} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
          <div className="bh-row" style={{ justifyContent: 'flex-start', margin: 0 }}>
            <button type="button" className="bh-btn bh-btn-maroon" onClick={playPause} aria-label={playing ? 'Pause audio' : 'Play audio'}>{playing ? '⏸ Pause' : '▶ Play'}</button>
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setRepeat(!repeat)} aria-pressed={repeat}>🔁 Repeat {repeat ? 'on' : 'off'}</button>
            {c.audio.length > 1 && <select aria-label="Choose recording" value={track} onChange={(e) => { setTrack(Number(e.target.value)); setPlaying(false); }} style={{ minHeight: 44, borderRadius: 10, border: '1px solid #E8D7BA', padding: '0 10px' }}>{c.audio.map((a, i) => <option key={a.id} value={i}>{a.title}</option>)}</select>}
          </div>
          <p className="bh-small" style={{ margin: '8px 0 0' }}>{tr.title} · Source: {tr.source} · Licence: {tr.license}</p>
        </div>
      )}

      <div className="bh-panel">
        <div className="bh-row" style={{ justifyContent: 'space-between', margin: 0 }}>
          <div className="bh-tabs" role="tablist" aria-label="Language">
            {tabs.map(([k, l]) => <button key={k} role="tab" type="button" className="bh-tab" aria-selected={(tabs.find((t) => t[0] === tab) || tabs[0])[0] === k} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          <div className="bh-row" style={{ margin: 0 }} role="group" aria-label="Text size">
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setPrefs({ ...prefs, size: Math.max(14, prefs.size - 2) })} aria-label="Smaller text">A−</button>
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setPrefs({ ...prefs, size: Math.min(40, prefs.size + 2) })} aria-label="Larger text">A+</button>
          </div>
        </div>
        <div ref={body} className="bh-reader" style={{ fontSize: prefs.size }} lang={tab === 'hi' || tab === 'mhi' ? 'hi' : 'en'}>{text}</div>
        <p className="bh-small">Source: {c.source || '—'} · Licence: {c.license || '—'}{c.is_verified ? ' · Verified' : ''}</p>
      </div>
    </div>
  );
}
