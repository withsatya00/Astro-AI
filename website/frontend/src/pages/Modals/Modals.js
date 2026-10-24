import { loadTemplate } from '../../utils/templateLoader.js';

export class ModalsComponent {
  static templatePath = '/src/pages/Modals/Modals.html';

  static async loadTemplate() {
    return await loadTemplate(ModalsComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
    }
    return target;
  }
}

export default ModalsComponent;
