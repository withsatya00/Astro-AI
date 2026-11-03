import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from './bhaktiApi.js';
import { useSignedIn, openLogin } from './useJaap.js';

const lvl = (c, max) => (c <= 0 ? 0 : Math.min(4, Math.ceil((c / Math.max(max, 1)) * 4)));
const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

function Heatmap({ daily }) {
  const map = new Map(daily.map((d) => [d.day, d.count]));
  const max = Math.max(0, ...daily.map((d) => d.count));
  const cells = [];
  const today = new Date(Date.now() + 5.5 * 3600 * 1000); // IST calendar day
  today.setUTCHours(0, 0, 0, 0);
  const lead = new Date(today.getTime() - 364 * 86400000).getUTCDay(); // pad so rows line up with weekdays (Sun first)
  for (let i = 364; i >= 0; i -= 1) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const c = map.get(key) || 0;
    cells.push(<i key={key} data-l={lvl(c, max)} title={`${key}: ${c}`} />);
  }
  return <div className="bh-heat" role="img" aria-label="Jaap activity over the last year">{Array.from({ length: lead }, (_, i) => <i key={`p${i}`} style={{ visibility: 'hidden' }} />)}{cells}</div>;
}

export default function MyBhakti() {
  const signedIn = useSignedIn();
  const [a, setA] = useState(null);
  const [hist, setHist] = useState(null);
  const [err, setErr] = useState('');
  const [range, setRange] = useState('week');

  const load = useCallback(() => {
    Promise.all([api('/jaap/analytics'), api('/jaap/history?page_size=8')]).then(([x, h]) => { setA(x); setHist(h); }).catch((e) => setErr(e.message || 'Could not load your dashboard'));
  }, []);
  useEffect(() => { if (signedIn) load(); else { setA(null); setHist(null); } }, [signedIn, load]);

  const download = async () => {
    try {
      const res = await api('/jaap/report.csv', { raw: true });
      const url = URL.createObjectURL(await res.blob());
      const el = Object.assign(document.createElement('a'), { href: url, download: 'my-bhakti-report.csv' });
      document.body.appendChild(el); el.click(); el.remove(); URL.revokeObjectURL(url);
    } catch (e) { setErr('Could not download the report'); }
  };

  if (!signedIn) return <div className="bh-panel bh-signin"><h2>My Bhakti</h2><p>Sign in to see your private jaap progress. Your devotional activity is visible only to you.</p><button type="button" className="bh-btn bh-btn-maroon" onClick={openLogin}>Sign in</button></div>;
  if (err) return <div className="bh-msg" role="alert">{err}</div>;
  if (!a) return <div className="bh-panel">Loading…</div>;

  const shown = { today: a.today, week: a.week, month: a.month }[range];
  return (
    <div>
      <div className="bh-sec-title"><h2>My Bhakti (मेरी भक्ति यात्रा)</h2><button type="button" className="bh-btn bh-btn-ghost" onClick={download}>⬇ Report (CSV)</button></div>
      <div className="bh-panel">
        <div className="bh-tabs" role="tablist" aria-label="Period">
          {[['today', 'Today'], ['week', '7 days'], ['month', '30 days']].map(([k, l]) => <button key={k} role="tab" type="button" className="bh-tab" aria-selected={range === k} onClick={() => setRange(k)}>{l}</button>)}
        </div>
        <div className="bh-stats" style={{ marginTop: 14 }}>
          <div className="bh-stat"><b>{fmt(shown)}</b><span>Jaap ({range === 'today' ? 'today' : range === 'week' ? '7 days' : '30 days'})</span></div>
          <div className="bh-stat"><b>{fmt(a.lifetime)}</b><span>Lifetime jaap</span></div>
          <div className="bh-stat"><b>{fmt(a.malas)}</b><span>Malas</span></div>
        </div>
        <div className="bh-stats" style={{ marginTop: 8 }}>
          <div className="bh-stat"><b>{a.streak}</b><span>Day streak</span></div>
          <div className="bh-stat"><b>{a.best_streak}</b><span>Best streak</span></div>
          <div className="bh-stat"><b>{fmt(a.today)}</b><span>Today</span></div>
        </div>
      </div>
      <div className="bh-grid" style={{ marginTop: 16 }}>
        <div>
          <div className="bh-panel"><h3>Last 12 months</h3><Heatmap daily={a.daily} /><p className="bh-small">Days are counted in IST (Asia/Kolkata).</p></div>
          <div className="bh-panel"><h3>Recent sessions</h3>
            {hist && hist.items.length ? <ul className="bh-list">{hist.items.map((h) => <li key={h.id}><span>{h.mantra} · {h.mode}</span><b>{fmt(h.count)}</b></li>)}</ul> : <p className="bh-small">No sessions yet. <Link to="/bhakti/naam-jaap" style={{ color: '#650F23', fontWeight: 700 }}>Start your first jaap</Link>.</p>}
          </div>
        </div>
        <div>
          <div className="bh-panel"><h3>Mantra-wise</h3>
            {a.by_mantra.length ? <ul className="bh-list">{a.by_mantra.map((m) => <li key={m.mantra_id}><span>{m.mantra}</span><b>{fmt(m.count)}</b></li>)}</ul> : <p className="bh-small">Nothing counted yet.</p>}
          </div>
          <div className="bh-panel"><h3>Milestones</h3>
            <ul className="bh-list">{a.milestones.map((m) => <li key={m.at}><span>{m.reached ? '✅' : '⬜'} {m.label}</span><span className="bh-small">{fmt(m.at)}</span></li>)}</ul>
          </div>
          <div className="bh-panel"><h3>Privacy</h3><p className="bh-small">Your jaap is private to your account. There are no public rankings or leaderboards.</p></div>
        </div>
      </div>
    </div>
  );
}
