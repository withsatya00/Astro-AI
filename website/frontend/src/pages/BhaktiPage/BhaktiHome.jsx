import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';
import { WEEKDAY, BADGES, useRitual, todayKey } from './dailyRitual.js';
import { Skel } from './Skeleton.jsx';
import { useLang, pick } from './lang.js';

const DEITIES = [
  ['ram', 'Shri Ram', 'श्री राम', 'रा', 'linear-gradient(135deg,#9a4a1c,#3E0B18)', '/assets/img/seva-gallery/ram-verified-1.webp'],
  ['shiva', 'Lord Shiva', 'भगवान शिव', 'शि', 'linear-gradient(135deg,#2f4a6b,#1b2a40)', '/assets/img/seva-gallery/ritual-shiva-1.webp'],
  ['hanuman', 'Hanuman Ji', 'हनुमान जी', 'ह', 'linear-gradient(135deg,#c8721c,#5a2410)', '/assets/img/seva-gallery/ritual-hanuman-1.webp'],
  ['ganesh', 'Lord Ganesha', 'श्री गणेश', 'ग', 'linear-gradient(135deg,#d19a2c,#7a3a12)', '/assets/img/seva-gallery/ritual-ganesh-1.webp'],
  ['durga', 'Maa Durga', 'माँ दुर्गा', 'दु', 'linear-gradient(135deg,#b3262e,#4a0f1e)', '/assets/bhakti/deities/durga.webp'],
  ['krishna', 'Shri Krishna', 'श्री कृष्ण', 'कृ', 'linear-gradient(135deg,#3b5f8f,#3E0B18)', '/assets/bhakti/deities/krishna.webp'],
];

const FEATURED = 4;
const SECTIONS = [
  { id: 'naam-jaap', title: 'Naam Jaap', title_hi: 'नाम जाप', desc: 'Digital mala, voice counter & jaap record', desc_hi: 'डिजिटल माला, ध्वनि गणक एवं जाप संचयन', image: '/assets/bhakti/sections/naam-jaap.webp', to: '/bhakti/naam-jaap', built: true },
  { id: 'aarti-chalisa', title: 'Aarti & Chalisa', title_hi: 'आरती व चालीसा', desc: 'Deity-wise aarti, chalisa and stotra', desc_hi: 'देवी-देवताओं की पावन आरती, चालीसा व स्तोत्र', image: '/assets/bhakti/sections/aarti-chalisa.webp', to: '/bhakti/aarti-chalisa', built: true },
  { id: 'bhagavad-gita', title: 'Bhagavad Gita', title_hi: 'श्रीमद्भगवद्गीता', desc: '18 chapters, 700 shlokas with meaning', desc_hi: '18 अध्याय, 700 श्लोक प्रामाणिक भावार्थ सहित', image: '/assets/bhakti/sections/bhagavad-gita.webp', to: '/bhakti/bhagavad-gita', built: true },
  { id: 'bhajan-radio', title: 'Bhajan Radio', title_hi: 'भजन रेडियो', desc: 'Bhajan, kirtan, aarti & dhyan music', desc_hi: 'भक्ति संगीत, कीर्तन, आरती एवं ध्यान नाद', image: '/assets/bhakti/sections/bhajan-radio.webp', to: '/bhakti/bhajan-radio', built: true },
  { id: 'shankaracharya', title: 'Shankaracharya & Vedanta', title_hi: 'शंकराचार्य व वेदांत', desc: 'Adi Shankaracharya, Advaita & Upadesh', desc_hi: 'आदि शंकराचार्य, अद्वैत दर्शन व पावन उपदेश', image: '/assets/img/seva-gallery/badrinath-dham-uttarakhand-2.webp', to: '/bhakti/shankaracharya', built: true },
  { id: 'mandir-darshan', title: 'Mandir Darshan', title_hi: 'मंदिर दर्शन', desc: 'Famous temples, history & significance', desc_hi: 'सुप्रसिद्ध तीर्थ, पौराणिक इतिहास व दर्शन', image: '/assets/img/temples/kashi-vishwanath-varanasi.webp', to: '/bhakti/mandir-darshan', built: true },
  { id: 'puja-vidhi', title: 'Puja Vidhi', title_hi: 'पूजा विधि', desc: 'Step-by-step puja guides & samagri', desc_hi: 'शास्त्रोक्त पूजन विधि व आवश्यक सामग्री सूची', image: '/assets/img/puja-banner.webp', to: '/bhakti/puja-vidhi', built: true },
  { id: 'my-bhakti', title: 'My Bhakti', title_hi: 'मेरी भक्ति', desc: 'Your private jaap progress & streak', desc_hi: 'व्यक्तिगत जाप प्रगति, माला व निरंतरता', image: '/assets/bhakti/sections/naam-jaap.webp', to: '/bhakti/my-bhakti', built: true },
  { id: 'festivals', title: 'Festivals & Vrat', title_hi: 'त्योहार व व्रत', desc: 'Ekadashi, Purnima and festival dates for your city', desc_hi: 'एकादशी, पूर्णिमा, प्रदोष व पर्व तिथियां', image: '/assets/img/panchang-banner.webp', to: '/bhakti/festivals', built: true },
  { id: 'guide', title: 'AI Spiritual Guide', title_hi: 'आध्यात्मिक मार्गदर्शक', desc: 'Ask about the Gita, mantras, Vedanta & puja', desc_hi: 'गीता, मंत्र, वेदांत व पूजा संबंधी मार्गदर्शन', image: '/assets/img/vedic-sage-hero.webp', to: '/bhakti/guide', built: true },
  { id: 'sadhana', title: 'My Sadhana', title_hi: 'मेरी साधना', desc: 'Daily routine, sankalp, journal & meditation', desc_hi: 'दैनिक नियम, संकल्प, दैनिकी व ध्यान', image: '/assets/img/seva-gallery/ritual-surya-1.webp', to: '/bhakti/sadhana', built: true },
];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

