import { loadTemplate } from '../../utils/templateLoader.js';

export class TrustStatsComponent {
  static templatePath = '/src/components/TrustStats/TrustStats.html';

  static async loadTemplate() {
    return await loadTemplate(TrustStatsComponent.templatePath);
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

export default TrustStatsComponent;
