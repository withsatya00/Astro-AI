import { loadTemplate } from '../../utils/templateLoader.js';

export class MessageBubbleComponent {
  static templatePath = '/src/components/MessageBubble/MessageBubble.html';

  static async loadTemplate() {
    return await loadTemplate(MessageBubbleComponent.templatePath);
  }

  static renderUser(text, timeStr = '12:00 PM') {
    return `
      <div class="message-row user-row">
        <div class="message-bubble user-bubble">
          <div class="msg-text-content message-text">${text}</div>
          <div class="msg-meta-row user-meta">
            <span class="msg-time">${timeStr}</span>
            <span class="msg-status-tick"><span class="msg-status-delivered" title="Delivered">✓✓</span></span>
          </div>
        </div>
      </div>
    `;
  }

  static renderAssistant(contentHtml, astrologerName = 'Pt. Rameshwar Dwivedi', timeStr = '12:01 PM', avatarUrl = 'assets/portraits/pt-rameshwar-dwivedi.jpg') {
    const escaped = encodeURIComponent(contentHtml.replace(/<[^>]*>?/gm, ''));
    return `
      <div class="message-row assistant-row group-start">
        <div class="msg-avatar" title="${astrologerName}">
          <img src="${avatarUrl}" alt="${astrologerName}" class="astrologer-avatar-img" onerror="this.onerror=null; this.src='assets/portraits/default-avatar.svg';" />
        </div>
        <div class="message-bubble assistant-bubble">
          <div class="msg-speaker-compact-name"><span>🕉️</span> <span>${astrologerName}</span></div>
          <div class="msg-text-content message-text">${contentHtml}</div>
          <div class="msg-meta-row assistant-meta">
            <span class="msg-time">${timeStr}</span>
            <button type="button" class="btn-copy-discreet" onclick="ChatController && ChatController.copyMessage ? ChatController.copyMessage('${escaped}') : navigator.clipboard.writeText('${escaped}')" title="Copy text">📋</button>
          </div>
        </div>
      </div>
    `;
  }
}

export default MessageBubbleComponent;
