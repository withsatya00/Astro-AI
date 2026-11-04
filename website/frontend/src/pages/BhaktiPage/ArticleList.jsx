import React, { useEffect, useState } from 'react';
import { api } from './bhaktiApi.js';

function Sources({ sources }) {
  if (!sources || !sources.length) return null;
  return (
    <div className="bh-small" style={{ marginTop: 10 }}>
      <b>Sources</b>
      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
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
  return (
    <details className="bh-panel bh-article">
      <summary>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: '#3E0B18', fontSize: 17 }}>{a.title_en}</span>
        {a.title_hi && <span className="bh-small" style={{ marginLeft: 8 }}>{a.title_hi}</span>}
        {a.summary && a.kind !== 'qa' && <div className="bh-small" style={{ marginTop: 2 }}>{a.summary}</div>}
      </summary>
      <div style={{ marginTop: 10, lineHeight: 1.75 }}>
        {a.body.split('\n\n').map((p, i) => <p key={i} style={{ margin: '0 0 10px' }}>{p}</p>)}
      </div>
      <Sources sources={a.sources} />
      <p className="bh-small" style={{ marginBottom: 0 }}>Last reviewed: {a.reviewed_on || '—'}{a.is_verified ? ' · Verified' : ' · Not yet verified by an editor'}</p>
    </details>
  );
}

export default function ArticleList({ section, kind, emptyText }) {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    const qs = new URLSearchParams({ section });
    if (kind) qs.set('kind', kind);
    api(`/vedanta/articles?${qs}`).then(setItems).catch((e) => setErr(e.message || 'Could not load'));
  }, [section, kind]);
  if (err) return <div className="bh-msg" role="alert">{err}</div>;
  if (!items) return <p className="bh-small">Loading…</p>;
  if (!items.length) return <p className="bh-small">{emptyText || 'Nothing published here yet.'}</p>;
  return <div>{items.map((a) => <ArticleItem key={a.slug} a={a} />)}</div>;
}
