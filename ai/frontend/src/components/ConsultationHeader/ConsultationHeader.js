import { loadTemplate } from '../../utils/templateLoader.js';

export class ConsultationHeaderComponent {
  static templatePath = '/src/components/ConsultationHeader/ConsultationHeader.html';

  static async loadTemplate() {
    return await loadTemplate(ConsultationHeaderComponent.templatePath);
  }

  static async mount(container, astrologer = null) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
      this.populateData(target, astrologer);
      this.bindEvents(target);
    }
    return target;
  }

  static populateData(root, astrologer) {
    if (!astrologer) return;
    const nameEl = root.querySelector('#consultation-astrologer-name');
    if (nameEl && astrologer.name) nameEl.textContent = astrologer.name;

    const subEl = root.querySelector('#consultation-astrologer-sub');
    if (subEl && astrologer.title) subEl.textContent = astrologer.title;

    const avatarEl = root.querySelector('#consultation-astrologer-avatar');
    if (avatarEl && astrologer.avatar_url) avatarEl.src = astrologer.avatar_url;
  }

  static bindEvents(root = document) {
    const backBtn = root.querySelector('#btn-chat-exit');
    if (backBtn && !backBtn.dataset.bound) {
      backBtn.dataset.bound = 'true';
      backBtn.addEventListener('click', () => {
        if (window.Router && typeof window.Router.navigate === 'function') {
          window.Router.navigate('/astrologers');
        } else {
          window.location.href = '/astrologers';
        }
      });
    }
  }
}

export default ConsultationHeaderComponent;
