import { loadTemplate } from '../../utils/templateLoader.js';

export class AstrologerSearchComponent {
  static templatePath = '/src/components/AstrologerSearch/AstrologerSearch.html';

  static async loadTemplate() {
    return await loadTemplate(AstrologerSearchComponent.templatePath);
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

export default AstrologerSearchComponent;
