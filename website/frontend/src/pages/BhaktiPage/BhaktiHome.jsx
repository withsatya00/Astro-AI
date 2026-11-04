import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';
import { WEEKDAY, BADGES, useRitual, todayKey } from './dailyRitual.js';
import { Skel } from './Skeleton.jsx';

const DEITIES = [
  ['ram', 'Shri Ram', 'रा', 'linear-gradient(135deg,#9a4a1c,#3E0B18)', '/assets/img/seva-gallery/ram-verified-1.webp'],
  ['shiva', 'Shiva', 'शि', 'linear-gradient(135deg,#2f4a6b,#1b2a40)', '/assets/img/seva-gallery/ritual-shiva-1.webp'],
  ['hanuman', 'Hanuman', 'ह', 'linear-gradient(135deg,#c8721c,#5a2410)', '/assets/img/seva-gallery/ritual-hanuman-1.webp'],
  ['ganesh', 'Ganesh', 'ग', 'linear-gradient(135deg,#d19a2c,#7a3a12)', '/assets/img/seva-gallery/ritual-ganesh-1.webp'],
  ['durga', 'Durga', 'दु', 'linear-gradient(135deg,#b3262e,#4a0f1e)', '/assets/img/seva-gallery/ritual-devi-1.webp'],
  ['krishna', 'Krishna', 'कृ', 'linear-gradient(135deg,#3b5f8f,#3E0B18)', '/assets/img/seva-gallery/banke-bihari-vrindavan-1.webp'],
];

// [label, description, image, route, built]. The first FEATURED entries are shown large; the rest sit under "More".
const FEATURED = 4;
const SECTIONS = [
  ['Naam Jaap', 'Digital mala, voice counter & jaap record', '/assets/img/seva-gallery/ritual-vishnu-1.webp', '/bhakti/naam-jaap', true],
  ['Aarti & Chalisa', 'Deity-wise aarti, chalisa and stotra', '/assets/img/seva-gallery/ritual-devi-2.webp', '/bhakti/aarti-chalisa', true],
  ['Bhagavad Gita', '18 chapters, 700 shlokas with meaning', '/assets/img/seva-gallery/dwarkadhish-dwarka-2.webp', '/bhakti/bhagavad-gita', true],
  ['Bhajan Radio', 'Bhajan, kirtan, aarti & dhyan music', '/assets/img/seva-gallery/banke-bihari-vrindavan-2.webp', '/bhakti/bhajan-radio', true],
  ['Shankaracharya & Vedanta', 'Adi Shankaracharya, Advaita & Upadesh', '/assets/img/seva-gallery/badrinath-dham-uttarakhand-2.webp', '/bhakti/shankaracharya', true],
  ['Mandir Darshan', 'Famous temples, history & significance', '/assets/img/mandir-banner.webp', '/bhakti/mandir-darshan', true],
  ['Puja Vidhi', 'Step-by-step puja guides & samagri', '/assets/img/puja-banner.webp', '/bhakti/puja-vidhi', true],
  ['My Bhakti', 'Your private jaap progress & streak', '/assets/img/seva-gallery/ritual-ganesh-2.webp', '/bhakti/my-bhakti', true],
  ['Festivals & Vrat', 'Ekadashi, Purnima and festival dates for your city', '/assets/img/seva-gallery/ritual-vishnu-2.webp', '/bhakti/festivals', true],
  ['AI Spiritual Guide', 'Ask about the Gita, mantras, Vedanta & puja', '/assets/img/seva-gallery/ritual-shiva-2.webp', '/bhakti/guide', true],
  ['My Sadhana', 'Daily routine, sankalp, journal & meditation', '/assets/img/seva-gallery/ritual-ganesh-2.webp', '/bhakti/sadhana', true],
];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

// Artwork slot: a missing image falls back to a glyph (when given) instead of a broken icon.
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

