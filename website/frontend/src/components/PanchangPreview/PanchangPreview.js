import { loadTemplate } from '../../utils/templateLoader.js';

export class PanchangPreviewComponent {
  static templatePath = '/src/components/PanchangPreview/PanchangPreview.html';

  static async loadTemplate() {
    return await loadTemplate(PanchangPreviewComponent.templatePath);
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

export default PanchangPreviewComponent;
