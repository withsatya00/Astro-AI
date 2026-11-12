import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useLang, pick, other } from './lang.js';

export default function PujaList() {
  const lang = useLang();
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/puja').then(setItems).catch((e) => setErr(e.message || 'Could not load the puja guides')); }, []);
  return (
    <div>
      <div className="bh-sec-title"><h1 className="bh-title">Puja Vidhi (पूजा विधि)</h1></div>
      <p className="bh-small" style={{ marginTop: 0 }}>Simple, step-by-step guides for puja at home. Customs differ between families and traditions, so follow your own family’s way where it differs.</p>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {!items && !err && <p className="bh-small">Loading…</p>}
      {items && items.length === 0 && <div className="bh-panel bh-signin"><p className="bh-small">No puja guides are published yet.</p></div>}
      {items && items.length > 0 && (
        <div className="bh-cards">
          {items.map((p) => (
            <Link key={p.slug} to={`/bhakti/puja-vidhi/${p.slug}`} className="bh-card">
              <div className="bh-card-ic" aria-hidden="true">🙏</div>
              <div style={{ minWidth: 0 }} translate="no"><h3>{pick(lang, p.title_en, p.title_hi)}</h3><p>{pick(other(lang), p.title_en, p.title_hi)}{p.summary ? ` · ${p.summary}` : ''}</p></div>
            </Link>
          ))}
        </div>
      )}
      <div className="bh-row"><Link className="bh-btn bh-btn-ghost" to="/bhakti/festivals">Festival &amp; vrat calendar →</Link></div>
    </div>
  );
}
