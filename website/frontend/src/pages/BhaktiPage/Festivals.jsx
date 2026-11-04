import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const KINDS = [['ekadashi', 'Ekadashi'], ['purnima', 'Purnima'], ['amavasya', 'Amavasya'], ['pradosh', 'Pradosh Vrat'], ['festival', 'Festivals']];
const query = (loc) => (loc.key === 'custom' ? `lat=${loc.lat}&lon=${loc.lon}&tz=${loc.tz}` : `location=${loc.key}`);

function Reminders({ signedIn }) {
  const [prefs, setPrefs] = useState(null);
  const [up, setUp] = useState([]);
  const [err, setErr] = useState('');
  const [authLost, setAuthLost] = useState(false); // an old or invalid login: ask the person to sign in again instead of showing a raw error
  const load = useCallback(() => {
    api('/calendar/reminders').then((d) => { setPrefs(d.prefs); setAuthLost(false); }).catch((e) => { if (e.status === 401) setAuthLost(true); else setErr(e.message); });
    api('/calendar/reminders/upcoming').then((d) => setUp(d.items)).catch(() => setUp([]));
  }, []);
  useEffect(() => { if (signedIn) load(); }, [signedIn, load]);

  if (!signedIn || authLost) return <div className="bh-panel"><h3>Reminders</h3><p className="bh-small">Sign in to choose what you want to be reminded about.</p><button type="button" className="bh-btn bh-btn-maroon" onClick={openLogin}>Sign in</button></div>;
  const save = async (p, patch) => {
    const next = { ...p, ...patch };
    setPrefs((cur) => cur.map((x) => (x.kind === p.kind ? next : x)));
    try { await api('/calendar/reminders', { method: 'PUT', body: next }); load(); } catch (e) { setErr(e.message || 'Could not save'); load(); }
  };
  return (
    <div className="bh-panel">
      <h3>Reminders</h3>
      <p className="bh-small" style={{ marginTop: 0 }}>Choose what to be reminded of and how many days before. Reminders show here and are private to you. They are not sent as phone notifications yet.</p>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {prefs && (
        <ul className="bh-list">
          {prefs.map((p) => (
            <li key={p.kind}>
              <label className="bh-admin-check" style={{ minHeight: 36 }}><input type="checkbox" checked={p.enabled} onChange={(e) => save(p, { enabled: e.target.checked })} /> {KINDS.find((k) => k[0] === p.kind)[1]}</label>
              <select aria-label={`${p.kind} reminder lead time`} value={p.lead_days} disabled={!p.enabled} onChange={(e) => save(p, { lead_days: Number(e.target.value) })} style={{ minHeight: 36, borderRadius: 8, border: '1px solid #E8D7BA' }}>
                <option value={0}>On the day</option><option value={1}>1 day before</option><option value={2}>2 days before</option><option value={3}>3 days before</option>
              </select>
            </li>
          ))}
        </ul>
      )}
      {up.length > 0 && (
        <>
          <h3 style={{ marginTop: 14 }}>Coming up for you</h3>
          <ul className="bh-list">
            {up.slice(0, 6).map((i, k) => <li key={k}><span><b>{i.name}</b><span className="bh-small" style={{ display: 'block' }}>{i.weekday}, {i.date} · remind {i.days_to_remind === 0 ? 'today' : `in ${i.days_to_remind} day(s)`}</span></span></li>)}
          </ul>
        </>
      )}
    </div>
  );
}

