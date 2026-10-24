import { loadTemplate } from '../../utils/templateLoader.js';

export class MessageListComponent {
  static templatePath = '/src/components/MessageList/MessageList.html';

  static async loadTemplate() {
    return await loadTemplate(MessageListComponent.templatePath);
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
    // Quick prompts in the welcome screen
    root.querySelectorAll('.chamber-prompt-card').forEach(card => {
      if (!card.dataset.bound) {
        card.dataset.bound = 'true';
        card.addEventListener('click', () => {
          const textEl = card.querySelector('.prompt-card-text');
          const prompt = textEl ? textEl.textContent.trim() : card.textContent.trim();
          if (window.ChatController && typeof window.ChatController.askQuickPrompt === 'function') {
            window.ChatController.askQuickPrompt(prompt);
          } else if (window.ChatController && typeof window.ChatController.sendMessage === 'function') {
            window.ChatController.sendMessage(prompt);
          }
        });
      }
    });
  }
}

export default MessageListComponent;
