import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './bhaktiApi.js';
import { useJaap, useSignedIn, openLogin } from './useJaap.js';
import { eventIdFor, repetitionsFromResult, speechRecognitionCtor } from './jaapVoice.mjs';

const MALA = 108;
const MODES = [['manual', 'Manual'], ['voice', 'Voice'], ['mala', 'Digital Mala']];

function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* unsupported */ } }

function MalaRing({ count, onTap, disabled, celebrate }) {
  const inMala = count === 0 ? 0 : ((count - 1) % MALA) + 1;
  const beads = useMemo(() => Array.from({ length: MALA }, (_, i) => {
    const a = (i / MALA) * Math.PI * 2 - Math.PI / 2;
    return { i, x: 170 + 142 * Math.cos(a), y: 170 + 142 * Math.sin(a) };
  }), []);
  return (
    <div className={`bh-mala ${celebrate ? 'bh-bead-done' : ''}`}>
      <svg viewBox="0 0 340 340" role="img" aria-label={`Mala bead ${inMala} of ${MALA}`}>
        <circle cx="170" cy="170" r="142" fill="none" stroke="#e8d7ba" strokeWidth="2" />
        {beads.map((b) => {
          const done = b.i < inMala;
          const active = b.i === inMala - 1;
          return <circle key={b.i} cx={b.x} cy={b.y} r={active ? 6.5 : 4.6} fill={done ? '#D5AA51' : '#8a4b2f'} stroke={active ? '#650F23' : '#5b2f1c'} strokeWidth={active ? 2 : 0.8} />;
        })}
        <ellipse cx="170" cy="22" rx="7" ry="9" fill="#650F23" stroke="#D5AA51" strokeWidth="2" />
        <path d="M170 31 v10" stroke="#D5AA51" strokeWidth="2" />
      </svg>
      <div className="bh-mala-mid"><div><b>{inMala}</b><span className="bh-small">of {MALA}</span></div></div>
      <button type="button" className="bh-bead-btn" onClick={onTap} disabled={disabled} aria-label="Advance one bead" />
    </div>
  );
}

function VoicePanel({ jaap, mantra }) {
  const Ctor = speechRecognitionCtor();
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState('');
  const [note, setNote] = useState('');
  const rec = useRef(null);
  const want = useRef(false);
  const run = useRef(0);
  const done = useRef(0); // result slots already counted in this recogniser run
  const jaapRef = useRef(jaap);
  jaapRef.current = jaap;

  const stop = useCallback(() => {
    want.current = false;
    setListening(false);
    try { rec.current && rec.current.stop(); } catch (e) { /* already stopped */ }
  }, []);
  useEffect(() => stop, [stop]); // never keep listening after leaving the page

  const begin = useCallback(() => {
    if (!Ctor || !mantra) return;
    const r = new Ctor();
    r.lang = 'hi-IN';
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 3;
    run.current += 1;
    done.current = 0;
    const runId = `${Date.now().toString(36)}${run.current}`;
    r.onresult = (ev) => {
      for (let i = Math.max(ev.resultIndex, done.current); i < ev.results.length; i += 1) {
        const res = ev.results[i];
        if (!res.isFinal) { setHeard(res[0].transcript); continue; } // interim text is shown, never counted
        done.current = i + 1;
        setHeard(res[0].transcript);
        const n = repetitionsFromResult(res, mantra.match_phrases);
        for (let k = 0; k < n; k += 1) {
          const s = jaapRef.current.session;
          if (!s || !jaapRef.current.add(1, 'voice', eventIdFor(s.id, runId, i, k))) break;
        }
        if (n > 0) vibrate(8);
      }
    };
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { want.current = false; setListening(false); setNote('Microphone permission was denied. Allow it in your browser settings, or use the manual counter.'); }
      else if (e.error === 'network') setNote('Speech recognition needs an internet connection. You can switch to the manual counter.');
    };
    r.onend = () => { if (want.current) { try { begin(); } catch (e) { stop(); } } else setListening(false); };
    rec.current = r;
    want.current = true;
    try { r.start(); setListening(true); setNote(''); } catch (e) { setNote('Could not start the microphone.'); }
  }, [Ctor, mantra, stop]);

  const s = jaap.session;
  useEffect(() => { if (s && s.status !== 'active' && want.current) stop(); }, [s, stop]);

  if (!Ctor) return <div className="bh-msg">Voice counting is not supported in this browser (try Chrome or Edge). Please use the manual counter or Digital Mala.</div>;
  return (
    <div className="bh-counter">
      <p className="bh-small">Say “{mantra ? mantra.text_roman : '…'}” aloud. Only the number of completed phrases is sent; your voice is never recorded or uploaded.</p>
      <div className="bh-row">
        {listening
          ? <><span className="bh-rec" role="status"><i /> Listening…</span><button type="button" className="bh-btn bh-btn-ghost" onClick={stop}>Pause</button></>
          : <button type="button" className="bh-btn bh-btn-maroon" onClick={begin} disabled={!s || s.status !== 'active'}>🎙️ Start listening</button>}
      </div>
      {heard && <p className="bh-small" aria-live="polite">Heard: {heard}</p>}
      {note && <div className="bh-msg">{note}</div>}
    </div>
  );
}