function Art({ src, alt = '', glyph, eager }) {
  const [ok, setOk] = useState(true);
  if (!ok) return glyph ? <span className="bh-art-fallback" aria-hidden="true">{glyph}</span> : null;
  return <img src={src} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setOk(false)} />;
}

const Mandala = () => (
  <svg className="bh-mandala" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth=".6" aria-hidden="true">
    {[92, 78, 62, 46, 30].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
    {Array.from({ length: 24 }, (_, i) => <ellipse key={i} cx="100" cy="30" rx="6" ry="18" transform={`rotate(${i * 15} 100 100)`} />)}
    {Array.from({ length: 12 }, (_, i) => <ellipse key={`b${i}`} cx="100" cy="62" rx="4" ry="12" transform={`rotate(${i * 30} 100 100)`} />)}
  </svg>
);

function Ring({ done, total }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <svg className="bh-ring" viewBox="0 0 64 64" role="img" aria-label={`${done} of ${total} steps done`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="#f1e3c4" strokeWidth="7" />
      <circle cx="32" cy="32" r={r} fill="none" stroke="#B3832B" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - done / total)} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="#3E0B18">{done}/{total}</text>
    </svg>
  );
}

function DailyRitual({ shlok, today, malaDone, wd, idSuffix = '' }) {
  const lang = useLang();
  const isHi = lang === 'hi';
  const { done, toggle } = useRitual();

  const steps = [
    [
      'mantra',
      isHi ? 'मंत्र साधना' : 'Mantra Meditation',
      isHi ? (today ? today.text_hi : 'आज का पावन मंत्र') : (today ? today.text_roman : "Today's Sacred Mantra"),
      '/bhakti/naam-jaap',
      !!done.mantra,
    ],
    [
      'aarti',
      isHi ? `${wd.name_hi || wd.name} की आरती` : `${wd.name} Aarti`,
      isHi ? 'पावन आरती व स्तोत्र पाठ' : 'Read sanctified aarti or stotra',
      `/bhakti/aarti-chalisa?deity=${wd.slug}`,
      !!done.aarti,
    ],
    [
      'gita',
      isHi ? 'गीता श्लोक' : 'Gita Shlok',
      shlok ? (isHi ? `अध्याय ${shlok.chapter}.${shlok.verse}` : `Chapter ${shlok.chapter}.${shlok.verse}`) : (isHi ? 'आज का श्लोक' : "Today's Shlok"),
      shlok ? `/bhakti/bhagavad-gita/${shlok.chapter}#v${shlok.verse}` : '/bhakti/bhagavad-gita',
      !!done.gita,
    ],
    [
      'jaap',
      isHi ? '1 माला (108) जाप' : '1 Mala (108 Beads)',
      malaDone ? (isHi ? 'माला पूर्ण हो गई ✓' : 'Mala Completed ✓') : (isHi ? 'नाम जाप शुरू करें' : 'Begin Naam Jaap'),
      '/bhakti/naam-jaap',
      !!done.jaap || malaDone,
    ],
  ];

  const count = steps.filter((x) => x[4]).length;

  return (
    <section className="bh-panel bh-ritual" aria-labelledby={`bh-ritual-h${idSuffix}`}>
      <div className="bh-ritual-head">
        <Ring done={count} total={steps.length} />
        <div>
          <h3 id={`bh-ritual-h${idSuffix}`} translate="no">
            {isHi ? 'आज का नित्य कर्म' : "Today's Sacred Routine"}
          </h3>
          <p className="bh-small" style={{ margin: 0 }} translate="no">
            {count === steps.length
              ? (isHi ? 'आज का नित्य कर्म पूर्ण हुआ। 🙏 जय श्री राम' : "Today's sacred routine completed. 🙏 Jai Shri Ram")
              : (isHi ? 'चार छोटे कदम, एक शांत और सात्विक दिन के लिए।' : 'Four mindful steps for spiritual peace and divine connection.')}
          </p>
        </div>
      </div>
      <ol className="bh-ritual-steps">
        {steps.map(([id, t, sub, to, ok]) => (
          <li key={id} data-done={ok ? '' : undefined}>
            <button
              type="button"
              className="bh-tick"
              aria-pressed={ok}
              aria-label={`${t}: ${ok ? 'done' : 'not done'}`}
              onClick={() => toggle(id)}
            >
              {ok ? '✓' : ''}
            </button>
            <Link to={to} className="bh-ritual-link" translate="no">
              <b>{t}</b>
              <span>{sub}</span>
            </Link>
          </li>
        ))}
      </ol>

      {/* Personalized Kundli-to-Bhakti Bridge */}
      <div style={{
        marginTop: 12, padding: '10px 12px', borderRadius: 10,
        background: '#FAF5EA', border: '1px solid #D5AA51',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🪐</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#3E0B18' }}>
            {isHi ? 'कुंडली अनुसार आज की साधना' : 'Kundli Sadhana Sync'}
          </span>
        </div>
        <Link
          to="/profile"
          style={{
            fontSize: 11.5, fontWeight: 700, color: '#650F23', textDecoration: 'none',
            padding: '3px 8px', borderRadius: 6, background: '#FFFDF9', border: '1px solid #D4AF37'
          }}
        >
          {isHi ? 'व्यक्तिगत मंत्र देखें →' : 'View Mantra →'}
        </Link>
      </div>

      {/* Proactive WhatsApp Vedic Companion Badge */}
      <div style={{
        marginTop: 8, padding: '10px 12px', borderRadius: 10,
        background: '#0B2019', border: '1px solid #25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🟢</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#DCF8C6' }}>
            {isHi ? 'दैनिक वैदिक साथी (WhatsApp)' : 'Daily Vedic WhatsApp Companion'}
          </span>
        </div>
        <Link
          to="/profile"
          style={{
            fontSize: 11.5, fontWeight: 700, color: '#075E54', textDecoration: 'none',
            padding: '3px 8px', borderRadius: 6, background: '#DCF8C6', border: '1px solid #25D366'
          }}
        >
          {isHi ? 'चालू करें →' : 'Subscribe →'}
        </Link>
      </div>
    </section>
  );
}

function PanchangStrip() {
  const lang = useLang();
  const isHi = lang === 'hi';
  const [day, setDay] = useState(null);
  const [next, setNext] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const now = new Date();
    const key = todayKey(now);
    api(`/calendar/month?year=${now.getFullYear()}&month=${now.getMonth() + 1}&location=delhi`)
      .then((d) => setDay(d.days.find((x) => x.date === key) || null))
      .catch(() => setFailed(true));
    api('/calendar/upcoming?days=30&location=delhi')
      .then((d) => setNext(d.items.filter((i) => i.date > key).slice(0, 2)))
      .catch(() => {});
  }, []);

  if (failed) return null;

  return (
    <section className="bh-panel bh-panchang" aria-labelledby="bh-pan-h">
      <div className="bh-sec-title" style={{ margin: '0 0 8px' }}>
        <h3 id="bh-pan-h" style={{ margin: 0 }} translate="no">
          {isHi ? 'आज का पंचांग' : "Today's Vedic Panchang"}
        </h3>
        <Link to="/bhakti/festivals" className="bh-small" style={{ fontWeight: 700, color: '#650F23' }} translate="no">
          {isHi ? 'पंचांग कैलेंडर →' : 'Calendar →'}
        </Link>
      </div>
      {!day ? (
        <div style={{ display: 'grid', gap: 8 }} role="status" aria-label="Loading panchang">
          <Skel h={18} w="70%" />
          <Skel h={14} w="90%" />
        </div>
      ) : (
        <>
          <p className="bh-pan-main" translate="no">
            <b>
              {isHi
                ? `${({ Shukla: 'शुक्ल', Krishna: 'कृष्ण' }[day.tithi.paksha] || day.tithi.paksha)} ${day.tithi.name_hi || day.tithi.name_en}`
                : `${day.tithi.paksha} ${day.tithi.name_en || day.tithi.name_hi}`}
            </b>
          </p>
          <p className="bh-small" style={{ margin: '2px 0 0' }} translate="no">
            {isHi
              ? `${day.lunar_month_hi || day.lunar_month} · सूर्योदय ${day.sunrise} · सूर्यास्त ${day.sunset} · नई दिल्ली`
              : `${day.lunar_month} · Sunrise ${day.sunrise} · Sunset ${day.sunset} · New Delhi`}
          </p>
          {(day.festivals.length > 0 || day.observances.length > 0) && (
            <p className="bh-pan-fest" translate="no">
              🪔 {[...day.festivals.map((f) => (isHi ? f.name_hi : f.name_en)), ...day.observances.map((o) => (isHi ? o.name_hi : o.name_en))].filter(Boolean).join(' · ')}
            </p>
          )}
          {next.length > 0 && (
            <ul className="bh-pan-next" translate="no">
              {next.map((i, k) => (
                <li key={k}>
                  <span>{isHi ? (i.name_hi || i.name) : (i.name_en || i.name)}</span>
                  <b>
                    {new Date(`${i.date}T12:00:00`).toLocaleDateString(isHi ? 'hi-IN' : 'en-IN', { weekday: 'short' })}, {i.date.slice(8)}/{i.date.slice(5, 7)}
                  </b>
                </li>
              ))}
            </ul>
          )}
          <p className="bh-small" style={{ margin: '8px 0 0' }} translate="no">
            {isHi
              ? 'स्थान-आधारित प्रामाणिक गणना; विशिष्ट मुहूर्त हेतु स्थानीय पंचांग देखें।'
              : 'Accurate ephemeris calculation; verify specific muhurat with local scholars.'}
          </p>
        </>
      )}
    </section>
  );
}

