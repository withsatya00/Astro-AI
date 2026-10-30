// Remedies tracker: follow mantras, fasts, donations and gemstone advice with daily / weekly check-ins and streaks.
import { api, esc, postJson, toast } from '../../utils/shop.js';
import { px } from '../../utils/premium-copy.js';

const KINDS = ['mantra', 'fast', 'donation', 'gemstone', 'puja', 'other'];
const KIND_ICON = { mantra: '🕉️', fast: '🌙', donation: '🤲', gemstone: '💎', puja: '🪔', other: '✨' };

export const RemedyTracker = {
  el: null,
  data: null,
  adding: false,

  async mount(el) {
    if (!el) return;
    this.el = el;
    this.adding = false;
    if (!el.dataset.bound) {
      el.dataset.bound = '1';
      el.addEventListener('click', (e) => this.onClick(e));
      el.addEventListener('submit', (e) => this.onSubmit(e));
      el.addEventListener('change', (e) => { if (e.target.name === 'frequency') this.toggleDay(e.target.form); });
    }
    el.innerHTML = '<div class="pf-skeleton" aria-hidden="true"></div>';
    await this.load();
  },

  async load() {
    try { this.data = await api('/api/v1/experience/remedies'); this.render(); }
    catch (err) { this.el.innerHTML = `<div class="pf-card"><p>${esc(err.message)}</p><button class="shop-btn shop-btn--line" data-rem-reload>${esc(px('rem.cancel'))}</button></div>`; }
  },

  toggleDay(form) { form.querySelector('[data-day-field]').hidden = form.frequency.value !== 'weekly'; },

  render() {
    const d = this.data;
    const doneToday = d.tasks.filter(t => t.done_today).length;
    const active = d.tasks.filter(t => t.status === 'active').length;
    const stats = `<div class="pf-stats"><div class="pf-stat"><small>${esc(px('rem.stat.active'))}</small><strong>${active}</strong></div>
      <div class="pf-stat"><small>${esc(px('rem.stat.today'))}</small><strong>${doneToday}</strong></div><div class="pf-stat"><small>${esc(px('rem.stat.best'))}</small><strong>${d.best_streak}</strong></div></div>`;
    const form = this.adding ? `<form class="pf-form" data-rem-form>
        <label class="pf-field pf-wide">${esc(px('rem.f.title'))}<input class="pf-input" name="title" required minlength="2" maxlength="160" placeholder="${esc(px('rem.f.titlePh'))}"></label>
        <label class="pf-field">${esc(px('rem.f.kind'))}<select class="pf-select" name="kind">${KINDS.map(k => `<option value="${k}">${esc(px('rem.kind.' + k))}</option>`).join('')}</select></label>
        <label class="pf-field">${esc(px('rem.f.freq'))}<select class="pf-select" name="frequency">${['daily', 'weekly', 'once'].map(f => `<option value="${f}">${esc(px('rem.freq.' + f))}</option>`).join('')}</select></label>
        <label class="pf-field" data-day-field hidden>${esc(px('rem.f.day'))}<select class="pf-select" name="weekday">${[0, 1, 2, 3, 4, 5, 6].map(i => `<option value="${i}">${esc(px('rem.day.' + i))}</option>`).join('')}</select></label>
        <label class="pf-field">${esc(px('rem.f.days'))}<input class="pf-input" name="target_days" type="number" min="1" max="365" inputmode="numeric"></label>
        <label class="pf-field pf-wide">${esc(px('rem.f.note'))}<textarea class="pf-textarea" name="detail" rows="2" maxlength="600"></textarea></label>
        <div class="pf-form-actions"><button class="shop-btn shop-btn--gold" type="submit">${esc(px('rem.save'))}</button><button class="shop-btn shop-btn--line" type="button" data-rem-cancel>${esc(px('rem.cancel'))}</button></div></form>` : '';
    const tasks = d.tasks.length ? `<div class="pf-tasks">${d.tasks.map(t => this.task(t)).join('')}</div>`
      : `<div class="pf-card" style="text-align:center"><h3>${esc(px('rem.empty'))}</h3><p class="pf-muted">${esc(px('rem.emptyNote'))}</p></div>`;
    const suggest = d.suggestions.length ? `<div class="pf-card" style="margin-top:20px"><div class="pf-head"><div><h3>${esc(px('rem.suggestTitle'))}</h3><p>${esc(px('rem.suggestHint'))}</p></div></div>
      <div class="pf-suggest">${d.suggestions.map((s, i) => `<div class="pf-suggest-item"><b>${KIND_ICON[s.kind] || '✨'} ${esc(s.title)}</b><span>${esc(s.why)}</span>
        <button type="button" class="shop-btn shop-btn--line shop-btn--sm" data-rem-follow="${i}">${esc(px('rem.follow'))}</button></div>`).join('')}</div></div>` : '';
    this.el.innerHTML = `<div class="pf-head"><div><h2>${esc(px('rem.title'))}</h2><p>${esc(px('rem.sub'))}</p></div>
      <button type="button" class="shop-btn shop-btn--gold" data-rem-add>${esc(px('rem.add'))}</button></div>${stats}${form}${tasks}${suggest}
      <p class="pf-muted" style="margin-top:16px">${esc(px('rem.disclaimer'))}</p>`;
  },

  task(t) {
    const weekly = t.frequency === 'weekly';
    const streak = t.streak ? `<span class="pf-chip pf-chip--ok">🔥 ${esc(px(weekly ? 'rem.streakW' : 'rem.streakD', { n: t.streak }))}</span>` : '';
    const dots = t.frequency === 'daily' ? `<span class="pf-dots" aria-hidden="true">${t.last7.map(on => `<i class="${on ? 'on' : ''}"></i>`).join('')}</span>` : '';
    const progress = t.target_days ? `<div class="pf-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${t.target_days}" aria-valuenow="${Math.min(t.done_count, t.target_days)}"><i style="width:${Math.min(100, Math.round(100 * t.done_count / t.target_days))}%"></i></div>
      <span class="pf-muted">${esc(px('rem.progress', { done: Math.min(t.done_count, t.target_days), total: t.target_days }))}</span>` : '';
    const when = weekly && t.weekday != null ? ` · ${px('rem.day.' + t.weekday)}` : '';
    const by = t.source === 'astrologer' ? `<span class="pf-chip">${esc(t.astrologer_name ? px('rem.by', { name: t.astrologer_name }) : px('rem.fromAstro'))}</span>` : '';
    const link = t.link_type === 'seva' ? `<a class="shop-btn shop-btn--line shop-btn--sm" href="/mandir-seva/${esc(t.link_ref)}" data-nav-link>${esc(px('rem.bookSeva'))}</a>`
      : t.link_type === 'mall' ? `<a class="shop-btn shop-btn--line shop-btn--sm" href="/astro-mall" data-nav-link>${esc(px('rem.shop'))}</a>` : '';
    let action;
    if (t.status === 'completed') action = `<span class="pf-chip pf-chip--ok">✓ ${esc(px('rem.completedLabel'))}</span>`;
    else if (t.done_today) action = `<span class="pf-chip pf-chip--ok">✓ ${esc(px('rem.done'))}</span><button type="button" class="pf-link" data-rem-undo="${esc(t.id)}">${esc(px('rem.undo'))}</button>`;
    else action = `<button type="button" class="shop-btn shop-btn--gold shop-btn--sm" data-rem-done="${esc(t.id)}">${esc(px('rem.markDone'))}</button>${t.due_today ? '' : `<span class="pf-muted">${esc(px('rem.notDue'))}</span>`}`;
    return `<article class="pf-task ${t.done_today || t.status === 'completed' ? 'is-done' : ''}"><div><h3>${KIND_ICON[t.kind] || '✨'} ${esc(t.title)}</h3>${t.detail ? `<p>${esc(t.detail)}</p>` : ''}
      <div class="pf-meta"><span class="pf-chip">${esc(px('rem.freq.' + t.frequency))}${esc(when)}</span>${streak}${by}${dots}</div>${progress}</div>
      <div class="pf-task-actions">${action}${link}<button type="button" class="pf-link" data-rem-del="${esc(t.id)}">${esc(px('rem.remove'))}</button></div></article>`;
  },

  async onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    try {
      if (b.hasAttribute('data-rem-add')) { this.adding = true; this.render(); this.el.querySelector('[name=title]')?.focus(); }
      else if (b.hasAttribute('data-rem-cancel')) { this.adding = false; this.render(); }
      else if (b.hasAttribute('data-rem-reload')) await this.load();
      else if (b.dataset.remDone) { b.disabled = true; await postJson(`/api/v1/experience/remedies/${b.dataset.remDone}/checkin`, {}); await this.load(); window.dispatchEvent(new CustomEvent('astro:remedies')); }
      else if (b.dataset.remUndo) { await api(`/api/v1/experience/remedies/${b.dataset.remUndo}/checkin`, { method: 'DELETE' }); await this.load(); window.dispatchEvent(new CustomEvent('astro:remedies')); }
      else if (b.dataset.remDel) { await api(`/api/v1/experience/remedies/${b.dataset.remDel}`, { method: 'DELETE' }); await this.load(); }
      else if (b.dataset.remFollow !== undefined) {
        const s = this.data.suggestions[Number(b.dataset.remFollow)];
        b.disabled = true;
        await postJson('/api/v1/experience/remedies', { title: s.title, kind: s.kind, frequency: s.frequency, weekday: s.weekday ?? null, target_days: s.target_days ?? null,
          detail: s.detail, source: 'suggested', link_type: s.link_type ?? null, link_ref: s.link_ref ?? null });
        await this.load();
      }
    } catch (err) { toast(err.message, 'error'); b.disabled = false; }
  },

  async onSubmit(e) {
    const form = e.target.closest('[data-rem-form]');
    if (!form) return;
    e.preventDefault();
    const f = new FormData(form);
    const days = Number(f.get('target_days'));
    try {
      await postJson('/api/v1/experience/remedies', { title: f.get('title'), kind: f.get('kind'), frequency: f.get('frequency'),
        weekday: f.get('frequency') === 'weekly' ? Number(f.get('weekday')) : null, target_days: days > 0 ? days : null, detail: f.get('detail') || null });
      this.adding = false;
      await this.load();
    } catch (err) { toast(err.message, 'error'); }
  }
};
