import { loadTemplate } from '../../utils/templateLoader.js';

export class PanchangPageComponent {
  static templatePath = '/src/pages/PanchangPage/PanchangPage.html';

  static async loadTemplate() {
    return await loadTemplate(PanchangPageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
    }
    return target;
  }
}

export default PanchangPageComponent;