function Unavailable({ what, onRetry, isHi }) {
  return (
    <div role="status">
      <p className="bh-small" style={{ margin: '0 0 8px' }}>
        {isHi ? `${what} अभी लोड नहीं हो पाया।` : `${what} could not be loaded.`}
      </p>
      <button type="button" className="bh-btn bh-btn-ghost" style={{ minHeight: 36 }} onClick={onRetry}>
        {isHi ? 'पुनः प्रयास करें' : 'Try Again'}
      </button>
    </div>
  );
}

function Badges({ stats, isHi }) {
  const earned = BADGES.filter((b) => b.test(stats));
  const next = BADGES.find((b) => !b.test(stats));
  const share = async () => {
    const text = isHi
      ? `आज मैंने ${fmt(stats.today)} नाम जाप किया${stats.streak > 0 ? `, ${stats.streak} दिन की निरंतरता 🔥` : ''}। आप भी जुड़ें 🙏`
      : `Today I completed ${fmt(stats.today)} naam jaap chants${stats.streak > 0 ? `, ${stats.streak} day streak 🔥` : ''}. Connect with divine devotion 🙏`;
    const url = `${window.location.origin}/bhakti`;
    try {
      if (navigator.share) await navigator.share({ title: isHi ? 'मेरी भक्ति' : 'My Bhakti', text, url });
      else await navigator.clipboard.writeText(`${text} ${url}`);
    } catch { /* cancelled */ }
  };

  return (
    <div className="bh-badges">
      {earned.length > 0 && (
        <ul aria-label="Milestones earned">
          {earned.map((b) => (
            <li key={b.id} title={b.label}>
              <span aria-hidden="true">{b.ic}</span>
              {b.label}
            </li>
          ))}
        </ul>
      )}
      {next && (
        <p className="bh-small" style={{ margin: '6px 0 0' }} translate="no">
          {isHi ? `अगला लक्ष्य: ${next.label}` : `Next milestone: ${next.label}`}
        </p>
      )}
      {stats.today > 0 && (
        <button type="button" className="bh-btn bh-btn-ghost" style={{ minHeight: 36, marginTop: 8 }} onClick={share}>
          {isHi ? 'साझा करें (Share)' : 'Share'}
        </button>
      )}
    </div>
  );
}

