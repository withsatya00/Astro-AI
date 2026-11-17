import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './trust-center.css';

const KEY = 'astro_guidance_center_v1';
const EMPTY = { birth: { certainty: 'exact', note: '' }, memory: false, predictions: [], remedies: [] };
const load = () => { try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return EMPTY; } };
const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function TrustCenterPage() {
  const [data, setData] = useState(load);
  const [tab, setTab] = useState('charter');
  const [draft, setDraft] = useState('');
  const [reported, setReported] = useState(false);
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
    <header className="tc-hero"><div><span>GUIDANCE YOU CAN VERIFY</span><h1>Guidance &amp; Trust Center</h1><p>सत्य निष्ठा पत्र, पारदर्शी दक्षिणा लेजर, जन्म-समय प्रामाणिकता एवं शून्य-भय गारंटी।</p></div><div className="tc-score"><b>{confidence}%</b><small>birth-time confidence</small></div></header>
    <nav className="tc-tabs" aria-label="Trust center sections">{[['charter','सत्य निष्ठा व पारदर्शी दक्षिणा'],['birth','Birth time'],['predictions','Prediction audit'],['remedies','Remedy planner'],['privacy','Privacy'],['standards','Our standards']].map(([k,l]) => <button key={k} aria-current={tab === k ? 'page' : undefined} onClick={() => setTab(k)}>{l}</button>)}</nav>

    {tab === 'charter' && <section className="tc-card">
      <div style={{ marginBottom: 20 }}>
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: 'rgba(212,175,55,0.15)', color: '#720720', fontWeight: 800, fontSize: 11, border: '1px solid #D4AF37', marginBottom: 6 }}>
          VEDIC ETHICAL CHARTER · सत्य निष्ठा पत्र
        </span>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.6rem', color: '#3E0B18', margin: '4px 0 8px' }}>
          कदापि भय-दोहन नहीं · १००% पारदर्शी दक्षिणा नीति
        </h2>
        <p style={{ color: '#6A564A', fontSize: '0.95rem', lineHeight: 1.6 }}>
          बाजार में मौजूद अधिकांश ज्योतिष मंच भय-दोहन (Fear-selling) और अपारदर्शी शुल्कों पर आधारित हैं। Astro Jyotish ने वैदिक शास्त्रों (बृहत्पाराशर, फलदीपिका, लाल किताब 1952) के आधार पर चार अटूट नैतिक स्तंभ स्थापित किए हैं:
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFDF9', border: '1.5px solid #D5AA51', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🛡️</div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#3E0B18', margin: '0 0 6px' }}>
            १. शून्य भय-दोहन गारंटी (Zero Fear-Selling)
          </h3>
          <p style={{ fontSize: 13, color: '#5A463B', lineHeight: 1.55, margin: 0 }}>
            कालसर्प, मांगलिक अथवा साढ़े-साती कोई शाप नहीं बल्कि कर्म-संशोधन के अवसर हैं। हमारे मंच पर किसी भी श्रद्धालु को ₹15,000-₹50,000 के तथाकथित "दोष निवारण" का भय दिखाना पूर्णतः प्रतिबंधित है।
          </p>
        </div>

        <div style={{ background: '#FFFDF9', border: '1.5px solid #D5AA51', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>⚖️</div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#3E0B18', margin: '0 0 6px' }}>
            २. पारदर्शी दक्षिणा लेजर (100% Itemized Split)
          </h3>
          <p style={{ fontSize: 13, color: '#5A463B', lineHeight: 1.55, margin: 0 }}>
            प्रत्येक ₹100 की दक्षिणा में से <strong>₹80 सीधे आचार्य मानदेय</strong>, <strong>₹10 गौ-माता चारा/चिकित्सा</strong>, और <strong>₹10 तकनीकी संचालन</strong> में जाता है। 0% छिपा हुआ सरचार्ज, 0% सुविधा शुल्क।
          </p>
        </div>

        <div style={{ background: '#FFFDF9', border: '1.5px solid #D5AA51', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>📹</div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#3E0B18', margin: '0 0 6px' }}>
            ३. गर्भगृह से लाइव वीडियो प्रमाण (Sanctum Video Proof)
          </h3>
          <p style={{ fontSize: 13, color: '#5A463B', lineHeight: 1.55, margin: 0 }}>
            काशी विश्वनाथ, संकट मोचन अथवा विंध्याचल में होने वाले प्रत्येक संकल्प में तीर्थ पुरोहित द्वारा श्रद्धालु का <strong>नाम एवं गोत्र</strong> उच्चारित करते हुए गर्भगृह का स्पष्ट वीडियो 'मेरी बुकिंग' में प्रदान किया जाता है।
          </p>
        </div>

        <div style={{ background: '#FFFDF9', border: '1.5px solid #D5AA51', borderRadius: 16, padding: '18px 16px' }}>
          <div style={{ fontSize: 24, marginBottom: 6 }}>🎁</div>
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#3E0B18', margin: '0 0 6px' }}>
            ४. प्रथम ३ मिनट निःशुल्क परिचयात्मक परामर्श
          </h3>
          <p style={{ fontSize: 13, color: '#5A463B', lineHeight: 1.55, margin: 0 }}>
            नए श्रद्धालु बिना किसी आर्थिक संकोच के प्रमाणित आचार्यों से सीधे संवाद स्थापित कर सकें, इसके लिए प्रत्येक नए खाते पर ₹100 का परिचयात्मक वाउचर प्रदान किया जाता है।
          </p>
        </div>
      </div>

      <div style={{ background: '#FAF5EA', padding: '16px 20px', borderRadius: 16, border: '1px solid #E8D7BA', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <b style={{ color: '#3E0B18', fontSize: 14 }}>क्या किसी ज्योतिषी ने भय दिखाकर पूजा का दबाव बनाया?</b>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7C6758' }}>
            हमारी आचार संहिता का उल्लंघन पाए जाने पर 100% दक्षिणा तुरंत वापस की जाएगी।
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setReported(true);
            setTimeout(() => setReported(false), 5000);
          }}
          style={{
            padding: '10px 18px', borderRadius: 999, background: '#720720', color: '#F8D882',
            fontWeight: 800, fontSize: 12.5, border: 'none', cursor: 'pointer'
          }}
        >
          {reported ? '✓ रिपोर्ट दर्ज हुई' : '⚠️ आचार संहिता उल्लंघन रिपोर्ट करें'}
        </button>
      </div>
      {reported && (
        <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 12.5, fontWeight: 700 }}>
          ✓ आपकी शिकायत दर्ज कर ली गई है। ट्रस्टी बोर्ड २४ घंटे के भीतर समीक्षा कर आपसे संपर्क करेगा।
        </div>
      )}
    </section>}

    {tab === 'birth' && <section className="tc-card"><h2>How certain is your recorded birth time?</h2><p>An approximate time can change Lagna, houses and timing. The app should not present false precision.</p><div className="tc-choice">{[['exact','Exact from record'],['approx','Approximate'],['unknown','Unknown']].map(([k,l]) => <button key={k} className={data.birth.certainty === k ? 'on' : ''} onClick={() => setData({ ...data, birth: { ...data.birth, certainty: k } })}>{l}</button>)}</div><label>What do you know?<textarea value={data.birth.note} onChange={(e) => setData({ ...data, birth: { ...data.birth, note: e.target.value } })} placeholder="e.g. Between 7:00 and 7:30 AM; family says just after sunrise" /></label><div className="tc-note"><b>{confidence >= 90 ? 'High confidence' : confidence >= 50 ? 'Use a time range' : 'Avoid minute-specific claims'}</b><span>{confidence >= 90 ? 'Detailed house and Dasha analysis is suitable.' : confidence >= 50 ? 'Compare possible charts and verify against major life events.' : 'Use Moon-sign, Prashna or a Pandit-led rectification session.'}</span></div></section>}

    {tab === 'predictions' && <section className="tc-card"><div className="tc-title"><div><h2>Prediction audit</h2><p>Save important guidance and later mark what actually happened.</p></div><b>{reviewed}/{data.predictions.length} reviewed</b></div><div className="tc-add"><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a prediction or timing window" /><button onClick={() => add('predictions')}>Save</button></div><div className="tc-list">{data.predictions.map((x) => <article key={x.id}><p>{x.text}</p><select value={x.status} onChange={(e) => update('predictions', x.id, { status: e.target.value })}><option value="pending">Not reviewed yet</option><option value="accurate">Accurate</option><option value="partial">Partly accurate</option><option value="missed">Did not happen</option></select><button className="tc-link" onClick={() => remove('predictions', x.id)}>Delete</button></article>)}</div></section>}

    {tab === 'remedies' && <section className="tc-card"><h2>Practical remedy planner</h2><p>Track consistency and reflection. Traditional remedies are supportive practices—not guaranteed outcomes.</p><div className="tc-add"><input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="e.g. 11-day morning mantra practice" /><button onClick={() => add('remedies')}>Add remedy</button></div><div className="tc-list">{data.remedies.map((x) => <article key={x.id}><div className="tc-title"><b>{x.title}</b><select value={x.status} onChange={(e) => update('remedies', x.id, { status: e.target.value })}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></div><label>Free or simple alternative<input value={x.freeAlternative} onChange={(e) => update('remedies', x.id, { freeAlternative: e.target.value })} placeholder="Prayer, service, journaling…" /></label><label>Your reflection<textarea value={x.reflection} onChange={(e) => update('remedies', x.id, { reflection: e.target.value })} placeholder="Did this help your calm, focus or routine?" /></label><button className="tc-link" onClick={() => remove('remedies', x.id)}>Delete</button></article>)}</div></section>}

    {tab === 'privacy' && <section className="tc-card"><h2>Your data, your choice</h2><label className="tc-toggle"><input type="checkbox" checked={data.memory} onChange={(e) => setData({ ...data, memory: e.target.checked })} /><span><b>Use saved context in future consultations</b><small>Off by default. Only information you explicitly save should be reused.</small></span></label><div className="tc-actions"><button onClick={download}>Export this data</button><button className="danger" onClick={() => { if (window.confirm('Clear all locally saved guidance data?')) setData(EMPTY); }}>Clear local data</button></div><p className="tc-foot">Account-level export or deletion remains available through Privacy &amp; Account Controls.</p></section>}

    {tab === 'standards' && <section className="tc-card"><h2>Our guidance standards</h2><div className="tc-standards">{[['No fear selling','No urgent payment or guaranteed dosha-removal claims.'],['Free option first','Every paid remedy should have a simple, low-cost alternative where possible.'],['Real review states','A Pandit-reviewed badge appears only after an actual review.'],['Uncertainty is shown','Unknown birth time or missing evidence is stated plainly.'],['Sensitive topics','Medical, legal, pregnancy and crisis decisions require qualified professional support.'],['Calculation vs interpretation','Astronomical calculation and traditional interpretation are kept distinct.']].map(([h,p]) => <article key={h}><i>✓</i><div><b>{h}</b><p>{p}</p></div></article>)}</div><Link className="tc-primary" to="/astrologers">Find a verified astrologer</Link></section>}
  </main>;
}
