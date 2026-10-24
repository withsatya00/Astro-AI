import { loadTemplate } from '../../utils/templateLoader.js';

export class TestimonialsComponent {
  static templatePath = '/src/components/Testimonials/Testimonials.html';

  static async loadTemplate() {
    return await loadTemplate(TestimonialsComponent.templatePath);
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

export default TestimonialsComponent;
