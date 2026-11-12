import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import SimpleDialog from '../../components/SimpleDialog/SimpleDialog.jsx';
import { API, ApiError, call, post, money, dateTime, dateOnly, timeLeft, useNow, useLang, useRequest, statusText } from './mandirApi.js';

// Mandir Seva: the temples you can offer seva at, upcoming chadhava / puja events and your own bookings.
// All of it is read from /api/v1/mandir (temples, chadhava events, my bookings).

const TABS = [
  { id: 'temples', label: 'Temples', path: '/mandir-seva' },
  { id: 'events', label: 'Upcoming Events', path: '/mandir-seva/events' },
  { id: 'mine', label: 'My Bookings', path: '/mandir-seva?tab=mine' },
];
const KINDS = [
  { id: 'all', label: 'All events' },
  { id: 'chadhava', label: '🪔 Chadhava' },
  { id: 'puja', label: '🔱 Sankalp Puja' },
];

const tabFor = (section, params) => (params.get('tab') === 'mine' ? 'mine' : section === 'chadhava' || section === 'puja' || section === 'events' ? 'events' : 'temples');
const kindFor = (section) => (section === 'chadhava' ? 'chadhava' : section === 'puja' ? 'puja' : 'all');

function Notice({ children, action, onAction }) {
  return (
    <div role="status" className="max-w-xl mx-auto text-center text-sm text-slate-600 bg-white border border-[#E7E2D8] rounded-2xl p-6">
      <p className="m-0">{children}</p>
      {action && <button type="button" onClick={onAction} className="mt-3 px-4 py-2 rounded-full bg-[#3E0B18] text-[#FFF9EF] text-xs font-bold cursor-pointer border-0" style={{ minHeight: 40 }}>{action}</button>}
    </div>
  );
}

function TempleCard({ t }) {
  return (
    <article className="rounded-2xl bg-white border border-[#E7E2D8] shadow-xs overflow-hidden flex flex-col">
      <Link to={`/mandir-seva/temple/${t.slug}`} className="block h-44 bg-slate-100 overflow-hidden" tabIndex={-1} aria-hidden="true">
        <img src={t.image_url} alt="" loading="lazy" className="w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      </Link>
      <div className="p-4 flex flex-col gap-1 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309]" translate="no">{[t.city, t.state].filter(Boolean).join(', ')}</span>
        <h3 className="font-serif text-base font-bold text-[#1E1B4B] m-0" translate="no">
          <Link to={`/mandir-seva/temple/${t.slug}`} className="no-underline text-inherit flex items-center" style={{ minHeight: 36 }}>{t.name}</Link>
        </h3>
        <p className="text-xs text-slate-500 m-0" translate="no">{t.deity}</p>
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="text-xs text-slate-600"><span>From</span> <b>{money(t.starting_price)}</b></span>
          <Link to={`/mandir-seva/temple/${t.slug}`} className="shop-btn shop-btn--gold no-underline text-xs">Offer seva →</Link>
        </div>
      </div>
    </article>
  );
}

function EventCard({ e, now, lang }) {
  const left = timeLeft(e.deadline, now, lang);
  const prices = (e.offerings || []).map((o) => o.price).filter((p) => p > 0);
  const from = prices.length ? Math.min(...prices) : null;
  const closed = !e.bookable || !left;
  return (
    <article className="rounded-2xl bg-white border border-[#E7E2D8] shadow-xs overflow-hidden flex flex-col">
      <div className="h-40 bg-slate-100 overflow-hidden">
        <img src={e.image_url} alt="" loading="lazy" className="w-full h-full object-cover" onError={(ev) => { ev.currentTarget.style.visibility = 'hidden'; }} />
      </div>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#B45309]">{e.kind === 'puja' ? 'Sankalp Puja' : 'Chadhava'}</span>
        <h3 className="font-serif text-base font-bold text-[#1E1B4B] m-0" translate="no">{e.title}</h3>
        <p className="text-xs text-slate-500 m-0" translate="no">📍 {e.temple && e.temple.name}</p>
        <p className="text-xs text-slate-600 m-0">🗓️ {dateTime(e.starts_at)}</p>
        <p className="text-xs m-0" style={{ color: closed ? '#9a3412' : '#166534' }}>
          <span>{closed ? 'Booking closed' : 'Booking closes in'}</span>{!closed && <b translate="no"> {left}</b>}
        </p>
        <p className="text-[11px] text-slate-500 m-0"><span>Spots left:</span> {e.remaining} / {e.capacity}</p>
        <div className="flex items-center justify-between mt-auto pt-3">
          <span className="text-xs text-slate-600">{from != null && <><span>From</span> <b>{money(from)}</b></>}</span>
          <Link to={`/mandir-seva/event/${e.id}`} className="shop-btn shop-btn--gold no-underline text-xs">{closed ? 'View details' : 'Book now →'}</Link>
        </div>
      </div>
    </article>
  );
}

