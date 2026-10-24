import { loadTemplate } from '../../utils/templateLoader.js';

export class GlobalFooterComponent {
  static templatePath = '/src/components/GlobalFooter/GlobalFooter.html';

  static async loadTemplate() {
    return await loadTemplate(GlobalFooterComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
    }
    return target;
  }

  render() {
    return GlobalFooterComponent.loadTemplate();
  }
}

export default GlobalFooterComponent;
