import { loadTemplate } from '../../utils/templateLoader.js';

export class CalculatorsPageComponent {
  static templatePath = '/src/pages/CalculatorsPage/CalculatorsPage.html';

  static async loadTemplate() {
    return await loadTemplate(CalculatorsPageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
    }
    return target;
  }
}

export default CalculatorsPageComponent;
