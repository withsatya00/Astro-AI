import { loadTemplate } from '../../utils/templateLoader.js';

export class HeroComponent {
  static templatePath = '/src/components/Hero/Hero.html';

  static async loadTemplate() {
    return await loadTemplate(HeroComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
      this.bindEvents(target);
    }
    return target;
  }

  static bindEvents(root = document) {
    const form = root.querySelector('#hero-search-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        if (window.App && typeof window.App.handleHeroSearch === 'function') {
          window.App.handleHeroSearch(e);
        } else {
          e.preventDefault();
        }
      });
    }
  }
}

export default HeroComponent;
