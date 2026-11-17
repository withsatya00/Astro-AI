import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWallet, fetchWallet, announceBalance } from '../../components/WalletModal/walletApi.js';
import SimpleDialog from '../../components/SimpleDialog/SimpleDialog.jsx';
import { post, money, dateOnly, ApiError } from './mandirApi.js';

// Booking form for one offering of a temple, ready thali combo, or custom basket.
// Pure language-toggle separation (Hindi vs English) and direct wallet ledger deduction.

export const PURPOSES = [
  ['स्वास्थ्य, सुख-शांति एवं कार्यसिद्धि', 'Health, peace and success in endeavours'],
  ['स्वास्थ्य, दीर्घायु एवं आरोग्य लाभ', 'Health & long life'],
  ['व्यापार वृद्धि एवं धन आगमन', 'Business growth & prosperity'],
  ['शीघ्र विवाह एवं दांपत्य सुख', 'Marriage & family harmony'],
  ['शनि साढ़ेसाती व ग्रह दोष शांति', 'Shani / graha shanti'],
  ['संतान सुख एवं विद्या प्राप्ति', 'Children & education'],
  ['सर्वमनोकामना सिद्धि', 'All wishes fulfilled'],
];
const UNKNOWN_GOTRA_HI = 'कश्यप गोत्र';
const UNKNOWN_GOTRA_EN = 'Kashyap Gotra';
const today = () => new Date().toISOString().slice(0, 10);
const field = 'w-full p-3.5 text-sm rounded-2xl border border-slate-300 outline-none bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/30 transition-all font-medium';