// Sacred High-Craftsmanship Devotional Icons (Gold Embossed & Vedic Aesthetic)
function TempleIcon() {
  return (
    <svg viewBox="0 0 64 64" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="templeGold" x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF1B8" />
          <stop offset="0.3" stopColor="#F5D061" />
          <stop offset="0.7" stopColor="#D4AF37" />
          <stop offset="1" stopColor="#996515" />
        </linearGradient>
        <radialGradient id="auraGlow" cx="50%" cy="30%" r="50%">
          <stop stopColor="#FFECB3" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Sanctum Glow Aura */}
      <circle cx="32" cy="28" r="24" fill="url(#auraGlow)" />
      {/* Kalash & Dhwaja (Sacred Flag) */}
      <path d="M32 4V12M32 6L40 9.5L32 13" stroke="url(#templeGold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 6L40 9.5L32 13Z" fill="#E65100" />
      <circle cx="32" cy="13.5" r="2.5" fill="url(#templeGold)" />
      {/* Upper Shikhara Dome */}
      <path d="M32 15L24 24H40L32 15Z" fill="url(#templeGold)" />
      <path d="M22 24C22 24 20 28 17 29H47C44 28 42 24 42 24H22Z" fill="url(#templeGold)" stroke="#FFF1B8" strokeWidth="0.8" />
      {/* Temple Mandapa Roof Band */}
      <rect x="14" y="29" width="36" height="5" rx="1.5" fill="#8C2B32" stroke="url(#templeGold)" strokeWidth="1.2" />
      {/* Pillars & Sanctum Garbhagriha */}
      <rect x="18" y="34" width="4.5" height="18" rx="1" fill="url(#templeGold)" />
      <rect x="41.5" y="34" width="4.5" height="18" rx="1" fill="url(#templeGold)" />
      <rect x="29.5" y="34" width="5" height="18" rx="1" fill="url(#templeGold)" />
      {/* Archway Portal with Shivling/Jyoti Glow */}
      <path d="M25 52V42C25 38.5 28.1 36 32 36C35.9 36 39 38.5 39 42V52H25Z" fill="#3E0B18" stroke="url(#templeGold)" strokeWidth="1.2" />
      <ellipse cx="32" cy="46" rx="3.5" ry="5.5" fill="#FFE082" />
      <ellipse cx="32" cy="46" rx="2" ry="3.5" fill="#FFF8E1" />
      {/* Plinth Base Steps */}
      <path d="M10 52H54V56H10V52Z" fill="url(#templeGold)" />
      <path d="M7 56H57V60H7V56Z" fill="#8C2B32" stroke="url(#templeGold)" strokeWidth="1" />
    </svg>
  );
}

function PushpaIcon() {
  return (
    <svg viewBox="0 0 64 64" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lotusPink" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0F5" />
          <stop offset="0.3" stopColor="#FF77A9" />
          <stop offset="0.75" stopColor="#D81B60" />
          <stop offset="1" stopColor="#880E4F" />
        </linearGradient>
        <linearGradient id="lotusGold" x1="20" y1="20" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF9C4" />
          <stop offset="0.5" stopColor="#FDD835" />
          <stop offset="1" stopColor="#F57F17" />
        </linearGradient>
      </defs>
      {/* Outer Lotus Petals */}
      <path d="M32 10C32 10 23 23 23 35C23 42 27 46 32 46C37 46 41 42 41 35C41 23 32 10 32 10Z" fill="url(#lotusPink)" stroke="#FFF" strokeWidth="0.8" />
      {/* Left Outer Wing Petals */}
      <path d="M23 22C23 22 10 28 10 38C10 43 14 47 19 47C25 47 28 38 28 38" fill="url(#lotusPink)" opacity="0.9" stroke="#FFF" strokeWidth="0.7" />
      {/* Right Outer Wing Petals */}
      <path d="M41 22C41 22 54 28 54 38C54 43 50 47 45 47C39 47 36 38 36 38" fill="url(#lotusPink)" opacity="0.9" stroke="#FFF" strokeWidth="0.7" />
      {/* Bottom Supporting Base Petals */}
      <path d="M14 43C14 43 18 53 32 53C46 53 50 43 50 43C42 48 22 48 14 43Z" fill="url(#lotusPink)" stroke="#FFF" strokeWidth="0.7" />
      {/* Sacred Golden Pollen Core & Bindu */}
      <ellipse cx="32" cy="35" rx="6" ry="6.5" fill="url(#lotusGold)" stroke="#FFF" strokeWidth="0.8" />
      <circle cx="32" cy="35" r="2.2" fill="#FFF" />
      {/* Dewdrops / Divine Sparkles */}
      <circle cx="21" cy="27" r="1.5" fill="#FFF" opacity="0.9" />
      <circle cx="43" cy="27" r="1.5" fill="#FFF" opacity="0.9" />
    </svg>
  );
}

