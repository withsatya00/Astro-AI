import { loadTemplate } from '../../utils/templateLoader.js';

export class KundliBottomSheetComponent {
  static templatePath = '/src/components/KundliBottomSheet/KundliBottomSheet.html';

  static async loadTemplate() {
    return await loadTemplate(KundliBottomSheetComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
      this.bindEvents(target);
    }
    return target;
  }

  static bindEvents(root = document) {
    const closeBtn = root.querySelector('#btn-sheet-close');
    const backdrop = root.querySelector('#kundli-sheet-backdrop');
    const closeFn = () => {
      if (window.ChatController && typeof window.ChatController.closeKundliSheet === 'function') {
        window.ChatController.closeKundliSheet();
      }
    };
    if (closeBtn && !closeBtn.dataset.bound) {
      closeBtn.dataset.bound = 'true';
      closeBtn.addEventListener('click', closeFn);
    }
    if (backdrop && !backdrop.dataset.bound) {
      backdrop.dataset.bound = 'true';
      backdrop.addEventListener('click', closeFn);
    }
  }
}

export default KundliBottomSheetComponent;
