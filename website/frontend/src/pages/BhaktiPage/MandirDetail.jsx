import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from './bhaktiApi.js';
import { usePageMeta } from './usePageMeta.js';
import { SkelPage } from './Skeleton.jsx';
import { useLang, pick } from './lang.js';

export default function MandirDetail() {
  const { slug } = useParams();
  const lang = useLang();
  const [t, setT] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setT(null); setErr('');
    api(`/temples/${slug}`).then(setT).catch((e) => setErr(e instanceof ApiError && e.status === 404 ? (lang === 'hi' ? 'यह मंदिर पृष्ठ उपलब्ध नहीं है।' : 'This temple page is not available.') : (e.message || (lang === 'hi' ? 'लोड नहीं हो सका' : 'Could not load'))));
  }, [slug, lang]);

  usePageMeta(t && `${t.name_en}, ${t.city}`, t && t.summary);
  if (err) return <div className="bh-panel bh-signin"><h1 className="bh-title">{err}</h1><Link className="bh-btn bh-btn-maroon" to="/bhakti/mandir-darshan">{lang === 'hi' ? 'सभी मंदिर' : 'All temples'}</Link></div>;
  if (!t) return <SkelPage label={lang === 'hi' ? 'मंदिर लोड हो रहा है' : 'Loading temple'} />;

  // Directions open the visitor's own maps app with a search for the temple; we do not store or guess coordinates.
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.name_en}, ${t.city}, ${t.state}`)}`;
  return (
    <div>
      <div className="bh-sec-title"><div translate="no"><h1 className="bh-title">{pick(lang, t.name_en, t.name_hi)}</h1><div className="bh-small">{t.city}, {t.state}</div></div></div>
      {!t.is_verified && <div className="bh-msg" role="note">{lang === 'hi' ? 'यह विवरण अभी आधिकारिक स्रोतों से जाँचा जा रहा है।' : 'This summary has not yet been checked against official sources.'}</div>}

      {t.image_url && (
        <figure style={{ margin: '0 0 16px' }}>
          <img src={t.image_url} alt={t.name_en} loading="lazy" style={{ width: '100%', borderRadius: 14, display: 'block' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          {t.image_credit && <figcaption className="bh-small">{t.image_credit}</figcaption>}
        </figure>
      )}

      <div className="bh-grid">
        <div>
          <div className="bh-panel"><h3>{lang === 'hi' ? 'इतिहास व परिचय' : 'History'}</h3><p style={{ lineHeight: 1.7, margin: 0 }} translate="no">{t.summary}</p></div>
          {t.significance && <div className="bh-panel"><h3>{lang === 'hi' ? 'धार्मिक महत्व' : 'Significance'}</h3><p style={{ lineHeight: 1.7, margin: 0 }} translate="no">{t.significance}</p></div>}
          {t.festivals.length > 0 && <div className="bh-panel"><h3>{pick(lang, 'Festivals', 'त्योहार')}</h3><ul className="bh-list">{t.festivals.map((f) => <li key={f}><span translate="no">{f}</span></li>)}</ul></div>}
          {t.nearby.length > 0 && (
            <div className="bh-panel"><h3>{lang === 'hi' ? 'निकटवर्ती मंदिर' : 'Other temples nearby'}</h3>
              <ul className="bh-list">{t.nearby.map((n) => <li key={n.slug} translate="no"><Link to={`/bhakti/mandir-darshan/${n.slug}`}>{pick(lang, n.name_en, n.name_hi)}</Link><span className="bh-small">{n.city}</span></li>)}</ul>
              <p className="bh-small">{lang === 'hi' ? 'शहर और राज्य अनुसार। यात्रा से पूर्व मानचित्र पर दूरी अवश्य जाँच लें।' : 'Shown by city, then state. Check distances on your map before planning.'}</p>
            </div>
          )}
        </div>
        <aside>
          <div className="bh-panel">
            <h3>{pick(lang, 'Visit', 'यात्रा')}</h3>
            <p className="bh-small" style={{ marginTop: 0 }}>{lang === 'hi' ? 'प्रमुख देवता:' : 'Deity:'} <span translate="no">{t.deity || '—'}</span></p>
            {t.timings_note
              ? <p style={{ margin: '0 0 8px' }}><b>{lang === 'hi' ? 'समय:' : 'Timings:'}</b> <span translate="no">{t.timings_note}</span><br /><a className="bh-small" href={t.timings_source_url} target="_blank" rel="noopener noreferrer" style={{ color: '#650F23', fontWeight: 700 }}>{lang === 'hi' ? 'स्रोत ↗' : 'Source ↗'}</a></p>
              : <p className="bh-small">{lang === 'hi' ? 'दर्शन समय में बदलाव संभव है। कृपया मंदिर कार्यालय या आधिकारिक वेबसाइट से पुष्टि करें।' : 'Timings are not listed here because they change. Please check the official website or the temple office.'}</p>}
            <div className="bh-row" style={{ flexDirection: 'column', alignItems: 'stretch', margin: 0 }}>
              <a className="bh-btn bh-btn-maroon" href={maps} target="_blank" rel="noopener noreferrer">📍 {lang === 'hi' ? 'मार्ग देखें' : 'Directions'}</a>
              {t.official_url ? <a className="bh-btn bh-btn-ghost" href={t.official_url} target="_blank" rel="noopener noreferrer">{lang === 'hi' ? 'आधिकारिक वेबसाइट ↗' : 'Official website ↗'}</a> : <span className="bh-small">{lang === 'hi' ? 'कोई आधिकारिक वेबसाइट उपलब्ध नहीं है।' : 'No official website on record yet.'}</span>}
              {t.virtual_darshan_url && <a className="bh-btn bh-btn-ghost" href={t.virtual_darshan_url} target="_blank" rel="noopener noreferrer">{lang === 'hi' ? 'लाइव दर्शन ↗' : 'Virtual darshan ↗'}</a>}
            </div>
          </div>
          <p className="bh-small">{lang === 'hi' ? 'स्रोत:' : 'Source:'} <span translate="no">{t.source}</span></p>
        </aside>
      </div>
      <div className="bh-row"><Link className="bh-btn bh-btn-ghost" to="/bhakti/mandir-darshan">{lang === 'hi' ? '← सभी मंदिर' : '← All temples'}</Link></div>
    </div>
  );
}
