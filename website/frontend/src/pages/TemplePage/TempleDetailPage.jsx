import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import SevaBookingDialog from '../MandirSevaPage/SevaBookingDialog.jsx';
import { money, useLang, useRequest, CATEGORY_LABEL } from '../MandirSevaPage/mandirApi.js';

// One temple: its story, aarti times, priests, the seva you can book (chadhava, abhishek, sankalp puja) and
// multi-session packages. Everything is read from /api/v1/mandir/temples/:slug and booked through the backend.

const GROUPS = [
  ['chadawa', 'Chadhava offerings'],
  ['abhishek', 'Abhishek'],
  ['sankalp_pooja', 'Sankalp puja'],
];
const LIVE_EN = { 'बुकिंग उपलब्ध': 'Booking available' };

function NotFound() {
  return (
    <div className="w-full bg-[#FAF7F2] min-h-[60vh] py-16 px-4 text-center">
      <h1 className="font-serif text-2xl font-bold text-[#1E1B4B] mb-2">We could not find this temple</h1>
      <p className="text-sm text-slate-600 mb-5">The link may be old or mistyped.</p>
      <Link to="/mandir-seva" className="shop-btn shop-btn--gold no-underline">← See all temples</Link>
    </div>
  );
}

export default function TempleDetailPage() {
  const { slug } = useParams();
  const lang = useLang();
  const { data: temple, loading, error, retry } = useRequest(slug ? `/temples/${encodeURIComponent(slug)}?lang=${lang}` : '/temples/none', [slug, lang]);
  const [booking, setBooking] = useState(null); // { offering } or { pkg }
  const [showMore, setShowMore] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0 }); setBooking(null); setShowMore(false); }, [slug]);
  useEffect(() => {
    if (temple && temple.name) document.title = `${temple.name} – Mandir Seva | Astro Jyotish`;
  }, [temple]);

  const groups = useMemo(() => GROUPS
    .map(([cat, label]) => [label, ((temple && temple.offerings) || []).filter((o) => o.category === cat)])
    .filter(([, list]) => list.length), [temple]);

  // /chadhava, /puja and similar paths without a slug have no temple to show.
  if (!slug) return <Navigate to="/mandir-seva" replace />;
  if (loading && !temple) return <p role="status" className="text-center text-xs text-slate-500 py-16">Loading temple…</p>;
  if (error && error.status === 404) return <NotFound />;
  if (error && !temple) {
    return (
      <div className="py-16 text-center" role="alert">
        <p className="text-sm text-slate-600 mb-3">{error.message}</p>
        <button type="button" onClick={retry} className="px-4 py-2 rounded-full bg-[#3E0B18] text-[#FFF9EF] text-xs font-bold cursor-pointer border-0">Try again</button>
      </div>
    );
  }
  if (!temple) return null;

  const live = LIVE_EN[temple.live_status] && lang === 'en' ? LIVE_EN[temple.live_status] : temple.live_status;
  const aarti = temple.aarti_timings || [];
  const priests = temple.priests || [];

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-20">
      <section className="service-banner service-banner--puja max-w-7xl mx-auto mt-4 px-4">
        <figure className="service-banner__art">
          <img src={temple.banner_url || temple.image_url} alt={temple.name} className="w-full h-full object-cover" fetchPriority="high"
            onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
        </figure>
        <div className="service-banner__copy">
          <p className="service-banner__eyebrow" translate="no">✦ {temple.deity} ✦</p>
          <h1 className="font-serif" translate="no">{temple.name}</h1>
          <div className="flex items-center gap-2 flex-wrap mb-3 text-xs text-amber-200">
            <span translate="no">📍 {[temple.city, temple.state].filter(Boolean).join(', ')}</span>
            {live && <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white">{live}</span>}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl mb-6" translate="no">{temple.description}</p>
          <div className="service-banner__actions flex items-center gap-4 flex-wrap">
            <a href="#temple-offerings" className="shop-btn shop-btn--gold no-underline cursor-pointer"
              onClick={(e) => { e.preventDefault(); document.getElementById('temple-offerings')?.scrollIntoView({ behavior: 'smooth' }); }}>Choose a seva →</a>
            <Link to="/mandir-seva" className="shop-btn shop-btn--ghost no-underline">← All temples</Link>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div><span>📹</span><p><b>Video proof</b><small>When the seva includes it</small></p></div>
          <div><span>🪔</span><p><b>Temple priests</b><small>Sankalp in your name and gotra</small></p></div>
          <div><span>📜</span><p><b>Booking record</b><small>Status and certificate in My Bookings</small></p></div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8" id="temple-offerings" style={{ scrollMarginTop: 100 }}>
          {groups.length === 0 && <p className="text-sm text-slate-600">No seva can be booked at this temple right now.</p>}
          {groups.map(([label, list]) => (
            <section key={label} aria-label={label}>
              <h2 className="font-serif text-xl font-bold text-[#1E1B4B] mb-3">{label}</h2>
              <div className="space-y-3">
                {list.map((o) => (
                  <article key={o.id} className="p-4 rounded-2xl bg-white border border-[#E7E2D8] flex gap-4 items-start justify-between flex-wrap sm:flex-nowrap">
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm font-bold text-[#1E1B4B] m-0 mb-1"><span translate="no">{o.emoji ? `${o.emoji} ` : ''}{o.title}</span>{o.popular && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Popular</span>}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed m-0" translate="no">{o.description}</p>
                      <p className="text-[11px] text-slate-500 m-0 mt-1.5">
                        {[o.includes_video_proof && '📹 Video proof', o.has_prasad_delivery && `📦 Prasad delivery +${money(o.delivery_fee)}`].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-bold text-[#3E0B18] m-0 mb-2">{money(o.price)}</p>
                      <button type="button" onClick={() => setBooking({ offering: o })} className="shop-btn shop-btn--gold text-xs cursor-pointer" style={{ minHeight: 40 }}>Book</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {(temple.packages || []).length > 0 && (
            <section aria-label="Packages">
              <h2 className="font-serif text-xl font-bold text-[#1E1B4B] mb-3">Multi-session packages</h2>
              <div className="space-y-3">
                {temple.packages.map((pk) => (
                  <article key={pk.slug} className="p-4 rounded-2xl bg-white border border-[#E7E2D8] flex gap-4 items-start justify-between flex-wrap sm:flex-nowrap">
                    <div className="min-w-0">
                      <h3 className="font-serif text-sm font-bold text-[#1E1B4B] m-0 mb-1" translate="no">{pk.title}</h3>
                      <p className="text-xs text-slate-500 m-0" translate="no">{pk.description}</p>
                      <p className="text-[11px] text-slate-500 m-0 mt-1.5"><span translate="no">{pk.sessions} sessions · {pk.discount_percent}%</span> <span>off</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      {pk.list_price > pk.price && <p className="text-[11px] text-slate-400 line-through m-0">{money(pk.list_price)}</p>}
                      <p className="text-base font-bold text-[#3E0B18] m-0 mb-2">{money(pk.price)}</p>
                      <button type="button" onClick={() => setBooking({ pkg: pk })} className="shop-btn shop-btn--gold text-xs cursor-pointer" style={{ minHeight: 40 }}>Buy package</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="lg:col-span-4 space-y-5">
          {temple.history_significance && (
            <div className="p-5 rounded-2xl bg-white border border-[#E7E2D8]">
              <h2 className="font-serif text-base font-bold text-[#1E1B4B] mt-0 mb-2">About this temple</h2>
              <p className="text-xs text-slate-600 leading-relaxed m-0" translate="no" style={showMore ? undefined : { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{temple.history_significance}</p>
              <button type="button" onClick={() => setShowMore((v) => !v)} aria-expanded={showMore} className="mt-2 text-xs font-bold text-[#3E0B18] bg-transparent border-0 p-0 cursor-pointer underline">{showMore ? 'Show less' : 'Read more'}</button>
            </div>
          )}
          {aarti.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#E7E2D8]">
              <h2 className="font-serif text-base font-bold text-[#1E1B4B] mt-0 mb-2">Aarti timings</h2>
              <ul className="list-none p-0 m-0 space-y-1 text-xs text-slate-600" translate="no">{aarti.map((a) => <li key={a.name} className="flex justify-between gap-3"><span>{a.name}</span><b>{a.time}</b></li>)}</ul>
            </div>
          )}
          {temple.live_url && (
            <a href={temple.live_url} target="_blank" rel="noopener noreferrer" className="block text-center p-3 rounded-2xl bg-[#3E0B18] text-[#FFF9EF] text-xs font-bold no-underline">▶ Watch live darshan</a>
          )}
          {priests.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#E7E2D8]">
              <h2 className="font-serif text-base font-bold text-[#1E1B4B] mt-0 mb-2">Priests</h2>
              <ul className="list-none p-0 m-0 space-y-2 text-xs text-slate-600" translate="no">
                {priests.map((p) => <li key={p.id}><b>{p.name}</b>{p.verified ? ' ✓' : ''}{p.years_experience ? ` · ${p.years_experience} yrs` : ''}{p.bio && <span className="block text-slate-500">{p.bio}</span>}</li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {booking && <SevaBookingDialog temple={temple} offering={booking.offering} pkg={booking.pkg} lang={lang} onClose={() => setBooking(null)} />}
    </div>
  );
}
