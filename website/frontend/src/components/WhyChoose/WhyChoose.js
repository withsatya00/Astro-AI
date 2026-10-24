import { loadTemplate } from '../../utils/templateLoader.js';

export class WhyChooseComponent {
  static templatePath = '/src/components/WhyChoose/WhyChoose.html';

  static async loadTemplate() {
    return await loadTemplate(WhyChooseComponent.templatePath);
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

export default WhyChooseComponent;
