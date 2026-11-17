import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useLang, pick } from './lang.js';

export default function PujaList() {
  const lang = useLang();
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/puja').then(setItems).catch((e) => setErr(e.message || (lang === 'hi' ? 'पूजा विधि लोड नहीं हो सकी' : 'Could not load the puja guides'))); }, [lang]);
  return (
    <div>
      <div className="bh-sec-title"><h1 className="bh-title">{lang === 'hi' ? 'पूजा विधि' : 'Puja Vidhi'}</h1></div>
      <p className="bh-small" style={{ marginTop: 0 }}>{lang === 'hi' ? 'घर पर पूजा की सरल, चरणबद्ध विधि। कुल परंपरा और परिवार की विधि के अनुसार अनुसरण करें।' : 'Simple, step-by-step guides for puja at home. Customs differ between families and traditions, so follow your own family’s way where it differs.'}</p>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {!items && !err && <p className="bh-small">{lang === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}</p>}
      {items && items.length === 0 && <div className="bh-panel bh-signin"><p className="bh-small">{lang === 'hi' ? 'कोई पूजा विधि अभी प्रकाशित नहीं है।' : 'No puja guides are published yet.'}</p></div>}
      {items && items.length > 0 && (
        <div className="bh-cards">
          {items.map((p) => (
            <Link key={p.slug} to={`/bhakti/puja-vidhi/${p.slug}`} className="bh-card">
              <div className="bh-card-ic" aria-hidden="true">🙏</div>
              <div style={{ minWidth: 0 }} translate="no">
                <h3>{pick(lang, p.title_en, p.title_hi)}</h3>
                {p.summary ? <p>{p.summary}</p> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
      <div className="bh-row"><Link className="bh-btn bh-btn-ghost" to="/bhakti/festivals">{lang === 'hi' ? 'त्योहार व व्रत कैलेंडर →' : 'Festival & vrat calendar →'}</Link></div>
    </div>
  );
}
