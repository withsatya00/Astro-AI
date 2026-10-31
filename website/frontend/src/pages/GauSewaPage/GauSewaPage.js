// Gau Sewa: one-time donations to a gaushala, 1:1 Blueprint Reference Match to Image 6 (media_1793433103489_99811173.jpg)
import { api, esc, toast, mediaUrl, downloadFile, isSignedIn, requireLogin, t as shopT } from '../../utils/shop.js';
import { currentLang } from '../../utils/shop-i18n.js';

const PURPOSES = ['chaara', 'chikitsa', 'general'];
const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** Translation helpers (also used by the account dashboard). */
export const T = (key, vars = {}) => {
  const base = window.I18n?.t ? window.I18n.t(key) : key;
  const text = base === key ? shopT(key) : base;
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
};
export const statusLabel = (s) => T('gs_status_' + String(s || '').toLowerCase());
export const purposeLabel = (p) => T('gs_purpose_' + p);

const SEVA_DETAILS = {
  chaara: {
    photo: '/assets/img/gausewa/cow-mother-calf.webp',
    title_en: 'Chara Seva',
    title_hi: 'चारा सेवा',
    desc_en: 'Provide fresh green fodder and nutritious feed to cows, helping maintain their health and natural well-being.',
    desc_hi: 'गायों के उत्तम स्वास्थ्य एवं पोषण हेतु ताजा हरा चारा व पौष्टिक आहार उपलब्ध कराएं।'
  },
  chikitsa: {
    photo: '/assets/img/gausewa/cow-portrait.webp',
    title_en: 'Chikitsa Sahayata',
    title_hi: 'चिकित्सा सहायता',
    desc_en: 'Support medical care, regular checkups and treatment for cows whenever needed.',
    desc_hi: 'रोगग्रस्त व अशक्त गायों के नियमित उपचार, दवा व चिकित्सीय देखभाल में सहयोग करें।'
  },
  general: {
    photo: '/assets/img/gausewa/gaushala-shelter-real.webp',
    title_en: 'General Seva',
    title_hi: 'सामान्य सेवा (आश्रय व रख-रखाव)',
    desc_en: 'Contribute towards the overall care of cows including food, health, shelter and daily maintenance at the Gaushala.',
    desc_hi: 'गौशाला में गायों के आवास, स्वच्छता, छाया और दैनिक प्रबंधन में संपूर्ण सहयोग दें।'
  }
};

export class GauSewaPageComponent {
  static root = null;
  static config = null;
  static gaushalas = [];
  static updates = [];
  static form = {
    amount: 501,
    custom: '',
    purpose: 'chaara',
    name: '',
    email: '',
    phone: '',
    updatesOptIn: true,
    hide: false,
    gaushalaId: null
  };
  static errors = {};
  static busy = false;
  static notice = null;
  static view = 'home';
  static receipt = null;
  static receiptToken = null;
  static pollTimer = null;
  static loadFailed = false;

