import { loadTemplate } from '../../utils/templateLoader.js';

export class CalculatorsComponent {
  static templatePath = '/src/components/Calculators/Calculators.html';

  static async loadTemplate() {
    return await loadTemplate(CalculatorsComponent.templatePath);
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

export default CalculatorsComponent;
