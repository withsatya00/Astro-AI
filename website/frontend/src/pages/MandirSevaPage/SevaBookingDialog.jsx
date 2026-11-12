import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { announceBalance } from '../../components/WalletModal/walletApi.js';
import SimpleDialog from '../../components/SimpleDialog/SimpleDialog.jsx';
import { post, money, dateOnly, ApiError } from './mandirApi.js';

// Booking form for one offering of a temple, or for a multi-session package. It asks the server for the price
// (coupons and member benefits included), then books and pays from the wallet. The booking number is the server's.

export const PURPOSES = [
  ['स्वास्थ्य, सुख-शांति एवं कार्यसिद्धि', 'Health, peace and success in endeavours'],
  ['स्वास्थ्य, दीर्घायु एवं आरोग्य लाभ', 'Health & long life'],
  ['व्यापार वृद्धि एवं धन आगमन', 'Business growth & prosperity'],
  ['शीघ्र विवाह एवं दांपत्य सुख', 'Marriage & family harmony'],
  ['शनि साढ़ेसाती व ग्रह दोष शांति', 'Shani / graha shanti'],
  ['संतान सुख एवं विद्या प्राप्ति', 'Children & education'],
  ['सर्वमनोकामना सिद्धि', 'All wishes fulfilled'],
];
const UNKNOWN_GOTRA = 'कश्यप (Kashyap)';
const today = () => new Date().toISOString().slice(0, 10);
const field = 'w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none bg-white';

