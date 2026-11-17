import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';
import { markRitual, MALL_FOR_DEITY } from './dailyRitual.js';
import { SkelPage } from './Skeleton.jsx';
import { track as trackEvent } from '../../analytics.jsx';
import { usePageMeta } from './usePageMeta.js';
import { useLang, pick } from './lang.js';

const PREF_KEY = 'bhakti_reader_prefs_v1';
const loadPrefs = () => { try { return { size: 22, diya: false, ...(JSON.parse(localStorage.getItem(PREF_KEY) || '{}')) }; } catch (e) { return { size: 22, diya: false }; } };
const SPEEDS = [['Slow', 'धीमा', 25], ['Medium', 'मध्यम', 45], ['Fast', 'तेज़', 80]]; // pixels per second for the follow-along scroll

function DevotionalAudioEmbed({ embed: e, lang }) {
  const [showVideo, setShowVideo] = useState(false);
  const isHi = lang === 'hi';
  return (
    <div className="bh-panel" style={{ marginBottom: 16, background: '#FFFDF9', border: '1px solid #E8D7BA', borderRadius: 16, padding: '14px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'radial-gradient(circle, #5a1222, #3E0B18)',
            border: '1.5px solid #D4AF37',
            display: 'grid', placeItems: 'center', fontSize: 20, color: '#F8D882',
            boxShadow: '0 4px 12px rgba(62,11,24,0.18)'
          }}>
            🪔
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 14, color: '#3E0B18', fontFamily: 'Georgia, serif' }}>{e.title}</strong>
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D'
              }}>
                🎧 {isHi ? 'भक्ति ऑडियो मोड' : 'Audio Mode'}
              </span>
            </div>
            <p className="bh-small" style={{ margin: '2px 0 0', color: '#8C4A28' }}>
              {e.channel} · {isHi ? 'पाठ के साथ शांतिपूर्वक पावन श्रवण करें' : 'Peaceful audio listening while reading text'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowVideo(!showVideo)}
          className="bh-btn bh-btn-ghost"
          style={{ minHeight: 36, padding: '0 12px', fontSize: 12, borderRadius: 999 }}
        >
          {showVideo ? (isHi ? '🎧 केवल ऑडियो मोड' : '🎧 Audio Only') : (isHi ? '🎬 वीडियो दिखाएं' : '🎬 Show Video')}
        </button>
      </div>

      <div style={showVideo ? { marginTop: 12 } : { height: 70, overflow: 'hidden', marginTop: 10, borderRadius: 10, border: '1px solid #E8D7BA' }}>
        <div className={showVideo ? 'bh-embed' : undefined} style={showVideo ? undefined : { height: '100%' }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${e.youtube_id}?rel=0&playsinline=1`}
            title={e.title}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={showVideo ? {} : { width: '100%', height: '100%', border: 'none' }}
            allowFullScreen={showVideo}
          />
        </div>
      </div>
    </div>
  );
}

export default function AartiDetail() {
  const { slug } = useParams();
  const lang = useLang();
  const signedIn = useSignedIn();
  const [c, setC] = useState(null);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('hi');
  const [prefs, setPrefs] = useState(loadPrefs);
  const [fav, setFav] = useState(false);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(0);
  const [track, setTrack] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [speed, setSpeed] = useState(1);
  const audio = useRef(null);
  const body = useRef(null);

  useEffect(() => {
    setC(null); setErr('');
    api(`/content/${slug}`).then((d) => { setC(d); setFav(d.is_favourite); setTab('hi'); setTrack(0); markRitual('aarti'); trackEvent('bhakti_text_open', { kind: d.kind, slug: d.slug }); })
      .catch((e) => setErr(e instanceof ApiError && e.status === 404 ? 'This text is not available.' : (e.message || 'Could not load')));
  }, [slug, signedIn]);

  useEffect(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* ignore */ } }, [prefs]);

  // Reading progress follows how far the text has scrolled past the top of the viewport.
  useEffect(() => {
    const onScroll = () => {
      const el = body.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = Math.max(1, r.height - window.innerHeight * 0.5);
      setProgress(Math.min(100, Math.max(0, Math.round(((window.innerHeight * 0.3 - r.top) / total) * 100))));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [c, tab]);

  useEffect(() => () => { if (audio.current) audio.current.pause(); }, []);

  // Follow-along: scrolls the text at a steady pace. No recorded timings exist, so this is a reading aid, not synced karaoke.
  useEffect(() => {
    if (!scrolling) return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setScrolling(false); return undefined; }
    let raf = 0; let last = performance.now(); let carry = 0;
    const tick = (now) => {
      carry += ((now - last) / 1000) * SPEEDS[speed][1]; last = now;
      const px = Math.floor(carry);
      if (px >= 1) { window.scrollBy({ top: px, behavior: 'instant' }); carry -= px; }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) { setScrolling(false); return; }
      raf = requestAnimationFrame(tick);
    };
    const stop = () => setScrolling(false);
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); };
  }, [scrolling, speed]);

  const toggleFav = async () => {
    if (!signedIn) { openLogin(); return; }
    try { await api(`/favourites/${c.id}`, { method: fav ? 'DELETE' : 'PUT' }); setFav(!fav); }
    catch (e) { setNote(e.message || 'Could not update favourite'); }
  };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: c.title_en, url });
      else { await navigator.clipboard.writeText(url); setNote('Link copied'); }
    } catch (e) { /* user cancelled */ }
  };
  const playPause = () => { const a = audio.current; if (!a) return; if (a.paused) a.play().catch(() => setNote('Could not play this audio')); else a.pause(); };

  usePageMeta(c && pick(lang, c.title_en, c.title_hi), c && (c.meaning_en || c.body_hi || '').replace(/^Summary[^:]*:\s*/i, ''));
  if (err) return <div className="bh-panel bh-signin"><h1 className="bh-title">{err}</h1><Link className="bh-btn bh-btn-maroon" to="/bhakti/aarti-chalisa">{lang === 'hi' ? '← पुस्तकालय पर वापस जाएं' : '← Back to library'}</Link></div>;
  if (!c) return <SkelPage label={lang === 'hi' ? 'सामग्री लोड हो रही है' : 'Loading text'} />;

  const tabs = [['hi', 'हिन्दी', c.body_hi], ['roman', pick(lang, 'English / Roman', 'रोमन'), c.body_roman], ['mhi', pick(lang, 'Meaning (Hindi)', 'अर्थ (हिन्दी)'), c.meaning_hi], ['men', pick(lang, 'Meaning (English)', 'अर्थ (अंग्रेज़ी)'), c.meaning_en]].filter((t) => t[2]);
  const text = (tabs.find((t) => t[0] === tab) || tabs[0] || [0, 0, ''])[2];
  const tr = c.audio[track];

  return (
    <div>
      <div className="bh-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-label="Reading progress"><i style={{ width: `${progress}%` }} /></div>
      <div className="bh-sec-title">
        <div translate="no">
          <h1 className="bh-title">{pick(lang, c.title_en, c.title_hi)}</h1>
          <div className="bh-small">{c.deity ? pick(lang, c.deity.name_en, c.deity.name_hi) : (lang === 'hi' ? (c.kind === 'aarti' ? 'आरती' : c.kind === 'chalisa' ? 'चालीसा' : 'स्तोत्र') : (c.kind === 'aarti' ? 'Aarti' : c.kind === 'chalisa' ? 'Chalisa' : 'Stotra'))}</div>
        </div>
        <div className="bh-row" style={{ margin: 0 }}>
          <button type="button" className="bh-btn bh-btn-ghost" onClick={toggleFav} aria-pressed={fav}>{fav ? (lang === 'hi' ? '♥ सहेजा गया' : '♥ Saved') : (lang === 'hi' ? '♡ सहेजें' : '♡ Save')}</button>
          <button type="button" className="bh-btn bh-btn-ghost" onClick={share}>{lang === 'hi' ? 'साझा करें' : 'Share'}</button>
        </div>
      </div>
      {note && <div className="bh-msg ok" role="status">{note}</div>}
      {!c.is_verified && <div className="bh-msg" role="note">{lang === 'hi' ? 'यह पाठ अभी हमारे संपादकों द्वारा मूल स्रोत से जाँचा जा रहा है।' : 'This text has not yet been checked against its source by our editors.'}</div>}

      {c.audio.length > 0 && (
        <div className="bh-panel" style={{ marginBottom: 16 }}>
          <audio ref={audio} key={tr.url} src={tr.url} preload="none" loop={repeat} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
          <div className="bh-row" style={{ justifyContent: 'flex-start', margin: 0 }}>
            <button type="button" className="bh-btn bh-btn-maroon" onClick={playPause} aria-label={playing ? 'Pause audio' : 'Play audio'}>{playing ? (lang === 'hi' ? '⏸ रोकें' : '⏸ Pause') : (lang === 'hi' ? '▶ सुनें' : '▶ Play')}</button>
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setRepeat(!repeat)} aria-pressed={repeat}>🔁 {lang === 'hi' ? `दोहराव ${repeat ? 'चालू' : 'बंद'}` : `Repeat ${repeat ? 'on' : 'off'}`}</button>
            {c.audio.length > 1 && <select aria-label="Choose recording" value={track} onChange={(e) => { setTrack(Number(e.target.value)); setPlaying(false); }} style={{ minHeight: 44, borderRadius: 10, border: '1px solid #E8D7BA', padding: '0 10px' }}>{c.audio.map((a, i) => <option key={a.id} value={i}>{a.title}</option>)}</select>}
          </div>
          <p className="bh-small" style={{ margin: '8px 0 0' }}><span translate="no">{tr.title}</span> · {lang === 'hi' ? 'स्रोत' : 'Source'}: <span translate="no">{tr.source}</span> · {lang === 'hi' ? 'लाइसेंस' : 'Licence'}: <span translate="no">{tr.license}</span></p>
        </div>
      )}

      {(c.embeds || []).map((e) => (
        <DevotionalAudioEmbed key={e.id} embed={e} lang={lang} />
      ))}

      <div className="bh-panel">
        <div className="bh-row" style={{ justifyContent: 'space-between', margin: 0 }}>
          <div className="bh-tabs" role="tablist" aria-label="Language">
            {tabs.map(([k, l]) => <button key={k} role="tab" type="button" className="bh-tab" aria-selected={(tabs.find((t) => t[0] === tab) || tabs[0])[0] === k} onClick={() => setTab(k)}>{l}</button>)}
          </div>
          <div className="bh-row" style={{ margin: 0 }} role="group" aria-label="Text size">
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setPrefs({ ...prefs, size: Math.max(14, prefs.size - 2) })} aria-label="Smaller text">A−</button>
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setPrefs({ ...prefs, size: Math.min(40, prefs.size + 2) })} aria-label="Larger text">A+</button>
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setPrefs({ ...prefs, diya: !prefs.diya })} aria-pressed={prefs.diya} aria-label="Diya (dark) reading mode">🪔 {prefs.diya ? pick(lang, 'Diya on', 'दीया चालू') : pick(lang, 'Diya', 'दीया')}</button>
            <button type="button" className="bh-btn bh-btn-ghost" onClick={() => setScrolling(!scrolling)} aria-pressed={scrolling}>{scrolling ? (lang === 'hi' ? '⏸ रोकें' : '⏸ Pause') : (lang === 'hi' ? '↓ स्वतः स्क्रॉल' : '↓ Auto-scroll')}</button>
            {scrolling && <select aria-label="Auto-scroll speed" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ minHeight: 44, borderRadius: 10, border: '1px solid #E8D7BA', padding: '0 8px' }}>{SPEEDS.map(([en, hi], i) => <option key={en} value={i}>{pick(lang, en, hi)}</option>)}</select>}
          </div>
        </div>
        <div className={`bh-reader-box${prefs.diya ? ' diya' : ''}`}>
          <div ref={body} className="bh-reader" translate="no" style={{ fontSize: prefs.size }} lang={tab === 'hi' || tab === 'mhi' ? 'hi' : 'en'}>{text}</div>
          <p className="bh-small">{lang === 'hi' ? 'स्रोत' : 'Source'}: <span translate="no">{c.source || '—'}</span> · {lang === 'hi' ? 'लाइसेंस' : 'Licence'}: <span translate="no">{c.license || '—'}</span>{c.is_verified ? (lang === 'hi' ? ' · प्रमाणित' : ' · Verified') : ''}</p>
        </div>
      </div>

      <div className="bh-cta-card">
        <div>
          <b>{c.deity ? (lang === 'hi' ? `${c.deity.name_hi} के लिए सेवा` : `Seva for ${c.deity.name_en}`) : (lang === 'hi' ? 'सेवा और सामग्री' : 'Seva and Pooja Essentials')}</b>
          <span className="bh-small">{lang === 'hi' ? 'मंदिर में पूजा करवाएं या पवित्र पूजा सामग्री मँगवाएं।' : 'Book sacred puja or order authentic spiritual essentials.'}</span>
        </div>
        <div className="bh-cta-actions">
          <Link className="bh-btn bh-btn-maroon" to="/mandir-seva/puja" data-track="aarti_puja_book">{lang === 'hi' ? 'पूजा बुक करें' : 'Book Pooja'}</Link>
          <Link className="bh-btn bh-btn-ghost" data-track="aarti_mall" to={`/astro-mall?category=${(c.deity && MALL_FOR_DEITY[c.deity.slug]) || 'mala'}`}>{lang === 'hi' ? 'माला व सामग्री' : 'Mala & Items'}</Link>
        </div>
      </div>
    </div>
  );
}
