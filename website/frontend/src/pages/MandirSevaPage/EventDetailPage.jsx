import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { announceBalance } from '../../components/WalletModal/walletApi.js';
import SimpleDialog from '../../components/SimpleDialog/SimpleDialog.jsx';
import { PURPOSES } from './SevaBookingDialog.jsx';
import { post, money, dateTime, timeLeft, useNow, useLang, useRequest, ApiError } from './mandirApi.js';

// One chadhava / puja event: choose the offerings, enter the devotee's details, pay from the wallet.
// Dates, spots left, prices and the booking number all come from /api/v1/mandir/chadhava.

const field = 'w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none bg-white';
const newKey = () => `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const rupees = (paise) => money((paise || 0) / 100);

export default function EventDetailPage() {
  const { id } = useParams();
  const lang = useLang();
  const now = useNow();
  const { currentUser, openAuthModal } = useAuth();
  const { data, loading, error, retry } = useRequest(`/chadhava/events?lang=${lang}`, [lang]);
  const event = useMemo(() => ((data && data.events) || []).find((e) => e.id === id), [data, id]);

  const [qty, setQty] = useState({});       // offering id -> quantity (chadhava items and puja add-ons)
  const [tier, setTier] = useState('');     // chosen puja package
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gotra, setGotra] = useState('');
  const [gotraUnknown, setGotraUnknown] = useState(false);
  const [family, setFamily] = useState('');
  const [purpose, setPurpose] = useState(PURPOSES[0][0]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [quote, setQuote] = useState(null);
  const key = useRef(newKey());

  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);
  useEffect(() => { if (currentUser && !name) setName(currentUser.full_name || currentUser.name || ''); }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (event) document.title = `${event.title} – Mandir Seva | Astro Jyotish`; }, [event]);
  useEffect(() => {
    if (event && event.kind === 'puja' && !tier) { const t = (event.offerings || []).find((o) => o.category === 'puja_tier'); if (t) setTier(t.id); }
  }, [event, tier]);

  const isPuja = event && event.kind === 'puja';
  const tiers = event ? (event.offerings || []).filter((o) => o.category === 'puja_tier') : [];
  const others = event ? (event.offerings || []).filter((o) => o.category !== 'puja_tier') : [];
  const items = useMemo(() => {
    const list = Object.entries(qty).filter(([, q]) => q > 0).map(([offering_id, quantity]) => ({ offering_id, quantity }));
    if (isPuja && tier) list.unshift({ offering_id: tier, quantity: 1 });
    return list;
  }, [qty, tier, isPuja]);
  const selectionKey = JSON.stringify(items);

  // The price always comes from the server.
  useEffect(() => {
    key.current = newKey();
    if (!event || !items.length) { setQuote(null); return undefined; }
    let on = true;
    const t = setTimeout(() => {
      post('/chadhava/quote', { event_id: event.id, items }, lang).then((q) => on && setQuote(q)).catch((e) => { if (on) { setQuote(null); setMessage({ text: e.message }); } });
    }, 250);
    return () => { on = false; clearTimeout(t); };
  }, [event && event.id, selectionKey, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) return <p role="status" className="text-center text-xs text-slate-500 py-16">Loading event…</p>;
  if (error && !data) {
    return <div className="py-16 text-center" role="alert"><p className="text-sm text-slate-600 mb-3">{error.message}</p>
      <button type="button" onClick={retry} className="px-4 py-2 rounded-full bg-[#3E0B18] text-[#FFF9EF] text-xs font-bold cursor-pointer border-0">Try again</button></div>;
  }
  if (!event) {
    return (
      <div className="w-full bg-[#FAF7F2] min-h-[60vh] py-16 px-4 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#1E1B4B] mb-2">This event is not open</h1>
        <p className="text-sm text-slate-600 mb-5">It may have ended or its booking may have closed.</p>
        <Link to="/mandir-seva/events" className="shop-btn shop-btn--gold no-underline">← Upcoming events</Link>
      </div>
    );
  }

  const left = timeLeft(event.deadline, now, lang);
  const open = event.bookable && !!left;
  const setQuantity = (oid, q) => setQty((x) => ({ ...x, [oid]: Math.max(0, Math.min(99, q)) }));

  const validate = () => {
    const e = {};
    if (!items.length) e.items = isPuja ? 'Choose a puja package.' : 'Choose at least one offering.';
    if (name.replace(/\s+/g, ' ').trim().length < 2) e.name = 'Enter the devotee\'s name.';
    if (!/^[+\d\s()-]{7,20}$/.test(phone.trim())) e.phone = 'Enter a phone number (7 to 20 digits) for the video and updates.';
    if (!gotraUnknown && !gotra.trim()) e.gotra = event.unknown_gotra_allowed ? 'Enter your gotra, or tick "I do not know my gotra".' : 'Enter your gotra.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setMessage(null);
    if (!validate()) return;
    if (!currentUser) { setMessage({ text: 'Please sign in to book.' }); openAuthModal('login'); return; }
    if (!quote) { setMessage({ text: 'We are still working out the price. Please try again in a moment.' }); return; }
    setBusy(true);
    try {
      const order = await post('/chadhava/orders', {
        event_id: event.id, items, expected_amount_paise: quote.amount_paise, devotee_name: name.replace(/\s+/g, ' ').trim(),
        gotra: gotraUnknown ? '' : gotra.trim(), gotra_unknown: gotraUnknown, phone: phone.trim(), family_members: family.trim(),
        purpose, payment_method: 'wallet', idempotency_key: key.current,
      }, lang);
      try { const w = await fetch('/api/v1/wallet'); if (w.ok) announceBalance((await w.json()).balance); } catch (e) { /* refreshed later */ }
      key.current = newKey();
      setDone(order);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { setMessage({ text: 'Please sign in to book.' }); openAuthModal('login'); }
      else setMessage({ text: e.message, needsFunds: e.status === 402 });
    }
    setBusy(false);
  };

  const err = (k) => errors[k] && <p role="alert" id={`ev-err-${k}`} className="text-[11px] text-rose-700 mt-1">{errors[k]}</p>;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF7F2] min-h-screen pb-20">
      <section className="service-banner service-banner--puja max-w-7xl mx-auto mt-4 px-4">
        <figure className="service-banner__art"><img src={event.image_url} alt={event.temple && event.temple.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} /></figure>
        <div className="service-banner__copy">
          <p className="service-banner__eyebrow">✦ {event.kind === 'puja' ? 'SANKALP PUJA' : 'CHADHAVA'} ✦</p>
          <h1 className="font-serif" translate="no">{event.title}</h1>
          <div className="flex items-center gap-2 flex-wrap mb-3 text-xs text-amber-200" translate="no">
            <span>📍 {event.temple && event.temple.name}</span><span>🗓️ {dateTime(event.starts_at)}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-2xl mb-4" translate="no">{event.description}</p>
          <div className="flex items-center gap-3 flex-wrap text-xs mb-2">
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20">{open ? <><span>Booking closes in</span> <b translate="no">{left}</b></> : <span>Booking closed</span>}</span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20"><span>Spots left:</span> {event.remaining} / {event.capacity}</span>
            {event.video_hours ? <span className="px-2.5 py-1 rounded-full bg-white/10 text-white border border-white/20"><span>Video within</span> {event.video_hours} <span>hours</span></span> : null}
          </div>
          <Link to="/mandir-seva/events" className="shop-btn shop-btn--ghost no-underline mt-3 inline-block">← All events</Link>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {(event.benefits || []).length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#E7E2D8]">
              <h2 className="font-serif text-lg font-bold text-[#1E1B4B] mt-0 mb-2">Benefits</h2>
              <ul className="m-0 pl-5 text-xs text-slate-600 space-y-1" translate="no">{event.benefits.map((b) => <li key={b}>{b}</li>)}</ul>
            </div>
          )}
          {isPuja && tiers.length > 0 && (
            <fieldset className="border-0 p-0 m-0">
              <legend className="font-serif text-lg font-bold text-[#1E1B4B] mb-3">Choose a package</legend>
              <div className="space-y-3">
                {tiers.map((o) => (
                  <label key={o.id} className={`block p-4 rounded-2xl border cursor-pointer ${tier === o.id ? 'bg-amber-50/80 border-[#3E0B18] ring-1 ring-[#3E0B18]' : 'bg-white border-[#E7E2D8]'}`}>
                    <input type="radio" name="tier" checked={tier === o.id} onChange={() => setTier(o.id)} className="mr-2" />
                    <b className="font-serif text-sm text-[#1E1B4B]" translate="no">{o.title}</b> <span className="float-right font-bold text-[#3E0B18]">{money(o.price)}</span>
                    <span className="block text-xs text-slate-500 mt-1 ml-5" translate="no">{o.description}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {others.length > 0 && (
            <section aria-label="Offerings">
              <h2 className="font-serif text-lg font-bold text-[#1E1B4B] mb-3">{isPuja ? 'Add offerings (optional)' : 'Choose your offerings'}</h2>
              <div className="space-y-3">
                {others.map((o) => {
                  const q = qty[o.id] || 0;
                  return (
                    <article key={o.id} className={`p-4 rounded-2xl border flex gap-4 items-center justify-between ${q ? 'bg-amber-50/80 border-[#3E0B18]' : 'bg-white border-[#E7E2D8]'}`}>
                      <div className="min-w-0">
                        <h3 className="font-serif text-sm font-bold text-[#1E1B4B] m-0" translate="no">{o.emoji ? `${o.emoji} ` : ''}{o.title}</h3>
                        <p className="text-xs text-slate-500 m-0 mt-1" translate="no">{o.description}</p>
                        <p className="text-sm font-bold text-[#3E0B18] m-0 mt-1">{money(o.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0" role="group" aria-label={`Quantity of ${o.title}`}>
                        <button type="button" aria-label="Fewer" disabled={!q} onClick={() => setQuantity(o.id, q - 1)} className="w-9 h-9 rounded-full border border-slate-300 bg-white font-bold cursor-pointer disabled:opacity-40">−</button>
                        <span className="w-6 text-center text-sm font-bold" aria-live="polite">{q}</span>
                        <button type="button" aria-label="More" onClick={() => setQuantity(o.id, q + 1)} className="w-9 h-9 rounded-full border border-[#3E0B18] bg-[#3E0B18] text-white font-bold cursor-pointer">+</button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {errors.items && <p role="alert" className="text-xs text-rose-700">{errors.items}</p>}
        </div>

        <div className="lg:col-span-5">
          <form onSubmit={submit} noValidate className="p-6 rounded-3xl bg-white border border-[#E7E2D8] shadow-lg space-y-3 lg:sticky lg:top-28">
            <h2 className="font-serif text-lg font-bold text-[#1E1B4B] mt-0 mb-1">Sankalp details</h2>
            {!open && <p role="status" className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 m-0">Booking is closed for this event.</p>}
            <div>
              <label htmlFor="ev-name" className="block text-xs font-bold text-[#1E1B4B] mb-1">Devotee (Yajman) name *</label>
              <input id="ev-name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'ev-err-name' : undefined} />
              {err('name')}
            </div>
            <div>
              <label htmlFor="ev-phone" className="block text-xs font-bold text-[#1E1B4B] mb-1">Phone *</label>
              <input id="ev-phone" type="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'ev-err-phone' : undefined} />
              {err('phone')}
            </div>
            <div>
              <label htmlFor="ev-gotra" className="block text-xs font-bold text-[#1E1B4B] mb-1">Gotra</label>
              <input id="ev-gotra" className={field} value={gotra} disabled={gotraUnknown} onChange={(e) => setGotra(e.target.value)} aria-invalid={!!errors.gotra} aria-describedby={errors.gotra ? 'ev-err-gotra' : undefined} />
              {err('gotra')}
              {event.unknown_gotra_allowed && (
                <label className="flex items-center gap-2 text-[11px] text-slate-600 mt-1.5 cursor-pointer"><input type="checkbox" checked={gotraUnknown} onChange={(e) => setGotraUnknown(e.target.checked)} /> I do not know my gotra</label>
              )}
            </div>
            <div>
              <label htmlFor="ev-purpose" className="block text-xs font-bold text-[#1E1B4B] mb-1">Sankalp purpose</label>
              <select id="ev-purpose" className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)}>{PURPOSES.map(([hi, en]) => <option key={hi} value={hi}>{lang === 'hi' ? hi : en}</option>)}</select>
            </div>
            <div>
              <label htmlFor="ev-family" className="block text-xs font-bold text-[#1E1B4B] mb-1">Family members (optional)</label>
              <textarea id="ev-family" rows={2} maxLength={500} className={field} value={family} onChange={(e) => setFamily(e.target.value)} placeholder="One name per line" />
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1" aria-live="polite">
              {quote && quote.items.map((l) => <div key={l.offering_id} className="flex justify-between gap-3"><span translate="no">{l.title} × {l.quantity}</span><span>{rupees(l.total_paise)}</span></div>)}
              <div className="flex justify-between font-bold text-sm text-[#3E0B18]"><span>Total</span><span>{quote ? rupees(quote.amount_paise) : '—'}</span></div>
              {quote && quote.policy && <p className="text-[11px] text-slate-500 m-0 pt-1" translate="no">{quote.policy}</p>}
            </div>

            {message && (
              <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                {message.text}
                {message.needsFunds && <button type="button" onClick={() => window.App?.openWalletModal?.()} className="block mt-2 px-4 py-2 rounded-full bg-[#3E0B18] text-[#FFF9EF] font-bold cursor-pointer border-0" style={{ minHeight: 40 }}>Add money to wallet</button>}
              </div>
            )}
            <button type="submit" disabled={busy || !open} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md disabled:opacity-60 disabled:cursor-default">
              {busy ? 'Booking…' : quote ? `Pay ${rupees(quote.amount_paise)} from wallet` : 'Pay from wallet'}
            </button>
            {!currentUser && <p className="text-[11px] text-slate-500 text-center m-0">You will be asked to sign in first.</p>}
          </form>
        </div>
      </div>

      {done && (
        <SimpleDialog label="Booking confirmed" onClose={() => setDone(null)}>
          <div className="text-center mb-4">
            <span className="text-3xl block mb-1" aria-hidden="true">🙏</span>
            <h3 className="font-serif text-xl font-bold text-[#1E1B4B] m-0">Booking confirmed</h3>
            <p className="text-xs text-slate-500 mt-1">Your sankalp is booked for this event.</p>
          </div>
          <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
            <div className="flex justify-between gap-3"><span className="text-slate-600">Booking number</span><strong translate="no">{done.booking_number || '—'}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-600">Event</span><strong className="text-right" translate="no">{done.snapshot && done.snapshot.title}</strong></div>
            <div className="flex justify-between gap-3"><span className="text-slate-600">Video due by</span><strong>{dateTime(done.video_due_at)}</strong></div>
            <div className="flex justify-between pt-1 text-sm"><span className="font-bold text-slate-700">Total paid</span><strong className="text-[#3E0B18]">{rupees(done.amount_paise)}</strong></div>
          </div>
          <Link to="/mandir-seva?tab=mine" onClick={() => setDone(null)} className="block text-center w-full py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-5 no-underline">View my bookings</Link>
        </SimpleDialog>
      )}
    </div>
  );
}
