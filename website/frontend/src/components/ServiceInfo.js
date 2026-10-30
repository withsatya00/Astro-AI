import { esc } from '../utils/shop.js';
import { x } from '../utils/experience.js';

export function servicePanel(kind) {
  if (kind === 'chadhava') {
    const hi = window.I18n?.currentLang === 'hi';
    const rows = hi ? [
      ['क्या शामिल है', 'चुने हुए कार्यक्रम में सूचीबद्ध चढ़ावा और उसका रिकॉर्ड किया गया वीडियो शामिल है। सामूहिक या व्यक्तिगत सेवा की जानकारी कार्यक्रम में देखें। प्रसाद डिलीवरी शामिल नहीं है।'],
      ['समय', 'कार्यक्रम की तारीख, बुकिंग की अंतिम तारीख और वीडियो मिलने का अनुमान बुकिंग से पहले दिखेगा। स्थिति मंदिर टीम अपडेट करेगी।'],
      ['रद्द करना और रिफंड', 'सेवा निर्धारित होने से पहले और कार्यक्रम की रद्द करने की समय सीमा के भीतर स्वयं रद्द कर सकते हैं। वॉलेट भुगतान वॉलेट में लौटता है; ऑनलाइन भुगतान का रिफंड भुगतान प्रदाता की पुष्टि पर पूरा होता है। उसके बाद सहायता टीम से संपर्क करें।']
    ] : [
      ['Inclusions', 'The selected event includes the listed offerings and recorded video. Check whether it is collective or individual. Prasad delivery is not included.'],
      ['Timeline', 'The seva date, booking deadline and video delivery estimate are shown before checkout. Status updates come from the temple team.'],
      ['Cancellation & refund', 'Self-cancel before the event cancellation deadline while the seva is unscheduled. Wallet payments return to the wallet; online refunds complete after payment-provider confirmation. After scheduling, contact support.']
    ];
    return `<section class="service-info"><h2>${hi ? 'सेवा की जानकारी' : 'Service details'}</h2>${rows.map(([title,body])=>`<details><summary>${esc(title)}</summary><p>${esc(body)}</p></details>`).join('')}<a href="mailto:support@astrojyotish.in">support@astrojyotish.in</a></section>`;
  }
  return `<section class="service-info" translate="no"><h2>${esc(x('serviceDetails'))}</h2><div class="service-info-grid">${[['inclusions', kind === 'product' ? 'productIncludes' : 'pujaIncludes'], ['timeline', kind === 'product' ? 'productTimeline' : 'pujaTimeline'], ['cancellation', kind === 'product' ? 'productCancel' : 'pujaCancel']].map(([title, text]) => `<details><summary>${esc(x(title))}</summary><p>${esc(x(text))}</p></details>`).join('')}<details><summary>${esc(x('support'))}</summary><p>${esc(x('contactCopy'))}</p><a href="mailto:support@astrojyotish.in">support@astrojyotish.in</a></details></div></section>`;
}

export const ServiceInfo = {
  init() {
    document.addEventListener('click', e => {
      const button = e.target.closest('[data-service-info]');
      if (button) this.open(button.dataset.serviceInfo);
    });
    const label = () => document.querySelectorAll('[data-service-info="refund"]').forEach(el => { el.textContent = x('refundTitle'); });
    label();
    window.addEventListener('astro:languagechange', () => { label(); if (this.dialog?.open) this.open(this.kind); });
    window.addEventListener('astro:componentsmounted', label);
  },
  dataControls() {
    if (!window.App?.currentUser) return `<p class="exp-muted">${esc(x('dataSignIn'))}</p>`;
    return `<section class="exp-data-controls"><h3>${esc(x('yourData'))}</h3>
      <button type="button" class="shop-btn shop-btn--line" data-export-data>${esc(x('downloadData'))}</button>
      <form data-delete-form><p class="exp-muted">${esc(x('deleteNote'))}</p>
        <label>${esc(x('passwordLabel'))}<input type="password" name="password" autocomplete="current-password" required></label>
        <label class="exp-check"><input type="checkbox" name="forfeit"> ${esc(x('forfeitLabel'))}</label>
        <button type="submit" class="shop-btn shop-btn--danger">${esc(x('deleteAccount'))}</button><p class="exp-warn" data-delete-error role="alert" hidden></p></form></section>`;
  },
  bindDataControls() {
    const root = this.dialog;
    root.querySelector('[data-export-data]')?.addEventListener('click', async (e) => {
      e.target.disabled = true;
      try {
        const res = await fetch((window.ASTRO_BACKEND_ORIGIN || '') + '/api/v1/auth/me/export');
        if (!res.ok) throw new Error();
        const url = URL.createObjectURL(new Blob([await res.text()], { type: 'application/json' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: 'astro-jyotish-my-data.json' });
        a.click(); URL.revokeObjectURL(url);
      } catch (err) { window.App?.showToast(x('failed'), 'error'); } finally { e.target.disabled = false; }
    });
    root.querySelector('[data-delete-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target; const err = form.querySelector('[data-delete-error]'); err.hidden = true;
      if (!confirm(x('deleteConfirm'))) return;
      const res = await fetch((window.ASTRO_BACKEND_ORIGIN || '') + '/api/v1/auth/me/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.password.value, confirm_forfeit_balance: form.forfeit.checked }) });
      if (res.ok) { this.dialog.close(); window.App?.handleLogout?.(); return; }
      err.textContent = (await res.json().catch(() => ({}))).detail || x('failed'); err.hidden = false;
    });
  },
  open(kind = 'help') {
    if (!['about', 'privacy', 'terms', 'refund', 'contact', 'help'].includes(kind)) kind = 'help';
    this.kind = kind;
    if (!this.dialog) {
      this.dialog = document.createElement('dialog');
      this.dialog.className = 'exp-dialog service-dialog';
      this.dialog.setAttribute('translate', 'no');
      this.dialog.setAttribute('aria-labelledby', 'service-dialog-title');
      document.body.append(this.dialog);
      this.dialog.addEventListener('click', e => { if (e.target === this.dialog || e.target.closest('[data-service-close]')) this.dialog.close(); });
    }
    this.dialog.innerHTML = `<header><h2 id="service-dialog-title">${esc(x(kind + 'Title'))}</h2><button type="button" class="shop-btn shop-btn--line" data-service-close aria-label="${esc(x('close'))}">✕</button></header><p>${esc(x(kind + 'Copy'))}</p><div class="service-dialog-actions"><a class="shop-btn shop-btn--gold" href="mailto:support@astrojyotish.in">${esc(x('contactTitle'))}</a></div>${kind === 'privacy' ? this.dataControls() : ''}`;
    this.bindDataControls();
    if (!this.dialog.open) this.dialog.showModal();
  }
};
