import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ALL_ASTROLOGERS } from '../DirectoryPage/astrologersData.js';
import { useWallet } from '../../components/WalletModal/walletApi.js';
import { refreshLive } from '../../utils/liveAstrologers.js';
import './profile-v2.css';

// One source of truth: the same astrologer dataset the directory uses, overlaid with the live record
// from the backend (real bio, reviews, price) whenever it is reachable.
const API = '/api/v1/astrologers';

const readLang = () => {
  try { return localStorage.getItem('astro_preferred_lang') === 'hi' ? 'hi' : 'en'; } catch (e) { return 'en'; }
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const stars = (rating) => {
  const full = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
};

const ago = (iso) => {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? 's' : ''} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${days >= 60 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

function statusLabelFor(availability) {
  const a = String(availability).toLowerCase();
  const soon = a.match(/^available_(\d+)$/);
  if (soon) return `Available in ${soon[1]} min`;
  if (a === 'online') return 'Online';
  if (a === 'busy') return 'Busy right now';
  return 'Currently offline';
}

function mergeProfile(local, remote) {
  if (!local && !remote) return null;
  const p = { ...(local || {}) };
  if (remote) {
    for (const [k, v] of Object.entries(remote)) {
      if (v === null || v === undefined || v === '') continue;
      if (k === 'avatar' && local) continue; // keep the portrait the directory shows
      if (k === 'price_per_minute' && !(Number(v) > 0)) continue;
      p[k] = v;
    }
    // The live availability wins, so the directory's old label must not outlive it.
    if (remote.availability) p.statusLabel = statusLabelFor(remote.availability);
  }
  return p;
}

function Verified() {
  return (
    <svg className="apf-verified" viewBox="0 0 20 20" role="img" aria-label="Verified astrologer">
      <circle cx="10" cy="10" r="10" />
      <path d="m5.6 10.4 2.9 2.9 5.9-6.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Portrait({ p, className }) {
  return (
    <img
      className={className}
      src={p.avatar}
      alt={p.name}
      width="144"
      height="144"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget;
        if (p.fallbackAvatar && !img.src.endsWith(p.fallbackAvatar)) img.src = p.fallbackAvatar;
        else if (!img.src.endsWith('/assets/portraits/default-avatar.svg')) img.src = '/assets/portraits/default-avatar.svg';
      }}
    />
  );
}

function ReviewForm({ astrologerId, name, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (comment.trim().length < 3) { setMsg({ ok: false, text: 'Please write a few words about your experience.' }); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`${API}/${encodeURIComponent(astrologerId)}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      if (r.ok) { setComment(''); setMsg({ ok: true, text: 'Thank you! Your review has been added.' }); onDone && onDone(); }
      else {
        const known = { 401: 'Please sign in to write a review.', 403: 'You can write a review after you have consulted ' + name + '.', 409: 'You have already reviewed this astrologer.', 422: 'Please write a few words about your experience.' };
        let detail = ''; try { const j = await r.json(); detail = typeof j.detail === 'string' ? j.detail : ''; } catch (err) { /* ignore */ }
        setMsg({ ok: false, text: known[r.status] || detail || 'Could not save your review. Please try again.' });
      }
    } catch (err) { setMsg({ ok: false, text: 'Could not reach the server. Please try again.' }); }
    setBusy(false);
  };
  return (
    <form className="apf-review-form" onSubmit={submit}>
      <h3>Write a review</h3>
      <fieldset className="apf-rate">
        <legend>Your rating</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <button type="button" key={n} className={n <= rating ? 'on' : ''} aria-label={`${n} out of 5`} aria-pressed={n === rating} onClick={() => setRating(n)}>★</button>
        ))}
      </fieldset>
      <label htmlFor="apf-review-text">Your experience</label>
      <textarea id="apf-review-text" rows={3} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your consultation?" />
      <button type="submit" className="apf-review-send" disabled={busy}>{busy ? 'Saving…' : 'Submit review'}</button>
      {msg && <p role="status" className={msg.ok ? 'apf-review-ok' : 'apf-review-err'}>{msg.text}</p>}
    </form>
  );
}

export default function ProfilePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser, openAuthModal } = useAuth();
  const local = useMemo(() => ALL_ASTROLOGERS.find((a) => a.slug === slug || a.id === slug) || null, [slug]);
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(!local);
  const [tab, setTab] = useState('about');
  const [lang, setLang] = useState(readLang);
  const wallet = useWallet(true);

  useEffect(() => {
    const onLang = (e) => setLang(e.detail?.language === 'hi' ? 'hi' : 'en');
    window.addEventListener('astro:languagechange', onLang);
    return () => window.removeEventListener('astro:languagechange', onLang);
  }, []);

  const [reloadKey, setReloadKey] = useState(0);
  const reloadRemote = () => { refreshLive(); setReloadKey((k) => k + 1); };
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setTab('about');
    setRemote(null);
    setLoading(!local);
  }, [slug, local]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API}/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => { setRemote(data); setLoading(false); })
      .catch(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug, reloadKey]);

  const p = useMemo(() => mergeProfile(local, remote), [local, remote]);

  // Per-profile page title and description (restored when leaving the page).
  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta ? meta.getAttribute('content') : null;
    if (p) {
      document.title = `${p.name} – ${p.title || 'Vedic Astrologer'} | Astro Jyotish`;
      if (meta) {
        meta.setAttribute('content', `Consult ${p.name}, ${p.title || 'Vedic astrologer'}. ${p.experience_years}+ years of experience, ${(p.languages || []).join(', ')}. Chat or call at ${money(p.price_per_minute)}/min.`);
      }
    } else if (!loading) {
      document.title = 'Astrologer not found | Astro Jyotish';
    }
    return () => {
      document.title = prevTitle;
      if (meta && prevDesc !== null) meta.setAttribute('content', prevDesc);
    };
  }, [p, loading]);

  const similar = useMemo(() => {
    if (!p) return [];
    const mine = new Set((p.specialties || []).map((s) => s.toLowerCase()));
    return ALL_ASTROLOGERS
      .filter((a) => a.slug !== p.slug)
      .map((a) => ({ a, score: (a.specialties || []).filter((s) => mine.has(s.toLowerCase())).length }))
      .filter((x) => x.score > 0)
      .sort((x, y) => y.score - x.score || y.a.rating - x.a.rating)
      .slice(0, 3)
      .map((x) => x.a);
  }, [p]);

  if (!p) {
    return (
      <div className="apf apf-page">
        <div className="apf-missing" role="status">
          {loading ? (
            <p>Loading astrologer profile…</p>
          ) : (
            <>
              <h1>Astrologer not found</h1>
              <p>We couldn&apos;t find an astrologer at this link. They may have moved or the link may be incorrect.</p>
              <Link className="apf-btn apf-btn-primary" to="/astrologers">Browse all astrologers</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  const target = p.slug || p.id;
  const hi = lang === 'hi';
  const name = (hi && p.name_hi) || p.name;
  const title = (hi && p.title_hi) || p.title;
  const online = String(p.availability).toLowerCase() === 'online';
  const statusText = online ? 'Online now · available for chat & call' : (p.statusLabel || 'Currently offline');
  const languages = p.languages || [];
  const specialties = p.specialties || [];
  const reviews = Array.isArray(p.reviews) ? [...p.reviews].sort((x, y) => new Date(y.created_at) - new Date(x.created_at)) : [];
  const bio = (hi && p.bio_hi) || p.bio
    || `${name} offers guidance in ${specialties.slice(0, 4).join(', ') || 'Vedic astrology'} with ${p.experience_years}+ years of experience, and consults in ${languages.join(', ')}.`;
  const why = [
    `${p.experience_years}+ years of experience in ${specialties.slice(0, 3).join(', ') || 'Vedic astrology'}`,
    `Consults in ${languages.join(', ')}`,
    (Number(p.review_count) > 0 ? `Rated ${Number(p.rating).toFixed(1)} out of 5 from ${Number(p.review_count).toLocaleString('en-IN')} ${Number(p.review_count) === 1 ? 'rating' : 'ratings'}` : 'New on AstroTalk · no reviews yet'),
    'Private and confidential consultation',
    `Pay per minute (${money(p.price_per_minute)}/min) from your wallet — you decide how long to talk`,
  ];

  const startChat = () => {
    if (!wallet.signedIn && !currentUser) {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      else navigate('/login');
      return;
    }
    if (window.App && typeof window.App.startConsultationWith === 'function') window.App.startConsultationWith(target);
    else navigate(`/consultation/${target}`);
  };
  const startCall = () => {
    if (!wallet.signedIn && !currentUser) {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      else navigate('/login');
      return;
    }
    if (window.App && typeof window.App.startCallWith === 'function') window.App.startCallWith(target);
    else navigate(`/consultation/${target}?call=true`);
  };
  const recharge = () => {
    if (!wallet.signedIn && !currentUser) {
      if (typeof openAuthModal === 'function') openAuthModal('login');
      else navigate('/login');
      return;
    }
    if (window.App && typeof window.App.openWalletModal === 'function') window.App.openWalletModal();
    else navigate('/wallet');
  };

  const walletText = !wallet.signedIn ? null : wallet.loading ? '…' : wallet.error ? 'Unavailable' : `₹${Number(wallet.balance || 0).toFixed(2)}`;
  const tabs = [
    ['about', 'About'],
    ['why', 'Why consult'],
    ['reviews', `Reviews (${Number(p.review_count || reviews.length).toLocaleString('en-IN')})`],
  ];

  return (
    <div className="apf apf-page" lang={lang}>
      <nav className="apf-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span aria-hidden="true">›</span>
        <Link to="/astrologers">Astrologers</Link><span aria-hidden="true">›</span>
        <span aria-current="page">{name}</span>
      </nav>

      <div className="apf-grid">
        <div className="apf-main">
          <section className="apf-hero" aria-labelledby="apf-name">
            <div className="apf-portrait">
              <Portrait p={p} className="apf-photo" />
            </div>
            <div className="apf-info">
              <div className={`apf-status ${online ? 'online' : ''}`}><i aria-hidden="true" />{statusText}</div>
              <h1 id="apf-name" className="apf-name">{name}<Verified /></h1>
              <p className="apf-title">{title}</p>
              <ul className="apf-tags" aria-label="Specialties">
                {specialties.map((s) => <li key={s}>{s}</li>)}
              </ul>
              <dl className="apf-stats">
                <div><dt>Languages</dt><dd>{languages.join(', ')}</dd></div>
                <div><dt>Experience</dt><dd>{p.experience_years}+ years</dd></div>
                <div><dt>Rating</dt><dd>{Number(p.review_count) > 0 ? <>★ {Number(p.rating).toFixed(1)} <small>({Number(p.review_count).toLocaleString('en-IN')})</small></> : 'New'}</dd></div>
                {p.consultations_count > 0 && <div><dt>Consultations</dt><dd>{Number(p.consultations_count).toLocaleString('en-IN')}+</dd></div>}
              </dl>
            </div>
          </section>

          <div className="apf-tabs" role="tablist" aria-label="Profile sections">
            {tabs.map(([id, label]) => (
              <button key={id} id={`apf-tab-${id}`} type="button" role="tab" aria-selected={tab === id} aria-controls={`apf-panel-${id}`} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {tab === 'about' && (
            <div className="apf-card" role="tabpanel" id="apf-panel-about" aria-labelledby="apf-tab-about">
              <h2>About {name}</h2>
              <p className="apf-bio">{bio}</p>
              {specialties.length > 0 && (
                <>
                  <h3>Areas of expertise</h3>
                  <ul className="apf-expertise">{specialties.map((s) => <li key={s}><span aria-hidden="true">✦</span> {s}</li>)}</ul>
                </>
              )}
            </div>
          )}

          {tab === 'why' && (
            <div className="apf-card" role="tabpanel" id="apf-panel-why" aria-labelledby="apf-tab-why">
              <h2>Why consult {name}?</h2>
              <ul className="apf-why">{why.map((w) => <li key={w}><span aria-hidden="true">✔</span>{w}</li>)}</ul>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="apf-card" role="tabpanel" id="apf-panel-reviews" aria-labelledby="apf-tab-reviews">
              <h2>Reviews &amp; ratings</h2>
              {Number(p.review_count) > 0 ? (
                <p className="apf-rating-line">
                  <span className="apf-stars" aria-hidden="true">{stars(p.rating)}</span>
                  <strong>{Number(p.rating).toFixed(1)} out of 5</strong>
                  <span>({Number(p.review_count).toLocaleString('en-IN')} {Number(p.review_count) === 1 ? 'rating' : 'ratings'})</span>
                </p>
              ) : <p className="apf-rating-line"><strong>New</strong><span>No ratings yet</span></p>}
              {p.id && <ReviewForm astrologerId={p.id} name={name} onDone={reloadRemote} />}
              {reviews.length ? (
                <ul className="apf-reviews">
                  {reviews.map((r) => (
                    <li key={r.id}>
                      <div className="apf-review-head"><strong>{r.user_name || 'Seeker'}</strong>{r.is_verified && <em>Verified consultation</em>}<time dateTime={r.created_at}>{ago(r.created_at)}</time></div>
                      <div className="apf-stars" role="img" aria-label={`${r.rating} out of 5`}>{stars(r.rating)}</div>
                      <p>{r.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="apf-empty">No reviews yet. Reviews can be written by people who have consulted this astrologer.</p>
              )}
            </div>
          )}

          {similar.length > 0 && (
            <section className="apf-similar" aria-labelledby="apf-similar-h">
              <h2 id="apf-similar-h">Similar astrologers</h2>
              <div className="apf-similar-grid">
                {similar.map((a) => (
                  <Link key={a.slug} to={`/astrologers/${a.slug}`} className="apf-sim-card">
                    <Portrait p={a} className="apf-sim-photo" />
                    <div>
                      <strong>{a.name}</strong>
                      <span>{(a.specialties || []).slice(0, 2).join(' · ')}</span>
                      <small>{Number(a.review_count) > 0 ? `★ ${Number(a.rating).toFixed(1)} · ` : ''}{money(a.price_per_minute)}/min</small>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="apf-booking" aria-label="Book a consultation">
          <div className="apf-fee"><span>Consultation fee</span><strong>{money(p.price_per_minute)}<small>/minute</small></strong></div>
          <div className="apf-costs">
            <span>Estimated session cost</span>
            <div>
              {[15, 30, 60].map((m) => <p key={m}><small>{m} mins</small><b>{money(p.price_per_minute * m)}</b></p>)}
            </div>
          </div>
          <div className="apf-wallet">
            <div>
              <small>Your wallet balance</small>
              {walletText === null ? <Link to="/wallet">Sign in to see balance</Link> : <b>{walletText}</b>}
            </div>
            <button type="button" onClick={recharge}>+ Recharge</button>
          </div>
          <button type="button" className="apf-btn apf-btn-primary" onClick={startChat}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z" /></svg>
            Start chat
          </button>
          <button type="button" className="apf-btn apf-btn-outline" onClick={startCall}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" /></svg>
            Schedule audio call
          </button>
          <p className="apf-fine">Verified Vedic astrologers provide instant chat answers &amp; personalized Kundli guidance.</p>
          <p className="apf-privacy">🔒 Private &amp; confidential consultations</p>
        </aside>
      </div>

      <div className="apf-sticky" role="region" aria-label="Quick booking">
        <div><strong>{money(p.price_per_minute)}<small>/min</small></strong><span className={online ? 'online' : ''}>{online ? 'Online now' : (p.statusLabel || 'Offline')}</span></div>
        <button type="button" className="apf-btn apf-btn-outline" onClick={startCall}>Call</button>
        <button type="button" className="apf-btn apf-btn-primary" onClick={startChat}>Chat</button>
      </div>
    </div>
  );
}