// Progress ring for today's ritual.
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
  const { done, toggle } = useRitual();
  const steps = [
    ['mantra', 'Mantra', today ? today.text_roman : 'Aaj ka mantra', '/bhakti/naam-jaap', !!done.mantra],
    ['aarti', `${wd.name} ki Aarti`, 'Aarti padhein ya sunein', `/bhakti/aarti-chalisa?deity=${wd.slug}&kind=aarti`, !!done.aarti],
    ['gita', 'Gita Shlok', shlok ? `Adhyay ${shlok.chapter}.${shlok.verse}` : 'Aaj ka shlok', shlok ? `/bhakti/bhagavad-gita/${shlok.chapter}#v${shlok.verse}` : '/bhakti/bhagavad-gita', !!done.gita],
    ['jaap', '1 Mala (108) Jaap', malaDone ? 'Poorn ho gayi' : 'Naam jaap shuru karein', '/bhakti/naam-jaap', !!done.jaap || malaDone],
  ];
  const count = steps.filter((x) => x[4]).length;
  return (
    <section className="bh-panel bh-ritual" aria-labelledby={`bh-ritual-h${idSuffix}`}>
      <div className="bh-ritual-head">
        <Ring done={count} total={steps.length} />
        <div>
          <h3 id={`bh-ritual-h${idSuffix}`}>आज का नित्य कर्म</h3>
          <p className="bh-small" style={{ margin: 0 }}>{count === steps.length ? 'Aaj ka nitya kram poorn hua. 🙏 Jai Shri Ram' : 'Chaar chhote kadam, ek shaant din ke liye.'}</p>
        </div>
      </div>
      <ol className="bh-ritual-steps">
        {steps.map(([id, t, sub, to, ok]) => (
          <li key={id} data-done={ok ? '' : undefined}>
            <button type="button" className="bh-tick" aria-pressed={ok} aria-label={`${t}: ${ok ? 'done' : 'not done'}`} onClick={() => toggle(id)}>{ok ? '✓' : ''}</button>
            <Link to={to} className="bh-ritual-link"><b>{t}</b><span>{sub}</span></Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PanchangStrip() {
  const [day, setDay] = useState(null);
  const [next, setNext] = useState([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const now = new Date();
    const key = todayKey(now);
    api(`/calendar/month?year=${now.getFullYear()}&month=${now.getMonth() + 1}&location=delhi`)
      .then((d) => setDay(d.days.find((x) => x.date === key) || null)).catch(() => setFailed(true));
    api('/calendar/upcoming?days=30&location=delhi').then((d) => setNext(d.items.filter((i) => i.date > key).slice(0, 2))).catch(() => {});
  }, []);
  if (failed) return null;
  return (
    <section className="bh-panel bh-panchang" aria-labelledby="bh-pan-h">
      <div className="bh-sec-title" style={{ margin: '0 0 8px' }}>
        <h3 id="bh-pan-h" style={{ margin: 0 }}>आज का पंचांग</h3>
        <Link to="/bhakti/festivals" className="bh-small" style={{ fontWeight: 700, color: '#650F23' }}>Calendar →</Link>
      </div>
      {!day ? <div style={{ display: 'grid', gap: 8 }} role="status" aria-label="Loading panchang"><Skel h={18} w="70%" /><Skel h={14} w="90%" /></div> : (
        <>
          <p className="bh-pan-main"><b>{day.tithi.paksha} {day.tithi.name_hi}</b> <span>({day.tithi.name_en})</span></p>
          <p className="bh-small" style={{ margin: '2px 0 0' }}>{day.lunar_month_hi} · Suryoday {day.sunrise} · Suryast {day.sunset} · Delhi</p>
          {(day.festivals.length > 0 || day.observances.length > 0) && (
            <p className="bh-pan-fest">🪔 {[...day.festivals.map((f) => f.name_en), ...day.observances.map((o) => o.name_en)].join(' · ')}</p>
          )}
          {next.length > 0 && (
            <ul className="bh-pan-next">
              {next.map((i, k) => <li key={k}><span>{i.name}</span><b>{i.weekday.slice(0, 3)}, {i.date.slice(8)}/{i.date.slice(5, 7)}</b></li>)}
            </ul>
          )}
          <p className="bh-small" style={{ margin: '8px 0 0' }}>Calculated panchang; exact muhurat apne local panchang ya pandit se confirm karein.</p>
        </>
      )}
    </section>
  );
}

function Badges({ stats }) {
  const earned = BADGES.filter((b) => b.test(stats));
  const next = BADGES.find((b) => !b.test(stats));
  const share = async () => {
    const text = `Aaj maine ${fmt(stats.today)} naam jaap kiya${stats.streak > 0 ? `, ${stats.streak} din ki streak 🔥` : ''}. Aap bhi judiye 🙏`;
    const url = `${window.location.origin}/bhakti`;
    try {
      if (navigator.share) await navigator.share({ title: 'Meri bhakti', text, url });
      else await navigator.clipboard.writeText(`${text} ${url}`);
    } catch (e) { /* cancelled */ }
  };
  return (
    <div className="bh-badges">
      {earned.length > 0 && (
        <ul aria-label="Milestones earned">
          {earned.map((b) => <li key={b.id} title={b.label}><span aria-hidden="true">{b.ic}</span>{b.label}</li>)}
        </ul>
      )}
      {next && <p className="bh-small" style={{ margin: '6px 0 0' }}>Agla padaav: {next.label}</p>}
      {stats.today > 0 && <button type="button" className="bh-btn bh-btn-ghost" style={{ minHeight: 36, marginTop: 8 }} onClick={share}>Share karein</button>}
    </div>
  );
}

function SevaStrip({ wd }) {
  const items = [
    ['🛕', 'Mandir Seva', 'Apne naam se puja aur sankalp', '/mandir-seva/puja'],
    ['🌸', 'Chadhava', 'Mandir me chadhava arpit karein', '/mandir-seva/chadhava'],
    ['📿', `${wd.name} ke liye`, 'Mala, rudraksha aur puja samagri', `/astro-mall?category=${wd.mall}`],
    ['🐄', 'Gau Sewa', 'Gau mata ke liye daan', '/gau-sewa'],
  ];
  return (
    <>
      <div className="bh-sec-title"><h2>सेवा और संकल्प</h2></div>
      <div className="bh-cards bh-cards-2">
        {items.map(([ic, t, d, to]) => (
          <Link key={t} to={to} className="bh-card">
            <div className="bh-card-ic" aria-hidden="true">{ic}</div>
            <div style={{ minWidth: 0 }}><h3>{t}</h3><p>{d}</p></div>
          </Link>
        ))}
      </div>
    </>
  );
}

export default function BhaktiHome() {
  const signedIn = useSignedIn();
  const [mantras, setMantras] = useState([]);
  const [mantrasReady, setMantrasReady] = useState(false);
  const [stats, setStats] = useState(null);
  const [shlok, setShlok] = useState(null);
  const wd = WEEKDAY[new Date().getDay()];
  const heroImg = wd.slug === 'krishna' ? '/assets/bhakti/hero/radha-krishna-premium.webp' : (DEITIES.find((d) => d[0] === wd.slug) || [])[4];

  useEffect(() => {
    api('/mantras').then(setMantras).catch(() => {}).finally(() => setMantrasReady(true));
    api('/gita/daily').then((d) => setShlok(d.verse)).catch(() => {});
  }, []);
  useEffect(() => {
    if (signedIn) api('/jaap/analytics').then(setStats).catch(() => setStats(null));
    else setStats(null);
  }, [signedIn]);

  const catalogue = mantras.filter((m) => !m.is_custom);
  // Prefer a mantra of today's deity when one exists; otherwise rotate through the catalogue.
  const forDay = catalogue.filter((m) => m.deity && m.deity.slug === wd.slug);
  const pool = forDay.length ? forDay : catalogue;
  const today = pool.length ? pool[dayOfYear() % pool.length] : null;
  const inMala = stats ? stats.today % 108 : 0;
  const malaDone = stats ? stats.today >= 108 : false;
  const featured = SECTIONS.slice(0, FEATURED);
  const more = SECTIONS.slice(FEATURED);

  return (
    <>
      <section className="bh-hero" aria-labelledby="bh-h1">
        <div className="bh-hero-copy">
          <span className="bh-hero-om">॥ श्री राधे कृष्ण ॥</span>
          <span className="bh-hero-day">{wd.line}</span>
          <h1 id="bh-h1">भक्ति में ही शक्ति है</h1>
          <p>अपने दिन की शुरुआत प्रभु के नाम और सकारात्मक विचारों के साथ करें।</p>
          <div className="bh-cta-row">
            <Link className="bh-btn bh-btn-gold" to="/bhakti/naam-jaap">▶ Naam Jaap Shuru Karein</Link>
            <Link className="bh-btn bh-btn-line" to={`/bhakti/aarti-chalisa?deity=${wd.slug}&kind=aarti`}>🪔 {wd.name} ki Aarti</Link>
          </div>
        </div>
        <div className="bh-hero-art">
          <Mandala />
          {heroImg && <Art src={heroImg} alt={`${wd.name} devotional artwork`} eager />}
          <div className="bh-hero-fade" />
        </div>
      </section>

      <div className="bh-deities" aria-label="Deities">
        {DEITIES.map(([slug, name, glyph, bg, image]) => (
          <Link key={slug} to={`/bhakti/aarti-chalisa?deity=${slug}`} className={`bh-deity${slug === wd.slug ? ' today' : ''}`}>
            <div className="bh-deity-art" style={{ background: bg }}>
              <span aria-hidden="true">{glyph}</span>
              <Art src={image} alt={`${name} devotional artwork`} />
            </div>
            <b>{name}</b>
            {slug === wd.slug && <em className="bh-today-tag">Aaj</em>}
          </Link>
        ))}
      </div>

      {/* On narrow screens the sidebar is far down the page, so today's ritual also appears right after the hero. */}
      <div className="bh-ritual-mobile"><DailyRitual shlok={shlok} today={today} malaDone={malaDone} wd={wd} idSuffix="-m" /></div>

      <div className="bh-grid">
        <div>
          <div className="bh-sec-title"><h2>भक्ति के प्रमुख विभाग</h2></div>
          <div className="bh-featured">
            {featured.map(([t, d, image, to]) => (
              <Link key={t} to={to} className="bh-feat">
                <div className="bh-feat-media"><Art src={image} alt="" glyph="ॐ" /></div>
                <div className="bh-feat-copy"><h3>{t}</h3><p>{d}</p></div>
              </Link>
            ))}
          </div>
          <div className="bh-sec-title" style={{ margin: '18px 0 10px' }}><h2 style={{ fontSize: '17px' }}>और विभाग</h2></div>
          <div className="bh-cards">
            {more.map(([t, d, image, to, built]) => (
              <Link key={t} to={to} className="bh-card">
                <div className="bh-card-media"><Art src={image} alt="" glyph="ॐ" /></div>
                <div style={{ minWidth: 0 }}><h3>{t}{!built && <span className="bh-soon">Soon</span>}</h3><p>{d}</p></div>
              </Link>
            ))}
          </div>

          <div className="bh-sec-title"><h2>आज का भक्ति दर्शन</h2></div>
          <div className="bh-panel bh-two">
            <div>
              <h3>Aaj Ka Mantra</h3>
              {today ? (
                <>
                  <p className="bh-quote">“{today.text_hi}”</p>
                  <p className="bh-small">{today.text_roman}{today.deity ? ` · ${today.deity.name_en}` : ''}</p>
                  <Link className="bh-btn bh-btn-maroon" to="/bhakti/naam-jaap" style={{ marginTop: 10 }}>108 baar jaap karein</Link>
                </>
              ) : mantrasReady ? <p className="bh-small">Mantra abhi uplabdh nahi hai.</p> : <div role="status" aria-label="Loading mantra" style={{ display: 'grid', gap: 8 }}><Skel h={22} /><Skel h={22} w="70%" /><Skel h={12} w="45%" /></div>}
            </div>
            <div>
              <h3>Aaj Ka Gita Shlok</h3>
              {shlok ? (
                <>
                  <p className="bh-quote" lang="sa" style={{ whiteSpace: 'pre-line' }}>{shlok.text_sa}</p>
                  <p className="bh-small">Bhagavad Gita {shlok.chapter}.{shlok.verse} · <Link to={`/bhakti/bhagavad-gita/${shlok.chapter}#v${shlok.verse}`} style={{ color: '#650F23', fontWeight: 700 }}>Read with meaning →</Link></p>
                </>
              ) : <div role="status" aria-label="Loading shlok" style={{ display: 'grid', gap: 8 }}><Skel h={22} /><Skel h={22} w="80%" /><Skel h={12} w="50%" /></div>}
            </div>
          </div>

          <div className="bh-sec-title"><h2>लोकप्रिय मंत्र</h2><Link to="/bhakti/naam-jaap" className="bh-small" style={{ fontWeight: 700, color: '#650F23' }}>Sabhi Mantra →</Link></div>
          <div className="bh-cards">
            {!mantrasReady && [0, 1, 2].map((i) => <div key={i} className="bh-card" aria-hidden="true"><Skel w={56} h={56} r={12} /><div style={{ flex: 1, display: 'grid', gap: 6 }}><Skel h={14} /><Skel h={10} w="60%" /></div></div>)}
            {catalogue.slice(0, 3).map((m) => (
              <Link key={m.id} to="/bhakti/naam-jaap" className="bh-card">
                <div className="bh-card-ic" aria-hidden="true">ॐ</div>
                <div style={{ minWidth: 0 }}><h3>{m.text_hi}</h3><p>{m.text_roman}</p></div>
              </Link>
            ))}
          </div>

          <SevaStrip wd={wd} />
        </div>

        <aside>
          <div className="bh-ritual-desktop"><DailyRitual shlok={shlok} today={today} malaDone={malaDone} wd={wd} /></div>
          <PanchangStrip />
          <div className="bh-panel">
            <h3>आज का संकल्प</h3>
            <p className="bh-quote" style={{ fontSize: 17 }}>“आज मैं कम से कम 1 माला (108) प्रभु के नाम का जप करूँगा।”</p>
            <Link className="bh-btn bh-btn-maroon" to="/bhakti/naam-jaap">Sankalp Lijiye →</Link>
          </div>
          <div className="bh-panel">
            <h3>मेरी भक्ति यात्रा</h3>
            {!signedIn ? (
              <>
                <p className="bh-small">Sign in to track your jaap, malas and streak. Only you can see it.</p>
                <button type="button" className="bh-btn bh-btn-ghost" onClick={openLogin}>Sign in</button>
              </>
            ) : stats ? (
              <>
                <div className="bh-stats">
                  <div className="bh-stat"><b>{fmt(stats.today)}</b><span>Aaj ka jaap</span></div>
                  <div className="bh-stat"><b>{fmt(stats.lifetime)}</b><span>Kul jaap</span></div>
                  <div className="bh-stat"><b>{fmt(stats.malas)}</b><span>Poorn mala</span></div>
                </div>
                <p className="bh-small" style={{ marginTop: 10 }}>Aaj ki mala pragati · {malaDone ? '108' : inMala} / 108</p>
                <div className="bh-bar"><i style={{ width: `${malaDone ? 100 : (inMala / 108) * 100}%` }} /></div>
                <p className="bh-small">{stats.streak > 0 ? `🔥 ${stats.streak} day streak` : 'Start a streak today'}</p>
                <Badges stats={stats} />
                <Link to="/bhakti/my-bhakti" className="bh-small" style={{ fontWeight: 700, color: '#650F23', display: 'inline-block', marginTop: 8 }}>Poora vivaran →</Link>
              </>
            ) : <div role="status" aria-label="Loading your progress" style={{ display: 'grid', gap: 8 }}><Skel h={52} /><Skel h={10} /><Skel h={12} w="40%" /></div>}
          </div>
        </aside>
      </div>
    </>
  );
}
