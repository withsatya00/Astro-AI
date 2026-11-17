import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import SimpleDialog from '../../components/SimpleDialog/SimpleDialog.jsx';
import { API, ApiError, call, post, money, dateTime, dateOnly, timeLeft, useNow, useLang, useRequest, statusText } from './mandirApi.js';

// Mandir Seva: Online Vedic Pujas, Daily Temple Chadhava, Temples Directory and My Bookings.
// Benchmarked against Sri Mandir for authentic devotional clarity and trust.

const MAIN_TABS = [
  { id: 'puja', label_hi: '🔱 संकल्प पूजा', label_en: '🔱 Online Puja', path: '/mandir-seva/puja' },
  { id: 'chadhava', label_hi: '🪔 दैनिक चढ़ावा', label_en: '🪔 Daily Chadhava', path: '/mandir-seva/chadhava' },
  { id: 'temples', label_hi: '🛕 तीर्थ दर्शन', label_en: '🛕 Holy Temples', path: '/mandir-seva' },
  { id: 'mine', label_hi: '📜 मेरी सेवा', label_en: '📜 My Bookings', path: '/mandir-seva?tab=mine' },
];

const PUJA_FILTERS = [
  { id: 'all', label_hi: 'सभी पावन पूजा', label_en: 'All Sacred Pujas' },
  { id: 'shiva', label_hi: '🔱 देवाधिदेव महादेव', label_en: '🔱 Lord Shiva', keywords: ['shiva', 'mahakal', 'rudra', 'somnath', 'kashi', 'kedarnath'] },
  { id: 'hanuman', label_hi: '🪔 संकटमोचन श्री हनुमान', label_en: '🪔 Lord Hanuman', keywords: ['hanuman', 'sankat', 'balaji', 'karya siddhi'] },
  { id: 'shakti', label_hi: '🌺 भगवती माँ दुर्गा', label_en: '🌺 Maa Durga', keywords: ['durga', 'kamakhya', 'vaishno', 'shakti', 'kali'] },
  { id: 'shani', label_hi: '🪐 कर्मफलदाता शनिदेव', label_en: '🪐 Lord Shani', keywords: ['shani', 'tailabhishek', 'navgrah', 'dosh'] },
  { id: 'ram', label_hi: '🚩 मर्यादा पुरुषोत्तम श्री राम', label_en: '🚩 Lord Rama', keywords: ['ram', 'ramlala', 'ayodhya'] },
  { id: 'ganesh', label_hi: '🐘 विघ्नहर्ता श्री गणेश', label_en: '🐘 Lord Ganesha', keywords: ['ganesh', 'ganpati', 'siddhi'] },
];

