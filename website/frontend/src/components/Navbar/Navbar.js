import { loadTemplate } from '../../utils/templateLoader.js';

export class NavbarComponent {
  static templatePath = '/src/components/Navbar/Navbar.html';

  constructor(options = {}) {
    this.currentLanguage = options.language || 'en';
    this.walletBalance = options.walletBalance ?? 0;
    this.activeRoute = options.activeRoute || '/';
  }

  static async loadTemplate() {
    return await loadTemplate(NavbarComponent.templatePath);
  }

  static async mount(container, options = {}) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
      this.bindEvents(target);
    }
    return target;
  }

  static applyLanguage(lang = 'en') {
    const isHi = lang === 'hi';
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt('nav-text-mandir', isHi ? 'मंदिर सेवा' : 'Mandir Seva');
    setTxt('nav-badge-mandir', isHi ? 'पूजा' : 'Puja');
    setTxt('nav-mandir-heading', isHi ? 'मंदिर सेवा' : 'Mandir Seva');
    setTxt('nav-mandir-puja-title', isHi ? 'पूजा' : 'Puja');
    setTxt('nav-mandir-puja-desc', isHi ? 'अपने और परिवार के नाम से मंदिर में पूजा बुक करें' : 'Book a temple puja for you and your family');
    setTxt('nav-mandir-chadhava-title', isHi ? 'चढ़ावा' : 'Chadhava');
    setTxt('nav-mandir-chadhava-desc', isHi ? 'भारत के किसी भी मंदिर में चढ़ाएं, ₹5 से शुरू' : 'Offer at any temple across India, from \u20b95');
    setTxt('nav-mobile-puja', isHi ? 'पूजा' : 'Puja');
    setTxt('nav-mobile-chadhava', isHi ? 'चढ़ावा' : 'Chadhava');
    setTxt('nav-text-mall', isHi ? 'एस्ट्रो मॉल' : 'Astro Mall');
    setTxt('nav-badge-mall', isHi ? 'सिद्ध' : 'Siddh');
    setTxt('nav-text-tools', isHi ? 'ज्योतिष साधन' : 'Vedic Tools');
    setTxt('nav-tools-toggle-text', isHi ? 'सभी टूल देखें' : 'View all tools');
    setTxt('nav-tools-title', isHi ? 'वैदिक ज्योतिष साधन' : 'Vedic Astrology Tools');

    setTxt('nav-item1-title', isHi ? 'दैनिक राशिफल' : 'Daily Horoscope');
    setTxt('nav-item1-desc', isHi ? 'सभी 12 राशियों का आज का फल' : 'Predictions for all 12 Zodiac signs');

    setTxt('nav-item2-title', isHi ? 'आज का पंचांग' : "Today's Panchang");
    setTxt('nav-item2-desc', isHi ? 'तिथि, नक्षत्र, शुभ मुहूर्त व राहुकाल' : 'Tithi, Nakshatra, Shubh Muhurat & Rahukaal');

    setTxt('nav-item3-title', isHi ? 'कुण्डली मिलान' : 'Kundli Matching (Gun Milan)');
    setTxt('nav-item3-desc', isHi ? '36 गुण अष्टकूट व मांगलिक विचार' : '36 Gunas, Ashtakoot & Manglik analysis');

    setTxt('nav-item4-title', isHi ? 'शनि साढ़ेसाती व दोष निवारण' : 'Shani Sade Sati & Dosha');
    setTxt('nav-item4-desc', isHi ? 'कालसर्प, पितृ दोष व वैदिक उपाय' : 'Kaal Sarp, Pitra Dosha & Vedic remedies');
    setTxt('nav-item5-title', isHi ? 'उपहार एवं त्योहार पैक' : 'Gifts & Festival Packs');
    setTxt('nav-item5-desc', isHi ? 'गिफ्ट कार्ड, दीवाली व शिवरात्रि सेट' : 'Gift cards, Diwali & Shivratri sets');
    setTxt('nav-mobile-gifts', isHi ? 'उपहार एवं त्योहार पैक' : 'Gifts & Festival Packs');
  }

  static bindEvents(root = document) {
    const mobileBtn = root.querySelector('#btn-mobile-menu');
    const drawer = root.querySelector('#mobile-nav-drawer');
    const backdrop = root.querySelector('#mobile-nav-backdrop');
    const closeBtn = root.querySelector('#btn-close-mobile-drawer');

    if (mobileBtn && drawer && backdrop) {
      mobileBtn.addEventListener('click', () => {
        drawer.classList.add('active');
        backdrop.classList.add('active');
      });
    }

    if (closeBtn && drawer && backdrop) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
      });
    }

    if (backdrop && drawer) {
      backdrop.addEventListener('click', () => {
        drawer.classList.remove('active');
        backdrop.classList.remove('active');
      });
    }

    // The offer strip can be dismissed for the rest of the session.
    const promo = root.querySelector('.top-promo-bar');
    try { if (promo && sessionStorage.getItem('astro_promo_dismissed') === '1') promo.hidden = true; } catch (e) { /* storage unavailable */ }
    root.querySelector('#promo-dismiss')?.addEventListener('click', () => {
      if (promo) promo.hidden = true;
      try { sessionStorage.setItem('astro_promo_dismissed', '1'); } catch (e) { /* storage unavailable */ }
    });

    // Dropdowns (Mandir Seva, Vedic Tools): click toggle, hover, click-outside and auto-close
    root.querySelectorAll('.site-nav-dropdown-wrapper').forEach((dropdownWrapper) => {
      const dropdownBtn = dropdownWrapper.querySelector('button');
      const dropdownMenu = dropdownWrapper.querySelector('.nav-dropdown-menu');
      if (!dropdownBtn) return;
      const setOpen = (open) => {
        dropdownWrapper.classList.toggle('is-open', open);
        dropdownBtn.setAttribute('aria-expanded', String(open));
      };

      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownWrapper.classList.remove('is-closed');
        setOpen(!dropdownWrapper.classList.contains('is-open'));
      });
      dropdownWrapper.addEventListener('mouseenter', () => setOpen(true));
      dropdownWrapper.addEventListener('mouseleave', () => { dropdownWrapper.classList.remove('is-closed'); setOpen(false); });
      // After a pick the pointer is still over the wrapper, so CSS :hover would keep the menu showing; is-closed hides it until the pointer leaves.
      if (dropdownMenu) dropdownMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { dropdownWrapper.classList.add('is-closed'); setOpen(false); }));
      document.addEventListener('click', (e) => { if (!dropdownWrapper.contains(e.target)) setOpen(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    });

    // Listen for language changes and apply navbar text
    window.addEventListener('astro:languagechange', (e) => {
      const lang = e.detail && e.detail.language ? e.detail.language : 'en';
      NavbarComponent.applyLanguage(lang);
    });

    const savedLang = localStorage.getItem('astro_preferred_lang') || 'en';
    NavbarComponent.applyLanguage(savedLang);
  }

  render() {
    // Synchronous fallback or returns template loading promise
    return NavbarComponent.loadTemplate();
  }
}

export default NavbarComponent;
