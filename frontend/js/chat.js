/**
 * Consultation Chat Controller - AstroTalk-Inspired Conversational Engine.
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

    // Interactive suggestion cards
    document.querySelectorAll('.suggestion-card').forEach(card => {
      card.addEventListener('click', () => {
        const prompt = card.getAttribute('data-prompt');
        if (prompt) {
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
  },

  startNewChat() {
    this.currentSessionId = null;
    const box = document.getElementById('chat-messages-container');
    if (!box) return;

    // Restore welcome hero
    const welcomeHtml = `
      <div class="welcome-screen" id="welcome-screen">
        <div class="welcome-zodiac-orb">✨</div>
        <h1 class="welcome-title">Discover What the Stars Have to Say</h1>
        <p class="welcome-subtitle">
          Ask about your career, relationships, compatibility, or kundli. Your cosmic journey begins with a conversation.
        </p>

        <button class="btn-add-birth" onclick="App.openBirthModal()">
          <span>🔮</span>
          <span>Add Birth Details for Personalized Reading</span>
        </button>

        <div class="suggestions-grid">
          <div class="suggestion-card" onclick="ChatController.sendMessage('Analyze my career path, promotion timeline, and professional strengths based on my horoscope.')">
            <div class="suggestion-icon">💼</div>
            <div class="suggestion-title">Career & Growth</div>
            <div class="suggestion-desc">Promotions, ideal industries, and karmic work direction</div>
          </div>
          <div class="suggestion-card" onclick="ChatController.sendMessage('What does my 7th house and Venus placement indicate about my love life and relationships?')">
            <div class="suggestion-icon">❤️</div>
            <div class="suggestion-title">Love & Relationships</div>
            <div class="suggestion-desc">Romantic tendencies, marital harmony, and timing</div>
          </div>
          <div class="suggestion-card" onclick="ChatController.sendMessage('Evaluate marriage compatibility and Ashtakoota harmony principles between two charts.')">
            <div class="suggestion-icon">💍</div>
            <div class="suggestion-title">Marriage & Compatibility</div>
            <div class="suggestion-desc">Moon harmony, Nakshatra resonance, and dosha checks</div>
          </div>
          <div class="suggestion-card" onclick="ChatController.sendMessage('Provide a detailed Kundli analysis including my Lagna lord, benefic planets, and core yogas.')">
            <div class="suggestion-icon">🪐</div>
            <div class="suggestion-title">Kundli Analysis</div>
            <div class="suggestion-desc">Ascendant, Moon sign, Bhavas, and planetary strengths</div>
          </div>
          <div class="suggestion-card" onclick="ChatController.sendMessage('What planetary transits (Gochara) and daily influences are most significant for me today?')">
            <div class="suggestion-icon">🔮</div>
            <div class="suggestion-title">Daily Horoscope & Transits</div>
            <div class="suggestion-desc">Transit aspects, emotional balance, and focus areas</div>
          </div>
          <div class="suggestion-card" onclick="ChatController.sendMessage('Explain my current Vimshottari Mahadasha and what this planetary period signifies.')">
            <div class="suggestion-icon">⏳</div>
            <div class="suggestion-title">Dasha & Planetary Timing</div>
            <div class="suggestion-desc">Active 120-year cycle, Antardashas, and life transitions</div>
          </div>
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
        this.appendMessage(m.role, m.content, m.citations, m.is_demo_mode);
      });
      this.loadSessions();
    } catch (err) {
      this.appendMessage('assistant', `Failed to load conversation history: ${err.message}`);
    }
  },

  formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/### (.*?)\n/g, '<h4>$1</h4>')
      .replace(/## (.*?)\n/g, '<h3>$1</h3>')
      .replace(/# (.*?)\n/g, '<h2>$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/> (.*?)\n/g, '<blockquote>$1</blockquote>')
      .replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.08); padding: 0.1rem 0.3rem; border-radius: 4px;">$1</code>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');
    return html;
  },

  appendMessage(role, text, citations = [], isDemo = false) {
    const box = document.getElementById('chat-messages-container');
    if (!box) return;

    // Remove welcome screen if present
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();

    const row = document.createElement('div');
    row.className = `message-row ${role}`;

    const formattedContent = this.formatMarkdown(text);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let citationsHtml = '';
    if (citations && citations.length > 0) {
      const cards = citations.map(c => `
        <div class="citation-card">
          <strong>📜 ${c.source_title}</strong> (Page ${c.page_number || 1})<br/>
          <em>"${c.excerpt.substring(0, 160)}..."</em>
        </div>
      `).join('');
      citationsHtml = `<div class="citations-box"><strong style="color: var(--gold-light);">Cited Classical References:</strong>${cards}</div>`;
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
      row.innerHTML = `
        <div class="message-bubble">
          <div>${formattedContent}</div>
          <div style="text-align: right; font-size: 0.7rem; color: rgba(255,255,255,0.6); margin-top: 0.35rem;">${timeStr}</div>
        </div>
        <div class="msg-avatar" style="background: rgba(124, 58, 237, 0.4); border: 1px solid rgba(124, 58, 237, 0.6);">👤</div>
      `;
    } else {
      row.innerHTML = `
        <div class="msg-avatar">🔮</div>
        <div class="message-bubble">
          <div>${formattedContent}</div>
          ${citationsHtml}
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

  async sendMessage(customText = null) {
    const input = document.getElementById('chat-input');
    const msg = (customText || (input ? input.value : '')).trim();
    if (!msg) return;

    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    this.lastUserMessage = msg;
    this.appendMessage('user', msg);

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
        <span style="font-size: 0.78rem; color: var(--text-dim); margin-left: 0.4rem;">Consulting celestial alignments...</span>
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
        message: msg,
        language: this.currentLanguage,
        force_demo_mode: this.forceDemoMode
      });

      // Remove typing indicator
      const ind = document.getElementById('typing-indicator-row');
      if (ind) ind.remove();

      this.currentSessionId = res.session_id;
      this.appendMessage('assistant', res.content, res.citations, res.is_demo_mode);
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