function MalaIcon() {
  return (
    <svg viewBox="0 0 64 64" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="rudraBead" cx="35%" cy="30%" r="65%">
          <stop stopColor="#D97706" />
          <stop offset="0.4" stopColor="#92400E" />
          <stop offset="0.8" stopColor="#5A2308" />
          <stop offset="1" stopColor="#2E0E03" />
        </radialGradient>
        <linearGradient id="goldMeru" x1="26" y1="36" x2="38" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF4CC" />
          <stop offset="0.5" stopColor="#F59E0B" />
          <stop offset="1" stopColor="#B45309" />
        </linearGradient>
      </defs>
      {/* Sacred String Loop */}
      <ellipse cx="32" cy="24" rx="20" ry="17" stroke="#DC2626" strokeWidth="2.5" />
      {/* Sacred Rudraksha Beads in Circular Mala */}
      <circle cx="32" cy="7" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="43" cy="11" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="50" cy="20" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="49" cy="31" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="42" cy="38" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="21" cy="11" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="14" cy="20" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="15" cy="31" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      <circle cx="22" cy="38" r="4.2" fill="url(#rudraBead)" stroke="#FBBF24" strokeWidth="0.8" />
      {/* Master Meru Bead (Golden Guru Bead) */}
      <circle cx="32" cy="42" r="6" fill="url(#goldMeru)" stroke="#FFF" strokeWidth="1" />
      <ellipse cx="32" cy="42" rx="3.5" ry="3.5" fill="#B45309" opacity="0.3" />
      {/* Sacred Saffron/Red Silk Tassel */}
      <path d="M32 48L26 60H38L32 48Z" fill="#C23934" stroke="#F59E0B" strokeWidth="1" />
      <line x1="30" y1="52" x2="28" y2="60" stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.7" />
      <line x1="32" y1="50" x2="32" y2="60" stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.7" />
      <line x1="34" y1="52" x2="36" y2="60" stroke="#FFF" strokeWidth="0.8" strokeOpacity="0.7" />
    </svg>
  );
}

function GauMataIcon() {
  return (
    <svg viewBox="0 0 64 64" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="kamadhenuAura" cx="50%" cy="40%" r="55%">
          <stop stopColor="#FFFDE7" />
          <stop offset="0.7" stopColor="#FFF8E1" />
          <stop offset="1" stopColor="#FFE082" />
        </radialGradient>
        <linearGradient id="hornGold" x1="16" y1="8" x2="48" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF176" />
          <stop offset="0.6" stopColor="#FBC02D" />
          <stop offset="1" stopColor="#E65100" />
        </linearGradient>
      </defs>
      {/* Divine Solar Nimbus Halo */}
      <circle cx="32" cy="32" r="28" fill="url(#kamadhenuAura)" stroke="#D4AF37" strokeWidth="1.5" />
      {/* Golden Sacred Horns */}
      <path d="M19 22C17 14 21 8 26 12C25 16 23 20 21 23" fill="url(#hornGold)" stroke="#8C2B32" strokeWidth="1.2" />
      <path d="M45 22C47 14 43 8 38 12C39 16 41 20 43 23" fill="url(#hornGold)" stroke="#8C2B32" strokeWidth="1.2" />
      {/* Ears with Kundal / Earrings */}
      <ellipse cx="14" cy="28" rx="6.5" ry="3.2" transform="rotate(-25 14 28)" fill="#FFF" stroke="#D4AF37" strokeWidth="1.2" />
      <ellipse cx="50" cy="28" rx="6.5" ry="3.2" transform="rotate(25 50 28)" fill="#FFF" stroke="#D4AF37" strokeWidth="1.2" />
      {/* Face of Sacred Kamadhenu */}
      <path d="M23 21C23 21 27 18 32 18C37 18 41 21 41 21C45 24 46 31 46 37C46 44 41 49 32 49C23 49 18 44 18 37C18 31 19 24 23 21Z" fill="#FFFDF9" stroke="#8C2B32" strokeWidth="1.5" />
      {/* Snout & Muzzle */}
      <ellipse cx="32" cy="42" rx="9" ry="5.5" fill="#FFE4E6" stroke="#8C2B32" strokeWidth="1.2" />
      <circle cx="28" cy="42" r="1.6" fill="#8C2B32" />
      <circle cx="36" cy="42" r="1.6" fill="#8C2B32" />
      {/* Gentle Divine Eyes */}
      <ellipse cx="25" cy="30" rx="2.5" ry="3" fill="#3E0B18" />
      <circle cx="24.2" cy="29" r="1" fill="#FFF" />
      <ellipse cx="39" cy="30" rx="2.5" ry="3" fill="#3E0B18" />
      <circle cx="38.2" cy="29" r="1" fill="#FFF" />
      {/* Chandan Tilak on Forehead */}
      <path d="M32 23L30 28H34L32 23Z" fill="#C23934" />
      <circle cx="32" cy="29.5" r="1.2" fill="#F59E0B" />
      {/* Ghanti / Bell Garland on Neck */}
      <path d="M22 51C26 55 38 55 42 51" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="55" r="2.8" fill="#F59E0B" stroke="#8C2B32" strokeWidth="0.8" />
    </svg>
  );
}

