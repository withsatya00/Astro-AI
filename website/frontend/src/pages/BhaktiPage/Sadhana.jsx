import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const KEY = 'bhakti_sadhana_v1';
const today = () => new Date().toLocaleDateString('en-CA');
const initial = { deity: 'Shri Ram', language: 'Hinglish', family: [], sankalps: [], journal: [], routine: {} };
const read = () => { try { return { ...initial, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return initial; } };
const ROUTINE = [['prayer', 'Pratah prarthana'], ['mantra', '11 mantra jaap'], ['gita', 'Ek Gita shlok'], ['seva', 'Ek seva ya daya ka karya'], ['evening', 'Sandhya aarti']];

export default function Sadhana() {
  const [data, setData] = useState(read);
  const [tab, setTab] = useState('today');
  const [text, setText] = useState('');
  const [minutes, setMinutes] = useState(5);
  const [left, setLeft] = useState(0);
  const timer = useRef(null);
  const day = today();
  const done = data.routine[day] || [];
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode */ } }, [data]);
  useEffect(() => () => clearInterval(timer.current), []);
  const completed = useMemo(() => ROUTINE.filter(([id]) => done.includes(id)).length, [done]);

  const toggle = (id) => setData((d) => ({ ...d, routine: { ...d.routine, [day]: done.includes(id) ? done.filter((x) => x !== id) : [...done, id] } }));
  const add = (kind) => {
    if (!text.trim()) return;
    const item = { id: `${Date.now()}-${Math.random()}`, text: text.trim(), created: new Date().toISOString(), done: false };
    setData((d) => ({ ...d, [kind]: [item, ...d[kind]].slice(0, 100) })); setText('');
  };
  const startMeditation = () => {
    clearInterval(timer.current); let n = Math.max(1, minutes) * 60; setLeft(n);
    timer.current = setInterval(() => { n -= 1; setLeft(n); if (n <= 0) { clearInterval(timer.current); try { navigator.vibrate?.([100, 80, 100]); } catch (e) { /* unsupported */ } } }, 1000);
  };
  const shareSankalp = async (s) => {
    const msg = `Mera sankalp: ${s.text}. Aap apni prarthana aur sahyog dein. 🙏`;
    try { if (navigator.share) await navigator.share({ title: 'Bhakti Sankalp', text: msg, url: `${location.origin}/bhakti/sadhana` }); else await navigator.clipboard.writeText(msg); } catch (e) { /* cancelled */ }
  };
  const certificate = () => {
    const w = window.open('', '_blank'); if (!w) return; w.opener = null;
    w.document.write(`<title>Sadhana certificate</title><style>body{font-family:Georgia;text-align:center;padding:8vh;color:#650f23;background:#fff9ef}main{border:8px double #d5aa51;padding:8vh 5vw}h1{font-size:42px}p{font-size:20px}</style><main><h1>Sadhana Samman</h1><p>Daily spiritual practice completed on ${new Date().toLocaleDateString('en-IN')}.</p><p>Isht Dev: ${data.deity}</p><h2>🙏 Om Tat Sat 🙏</h2></main>`); w.document.close(); w.print();
  };
  return <div>
    <div className="bh-sec-title"><div><h2>My Sadhana</h2><p className="bh-small">Your private daily routine, sankalp and prayer journal—saved on this device.</p></div></div>
    <div className="bh-tabs" role="tablist">{[['today','Today'],['sankalp','Sankalp'],['journal','Journal'],['family','Family'],['meditate','Meditate']].map(([k,l]) => <button key={k} className="bh-tab" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'today' && <div className="bh-grid" style={{ marginTop: 16 }}><section className="bh-panel"><h3>Aaj ki sadhana · {completed}/{ROUTINE.length}</h3><div className="bh-bar"><i style={{ width: `${completed / ROUTINE.length * 100}%` }} /></div><ul className="bh-list">{ROUTINE.map(([id,label]) => <li key={id}><label className="bh-admin-check"><input type="checkbox" checked={done.includes(id)} onChange={() => toggle(id)} />{label}</label></li>)}</ul>{completed === ROUTINE.length && <button className="bh-btn bh-btn-gold" onClick={certificate}>Sadhana certificate</button>}</section><aside className="bh-panel"><h3>Personal preferences</h3><div className="bh-form"><label>Isht Dev<select value={data.deity} onChange={(e) => setData({ ...data, deity: e.target.value })}>{['Shri Ram','Shri Krishna','Shiva','Hanuman Ji','Ganesh Ji','Maa Durga','Maa Lakshmi','Vishnu'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Language<select value={data.language} onChange={(e) => setData({ ...data, language: e.target.value })}>{['Hindi','Hinglish','English','Sanskrit'].map((x) => <option key={x}>{x}</option>)}</select></label></div><div className="bh-row"><Link className="bh-btn bh-btn-maroon" to="/bhakti/naam-jaap">Naam Jaap</Link><Link className="bh-btn bh-btn-ghost" to="/bhakti/festivals">Reminders</Link></div></aside></div>}
    {(tab === 'sankalp' || tab === 'journal') && <section className="bh-panel" style={{ marginTop: 16 }}><h3>{tab === 'sankalp' ? 'Private & shareable sankalp' : 'Private prayer journal'}</h3><div className="bh-chat-form"><textarea value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder={tab === 'sankalp' ? 'e.g. 21 days of daily Hanuman Chalisa' : 'Write your prayer, gratitude or reflection…'} /><button className="bh-btn bh-btn-maroon" onClick={() => add(tab === 'sankalp' ? 'sankalps' : 'journal')}>Save</button></div><ul className="bh-list">{data[tab === 'sankalp' ? 'sankalps' : 'journal'].map((x) => <li key={x.id}><span><b>{x.text}</b><small className="bh-small">{new Date(x.created).toLocaleDateString('en-IN')}</small></span><span>{tab === 'sankalp' && <button className="bh-link" onClick={() => shareSankalp(x)}>Share</button>} <button className="bh-link" onClick={() => setData((d) => ({ ...d, [tab === 'sankalp' ? 'sankalps' : 'journal']: d[tab === 'sankalp' ? 'sankalps' : 'journal'].filter((i) => i.id !== x.id) }))}>Delete</button></span></li>)}</ul></section>}
    {tab === 'family' && <section className="bh-panel" style={{ marginTop: 16 }}><h3>Family prayer circle</h3><p className="bh-small">Names stay private on this device. Use them while taking a family sankalp.</p><div className="bh-row"><input className="bh-inline-input" value={text} maxLength={60} onChange={(e) => setText(e.target.value)} placeholder="Family member name" /><button className="bh-btn bh-btn-maroon" onClick={() => { if (text.trim()) { setData({ ...data, family: [...data.family, text.trim()].slice(0, 20) }); setText(''); } }}>Add</button></div><div className="bh-badges"><ul>{data.family.map((x,i) => <li key={`${x}-${i}`}>🙏 {x} <button className="bh-link" aria-label={`Remove ${x}`} onClick={() => setData({ ...data, family: data.family.filter((_,j) => j !== i) })}>×</button></li>)}</ul></div></section>}
    {tab === 'meditate' && <section className="bh-panel bh-signin" style={{ marginTop: 16 }}><div className="bh-meditate-orb" aria-hidden="true">ॐ</div><h3>Mantra meditation</h3><p className="bh-small">Sit comfortably, breathe slowly and repeat your chosen mantra without strain.</p>{left > 0 ? <><div className="bh-count">{Math.floor(left/60)}:{String(left%60).padStart(2,'0')}</div><button className="bh-btn bh-btn-ghost" onClick={() => { clearInterval(timer.current); setLeft(0); }}>End</button></> : <div className="bh-row"><select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="20">20 minutes</option></select><button className="bh-btn bh-btn-maroon" onClick={startMeditation}>Begin meditation</button></div>}</section>}
  </div>;
}
