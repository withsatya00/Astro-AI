import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';
import { useLang, pick } from './lang.js';

const KINDS = [['ekadashi', 'Ekadashi', 'एकादशी'], ['purnima', 'Purnima', 'पूर्णिमा'], ['amavasya', 'Amavasya', 'अमावस्या'], ['pradosh', 'Pradosh Vrat', 'प्रदोष व्रत'], ['festival', 'Festivals', 'त्योहार']];
const PAKSHA_HI = { Shukla: 'शुक्ल', Krishna: 'कृष्ण' };
const localeFor = (lang) => (lang === 'hi' ? 'hi-IN' : 'en-IN');
const query = (loc) => (loc.key === 'custom' ? `lat=${loc.lat}&lon=${loc.lon}&tz=${loc.tz}` : `location=${loc.key}`);

function Reminders({ signedIn }) {
  const lang = useLang();
  const [prefs, setPrefs] = useState(null);
  const [up, setUp] = useState([]);
  const [err, setErr] = useState('');
  const [authLost, setAuthLost] = useState(false); // an old or invalid login: ask the person to sign in again instead of showing a raw error
  const load = useCallback(() => {
    api('/calendar/reminders').then((d) => { setPrefs(d.prefs); setAuthLost(false); }).catch((e) => { if (e.status === 401) setAuthLost(true); else setErr(e.message); });
    api('/calendar/reminders/upcoming').then((d) => setUp(d.items)).catch(() => setUp([]));
  }, []);
  useEffect(() => { if (signedIn) load(); }, [signedIn, load]);

  if (!signedIn || authLost) return <div className="bh-panel"><h3>{lang === 'hi' ? 'स्मरण पत्र' : 'Reminders'}</h3><p className="bh-small">{lang === 'hi' ? 'पर्व और व्रतों के स्मरण के लिए साइन इन करें।' : 'Sign in to choose what you want to be reminded about.'}</p><button type="button" className="bh-btn bh-btn-maroon" onClick={openLogin}>{lang === 'hi' ? 'साइन इन करें' : 'Sign in'}</button></div>;
  const save = async (p, patch) => {
    const next = { ...p, ...patch };
    setPrefs((cur) => cur.map((x) => (x.kind === p.kind ? next : x)));
    try { await api('/calendar/reminders', { method: 'PUT', body: next }); load(); } catch (e) { setErr(e.message || 'Could not save'); load(); }
  };
  return (
    <div className="bh-panel">
      <h3>{lang === 'hi' ? 'स्मरण पत्र' : 'Reminders'}</h3>
      <p className="bh-small" style={{ marginTop: 0 }}>{lang === 'hi' ? 'चुनें कि आपको कितने दिन पहले स्मरण चाहिए। यह विवरण केवल आपके लिए सुरक्षित है।' : 'Choose what to be reminded of and how many days before. Reminders show here and are private to you.'}</p>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {prefs && (
        <ul className="bh-list">
          {prefs.map((p) => (
            <li key={p.kind}>
              <label className="bh-admin-check" style={{ minHeight: 36 }}><input type="checkbox" checked={p.enabled} onChange={(e) => save(p, { enabled: e.target.checked })} /> {pick(lang, KINDS.find((k) => k[0] === p.kind)[1], KINDS.find((k) => k[0] === p.kind)[2])}</label>
              <select aria-label={`${p.kind} reminder lead time`} value={p.lead_days} disabled={!p.enabled} onChange={(e) => save(p, { lead_days: Number(e.target.value) })} style={{ minHeight: 36, borderRadius: 8, border: '1px solid #E8D7BA' }}>
                <option value={0}>{lang === 'hi' ? 'उसी दिन' : 'On the day'}</option><option value={1}>{lang === 'hi' ? '1 दिन पहले' : '1 day before'}</option><option value={2}>{lang === 'hi' ? '2 दिन पहले' : '2 days before'}</option><option value={3}>{lang === 'hi' ? '3 दिन पहले' : '3 days before'}</option>
              </select>
            </li>
          ))}
        </ul>
      )}
      {up.length > 0 && (
        <>
          <h3 style={{ marginTop: 14 }}>{lang === 'hi' ? 'आगामी पर्व' : 'Coming up for you'}</h3>
          <ul className="bh-list">
            {up.slice(0, 6).map((i, k) => <li key={k}><span><b>{i.name}</b><span className="bh-small" style={{ display: 'block' }}>{i.weekday}, {i.date} · {i.days_to_remind === 0 ? (lang === 'hi' ? 'आज' : 'today') : (lang === 'hi' ? `${i.days_to_remind} दिन में` : `in ${i.days_to_remind} day(s)`)}</span></span></li>)}
          </ul>
        </>
      )}
    </div>
  );
}

