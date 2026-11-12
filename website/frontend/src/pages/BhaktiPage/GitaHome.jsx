import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useSignedIn } from './useJaap.js';
import { useLang, pick, other } from './lang.js';

export default function GitaHome() {
  const signedIn = useSignedIn();
  const lang = useLang();
  const [chapters, setChapters] = useState(null);
  const [daily, setDaily] = useState(null);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/gita/chapters').then(setChapters).catch((e) => setErr(e.message || 'Could not load the Gita'));
    api('/gita/daily').then((d) => setDaily(d.verse)).catch(() => {});
  }, [signedIn]);

  useEffect(() => {
    if (q.trim().length < 2) { setHits(null); return undefined; }
    const t = setTimeout(() => api(`/gita/search?q=${encodeURIComponent(q.trim())}`).then(setHits).catch(() => setHits([])), 300);
    return () => clearTimeout(t);
  }, [q]);

  const available = chapters ? chapters.reduce((n, c) => n + c.available, 0) : 0;
  return (
    <div>
      <div className="bh-sec-title"><h1 className="bh-title">Bhagavad Gita (भगवद्गीता)</h1></div>
      {daily && (
        <div className="bh-panel" style={{ marginBottom: 16 }}>
          <h3>Aaj Ka Shlok · {daily.chapter}.{daily.verse}</h3>
          <p className="bh-quote" lang="sa" translate="no" style={{ whiteSpace: 'pre-line' }}>{daily.text_sa}</p>
          <p className="bh-small" translate="no">{pick(lang, daily.meaning_en, daily.meaning_hi)}</p>
          <Link className="bh-btn bh-btn-ghost" to={`/bhakti/bhagavad-gita/${daily.chapter}#v${daily.verse}`}>Read in chapter {daily.chapter} →</Link>
        </div>
      )}
      <div className="bh-panel">
        <label className="bh-form" style={{ display: 'grid' }}><span className="bh-small" style={{ fontWeight: 700 }}>Search verses (Sanskrit, Roman or meaning)</span>
          <input type="search" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder="e.g. karma, आत्मा, refuge" style={{ minHeight: 44, border: '1px solid #E8D7BA', borderRadius: 10, padding: '0 12px', font: 'inherit' }} />
        </label>
        {hits && (hits.length === 0 ? <p className="bh-small">No verse matches yet. Only the verses published so far are searchable.</p>
          : <ul className="bh-list" translate="no">{hits.map((v) => <li key={v.id}><Link to={`/bhakti/bhagavad-gita/${v.chapter}#v${v.verse}`}><b>{v.chapter}.{v.verse}</b> · {pick(lang, v.meaning_en, v.meaning_hi).slice(0, 90)}…</Link></li>)}</ul>)}
      </div>
      {chapters && <p className="bh-small" style={{ margin: '14px 0 0' }}>{available} of 700 verses are published so far; more are added as each is checked against its source.</p>}
      {err && <div className="bh-msg" role="alert">{err}</div>}
      <div className="bh-cards" style={{ marginTop: 12 }}>
        {(chapters || []).map((c) => (
          <Link key={c.number} to={`/bhakti/bhagavad-gita/${c.number}`} className="bh-card">
            <div className="bh-card-ic" aria-hidden="true" style={{ fontSize: 20, fontWeight: 800 }}>{c.number}</div>
            <div style={{ minWidth: 0 }} translate="no">
              <h3>{pick(lang, c.name_en, c.name_hi)}</h3>
              <p>{pick(other(lang), c.name_en, c.name_hi)} · {c.available}/{c.verse_count} {lang === 'hi' ? 'श्लोक' : 'verses'}{signedIn && c.read ? ` · ${c.read} ${lang === 'hi' ? 'पढ़े' : 'read'}` : ''}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
