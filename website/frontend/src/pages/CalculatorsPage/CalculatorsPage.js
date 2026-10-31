import { loadTemplate } from '../../utils/templateLoader.js';

export class CalculatorsPageComponent {
  static templatePath = '/src/pages/CalculatorsPage/CalculatorsPage.html';

  static async loadTemplate() {
    return await loadTemplate(CalculatorsPageComponent.templatePath);
  }

  static async mount(container) {
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = await this.loadTemplate();
      this.bindEvents(target);
    }
    return target;
  }

  static bindEvents(root) {
    if (!root) return;
    const chips = root.querySelectorAll('.calc-ref-chip');
    const cards = root.querySelectorAll('.calc-ref-card');

    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const cat = chip.dataset.cat;
        chips.forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');

        cards.forEach(card => {
          if (cat === 'all' || card.dataset.cat === cat) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }
}

if (typeof window !== 'undefined') {
  window.CalculatorsPageComponent = CalculatorsPageComponent;
}

export default CalculatorsPageComponent;