async function downloadCertificate(b, lang) {
  const res = await fetch(`${API}/chadawa/${encodeURIComponent(b.id)}/certificate?lang=${lang}`);
  if (!res.ok) {
    let msg = 'The certificate is not available yet.';
    try { const j = await res.json(); if (typeof j.detail === 'string') msg = j.detail; } catch (err) { /* keep default */ }
    throw new ApiError(res.status, msg);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = `${b.booking_number}-certificate.pdf`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function MyBookings({ lang }) {
  const { currentUser, openAuthModal } = useAuth();
  const [state, setState] = useState({ loading: !!currentUser });
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(() => {
    if (!currentUser) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    call(`/chadawa/my-bookings?lang=${lang}`).then((d) => setState({ list: d.bookings || [] })).catch((error) => setState({ error }));
  }, [currentUser, lang]);
  useEffect(load, [load]);

  if (!currentUser) {
    return <Notice action="Sign in" onAction={() => openAuthModal('login')}>Sign in to see your bookings, their status and the video proof of your sankalp.</Notice>;
  }
  if (state.loading) return <p role="status" className="text-center text-xs text-slate-500">Loading your bookings…</p>;
  if (state.error) return <Notice action="Try again" onAction={load}>{state.error.message}</Notice>;
  if (!state.list.length) return <Notice>You have not booked any seva yet. Pick a temple and offer your first seva.</Notice>;

  const cancel = async (b) => {
    setBusyId(b.id); setMessage(null);
    try { await post(`/chadawa/${encodeURIComponent(b.id)}/cancel`, {}, lang); setMessage({ ok: true, text: 'Your booking was cancelled and the amount returned to your wallet.' }); setConfirming(null); load(); }
    catch (e) { setMessage({ ok: false, text: e.message }); setConfirming(null); }
    setBusyId(null);
  };
  const certificate = async (b) => {
    setBusyId(b.id); setMessage(null);
    try { await downloadCertificate(b, lang); } catch (e) { setMessage({ ok: false, text: e.message }); }
    setBusyId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {message && <p role="status" className="text-xs rounded-xl px-3 py-2" style={{ background: message.ok ? '#ecfdf5' : '#fef2f2', color: message.ok ? '#166534' : '#991b1b' }}>{message.text}</p>}
      {state.list.map((b) => (
        <article key={b.id} className="p-4 rounded-2xl bg-white border border-[#E7E2D8]">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 m-0" translate="no">{b.booking_number} · {dateOnly(b.created_at)}</p>
              <h3 className="font-serif text-sm font-bold text-[#1E1B4B] my-1" translate="no">{b.offering_title}</h3>
              <p className="text-xs text-slate-600 m-0" translate="no">{b.temple_name}</p>
              <p className="text-xs text-slate-500 m-0 mt-1"><span>For</span> <span translate="no">{b.devotee_name}{b.gotra ? ` · ${b.gotra}` : ''}</span></p>
              {b.scheduled_for && <p className="text-xs text-slate-500 m-0"><span>Scheduled for</span> {dateOnly(b.scheduled_for)}</p>}
            </div>
            <div className="text-right">
              <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">{statusText(b.service_status || b.status)}</span>
              <p className="text-sm font-bold text-[#3E0B18] m-0 mt-1">{money(b.amount_paid)}</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap mt-3">
            {b.video_proof_url && <a href={b.video_proof_url} target="_blank" rel="noopener noreferrer" className="shop-btn shop-btn--gold no-underline text-xs">▶ Watch video proof</a>}
            {b.certificate_available && <button type="button" disabled={busyId === b.id} onClick={() => certificate(b)} className="shop-btn shop-btn--ghost text-xs cursor-pointer">Download certificate</button>}
            {b.status === 'PAID' && <button type="button" disabled={busyId === b.id} onClick={() => setConfirming(b)} className="shop-btn shop-btn--ghost text-xs cursor-pointer">Cancel booking</button>}
          </div>
        </article>
      ))}
      {confirming && (
        <SimpleDialog label="Cancel booking" onClose={() => setConfirming(null)}>
          <h3 className="font-serif text-lg font-bold text-[#1E1B4B] mt-0 pr-10">Cancel this booking?</h3>
          <p className="text-xs text-slate-600">{confirming.offering_title} · {confirming.booking_number}. The amount paid will be returned to your wallet.</p>
          <div className="flex gap-2 mt-4">
            <button type="button" disabled={busyId === confirming.id} onClick={() => cancel(confirming)} className="flex-1 py-2.5 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs cursor-pointer border-0">Yes, cancel</button>
            <button type="button" onClick={() => setConfirming(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer border-0">Keep booking</button>
          </div>
        </SimpleDialog>
      )}
    </div>
  );
}

export default function MandirSevaPage({ section = 'all' }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const lang = useLang();
  const now = useNow();
  const tab = tabFor(section, params);
  const kind = kindFor(section);
  const [query, setQuery] = useState('');

  useEffect(() => { window.scrollTo({ top: 0 }); }, [section, tab]);

  const temples = useRequest(`/temples?lang=${lang}`, [lang]);
  const events = useRequest(`/chadhava/events?lang=${lang}`, [lang]);

  const q = query.trim().toLowerCase();
  const shownTemples = useMemo(() => ((temples.data && temples.data.temples) || []).filter((t) =>
    !q || [t.name, t.deity, t.city, t.state].some((x) => String(x || '').toLowerCase().includes(q))), [temples.data, q]);
  const shownEvents = useMemo(() => ((events.data && events.data.events) || []).filter((e) =>
    (kind === 'all' || e.kind === kind) && (!q || [e.title, e.temple && e.temple.name, e.temple && e.temple.city].some((x) => String(x || '').toLowerCase().includes(q)))), [events.data, kind, q]);

  const goTab = (id) => navigate(TABS.find((x) => x.id === id).path);

  return (
    <div className="shop-page mandir-page w-full min-w-0 max-w-full overflow-x-hidden">
      <section className="shop-hero mandir-hero service-banner service-banner--mandir" data-mode="home">
        <figure className="service-banner__art">
          <img src="/assets/img/mandir-banner.webp" alt="Sacred Mandir Seva" fetchPriority="high" />
          <figcaption>Illustrative image</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow">SACRED SEVA, FROM HOME</p>
          <h1>Offer chadhava at <em>your chosen temple</em></h1>
          <div className="mandir-hero__titlerow"><span className="shop-hero__badge">E-Chadawa &amp; Sankalp Puja</span></div>
          <p>Choose a temple, select an offering in your name and gotra, and follow your seva through to its recorded video proof.</p>
          <div className="shop-hero__actions">
            <button type="button" className="shop-btn shop-btn--gold cursor-pointer" onClick={() => goTab('temples')}><span>🛕</span><span>Explore Temples →</span></button>
            <button type="button" className="shop-btn shop-btn--ghost cursor-pointer" onClick={() => goTab('mine')}><span>📜</span><span>My Bookings &amp; Video Proof</span></button>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div><span>📹</span><p><b>Video proof</b><small>Video of your sankalp, with name &amp; gotra</small></p></div>
          <div><span>🪔</span><p><b>Temple priests</b><small>Performed by temple priests</small></p></div>
          <div><span>📦</span><p><b>Booking updates</b><small>Payment, seva and video tracking</small></p></div>
        </div>
      </section>

      <div className="flex items-center justify-center gap-2 mb-6 px-4 flex-wrap" role="tablist" aria-label="Mandir Seva sections">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => goTab(x.id)}
            className="px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border" style={{ minHeight: 40,
              background: tab === x.id ? '#3E0B18' : '#FFFDF9', color: tab === x.id ? '#FFF9EF' : '#372E2F', borderColor: tab === x.id ? '#3E0B18' : '#E6D2B5' }}>
            {x.label}
          </button>
        ))}
      </div>

      {tab !== 'mine' && (
        <section className="shop-toolbar mb-6 px-4">
          <div className="shop-toolbar__row flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {tab === 'events' ? (
              <div className="shop-chips flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Event type">
                {KINDS.map((k) => (
                  <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => navigate(k.id === 'all' ? '/mandir-seva/events' : `/mandir-seva/${k.id}`)}
                    className={`shop-chip text-xs font-semibold whitespace-nowrap cursor-pointer ${kind === k.id ? 'is-active' : ''}`}>{k.label}</button>
                ))}
              </div>
            ) : <span />}
            <div className="shop-tools min-w-[260px]">
              <input type="search" className="shop-input w-full text-xs" placeholder={tab === 'events' ? 'Search event, temple or city…' : 'Search temple, deity or city…'}
                value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search" />
            </div>
          </div>
        </section>
      )}

      <section className="px-4 max-w-7xl mx-auto mb-16">
        {tab === 'temples' && (
          temples.loading ? <p role="status" className="text-center text-xs text-slate-500">Loading temples…</p>
          : temples.error ? <Notice action="Try again" onAction={temples.retry}>{temples.error.message}</Notice>
          : shownTemples.length === 0 ? <Notice>No temple matches your search.</Notice>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{shownTemples.map((t) => <TempleCard key={t.id} t={t} />)}</div>
        )}
        {tab === 'events' && (
          events.loading ? <p role="status" className="text-center text-xs text-slate-500">Loading events…</p>
          : events.error ? <Notice action="Try again" onAction={events.retry}>{events.error.message}</Notice>
          : shownEvents.length === 0 ? <Notice action="Browse temples" onAction={() => goTab('temples')}>No upcoming events are open for booking right now. You can still offer seva at any temple.</Notice>
          : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{shownEvents.map((e) => <EventCard key={e.id} e={e} now={now} lang={lang} />)}</div>
        )}
        {tab === 'mine' && <MyBookings lang={lang} />}
      </section>
    </div>
  );
}
