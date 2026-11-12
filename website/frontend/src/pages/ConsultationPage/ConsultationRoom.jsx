import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import WalletModal from '../../components/WalletModal/WalletModal.jsx';
import { useWallet } from '../../components/WalletModal/walletApi.js';
import { useLang } from '../BhaktiPage/lang.js';
import {
  ApiError, endConsultation, getAstrologer, getMessages, listConsultations, openConsultation, parseUtc, sendFeedback, sendMessage,
} from './consultApi.js';
import { copy, errorText } from './consultCopy.js';
import ChatThread from './ChatThread.jsx';
import BookingModal from './BookingModal.jsx';
import { AstrologerList, Badge, CallAiDialog, EndDialog, InfoSheet, ProfileCard, SummaryDialog, nameOf } from './Panels.jsx';
import './consultation-room.css';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const byTime = (a, b) => parseUtc(a.created_at) - parseUtc(b.created_at) || String(a.id).localeCompare(String(b.id));
const norm = (m, consultationId) => ({
  id: m.id, role: m.role, content: m.content, created_at: m.created_at, consultation_id: consultationId || m.consultation_id,
  is_demo_mode: !!m.is_demo_mode, status: 'sent',
});

// Adds messages the server returned. A message the visitor just sent (kept locally until the server confirms it) is
// replaced by the server's copy instead of being shown twice.
function mergeServer(list, incoming) {
  const seen = new Set(list.map((m) => m.id));
  const out = [...list];
  for (const s of incoming) {
    if (seen.has(s.id)) continue;
    const i = out.findIndex((m) => m.local && m.role === s.role && m.content === s.content && m.status !== 'failed');
    if (i >= 0) out[i] = s; else out.push(s);
    seen.add(s.id);
  }
  return out.sort(byTime);
}

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true); const down = () => setOnline(false);
    window.addEventListener('online', up); window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); };
  }, []);
  return online;
}