export default function NaamJaap() {
  const signedIn = useSignedIn();
  const jaap = useJaap(signedIn);
  const { session: s } = jaap;
  const [mantras, setMantras] = useState([]);
  const [mantraId, setMantraId] = useState('');
  const [target, setTarget] = useState(MALA);
  const [mode, setMode] = useState('manual');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [celebrate, setCelebrate] = useState(false);
  const [customText, setCustomText] = useState('');

  const loadMantras = useCallback(() => api('/mantras').then((m) => { setMantras(m); setMantraId((cur) => cur || (m[0] && m[0].id) || ''); }).catch(() => setErr('Could not load mantras. Please refresh.')), []);
  useEffect(() => { loadMantras(); }, [loadMantras, signedIn]);
  useEffect(() => { if (s) { setMode(s.mode); setMantraId(s.mantra_id); } }, [s && s.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const mantra = mantras.find((m) => m.id === (s ? s.mantra_id : mantraId));
  const count = s ? s.count : 0;
  const finished = s && s.status === 'completed';

  useEffect(() => {
    if (count > 0 && count % MALA === 0) { setCelebrate(true); vibrate([30, 40, 30, 40, 80]); const t = setTimeout(() => setCelebrate(false), 1000); return () => clearTimeout(t); }
    return undefined;
  }, [count]);

  const begin = async () => {
    setBusy(true); setErr('');
    try { await jaap.start(mantraId, mode, Math.max(1, Math.min(1000000, Number(target) || MALA))); }
    catch (e) { setErr(e.message || 'Could not start the session'); }
    setBusy(false);
  };
  const reset = async () => {
    if (!window.confirm('Reset this session? What you have counted so far stays in your history.')) return;
    await jaap.finish();
  };
  const addCustom = async () => {
    if (!customText.trim()) return;
    try { const m = await api('/mantras/custom', { method: 'POST', body: { text: customText.trim() } }); setCustomText(''); await loadMantras(); setMantraId(m.id); }
    catch (e) { setErr(e.message); }
  };
  const tap = () => { if (jaap.add(1, mode === 'mala' ? 'mala' : 'manual')) vibrate(10); };

  if (!signedIn) {
    return <div className="bh-panel bh-signin"><h2>Naam Jaap</h2><p>Sign in to count your jaap, keep your history and continue on any device.</p><button type="button" className="bh-btn bh-btn-maroon" onClick={openLogin}>Sign in</button></div>;
  }

  return (
    <div>
      <div className="bh-sec-title"><h2>Naam Jaap (नाम जप)</h2></div>
      <div className="bh-tabs" role="tablist" aria-label="Jaap mode">
        {MODES.map(([k, label]) => <button key={k} role="tab" type="button" className="bh-tab" aria-selected={mode === k} disabled={!!s && !finished} onClick={() => setMode(k)}>{label}</button>)}
      </div>

      <div className="bh-panel" style={{ marginTop: 16 }}>
        {(!s || finished) ? (
          <>
            {finished && <div className="bh-msg ok">🙏 Session complete: {count} jaap, {Math.floor(count / MALA)} mala. Start another below.</div>}
            <div className="bh-form" style={{ marginTop: finished ? 12 : 0 }}>
              <label>Mantra
                <select value={mantraId} onChange={(e) => setMantraId(e.target.value)}>
                  {mantras.map((m) => <option key={m.id} value={m.id}>{m.text_roman} — {m.text_hi}{m.is_custom ? ' (mine)' : ''}</option>)}
                </select>
              </label>
              <label>{mode === 'mala' ? 'Target (jaap, usually 108 per mala)' : 'Target (jaap)'}
                <input type="number" min="1" max="1000000" value={target} onChange={(e) => setTarget(e.target.value)} />
              </label>
              <label>Add your own mantra
                <span style={{ display: 'flex', gap: 6 }}><input style={{ flex: 1 }} value={customText} maxLength={120} onChange={(e) => setCustomText(e.target.value)} placeholder="e.g. Jai Shri Shyam" /><button type="button" className="bh-btn bh-btn-ghost" onClick={addCustom}>Add</button></span>
              </label>
            </div>
            <div className="bh-row"><button type="button" className="bh-btn bh-btn-maroon" onClick={begin} disabled={busy || !mantraId}>🪔 Start jaap</button></div>
          </>
        ) : (
          <div className="bh-counter">
            <p className="bh-small">{mantra ? `${mantra.text_hi} · ${mantra.text_roman}` : ''} · Target {s.target}{s.status === 'paused' ? ' · Paused' : ''}</p>
            {mode === 'mala'
              ? <MalaRing count={count} onTap={tap} disabled={s.status !== 'active'} celebrate={celebrate} />
              : <div className="bh-count" aria-live="polite">{count}</div>}
            <div className="bh-bar" aria-hidden="true" style={{ maxWidth: 420, margin: '12px auto' }}><i style={{ width: `${Math.min(100, (count / s.target) * 100)}%` }} /></div>
            <p className="bh-small">Today’s session: {count} / {s.target} · {Math.floor(count / MALA)} mala complete</p>
            {mode === 'voice' ? <VoicePanel jaap={jaap} mantra={mantra} /> : mode === 'manual' && <div className="bh-row"><button type="button" className="bh-tap" onClick={tap} disabled={s.status !== 'active'}>जप करें<br />+1</button></div>}
            <div className="bh-row">
              {mode === 'manual' && <button type="button" className="bh-btn bh-btn-ghost" onClick={() => jaap.add(-1)} disabled={count === 0 || s.status !== 'active'}>− 1</button>}
              <button type="button" className="bh-btn bh-btn-ghost" onClick={() => jaap.setStatus(s.status === 'paused' ? 'active' : 'paused')}>{s.status === 'paused' ? '▶ Resume' : '⏸ Pause'}</button>
              <button type="button" className="bh-btn bh-btn-ghost" onClick={reset}>Reset</button>
              <button type="button" className="bh-btn bh-btn-gold" onClick={jaap.finish}>Finish</button>
            </div>
          </div>
        )}
        {jaap.pending > 0 && <div className="bh-msg" role="status">{jaap.pending} count(s) waiting to sync.</div>}
        {(jaap.error || err) && <div className="bh-msg" role="alert">{jaap.error || err}</div>}
      </div>
    </div>
  );
}
