/**
 * Consultation Chat Controller - AstroTalk-Inspired Conversational Engine.
 * Supports natural chat, dynamic domain guardrails, inline Kundli diagram generation,
 * and multimodal palmistry (Hastarekha) analysis.
 */

// Quick-question chips carry Hindi text; the question sent must match the language the chip is shown in.
const QUICK_PROMPT_PAIRS = [
  [
    "क्या मेरी जन्म कुंडली में कोई शक्तिशाली राजयोग अथवा धन योग उपस्थित है?",
    "Is there a powerful Rajayoga or Dhana Yoga in my birth chart?"
  ],
  [
    "क्या मुझ पर शनि की साढ़ेसाती या ढैय्या का प्रभाव है और इसके क्या शांति उपाय हैं?",
    "Am I under the influence of Shani Sade Sati or Dhaiya, and what are the remedies?"
  ],
  [
    "मेरे भाग्योदय, स्वास्थ्य और सफलता के लिए कौन सा रत्न (Gemstone) धारण करना चाहिए?",
    "Which gemstone should I wear for my fortune, health and success?"
  ],
  [
    "जीवनसाथी की दिशा और पारिवारिक पृष्ठभूमि कैसी रहेगी?",
    "What will be the direction of the spouse and family background?"
  ],
  [
    "कुंडली में मांगलिक दोष या अन्य ग्रह बाधा का क्या प्रभाव है?",
    "What is the effect of Manglik Dosha or other planetary obstacles in my chart?"
  ],
  [
    "शास्त्रीय वैदिक शांति उपाय और मंत्र जप बताएं",
    "Tell me classical Vedic peace remedies and mantra chanting."
  ],
  [
    "मेरी शादी का शुभ योग कब बनेगा?",
    "When will an auspicious yoga for my marriage form?"
  ],
  [
    "करियर में पदोन्नति और वेतन वृद्धि कब?",
    "When will I get a promotion and salary hike in my career?"
  ],
  [
    "कुंडली में राजयोग और धन योग का प्रभाव बताएं",
    "Tell me the effect of Rajayoga and Dhana Yoga in my chart."
  ],
  [
    "शनि साढ़ेसाती और ढैय्या के वैदिक उपाय बताएं",
    "Tell me the Vedic remedies for Shani Sade Sati and Dhaiya."
  ],
  [
    "मेरी शादी कब होगी और वैवाहिक जीवन कैसा रहेगा?",
    "When will I get married and how will my married life be?"
  ],
  [
    "करियर में पदोन्नति और आर्थिक लाभ कब तक मिलेगा?",
    "When will I get a promotion and financial gains in my career?"
  ],
  [
    "क्या मुझ पर साढ़ेसाती है और इसके क्या शांति उपाय हैं?",
    "Am I under Sade Sati and what are its peace remedies?"
  ],
  [
    "मेरी कुंडली में कोई राजयोग उपस्थित है?",
    "Is there any Rajayoga in my Kundli?"
  ],
  [
    "करियर में पदोन्नति और वेतन वृद्धि का शुभ योग कब बनेगा?",
    "When will an auspicious yoga for promotion and salary hike form in my career?"
  ],
  [
    "कार्यक्षेत्र में सफलता हेतु सूर्य अर्घ्य व मंत्र जप बताएं",
    "Tell me about Surya Arghya and mantra chanting for success in the workplace"
  ],
  [
    "कुंडली में मांगलिक प्रभाव अथवा नाड़ी दोष का क्या उपाय है?",
    "What is the remedy for Manglik influence or Nadi dosha in the horoscope?"
  ],
  [
    "क्या मेरे लिए व्यापार (Business) नौकरी से बेहतर रहेगा?",
    "Will business be better than a job for me?"
  ],
  [
    "मेरी जन्म कुंडली में कौन सा शक्तिशाली राजयोग उपस्थित है?",
    "Which powerful Rajayoga is present in my birth chart?"
  ],
  [
    "मेरे भाग्योदय और स्वास्थ्य के लिए सबसे शुभ रत्न कौन सा है?",
    "Which is the most auspicious gemstone for my fortune and health?"
  ],
  [
    "शनि साढ़ेसाती और ढैय्या के शास्त्रीय वैदिक उपाय बताएं",
    "Tell me classical Vedic remedies for Shani Sadesati and Dhaiya"
  ],
  [
    "शीघ्र विवाह के लिए शास्त्रीय पूजा और शुभ रत्न कौन सा है?",
    "What is the classical worship and auspicious gemstone for early marriage?"
  ],
  [
    "करियर में पदोन्नति और वेतन वृद्धि कब होगी?",
    "When will there be a favorable time for promotion and salary hike in career?"
  ]
];
const quickPromptIndex = (() => {
  const toEn = new Map(), toHi = new Map();
  QUICK_PROMPT_PAIRS.forEach(([hi, en]) => { toEn.set(hi, en); toHi.set(en, hi); });
  return { toEn, toHi };
})();
function localizeQuickPrompt(text) {
  const lang = (window.I18n && I18n.currentLang) || 'en';
  if (lang === 'en') return quickPromptIndex.toEn.get(text) || text;
  if (lang === 'hi') return quickPromptIndex.toHi.get(text) || text;
  return text;
}

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
        this.scrollToBottom(true);
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
    const sentinel = document.getElementById('chat-bottom-sentinel');
    const container = document.getElementById('chat-messages-container');
    if (sentinel) {
      sentinel.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });
    } else if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }
    this.isNearBottom = true;
    this.unreadCountWhileScrolled = 0;
    const floatBtn = document.getElementById('btn-new-messages-floating');
    if (floatBtn) floatBtn.style.display = 'none';
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

    // Scroll management: User message always scrolls to bottom; Assistant message anchors to its start so user can read from beginning!
    if (role === 'user') {
      this.scrollToBottom(true);
    } else {
      // User requested: When Pandit Ji answers, show the screen starting from where the answer begins, not jumped to bottom
      row.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    promptText = localizeQuickPrompt(promptText);
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

  updateAstrologerUI(astrologerData) {
    const astro = astrologerData || 
                  (this.activeConsultation && this.activeConsultation.astrologer) || 
                  (this.astrologers || []).find(a => a.id === this.selectedAstrologer || a.slug === this.selectedAstrologer);
    if (!astro) return;

    const nameEl = document.getElementById('topbar-astrologer-name');
    if (nameEl) {
      nameEl.innerHTML = `${astro.name} <span class="card-type-tag tag-specialty" style="font-size:0.65rem; margin-left:0.35rem; background: #FAF5FF; border: 1px solid #DDD6FE; color: #7C3AED; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">Vedic Consultation</span> <span style="font-size: 0.72rem; color: #F59E0B;">✦</span>`;
    }
    const metaEl = document.getElementById('topbar-astrologer-meta');
    if (metaEl) {
      const spec = astro.specialization || (astro.specializations ? (Array.isArray(astro.specializations) ? astro.specializations.slice(0, 2).join(', ') : astro.specializations) : 'Senior Vedic Jyotish & Karmakand Scholar');
      const exp = astro.experience_years ? astro.experience_years + '+ वर्ष' : (astro.experience || '18+ वर्ष');
      metaEl.innerHTML = `<span>${spec}</span> • <span>${exp}</span> • <span class="text-emerald-600 font-bold">🟢 ऑनलाइन (Online)</span>`;
    }
    const avatarEl = document.getElementById('topbar-astrologer-avatar');
    if (avatarEl) {
      avatarEl.innerHTML = this.renderAvatar(astro.avatar, astro.name);
    }
  },

  async startConsultationWith(astrologerId) {
    try {
      let astrologer = (this.astrologers || []).find(a => a.id === astrologerId || a.slug === astrologerId);
      if (!astrologer) {
        try {
          astrologer = await API.getAstrologerProfile(astrologerId);
          if (astrologer && !this.astrologers.find(a => a.id === astrologer.id)) {
            this.astrologers.push(astrologer);
          }
        } catch (e) {
          console.warn('Could not fetch astrologer profile from API for:', astrologerId);
        }
      }
      if (!astrologer) {
        astrologer = { id: astrologerId, name: 'Astrologer' };
      }
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

      // Navigate to consultation workspace without triggering redundant reload
      if (window.Router) {
        window.history.replaceState(null, '', '/consultation/' + consultation.id);
        window.Router.currentRoute = '/consultation/' + consultation.id;
        window.Router.switchView('view-consultation');
        window.Router.updateNavbarActive('nav-link-consultation');
      }

      // Update Topbar UI
      this.updateAstrologerUI(astrologer);

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
    if (!consultationId) return;
    try {
      let data = null;
      try {
        data = await API.getConsultationDetails(consultationId);
      } catch (fetchErr) {
        // If consultation by ID failed (e.g. parameter was an astrologer slug like 'pt-tribhuvan'),
        // attempt to find the astrologer profile and start/resume the consultation session!
        try {
          const astroProfile = await API.getAstrologerProfile(consultationId);
          if (astroProfile) {
            await this.startConsultationWith(astroProfile.id || consultationId);
            return;
          }
        } catch (astroErr) {
          throw fetchErr;
        }
      }

      if (!data) throw new Error('Consultation session not found');

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
      this.updateAstrologerUI(data.astrologer);

      const endBtn = document.getElementById('btn-end-consultation');
      if (endBtn) endBtn.style.display = 'inline-flex';

      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.add('collapsed');
      const drawerBackdrop = document.getElementById('drawer-backdrop');
      if (drawerBackdrop) drawerBackdrop.classList.remove('active');

      await this.loadConsultationHistory(data.id);
    } catch (err) {
      console.warn('Failed to resume consultation by ID:', consultationId, err);
      // Requirement 4.8: Handle genuinely missing astrologers with an intentional not-found page.
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
        if (nameEl) {
          nameEl.innerHTML = `${data.astrologer.name} <span class="card-type-tag tag-specialty" style="font-size:0.65rem; margin-left:0.35rem; background: #FAF5FF; border: 1px solid #DDD6FE; color: #7C3AED; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">Vedic Consultation</span> <span style="font-size: 0.72rem; color: #F59E0B;">✦</span>`;
        }
        const metaEl = document.getElementById('topbar-astrologer-meta');
        if (metaEl) {
          const spec = data.astrologer.specialization || (data.astrologer.specializations ? (Array.isArray(data.astrologer.specializations) ? data.astrologer.specializations.slice(0, 2).join(', ') : data.astrologer.specializations) : 'Foreign Travel, Visa & Relocation Timing');
          const exp = data.astrologer.experience_years ? data.astrologer.experience_years + '+ वर्ष' : (data.astrologer.experience || '18+ वर्ष');
          metaEl.innerHTML = `<span>${spec}</span> • <span>${exp}</span> • <span class="text-emerald-600 font-bold">🟢 ऑनलाइन (Online)</span>`;
        }
        const avatarEl = document.getElementById('topbar-astrologer-avatar');
        if (avatarEl) {
          avatarEl.innerHTML = this.renderAvatar(data.astrologer.avatar, data.astrologer.name);
        }
      }

      // USER MANDATE: Pure, neat and clean WhatsApp & AstroView AI style consultation room.
      // Remove all messy floating cards, audio voice widgets, and prescription slips.
      const ast = (data && data.astrologer) || {};
      const astName = ast.name || 'Pt. Tribhuvan Sharma';
      const astTitle = ast.title || 'वरिष्ठ वैदिक ज्योतिषाचार्य';

      // Clean, elegant Astrologer Greeting (matching Image 3 reference)
      const hindiUi = (window.I18n && I18n.currentLang) === 'hi';
      const greeting = hindiUi
        ? `प्रणाम! मैं ${window.I18n ? I18n.text(astName) : astName} हूँ, ${window.I18n ? I18n.text(astTitle) : astTitle}। प्रामाणिक शास्त्रीय वैदिक ज्योतिष के आधार पर आज मैं आपकी क्या सहायता कर सकता हूँ?`
        : `Pranam! I am ${astName}, ${astTitle}. Based on authentic classical Vedic Jyotish principles, how may I assist you today?`;
      this.appendMessage('assistant', greeting);

      // Keep dynamic follow-up chips discreet
      const chips = document.getElementById('dynamic-context-chips');
      if (chips) chips.style.display = 'none';

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

    // Mode 2: Vedic Astrologer Persona Consultation Mode (Streaming)
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

    // Anchor screen at the start of Pandit Ji's newly incoming answer
    streamRow.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
            if (!this.isCalling || generation !== this.callGeneration) return;
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
            // Do not force bottom scroll so user comfortably reads from the start of the response
          },
          (doneData) => {
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

            // Interactive Vedic Remedy Card
            if (lowContent.includes('उपाय') || lowContent.includes('मंत्र') || lowContent.includes('दान') || lowContent.includes('विष्णु') || lowContent.includes('remedy') || lowContent.includes('शांति')) {
              const remedyCard = document.createElement('div');
              remedyCard.className = 'vedic-remedy-card';
              remedyCard.innerHTML = `
                <div class="remedy-card-header">
                  <span class="remedy-card-badge">✨ शास्त्रीय वैदिक उपाय</span>
                  <h4 class="remedy-card-title">बृहस्पति व ग्रह कृपा संवर्धन</h4>
                </div>
                <div class="remedy-mantra-box">
                  ॥ ॐ बृं बृहस्पतये नमः ॥
                </div>
                <p class="remedy-details-text">
                  प्रत्येक गुरुवार को भगवान विष्णु अथवा देवगुरु बृहस्पति का ध्यान करें। पीले वस्त्र या चने की दाल का दान करें। 108 बार तुलसी माला पर जप करें।
                </p>
                <div class="remedy-actions-row">
                  <button type="button" class="btn-remedy-action" onclick="ChatController.saveRemedyToDaily('बृहस्पति शांति उपाय', 'ॐ बृं बृहस्पतये नमः', 'गुरुवार को पीले वस्त्र व चने की दाल का दान करें')">
                    <span>✨</span> <span>Add to Daily Upay</span>
                  </button>
                  <button type="button" class="btn-remedy-secondary" onclick="ChatController.setRemedyReminder('गुरुवार')">
                    <span>⏰</span> <span>Set Reminder (गुरुवार)</span>
                  </button>
                </div>
              `;
              streamRow.querySelector('.message-bubble').appendChild(remedyCard);
            }

            // Astrological Muhurat Timeline Bar
            if (window.App?.currentChart && (lowContent.includes('2026') || lowContent.includes('2027') || lowContent.includes('शुभ समय') || lowContent.includes('विवाह') || lowContent.includes('योग') || lowContent.includes('marriage'))) {
              const timeline = document.createElement('div');
              timeline.className = 'muhurat-timeline-bar';
              const hindiBar = (window.I18n && I18n.currentLang) === 'hi';
              timeline.innerHTML = `
                <span class="timeline-icon">⏳</span>
                <span class="timeline-text">${hindiBar ? 'अनुकूल शुभ मुहूर्त अवधि' : 'Favorable auspicious window'}: <strong>${hindiBar ? 'नवंबर 2026 – मार्च 2027' : 'Nov 2026 – Mar 2027'}</strong> (${hindiBar ? 'विशेष अनुकूल विवाह योग' : 'especially favorable for marriage'})</span>
              `;
              streamRow.querySelector('.message-bubble').appendChild(timeline);
            }

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

            streamRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            if (!this.isCalling || generation !== this.callGeneration) return;
            this.currentSessionId = sessionData.session_id;
          },
          (deltaText) => {
            accumulatedText += deltaText;
            if (streamingTextElem) {
              streamingTextElem.innerHTML = this.formatMarkdown(accumulatedText) + '<span class="streaming-cursor">▋</span>';
            }
            // Do not force bottom scroll so user comfortably reads from the start of the response
          },
          (doneData) => {
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

            // Interactive Vedic Remedy Card
            if (lowContent.includes('उपाय') || lowContent.includes('मंत्र') || lowContent.includes('दान') || lowContent.includes('विष्णु') || lowContent.includes('remedy') || lowContent.includes('शांति')) {
              const remedyCard = document.createElement('div');
              remedyCard.className = 'vedic-remedy-card';
              remedyCard.innerHTML = `
                <div class="remedy-card-header">
                  <span class="remedy-card-badge">✨ शास्त्रीय वैदिक उपाय</span>
                  <h4 class="remedy-card-title">बृहस्पति व ग्रह कृपा संवर्धन</h4>
                </div>
                <div class="remedy-mantra-box">
                  ॥ ॐ बृं बृहस्पतये नमः ॥
                </div>
                <p class="remedy-details-text">
                  प्रत्येक गुरुवार को भगवान विष्णु अथवा देवगुरु बृहस्पति का ध्यान करें। पीले वस्त्र या चने की दाल का दान करें। 108 बार तुलसी माला पर जप करें।
                </p>
                <div class="remedy-actions-row">
                  <button type="button" class="btn-remedy-action" onclick="ChatController.saveRemedyToDaily('बृहस्पति शांति उपाय', 'ॐ बृं बृहस्पतये नमः', 'गुरुवार को पीले वस्त्र व चने की दाल का दान करें')">
                    <span>✨</span> <span>Add to Daily Upay</span>
                  </button>
                  <button type="button" class="btn-remedy-secondary" onclick="ChatController.setRemedyReminder('गुरुवार')">
                    <span>⏰</span> <span>Set Reminder (गुरुवार)</span>
                  </button>
                </div>
              `;
              streamRow.querySelector('.message-bubble').appendChild(remedyCard);
            }

            // Astrological Muhurat Timeline Bar
            if (window.App?.currentChart && (lowContent.includes('2026') || lowContent.includes('2027') || lowContent.includes('शुभ समय') || lowContent.includes('विवाह') || lowContent.includes('योग') || lowContent.includes('marriage'))) {
              const timeline = document.createElement('div');
              timeline.className = 'muhurat-timeline-bar';
              const hindiBar = (window.I18n && I18n.currentLang) === 'hi';
              timeline.innerHTML = `
                <span class="timeline-icon">⏳</span>
                <span class="timeline-text">${hindiBar ? 'अनुकूल शुभ मुहूर्त अवधि' : 'Favorable auspicious window'}: <strong>${hindiBar ? 'नवंबर 2026 – मार्च 2027' : 'Nov 2026 – Mar 2027'}</strong> (${hindiBar ? 'विशेष अनुकूल विवाह योग' : 'especially favorable for marriage'})</span>
              `;
              streamRow.querySelector('.message-bubble').appendChild(timeline);
            }

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

            streamRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  },

  // =========================================================================
  // Interactive Kundli Sheet & Live Chart Drawer (Recommended Feature)
  // =========================================================================
  toggleKundliSheet() {
    const sheet = document.getElementById('consultation-kundli-panel');
    if (!sheet) return;
    const isActive = sheet.classList.contains('active');
    if (isActive) {
      sheet.classList.remove('active');
    } else {
      this.renderChatKundli('d1');
      sheet.classList.add('active');
    }
  },

  renderChatKundli(activeTab = 'd1') {
    const body = document.getElementById('chat-kundli-content');
    if (!body) return;

    const chart = (window.App && window.App.currentChart) ? window.App.currentChart : null;
    const chartData = (chart && chart.chart_data) ? chart.chart_data : this.getDefaultChartData();
    const chartName = chart ? (chart.name || 'Janam Kundli') : 'Default Kundli (Aries Lagna)';

    let chartSvg = '';
    if (window.ChartViewer && window.ChartViewer.renderNorthIndianSVG) {
      chartSvg = window.ChartViewer.renderNorthIndianSVG(chartData, true);
    }

    const planets = (chartData && chartData.planets) || [];
    const planetsHtml = planets.map(p => `
      <div class="kundli-graha-chip flex items-center justify-between p-2 bg-white rounded-lg border border-[#E7E2D8] text-xs">
        <span class="font-bold text-[#1E1B4B]">${p.name}</span>
        <span class="text-[#7439EA] font-semibold">${p.sign || 'Aries'}</span>
        <span class="text-[#B45309] font-bold">H${p.house || 1}</span>
        ${p.is_retrograde ? '<span class="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">व</span>' : ''}
      </div>
    `).join('');

    body.innerHTML = `
      <div class="chat-kundli-header-bar flex items-center justify-between pb-3 border-b border-[#E7E2D8] mb-3">
        <div>
          <h4 class="font-serif font-bold text-[#1E1B4B] text-base mb-0.5 flex items-center gap-1.5">
            <span>🪐</span> ${chartName}
          </h4>
          <span class="text-xs text-[#64748B]">Lagna: ${chartData.ascendant_sign || 'Aries'} • Swiss Ephemeris Precision</span>
        </div>
        <button type="button" class="btn-tool-sm text-xs font-bold text-[#7439EA] hover:underline cursor-pointer" onclick="window.App && window.App.openBirthModal ? window.App.openBirthModal() : null">
          ✏️ Edit Details
        </button>
      </div>

      <div class="chat-kundli-tabs flex gap-1.5 mb-3 p-1 bg-[#F5F3FF] rounded-xl border border-[#DDD6FE]">
        <button type="button" class="kundli-tab-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${activeTab === 'd1' ? 'bg-[#7439EA] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E1B4B]'}" onclick="ChatController.renderChatKundli('d1')">Lagna (D-1) लग्न</button>
        <button type="button" class="kundli-tab-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${activeTab === 'd9' ? 'bg-[#7439EA] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E1B4B]'}" onclick="ChatController.renderChatKundli('d9')">Navamsha (D-9) नवमांश</button>
        <button type="button" class="kundli-tab-btn flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${activeTab === 'dasha' ? 'bg-[#7439EA] text-white shadow-xs' : 'text-[#64748B] hover:text-[#1E1B4B]'}" onclick="ChatController.renderChatKundli('dasha')">Dasha महादशा</button>
      </div>

      <div class="chat-kundli-chart-area">
        ${activeTab === 'dasha' ? `
          <div class="dasha-timeline-view p-3 bg-white rounded-xl border border-[#E7E2D8]">
            <h5 class="text-xs font-bold text-[#1E1B4B] mb-2.5 flex items-center gap-1.5">
              <span>⏳</span> Vimshottari Dasha Sequence (विंशोत्तरी दशा चक्र)
            </h5>
            <div class="dasha-step current-dasha mb-2.5 p-3 bg-[#FAF5FF] border border-[#DDD6FE] rounded-xl shadow-xs">
              <span class="text-xs font-bold text-[#7439EA] block mb-1">● Active Mahadasha: राहु (Rahu)</span>
              <span class="text-[11px] text-[#64748B] block leading-relaxed">2018 – 2036 (18 वर्ष) • वर्तमान अंतरदशा: गुरु (Jupiter) till 2026</span>
              <div class="w-full bg-[#E9D5FF] h-1.5 rounded-full mt-2 overflow-hidden">
                <div class="bg-[#7439EA] h-full rounded-full" style="width: 58%;"></div>
              </div>
            </div>
            <div class="dasha-step mb-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#475569] flex justify-between items-center">
              <span>Next: शनि (Saturn) Mahadasha</span>
              <span class="font-bold text-[#64748B]">2036 – 2055</span>
            </div>
            <div class="dasha-step p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#475569] flex justify-between items-center">
              <span>Next: बुध (Mercury) Mahadasha</span>
              <span class="font-bold text-[#64748B]">2055 – 2072</span>
            </div>
          </div>
        ` : `
          <div class="kundli-svg-wrapper flex justify-center py-2 bg-[#FAF8F2] rounded-xl border border-[#E7E2D8]">
            ${chartSvg}
          </div>
          <div class="kundli-planets-grid mt-3 grid grid-cols-2 gap-2">
            ${planetsHtml}
          </div>
        `}
      </div>
    `;
  },

  getDefaultChartData() {
    return {
      ascendant_sign: 'Aries',
      planets: [
        { name: 'Sun (सूर्य)', sign: 'Aries', house: 1, is_retrograde: false, degree_in_sign: 12.4 },
        { name: 'Moon (चन्द्र)', sign: 'Taurus', house: 2, is_retrograde: false, degree_in_sign: 8.2 },
        { name: 'Mars (मंगल)', sign: 'Capricorn', house: 10, is_retrograde: false, degree_in_sign: 15.6 },
        { name: 'Mercury (बुध)', sign: 'Pisces', house: 12, is_retrograde: true, degree_in_sign: 21.1 },
        { name: 'Jupiter (गुरु)', sign: 'Cancer', house: 4, is_retrograde: false, degree_in_sign: 18.9 },
        { name: 'Venus (शुक्र)', sign: 'Pisces', house: 12, is_retrograde: false, degree_in_sign: 27.3 },
        { name: 'Saturn (शनि)', sign: 'Aquarius', house: 11, is_retrograde: false, degree_in_sign: 14.5 },
        { name: 'Rahu (राहु)', sign: 'Pisces', house: 12, is_retrograde: true, degree_in_sign: 16.0 },
        { name: 'Ketu (केतु)', sign: 'Virgo', house: 6, is_retrograde: true, degree_in_sign: 16.0 }
      ]
    };
  },

  // =========================================================================
  // Zero-Cost Realistic Voice Calling Agents (Male Pandit & Female Vidushi)
  // =========================================================================
  startAudioCall() {
    const astro = this.getActiveAstrologer();
    CallingAgentService.startCall(astro);
  },

  endAudioCall() {
    CallingAgentService.endCall();
  },

  toggleCallMute() {
    CallingAgentService.toggleMute();
  },

  toggleCallSpeaker() {
    CallingAgentService.toggleSpeaker();
  },

  getActiveAstrologer() {
    return (this.activeConsultation && this.activeConsultation.astrologer) ||
           (this.astrologers || []).find(a => a.id === this.selectedAstrologer || a.slug === this.selectedAstrologer) ||
           { id: 'pt-rameshwar-dwivedi', name: 'Pt. Rameshwar Dwivedi', title: 'Senior Vedic Jyotish & Karmakand Scholar', avatar: 'assets/portraits/pt-rameshwar-dwivedi.jpg', gender: 'male' };
  }
};

// =========================================================================
// Indian neural voice calling agent with browser microphone recognition
// =========================================================================
const CallingAgentService = {
  isCalling: false,
  isMuted: false,
  isSpeakerMuted: false,
  recognition: null,
  activeAstrologer: null,
  callTimerInterval: null,
  callDurationSeconds: 0,
  isSpeaking: false,
  isListening: false,
  currentAudio: null,
  speechQueue: [],
  isProcessingQueue: false,
  userSilenceTimer: null,
  accumulatedSpeech: '',
  turnId: 0,
  ttsCache: new Map(),
  callLog: null,
  voiceSettings: { speed: 'normal', style: 'calm', gender: 'auto', outputId: '' },
  PRONUNCIATIONS: [
    [/\bSade ?Sati\b/gi, 'Saa-de Saa-tee'], [/\bKundli\b/gi, 'Koond-lee'], [/\bJyotish\b/gi, 'Jyo-tish'],
    [/\bRahu\b/gi, 'Raa-hu'], [/\bKetu\b/gi, 'Kay-too'], [/\bShani\b/gi, 'Shaa-nee'],
    [/\bDasha\b/gi, 'Duh-shaa'], [/\bMangal\b/gi, 'Mung-gul'], [/\bGuru\b/gi, 'Goo-roo'],
    [/\bLagna\b/gi, 'Lug-na'], [/\bNakshatra\b/gi, 'Nuk-shuh-tra'], [/\bMuhurat\b/gi, 'Moo-hoort'],
    [/\bBhava\b/gi, 'Bhaa-va'], [/\bUpay\b/gi, 'Oo-pai'], [/\bYajman\b/gi, 'Yaj-maan']
  ],

  isFemaleAstrologer(astro) {
    if (!astro) return false;
    if (astro.gender === 'female') return true;
    if (astro.gender === 'male') return false;
    const name = (astro.name || '').toLowerCase();
    const slug = (astro.slug || '').toLowerCase();
    return /vidushi|radhika|sunita|meera|ananya|priya|swati|pooja|kavita|archana|lakshmi|rekha|meenakshi|gayatri|kalpana|pallavi|shalini|shambhavi|aradhana/i.test(name) ||
           /vidushi|radhika|sunita|meera|ananya|priya|swati|pooja|kavita|archana|lakshmi|rekha|meenakshi|gayatri|kalpana|pallavi|shalini|shambhavi|aradhana/i.test(slug);
  },

  cleanSpeechText(text) {
    if (!text) return '';
    return text
      .replace(/[*#_~`>]/g, ' ')
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  setWaveformActive(active) {
    const bars = document.getElementById('calling-waveform-bars');
    if (bars) {
      bars.classList.toggle('active', !!active);
    }
  },

  playTempleBellChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Solfeggio 528Hz divine bell harmonics
      const baseFreq = 528;
      const harmonics = [
        { ratio: 1.0, gain: 0.35, decay: 2.4 },
        { ratio: 1.5, gain: 0.18, decay: 1.9 },
        { ratio: 2.05, gain: 0.12, decay: 1.4 },
        { ratio: 2.76, gain: 0.08, decay: 1.0 },
        { ratio: 4.15, gain: 0.04, decay: 0.7 }
      ];

      harmonics.forEach(h => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * h.ratio, now);

        gain.gain.setValueAtTime(h.gain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + h.decay);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + h.decay + 0.1);
      });
    } catch (e) {
      console.warn('Temple bell chime audio context error:', e);
    }
  },

  isQueryOutOfScope(text) {
    if (!text) return false;
    const clean = text.toLowerCase().trim();

    // 1. Technical / Programming / Coding
    const isTech = /\b(python|javascript|typescript|react|html|css|java|c\+\+|sql|php|golang|programming|coding|algorithm|github|debug|syntax|variable|frontend|backend|terminal|compile|code|loop|function|array)\b/i.test(clean);

    // 2. Cooking / Food Recipes
    const isCooking = /\b(maggi|pizza|burger|pasta|biryani|sandwich|recipe|chai kaise banaye|khana banana|recipe of|ingredients for|rasoi|roti|sabzi)\b/i.test(clean);

    // 3. Current Non-Astrological Politics / Elections
    const isPolitics = /\b(bjp|congress|modi|rahul gandhi|aap party|election result|vote for|parliament election|chief minister election|political party)\b/i.test(clean);

    // 4. Non-astrological Academic / School Homework / Math
    const isAcademic = /\b(solve equation|derivative of|integration of|algebra problem|write essay on|homework help|maths problem)\b/i.test(clean);

    // 5. Gambling / Satta / Hacking
    const isIllegal = /\b(satta king|lottery number|ipl betting|gambling trick|how to hack|steal money|chori kaise kare|hack account)\b/i.test(clean);

    // 6. Allopathic Medicine / Clinical Drug Dosing
    const isAllopathicMedicine = /\b(paracetamol dose|antibiotic medicine|cough syrup name|tablet for fever|doctor prescription)\b/i.test(clean);

    return isTech || isCooking || isPolitics || isAcademic || isIllegal || isAllopathicMedicine;
  },

  // A short insisting reply ("tum btao", "mujhe do") after a refusal is the same off-topic request.
  isInsistingFollowUp(text) {
    const clean = (text || '').toLowerCase().trim();
    if (!clean || clean.split(/\s+/).length > 12) return false;
    const newTopic = /(kundli|kundali|horoscope|rashi|dasha|graha|shani|rahu|ketu|mangal|guru|nakshatra|career|job|naukri|marriage|shadi|shaadi|love|health|money|paisa|business|child|santan|family|future|bhavishya|mantra|puja|pooja|vrat|upay|remedy|gemstone|ratna|kismat|bhagya|कुंडली|कुण्डली|राशि|दशा|ग्रह|शनि|राहु|केतु|मंगल|गुरु|नक्षत्र|करियर|नौकरी|शादी|विवाह|धन|स्वास्थ्य|संतान|परिवार|भविष्य|मंत्र|पूजा|व्रत|उपाय|रत्न|भाग्य)/i;
    if (newTopic.test(clean)) return false;
    return /\b(tum|aap|tu|you)\s+(hi\s+)?(bta|bata|btao|batao|bolo|do|dikha|sikha|likh|tell|give|show)|\b(mujhe|muje|mjhe|mereko)\s+(do|de\s*do|dedo|bta|bata|btao|batao|chahiye|sikha|dikha|likh)|\b(de\s*do|dedo|bata\s*do|bta\s*do|btao|batao|bolo|sikhao|dikhao|likho|bana\s*do|bnao|banao)\b|\b(nhi|nahi|nahin)\s+(jan|pata|aata|aati)|\b(i\s+don'?t\s+know|just\s+tell|tell\s+me|give\s+me|please|pls|plz)\b|तुम\s*बताओ|आप\s*बताइए|मुझे\s*दो|बता\s*दो|नहीं\s*पता|नहीं\s*जानता/i.test(clean);
  },

  highlightBhava(bhavaNum, bhavaName) {
    for (let i = 1; i <= 12; i++) {
      const poly = document.getElementById('bhava-poly-' + i);
      if (poly) poly.classList.remove('bhava-active');
    }
    const target = document.getElementById('bhava-poly-' + bhavaNum);
    if (target) {
      target.classList.add('bhava-active');
    }
    const label = document.getElementById('mini-bhava-label');
    if (label && bhavaName) {
      label.textContent = bhavaName + ' सक्रिय';
    }
  },

  syncBhavaWithText(text) {
    if (!text) return;
    const lower = text.toLowerCase();
    let targetBhava = null;
    let bhavaName = '';

    if (/शादी|विवाह|पति|पत्नी|जीवनसाथी|सप्तम|7th|marriage|spouse|partner|relationship/i.test(lower)) {
      targetBhava = 7;
      bhavaName = 'सप्तम भाव (विवाह)';
    } else if (/करियर|नौकरी|बिजनेस|पदोन्नति|प्रमोशन|दशम|10th|career|job|profession|business|work/i.test(lower)) {
      targetBhava = 10;
      bhavaName = 'दशम भाव (करियर)';
    } else if (/धन|पैसा|आर्थिक|सम्पत्ति|द्वितीय|एकादश|लाभ|2nd|11th|wealth|money|finance|income|gains/i.test(lower)) {
      targetBhava = 11;
      bhavaName = 'एकादश भाव (धन/लाभ)';
    } else if (/भाग्य|धर्म|विदेश|उच्च शिक्षा|नवम|9th|luck|fortune|dharma|higher learning/i.test(lower)) {
      targetBhava = 9;
      bhavaName = 'नवम भाव (भाग्य)';
    } else if (/स्वास्थ्य|रोग|शत्रु|कर्ज|लोन|षष्ठ|6th|health|disease|debt|enemy/i.test(lower)) {
      targetBhava = 6;
      bhavaName = 'षष्ठ भाव (रोग व ऋण)';
    } else if (/संतान|विद्या|शिक्षा|प्रेम|बुद्धि|पंचम|5th|children|education|love|intellect/i.test(lower)) {
      targetBhava = 5;
      bhavaName = 'पंचम भाव (विद्या व संतान)';
    } else if (/घर|माता|भूमि|वाहन|चतुर्थ|4th|mother|home|property|vehicle/i.test(lower)) {
      targetBhava = 4;
      bhavaName = 'चतुर्थ भाव (सुख व वाहन)';
    } else if (/साढ़ेसाती|ढैय्या|शनि|राहु|केतु|आयु|अष्टम|8th|longevity|occult|transformation/i.test(lower)) {
      targetBhava = 8;
      bhavaName = 'अष्टम भाव (आयु व संकट शांति)';
    } else if (/व्यक्तित्व|लग्न|स्वभाव|प्रथम|1st|personality|self/i.test(lower)) {
      targetBhava = 1;
      bhavaName = 'प्रथम भाव (लग्न)';
    }

    if (targetBhava) {
      this.highlightBhava(targetBhava, bhavaName);
    }
  },

  onBhavaClick(bhavaNum, label) {
    if (!this.isCalling) return;
    this.highlightBhava(bhavaNum, label);
    const query = `मेरी जन्म कुंडली के ${label} की स्थिति और इसके शास्त्रीय फल बताएं।`;
    this.askQuickCallPrompt(query);
  },

  startCall(astro) {
    if (!document.getElementById('modal-live-audio-call')) return;
    this.callGeneration = (this.callGeneration || 0) + 1;
    this.stopRecognition();
    this.isResponding = false;
    this.micBlocked = false;
    this.responseLanguage = null;
    this.activeAstrologer = astro || ChatController.getActiveAstrologer();
    this.isCalling = true;
    this.isMuted = false;
    this.isSpeakerMuted = false;
    this.isManualMicActive = false;
    this.callDurationSeconds = 0;
    this.callStartedAt = Date.now();
    this.accumulatedSpeech = '';
    this.lastQueuedSentence = '';
    this.stopAllSpeech();
    this.turnId++;
    this.userLanguage = null;
    this.lastRefused = false;
    this.fillerBlobs = new Map();
    this.responseLanguage = this.astrologerLanguage(this.activeAstrologer) || null;
    this.interimSpeech = '';
    this.setUserCaption('');
    this.setPanditCaption('');
    clearTimeout(this.fillerTimer);
    this.stopBargeInMonitor();
    this.startBargeInMonitor();
    this.startWatchdog();
    this.reconnectAttempts = 0;
    this.callLog = { turns: [], remedies: [], pending: [] };
    this.loadVoiceSettings();
    this.populateAudioDevices();
    this.setConnectionState(navigator.onLine);
    window.addEventListener('online', this.onNetworkOnline);
    window.addEventListener('offline', this.onNetworkOffline);

    const isFemale = this.isFemaleAstrologer(this.activeAstrologer);
    const modal = document.getElementById('modal-live-audio-call');
    if (!modal) return;

    modal.style.display = 'flex';
    modal.classList.add('active');

    // Update Calling Screen UI
    const nameEl = document.getElementById('call-astrologer-name');
    if (nameEl) nameEl.textContent = this.activeAstrologer.name;
    const titleEl = document.getElementById('call-astrologer-title');
    if (titleEl) titleEl.textContent = this.activeAstrologer.title || (isFemale ? 'वरिष्ठ वैदिक विदुषी' : 'वरिष्ठ वैदिक ज्योतिषाचार्य');
    const typeLabel = document.getElementById('call-agent-type-label');
    if (typeLabel) typeLabel.textContent = this.callText('Vedic astrology voice consultation', 'वैदिक ज्योतिष स्वर परामर्श');

    const avatarEl = document.getElementById('call-astrologer-avatar');
    if (avatarEl) {
      avatarEl.innerHTML = ChatController.renderAvatar(this.activeAstrologer.avatar, this.activeAstrologer.name, 'w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-[#F59E0B] shadow-xl object-cover');
    }

    this.updateStatus('connecting', isFemale ? 'विदुषी जी से संपर्क स्थापित हो रहा है...' : 'पंडित जी से संपर्क स्थापित हो रहा है...');

    // SpeechRecognition owns the microphone. Do not keep a competing capture stream.
    const generation = this.callGeneration;
    this.updateMicButton();
    this.initSpeechRecognition();

    // 1. Play Sacred Temple Bell Chime (Synthesized via Web Audio API)
    this.playTempleBellChime();

    // Start Live Call Timer
    if (this.callTimerInterval) clearInterval(this.callTimerInterval);
    const timerDisplay = document.getElementById('call-timer-display');
    this.callTimerInterval = setInterval(() => {
      this.callDurationSeconds++;
      const mins = String(Math.floor(this.callDurationSeconds / 60)).padStart(2, '0');
      const secs = String(this.callDurationSeconds % 60).padStart(2, '0');
      if (timerDisplay) timerDisplay.textContent = `${mins}:${secs}`;
    }, 1000);

    // 2. Initial Sacred Vedic Greeting — mentions the caller's saved chart when one is already on file
    const own = this.responseLanguage;
    const savedChart = window.App?.currentChart;
    const greetingText = own && own !== 'en' && own !== 'hinglish'
      ? (savedChart
          ? (isFemale
              ? `नमस्कार जी, मैं ${this.activeAstrologer.name} बोल रही हूँ। मैंने आपकी कुंडली देख ली है, ${savedChart.name} जी। बताइए, आज किस बारे में बात करनी है?`
              : `नमस्कार जी, मैं ${this.activeAstrologer.name} बोल रहा हूँ। मैंने आपकी कुंडली देख ली है, ${savedChart.name} जी। बताइए, आज किस बारे में बात करनी है?`)
          : (isFemale
              ? `नमस्कार जी, मैं ${this.activeAstrologer.name} बोल रही हूँ। बताइए, आज किस बारे में बात करनी है?`
              : `नमस्कार जी, मैं ${this.activeAstrologer.name} बोल रहा हूँ। बताइए, आज किस बारे में बात करनी है?`))
      : (savedChart
          ? `Namaste, this is ${this.activeAstrologer.name}. I already have your birth chart on file, ${savedChart.name}. Tell me, what would you like to talk about today?`
          : `Namaste, this is ${this.activeAstrologer.name}. Tell me, what would you like to talk about today?`);
    this.setPanditCaption(greetingText);
    this.prefetchSpeech(greetingText);
    this.prefetchFillers();
    this.greetingTimer = setTimeout(() => {
      if (!this.isCalling || generation !== this.callGeneration || this.isManualMicActive || this.isResponding) return;
      this.stopRecognition();
      this.speakPanditVoice(greetingText, () => this.initSpeechRecognition());
    }, 120);
  },

  updateStatus(state, message) {
    const badge = document.getElementById('call-status-badge');
    const text = document.getElementById('call-status-text');
    if (!badge || !text) return;
    text.textContent = window.I18n ? I18n.text(message) : message;

    badge.className = 'calling-status-chip ' + state;
    const ringWrap = document.querySelector('.calling-avatar-wrapper');
    if (ringWrap) {
      ringWrap.classList.toggle('speaking', state === 'speaking');
      ringWrap.classList.toggle('listening', state === 'listening');
    }

    this.setWaveformActive(state === 'speaking' || state === 'listening');
  },

  setUserCaption(text) {
    const el = document.getElementById('call-user-transcript');
    if (el) el.textContent = text ? `${this.callText('You', 'आप')}: ${text}` : ''; 
  },

  setPanditCaption(text) {
    const el = document.getElementById('call-pandit-transcript');
    if (el) el.textContent = `${this.activeAstrologer ? this.activeAstrologer.name : 'पंडित जी'}: ${text}`;
  },

  language() {
    return (window.I18n && I18n.currentLang) || ChatController.currentLanguage || 'en';
  },

  locale() {
    const language = this.userLanguage || this.astrologerLanguage(this.activeAstrologer) || this.language();
    return language === 'hi' || language === 'hinglish' ? 'hi-IN' : language === 'en' ? 'en-IN' : language;
  },

  LANGUAGE_CODES: { hindi: 'hi', sanskrit: 'hi', english: 'en', marathi: 'mr', gujarati: 'gu', tamil: 'ta', telugu: 'te',
    kannada: 'kn', malayalam: 'ml', bengali: 'bn', punjabi: 'pa', urdu: 'ur' },

  astrologerLanguages(astro) {
    return (astro?.languages || []).map(l => this.LANGUAGE_CODES[String(l).toLowerCase()]).filter(Boolean);
  },

  // Primary language of the astrologer (first Indian language they list), or null when unknown.
  astrologerLanguage(astro) {
    const langs = this.astrologerLanguages(astro);
    return langs.find(l => l !== 'en') || langs[0] || null;
  },

  // The pandit answers in his own language; he switches only when the caller speaks another language he knows.
  replyLanguage(userText) {
    const own = this.astrologerLanguage(this.activeAstrologer);
    const spoken = this.inferQuestionLanguage(userText);
    if (!own) return spoken;
    if (spoken !== 'en' && spoken !== 'hinglish' && this.astrologerLanguages(this.activeAstrologer).includes(spoken)) return spoken;
    return own;
  },

  inferQuestionLanguage(text) {
    for (const [pattern, language] of [
      [/[\u0900-\u097f]/, 'hi'], [/[\u0980-\u09ff]/, 'bn'],
      [/[\u0a80-\u0aff]/, 'gu'], [/[\u0b80-\u0bff]/, 'ta'],
      [/[\u0c00-\u0c7f]/, 'te'], [/[\u0c80-\u0cff]/, 'kn'],
      [/[\u0d00-\u0d7f]/, 'ml'], [/[\u0a00-\u0a7f]/, 'pa'],
      [/[\u0600-\u06ff]/, 'ur']
    ]) if (pattern.test(text)) return language;
    if (/\b(kya|kaise|kaisa|kaisi|hai|hain|ho|hoga|hogi|mera|meri|mere|mujhe|main|mai|aap|aapka|shaadi|shadi|batao|btao|bataiye|bataye|kab|kyun|kyu|rahega|rahegi|naukri|paisa|upay|kundli|dasha|nahi|nahin|accha|theek)\b/i.test(text)) return 'hinglish';
    return 'en';
  },

  responseText(en, hi) {
    return ['hi', 'hinglish'].includes(this.responseLanguage || this.language()) ? hi : en;
  },

  callText(en, hi) {
    return this.language() === 'hi' ? hi : en;
  },

  canListen() {
    return this.isCalling && !this.isMuted && !this.isSpeaking && !this.isResponding &&
      !this.isProcessingQueue && !this.speechQueue.length && !this.micBlocked;
  },

  // Wait longer when the sentence sounds unfinished, answer sooner when it is clearly complete.
  silenceDelay(text) {
    if (!text) return 1400;
    if (/(\b(and|but|or|because|so|with|my|the|in|ke|ki|ka|se|mein|par|aur|lekin|toh)|कि|और|लेकिन|का|की|के|में|से|तो|,)\s*$/i.test(text)) return 1500;
    if (/([?।!.]|\b(kya|kab|hai|hoga|hogi|batao|bataiye)|क्या|कब|है|होगा|होगी|होंगे|बताइए|बताएं)\s*$/i.test(text)) return 550;
    return text.split(/\s+/).length < 3 ? 1400 : 950;
  },

  stopRecognition() {
    clearTimeout(this.recognitionRetryTimer);
    clearTimeout(this.userSilenceTimer);
    this.accumulatedSpeech = '';
    const recognition = this.recognition;
    this.recognition = null;
    this.isListening = false;
    if (recognition) {
      recognition.onend = recognition.onresult = recognition.onerror = recognition.onstart = recognition.onspeechend = null;
      try { recognition.abort(); } catch (e) {}
    }
  },

  initSpeechRecognition() {
    if (!this.canListen() || this.recognition) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!window.isSecureContext) {
      this.updateStatus('muted', this.callText('Microphone requires HTTPS or localhost.', 'माइक के लिए सुरक्षित कनेक्शन या स्थानीय वेबसाइट खोलें।'));
      return;
    }
    if (!Recognition) {
      this.updateStatus('muted', this.callText('Voice recognition is unavailable in this browser. Open Chrome or Edge, or type in chat.', 'इस ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। क्रोम या एज खोलें, या संदेश लिखें।'));
      return;
    }
    const recognition = new Recognition();
    this.recognition = recognition;
    recognition.lang = this.locale();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    this.accumulatedSpeech = '';
    this.interimSpeech = '';
    this.lastHeard = '';
    const submit = () => {
      if (this.recognition !== recognition || !this.canListen()) return;
      const query = (this.accumulatedSpeech + ' ' + this.interimSpeech).trim();
      if (!query) return;
      // Browsers that report recognition confidence let us warn when it was clearly a weak catch
      // (soft voice, noisy room), instead of just quietly answering a possibly mis-heard question.
      const conf = this.recentConfidence || [];
      const avgConf = conf.length ? conf.reduce((a, b) => a + b, 0) / conf.length : 1;
      this.recentConfidence = [];
      if (avgConf > 0 && avgConf < 0.45 && query.split(/\s+/).length <= 10) {
        this.stopRecognition();
        this.isManualMicActive = false;
        this.updateMicButton();
        const hint = this.callText(
          'I did not catch that clearly — could you speak a little louder or closer to the mic?',
          'मुझे साफ़ सुनाई नहीं दिया — कृपया थोड़ा तेज़ बोलें या माइक के पास आकर बोलें।');
        this.setPanditCaption(hint);
        this.enqueueSentence(hint, () => { if (this.isCalling && !this.isMuted) this.initSpeechRecognition(); });
        return;
      }
      this.stopRecognition();
      this.isManualMicActive = false;
      this.updateMicButton();
      this.handleUserVoiceInput(query);
    };
    recognition.onstart = () => {
      if (this.recognition !== recognition) return;
      this.isListening = true;
      this.recognitionFailures = 0;
      this.updateStatus('listening', this.callText('Listening — speak your question.', 'सुन रहे हैं — अपना प्रश्न बोलें।'));
    };
    this.recentConfidence = [];
    recognition.onresult = event => {
      if (this.recognition !== recognition || !this.canListen()) return;
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.accumulatedSpeech += text + ' ';
          const conf = event.results[i][0].confidence;
          if (typeof conf === 'number' && conf > 0) this.recentConfidence.push(conf);
        } else interim += text;
      }
      this.interimSpeech = interim;
      const heard = (this.accumulatedSpeech + interim).trim();
      this.setUserCaption(heard);
      // Background noise keeps firing results with the same text; only new words restart the silence timer,
      // otherwise the caller could finish speaking and never get an answer.
      if (heard === this.lastHeard && this.userSilenceTimer) return;
      this.lastHeard = heard;
      clearTimeout(this.userSilenceTimer);
      this.userSilenceTimer = setTimeout(submit, this.silenceDelay(heard));
    };
    recognition.onspeechend = () => {
      if (this.recognition !== recognition || !(this.accumulatedSpeech + this.interimSpeech).trim()) return;
      clearTimeout(this.userSilenceTimer);
      this.userSilenceTimer = setTimeout(submit, 450);
    };
    recognition.onerror = event => {
      if (this.recognition !== recognition) return;
      clearTimeout(this.userSilenceTimer);
      const errors = {
        'not-allowed': this.callText('Microphone permission denied. Allow microphone access in browser site settings, then tap Speak.', 'माइक की अनुमति नहीं मिली। ब्राउज़र की साइट सेटिंग में अनुमति दें, फिर बोलने वाला बटन दबाएँ।'),
        'service-not-allowed': this.callText('Speech recognition is blocked by this browser. Enable it or use Chrome or Edge.', 'ब्राउज़र ने आवाज़ पहचान रोक दी है। इसे सक्षम करें या क्रोम अथवा एज खोलें।'),
        'audio-capture': this.callText('No microphone detected. Connect a microphone, then tap Speak.', 'माइक नहीं मिला। माइक जोड़ें, फिर बोलने वाला बटन दबाएँ।'),
        'network': this.callText('Speech recognition needs an internet connection. Check your connection, then tap Speak.', 'आवाज़ पहचान के लिए इंटरनेट चाहिए। कनेक्शन जाँचें, फिर बोलने वाला बटन दबाएँ।')
      };
      if (event.error === 'network' && this.isCalling) {
        this.scheduleReconnect();
        return;
      }
      if (errors[event.error]) {
        this.micBlocked = true;
        this.updateStatus('muted', errors[event.error]);
      }
    };
    recognition.onend = () => {
      if (this.recognition !== recognition) return;
      // Some browsers end before the silence timer; keep the last transcript.
      if (!this.micBlocked && (this.accumulatedSpeech + this.interimSpeech).trim()) {
        submit();
        return;
      }
      this.recognition = null;
      this.isListening = false;
      if (this.canListen()) {
        this.recognitionRetryTimer = setTimeout(() => this.initSpeechRecognition(), 400);
      }
    };
    try { recognition.start(); }
    catch (error) {
      this.recognition = null;
      this.updateStatus('muted', this.callText('Could not start microphone. Tap Speak to retry.', 'माइक चालू नहीं हुआ। फिर से बोलने वाला बटन दबाएँ।'));
    }
  },

  updateMicButton() {
    const button = document.getElementById('btn-call-speak-now');
    const label = document.getElementById('call-speak-label');
    if (button) {
      button.classList.toggle('recording', !!this.isManualMicActive);
      button.setAttribute('aria-pressed', String(!!this.isManualMicActive));
    }
    if (label) label.textContent = this.isManualMicActive
      ? this.callText('Send question', 'प्रश्न भेजें') : this.callText('Speak', 'बोलें');
  },

  toggleManualMic() {
    if (!this.isCalling) return;
    if (this.isResponding) return;
    if (this.isManualMicActive) {
      const query = (this.accumulatedSpeech + ' ' + (this.interimSpeech || '')).trim();
      this.stopRecognition();
      this.isManualMicActive = false;
      this.updateMicButton();
      if (query) this.handleUserVoiceInput(query);
      else this.initSpeechRecognition();
      return;
    }
    this.stopRecognition();
    this.stopAllSpeech();
    this.micBlocked = false;
    this.isMuted = false;
    this.isManualMicActive = true;
    this.updateMicButton();
    const label = document.getElementById('call-mic-label');
    if (label) label.textContent = this.callText('Mute', 'माइक बंद करें');
    document.getElementById('btn-call-mute')?.classList.remove('active-ctrl');
    const icon = document.getElementById('call-mic-icon');
    if (icon) icon.textContent = '🎙️';
    this.initSpeechRecognition();
  },

  askQuickCallPrompt(question) {
    if (!this.isCalling || !question || this.isResponding) return;
    question = localizeQuickPrompt(question);
    this.setUserCaption(question);
    this.stopAllSpeech();
    this.handleUserVoiceInput(question);
  },

  enqueueSentence(sentence, onAllFinished) {
    const clean = this.cleanSpeechText(sentence);
    if (!clean || clean.length < 2) return;
    // CRITICAL FIX: Deduplication check prevents the same sentence from being spoken twice
    if (this.lastQueuedSentence && this.lastQueuedSentence === clean) return;
    this.lastQueuedSentence = clean;
    this.speechQueue.push({ text: clean, onAllFinished });
    this.prefetchSpeech(clean);
    this.processNextSpeech();
  },

  processNextSpeech() {
    if (this.isProcessingQueue || !this.speechQueue.length || !this.isCalling) return;
    const item = this.speechQueue.shift();
    this.isProcessingQueue = true;

    this.speakIndianVoice(item.text, () => {
      this.isProcessingQueue = false;
      if (this.speechQueue.length > 0) {
        this.processNextSpeech();
      } else {
        const isFemale = this.isFemaleAstrologer(this.activeAstrologer);
        this.updateStatus('listening', isFemale ? 'आप बोलिए, विदुषी जी सुन रही हैं... (Listening...)' : 'आप बोलिए, पंडित जी सुन रहे हैं... (Listening...)');
        if (item.onAllFinished) item.onAllFinished();
        this.initSpeechRecognition();
      }
    });
  },

  stopAllSpeech() {
    this.speechToken = (this.speechToken || 0) + 1;
    this.ttsAbortController?.abort();
    this.ttsAbortController = null;
    if (this.speechAudioUrl) URL.revokeObjectURL(this.speechAudioUrl);
    this.speechAudioUrl = null;
    this.speechQueue = [];
    this.isProcessingQueue = false;
    this.isSpeaking = false;
    this.lastQueuedSentence = '';
    this.ttsCache.clear();
    try { window.speechSynthesis?.cancel(); } catch (e) {}
    if (this.userSilenceTimer) {
      clearTimeout(this.userSilenceTimer);
      this.userSilenceTimer = null;
    }
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.src = '';
      } catch (e) {}
      this.currentAudio = null;
    }
    this.setWaveformActive(false);
  },

  // ---- Voice settings -------------------------------------------------
  voiceGender() {
    const g = this.voiceSettings.gender;
    return g === 'male' || g === 'female' ? g : (this.isFemaleAstrologer(this.activeAstrologer) ? 'female' : 'male');
  },

  voiceProsody() {
    const { speed, style } = this.voiceSettings;
    let rate = this.voiceGender() === 'female' ? -3 : -6;
    rate += speed === 'slow' ? -12 : speed === 'fast' ? 14 : 0;
    if (style === 'calm') rate -= 4;
    // Pitch offsets are rejected by the speech service intermittently, so only the rate varies.
    return { rate: `${rate >= 0 ? '+' : ''}${rate}%`, pitch: '+0Hz' };
  },

  applyVoiceSettings() {
    const val = id => document.getElementById(id)?.value;
    this.voiceSettings = {
      speed: val('call-voice-speed') || 'normal',
      style: val('call-voice-style') || 'calm',
      gender: val('call-voice-gender') || 'auto',
      outputId: val('call-output-device') || ''
    };
    try { localStorage.setItem('astro_call_voice', JSON.stringify(this.voiceSettings)); } catch (e) {}
    this.ttsCache.clear();
    this.fillerBlobs?.clear();
    this.prefetchFillers();
    if (this.currentAudio) this.routeAudioOutput(this.currentAudio);
  },

  loadVoiceSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem('astro_call_voice') || 'null');
      if (saved) this.voiceSettings = { ...this.voiceSettings, ...saved };
    } catch (e) {}
    const set = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
    set('call-voice-speed', this.voiceSettings.speed);
    set('call-voice-style', this.voiceSettings.style);
    set('call-voice-gender', this.voiceSettings.gender);
  },

  async populateAudioDevices() {
    const select = document.getElementById('call-output-device');
    if (!select || !navigator.mediaDevices?.enumerateDevices) return;
    try {
      const outputs = (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'audiooutput');
      select.innerHTML = '<option value="">Default</option>' + outputs
        .filter(d => d.deviceId && d.deviceId !== 'default')
        .map((d, i) => `<option value="${d.deviceId}">${(d.label || 'Speaker ' + (i + 1)).replace(/</g, '&lt;')}</option>`).join('');
      select.value = this.voiceSettings.outputId || '';
      select.disabled = !('setSinkId' in HTMLMediaElement.prototype);
    } catch (e) {}
  },

  routeAudioOutput(audio) {
    if (audio && this.voiceSettings.outputId && typeof audio.setSinkId === 'function') {
      audio.setSinkId(this.voiceSettings.outputId).catch(() => {});
    }
  },

  previewVoice() {
    if (!this.isCalling) return;
    this.stopRecognition();
    this.stopAllSpeech();
    const lang = this.responseLanguage || this.language();
    this.enqueueSentence(['hi', 'hinglish'].includes(lang)
      ? 'नमस्कार, मैं आपकी कुंडली देखकर आपको मार्गदर्शन दूँगा।'
      : 'Namaste, I will guide you after studying your birth chart.');
  },

  speechText(text, language) {
    if (language === 'en' || language === 'hinglish') {
      for (const [pattern, spoken] of this.PRONUNCIATIONS) text = text.replace(pattern, spoken);
    }
    return text;
  },

  // ---- Speech synthesis with look-ahead cache --------------------------
  ttsKey(text) {
    const { rate, pitch } = this.voiceProsody();
    return `${this.voiceGender()}|${rate}|${pitch}|${text}`;
  },

  fetchSpeech(text, signal) {
    const language = this.inferQuestionLanguage(text);
    const { rate, pitch } = this.voiceProsody();
    return API.synthesizeSpeech({
      text: this.speechText(text, language), gender: this.voiceGender(), language, rate, pitch
    }, signal);
  },

  fillerLines() {
    const lang = this.responseLanguage || this.astrologerLanguage(this.activeAstrologer) || this.language();
    return ['hi', 'hinglish', 'mr', 'gu', 'pa', 'bn'].includes(lang)
      ? ['जी…', 'हाँ जी, एक क्षण।', 'जी, देख रहा हूँ।'].map((t, i) => (i === 2 && this.isFemaleAstrologer(this.activeAstrologer)) ? 'जी, देख रही हूँ।' : t)
      : ['Yes…', 'One moment.', 'Let me see.'];
  },

  prefetchFillers() {
    this.fillerBlobs = this.fillerBlobs || new Map();
    this.fillerLines().forEach(line => {
      const key = this.ttsKey(line);
      if (this.fillerBlobs.has(key)) return;
      const promise = this.fetchSpeech(line);
      promise.catch(() => this.fillerBlobs.delete(key));
      this.fillerBlobs.set(key, promise);
    });
  },

  prefetchSpeech(text) {
    if (this.isSpeakerMuted || !this.isCalling) return;
    const key = this.ttsKey(text);
    if (this.ttsCache.has(key) || this.fillerBlobs?.has(key)) return;
    const promise = this.fetchSpeech(text);
    promise.catch(() => this.ttsCache.delete(key));
    this.ttsCache.set(key, promise);
  },

  async speakIndianVoice(text, onComplete) {
    if (!this.isCalling || this.isSpeakerMuted) { onComplete?.(); return; }
    const cleaned = this.cleanSpeechText(text);
    if (!cleaned) { onComplete?.(); return; }
    this.stopRecognition();
    const generation = this.callGeneration;
    const token = this.speechToken;
    const active = () => this.isCalling && generation === this.callGeneration && token === this.speechToken;
    const controller = new AbortController();
    this.ttsAbortController = controller;
    this.isSpeaking = true;
    this.updateStatus('speaking', this.callText('Your astrologer is speaking… (speak to interrupt)', 'ज्योतिषाचार्य बोल रहे हैं… (बीच में बोलकर रोक सकते हैं)'));
    let audio = null, audioUrl = null, timer = null, done = false;
    const finish = error => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (audio) {
        audio.onended = audio.onerror = null;
        audio.pause();
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (!active()) return;
      this.currentAudio = null;
      this.speechAudioUrl = null;
      this.ttsAbortController = null;
      this.isSpeaking = false;
      this.setWaveformActive(false);
      if (error && window.App?.showToast) {
        App.showToast(this.callText('Indian voice audio could not play. Check your connection and browser audio permission.', 'भारतीय स्वर नहीं चल पाया। इंटरनेट और ब्राउज़र की ऑडियो अनुमति जाँचें।'), 'warning');
      }
      onComplete?.();
    };
    timer = setTimeout(() => { controller.abort(); finish(new Error('Speech timed out')); }, Math.max(30000, cleaned.length * 180));
    try {
      const key = this.ttsKey(cleaned);
      const cached = this.ttsCache.get(key) || this.fillerBlobs?.get(key);
      this.ttsCache.delete(key);
      const blob = await (cached || this.fetchSpeech(cleaned, controller.signal));
      if (!active()) { clearTimeout(timer); return; }
      audioUrl = URL.createObjectURL(blob);
      audio = new Audio(audioUrl);
      this.routeAudioOutput(audio);
      this.currentAudio = audio;
      this.speechAudioUrl = audioUrl;
      audio.onended = () => finish();
      audio.onerror = () => finish(new Error('Audio playback failed'));
      this.setWaveformActive(true);
      await audio.play();
    } catch (error) {
      if (!navigator.onLine) this.setConnectionState(false);
      // Server voice unavailable: keep the conversation alive with the browser's own voice.
      if (active() && !audio && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(cleaned);
        utter.lang = this.locale();
        utter.rate = this.voiceSettings.speed === 'fast' ? 1.15 : this.voiceSettings.speed === 'slow' ? 0.85 : 1;
        utter.onend = utter.onerror = () => finish();
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utter);
        return;
      }
      finish(error);
    }
  },

  // ---- Barge-in: stop the astrologer when the caller starts talking ----
  async startBargeInMonitor() {
    if (this.bargeIn || !navigator.mediaDevices?.getUserMedia) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const monitor = { stopped: false };
    this.bargeIn = monitor;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      if (monitor.stopped) { stream.getTracks().forEach(t => t.stop()); return; }
      const ctx = new AudioCtx();
      const resume = () => { if (ctx.state === 'suspended') ctx.resume().catch(() => {}); };
      resume();
      ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, resume, { once: true, passive: true }));
      // Speech band only (ignores fan/desk rumble and hiss) so the level really means "someone is talking".
      const high = ctx.createBiquadFilter(); high.type = 'highpass'; high.frequency.value = 250;
      const low = ctx.createBiquadFilter(); low.type = 'lowpass'; low.frequency.value = 3400;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(high);
      high.connect(low); low.connect(analyser);
      const data = new Float32Array(analyser.fftSize);
      Object.assign(monitor, { stream, ctx });
      const recent = [];            // last ~2s of levels: the baseline is whatever the room + speaker echo normally measure
      let smooth = 0, loudSamples = 0;
      monitor.timer = setInterval(() => {
        resume();
        analyser.getFloatTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        smooth = smooth * 0.4 + Math.sqrt(sum / data.length) * 0.6;
        recent.push(smooth);
        if (recent.length > 50) recent.shift();
        const baseline = [...recent].sort((x, y) => x - y)[Math.floor(recent.length * 0.25)] || 0;
        const threshold = Math.max(0.018, baseline * 2.6 + 0.008);
        this.bargeDebug = { level: smooth, baseline, threshold };
        // Only while the astrologer is audibly talking; noise during "thinking" must never cancel a pending answer.
        const busy = this.isSpeaking || this.isProcessingQueue || this.speechQueue.length;
        if (!this.isCalling || this.isMuted || !busy) { loudSamples = 0; return; }
        loudSamples = smooth > threshold ? loudSamples + 1 : 0;
        if (loudSamples >= 6) { loudSamples = 0; this.interrupt(); }   // ~250ms of sustained voice
      }, 40);
    } catch (e) {
      this.bargeIn = null;
      // Permission may still be pending (speech recognition asks first); try again while the call is up.
      clearTimeout(this.bargeRetryTimer);
      if (this.isCalling && !this.isMuted) this.bargeRetryTimer = setTimeout(() => this.startBargeInMonitor(), 3000);
    }
  },

  stopBargeInMonitor() {
    clearTimeout(this.bargeRetryTimer);
    const monitor = this.bargeIn;
    this.bargeIn = null;
    if (!monitor) return;
    monitor.stopped = true;
    clearInterval(monitor.timer);
    monitor.stream?.getTracks().forEach(t => t.stop());
    try { monitor.ctx?.close(); } catch (e) {}
  },

  // Recovers from stuck states (a hung answer or audio) so the call never sits on "listening" forever.
  startWatchdog() {
    clearInterval(this.watchdogTimer);
    this.watchdogTimer = setInterval(() => {
      if (!this.isCalling) return;
      const now = Date.now();
      if (this.isResponding && this.responseStartedAt && now - this.responseStartedAt > 30000) {
        this.turnId++;
        this.isResponding = false;
        this.stopAllSpeech();
      }
      if (this.isSpeaking && this.currentAudio && this.currentAudio.ended) {
        this.isSpeaking = false;
        this.isProcessingQueue = false;
      }
      if (this.canListen() && !this.recognition && !this.isManualMicActive) this.initSpeechRecognition();
    }, 1500);
  },

  interrupt() {
    if (!this.isCalling || !(this.isSpeaking || this.isProcessingQueue || this.speechQueue.length)) return;
    this.turnId++;               // cancels the in-flight answer stream
    clearTimeout(this.fillerTimer);
    this.stopAllSpeech();
    this.isResponding = false;
    this.updateStatus('listening', this.callText('Go ahead — I am listening.', 'जी, बोलिए — मैं सुन रहा हूँ।'));
    this.initSpeechRecognition();
  },

  // ---- Connection handling --------------------------------------------
  setConnectionState(online) {
    const chip = document.getElementById('call-net-chip');
    if (chip) {
      chip.className = 'calling-net-chip ' + (online ? 'online' : 'offline');
      chip.textContent = online ? '● Connected' : '● Reconnecting…';
    }
  },

  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.recognition = null;
    this.isListening = false;
    this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
    if (this.reconnectAttempts > 6) {
      this.micBlocked = true;
      this.updateStatus('muted', this.callText('Connection problem. Tap Speak to try again.', 'कनेक्शन में समस्या है। फिर से बोलने वाला बटन दबाएँ।'));
      return;
    }
    this.setConnectionState(false);
    this.updateStatus('connecting', this.callText('Reconnecting…', 'फिर से जुड़ रहे हैं…'));
    this.reconnectTimer = setTimeout(() => {
      if (!this.isCalling) return;
      this.initSpeechRecognition();
    }, Math.min(1000 * this.reconnectAttempts, 5000));
  },

  onNetworkOnline() {
    const self = CallingAgentService;
    if (!self.isCalling) return;
    self.reconnectAttempts = 0;
    self.micBlocked = false;
    self.setConnectionState(true);
    self.initSpeechRecognition();
  },

  onNetworkOffline() {
    const self = CallingAgentService;
    if (!self.isCalling) return;
    self.setConnectionState(false);
    self.stopRecognition();
    self.updateStatus('muted', self.callText('Internet disconnected. Reconnecting when it returns…', 'इंटरनेट बंद है। वापस आते ही फिर जुड़ेंगे…'));
  },

  // ---- Kundli awareness & call summary --------------------------------
  needsBirthChart(text) {
    if (window.App?.currentChart) return false;
    return /(मेरी|मेरा|मेरे|मुझे|my |mujhe|meri|mera|mere|will i|when will|कब होगी|कब होगा|कब मिलेगी|कब मिलेगा)/i.test(text) &&
      /(शादी|विवाह|करियर|नौकरी|धन|स्वास्थ्य|कुंडली|साढ़ेसाती|राजयोग|दशा|marriage|career|job|health|wealth|kundli|dasha|sade ?sati|rajyog|shaadi|naukri)/i.test(text);
  },

  // True when a turn looks like it is supplying a date, time or place (not necessarily a question) -
  // used so a reply like "2 March 2004" or "12 baje aur Maharajganj" is picked up for chart-building
  // even though it contains no "will I get married" style trigger phrase on its own.
  looksLikeBirthInfo(text) {
    const t = text || '';
    return /\b(19|20)\d{2}\b/.test(t) ||
      /\d{1,2}\s*[:.]\s*\d{2}\b/.test(t) ||
      /\d{1,2}\s*(baje|बजे|am|pm|a\.?m\.?|p\.?m\.?)\b/i.test(t) ||
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/i.test(t) ||
      /(जनवरी|फरवरी|मार्च|अप्रैल|मई|जून|जुलाई|अगस्त|सितंबर|सितम्बर|अक्टूबर|नवंबर|नवम्बर|दिसंबर|दिसम्बर)/.test(t) ||
      /(janm|जन्म|date of birth|\bdob\b|paida|पैदा|birth\s*(date|time|place))/i.test(t);
  },

  // Builds the Kundli straight from what the caller has said on this call (possibly given across
  // several turns), instead of asking them to fill a form. Returns the chart, or null if some
  // detail is still missing (this._lastExtractedBirthDetails then holds whatever was understood).
  async tryAutoCreateChartFromCall() {
    if (window.App?.currentChart) return window.App.currentChart;
    const consultationId = ChatController.activeConsultation?.id || ChatController.currentSessionId || 'live-call';
    const transcript = (this.callLog?.transcript || []).slice(-24).join('\n');
    if (!transcript.trim()) { this._lastExtractedBirthDetails = null; return null; }
    try {
      const details = await API.extractBirthDetails(consultationId, transcript);
      this._lastExtractedBirthDetails = details;
      if (!details || !details.complete) return null;
      const userName = (window.App && window.App.currentUser && window.App.currentUser.full_name) || 'Seeker';
      const chart = await API.calculateChart({
        name: userName,
        date_of_birth: details.date_of_birth,
        time_of_birth: details.time_of_birth || '12:00',
        is_time_approximate: !details.time_of_birth,
        city: details.place || '',
        country: details.country || 'India',
        latitude: details.latitude,
        longitude: details.longitude,
        timezone_offset: details.timezone_offset != null ? details.timezone_offset : 5.5
      });
      window.App.currentChart = chart;
      window.App.rememberMyChartId?.(chart.id);
      ChatController.activeChartId = chart.id;
      try {
        window.App.updateActiveProfileUI?.(chart);
        window.App.loadSavedProfiles?.();
      } catch (e) { /* non-critical UI refresh */ }
      return chart;
    } catch (e) {
      console.warn('Auto chart creation from call failed:', e);
      return null;
    }
  },

  // Names only whichever birth-detail piece is still missing, instead of re-asking for everything.
  buildMissingDetailsPrompt(details, isFemale) {
    const d = details || {};
    const missing = [];
    if (!d.date_of_birth) missing.push(this.responseText('date of birth', 'जन्म तिथि'));
    if (!d.time_of_birth) missing.push(this.responseText('time of birth', 'जन्म का समय'));
    if (!d.place) missing.push(this.responseText('place of birth', 'जन्म स्थान'));
    if (!missing.length) {
      return this.responseText(
        "I could not place that city precisely — could you also tell me the state, or a nearby bigger city?",
        'मुझे वह स्थान ठीक से समझ नहीं आया — कृपया राज्य या पास के किसी बड़े शहर का नाम भी बताएं।');
    }
    const list = missing.join(this.responseText(' and ', ' और '));
    return this.responseText(
      `I have noted what you shared. I just also need your ${list} to prepare your chart.`,
      `मैंने आपकी बताई जानकारी नोट कर ली है। कुंडली बनाने के लिए मुझे आपका ${list} भी चाहिए।`);
  },

  // Switches to another saved profile mid-call when the caller names one (e.g. "meri patni ki
  // kundli dekhiye", "doosra profile", or the profile's own saved name). Returns the chart or null.
  async trySwitchProfile(text) {
    const clean = (text || '').toLowerCase().trim();
    try {
      // Only ever switch among profiles this browser itself created/opened (window.App.savedCharts
      // is already scoped that way) — never the unrelated global "recent charts" feed.
      const charts = window.App?.savedCharts || [];
      if (!Array.isArray(charts) || charts.length < 2) return null;
      const currentId = window.App?.currentChart?.id;
      // Either a generic switch phrase ("doosra profile", "patni ki kundli") or another saved
      // profile's own name mentioned together with a chart/kundli word ("Priya Sharma ki kundli").
      const genericSwitch = /(doosra|dusra|दूसरा|दूसरी|another profile|switch profile|profile badal|badal do|change profile|किसी और|अन्य)\s*(profile|kundli|कुंडली|प्रोफाइल)?/i.test(clean) ||
        /(patni|pati|beti|beta|wife|husband|son|daughter|माता|पिता|पत्नी|पति|बेटी|बेटा) (ki|ke|का|की) (kundli|कुंडली)/i.test(clean);
      const mentionsChartWord = /(kundli|कुंडली|profile|प्रोफाइल|chart|janm|जन्म)/i.test(clean);
      const byName = charts.find(c => c.id !== currentId && c.name && clean.includes(c.name.toLowerCase()) && mentionsChartWord);
      if (!genericSwitch && !byName) return null;
      const next = byName || charts.find(c => c.id !== currentId);
      if (!next) return null;
      const chart = await API.getChartById(next.id);
      window.App.currentChart = chart;
      window.App.rememberMyChartId?.(chart.id);
      ChatController.activeChartId = chart.id;
      try { window.App.updateActiveProfileUI?.(chart); window.App.loadSavedProfiles?.(); } catch (e) {}
      return chart;
    } catch (e) {
      console.warn('Profile switch during call failed:', e);
      return null;
    }
  },

  extractRemedies(text) {
    return (text || '').split(/(?<=[।.!?])\s+/).map(s => s.trim()).filter(s =>
      s.length > 8 && /(उपाय|मंत्र|जप|दान|पूजा|व्रत|रत्न|remed|mantra|donat|puja|fast|gemstone|upay)/i.test(s));
  },

  logCallTurn(question, answer) {
    if (!this.callLog) return;
    this.callLog.turns.push({ q: question, a: answer, at: Date.now() });
    this.callLog.transcript = this.callLog.transcript || [];
    this.callLog.transcript.push(`Astrologer: ${answer}`);
    for (const r of this.extractRemedies(answer)) if (!this.callLog.remedies.includes(r)) this.callLog.remedies.push(r);
  },

  buildCallSummary() {
    const log = this.callLog;
    if (!log || (!log.turns.length && !log.pending.length)) return '';
    const hi = ['hi', 'hinglish'].includes(this.responseLanguage || this.language());
    const brief = t => { t = this.cleanSpeechText(t); return t.length > 220 ? t.slice(0, 217) + '…' : t; };
    const out = [`**${hi ? 'कॉल सारांश' : 'Call summary'}** — ${this.activeAstrologer?.name || ''} (${document.getElementById('call-timer-display')?.textContent || ''})`];
    const stamp = t => {
      if (!t.at || !this.callStartedAt) return '';
      const s = Math.max(0, Math.round((t.at - this.callStartedAt) / 1000));
      return `[${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}] `;
    };
    if (log.turns.length) {
      out.push(`\n**${hi ? 'मुख्य प्रश्न और उत्तर' : 'Key questions and answers'}**`);
      log.turns.forEach((t, i) => out.push(`${i + 1}. ${stamp(t)}${hi ? 'प्रश्न' : 'Q'}: ${brief(t.q)}\n   ${hi ? 'उत्तर' : 'A'}: ${brief(t.a)}`));
    }
    if (log.remedies.length) {
      out.push(`\n**${hi ? 'बताए गए उपाय' : 'Remedies suggested'}**`);
      log.remedies.slice(0, 8).forEach(r => out.push(`- ${brief(r)}`));
    }
    if (log.pending.length) {
      out.push(`\n**${hi ? 'बाकी जानकारी' : 'Pending details'}**`);
      log.pending.forEach(p => out.push(`- ${p}`));
    }
    return out.join('\n');
  },

  async handleUserVoiceInput(text) {
    if (!text || !this.isCalling || this.isResponding) return;
    const generation = this.callGeneration;
    const turn = ++this.turnId;
    this.responseStartedAt = Date.now();
    const stale = () => !this.isCalling || generation !== this.callGeneration || turn !== this.turnId;
    this.isResponding = true;
    this.userLanguage = this.inferQuestionLanguage(text);
    this.responseLanguage = this.replyLanguage(text);
    this.stopRecognition();
    this.isManualMicActive = false;
    this.updateMicButton();
    const isFemale = this.isFemaleAstrologer(this.activeAstrologer);
    ChatController.appendMessage('user', text);

    // Running transcript for birth-detail extraction and the call summary, independent of whether
    // a turn reaches the LLM (it may be intercepted by the scope or birth-details gate below).
    if (this.callLog) this.callLog.transcript = this.callLog.transcript || [];
    const logLine = (speaker, line) => { if (this.callLog) this.callLog.transcript.push(`${speaker}: ${line}`); };
    logLine('Seeker', text);

    // Sync Mini Kundli Wheel with inquiry
    this.syncBhavaWithText(text);

    // Temporarily pause recognition while agent responds
    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
    }
    this.stopAllSpeech();

    // 1. Strict Scope Guard: Intercept Out-Of-Scope questions before streaming
    const refusedNow = this.isQueryOutOfScope(text) || (this.lastRefused && this.isInsistingFollowUp(text));
    this.lastRefused = refusedNow;
    if (refusedNow) {
      this.updateStatus('declined', 'शास्त्र परिधि से बाहर (Out of Scope)');

      const refusalText = this.responseLanguage === 'en' ? 'I can help with Vedic astrology, birth charts, career, marriage and planetary transits. Please ask a question about these topics.' : isFemale
        ? 'यजमान, मैं केवल वैदिक ज्योतिष, कुण्डली एवं ग्रह गोचर के शास्त्रीय मार्गदर्शन के लिए उपस्थित हूँ। यह प्रश्न ज्योतिष शास्त्र की परिधि से बाहर है। कृपया अपने जीवन, करियर अथवा विवाह संबंधित प्रश्न पूछें।'
        : 'यजमान, मैं एक वैदिक ज्योतिषाचार्य हूँ। यह प्रश्न ज्योतिष शास्त्र एवं ग्रह गोचर की परिधि से बाहर का है। कृपया अपने जीवन, करियर, विवाह, स्वास्थ्य अथवा शास्त्रीय ग्रह शांति से संबंधित प्रश्न पूछें।';

      ChatController.appendMessage('assistant', refusalText);
      logLine('Astrologer', refusalText);
      this.setPanditCaption(refusalText);
      this.isResponding = false;
      this.enqueueSentence(refusalText, () => {
        if (this.isCalling && !this.isMuted) {
          this.initSpeechRecognition();
        }
      });
      return;
    }

    // 2. Switch saved profile mid-call, by name ("meri patni ki kundli", "dusra profile", astrologer's own name)
    const switchedChart = await this.trySwitchProfile(text);
    if (switchedChart) {
      const switchedMsg = this.responseText(
        `Switched to ${switchedChart.name}'s birth chart.`,
        `${switchedChart.name} की कुंडली पर जा रहे हैं।`);
      ChatController.appendMessage('assistant', switchedMsg);
      logLine('Astrologer', switchedMsg);
      this.setPanditCaption(switchedMsg);
      this.isResponding = false;
      this.enqueueSentence(switchedMsg, () => {
        if (this.isCalling && !this.isMuted) this.initSpeechRecognition();
      });
      return;
    }

    // A real question needing a chart (needsBirthChart) always triggers the gate; a turn that simply
    // supplies birth info (a date, a time, a city) must trigger it too, even with no topic keyword -
    // otherwise details given in reply to "what is your DOB?" never reach the chart-building step.
    const isRealQuestion = this.needsBirthChart(text);
    const supplyingBirthInfo = !window.App?.currentChart && this.looksLikeBirthInfo(text);
    if (isRealQuestion || supplyingBirthInfo) {
      this.updateStatus('analyzing', isFemale ? 'विदुषी जी आपका जन्म विवरण जाँच रही हैं...' : 'पंडित जी आपका जन्म विवरण जाँच रहे हैं...');
      const chart = await this.tryAutoCreateChartFromCall();
      if (chart) {
        const ready = this.responseText(
          isRealQuestion
            ? `Thank you — your birth details are noted and your chart is ready (${chart.city || chart.name}).`
            : `Thank you — your chart is ready (${chart.city || chart.name}). What would you like to know?`,
          isRealQuestion
            ? `धन्यवाद — आपकी जन्म जानकारी नोट कर ली है और कुंडली तैयार है (${chart.city || chart.name})।`
            : `धन्यवाद — आपकी कुंडली तैयार है (${chart.city || chart.name})। अब बताइए, आप क्या जानना चाहते हैं?`);
        ChatController.appendMessage('assistant', ready);
        logLine('Astrologer', ready);
        this.setPanditCaption(ready);
        this.enqueueSentence(ready, () => { if (this.isCalling && !this.isMuted) this.initSpeechRecognition(); });
        if (!isRealQuestion) { this.isResponding = false; return; }
        // isRealQuestion: fall through and answer the caller's original question, using this chart.
      } else if (supplyingBirthInfo || isRealQuestion) {
        const ask = this.buildMissingDetailsPrompt(this._lastExtractedBirthDetails, isFemale);
        const pend = this.responseText('Birth date, time and place needed for a chart-based answer', 'कुंडली आधारित उत्तर के लिए जन्म तिथि, समय और स्थान चाहिए');
        if (this.callLog && !this.callLog.pending.includes(pend)) this.callLog.pending.push(pend);
        ChatController.appendMessage('assistant', ask);
        logLine('Astrologer', ask);
        this.setPanditCaption(ask);
        this.isResponding = false;
        this.enqueueSentence(ask, () => { if (this.isCalling && !this.isMuted) this.initSpeechRecognition(); });
        return;
      }
    }

    this.updateStatus('analyzing', isFemale ? 'विदुषी जी जन्म कुण्डली व ग्रह गणना कर रही हैं...' : 'पंडित जी जन्म कुण्डली व ग्रह गणना कर रहे हैं...');

    try {

      // Back-channel like a person on the phone: a short "ji…" if the answer takes a moment, more if it takes longer.
      clearTimeout(this.fillerTimer);
      const fillers = this.fillerLines();
      const speakFiller = (n) => {
        if (stale() || this.isSpeaking || this.speechQueue.length || n >= fillers.length) return;
        this.enqueueSentence(fillers[n]);
        this.lastQueuedSentence = '';
        this.fillerTimer = setTimeout(() => speakFiller(n + 1), 4500);
      };
      this.fillerTimer = setTimeout(() => speakFiller(0), 1400);

      const targetConsId = (this.activeAstrologer && (this.activeAstrologer.id || this.activeAstrologer.slug)) || 'pt-rameshwar-dwivedi';
      const consultationId = ChatController.activeConsultation?.id || ChatController.currentSessionId || targetConsId;
      const chartId = (window.App && window.App.currentChart) ? window.App.currentChart.id : null;
      const userName = (window.App && window.App.currentUser && window.App.currentUser.full_name) || 'Seeker';

      let accumulatedAnswer = '';
      let sentenceBuffer = '';
      let hasStartedSpeaking = false;

      // Stream the response in real-time
      if (API.streamConsultationSession) {
        await API.streamConsultationSession(
          consultationId,
          {
            consultation_id: consultationId,
            chart_id: chartId,
            user_name: userName,
            message: text,
            language: this.responseLanguage,
            call_mode: true,
            astrologer_id: targetConsId,
            force_demo_mode: false
          },
          (sessionData) => {
            if (stale()) return;
            if (sessionData.consultation_id) ChatController.currentSessionId = sessionData.consultation_id;
          },
          (delta) => {
            if (stale()) return;
            clearTimeout(this.fillerTimer);
            accumulatedAnswer += delta;
            sentenceBuffer += delta;
            this.setPanditCaption(accumulatedAnswer);
            this.syncBhavaWithText(accumulatedAnswer);

            // Real-time chunking: As soon as a sentence ends with ।, ?, !, or newline
            const match = sentenceBuffer.match(/^(.*?([।?!]|\n\n|\.\s+))(.*)$/s);
            if (match) {
              const sentenceToSpeak = match[1].trim();
              sentenceBuffer = match[3] || '';
              if (sentenceToSpeak.length > 2) {
                hasStartedSpeaking = true;
                this.enqueueSentence(sentenceToSpeak);
              }
            } else if (!hasStartedSpeaking) {
              // Start talking on the first natural pause instead of waiting for a full sentence.
              const early = sentenceBuffer.match(/^(.{18,}?[,;:\u0964-])\s+(.*)$/s) || (sentenceBuffer.length > 90 ? sentenceBuffer.match(/^(.{60,}?)\s+(.*)$/s) : null);
              if (early) {
                hasStartedSpeaking = true;
                sentenceBuffer = early[2] || '';
                this.enqueueSentence(early[1].trim());
              }
            }
          },
          (doneData) => {
            if (stale()) return;
            const finalFullText = doneData.content || accumulatedAnswer;
            this.logCallTurn(text, finalFullText);
            ChatController.appendMessage('assistant', finalFullText);
            this.setPanditCaption(finalFullText);
            this.syncBhavaWithText(finalFullText);

            // Flush remaining buffer
            if (sentenceBuffer.trim()) {
              this.enqueueSentence(sentenceBuffer.trim(), () => {
                if (this.isCalling && !this.isMuted) {
                  this.initSpeechRecognition();
                }
              });
            } else if (!hasStartedSpeaking) {
              this.enqueueSentence(finalFullText, () => {
                if (this.isCalling && !this.isMuted) {
                  this.initSpeechRecognition();
                }
              });
            } else {
              if (this.speechQueue.length > 0) {
                this.speechQueue[this.speechQueue.length - 1].onAllFinished = () => {
                  if (this.isCalling && !this.isMuted) {
                    this.initSpeechRecognition();
                  }
                };
              } else if (!this.isProcessingQueue) {
                if (this.isCalling && !this.isMuted) {
                  this.initSpeechRecognition();
                }
              }
            }
          },
          async (err) => {
            if (stale()) return;
            console.warn('Voice streaming fallback to standard API:', err);
            const res = await API.sendMessage({
              session_id: ChatController.currentSessionId,
              chart_id: chartId,
              user_name: userName,
              message: text,
              language: this.responseLanguage,
              astrologer_id: targetConsId,
              force_demo_mode: false
            });
            if (stale()) return;
            const replyText = res.content || this.responseText('Please repeat your question.', 'कृपया अपना प्रश्न दोहराएँ।');
            ChatController.appendMessage('assistant', replyText);
            this.setPanditCaption(replyText);
            this.syncBhavaWithText(replyText);
            this.enqueueSentence(replyText, () => {
              if (this.isCalling && !this.isMuted) {
                this.initSpeechRecognition();
              }
            });
          }
        );
      } else {
        const res = await API.sendMessage({
          session_id: ChatController.currentSessionId,
          chart_id: chartId,
          user_name: userName,
          message: text,
          language: this.responseLanguage,
          astrologer_id: targetConsId,
          force_demo_mode: false
        });
        if (stale()) return;
        const replyText = res.content || this.responseText('Please repeat your question.', 'कृपया अपना प्रश्न दोहराएँ।');
        ChatController.appendMessage('assistant', replyText);
        this.setPanditCaption(replyText);
        this.syncBhavaWithText(replyText);
        this.enqueueSentence(replyText, () => {
          if (this.isCalling && !this.isMuted) {
            this.initSpeechRecognition();
          }
        });
      }
    } catch (err) {
      if (stale()) return;
      console.error('Call query failed:', err);
      const fallbackMsg = this.responseText('I could not retrieve the answer. Please repeat your question.', 'उत्तर प्राप्त नहीं हुआ। कृपया अपना प्रश्न दोहराएँ।');
      this.setPanditCaption(fallbackMsg);
      this.enqueueSentence(fallbackMsg, () => {
        if (this.isCalling && !this.isMuted) {
          this.initSpeechRecognition();
        }
      });
    } finally {
      if (generation === this.callGeneration && turn === this.turnId) {
        this.isResponding = false;
        this.initSpeechRecognition();
      }
    }
  },

  speakPanditVoice(text, onComplete) {
    this.stopAllSpeech();
    this.enqueueSentence(text, onComplete);
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('btn-call-mute');
    const icon = document.getElementById('call-mic-icon');
    const label = document.getElementById('call-mic-label');

    if (this.isMuted) {
      if (icon) icon.textContent = '🔇';
      if (label) label.textContent = 'Unmute';
      if (btn) btn.classList.add('active-ctrl');
      this.stopRecognition();
      this.stopBargeInMonitor();
      this.updateStatus('muted', 'माइक्रोफ़ोन म्यूट है (Microphone Muted)');
    } else {
      if (icon) icon.textContent = '🎙️';
      if (label) label.textContent = 'Mute';
      if (btn) btn.classList.remove('active-ctrl');
      this.micBlocked = false;
      this.startBargeInMonitor();
      this.initSpeechRecognition();
    }
  },

  toggleSpeaker() {
    this.isSpeakerMuted = !this.isSpeakerMuted;
    const btn = document.getElementById('btn-call-speaker');
    const icon = document.getElementById('call-speaker-icon');
    const label = document.getElementById('call-speaker-label');

    if (this.isSpeakerMuted) {
      if (icon) icon.textContent = '🔈';
      if (label) label.textContent = 'Speaker Off';
      if (btn) btn.classList.add('active-ctrl');
      this.stopAllSpeech();
      this.initSpeechRecognition();
    } else {
      if (icon) icon.textContent = '🔊';
      if (label) label.textContent = 'Speaker';
      if (btn) btn.classList.remove('active-ctrl');
    }
  },

  endCall(opts = {}) {
    if (!this.isCalling) return;
    const summary = this.buildCallSummary();
    clearTimeout(this.fillerTimer);
    clearInterval(this.watchdogTimer);
    this.setUserCaption('');
    this.setPanditCaption('');
    this.isCalling = false;
    this.callGeneration = (this.callGeneration || 0) + 1;
    this.turnId++;
    this.isResponding = false;
    clearTimeout(this.greetingTimer);
    clearTimeout(this.reconnectTimer);
    window.removeEventListener('online', this.onNetworkOnline);
    window.removeEventListener('offline', this.onNetworkOffline);
    this.stopBargeInMonitor();
    if (summary) ChatController.appendMessage('assistant', summary);
    this.callLog = null;
    this.stopRecognition();
    if (this.mediaStream) this.mediaStream.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    this.stopVedicAmbience();
    this.stopAllSpeech();
    this.isSpeaking = false;
    this.isListening = false;

    if (this.callTimerInterval) {
      clearInterval(this.callTimerInterval);
      this.callTimerInterval = null;
    }

    if (this.recognition) {
      try { this.recognition.stop(); } catch (e) {}
      this.recognition = null;
    }

    const modal = document.getElementById('modal-live-audio-call');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('active');
    }

    if (opts.silent) return;
    if (window.App && window.App.showToast) {
      window.App.showToast('Call completed. Your consultation notes are saved in chat. 📞✨', 'success');
    }

    // Automatically prompt the Royal Vedic Astro-Dossier (PDF Report)
    const generation = this.callGeneration;
    setTimeout(() => {
      if (this.isCalling || generation !== this.callGeneration) return;
      this.showPostCallDossierModal();
    }, 600);
  },

  // 432Hz Vedic Ambience Soundscape Synthesizer
  ambienceAudioCtx: null,
  ambienceOscs: [],
  ambienceGain: null,
  isAmbiencePlaying: false,

  toggleVedicAmbience() {
    if (this.isAmbiencePlaying) {
      this.stopVedicAmbience();
    } else {
      this.startVedicAmbience();
    }
  },

  startVedicAmbience() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!this.ambienceAudioCtx) {
        this.ambienceAudioCtx = new AudioCtx();
      }
      if (this.ambienceAudioCtx.state === 'suspended') {
        this.ambienceAudioCtx.resume();
      }

      this.ambienceGain = this.ambienceAudioCtx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.01, this.ambienceAudioCtx.currentTime);
      this.ambienceGain.gain.exponentialRampToValueAtTime(0.16, this.ambienceAudioCtx.currentTime + 1.2);
      this.ambienceGain.connect(this.ambienceAudioCtx.destination);

      // Sacred 432Hz Solfeggio series (Tambura emulation)
      const freqs = [108, 216, 432, 648];
      this.ambienceOscs = freqs.map((f, idx) => {
        const osc = this.ambienceAudioCtx.createOscillator();
        osc.type = idx === 0 ? 'sine' : (idx === 1 ? 'triangle' : 'sine');
        osc.frequency.setValueAtTime(f, this.ambienceAudioCtx.currentTime);
        if (idx > 0) osc.detune.setValueAtTime((idx % 2 === 0 ? 3 : -3), this.ambienceAudioCtx.currentTime);
        osc.connect(this.ambienceGain);
        osc.start();
        return osc;
      });

      this.isAmbiencePlaying = true;
      const icon = document.getElementById('nav-ambience-icon');
      const label = document.getElementById('nav-ambience-label');
      const btn = document.getElementById('btn-nav-ambience');
      if (icon) icon.textContent = '⏹️';
      if (label) label.textContent = 'नाद चालू';
      if (btn) {
        btn.classList.add('bg-amber-100', 'border-amber-500', 'shadow-md');
        btn.style.boxShadow = '0 0 12px rgba(245, 158, 11, 0.4)';
      }
      if (window.App && window.App.showToast) {
        window.App.showToast('वैदिक 432Hz शांति नाद सक्रिय (432Hz Ambience Active) 🕉️', 'info');
      }
    } catch (e) {
      console.warn('Vedic Ambience error:', e);
    }
  },

  stopVedicAmbience() {
    if (this.ambienceGain && this.ambienceAudioCtx) {
      try {
        this.ambienceGain.gain.exponentialRampToValueAtTime(0.001, this.ambienceAudioCtx.currentTime + 0.6);
        setTimeout(() => {
          this.ambienceOscs.forEach(o => { try { o.stop(); } catch(e){} });
          this.ambienceOscs = [];
          this.isAmbiencePlaying = false;
        }, 650);
      } catch(e) {
        this.ambienceOscs = [];
        this.isAmbiencePlaying = false;
      }
    } else {
      this.isAmbiencePlaying = false;
    }
    const icon = document.getElementById('nav-ambience-icon');
    const label = document.getElementById('nav-ambience-label');
    const btn = document.getElementById('btn-nav-ambience');
    if (icon) icon.textContent = '🕉️';
    if (label) label.textContent = '432Hz नाद';
    if (btn) {
      btn.classList.remove('bg-amber-100', 'border-amber-500', 'shadow-md');
      btn.style.boxShadow = '';
    }
  },

  // In-Call Palmistry / Kundli Snapshot Upload
  onPalmPhotoUpload(event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;

    if (window.App && window.App.showToast) {
      window.App.showToast('हस्तरेखा / पत्रिका फोटो प्राप्त हुई। विश्लेषण प्रारंभ...', 'success');
    }

    const isFemale = this.isFemaleAstrologer(this.activeAstrologer);
    const ack = isFemale
      ? 'यजमान, आपकी हस्तरेखा एवं जन्म पत्रिका की छायाप्रति प्राप्त हो गई है। मैं इसके मुख्य पर्वतों, जीवन रेखा एवं ग्रह चिह्नों का सूक्ष्म निरीक्षण कर रही हूँ...'
      : 'यजमान, आपकी हस्तरेखा एवं पत्रिका का चित्र मेरे सम्मुख है। गुरु पर्वत एवं सूर्य रेखा की स्थिति अत्यंत शुभ दृष्टिगोचर हो रही है...';

    this.setPanditCaption(ack);
    this.enqueueSentence(ack);
  },

  // Post-Call Royal Vedic Astro-Dossier Modal
  showPostCallDossierModal() {
    const modal = document.getElementById('modal-post-call-dossier');
    if (!modal) return;

    const panditEl = document.getElementById('dossier-pandit-name');
    if (panditEl && this.activeAstrologer) {
      panditEl.textContent = this.activeAstrologer.name;
    }
    modal.classList.add('active');
  },

  closePostCallDossierModal() {
    const modal = document.getElementById('modal-post-call-dossier');
    if (modal) modal.classList.remove('active');
  },

  // Client-Side PDF Generation using jsPDF (100% Free)
  downloadAstroDossierPDF() {
    try {
      const { jsPDF } = window.jspdf || {};
      if (!jsPDF) {
        window.print();
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const panditName = (this.activeAstrologer && this.activeAstrologer.name) || 'Pt. Rameshwar Dwivedi';
      const seekerName = (window.App && window.App.currentUser && window.App.currentUser.full_name) || 'Satya';
      const dateStr = new Date().toLocaleDateString('hi-IN', { year: 'numeric', month: 'long', day: 'numeric' });

      // Page Border (Royal Gold)
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(1.2);
      doc.rect(8, 8, 194, 281);
      doc.setLineWidth(0.4);
      doc.rect(10, 10, 190, 277);

      // Header
      doc.setTextColor(180, 83, 9);
      doc.setFontSize(14);
      doc.text("|| OM SHREE GANESHAYA NAMAH ||", 105, 20, { align: 'center' });

      doc.setTextColor(30, 27, 75);
      doc.setFontSize(20);
      doc.text("ASTRO JYOTISH VEDIC CONSULTATION DOSSIER", 105, 30, { align: 'center' });

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Certificate No: AJ-${Date.now().toString().slice(-6)} | Date: ${dateStr} | Muhurat: Amrit Vela`, 105, 36, { align: 'center' });

      doc.setDrawColor(231, 226, 216);
      doc.line(15, 42, 195, 42);

      // Seeker & Astrologer Info Box
      doc.setFillColor(254, 243, 199);
      doc.rect(15, 48, 180, 24, 'F');
      doc.setTextColor(33, 29, 80);
      doc.setFontSize(11);
      doc.text(`Seeker: ${seekerName}`, 20, 56);
      doc.setFontSize(9);
      doc.text("Lagna: Kumbha (Aquarius) | Rashi: Vrishabha | Nakshatra: Rohini", 20, 63);

      doc.setFontSize(11);
      doc.text(`Consultant Astrologer: ${panditName}`, 120, 56);
      doc.setFontSize(9);
      doc.setTextColor(180, 83, 9);
      doc.text("Gold Medalist | Senior Vedic Scholar, Kashi", 120, 63);

      // Consultation Analysis
      doc.setFontSize(13);
      doc.setTextColor(30, 27, 75);
      doc.text("1. Key Bhavas Analyzed & Planetary Transits", 20, 82);

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text("• 7th House (Jaya / Marriage):", 22, 92);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("  Jupiter aspecting the 7th house brings auspicious matrimonial developments after October.", 25, 98);

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text("• 10th House (Karma / Career & Wealth):", 22, 110);
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("  Mars transit indicates favorable career transformation and strong financial gains.", 25, 116);

      // Prescribed Vedic Remedies
      doc.setFontSize(13);
      doc.setTextColor(30, 27, 75);
      doc.text("2. Prescribed Vedic Remedies & Anushthan", 20, 134);

      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("• Daily Mantra Japa: 'Om Brim Brihaspataye Namah' - 108 times facing East every morning.", 25, 144);
      doc.text("• Auspicious Charity (Daan): Yellow gram lentils (Chana Dal) & turmeric on Thursdays.", 25, 154);
      doc.text("• Rudraksha Recommendation: 5 Mukhi or 11 Mukhi Nepali Rudraksha purified in Ganga water.", 25, 164);

      // Official Stamp / Seal
      doc.setDrawColor(180, 83, 9);
      doc.setLineWidth(1);
      doc.circle(50, 220, 18);
      doc.circle(50, 220, 15);
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text("KASHI VIDYAPEETH", 50, 218, { align: 'center' });
      doc.text("VEDIC SEAL", 50, 224, { align: 'center' });

      doc.setFontSize(11);
      doc.setTextColor(30, 27, 75);
      doc.text(panditName, 150, 220, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Certified Vedic Astrologer, Varanasi", 150, 226, { align: 'center' });

      // Save PDF
      doc.save(`AstroJyotish_Vedic_Consultation_${seekerName}.pdf`);

      if (window.App && window.App.showToast) {
        window.App.showToast('वैदिक परामर्श पत्रिका (PDF) सफलतापूर्वक डाउनलोड हो गई! 📜✨', 'success');
      }
      this.closePostCallDossierModal();
    } catch (e) {
      console.error('PDF generation error:', e);
      if (window.App && window.App.showToast) {
        window.App.showToast('PDF डाउनलोड तैयार हो रहा है... कृपया पुनः प्रयास करें।', 'info');
      }
    }
  }
};

// Expose ChatController globally for HTML onclick handlers and cross-module access
window.ChatController = ChatController;
window.CallingAgentService = CallingAgentService;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatController;
}

