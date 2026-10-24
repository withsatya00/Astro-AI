/**
 * AI Consultation Layout Coordinator
 */
export class ConsultationLayout {
  static getTemplate() {
    return document.getElementById('consultation-shell-template')?.innerHTML || '';
  }

  static mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = this.getTemplate();
    }
  }
}

export default ConsultationLayout;