const CHADHAVA_PRESETS = [
  {
    temple: 'श्री महाकालेश्वर ज्योतिर्लिंग, उज्जैन',
    temple_en: 'Shri Mahakaleshwar Jyotirlinga, Ujjain',
    slug: 'mahakaleshwar-ujjain',
    deity: 'भगवान शिव (महाकाल)',
    deity_en: 'Lord Shiva (Mahakal)',
    city: 'उज्जैन, मध्य प्रदेश',
    city_en: 'Ujjain, Madhya Pradesh',
    image: '/assets/img/temples/mahakaleshwar-ujjain.jpg',
    offering: 'भस्म अर्पण, बिल्वपत्र व अखंड दीप',
    offering_en: 'Bhasma Offering, Bilva Patra & Akhand Diya',
    tag: 'भस्म आरती विशेष',
    tag_en: 'Bhasma Aarti Special',
    price: 51,
  },
  {
    temple: 'श्री काशी विश्वनाथ धाम, वाराणसी',
    temple_en: 'Shri Kashi Vishwanath Dham, Varanasi',
    slug: 'kashi-vishwanath-varanasi',
    deity: 'भगवान शिव (विश्वेश्वर)',
    deity_en: 'Lord Shiva (Vishweshwar)',
    city: 'वाराणसी, उत्तर प्रदेश',
    city_en: 'Varanasi, Uttar Pradesh',
    image: '/assets/img/temples/kashi-vishwanath-varanasi.jpg',
    offering: 'गंगाजल व 108 बेलपत्र अर्पण',
    offering_en: 'Gangajal & 108 Bilva Patra Offering',
    tag: 'मोक्षदायिनी सेवा',
    tag_en: 'Moksha Dayini Seva',
    price: 101,
  },
  {
    temple: 'श्री शनि शिंगणापुर धाम, महाराष्ट्र',
    temple_en: 'Shri Shani Shingnapur Dham, Maharashtra',
    slug: 'shani-shingnapur',
    deity: 'भगवान शनि देव',
    deity_en: 'Lord Shani Dev',
    city: 'अहमदनगर, महाराष्ट्र',
    city_en: 'Ahmednagar, Maharashtra',
    image: '/assets/img/temples/shani-shingnapur.jpg',
    offering: 'सरसों का तेल व काले तिल अर्पण',
    offering_en: 'Mustard Oil & Black Sesame Offering',
    tag: 'साढ़ेसाती शांति',
    tag_en: 'Sade Sati Shanti',
    price: 51,
  },
  {
    temple: 'माँ कामाख्या शक्तिपीठ, गुवाहाटी',
    temple_en: 'Maa Kamakhya Shaktipeeth, Guwahati',
    slug: 'kamakhya-devi-assam',
    deity: 'भगवती कामाख्या',
    deity_en: 'Divine Mother Kamakhya',
    city: 'गुवाहाटी, असम',
    city_en: 'Guwahati, Assam',
    image: '/assets/img/temples/kamakhya-devi-assam.jpg',
    offering: 'लाल चुनरी, सिंदूर व नारियल अर्पण',
    offering_en: 'Red Chunri, Sindoor & Coconut Offering',
    tag: 'मनोकामना सिद्धि',
    tag_en: 'Wishes Fulfilled',
    price: 101,
  },
  {
    temple: 'श्री सिद्धिविनायक मंदिर, मुंबई',
    temple_en: 'Shri Siddhivinayak Temple, Mumbai',
    slug: 'siddhivinayak-mumbai',
    deity: 'भगवान श्री गणेश',
    deity_en: 'Lord Ganesha',
    city: 'मुंबई, महाराष्ट्र',
    city_en: 'Mumbai, Maharashtra',
    image: '/assets/img/temples/siddhivinayak-mumbai.jpg',
    offering: 'मोदक भोग, दूर्वा व सिंदूर अर्पण',
    offering_en: 'Modak Bhog, Durva & Sindoor Offering',
    tag: 'विघ्नहर्ता सेवा',
    tag_en: 'Obstacle Removal',
    price: 51,
  },
  {
    temple: 'श्री राम जन्मभूमि मंदिर, अयोध्या',
    temple_en: 'Shri Ram Janmabhoomi Temple, Ayodhya',
    slug: 'ram-janmabhoomi-ayodhya',
    deity: 'प्रभु श्रीरामलला',
    deity_en: 'Lord Shri Ram Lalla',
    city: 'अयोध्या, उत्तर प्रदेश',
    city_en: 'Ayodhya, Uttar Pradesh',
    image: '/assets/img/temples/ram-janmabhoomi-ayodhya.jpg',
    offering: 'केसरिया ध्वजा, तुलसी दल व दीपदान',
    offering_en: 'Saffron Flag, Tulsi Leaves & Deep Daan',
    tag: 'रामलला आशीर्वाद',
    tag_en: 'Ram Lalla Blessings',
    price: 51,
  },
  {
    temple: 'श्री सोमनाथ ज्योतिर्लिंग धाम, गुजरात',
    temple_en: 'Shri Somnath Jyotirlinga, Gujarat',
    slug: 'somnath-jyotirlinga-gujarat',
    deity: 'भगवान सोमनाथ महादेव',
    deity_en: 'Lord Somnath Mahadev',
    city: 'प्रभास पाटन, गुजरात',
    city_en: 'Prabhas Patan, Gujarat',
    image: '/assets/img/temples/somnath-jyotirlinga-gujarat.jpg',
    offering: 'पंचामृत अभिषेक व बेलपत्र अर्पण',
    offering_en: 'Panchamrit Abhishek & Bilva Patra',
    tag: 'प्रथम ज्योतिर्लिंग',
    tag_en: 'First Jyotirlinga',
    price: 101,
  },
  {
    temple: 'श्री केदारनाथ धाम, हिमालय',
    temple_en: 'Shri Kedarnath Dham, Himalayas',
    slug: 'kedarnath-dham-uttarakhand',
    deity: 'सदाशिव केदारनाथ',
    deity_en: 'Lord Sadashiva Kedarnath',
    city: 'रुद्रप्रयाग, उत्तराखंड',
    city_en: 'Rudraprayag, Uttarakhand',
    image: '/assets/img/temples/kedarnath-dham-uttarakhand.jpg',
    offering: 'रुद्राभिषेक व अखंड घी का दीप',
    offering_en: 'Rudrabhishek & Akhand Ghee Lamp',
    tag: 'मोक्ष द्वार सेवा',
    tag_en: 'Moksha Gateway Seva',
    price: 151,
  },
];

const tabFor = (section, params) => {
  if (params.get('tab') === 'mine') return 'mine';
  if (section === 'puja') return 'puja';
  if (section === 'chadhava') return 'chadhava';
  if (section === 'events') return 'puja';
  return 'temples';
};

