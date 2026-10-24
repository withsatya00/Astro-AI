import { loadTemplate } from '../../utils/templateLoader.js';

export class DashaQuickStripComponent {
  static templatePath = '/src/components/DashaQuickStrip/DashaQuickStrip.html';

  static async loadTemplate() {
    return await loadTemplate(DashaQuickStripComponent.templatePath);
  }

  static async mount(container, data = null) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
      this.populateData(target, data);
      this.bindEvents(target);
    }
    return target;
  }

  static populateData(root, data) {
    if (!data) return;
    const lagnaEl = root.querySelector('#quick-strip-lagna') || root.querySelector('#strip-lagna');
    if (lagnaEl && data.lagna) lagnaEl.textContent = data.lagna;

    const nakshatraEl = root.querySelector('#quick-strip-nakshatra') || root.querySelector('#strip-nakshatra');
    if (nakshatraEl && data.nakshatra) nakshatraEl.textContent = data.nakshatra;

    const dashaEl = root.querySelector('#quick-strip-dasha') || root.querySelector('#strip-dasha');
    if (dashaEl && data.dasha) dashaEl.textContent = data.dasha;
  }

  static bindEvents(root = document) {
    const strip = root.querySelector('#chat-dasha-quick-strip');
    if (strip && !strip.dataset.bound) {
      strip.dataset.bound = 'true';
      strip.addEventListener('click', () => {
        if (window.ChatController && typeof window.ChatController.toggleKundliSheet === 'function') {
          window.ChatController.toggleKundliSheet();
        }
      });
    }
  }
}

export default DashaQuickStripComponent;
