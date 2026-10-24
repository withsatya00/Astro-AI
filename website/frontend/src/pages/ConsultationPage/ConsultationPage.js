import { loadTemplate } from '../../utils/templateLoader.js';

export class ConsultationPageComponent {
  static templatePath = '/src/pages/ConsultationPage/ConsultationPage.html?v=ultra_v10';

  static async loadTemplate() {
    return await loadTemplate(ConsultationPageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
    }
    return target;
  }
}

export default ConsultationPageComponent;