function SevaStrip({ wd, isHi }) {
  const items = [
    [
      <TempleIcon key="mandir" />,
      isHi ? 'मंदिर सेवा' : 'Mandir Seva',
      isHi ? 'अपने नाम व गोत्र से संकल्प पूजा' : 'Online Puja & Sankalp in your name',
      '/mandir-seva/puja',
    ],
    [
      <PushpaIcon key="chadhava" />,
      isHi ? 'दैनिक चढ़ावा' : 'Daily Chadhava',
      isHi ? 'गर्भगृह में पावन सामग्री अर्पण' : 'Offer sacred items at holy sanctums',
      '/mandir-seva/chadhava',
    ],
    [
      <MalaIcon key="offerings" />,
      isHi ? `${wd.name_hi || wd.name} हेतु सामग्री` : `Offerings for ${wd.name}`,
      isHi ? 'माला, रुद्राक्ष एवं पूजन सामग्री' : 'Mala, rudraksha & puja essentials',
      `/astro-mall?category=${wd.mall}`,
    ],
    [
      <GauMataIcon key="gau" />,
      isHi ? 'गौ सेवा' : 'Gau Sewa',
      isHi ? 'गौ माता संरक्षण हेतु पावन दान' : 'Support and protect sacred cows',
      '/gau-sewa',
    ],
  ];

  return (
    <>
      <div className="bh-sec-title">
        <h2 translate="no">{isHi ? 'सेवा और संकल्प' : 'Devotional Seva & Sankalp'}</h2>
      </div>
      <div className="bh-cards bh-cards-2">
        {items.map(([ic, t, d, to]) => (
          <Link key={t} to={to} className="bh-card" data-track={`home_seva_${to.split('?')[0].replace(/\W+/g, '_').replace(/^_|_$/g, '')}`}>
            <div className="bh-card-ic" aria-hidden="true">{ic}</div>
            <div style={{ minWidth: 0 }} translate="no">
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function BhaktiHome() {
  const lang = useLang();
  const isHi = lang === 'hi';
  const signedIn = useSignedIn();
  const [mantras, setMantras] = useState([]);
  const [mantrasReady, setMantrasReady] = useState(false);
  const [mantrasFailed, setMantrasFailed] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [shlok, setShlok] = useState(null);
  const [shlokFailed, setShlokFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retry = () => setAttempt((a) => a + 1);
  const wd = WEEKDAY[new Date().getDay()];
  const heroImg = wd.slug === 'krishna' ? '/assets/bhakti/hero/radha-krishna-premium.webp' : (DEITIES.find((d) => d[0] === wd.slug) || [])[5];

  useEffect(() => {
    let live = true;
    setMantrasReady(false); setMantrasFailed(false); setShlok(null); setShlokFailed(false);
    api('/mantras').then((m) => { if (live) setMantras(m); }).catch(() => { if (live) setMantrasFailed(true); }).finally(() => { if (live) setMantrasReady(true); });
    api('/gita/daily').then((d) => { if (live) setShlok(d.verse); }).catch(() => { if (live) setShlokFailed(true); });
    return () => { live = false; };
  }, [attempt]);

  useEffect(() => {
    let live = true;
    setStatsFailed(false);
    if (signedIn) api('/jaap/analytics').then((s) => { if (live) setStats(s); }).catch(() => { if (live) { setStats(null); setStatsFailed(true); } });
    else setStats(null);
    return () => { live = false; };
  }, [signedIn, attempt]);

  const catalogue = mantras.filter((m) => !m.is_custom);
  const forDay = catalogue.filter((m) => m.deity && m.deity.slug === wd.slug);
  const pool = forDay.length ? forDay : catalogue;
  const today = pool.length ? pool[dayOfYear() % pool.length] : null;
  const inMala = stats ? stats.today % 108 : 0;
  const malaDone = stats ? stats.today >= 108 : false;
  const featured = SECTIONS.slice(0, FEATURED);
  const more = SECTIONS.slice(FEATURED);

  return (
    <>
      {/* Unified Sacred Service Banner matching Mandir & Astro Mall */}
      <section className="service-banner service-banner--bhakti max-w-7xl mx-auto mt-2 px-4">
        <figure className="service-banner__art">
          <img
            src="/assets/img/mandir-banner.webp"
            alt="Bhakti Divine Sanctuary"
            fetchPriority="high"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/assets/img/seva-gallery/ram-verified-1.webp';
            }}
          />
          <figcaption>{isHi ? 'भक्ति एवं नित्य साधना' : 'Sacred Devotion'}</figcaption>
        </figure>
        <div className="mandir-hero__copy service-banner__copy">
          <p className="mandir-hero__eyebrow" translate="no">
            {isHi
              ? `✦ ॥ ${wd.line_hi || 'श्री राधे कृष्ण'} ॥ ✦`
              : `✦ ॥ ${wd.line_en || 'Shree Radhe Krishna'} ॥ ✦`}
          </p>
          <h1 translate="no">
            {isHi ? (
              <>
                भक्ति में ही शक्ति है — <em>प्रभु नाम व नित्य साधना</em>
              </>
            ) : (
              <>
                Devotion Brings Strength — <em>Sacred Names & Sadhana</em>
              </>
            )}
          </h1>
          <p translate="no">
            {isHi
              ? 'अपने दिन की शुरुआत प्रभु के पावन नाम, आरती, गीता श्लोक और सात्विक विचारों के साथ करें। डिजिटल नाम जाप, 24x7 भक्ति रेडियो एवं तीर्थ दर्शन से नित्य जुड़े रहें।'
              : 'Begin your auspicious day with sacred names, sanctified aartis, Gita shlokas, and devotional meditation. Connect daily with digital Naam Jaap, 24x7 Bhajan Radio, and holy shrines.'}
          </p>
          <div className="shop-hero__actions">
            <Link to="/bhakti/naam-jaap" className="shop-btn shop-btn--gold cursor-pointer no-underline" translate="no">
              ▶ {isHi ? 'नाम जाप शुरू करें' : 'Begin Naam Jaap'}
            </Link>
            <Link to={`/bhakti/aarti-chalisa?deity=${wd.slug}`} className="shop-btn shop-btn--ghost no-underline" translate="no">
              🪔 {isHi ? `${wd.name_hi || wd.name} की आरती` : `${wd.name} Aarti`}
            </Link>
            <Link to="/bhakti/festivals" className="shop-btn shop-btn--ghost no-underline" translate="no">
              📅 {isHi ? 'आज का पंचांग' : 'Daily Panchang'}
            </Link>
          </div>
        </div>
        <div className="shop-trust service-benefits">
          <div>
            <span>📿</span>
            <p translate="no">
              <b>{isHi ? 'डिजिटल नाम जाप' : 'Digital Naam Jaap'}</b>
              <small>{isHi ? '108 मनकों का गणक व स्ट्रीक' : '108 Mala Counter & Streak'}</small>
            </p>
          </div>
          <div>
            <span>🕉️</span>
            <p translate="no">
              <b>{isHi ? 'प्रामाणिक आरती व गीता' : 'Aarti & Bhagavad Gita'}</b>
              <small>{isHi ? 'शास्त्रसम्मत 700 पावन श्लोक' : 'Authentic 700 Verses'}</small>
            </p>
          </div>
          <div>
            <span>📻</span>
            <p translate="no">
              <b>{isHi ? '24x7 भक्ति रेडियो' : '24x7 Bhajan Radio'}</b>
              <small>{isHi ? 'अखंड भजन, कीर्तन व ध्यान' : 'Continuous Sacred Audio'}</small>
            </p>
          </div>
        </div>
      </section>

      <div className="bh-deities" aria-label="Deities">
        {DEITIES.map(([slug, name, nameHi, glyph, bg, image]) => (
          <Link key={slug} to={`/bhakti/aarti-chalisa?deity=${slug}`} className={`bh-deity${slug === wd.slug ? ' today' : ''}`}>
            <div className="bh-deity-art" style={{ background: bg }}>
              <span aria-hidden="true">{glyph}</span>
              <Art src={image} alt={`${name} devotional artwork`} eager />
            </div>
            <b translate="no">{isHi ? nameHi : name}</b>
            {slug === wd.slug && <em className="bh-today-tag" translate="no">{isHi ? 'आज' : 'Today'}</em>}
          </Link>
        ))}
      </div>

      <div className="bh-ritual-mobile">
        <DailyRitual shlok={shlok} today={today} malaDone={malaDone} wd={wd} idSuffix="-m" />
      </div>

      <div className="bh-grid">
        <div>
          <div className="bh-sec-title">
            <h2 translate="no">{isHi ? 'भक्ति के प्रमुख विभाग' : 'Featured Sacred Sections'}</h2>
          </div>
          <div className="bh-featured">
            {featured.map((sec) => (
              <Link key={sec.id} to={sec.to} className="bh-feat">
                <div className="bh-feat-media"><Art src={sec.image} alt="" glyph="ॐ" /></div>
                <div className="bh-feat-copy" translate="no">
                  <h3>{isHi ? sec.title_hi : sec.title}</h3>
                  <p>{isHi ? sec.desc_hi : sec.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="bh-sec-title" style={{ margin: '30px 0 12px' }}>
            <h2 style={{ fontSize: '17px' }} translate="no">
              {isHi ? 'अन्य पावन विभाग' : 'More Sacred Sections'}
            </h2>
          </div>
          <div className="bh-cards bh-cards-more">
            {more.map((sec) => (
              <Link key={sec.id} to={sec.to} className="bh-card">
                <div className="bh-card-media"><Art src={sec.image} alt="" glyph="ॐ" /></div>
                <div style={{ minWidth: 0 }} translate="no">
                  <h3>
                    {isHi ? sec.title_hi : sec.title}
                    {!sec.built && <span className="bh-soon">{isHi ? 'शीघ्र' : 'Soon'}</span>}
                  </h3>
                  <p>{isHi ? sec.desc_hi : sec.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="bh-sec-title">
            <h2 translate="no">{isHi ? 'आज का भक्ति दर्शन' : "Today's Divine Darshan"}</h2>
          </div>
          <div className="bh-panel bh-two">
            <div>
              <h3 translate="no">{isHi ? 'आज का पावन मंत्र' : "Today's Sacred Mantra"}</h3>
              {today ? (
                <>
                  <p className="bh-quote" translate="no">“{isHi ? today.text_hi : (today.text_roman || today.text_hi)}”</p>
                  <p className="bh-small" translate="no">
                    {isHi ? (today.meaning_hi || (today.deity ? today.deity.name_hi : 'पावन मंत्र')) : (today.text_roman || today.text_hi)}
                  </p>
                  <Link className="bh-btn bh-btn-maroon" to="/bhakti/naam-jaap" style={{ marginTop: 10 }} translate="no">
                    {isHi ? '108 बार जाप करें' : 'Chant 108 Times'}
                  </Link>
                </>
              ) : mantrasReady ? (
                mantrasFailed ? <Unavailable what={isHi ? 'मंत्र' : 'Mantra'} onRetry={retry} isHi={isHi} /> : <p className="bh-small">{isHi ? 'मंत्र लोड हो रहा है...' : 'Mantra loading...'}</p>
              ) : (
                <div role="status" aria-label="Loading mantra" style={{ display: 'grid', gap: 8 }}>
                  <Skel h={22} /><Skel h={22} w="70%" /><Skel h={12} w="45%" />
                </div>
              )}
            </div>
            <div>
              <h3 translate="no">{isHi ? 'आज का गीता श्लोक' : "Today's Gita Shlok"}</h3>
              {shlok ? (
                <>
                  <p className="bh-quote" lang="sa" translate="no" style={{ whiteSpace: 'pre-line' }}>{shlok.text_sa}</p>
                  <p className="bh-small" translate="no">
                    {isHi ? `श्रीमद्भगवद्गीता अध्याय ${shlok.chapter}.${shlok.verse}` : `Bhagavad Gita ${shlok.chapter}.${shlok.verse}`} ·{' '}
                    <Link to={`/bhakti/bhagavad-gita/${shlok.chapter}#v${shlok.verse}`} style={{ color: '#650F23', fontWeight: 700 }}>
                      {isHi ? 'भावार्थ सहित पढ़ें →' : 'Read with meaning →'}
                    </Link>
                  </p>
                </>
              ) : shlokFailed ? (
                <Unavailable what={isHi ? 'श्लोक' : 'Shlok'} onRetry={retry} isHi={isHi} />
              ) : (
                <div role="status" aria-label="Loading shlok" style={{ display: 'grid', gap: 8 }}>
                  <Skel h={22} /><Skel h={22} w="80%" /><Skel h={12} w="50%" />
                </div>
              )}
            </div>
          </div>

          {(!mantrasReady || catalogue.length > 0) && (
            <>
              <div className="bh-sec-title">
                <h2 translate="no">{isHi ? 'लोकप्रिय मंत्र' : 'Popular Mantras'}</h2>
                <Link to="/bhakti/naam-jaap" className="bh-small" style={{ fontWeight: 700 }} translate="no">
                  {isHi ? 'सभी मंत्र देखें →' : 'All Mantras →'}
                </Link>
              </div>
              <div className="bh-cards">
                {!mantrasReady && [0, 1, 2].map((i) => (
                  <div key={i} className="bh-card" aria-hidden="true">
                    <Skel w={56} h={56} r={12} />
                    <div style={{ flex: 1, display: 'grid', gap: 6 }}><Skel h={14} /><Skel h={10} w="60%" /></div>
                  </div>
                ))}
                {catalogue.slice(0, 3).map((m) => (
                  <Link key={m.id} to="/bhakti/naam-jaap" className="bh-card">
                    <div className="bh-card-ic" aria-hidden="true">ॐ</div>
                    <div style={{ minWidth: 0 }} translate="no">
                      <h3>{isHi ? m.text_hi : (m.text_roman || m.text_hi)}</h3>
                      <p>{isHi ? (m.meaning_hi || (m.deity ? m.deity.name_hi : 'पावन मंत्र')) : (m.meaning_en || (m.deity ? m.deity.name_en : 'Sacred Mantra'))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <SevaStrip wd={wd} isHi={isHi} />
        </div>

        <aside>
          <div className="bh-ritual-desktop">
            <DailyRitual shlok={shlok} today={today} malaDone={malaDone} wd={wd} />
          </div>
          <PanchangStrip />
          <div className="bh-panel">
            <h3 translate="no">{isHi ? 'आज का संकल्प' : "Today's Sacred Sankalp"}</h3>
            <p className="bh-quote" style={{ fontSize: 17 }} translate="no">
              {isHi
                ? '“आज मैं कम से कम 1 माला (108) प्रभु के पावन नाम का जप करूँगा।”'
                : '“Today I resolve to complete at least 1 mala (108 chants) in divine contemplation.”'}
            </p>
            <Link className="bh-btn bh-btn-maroon" to="/bhakti/naam-jaap" translate="no">
              {isHi ? 'संकल्प लें →' : 'Take Sankalp →'}
            </Link>
          </div>
          <div className="bh-panel">
            <h3 translate="no">{isHi ? 'मेरी भक्ति यात्रा' : 'My Bhakti Journey'}</h3>
            {!signedIn ? (
              <>
                <p className="bh-small" translate="no">
                  {isHi
                    ? 'अपने नाम जाप, माला व निरंतरता देखने हेतु साइन-इन करें। यह पूरी तरह गोपनीय है।'
                    : 'Sign in to track your jaap, malas and streak. Only you can see it.'}
                </p>
                <button type="button" className="bh-btn bh-btn-ghost" onClick={openLogin}>
                  {isHi ? 'साइन-इन करें' : 'Sign in'}
                </button>
              </>
            ) : stats ? (
              <>
                <div className="bh-stats" translate="no">
                  <div className="bh-stat">
                    <b>{fmt(stats.today)}</b>
                    <span>{isHi ? 'आज का जाप' : "Today's chants"}</span>
                  </div>
                  <div className="bh-stat">
                    <b>{fmt(stats.lifetime)}</b>
                    <span>{isHi ? 'कुल जाप' : 'Total chants'}</span>
                  </div>
                  <div className="bh-stat">
                    <b>{fmt(stats.malas)}</b>
                    <span>{isHi ? 'पूर्ण माला' : 'Completed malas'}</span>
                  </div>
                </div>
                <p className="bh-small" style={{ marginTop: 10 }} translate="no">
                  {isHi ? `आज की माला प्रगति · ${malaDone ? '108' : inMala} / 108` : `Current mala progress · ${malaDone ? '108' : inMala} / 108`}
                </p>
                <div className="bh-bar"><i style={{ width: `${malaDone ? 100 : (inMala / 108) * 100}%` }} /></div>
                <p className="bh-small" translate="no">
                  {stats.streak > 0
                    ? (isHi ? `🔥 ${stats.streak} दिन की निरंतरता` : `🔥 ${stats.streak} day streak`)
                    : (isHi ? 'आज से अपनी भक्ति यात्रा शुरू करें' : 'Start a streak today')}
                </p>
                <Badges stats={stats} isHi={isHi} />
                <Link to="/bhakti/my-bhakti" className="bh-small" style={{ fontWeight: 700, color: '#650F23', display: 'inline-block', marginTop: 8 }} translate="no">
                  {isHi ? 'पूरा विवरण देखें →' : 'View full details →'}
                </Link>
              </>
            ) : statsFailed ? (
              <Unavailable what={isHi ? 'आपकी प्रगति' : 'Your progress'} onRetry={retry} isHi={isHi} />
            ) : (
              <div role="status" aria-label="Loading your progress" style={{ display: 'grid', gap: 8 }}>
                <Skel h={52} /><Skel h={10} /><Skel h={12} w="40%" />
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