export default function SevaBookingDialog({ temple, offering, pkg, combo, basket, lang = 'hi', onClose }) {
  const { currentUser, openAuthModal } = useAuth();
  const wallet = useWallet(true);
  const isHi = lang === 'hi';

  const isPackage = !!pkg;
  const isCombo = !!combo;
  const isBasket = !!basket;

  const title = isPackage ? pkg.title
    : isCombo ? (isHi ? combo.title : (combo.title_en || combo.title))
    : isBasket ? (isHi ? (basket.title || `मंदिर चढ़ावा (${basket.items.length} सामग्री)`) : `Temple Offering (${basket.items.length} Items)`)
    : (offering ? (isHi ? offering.title : (offering.title_en || offering.title)) : (isHi ? 'मंदिर चढ़ावा' : 'Temple Offering'));

  const basePrice = isPackage ? pkg.price : isCombo ? combo.price : isBasket ? basket.total : (offering ? offering.price : 51);

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

  // Price quote from server
  useEffect(() => {
    if (isPackage || !currentUser) return undefined;
    const seq = ++quoteSeq.current;
    const t = setTimeout(() => {
      const quotePayload = isBasket
        ? { basket_items: basket.items, custom_amount: basket.total, include_prasad: prasad, coupon_code: coupon.trim() || null, use_points: 0 }
        : isCombo
        ? { custom_amount: combo.price, include_prasad: prasad, coupon_code: coupon.trim() || null, use_points: 0 }
        : { offering_id: offering?.id, include_prasad: prasad, coupon_code: coupon.trim() || null, use_points: 0 };

      post('/chadawa/quote', quotePayload, lang)
        .then((q) => { if (seq === quoteSeq.current) { setQuote(q); setMessage((m) => (m && m.coupon ? null : m)); } })
        .catch((e) => { if (seq === quoteSeq.current) { setQuote(null); if (coupon.trim()) setMessage({ coupon: true, text: e.message }); } });
    }, 350);
    return () => clearTimeout(t);
  }, [isPackage, currentUser, offering && offering.id, isCombo, isBasket, prasad, coupon, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const priests = (temple?.priests || []).filter((p) => !p.temple_id || p.temple_id === temple.id);
  const total = isPackage ? basePrice : quote ? quote.total : basePrice + (prasad ? Number(offering?.delivery_fee || 99) : 0);

  const validate = () => {
    const e = {};
    if (name.replace(/\s+/g, ' ').trim().length < 2) {
      e.name = isHi ? 'कृपया यजमान का पूरा नाम दर्ज करें।' : 'Please enter devotee full name.';
    }
    if (!/^[+\d\s()-]{7,20}$/.test(phone.trim())) {
      e.phone = isHi ? 'प्रमाण वीडियो हेतु मान्य व्हाट्सएप नंबर (7-15 अंक) दर्ज करें।' : 'Please enter a valid WhatsApp phone number (7-15 digits).';
    }
    if (!gotraUnknown && !gotra.trim()) {
      e.gotra = isHi ? 'अपना गोत्र दर्ज करें अथवा "गोत्र ज्ञात नहीं" का विकल्प चुनें।' : 'Please enter gotra or select "Gotra unknown".';
    }
    if (prasad && address.trim().length < 8) {
      e.address = isHi ? 'कृपया प्रसाद डिलीवरी हेतु पूरा पता (सहित पिनकोड) दर्ज करें।' : 'Please enter full delivery address with PIN code.';
    }
    if (isPackage && startDate < today()) {
      e.start = isHi ? 'आज अथवा बाद की कोई तिथि चुनें।' : 'Please choose today or a future date.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setMessage(null);
    if (!validate()) return;
    if (!currentUser) { onClose(); openAuthModal('login'); return; }
    
    // Check wallet balance
    if (wallet.signedIn && wallet.balance < total) {
      setMessage({
        text: isHi
          ? `आपके वॉलेट में अपर्याप्त बैलेंस है (उपलब्ध: ${money(wallet.balance)})। कृपया ₹${(total - wallet.balance).toFixed(2)} का रिचार्ज करें।`
          : `Insufficient wallet balance (Available: ${money(wallet.balance)}). Please recharge ₹${(total - wallet.balance).toFixed(2)}.`,
        needsFunds: true,
      });
      return;
    }

    setBusy(true);
    const unknownG = isHi ? UNKNOWN_GOTRA_HI : UNKNOWN_GOTRA_EN;
    const common = {
      devotee_name: name.replace(/\s+/g, ' ').trim(),
      devotee_phone: phone.trim() || null,
      gotra: gotraUnknown ? unknownG : gotra.trim(),
      sankalp_purpose: purpose,
      family_members: family.trim() || null,
      coupon_code: coupon.trim() || null,
      use_points: 0,
      temple_id: temple?.id,
      temple_slug: temple?.slug,
    };

    try {
      let out;
      if (isPackage) {
        out = await post(`/packages/${encodeURIComponent(pkg.slug)}/buy`, { ...common, start_date: startDate }, lang);
      } else if (isBasket) {
        out = await post('/chadawa/book', {
          ...common,
          basket_items: basket.items,
          custom_amount: basket.total,
          combo_title: basket.title || `मंदिर चढ़ावा (${basket.items.length} सामग्री)`,
          include_prasad: prasad,
          delivery_address: prasad ? address.trim() : null,
          priest_id: priestId || null
        }, lang);
      } else if (isCombo) {
        out = await post('/chadawa/book', {
          ...common,
          combo_title: combo.title,
          custom_amount: combo.price,
          include_prasad: prasad,
          delivery_address: prasad ? address.trim() : null,
          priest_id: priestId || null
        }, lang);
      } else {
        out = await post('/chadawa/book', {
          ...common,
          offering_id: offering.id,
          include_prasad: prasad,
          delivery_address: prasad ? address.trim() : null,
          priest_id: priestId || null
        }, lang);
      }

      // Immediately deduct and refresh user's wallet
      try {
        const fresh = await fetchWallet();
        announceBalance(fresh.balance);
      } catch (err) {
        announceBalance(Math.max(0, (wallet.balance || 0) - total));
      }

      setDone(out);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        onClose();
        openAuthModal('login');
      } else {
        setMessage({ text: e.message, needsFunds: e.status === 402 });
      }
    }
    setBusy(false);
  };

  if (done) {
    const list = done.bookings || [done.booking];
    const totalPaid = done.totals ? done.totals.total : list.reduce((s, b) => s + b.amount_paid, 0);
    return (
      <SimpleDialog label={isHi ? 'सेवा संकल्प पुष्टिकरण' : 'Booking Confirmed'} onClose={onClose}>
        <div className="text-center mb-4">
          <span className="text-4xl block mb-2" aria-hidden="true">🙏</span>
          <h3 className="font-serif text-xl font-bold text-[#1E1B4B] m-0">
            {isHi ? 'सेवा संकल्प सफलतापूर्वक दर्ज हुआ!' : 'Offering Sankalp Confirmed!'}
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            {isHi
              ? 'आपका पावन संकल्प एवं चढ़ावा मंदिर के मुख्य पुजारियों को प्रेषित कर दिया गया है।'
              : 'Your sacred sankalp and offering has been dispatched to the temple priests.'}
          </p>
        </div>

        <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/80 space-y-2.5 text-xs">
          {list.map((b) => (
            <div key={b.id} className="flex justify-between gap-3 border-b border-amber-200/50 pb-2">
              <span className="text-slate-600 font-medium" translate="no">
                {b.booking_number}{b.scheduled_for ? ` · ${dateOnly(b.scheduled_for)}` : ''}
              </span>
              <strong className="text-[#1E1B4B]">{money(b.amount_paid)}</strong>
            </div>
          ))}

          <div className="flex justify-between pt-1 text-sm border-t border-amber-200/70">
            <span className="font-bold text-slate-700">{isHi ? 'वॉलेट से कटी कुल दक्षिणा:' : 'Total Deducted from Wallet:'}</span>
            <strong className="text-[#3E0B18] font-black">{money(totalPaid)}</strong>
          </div>

          {wallet.signedIn && (
            <div className="flex justify-between pt-1 text-xs text-emerald-900 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 font-semibold">
              <span>{isHi ? 'शेष उपलब्ध वॉलेट बैलेंस:' : 'Remaining Wallet Balance:'}</span>
              <span className="font-black">{money(wallet.balance)}</span>
            </div>
          )}
        </div>

        <p className="text-[11px] text-emerald-800 text-center mt-3 font-medium bg-emerald-50/60 py-1.5 px-3 rounded-xl border border-emerald-200/40">
          📱 {isHi ? 'चढ़ावा संपन्न होने पर आपके व्हाट्सएप पर वीडियो प्रमाण 48-72 घंटों में भेजा जाएगा।' : 'Recorded video proof will be sent to your WhatsApp in 48-72 hours.'}
        </p>

        <Link
          to="/mandir-seva?tab=mine"
          onClick={onClose}
          className="block text-center w-full py-3.5 rounded-2xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs uppercase tracking-wider mt-4 no-underline shadow-md hover:bg-[#520C1F] transition-all"
        >
          {isHi ? 'मेरी बुकिंग्स एवं वीडियो देखें →' : 'View My Bookings & Video →'}
        </Link>
      </SimpleDialog>
    );
  }

  const err = (k) => errors[k] && <p role="alert" id={`sb-err-${k}`} className="text-[11px] text-rose-700 mt-1 font-medium">{errors[k]}</p>;

  return (
    <SimpleDialog label={title} onClose={onClose} wide>
      <div className="border-b border-slate-100 pb-3 mb-4 pr-8" translate="no">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B45309] block mb-1">
          ✦ {isHi ? 'पवित्र मंदिर सेवा संकल्प' : 'Sacred Temple Seva Sankalp'} ✦
        </span>
        <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1E1B4B] m-0" translate="no">
          {title}
        </h3>
        <p className="text-xs text-slate-500 m-0 mt-0.5" translate="no">
          📍 {temple?.name || (isHi ? 'पवित्र तीर्थ धाम' : 'Sacred Temple')}
        </p>
      </div>

      {/* Basket or Combo itemization preview */}
      {isBasket && basket?.items?.length > 0 && (
        <div className="mb-4 p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-xs" translate="no">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#3E0B18]">
              {isHi ? `चयनित पावन सामग्रियां (${basket.items.length}):` : `Selected Sacred Offerings (${basket.items.length}):`}
            </span>
            <span className="font-extrabold text-sm text-[#3E0B18]">{money(basket.total)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {basket.items.map((it, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-amber-300/60 text-slate-800 font-medium text-[11px] shadow-xs">
                <span>{it.emoji || '🍃'}</span>
                <span>{isHi ? it.title : (it.title_en || it.title)}</span>
                <b className="text-[#3E0B18]">× {it.quantity}</b>
              </span>
            ))}
          </div>
        </div>
      )}

      {isCombo && combo?.items_included && (
        <div className="mb-4 p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/80 text-xs" translate="no">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#3E0B18]">
              {isHi ? 'थाली में सम्मिलित सामग्रियां:' : 'Items Included in Thali:'}
            </span>
            <span className="font-extrabold text-sm text-[#3E0B18]">{money(combo.price)}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {combo.items_included.map((it, idx) => (
              <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-amber-300/60 text-slate-800 font-medium text-[11px] shadow-xs">
                <span className="text-emerald-700 font-bold">✓</span>
                <span>{it}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <form translate="no" onSubmit={submit} noValidate className="space-y-4">
        {/* Live Wallet Balance Indicator Card */}
        {wallet.signedIn ? (
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            wallet.balance >= total
              ? 'bg-emerald-50/80 border-emerald-300/80 text-emerald-950'
              : 'bg-amber-50/90 border-amber-300 text-amber-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{wallet.balance >= total ? '🪙' : '⚠️'}</span>
              <div>
                <b className="block text-[11px] uppercase tracking-wide text-slate-700">
                  {isHi ? 'एस्ट्रो वॉलेट बैलेंस' : 'Astro Wallet Balance'}
                </b>
                <span className="text-xs font-bold">
                  {isHi ? `उपलब्ध: ${money(wallet.balance)}` : `Available: ${money(wallet.balance)}`}
                  {wallet.balance < total && (
                    <span className="text-rose-700 ml-1.5 font-bold">
                      ({isHi ? `₹${(total - wallet.balance).toFixed(2)} कम है` : `₹${(total - wallet.balance).toFixed(2)} needed`})
                    </span>
                  )}
                </span>
              </div>
            </div>
            {wallet.balance < total ? (
              <button
                type="button"
                onClick={() => {
                  if (window.App && typeof window.App.openWalletModal === 'function') {
                    window.App.openWalletModal();
                  } else {
                    window.location.href = '/wallet';
                  }
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs border-0 cursor-pointer shadow-xs hover:bg-[#520C1F]"
              >
                {isHi ? '+ रिचार्ज करें' : '+ Add Funds'}
              </button>
            ) : (
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-full border border-emerald-300/60">
                {isHi ? '✓ वॉलेट से कटेगा' : '✓ Wallet Pay Ready'}
              </span>
            )}
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300/70 text-xs flex items-center justify-between">
            <span className="text-slate-800 font-medium">
              {isHi ? 'वॉलेट से दक्षिणा देने हेतु साइन-इन करें' : 'Sign in to pay from your Astro Wallet'}
            </span>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-3.5 py-1.5 rounded-full bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs border-0 cursor-pointer shadow-xs hover:bg-[#520C1F]"
            >
              {isHi ? 'साइन-इन करें' : 'Sign In'}
            </button>
          </div>
        )}

        {/* Yajman Name */}
        <div>
          <label htmlFor="sb-name" className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
            {isHi ? 'यजमान का पूरा नाम *' : 'Devotee Full Name *'}
          </label>
          <input
            id="sb-name"
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isHi ? 'उदा. रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
            autoComplete="name"
            aria-invalid={!!errors.name}
          />
          {err('name')}
        </div>

        {/* Gotra & WhatsApp Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="sb-gotra" className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
              {isHi ? 'गोत्र' : 'Gotra'}
            </label>
            <input
              id="sb-gotra"
              className={field}
              value={gotra}
              disabled={gotraUnknown}
              onChange={(e) => setGotra(e.target.value)}
              placeholder={isHi ? 'उदा. भारद्वाज / कश्यप' : 'e.g. Bharadwaj / Kashyap'}
              aria-invalid={!!errors.gotra}
            />
            {err('gotra')}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 mt-1.5 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={gotraUnknown}
                onChange={(e) => setGotraUnknown(e.target.checked)}
                className="accent-[#3E0B18] w-4 h-4 cursor-pointer"
              />
              <span>{isHi ? "गोत्र ज्ञात नहीं है ('कश्यप' गोत्र से संकल्प होगा)" : "Gotra unknown ('Kashyap' gotra will be invoked)"}</span>
            </label>
          </div>

          <div>
            <label htmlFor="sb-phone" className="block text-sm font-bold text-[#1E1B4B] mb-1.5">
              {isHi ? 'व्हाट्सएप फोन नंबर *' : 'WhatsApp Phone Number *'}
            </label>
            <input
              id="sb-phone"
              type="tel"
              className={field}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={isHi ? 'उदा. 9876543210' : 'e.g. 9876543210'}
              autoComplete="tel"
              aria-invalid={!!errors.phone}
            />
            <p className="text-xs text-emerald-800 mt-1.5 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/50">
              <span>📱</span>
              <span>{isHi ? 'रिकॉर्डेड वीडियो प्रमाण इसी नंबर पर भेजा जाएगा' : 'Recorded video proof will be sent to this number'}</span>
            </p>
            {err('phone')}
          </div>
        </div>

        {/* Sankalp Purpose */}
        <div>
          <label htmlFor="sb-purpose" className="block text-xs font-bold text-[#1E1B4B] mb-1">
            {isHi ? 'संकल्प का मुख्य प्रयोजन' : 'Main Purpose of Sankalp'}
          </label>
          <select id="sb-purpose" className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            {PURPOSES.map(([hi, en]) => (
              <option key={hi} value={hi}>
                {isHi ? hi : en}
              </option>
            ))}
          </select>
        </div>

        {/* Family Members */}
        <div>
          <label htmlFor="sb-family" className="block text-xs font-bold text-[#1E1B4B] mb-1">
            {isHi ? 'परिवार के अन्य सदस्यों के नाम (वैकल्पिक)' : 'Other Family Members (Optional)'}
          </label>
          <textarea
            id="sb-family"
            rows={2}
            maxLength={500}
            className={field}
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            placeholder={isHi ? 'प्रति पंक्ति एक नाम दर्ज करें' : 'Enter one name per line'}
          />
        </div>

        {/* Package Start Date */}
        {isPackage && (
          <div>
            <label htmlFor="sb-start" className="block text-xs font-bold text-[#1E1B4B] mb-1">
              {isHi ? 'प्रथम सत्र की तिथि' : 'First Session Date'}
            </label>
            <input
              id="sb-start"
              type="date"
              min={today()}
              className={field}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-invalid={!!errors.start}
            />
            {err('start')}
            <p className="text-[11px] text-slate-500 mt-1">
              {isHi ? `${pkg.sessions} सत्र, ${pkg.cadence}।` : `${pkg.sessions} sessions, ${pkg.cadence}.`}
            </p>
          </div>
        )}

        {/* Prasad Delivery Option */}
        {!isPackage && (offering?.has_prasad_delivery !== false || isCombo || isBasket) && (
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-300/60">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={prasad}
                onChange={(e) => setPrasad(e.target.checked)}
                className="accent-[#3E0B18] w-4 h-4 cursor-pointer"
              />
              <span>
                {isHi
                  ? `घर पर पवित्र प्रसाद किट मंगवाएं (+${money(offering?.delivery_fee || 99)})`
                  : `Opt for Sacred Prasad Home Delivery (+${money(offering?.delivery_fee || 99)})`}
              </span>
            </label>

            {prasad && (
              <div className="mt-3 space-y-2 pt-2 border-t border-amber-200/60">
                <p className="text-[11px] text-slate-600 m-0">
                  🎁 <b>{isHi ? 'प्रसाद किट में शामिल:' : 'Prasad Kit Contains:'}</b>{' '}
                  {isHi
                    ? 'पवित्र गंगाजल शीशी, सिद्ध भस्म/विभूति, रक्षासूत्र एवं पंचमेवा। स्पीड पोस्ट द्वारा प्रेषित।'
                    : 'Sacred Gangajal vial, consecrated bhasma, holy thread and dry fruits. Sent via speed post.'}
                </p>
                <div>
                  <label htmlFor="sb-address" className="block text-xs font-bold text-[#1E1B4B] mb-1">
                    {isHi ? 'डिलीवरी का पूरा पता (सहित पिनकोड) *' : 'Complete Delivery Address with PIN code *'}
                  </label>
                  <textarea
                    id="sb-address"
                    rows={2}
                    maxLength={500}
                    className={field}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={isHi ? 'मकान संख्या, गली, शहर, राज्य और 6 अंकों का पिनकोड' : 'House no, street, city, state and 6-digit PIN code'}
                    aria-invalid={!!errors.address}
                  />
                  {err('address')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Priest & Coupon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!isPackage && priests.length > 0 && (
            <div>
              <label htmlFor="sb-priest" className="block text-xs font-bold text-[#1E1B4B] mb-1">
                {isHi ? 'तीर्थ पुरोहित (वैकल्पिक)' : 'Temple Priest (Optional)'}
              </label>
              <select id="sb-priest" className={field} value={priestId} onChange={(e) => setPriestId(e.target.value)}>
                <option value="">{isHi ? 'उपलब्ध मुख्य पुरोहित' : 'Available Chief Priest'}</option>
                {priests.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="sb-coupon" className="block text-xs font-bold text-[#1E1B4B] mb-1">
              {isHi ? 'कूपन कोड (वैकल्पिक)' : 'Coupon Code (Optional)'}
            </label>
            <input
              id="sb-coupon"
              className={field}
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="FIRSTFREE"
              maxLength={30}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Order Price Summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5" aria-live="polite">
          {quote && !isPackage ? (
            <>
              <div className="flex justify-between text-slate-600">
                <span>{isHi ? 'सेवा दक्षिणा' : 'Offering Amount'}</span>
                <span>{money(quote.subtotal)}</span>
              </div>
              {quote.coupon_discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>{isHi ? `कूपन छूट (${quote.coupon_code})` : `Coupon Discount (${quote.coupon_code})`}</span>
                  <span>-{money(quote.coupon_discount)}</span>
                </div>
              )}
              {quote.member_discount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>{isHi ? 'सदस्यता लाभ' : 'Membership Benefit'}</span>
                  <span>-{money(quote.member_discount)}</span>
                </div>
              )}
              {quote.delivery_fee > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{isHi ? 'प्रसाद डिलीवरी शुल्क' : 'Prasad Delivery Fee'}</span>
                  <span>{money(quote.delivery_fee)}</span>
                </div>
              )}
            </>
          ) : null}
          <div className="flex justify-between font-extrabold text-sm text-[#3E0B18] pt-1.5 border-t border-slate-200">
            <span>{isHi ? 'कुल दक्षिणा (वॉलेट से कटौती)' : 'Total Offering (Wallet Debit)'}</span>
            <span>{money(total)}</span>
          </div>
        </div>

        {message && (
          <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
            <p className="m-0 font-medium">{message.text}</p>
            {message.needsFunds && (
              <button
                type="button"
                onClick={() => {
                  if (window.App && typeof window.App.openWalletModal === 'function') {
                    window.App.openWalletModal();
                  } else {
                    window.location.href = '/wallet';
                  }
                }}
                className="mt-2 w-full py-2.5 rounded-xl bg-[#3E0B18] text-[#FFF9EF] font-bold text-xs cursor-pointer border-0 shadow-sm hover:bg-[#520C1F]"
              >
                🪙 {isHi ? 'वॉलेट रिचार्ज करें (+Add Funds)' : 'Recharge Astro Wallet (+Add Funds)'}
              </button>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D9A441] via-[#E5B558] to-[#B3832B] text-[#1E1B4B] font-extrabold text-sm uppercase tracking-wider cursor-pointer border-0 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-default"
        >
          {busy
            ? (isHi ? 'सेवा दर्ज हो रही है…' : 'Processing Seva…')
            : (isHi ? `वॉलेट से ${money(total)} दक्षिणा अर्पित करें` : `Pay ${money(total)} from Astro Wallet`)}
        </button>

        {!currentUser && (
          <p className="text-[11px] text-slate-500 text-center m-0">
            {isHi ? 'बुकिंग से पूर्व आपको वॉलेट साइन-इन करने को कहा जाएगा।' : 'You will be prompted to sign in before booking.'}
          </p>
        )}
      </form>
    </SimpleDialog>
  );
}