function Notice({ children, action, onAction }) {
  return (
    <div role="status" className="max-w-xl mx-auto text-center text-sm text-slate-600 bg-white border border-[#DDEBD5] rounded-2xl p-6 shadow-xs">
      <p className="m-0 leading-relaxed">{children}</p>
      {action && (
        <button type="button" onClick={onAction} className="mt-4 px-6 py-2.5 rounded-full bg-[#164B32] text-[#FFFDF5] text-xs font-bold cursor-pointer border-0 shadow-sm hover:opacity-95 transition-all">
          {action}
        </button>
      )}
    </div>
  );
}

function PujaCard({ e, now, lang }) {
  const left = timeLeft(e.deadline, now, lang);
  const prices = (e.offerings || []).map((o) => o.price).filter((p) => p > 0);
  const tiers = (e.offerings || []).filter((o) => o.category === 'puja_tier');
  const tierPrices = tiers.map((o) => o.price).filter((p) => p > 0);
  const from = tierPrices.length ? Math.min(...tierPrices) : (prices.length ? Math.min(...prices) : 251);
  const closed = !e.bookable || !left;
  const benefits = (e.benefits || {})[lang] || (e.benefits || {}).hi || (e.benefits || {}).en || [];

  return (
    <article translate="no" className="rounded-3xl bg-white border border-[#DDEBD5] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      <div className="relative h-48 bg-slate-100 overflow-hidden">
        <img
          src={e.image_url || '/assets/img/temples/mahakaleshwar-ujjain.jpg'}
          alt={e.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(ev) => { ev.currentTarget.src = '/assets/img/temples/mahakaleshwar-ujjain.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#164B32]/90 text-amber-200 border border-amber-300/40 backdrop-blur-xs">
            {lang === 'hi' ? '🔱 संकल्प पूजा' : '🔱 Sankalp Puja'}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-100 border border-emerald-400/30 backdrop-blur-xs">
            {lang === 'hi' ? '📹 WhatsApp वीडियो' : '📹 WhatsApp Video'}
          </span>
        </div>
        <div className="absolute bottom-2.5 left-3 right-3 text-white">
          <p className="text-[11px] font-bold text-amber-300 m-0 truncate">📍 {e.temple && e.temple.name}</p>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        <h3 className="font-serif text-lg font-bold text-[#183C2B] m-0 line-clamp-1 group-hover:text-[#164B32] transition-colors" translate="no">
          {e.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>🗓️</span>
          <span className="font-medium">{dateTime(e.starts_at)}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 px-2.5 rounded-xl bg-amber-50/80 border border-amber-200/60">
          <span className="text-amber-900 font-semibold flex items-center gap-1">
            <span>⏳</span>
            <span>{closed ? (lang === 'hi' ? 'बुकिंग समाप्त' : 'Booking Closed') : (lang === 'hi' ? 'बुकिंग बंद होने में:' : 'Closes in:')}</span>
          </span>
          <span className="font-bold text-[#164B32]">{closed ? (lang === 'hi' ? 'समाप्त' : 'Closed') : left}</span>
        </div>

        {benefits.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {benefits.slice(0, 2).map((b, i) => (
              <span key={i} className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-full">
                ✨ {b}
              </span>
            ))}
          </div>
        )}

        <div className="pt-2 mt-auto border-t border-slate-100 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-500 block">{lang === 'hi' ? 'सुलभ दक्षिणा' : 'Starting from'}</span>
            <span className="text-base font-extrabold text-[#164B32]">{money(from)}</span>
          </div>
          <Link
            to={`/mandir-seva/event/${e.id}`}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D9A441] to-[#B3832B] text-[#183C2B] font-extrabold text-xs uppercase tracking-wider no-underline shadow-sm hover:shadow-md transition-all flex items-center gap-1"
          >
            <span>{closed ? (lang === 'hi' ? 'विवरण देखें' : 'View Details') : (lang === 'hi' ? 'संकल्प लें →' : 'Participate →')}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

function ChadhavaPresetCard({ item, lang = 'hi' }) {
  const isHi = lang === 'hi';
  const templeName = isHi ? item.temple : (item.temple_en || item.temple);
  const deityName = isHi ? item.deity : (item.deity_en || item.deity);
  const cityName = isHi ? item.city : (item.city_en || item.city);
  const offeringName = isHi ? item.offering : (item.offering_en || item.offering);
  const tagName = isHi ? item.tag : (item.tag_en || item.tag);

  return (
    <article translate="no" className="rounded-3xl bg-white border border-[#DDEBD5] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        <img
          src={item.image}
          alt={templeName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(ev) => { ev.currentTarget.src = '/assets/img/temples/mahakaleshwar-ujjain.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400 text-[#183C2B] shadow-sm">
          {tagName}
        </span>
        <div className="absolute bottom-2.5 left-3 right-3 text-white">
          <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider m-0">{deityName}</p>
          <h3 className="font-serif text-sm font-bold text-white m-0 truncate">{templeName}</h3>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <p className="text-xs text-slate-700 m-0 font-medium line-clamp-2">
          🪔 <b>{isHi ? 'पवित्र अर्पण:' : 'Holy Offering:'}</b> {offeringName}
        </p>
        <p className="text-[11px] text-slate-500 m-0">📍 {cityName}</p>

        <div className="flex items-center gap-2 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/50 mt-1">
          <span>📹</span>
          <span>{isHi ? 'WhatsApp पर रिकॉर्डेड वीडियो प्रमाण' : 'Recorded WhatsApp Video Proof'}</span>
        </div>

        <div className="pt-3 mt-auto border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 block">{isHi ? 'मात्र' : 'Only'}</span>
            <span className="text-base font-extrabold text-[#164B32]">₹{item.price}</span>
          </div>
          <Link
            to={`/mandir-seva/temple/${item.slug}`}
            className="px-4 py-2 rounded-full bg-[#164B32] text-[#FFFDF5] font-bold text-xs uppercase tracking-wider no-underline hover:bg-[#520C1F] transition-all"
          >
            {isHi ? 'चढ़ावा चढ़ाएं →' : 'Offer Chadhava →'}
          </Link>
        </div>
      </div>
    </article>
  );
}

function TempleCard({ t, lang = 'hi', from = 'puja' }) {
  const isHi = lang === 'hi';
  const templeUrl = `/mandir-seva/temple/${t.slug}?from=${from}`;
  return (
    <article translate="no" className="rounded-3xl bg-white border border-[#DDEBD5] shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      <Link to={templeUrl} state={{ from }} className="block relative h-44 bg-slate-100 overflow-hidden" tabIndex={-1} aria-hidden="true">
        <img
          src={t.image_url}
          alt={t.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.currentTarget.src = '/assets/img/temples/mahakaleshwar-ujjain.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <span className="absolute bottom-2.5 left-3 text-[10px] font-extrabold uppercase tracking-wider text-amber-200">
          📍 {[t.city, t.state].filter(Boolean).join(', ')}
        </span>
      </Link>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <span className="text-[11px] font-bold text-[#A77B25]" translate="no">✦ {t.deity}</span>
        <h3 className="font-serif text-base font-bold text-[#183C2B] m-0 line-clamp-1" translate="no">
          <Link to={templeUrl} state={{ from }} className="no-underline text-inherit hover:text-[#164B32]">
            {t.name}
          </Link>
        </h3>
        <p className="text-xs text-slate-500 m-0 line-clamp-2 leading-relaxed" translate="no">
          {t.description}
        </p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-500 block">{isHi ? 'सेवा दक्षिणा' : 'Starting from'}</span>
            <span className="text-sm font-bold text-[#164B32]">{money(t.starting_price)}</span>
          </div>
          <Link to={templeUrl} state={{ from }} className="shop-btn shop-btn--gold no-underline text-xs">
            {isHi ? 'तीर्थ सेवा →' : 'Explore Seva →'}
          </Link>
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
  if (state.loading) return <p role="status" className="text-center text-xs text-slate-500 py-12">लोड हो रहा है...</p>;
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
    <div className="max-w-4xl mx-auto space-y-4">
      {message && <p role="status" className="text-xs rounded-xl px-4 py-3" style={{ background: message.ok ? '#ecfdf5' : '#fef2f2', color: message.ok ? '#166534' : '#991b1b' }}>{message.text}</p>}
      {state.list.map((b) => (
        <article key={b.id} className="p-5 rounded-3xl bg-white border border-[#DDEBD5] shadow-sm">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 m-0" translate="no">{b.booking_number} · {dateOnly(b.created_at)}</p>
              <h3 className="font-serif text-base font-bold text-[#183C2B] my-1" translate="no">{b.offering_title}</h3>
              <p className="text-xs text-slate-600 m-0 font-medium" translate="no">📍 {b.temple_name}</p>
              <p className="text-xs text-slate-500 m-0 mt-1"><span>यजमान:</span> <b className="text-slate-700" translate="no">{b.devotee_name}{b.gotra ? ` · गोत्र: ${b.gotra}` : ''}</b></p>
              {b.scheduled_for && <p className="text-xs text-slate-500 m-0"><span>तिथि:</span> {dateOnly(b.scheduled_for)}</p>}
            </div>
            <div className="text-right">
              <span className="inline-block text-[11px] font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">{statusText(b.service_status || b.status)}</span>
              <p className="text-base font-extrabold text-[#164B32] m-0 mt-1.5">{money(b.amount_paid)}</p>
            </div>
          </div>
          <div className="flex gap-2.5 flex-wrap mt-4 pt-3 border-t border-slate-100">
            {b.video_proof_url && <a href={b.video_proof_url} target="_blank" rel="noopener noreferrer" className="shop-btn shop-btn--gold no-underline text-xs flex items-center gap-1"><span>▶</span><span>Watch video proof</span></a>}
            {b.certificate_available && <button type="button" disabled={busyId === b.id} onClick={() => certificate(b)} className="shop-btn shop-btn--ghost text-xs cursor-pointer">📜 Download certificate</button>}
            {b.status === 'PAID' && <button type="button" disabled={busyId === b.id} onClick={() => setConfirming(b)} className="shop-btn shop-btn--ghost text-xs cursor-pointer text-rose-700 hover:bg-rose-50">Cancel booking</button>}
          </div>
        </article>
      ))}
      {confirming && (
        <SimpleDialog label="Cancel booking" onClose={() => setConfirming(null)}>
          <h3 className="font-serif text-lg font-bold text-[#183C2B] mt-0 pr-10">Cancel this booking?</h3>
          <p className="text-xs text-slate-600">{confirming.offering_title} · {confirming.booking_number}. The amount paid will be returned to your wallet.</p>
          <div className="flex gap-2 mt-4">
            <button type="button" disabled={busyId === confirming.id} onClick={() => cancel(confirming)} className="flex-1 py-2.5 rounded-xl bg-[#164B32] text-[#FFFDF5] font-bold text-xs cursor-pointer border-0">Yes, cancel</button>
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
  const [query, setQuery] = useState('');
  const [activePujaFilter, setActivePujaFilter] = useState('all');

  useEffect(() => { window.scrollTo({ top: 0 }); }, [section, tab]);

  const temples = useRequest(`/temples?lang=${lang}`, [lang]);
  const events = useRequest(`/chadhava/events?lang=${lang}`, [lang]);

  const q = query.trim().toLowerCase();

  const shownTemples = useMemo(() => ((temples.data && temples.data.temples) || []).filter((t) =>
    !q || [t.name, t.deity, t.city, t.state].some((x) => String(x || '').toLowerCase().includes(q))), [temples.data, q]);

  const allEventsList = useMemo(() => (events.data && events.data.events) || [], [events.data]);

  const pujaEvents = useMemo(() => {
    return allEventsList.filter((e) => {
      if (e.kind !== 'puja') return false;
      if (q && ![e.title, e.temple && e.temple.name, e.temple && e.temple.city].some((x) => String(x || '').toLowerCase().includes(q))) {
        return false;
      }
      if (activePujaFilter === 'all') return true;
      const f = PUJA_FILTERS.find((x) => x.id === activePujaFilter);
      if (!f || !f.keywords) return true;
      const text = `${e.title} ${e.temple ? e.temple.name : ''} ${e.temple ? e.temple.deity : ''}`.toLowerCase();
      return f.keywords.some((k) => text.includes(k));
    });
  }, [allEventsList, q, activePujaFilter]);

  const chadhavaEvents = useMemo(() => {
    return allEventsList.filter((e) => {
      if (e.kind !== 'chadhava') return false;
      if (q && ![e.title, e.temple && e.temple.name, e.temple && e.temple.city].some((x) => String(x || '').toLowerCase().includes(q))) {
        return false;
      }
      return true;
    });
  }, [allEventsList, q]);

  const goTab = (tabObj) => {
    navigate(tabObj.path);
  };

  return (
    <div className="mandir-page w-full min-w-0 max-w-full overflow-x-hidden bg-[#FAF9F2] min-h-screen pb-20">
      {/* Sacred Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 pt-3 pb-1 text-xs text-slate-500 font-medium">
        <ol className="flex items-center gap-2 list-none p-0 m-0 flex-wrap">
          <li>
            <Link to="/" className="text-slate-500 hover:text-[#164B32] transition-colors no-underline">
              {lang === 'hi' ? 'होम' : 'Home'}
            </Link>
          </li>
          <li className="text-slate-400">›</li>
          <li>
            <Link to="/mandir-seva" className={`no-underline transition-colors ${tab ? 'text-slate-500 hover:text-[#164B32]' : 'text-[#164B32] font-bold'}`}>
              {lang === 'hi' ? 'मंदिर सेवा' : 'Mandir Seva'}
            </Link>
          </li>
          {tab === 'puja' && (
            <>
              <li className="text-slate-400">›</li>
              <li className="text-[#164B32] font-bold" aria-current="page">
                {lang === 'hi' ? 'संकल्प पूजा' : 'Online Puja'}
              </li>
            </>
          )}
          {tab === 'chadhava' && (
            <>
              <li className="text-slate-400">›</li>
              <li className="text-[#164B32] font-bold" aria-current="page">
                {lang === 'hi' ? 'दैनिक चढ़ावा' : 'Daily Chadhava'}
              </li>
            </>
          )}
          {tab === 'temples' && (
            <>
              <li className="text-slate-400">›</li>
              <li className="text-[#164B32] font-bold" aria-current="page">
                {lang === 'hi' ? 'तीर्थ दर्शन' : 'Holy Temples'}
              </li>
            </>
          )}
          {tab === 'mine' && (
            <>
              <li className="text-slate-400">›</li>
              <li className="text-[#164B32] font-bold" aria-current="page">
                {lang === 'hi' ? 'मेरी सेवा' : 'My Bookings'}
              </li>
            </>
          )}
        </ol>
      </nav>

      {/* Majestic Photographic Sacred Banner with 100% Contrast & High-Res Artwork */}
      <section className="max-w-7xl mx-auto px-4 pt-2 pb-2">
        <header
          className="service-banner service-banner--mandir max-w-7xl mx-auto sacred-hero-banner relative rounded-3xl overflow-hidden shadow-xl"
          translate="no"
          style={{
            backgroundColor: '#164B32',
            border: '1.5px solid #D9A441',
          }}
        >
          {/* Authentic Divine Altar & Temple Backdrop */}
          <figure className="service-banner__art">
            <img
              src={tab === 'puja' ? '/assets/img/puja-banner.webp' : '/assets/img/mandir-banner.webp'}
              alt="Mandir Seva Altar"
              fetchPriority="high"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/assets/img/mandir-banner.webp';
              }}
            />
          </figure>

          <div className="mandir-hero__copy service-banner__copy relative z-10 max-w-2xl text-white">
            {tab === 'puja' && (
              <>
                <span className="mandir-hero__eyebrow inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#EFD4A0] bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full mb-3 border border-[#D9A441]/40" translate="no">
                  {lang === 'hi' ? '✦ वैदिक संकल्प पूजा · तीर्थ पुरोहितों द्वारा ✦' : '✦ VEDIC SANKALP PUJA · BY CHIEF PRIESTS ✦'}
                </span>
                <h1 className="sacred-hero-title font-serif text-2xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: '#FFFDF5' }} translate="no">
                  {lang === 'hi' ? 'वैदिक संकल्प पूजा — घर बैठे पाएं ' : 'Vedic Sankalp Puja — Divine Blessings from '}
                  <span className="text-[#D9A441]">{lang === 'hi' ? 'तीर्थस्थलों का दिव्य आशीर्वाद' : 'Sacred Pilgrimages'}</span>
                </h1>
                <p className="sacred-hero-desc text-xs sm:text-sm text-slate-100 leading-relaxed mb-6 max-w-xl" translate="no">
                  {lang === 'hi'
                    ? 'अपने नाम व गोत्र से देश के सुप्रसिद्ध ज्योतिर्लिंगों और शक्तिपीठों में संपूर्ण शास्त्रीय विधि-विधान से संकल्प पूजा करवाएं। पूजा का वीडियो प्रमाण एवं पावन महाप्रसाद आपके द्वार।'
                    : 'Perform scriptural pujas in your name and gotra across renowned Jyotirlingas and Shaktipeeths. Receive recorded video proof on WhatsApp and holy prasad at your doorstep.'}
                </p>
              </>
            )}

            {tab === 'chadhava' && (
              <>
                <span className="mandir-hero__eyebrow inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#EFD4A0] bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full mb-3 border border-[#D9A441]/40" translate="no">
                  {lang === 'hi' ? '✦ नित्य मंदिर चढ़ावा सेवा ✦' : '✦ DAILY TEMPLE CHADHAVA SERVICE ✦'}
                </span>
                <h1 className="sacred-hero-title font-serif text-2xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: '#FFFDF5' }} translate="no">
                  {lang === 'hi' ? 'दैनिक मंदिर चढ़ावा — आपके नाम से ' : 'Daily Temple Offerings — In Your Name at the '}
                  <span className="text-[#D9A441]">{lang === 'hi' ? 'गर्भगृह में पवित्र अर्पण' : 'Sacred Sanctum'}</span>
                </h1>
                <p className="sacred-hero-desc text-xs sm:text-sm text-slate-100 leading-relaxed mb-6 max-w-xl" translate="no">
                  {lang === 'hi'
                    ? 'श्री महाकालेश्वर, काशी विश्वनाथ, श्री शनि शिंगणापुर और माँ कामाख्या जैसे पावन धामों में आज ही दीप, फूल, भस्म व तेल अर्पित करें। 100% प्रामाणिक वीडियो दर्शन पाएं।'
                    : 'Offer sacred lamps, bilva leaves, bhasma, milk and oil at Mahakaleshwar, Kashi Vishwanath, Shani Shingnapur & Kamakhya. Receive authentic video proof.'}
                </p>
              </>
            )}

            {(tab === 'temples' || tab === 'mine') && (
              <>
                <span className="mandir-hero__eyebrow inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#EFD4A0] bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full mb-3 border border-[#D9A441]/40" translate="no">
                  {lang === 'hi' ? '✦ भारत के पावन तीर्थ एवं देवस्थान ✦' : '✦ HOLY TEMPLES & PILGRIMAGES OF INDIA ✦'}
                </span>
                <h1 className="sacred-hero-title font-serif text-2xl sm:text-4xl font-bold leading-tight mb-3" style={{ color: '#FFFDF5' }} translate="no">
                  {lang === 'hi' ? 'द्वादश ज्योतिर्लिंग एवं ' : '12 Sacred Jyotirlingas & '}
                  <span className="text-[#D9A441]">{lang === 'hi' ? 'प्राचीन शक्तिपीठ दर्शन' : 'Ancient Shaktipeeths'}</span>
                </h1>
                <p className="sacred-hero-desc text-xs sm:text-sm text-slate-100 leading-relaxed mb-6 max-w-xl" translate="no">
                  {lang === 'hi'
                    ? 'भारत के प्राचीनतम तीर्थस्थलों के इतिहास, आरती समय और विशेष अनुष्ठान सेवा का विवरण देखें और अपनी मनोकामना पूर्ति हेतु सुलभ सेवा संकल्प लें।'
                    : 'Explore the mythology, daily aarti schedules, and sacred offerings of India’s most revered pilgrimage shrines. Book authentic sevas with full transparency.'}
                </p>
              </>
            )}

            {/* 4 Trust Seals in Solid High Contrast */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/20 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-lg">📹</span>
                <div>
                  <b className="text-white block text-[11px]">{lang === 'hi' ? 'प्रमाण वीडियो' : 'Video Proof'}</b>
                  <small className="text-slate-200 text-[10px]">{lang === 'hi' ? 'नाम-गोत्र संकल्प सहित' : 'With Name & Gotra'}</small>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🛕</span>
                <div>
                  <b className="text-white block text-[11px]">{lang === 'hi' ? 'तीर्थ पुरोहित' : 'Vedic Priests'}</b>
                  <small className="text-slate-200 text-[10px]">{lang === 'hi' ? 'शास्त्रसम्मत विधि-विधान' : 'Scriptural Vidhi'}</small>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">📦</span>
                <div>
                  <b className="text-white block text-[11px]">{lang === 'hi' ? 'घर पर प्रसाद' : 'Prasad Delivery'}</b>
                  <small className="text-slate-200 text-[10px]">{lang === 'hi' ? 'गंगाजल व रक्षासूत्र' : 'Consecrated Kit'}</small>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🪙</span>
                <div>
                  <b className="text-white block text-[11px]">{lang === 'hi' ? 'वॉलेट सुरक्षा' : 'Wallet Security'}</b>
                  <small className="text-slate-200 text-[10px]">{lang === 'hi' ? 'संतुष्टि या 100% रिफंड' : '100% Guarantee'}</small>
                </div>
              </div>
            </div>
          </div>
        </header>
      </section>

      {/* Main 4 Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 my-6" id="mandir-tabs-section">
        <div className="flex items-center justify-center sm:justify-start gap-2 overflow-x-auto pb-2 scrollbar-none" role="tablist">
          {MAIN_TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => goTab(t)}
                className={`px-5 py-2.5 text-xs font-bold rounded-2xl whitespace-nowrap transition-all duration-200 cursor-pointer border ${
                  active
                    ? 'bg-[#164B32] text-[#FFFDF5] border-[#164B32] shadow-md'
                    : 'bg-white text-slate-700 border-[#DDEBD5] hover:border-[#D9A441]'
                }`}
              >
                {lang === 'hi' ? t.label_hi : t.label_en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section Content */}
      <main className="max-w-7xl mx-auto px-4">
        {/* TAB 1: PUJA PORTAL */}
        {tab === 'puja' && (
          <div>
            {/* Puja Category Filter Chips */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {PUJA_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActivePujaFilter(f.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                      activePujaFilter === f.id
                        ? 'bg-[#164B32] text-[#FFFDF5] border-[#164B32]'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {lang === 'hi' ? f.label_hi : f.label_en}
                  </button>
                ))}
              </div>
              <div className="w-full sm:w-72">
                <input
                  type="search"
                  className="w-full px-4 py-2 text-xs rounded-full border border-slate-200 bg-white outline-none focus:border-[#D9A441]"
                  placeholder="पूजा, मंदिर या फल खोजें..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Puja Events Grid */}
            {events.loading && !events.data ? (
              <p role="status" className="text-center text-xs text-slate-500 py-16">लोड हो रहा है...</p>
            ) : events.error && !events.data ? (
              <Notice action="पुनः प्रयास करें" onAction={events.retry}>{events.error.message}</Notice>
            ) : pujaEvents.length === 0 ? (
              <Notice action="सभी मंदिर देखें" onAction={() => navigate('/mandir-seva')}>
                फिलहाल इस श्रेणी में कोई आगामी पूजा उपलब्ध नहीं है। आप किसी भी पवित्र मंदिर में सीधे संकल्प सेवा ले सकते हैं।
              </Notice>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pujaEvents.map((e) => (
                  <PujaCard key={e.id} e={e} now={now} lang={lang} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHADHAVA PORTAL */}
        {tab === 'chadhava' && (
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183C2B] m-0">
                  {lang === 'hi' ? 'दैनिक मंदिर चढ़ावा' : 'Daily Temple Offerings'}
                </h2>
                <p className="text-xs text-slate-600 m-0 mt-0.5">
                  {lang === 'hi'
                    ? 'अपने नाम और गोत्र से पवित्र गर्भगृह में दीप, तेल, फूल व भोग अर्पित करवाएं'
                    : 'Offer sacred lamps, holy oil, flowers & bhog at the sanctum in your name and gotra'}
                </p>
              </div>
              <div className="w-full sm:w-72">
                <input
                  type="search"
                  className="w-full px-4 py-2 text-xs rounded-full border border-slate-200 bg-white outline-none focus:border-[#D9A441]"
                  placeholder={lang === 'hi' ? 'मंदिर या देवता खोजें...' : 'Search temple or deity...'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Top 8 Holy Shrine Continuous Chadhava Presets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {CHADHAVA_PRESETS.filter((p) => {
                if (!q) return true;
                const searchScope = `${p.temple} ${p.temple_en || ''} ${p.deity} ${p.deity_en || ''} ${p.city} ${p.city_en || ''} ${p.offering} ${p.offering_en || ''}`.toLowerCase();
                return searchScope.includes(q);
              }).map((item) => (
                <ChadhavaPresetCard key={item.slug} item={item} lang={lang} />
              ))}
            </div>

            {/* Any scheduled chadhava events from backend */}
            {chadhavaEvents.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-base font-bold text-[#183C2B] mb-4">
                  {lang === 'hi' ? 'आगामी विशेष चढ़ावा अनुष्ठान' : 'Upcoming Sacred Chadhava Events'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {chadhavaEvents.map((e) => (
                    <PujaCard key={e.id} e={e} now={now} lang={lang} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEMPLES DIRECTORY */}
        {tab === 'temples' && (
          <div>
            <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
              <div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#183C2B] m-0">
                  {lang === 'hi' ? 'पवित्र तीर्थ धाम' : 'Sacred Pilgrimage Temples'}
                </h2>
                <p className="text-xs text-slate-600 m-0 mt-0.5">
                  {lang === 'hi'
                    ? 'देशभर के प्रसिद्ध ज्योतिर्लिंग, शक्तिपीठ और ऐतिहासिक देवालय'
                    : 'Renowned Jyotirlingas, Shaktipeeths and sacred sanctums across India'}
                </p>
              </div>
              <div className="w-full sm:w-72">
                <input
                  type="search"
                  className="w-full px-4 py-2 text-xs rounded-full border border-slate-200 bg-white outline-none focus:border-[#D9A441]"
                  placeholder={lang === 'hi' ? 'मंदिर, देवता या शहर खोजें...' : 'Search temple, deity or city...'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            {temples.loading && !temples.data ? (
              <p role="status" className="text-center text-xs text-slate-500 py-16">{lang === 'hi' ? 'लोड हो रहा है...' : 'Loading temples...'}</p>
            ) : temples.error && !temples.data ? (
              <Notice action={lang === 'hi' ? 'पुनः प्रयास करें' : 'Try Again'} onAction={temples.retry}>{temples.error.message}</Notice>
            ) : shownTemples.length === 0 ? (
              <Notice>{lang === 'hi' ? 'आपकी खोज से मेल खाता कोई मंदिर नहीं मिला।' : 'No temples matched your search.'}</Notice>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shownTemples.map((t) => (
                  <TempleCard key={t.id} t={t} lang={lang} from={tab === 'chadhava' ? 'chadhava' : 'puja'} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY BOOKINGS */}
        {tab === 'mine' && <MyBookings lang={lang} />}
      </main>
    </div>
  );
}
