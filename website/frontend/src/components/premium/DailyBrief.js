// Personalised daily brief shown at the top of the account overview.
import { api, esc, isSignedIn } from '../../utils/shop.js';
import { px, bilingual, pxLang } from '../../utils/premium-copy.js';

const C = 2 * Math.PI * 48;                       // ring circumference for r = 48
const level = (score) => (score >= 78 ? 'excellent' : score >= 62 ? 'good' : score >= 46 ? 'balanced' : 'gentle');
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString(pxLang() === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: 'numeric' }); } catch (e) { return iso; } };
const dayLabel = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(pxLang() === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

export const DailyBrief = {
  async mount(el) {
    if (!el || !isSignedIn()) return;
    el.innerHTML = '<div class="pf-skeleton" aria-hidden="true"></div>';
    const token = this._token = (this._token || 0) + 1;
    try {
      const data = await api('/api/v1/experience/daily-brief');
      if (token !== this._token || !el.isConnected) return;
      el.innerHTML = this.render(data);
      const fg = el.querySelector('.pf-ring-fg');
      if (fg) requestAnimationFrame(() => { fg.style.strokeDashoffset = String(C * (1 - data.score / 100)); });
    } catch (e) {
      el.innerHTML = '';   // the rest of the account page works without the brief
    }
  },

  render(d) {
    const p = d.panchang;
    const hi = pxLang() === 'hi';
    const deity = hi ? d.deity.hi : d.deity.en;
    const rem = d.remedies_due > 0
      ? `<span class="pf-chip pf-chip--warn" style="background:#ffffff14;color:#fcd34d;border-color:#ffffff30">${esc(px('brief.due', { n: d.remedies_due }))}</span>`
      : `<span class="pf-note">${esc(px('brief.allDone'))}</span>`;
    const footer = `<div class="pf-brief-foot">${rem}<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="pf-note">${esc(px('brief.note'))}</span>
      <button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-dashboard-tab="remedies">${esc(px('brief.openTracker'))}</button></div></div>`;

    if (!d.has_profile) {
      return `<section class="pf-brief pf-brief--empty" aria-label="${esc(px('brief.title'))}"><span class="pf-eyebrow">${esc(px('brief.eyebrow'))}</span>
        <h2>${esc(px('brief.noProfileTitle'))}</h2><p>${esc(px('brief.noProfileBody'))}</p>
        <div class="pf-signals" style="margin-top:18px">${this.signal(px('brief.tithi'), bilingual(p.tithi), bilingual(p.paksha))}${this.signal(px('brief.nakshatra'), p.nakshatra)}
          ${this.signal(px('brief.window'), p.abhijit.start + ' – ' + p.abhijit.end)}${this.signal(px('brief.avoid'), p.rahu_kaal.start + ' – ' + p.rahu_kaal.end)}</div>
        <div class="pf-brief-foot"><button type="button" class="shop-btn shop-btn--gold" data-dashboard-profile>${esc(px('brief.addBirth'))}</button><span class="pf-note">${esc(px('brief.note'))}</span></div></section>`;
    }

    const ch = d.chandra_bala, ta = d.tara_bala, ds = d.dasha;
    const sign = hi ? d.profile.moon_sign_hi : d.profile.moon_sign;
    const lv = level(d.score);
    const sade = d.sade_sati.active ? px('brief.sade') : d.sade_sati.dhaiya ? px('brief.dhaiya') : '';
    const focus = ['career', 'love', 'finance', 'health'].map(k => `<div><b>${esc(px('brief.' + k))}</b>${esc(d.focus[k])}</div>`).join('');
    return `<section class="pf-brief" aria-label="${esc(px('brief.title'))}">
      <div class="pf-brief-top"><div><span class="pf-eyebrow">${esc(px('brief.eyebrow'))} · ${esc(dayLabel(d.date))}</span><h2>${esc(px('brief.title'))}</h2>
        <p class="pf-brief-sub">${esc(px('brief.for', { name: d.profile.name, sign }))}</p>${sade ? `<p class="pf-brief-sub" style="margin-top:6px;color:#fcd34d">${esc(sade)}</p>` : ''}</div>
        <div class="pf-ring" role="img" aria-label="${esc(px('brief.energy'))} ${d.score} / 100"><svg viewBox="0 0 112 112"><circle class="pf-ring-bg" cx="56" cy="56" r="48"/>
          <circle class="pf-ring-fg" cx="56" cy="56" r="48" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg>
          <div class="pf-ring-label"><strong>${d.score}</strong><small>${esc(px('brief.l.' + lv))}</small></div></div></div>
      <div class="pf-signals">
        ${this.signal(px('brief.tithi'), bilingual(p.tithi), bilingual(p.paksha))}
        ${this.signal(px('brief.nakshatra'), p.nakshatra)}
        ${ch ? this.signal(px('brief.chandra'), px(ch.favourable ? 'brief.favourable' : 'brief.caution'), px('brief.house', { n: ch.house }), ch.favourable ? 'ok' : 'warn') : ''}
        ${ta ? this.signal(px('brief.tara'), px(ta.favourable ? 'brief.favourable' : 'brief.caution'), ta.name, ta.favourable ? 'ok' : 'warn') : ''}
      </div>
      <div class="pf-brief-grid">
        <div class="pf-mini"><h4>${esc(px('brief.window'))}</h4><p><b>${esc(p.abhijit.start)} – ${esc(p.abhijit.end)}</b> · Abhijit<br>${esc(px('brief.lucky'))}: ${esc(d.lucky.time)}</p></div>
        <div class="pf-mini"><h4>${esc(px('brief.avoid'))}</h4><p><b>${esc(p.rahu_kaal.start)} – ${esc(p.rahu_kaal.end)}</b> · Rahu Kaal<br>${esc(px('brief.colour'))}: ${esc(d.lucky.color)} · ${esc(px('brief.number'))}: ${esc(d.lucky.number)}</p></div>
        <div class="pf-mini"><h4>${esc(px('brief.seva'))}</h4><p>${esc(deity)}<br><a href="/mandir-seva/${esc(d.deity.temple_slug)}" data-nav-link>${esc(px('brief.sevaBtn'))} →</a></p></div>
      </div>
      ${ds ? `<p class="pf-brief-sub" style="margin:14px 0 0;position:relative;z-index:1">${esc(px('brief.dasha'))}: <b>${esc(px('brief.dashaLine', { planet: ds.planet, date: fmtDate(ds.end) }))}</b></p>` : ''}
      <div class="pf-focus">${focus}</div>${footer}</section>`;
  },

  signal(label, value, sub = '', tone = '') {
    return `<div class="pf-signal ${tone ? 'pf-signal--' + tone : ''}"><small>${esc(label)}</small><b>${esc(value)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}</div>`;
  }
};
