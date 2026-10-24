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
  }

  render() {
    // Synchronous fallback or returns template loading promise
    return NavbarComponent.loadTemplate();
  }
}

export default NavbarComponent;
