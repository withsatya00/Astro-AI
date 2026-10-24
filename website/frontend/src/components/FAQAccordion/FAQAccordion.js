import { loadTemplate } from '../../utils/templateLoader.js';

export class FAQAccordionComponent {
  static templatePath = '/src/components/FAQAccordion/FAQAccordion.html';

  static async loadTemplate() {
    return await loadTemplate(FAQAccordionComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
      this.bind(target);
    }
    return target;
  }

  static bind(target) {
    // Scripts inserted with innerHTML do not execute. Bind after mounting instead.
    target.querySelectorAll('script').forEach(script => script.remove());
    let category = 'all';
    let search = '';
    const filter = () => target.querySelectorAll('.faq-item').forEach(item => {
      const matchesCategory = category === 'all' || item.dataset.category === category;
      const matchesSearch = !search || item.textContent.toLocaleLowerCase().includes(search);
      item.hidden = !(matchesCategory && matchesSearch);
      item.style.display = item.hidden ? 'none' : '';
    });
    target.querySelectorAll('.faq-question-btn').forEach((button, index) => {
      button.removeAttribute('onclick');
      const item = button.closest('.faq-item');
      const pane = item.querySelector('.faq-answer-pane');
      pane.id = `faq-answer-${index}`;
      pane.hidden = true;
      button.setAttribute('aria-controls', pane.id);
      button.setAttribute('aria-expanded', 'false');
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        button.setAttribute('aria-expanded', String(open));
        item.classList.toggle('active', open);
        pane.hidden = !open;
        pane.classList.toggle('hidden', !open);
        const chevron = item.querySelector('.faq-chevron-circle');
        if (chevron) chevron.style.transform = open ? 'rotate(180deg)' : '';
      });
    });
    target.querySelectorAll('.faq-tab-btn').forEach(button => {
      const match = (button.getAttribute('onclick') || '').match(/filterFAQCategory\('([^']+)'/);
      button.removeAttribute('onclick');
      button.dataset.category = match ? match[1] : 'all';
      button.setAttribute('aria-pressed', String(button.classList.contains('active')));
      button.addEventListener('click', () => {
        category = button.dataset.category;
        target.querySelectorAll('.faq-tab-btn').forEach(tab => {
          const active = tab === button;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-pressed', String(active));
          tab.classList.toggle('bg-[#7439EA]', active);
          tab.classList.toggle('text-white', active);
          tab.classList.toggle('bg-white', !active);
          tab.classList.toggle('text-[#1E1B4B]', !active);
        });
        filter();
      });
    });
    const input = target.querySelector('#faq-search-input');
    if (input) {
      input.removeAttribute('oninput');
      input.addEventListener('input', () => {
        search = input.value.trim().toLocaleLowerCase();
        filter();
      });
    }
    window.addEventListener('astro:languagechange', filter);
  }
}

export default FAQAccordionComponent;
