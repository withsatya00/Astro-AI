import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from './bhaktiApi.js';

const KINDS = [['', 'All'], ['aarti', 'Aarti'], ['chalisa', 'Chalisa'], ['stotra', 'Stotra']];

export default function AartiLibrary() {
  const [params, setParams] = useSearchParams();
  const kind = params.get('kind') || '';
  const deity = params.get('deity') || '';
  const [q, setQ] = useState(params.get('q') || '');
  const [deities, setDeities] = useState([]);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState('');

  const set = (k, v) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); setPage(1); };

  useEffect(() => { api('/deities').then(setDeities).catch(() => {}); }, []);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ page: String(page), page_size: '24' });
      if (kind) qs.set('kind', kind);
      if (deity) qs.set('deity', deity);
      if (q.trim()) qs.set('q', q.trim());
      api(`/content?${qs}`).then((d) => { if (alive) { setData(d); setErr(''); } }).catch((e) => alive && setErr(e.message || 'Could not load the library'));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [kind, deity, q, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <div>
      <div className="bh-sec-title"><h2>Aarti &amp; Chalisa (आरती · चालीसा)</h2></div>
      <div className="bh-panel">
        <div className="bh-tabs" role="tablist" aria-label="Type">
          {KINDS.map(([k, l]) => <button key={k || 'all'} role="tab" type="button" className="bh-tab" aria-selected={kind === k} onClick={() => set('kind', k)}>{l}</button>)}
        </div>
        <div className="bh-form" style={{ marginTop: 12 }}>
          <label>Search<input type="search" value={q} maxLength={80} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Title or text…" /></label>
          <label>Deity
            <select value={deity} onChange={(e) => set('deity', e.target.value)}>
              <option value="">All deities</option>
              {deities.map((d) => <option key={d.slug} value={d.slug}>{d.name_en} — {d.name_hi}</option>)}
            </select>
          </label>
        </div>
      </div>

      {err && <div className="bh-msg" role="alert" style={{ marginTop: 12 }}>{err}</div>}
      {!data && !err && <p className="bh-small" style={{ marginTop: 12 }}>Loading…</p>}
      {data && data.items.length === 0 && (
        <div className="bh-panel bh-signin" style={{ marginTop: 16 }}>
          <h3>{q || kind || deity ? 'Nothing matches your filters' : 'The library is being prepared'}</h3>
          <p className="bh-small">{q || kind || deity ? 'Try clearing the search or filters.' : 'Texts appear here once they are published with their source and licence.'}</p>
        </div>
      )}
      {data && data.items.length > 0 && (
        <div className="bh-cards" style={{ marginTop: 16 }}>
          {data.items.map((c) => (
            <Link key={c.id} to={`/bhakti/aarti-chalisa/${c.slug}`} className="bh-card">
              <div className="bh-card-ic" aria-hidden="true">{c.kind === 'aarti' ? '🪔' : c.kind === 'chalisa' ? '📜' : '🕉️'}</div>
              <div style={{ minWidth: 0 }}>
                <h3>{c.title_hi}</h3>
                <p>{c.title_en}{c.deity ? ` · ${c.deity.name_en}` : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="bh-row">
          <button type="button" className="bh-btn bh-btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span className="bh-small">Page {page} of {totalPages}</span>
          <button type="button" className="bh-btn bh-btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
