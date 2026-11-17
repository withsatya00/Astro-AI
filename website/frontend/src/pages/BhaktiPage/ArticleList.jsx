import React, { useEffect, useState } from 'react';
import { api } from './bhaktiApi.js';
import { useLang, pick } from './lang.js';

function Sources({ sources }) {
  const lang = useLang();
  if (!sources || !sources.length) return null;
  return (
    <div className="bh-small" style={{ marginTop: 10 }}>
      <b>{lang === 'hi' ? 'स्रोत' : 'Sources'}</b>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }} translate="no">
        {sources.map((s, i) => (
          <li key={i}>
            {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#650F23', fontWeight: 700 }}>{s.title} ↗</a> : s.title}
            {s.note ? ` — ${s.note}` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

// One expandable item per article or Q&A, each showing its sources and when it was last reviewed.
export function ArticleItem({ a }) {
  const lang = useLang();
  return (
    <details className="bh-panel bh-article">
      <summary>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: '#3E0B18', fontSize: 17 }} translate="no">{pick(lang, a.title_en, a.title_hi)}</span>
        {a.summary && a.kind !== 'qa' && <div className="bh-small" style={{ marginTop: 2 }} translate="no">{a.summary}</div>}
      </summary>
      <div style={{ marginTop: 10, lineHeight: 1.75 }} translate="no">
        {a.body.split('\n\n').map((p, i) => <p key={i} style={{ margin: '0 0 10px' }}>{p}</p>)}
      </div>
      <Sources sources={a.sources} />
      <p className="bh-small" style={{ marginBottom: 0 }}>{lang === 'hi' ? 'अंतिम समीक्षा:' : 'Last reviewed:'} {a.reviewed_on || '—'}{a.is_verified ? (lang === 'hi' ? ' · प्रमाणित' : ' · Verified') : (lang === 'hi' ? ' · समीक्षाधीन' : ' · Under review')}</p>
    </details>
  );
}

export default function ArticleList({ section, kind, emptyText }) {
  const lang = useLang();
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    const qs = new URLSearchParams({ section });
    if (kind) qs.set('kind', kind);
    api(`/vedanta/articles?${qs}`).then(setItems).catch((e) => setErr(e.message || (lang === 'hi' ? 'लोड नहीं हो सका' : 'Could not load')));
  }, [section, kind, lang]);
  if (err) return <div className="bh-msg" role="alert">{err}</div>;
  if (!items) return <p className="bh-small">{lang === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}</p>;
  if (!items.length) return <p className="bh-small">{emptyText || (lang === 'hi' ? 'यहाँ अभी कोई सामग्री उपलब्ध नहीं है।' : 'Nothing published here yet.')}</p>;
  return <div>{items.map((a) => <ArticleItem key={a.slug} a={a} />)}</div>;
}
