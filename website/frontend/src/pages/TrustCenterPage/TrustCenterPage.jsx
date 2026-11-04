import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './trust-center.css';

const KEY = 'astro_guidance_center_v1';
const EMPTY = { birth: { certainty: 'exact', note: '' }, memory: false, predictions: [], remedies: [] };
const load = () => { try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return EMPTY; } };
const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function TrustCenterPage() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState('birth');
  const [draft, setDraft] = useState('');
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage unavailable */ } }, [data]);
  const confidence = data.birth.certainty === 'exact' ? 95 : data.birth.certainty === 'approx' ? 60 : 25;
  const reviewed = useMemo(() => data.predictions.filter((x) => x.status !== 'pending').length, [data.predictions]);
  const add = (kind) => {
    if (!draft.trim()) return;
    const item = kind === 'predictions'
      ? { id: id(), text: draft.trim(), status: 'pending', created: new Date().toISOString() }
      : { id: id(), title: draft.trim(), status: 'active', freeAlternative: '', reflection: '', created: new Date().toISOString() };
    setData((d) => ({ ...d, [kind]: [item, ...d[kind]].slice(0, 50) })); setDraft('');
  };
  const update = (kind, itemId, patch) => setData((d) => ({ ...d, [kind]: d[kind].map((x) => x.id === itemId ? { ...x, ...patch } : x) }));
  const remove = (kind, itemId) => setData((d) => ({ ...d, [kind]: d[kind].filter((x) => x.id !== itemId) }));
  const download = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: 'my-astro-guidance-data.json' }); a.click(); URL.revokeObjectURL(url);
  };
  return <main className="tc-page">
    <header className="tc-hero"><div><span>GUIDANCE YOU CAN VERIFY</span><h1>Guidance &amp; Trust Center</h1><p>Birth-time confidence, prediction follow-up, practical remedies and privacy controls—together.</p></div><div className="tc-score"><b>{confidence}%</b><small>birth-time confidence</small></div></header>
    <nav className="tc-tabs" aria-label="Trust center sections">{[['birth','Birth time'],['predictions','Prediction audit'],['remedies','Remedy planner'],['privacy','Privacy'],['standards','Our standards']].map(([k,l]) => <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{l}</button>)}</nav>

    {tab === 'birth' && <section className="tc-card"><h2>How certain is your recorded birth time?</h2><p>An approximate time can change Lagna, houses and timing. The app should not present false precision.</p><div className="tc-choice">{[['exact','Exact from record'],['approx','Approximate'],['unknown','Unknown']].map(([k,l]) => <button key={k} className={data.birth.certainty === k ? 'on' : ''} onClick={() => setData({ ...data, birth: { ...data.birth, certainty: k } })}>{l}</button>)}</div><label>What do you know?<textarea value={data.birth.note} onChange={(e) => setData({ ...data, birth: { ...data.birth, note: e.target.value } })} placeholder="e.g. Between 7:00 and 7:30 AM; family says just after sunrise" /></label><div className="tc-note"><b>{confidence >= 90 ? 'High confidence' : confidence >= 50 ? 'Use a time range' : 'Avoid minute-specific claims'}</b><span>{confidence >= 90 ? 'Detailed house and Dasha analysis is suitable.' : confidence >= 50 ? 'Compare possible charts and verify against major life events.' : 'Use Moon-sign, Prashna or a Pandit-led rectification session.'}</span></div></section>}

    {tab === 'predictions' && <section className="tc-card"><div className="tc-title"><div><h2>Prediction audit</h2><p>Save important guidance and later mark what actually happened.</p></div><b>{reviewed}/{data.predictions.length} reviewed</b></div><div className="tc-add"><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a prediction or timing window" /><button onClick={() => add('predictions')}>Save</button></div><div className="tc-list">{data.predictions.map((x) => <article key={x.id}><p>{x.text}</p><select value={x.status} onChange={(e) => update('predictions', x.id, { status: e.target.value })}><option value="pending">Not reviewed yet</option><option value="accurate">Accurate</option><option value="partial">Partly accurate</option><option value="missed">Did not happen</option></select><button className="tc-link" onClick={() => remove('predictions', x.id)}>Delete</button></article>)}</div></section>}

    {tab === 'remedies' && <section className="tc-card"><h2>Practical remedy planner</h2><p>Track consistency and reflection. Traditional remedies are supportive practices—not guaranteed outcomes.</p><div className="tc-add"><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. 11-day morning mantra practice" /><button onClick={() => add('remedies')}>Add remedy</button></div><div className="tc-list">{data.remedies.map((x) => <article key={x.id}><div className="tc-title"><b>{x.title}</b><select value={x.status} onChange={(e) => update('remedies', x.id, { status: e.target.value })}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></div><label>Free or simple alternative<input value={x.freeAlternative} onChange={(e) => update('remedies', x.id, { freeAlternative: e.target.value })} placeholder="Prayer, service, journaling…" /></label><label>Your reflection<textarea value={x.reflection} onChange={(e) => update('remedies', x.id, { reflection: e.target.value })} placeholder="Did this help your calm, focus or routine?" /></label><button className="tc-link" onClick={() => remove('remedies', x.id)}>Delete</button></article>)}</div></section>}

    {tab === 'privacy' && <section className="tc-card"><h2>Your data, your choice</h2><label className="tc-toggle"><input type="checkbox" checked={data.memory} onChange={(e) => setData({ ...data, memory: e.target.checked })} /><span><b>Use saved context in future consultations</b><small>Off by default. Only information you explicitly save should be reused.</small></span></label><div className="tc-actions"><button onClick={download}>Export this data</button><button className="danger" onClick={() => { if (window.confirm('Clear all locally saved guidance data?')) setData(EMPTY); }}>Clear local data</button></div><p className="tc-foot">Account-level export or deletion remains available through Privacy &amp; Account Controls.</p></section>}

    {tab === 'standards' && <section className="tc-card"><h2>Our guidance standards</h2><div className="tc-standards">{[['No fear selling','No urgent payment or guaranteed dosha-removal claims.'],['Free option first','Every paid remedy should have a simple, low-cost alternative where possible.'],['Real review states','A Pandit-reviewed badge appears only after an actual review.'],['Uncertainty is shown','Unknown birth time or missing evidence is stated plainly.'],['Sensitive topics','Medical, legal, pregnancy and crisis decisions require qualified professional support.'],['Calculation vs interpretation','Astronomical calculation and traditional interpretation are kept distinct.']].map(([h,p]) => <article key={h}><i>✓</i><div><b>{h}</b><p>{p}</p></div></article>)}</div><Link className="tc-primary" to="/astrologers">Find a verified astrologer</Link></section>}
  </main>;
}