export default function Festivals() {
  const now = new Date();
  const lang = useLang();
  const locale = localeFor(lang);
  const monthLong = (m) => new Date(2000, m, 1).toLocaleString(locale, { month: 'long' });
  const monthShort = (m) => new Date(2000, m, 1).toLocaleString(locale, { month: 'short' });
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2023, 0, 1 + i).toLocaleString(locale, { weekday: 'short' })); // 1 Jan 2023 was a Sunday
  const paksha = (p) => (lang === 'hi' ? (PAKSHA_HI[p] || p) : p);
  const signedIn = useSignedIn();
  const [locs, setLocs] = useState([]);
  const [loc, setLoc] = useState({ key: 'delhi', lat: '', lon: '', tz: '5.5' });
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [sel, setSel] = useState(null);

  useEffect(() => { api('/calendar/locations').then(setLocs).catch(() => {}); }, []);
  const custom = loc.key === 'custom';
  const ready = !custom || (loc.lat !== '' && loc.lon !== '' && loc.tz !== '');

  useEffect(() => {
    if (!ready) return undefined;
    let alive = true;
    setErr('');
    api(`/calendar/month?year=${ym.y}&month=${ym.m}&${query(loc)}`).then((d) => {
      if (!alive) return;
      setData(d);
      const today = new Date().toISOString().slice(0, 10);
      setSel((cur) => (cur && d.days.some((x) => x.date === cur) ? cur : (d.days.find((x) => x.date === today) || d.days[0]).date));
    }).catch((e) => { if (alive) { setErr(e.message || 'Could not load the calendar'); setData(null); } });
    return () => { alive = false; };
  }, [ym, loc.key, loc.lat, loc.lon, loc.tz, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const move = (delta) => setYm(({ y, m }) => { const t = y * 12 + (m - 1) + delta; return { y: Math.floor(t / 12), m: (t % 12) + 1 }; });
  const day = data && data.days.find((d) => d.date === sel);
  const lead = data ? new Date(`${data.days[0].date}T00:00:00`).getDay() : 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  const highlights = useMemo(() => (data ? data.days.filter((d) => d.festivals.length || d.observances.length) : []), [data]);

  return (
    <div>
      <div className="bh-sec-title"><h1 className="bh-title">{lang === 'hi' ? 'त्योहार और व्रत' : 'Festivals & Vrats'}</h1></div>
      <div className="bh-panel">
        <div className="bh-form">
          <label>{pick(lang, 'Place', 'स्थान')}
            <select value={loc.key} onChange={(e) => setLoc({ ...loc, key: e.target.value })}>
              {locs.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
              <option value="custom">{lang === 'hi' ? 'अन्य स्थान (निर्देशांक दर्ज करें)…' : 'Other place (enter coordinates)…'}</option>
            </select>
          </label>
          {custom && (
            <>
              <label>{lang === 'hi' ? 'अक्षांश (Latitude)' : 'Latitude'}<input type="number" step="0.01" value={loc.lat} onChange={(e) => setLoc({ ...loc, lat: e.target.value })} placeholder="e.g. 26.85" /></label>
              <label>{lang === 'hi' ? 'देशांतर (Longitude)' : 'Longitude'}<input type="number" step="0.01" value={loc.lon} onChange={(e) => setLoc({ ...loc, lon: e.target.value })} placeholder="e.g. 80.95" /></label>
              <label>{lang === 'hi' ? 'समय क्षेत्र (UTC Offset)' : 'UTC offset (hours)'}<input type="number" step="0.25" value={loc.tz} onChange={(e) => setLoc({ ...loc, tz: e.target.value })} /></label>
            </>
          )}
        </div>
      </div>

      <div className="bh-sec-title" style={{ marginBottom: 8 }}>
        <button type="button" className="bh-btn bh-btn-ghost" onClick={() => move(-1)} aria-label="Previous month">‹</button>
        <h2 style={{ fontSize: 20 }}>{monthLong(ym.m - 1)} {ym.y}</h2>
        <button type="button" className="bh-btn bh-btn-ghost" onClick={() => move(1)} aria-label="Next month">›</button>
      </div>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {!data && !err && <div className="bh-panel" role="status" aria-label="Calculating calendar"><div className="bh-cal">{Array.from({ length: 35 }, (_, i) => <span key={i} className="bh-skel" style={{ height: 52, borderRadius: 10 }} />)}</div></div>}

      {data && (
        <div className="bh-grid">
          <div>
            <div className="bh-cal" role="grid" aria-label={`${monthLong(ym.m - 1)} ${ym.y}`}>
              {weekdays.map((w, i) => <div key={i} className="bh-cal-h" role="columnheader">{w}</div>)}
              {Array.from({ length: lead }, (_, i) => <div key={`p${i}`} />)}
              {data.days.map((d) => (
                <button key={d.date} type="button" role="gridcell" className={`bh-cal-d${d.date === sel ? ' sel' : ''}${d.date === todayStr ? ' today' : ''}`} onClick={() => setSel(d.date)}
                  aria-label={`${d.date}, ${paksha(d.tithi.paksha)} ${pick(lang, d.tithi.name_en, d.tithi.name_hi)}${d.festivals.length ? `, ${d.festivals.map((f) => pick(lang, f.name_en, f.name_hi)).join(', ')}` : ''}`}>
                  <b>{Number(d.date.slice(8))}</b>
                  <span>{lang === 'hi' ? d.tithi.name_hi : d.tithi.name_en.slice(0, 5)}</span>
                  <i>{d.festivals.length ? <em className="f" /> : null}{d.observances.length ? <em className="o" /> : null}</i>
                </button>
              ))}
            </div>
            <p className="bh-small"><em className="bh-dot f" /> {pick(lang, 'festival', 'त्योहार')} &nbsp; <em className="bh-dot o" /> {pick(lang, 'monthly vrat', 'मासिक व्रत')} &nbsp; · {pick(lang, 'The tithi shown is the one at sunrise.', 'दिखाई गई तिथि सूर्योदय के समय की तिथि है।')}</p>

            {day && (
              <div className="bh-panel" aria-live="polite">
                <h3>{new Date(`${day.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'long' })}, {day.date}</h3>
                <p className="bh-small" style={{ margin: '0 0 8px' }}>
                  {paksha(day.tithi.paksha)} {pick(lang, day.tithi.name_en, day.tithi.name_hi)} · {pick(lang, day.lunar_month, day.lunar_month_hi)}{day.adhika ? (lang === 'hi' ? ' · अधिक मास' : ' · Adhika (extra) month') : ''} · {lang === 'hi' ? 'सूर्योदय' : 'Sunrise'} {day.sunrise} · {lang === 'hi' ? 'सूर्यास्त' : 'Sunset'} {day.sunset}
                </p>
                {day.festivals.length === 0 && day.observances.length === 0 && <p className="bh-small" style={{ margin: 0 }}>{lang === 'hi' ? 'इस दिन कोई विशेष त्योहार या व्रत नहीं है।' : 'No festival or vrat on this day.'}</p>}
                {day.festivals.map((f) => (
                  <div key={f.slug} className="bh-fest">
                    <b>{pick(lang, f.name_en, f.name_hi)}</b>
                    <span className={`bh-badge ${f.status === 'confirmed' ? 'on' : ''}`} style={{ marginLeft: 8 }}>{f.status === 'confirmed' ? (lang === 'hi' ? 'पुष्ट' : 'Confirmed') : (lang === 'hi' ? 'गणना' : 'Computed')}</span>
                    {f.rule && <div className="bh-small">{lang === 'hi' ? 'नियम:' : 'Rule used:'} <span translate="no">{f.rule}</span></div>}
                    {f.computed_date && <div className="bh-small">{lang === 'hi' ? 'गणना के अनुसार:' : 'Our calculation gave'} <span translate="no">{f.computed_date}</span></div>}
                    {f.note && <div className="bh-small" translate="no">{f.note}</div>}
                    {f.source && <div className="bh-small">{lang === 'hi' ? 'स्रोत:' : 'Source:'} <span translate="no">{f.source}</span></div>}
                  </div>
                ))}
                {day.observances.map((o, i) => (
                  <div key={i} className="bh-fest"><b>{pick(lang, o.name_en, o.name_hi)}</b>{o.approx ? <span className="bh-small">{lang === 'hi' ? ' · अनुमानित' : ' · approximate'}</span> : null}<div className="bh-small" translate="no">{o.detail}</div></div>
                ))}
                {(day.festivals.length > 0 || day.observances.length > 0) && (
                  <div className="bh-cta-card" style={{ marginTop: 10 }}>
                    <div><b>{lang === 'hi' ? 'इस पावन दिन की सेवा' : 'Sacred Seva for this day'}</b><span className="bh-small">{lang === 'hi' ? 'पर्व पर मंदिर में पूजा व चढ़ावा अर्पित करें या पुण्य गौ सेवा करें।' : 'Offer temple puja, chadhava, or sacred cow seva on this auspicious day.'}</span></div>
                    <div className="bh-cta-actions">
                      <Link className="bh-btn bh-btn-maroon" to="/mandir-seva/chadhava" data-track="festival_chadhava">{lang === 'hi' ? 'चढ़ावा' : 'Chadhava'}</Link>
                      <Link className="bh-btn bh-btn-ghost" to="/mandir-seva/puja" data-track="festival_puja">{lang === 'hi' ? 'पूजा बुक करें' : 'Book Pooja'}</Link>
                      <Link className="bh-btn bh-btn-ghost" to="/gau-sewa" data-track="festival_gau_sewa">{lang === 'hi' ? 'गौ सेवा दान' : 'Gau Sewa'}</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside>
            <div className="bh-panel">
              <h3>{lang === 'hi' ? 'इस माह के मुख्य पर्व' : 'This month'}</h3>
              {highlights.length === 0 ? <p className="bh-small">Nothing listed.</p> : (
                <ul className="bh-list">
                  {highlights.map((d) => (
                    <li key={d.date}><button type="button" className="bh-link" onClick={() => setSel(d.date)}>{d.date.slice(8)} {monthShort(ym.m - 1)}</button>
                      <span style={{ textAlign: 'right' }}>{[...d.festivals.map((f) => pick(lang, f.name_en, f.name_hi)), ...d.observances.map((o) => pick(lang, o.name_en, o.name_hi))].join(', ')}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <Reminders signedIn={signedIn} />
            <div className="bh-panel">
              <h3>How these dates are worked out</h3>
              <p className="bh-small" style={{ margin: 0 }} translate="no">{data.assumptions}</p>
              <p className="bh-small" style={{ marginBottom: 0 }}>Place: <span translate="no">{data.location.label} ({data.location.timezone})</span> · Ayanamsa: <span translate="no">{data.ayanamsa}</span> · Months: <span translate="no">{data.month_system}</span>. Please confirm the exact muhurat with your local panchang or priest.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
