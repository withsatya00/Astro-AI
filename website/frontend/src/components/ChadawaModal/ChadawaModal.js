import { loadTemplate } from '../../utils/templateLoader.js';
import { esc, money, toast, api, postJson, openModal, closeModal, wireDismiss, t, applyI18n, requireLogin, isSignedIn } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

const PRASAD_FEE_DEFAULT = 99;

// [value stored with the booking, English, Hindi]
const RASHIS = [['मेष', 'Aries', 'मेष'], ['वृषभ', 'Taurus', 'वृषभ'], ['मिथुन', 'Gemini', 'मिथुन'], ['कर्क', 'Cancer', 'कर्क'],
  ['सिंह', 'Leo', 'सिंह'], ['कन्या', 'Virgo', 'कन्या'], ['तुला', 'Libra', 'तुला'], ['वृश्चिक', 'Scorpio', 'वृश्चिक'],
  ['धनु', 'Sagittarius', 'धनु'], ['मकर', 'Capricorn', 'मकर'], ['कुम्भ', 'Aquarius', 'कुंभ'], ['मीन', 'Pisces', 'मीन']];
const PURPOSES = [['स्वास्थ्य, दीर्घायु एवं आरोग्य लाभ', 'health'], ['व्यापार वृद्धि एवं धन आगमन', 'business'],
  ['शीघ्र विवाह एवं दांपत्य सुख', 'marriage'], ['शनि साढ़ेसाती व ग्रह दोष शांति', 'shani'],
  ['संतान सुख एवं विद्या प्राप्ति', 'children'], ['सर्वमनोकामना सिद्धि', 'wishes']];
const GOTRAS = [['कश्यप', 'Kashyap'], ['भारद्वाज', 'Bharadwaj'], ['वशिष्ठ', 'Vashishtha'], ['शांडिल्य', 'Shandilya'], ['गर्ग', 'Garga'], ['कौशिक', 'Kaushik']];

export class ChadawaModal {
  static templatePath = '/src/components/ChadawaModal/ChadawaModal.html';
  static isMounted = false;
  static currentTemple = null;
  static selectedOffering = null;
  static isPrasadIncluded = false;
  static submitting = false;
  static coupon = '';
  static points = 0;
  static pointValue = 0.5;
  static usePoints = false;
  static priests = [];
  static priestId = '';
  static totals = null;

  // Scoped to this modal: other modals on the page reuse ids such as btn-submit-booking.
  static $(id) { return document.querySelector('#chadawa-booking-modal #' + id); }
  static get modal() { return document.getElementById('chadawa-booking-modal'); }

  static async mount(container) {
    if (this.isMounted) return;
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (!target) return;
    target.insertAdjacentHTML('beforeend', await loadTemplate(this.templatePath));
    this.isMounted = true;
    this.initEvents();
    this.applyLanguage();
  }

  /** Static text, and the selects whose option labels depend on the language. */
  static applyLanguage() {
    applyI18n(this.modal);
    const hi = currentLang() === 'hi';
    const rashi = this.$('devotee-rashi-select');
    const rashiValue = rashi.value;
    rashi.innerHTML = RASHIS.map(([value, en, hindi]) => `<option value="${esc(value)}">${esc(hi ? hindi : en)}</option>`).join('');
    if (rashiValue) rashi.value = rashiValue;
    const purpose = this.$('sankalp-purpose-select');
    const purposeValue = purpose.value;
    purpose.innerHTML = PURPOSES.map(([value, key]) => `<option value="${esc(value)}">${esc(t('purpose.' + key))}</option>`).join('');
    if (purposeValue) purpose.value = purposeValue;
    this.$('gotra-quick-pills').innerHTML = GOTRAS.map(([hindi, en]) =>
      `<button type="button" class="gotra-pill shop-chip" data-gotra="${esc(hi ? hindi : en)}">${esc(hi ? hindi : en)}</button>`).join('');
    // The untouched default follows the language; anything the visitor typed or picked is kept.
    const gotra = this.$('devotee-gotra-input');
    if (!gotra.value || GOTRAS.some(([hindi, en]) => gotra.value === hindi || gotra.value === en)) gotra.value = hi ? 'कश्यप' : 'Kashyap';
    this.syncPrasadAvailability();
    this.updateTotal();
  }

