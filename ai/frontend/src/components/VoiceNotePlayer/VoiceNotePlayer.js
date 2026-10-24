import { loadTemplate } from '../../utils/templateLoader.js';

export class VoiceNotePlayerComponent {
  static templatePath = '/src/components/VoiceNotePlayer/VoiceNotePlayer.html';

  static async loadTemplate() {
    return await loadTemplate(VoiceNotePlayerComponent.templatePath);
  }

  static async mount(container) {
    const html = await this.loadTemplate();
    const target = typeof container === 'string' ? document.querySelector(container) : container;
    if (target) {
      target.innerHTML = html;
    }
    return target;
  }

  static render(durationStr = '0:24') {
    return `
      <div class="voice-note-bubble">
        <button type="button" class="voice-play-btn" onclick="window.ChatController && window.ChatController.playVoiceBlessing && window.ChatController.playVoiceBlessing(this)">
          ▶
        </button>
        <div class="voice-waveform-col">
          <svg class="voice-waveform-svg" viewBox="0 0 100 24" preserveAspectRatio="none">
            <line x1="5" y1="12" x2="5" y2="4" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="15" y1="12" x2="15" y2="20" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="25" y1="12" x2="25" y2="2" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="35" y1="12" x2="35" y2="18" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="45" y1="12" x2="45" y2="6" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="55" y1="12" x2="55" y2="22" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="65" y1="12" x2="65" y2="8" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="75" y1="12" x2="75" y2="16" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="85" y1="12" x2="85" y2="5" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
            <line x1="95" y1="12" x2="95" y2="14" stroke="#7439EA" stroke-width="2.5" stroke-linecap="round" />
          </svg>
          <span class="voice-duration">गुरुजी का वैदिक आशीर्वाद (${durationStr})</span>
        </div>
      </div>
    `;
  }
}

export default VoiceNotePlayerComponent;
