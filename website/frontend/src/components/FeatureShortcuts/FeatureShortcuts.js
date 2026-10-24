import { loadTemplate } from '../../utils/templateLoader.js';

export class FeatureShortcutsComponent {
  static templatePath = '/src/components/FeatureShortcuts/FeatureShortcuts.html';

  static async loadTemplate() {
    return await loadTemplate(FeatureShortcutsComponent.templatePath);
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

export default FeatureShortcutsComponent;
