import { loadTemplate } from '../../utils/templateLoader.js';

export class BlogCardsComponent {
  static templatePath = '/src/components/BlogCards/BlogCards.html';

  static async loadTemplate() {
    return await loadTemplate(BlogCardsComponent.templatePath);
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

export default BlogCardsComponent;
