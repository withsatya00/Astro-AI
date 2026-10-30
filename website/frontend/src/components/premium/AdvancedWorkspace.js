import { api, esc } from '../../utils/shop.js';

const base = '/api/v1/advanced';
const hi = () => window.I18n?.currentLang === 'hi';
const t = (en, hindi) => hi() ? hindi : en;
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const write = (path, data, method = 'PUT') => api(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const field = (name, label, type = 'text', value = '') => `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" required></label>`;
const button = (text, action, extra = '') => `<button type="button" class="shop-btn shop-btn--line" data-advanced-action="${action}" ${extra}>${esc(text)}</button>`;
const table = (heads, rows) => `<div class="adv-scroll"><table><thead><tr>${heads.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const placements = chart => table([t('Planet','ग्रह'),t('Sign','राशि'),t('House','भाव'),t('Nakshatra','नक्षत्र')], (chart?.planets || []).map(p => [p.name,p.sign,p.house,p.nakshatra]));

export class AdvancedWorkspace {
  static mount(root) {
    if (!root) return;
    if (!document.getElementById('advanced-workspace-css')) {
      const link = document.createElement('link'); link.id = 'advanced-workspace-css'; link.rel = 'stylesheet'; link.href = '/src/styles/advanced-workspace.css'; document.head.append(link);
    }
    const workspace = new AdvancedWorkspace(root);
    root.addEventListener('click', e => workspace.click(e));
    root.addEventListener('submit', e => workspace.submit(e));
    root.addEventListener('change', e => { if (e.target.name === 'advanced-profile') { workspace.profile = e.target.value; workspace.loadPanel(); } });
    workspace.load();
    this.current = workspace;
    if (!this.listening) {
      window.addEventListener('astro:profileschange', () => { if (this.current?.root.isConnected) this.current.load(); });
      this.listening = true;
    }
  }
  constructor(root) { this.root = root; this.tab = 'timeline'; this.profile = ''; this.request = 0; }
  async load() {
    try {
      this.profiles = await api(base + '/family');
      if (!this.root.isConnected) return;
      this.profile = this.profiles.find(p => p.is_default)?.id || this.profiles[0]?.id || '';
      this.render();
    } catch (e) { this.root.textContent = e.message; }
  }
  render() {
    const role = window.App?.currentUser?.role;
    const tabs = [['timeline',t('Timeline','समयरेखा')],['family',t('Family vault','परिवार की कुंडली')],['memory',t('AI memory','AI की यादें')],['evidence',t('Why this reading?','इस व्याख्या का आधार')],['muhurat',t('Muhurat finder','मुहूर्त खोजें')],['uncertainty',t('Birth-time explorer','जन्म समय की तुलना')],['reminders',t('Reminders','रिमाइंडर')]];
    if (['admin','astrologer'].includes(role)) tabs.push(['workbench',t('Astrologer workbench','ज्योतिषी कार्यक्षेत्र')]);
    if (role === 'admin') tabs.push(['quality',t('AI quality','AI गुणवत्ता')]);
    this.root.innerHTML = `<section class="exp-panel adv-workspace"><h2>${esc(t('Advanced Astro Workspace','उन्नत ज्योतिष कार्यक्षेत्र'))}</h2><p>${esc(t('Explore your saved charts and manage personal consultation tools.','अपनी सहेजी हुई कुंडली और परामर्श टूल देखें।'))}</p><label>${esc(t('Birth profile','जन्म प्रोफ़ाइल'))}<select name="advanced-profile">${this.profiles.map(p => `<option value="${esc(p.id)}" ${this.profile === p.id ? 'selected' : ''}>${esc(p.name)} · ${esc(p.relationship)}</option>`).join('')}</select></label><nav aria-label="${esc(t('Advanced tools','उन्नत टूल'))}" class="adv-tabs">${tabs.map(([id,label]) => button(label,'tab',`data-tab="${id}" aria-pressed="${id === this.tab}"`)).join('')}</nav><p role="status" data-adv-status></p><div data-adv-panel></div></section>`;
    this.loadPanel();
  }
  get panel() { return this.root.querySelector('[data-adv-panel]'); }
  message(text) { const el = this.root.querySelector('[data-adv-status]'); if (el) el.textContent = text; }
  async loadPanel() {
    const generation = ++this.request;
    this.message('');
    this.root.querySelectorAll('[data-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tab === this.tab)));
    const needsProfile = ['timeline','memory','evidence','muhurat','uncertainty'].includes(this.tab);
    if (needsProfile && !this.profile) { this.panel.innerHTML = `<p>${esc(t('Create a birth chart first.','पहले जन्म कुंडली बनाएं।'))}</p>${button(t('Create chart','कुंडली बनाएं'),'create-profile')}`; return; }
    this.panel.textContent = t('Loading…','लोड हो रहा है…');
    try {
      const id = encodeURIComponent(this.profile);
      let html = '';
      if (this.tab === 'timeline') {
        const d = await api(`${base}/charts/${id}/timeline?selected=${this.selected || today()}`);
        html = `<form data-adv-form="timeline">${field('selected',t('Explore date','तारीख चुनें'),'date',d.date)}<button class="shop-btn shop-btn--gold">${esc(t('Update timeline','समयरेखा देखें'))}</button></form><p>${esc(d.note)}</p><div class="adv-periods">${d.periods.map(p => `<button type="button" data-advanced-action="period" data-date="${esc(p.start.slice(0,10))}" class="${p.planet === d.active?.planet ? 'is-active' : ''}"><strong>${esc(p.planet)}</strong><small>${esc(p.start.slice(0,10))} → ${esc(p.end.slice(0,10))}</small></button>`).join('')}</div>${d.active ? `<h3>${esc(d.active.planet)} · ${esc(t('Antardashas','अंतर्दशा'))}</h3>${table(['Planet','Start','End'],d.active.antardashas.map(p => [p.planet,p.start.slice(0,10),p.end.slice(0,10)]))}` : ''}<h3>${esc(t('Selected-date transits','चुनी तारीख का गोचर'))}</h3><div class="adv-chart">${d.chart_svg || ''}</div>${table(['Planet','Transit sign','Natal sign','Natal house'],d.transits.planets.map(p => [p.name,p.sign,p.natal_sign,p.natal_house]))}`;
      } else if (this.tab === 'family') {
        html = `${button(t('Add family birth chart','परिवार की कुंडली जोड़ें'),'create-profile')}<div class="adv-family">${this.profiles.map(p => `<form data-adv-form="family" data-id="${esc(p.id)}"><h3>${esc(p.name)}</h3><p>${esc(p.date_of_birth)} · ${esc(p.city)}</p><label>${esc(t('Relationship','रिश्ता'))}<select name="relationship">${['self','partner','child','parent','sibling','other'].map(r => `<option ${r === p.relationship ? 'selected' : ''}>${r}</option>`).join('')}</select></label>${field('label',t('Profile label','प्रोफ़ाइल लेबल'),'text',p.label || p.name)}<button class="shop-btn shop-btn--gold">${esc(t('Save label','लेबल सहेजें'))}</button>${button(t('Use for consultation','परामर्श के लिए चुनें'),'use-profile',`data-id="${esc(p.id)}"`)}</form>`).join('')}</div>`;
      } else if (this.tab === 'memory') {
        const d = await api(`${base}/memory/${id}`);
        html = `<p>${esc(t('Only notes you explicitly save and enable are used in future AI consultations for this profile.','इस प्रोफ़ाइल के लिए आपकी सहेजी और सक्षम की गई जानकारी ही AI परामर्श में उपयोग होगी।'))}</p><form data-adv-form="memory"><label class="adv-check"><input name="enabled" type="checkbox" ${d.enabled ? 'checked' : ''}>${esc(t('Allow AI to use these notes','AI को इन नोट्स का उपयोग करने दें'))}</label><label>${esc(t('Concerns and preferences','सवाल और प्राथमिकताएं'))}<textarea name="content" maxlength="2000" rows="6">${esc(d.content)}</textarea></label><button class="shop-btn shop-btn--gold">${esc(t('Save memory','यादें सहेजें'))}</button>${button(t('Review latest consultation summary','Review latest consultation summary'),'review-summary')}${button(t('Delete memory','यादें हटाएं'),'delete-memory')}</form>`;
      } else if (this.tab === 'evidence') {
        const d = await api(`${base}/charts/${id}/evidence`);
        html = `<p>${esc(d.calculation_engine)} · ${esc(d.system)} · ${esc(d.ayanamsa)}</p><p>${esc(d.note)}</p>${table(['Planet','Sign','House','Longitude','Nakshatra','Calculation rule'],d.placements.map(p => [p.planet,p.sign,p.house,p.longitude,p.nakshatra,p.rule]))}<h3>${esc(t('Traditional interpretations','परंपरागत व्याख्या'))}</h3>${this.readable(d.interpretations)}<p>${esc(t('Open a consultation to inspect its retrieved classical source excerpts.','शास्त्रीय स्रोत के अंश देखने के लिए परामर्श खोलें।'))}</p>`;
      } else if (this.tab === 'muhurat') {
        html = `<p>${esc(t('Preliminary shortlist using the profile location and existing Panchang rules.','प्रोफ़ाइल के स्थान और पंचांग नियमों पर आधारित प्रारंभिक सूची।'))}</p><form data-adv-form="muhurat">${field('start','Start date','date',today())}<label>Event<select name="event"><option value="business">Business</option><option value="marriage">Marriage</option><option value="housewarming">Housewarming</option><option value="vehicle">Vehicle</option></select></label><label>Days<input name="days" type="number" min="1" max="31" value="7" required></label><button class="shop-btn shop-btn--gold">${esc(t('Find candidates','समय खोजें'))}</button></form><div data-adv-result></div>`;
      } else if (this.tab === 'uncertainty') {
        html = `<form data-adv-form="uncertainty"><label>${esc(t('Explore ± minutes','इतने मिनट आगे-पीछे देखें'))}<select name="minutes"><option>15</option><option>30</option><option>60</option></select></label><button class="shop-btn shop-btn--gold">${esc(t('Compare charts','कुंडली की तुलना करें'))}</button></form><div data-adv-result></div>`;
      } else if (this.tab === 'reminders') {
        const [d, reminders] = await Promise.all([api(base+'/reminder-preferences'),api(base+'/reminders')]); this.pushKey = d.push_public_key;
        const p = d.preferences;
        html = `<form data-adv-form="preferences"><label class="adv-check"><input name="enabled" type="checkbox" ${p.enabled ? 'checked' : ''}>${esc(t('Enable scheduled reminders','रिमाइंडर सक्षम करें'))}</label>${field('timezone','Timezone','text',p.timezone)}<label>Quiet hours start<input name="quiet_start" type="number" min="0" max="23" value="${p.quiet_start}" required></label><label>Quiet hours end<input name="quiet_end" type="number" min="0" max="23" value="${p.quiet_end}" required></label><label>Maximum per day<input name="max_per_day" type="number" min="1" max="20" value="${p.max_per_day}" required></label><button class="shop-btn shop-btn--gold">${esc(t('Save preferences','प्राथमिकताएं सहेजें'))}</button></form><p>${esc(d.push_configured ? t('Web push is available.','वेब पुश उपलब्ध है।') : t('In-app reminders are available. Server VAPID keys are required for web push.','इन-ऐप रिमाइंडर उपलब्ध हैं। वेब पुश के लिए सर्वर VAPID कुंजी आवश्यक है।'))}</p>${button(t('Enable browser push','ब्राउज़र पुश सक्षम करें'),'push',d.push_configured ? '' : 'disabled')}${button(t('Disable push on all devices','सभी डिवाइस पर पुश बंद करें'),'unpush')}<h3>${esc(t('Schedule reminder','रिमाइंडर बनाएं'))}</h3><form data-adv-form="reminder">${field('title','Title')}${field('due_at','When','datetime-local')}<label>Repeat every N days (0 = once)<input name="repeat_days" type="number" min="0" max="365" value="0" required></label><button class="shop-btn shop-btn--gold">${esc(t('Schedule','सहेजें'))}</button></form>${reminders.map(r => `<article><strong>${esc(r.title)}</strong> · ${esc(new Date(r.due_at).toLocaleString())} ${button(t('Delete','हटाएं'),'delete-reminder',`data-id="${esc(r.id)}"`)}</article>`).join('')}`;
      } else if (this.tab === 'workbench') {
        const list = await api(base+'/workbench');
        html = `${window.App?.currentUser?.role === 'admin' ? `<form data-adv-form="assignment">${field('user_id','Staff user ID')}${field('astrologer_id','Astrologer profile ID')}<button class="shop-btn shop-btn--gold">Assign staff access</button>${button('Revoke access','revoke-staff')}</form>` : ''}<div class="adv-family">${list.map(c => `<article><h3>${esc(c.title)}</h3><p>${esc(c.status)}</p>${button(t('Open workspace','कार्य खोलें'),'work',`data-id="${esc(c.id)}"`)}</article>`).join('') || '<p>No assigned consultations yet.</p>'}</div><div data-adv-result></div>`;
      } else if (this.tab === 'quality') {
        const d = await api(base+'/quality');
        html = `<p>${esc(d.note)}</p><p>Sessions sampled: ${d.sample_size} · Average response: ${d.average_latency_ms == null ? '—' : Math.round(d.average_latency_ms)+' ms'}</p><h3>Session cost summary (reported requests only)</h3>${table(['Consultation','Turns','Reported cost','Unpriced turns'],(d.sessions || []).map(s=>[s.consultation_id,s.turns,s.reported_cost+' '+s.currency,s.unpriced_turns]))}${table(['Time','Consultation','Latency ms','Citations','Chart grounded','Review flags','Cost'],d.events.map(e => [e.created_at,e.consultation_id,Math.round(e.latency_ms),e.citation_count,e.chart_grounded,(e.review_flags || []).join('; '),e.estimated_cost == null ? 'Unavailable' : e.estimated_cost+' '+e.cost_currency]))}`;
      }
      if (generation === this.request && this.root.isConnected) this.panel.innerHTML = html;
    } catch (e) { if (generation === this.request) { this.panel.textContent = e.message; this.panel.append(this.retryButton()); } }
  }
  retryButton() { const b = document.createElement('button'); b.textContent = t('Retry','फिर कोशिश करें'); b.dataset.advancedAction = 'retry'; b.className = 'shop-btn shop-btn--line'; return b; }
  readable(data) { return `<ul>${Object.entries(data || {}).map(([k,v]) => `<li><strong>${esc(k.replaceAll('_',' '))}:</strong> ${esc(Array.isArray(v) ? v.join(' · ') : typeof v === 'object' ? JSON.stringify(v) : v)}</li>`).join('')}</ul>`; }
  async click(event) {
    const b = event.target.closest('[data-advanced-action]'); if (!b) return;
    const a = b.dataset.advancedAction;
    try {
      if (a === 'tab') { this.tab = b.dataset.tab; await this.loadPanel(); }
      else if (a === 'retry') await this.loadPanel();
      else if (a === 'period') { this.selected = b.dataset.date; await this.loadPanel(); }
      else if (a === 'create-profile') window.App.openBirthModal();
      else if (a === 'use-profile') {
        await api(`/api/v1/auth/profiles/${encodeURIComponent(b.dataset.id)}/default`,{method:'PATCH'});
        const chart = await api(`/api/v1/charts/${encodeURIComponent(b.dataset.id)}`);
        window.App.currentChart = chart; window.App.rememberMyChartId?.(chart.id);
        if (window.ChatController) window.ChatController.activeChartId = chart.id;
        window.App.updateActiveProfileUI?.(chart); window.App.loadSavedProfiles?.();
        this.profile = b.dataset.id; this.root.querySelector('[name="advanced-profile"]').value = this.profile;
        this.message(t('Profile selected for your next consultation.','अगले परामर्श के लिए प्रोफ़ाइल चुनी गई।'));
      } else if (a === 'review-summary') {
        const draft = await api(`${base}/memory/${encodeURIComponent(this.profile)}/suggestion`);
        this.panel.querySelector('[name="content"]').value = draft.content;
        this.message(t('Review the draft, then save and enable it if you want AI to use it.','ड्राफ्ट देखें, फिर AI उपयोग के लिए सहेजें और सक्षम करें।'));
      } else if (a === 'delete-memory') { await api(`${base}/memory/${encodeURIComponent(this.profile)}`,{method:'DELETE'}); await this.loadPanel(); }
      else if (a === 'delete-reminder') { await api(`${base}/reminders/${encodeURIComponent(b.dataset.id)}`,{method:'DELETE'}); await this.loadPanel(); }
      else if (a === 'push') {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Browser push is not supported here');
        if (await Notification.requestPermission() !== 'granted') throw new Error('Notification permission was not granted');
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        const key = Uint8Array.from(atob(this.pushKey.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
        const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
        await write('/push-subscription',subscription.toJSON(),'POST'); this.message(t('Browser push enabled.','ब्राउज़र पुश सक्षम है।'));
      } else if (a === 'unpush') {
        await api(base+'/push-subscription',{method:'DELETE'});
        const registration = await navigator.serviceWorker?.getRegistration();
        await (await registration?.pushManager.getSubscription())?.unsubscribe();
        this.message(t('Push disabled.','पुश बंद है।'));
      } else if (a === 'revoke-staff') {
        const form = b.closest('form');
        if (!form.reportValidity()) return;
        await api(`${base}/staff/${encodeURIComponent(form.elements.user_id.value)}/${encodeURIComponent(form.elements.astrologer_id.value)}`, {method:'DELETE'});
        this.message(t('Staff access revoked.','स्टाफ एक्सेस हटा दिया गया।'));
      } else if (a === 'work') {
        const d = await api(`${base}/workbench/${encodeURIComponent(b.dataset.id)}`);
        this.panel.querySelector('[data-adv-result]').innerHTML = `<h3>${esc(d.title)}</h3><div class="adv-chart">${d.chart_svg || ''}</div>${placements(d.chart)}<form data-adv-form="work" data-id="${esc(d.id)}">${['private_notes','annotations','follow_up'].map(k => `<label>${esc(k.replaceAll('_',' '))}<textarea name="${k}" rows="4" maxlength="10000">${esc(d.notes[k])}</textarea></label>`).join('')}<button class="shop-btn shop-btn--gold">Save workspace</button></form><details><summary>Conversation and sources</summary>${d.messages.map(m => `<article><strong>${esc(m.role)}</strong><p>${esc(m.content)}</p>${this.readable(m.citations)}</article>`).join('')}</details>`;
      }
    } catch (e) { this.message(e.message); }
  }
  async submit(event) {
    const form = event.target.closest('[data-adv-form]'); if (!form) return;
    event.preventDefault(); const data = Object.fromEntries(new FormData(form));
    const action = form.dataset.advForm, id = encodeURIComponent(this.profile), generation = this.request;
    const submit = form.querySelector('button[type="submit"], button:not([type])'); if (submit) submit.disabled = true;
    try {
      if (action === 'timeline') { this.selected = data.selected; await this.loadPanel(); }
      else if (action === 'family') { await write(`/family/${encodeURIComponent(form.dataset.id)}`,data); }
      else if (action === 'memory') { await write(`/memory/${id}`,{enabled:form.elements.enabled.checked,content:data.content}); }
      else if (action === 'preferences') { await write('/reminder-preferences',{...data,enabled:form.elements.enabled.checked,quiet_start:+data.quiet_start,quiet_end:+data.quiet_end,max_per_day:+data.max_per_day}); }
      else if (action === 'reminder') { await write('/reminders',{...data,due_at:new Date(data.due_at).toISOString(),repeat_days:+data.repeat_days},'POST'); await this.loadPanel(); }
      else if (action === 'work') { await write(`/workbench/${encodeURIComponent(form.dataset.id)}`,data); }
      else if (action === 'assignment') { await write(`/staff/${encodeURIComponent(data.user_id)}/${encodeURIComponent(data.astrologer_id)}`,{}); }
      else if (action === 'muhurat') {
        const d = await api(`${base}/charts/${id}/muhurat?${new URLSearchParams(data)}`);
        if (generation !== this.request) return;
        form.parentElement.querySelector('[data-adv-result]').innerHTML = `<p>${esc(d.note)}</p>${table(['Date','Candidate window','Rahu Kaal — avoid','Reason'],d.candidates.map(c => [c.date,c.candidate_window,`${c.rahu_kaal.start}–${c.rahu_kaal.end}`,c.reasons.join('; ')]))}<details><summary>Excluded days (${d.excluded.length})</summary>${table(['Date','Reason'],d.excluded.map(c => [c.date,c.reasons.join('; ')]))}</details>`;
      } else if (action === 'uncertainty') {
        const d = await api(`${base}/charts/${id}/uncertainty?${new URLSearchParams(data)}`);
        if (generation !== this.request) return;
        form.parentElement.querySelector('[data-adv-result]').innerHTML = `<p>${esc(d.note)}</p><p>Ascendant sign changes: ${d.ascendant_changes ? 'Yes' : 'No'} · Changed planets: ${esc(d.changed_planets.join(', ') || 'None at sampled times')}</p><div class="adv-comparison">${d.samples.map(s => `<article><h3>${s.offset_minutes > 0 ? '+' : ''}${s.offset_minutes} min</h3><p>${esc(s.instant)}</p><strong>${esc(s.chart.ascendant_sign)} · ${esc(s.chart.ascendant)}°</strong>${placements(s.chart)}</article>`).join('')}</div>`;
      }
      this.message(t('Updated.','अपडेट हो गया।'));
    } catch (e) { this.message(e.message); }
    finally { if (submit) submit.disabled = false; }
  }
}