  static mount(container) {
    this.root = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.root) return;
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('input', (e) => this.onInput(e));
    this.root.addEventListener('submit', (e) => { e.preventDefault(); this.donate(); });
    window.addEventListener('astro:languagechange', () => { if (this.root && this.root.offsetParent !== null) this.render(); });
    window.addEventListener('astro:authchange', () => { if (this.root && this.root.offsetParent !== null) this.prefillName(); });
  }

  static async open() {
    this.view = 'home';
    this.stopPolling();
    this.notice = null;
    this.prefillName();
    this.root.innerHTML = `<div class="gs-reference-page"><p role="status" style="text-align:center; padding:40px; color:#650D24;">Loading Gau Seva...</p></div>`;
    await this.load();
  }

  static async openReceipt(token) {
    this.view = 'receipt';
    this.receiptToken = token;
    this.receipt = null;
    this.root.innerHTML = `<div class="gs-reference-page"><p role="status" style="text-align:center; padding:40px; color:#650D24;">Loading donation receipt...</p></div>`;
    await this.loadReceipt(true);
  }

  static prefillName() {
    const user = window.App?.currentUser;
    if (user) {
      if (!this.form.name) this.form.name = user.full_name || '';
      if (!this.form.email) this.form.email = user.email || '';
      if (!this.form.phone) this.form.phone = user.phone || '';
    }
  }

  static async load() {
    try {
      const data = await api('/api/v1/gau-sewa/home?lang=' + currentLang());
      this.config = data.config || { available: true, presets: [251, 501, 1001], min_amount: 11, max_amount: 100000 };
      this.gaushalas = data.gaushalas || [];
      this.updates = data.updates || [];
      if (!this.form.gaushalaId && this.primary()) this.form.gaushalaId = this.primary().id;
      this.loadFailed = false;
    } catch (err) {
      this.loadFailed = true;
    }
    if (this.view === 'home') this.render();
  }

  static primary() {
    return this.gaushalas.find(g => g.id === this.form.gaushalaId && g.accepting_donations)
      || this.gaushalas.find(g => g.accepting_donations)
      || this.gaushalas[0]
      || null;
  }

  static amount() {
    if (this.form.custom !== '') return /^\d+$/.test(this.form.custom) ? Number(this.form.custom) : 0;
    return this.form.amount;
  }

  // --------------------------------------------------------------------------
  // Rendering
  // --------------------------------------------------------------------------
  static render() {
    if (!this.root) return;
    if (this.view === 'receipt') { this.renderReceipt(); return; }

    const hi = currentLang() === 'hi';
    const amount = this.amount();
    const primaryG = this.primary();
    const sevaInfo = SEVA_DETAILS[this.form.purpose] || SEVA_DETAILS.chaara;
    const selectedSevaTitle = hi ? sevaInfo.title_hi : sevaInfo.title_en;

    this.root.innerHTML = `
      <div class="gs-reference-page">
        <!-- Hero Banner (Unified Chadhava Blueprint) -->
        <header class="service-banner service-banner--gausewa gs-ref-hero">
          <figure class="service-banner__art">
            <img src="/assets/img/gau-sewa-hero-v2.webp" alt="Gau Seva Cow and Calf" fetchpriority="high" />
            <figcaption>${esc(hi ? 'प्रतीकात्मक चित्र' : 'Illustrative image')}</figcaption>
          </figure>
          <div class="mandir-hero__copy service-banner__copy">
            <p class="mandir-hero__eyebrow">✦ ${hi ? 'गौ सेवा – गौ दान महायज्ञ' : 'GAU SEVA – COW DONATION'} ✦</p>
            <h1>${hi ? 'थोड़ी सी करुणा, <em>जीवन भर का संरक्षण</em>' : 'A little kindness, <em>A lifetime of care.</em>'}</h1>
            <p>${hi
              ? 'अपने जीवन में गौ सेवा को स्थान दें। आपका सहयोग हमारी पंजीकृत गौशाला में पूज्य गौ माताओं के दैनिक पोषण, उत्तम स्वास्थ्य और संरक्षण में अत्यंत सहायक है।'
              : 'Bring Cow Seva into your life. Your contribution helps in the care, nourishment and well-being of sacred cows (Gau Mata) at our registered Gaushala.'}</p>
            <div class="shop-hero__actions">
              <a href="#gs-donation-form" class="shop-btn shop-btn--gold" data-gs-scroll>${hi ? 'अभी दान करें' : 'Donate Now'} &rarr;</a>
              <a href="#gs-updates-jump" class="shop-btn shop-btn--white">${hi ? 'गौशाला अपडेट्स' : 'Seva Updates'}</a>
            </div>
          </div>
          <div class="shop-trust service-benefits">
            <div><span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg></span><p><b>${hi ? '100% पारदर्शी' : '100% Transparent'}</b><small>${hi ? 'सत्यापित सेवा' : 'Verified seva'}</small></p></div>
            <div><span><img src="/assets/img/gausewa/cow-calf.webp" alt="Gau Seva" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1px solid #D9A441;" /></span><p><b>${hi ? 'पंजीकृत गौशाला' : 'Registered Gaushala'}</b><small>${hi ? 'पवित्र गौ सेवा' : 'Sacred cow care'}</small></p></div>
            <div><span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></span><p><b>${hi ? 'डिजिटल रसीद' : 'Digital Receipt'}</b><small>${hi ? 'तत्काल पावती' : 'Instant receipt'}</small></p></div>
          </div>
        </header>

        <!-- Two-Column Main Layout -->
        <div class="gs-ref-layout">
          <!-- Left Column -->
          <div class="gs-ref-left">
            <div>
              <div class="gs-ref-section-kicker">${hi ? 'निःस्वार्थ सेवा हेतु पावन अर्पण' : 'AN OFFERING FOR THE SELFLESS'}</div>
              <h2 class="gs-ref-section-title">${hi ? 'आपकी करुणा, उनकी नित्य देखभाल' : 'Your kindness, their everyday care'}</h2>
              <p class="gs-ref-section-intro">
                ${hi
                  ? 'अपनी श्रद्धा अनुसार गौ सेवा का विकल्प चुनें। आपका प्रत्येक योगदान गौशाला में गायों की दैनिक सुरक्षा, चारे और स्वास्थ्य में समर्पित होता है।'
                  : 'Choose a Gau Seva option that resonates with your devotion. Each contribution supports the daily care, nourishment, and well-being of cows at our Gaushala.'}
              </p>
            </div>

            <!-- 3 Seva Selection Cards (Real Photos) -->
            <div class="gs-ref-seva-cards">
              ${PURPOSES.map(p => {
                const s = SEVA_DETAILS[p];
                const isActive = this.form.purpose === p;
                return `
                  <div class="gs-ref-seva-card ${isActive ? 'is-active' : ''}" data-gs-purpose="${p}">
                    <div class="gs-ref-seva-icon-circle">
                      <img src="${s.photo}" alt="${esc(s.title_en)}" class="gs-ref-seva-thumb" />
                    </div>
                    <div class="gs-ref-seva-body">
                      <div class="gs-ref-seva-title">${esc(hi ? s.title_hi : s.title_en)}</div>
                      <p class="gs-ref-seva-desc">${esc(hi ? s.desc_hi : s.desc_en)}</p>
                    </div>
                    <div class="gs-ref-seva-radio"></div>
                  </div>
                `;
              }).join('')}
            </div>

            <!-- A thoughtful way to give (Real Cow Photo) -->
            <div class="gs-ref-thoughtful-card">
              <div>
                <h3 class="gs-ref-block-title">
                  <span>✦</span> ${hi ? 'सहयोग का पावन व सरल मार्ग' : 'A thoughtful way to give'}
                </h3>
                <div class="gs-ref-steps-list">
                  <div class="gs-ref-step-row">
                    <div class="gs-ref-step-num">1</div>
                    <div class="gs-ref-step-text">
                      <strong>${hi ? 'सेवा का चयन करें' : 'Choose your seva'}</strong>
                      <p>${hi ? 'अपनी श्रद्धा और सामर्थ्य अनुसार गौ सेवा चुनें।' : 'Select the Gau Seva option that suits your devotion.'}</p>
                    </div>
                  </div>
                  <div class="gs-ref-step-row">
                    <div class="gs-ref-step-num">2</div>
                    <div class="gs-ref-step-text">
                      <strong>${hi ? 'यथाशक्ति सहयोग दें' : 'Give what feels right'}</strong>
                      <p>${hi ? 'अपनी इच्छानुसार कोई भी राशि समर्पित करें।' : 'Contribute an amount of your choice.'}</p>
                    </div>
                  </div>
                  <div class="gs-ref-step-row">
                    <div class="gs-ref-step-num">3</div>
                    <div class="gs-ref-step-text">
                      <strong>${hi ? 'डिजिटल रसीद प्राप्त करें' : 'Keep your receipt'}</strong>
                      <p>${hi ? 'दान की अधिकृत पावती व गौशाला अपडेट्स प्राप्त करें।' : 'Get a digital receipt and updates about the Gau Seva.'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="gs-ref-thoughtful-media">
                <img src="/assets/img/gausewa/cow-mother-calf.webp" alt="Sacred Cow and Calf" class="gs-ref-cow-art-img" />
              </div>
            </div>

            <!-- About the Gaushala (Real Gaushala Shelter Photo) -->
            <div class="gs-ref-about-card">
              <h3 class="gs-ref-block-title">
                <span>✦</span> ${hi ? 'गौशाला परिचय' : 'About the Gaushala'}
              </h3>
              <div class="gs-ref-gaushala-media-row">
                <img src="/assets/img/gausewa/gaushala-shelter-real.webp" alt="Gaushala Cow Care Center" />
                <div class="gs-ref-gaushala-info">
                  <h4>${esc(primaryG?.name || (hi ? 'श्री कामधेनु गौ सेवा केंद्र' : 'Gaushala (Cow Care Center)'))}</h4>
                  <p>
                    ${esc(primaryG?.introduction || (hi
                      ? 'हमारी पंजीकृत गौशाला निराश्रित, वृद्ध एवं असहाय गायों के संरक्षण, चिकित्सा और सात्विक पोषण हेतु पूर्णतः समर्पित है।'
                      : 'Our registered Gaushala is dedicated to the care, protection and service of cows, ensuring their health, safety and a nurturing environment.'))}
                  </p>
                </div>
              </div>
            </div>

            <!-- Seva Updates -->
            <div class="gs-ref-updates-bar" id="gs-updates-jump">
              <div class="gs-ref-updates-left">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" class="bell-icon" style="color:#D9A441;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                <div>
                  <strong>${hi ? 'गौ सेवा अपडेट्स' : 'Seva Updates'}</strong>
                  <span>${hi ? 'गौशाला से नियमित गतिविधियां, तस्वीरें और सूचनाएं प्राप्त करें।' : 'Get regular updates, photos and important announcements from the Gaushala.'}</span>
                </div>
              </div>
              <span style="font-size: 16px; font-weight: 800; color: #650D24;">➔</span>
            </div>

            <!-- Before you contribute (FAQ Accordion) -->
            <div>
              <h3 class="gs-ref-block-title">
                <span>✦</span> ${hi ? 'दान करने से पूर्व महत्वपूर्ण प्रश्न' : 'Before you contribute'}
              </h3>
              <div class="gs-ref-faq-list">
                <div class="gs-ref-faq-item is-open">
                  <div class="gs-ref-faq-q">
                    <span>${hi ? 'मुझे गौ सेवा क्यों करनी चाहिए?' : 'Why should I do Gau Seva?'}</span>
                    <span>▼</span>
                  </div>
                  <div class="gs-ref-faq-a">
                    ${hi
                      ? 'सनातन धर्म में गौ माता को समस्त देवताओं का वास माना गया है। गौ सेवा से कुंडली के ग्रह दोष शांत होते हैं, सुख-समृद्धि और मानसिक शांति प्राप्त होती है।'
                      : 'In Vedic culture, serving Gau Mata brings immense spiritual merit, removes karmic obstacles, and bestows peace, health and prosperity upon the donor\'s family.'}
                  </div>
                </div>
                <div class="gs-ref-faq-item">
                  <div class="gs-ref-faq-q">
                    <span>${hi ? 'क्या मुझे दान की आधिकारिक रसीद मिलेगी?' : 'Will I receive a receipt?'}</span>
                    <span>▼</span>
                  </div>
                  <div class="gs-ref-faq-a">
                    ${hi
                      ? 'हाँ, दान संपन्न होते ही आपको अधिकृत डिजिटल रसीद और संदर्भ संख्या तुरंत प्राप्त होगी जिसे आप डाउनलोड व प्रिंट कर सकते हैं।'
                      : 'Yes, instantly after successful donation you receive an official digital receipt with transaction reference number that can be downloaded or printed.'}
                  </div>
                </div>
                <div class="gs-ref-faq-item">
                  <div class="gs-ref-faq-q">
                    <span>${hi ? 'मैं गौ सेवा के अपडेट्स कहाँ देख सकता हूँ?' : 'Where can I see seva updates?'}</span>
                    <span>▼</span>
                  </div>
                  <div class="gs-ref-faq-a">
                    ${hi
                      ? 'गौशाला द्वारा चारे की खरीद, चिकित्सीय शिविर और सेवा की तस्वीरें हमारे पोर्टल और आपके पंजीकृत व्हाट्सएप / ईमेल पर साझा की जाती हैं।'
                      : 'Regular photographs, fodder distribution updates, and medical care reports are published directly on our portal and shared via WhatsApp/Email.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Donation Form Card -->
          <div class="gs-ref-donation-card" id="gs-donation-form">
            <form id="gs-form-element">
              <div class="gs-ref-form-kicker">${hi ? 'पुण्य एवं सेवा हेतु' : 'FOR A CAUSE OF KINDNESS'}</div>
              <h3 class="gs-ref-form-title">${hi ? 'पावन गौ दान करें' : 'Make a Donation'}</h3>
              <p class="gs-ref-form-sub">${hi ? 'गौ सेवा में भाग लें और इस पावन पुण्य के सहभागी बनें।' : 'Contribute to Gau Seva and be a part of this noble service.'}</p>

              <!-- Support highlight box (Real Cow Photo) -->
              <div class="gs-ref-support-box">
                <img src="/assets/img/gausewa/cow-calf.webp" alt="Sacred Cow" class="gs-ref-support-cow-thumb" />
                <div>
                  <strong>${hi ? 'आपका दान सहयोग करेगा:' : 'Your donation will support'}</strong>
                  <p>${hi ? 'हमारी पंजीकृत गौशाला में गायों के दैनिक चारे, चिकित्सा उपचार, आश्रय और संपूर्ण पोषण में।' : 'Daily food, medical care, shelter and overall well-being of cows at our registered Gaushala.'}</p>
                </div>
              </div>

              <!-- Amount Input -->
              <div style="margin-bottom: 12px;">
                <label class="gs-ref-field-label" for="gs-ref-amount">${hi ? 'दान राशि' : 'AMOUNT'}</label>
                <span class="gs-ref-field-sub">${hi ? 'अपनी इच्छानुसार राशि दर्ज करें:' : 'Enter your donation amount'}</span>
                <div class="gs-ref-amount-input-wrap">
                  <span class="gs-ref-amount-currency">₹</span>
                  <input
                    type="number"
                    id="gs-ref-amount"
                    class="gs-ref-amount-input"
                    value="${this.form.custom !== '' ? this.form.custom : this.form.amount}"
                    min="11"
                    placeholder="501"
                    required
                  />
                </div>
                <p class="gs-ref-amount-helper">
                  ${hi ? 'आप अपनी इच्छानुसार कोई भी राशि चुन सकते हैं। प्रत्येक छोटा योगदान महत्वपूर्ण है।' : 'You can choose any amount as per your wish. Every contribution makes a difference.'}
                </p>
              </div>

              <!-- Quick Select Buttons (₹251, ₹501, ₹1,001) -->
              <div class="gs-ref-quick-amounts">
                <button type="button" class="gs-ref-quick-btn ${this.form.custom === '' && this.form.amount === 251 ? 'is-active' : ''}" data-gs-amount="251">₹ 251</button>
                <button type="button" class="gs-ref-quick-btn ${this.form.custom === '' && this.form.amount === 501 ? 'is-active' : ''}" data-gs-amount="501">₹ 501</button>
                <button type="button" class="gs-ref-quick-btn ${this.form.custom === '' && this.form.amount === 1001 ? 'is-active' : ''}" data-gs-amount="1001">₹ 1,001</button>
              </div>

              <!-- Devotee Inputs -->
              <div class="gs-ref-input-group">
                <label class="gs-ref-input-label" for="gs-donor-name">${hi ? 'आपका नाम *' : 'Your Name *'}</label>
                <input
                  type="text"
                  id="gs-donor-name"
                  class="gs-ref-text-input"
                  placeholder="${hi ? 'अपना नाम दर्ज करें' : 'Enter your name'}"
                  value="${esc(this.form.name)}"
                  required
                />
              </div>

              <div class="gs-ref-input-group">
                <label class="gs-ref-input-label" for="gs-donor-email">${hi ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}</label>
                <input
                  type="email"
                  id="gs-donor-email"
                  class="gs-ref-text-input"
                  placeholder="${hi ? 'अपना ईमेल दर्ज करें' : 'Enter your email'}"
                  value="${esc(this.form.email)}"
                />
              </div>

              <div class="gs-ref-input-group">
                <label class="gs-ref-input-label" for="gs-donor-phone">${hi ? 'फोन नंबर (वैकल्पिक)' : 'Phone Number (Optional)'}</label>
                <input
                  type="tel"
                  id="gs-donor-phone"
                  class="gs-ref-text-input"
                  placeholder="${hi ? 'अपना मोबाइल नंबर दर्ज करें' : 'Enter your mobile number'}"
                  value="${esc(this.form.phone)}"
                />
              </div>

              <label class="gs-ref-check-row">
                <input type="checkbox" id="gs-optin-updates" ${this.form.updatesOptIn ? 'checked' : ''} />
                <span>${hi ? 'मैं व्हाट्सएप / ईमेल पर गौ सेवा की प्रगति प्राप्त करना चाहता हूँ।' : 'I want to receive Gau Seva updates via WhatsApp/Email.'}</span>
              </label>

              <!-- Payment Option (Astro Wallet Live Integration) -->
              <div class="gs-ref-payment-selector" style="margin: 12px 0 16px; padding: 12px 14px; background: #FFFDF9; border: 1px solid #E5D9C7; border-radius: 12px;">
                <label style="display:block; font-size:11px; font-weight:700; color:#450817; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.04em;">
                  💳 ${hi ? 'भुगतान का माध्यम (Payment Method)' : 'Payment Method'}
                </label>
                <label style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 12px; border-radius:8px; background:rgba(217,164,65,0.08); border:1px solid #D9A441; cursor:pointer; font-size:12.5px; font-weight:600; color:#1E1B4B;">
                  <div style="display:flex; align-items:center; gap:8px;">
                    <input type="radio" name="gs_payment_method" value="wallet" checked style="accent-color:#450817;" />
                    <span>💰 ${hi ? 'एस्ट्रो वॉलेट (Astro Wallet)' : 'Astro Jyotish Wallet'}</span>
                  </div>
                  <span style="font-size:11px; padding:2px 8px; border-radius:20px; background:#450817; color:#F6E0A8; font-weight:700;" id="gs-wallet-pill">
                    ${window.App && window.App.walletBalance !== undefined ? '₹' + Number(window.App.walletBalance).toFixed(2) : 'Astro Wallet'}
                  </span>
                </label>
                <div style="margin-top:6px; font-size:11px; display:flex; justify-content:space-between; align-items:center;">
                  <span style="color:#726268;">${hi ? 'सुरक्षित वॉलेट से तुरंत दान राशि कटेगी' : 'Instant deduction from your funded wallet'}</span>
                  <button type="button" onclick="window.App && window.App.openWalletModal ? window.App.openWalletModal() : (window.Router && window.Router.navigate('/dashboard'))" style="background:none; border:none; color:#B45309; font-weight:700; text-decoration:underline; cursor:pointer; font-size:11px; padding:0;">
                    ${hi ? '+ वॉलेट रिचार्ज' : '+ Recharge Wallet'}
                  </button>
                </div>
              </div>

              <!-- Inclusions Box -->
              <div class="gs-ref-inclusions-box">
                <div class="gs-ref-inclusions-title">
                  <span>✦</span> ${hi ? 'आपके सहयोग में शामिल है:' : 'Your contribution includes'}
                </div>
                <div class="gs-ref-inclusions-list">
                  <div class="gs-ref-inclusion-item">
                    <span class="check">✓</span>
                    <span>${hi ? 'डिजिटल दान पावती (रसीद)' : 'Digital donation receipt'}</span>
                  </div>
                  <div class="gs-ref-inclusion-item">
                    <span class="check">✓</span>
                    <span>${hi ? 'गौशाला से नियमित गतिविधियां व अपडेट्स' : 'Regular updates from the Gaushala'}</span>
                  </div>
                  <div class="gs-ref-inclusion-item">
                    <span class="check">✓</span>
                    <span>${hi ? 'गौ माता सेवा का अमोघ आध्यात्मिक पुण्य' : 'Satisfaction of supporting Gau Mata (Cow Care)'}</span>
                  </div>
                </div>
              </div>

              <!-- Summary Row -->
              <div class="gs-ref-summary-row">
                <div>
                  <small style="color:#726268; display:block; font-size:11px;">${hi ? 'चयनित सेवा' : 'Selected Seva'}</small>
                  <strong>${esc(selectedSevaTitle)}</strong>
                </div>
                <div style="text-align:right;">
                  <small style="color:#726268; display:block; font-size:11px;">${hi ? 'दान राशि' : 'Amount'}</small>
                  <span class="gs-ref-summary-amount">₹${amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <!-- Big CTA Button -->
              <button type="submit" class="gs-ref-submit-btn" id="gs-submit-btn" ${this.busy ? 'disabled' : ''}>
                ${this.busy
                  ? (hi ? 'प्रक्रिया जारी...' : 'Processing...')
                  : (hi ? `दान समर्पित करें (₹${amount.toLocaleString('en-IN')}) ➔` : 'Contribute Now ➔')}
              </button>

              <div class="gs-ref-trust-footer">
                <span>🔒</span>
                <span>${hi ? '100% सुरक्षित एवं विश्वसनीय दान व्यवस्था' : 'Secure and trusted donation experience'}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  // --------------------------------------------------------------------------
  // Events & Interactions
  // --------------------------------------------------------------------------
  static bindEvents() {
    if (!this.root) return;

    // FAQ Accordion click
    this.root.querySelectorAll('.gs-ref-faq-q').forEach(q => {
      q.addEventListener('click', () => {
        const item = q.closest('.gs-ref-faq-item');
        if (item) item.classList.toggle('is-open');
      });
    });

    // Seva Purpose Selection
    this.root.querySelectorAll('[data-gs-purpose]').forEach(card => {
      card.addEventListener('click', () => {
        this.form.purpose = card.dataset.gsPurpose;
        this.render();
      });
    });

    // Quick Amount buttons
    this.root.querySelectorAll('[data-gs-amount]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.form.amount = parseInt(btn.dataset.gsAmount, 10);
        this.form.custom = '';
        this.render();
      });
    });

    // Custom Amount Input
    const amtInput = this.root.querySelector('#gs-ref-amount');
    if (amtInput) {
      amtInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        this.form.custom = val;
        const num = parseInt(val, 10);
        const displayAmt = isNaN(num) ? 0 : num;
        const summaryAmt = this.root.querySelector('.gs-ref-summary-amount');
        if (summaryAmt) summaryAmt.textContent = `₹${displayAmt.toLocaleString('en-IN')}`;
        const submitBtn = this.root.querySelector('#gs-submit-btn');
        if (submitBtn && !this.busy) {
          const hi = currentLang() === 'hi';
          submitBtn.innerHTML = hi ? `दान समर्पित करें (₹${displayAmt.toLocaleString('en-IN')}) ➔` : 'Contribute Now ➔';
        }
        this.root.querySelectorAll('.gs-ref-quick-btn').forEach(b => b.classList.remove('is-active'));
      });
    }

    // Donor Info inputs
    const nameInput = this.root.querySelector('#gs-donor-name');
    if (nameInput) nameInput.addEventListener('input', (e) => { this.form.name = e.target.value; });

    const emailInput = this.root.querySelector('#gs-donor-email');
    if (emailInput) emailInput.addEventListener('input', (e) => { this.form.email = e.target.value; });

    const phoneInput = this.root.querySelector('#gs-donor-phone');
    if (phoneInput) phoneInput.addEventListener('input', (e) => { this.form.phone = e.target.value; });

    const optin = this.root.querySelector('#gs-optin-updates');
    if (optin) optin.addEventListener('change', (e) => { this.form.updatesOptIn = e.target.checked; });

    // Scroll button
    const scrollBtn = this.root.querySelector('[data-gs-scroll]');
    if (scrollBtn) {
      scrollBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const formEl = this.root.querySelector('#gs-donation-form');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  // --------------------------------------------------------------------------
  // Donation Submission & Razorpay Integration
  // --------------------------------------------------------------------------
  static async donate() {
    const amt = this.amount();
    const hi = currentLang() === 'hi';
    if (!amt || amt < 11) {
      toast(hi ? 'कृपया न्यूनतम ₹11 की राशि दर्ज करें' : 'Please enter an amount of at least ₹11', 'error');
      return;
    }
    if (!this.form.name.trim()) {
      toast(hi ? 'कृपया अपना नाम दर्ज करें' : 'Please enter your name', 'error');
      return;
    }

    if (!isSignedIn()) {
      if (!requireLogin('auth.neededDonation')) return;
    }

    this.busy = true;
    this.render();

    try {
      // 1. Submit donation directly using Astro Wallet
      const res = await api('/api/v1/gau-sewa/donations/wallet', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({
          amount: amt,
          purpose: this.form.purpose,
          donor_name: this.form.name.trim(),
          donor_email: this.form.email.trim() || null,
          donor_phone: this.form.phone.trim() || null,
          optin_updates: this.form.updatesOptIn,
          hide_name_public: this.form.hide,
          gaushala_id: this.primary()?.id || null
        })
      });

      this.busy = false;
      toast(hi ? 'गौ सेवा दान सफलतापूर्वक संपन्न हुआ! पुण्य लाभ प्राप्त हुआ।' : 'Gau Seva contribution successful! Thank you for your devotion.', 'success');
      
      // Update global wallet balance in navbar and drawer
      if (window.App && window.App.refreshWalletUI) window.App.refreshWalletUI();
      if (window.NotificationBell) window.NotificationBell.refresh();

      // Immediately navigate to digital donation receipt
      if (res.receipt_token) {
        window.history.pushState(null, '', `/gau-sewa/receipt/${res.receipt_token}`);
        this.openReceipt(res.receipt_token);
      } else {
        this.render();
      }
    } catch (err) {
      this.busy = false;
      // If insufficient balance, offer to open wallet recharge modal
      if (err.message && err.message.toLowerCase().includes('insufficient')) {
        toast(err.message, 'error');
        if (window.App && window.App.openWalletModal) {
          setTimeout(() => window.App.openWalletModal(), 800);
        }
      } else {
        toast(err.message || 'Donation could not be processed', 'error');
      }
      this.render();
    }
  }

  static async loadCheckout() {
    if (window.Razorpay) return;
    await new Promise((resolve, reject) => {
      const el = Object.assign(document.createElement('script'), {
        src: 'https://checkout.razorpay.com/v1/checkout.js',
        onload: resolve,
        onerror: () => reject(new Error('Payment window could not load'))
      });
      document.head.appendChild(el);
    });
  }

  static async confirm(order, response) {
    this.view = 'receipt';
    this.receiptToken = order.receipt_token;
    this.render();
    try {
      await api('/api/v1/gau-sewa/donations/verify', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(response)
      });
    } catch (_) {}
    await this.loadReceipt(true);
  }

  static async loadReceipt() {
    try {
      this.receipt = await api('/api/v1/gau-sewa/donations/receipt/' + encodeURIComponent(this.receiptToken));
    } catch (_) {}
    this.renderReceipt();
  }

  static renderReceipt() {
    if (!this.root) return;
    const hi = currentLang() === 'hi';
    const r = this.receipt;

    this.root.innerHTML = `
      <div class="gs-reference-page" style="max-width: 680px; margin: 40px auto;">
        <div style="background: #FFFFFF; border: 2px solid #D9A441; border-radius: 20px; padding: 36px 32px; box-shadow: 0 10px 30px rgba(62,11,24,0.08); text-align: center;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #DEF7EC; color: #03543F; font-size: 32px; display: grid; place-items: center; margin: 0 auto 16px;">✓</div>
          <span style="color: #92400E; font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase;">
            ${hi ? 'पुण्य पावती • अधिकृत रसीद' : 'OFFICIAL DONATION RECEIPT'}
          </span>
          <h2 style="font-family: 'Cinzel', Georgia, serif; font-size: 26px; font-weight: 700; color: #2D0810; margin: 8px 0 16px;">
            ${hi ? 'गौ सेवा में आपका पावन सहयोग स्वीकार हुआ' : 'Thank You for Your Sacred Contribution'}
          </h2>
          <p style="font-size: 13.5px; color: #635359; line-height: 1.6; margin-bottom: 24px;">
            ${hi
              ? 'गौ माता की सेवा में आपका दान सफलता पूर्वक प्राप्त हो चुका है। आपका यह सात्विक कार्य समस्त परिवार के लिए मंगलकारी हो।'
              : 'Your generous offering to Gau Mata has been gratefully received. May this noble seva bring blessings, peace and prosperity to you and your loved ones.'}
          </p>

          <div style="background: #FAF7F2; border: 1px solid #E5D9C7; border-radius: 14px; padding: 20px; text-align: left; margin-bottom: 28px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #726268;">${hi ? 'रसीद संख्या:' : 'Receipt Reference:'}</span>
              <strong style="color: #2D0810;">${esc(this.receiptToken || 'GS-REC-89213')}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #726268;">${hi ? 'दाता का नाम:' : 'Donor Name:'}</span>
              <strong style="color: #2D0810;">${esc(r?.donor_name || this.form.name || 'Devotee')}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 8px; font-size: 13px;">
              <span style="color: #726268;">${hi ? 'सेवा प्रकार:' : 'Seva Purpose:'}</span>
              <strong style="color: #2D0810;">${esc(SEVA_DETAILS[this.form.purpose]?.title_en || 'Chara Seva')}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size: 15px; border-top: 1px dashed #E5D9C7; padding-top: 10px; margin-top: 10px;">
              <span style="color: #2D0810; font-weight:700;">${hi ? 'समर्पित राशि:' : 'Amount Donated:'}</span>
              <strong style="color: #650D24; font-size: 18px; font-weight: 800;">₹${this.amount().toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div style="display:flex; gap: 12px; justify-content:center;">
            <button type="button" class="btn-primary-maroon" onclick="window.print()" style="padding: 10px 24px; font-size: 13px;">
              🖨 ${hi ? 'रसीद प्रिंट करें' : 'Print Receipt'}
            </button>
            <button type="button" class="btn-secondary-white" onclick="window.Router?.navigate('/gau-sewa'); GauSewaPageComponent.open();" style="padding: 10px 24px; font-size: 13px;">
              ${hi ? 'मुख्य पृष्ठ पर लौटें' : 'Back to Gau Seva'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  static stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
  }
}

if (typeof window !== 'undefined') {
  window.GauSewaPageComponent = GauSewaPageComponent;
}
