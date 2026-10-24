import { loadTemplate } from '../../utils/templateLoader.js';

export class MuhuratTimelineComponent {
  static templatePath = '/src/components/MuhuratTimeline/MuhuratTimeline.html';

  static async loadTemplate() {
    return await loadTemplate(MuhuratTimelineComponent.templatePath);
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

export default MuhuratTimelineComponent;
