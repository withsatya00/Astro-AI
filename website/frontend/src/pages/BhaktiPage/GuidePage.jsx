import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from './bhaktiApi.js';

const MAX = 500;
const STARTERS = [
  'What does the Gita say about acting without attachment to results?',
  'Explain Advaita Vedanta in simple words',
  'What are the four Mahavakyas?',
  'गीता में कर्म के बारे में क्या कहा गया है?',
  'Tell me about the Hanuman Chalisa',
];

// [S1] markers in the explanation become links to the matching source card below it.
function Explanation({ text, idPrefix }) {
  return (
    <p style={{ margin: 0, lineHeight: 1.75 }}>
      {text.split(/(\[S\d+\])/g).map((part, i) => {
        const m = part.match(/^\[(S\d+)\]$/);
        // The site sets <base href="/">, which would turn a "#id" link into a jump to the home page, so open the card in place instead.
        const jump = (e) => {
          e.preventDefault();
          const el = document.getElementById(`${idPrefix}-${m[1]}`);
          if (el) { el.open = true; el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
        };
        return m ? <a key={i} href={`#${idPrefix}-${m[1]}`} onClick={jump} className="bh-cite" aria-label={`Source ${m[1]}`}>{m[1]}</a> : <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </p>
  );
}

function SourceCard({ s, idPrefix }) {
  return (
    <details id={`${idPrefix}-${s.ref}`} className="bh-src">
      <summary>
        <span className="bh-cite">{s.ref}</span> <b>{s.title}</b>
        <span className="bh-small"> · {s.kind_label}{s.school ? ` · ${s.school}` : ''}</span>
        <span className={`bh-badge ${s.is_verified ? 'on' : ''}`} style={{ marginLeft: 8 }}>{s.is_verified ? 'Verified' : 'Not yet verified'}</span>
      </summary>
      {s.original && <><div className="bh-src-label">Scripture text (copied as stored)</div><div className="bh-src-text" lang="hi">{s.original}</div></>}
      {s.meaning && <><div className="bh-src-label">Meaning (this site’s own wording)</div><div className="bh-src-text">{s.meaning}</div></>}
      {s.commentary && <><div className="bh-src-label">Explanation text</div><div className="bh-src-text">{s.commentary}</div></>}
      <p className="bh-small" style={{ margin: '8px 0 0' }}>Origin: {s.source || 'not stated'} · Licence: {s.license || 'not stated'}{s.path ? <> · <Link to={s.path} style={{ color: '#650F23', fontWeight: 700 }}>Open page →</Link></> : null}</p>
    </details>
  );
}

function Answer({ d, id }) {
  return (
    <div className="bh-ans" aria-live="polite">
      {d.mode === 'ai' && (
        <>
          <div className="bh-src-label" style={{ marginTop: 0 }}>Answer · AI’s own explanation, based on the sources below</div>
          <Explanation text={d.explanation} idPrefix={id} />
          {d.perspective && <p className="bh-small" style={{ margin: '8px 0 0' }}>Perspective: {d.perspective}. Other traditions may read this differently.</p>}
          {d.needs_teacher && <p className="bh-small" style={{ margin: '6px 0 0' }}>For a personal or major decision, please also speak with a qualified teacher.</p>}
        </>
      )}
      {d.mode !== 'ai' && d.message && <div className="bh-msg" role="status" style={{ margin: 0 }}>{d.message}</div>}
      {d.sources.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div className="bh-src-label" style={{ marginTop: 0 }}>Sources from this site</div>
          {d.sources.map((s) => <SourceCard key={s.ref} s={s} idPrefix={id} />)}
        </div>
      )}
      <p className="bh-small" style={{ margin: '10px 0 0' }}>{d.disclaimer}</p>
    </div>
  );
}

export default function GuidePage() {
  const [msgs, setMsgs] = useState([]);
  const [q, setQ] = useState('');
  const [lang, setLang] = useState('auto');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState(null);
  const end = useRef(null);

  useEffect(() => { api('/guide/status').then(setStatus).catch(() => {}); }, []);
  useEffect(() => { if (msgs.length && end.current) end.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [msgs, busy]);

  const ask = async (text) => {
    const question = (text ?? q).trim();
    if (question.length < 2 || busy) return;
    setErr(''); setBusy(true); setQ('');
    const history = msgs.slice(-6).map((m) => (m.role === 'user' ? { role: 'user', content: m.text.slice(0, MAX) } : { role: 'assistant', content: (m.data.explanation || '').slice(0, MAX) }));
    setMsgs((m) => [...m, { role: 'user', text: question }]);
    try {
      const data = await api('/guide/ask', { method: 'POST', body: { question, language: lang, history } });
      setMsgs((m) => [...m, { role: 'ai', data, id: `a${m.length}` }]);
    } catch (e) {
      setErr(e instanceof ApiError && e.status === 429 ? e.message : (e.status === 422 ? e.message : 'Could not reach the guide right now. Please try again in a moment.'));
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="bh-sec-title"><h2>AI Spiritual Guide (आध्यात्मिक मार्गदर्शक)</h2></div>
      <p className="bh-small" style={{ marginTop: 0 }}>
        Ask about the Bhagavad Gita, mantras, Vedanta, puja and temples. Answers are built only from the texts published on this site, and every answer shows its sources.
        {status && !status.ai_available && ' The AI explanation is switched off right now, so you will see the matching texts only.'}
      </p>

      {msgs.length === 0 && (
        <div className="bh-panel">
          <h3>Try asking</h3>
          <div className="bh-row" style={{ justifyContent: 'flex-start' }}>
            {STARTERS.map((s) => <button key={s} type="button" className="bh-btn bh-btn-ghost" style={{ textAlign: 'left', height: 'auto', minHeight: 44, padding: '8px 14px' }} onClick={() => ask(s)}>{s}</button>)}
          </div>
        </div>
      )}

      <div className="bh-chat">
        {msgs.map((m, i) => (m.role === 'user'
          ? <div key={i} className="bh-bubble bh-bubble-user">{m.text}</div>
          : <div key={i} className="bh-bubble"><Answer d={m.data} id={m.id} /></div>))}
        {busy && <div className="bh-bubble" role="status">Searching the texts…</div>}
        <div ref={end} />
      </div>
      {err && <div className="bh-msg" role="alert">{err}</div>}

      {msgs.some((m) => m.role === 'ai' && (m.data.needs_teacher || m.data.mode !== 'ai')) && (
        <div className="bh-cta-card" style={{ marginBottom: 12 }}>
          <div><b>Vyaktigat margdarshan chahiye?</b><span className="bh-small">Kundali ya jeevan ke nirnay jaise sawal ke liye kisi anubhavi jyotishi se seedhe baat karein.</span></div>
          <div className="bh-cta-actions"><Link className="bh-btn bh-btn-maroon" to="/astrologers">Astrologer se baat karein</Link></div>
        </div>
      )}

      <form className="bh-chat-form" onSubmit={(e) => { e.preventDefault(); ask(); }}>
        <label className="bh-small" htmlFor="guide-q" style={{ fontWeight: 700 }}>Your question</label>
        <textarea id="guide-q" rows={2} maxLength={MAX} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask in English or हिन्दी…"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }} />
        <div className="bh-row" style={{ justifyContent: 'space-between', margin: 0 }}>
          <span className="bh-small">{q.length}/{MAX}</span>
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select aria-label="Answer language" value={lang} onChange={(e) => setLang(e.target.value)} style={{ minHeight: 44, borderRadius: 10, border: '1px solid #E8D7BA', padding: '0 8px' }}>
              <option value="auto">Auto language</option><option value="en">English</option><option value="hi">हिन्दी</option>
            </select>
            <button type="submit" className="bh-btn bh-btn-maroon" disabled={busy || q.trim().length < 2}>Ask</button>
          </span>
        </div>
      </form>
    </div>
  );
}
