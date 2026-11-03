import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';

const DEITIES = [
  ['ram', 'Shri Ram', 'रा', 'linear-gradient(135deg,#9a4a1c,#3E0B18)'], ['shiva', 'Shiva', 'शि', 'linear-gradient(135deg,#2f4a6b,#1b2a40)'],
  ['hanuman', 'Hanuman', 'ह', 'linear-gradient(135deg,#c8721c,#5a2410)'], ['ganesh', 'Ganesh', 'ग', 'linear-gradient(135deg,#d19a2c,#7a3a12)'],
  ['durga', 'Durga', 'दु', 'linear-gradient(135deg,#b3262e,#4a0f1e)'], ['krishna', 'Krishna', 'कृ', 'linear-gradient(135deg,#3b5f8f,#3E0B18)'],
];

// [label, description, icon, route, built]
const SECTIONS = [
  ['Naam Jaap', 'Digital mala, voice counter & jaap record', '📿', '/bhakti/naam-jaap', true],
  ['Aarti & Chalisa', 'Deity-wise aarti, chalisa and stotra', '🪔', '/bhakti/aarti-chalisa', false],
  ['Bhagavad Gita', '18 chapters, 700 shlokas with meaning', '📖', '/bhakti/bhagavad-gita', false],
  ['Shankaracharya & Vedanta', 'Adi Shankaracharya, Advaita & Upadesh', '🕉️', '/bhakti/shankaracharya', false],
  ['Bhajan Radio', 'Bhajan, kirtan, aarti & dhyan music', '🎧', '/bhakti/bhajan-radio', false],
  ['Mandir Darshan', 'Famous temples, history & significance', '🛕', '/bhakti/mandir-darshan', false],
  ['Puja Vidhi', 'Step-by-step puja guides & samagri', '🙏', '/bhakti/puja-vidhi', false],
  ['My Bhakti', 'Your private jaap progress & streak', '🪷', '/bhakti/my-bhakti', true],
];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');
const dayOfYear = () => Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);

// Artwork slot: renders only if the file exists, so a missing image never shows as a broken icon.
function Art({ src, alt = '' }) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return <img src={src} alt={alt} loading="lazy" decoding="async" onError={() => setOk(false)} />;
}

const Mandala = () => (
  <svg className="bh-mandala" viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth=".6" aria-hidden="true">
    {[92, 78, 62, 46, 30].map((r) => <circle key={r} cx="100" cy="100" r={r} />)}
    {Array.from({ length: 24 }, (_, i) => <ellipse key={i} cx="100" cy="30" rx="6" ry="18" transform={`rotate(${i * 15} 100 100)`} />)}
    {Array.from({ length: 12 }, (_, i) => <ellipse key={`b${i}`} cx="100" cy="62" rx="4" ry="12" transform={`rotate(${i * 30} 100 100)`} />)}
  </svg>
);

export default function BhaktiHome() {
  const signedIn = useSignedIn();
  const [mantras, setMantras] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => { api('/mantras').then(setMantras).catch(() => {}); }, []);
  useEffect(() => {
    if (signedIn) api('/jaap/analytics').then(setStats).catch(() => setStats(null));
    else setStats(null);
  }, [signedIn]);

  const catalogue = mantras.filter((m) => !m.is_custom);
  const today = catalogue.length ? catalogue[dayOfYear() % catalogue.length] : null;
  const inMala = stats ? stats.today % 108 : 0;
  const malaDone = stats ? stats.today >= 108 : false;

  return (
    <>
      <section className="bh-hero" aria-labelledby="bh-h1">
        <div className="bh-hero-copy">
          <span className="bh-hero-om">॥ श्री राधे कृष्ण ॥</span>
          <h1 id="bh-h1">भक्ति में ही शक्ति है</h1>
          <p>अपने दिन की शुरुआत प्रभु के नाम और सकारात्मक विचारों के साथ करें।</p>
          <div className="bh-cta-row">
            <Link className="bh-btn bh-btn-gold" to="/bhakti/naam-jaap">▶ Naam Jaap Shuru Karein</Link>
            <Link className="bh-btn bh-btn-line" to="/bhakti/aarti-chalisa">🪔 Aaj Ki Aarti</Link>
          </div>
        </div>
        <div className="bh-hero-art">
          <Mandala />
          <Art src="/assets/bhakti/hero/radha-krishna.webp" alt="Radha and Krishna" />
          <div className="bh-hero-fade" />
        </div>
      </section>

      <div className="bh-deities" aria-label="Deities">
        {DEITIES.map(([slug, name, glyph, bg]) => (
          <Link key={slug} to={`/bhakti/aarti-chalisa?deity=${slug}`} className="bh-deity">
            <div className="bh-deity-art" style={{ background: bg }}>
              <span aria-hidden="true">{glyph}</span>
              <Art src={`/assets/bhakti/deities/${slug}.webp`} alt={name} />
            </div>
            <b>{name}</b>
          </Link>
        ))}
      </div>

      <div className="bh-grid">
        <div>
          <div className="bh-sec-title"><h2>भक्ति के प्रमुख विभाग</h2></div>
          <div className="bh-cards">
            {SECTIONS.map(([t, d, ic, to, built]) => (
              <Link key={t} to={to} className="bh-card">
                <div className="bh-card-ic" aria-hidden="true">{ic}</div>
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
              ) : <p className="bh-small">Loading…</p>}
            </div>
            <div>
              <h3>Aaj Ka Gita Shlok</h3>
              <p className="bh-quote" lang="sa">कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।<br />मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥</p>
              <p className="bh-small">Bhagavad Gita 2.47 · public-domain Sanskrit text. Translations arrive with the Gita section.</p>
            </div>
          </div>

          <div className="bh-sec-title"><h2>लोकप्रिय मंत्र</h2><Link to="/bhakti/naam-jaap" className="bh-small" style={{ fontWeight: 700, color: '#650F23' }}>Sabhi Mantra →</Link></div>
          <div className="bh-cards">
            {catalogue.slice(0, 3).map((m) => (
              <Link key={m.id} to="/bhakti/naam-jaap" className="bh-card">
                <div className="bh-card-ic" aria-hidden="true">ॐ</div>
                <div style={{ minWidth: 0 }}><h3>{m.text_hi}</h3><p>{m.text_roman}</p></div>
              </Link>
            ))}
          </div>
        </div>

        <aside>
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
                <Link to="/bhakti/my-bhakti" className="bh-small" style={{ fontWeight: 700, color: '#650F23' }}>Poora vivaran →</Link>
              </>
            ) : <p className="bh-small">Loading…</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
