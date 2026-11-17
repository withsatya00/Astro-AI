import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useWallet, fetchWallet, announceBalance } from '../../components/WalletModal/walletApi.js';
import SimpleDialog from '../../components/SimpleDialog/SimpleDialog.jsx';
import { PURPOSES } from './SevaBookingDialog.jsx';
import { post, money, dateTime, timeLeft, useNow, useLang, useRequest, ApiError } from './mandirApi.js';

// One chadhava / puja event: choose the offerings, enter the devotee's details, pay from the wallet.
// Benchmarked against Sri Mandir for authentic devotional clarity, package transparency and trust.

const field = 'w-full p-3.5 text-sm rounded-2xl border border-slate-300 outline-none bg-white text-slate-800 placeholder:text-slate-400 focus:border-[#D9A441] focus:ring-2 focus:ring-[#D9A441]/30 transition-all font-medium';
const newKey = () => `k${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
const rupees = (paise) => money((paise || 0) / 100);

export default function EventDetailPage() {
  const { id } = useParams();
  const lang = useLang();
  const isHi = lang === 'hi';
  const now = useNow();
  const { currentUser, openAuthModal } = useAuth();
  const wallet = useWallet(true);
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
    if (event && event.kind === 'puja' && !tier) {
      const t = (event.offerings || []).find((o) => o.category === 'puja_tier');
      if (t) setTier(t.id);
    }
  }, [event, tier]);

  const isPuja = event && (
    event.kind === 'puja' ||
    (event.title && (event.title.toLowerCase().includes('puja') || event.title.includes('पूजा')))
  );
  const tiers = event ? (event.offerings || []).filter((o) => o.category === 'puja_tier') : [];
  const rawOthers = event ? (event.offerings || []).filter((o) => o.category !== 'puja_tier') : [];
  // Filter out non-spiritual items and deduplicate identical offerings across language roots
  const others = useMemo(() => {
    const list = rawOthers.filter((o) => !o.title.toLowerCase().includes('matchbox') && !o.title.toLowerCase().includes('माचिस'));
    const seen = new Set();
    const clean = [];
    const canonicalGroups = [
      { key: 'chandan', keywords: ['chandan', 'चंदन', 'sandalwood'] },
      { key: 'dhoop', keywords: ['guggul', 'गुग्गुल', 'dhoop', 'धूप', 'incense', 'agarbatti', 'अगरबत्ती'] },
      { key: 'gangajal', keywords: ['gangajal', 'गंगाजल', 'ganga', 'गंगा'] },
      { key: 'milk', keywords: ['milk', 'दूध', 'dugdh', 'दुग्ध'] },
      { key: 'bhasma', keywords: ['bhasma', 'भस्म'] },
      { key: 'panchamrit', keywords: ['panchamrit', 'पंचामृत'] },
      { key: 'belpatra', keywords: ['belpatra', 'बेलपत्र', 'bilva', 'बिल्व'] },
      { key: 'dhatura', keywords: ['dhatura', 'धतूरा', 'madar', 'मदार', 'aak', 'आक'] },
      { key: 'diya', keywords: ['ghee', 'घी', 'diya', 'दीपक', 'दीप', 'lamp'] },
      { key: 'flowers', keywords: ['flower', 'फूल', 'mala', 'माला', 'garland', 'पुष्प'] },
      { key: 'shringar', keywords: ['shringar', 'श्रृंगार', 'chunri', 'चुनरी'] },
      { key: 'bhog', keywords: ['bhog', 'भोग', 'prasad', 'प्रसाद', 'thali', 'थाली'] },
      { key: 'mishri', keywords: ['mishri', 'मिश्री', 'naivedya', 'नैवेद्य', 'makhan', 'माखन'] },
      { key: 'vastra', keywords: ['vastra', 'वस्त्र', 'pitambar', 'पीतांबर'] },
      { key: 'dhwaja', keywords: ['dhwaja', 'ध्वजा', 'flag'] },
      { key: 'oil', keywords: ['oil', 'तेल', 'mustard', 'सरसों', 'til', 'तिल'] },
      { key: 'sindoor', keywords: ['sindoor', 'सिंदूर', 'chola', 'चोला'] },
      { key: 'durva', keywords: ['durva', 'दूर्वा', 'modak', 'मोदक'] },
      { key: 'coconut', keywords: ['coconut', 'नारियल', 'shrifal', 'श्रीफल'] },
    ];

    for (const o of list) {
      const lower = (o.title || '').toLowerCase();
      let matchedKey = null;
      for (const group of canonicalGroups) {
        if (group.keywords.some((kw) => lower.includes(kw))) {
          matchedKey = group.key;
          break;
        }
      }
      const k = matchedKey || (o.id || lower);
      if (!seen.has(k)) {
        seen.add(k);
        clean.push(o);
      }
    }
    return clean;
  }, [rawOthers]);

  const items = useMemo(() => {
    const list = Object.entries(qty).filter(([, q]) => q > 0).map(([offering_id, quantity]) => ({ offering_id, quantity }));
    if (isPuja && tier) list.unshift({ offering_id: tier, quantity: 1 });
    return list;
  }, [qty, tier, isPuja]);
  const selectionKey = JSON.stringify(items);

  // Selected package details
  const selectedTierObj = useMemo(() => tiers.find((t) => t.id === tier), [tiers, tier]);

  // Price from server
  useEffect(() => {
    key.current = newKey();
    if (!event || !items.length) { setQuote(null); return undefined; }
    let on = true;
    const t = setTimeout(() => {
      post('/chadhava/quote', { event_id: event.id, items }, lang)
        .then((q) => on && setQuote(q))
        .catch((e) => { if (on) { setQuote(null); setMessage({ text: e.message }); } });
    }, 250);
    return () => { on = false; clearTimeout(t); };
  }, [event && event.id, selectionKey, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !data) return <p role="status" className="text-center text-xs text-slate-500 py-24">लोड हो रहा है...</p>;
  if (error && !data) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4" role="alert">
        <p className="text-sm text-slate-600 mb-4">{error.message}</p>
        <button type="button" onClick={retry} className="px-6 py-2.5 rounded-full bg-[#164B32] text-[#FFFDF5] text-xs font-bold cursor-pointer border-0 shadow-sm">पुनः प्रयास करें</button>
      </div>
    );
  }
  if (!event) {
    return (
      <div className="w-full bg-[#FAF9F2] min-h-[60vh] py-20 px-4 text-center">
        <h1 className="font-serif text-2xl font-bold text-[#183C2B] mb-2">यह पूजा फिलहाल उपलब्ध नहीं है</h1>
        <p className="text-sm text-slate-600 mb-6">इसकी बुकिंग समाप्त हो चुकी है अथवा तिथि निकल चुकी है।</p>
        <Link to="/mandir-seva/puja" className="px-6 py-3 rounded-full bg-[#164B32] text-[#FFFDF5] text-xs font-bold no-underline">← अन्य आगामी पूजा देखें</Link>
      </div>
    );
  }

  const left = timeLeft(event.deadline, now, lang);
  const open = event.bookable && !!left;
  const setQuantity = (oid, q) => setQty((x) => ({ ...x, [oid]: Math.max(0, Math.min(99, q)) }));

  const validate = () => {
    const e = {};
    if (!items.length) e.items = isHi ? (isPuja ? 'कृपया एक पूजा पैकेज चुनें।' : 'कम से कम एक चढ़ावा सामग्री चुनें।') : (isPuja ? 'Please select a puja package.' : 'Please select at least one offering.');
    if (name.replace(/\s+/g, ' ').trim().length < 2) e.name = isHi ? 'यजमान का पूरा नाम दर्ज करें।' : 'Please enter devotee full name.';
    if (!/^[+\d\s()-]{7,20}$/.test(phone.trim())) e.phone = isHi ? 'WhatsApp वीडियो प्रमाण हेतु मान्य फोन नंबर (7-15 अंक) दर्ज करें।' : 'Please enter a valid WhatsApp number (7-15 digits).';
    if (!gotraUnknown && !gotra.trim()) e.gotra = isHi ? 'अपना गोत्र दर्ज करें अथवा "गोत्र ज्ञात नहीं है" का विकल्प चुनें।' : 'Please enter gotra or select "Gotra unknown".';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (busy) return;
    setMessage(null);
    if (!validate()) return;
    if (!currentUser) { setMessage({ text: isHi ? 'कृपया बुकिंग से पहले साइन-इन करें।' : 'Please sign in to proceed with booking.' }); openAuthModal('login'); return; }
    if (!quote) { setMessage({ text: isHi ? 'दक्षिणा की गणना हो रही है। कृपया पुनः क्लिक करें।' : 'Calculating dakshina. Please click again.' }); return; }

    const quoteRupees = (quote.amount_paise || 0) / 100;
    if (wallet.signedIn && wallet.balance < quoteRupees) {
      setMessage({
        text: isHi
          ? `आपके वॉलेट में अपर्याप्त बैलेंस है (उपलब्ध: ${money(wallet.balance)})। कृपया ₹${(quoteRupees - wallet.balance).toFixed(2)} का रिचार्ज करें।`
          : `Insufficient wallet balance (Available: ${money(wallet.balance)}). Please recharge ₹${(quoteRupees - wallet.balance).toFixed(2)}.`,
        needsFunds: true,
      });
      return;
    }

    setBusy(true);
    try {
      const order = await post('/chadhava/orders', {
        event_id: event.id,
        items,
        expected_amount_paise: quote.amount_paise,
        devotee_name: name.replace(/\s+/g, ' ').trim(),
        gotra: gotraUnknown ? (isHi ? 'कश्यप गोत्र' : 'Kashyap Gotra') : gotra.trim(),
        gotra_unknown: gotraUnknown,
        phone: phone.trim(),
        family_members: family.trim() || null,
        purpose,
        payment_method: 'wallet',
        idempotency_key: key.current,
      }, lang);

      // Refresh wallet balance immediately
      try {
        const fresh = await fetchWallet();
        announceBalance(fresh.balance);
      } catch (err) {
        announceBalance(Math.max(0, (wallet.balance || 0) - quoteRupees));
      }

      key.current = newKey();
      setDone(order);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setMessage({ text: isHi ? 'कृपया साइन-इन करें।' : 'Please sign in.' });
        openAuthModal('login');
      } else {
        setMessage({ text: e.message, needsFunds: e.status === 402 });
      }
    }
    setBusy(false);
  };

  const err = (k) => errors[k] && <p role="alert" id={`ev-err-${k}`} className="text-[11px] text-rose-700 mt-1 font-medium">{errors[k]}</p>;
  const benefits = (event.benefits || {})[lang] || (event.benefits || {}).hi || (event.benefits || {}).en || [];

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-screen pb-20">
      {/* Sacred Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 pt-3 pb-1 text-xs text-slate-500 font-medium">
        <ol className="flex items-center gap-2 list-none p-0 m-0 flex-wrap">
          <li>
            <Link to="/" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
              {isHi ? 'होम' : 'Home'}
            </Link>
          </li>
          <li className="text-slate-400">›</li>
          <li>
            <Link to="/mandir-seva" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
              {isHi ? 'मंदिर सेवा' : 'Mandir Seva'}
            </Link>
          </li>
          <li className="text-slate-400">›</li>
          <li>
            <Link
              to={isPuja ? '/mandir-seva/puja' : '/mandir-seva/chadhava'}
              className="text-slate-500 hover:text-[#164B32] transition-colors no-underline"
            >
              {isPuja ? (isHi ? 'संकल्प पूजा' : 'Online Puja') : (isHi ? 'दैनिक चढ़ावा' : 'Daily Chadhava')}
            </Link>
          </li>
          <li className="text-slate-400">›</li>
          <li className="text-[#164B32] font-bold" aria-current="page" translate="no">
            {event.title}
          </li>
        </ol>
      </nav>

      {/* Majestic Photographic Sacred Hero Banner with 100% Contrast & High-Res Artwork */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-2">
        <header
          className="service-banner service-banner--mandir max-w-7xl mx-auto sacred-hero-banner relative rounded-3xl overflow-hidden shadow-xl"
          translate="no"
          style={{
            backgroundColor: '#164B32',
            border: '1.5px solid #D9A441',
          }}
        >
          {/* Authentic Temple Photographic Artwork */}
          <figure className="service-banner__art">
            <img
              src={event.image_url || `/assets/img/temples/${(event.temple && event.temple.slug) || 'mahakaleshwar-ujjain'}.webp`}
              alt={event.title}
              fetchPriority="high"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `/assets/img/temples/${(event.temple && event.temple.slug) || 'mahakaleshwar-ujjain'}.jpg`;
              }}
            />
          </figure>

          <div className="mandir-hero__copy service-banner__copy relative z-10 max-w-2xl text-white">
            <span className="mandir-hero__eyebrow inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#EFD4A0] bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full mb-3 border border-[#D9A441]/40" translate="no">
              ✦ {isPuja ? (isHi ? 'वैदिक संकल्प पूजा · तीर्थ पुरोहितों द्वारा' : 'VEDIC SANKALP PUJA · BY CHIEF PRIESTS') : (isHi ? 'नित्य मंदिर चढ़ावा सेवा' : 'DAILY TEMPLE CHADHAVA')} ✦
            </span>
            <h1 className="sacred-hero-title font-serif text-2xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: '#FFFDF5' }} translate="no">
              {event.title}
            </h1>

            <div className="flex items-center gap-3 flex-wrap mb-4 text-xs text-amber-200">
              <span className="flex items-center gap-1 font-semibold" translate="no">
                <span>📍</span>
                <span>{event.temple && event.temple.name}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold" translate="no">
                <span>🗓️</span>
                <span>{dateTime(event.starts_at)}</span>
              </span>
            </div>

            <p className="sacred-hero-desc text-xs sm:text-sm text-slate-100 leading-relaxed max-w-2xl mb-6 font-normal" translate="no">
              {event.description}
            </p>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className={`px-3 py-1.5 rounded-full font-bold border ${open ? 'bg-emerald-900/60 text-emerald-200 border-emerald-400/40' : 'bg-rose-900/60 text-rose-200 border-rose-400/40'}`}>
                {open ? (isHi ? `⏳ बुकिंग बंद होने में: ${left}` : `⏳ Closes in: ${left}`) : (isHi ? 'बुकिंग समाप्त' : 'Booking closed')}
              </span>
              <span className="px-3 py-1.5 rounded-full font-medium bg-white/10 text-white border border-white/20">
                👥 {isHi ? `रिक्त स्थान: ${event.remaining} / ${event.capacity}` : `Spots left: ${event.remaining} / ${event.capacity}`}
              </span>
              {event.video_hours && (
                <span className="px-3 py-1.5 rounded-full font-medium bg-white/10 text-white border border-white/20 flex items-center gap-1">
                  <span>📹</span>
                  <span>{isHi ? `${event.video_hours} घंटे में WhatsApp वीडियो` : `WhatsApp video in ${event.video_hours}h`}</span>
                </span>
              )}
            </div>

            <div className="mt-6">
              <Link to={isPuja ? '/mandir-seva/puja' : '/mandir-seva/chadhava'} className="text-xs text-amber-300 hover:text-amber-200 font-bold no-underline inline-flex items-center gap-1">
                <span>←</span><span>{isHi ? `अन्य सभी ${isPuja ? 'पूजा' : 'चढ़ावा'} देखें` : `All other ${isPuja ? 'pujas' : 'offerings'}`}</span>
              </Link>
            </div>
          </div>
        </header>
      </section>

      {/* Main 2-Column Section */}
      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Benefits, Package Selection, Offerings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Benefits Card */}
          {benefits.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
              <h2 className="font-serif text-lg font-bold text-[#183C2B] mt-0 mb-3 flex items-center gap-2">
                <span>✨</span>
                <span>{isHi ? 'पूजा के मुख्य फल एवं लाभ' : 'Divine Benefits & Blessings'}</span>
              </h2>
              <ul className="m-0 pl-0 list-none space-y-2">
                {benefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Elevated Package Cards (Sri Mandir Style - Enhanced Contrast & Typography) */}
          {isPuja && tiers.length > 0 && (
            <fieldset className="border-0 p-0 m-0" translate="no">
              <div className="flex items-center justify-between mb-4">
                <legend className="font-serif text-lg sm:text-xl font-bold text-[#183C2B]">
                  {isHi ? 'पूजा पैकेज का चयन करें' : 'Select Puja Package'}
                </legend>
                <span className="text-xs font-medium text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                  {isHi ? 'नाम व गोत्र संकल्प सहित' : 'Includes Name & Gotra Sankalp'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tiers.map((o) => {
                  const isSelected = tier === o.id;
                  const isPopular = o.title.toLowerCase().includes('couple') || o.title.toLowerCase().includes('दंपति') || o.title.toLowerCase().includes('दम्पति');
                  return (
                    <label
                      key={o.id}
                      className={`relative p-5 sm:p-6 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-50/95 border-[#164B32] shadow-lg ring-2 ring-[#D9A441]'
                          : 'bg-white border-[#DDEBD5] hover:border-amber-400 hover:shadow-md'
                      }`}
                    >
                      {isPopular && (
                        <span className="absolute -top-3 right-4 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[#183C2B] shadow-sm">
                          ⭐ सर्वाधिक लोकप्रिय
                        </span>
                      )}

                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="tier"
                              checked={isSelected}
                              onChange={() => setTier(o.id)}
                              className="accent-[#164B32] w-5 h-5 cursor-pointer shrink-0"
                            />
                            <h3 className="font-serif text-base sm:text-lg font-bold text-[#183C2B] m-0" translate="no">
                              {o.title}
                            </h3>
                          </div>
                          <span className="text-lg sm:text-xl font-black text-[#8B1D2C] shrink-0">{money(o.price)}</span>
                        </div>

                        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed m-0 mt-1 ml-7" translate="no">
                          {o.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-slate-200 ml-7 space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                          <span className="text-emerald-700">✓</span>
                          <span>{o.max_members || 1} {isHi ? 'यजमान का नाम व गोत्र संकल्प' : 'Devotees Name & Gotra Sankalp'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="text-emerald-700">✓</span>
                          <span>{isHi ? 'WhatsApp पर रिकॉर्डेड वीडियो प्रमाण' : 'Recorded video proof on WhatsApp'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-700">
                          <span className="text-emerald-700">✓</span>
                          <span>{isHi ? 'घर पर पवित्र रक्षासूत्र आशीर्वाद' : 'Sacred Rakshasutra sent home'}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          {/* Optional Offerings Add-ons in Clean 2-Column Grid */}
          {others.length > 0 && (
            <section aria-label="Offerings" className="p-6 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm" translate="no">
              <div className="mb-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183C2B] m-0">
                  {isPuja ? (isHi ? 'अतिरिक्त चढ़ावा सामग्री (वैकल्पिक)' : 'Optional Sacred Add-ons') : (isHi ? 'चढ़ावा सामग्री चुनें' : 'Select Offerings')}
                </h2>
                <p className="text-xs text-slate-600 m-0 mt-0.5">
                  {isHi ? 'आपके नाम से गर्भगृह में विशेष पवित्र सामग्री अर्पित की जाएगी' : 'Sacred items will be dedicated in the inner sanctum in your name'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {others.map((o) => {
                  const q = qty[o.id] || 0;
                  return (
                    <article
                      key={o.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        q ? 'bg-amber-50/90 border-[#164B32] shadow-sm ring-1 ring-[#D9A441]' : 'bg-slate-50/70 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <h4 className="font-serif text-sm font-bold text-[#183C2B] m-0" translate="no">
                            {o.emoji ? `${o.emoji} ` : '🪔 '}
                            {o.title}
                          </h4>
                          <p className="text-xs text-slate-500 m-0 mt-0.5 line-clamp-1" translate="no">{o.description}</p>
                        </div>
                        <span className="text-sm font-extrabold text-[#8B1D2C] shrink-0">{money(o.price)}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                        <span className="text-[11px] text-slate-500">{q > 0 ? (isHi ? `चयनित: ${q}` : `Selected: ${q}`) : (isHi ? 'अर्पण जोड़ें' : 'Add to offering')}</span>
                        <div className="flex items-center gap-2" role="group" aria-label={`Quantity of ${o.title}`}>
                          <button
                            type="button"
                            aria-label="Fewer"
                            disabled={!q}
                            onClick={() => setQuantity(o.id, q - 1)}
                            className="w-8 h-8 rounded-full border border-slate-300 bg-white font-bold cursor-pointer disabled:opacity-40 flex items-center justify-center text-sm hover:bg-slate-100 transition-colors"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900" aria-live="polite">{q}</span>
                          <button
                            type="button"
                            aria-label="More"
                            onClick={() => setQuantity(o.id, q + 1)}
                            className="w-8 h-8 rounded-full border border-[#164B32] bg-[#164B32] text-white font-bold cursor-pointer flex items-center justify-center text-sm hover:bg-[#520C1F] transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {errors.items && <p role="alert" className="text-xs text-rose-700 font-bold">{errors.items}</p>}
        </div>

        {/* Right Column: Smart Sankalp Details Form - Sticky so zero dead space occurs */}
        <aside className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 space-y-4">
            <form translate="no" onSubmit={submit} noValidate className="p-6 sm:p-7 rounded-3xl bg-white border border-[#DDEBD5] shadow-xl space-y-4">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183C2B] m-0" translate="no">
                {isHi ? 'पवित्र संकल्प विवरण' : 'Sacred Sankalp Details'}
              </h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5" translate="no">
                {isHi ? 'यह विवरण मुख्य पुरोहित जी द्वारा गर्भगृह में उच्चारित किया जाएगा' : 'Chanted by the head priest at the inner sanctum'}
              </p>
            </div>

            {/* Live Wallet Balance Indicator Card */}
            {currentUser && (
              <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🪙</span>
                  <div>
                    <span className="text-[11px] text-slate-600 block">{isHi ? 'आपका एस्ट्रो वॉलेट' : 'Your Astro Wallet'}</span>
                    <b className="text-sm font-bold text-[#183C2B]">{money(wallet.balance || 0)}</b>
                  </div>
                </div>
                {quote && wallet.balance < ((quote.amount_paise || 0) / 100) ? (
                  <button
                    type="button"
                    onClick={() => window.App?.openWalletModal?.()}
                    className="px-3 py-1.5 rounded-xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs cursor-pointer border-0 shadow-xs"
                  >
                    {isHi ? '+ रिचार्ज करें' : '+ Add Funds'}
                  </button>
                ) : (
                  <span className="text-xs text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full font-bold">
                    {isHi ? '✓ वॉलेट से कटेगा' : '✓ Wallet payment'}
                  </span>
                )}
              </div>
            )}

            {!open && (
              <p role="status" className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3 m-0 font-medium">
                {isHi ? 'इस पूजा की बुकिंग समाप्त हो चुकी है।' : 'Bookings for this event have closed.'}
              </p>
            )}

            {/* Devotee Name */}
            <div>
              <label htmlFor="ev-name" className="block text-sm font-bold text-[#183C2B] mb-1.5">
                {isHi ? 'यजमान का पूरा नाम *' : 'Devotee Full Name *'}
              </label>
              <input
                id="ev-name"
                className={field}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isHi ? 'उदा. रमेश कुमार शर्मा' : 'e.g. Ramesh Kumar Sharma'}
                autoComplete="name"
                aria-invalid={!!errors.name}
              />
              {err('name')}
            </div>

            {/* WhatsApp Phone */}
            <div>
              <label htmlFor="ev-phone" className="block text-sm font-bold text-[#183C2B] mb-1.5">
                {isHi ? 'WhatsApp नंबर *' : 'WhatsApp Number *'}
              </label>
              <input
                id="ev-phone"
                type="tel"
                className={field}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
              />
              <p className="text-xs text-emerald-800 mt-1.5 font-medium flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50">
                <span>📱</span>
                <span>{isHi ? 'आपके संकल्प का वीडियो इसी WhatsApp नंबर पर भेजा जाएगा।' : 'Video proof of your sankalp will be sent to this WhatsApp number.'}</span>
              </p>
              {err('phone')}
            </div>

            {/* Gotra */}
            <div>
              <label htmlFor="ev-gotra" className="block text-sm font-bold text-[#183C2B] mb-1.5">
                {isHi ? 'गोत्र' : 'Gotra'}
              </label>
              <input
                id="ev-gotra"
                className={field}
                value={gotra}
                disabled={gotraUnknown}
                onChange={(e) => setGotra(e.target.value)}
                placeholder={isHi ? 'उदा. भारद्वाज / कश्यप / वशिष्ठ' : 'e.g. Bharadwaj / Kashyap / Vashistha'}
                aria-invalid={!!errors.gotra}
              />
              {err('gotra')}
              <label className="flex items-center gap-2 text-xs text-slate-700 mt-2 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={gotraUnknown}
                  onChange={(e) => setGotraUnknown(e.target.checked)}
                  className="accent-[#164B32] w-4 h-4 cursor-pointer"
                />
                <span>
                  {isHi ? 'गोत्र ज्ञात नहीं है (शास्त्रानुसार ' : 'Gotra unknown (by scriptures, '}
                  <b>{isHi ? 'कश्यप' : 'Kashyap'}</b>
                  {isHi ? ' गोत्र से संकल्प होगा)' : ' gotra will be invoked)'}
                </span>
              </label>
            </div>

            {/* Sankalp Purpose */}
            <div>
              <label htmlFor="ev-purpose" className="block text-sm font-bold text-[#183C2B] mb-1.5">
                {isHi ? 'संकल्प का उद्देश्य / मनोकामना' : 'Purpose of Sankalp'}
              </label>
              <select id="ev-purpose" className={field} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                {PURPOSES.map(([hi, en]) => (
                  <option key={hi} value={hi}>
                    {isHi ? hi : en}
                  </option>
                ))}
              </select>
            </div>

            {/* Family Members (if applicable) */}
            <div>
              <label htmlFor="ev-family" className="block text-sm font-bold text-[#183C2B] mb-1.5">
                {selectedTierObj && selectedTierObj.title.toLowerCase().includes('couple')
                  ? (isHi ? 'जीवनसाथी का नाम (वैकल्पिक)' : 'Spouse Name (Optional)')
                  : (isHi ? 'परिवार के अन्य सदस्य (वैकल्पिक)' : 'Other Family Members (Optional)')}
              </label>
              <textarea
                id="ev-family"
                rows={2}
                maxLength={500}
                className={field}
                value={family}
                onChange={(e) => setFamily(e.target.value)}
                placeholder={isHi ? 'प्रति पंक्ति एक नाम दर्ज करें' : 'Enter one name per line'}
              />
            </div>

            {/* Prasad Guarantee Card */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-300/60 text-xs">
              <div className="flex items-center gap-2 font-bold text-[#164B32] mb-1">
                <span>🎁</span>
                <span>{isHi ? 'घर पर पवित्र महाप्रसाद किट' : 'Sacred Mahaprasad Box Delivered Home'}</span>
              </div>
              <p className="text-[11px] text-slate-600 m-0 leading-relaxed">
                {isHi
                  ? '💧 पवित्र गंगाजल · 🕉️ सिद्ध भस्म · 🧵 रक्षासूत्र · 🍬 पंचमेवा प्रसाद (पूजा के पश्चात 4-7 दिनों में स्पीड पोस्ट द्वारा प्रेषित)।'
                  : '💧 Holy Gangajal · 🕉️ Energized Bhasma · 🧵 Sacred Rakshasutra · 🍬 Panchmewa Prasad (dispatched via speed post within 4-7 days).'}
              </p>
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5" aria-live="polite">
              {quote && quote.items.map((l) => (
                <div key={l.offering_id} className="flex justify-between gap-3 text-slate-700">
                  <span translate="no">{l.title} × {l.quantity}</span>
                  <span className="font-semibold">{rupees(l.total_paise)}</span>
                </div>
              ))}
              <div className="flex justify-between font-extrabold text-sm text-[#164B32] pt-2 border-t border-slate-200">
                <span>{isHi ? 'कुल दक्षिणा' : 'Total Dakshina'}</span>
                <span>{quote ? rupees(quote.amount_paise) : '—'}</span>
              </div>
              {quote && quote.policy && (
                <p className="text-[10px] text-slate-500 m-0 pt-1" translate="no">{quote.policy}</p>
              )}
            </div>

            {message && (
              <div role="alert" className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-3">
                <p className="m-0 font-medium">{message.text}</p>
                {message.needsFunds && (
                  <button
                    type="button"
                    onClick={() => window.App?.openWalletModal?.()}
                    className="mt-2 w-full py-2 rounded-xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs cursor-pointer border-0 shadow-sm"
                  >
                    {isHi ? '🪙 वॉलेट में राशि जोड़ें' : '🪙 Add Funds to Wallet'}
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy || !open}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D9A441] via-[#E5B558] to-[#B3832B] text-[#183C2B] font-extrabold text-sm sm:text-base uppercase tracking-wider cursor-pointer border-0 shadow-lg hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-default"
            >
              {busy
                ? (isHi ? 'संकल्प बुक हो रहा है…' : 'Booking sankalp…')
                : quote
                ? (isHi ? `वॉलेट से ${rupees(quote.amount_paise)} दक्षिणा दें` : `Pay ${rupees(quote.amount_paise)} from Wallet`)
                : (isHi ? 'वॉलेट से भुगतान करें' : 'Pay from Wallet')}
            </button>

            {!currentUser && (
              <p className="text-[11px] text-slate-500 text-center m-0">
                {isHi ? 'बुकिंग पूर्ण करने हेतु आपको साइन-इन करने को कहा जाएगा।' : 'You will be prompted to sign in to complete booking.'}
              </p>
            )}
          </form>

          {/* Quick Vedic Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#183C2B]">
              <span>🛡️</span>
              <span>{isHi ? '100% प्रामाणिक वैदिक संकल्प गारंटी' : '100% Authentic Vedic Sankalp'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <span className="flex items-center gap-1.5">📹 {isHi ? 'WhatsApp वीडियो' : 'WhatsApp Video'}</span>
              <span className="flex items-center gap-1.5">🕉️ {isHi ? 'गोत्र संकल्प' : 'Gotra Sankalp'}</span>
              <span className="flex items-center gap-1.5">📦 {isHi ? 'प्रसाद स्पीड पोस्ट' : 'Prasad Speed Post'}</span>
              <span className="flex items-center gap-1.5">🪙 {isHi ? 'वॉलेट सुरक्षा' : 'Wallet Security'}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>

      {/* Confirmation Dialog */}
      {done && (
        <SimpleDialog label={isHi ? 'संकल्प पुष्टि' : 'Booking confirmed'} onClose={() => setDone(null)}>
          <div className="text-center mb-4">
            <span className="text-4xl block mb-2" aria-hidden="true">🙏</span>
            <h3 className="font-serif text-xl font-bold text-[#183C2B] m-0">
              {isHi ? 'संकल्प सफलतापूर्वक दर्ज हुआ!' : 'Sankalp Booked Successfully!'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {isHi
                ? 'आपका संकल्प मंदिर के पुजारियों को प्रेषित कर दिया गया है।'
                : 'Your holy sankalp has been submitted to the chief priests at the temple.'}
            </p>
          </div>
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">{isHi ? 'बुकिंग संख्या:' : 'Booking Number:'}</span>
              <strong className="text-[#183C2B]" translate="no">{done.booking_number || '—'}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">{isHi ? 'पूजा:' : 'Puja:'}</span>
              <strong className="text-right" translate="no">{done.snapshot && done.snapshot.title}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-slate-600">{isHi ? 'वीडियो प्रमाण:' : 'Video Proof:'}</span>
              <strong className="text-emerald-800">
                {isHi ? `WhatsApp पर ${dateTime(done.video_due_at)} तक` : `WhatsApp video by ${dateTime(done.video_due_at)}`}
              </strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-amber-200 text-sm">
              <span className="font-bold text-slate-700">{isHi ? 'कुल भुगतान:' : 'Total Paid:'}</span>
              <strong className="text-[#164B32]">{rupees(done.amount_paise)}</strong>
            </div>
          </div>
          <Link
            to="/mandir-seva?tab=mine"
            onClick={() => setDone(null)}
            className="block text-center w-full py-3.5 rounded-2xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider mt-5 no-underline shadow-md"
          >
            {isHi ? 'मेरी बुकिंग्स एवं वीडियो देखें' : 'View My Bookings & Videos'}
          </Link>
        </SimpleDialog>
      )}
    </div>
  );
}
