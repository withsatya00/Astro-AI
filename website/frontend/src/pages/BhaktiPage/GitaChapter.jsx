import React, { useEffect, useState } from 'react';
import { markRitual } from './dailyRitual.js';
import { usePageMeta } from './usePageMeta.js';
import { SkelPage } from './Skeleton.jsx';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';
import { useLang, pick } from './lang.js';

const PREF_KEY = 'bhakti_reader_prefs_v1';
const loadSize = () => { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}').size || 22; } catch (e) { return 22; } };

export default function GitaChapter() {
  const { chapter } = useParams();
  const n = Number(chapter);
  const nav = useNavigate();
  const { hash } = useLocation();
  const signedIn = useSignedIn();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [size, setSize] = useState(loadSize);
  const site = useLang();
  const [lang, setLang] = useState(site); // the meaning language starts as the site language
  useEffect(() => { setLang(site); }, [site]);
  const [note, setNote] = useState('');

  useEffect(() => {
    setData(null); setErr('');
    if (!Number.isInteger(n) || n < 1 || n > 18) { setErr('There are 18 chapters. Please choose one from 1 to 18.'); return; }
    api(`/gita/chapters/${n}`).then((d) => { setData(d); markRitual('gita'); }).catch((e) => setErr(e instanceof ApiError && e.status === 404 ? 'Chapter not found.' : (e.message || 'Could not load')));
  }, [n, signedIn]);

  useEffect(() => {
    if (!data || !hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) el.scrollIntoView({ block: 'center' });
  }, [data, hash]);

  const resize = (d) => { const s = Math.max(14, Math.min(40, size + d)); setSize(s); try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}'), size: s })); } catch (e) { /* ignore */ } };

  const toggle = async (v, kind) => {
    if (!signedIn) { openLogin(); return; }
    const on = kind === 'bookmark' ? v.bookmarked : v.read;
    try {
      await api(`/gita/${kind === 'bookmark' ? 'bookmarks' : 'read'}/${v.id}`, { method: on ? 'DELETE' : 'PUT' });
      setData((d) => ({ ...d, verses: d.verses.map((x) => (x.id === v.id ? { ...x, [kind === 'bookmark' ? 'bookmarked' : 'read']: !on } : x)) }));
    } catch (e) { setNote(e.message || 'Could not save'); }
  };

  usePageMeta(data && `Bhagavad Gita Chapter ${data.number}: ${data.name_en}`, data && data.summary_en);
  if (err) return <div className="bh-panel bh-signin"><h1 className="bh-title">{err}</h1><Link className="bh-btn bh-btn-maroon" to="/bhakti/bhagavad-gita">{site === 'hi' ? 'सभी अध्याय' : 'All chapters'}</Link></div>;
  if (!data) return <SkelPage label={site === 'hi' ? 'अध्याय लोड हो रहा है' : 'Loading chapter'} />;

  const readCount = data.verses.filter((v) => v.read).length;
  return (
    <div>
      <div className="bh-sec-title">
        <div translate="no"><h1 className="bh-title">{data.number}. {pick(site, data.name_en, data.name_hi)}</h1><div className="bh-small">{site === 'hi' ? `${data.verse_count} में से ${data.verses.length} श्लोक प्रकाशित` : `${data.verses.length} of ${data.verse_count} verses published`}</div></div>
        <div className="bh-row" style={{ margin: 0 }}>
          <button type="button" className="bh-btn bh-btn-ghost" onClick={() => resize(-2)} aria-label="Smaller text">A−</button>
          <button type="button" className="bh-btn bh-btn-ghost" onClick={() => resize(2)} aria-label="Larger text">A+</button>
        </div>
      </div>
      <p className="bh-small" translate="no">{pick(site, data.summary_en, data.summary_hi)}</p>
      {signedIn && data.verses.length > 0 && <><div className="bh-bar" aria-hidden="true"><i style={{ width: `${(readCount / data.verses.length) * 100}%` }} /></div><p className="bh-small">{site === 'hi' ? `${data.verses.length} में से ${readCount} प्रकाशित श्लोक पढ़े गए` : `${readCount} of ${data.verses.length} published verses read`}</p></>}
      {note && <div className="bh-msg" role="alert">{note}</div>}
      <div className="bh-tabs" role="tablist" aria-label="Meaning language" style={{ margin: '10px 0' }}>
        {[['en', 'English'], ['hi', 'हिन्दी']].map(([k, l]) => <button key={k} role="tab" type="button" className="bh-tab" aria-selected={lang === k} onClick={() => setLang(k)}>{l}</button>)}
      </div>

      {data.verses.length === 0 && <div className="bh-panel bh-signin"><p>{site === 'hi' ? 'इस अध्याय के कोई श्लोक अभी प्रकाशित नहीं हैं।' : 'No verses from this chapter are published yet.'}</p></div>}
      {data.verses.map((v) => (
        <article key={v.id} id={`v${v.verse}`} className="bh-panel">
          <div className="bh-sec-title" style={{ margin: '0 0 6px' }}><h3>{v.chapter}.{v.verse}</h3>
            <div className="bh-row" style={{ margin: 0 }}>
              <button type="button" className="bh-btn bh-btn-ghost" aria-pressed={!!v.bookmarked} onClick={() => toggle(v, 'bookmark')}>{v.bookmarked ? (site === 'hi' ? '♥ सहेजा गया' : '♥ Saved') : (site === 'hi' ? '♡ सहेजें' : '♡ Save')}</button>
              <button type="button" className="bh-btn bh-btn-ghost" aria-pressed={!!v.read} onClick={() => toggle(v, 'read')}>{v.read ? (site === 'hi' ? '✓ पढ़ा गया' : '✓ Read') : (site === 'hi' ? 'पढ़ा हुआ चिन्हित करें' : 'Mark read')}</button>
            </div>
          </div>
          <div className="bh-reader" lang="sa" translate="no" style={{ fontSize: size, margin: '6px 0' }}>{v.text_sa}</div>
          {v.transliteration && <p className="bh-small" translate="no" style={{ whiteSpace: 'pre-line', fontStyle: 'italic' }}>{v.transliteration}</p>}
          <p style={{ fontSize: Math.max(14, size - 6), lineHeight: 1.7, margin: '8px 0' }} lang={lang === 'hi' ? 'hi' : 'en'} translate="no">{lang === 'hi' ? v.meaning_hi : v.meaning_en}</p>
          <p className="bh-small">{site === 'hi' ? 'स्रोत' : 'Source'}: <span translate="no">{v.source}</span> · {site === 'hi' ? 'लाइसेंस' : 'Licence'}: <span translate="no">{v.license}</span>{v.is_verified ? (site === 'hi' ? ' · प्रमाणित' : ' · Verified') : (site === 'hi' ? ' · समीक्षाधीन' : ' · Under review')}</p>
        </article>
      ))}
      <div className="bh-row">
        <button type="button" className="bh-btn bh-btn-ghost" disabled={n <= 1} onClick={() => nav(`/bhakti/bhagavad-gita/${n - 1}`)}>{site === 'hi' ? `← अध्याय ${n - 1}` : `← Chapter ${n - 1}`}</button>
        <Link className="bh-btn bh-btn-ghost" to="/bhakti/bhagavad-gita">{site === 'hi' ? 'सभी अध्याय' : 'All chapters'}</Link>
        <button type="button" className="bh-btn bh-btn-ghost" disabled={n >= 18} onClick={() => nav(`/bhakti/bhagavad-gita/${n + 1}`)}>{site === 'hi' ? `अध्याय ${n + 1} →` : `Chapter ${n + 1} →`}</button>
      </div>
    </div>
  );
}
