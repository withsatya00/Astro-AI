import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from './bhaktiApi.js';
import { SkelPage } from './Skeleton.jsx';
import { usePageMeta } from './usePageMeta.js';
import { useLang, pick } from './lang.js';

export default function PujaDetail() {
  const { slug } = useParams();
  const lang = useLang();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [have, setHave] = useState({}); // a personal checklist of items; kept only on this page
  const [guide, setGuide] = useState(-1);

  useEffect(() => {
    setP(null); setErr(''); setHave({}); setGuide(-1);
    api(`/puja/${slug}`).then(setP).catch((e) => setErr(e instanceof ApiError && e.status === 404 ? (lang === 'hi' ? 'यह पूजा विधि उपलब्ध नहीं है।' : 'This puja guide is not available.') : (e.message || (lang === 'hi' ? 'लोड नहीं हो सका' : 'Could not load'))));
  }, [slug, lang]);

  usePageMeta(p && `${p.title_en} puja vidhi`, p && p.summary);
  if (err) return <div className="bh-panel bh-signin"><h1 className="bh-title">{err}</h1><Link className="bh-btn bh-btn-maroon" to="/bhakti/puja-vidhi">{lang === 'hi' ? 'सभी पूजा विधियां' : 'All puja guides'}</Link></div>;
  if (!p) return <SkelPage label={lang === 'hi' ? 'पूजा विधि लोड हो रही है' : 'Loading puja guide'} />;
  const ready = p.samagri.filter((_, i) => have[i]).length;
  const speak = (i) => {
    const step = p.steps[i]; if (!step) return;
    setGuide(i);
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(`${step.title}. ${step.text || ''}`); u.lang = 'hi-IN'; u.rate = 0.88; window.speechSynthesis.speak(u); }
  };

  return (
    <div>
      <div className="bh-sec-title"><div translate="no"><h1 className="bh-title">{pick(lang, p.title_en, p.title_hi)}</h1></div></div>
      {!p.is_verified && <div className="bh-msg" role="note">{lang === 'hi' ? 'यह पूजा विधि संपादकों द्वारा जाँची जा रही है। पारिवारिक रीति-रिवाजों का सम्मान करें।' : 'This guide has not yet been checked by an editor against a source. Please follow your family’s custom where it differs.'}</div>}
      {p.summary && <p style={{ margin: '0 0 12px' }} translate="no">{p.summary}</p>}

      <div className="bh-grid">
        <div>
          <div className="bh-panel">
            <div className="bh-sec-title" style={{ margin: 0 }}><h3>{lang === 'hi' ? 'पूजन विधि के चरण' : 'Steps'}</h3><button type="button" className="bh-btn bh-btn-ghost" onClick={() => speak(guide < 0 ? 0 : guide)}>{lang === 'hi' ? 'ऑडियो मार्गदर्शन' : 'Guided mode'}</button></div>
            {guide >= 0 && <div className="bh-msg ok"><b>{lang === 'hi' ? `चरण ${guide + 1} / ${p.steps.length}:` : `Step ${guide + 1} of ${p.steps.length}:`}</b> <span translate="no">{p.steps[guide].title}</span><div className="bh-row"><button className="bh-btn bh-btn-ghost" disabled={guide === 0} onClick={() => speak(guide - 1)}>{lang === 'hi' ? 'पिछला' : 'Previous'}</button><button className="bh-btn bh-btn-maroon" onClick={() => guide + 1 < p.steps.length ? speak(guide + 1) : setGuide(-1)}>{guide + 1 < p.steps.length ? (lang === 'hi' ? 'अगला चरण' : 'Next step') : (lang === 'hi' ? 'संपन्न' : 'Complete')}</button></div></div>}
            <ol className="bh-steps">
              {p.steps.map((s, i) => <li key={i} className={guide === i ? 'bh-step-active' : ''} translate="no"><b>{s.title}</b>{s.text ? <span>{s.text}</span> : null}</li>)}
            </ol>
          </div>
          {p.notes && <div className="bh-panel"><h3>{lang === 'hi' ? 'विशेष ध्यान दें' : 'Please note'}</h3><p style={{ margin: 0, lineHeight: 1.7 }} translate="no">{p.notes}</p></div>}
        </div>
        <aside>
          <div className="bh-panel">
            <h3>{lang === 'hi' ? 'पूजा सामग्री' : 'Samagri (what you need)'}</h3>
            <p className="bh-small" style={{ marginTop: 0 }}>{lang === 'hi' ? `${p.samagri.length} में से ${ready} तैयार` : `${ready} of ${p.samagri.length} ready`}</p>
            <ul className="bh-list">
              {p.samagri.map((s, i) => (
                <li key={i}><label className="bh-admin-check" style={{ minHeight: 32 }}>
                  <input type="checkbox" checked={!!have[i]} onChange={(e) => setHave({ ...have, [i]: e.target.checked })} />
                  <span translate="no">{s.item}{s.note ? <span className="bh-small"> · {s.note}</span> : null}</span>
                </label></li>
              ))}
            </ul>
          </div>
          <div className="bh-panel">
            <h3>{lang === 'hi' ? 'प्रामाणिक स्रोत' : 'Sources'}</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }} className="bh-small" translate="no">
              {p.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#650F23', fontWeight: 700 }}>{s.title} ↗</a> : s.title}{s.note ? ` — ${s.note}` : ''}</li>)}
            </ul>
            <p className="bh-small" style={{ marginBottom: 0 }}>{lang === 'hi' ? 'अंतिम समीक्षा:' : 'Last reviewed:'} {p.reviewed_on || '—'}{p.is_verified ? (lang === 'hi' ? ' · प्रमाणित' : ' · Verified') : (lang === 'hi' ? ' · समीक्षाधीन' : ' · Not yet verified')}</p>
          </div>
        </aside>
      </div>
      <div className="bh-cta-card">
        <div><b>{lang === 'hi' ? 'यह पूजा पंडित जी द्वारा करवाना चाहते हैं?' : 'Want this puja performed by learned priests?'}</b><span className="bh-small">{lang === 'hi' ? 'मंदिर सेवा में अपने नाम व गोत्र से संकल्प पूजा बुक करें या पवित्र सामग्री मँगवाएं।' : 'Book personal sankalp puja at holy shrines or order sacred essentials.'}</span></div>
        <div className="bh-cta-actions">
          <Link className="bh-btn bh-btn-maroon" to="/mandir-seva/puja" data-track="puja_vidhi_book">{lang === 'hi' ? 'पूजा बुक करें' : 'Book Pooja'}</Link>
          <Link className="bh-btn bh-btn-ghost" to="/astro-mall?category=puja_essentials" data-track="puja_vidhi_samagri">{lang === 'hi' ? 'पूजा सामग्री' : 'Puja Essentials'}</Link>
        </div>
      </div>
      <div className="bh-row">
        <Link className="bh-btn bh-btn-ghost" to="/bhakti/puja-vidhi">{lang === 'hi' ? '← सभी पूजा विधियां' : '← All puja guides'}</Link>
        <Link className="bh-btn bh-btn-ghost" to="/bhakti/naam-jaap">{lang === 'hi' ? 'मंत्र जप करें →' : 'Chant a mantra →'}</Link>
      </div>
    </div>
  );
}
