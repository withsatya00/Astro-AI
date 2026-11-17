import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useLang, pick } from './lang.js';

export default function MandirList() {
  const lang = useLang();
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
      api(`/temples?${qs}`).then((d) => { setItems(d); setErr(''); }).catch((e) => setErr(e.message || (lang === 'hi' ? 'मंदिर सूची लोड नहीं हो सकी' : 'Could not load temples')));
    }, 250);
    return () => clearTimeout(t);
  }, [state, q, lang]);

  return (
    <div>
      <div className="bh-sec-title"><h1 className="bh-title">{lang === 'hi' ? 'मंदिर दर्शन' : 'Mandir Darshan'}</h1></div>
      <div className="bh-panel">
        <div className="bh-form">
          <label>
            {lang === 'hi' ? 'खोजें' : 'Search'}
            <input type="search" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder={lang === 'hi' ? 'मंदिर, शहर या देवता खोजें…' : 'Temple, city or deity…'} />
          </label>
          <label>{pick(lang, 'State', 'राज्य')}
            <select value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">{lang === 'hi' ? 'सभी राज्य' : 'All states'}</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {!items && !err && <p className="bh-small" style={{ marginTop: 12 }}>{lang === 'hi' ? 'लोड हो रहा है…' : 'Loading…'}</p>}
      {items && items.length === 0 && <div className="bh-panel bh-signin" style={{ marginTop: 16 }}><h3>{lang === 'hi' ? 'कोई मंदिर नहीं मिला' : 'No temples match'}</h3><p className="bh-small">{lang === 'hi' ? 'अन्य नाम या राज्य चुनकर पुनः प्रयास करें।' : 'Try a different search or state.'}</p></div>}
      {items && items.length > 0 && (
        <div className="bh-cards" style={{ marginTop: 16 }}>
          {items.map((t) => (
            <Link key={t.slug} to={`/bhakti/mandir-darshan/${t.slug}`} className="bh-card">
              <div className="bh-card-ic" aria-hidden="true">🛕</div>
              <div style={{ minWidth: 0 }} translate="no">
                <h3>{pick(lang, t.name_en, t.name_hi)}</h3>
                <p>{t.city}, {t.state}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
      <p className="bh-small" style={{ marginTop: 16 }}>{lang === 'hi' ? 'दर्शन समय, प्रवेश नियम और विशेष सेवाएं बदल सकती हैं। यात्रा से पूर्व मंदिर के आधिकारिक स्रोतों से पुष्टि करें।' : 'Timings, entry rules and special services change. Always confirm them with the temple’s own official channel before you travel.'}</p>
    </div>
  );
}
