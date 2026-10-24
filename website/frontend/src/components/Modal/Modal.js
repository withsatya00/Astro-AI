import { loadTemplate } from '../../utils/templateLoader.js';

export class ModalComponent {
  static templatePath = '/src/components/Modal/Modal.html';

  static async loadTemplate() {
    return await loadTemplate(ModalComponent.templatePath);
  }

  static open(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    }
  }

  static close(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => { modal.style.display = 'none'; }, 220);
    }
  }
}

export default ModalComponent;