  static initEvents() {
    const modal = this.modal;
    wireDismiss(modal.parentElement);
    this.$('btn-close-chadawa-modal').addEventListener('click', () => closeModal(modal));
    this.$('btn-close-success').addEventListener('click', () => closeModal(modal));
    this.$('btn-view-bookings-after').addEventListener('click', () => {
      closeModal(modal);
      if (window.MandirSevaPageComponent) window.MandirSevaPageComponent.openMyBookings();
    });
    this.$('chadawa-booking-form').addEventListener('submit', (e) => this.handleBookingSubmit(e));
    this.$('btn-autofill-kundali').addEventListener('click', () => this.autoFillFromKundli());
    this.$('cd-apply').addEventListener('click', () => this.applyCoupon());
    this.$('cd-coupon').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.applyCoupon(); } });
    this.$('cd-points').addEventListener('change', (e) => { this.usePoints = e.target.checked; this.updateTotal(); });
    this.$('priest-list').addEventListener('change', (e) => { if (e.target.name === 'cd-priest') this.priestId = e.target.value; });

    this.$('check-include-prasad').addEventListener('change', (e) => {
      this.isPrasadIncluded = e.target.checked;
      this.$('prasad-address-block').classList.toggle('hidden', !this.isPrasadIncluded);
      this.$('prasad-address-input').required = this.isPrasadIncluded;
      this.updateTotal();
    });
    this.$('gotra-quick-pills').addEventListener('click', (e) => {
      const pill = e.target.closest('.gotra-pill');
      if (pill) this.$('devotee-gotra-input').value = pill.getAttribute('data-gotra');
    });
    this.$('modal-offerings-container').addEventListener('change', (e) => {
      if (e.target.name !== 'chadawa-offering') return;
      this.selectedOffering = (this.currentTemple.offerings || []).find(o => o.id === e.target.value) || null;
      this.syncPrasadAvailability();
      this.updateTotal();
    });

    // Language switched while the dialog is open: reload this temple's text in the new language, keep what was typed.
    window.addEventListener('astro:languagechange', async () => {
      this.applyLanguage();
      if (!this.currentTemple || !modal.classList.contains('is-open')) return;
      try {
        const fresh = await api(`/api/v1/mandir/temples/${encodeURIComponent(this.currentTemple.slug)}?lang=${currentLang()}`);
        this.currentTemple = fresh;
        const keep = this.selectedOffering && this.selectedOffering.id;
        this.renderOfferings(keep);
        this.$('modal-temple-name').textContent = fresh.name;
        this.syncPrasadAvailability();
        this.updateTotal();
      } catch (e) { /* keep the current text */ }
    });
  }

  static renderOfferings(selectedId) {
    const offerings = this.currentTemple.offerings || [];
    this.selectedOffering = offerings.find(o => o.id === selectedId) || offerings[0] || null;
    this.$('modal-offerings-container').innerHTML = offerings.map(o => `
      <label class="shop-radio">
        <input type="radio" name="chadawa-offering" value="${esc(o.id)}" ${this.selectedOffering && o.id === this.selectedOffering.id ? 'checked' : ''}>
        <span><strong>${esc(o.title)}</strong><small>${esc(o.description)}</small></span>
        <b>${money(o.price)}</b>
      </label>`).join('') || `<p class="shop-hint">${esc(t('cd.noSeva'))}</p>`;
  }

  static open(temple) {
    this.currentTemple = temple;
    this.isPrasadIncluded = false;
    this.coupon = '';
    this.usePoints = false;
    this.priestId = '';
    this.priests = [];
    this.applyLanguage();
    this.$('cd-coupon').value = '';
    this.$('cd-coupon-msg').textContent = '';
    this.$('cd-points').checked = false;
    this.$('priest-section').classList.add('hidden');
    this.loadExtras(temple.slug);

    this.$('chadawa-booking-form').classList.remove('hidden');
    this.$('chadawa-success-view').classList.add('hidden');
    this.$('modal-temple-name').textContent = temple.name;
    this.$('check-include-prasad').checked = false;
    this.$('prasad-address-block').classList.add('hidden');
    this.$('prasad-address-input').required = false;

    this.renderOfferings(null);
    this.syncPrasadAvailability();
    this.updateTotal();
    this.autoFillFromKundli(true);
    openModal(this.modal);
  }

  static prasadFee() {
    const fee = this.selectedOffering && this.selectedOffering.delivery_fee;
    return fee == null ? PRASAD_FEE_DEFAULT : fee;
  }

  static syncPrasadAvailability() {
    const available = !!(this.selectedOffering && this.selectedOffering.has_prasad_delivery);
    this.$('prasad-section').style.display = available ? '' : 'none';
    if (!available) {
      this.isPrasadIncluded = false;
      this.$('check-include-prasad').checked = false;
      this.$('prasad-address-block').classList.add('hidden');
      this.$('prasad-address-input').required = false;
    }
    this.$('prasad-fee-note').textContent = t('cd.prasadFee', { fee: money(this.prasadFee()) });
  }

  /** Priests of this temple (admin-managed, may be none) and the visitor's points balance. */
  static async loadExtras(slug) {
    try {
      const d = await api(`/api/v1/mandir/temples/${encodeURIComponent(slug)}?lang=${currentLang()}`);
      this.priests = d.priests || [];
      this.renderPriests();
    } catch (e) { /* optional */ }
    if (isSignedIn()) {
      try {
        const r = await api('/api/v1/rewards/summary');
        this.points = r.points || 0;
        this.pointValue = r.point_value;
        this.$('cd-points-wrap').classList.toggle('hidden', !(this.points > 0));
        this.$('cd-points-label').textContent = t('co.usePoints', { points: this.points, worth: money(this.points * this.pointValue) });
      } catch (e) { this.points = 0; }
    }
  }

  static renderPriests() {
    const box = this.$('priest-list');
    this.$('priest-section').classList.toggle('hidden', !this.priests.length);
    box.innerHTML = `<label class="shop-radio"><input type="radio" name="cd-priest" value="" checked><span><strong>${esc(t('cd.anyPriest'))}</strong></span></label>` + this.priests.map(p => `
      <label class="shop-radio"><input type="radio" name="cd-priest" value="${esc(p.id)}">
        ${p.photo_url ? `<img src="${esc(p.photo_url)}" alt="" style="width:38px;height:38px;border-radius:50%;object-fit:cover">` : ''}
        <span><strong>${esc(p.name)}</strong>${p.verified ? ` <span class="shop-pill shop-pill--ok">✓ ${esc(t('cd.verified'))}</span>` : ''}
        <small>${esc(t('cd.years', { n: p.years_experience }))}${p.languages ? ' - ' + esc(p.languages) : ''}${p.bio ? '<br>' + esc(p.bio) : ''}</small></span></label>`).join('');
  }

  static async applyCoupon() {
    const code = this.$('cd-coupon').value.trim().toUpperCase();
    if (!code) return;
    if (!requireLogin('auth.neededCoupon')) return;
    this.coupon = code;
    this.$('cd-coupon-msg').textContent = '';
    await this.updateTotal();
  }

  static async updateTotal() {
    if (!this.selectedOffering) { this.$('cd-totals').innerHTML = ''; return; }
    const base = this.selectedOffering.price;
    const fee = this.isPrasadIncluded ? this.prasadFee() : 0;
    let tot = { subtotal: base, total: base + fee, delivery_fee: fee, member_discount: 0, coupon_discount: 0, points_used: 0, points_value: 0, is_member: false, earn_points: 0 };
    if (isSignedIn()) {
      try {
        tot = await postJson('/api/v1/mandir/chadawa/quote', { offering_id: this.selectedOffering.id, include_prasad: this.isPrasadIncluded,
          coupon_code: this.coupon || null, use_points: this.usePoints ? this.points : 0 });
        if (this.coupon) { this.$('cd-coupon-msg').textContent = t('co.couponOk', { code: tot.coupon_code, amount: money(tot.coupon_discount) }); this.$('cd-coupon-msg').style.color = '#047857'; }
      } catch (err) {
        if (this.coupon) {
          this.$('cd-coupon-msg').textContent = err.message; this.$('cd-coupon-msg').style.color = '#dc2626';
          this.coupon = '';
          return this.updateTotal();
        }
      }
    }
    this.totals = tot;
    const rows = [[t('ml.subtotal'), money(tot.subtotal)]];
    if (tot.delivery_fee || tot.delivery_waived) rows.push([t('cd.prasadRow'), tot.delivery_waived ? t('cd.free') : money(tot.delivery_fee)]);
    if (tot.coupon_discount) rows.push([t('co.coupon', { code: tot.coupon_code }), '-' + money(tot.coupon_discount)]);
    if (tot.points_used) rows.push([t('co.pointsUsed', { n: tot.points_used }), '-' + money(tot.points_value)]);
    this.$('cd-totals').innerHTML = rows.map(r => `<div class="shop-totals__row"><span>${esc(r[0])}</span><span>${esc(r[1])}</span></div>`).join('')
      + `<div class="shop-totals__row shop-totals__row--big"><span>${esc(t('cd.total'))}</span><span id="modal-total-amount">${money(tot.total)}</span></div>`
      + (tot.earn_points ? `<div class="shop-hint" style="margin:4px 0 0">${esc(t('co.earn', { n: tot.earn_points }))}</div>` : '');
    this.$('cd-member-msg').textContent = tot.is_member ? t('co.memberOnSeva') : '';
  }

  /** Fills name and rashi from the visitor's saved kundli (if any). `silent` skips the messages. */
  static async autoFillFromKundli(silent = false) {
    const nameInput = this.$('devotee-name-input');
    const rashiSelect = this.$('devotee-rashi-select');
    try {
      const charts = await api('/api/v1/charts');
      const chart = (charts || []).find(c => c.is_default) || (charts || [])[0];
      if (!chart) { if (!silent) toast(t('cd.toast.noChart'), 'info'); return; }
      if (!nameInput.value) nameInput.value = chart.name || '';
      const sign = String((chart.chart_data && chart.chart_data.moon_sign) || '').toLowerCase().slice(0, 4);
      const match = RASHIS.find(r => sign && r[1].toLowerCase().startsWith(sign));
      if (match) rashiSelect.value = match[0];
      if (!silent) toast(t('cd.toast.filled'), 'success');
    } catch (e) {
      if (!silent) toast(t('cd.toast.chartFail'), 'error');
    }
  }

  static async handleBookingSubmit(e) {
    e.preventDefault();
    if (this.submitting || !this.selectedOffering) return;
    if (!requireLogin('auth.neededBooking')) return;
    const btn = this.$('btn-submit-booking');
    const payload = {
      offering_id: this.selectedOffering.id,
      devotee_name: this.$('devotee-name-input').value.trim(),
      devotee_phone: this.$('devotee-phone-input').value.trim() || null,
      gotra: this.$('devotee-gotra-input').value.trim() || 'Kashyap',
      rashi: this.$('devotee-rashi-select').value,
      sankalp_purpose: this.$('sankalp-purpose-select').value,
      family_members: this.$('family-members-input').value.trim() || null,
      include_prasad: this.isPrasadIncluded,
      delivery_address: this.isPrasadIncluded ? this.$('prasad-address-input').value.trim() : null,
      coupon_code: this.coupon || null,
      use_points: this.usePoints ? this.points : 0,
      priest_id: this.priestId || null
    };

    this.submitting = true;
    btn.disabled = true;
    btn.textContent = t('cd.submitting');
    try {
      const res = await postJson(`/api/v1/mandir/chadawa/book?lang=${currentLang()}`, payload);
      const b = res.booking;
      this.$('chadawa-booking-form').classList.add('hidden');
      this.$('chadawa-success-view').classList.remove('hidden');
      this.$('success-body').textContent = t('cd.successBody', { name: b.devotee_name, gotra: b.gotra });
      this.$('success-booking-num').textContent = b.booking_number;
      this.$('success-temple-title').textContent = `${b.temple_name} - ${b.offering_title}`;
      this.$('success-total-paid').textContent = money(b.amount_paid);
      toast(t('cd.toast.booked'), 'success');
      if (window.App && window.App.refreshWalletUI) window.App.refreshWalletUI();
      if (window.NotificationBell) window.NotificationBell.refresh();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      this.submitting = false;
      btn.disabled = false;
      btn.textContent = t('cd.submit');
    }
  }
}

if (typeof window !== 'undefined') window.ChadawaModal = ChadawaModal;
export default ChadawaModal;
