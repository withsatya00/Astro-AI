import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from './bhaktiApi.js';
import { SkelPage } from './Skeleton.jsx';
import { usePageMeta } from './usePageMeta.js';

export default function PujaDetail() {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [have, setHave] = useState({}); // a personal checklist of items; kept only on this page
  const [guide, setGuide] = useState(-1);

  useEffect(() => {
    setP(null); setErr(''); setHave({}); setGuide(-1);
    api(`/puja/${slug}`).then(setP).catch((e) => setErr(e instanceof ApiError && e.status === 404 ? 'This puja guide is not available.' : (e.message || 'Could not load')));
  }, [slug]);

  usePageMeta(p && `${p.title_en} puja vidhi`, p && p.summary);
  if (err) return <div className="bh-panel bh-signin"><h2>{err}</h2><Link className="bh-btn bh-btn-maroon" to="/bhakti/puja-vidhi">All puja guides</Link></div>;
  if (!p) return <SkelPage label="Loading puja guide" />;
  const ready = p.samagri.filter((_, i) => have[i]).length;
  const speak = (i) => {
    const step = p.steps[i]; if (!step) return;
    setGuide(i);
    if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(`${step.title}. ${step.text || ''}`); u.lang = 'hi-IN'; u.rate = 0.88; window.speechSynthesis.speak(u); }
  };

  return (
    <div>
      <div className="bh-sec-title"><div><h2>{p.title_hi || p.title_en}</h2><div className="bh-small">{p.title_en}</div></div></div>
      {!p.is_verified && <div className="bh-msg" role="note">This guide has not yet been checked by an editor against a source. Please follow your family’s custom where it differs.</div>}
      {p.summary && <p style={{ margin: '0 0 12px' }}>{p.summary}</p>}

      <div className="bh-grid">
        <div>
          <div className="bh-panel">
            <div className="bh-sec-title" style={{ margin: 0 }}><h3>Steps</h3><button type="button" className="bh-btn bh-btn-ghost" onClick={() => speak(guide < 0 ? 0 : guide)}>Guided mode</button></div>
            {guide >= 0 && <div className="bh-msg ok"><b>Step {guide + 1} of {p.steps.length}:</b> {p.steps[guide].title}<div className="bh-row"><button className="bh-btn bh-btn-ghost" disabled={guide === 0} onClick={() => speak(guide - 1)}>Previous</button><button className="bh-btn bh-btn-maroon" onClick={() => guide + 1 < p.steps.length ? speak(guide + 1) : setGuide(-1)}>{guide + 1 < p.steps.length ? 'Next step' : 'Complete'}</button></div></div>}
            <ol className="bh-steps">
              {p.steps.map((s, i) => <li key={i} className={guide === i ? 'bh-step-active' : ''}><b>{s.title}</b>{s.text ? <span>{s.text}</span> : null}</li>)}
            </ol>
          </div>
          {p.notes && <div className="bh-panel"><h3>Please note</h3><p style={{ margin: 0, lineHeight: 1.7 }}>{p.notes}</p></div>}
        </div>
        <aside>
          <div className="bh-panel">
            <h3>Samagri (what you need)</h3>
            <p className="bh-small" style={{ marginTop: 0 }}>{ready} of {p.samagri.length} ready</p>
            <ul className="bh-list">
              {p.samagri.map((s, i) => (
                <li key={i}><label className="bh-admin-check" style={{ minHeight: 32 }}>
                  <input type="checkbox" checked={!!have[i]} onChange={(e) => setHave({ ...have, [i]: e.target.checked })} />
                  <span>{s.item}{s.note ? <span className="bh-small"> · {s.note}</span> : null}</span>
                </label></li>
              ))}
            </ul>
          </div>
          <div className="bh-panel">
            <h3>Sources</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }} className="bh-small">
              {p.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: '#650F23', fontWeight: 700 }}>{s.title} ↗</a> : s.title}{s.note ? ` — ${s.note}` : ''}</li>)}
            </ul>
            <p className="bh-small" style={{ marginBottom: 0 }}>Last reviewed: {p.reviewed_on || '—'}{p.is_verified ? ' · Verified' : ' · Not yet verified'}</p>
          </div>
        </aside>
      </div>
      <div className="bh-cta-card">
        <div><b>Yeh puja pandit ji se karwana chahte hain?</b><span className="bh-small">Mandir Seva me apne naam aur sankalp se puja book karein, ya samagri Astro Mall se mangwayein.</span></div>
        <div className="bh-cta-actions">
          <Link className="bh-btn bh-btn-maroon" to="/mandir-seva/puja" data-track="puja_vidhi_book">Puja book karein</Link>
          <Link className="bh-btn bh-btn-ghost" to="/astro-mall?category=puja_essentials" data-track="puja_vidhi_samagri">Puja samagri</Link>
        </div>
      </div>
      <div className="bh-row"><Link className="bh-btn bh-btn-ghost" to="/bhakti/puja-vidhi">← All puja guides</Link><Link className="bh-btn bh-btn-ghost" to="/bhakti/naam-jaap">Chant a mantra →</Link></div>
    </div>
  );
}
