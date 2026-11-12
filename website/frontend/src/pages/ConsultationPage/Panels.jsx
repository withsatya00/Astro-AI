import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { copy } from './consultCopy.js';
import { listAstrologers } from './consultApi.js';

export const nameOf = (a, lang) => (lang === 'hi' && a.name_hi) || a.name;
export const titleOf = (a, lang) => (lang === 'hi' && a.title_hi) || a.title;
const statusKey = (a) => (a.availability === 'online' ? 'online' : a.availability === 'busy' ? 'busy' : 'offline');

export function Badge({ astro, lang }) {
  const c = copy(lang);
  return astro.is_ai
    ? <span className="cr-badge ai">{c.aiBadge}</span>
    : <span className="cr-badge human"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" /><path d="m5.6 10.4 2.9 2.9 5.9-6.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>{c.verifiedBadge}</span>;
}

// The astrologer's profile, shown beside the chat on large screens and in a sheet on phones.
export function ProfileCard({ astro, lang }) {
  const c = copy(lang);
  const bio = (lang === 'hi' && astro.bio_hi) || astro.bio;
  return (
    <div className="cr-profile-card">
      <img src={astro.avatar} alt={nameOf(astro, lang)} width="104" height="104" onError={(e) => { e.currentTarget.src = '/assets/portraits/default-avatar.svg'; }} />
      <h2>{nameOf(astro, lang)}</h2>
      <Badge astro={astro} lang={lang} />
      <p className="cr-role">{titleOf(astro, lang)}</p>
      <dl className="cr-stats">
        <div><dt>{c.rating}</dt><dd>★ {Number(astro.rating).toFixed(1)}</dd></div>
        <div><dt>{c.experience}</dt><dd>{astro.experience_years} {c.years}</dd></div>
        <div><dt>{c.languages}</dt><dd>{(astro.languages || []).slice(0, 3).join(', ')}</dd></div>
      </dl>
      {(astro.specialties || []).length > 0 && (
        <section><h3>{c.specialties}</h3><ul className="cr-chips-static">{astro.specialties.map((s) => <li key={s}>{s}</li>)}</ul></section>
      )}
      {bio && <section><h3>{c.about}</h3><p className="cr-bio">{bio}</p></section>}
      <div className="cr-private"><span aria-hidden="true">🔒</span><span><b>{c.private}</b><small>{c.privateSub}</small></span></div>
      {astro.is_ai && <p className="cr-fine">{c.notBilled}</p>}
    </div>
  );
}

// Astrologers who can be consulted right now. Used when the link has no astrologer, or the astrologer is not set up yet.
export function AstrologerList({ lang, exclude }) {
  const c = copy(lang);
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const ac = new AbortController();
    listAstrologers({ availability: 'online', limit: 12 }, ac.signal).then(setItems).catch((e) => { if (e.name !== 'AbortError') setFailed(true); });
    return () => ac.abort();
  }, []);
  if (failed) return <p className="cr-fine">{c.loadError}</p>;
  if (!items) return <p className="cr-fine" role="status">{c.loading}</p>;
  const shown = items.filter((a) => a.slug !== exclude).slice(0, 6);
  return (
    <ul className="cr-pick">
      {shown.map((a) => (
        <li key={a.id}>
          <Link to={`/consultation/${a.slug}`} className="cr-pick-card">
            <img src={a.avatar} alt="" width="56" height="56" onError={(e) => { e.currentTarget.src = '/assets/portraits/default-avatar.svg'; }} />
            <span><b>{nameOf(a, lang)}</b><small>{titleOf(a, lang)}</small><em>{a.is_ai ? c.aiTag : c.humanTag} · {c[statusKey(a)]}</em></span>
            <i>{c.startChat} →</i>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Modal({ labelledBy, onClose, wide, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current && ref.current.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && ref.current) { // keep focus inside the dialog
        const f = [...ref.current.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0]; const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); };
  }, [onClose]);
  return (
    <div className="cr-modal" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`cr-dialog${wide ? ' cr-dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1} ref={ref}>{children}</div>
    </div>
  );
}

export function EndDialog({ lang, ending, error, onConfirm, onClose }) {
  const c = copy(lang);
  return (
    <Modal labelledBy="cr-end-h" onClose={onClose}>
      <h2 id="cr-end-h">{c.endTitle}</h2>
      <p>{c.endBody}</p>
      {error && <div className="cr-warn" role="alert">{error}</div>}
      <div className="cr-btnrow">
        <button type="button" className="cr-btn ghost" onClick={onClose}>{c.cancel}</button>
        <button type="button" className="cr-btn primary" onClick={onConfirm} disabled={ending}>{ending ? c.ending : c.endConfirm}</button>
      </div>
    </Modal>
  );
}

export function SummaryDialog({ lang, summary, onRate, onClose }) {
  const c = copy(lang);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | thanks
  const list = (title, items) => items && items.length > 0 && <section><h3>{title}</h3><ul>{items.map((x, i) => <li key={i}>{x}</li>)}</ul></section>;
  const submit = async () => { setState('sending'); try { await onRate(stars, text); setState('thanks'); } catch (e) { setState('idle'); } };
  return (
    <Modal labelledBy="cr-sum-h" onClose={onClose} wide>
      <h2 id="cr-sum-h">{c.summaryTitle}</h2>
      <div className="cr-summary">
        {list(c.insights, summary.key_insights)}
        {list(c.remedies, summary.remedies)}
        {list(c.followUps, summary.follow_ups)}
      </div>
      <div className="cr-rate">
        <h3 id="cr-rate-h">{c.rateTitle}</h3>
        {state === 'thanks' ? <p role="status">{c.thanks}</p> : (
          <>
            <div className="cr-stars" role="radiogroup" aria-labelledby="cr-rate-h">
              {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={stars === n} aria-label={`${n} / 5`} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)}>★</button>)}
            </div>
            <textarea rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder={c.ratePlaceholder} aria-label={c.ratePlaceholder} />
            <button type="button" className="cr-btn primary" disabled={!stars || state === 'sending'} onClick={submit}>{c.submitRating}</button>
          </>
        )}
      </div>
      <button type="button" className="cr-btn ghost" onClick={onClose}>{c.close}</button>
    </Modal>
  );
}

export function CallAiDialog({ lang, onClose }) {
  const c = copy(lang);
  return (
    <Modal labelledBy="cr-callai-h" onClose={onClose}>
      <h2 id="cr-callai-h">{c.callAiTitle}</h2>
      <p>{c.callAiBody}</p>
      <div className="cr-btnrow">
        <button type="button" className="cr-btn ghost" onClick={onClose}>{c.close}</button>
        <Link to="/astrologers" className="cr-btn primary">{c.browseAll}</Link>
      </div>
    </Modal>
  );
}

export function InfoSheet({ astro, lang, onClose }) {
  const c = copy(lang);
  return (
    <Modal labelledBy="cr-info-h" onClose={onClose}>
      <button type="button" className="cr-x" onClick={onClose} aria-label={c.close}>×</button>
      <h2 id="cr-info-h" className="cr-sr">{c.info}</h2>
      <ProfileCard astro={astro} lang={lang} />
    </Modal>
  );
}