export default function Festivals() {
  const now = new Date();
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
      <div className="bh-sec-title"><h2>Festivals &amp; Vrat (त्योहार और व्रत)</h2></div>
      <div className="bh-panel">
        <div className="bh-form">
          <label>Place
            <select value={loc.key} onChange={(e) => setLoc({ ...loc, key: e.target.value })}>
              {locs.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
              <option value="custom">Other place (enter coordinates)…</option>
            </select>
          </label>
          {custom && (
            <>
              <label>Latitude<input type="number" step="0.01" value={loc.lat} onChange={(e) => setLoc({ ...loc, lat: e.target.value })} placeholder="e.g. 26.85" /></label>
              <label>Longitude<input type="number" step="0.01" value={loc.lon} onChange={(e) => setLoc({ ...loc, lon: e.target.value })} placeholder="e.g. 80.95" /></label>
              <label>UTC offset (hours)<input type="number" step="0.25" value={loc.tz} onChange={(e) => setLoc({ ...loc, tz: e.target.value })} /></label>
            </>
          )}
        </div>
      </div>

      <div className="bh-sec-title" style={{ marginBottom: 8 }}>
        <button type="button" className="bh-btn bh-btn-ghost" onClick={() => move(-1)} aria-label="Previous month">‹</button>
        <h2 style={{ fontSize: 20 }}>{MONTHS[ym.m - 1]} {ym.y}</h2>
        <button type="button" className="bh-btn bh-btn-ghost" onClick={() => move(1)} aria-label="Next month">›</button>
      </div>
      {err && <div className="bh-msg" role="alert">{err}</div>}
      {!data && !err && <div className="bh-panel" role="status" aria-label="Calculating calendar"><div className="bh-cal">{Array.from({ length: 35 }, (_, i) => <span key={i} className="bh-skel" style={{ height: 52, borderRadius: 10 }} />)}</div></div>}

      {data && (
        <div className="bh-grid">
          <div>
            <div className="bh-cal" role="grid" aria-label={`${MONTHS[ym.m - 1]} ${ym.y}`}>
              {WEEK.map((w) => <div key={w} className="bh-cal-h" role="columnheader">{w}</div>)}
              {Array.from({ length: lead }, (_, i) => <div key={`p${i}`} />)}
              {data.days.map((d) => (
                <button key={d.date} type="button" role="gridcell" className={`bh-cal-d${d.date === sel ? ' sel' : ''}${d.date === todayStr ? ' today' : ''}`} onClick={() => setSel(d.date)}
                  aria-label={`${d.date}, ${d.tithi.paksha} ${d.tithi.name_en}${d.festivals.length ? `, ${d.festivals.map((f) => f.name_en).join(', ')}` : ''}`}>
                  <b>{Number(d.date.slice(8))}</b>
                  <span>{d.tithi.name_en.slice(0, 5)}</span>
                  <i>{d.festivals.length ? <em className="f" /> : null}{d.observances.length ? <em className="o" /> : null}</i>
                </button>
              ))}
            </div>
            <p className="bh-small"><em className="bh-dot f" /> festival &nbsp; <em className="bh-dot o" /> monthly vrat &nbsp; · The tithi shown is the one at sunrise.</p>

            {day && (
              <div className="bh-panel" aria-live="polite">
                <h3>{day.weekday}, {day.date}</h3>
                <p className="bh-small" style={{ margin: '0 0 8px' }}>
                  {day.tithi.paksha} {day.tithi.name_en} ({day.tithi.name_hi}) · {day.lunar_month} ({day.lunar_month_hi}){day.adhika ? ' · Adhika (extra) month' : ''} · Sunrise {day.sunrise} · Sunset {day.sunset}
                </p>
                {day.festivals.length === 0 && day.observances.length === 0 && <p className="bh-small" style={{ margin: 0 }}>No festival or vrat on this day.</p>}
                {day.festivals.map((f) => (
                  <div key={f.slug} className="bh-fest">
                    <b>{f.name_en}</b> <span className="bh-small">({f.name_hi})</span>
                    <span className={`bh-badge ${f.status === 'confirmed' ? 'on' : ''}`} style={{ marginLeft: 8 }}>{f.status === 'confirmed' ? 'Confirmed' : 'Computed'}</span>
                    {f.rule && <div className="bh-small">Rule used: {f.rule}</div>}
                    {f.computed_date && <div className="bh-small">Our calculation gave {f.computed_date}; the confirmed date is used.</div>}
                    {f.note && <div className="bh-small">{f.note}</div>}
                    {f.source && <div className="bh-small">Source: {f.source}</div>}
                  </div>
                ))}
                {day.observances.map((o, i) => (
                  <div key={i} className="bh-fest"><b>{o.name_en}</b> <span className="bh-small">({o.name_hi}){o.approx ? ' · approximate' : ''}</span><div className="bh-small">{o.detail}</div></div>
                ))}
                {(day.festivals.length > 0 || day.observances.length > 0) && (
                  <div className="bh-cta-card" style={{ marginTop: 10 }}>
                    <div><b>Is din ki seva</b><span className="bh-small">Parv par mandir me puja ya chadhava arpit karein, ya daan karein.</span></div>
                    <div className="bh-cta-actions">
                      <Link className="bh-btn bh-btn-maroon" to="/mandir-seva/chadhava">Chadhava</Link>
                      <Link className="bh-btn bh-btn-ghost" to="/mandir-seva/puja">Puja book</Link>
                      <Link className="bh-btn bh-btn-ghost" to="/gau-sewa">Gau Sewa daan</Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <aside>
            <div className="bh-panel">
              <h3>This month</h3>
              {highlights.length === 0 ? <p className="bh-small">Nothing listed.</p> : (
                <ul className="bh-list">
                  {highlights.map((d) => (
                    <li key={d.date}><button type="button" className="bh-link" onClick={() => setSel(d.date)}>{d.date.slice(8)} {MONTHS[ym.m - 1].slice(0, 3)}</button>
                      <span style={{ textAlign: 'right' }}>{[...d.festivals.map((f) => f.name_en), ...d.observances.map((o) => o.name_en)].join(', ')}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <Reminders signedIn={signedIn} />
            <div className="bh-panel">
              <h3>How these dates are worked out</h3>
              <p className="bh-small" style={{ margin: 0 }}>{data.assumptions}</p>
              <p className="bh-small" style={{ marginBottom: 0 }}>Place: {data.location.label} ({data.location.timezone}) · Ayanamsa: {data.ayanamsa} · Months: {data.month_system}. Please confirm the exact muhurat with your local panchang or priest.</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
