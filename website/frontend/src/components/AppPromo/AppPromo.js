import { loadTemplate } from '../../utils/templateLoader.js';

export class AppPromoComponent {
  static templatePath = '/src/components/AppPromo/AppPromo.html';

  static async loadTemplate() {
    return await loadTemplate(AppPromoComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
    }
    return target;
  }
}

export default AppPromoComponent;
