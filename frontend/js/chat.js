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
  selectedAstrologer: localStorage.getItem('astroai_astrologer') || 'acharya_shastri',
  astrologers: [],

  init() {
    this.bindEvents();
    this.loadSessions();
    this.renderIntakeSavedChips();
    this.loadAstrologers();
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
    if (dobInput) dobInput.value = '';
    if (tobInput) tobInput.value = '';
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
      if (dobInput) dobInput.value = chart.date_of_birth || '';
      if (tobInput && chart.time_of_birth) tobInput.value = chart.time_of_birth.slice(0, 5);
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
            <div class="intake-icon">🔮</div>
            <div>
              <h2 class="intake-title">AstroTalk Consultation Intake (परामर्श विवरण)</h2>
              <p class="intake-subtitle">
                Vedic Jyotish ke anusaar accurate bhavishyavani aur guidance ke liye kripya apne janam vivaran darj karein.
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
                <input type="date" id="intake-dob" class="intake-input" value="${d.dob || ''}" required />
              </div>

              <div class="form-group">
                <label class="intake-label" for="intake-tob">Time of Birth / जन्म समय</label>
                <input type="time" id="intake-tob" class="intake-input" value="${d.tob || ''}" />
                <label class="approx-checkbox">
                  <input type="checkbox" id="intake-approx-time" ${d.isApprox ? 'checked' : ''} />
                  <span>Don't know exact time (लगभग समय)</span>
                </label>
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
                <span>🟢</span>
                <span>Start Chat with Astrologer (परामर्श शुरू करें)</span>
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

      // Append AstroTalk Connected Banner
      const cd = chart.chart_data || {};
      const bannerHtml = `
        <div class="astrotalk-connected-banner">
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
        submitBtn.innerHTML = '<span>🟢</span> <span>Start Chat with Astrologer (परामर्श शुरू करें)</span> <span>→</span>';
      }
    }
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

      list.innerHTML = sessions.map((s) => `
        <li class="sidebar-item ${this.currentSessionId && s.id === this.currentSessionId ? 'active' : ''}" 
            onclick="ChatController.loadSessionHistory('${s.id}')">
          <span class="item-title">${s.title}</span>
          <span style="font-size: 0.7rem; color: var(--text-dim);">${new Date(s.created_at).toLocaleDateString([], {month:'short', day:'numeric'})}</span>
        </li>
      `).join('');
    } catch (err) {
      console.warn('Could not load sessions:', err);
    }
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

      if (data.messages && data.messages.length > 0) {
        data.messages.forEach(m => {
          this.appendMessage(m.role, m.content, m.citations || [], m.is_demo_mode, m.chart_svg);
        });
      } else {
        this.appendMessage('assistant', 'Welcome back! This consultation session is active. How can I assist you with your Kundali today? (यह परामर्श सत्र सक्रिय है। आप क्या मार्गदर्शन चाहते हैं?)');
      }

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
    let html = text
      .replace(/### (.*?)\n/g, '<h4 style="margin: 0.65rem 0 0.3rem 0; font-size: 0.98rem; font-weight: 700; color: #4338CA;">$1</h4>')
      .replace(/## (.*?)\n/g, '<h3 style="margin: 0.75rem 0 0.35rem 0; font-size: 1.08rem; font-weight: 700; color: #312E81;">$1</h3>')
      .replace(/# (.*?)\n/g, '<h2 style="margin: 0.85rem 0 0.45rem 0; font-size: 1.18rem; font-weight: 700; color: #1E1B4B; border-bottom: 1px solid #F1F5F9; padding-bottom: 0.35rem;">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #0F172A; font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="color: #334155;">$1</em>')
      .replace(/> (.*?)\n/g, '<blockquote style="border-left: 3.5px solid #F59E0B; padding: 0.6rem 0.95rem; margin: 0.65rem 0; background: #FFFDF5; border: 1px solid #FDE68A; border-left-width: 3.5px; border-radius: 6px; color: #78350F; font-size: 0.92rem; line-height: 1.6;">$1</blockquote>')
      .replace(/`([^`]+)`/g, '<code style="background: #F1F5F9; color: #4338CA; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.88em; font-weight: 600;">$1</code>')
      .replace(/^[\*\-] (.*?)$/gm, '<li style="margin-bottom: 0.35rem; color: #334155;">$1</li>')
      .replace(/^\d+\.\s+(.*?)$/gm, '<li style="margin-bottom: 0.35rem; color: #334155;">$1</li>')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');

    html = html.replace(/(<li style="[^"]*">.*?<\/li>)+/g, '<ul style="margin: 0.5rem 0 0.75rem 1.25rem; padding-left: 0.5rem;">$&</ul>');
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
        <div class="chat-inline-kundli-box" style="max-width: 280px; margin: 0.75rem auto; background: #FFFDF8; border: 1.5px solid #FDE68A; border-radius: 10px; padding: 0.75rem; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
          <div class="inline-kundli-title" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-size: 0.82rem; font-weight: 700; color: #92400E;">
            <span>🪐 Lagna Kundali (D1)</span>
          </div>
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
          <button class="btn-msg-action" onclick="ChatController.shareResponseWhatsApp('${escapedRaw}')">
            📲 WhatsApp
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

    const currentAstrologer = this.astrologers.find(a => a.id === this.selectedAstrologer) || { avatar: '🔮', name: 'Astrologer' };

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
        <div class="msg-avatar" style="background: #EEF2FF; border: 1px solid #C7D2FE;">👤</div>
      `;
    } else {
      row.innerHTML = `
        <div class="msg-avatar" title="${currentAstrologer.name}">${currentAstrologer.avatar || '🔮'}</div>
        <div class="message-bubble">
          <div class="msg-speaker-badge">
            <span style="font-size: 1rem;">${currentAstrologer.avatar || '🕉️'}</span>
            <span class="msg-speaker-name">${currentAstrologer.name}</span>
            <span class="msg-speaker-title">${currentAstrologer.title || 'Vedic Astrologer'}</span>
            <span style="margin-left: auto; font-size: 0.72rem; color: #94A3B8;">${timeStr}</span>
          </div>
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

  shareResponseWhatsApp(escapedText) {
    const raw = decodeURIComponent(escapedText);
    const persona = this.astrologers.find(a => a.id === this.selectedAstrologer) || { name: 'Acharya Shastri' };
    const text = 
`🔮 *AstroAI Consultation by ${persona.name}* 🔮
━━━━━━━━━━━━━━━━━━
${raw}
━━━━━━━━━━━━━━━━━━
✨ Consult verified AI Astrologers on AstroAI:
https://astrotalk.ai`;
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

  async loadAstrologers() {
    try {
      this.astrologers = await API.getAstrologers();
      this.updateAstrologerUI();
    } catch (err) {
      console.warn('Could not load astrologers:', err);
    }
  },

  updateAstrologerUI() {
    const current = this.astrologers.find(a => a.id === this.selectedAstrologer) || this.astrologers[0] || {
      id: 'acharya_shastri',
      name: 'Acharya Shastri',
      title: 'Vedic & Vastu Specialist',
      avatar: '🕉️',
      experience: '24+ Yrs Exp'
    };

    // Update topbar astrologer badge
    const badge = document.querySelector('.astrologer-badge');
    const avatarEl = document.querySelector('.astrologer-avatar');
    const nameEl = document.querySelector('.astrologer-info h3');
    const titleEl = document.querySelector('.astrologer-info p');
    if (avatarEl) avatarEl.innerText = current.avatar || '🔮';
    if (nameEl) nameEl.innerHTML = `${current.name} <span style="font-size: 0.7rem; color: var(--gold-accent);">✦</span>`;
    if (titleEl) titleEl.innerText = `${current.title} • ${current.experience || 'Vedic NASA Engine'}`;

    if (badge && !badge.hasAttribute('data-has-click')) {
      badge.setAttribute('data-has-click', 'true');
      badge.style.cursor = 'pointer';
      badge.title = 'Click to switch astrologer persona';
      badge.addEventListener('click', () => this.openAstrologerModal());
    }

    // Update intake form chips if present
    const intakeContainer = document.getElementById('intake-astrologer-chips');
    if (intakeContainer && this.astrologers.length) {
      intakeContainer.innerHTML = this.astrologers.map(a => `
        <div class="astrologer-select-chip ${a.id === this.selectedAstrologer ? 'active' : ''}" 
             onclick="ChatController.selectAstrologer('${a.id}')">
          <span class="chip-avatar">${a.avatar}</span>
          <div class="chip-info">
            <div class="chip-name">${a.name} <span class="chip-rating">⭐ ${a.rating}</span></div>
            <div class="chip-title">${a.title}</div>
          </div>
        </div>
      `).join('');
    }
  },

  selectAstrologer(id) {
    this.selectedAstrologer = id;
    localStorage.setItem('astroai_astrologer', id);
    this.updateAstrologerUI();
    const current = this.astrologers.find(a => a.id === id);
    if (current && window.App && window.App.showToast) {
      window.App.showToast(`Connected with ${current.name} (${current.title}) ✨`, 'success');
    }
    const modal = document.getElementById('modal-select-astrologer');
    if (modal) modal.classList.remove('active');
  },

  openAstrologerModal() {
    const modal = document.getElementById('modal-select-astrologer');
    if (!modal) return;
    const listContainer = document.getElementById('astrologers-modal-list');
    if (listContainer) {
      listContainer.innerHTML = this.astrologers.map(a => `
        <div class="astrologer-modal-card ${a.id === this.selectedAstrologer ? 'active' : ''}" 
             onclick="ChatController.selectAstrologer('${a.id}')">
          <div class="modal-card-top">
            <div class="modal-card-avatar">${a.avatar}</div>
            <div class="modal-card-info">
              <div class="modal-card-name">${a.name} <span class="star-pill">⭐ ${a.rating}</span></div>
              <div class="modal-card-title">${a.title} • <strong>${a.experience}</strong></div>
              <div class="modal-card-consultations">📊 ${a.consultations} Consultations completed</div>
            </div>
            <div class="select-check">${a.id === this.selectedAstrologer ? '✓ Active' : 'Select'}</div>
          </div>
          <div class="modal-card-tone">🗣️ <strong>Tone:</strong> ${a.tone_badge}</div>
          <div class="modal-card-specialties">
            ${(a.specialties || []).map(s => `<span class="specialty-tag">${s}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }
    modal.classList.add('active');
  },

  async sendMessage(customText = null, imageBase64 = null) {
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
        App.showToast('AstroTalk consultation shuru karne ke liye pehle apna naam aur janam tithi enter karein! 😊', 'warning');
        if (nameInput && !nameInput.value.trim()) nameInput.focus();
        else if (dobInput) dobInput.focus();
        return;
      }
    }

    if (!msg && !imageBase64) return;

    if (input) {
      input.value = '';
      input.style.height = 'auto';
    }

    this.lastUserMessage = msg || 'Analyze my palm lines';
    this.appendMessage('user', msg || 'Analyze my palm lines (हस्तरेखा)', [], false, null, imageBase64);

    const box = document.getElementById('chat-messages-container');
    const sendBtn = document.getElementById('btn-send-chat');
    if (sendBtn) sendBtn.disabled = true;

    // Create live streaming assistant message bubble immediately
    const currentAstrologer = this.astrologers.find(a => a.id === this.selectedAstrologer) || { avatar: '🔮', name: 'Astrologer' };
    const streamRow = document.createElement('div');
    streamRow.className = 'message-row assistant';
    streamRow.innerHTML = `
      <div class="msg-avatar" title="${currentAstrologer.name}">${currentAstrologer.avatar || '🔮'}</div>
      <div class="message-bubble" id="active-streaming-bubble">
        <div class="msg-speaker-badge">
          <span style="font-size: 1rem;">${currentAstrologer.avatar || '🕉️'}</span>
          <span class="msg-speaker-name">${currentAstrologer.name}</span>
          <span class="msg-speaker-title">${currentAstrologer.title || 'Vedic Astrologer'}</span>
          <span style="margin-left: auto; font-size: 0.72rem; color: #94A3B8;">typing...</span>
        </div>
        <div class="streaming-content-wrapper" id="active-streaming-text">
          <span class="streaming-cursor">▋</span>
        </div>
      </div>
    `;
    box.appendChild(streamRow);
    box.scrollTop = box.scrollHeight;

    const streamingTextElem = streamRow.querySelector('#active-streaming-text');
    let accumulatedText = '';
    let isStreamDone = false;

    const isKundliRequested = (t) => {
      if (!t) return false;
      const low = t.toLowerCase();
      return low.includes('kundli') || low.includes('chart') || low.includes('kundali');
    };

    try {
      await API.streamConsultation(
        {
          session_id: this.currentSessionId,
          chart_id: this.activeChartId || (App.currentChart ? App.currentChart.id : null),
          message: msg || 'Analyze my palm lines (हस्तरेखा विश्लेषण)',
          language: this.currentLanguage,
          astrologer_id: this.selectedAstrologer,
          force_demo_mode: this.forceDemoMode,
          image_base64: imageBase64
        },
        (sessionData) => {
          this.currentSessionId = sessionData.session_id;
        },
        (deltaText) => {
          accumulatedText += deltaText;
          if (streamingTextElem) {
            streamingTextElem.innerHTML = this.formatMarkdown(accumulatedText) + '<span class="streaming-cursor">▋</span>';
            box.scrollTop = box.scrollHeight;
          }
        },
        (doneData) => {
          isStreamDone = true;
          this.currentSessionId = doneData.session_id;
          if (streamingTextElem) {
            streamingTextElem.innerHTML = this.formatMarkdown(finalContent);
          }
          const speakerBadgeTime = streamRow.querySelector('.msg-speaker-badge span:last-child');
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          if (speakerBadgeTime) {
            speakerBadgeTime.textContent = timeStr;
          }

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

          // Action buttons
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'msg-actions';
          const escapedRaw = encodeURIComponent(finalContent);
          actionsDiv.innerHTML = `
            <button class="btn-msg-action" onclick="ChatController.copyMessage('${escapedRaw}')">📋 Copy</button>
            <button class="btn-msg-action" onclick="ChatController.shareResponseWhatsApp('${escapedRaw}')">📲 WhatsApp</button>
            <button class="btn-msg-action" onclick="ChatController.regenerateLast()">🔄 Regenerate</button>
            <button class="btn-msg-action" onclick="ChatController.submitFeedback('up', this)">👍 Helpful</button>
            <button class="btn-msg-action" onclick="ChatController.submitFeedback('down', this)">👎</button>
            <span style="margin-left: auto; font-size: 0.72rem; color: var(--text-dim);">${timeStr}</span>
          `;
          streamRow.querySelector('.message-bubble').appendChild(actionsDiv);
          this.loadSessions();
          box.scrollTop = box.scrollHeight;
        },
        async (streamErr) => {
          console.warn('Streaming failed, fallback to standard API call:', streamErr);
          if (!accumulatedText) {
            streamRow.remove();
            // Fallback to standard request
            const res = await API.sendMessage({
              session_id: this.currentSessionId,
              chart_id: this.activeChartId || (App.currentChart ? App.currentChart.id : null),
              message: msg || 'Analyze my palm lines (हस्तरेखा विश्लेषण)',
              language: this.currentLanguage,
              astrologer_id: this.selectedAstrologer,
              force_demo_mode: this.forceDemoMode,
              image_base64: imageBase64
            });
            this.currentSessionId = res.session_id;
            let inlineSvg = res.chart_svg;
            if (!inlineSvg && isKundliRequested(msg) && App.currentChart && App.currentChart.chart_data) {
              inlineSvg = ChartViewer.renderNorthIndianSVG(App.currentChart.chart_data, true);
            }
            this.appendMessage('assistant', res.content, [], res.is_demo_mode, inlineSvg);
            this.loadSessions();
          }
        }
      );
    } catch (err) {
      console.error('Consultation chat error:', err);
      if (!accumulatedText) {
        streamRow.remove();
        this.appendMessage('assistant', `⚠️ Could not complete astrological consultation: ${err.message}`);
      }
    } finally {
      if (sendBtn) sendBtn.disabled = false;
    }
  }
};

// Expose ChatController globally for HTML onclick handlers and cross-module access
window.ChatController = ChatController;
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatController;
}
