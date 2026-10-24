import { loadTemplate } from '../../utils/templateLoader.js';

export class DirectoryPageComponent {
  static templatePath = '/src/pages/DirectoryPage/DirectoryPage.html';

  static async loadTemplate() {
    return await loadTemplate(DirectoryPageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
    }
    return target;
  }
}

export default DirectoryPageComponent;
