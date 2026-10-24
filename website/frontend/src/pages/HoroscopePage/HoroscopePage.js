import { loadTemplate } from '../../utils/templateLoader.js';

export class HoroscopePageComponent {
  static templatePath = '/src/pages/HoroscopePage/HoroscopePage.html';

  static async loadTemplate() {
    return await loadTemplate(HoroscopePageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
    }
    return target;
  }
}

export default HoroscopePageComponent;
