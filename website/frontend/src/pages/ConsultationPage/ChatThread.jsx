import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { copy, timeLabel, dayKey, dayLabel } from './consultCopy.js';

// A chat history that works like a messaging app: it opens at the newest message, and scrolling up loads earlier
// messages in place without the view jumping. Day separators group the history, and a button appears to jump back
// to the latest message when new ones arrive while the reader is further up.
export default function ChatThread({ lang, astro, name, messages, hasMore, loadingOlder, historyError, onLoadOlder, onRetry, typing, intro }) {
  const c = copy(lang);
  const box = useRef(null);
  const prev = useRef({ firstId: null, lastId: null, count: 0 });
  const restore = useRef(null); // scroll position taken just before older messages are requested
  const stick = useRef(true);   // true while the reader is at (or near) the bottom
  const [atBottom, setAtBottom] = useState(true);
  const [unseen, setUnseen] = useState(0);

  const toBottom = (smooth) => {
    const el = box.current; if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const requestOlder = () => {
    const el = box.current;
    if (!el || !hasMore || loadingOlder || historyError) return;
    restore.current = { h: el.scrollHeight, t: el.scrollTop };
    onLoadOlder();
  };

  const onScroll = () => {
    const el = box.current; if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    stick.current = near;
    setAtBottom(near);
    if (near) setUnseen(0);
    if (el.scrollTop < 160) requestOlder();
  };

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const first = messages.length ? messages[0].id : null;
    const last = messages.length ? messages[messages.length - 1].id : null;
    const p = prev.current;
    if (restore.current && p.firstId !== null && first !== p.firstId) {
      // Earlier messages were added above: keep the same message under the reader's eyes.
      el.scrollTop = el.scrollHeight - restore.current.h + restore.current.t;
      restore.current = null;
    } else if (last !== p.lastId) {
      const mine = messages.length && messages[messages.length - 1].role === 'user';
      if (p.lastId === null || stick.current || mine) {
        toBottom(p.lastId !== null);
        setUnseen(0);
      } else {
        setUnseen((u) => u + Math.max(1, messages.length - p.count));
      }
    } else if (p.firstId !== null && first !== p.firstId && stick.current) {
      toBottom(false); // a short history filled in from above: stay on the newest message
    }
    prev.current = { firstId: first, lastId: last, count: messages.length };
  }, [messages]);

  useEffect(() => { if (!loadingOlder) restore.current = null; }, [loadingOlder]);
  useEffect(() => { if (typing && stick.current) toBottom(true); }, [typing]);

  // A short history may not fill the screen, so there is nothing to scroll: load more until it does.
  useEffect(() => {
    const el = box.current;
    if (el && hasMore && !loadingOlder && !historyError && el.scrollHeight <= el.clientHeight + 40) onLoadOlder();
  }, [messages, hasMore, loadingOlder, historyError]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = [];
  let lastDay = null; let lastSession = null; let lastRole = null;
  messages.forEach((m, i) => {
    const dk = dayKey(m.created_at);
    if (dk !== lastDay) { rows.push(<div key={`d-${m.id}`} className="cr-day" role="separator"><span>{dayLabel(m.created_at, lang)}</span></div>); lastDay = dk; lastRole = null; }
    if (lastSession && m.consultation_id && m.consultation_id !== lastSession) {
      rows.push(<div key={`s-${m.id}`} className="cr-session" role="separator"><span>{c.consultationStarted}</span></div>); lastRole = null;
    }
    lastSession = m.consultation_id || lastSession;
    const mine = m.role === 'user';
    const showAvatar = !mine && lastRole !== 'assistant';
    lastRole = m.role;
    const failed = m.status === 'failed';
    rows.push(
      <div key={m.id} className={`cr-row ${mine ? 'is-user' : ''}`}>
        {!mine && (showAvatar ? <img className="cr-row-avatar" src={astro.avatar} alt="" width="36" height="36" /> : <span className="cr-row-avatar-gap" aria-hidden="true" />)}
        <div className={`cr-bubble ${mine ? 'mine' : ''} ${failed ? 'failed' : ''}`}>
          {!mine && showAvatar && <strong className="cr-bubble-name">{name}</strong>}
          <p>{m.content}</p>
          <span className="cr-meta">
            {m.is_demo_mode && <em className="cr-demo" title={c.demoReply}>{c.demoReply}</em>}
            <time dateTime={m.created_at}>{timeLabel(m.created_at, lang)}</time>
            {mine && <i className={`cr-tick ${m.status || 'sent'}`} aria-label={m.status === 'sending' ? c.sending : failed ? c.failed : c.sent}>{m.status === 'sending' ? '◷' : failed ? '!' : '✓'}</i>}
          </span>
          {failed && <button type="button" className="cr-retry" onClick={() => onRetry(m)}>{m.error ? `${m.error} · ` : ''}{c.retry}</button>}
        </div>
      </div>
    );
    if (m.systemNote) rows.push(<div key={`n-${m.id}`} className="cr-system"><span>{m.systemNote}</span></div>);
  });

  return (
    <div className="cr-thread-wrap">
      <div className="cr-thread" ref={box} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions" aria-label={name}>
        {loadingOlder && <div className="cr-older" role="status">{c.loadingOlder}</div>}
        {historyError && !loadingOlder && <div className="cr-older"><button type="button" className="cr-linkbtn" onClick={() => onLoadOlder(true)}>{c.olderFailed}</button></div>}
        {!hasMore && !loadingOlder && !historyError && (
          <div className="cr-intro">
            <small>{c.startOfChat} {name}</small>
            {intro && <p>{intro}</p>}
          </div>
        )}
        {rows}
        {typing && <div className="cr-typing" role="status"><span className="cr-dots" aria-hidden="true"><i /><i /><i /></span>{name} {c.typing}</div>}
      </div>
      {!atBottom && (
        <button type="button" className="cr-jump" onClick={() => { toBottom(true); setUnseen(0); }} aria-label={c.jumpLatest}>
          ↓{unseen > 0 && <b>{unseen} {c.newMessages}</b>}
        </button>
      )}
    </div>
  );
}