export default function SevaBookingDialog({ temple, offering, pkg, lang, onClose }) {
  const { currentUser, openAuthModal } = useAuth();
  const isPackage = !!pkg;
  const title = isPackage ? pkg.title : offering.title;
  const basePrice = isPackage ? pkg.price : offering.price;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gotra, setGotra] = useState('');
  const [gotraUnknown, setGotraUnknown] = useState(false);
  const [purpose, setPurpose] = useState(PURPOSES[0][0]);
  const [family, setFamily] = useState('');
  const [prasad, setPrasad] = useState(false);
  const [address, setAddress] = useState('');
  const [priestId, setPriestId] = useState('');
  const [coupon, setCoupon] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [quote, setQuote] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const quoteSeq = useRef(0);

  useEffect(() => { if (currentUser && !name) setName(currentUser.full_name || currentUser.name || ''); }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Price from the server whenever prasad delivery or the coupon changes (single offerings only).
  useEffect(() => {
    if (isPackage || !currentUser) return undefined;
    const seq = ++quoteSeq.current;
    const t = setTimeout(() => {
      post('/chadawa/quote', { offering_id: offering.id, include_prasad: prasad, coupon_code: coupon.trim() || null, use_points: 0 })
        .then((q) => { if (seq === quoteSeq.current) { setQuote(q); setMessage((m) => (m && m.coupon ? null : m)); } })
        .catch((e) => { if (seq === quoteSeq.current) { setQuote(null); if (coupon.trim()) setMessage({ coupon: true, text: e.message }); } });
    }, 350);
    return () => clearTimeout(t);
  }, [isPackage, currentUser, offering && offering.id, prasad, coupon]); // eslint-disable-line react-hooks/exhaustive-deps

  const priests = (temple.priests || []).filter((p) => !p.temple_id || p.temple_id === temple.id);
  const total = isPackage ? basePrice : quote ? quote.total : basePrice + (prasad ? Number(offering.delivery_fee || 0) : 0);

  const validate = () => {
    const e = {};
    if (name.replace(/\s+/g, ' ').trim().length < 2) e.name = 'Enter the devotee\'s name.';
    if (phone.trim() && !/^[+\d\s()-]{7,20}$/.test(phone.trim())) e.phone = 'Enter a valid phone number or leave it blank.';
    if (!gotraUnknown && !gotra.trim()) e.gotra = 'Enter your gotra, or tick "I do not know my gotra".';
    if (prasad && address.trim().length < 8) e.address = 'Enter the full delivery address for the prasad.';
    if (isPackage && startDate < today()) e.start = 'Choose today or a later date.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setMessage(null);
    if (!validate()) return;
    if (!currentUser) { onClose(); openAuthModal('login'); return; }
    setBusy(true);
    const common = {
      devotee_name: name.replace(/\s+/g, ' ').trim(), devotee_phone: phone.trim() || null,
      gotra: gotraUnknown ? UNKNOWN_GOTRA : gotra.trim(), sankalp_purpose: purpose, family_members: family.trim() || null,
      coupon_code: coupon.trim() || null, use_points: 0,
    };
    try {
      const out = isPackage
        ? await post(`/packages/${encodeURIComponent(pkg.slug)}/buy`, { ...common, start_date: startDate }, lang)
        : await post('/chadawa/book', { ...common, offering_id: offering.id, include_prasad: prasad, delivery_address: prasad ? address.trim() : null, priest_id: priestId || null }, lang);
      try { const w = await fetch('/api/v1/wallet'); if (w.ok) announceBalance((await w.json()).balance); } catch (e) { /* the balance refreshes later */ }
      setDone(out);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { onClose(); openAuthModal('login'); }
      else setMessage({ text: e.message, needsFunds: e.status === 402 });
    }
    setBusy(false);
  };

  if (done) {
    const list = done.bookings || [done.booking];
    return (
      <SimpleDialog label="Booking confirmed" onClose={onClose}>
        <div className="text-center mb-4">
          <span className="text-3xl block mb-1" aria-hidden="true">🙏</span>
          <h3 className="font-serif text-xl font-bold text-[#1E1B4B] m-0">Booking confirmed</h3>
          <p className="text-xs text-slate-500 mt-1">Your sankalp is booked. You can follow it under My Bookings.</p>
        </div>
        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/60 space-y-2 text-xs">
          {list.map((b) => (
            <div key={b.id} className="flex justify-between gap-3 border-b border-amber-200/40 pb-1.5">
              <span className="text-slate-600" translate="no">{b.booking_number}{b.scheduled_for ? ` · ${dateOnly(b.scheduled_for)}` : ''}</span>
              <strong className="text-[#1E1B4B]">{money(b.amount_paid)}</strong>
            </div>
          ))}
          <div className="flex justify-between pt-1 text-sm"><span className="font-bold text-slate-700">Total paid</span>
            <strong className="text-[#3E0B18]">{money(done.totals ? done.totals.total : list.reduce((s, b) => s + b.amount_paid, 0))}</strong></div>
        </div>
        <Link to="/mandir-seva?tab=mine" onClick={onClose} className="block text-center w-full py-3 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-5 no-underline">View my bookings</Link>
      </SimpleDialog>
    );
  }

  const err = (k) => errors[k] && <p role="alert" id={`sb-err-${k}`} className="text-[11px] text-rose-700 mt-1">{errors[k]}</p>;
  return (
    <SimpleDialog label={`Book ${title}`} onClose={onClose} wide>
      <h3 className="font-serif text-lg font-bold text-[#1E1B4B] mt-0 pr-10" translate="no">{title}</h3>
      <p className="text-xs text-slate-500 mt-0 mb-4" translate="no">{temple.name}</p>
      <form onSubmit={submit} noValidate className="space-y-3">
        <div>
          <label htmlFor="sb-name" className="block text-xs font-bold text-[#1E1B4B] mb-1">Devotee (Yajman) name *</label>
          <input id="sb-name" className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'sb-err-name' : undefined} />
          {err('name')}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="sb-gotra" className="block text-xs font-bold text-[#1E1B4B] mb-1">Gotra</label>
            <input id="sb-gotra" className={field} value={gotra} disabled={gotraUnknown} onChange={(e) => setGotra(e.target.value)} placeholder="e.g. Bharadwaj" aria-invalid={!!errors.gotra} aria-describedby={errors.gotra ? 'sb-err-gotra' : undefined} />
            {err('gotra')}
            <label className="flex items-center gap-2 text-[11px] text-slate-600 mt-1.5 cursor-pointer">
              <input type="checkbox" checked={gotraUnknown} onChange={(e) => setGotraUnknown(e.target.checked)} /> I do not know my gotra (Kashyap is used)
            </label>
          </div>
          <div>
            <label htmlFor="sb-phone" className="block text-xs font-bold text-[#1E1B4B] mb-1">Phone (optional)</label>
            <input id="sb-phone" type="tel" className={field} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'sb-err-phone' : undefined} />
            {err('phone')}
          </div>
        </div>
        <div>
          <label htmlFor="sb-purpose" className="block text-xs font-bold text-[#1E1B4B] mb-1">Sankalp purpose</label>
          <select id="sb-purpose" className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            {PURPOSES.map(([hi, en]) => <option key={hi} value={hi}>{lang === 'hi' ? hi : en}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="sb-family" className="block text-xs font-bold text-[#1E1B4B] mb-1">Family members to include (optional)</label>
          <textarea id="sb-family" rows={2} maxLength={500} className={field} value={family} onChange={(e) => setFamily(e.target.value)} placeholder="One name per line" />
        </div>
        {isPackage && (
          <div>
            <label htmlFor="sb-start" className="block text-xs font-bold text-[#1E1B4B] mb-1">First session on or after</label>
            <input id="sb-start" type="date" min={today()} className={field} value={startDate} onChange={(e) => setStartDate(e.target.value)} aria-invalid={!!errors.start} />
            {err('start')}
            <p className="text-[11px] text-slate-500 mt-1">{pkg.sessions} sessions, {pkg.cadence}.</p>
          </div>
        )}
        {!isPackage && offering.has_prasad_delivery && (
          <div>
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={prasad} onChange={(e) => setPrasad(e.target.checked)} /> Send prasad to my address (+{money(offering.delivery_fee)})
            </label>
            {prasad && (
              <div className="mt-2">
                <label htmlFor="sb-address" className="block text-xs font-bold text-[#1E1B4B] mb-1">Delivery address *</label>
                <textarea id="sb-address" rows={2} maxLength={500} className={field} value={address} onChange={(e) => setAddress(e.target.value)} aria-invalid={!!errors.address} aria-describedby={errors.address ? 'sb-err-address' : undefined} />
                {err('address')}
              </div>
            )}
          </div>
        )}
        {!isPackage && priests.length > 0 && (
          <div>
            <label htmlFor="sb-priest" className="block text-xs font-bold text-[#1E1B4B] mb-1">Priest (optional)</label>
            <select id="sb-priest" className={field} value={priestId} onChange={(e) => setPriestId(e.target.value)}>
              <option value="">Any available priest</option>
              {priests.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="sb-coupon" className="block text-xs font-bold text-[#1E1B4B] mb-1">Coupon code (optional)</label>
          <input id="sb-coupon" className={field} value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} maxLength={30} autoComplete="off" />
        </div>

        <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1" aria-live="polite">
          {quote && !isPackage ? (
            <>
              <div className="flex justify-between"><span>Offering</span><span>{money(quote.subtotal)}</span></div>
              {quote.coupon_discount > 0 && <div className="flex justify-between text-emerald-800"><span>Coupon {quote.coupon_code}</span><span>-{money(quote.coupon_discount)}</span></div>}
              {quote.member_discount > 0 && <div className="flex justify-between text-emerald-800"><span>Member benefit</span><span>-{money(quote.member_discount)}</span></div>}
              {quote.delivery_fee > 0 && <div className="flex justify-between"><span>Prasad delivery</span><span>{money(quote.delivery_fee)}</span></div>}
            </>
          ) : null}
          <div className="flex justify-between font-bold text-sm text-[#3E0B18]"><span>Total</span><span>{money(total)}</span></div>
        </div>

        {message && (
          <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
            {message.text}
            {message.needsFunds && <button type="button" onClick={() => window.App?.openWalletModal?.()} className="block mt-2 px-4 py-2 rounded-full bg-[#3E0B18] text-[#FFF9EF] font-bold cursor-pointer border-0" style={{ minHeight: 40 }}>Add money to wallet</button>}
          </div>
        )}
        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#1E1B4B] font-extrabold text-xs uppercase tracking-wider cursor-pointer border-0 shadow-md disabled:opacity-60 disabled:cursor-default">
          {busy ? 'Booking…' : `Pay ${money(total)} from wallet`}
        </button>
        {!currentUser && <p className="text-[11px] text-slate-500 text-center m-0">You will be asked to sign in first.</p>}
      </form>
    </SimpleDialog>
  );
}
