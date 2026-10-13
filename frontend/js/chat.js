/**
 * Consultation Chat Controller - AstroTalk-Inspired Conversational Engine.
 * Supports natural chat, dynamic domain guardrails, inline Kundli diagram generation,
 * and multimodal palmistry (Hastarekha) analysis.
 */

const ChatController = {
  currentSessionId: null,
  activeChartId: null,
  currentLanguage: 'en',
  forceDemoMode: false,
  lastUserMessage: '',

  init() {
    this.bindEvents();
    this.loadSessions();
  },

  bindEvents() {
    const sendBtn = document.getElementById('btn-send-chat');
    const input = document.getElementById('chat-input');
    const langSelect = document.getElementById('chat-lang-select');
    const demoToggle = document.getElementById('toggle-demo-mode');
    const clearBtn = document.getElementById('btn-clear-chat');

    if (sendBtn) {
      sendBtn.addEventListener('click', () => this.sendMessage());
    }

    if (input) {
      // Auto-resize textarea
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 140) + 'px';
      });

      // Enter to send, Shift+Enter for newline
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        this.currentLanguage = e.target.value;
      });
    }

    if (demoToggle) {
      demoToggle.addEventListener('change', (e) => {
        this.forceDemoMode = e.target.checked;
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.startNewChat();
      });
    }

    // Interactive quick action pills
    document.querySelectorAll('.quick-action-pill, .suggestion-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.getAttribute('data-prompt');
        if (prompt) {
          if (prompt.includes('kundli analysis') || prompt.includes('Kundli')) {
            // If active chart exists, render inline Kundli
            if (App.currentChart && App.currentChart.chart_data) {
              this.renderKundliInChat();
              return;
            }
          }
          this.sendMessage(prompt);
        }
      });
    });

    // Welcome button to add birth details
    const welcomeAddBirth = document.getElementById('btn-welcome-add-birth');
    if (welcomeAddBirth) {
      welcomeAddBirth.addEventListener('click', () => {
        App.openBirthModal();
      });
    }

    // Palm photo upload button
    const btnUploadPalm = document.getElementById('btn-upload-palm');
    const palmFileInput = document.getElementById('palm-image-input');
    if (btnUploadPalm && palmFileInput) {
      btnUploadPalm.addEventListener('click', () => {
        palmFileInput.click();
      });
      palmFileInput.addEventListener('change', (e) => this.handlePalmUpload(e));
    }

    // Inline Kundli in Chat button
    const btnInlineKundli = document.getElementById('btn-inline-kundli');
    if (btnInlineKundli) {
      btnInlineKundli.addEventListener('click', () => {
        this.renderKundliInChat();
      });
    }
  },

  handlePalmUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      App.showToast('Please select a valid image file (JPEG/PNG)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      this.sendMessage('Analyze my palm lines (हस्तरेखा विश्लेषण)', base64Data);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-uploaded if needed
    e.target.value = '';
  },

  renderKundliInChat() {
    if (App.currentChart && App.currentChart.chart_data) {
      const svg = ChartViewer.renderNorthIndianSVG(App.currentChart.chart_data, true);
      const name = App.currentChart.name || 'User';
      const asc = App.currentChart.chart_data.ascendant_sign || '';
      const moon = App.currentChart.chart_data.moon_sign || '';
      const text = `Aapki **Lagna Kundali (D1)** for **${name}**:\n- **Lagna (Ascendant):** ${asc}\n- **Moon Sign:** ${moon}\n\nKundli diagram chat mein render kar diya gaya hai.`;
      this.appendMessage('assistant', text, [], false, svg);
      App.showToast('Kundli rendered directly in chat ✨', 'success');
    } else {
      this.sendMessage('Mere kundli ka Lagna D1 diagram dikhao.');
    }
  },

  startNewChat() {
    this.currentSessionId = null;
    const box = document.getElementById('chat-messages-container');
    if (!box) return;

    // Restore refined welcome screen
    const welcomeHtml = `
      <div class="welcome-screen" id="welcome-screen">
        <div class="welcome-zodiac-orb">✨</div>
        <h1 class="welcome-title">Your Journey, Written in the Stars</h1>
        <p class="welcome-subtitle">
          Ask a question, explore your kundli, or talk through what is on your mind.
        </p>

        <button class="btn-subtle-birth" onclick="App.openBirthModal()">
          <span>✨</span>
          <span>Add birth details for a personalized reading</span>
        </button>

        <div class="quick-actions-row">
          <button class="quick-action-pill" onclick="ChatController.sendMessage('Mere love life aur relationships ke baare mein batao.')">
            <span>❤️</span>
            <span>Love & Relationships</span>
          </button>
          <button class="quick-action-pill" onclick="ChatController.sendMessage('Career kaisa rahega? Professional growth ke baare mein batao.')">
            <span>💼</span>
            <span>Career</span>
          </button>
          <button class="quick-action-pill" onclick="ChatController.sendMessage('Marriage aur relationship compatibility ke yog ke baare mein batao.')">
            <span>💍</span>
            <span>Marriage</span>
          </button>
          <button class="quick-action-pill" onclick="ChatController.renderKundliInChat()">
            <span>🪐</span>
            <span>Kundli Reading</span>
          </button>
          <button class="quick-action-pill" onclick="ChatController.sendMessage('Aaj ka daily horoscope aur general astrological focus kya hai?')">
            <span>🔮</span>
            <span>Daily Horoscope</span>
          </button>
        </div>
      </div>
    `;
    box.innerHTML = welcomeHtml;
    App.showToast('Started new consultation session', 'info');
  },

  async loadSessions() {
    try {
      const sessions = await API.getChatSessions();
      const list = document.getElementById('sessions-list');
      const countBadge = document.getElementById('session-count-badge');
      if (countBadge) countBadge.innerText = sessions.length;

      if (!list) return;
      if (!sessions.length) {
        list.innerHTML = '<li class="sidebar-item active"><span class="item-title">Current Consultation</span></li>';
        return;
      }

      list.innerHTML = sessions.map((s, idx) => `
        <li class="sidebar-item ${idx === 0 && !this.currentSessionId ? 'active' : (s.id === this.currentSessionId ? 'active' : '')}" 
            onclick="ChatController.loadSessionHistory('${s.id}')">
          <span class="item-title">${s.title}</span>
          <span style="font-size: 0.7rem; color: var(--text-dim);">${new Date(s.created_at).toLocaleDateString([], {month:'short', day:'numeric'})}</span>
        </li>
      `).join('');
    } catch (err) {
      console.warn('Could not load sessions:', err);
    }
  },

  async loadSessionHistory(sessionId) {
    this.currentSessionId = sessionId;
    const box = document.getElementById('chat-messages-container');
    if (!box) return;

    box.innerHTML = '';
    try {
      const data = await API.getSessionHistory(sessionId);
      if (data.chart_id) {
        this.activeChartId = data.chart_id;
        App.selectChart(data.chart_id, false);
      }
      data.messages.forEach(m => {
        this.appendMessage(m.role, m.content, [], m.is_demo_mode, m.chart_svg);
      });
      this.loadSessions();
    } catch (err) {
      this.appendMessage('assistant', `Failed to load conversation history: ${err.message}`);
    }
  },

  formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/### (.*?)\n/g, '<h4 style="margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem; font-weight: 600; color: #1f2937;">$1</h4>')
      .replace(/## (.*?)\n/g, '<h3 style="margin: 0.6rem 0 0.3rem 0; font-size: 1.02rem; font-weight: 700; color: #111827;">$1</h3>')
      .replace(/# (.*?)\n/g, '<h2 style="margin: 0.75rem 0 0.4rem 0; font-size: 1.1rem; font-weight: 700; color: #111827;">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/> (.*?)\n/g, '<blockquote style="border-left: 3px solid #c4b5fd; padding-left: 0.75rem; color: #4b5563; margin: 0.5rem 0; background: #faf5ff; padding: 0.4rem 0.6rem; border-radius: 4px;">$1</blockquote>')
      .replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; color: #334155; padding: 0.15rem 0.35rem; border-radius: 4px; font-size: 0.85em;">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return html;
  },

  appendMessage(role, text, citations = [], isDemo = false, chartSvg = null, imagePreview = null) {
    const box = document.getElementById('chat-messages-container');
    if (!box) return;

    // Remove welcome screen if present
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();

    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const formattedContent = this.formatMarkdown(text);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Inline Kundli SVG box if available
    let chartHtml = '';
    if (chartSvg) {
      chartHtml = `
        <div class="chat-inline-kundli-box">
          <div class="inline-kundli-title">🪐 Lagna Kundali (D1) Diagram</div>
          ${chartSvg}
        </div>
      `;
    }

    let actionsHtml = '';
    if (role === 'assistant') {
      const escapedRaw = encodeURIComponent(text);
      actionsHtml = `
        <div class="msg-actions">
          <button class="btn-msg-action" onclick="ChatController.copyMessage('${escapedRaw}')">
            📋 Copy
          </button>
          <button class="btn-msg-action" onclick="ChatController.regenerateLast()">
            🔄 Regenerate
          </button>
          <button class="btn-msg-action" onclick="ChatController.submitFeedback('up', this)">
            👍 Helpful
          </button>
          <button class="btn-msg-action" onclick="ChatController.submitFeedback('down', this)">
            👎
          </button>
          <span style="margin-left: auto; font-size: 0.72rem; color: var(--text-dim);">${timeStr}</span>
        </div>
      `;
    }

    if (role === 'user') {
      let userInner = `<div>${formattedContent}</div>`;
      if (imagePreview) {
        userInner = `
          <div class="chat-uploaded-palm-container">
            <img src="${imagePreview}" class="chat-uploaded-palm-thumb" alt="Uploaded Palm Photo" />
            <div class="palm-caption">${formattedContent}</div>
          </div>
        `;
      }
      row.innerHTML = `
        <div class="message-bubble">
          ${userInner}
          <div style="text-align: right; font-size: 0.7rem; color: #6b7280; margin-top: 0.35rem;">${timeStr}</div>
        </div>
        <div class="msg-avatar" style="background: #F3F4F6; border: 1px solid #E5E7EB;">👤</div>
      `;
    } else {
      row.innerHTML = `
        <div class="msg-avatar">🔮</div>
        <div class="message-bubble">
          <div>${formattedContent}</div>
          ${chartHtml}
          ${actionsHtml}
        </div>
      `;
    }

    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
  },

  copyMessage(escapedText) {
    const raw = decodeURIComponent(escapedText);
    navigator.clipboard.writeText(raw).then(() => {
      App.showToast('Response copied to clipboard! 📋', 'success');
    }).catch(() => {
      App.showToast('Unable to copy response', 'error');
    });
  },

  regenerateLast() {
    if (this.lastUserMessage) {
      this.sendMessage(this.lastUserMessage);
    } else {
      App.showToast('No previous message to regenerate', 'info');
    }
  },

  submitFeedback(type, btnElement) {
    App.showToast(type === 'up' ? 'Thank you for your feedback! ⭐' : 'Feedback recorded for review 📝', 'success');
    if (btnElement && btnElement.parentElement) {
      btnElement.parentElement.querySelectorAll('.btn-msg-action').forEach(b => {
        if (b.innerText.includes('👍') || b.innerText.includes('👎')) b.disabled = true;
      });
    }
  },

  async sendMessage(customText = null, imageBase64 = null) {
    const input = document.getElementById('chat-input');
    const msg = (customText || (input ? input.value : '')).trim();
    if (!msg && !imageBase64) return;

    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    this.lastUserMessage = msg || 'Analyze my palm lines';
    this.appendMessage('user', msg || 'Analyze my palm lines (हस्तरेखा)', [], false, null, imageBase64);

    // Append typing indicator
    const box = document.getElementById('chat-messages-container');
    const typingRow = document.createElement('div');
    typingRow.className = 'message-row assistant';
    typingRow.id = 'typing-indicator-row';
    typingRow.innerHTML = `
      <div class="msg-avatar">🔮</div>
      <div class="typing-bubble">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <span style="font-size: 0.78rem; color: var(--text-dim); margin-left: 0.4rem;">
          ${imageBase64 ? 'Analyzing palm lines & mounts...' : 'Consulting celestial alignments...'}
        </span>
      </div>
    `;
    box.appendChild(typingRow);
    box.scrollTop = box.scrollHeight;

    // Send button disabled state
    const sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) sendBtn.disabled = true;

    try {
      const res = await API.sendMessage({
        session_id: this.currentSessionId,
        chart_id: this.activeChartId || (App.currentChart ? App.currentChart.id : null),
        message: msg || 'Analyze my palm lines (हस्तरेखा विश्लेषण)',
        language: this.currentLanguage,
        force_demo_mode: this.forceDemoMode,
        image_base64: imageBase64
      });

      // Remove typing indicator
      const ind = document.getElementById('typing-indicator-row');
      if (ind) ind.remove();

      this.currentSessionId = res.session_id;

      // Determine inline SVG chart if requested or provided
      const isKundliRequested = (t) => {
        if (!t) return false;
        const low = t.toLowerCase();
        return low.includes('kundli') || low.includes('chart') || low.includes('kundali');
      };

      let inlineSvg = res.chart_svg;
      if (!inlineSvg && isKundliRequested(msg) && App.currentChart && App.currentChart.chart_data) {
        inlineSvg = ChartViewer.renderNorthIndianSVG(App.currentChart.chart_data, true);
      }

      this.appendMessage('assistant', res.content, [], res.is_demo_mode, inlineSvg);
      this.loadSessions();
    } catch (err) {
      const ind = document.getElementById('typing-indicator-row');
      if (ind) ind.remove();
      this.appendMessage('assistant', `⚠️ Could not complete astrological consultation: ${err.message}`);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }
};
