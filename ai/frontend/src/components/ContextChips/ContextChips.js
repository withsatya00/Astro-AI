import { loadTemplate } from '../../utils/templateLoader.js';

export class ContextChipsComponent {
  static templatePath = '/src/components/ContextChips/ContextChips.html';

  static async loadTemplate() {
    return await loadTemplate(ContextChipsComponent.templatePath);
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
    root.querySelectorAll('.context-chip').forEach(chip => {
      if (!chip.dataset.bound) {
        chip.dataset.bound = 'true';
        chip.addEventListener('click', () => {
          const prompt = chip.getAttribute('data-prompt');
          if (prompt && window.ChatController && typeof window.ChatController.sendMessage === 'function') {
            window.ChatController.sendMessage(prompt);
          }
        });
      }
    });
  }
}

export default ContextChipsComponent;
