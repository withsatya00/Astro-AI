import { loadTemplate } from '../../utils/templateLoader.js';

export class MessageComposerComponent {
  static templatePath = '/src/components/MessageComposer/MessageComposer.html';

  static async loadTemplate() {
    return await loadTemplate(MessageComposerComponent.templatePath);
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
    const attachBtn = root.querySelector('#btn-composer-attach');
    const menu = root.querySelector('#attach-options-menu');
    if (attachBtn && menu && !attachBtn.dataset.bound) {
      attachBtn.dataset.bound = 'true';
      attachBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('active');
      });
      document.addEventListener('click', () => {
        menu.classList.remove('active');
      });
    }
  }
}

export default MessageComposerComponent;
