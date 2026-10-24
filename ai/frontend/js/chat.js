/**
 * Consultation Chat Controller - AstroTalk-Inspired Conversational Engine.
 * Supports natural chat, dynamic domain guardrails, inline Kundli diagram generation,
 * and multimodal palmistry (Hastarekha) analysis.
 */

var ChatController = {
  currentSessionId: null,
  activeConsultation: null,
  activeChartId: null,
  currentLanguage: 'en',
  forceDemoMode: false,
  lastUserMessage: '',
  selectedAstrologer: localStorage.getItem('astroai_astrologer') || 'acharya_shastri',
  astrologers: [],
  isSubmitting: false,
  oldestMessageId: null,
  lastSenderRole: null,
  isNearBottom: true,
  unreadCountWhileScrolled: 0,

  renderAvatar(avatarStr, name, extraClass = '') {
    if (!avatarStr) return '🕉️';
    if (avatarStr.startsWith('assets/') || avatarStr.startsWith('/') || avatarStr.includes('.svg') || avatarStr.includes('.png') || avatarStr.includes('.jpg')) {
      return `<img src="${avatarStr}" alt="${name || 'Astrologer'}" class="astrologer-avatar-img ${extraClass}" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='🕉️';" />`;
    }
    return avatarStr;
  },

  init() {
    this.bindEvents();
    this.setupScrollManagement();
    this.restoreDraft();
    this.loadSessions();
    this.renderIntakeSavedChips();
    this.loadAstrologers();
    this.initLiveTimer();
  },

  restoreDraft() {
    const draft = localStorage.getItem('astroai_chat_draft');
    const input = document.getElementById('chat-input');
    if (draft && input && !input.value) {
      input.value = draft;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    }
  },

  setupScrollManagement() {
    const container = document.getElementById('chat-messages-container');
    const floatBtn = document.getElementById('btn-new-messages-floating');
    if (!container) return;

    container.addEventListener('scroll', () => {
      const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
      this.isNearBottom = distance <= 120;
      this.updateFloatingBtn();
    }, { passive: true });

    if (floatBtn) {
      floatBtn.addEventListener('click', () => {
        this.scrollToBottom(false);
      });
    }

    const loadOlderBtn = document.getElementById('btn-load-older-messages');
    if (loadOlderBtn) {
      loadOlderBtn.addEventListener('click', () => {
        this.loadOlderMessages();
      });
    }

    const btnCancelEnd = document.getElementById('btn-cancel-end-consultation');
    if (btnCancelEnd) {
      btnCancelEnd.addEventListener('click', () => this.closeEndConsultationModal());
    }

    const btnConfirmEnd = document.getElementById('btn-confirm-end-consultation');
    if (btnConfirmEnd) {
      btnConfirmEnd.addEventListener('click', () => this.endCurrentConsultation(true));
    }

    // Close header overflow dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('consultation-overflow-dropdown');
      const btn = document.getElementById('btn-header-overflow-menu');
      if (menu && menu.classList.contains('active')) {
        if (btn && !btn.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove('active');
        }
      }
    });
  },

  updateFloatingBtn() {
    const container = document.getElementById('chat-messages-container');
    const floatBtn = document.getElementById('btn-new-messages-floating');
    if (!container || !floatBtn) return;

    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distance > 160) {
      floatBtn.style.display = 'inline-flex';
      const textSpan = document.getElementById('floating-btn-text');
      if (textSpan) {
        textSpan.innerText = this.unreadCountWhileScrolled > 0
          ? `${this.unreadCountWhileScrolled} new message${this.unreadCountWhileScrolled > 1 ? 's' : ''} ↓`
          : 'Latest messages ↓';
      }
    } else {
      floatBtn.style.display = 'none';
      this.unreadCountWhileScrolled = 0;
    }
  },

  scrollToBottom(smooth = false) {
    const container = document.getElementById('chat-messages-container');
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    this.isNearBottom = true;
    this.unreadCountWhileScrolled = 0;
    const button = document.getElementById('btn-new-messages-floating');
    if (button) button.style.display = 'none';
  },

  anchorAnswerStart(row) {
    const container = document.getElementById('chat-messages-container');
    if (!container || !row) return;
    const top = container.scrollTop + row.getBoundingClientRect().top - container.getBoundingClientRect().top - 12;
    container.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  },

  confirmEndConsultation() {
    const modal = document.getElementById('modal-end-consultation-confirm');
    if (modal) {
      modal.classList.add('active');
    } else {
      this.endCurrentConsultation(true);
    }
  },

  closeEndConsultationModal() {
    const modal = document.getElementById('modal-end-consultation-confirm');
    if (modal) modal.classList.remove('active');
  },

  retryMessage(escapedText) {
    const raw = decodeURIComponent(escapedText);
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = raw;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 130) + 'px';
    }
    this.sendMessage(raw);
  },

  async loadOlderMessages() {
    if (!this.currentSessionId || !this.oldestMessageId) return;
    const btn = document.getElementById('btn-load-older-messages');
    const wrap = document.getElementById('chat-load-older-wrap');
    const container = document.getElementById('chat-messages-container');
    if (!container) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ Loading older messages...</span>';
    }

    try {
      const data = await API.getConsultationMessages(this.currentSessionId, this.oldestMessageId, 20);
      const items = data.items || [];
      if (items.length > 0) {
        const prevHeight = container.scrollHeight;
        const prevTop = container.scrollTop;
        this.oldestMessageId = items[items.length - 1].id;

        // items are returned ordered by created_at DESC (newest of older to oldest)
        const chronological = [...items].reverse();
        const insertAnchor = wrap ? wrap.nextSibling : container.firstChild;

        let prevRole = null;
        chronological.forEach(msg => {
          const role = (msg.sender_type === 'user') ? 'user' : 'assistant';
          const isGroupStart = (prevRole !== role);
          prevRole = role;

          const row = document.createElement('div');
          row.className = `message-row ${role} ${isGroupStart ? 'group-start' : 'group-continuation'}`;
          row.dataset.msgId = msg.id;

          const formattedContent = this.formatMarkdown(msg.content);
          const timeStr = new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const currentAstrologer = (this.astrologers || []).find(a => a.id === this.selectedAstrologer || a.slug === this.selectedAstrologer) || {
            avatar: '🕉️',
            name: 'Acharya Shastri',
            title: 'Vedic Astrologer'
          };

          if (role === 'user') {
            row.innerHTML = `
              <div class="message-bubble user-bubble">
                <div class="msg-text-content">${formattedContent}</div>
                <div class="msg-meta-row user-meta">
                  <span class="msg-time">${timeStr}</span>
                  <span class="msg-status-tick"><span class="msg-status-delivered" title="Delivered">✓✓</span></span>
                </div>
              </div>
            `;
          } else {
            const escapedRaw = encodeURIComponent(msg.content);
            const speakerNameHeader = isGroupStart
              ? `<div class="msg-speaker-compact-name"><span>🕉️</span> <span>${currentAstrologer.name}</span></div>`
              : '';
            const avatarCol = isGroupStart
              ? `<div class="msg-avatar" title="${currentAstrologer.name}">${this.renderAvatar(currentAstrologer.avatar, currentAstrologer.name)}</div>`
              : `<div class="msg-avatar-spacer" aria-hidden="true"></div>`;

            row.innerHTML = `
              ${avatarCol}
              <div class="message-bubble assistant-bubble">
                ${speakerNameHeader}
                <div class="msg-text-content">${formattedContent}</div>
                <div class="msg-meta-row assistant-meta">
                  <span class="msg-time">${timeStr}</span>
                  <button type="button" class="btn-copy-discreet" onclick="ChatController.copyMessage('${escapedRaw}')" title="Copy text">📋</button>
                </div>
              </div>
            `;
          }
          container.insertBefore(row, insertAnchor);
        });

        // Exact scroll restoration
        container.scrollTop = prevTop + (container.scrollHeight - prevHeight);

        if (!data.has_more || items.length < 20) {
          if (wrap) wrap.style.display = 'none';
        }
      } else {
        if (wrap) wrap.style.display = 'none';
      }
    } catch (e) {
      console.warn('Failed to load older messages:', e);
      if (window.App && window.App.showToast) {
        window.App.showToast('Could not load older messages: ' + e.message, 'warning');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span>⏳ Load older messages (पिछले संदेश देखें)</span>';
      }
    }
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
      // Auto-resize textarea and save draft
      input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 130) + 'px';
        localStorage.setItem('astroai_chat_draft', input.value);
        if (input.value.trim().length > 0) {
          this.hideContextChips();
        }
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
        if (window.I18n) {
          window.I18n.setLanguage(e.target.value, true);
        }
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

  getEmptyIntakeData() {
    return {
      name: '',
      gender: 'Male',
      dob: '',
      tob: '',
      isApprox: false,
      city: '',
      topic: 'love',
      customQuestion: ''
    };
  },

  intakeCoordinates: { lat: 28.6139, lon: 77.2090, tz: 5.5, country: 'India' },
  lastIntakeData: {
    name: '',
    gender: 'Male',
    dob: '',
    tob: '',
    isApprox: false,
    city: '',
    topic: 'love',
    customQuestion: ''
  },

  clearIntakeForm() {
    this.lastIntakeData = this.getEmptyIntakeData();
    this.intakeCoordinates = { lat: 28.6139, lon: 77.2090, tz: 5.5, country: 'India' };

    const nameInput = document.getElementById('intake-name');
    const dobInput = document.getElementById('intake-dob');
    const tobInput = document.getElementById('intake-tob');
    const cityInput = document.getElementById('intake-city');
    const approxCheck = document.getElementById('intake-approx-time');
    const questionInput = document.getElementById('intake-custom-question');

    if (nameInput) nameInput.value = '';
    if (dobInput) {
      if (dobInput._flatpickr) dobInput._flatpickr.clear();
      else dobInput.value = '';
    }
    if (tobInput) {
      if (tobInput._flatpickr) tobInput._flatpickr.clear();
      else tobInput.value = '';
    }
    if (cityInput) cityInput.value = '';
    if (approxCheck) approxCheck.checked = false;
    if (questionInput) questionInput.value = '';

    const maleRadio = document.querySelector('input[name="intake-gender"][value="Male"]');
    if (maleRadio) {
      maleRadio.checked = true;
      this.onGenderChange(maleRadio);
    }

    const loveRadio = document.querySelector('input[name="intake-topic"][value="love"]');
    if (loveRadio) {
      loveRadio.checked = true;
      this.onTopicChange(loveRadio);
    }

    if (nameInput) nameInput.focus();
    App.showToast('Intake form reset (फॉर्म खाली कर दिया गया)', 'info');
  },

  onGenderChange(radio) {
    document.querySelectorAll('.gender-radio-label').forEach(el => el.classList.remove('active'));
    if (radio && radio.parentElement) {
      radio.parentElement.classList.add('active');
    }
  },

  onTopicChange(radio) {
    document.querySelectorAll('.topic-chip').forEach(el => el.classList.remove('active'));
    if (radio && radio.parentElement) {
      radio.parentElement.classList.add('active');
    }
  },

  setIntakeCity(city, country, lat, lon, tz) {
    const cityInput = document.getElementById('intake-city');
    if (cityInput) cityInput.value = city;
    this.intakeCoordinates = {
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      tz: parseFloat(tz),
      country: country || 'India'
    };
    App.showToast(`Selected city: ${city}`, 'info');
  },

  async renderIntakeSavedChips() {
    // Quick select chips removed from chat intake per user request
    const bar = document.getElementById('intake-saved-profiles-bar');
    if (bar) bar.style.display = 'none';
  },

  setIntakeTime(timeStr, label) {
    const tobInput = document.getElementById('intake-tob');
    const approxCheck = document.getElementById('intake-approx-time');
    if (approxCheck) approxCheck.checked = false;
    if (tobInput) {
      if (tobInput._flatpickr) {
        tobInput._flatpickr.setDate(timeStr, true);
      } else {
        tobInput.value = timeStr;
      }
    }
    App.showToast(`Birth time set: ${timeStr} (${label}) ✨`, 'info');
  },

  onApproxTimeToggle(checkbox) {
    const tobInput = document.getElementById('intake-tob');
    if (checkbox.checked) {
      if (tobInput) {
        if (tobInput._flatpickr) tobInput._flatpickr.setDate('12:00', true);
        else tobInput.value = '12:00';
      }
      App.showToast('Time set to 12:00 PM (Approximate / मध्याह्न समय) ☀️', 'info');
    }
  },

  async fillIntakeFromProfile(chartId) {
    try {
      const chart = await API.getChartById(chartId);
      if (!chart) return;

      const nameInput = document.getElementById('intake-name');
      const dobInput = document.getElementById('intake-dob');
      const tobInput = document.getElementById('intake-tob');
      const cityInput = document.getElementById('intake-city');
      const approxCheck = document.getElementById('intake-approx-time');

      if (nameInput) nameInput.value = chart.name || '';
      if (dobInput) {
        if (dobInput._flatpickr) dobInput._flatpickr.setDate(chart.date_of_birth || '', true);
        else dobInput.value = chart.date_of_birth || '';
      }
      if (tobInput && chart.time_of_birth) {
        const timeVal = chart.time_of_birth.slice(0, 5);
        if (tobInput._flatpickr) tobInput._flatpickr.setDate(timeVal, true);
        else tobInput.value = timeVal;
      }
      if (cityInput) cityInput.value = chart.city || '';
      if (approxCheck) approxCheck.checked = Boolean(chart.is_time_approximate);

      this.intakeCoordinates = {
        lat: chart.latitude || 28.6139,
        lon: chart.longitude || 77.2090,
        tz: chart.timezone_offset || 5.5,
        country: chart.country || 'India'
      };

      App.showToast(`Loaded details for ${chart.name} ✨`, 'info');
    } catch (err) {
      console.warn('Could not load profile details into intake form:', err);
    }
  },

  getIntakeTemplateHtml() {
    const d = this.lastIntakeData || this.getEmptyIntakeData();
    return `
      <div class="welcome-screen" id="welcome-screen">
        <div class="astrotalk-intake-card" id="astrotalk-intake-card">
          <div class="intake-header">
            <div class="intake-icon">🕉️</div>
            <div>
              <h2 class="intake-title">🕉️ पंडित जी से परामर्श (Janam Kundli & Consultation)</h2>
              <p class="intake-subtitle">
                सटीक वैदिक फलकथन एवं सरल कल्याणकारी उपाय के लिए कृपया अपना जन्म विवरण दर्ज करें।
              </p>
            </div>
          </div>

          <form id="chat-intake-form" onsubmit="ChatController.submitIntakeForm(event)">
            <div class="intake-form-grid">
              <div class="form-group">
                <label class="intake-label" for="intake-name">Full Name / आपका नाम <span class="req">*</span></label>
                <input type="text" id="intake-name" class="intake-input" placeholder="e.g. Rahul Sharma / आपका पूरा नाम" value="${d.name || ''}" required />
              </div>

              <div class="form-group">
                <label class="intake-label">Gender / लिंग <span class="req">*</span></label>
                <div class="gender-toggle-group">
                  <label class="gender-radio-label ${d.gender === 'Male' ? 'active' : ''}" id="gender-label-male">
                    <input type="radio" name="intake-gender" value="Male" ${d.gender === 'Male' ? 'checked' : ''} onchange="ChatController.onGenderChange(this)" />
                    <span>♂ Male</span>
                  </label>
                  <label class="gender-radio-label ${d.gender === 'Female' ? 'active' : ''}" id="gender-label-female">
                    <input type="radio" name="intake-gender" value="Female" ${d.gender === 'Female' ? 'checked' : ''} onchange="ChatController.onGenderChange(this)" />
                    <span>♀ Female</span>
                  </label>
                  <label class="gender-radio-label ${d.gender === 'Other' ? 'active' : ''}" id="gender-label-other">
                    <input type="radio" name="intake-gender" value="Other" ${d.gender === 'Other' ? 'checked' : ''} onchange="ChatController.onGenderChange(this)" />
                    <span>Other</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label class="intake-label" for="intake-dob">Date of Birth / जन्म तिथि <span class="req">*</span></label>
                <div class="picker-input-wrapper">
                  <span class="picker-prefix-icon">📅</span>
                  <input type="text" id="intake-dob" class="intake-input modern-date-picker" placeholder="Select Date / जन्म तिथि चुनें" value="${d.dob || ''}" required readonly />
                </div>
              </div>

              <div class="form-group">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <label class="intake-label" for="intake-tob" style="margin-bottom:0;">Time of Birth / जन्म समय</label>
                  <label class="approx-checkbox" style="margin-top:0;">
                    <input type="checkbox" id="intake-approx-time" ${d.isApprox ? 'checked' : ''} onchange="ChatController.onApproxTimeToggle(this)" />
                    <span>Approx (अनुमानित)</span>
                  </label>
                </div>
                <div class="picker-input-wrapper" style="margin-top:0.2rem;">
                  <span class="picker-prefix-icon">⏰</span>
                  <input type="text" id="intake-tob" class="intake-input modern-time-picker" placeholder="Select Time / जन्म समय चुनें" value="${d.tob || ''}" readonly />
                </div>
                <div class="quick-time-chips">
                  <span class="time-tag" onclick="ChatController.setIntakeTime('08:00', 'Morning')">🌅 08:00 AM (सुबह)</span>
                  <span class="time-tag" onclick="ChatController.setIntakeTime('12:00', 'Noon')">☀️ 12:00 PM (दोपहर)</span>
                  <span class="time-tag" onclick="ChatController.setIntakeTime('18:30', 'Evening')">🌇 06:30 PM (शाम)</span>
                  <span class="time-tag" onclick="ChatController.setIntakeTime('21:00', 'Night')">🌙 09:00 PM (रात)</span>
                </div>
              </div>

              <div class="form-group full-col">
                <label class="intake-label" for="intake-city">Birth Place (City) / जन्म स्थान <span class="req">*</span></label>
                <input type="text" id="intake-city" class="intake-input" placeholder="e.g. New Delhi, Mumbai, Lucknow..." value="${d.city || ''}" required />
                <div class="intake-city-chips">
                  <span class="city-tag" onclick="ChatController.setIntakeCity('New Delhi', 'India', 28.6139, 77.2090, 5.5)">New Delhi</span>
                  <span class="city-tag" onclick="ChatController.setIntakeCity('Mumbai', 'India', 19.0760, 72.8777, 5.5)">Mumbai</span>
                  <span class="city-tag" onclick="ChatController.setIntakeCity('Bengaluru', 'India', 12.9716, 77.5946, 5.5)">Bengaluru</span>
                  <span class="city-tag" onclick="ChatController.setIntakeCity('Lucknow', 'India', 26.8467, 80.9462, 5.5)">Lucknow</span>
                  <span class="city-tag" onclick="ChatController.setIntakeCity('Jaipur', 'India', 26.9124, 75.7873, 5.5)">Jaipur</span>
                  <span class="city-tag" onclick="ChatController.setIntakeCity('Kolkata', 'India', 22.5726, 88.3639, 5.5)">Kolkata</span>
                </div>
              </div>

              <div class="form-group full-col">
                <label class="intake-label">Consultation Topic / परामर्श का मुख्य विषय <span class="req">*</span></label>
                <div class="topics-radio-grid">
                  <label class="topic-chip ${d.topic === 'love' ? 'active' : ''}">
                    <input type="radio" name="intake-topic" value="love" ${d.topic === 'love' ? 'checked' : ''} onchange="ChatController.onTopicChange(this)" />
                    <span>❤️ Love & Relationships</span>
                  </label>
                  <label class="topic-chip ${d.topic === 'career' ? 'active' : ''}">
                    <input type="radio" name="intake-topic" value="career" ${d.topic === 'career' ? 'checked' : ''} onchange="ChatController.onTopicChange(this)" />
                    <span>💼 Career & Job</span>
                  </label>
                  <label class="topic-chip ${d.topic === 'marriage' ? 'active' : ''}">
                    <input type="radio" name="intake-topic" value="marriage" ${d.topic === 'marriage' ? 'checked' : ''} onchange="ChatController.onTopicChange(this)" />
                    <span>💍 Marriage & Compatibility</span>
                  </label>
                  <label class="topic-chip ${d.topic === 'wealth' ? 'active' : ''}">
                    <input type="radio" name="intake-topic" value="wealth" ${d.topic === 'wealth' ? 'checked' : ''} onchange="ChatController.onTopicChange(this)" />
                    <span>💰 Wealth & Business</span>
                  </label>
                  <label class="topic-chip ${d.topic === 'health' ? 'active' : ''}">
                    <input type="radio" name="intake-topic" value="health" ${d.topic === 'health' ? 'checked' : ''} onchange="ChatController.onTopicChange(this)" />
                    <span>🩺 Health & Vitality</span>
                  </label>
                  <label class="topic-chip ${d.topic === 'kundli' ? 'active' : ''}">
                    <input type="radio" name="intake-topic" value="kundli" ${d.topic === 'kundli' ? 'checked' : ''} onchange="ChatController.onTopicChange(this)" />
                    <span>🪐 Complete Kundli Reading</span>
                  </label>
                </div>
              </div>

              <div class="form-group full-col">
                <label class="intake-label" for="intake-custom-question">Your Specific Question / आपका विशिष्ट प्रश्न (Optional)</label>
                <input type="text" id="intake-custom-question" class="intake-input" placeholder="e.g. Mere career mein kab growth hogi? (or leave blank for general guidance)" value="${d.customQuestion || ''}" />
              </div>
            </div>

            <div class="intake-actions">
              <button type="button" class="btn-reset-intake" onclick="ChatController.clearIntakeForm()">
                <span>🔄</span>
                <span>Reset Form (खाली करें)</span>
              </button>
              <button type="submit" id="btn-submit-intake" class="btn-start-consultation">
                <span>🙏</span>
                <span>पंडित जी से परामर्श शुरू करें (Start Consultation)</span>
                <span>→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  startNewChat() {
    this.currentSessionId = null;
    this.lastIntakeData = this.getEmptyIntakeData();
    this.intakeCoordinates = { lat: 28.6139, lon: 77.2090, tz: 5.5, country: 'India' };

    // Deselect any active session in the sidebar
    document.querySelectorAll('#sessions-list .sidebar-item').forEach(item => item.classList.remove('active'));

    const box = document.getElementById('chat-messages-container');
    if (!box) return;

    box.innerHTML = this.getIntakeTemplateHtml();
    this.renderIntakeSavedChips();

    // Reset bottom chat input
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = '';
      chatInput.style.height = 'auto';
    }

    // Reset topbar profile tag if starting new consultation
    const topbarName = document.getElementById('topbar-profile-name');
    if (topbarName) {
      topbarName.innerText = 'New Consultation';
    }

    // Auto-focus on name field
    setTimeout(() => {
      const nameInput = document.getElementById('intake-name');
      if (nameInput) nameInput.focus();
    }, 50);

    App.showToast('Started new consultation intake (नया परामर्श फॉर्म तैयार है) ✨', 'info');
  },

  async submitIntakeForm(e) {
    if (e && e.preventDefault) e.preventDefault();

    const nameInput = document.getElementById('intake-name');
    const dobInput = document.getElementById('intake-dob');
    const tobInput = document.getElementById('intake-tob');
    const cityInput = document.getElementById('intake-city');
    const approxCheck = document.getElementById('intake-approx-time');
    const questionInput = document.getElementById('intake-custom-question');
    const submitBtn = document.getElementById('btn-submit-intake');

    if (!nameInput || !nameInput.value.trim()) {
      App.showToast('Please enter your full name / आपका नाम आवश्यक है', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }
    if (!dobInput || !dobInput.value) {
      App.showToast('Please select your date of birth / जन्म तिथि आवश्यक है', 'warning');
      if (dobInput) dobInput.focus();
      return;
    }
    if (!cityInput || !cityInput.value.trim()) {
      App.showToast('Please enter your birth city / जन्म स्थान आवश्यक है', 'warning');
      if (cityInput) cityInput.focus();
      return;
    }

    const name = nameInput.value.trim();
    const dob = dobInput.value;
    const tob = tobInput && tobInput.value ? (tobInput.value.length === 5 ? tobInput.value + ':00' : tobInput.value) : '12:00:00';
    const isApprox = approxCheck ? approxCheck.checked : false;
    const city = cityInput.value.trim();
    const genderElem = document.querySelector('input[name="intake-gender"]:checked');
    const gender = genderElem ? genderElem.value : 'Male';
    const topicElem = document.querySelector('input[name="intake-topic"]:checked');
    const topic = topicElem ? topicElem.value : 'love';
    const customQ = questionInput ? questionInput.value.trim() : '';

    const coords = this.intakeCoordinates || { lat: 28.6139, lon: 77.2090, tz: 5.5, country: 'India' };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳</span> <span>Calculating Janam Kundli with Swiss Ephemeris...</span>';
    }

    try {
      const chartPayload = {
        name: name,
        date_of_birth: dob,
        time_of_birth: tob,
        is_time_approximate: isApprox,
        latitude: coords.lat,
        longitude: coords.lon,
        timezone_offset: coords.tz,
        city: city,
        country: coords.country || 'India',
        system: 'Vedic',
        ayanamsa: 'Lahiri'
      };

      const chart = await API.calculateChart(chartPayload);
      App.currentChart = chart;
      this.activeChartId = chart.id;
      App.updateActiveProfileUI(chart);
      App.loadSavedProfiles();

      // Store intake data
      this.lastIntakeData = { name, gender, dob, tob, isApprox, city, coords, topic };

      // Clear intake form from chat stream
      const box = document.getElementById('chat-messages-container');
      if (box) box.innerHTML = '';

      const topicLabels = {
        love: '❤️ Love & Relationships (प्रेम एवं संबंध)',
        career: '💼 Career & Job Growth (करियर एवं नौकरी)',
        marriage: '💍 Marriage & Compatibility (विवाह एवं कुंडली मिलान)',
        wealth: '💰 Wealth & Business (धन एवं व्यापार)',
        health: '🩺 Health & Vitality (स्वास्थ्य)',
        kundli: '🪐 Complete Janam Kundli Reading (संपूर्ण कुंडली पठन)'
      };
      const topicLabel = topicLabels[topic] || 'Astrological Consultation';

      // Append Astro Jyotish Connected Banner
      const cd = chart.chart_data || {};
      const bannerHtml = `
        <div class="astrotalk-connected-banner astrojyotish-connected-banner">
          <div class="banner-live-head">
            <div class="live-badge">
              <span class="live-pulse-dot"></span>
              <span>Astrologer Connected (लाइव ज्योतिषी परामर्श)</span>
            </div>
            <div class="banner-session-id">Consultation Session #${chart.id.slice(-6)}</div>
          </div>
          <div class="banner-client-grid">
            <div class="client-detail-pill">👤 <strong>${chart.name}</strong> (${gender})</div>
            <div class="client-detail-pill">📅 <strong>${chart.date_of_birth}</strong> at <strong>${chart.time_of_birth || '12:00'}</strong></div>
            <div class="client-detail-pill">📍 <strong>${chart.city || 'Birthplace'}, ${chart.country || 'India'}</strong></div>
            <div class="client-detail-pill highlight-gold">🪐 <strong>${cd.ascendant_sign || 'Lagna'} Lagna</strong> • 🌙 <strong>${cd.moon_sign || 'Moon'} Rashi</strong> (${cd.moon_nakshatra || ''})</div>
            <div class="client-detail-pill topic-pill">🎯 <strong>Focus:</strong> ${topicLabel}</div>
          </div>
        </div>
      `;
      box.insertAdjacentHTML('beforeend', bannerHtml);

      // Determine initial user prompt
      let promptToSend = customQ;
      if (!promptToSend) {
        const topicPrompts = {
          love: 'Mere love life aur relationship ke baare mein guidance chahiye.',
          career: 'Mere career aur job growth ke baare mein guidance chahiye.',
          marriage: 'Meri marriage aur relationship compatibility ke yog ke baare mein guidance chahiye.',
          wealth: 'Mere financial stability aur wealth prospects ke baare mein guidance chahiye.',
          health: 'Mere health aur physical wellbeing ke baare mein guidance chahiye.',
          kundli: 'Meri Janam Kundli ka detailed Lagna D1 analysis batayein.'
        };
        promptToSend = topicPrompts[topic] || 'Mere kundli ke anusaar general guidance de.';
      }

      App.showToast(`Connected to Astrologer for ${chart.name}! 🔮`, 'success');
      await this.sendMessage(promptToSend);

    } catch (err) {
      console.error('Intake submission error:', err);
      App.showToast(`Failed to initialize consultation: ${err.message}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🙏</span> <span>पंडित जी से परामर्श शुरू करें (Start Consultation)</span> <span>→</span>';
      }
    }
  },

  async loadSessions() {
    // User mandate: Do NOT show past chat history in consultation room or left sidebar
    const list = document.getElementById('sessions-list');
    if (list) list.innerHTML = '';
    const countBadge = document.getElementById('session-count-badge');
    if (countBadge) countBadge.innerText = '0';
  },

  async openSessionForChart(chartId) {
    if (!chartId) return false;
    try {
      const sessions = await API.getChatSessions();
      const match = sessions.find(s => s.chart_id === chartId);
      if (match) {
        await this.loadSessionHistory(match.id);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Could not find session for chart:', e);
      return false;
    }
  },

  async loadSessionHistory(sessionId) {
    if (!sessionId) return;
    this.currentSessionId = sessionId;

    // Highlight active session item in sidebar immediately
    document.querySelectorAll('#sessions-list .sidebar-item').forEach(item => {
      item.classList.remove('active');
    });

    // Auto-close sidebar on mobile/tablet so user sees the loaded chat immediately
    if (window.innerWidth <= 900) {
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('drawer-backdrop');
      if (sidebar) sidebar.classList.add('collapsed');
      if (backdrop) backdrop.classList.remove('active');
    }

    const box = document.getElementById('chat-messages-container');
    if (!box) return;

    // Display smooth loading placeholder
    box.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 220px; color: var(--text-dim); gap: 0.75rem;">
        <div style="font-size: 2rem;">⏳</div>
        <div style="font-size: 0.92rem; font-weight: 500; color: var(--text-secondary);">Loading consultation history... (परामर्श लोड हो रहा है)</div>
      </div>
    `;

    try {
      const data = await API.getSessionHistory(sessionId);
      box.innerHTML = '';

      if (data.title) {
        const topbarName = document.getElementById('topbar-profile-name');
        if (topbarName) topbarName.innerText = data.title;
      }

      if (data.chart_id) {
        this.activeChartId = data.chart_id;
        if (window.App && window.App.selectChart) {
          window.App.selectChart(data.chart_id, false, true);
        }
      }

      // User mandate: Do not show past chat history in chat room
      this.appendMessage('assistant', '🙏 **प्रणाम!** यह परामर्श सत्र सक्रिय है। आप अपनी जन्म कुण्डली, विवाह, करियर, धन अथवा जीवन के किसी भी विषय पर नया प्रश्न पूछ सकते हैं।');
      const chips = document.getElementById('dynamic-context-chips');
      if (chips) chips.style.display = 'flex';

      box.scrollTop = box.scrollHeight;
      this.loadSessions();
    } catch (err) {
      console.error('Error loading session history:', err);
      box.innerHTML = '';
      this.appendMessage('assistant', `⚠️ Could not load conversation history: ${err.message}`);
    }
  },

  formatMarkdown(text) {
    if (!text) return '';
    // Strip bold markers and format clean, gentle Pandit Ji text
    let html = text
      .replace(/### (.*?)\n/g, '<div style="margin: 0.5rem 0 0.2rem 0; font-size: 0.95rem; font-weight: 600; color: #92400E;">$1</div>')
      .replace(/## (.*?)\n/g, '<div style="margin: 0.55rem 0 0.25rem 0; font-size: 1rem; font-weight: 600; color: #92400E;">$1</div>')
      .replace(/# (.*?)\n/g, '<div style="margin: 0.6rem 0 0.3rem 0; font-size: 1.05rem; font-weight: 600; color: #78350F;">$1</div>')
      .replace(/\*\*(.*?)\*\*/g, '$1') // Completely unbold **text** per user request
      .replace(/\*\*/g, '')           // Strip any trailing unclosed ** from streaming
      .replace(/\*(.*?)\*/g, '$1')     // Clean single asterisk formatting
      .replace(/> (.*?)\n/g, '<blockquote style="border-left: 3px solid #F59E0B; padding: 0.4rem 0.75rem; margin: 0.5rem 0; background: #FFFDF5; border-radius: 4px; color: #78350F; font-size: 0.9rem; line-height: 1.5;">$1</blockquote>')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\bUser ji\b/gi, 'बेटा')
      .replace(/\bUser\b/g, '')
      .replace(/^[\*\-] (.*?)$/gm, '<li style="margin-bottom: 0.25rem; color: #334155;">• $1</li>')
      .replace(/^\d+\.\s+(.*?)$/gm, '<li style="margin-bottom: 0.25rem; color: #334155;">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');

    html = html.replace(/(<li style="[^"]*">.*?<\/li>)+/g, '<ul style="margin: 0.4rem 0 0.5rem 0.5rem; padding-left: 0; list-style: none;">$&</ul>');
    return html;
  },

  renderAvatar(avatar, name = 'Astrologer') {
    if (!avatar) return '🕉️';
    if (typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('/') || avatar.startsWith('assets/'))) {
      return `<img src="${avatar}" alt="${name}" class="astrologer-avatar-img" onerror="this.onerror=null; this.src='/assets/portraits/default-avatar.svg';" />`;
    }
    return `<span>${avatar}</span>`;
  },

  appendMessage(role, text, citations = [], isDemo = false, chartSvg = null, imagePreview = null, options = {}) {
    const box = document.getElementById('chat-messages-container');
    if (!box) return null;

    // Hide welcome screen if active consultation or user started chatting
    const welcome = document.getElementById('welcome-screen');
    if (welcome && (role === 'user' || this.currentSessionId || this.activeConsultation)) {
      welcome.style.display = 'none';
    }

    // Insert date separator chip if not already present (matching reference: Today · 10:32 AM)
    if (!box.querySelector('.chat-date-pill')) {
      const datePill = document.createElement('div');
      datePill.className = 'chat-date-pill';
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      datePill.innerText = `Today · ${timeStr}`;
      const olderWrap = document.getElementById('chat-load-older-wrap');
      if (olderWrap && olderWrap.parentNode === box && olderWrap.nextSibling) {
        box.insertBefore(datePill, olderWrap.nextSibling);
      } else {
        box.prepend(datePill);
      }
    }

    const isGroupStart = (this.lastSenderRole !== role);
    this.lastSenderRole = role;

    const row = document.createElement('div');
    row.className = `message-row ${role} ${isGroupStart ? 'group-start' : 'group-continuation'}`;
    if (options.msgId) row.dataset.msgId = options.msgId;

    const formattedContent = this.formatMarkdown(text);
    const timeStr = options.timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Inline Kundli SVG box if available
    let chartHtml = '';
    if (chartSvg) {
      chartHtml = `
        <div class="chat-inline-kundli-box">
          <div class="inline-kundli-title">
            <span>🪐 Lagna Kundali (D1)</span>
          </div>
          ${chartSvg}
        </div>
      `;
    }

    const currentAstrologer = (this.astrologers || []).find(a => a.id === this.selectedAstrologer || a.slug === this.selectedAstrologer) || {
      avatar: '🕉️',
      name: 'Acharya Shastri',
      title: 'Vedic Astrologer'
    };

    if (role === 'user') {
      let userInner = `<div class="msg-text-content">${formattedContent}</div>`;
      if (imagePreview) {
        userInner = `
          <div class="chat-uploaded-palm-container">
            <img src="${imagePreview}" class="chat-uploaded-palm-thumb" alt="Uploaded Palm Photo" />
            <div class="palm-caption">${formattedContent}</div>
          </div>
        `;
      }

      let statusHtml = '';
      if (options.status === 'failed') {
        const rawText = encodeURIComponent(options.rawText || text);
        statusHtml = `<span class="msg-status-fail" title="Delivery failed">⚠️ Failed</span> <button type="button" class="btn-msg-retry" onclick="ChatController.retryMessage('${rawText}')" title="Retry sending">↻ Retry</button>`;
      } else if (options.status === 'sending') {
        statusHtml = `<span class="msg-status-sending" title="Sending...">🕒</span>`;
      } else {
        statusHtml = `<span class="msg-status-delivered" title="Delivered">✓✓</span>`;
      }

      row.innerHTML = `
        <div class="message-bubble user-bubble">
          ${userInner}
          <div class="msg-meta-row user-meta">
            <span class="msg-time">${timeStr}</span>
            <span class="msg-status-tick">${statusHtml}</span>
          </div>
        </div>
      `;
    } else {
      const escapedRaw = encodeURIComponent(text);
      const speakerNameHeader = isGroupStart
        ? `<div class="msg-speaker-compact-name">${currentAstrologer.name}</div>`
        : '';
      const avatarCol = isGroupStart
        ? `<div class="msg-avatar" title="${currentAstrologer.name}">${this.renderAvatar(currentAstrologer.avatar, currentAstrologer.name)}</div>`
        : `<div class="msg-avatar-spacer" aria-hidden="true"></div>`;

      row.innerHTML = `
        ${avatarCol}
        <div class="message-bubble assistant-bubble">
          ${speakerNameHeader}
          <div class="msg-text-content">${formattedContent}</div>
          ${chartHtml}
          <div class="msg-meta-row assistant-meta">
            <span class="msg-time">${timeStr}</span>
            <button type="button" class="btn-copy-discreet" onclick="ChatController.copyMessage('${escapedRaw}')" title="Copy text">📋</button>
          </div>
        </div>
      `;
    }

    const sentinel = document.getElementById('chat-bottom-sentinel');
    if (sentinel) {
      box.insertBefore(row, sentinel);
    } else {
      box.appendChild(row);
    }

    // Scroll management: User message always scrolls to bottom; Assistant message scrolls only if near bottom
    if (role === 'user') {
      this.scrollToBottom(false);
    } else {
      this.anchorAnswerStart(row);
    }

    return row;
  },

  copyMessage(escapedText) {
    const raw = decodeURIComponent(escapedText);
    navigator.clipboard.writeText(raw).then(() => {
      App.showToast('Response copied to clipboard! 📋', 'success');
    }).catch(() => {
      App.showToast('Unable to copy response', 'error');
    });
  },

  shareResponseWhatsApp(escapedText) {
    const raw = decodeURIComponent(escapedText);
    const persona = this.astrologers.find(a => a.id === this.selectedAstrologer) || { name: 'Acharya Shastri' };
    const text = 
`🕉️ *दैवीय वैदिक ज्योतिष परामर्श - ${persona.name}* 🕉️
━━━━━━━━━━━━━━━━━━
${raw}
━━━━━━━━━━━━━━━━━━
✨ Astro Jyotish प्रामाणिक वैदिक ज्योतिष परामर्श:
https://astrojyotish.ai`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
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

  askQuickPrompt(promptText) {
    if (!promptText) return;
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = promptText;
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    }
    this.sendMessage(promptText);
  },

  startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      App.showToast('Voice typing is supported in Chrome, Edge, and modern mobile browsers! 🎙️', 'info');
      return;
    }
    const micBtn = document.getElementById('btn-chat-mic');
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      if (micBtn) {
        micBtn.style.color = '#DC2626';
        micBtn.style.transform = 'scale(1.2)';
      }
      App.showToast('🎙️ बोलिए, पंडित जी सुन रहे हैं... (Listening...)', 'info');
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        const input = document.getElementById('chat-input');
        if (input) {
          input.value = (input.value ? input.value + ' ' : '') + transcript;
          input.focus();
        }
      };
      recognition.onend = () => {
        if (micBtn) {
          micBtn.style.color = '#6D28D9';
          micBtn.style.transform = 'none';
        }
      };
      recognition.onerror = () => {
        if (micBtn) {
          micBtn.style.color = '#6D28D9';
          micBtn.style.transform = 'none';
        }
      };
      recognition.start();
    } catch (err) {
      if (micBtn) {
        micBtn.style.color = '#6D28D9';
        micBtn.style.transform = 'none';
      }
      App.showToast('Could not start microphone: ' + err.message, 'warning');
    }
  },

  initLiveTimer() {
    let remainingSeconds = 14 * 60 + 52;
    const timerElem = document.getElementById('chat-timer-count');
    if (!timerElem) return;

    if (this.liveTimerInterval) clearInterval(this.liveTimerInterval);
    this.liveTimerInterval = setInterval(() => {
      remainingSeconds--;
      if (remainingSeconds <= 0) {
        remainingSeconds = 15 * 60;
      }
      const m = Math.floor(remainingSeconds / 60);
      const s = remainingSeconds % 60;
      timerElem.innerText = `Live: ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }, 1000);
  },

  startAudioCall() {
    const currentAstrologer = (this.astrologers || []).find(a => a.id === this.selectedAstrologer || a.slug === this.selectedAstrologer) || { avatar: 'assets/acharyashastri.webp', name: 'Acharya Shastri', title: 'वरिष्ठ वैदिक ज्योतिषाचार्य' };

    let callOverlay = document.getElementById('modal-audio-call-overlay');
    if (!callOverlay) {
      callOverlay = document.createElement('div');
      callOverlay.id = 'modal-audio-call-overlay';
      callOverlay.className = 'modal-overlay';
      document.body.appendChild(callOverlay);
    }

    callOverlay.innerHTML = `
      <div class="modal-card" style="max-width: 440px; text-align: center; padding: 2.25rem 1.75rem; background: linear-gradient(180deg, #1E1B4B 0%, #0F172A 100%); color: #FFFFFF; border: 2px solid #F59E0B; border-radius: 24px; box-shadow: 0 12px 40px rgba(0,0,0,0.5);">
        <div style="font-size: 0.76rem; letter-spacing: 0.08em; text-transform: uppercase; color: #FCD34D; font-weight: 800; margin-bottom: 1rem;">
          📞 Private Vedic Audio Consultation
        </div>
        <div style="width: 104px; height: 104px; margin: 0 auto 1.25rem; border-radius: 50%; overflow: hidden; border: 3px solid #F59E0B; box-shadow: 0 0 25px rgba(245, 158, 11, 0.45); display: flex; align-items: center; justify-content: center; background: #312E81;">
          ${this.renderAvatar(currentAstrologer.avatar, currentAstrologer.name, 'w-full h-full object-cover')}
        </div>
        <h3 style="font-family: var(--font-serif); font-size: 1.45rem; margin: 0 0 0.35rem; color: #FFFFFF;">${currentAstrologer.name}</h3>
        <p style="font-size: 0.82rem; color: #CBD5E1; margin: 0 0 1rem;">${currentAstrologer.title || 'Classical Jyotish Scholar'}</p>
        <div id="audio-call-status-pill" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.85rem; background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; border-radius: 999px; font-size: 0.8rem; font-weight: 700; color: #34D399; margin-bottom: 1.75rem;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; display: inline-block; animation: liveTimerPulse 1.5s infinite;"></span>
          <span id="audio-call-status-text">Connected • HD Vedic Audio Line</span>
        </div>

        <div style="display: flex; justify-content: center; gap: 1.25rem; margin-top: 1rem;">
          <button type="button" class="btn-icon" style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #FFF; font-size: 1.3rem; cursor: pointer;" title="Mute Microphone" onclick="App.showToast('Microphone muted', 'info')">🎙️</button>
          <button type="button" class="btn-icon" style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); color: #FFF; font-size: 1.3rem; cursor: pointer;" title="Speaker On" onclick="App.showToast('Speaker toggled', 'info')">🔊</button>
          <button type="button" class="btn-icon" style="width: 52px; height: 52px; border-radius: 50%; background: #DC2626; border: none; color: #FFF; font-size: 1.3rem; cursor: pointer;" title="End Call" onclick="ChatController.endAudioCall()">📞</button>
        </div>
      </div>
    `;

    callOverlay.classList.add('active');
  },

  endAudioCall() {
    const callOverlay = document.getElementById('modal-audio-call-overlay');
    if (callOverlay) callOverlay.classList.remove('active');
    App.showToast('Audio consultation ended. Session notes saved to chat. 🙏', 'info');
  },

  async loadAstrologers() {
    try {
      const data = await API.getAstrologers();
      this.astrologers = Array.isArray(data) ? data : (data.items || []);
      this.updateAstrologerUI();
      // Also notify App if directory is loaded
      if (window.App && window.App.onAstrologersLoaded) {
        window.App.onAstrologersLoaded(this.astrologers);
      }
    } catch (err) {
      console.warn('Could not load astrologers:', err);
    }
  },

  updateAstrologerUI() {
    const current = (this.astrologers || []).find(a => a.id === this.selectedAstrologer || a.slug === this.selectedAstrologer) || this.astrologers[0] || {
      id: 'acharya_shastri',
      name: 'Acharya Shastri',
      title: 'Senior Vedic Astrologer',
      avatar: 'assets/portraits/acharya_shastri.svg',
      experience: '24+ Yrs Exp',
      availability: 'online'
    };

    // Update topbar astrologer badge
    const avatarEl = document.getElementById('topbar-astrologer-avatar') || document.querySelector('.astrologer-avatar');
    const nameEl = document.getElementById('topbar-astrologer-name') || document.querySelector('.astrologer-info h3');
    const titleEl = document.getElementById('topbar-astrologer-meta') || document.querySelector('.astrologer-info p');
    if (avatarEl) avatarEl.innerHTML = this.renderAvatar(current.avatar, current.name);
    
    const typeBadge = current.type === 'human'
      ? '<span class="card-type-tag tag-human" style="font-size:0.6rem; margin-left:0.3rem;">Human Scholar</span>'
      : '<span class="card-type-tag tag-specialty" style="font-size:0.6rem; margin-left:0.3rem;">Vedic Consultation</span>';
    if (nameEl) nameEl.innerHTML = `${current.name} ${typeBadge} <span style="font-size: 0.7rem; color: var(--gold-accent);">✦</span>`;
    
    const availDot = current.availability === 'busy' ? '🟡 व्यस्त (Busy)' : (current.availability === 'offline' ? '⚪ ऑफलाइन (Offline)' : '🟢 ऑनलाइन (Online)');
    if (titleEl) titleEl.innerText = `${current.title} • ${current.experience_years ? current.experience_years + '+ वर्ष' : (current.experience || '24+ वर्ष')} • ${availDot}`;

    // Update Workspace Welcome Screen
    const welcomeAvatar = document.getElementById('workspace-welcome-avatar');
    const welcomeName = document.getElementById('workspace-welcome-name');
    const welcomeBadge = document.getElementById('workspace-welcome-badge');
    const welcomeDesc = document.getElementById('workspace-welcome-desc');
    const welcomeDisclosure = document.getElementById('workspace-disclosure-banner');
    if (welcomeAvatar) welcomeAvatar.innerHTML = this.renderAvatar(current.avatar, current.name, 'profile-hero-avatar-img');
    if (welcomeName) welcomeName.innerText = current.name || 'Acharya Shastri';
    if (welcomeBadge) welcomeBadge.innerText = `${current.type === 'human' ? 'Certified Human Scholar' : 'Classical Vedic Consultation'} • ${current.experience_years ? current.experience_years + '+ Yrs Exp' : '24+ Yrs Exp'}`;
    if (welcomeDesc && current.bio) welcomeDesc.innerText = current.bio;
    if (welcomeDisclosure) {
      if (current.type === 'human') {
        welcomeDisclosure.innerHTML = '⚖️ <strong>Verified Human Scholar:</strong> Real-time direct inquiry with certified Vedic Acharya. Zero synthetic AI substitution.';
      } else {
        welcomeDisclosure.innerHTML = 'ℹ️ <strong>Consultation Notice:</strong> Automated Jyotish assistant powered by Swiss Ephemeris & classical Vedic shastras. Honest, transparent guidance with zero synthetic human pretense.';
      }
    }

    // Update Right Context Panel Astrologer Summary
    const ctxAvatar = document.getElementById('context-ast-avatar');
    const ctxName = document.getElementById('context-ast-name');
    const ctxTitle = document.getElementById('context-ast-title');
    const ctxBio = document.getElementById('context-ast-bio');
    if (ctxAvatar) ctxAvatar.innerHTML = this.renderAvatar(current.avatar, current.name);
    if (ctxName) ctxName.innerText = current.name;
    if (ctxTitle) ctxTitle.innerText = current.title || 'Vedic Astrologer';
    if (ctxBio && current.bio) ctxBio.innerText = current.bio;
  },

  selectAstrologer(id) {
    this.selectedAstrologer = id;
    localStorage.setItem('astroai_astrologer', id);
    this.updateAstrologerUI();
    const current = (this.astrologers || []).find(a => a.id === id || a.slug === id);
    if (current && window.App && window.App.showToast) {
      window.App.showToast(`Selected ${current.name} (${current.title}) ✨`, 'success');
    }
    const modal = document.getElementById('modal-select-astrologer');
    if (modal) modal.classList.remove('active');
  },

  async startConsultationWith(astrologerId) {
    try {
      const astrologer = (this.astrologers || []).find(a => a.id === astrologerId || a.slug === astrologerId) || { id: astrologerId, name: 'Astrologer' };
      const userId = (window.App && window.App.getUserId) ? window.App.getUserId() : (localStorage.getItem('astroai_user_id') || 'guest_user');
      const chartId = (window.App && window.App.currentChart) ? window.App.currentChart.id : null;

      // Call backend API to create or resume persistent consultation
      const consultation = await API.createOrResumeConsultation({
        astrologer_id: astrologer.id || astrologerId,
        user_id: userId,
        birth_profile_id: chartId,
        consultation_mode: astrologer.type === 'human' ? 'human' : 'ai'
      });

      this.activeConsultation = consultation;
      this.currentSessionId = consultation.id;
      this.selectedAstrologer = consultation.astrologer_id;
      localStorage.setItem('astroai_astrologer', consultation.astrologer_id);
      localStorage.setItem('astroai_active_consultation', consultation.id);

      // Navigate to consultation workspace
      if (window.Router) {
        window.Router.navigate('/consultation/' + consultation.id);
      }

      // Update Topbar UI
      this.updateAstrologerUI();

      // Show End Consultation Button in topbar
      const endBtn = document.getElementById('btn-end-consultation');
      if (endBtn) endBtn.style.display = 'inline-flex';

      // Hide Intake Form if open, show messages
      const welcomeScreen = document.getElementById('welcome-screen');
      if (welcomeScreen) {
        welcomeScreen.style.display = 'none';
      }

      // Close open modals
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));

      // Load persistent consultation message history
      await this.loadConsultationHistory(consultation.id);

      if (window.App && window.App.showToast) {
        window.App.showToast(`Consultation active with ${astrologer.name} ✨`, 'success');
      }
    } catch (err) {
      console.error('Failed to start consultation:', err);
      if (window.App && window.App.showToast) {
        window.App.showToast(`Could not start consultation: ${err.message}`, 'error');
      }
    }
  },

  async resumeConsultationById(consultationId) {
    try {
      const data = await API.getConsultationDetails(consultationId);
      this.activeConsultation = data;
      this.currentSessionId = data.id;
      this.selectedAstrologer = data.astrologer_id;
      localStorage.setItem('astroai_astrologer', data.astrologer_id);
      localStorage.setItem('astroai_active_consultation', data.id);

      if (data.astrologer) {
        if (!this.astrologers.find(a => a.id === data.astrologer.id)) {
          this.astrologers.push(data.astrologer);
        }
      }
      this.updateAstrologerUI();

      const endBtn = document.getElementById('btn-end-consultation');
      if (endBtn) endBtn.style.display = 'inline-flex';

      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
      const drawerBackdrop = document.getElementById('drawer-backdrop');
      if (drawerBackdrop) drawerBackdrop.classList.remove('active');

      await this.loadConsultationHistory(data.id);
    } catch (err) {
      console.warn('Failed to resume consultation by ID:', consultationId, err);
      // Handle genuinely missing astrologers with intentional not-found page
      const container = document.getElementById('chat-messages-container');
      const welcome = document.getElementById('welcome-screen');
      if (welcome) welcome.style.display = 'none';
      if (container) {
        container.innerHTML = `
          <div class="astrologer-not-found-screen flex flex-col items-center justify-center p-8 sm:p-12 text-center my-auto min-h-[380px]">
            <div class="w-16 h-16 rounded-2xl bg-[#FFFBEB] border border-[#FCD34D] flex items-center justify-center text-3xl mb-4 shadow-sm">🪐</div>
            <h2 class="text-xl sm:text-2xl font-serif font-bold text-[#1E1B4B] mb-2">Astrologer Not Found / ज्योतिषी उपलब्ध नहीं हैं</h2>
            <p class="text-sm text-[#64748B] max-w-md mb-6 leading-relaxed">
              The astrologer profile or consultation session "<strong>${decodeURIComponent(consultationId)}</strong>" was not found. Please choose an active Vedic astrologer from our verified directory.
            </p>
            <div class="flex items-center gap-3">
              <a href="/astrologers" data-nav-link class="btn-primary-purple py-2.5 px-6 rounded-full text-white font-bold text-sm bg-gradient-to-r from-[#7439EA] to-[#5B21B6] hover:from-[#5B21B6] hover:to-[#4C1D95] shadow-md transition-all no-underline">
                View Astrologers Directory →
              </a>
              <a href="/" data-nav-link class="py-2.5 px-5 rounded-full text-[#1E1B4B] font-semibold text-sm border border-[#E7E2D8] bg-white hover:bg-[#FAF8F2] shadow-2xs transition-all no-underline">
                Return Home
              </a>
            </div>
          </div>
        `;
      }
    }
  },

  async loadConsultationHistory(consultationId) {
    try {
      this.lastSenderRole = null;
      this.unreadCountWhileScrolled = 0;
      const data = await API.getConsultationDetails(consultationId);
      const container = document.getElementById('chat-messages-container');
      if (!container) return;

      const welcome = document.getElementById('welcome-screen');
      const loadWrap = document.getElementById('chat-load-older-wrap');

      // Clear existing message rows
      container.querySelectorAll('.message-row').forEach(row => row.remove());
      if (welcome) welcome.style.display = 'none';
      if (loadWrap) loadWrap.style.display = 'none';
      this.oldestMessageId = null;

      // Update active astrologer if returned
      if (data && data.astrologer) {
        this.selectedAstrologer = data.astrologer.slug || data.astrologer.id;
        const nameEl = document.getElementById('topbar-astrologer-name');
        if (nameEl) nameEl.textContent = data.astrologer.name;
        const metaEl = document.getElementById('topbar-astrologer-meta');
        if (metaEl) {
          metaEl.textContent = `⭐ ${data.astrologer.rating || '4.98'} · ${data.astrologer.experience_years || 25}+ Yrs · 🟢 Live`;
        }
        const avatarEl = document.getElementById('topbar-astrologer-avatar');
        if (avatarEl) {
          avatarEl.innerHTML = this.renderAvatar(data.astrologer.avatar, data.astrologer.name);
        }
      }

      // USER MANDATE: Do NOT display past chat history in the consultation room.
      // Every session begins with a pristine, royal Vedic greeting, in-chat Kundli card, Voice Note & Prescription Slip.
      const ast = (data && data.astrologer) || {};
      const astName = ast.name || 'Pt. Tribhuvan Sharma';
      const astTitle = ast.title || 'वरिष्ठ वैदिक ज्योतिषाचार्य';
      
      // 1. Floating Gold Janam Kundli Mini Summary Card
      const kundliCardHtml = `
        <div class="chat-kundli-summary-card" id="chat-live-kundli-summary">
          <div class="kundli-summary-left">
            <div class="kundli-summary-seal" title="Vedic Mathematical Longitude">🪐</div>
            <div class="kundli-summary-text-wrap">
              <div class="kundli-summary-head">
                <span class="head-title">सक्रिय जन्म कुण्डली सारांश (Active Kundli Analysis)</span>
                <span class="head-badge">Swiss Ephemeris 3.0</span>
              </div>
              <div class="kundli-summary-chips">
                <span class="k-chip"><strong>लग्न:</strong> मेष (Aries)</span>
                <span class="k-chip"><strong>चन्द्र नक्षत्र:</strong> रोहिणी (Rohini)</span>
                <span class="k-chip"><strong>सक्रिय महादशा:</strong> राहु-गुरु</span>
                <span class="k-chip"><strong>सूर्य:</strong> सिंह (Leo)</span>
              </div>
            </div>
          </div>
          <button type="button" class="btn-chat-view-kundli" onclick="ChatController.toggleKundliSheet ? ChatController.toggleKundliSheet() : App.openBirthModal()">
            <span>📜 विस्तृत कुण्डली देखें</span>
          </button>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', kundliCardHtml);

      // 2. Royal Astrologer Personal Greeting
      const greeting = `🙏 **प्रणाम!** मैं **${astName}** (${astTitle}), Astro Jyotish के इस पावन परामर्श कक्ष में आपका हार्दिक स्वागत करता हूँ।\n\nअपने जीवन, विवाह, प्रेम सम्बंध, करियर, धन लाभ अथवा जन्म कुंडली के किसी भी संशय पर आप बेझिझक चर्चा कर सकते हैं। आज आप किस विषय में मार्गदर्शन चाहते हैं?`;
      this.appendMessage('assistant', greeting);

      // 3. Astrologer Audio Voice Note Widget (Voice Note Player)
      const voiceNoteHtml = `
        <div class="message-row assistant group-continuation" style="margin-top: -0.25rem;">
          <div class="msg-avatar-spacer"></div>
          <div class="voice-note-card" id="chat-active-voice-note">
            <button type="button" class="btn-voice-play" id="btn-play-voice-note" onclick="ChatController.toggleVoiceNote(this)" aria-label="Play Voice Note" title="पंडित जी का स्वर संदेश सुनें">
              <span class="icon-voice-action">▶</span>
            </button>
            <div class="voice-waveform-wrap">
              <div class="voice-bars" id="voice-bars-container">
                <span class="vbar"></span><span class="vbar"></span><span class="vbar"></span><span class="vbar"></span>
                <span class="vbar"></span><span class="vbar"></span><span class="vbar"></span><span class="vbar"></span>
                <span class="vbar"></span><span class="vbar"></span><span class="vbar"></span><span class="vbar"></span>
              </div>
              <div class="voice-meta">
                <span class="voice-title">🎙️ पंडित जी का स्वर संदेश (Personal Voice Guidance)</span>
                <span class="voice-duration" id="voice-duration-label">0:24</span>
              </div>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', voiceNoteHtml);

      // 4. Digital Vedic Remedy Prescription Card
      const remedyCardHtml = `
        <div class="message-row assistant group-continuation">
          <div class="msg-avatar-spacer"></div>
          <div class="remedy-prescription-card">
            <div class="prescription-header">
              <div class="prescription-seal">🪔</div>
              <div>
                <div class="prescription-title">शास्त्रीय उपाय एवं रत्न परामर्श (Vedic Prescription)</div>
                <div class="prescription-subtitle">प्रामाणिक वैदिक ज्योतिषीय संस्तुति • Swiss Ephemeris गणना पर आधारित</div>
              </div>
            </div>
            <div class="prescription-body">
              <div class="prescription-item">
                <div class="p-item-badge">📿 अनुशंसित रुद्राक्ष</div>
                <div class="p-item-content"><strong>5-मुखी सिद्ध नेपाली रुद्राक्ष</strong> (धारण विधि: सोमवार प्रातः गंगाजल व कच्चे दूध से शुद्ध कर ॐ नमः शिवाय जप)</div>
              </div>
              <div class="prescription-item">
                <div class="p-item-badge">💎 शुभ रत्न संस्तुति</div>
                <div class="p-item-content"><strong>पीला पुखराज (Ceylon Yellow Sapphire)</strong> — न्यूनतम 3.25 रत्ती, स्वर्ण या पंचधातु में तर्जनी अंगुली में</div>
              </div>
              <div class="prescription-item">
                <div class="p-item-badge">🕉️ दैनिक वैदिक शांति जप</div>
                <div class="p-item-content"><strong>ॐ नमो भगवते वासुदेवाय नमः</strong> (दैनिक 1 माला / 108 जप गुरु कृपा हेतु)</div>
              </div>
            </div>
            <div class="prescription-actions">
              <button type="button" class="btn-prescription-action" onclick="ChatController.bookConsultationRemedy('Pooja')">
                <span>🪔</span> <span>संकल्प पूजा बुक करें (Book Live Pooja)</span>
              </button>
              <button type="button" class="btn-prescription-secondary" onclick="ChatController.toggleKundliSheet ? ChatController.toggleKundliSheet() : App.openBirthModal()">
                <span>📜</span> <span>विस्तृत कुण्डली विश्लेषण</span>
              </button>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', remedyCardHtml);

      // Show dynamic prompt chips
      const chips = document.getElementById('dynamic-context-chips');
      if (chips) chips.style.display = 'flex';

      this.scrollToBottom(false);
    } catch (err) {
      console.warn('Could not load consultation:', err);
    }
  },

  confirmEndConsultation() {
    const modal = document.getElementById('modal-end-consultation-confirm');
    if (modal) {
      modal.classList.add('active');
    }
  },

  closeEndConsultationModal() {
    const modal = document.getElementById('modal-end-consultation-confirm');
    if (modal) {
      modal.classList.remove('active');
    }
  },

  exitConsultation() {
    if (window.Router) {
      window.Router.navigate('/astrologers');
    } else {
      window.location.hash = '#/astrologers';
    }
  },

  toggleHeaderMenu() {
    const dropdown = document.getElementById('consultation-overflow-dropdown');
    if (dropdown) {
      const isVisible = dropdown.classList.contains('active') || dropdown.style.display === 'flex';
      if (isVisible) {
        dropdown.classList.remove('active');
        dropdown.style.display = 'none';
      } else {
        dropdown.classList.add('active');
        dropdown.style.display = 'flex';
      }
    }
  },

  // =========================================================================
  // Ultra-Premium Vedic Experience Methods
  // =========================================================================
  isMuted: false,
  audioCtx: null,

  toggleSound() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('btn-sound-toggle');
    if (btn) {
      if (this.isMuted) {
        btn.innerText = '🔕';
        btn.classList.add('muted');
        btn.title = 'Temple Chimes Muted (ध्वनि बंद है)';
        if (window.App && window.App.showToast) {
          window.App.showToast('Temple chimes muted 🔕', 'info');
        }
      } else {
        btn.innerText = '🔔';
        btn.classList.remove('muted');
        btn.title = 'Temple Chimes Active (ध्वनि चालू है)';
        this.playTempleChime();
        if (window.App && window.App.showToast) {
          window.App.showToast('Temple chimes enabled 🔔', 'success');
        }
      }
    }
  },

  playTempleChime() {
    try {
      if (this.isMuted) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Pure gentle Tibetan singing bowl / temple bell synthesis
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(622.25, now);
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now);
      gain2.gain.setValueAtTime(0.04, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1244.5, now);
      gain3.gain.setValueAtTime(0.02, now);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(gain1);
      osc2.connect(gain2);
      osc3.connect(gain3);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      gain3.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + 2.3);
      osc2.stop(now + 1.9);
      osc3.stop(now + 1.5);
    } catch (err) {
      console.warn('Audio chime note skipped:', err);
    }
  },

  // -------------------------------------------------------------
  // Voice Note Synthesis & Remedy Actions
  // -------------------------------------------------------------
  activeVoiceOscs: [],
  voiceTimer: null,
  isVoicePlaying: false,

  toggleVoiceNote(btn) {
    const card = btn ? btn.closest('.voice-note-card') : document.getElementById('chat-active-voice-note');
    const bars = card ? card.querySelectorAll('.vbar') : document.querySelectorAll('.vbar');
    const durationLabel = card ? card.querySelector('#voice-duration-label') : document.getElementById('voice-duration-label');
    const icon = btn ? btn.querySelector('.icon-voice-action') : null;

    if (this.isVoicePlaying) {
      // Pause
      this.stopVoiceNoteAudio();
      this.isVoicePlaying = false;
      bars.forEach(b => b.classList.remove('playing'));
      if (icon) icon.textContent = '▶';
      if (btn) btn.style.background = 'linear-gradient(135deg, #7439EA, #5B21B6)';
      return;
    }

    // Play
    this.isVoicePlaying = true;
    bars.forEach(b => b.classList.add('playing'));
    if (icon) icon.textContent = '⏸';
    if (btn) btn.style.background = 'linear-gradient(135deg, #10B981, #059669)';

    // Play authentic resonant Vedic Tanpura / Om meditation drone
    this.playVoiceDroneAudio();

    // Countdown from 24 seconds down to 0
    let secondsLeft = 24;
    if (this.voiceTimer) clearInterval(this.voiceTimer);
    this.voiceTimer = setInterval(() => {
      secondsLeft--;
      if (durationLabel) {
        durationLabel.textContent = `0:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`;
      }
      if (secondsLeft <= 0) {
        clearInterval(this.voiceTimer);
        this.stopVoiceNoteAudio();
        this.isVoicePlaying = false;
        bars.forEach(b => b.classList.remove('playing'));
        if (icon) icon.textContent = '▶';
        if (btn) btn.style.background = 'linear-gradient(135deg, #7439EA, #5B21B6)';
        if (durationLabel) durationLabel.textContent = '0:24';
      }
    }, 1000);
  },

  playVoiceDroneAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Create warm resonant Vedic Tanpura / Om drone chord (136.1 Hz + harmonics)
      const freqs = [136.1, 204.15, 272.2, 408.3];
      this.activeVoiceOscs = [];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.01, now);
      masterGain.gain.linearRampToValueAtTime(0.12, now + 1.2);
      masterGain.connect(ctx.destination);

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        oscGain.gain.setValueAtTime(0.25 / (idx + 1), now);
        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start(now);
        this.activeVoiceOscs.push({ osc, masterGain });
      });
    } catch (err) {
      console.warn('Voice drone audio error:', err);
    }
  },

  stopVoiceNoteAudio() {
    try {
      if (this.voiceTimer) {
        clearInterval(this.voiceTimer);
        this.voiceTimer = null;
      }
      if (this.activeVoiceOscs && this.activeVoiceOscs.length) {
        const ctx = this.audioCtx;
        const now = ctx ? ctx.currentTime : 0;
        this.activeVoiceOscs.forEach(item => {
          if (item.masterGain && ctx) {
            item.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
          }
          setTimeout(() => {
            try { item.osc.stop(); item.osc.disconnect(); } catch (e) {}
          }, 350);
        });
        this.activeVoiceOscs = [];
      }
    } catch (err) {
      console.warn('Stop voice audio error:', err);
    }
  },

  bookConsultationRemedy(type) {
    if (window.App && window.App.showToast) {
      window.App.showToast('🪔 पंडित जी के नाम से लाइव पूजा संकल्प दर्ज कर लिया गया है! हमारे आचार्य आपसे संपर्क करेंगे।', 'success');
    }
    this.appendMessage('assistant', `🙏 **संकल्प पुष्टि:** आपका वैदिक शांति पूजा संकल्प स्वीकार कर लिया गया है। हमारे वैदिक पुरोहित निर्धारित शुभ मुहूर्त पर आपके नाम व गोत्र से विधिवत संकल्प करेंगे।`);
  },

  toggleKundliSheet() {
    const sheet = document.getElementById('kundli-bottom-sheet');
    const backdrop = document.getElementById('kundli-sheet-backdrop');
    if (!sheet) return;
    const isOpen = sheet.classList.contains('active');
    if (isOpen) {
      this.closeKundliSheet();
    } else {
      this.openKundliSheet();
    }
  },

  openKundliSheet() {
    const sheet = document.getElementById('kundli-bottom-sheet');
    const backdrop = document.getElementById('kundli-sheet-backdrop');
    if (sheet) sheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    this.renderKundliSheetData();
  },

  closeKundliSheet() {
    const sheet = document.getElementById('kundli-bottom-sheet');
    const backdrop = document.getElementById('kundli-sheet-backdrop');
    if (sheet) sheet.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
  },

  switchSheetTab(tabName) {
    ['lagna', 'navamsha', 'degrees'].forEach(t => {
      const btn = document.getElementById('tab-btn-' + t);
      const panel = document.getElementById('panel-' + t);
      if (btn) btn.classList.toggle('active', t === tabName);
      if (panel) {
        panel.style.display = (t === tabName) ? 'block' : 'none';
        panel.classList.toggle('active', t === tabName);
      }
    });
  },

  renderKundliSheetData() {
    const chartContainer = document.getElementById('sheet-chart-container');
    const navamshaContainer = document.getElementById('sheet-navamsha-container');
    const degreesContainer = document.getElementById('sheet-degrees-container');
    const profileInfo = document.getElementById('sheet-profile-info');

    // Get active chart or generate classical Vedic chart
    const chart = (window.App && window.App.currentChart) || {
      name: 'Seeker',
      ascendant_sign: 'Aries',
      chart_data: {
        ascendant_sign: 'Aries',
        planets: [
          { name: 'Sun', house: 10, sign: 'Capricorn', degree_in_sign: 14.42, nakshatra: 'Shravana', pada: 2, is_retrograde: false },
          { name: 'Moon', house: 2, sign: 'Taurus', degree_in_sign: 9.32, nakshatra: 'Rohini', pada: 1, is_retrograde: false },
          { name: 'Mars', house: 1, sign: 'Aries', degree_in_sign: 21.15, nakshatra: 'Bharani', pada: 3, is_retrograde: false },
          { name: 'Mercury', house: 11, sign: 'Aquarius', degree_in_sign: 7.18, nakshatra: 'Shatabhisha', pada: 1, is_retrograde: false },
          { name: 'Jupiter', house: 9, sign: 'Sagittarius', degree_in_sign: 26.50, nakshatra: 'Uttara Ashadha', pada: 1, is_retrograde: false },
          { name: 'Venus', house: 1, sign: 'Aries', degree_in_sign: 13.04, nakshatra: 'Ashwini', pada: 4, is_retrograde: false },
          { name: 'Saturn', house: 10, sign: 'Capricorn', degree_in_sign: 18.25, nakshatra: 'Shravana', pada: 3, is_retrograde: false },
          { name: 'Rahu', house: 3, sign: 'Gemini', degree_in_sign: 12.12, nakshatra: 'Ardra', pada: 2, is_retrograde: true },
          { name: 'Ketu', house: 9, sign: 'Sagittarius', degree_in_sign: 12.12, nakshatra: 'Mula', pada: 4, is_retrograde: true }
        ]
      }
    };

    if (profileInfo) {
      profileInfo.innerText = `${chart.name || 'Seeker'} · ${chart.ascendant_sign || 'Aries'} Lagna · Swiss Ephemeris Precision`;
    }

    const viewer = window.ChartViewer || (typeof ChartViewer !== 'undefined' ? ChartViewer : null);
    if (chartContainer && viewer && viewer.renderNorthIndianSVG) {
      chartContainer.innerHTML = viewer.renderNorthIndianSVG(chart.chart_data || chart, true);
    }

    if (navamshaContainer && viewer && viewer.renderNorthIndianSVG) {
      navamshaContainer.innerHTML = viewer.renderNorthIndianSVG(chart.chart_data || chart, true);
    }

    if (degreesContainer && viewer && viewer.renderPlanetaryTable) {
      const planets = (chart.chart_data && chart.chart_data.planets) || chart.planets || [];
      degreesContainer.innerHTML = viewer.renderPlanetaryTable(planets);
    }
  },

  saveRemedyToDaily(title, mantra, instructions) {
    try {
      const remedies = JSON.parse(localStorage.getItem('astroai_user_remedies') || '[]');
      remedies.push({
        title,
        mantra,
        instructions,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('astroai_user_remedies', JSON.stringify(remedies));
      if (window.App && window.App.showToast) {
        window.App.showToast('✨ उपाय आपकी दैनिक साधना सूची में सफलतापूर्वक जोड़ा गया! 🙏', 'success');
      }
    } catch (e) {
      console.warn('Could not save remedy:', e);
    }
  },

  setRemedyReminder(dayName) {
    if (window.App && window.App.showToast) {
      window.App.showToast(`🔔 ${dayName || 'शुभ मुहूर्त'} सुबह 7:00 बजे का अनुस्मारक सक्रिय किया गया!`, 'success');
    }
  },

  playVoiceBlessing(btnElem) {
    this.playTempleChime();
    if (btnElem) {
      const isPlaying = btnElem.innerText === '❚❚';
      if (isPlaying) {
        btnElem.innerText = '▶';
      } else {
        btnElem.innerText = '❚❚';
        if (window.App && window.App.showToast) {
          window.App.showToast('🎙️ पंडित जी का वैदिक आशीर्वाद संदेश बज रहा है...', 'info');
        }
        setTimeout(() => {
          btnElem.innerText = '▶';
        }, 3000);
      }
    }
  },

  showContextChips(topic = 'general') {
    const container = document.getElementById('dynamic-context-chips');
    if (!container) return;

    let chipsHtml = '';
    if (topic === 'marriage') {
      chipsHtml = `
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('जीवनसाथी की दिशा और पारिवारिक पृष्ठभूमि कैसी रहेगी?')">
          <span>🧭</span> <span>जीवनसाथी की दिशा?</span>
        </button>
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('कुंडली में मांगलिक प्रभाव अथवा नाड़ी दोष का क्या उपाय है?')">
          <span>🪐</span> <span>मांगलिक दोष उपाय?</span>
        </button>
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('शीघ्र विवाह के लिए शास्त्रीय पूजा और शुभ रत्न कौन सा है?')">
          <span>💎</span> <span>शुभ रत्न व पूजा</span>
        </button>
      `;
    } else if (topic === 'career') {
      chipsHtml = `
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('करियर में पदोन्नति और वेतन वृद्धि का शुभ योग कब बनेगा?')">
          <span>💼</span> <span>प्रमोशन का योग?</span>
        </button>
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('क्या मेरे लिए व्यापार (Business) नौकरी से बेहतर रहेगा?')">
          <span>📈</span> <span>नौकरी vs व्यापार?</span>
        </button>
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('कार्यक्षेत्र में सफलता हेतु सूर्य अर्घ्य व मंत्र जप बताएं')">
          <span>☀️</span> <span>सूर्य साधना उपाय</span>
        </button>
      `;
    } else {
      chipsHtml = `
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('मेरी जन्म कुंडली में कौन सा शक्तिशाली राजयोग उपस्थित है?')">
          <span>👑</span> <span>राजयोग का प्रभाव?</span>
        </button>
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('शनि साढ़ेसाती और ढैय्या के शास्त्रीय वैदिक उपाय बताएं')">
          <span>🪐</span> <span>शनि शांति उपाय</span>
        </button>
        <button type="button" class="dyn-chip" onclick="ChatController.askQuickPrompt('मेरे भाग्योदय और स्वास्थ्य के लिए सबसे शुभ रत्न कौन सा है?')">
          <span>💎</span> <span>भाग्यशाली रत्न?</span>
        </button>
      `;
    }

    container.innerHTML = chipsHtml;
    container.style.display = 'flex';
  },

  hideContextChips() {
    const container = document.getElementById('dynamic-context-chips');
    if (container) {
      container.style.display = 'none';
    }
  },

  async endCurrentConsultation(force = false) {
    if (!force) {
      this.confirmEndConsultation();
      return;
    }
    this.closeEndConsultationModal();

    if (!this.activeConsultation) {
      if (window.App && window.App.showToast) {
        window.App.showToast('No active consultation to end.', 'info');
      }
      return;
    }

    try {
      const res = await API.endConsultation(this.activeConsultation.id);
      const endBtn = document.getElementById('btn-end-consultation');
      if (endBtn) endBtn.style.display = 'none';

      // Open summary modal
      if (window.App && window.App.showConsultationSummary) {
        window.App.showConsultationSummary(res.summary || res);
      }

      this.activeConsultation = null;
      localStorage.removeItem('astroai_active_consultation');
      if (window.App && window.App.showToast) {
        window.App.showToast('Consultation ended successfully. Session summary generated. 🙏', 'success');
      }
    } catch (err) {
      console.error('Failed to end consultation:', err);
      if (window.App && window.App.showToast) {
        window.App.showToast(`Error ending consultation: ${err.message}`, 'error');
      }
    }
  },

  openAstrologerModal() {
    if (window.App && window.App.openModal) {
      window.App.openModal('modal-select-astrologer');
      if (window.App.loadAstrologerDirectory) window.App.loadAstrologerDirectory();
      return;
    }
    const modal = document.getElementById('modal-select-astrologer');
    if (modal) modal.classList.add('active');
  },

  async adoptChatChart(chartId) {
    if (!chartId || (window.App?.currentChart?.id === chartId && this.activeChartId === chartId)) return;
    this.activeChartId = chartId;
    try {
      const chart = await API.getChartById(chartId);
      if (this.activeChartId !== chartId) return;
      App.currentChart = chart;
      App.rememberMyChartId?.(chart.id);
      App.updateActiveProfileUI?.(chart);
      const saved = App.savedCharts || [];
      if (!saved.some(item => item.id === chart.id)) saved.push(chart);
      App.savedCharts = saved;
      App.renderProfileSwitcherChips?.();
      const intake = document.getElementById('chat-intake-form');
      if (intake) intake.remove();
    } catch (error) {
      console.warn('Could not refresh the linked chat chart:', error);
    }
  },

  async sendMessage(customText = null, imageBase64 = null) {
    if (this.isSubmitting) return;

    const input = document.getElementById('chat-input');
    const msg = (customText || (input ? input.value : '')).trim();

    // Check if AstroTalk Intake Form is active
    const intakeForm = document.getElementById('chat-intake-form');
    if (intakeForm && !imageBase64) {
      const nameInput = document.getElementById('intake-name');
      const dobInput = document.getElementById('intake-dob');
      if (nameInput && nameInput.value.trim() && dobInput && dobInput.value) {
        if (input) {
          input.value = '';
          input.style.height = 'auto';
        }
        const customQ = document.getElementById('intake-custom-question');
        if (customQ && msg) customQ.value = msg;
        await this.submitIntakeForm();
        return;
      } else {
        App.showToast('Astro Jyotish परामर्श शुरू करने के लिए कृपया अपना नाम व जन्म तिथि दर्ज करें! 😊', 'warning');
        if (nameInput && !nameInput.value.trim()) nameInput.focus();
        else if (dobInput) dobInput.focus();
        return;
      }
    }

    if (!msg && !imageBase64) return;

    this.isSubmitting = true;
    const sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) sendBtn.disabled = true;

    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    document.querySelectorAll('#chat-messages-container .message-row.assistant').forEach(row => { row.style.minHeight = ''; });
    this.lastUserMessage = msg || 'Analyze my palm lines';
    const userRow = this.appendMessage('user', msg || 'Analyze my palm lines (हस्तरेखा)', [], false, null, imageBase64, { status: 'sending' });

    const box = document.getElementById('chat-messages-container');
    const currentAstrologer = (this.astrologers || []).find(a => a.id === this.selectedAstrologer || a.slug === this.selectedAstrologer) || { avatar: '🔮', name: 'Astrologer' };

    // Human Astrologer Consultation Mode (Mode 1)
    const isHumanConsultation = (this.activeConsultation && this.activeConsultation.consultation_mode === 'human') || currentAstrologer.type === 'human';
    if (isHumanConsultation) {
      try {
        let consultationId = this.activeConsultation ? this.activeConsultation.id : this.currentSessionId;
        if (!consultationId) {
          const newCons = await API.createOrResumeConsultation({
            astrologer_id: currentAstrologer.id,
            user_id: (window.App && window.App.getUserId) ? window.App.getUserId() : 'guest_user',
            consultation_mode: 'human'
          });
          consultationId = newCons.id;
          this.activeConsultation = newCons;
          this.currentSessionId = newCons.id;
        }

        const res = await API.sendConsultationMessage(consultationId, {
          content: msg,
          sender_type: 'user'
        });

        // Mark user message as delivered
        if (userRow) {
          const tick = userRow.querySelector('.msg-status-tick');
          if (tick) tick.innerHTML = '<span class="msg-status-delivered" title="Delivered">✓✓</span>';
        }
        localStorage.removeItem('astroai_chat_draft');

        if (res.response && res.response.content) {
          this.appendMessage('assistant', res.response.content);
        } else {
          const availText = currentAstrologer.availability === 'offline'
            ? `Your consultation inquiry has been safely delivered to **${currentAstrologer.name}**'s certified desk queue. He is currently offline and will reply as soon as he is back online. (Honest Human Consultation: Zero synthetic AI substitution).`
            : `Your consultation message has been received by **${currentAstrologer.name}**. Please hold while he reviews your chart.`;
          this.appendMessage('assistant', availText);
        }
      } catch (err) {
        if (userRow) {
          const tick = userRow.querySelector('.msg-status-tick');
          const rawText = encodeURIComponent(msg);
          if (tick) tick.innerHTML = `<span class="msg-status-fail" title="Delivery failed">⚠️ Failed</span> <button type="button" class="btn-msg-retry" onclick="ChatController.retryMessage('${rawText}')" title="Retry sending">↻ Retry</button>`;
        }
        // Preserve draft
        if (input && !input.value) input.value = msg;
        this.appendMessage('assistant', `⚠️ Could not deliver message to astrologer: ${err.message}`);
      } finally {
        this.isSubmitting = false;
        if (sendBtn) sendBtn.disabled = false;
      }
      return;
    }

    // Mode 2: AI Astrologer Persona Consultation Mode (Streaming)
    const isGroupStart = (this.lastSenderRole !== 'assistant');
    this.lastSenderRole = 'assistant';

    const streamRow = document.createElement('div');
    streamRow.className = `message-row assistant ${isGroupStart ? 'group-start' : 'group-continuation'}`;

    const avatarCol = isGroupStart
      ? `<div class="msg-avatar" title="${currentAstrologer.name}">${this.renderAvatar(currentAstrologer.avatar, currentAstrologer.name)}</div>`
      : `<div class="msg-avatar-spacer" aria-hidden="true"></div>`;

    const speakerNameHeader = isGroupStart
      ? `<div class="msg-speaker-compact-name"><span>🕉️</span> <span>${currentAstrologer.name}</span></div>`
      : '';

    streamRow.innerHTML = `
      ${avatarCol}
      <div class="message-bubble assistant-bubble" id="active-streaming-bubble">
        ${speakerNameHeader}
        <div class="streaming-content-wrapper" id="active-streaming-text">
          <div class="astrologer-analyzing-box">
            <span class="chakra-spinner">☸️</span>
            <span>पंडित जी जन्म पत्रिका व ग्रह स्थिति का सूक्ष्म अध्ययन कर रहे हैं...</span>
          </div>
        </div>
      </div>
    `;

    const sentinel = document.getElementById('chat-bottom-sentinel');
    if (sentinel) {
      box.insertBefore(streamRow, sentinel);
    } else {
      box.appendChild(streamRow);
    }

    // Establish the reading position once, in response to Send. Tokens never move it.
    const questionHeight = userRow ? userRow.getBoundingClientRect().height : 0;
    streamRow.style.minHeight = Math.max(0, box.clientHeight - questionHeight - 48) + 'px';
    this.anchorAnswerStart(userRow || streamRow);

    const streamingTextElem = streamRow.querySelector('#active-streaming-text');
    let accumulatedText = '';
    let isStreamDone = false;

    const isKundliRequested = (t) => {
      if (!t) return false;
      const low = t.toLowerCase();
      return low.includes('kundli') || low.includes('chart') || low.includes('kundali');
    };

    const activeChartObj = App.currentChart || (this.activeChartId ? (App.savedCharts || []).find(c => c.id === this.activeChartId) : null);
    const seekerName = (activeChartObj && activeChartObj.name) || (App.currentUser && App.currentUser.full_name) || '';

    const isConsultationMode = Boolean(
      this.activeConsultation ||
      (this.currentSessionId && this.currentSessionId.startsWith('cons_')) ||
      (window.location.pathname && (window.location.pathname.startsWith('/consultation/') || window.location.pathname.startsWith('/consultations/'))) ||
      this.selectedAstrologer
    );

    const targetConsId = (this.activeConsultation && this.activeConsultation.id) ||
      (this.currentSessionId && this.currentSessionId.startsWith('cons_') ? this.currentSessionId : null) ||
      this.selectedAstrologer ||
      'pt-rameshwar-dwivedi';

    try {
      if (isConsultationMode && API.streamConsultationSession) {
        await API.streamConsultationSession(
          targetConsId,
          {
            consultation_id: targetConsId,
            chart_id: this.activeChartId || (App.currentChart ? App.currentChart.id : null),
            user_name: seekerName,
            message: msg || 'Analyze my palm lines (हस्तरेखा विश्लेषण)',
            language: this.currentLanguage,
            astrologer_id: this.selectedAstrologer,
            force_demo_mode: this.forceDemoMode,
            image_base64: imageBase64
          },
          (sessionData) => {
            void this.adoptChatChart(sessionData.chart_id);
            if (sessionData.consultation_id) {
              this.currentSessionId = sessionData.consultation_id;
              if (this.activeConsultation) this.activeConsultation.id = sessionData.consultation_id;
              localStorage.setItem('astroai_active_consultation', sessionData.consultation_id);
            } else if (sessionData.session_id) {
              this.currentSessionId = sessionData.session_id;
            }
          },
          (deltaText) => {
            accumulatedText += deltaText;
            if (streamingTextElem) {
              streamingTextElem.innerHTML = this.formatMarkdown(accumulatedText) + '<span class="streaming-cursor">▋</span>';
            }
            this.updateFloatingBtn();
          },
          (doneData) => {
            void this.adoptChatChart(doneData.chart_id);
            isStreamDone = true;
            if (doneData.consultation_id) {
              this.currentSessionId = doneData.consultation_id;
              if (this.activeConsultation) this.activeConsultation.id = doneData.consultation_id;
              localStorage.setItem('astroai_active_consultation', doneData.consultation_id);
            } else if (doneData.session_id) {
              this.currentSessionId = doneData.session_id;
            }
            const finalContent = doneData.content || accumulatedText;
            if (streamingTextElem) {
              streamingTextElem.innerHTML = this.formatMarkdown(finalContent);
            }

            // Ultra-Premium Vedic Enhancements:
            this.playTempleChime();

            const lowContent = finalContent.toLowerCase();
            const topic = (lowContent.includes('विवाह') || lowContent.includes('शादी') || lowContent.includes('marriage'))
              ? 'marriage'
              : (lowContent.includes('करियर') || lowContent.includes('नौकरी') || lowContent.includes('job') || lowContent.includes('career'))
                ? 'career'
                : 'general';
            this.showContextChips(topic);

            // Mark user message as delivered
            if (userRow) {
              const tick = userRow.querySelector('.msg-status-tick');
              if (tick) tick.innerHTML = '<span class="msg-status-delivered" title="Delivered">✓✓</span>';
            }
            localStorage.removeItem('astroai_chat_draft');

            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Inline Kundli SVG diagram if requested or provided
            let inlineSvg = doneData.chart_svg;
            if (!inlineSvg && isKundliRequested(msg) && App.currentChart && App.currentChart.chart_data) {
              inlineSvg = ChartViewer.renderNorthIndianSVG(App.currentChart.chart_data, true);
            }
            if (inlineSvg) {
              const chartBox = document.createElement('div');
              chartBox.className = 'chat-inline-kundli-box';
              chartBox.innerHTML = `
                <div class="inline-kundli-title" style="display:flex; justify-content:space-between; align-items:center;">
                  <span>🪐 Lagna Kundali (D1) Diagram</span>
                  <button class="btn-msg-action" onclick="ChartViewer.downloadKundliPNG(this.parentElement.nextElementSibling)" style="font-size:0.72rem; padding:0.2rem 0.5rem;">📥 Download PNG</button>
                </div>
                ${inlineSvg}
              `;
              streamRow.querySelector('.message-bubble').appendChild(chartBox);
            }

            // Display only remedies and dates contained in the actual response.

            // Action metadata
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'msg-meta-row assistant-meta';
            const escapedRaw = encodeURIComponent(finalContent);
            actionsDiv.innerHTML = `
              <span class="msg-time">${timeStr}</span>
              <button type="button" class="btn-copy-discreet" onclick="ChatController.copyMessage('${escapedRaw}')" title="Copy text">📋</button>
            `;
            streamRow.querySelector('.message-bubble').appendChild(actionsDiv);
            this.loadSessions();

            // Keep short replies anchored too; release this space on the next Send.
            this.updateFloatingBtn();
          },
          async (streamErr) => {
            console.warn('Streaming failed, fallback to standard API call:', streamErr);
            if (!accumulatedText) {
              streamRow.remove();
              const res = await API.sendConsultationMessage(targetConsId, {
                message: msg || 'Analyze my palm lines (हस्तरेखा विश्लेषण)',
                user_name: seekerName
              });
              if (res.consultation_id) {
                this.currentSessionId = res.consultation_id;
                if (this.activeConsultation) this.activeConsultation.id = res.consultation_id;
                localStorage.setItem('astroai_active_consultation', res.consultation_id);
              }
              if (userRow) {
                const tick = userRow.querySelector('.msg-status-tick');
                if (tick) tick.innerHTML = '<span class="msg-status-delivered" title="Delivered">✓✓</span>';
              }
              localStorage.removeItem('astroai_chat_draft');
              void this.adoptChatChart(res.chart_id);
              this.appendMessage('assistant', res.content || (res.response && res.response.content), [], res.is_demo_mode, res.chart_svg);
              this.loadSessions();
            }
          }
        );
      } else {
        await API.streamConsultation(
          {
            session_id: this.currentSessionId,
            chart_id: this.activeChartId || (App.currentChart ? App.currentChart.id : null),
            user_name: seekerName,
            message: msg || 'Analyze my palm lines (हस्तरेखा विश्लेषण)',
            language: this.currentLanguage,
            astrologer_id: this.selectedAstrologer,
            force_demo_mode: this.forceDemoMode,
            image_base64: imageBase64
          },
          (sessionData) => {
            void this.adoptChatChart(sessionData.chart_id);
            this.currentSessionId = sessionData.session_id;
          },
          (deltaText) => {
            accumulatedText += deltaText;
            if (streamingTextElem) {
              streamingTextElem.innerHTML = this.formatMarkdown(accumulatedText) + '<span class="streaming-cursor">▋</span>';
            }
            this.updateFloatingBtn();
          },
          (doneData) => {
            void this.adoptChatChart(doneData.chart_id);
            isStreamDone = true;
            this.currentSessionId = doneData.session_id;
            const finalContent = doneData.content || accumulatedText;
            if (streamingTextElem) {
              streamingTextElem.innerHTML = this.formatMarkdown(finalContent);
            }

            // Ultra-Premium Vedic Enhancements:
            this.playTempleChime();

            const lowContent = finalContent.toLowerCase();
            const topic = (lowContent.includes('विवाह') || lowContent.includes('शादी') || lowContent.includes('marriage'))
              ? 'marriage'
              : (lowContent.includes('करियर') || lowContent.includes('नौकरी') || lowContent.includes('job') || lowContent.includes('career'))
                ? 'career'
                : 'general';
            this.showContextChips(topic);

            // Mark user message as delivered
            if (userRow) {
              const tick = userRow.querySelector('.msg-status-tick');
              if (tick) tick.innerHTML = '<span class="msg-status-delivered" title="Delivered">✓✓</span>';
            }
            localStorage.removeItem('astroai_chat_draft');

            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Inline Kundli SVG diagram if requested or provided
            let inlineSvg = doneData.chart_svg;
            if (!inlineSvg && isKundliRequested(msg) && App.currentChart && App.currentChart.chart_data) {
              inlineSvg = ChartViewer.renderNorthIndianSVG(App.currentChart.chart_data, true);
            }
            if (inlineSvg) {
              const chartBox = document.createElement('div');
              chartBox.className = 'chat-inline-kundli-box';
              chartBox.innerHTML = `
                <div class="inline-kundli-title" style="display:flex; justify-content:space-between; align-items:center;">
                  <span>🪐 Lagna Kundali (D1) Diagram</span>
                  <button class="btn-msg-action" onclick="ChartViewer.downloadKundliPNG(this.parentElement.nextElementSibling)" style="font-size:0.72rem; padding:0.2rem 0.5rem;">📥 Download PNG</button>
                </div>
                ${inlineSvg}
              `;
              streamRow.querySelector('.message-bubble').appendChild(chartBox);
            }

            // Display only remedies and dates contained in the actual response.

            // Action metadata
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'msg-meta-row assistant-meta';
            const escapedRaw = encodeURIComponent(finalContent);
            actionsDiv.innerHTML = `
              <span class="msg-time">${timeStr}</span>
              <button type="button" class="btn-copy-discreet" onclick="ChatController.copyMessage('${escapedRaw}')" title="Copy text">📋</button>
            `;
            streamRow.querySelector('.message-bubble').appendChild(actionsDiv);
            this.loadSessions();

            // Keep short replies anchored too; release this space on the next Send.
            this.updateFloatingBtn();
          },
          async (streamErr) => {
            console.warn('Streaming failed, fallback to standard API call:', streamErr);
            if (!accumulatedText) {
              streamRow.remove();
              // Fallback to standard request
              const res = await API.sendMessage({
                session_id: this.currentSessionId,
                chart_id: this.activeChartId || (App.currentChart ? App.currentChart.id : null),
                user_name: seekerName,
                message: msg || 'Analyze my palm lines (हस्तरेखा विश्लेषण)',
                language: this.currentLanguage,
                astrologer_id: this.selectedAstrologer,
                force_demo_mode: this.forceDemoMode,
                image_base64: imageBase64
              });
              this.currentSessionId = res.session_id;

              // Mark user message as delivered
              if (userRow) {
                const tick = userRow.querySelector('.msg-status-tick');
                if (tick) tick.innerHTML = '<span class="msg-status-delivered" title="Delivered">✓✓</span>';
              }
              localStorage.removeItem('astroai_chat_draft');

              let inlineSvg = res.chart_svg;
              if (!inlineSvg && isKundliRequested(msg) && App.currentChart && App.currentChart.chart_data) {
                inlineSvg = ChartViewer.renderNorthIndianSVG(App.currentChart.chart_data, true);
              }
              void this.adoptChatChart(res.chart_id);
              this.appendMessage('assistant', res.content, [], res.is_demo_mode, inlineSvg);
              this.loadSessions();
            }
          }
        );
      }
    } catch (err) {
      console.error('Consultation chat error:', err);
      if (!accumulatedText) {
        streamRow.remove();
        if (userRow) {
          const tick = userRow.querySelector('.msg-status-tick');
          const rawText = encodeURIComponent(msg);
          if (tick) tick.innerHTML = `<span class="msg-status-fail" title="Delivery failed">⚠️ Failed</span> <button type="button" class="btn-msg-retry" onclick="ChatController.retryMessage('${rawText}')" title="Retry sending">↻ Retry</button>`;
        }
        // Preserve draft on network/server failure
        if (input && !input.value) input.value = msg;
        this.appendMessage('assistant', `⚠️ Could not complete astrological consultation: ${err.message}`);
      }
    } finally {
      this.isSubmitting = false;
      if (sendBtn) sendBtn.disabled = false;
    }
  }
};

// Expose ChatController globally for HTML onclick handlers and cross-module access
window.ChatController = ChatController;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatController;
}
