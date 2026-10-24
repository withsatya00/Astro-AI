import { loadTemplate } from '../../utils/templateLoader.js';

export class VedicRemedyCardComponent {
  static templatePath = '/src/components/VedicRemedyCard/VedicRemedyCard.html';

  static async loadTemplate() {
    return await loadTemplate(VedicRemedyCardComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
    }
    return target;
  }

  static render(title, mantra, instructions, dayName = 'गुरुवार') {
    return `
      <div class="vedic-remedy-card">
        <div class="remedy-card-header">
          <span class="remedy-card-badge">✨ शास्त्रीय वैदिक उपाय</span>
          <h4 class="remedy-card-title">${title}</h4>
        </div>
        <div class="remedy-mantra-box">
          ${mantra}
        </div>
        <p class="remedy-details-text">${instructions}</p>
        <div class="remedy-actions-row">
          <button type="button" class="btn-remedy-action" onclick="window.ChatController && window.ChatController.saveRemedyToDaily && window.ChatController.saveRemedyToDaily('${title}', '${mantra}', '${instructions}')">
            <span>✨ Add to Daily Upay</span>
          </button>
          <button type="button" class="btn-remedy-secondary" onclick="window.ChatController && window.ChatController.setRemedyReminder && window.ChatController.setRemedyReminder('${dayName}')">
            <span>⏰ Set Reminder (${dayName})</span>
          </button>
        </div>
      </div>
    `;
  }
}

export default VedicRemedyCardComponent;
