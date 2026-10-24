import { loadTemplate } from '../../utils/templateLoader.js';

export class GlobalLoaderComponent {
  static templatePath = '/src/components/GlobalLoader/GlobalLoader.html';

  static async loadTemplate() {
    return await loadTemplate(GlobalLoaderComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
    }
    return target;
  }

  static show(message = 'Calculating Vedic Planetary Positions...') {
    const loader = document.getElementById('global-loader');
    const msgEl = document.getElementById('loader-message');
    if (msgEl) msgEl.textContent = message;
    if (loader) loader.style.display = 'flex';
  }

  static hide() {
    const loader = document.getElementById('global-loader');
    if (loader) loader.style.display = 'none';
  }
}

export default GlobalLoaderComponent;
