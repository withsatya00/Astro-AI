import { loadTemplate } from '../../utils/templateLoader.js';

export class ModalsComponent {
  static templatePath = '/src/pages/Modals/Modals.html';

  static async loadTemplate() {
    return await loadTemplate(ModalsComponent.templatePath);
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
    // Bind modal close buttons
    root.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
      if (!btn.dataset.bound) {
        btn.dataset.bound = 'true';
        btn.addEventListener('click', (e) => {
          const modal = e.target.closest('.modal-overlay');
          if (modal) {
            modal.style.display = 'none';
            modal.classList.remove('active');
          }
        });
      }
    });
  }
}

export default ModalsComponent;
