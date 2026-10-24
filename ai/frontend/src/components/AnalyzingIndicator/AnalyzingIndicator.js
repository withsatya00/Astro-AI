import { loadTemplate } from '../../utils/templateLoader.js';

export class AnalyzingIndicatorComponent {
  static templatePath = '/src/components/AnalyzingIndicator/AnalyzingIndicator.html';

  static async loadTemplate() {
    return await loadTemplate(AnalyzingIndicatorComponent.templatePath);
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

export default AnalyzingIndicatorComponent;
