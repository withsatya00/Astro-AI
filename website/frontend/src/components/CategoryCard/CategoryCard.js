import { loadTemplate } from '../../utils/templateLoader.js';

export class CategoryCardComponent {
  static templatePath = '/src/components/CategoryCard/CategoryCard.html';

  static async loadTemplate() {
    return await loadTemplate(CategoryCardComponent.templatePath);
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

export default CategoryCardComponent;
