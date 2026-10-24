import { loadTemplate } from '../../utils/templateLoader.js';

export class FeaturedAstrologersComponent {
  static templatePath = '/src/components/FeaturedAstrologers/FeaturedAstrologers.html';

  static async loadTemplate() {
    return await loadTemplate(FeaturedAstrologersComponent.templatePath);
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

export default FeaturedAstrologersComponent;
