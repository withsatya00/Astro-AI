import { loadTemplate } from '../../utils/templateLoader.js';

export class NavbarComponent {
  static templatePath = '/src/components/Navbar/Navbar.html';

  constructor(options = {}) {
    this.currentLanguage = options.language || 'en';
    this.walletBalance = options.walletBalance || 250;
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

    setTxt('nav-text-mandir', isHi ? '🏛️ मंदिर सेवा' : '🏛️ Mandir Seva');
    setTxt('nav-badge-mandir', isHi ? 'पूजा' : 'Puja');
    setTxt('nav-text-mall', isHi ? '📿 एस्ट्रो मॉल' : '📿 Astro Mall');
    setTxt('nav-badge-mall', isHi ? 'सिद्ध' : 'Siddh');
    setTxt('nav-text-tools', isHi ? '🔮 ज्योतिष साधन' : '🔮 Vedic Tools');
    setTxt('nav-tools-title', isHi ? 'वैदिक ज्योतिष साधन' : 'Vedic Astrology Tools');

    setTxt('nav-item1-title', isHi ? 'दैनिक राशिफल (Horoscope)' : 'Daily Horoscope');
    setTxt('nav-item1-desc', isHi ? 'सभी 12 राशियों का आज का फल' : 'Predictions for all 12 Zodiac signs');

    setTxt('nav-item2-title', isHi ? 'आज का पंचांग (Panchang)' : "Today's Panchang");
    setTxt('nav-item2-desc', isHi ? 'तिथि, नक्षत्र, शुभ मुहूर्त व राहुकाल' : 'Tithi, Nakshatra, Shubh Muhurat & Rahukaal');

    setTxt('nav-item3-title', isHi ? 'कुण्डली मिलान (Gun Milan)' : 'Kundli Matching (Gun Milan)');
    setTxt('nav-item3-desc', isHi ? '36 गुण अष्टकूट व मांगलिक विचार' : '36 Gunas, Ashtakoot & Manglik analysis');

    setTxt('nav-item4-title', isHi ? 'शनि साढ़ेसाती व दोष निवारण' : 'Shani Sade Sati & Dosha');
    setTxt('nav-item4-desc', isHi ? 'कालसर्प, पितृ दोष व वैदिक उपाय' : 'Kaal Sarp, Pitra Dosha & Vedic remedies');
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

    // Vedic Tools dropdown click toggle, click-outside and auto-close
    const dropdownWrapper = root.querySelector('#nav-dropdown-tools') || root.querySelector('.site-nav-dropdown-wrapper');
    const dropdownBtn = root.querySelector('#nav-link-tools-btn');
    const dropdownMenu = root.querySelector('.nav-dropdown-menu');

    if (dropdownWrapper && dropdownBtn) {
      // Toggle on button click
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownWrapper.classList.contains('is-open');
        if (isOpen) {
          dropdownWrapper.classList.remove('is-open');
          dropdownBtn.setAttribute('aria-expanded', 'false');
        } else {
          dropdownWrapper.classList.add('is-open');
          dropdownBtn.setAttribute('aria-expanded', 'true');
        }
      });

      // Hover enter/leave for desktop fine pointer
      dropdownWrapper.addEventListener('mouseenter', () => {
        dropdownWrapper.classList.add('is-open');
        dropdownBtn.setAttribute('aria-expanded', 'true');
      });
      dropdownWrapper.addEventListener('mouseleave', () => {
        dropdownWrapper.classList.remove('is-open');
        dropdownBtn.setAttribute('aria-expanded', 'false');
      });

      // Close when clicking any link inside dropdown
      if (dropdownMenu) {
        dropdownMenu.querySelectorAll('a').forEach((link) => {
          link.addEventListener('click', () => {
            dropdownWrapper.classList.remove('is-open');
            dropdownBtn.setAttribute('aria-expanded', 'false');
          });
        });
      }

      // Close when clicking anywhere outside
      document.addEventListener('click', (e) => {
        if (!dropdownWrapper.contains(e.target)) {
          dropdownWrapper.classList.remove('is-open');
          dropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdownWrapper.classList.remove('is-open');
          dropdownBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Listen for language changes and apply navbar text
    window.addEventListener('astro:languagechange', (e) => {
      const lang = e.detail && e.detail.language ? e.detail.language : 'en';
      NavbarComponent.applyLanguage(lang);
    });

    const savedLang = localStorage.getItem('astro_lang') || 'en';
    NavbarComponent.applyLanguage(savedLang);
  }

  render() {
    // Synchronous fallback or returns template loading promise
    return NavbarComponent.loadTemplate();
  }
}

export default NavbarComponent;
