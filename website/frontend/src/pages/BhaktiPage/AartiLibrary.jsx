import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { Skel } from './Skeleton.jsx';
import { useLang, pick } from './lang.js';

const KINDS = [['', 'All', 'सभी'], ['aarti', 'Aarti', 'आरती'], ['chalisa', 'Chalisa', 'चालीसा'], ['stotra', 'Stotra', 'स्तोत्र']];

export default function AartiLibrary() {
  const lang = useLang();
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
      api(`/content?${qs}`).then((d) => { if (alive) { setData(d); setErr(''); } }).catch((e) => alive && setErr(e.message || (lang === 'hi' ? 'पुस्तकालय लोड नहीं हो सका' : 'Could not load the library')));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [kind, deity, q, page, lang]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.page_size)) : 1;
  return (
    <div>
      <div className="bh-sec-title">
        <h1 className="bh-title">{lang === 'hi' ? 'आरती व चालीसा' : 'Aarti & Chalisa'}</h1>
      </div>
      <div className="bh-panel">
        <div className="bh-tabs" role="tablist" aria-label={lang === 'hi' ? 'प्रकार' : 'Type'}>
          {KINDS.map(([k, en, hi]) => <button key={k || 'all'} role="tab" type="button" className="bh-tab" aria-selected={kind === k} onClick={() => set('kind', k)}>{pick(lang, en, hi)}</button>)}
        </div>
        <div className="bh-form" style={{ marginTop: 12 }}>
          <label>
            {lang === 'hi' ? 'खोजें' : 'Search'}
            <input type="search" value={q} maxLength={80} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={lang === 'hi' ? 'आरती या चालीसा खोजें…' : 'Title or text…'} />
          </label>
          <label>
            {pick(lang, 'Deity', 'देवता')}
            <select value={deity} onChange={(e) => set('deity', e.target.value)}>
              <option value="">{lang === 'hi' ? 'सभी देवता' : 'All deities'}</option>
              {deities.map((d) => <option key={d.slug} value={d.slug}>{pick(lang, d.name_en, d.name_hi)}</option>)}
            </select>
          </label>
        </div>
      </div>

      {err && <div className="bh-msg" role="alert" style={{ marginTop: 12 }}>{err}</div>}
      {!data && !err && (
        <div className="bh-cards" style={{ marginTop: 16 }} role="status" aria-label={lang === 'hi' ? 'सामग्री लोड हो रही है' : 'Loading library'}>
          {[0, 1, 2].map((i) => <div key={i} className="bh-card" aria-hidden="true"><Skel w={56} h={56} r={12} /><div style={{ flex: 1, display: 'grid', gap: 6 }}><Skel h={14} /><Skel h={10} w="60%" /></div></div>)}
        </div>
      )}
      {data && data.items.length === 0 && (
        <div className="bh-panel bh-signin" style={{ marginTop: 16 }}>
          <h3>{q || kind || deity ? (lang === 'hi' ? 'कोई परिणाम नहीं मिला' : 'Nothing matches your filters') : (lang === 'hi' ? 'पुस्तकालय तैयार किया जा रहा है' : 'The library is being prepared')}</h3>
          <p className="bh-small">{q || kind || deity ? (lang === 'hi' ? 'खोज या फ़िल्टर साफ़ करके पुनः प्रयास करें।' : 'Try clearing the search or filters.') : (lang === 'hi' ? 'प्रामाणिक स्रोत और लाइसेंस के साथ सामग्री यहाँ प्रकाशित होगी।' : 'Texts appear here once they are published with their source and licence.')}</p>
          {(q || kind || deity) && <button type="button" className="bh-btn bh-btn-maroon" onClick={() => { setQ(''); setParams({}, { replace: true }); setPage(1); }}>{lang === 'hi' ? 'सभी आरती देखें' : 'View all prayers'}</button>}
        </div>
      )}
      {data && data.items.length > 0 && (
        <div className="bh-cards" style={{ marginTop: 16 }}>
          {data.items.map((c) => (
            <Link key={c.id} to={`/bhakti/aarti-chalisa/${c.slug}`} className="bh-card">
              <div className="bh-card-ic" aria-hidden="true">{c.kind === 'aarti' ? '🪔' : c.kind === 'chalisa' ? '📜' : '🕉️'}</div>
              <div style={{ minWidth: 0 }} translate="no">
                <h3>{pick(lang, c.title_en, c.title_hi)}</h3>
                <p>{c.deity ? pick(lang, c.deity.name_en, c.deity.name_hi) : (lang === 'hi' ? (c.kind === 'aarti' ? 'आरती' : c.kind === 'chalisa' ? 'चालीसा' : 'स्तोत्र') : (c.kind === 'aarti' ? 'Aarti' : c.kind === 'chalisa' ? 'Chalisa' : 'Stotra'))}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="bh-row">
          <button type="button" className="bh-btn bh-btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>{lang === 'hi' ? '← पिछला' : '← Prev'}</button>
          <span className="bh-small">{lang === 'hi' ? `पृष्ठ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
          <button type="button" className="bh-btn bh-btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{lang === 'hi' ? 'अगला →' : 'Next →'}</button>
        </div>
      )}
    </div>
  );
}