export default function ConsultationRoom() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const lang = useLang();
  const c = copy(lang);
  const { currentUser, openAuthModal } = useAuth();
  const wallet = useWallet(true);
  const online = useOnline();

  const [phase, setPhase] = useState(slug ? 'loading' : 'choose'); // loading | ready | unavailable | choose | error
  const [astro, setAstro] = useState(null);
  const [consult, setConsult] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [ended, setEnded] = useState(false);
  const [dialog, setDialog] = useState(null); // end | summary | call | book | info
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState('');
  const [summary, setSummary] = useState(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [startingNew, setStartingNew] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const messagesRef = useRef([]); messagesRef.current = messages;
  const consultRef = useRef(null); consultRef.current = consult;
  const astroRef = useRef(null); astroRef.current = astro;
  const langRef = useRef(lang); langRef.current = lang;
  // Where we are in the history: the open consultation, how far back inside it, and which earlier ones remain.
  const pg = useRef({ activeId: null, curId: null, sessionMore: false, sessions: null, next: 0, exhausted: false, busy: false });
  const composer = useRef(null);

  const signedIn = wallet.signedIn;
  const name = astro ? nameOf(astro, lang) : '';

  // ---- open the room ---------------------------------------------------------------------------------------------
  useEffect(() => {
    setAstro(null); setConsult(null); setMessages([]); setHasMore(true); setHistoryError(false); setEnded(false); setDialog(null); setTyping(false); setDraft('');
    pg.current = { activeId: null, curId: null, sessionMore: false, sessions: null, next: 0, exhausted: false, busy: false };
    if (!slug) { setPhase('choose'); return undefined; }
    setPhase('loading');
    const ac = new AbortController();
    (async () => {
      try {
        const a = await getAstrologer(slug, ac.signal);
        const cons = await openConsultation(a.id, langRef.current);
        const r = await getMessages(cons.id, { limit: 30 }, ac.signal);
        if (ac.signal.aborted) return;
        pg.current = { activeId: cons.id, curId: cons.id, sessionMore: !!r.has_more, sessions: null, next: 0, exhausted: false, busy: false };
        setAstro(a); setConsult(cons);
        setMessages((r.messages || []).filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => norm(m, cons.id)).sort(byTime));
        setHasMore(true);
        setPhase('ready');
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        setPhase(e instanceof ApiError && e.status === 404 ? 'unavailable' : 'error');
      }
    })();
    return () => ac.abort();
  }, [slug, reloadKey]);

  useEffect(() => {
    const prevTitle = document.title;
    if (astro) document.title = `${name} | ${c.consultTitle} | Astro Jyotish`;
    return () => { document.title = prevTitle; };
  }, [astro, name, c.consultTitle]);

  // A call link from the directory opens the call dialog once the room is ready.
  useEffect(() => {
    if (phase === 'ready' && astro && params.get('call') === 'true') {
      setDialog(astro.is_ai ? 'call' : 'book');
      const next = new URLSearchParams(params); next.delete('call'); setParams(next, { replace: true });
    }
  }, [phase, astro, params, setParams]);

  // ---- history (scroll up for earlier messages, including earlier consultations) ----------------------------------
  const loadOlder = useCallback(async (retry) => {
    const p = pg.current; const a = astroRef.current;
    if (!a || p.busy || p.exhausted) return;
    if (retry) setHistoryError(false);
    p.busy = true; setLoadingOlder(true);
    try {
      let added = [];
      while (!added.length && !p.exhausted) {
        if (p.sessionMore) {
          const oldest = messagesRef.current.find((m) => m.consultation_id === p.curId && !m.local);
          const r = await getMessages(p.curId, { beforeId: oldest && oldest.id, limit: 25 });
          added = (r.messages || []).map((m) => norm(m, p.curId)); p.sessionMore = !!r.has_more && added.length > 0;
        } else {
          if (!p.sessions) {
            const all = await listConsultations(30);
            p.sessions = all.filter((x) => x.astrologer_id === a.id && x.id !== p.activeId)
              .sort((x, y) => parseUtc(y.started_at || y.created_at) - parseUtc(x.started_at || x.created_at)).map((x) => x.id);
          }
          if (p.next >= p.sessions.length) { p.exhausted = true; break; }
          p.curId = p.sessions[p.next++];
          const r = await getMessages(p.curId, { limit: 25 });
          added = (r.messages || []).map((m) => norm(m, p.curId)); p.sessionMore = !!r.has_more;
        }
      }
      if (added.length) setMessages((m) => mergeServer(m, added.filter((x) => x.role === 'user' || x.role === 'assistant')));
      setHasMore(!p.exhausted);
    } catch (e) {
      setHistoryError(true);
    } finally {
      p.busy = false; setLoadingOlder(false);
    }
  }, []);

  // ---- sending ---------------------------------------------------------------------------------------------------
  const refreshLatest = useCallback(async () => {
    const cons = consultRef.current; if (!cons) return;
    try {
      const r = await getMessages(cons.id, { limit: 10 });
      const fresh = (r.messages || []).filter((m) => m.role === 'user' || m.role === 'assistant').map((m) => norm(m, cons.id));
      setMessages((m) => mergeServer(m, fresh));
    } catch (e) { /* the next poll or send tries again */ }
  }, []);

  const deliver = useCallback(async (text, existingId) => {
    const cons = consultRef.current; const a = astroRef.current;
    if (!cons || !a) return;
    const id = existingId || `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const mine = { id, role: 'user', content: text, created_at: new Date().toISOString(), consultation_id: cons.id, status: 'sending', local: true };
    setMessages((m) => (existingId ? m.map((x) => (x.id === id ? { ...x, status: 'sending', error: '' } : x)) : [...m, mine].sort(byTime)));
    if (a.is_ai) setTyping(true);
    try {
      const res = await sendMessage(cons.id, { message: text, language: langRef.current, userName: currentUser && currentUser.full_name });
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: 'sent' } : x)));
      if (res && res.role === 'assistant') setMessages((m) => mergeServer(m, [norm(res, cons.id)]));
      else if (res && res.status_note) setMessages((m) => m.map((x) => (x.id === id ? { ...x, systemNote: res.status_note } : x)));
      refreshLatest();
    } catch (e) {
      setMessages((m) => m.map((x) => (x.id === id ? { ...x, status: 'failed', error: errorText(copy(langRef.current), e) } : x)));
    } finally {
      setTyping(false);
    }
  }, [currentUser, refreshLatest]);

  const send = (text) => {
    const value = (text !== undefined ? text : draft).trim();
    if (!value || ended || !consult || (astro && astro.is_ai && typing)) return;
    if (text === undefined) setDraft('');
    deliver(value);
    if (composer.current) composer.current.style.height = 'auto';
  };

  // Replies from a human astrologer arrive later, so look for new messages while the room is open.
  useEffect(() => {
    if (phase !== 'ready' || !astro || astro.is_ai || !consult || ended) return undefined;
    const t = setInterval(() => { if (!document.hidden && navigator.onLine !== false) refreshLatest(); }, 8000);
    return () => clearInterval(t);
  }, [phase, astro, consult, ended, refreshLatest]);

  // ---- end, summary, new consultation ----------------------------------------------------------------------------
  const hasUserMessage = messages.some((m) => consult && m.consultation_id === consult.id && m.role === 'user');
  const finish = async () => {
    setEnding(true); setEndError('');
    try {
      const s = await endConsultation(consult.id);
      setEnded(true);
      setConsult((x) => ({ ...x, status: 'completed' }));
      if (hasUserMessage) { setSummary(s); setDialog('summary'); } else setDialog(null);
    } catch (e) {
      setEndError(`${c.endFailed} ${errorText(c, e)}`.trim());
    }
    setEnding(false);
  };
  const startNew = async () => {
    if (!astro) return;
    setStartingNew(true);
    try {
      const cons = await openConsultation(astro.id, langRef.current);
      pg.current = { ...pg.current, activeId: cons.id, curId: cons.id, sessionMore: false, sessions: null, next: 0, exhausted: false };
      setConsult(cons); setEnded(false); setSummary(null); setHasMore(true); setHistoryError(false);
      setTimeout(() => composer.current && composer.current.focus(), 50);
    } catch (e) { /* the button stays so it can be pressed again */ }
    setStartingNew(false);
  };

  const onCall = () => setDialog(astro && astro.is_ai ? 'call' : 'book');
  const onWallet = () => (signedIn ? setWalletOpen(true) : openAuthModal('login'));
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate('/astrologers'));
  const walletText = !signedIn ? c.signIn : wallet.loading ? '…' : wallet.error ? c.balanceUnavailable : money(wallet.balance);

  const quickShown = !messages.some((m) => m.role === 'user') && !ended;
  const statusKey = astro ? (astro.availability === 'online' ? 'online' : astro.availability === 'busy' ? 'busy' : 'offline') : 'offline';
  const intro = astro ? (astro.is_ai ? c.greetingAi : c.greetingHuman) : '';
  const sendDisabled = !draft.trim() || !consult || ended || (astro && astro.is_ai && typing);

  // ---- screens that are not the chat ----------------------------------------------------------------------------
  if (phase === 'loading') {
    return <div className="cr-shell" translate="no"><div className="cr-center" role="status">{c.loading}</div></div>;
  }
  if (phase === 'error') {
    return (
      <div className="cr-shell" translate="no">
        <div className="cr-center"><p>{c.loadError}</p>
          <div className="cr-btnrow"><button type="button" className="cr-btn ghost" onClick={goBack}>{c.back}</button><button type="button" className="cr-btn primary" onClick={() => setReloadKey((k) => k + 1)}>{c.retryLoad}</button></div>
        </div>
      </div>
    );
  }
  if (phase === 'unavailable' || phase === 'choose') {
    return (
      <div className="cr-shell" translate="no">
        <div className="cr-center cr-wide">
          <h1>{phase === 'choose' ? c.chooseTitle : c.unavailableTitle}</h1>
          <p>{phase === 'choose' ? c.chooseBody : c.unavailableBody}</p>
          <AstrologerList lang={lang} exclude={slug} />
          <div className="cr-btnrow"><Link to="/astrologers" className="cr-btn ghost">{c.browseAll}</Link></div>
        </div>
      </div>
    );
  }

  return (
    <div className="cr-shell" translate="no">
      <header className="cr-topbar">
        <h1 className="cr-sr">{name}</h1>
        <button type="button" className="cr-iconbtn" onClick={goBack} aria-label={c.back}>←</button>
        <button type="button" className="cr-who" onClick={() => setDialog('info')} aria-label={c.info}>
          <img className="cr-top-avatar" src={astro.avatar} alt="" width="44" height="44" onError={(e) => { e.currentTarget.src = '/assets/portraits/default-avatar.svg'; }} />
          <span className="cr-top-person">
            <span className="cr-name">{name}</span>
            <span className={`cr-status ${statusKey}`}><i aria-hidden="true" />{c[statusKey]}</span>
          </span>
        </button>
        <div className="cr-actions">
          <button type="button" className="cr-pill wallet" onClick={onWallet} aria-label={`${c.wallet}: ${walletText}`}><span aria-hidden="true">👛</span><span className="cr-pill-text">{walletText}</span></button>
          <button type="button" className="cr-pill call" onClick={onCall} aria-label={c.call}><span aria-hidden="true">☎</span><span className="cr-pill-text">{c.call}</span></button>
          <button type="button" className="cr-pill end" onClick={() => { setEndError(''); setDialog('end'); }} disabled={ended} aria-label={c.end}><span aria-hidden="true">■</span><span className="cr-pill-text">{c.end}</span></button>
        </div>
      </header>

      <div className="cr-workspace">
        <aside className="cr-profile" aria-label={c.info}><ProfileCard astro={astro} lang={lang} /></aside>
        <main className="cr-chat">
          <details className="cr-notice">
            <summary><Badge astro={astro} lang={lang} /><span>{astro.is_ai ? c.aiShort : c.humanShort}</span></summary>
            <p>{astro.is_ai ? c.aiNotice : c.humanNotice}</p>
          </details>
          {!online && <div className="cr-offline" role="status">{c.offlineBanner}</div>}
          <ChatThread
            lang={lang} astro={astro} name={name} messages={messages} hasMore={hasMore} loadingOlder={loadingOlder}
            historyError={historyError} onLoadOlder={loadOlder} onRetry={(m) => deliver(m.content, m.id)} typing={typing} intro={intro}
          />
          <footer className="cr-composer-wrap">
            {ended ? (
              <div className="cr-ended"><span>{c.endedBanner}</span><button type="button" className="cr-btn primary" onClick={startNew} disabled={startingNew}>{c.startNew}</button></div>
            ) : (
              <>
                {quickShown && <div className="cr-chips" aria-label={c.composerLabel}>{c.quick.map(([icon, q]) => <button key={q} type="button" onClick={() => send(q)} disabled={astro.is_ai && typing}><span aria-hidden="true">{icon}</span> {q}</button>)}</div>}
                <form className="cr-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
                  <textarea
                    ref={composer} rows={1} value={draft} maxLength={1000} aria-label={c.composerLabel} placeholder={c.composerPlaceholder}
                    onChange={(e) => { setDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
                  />
                  <button type="submit" className="cr-send" disabled={sendDisabled} aria-label={astro.is_ai && typing ? c.sendWaiting : c.send}>➤</button>
                </form>
              </>
            )}
          </footer>
        </main>
      </div>

      {dialog === 'info' && <InfoSheet astro={astro} lang={lang} onClose={() => setDialog(null)} />}
      {dialog === 'end' && <EndDialog lang={lang} ending={ending} error={endError} onConfirm={finish} onClose={() => setDialog(null)} />}
      {dialog === 'summary' && summary && <SummaryDialog lang={lang} summary={summary} onRate={(stars, text) => sendFeedback(consult.id, stars, text)} onClose={() => setDialog(null)} />}
      {dialog === 'call' && <CallAiDialog lang={lang} onClose={() => setDialog(null)} />}
      {dialog === 'book' && (
        <BookingModal
          lang={lang} astro={astro} name={name} signedIn={signedIn} user={currentUser}
          balance={wallet.balance} balanceReady={signedIn && !wallet.loading && !wallet.error}
          onClose={() => setDialog(null)} onRecharge={() => { setDialog(null); setWalletOpen(true); }}
          onSignIn={() => { setDialog(null); openAuthModal('login'); }} onBooked={() => wallet.refresh()}
        />
      )}
      <WalletModal isOpen={walletOpen} onClose={() => { setWalletOpen(false); wallet.refresh(); }} />
    </div>
  );
}
