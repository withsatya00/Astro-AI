/**
 * Astro Jyotish Agent Main Application Orchestrator.
 * AstroTalk-Inspired Chat-First Interface Controller.
 */

document.addEventListener('DOMContentLoaded', () => {
  // If modular bootstrap is present, it coordinates mounting and calls App.init()
  if (!document.querySelector('script[src*="bootstrap.js"]')) {
    App.init();
  }
});

var App = {
  currentChart: null,
  agentToolsList: [],
  _isInitialized: false,

  async init() {
    if (this._isInitialized) return;
    this._isInitialized = true;
    this.bindShellControls();
    this.bindModals();
    this.bindBirthDetails();
    this.bindUploadModal();
    this.bindAgentConsole();
    this.bindKundaliMilan();
    this.bindPanchang();
    this.bindSadeSati();
    this.bindExportButtons();

    // Initialize sub-controllers
    if (window.I18n) {
      window.I18n.init();
    }
    ChatController.init();
    ReportsController.init();
    this.initModernPickers();


    this.bindCalculatorsModal();
    this.initHoroscopeWidget();
    this.bindAstrologerDirectory();
    this.bindSmartMatching();
    this.bindUserAuth();

    // Initialize SPA Client Router
    if (window.Router) {
      window.Router.init();
    }

    // Initial data fetch
    await this.refreshTelemetry();
    await this.loadSavedProfiles();
    await this.loadAgentTools();
    await this.loadAstrologerDirectory();
    await this.loadHomeFeatured();
    await this.loadHomePanchangBar();
    await this.refreshWalletUI();
    await this.renderHomeSavedProfiles();
    await this.checkUserSession();
  },

  // =========================================================================
  // Shell & Navigation Controls
  // =========================================================================
  bindShellControls() {
    const sidebar = document.getElementById('sidebar');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnCloseSidebar = document.getElementById('btn-close-sidebar');

    const contextPanel = document.getElementById('context-panel');
    const btnToggleContext = document.getElementById('btn-toggle-context');
    const btnCloseContext = document.getElementById('btn-close-context');

    const btnNewChat = document.getElementById('btn-new-chat');
    const searchInput = document.getElementById('search-sessions-input');

    const drawerBackdrop = document.getElementById('drawer-backdrop');

    const closeAllDrawers = () => {
      if (sidebar) sidebar.classList.add('collapsed');
      if (contextPanel) contextPanel.classList.add('collapsed');
      if (drawerBackdrop) drawerBackdrop.classList.remove('active');
    };

    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', () => {
        closeAllDrawers();
      });
    }

    // By default, collapse contextPanel and sidebar on initial load to ensure WhatsApp-style wide consultation experience
    if (contextPanel) {
      contextPanel.classList.add('collapsed');
    }
    if (sidebar) {
      sidebar.classList.add('collapsed');
    }
    if (drawerBackdrop) {
      drawerBackdrop.classList.remove('active');
    }

    // Sidebar toggles
    if (btnToggleSidebar && sidebar) {
      btnToggleSidebar.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (isCollapsed) {
          sidebar.classList.remove('collapsed');
          if (window.innerWidth <= 900) {
            if (contextPanel) contextPanel.classList.add('collapsed');
            if (drawerBackdrop) drawerBackdrop.classList.add('active');
          }
        } else {
          sidebar.classList.add('collapsed');
          if (drawerBackdrop) drawerBackdrop.classList.remove('active');
        }
      });
    }
    if (btnCloseSidebar && sidebar) {
      btnCloseSidebar.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        sidebar.classList.add('collapsed');
        if (drawerBackdrop) drawerBackdrop.classList.remove('active');
      });
    }

    // Context panel toggles (Off-canvas drawer on all screen sizes)
    if (btnToggleContext && contextPanel) {
      btnToggleContext.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const isCollapsed = contextPanel.classList.contains('collapsed');
        if (isCollapsed) {
          contextPanel.classList.remove('collapsed');
          if (drawerBackdrop) drawerBackdrop.classList.add('active');
        } else {
          contextPanel.classList.add('collapsed');
          if (drawerBackdrop) drawerBackdrop.classList.remove('active');
        }
      });
    }
    if (btnCloseContext && contextPanel) {
      btnCloseContext.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        contextPanel.classList.add('collapsed');
        if (drawerBackdrop) drawerBackdrop.classList.remove('active');
      });
    }

    // Mobile Navigation Drawer Toggle
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileDrawer = document.getElementById('mobile-nav-drawer');
    const mobileBackdrop = document.getElementById('mobile-nav-backdrop');
    const btnCloseMobileDrawer = document.getElementById('btn-close-mobile-drawer');

    if (btnMobileMenu && mobileDrawer) {
      btnMobileMenu.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const isActive = mobileDrawer.classList.toggle('active');
        if (mobileBackdrop) {
          if (isActive) mobileBackdrop.classList.add('active');
          else mobileBackdrop.classList.remove('active');
        }
      });
    }

    if (btnCloseMobileDrawer && mobileDrawer) {
      btnCloseMobileDrawer.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        mobileDrawer.classList.remove('active');
        if (mobileBackdrop) mobileBackdrop.classList.remove('active');
      });
    }

    if (mobileBackdrop && mobileDrawer) {
      mobileBackdrop.addEventListener('click', () => {
        mobileDrawer.classList.remove('active');
        mobileBackdrop.classList.remove('active');
      });
    }

    // Close any active modal, drawer, or panel on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        if (contextPanel && !contextPanel.classList.contains('collapsed')) {
          contextPanel.classList.add('collapsed');
        }
        if (mobileDrawer && mobileDrawer.classList.contains('active')) {
          mobileDrawer.classList.remove('active');
        }
        if (sidebar && window.innerWidth <= 900 && !sidebar.classList.contains('collapsed')) {
          sidebar.classList.add('collapsed');
        }
        if (drawerBackdrop) drawerBackdrop.classList.remove('active');
      }
    });

    // New chat
    if (btnNewChat) {
      btnNewChat.addEventListener('click', () => {
        ChatController.startNewChat();
        if (window.innerWidth <= 768 && sidebar) {
          sidebar.classList.add('collapsed');
        }
      });
    }

    // Search sessions
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        document.querySelectorAll('#sessions-list .sidebar-item').forEach(item => {
          const text = item.innerText.toLowerCase();
          item.style.display = text.includes(q) ? 'flex' : 'none';
        });
      });
    }

    // Astrology Shortcuts & Quick Actions
    const shortcutMilan = document.getElementById('nav-shortcut-milan');
    const shortcutPanchang = document.getElementById('nav-shortcut-panchang');
    const shortcutSadesati = document.getElementById('nav-shortcut-sadesati');
    const shortcutAstrologer = document.getElementById('nav-shortcut-astrologer');

    const topbarMilan = document.getElementById('btn-topbar-milan');
    const topbarPanchang = document.getElementById('btn-topbar-panchang');
    const topbarSadesati = document.getElementById('btn-topbar-sadesati');
    const topbarAstrologer = document.getElementById('topbar-astrologer-badge');

    const contextMilan = document.getElementById('btn-context-milan');
    const contextPanchang = document.getElementById('btn-context-panchang');
    const contextSadesati = document.getElementById('btn-context-sadesati');

    // Milan Openers
    [shortcutMilan, topbarMilan, contextMilan].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.openModal('modal-kundali-milan'));
    });

    // Panchang Openers
    [shortcutPanchang, topbarPanchang, contextPanchang].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.openPanchangModal());
    });

    // Sade Sati Openers
    [shortcutSadesati, topbarSadesati, contextSadesati].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.openSadeSatiModal());
    });

    // Directory Openers
    const shortcutDirectory = document.getElementById('nav-shortcut-directory');
    const topbarDirectory = document.getElementById('btn-topbar-directory');
    [shortcutDirectory, topbarDirectory].forEach(btn => {
      if (btn) btn.addEventListener('click', () => {
        this.openModal('modal-select-astrologer');
        this.loadAstrologerDirectory();
      });
    });

    // Smart Match Openers
    const shortcutSmartMatch = document.getElementById('nav-shortcut-smart-match');
    const topbarSmartMatch = document.getElementById('btn-topbar-smart-match');
    [shortcutSmartMatch, topbarSmartMatch].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.openModal('modal-smart-matching'));
    });

    // End Consultation Button
    const btnEndConsultation = document.getElementById('btn-end-consultation');
    if (btnEndConsultation) {
      btnEndConsultation.addEventListener('click', () => {
        ChatController.endCurrentConsultation();
      });
    }

    // User Auth Openers
    const btnOpenAuth = document.getElementById('btn-open-auth-modal');
    if (btnOpenAuth) {
      btnOpenAuth.addEventListener('click', () => {
        this.openModal('modal-user-account');
        this.renderUserAccountModal();
      });
    }

    // Astrologer Openers
    if (shortcutAstrologer) {
      shortcutAstrologer.addEventListener('click', () => {
        this.openModal('modal-select-astrologer');
        this.loadAstrologerDirectory();
      });
    }
    if (topbarAstrologer) {
      topbarAstrologer.addEventListener('click', () => {
        this.showActiveAstrologerProfile();
      });
    }

    // Grounded Report Openers
    const shortcutGrounded = document.getElementById('nav-shortcut-grounded-report');
    const contextGrounded = document.getElementById('btn-context-grounded-report');
    [shortcutGrounded, contextGrounded].forEach(btn => {
      if (btn) btn.addEventListener('click', () => ChartViewer.openGroundedReportModal());
    });

    const btnGroundedDownloadPdf = document.getElementById('btn-grounded-download-pdf');
    const btnGroundedShareWhatsapp = document.getElementById('btn-grounded-share-whatsapp');
    if (btnGroundedDownloadPdf) {
      btnGroundedDownloadPdf.addEventListener('click', () => {
        if (window.ReportsController && window.ReportsController.generateQuickReport) {
          window.ReportsController.generateQuickReport();
        }
      });
    }
    if (btnGroundedShareWhatsapp) {
      btnGroundedShareWhatsapp.addEventListener('click', () => {
        if (window.ChartViewer && window.ChartViewer.currentGroundedReport) {
          const r = window.ChartViewer.currentGroundedReport;
          const yogasStr = (r.detected_yogas_summary?.yogas || []).map(y => y.yoga_name).join(', ') || 'Foundational Formations';
          const text = `📜 *शास्त्रोक्त वैदिक ज्योतिष रिपोर्ट* 📜\n👑 *शुभ योग:* ${yogasStr}\n⭐ *सार:* ${r.executive_summary}\n✨ पूज्य ज्योतिषाचार्य से परामर्श लें • Astro Jyotish: https://astrojyotish.ai`;
          window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
        }
      });
    }

    const shortcutKundli = document.getElementById('nav-shortcut-kundli');
    const shortcutReports = document.getElementById('nav-shortcut-reports');
    const shortcutDocs = document.getElementById('nav-shortcut-docs');
    const shortcutAgent = document.getElementById('nav-shortcut-agent');

    if (shortcutKundli) {
      shortcutKundli.addEventListener('click', () => {
        if (contextPanel) contextPanel.classList.remove('collapsed');
        if (!this.currentChart) {
          this.openBirthModal();
        }
      });
    }
    if (shortcutReports) {
      shortcutReports.addEventListener('click', () => {
        this.openMyReportsModal();
      });
    }
    if (shortcutDocs) {
      shortcutDocs.addEventListener('click', () => {
        this.openModal('modal-document-upload');
      });
    }
    if (shortcutAgent) {
      shortcutAgent.addEventListener('click', () => {
        this.openModal('modal-agent-tools');
      });
    }

    // Topbar Profile Tag click
    const topbarProfile = document.getElementById('topbar-profile-tag');
    if (topbarProfile) {
      topbarProfile.addEventListener('click', () => {
        this.openBirthModal();
      });
    }

    const contextEditProfile = document.getElementById('btn-context-edit-profile');
    if (contextEditProfile) {
      contextEditProfile.addEventListener('click', () => {
        this.openBirthModal();
      });
    }
  },

  // =========================================================================
  // Telemetry Polling
  // =========================================================================
  async refreshTelemetry() {
    try {
      const health = await API.getHealth();
      const dot = document.getElementById('telemetry-dot');
      const text = document.getElementById('telemetry-text');

      if (dot && text) {
        if (health.demo_mode) {
          dot.className = 'status-dot demo';
          text.innerText = (window.I18n && window.I18n.currentLang !== 'en') ? 'पंडित जी उपलब्ध हैं' : 'Astrologer Available';
        } else {
          dot.className = 'status-dot';
          text.innerText = (window.I18n && window.I18n.currentLang !== 'en') ? '🟢 ज्योतिषाचार्य ऑनलाइन हैं' : '🟢 Astrologer Online';
        }
      }
    } catch (err) {
      console.warn('Telemetry error:', err);
      const text = document.getElementById('telemetry-text');
      if (text) text.innerText = 'Connecting...';
    }
  },

  // =========================================================================
  // Modals Controller
  // =========================================================================
  bindModals() {
    // Close on .modal-close click
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
        if (['#/kundali-milan', '#/milan', '#/panchang', '#/sadesati', '#/kundli-pdf', '#/report'].includes(window.location.hash)) {
          history.replaceState(null, '', '/');
          if (window.Router) Router.updateNavbarActive('nav-link-home');
        }
      });
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          if (['#/kundali-milan', '#/milan', '#/panchang', '#/sadesati', '#/kundli-pdf', '#/report'].includes(window.location.hash)) {
            history.replaceState(null, '', '/');
            if (window.Router) Router.updateNavbarActive('nav-link-home');
          }
        }
      });
    });

    // Composer quick buttons
    const btnOpenBirth = document.getElementById('btn-open-birth-modal');
    const btnOpenUpload = document.getElementById('btn-open-upload-modal');
    const btnOpenAgent = document.getElementById('btn-open-agent-modal');
    const btnQuickAddProf = document.getElementById('btn-quick-add-profile');

    if (btnOpenBirth) btnOpenBirth.addEventListener('click', () => this.openBirthModal());
    if (btnQuickAddProf) btnQuickAddProf.addEventListener('click', () => this.openBirthModal());
    if (btnOpenUpload) btnOpenUpload.addEventListener('click', () => this.openModal('modal-document-upload'));
    if (btnOpenAgent) btnOpenAgent.addEventListener('click', () => this.openModal('modal-agent-tools'));
  },

  openModal(modalId) {
    if (window.innerWidth <= 900) {
      const sidebar = document.getElementById('sidebar');
      const contextPanel = document.getElementById('context-panel');
      const drawerBackdrop = document.getElementById('drawer-backdrop');
      if (sidebar) sidebar.classList.add('collapsed');
      if (contextPanel) contextPanel.classList.add('collapsed');
      if (drawerBackdrop) drawerBackdrop.classList.remove('active');
    }
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('active');
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
    if (['#/kundali-milan', '#/milan', '#/panchang', '#/sadesati', '#/kundli-pdf', '#/report'].includes(window.location.hash)) {
      history.replaceState(null, '', '/');
      if (window.Router) Router.updateNavbarActive('nav-link-home');
    }
  },

  openBirthModal() {
    this.openModal('modal-birth-details');
  },

  openKundaliMilanModal() {
    this.openModal('modal-kundali-milan');
  },

  openSadeSatiModal() {
    this.openModal('modal-sade-sati');
  },

  openPanchangModal() {
    this.openModal('modal-panchang');
  },

  openUserAccountModal() {
    if (!this.currentUser) { this.openAuthModal('login'); return; }
    this.closeModal('modal-user-account');
    window.Router.navigate('/my-account');
  },

  openAccountSettings() {
    this.openModal('modal-user-account');
    if (typeof this.renderUserAccountModal === 'function') {
      this.renderUserAccountModal();
    }
    this.refreshWalletUI();
  },

  showActiveAstrologerProfile() {
    const active = (window.ChatController && window.ChatController.getActiveAstrologer && window.ChatController.getActiveAstrologer()) ||
                   (window.ChatController && window.ChatController.selectedAstrologer) ||
                   'pt-rameshwar-dwivedi';
    const targetId = typeof active === 'object' ? (active.slug || active.id) : active;
    this.showAstrologerProfile(targetId);
  },

  openAuthModal(defaultTab = 'login') {
    // openUserAccountModal() now sends signed-in users to the dashboard and calls this for guests, so open the modal directly.
    this.openAccountSettings();
    setTimeout(() => {
      this.switchAuthTab(defaultTab === 'register' ? 'register' : 'login');
    }, 60);
  },

  openGroundedReportModal() {
    if (window.ChartViewer && window.ChartViewer.openGroundedReportModal) {
      window.ChartViewer.openGroundedReportModal();
    } else {
      this.openModal('modal-grounded-report');
    }
  },

  openSmartMatchingModal() {
    this.openModal('modal-smart-matching');
  },

  openSmartMatchModal() {
    this.openSmartMatchingModal();
  },

  openCalculatorsModal(defaultTab = 'numerology') {
    if (defaultTab === 'kundali-milan' || defaultTab === 'milan' || defaultTab === 'kundli-milan') {
      return this.openKundaliMilanModal();
    }
    if (defaultTab === 'sade-sati' || defaultTab === 'sadesati') {
      return this.openSadeSatiModal();
    }
    if (defaultTab === 'panchang') {
      return this.openPanchangModal();
    }

    const aliases = {
      'love-compatibility': 'love-compat',
      'friendship-compatibility': 'friend-compat',
      'name-compatibility': 'name-compat',
      'kaal-sarp': 'kaalsarp',
      'kaalsarp-dosha': 'kaalsarp',
      'lagna': 'rising-sign',
      'ascendant': 'rising-sign',
      'chandra': 'moon-sign',
      'surya': 'sun-sign',
      'tithi': 'moon-phase',
      'ratna': 'gemstone'
    };
    const resolvedTab = aliases[defaultTab] || defaultTab || 'numerology';

    this.openModal('modal-astrology-calculators');
    this.switchCalculatorTab(resolvedTab);
    this.autoFillCurrentCalculator();
  },

  async openWalletModal() {
    this.walletHistoryFilter = 'all';
    this.openModal('modal-wallet-bookings');
    await this.refreshWalletUI();
  },

  async openAppointmentsModal(astrologerId) {
    if (!this.currentUser) { this.openAuthModal('login'); return; }
    this.closeModal('modal-wallet-bookings');
    this.openModal('modal-appointments');
    this._exp = await import('/src/utils/experience.js');
    await this.refreshWalletUI();
    await this.loadBookingsUI();
    this.populateBookingAstrologers();
    const select = document.getElementById('booking-astrologer-select');
    const pick = astrologerId && typeof astrologerId === 'string' ? astrologerId : '';
    if (select && pick) {
      if (![...select.options].some(o => o.value === pick) && this.profileAstrologer?.id === pick) {
        const option = document.createElement('option');
        option.value = pick; option.dataset.rate = this.profileAstrologer.price_per_minute ?? 0;
        option.textContent = `${this.profileAstrologer.name} · ₹${this.profileAstrologer.price_per_minute ?? 0}/min`;
        select.append(option);
      }
      select.value = pick;
    }
    this.updateBookingFeePreview();
  },

  openGlossaryModal(term = null) {
    this.openModal('modal-astrology-glossary');
    this.renderGlossary(term);
  },

  openCalendarModal() {
    this.openPanchangModal();
  },

  openAstrologerSelectModal() {
    this.openModal('modal-select-astrologer');
    this.loadAstrologerDirectory();
  },

  // =========================================================================
  // Birth Details & Kundli Form
  // =========================================================================
  bindBirthDetails() {
    // Quick City Chips Click
    document.querySelectorAll('.city-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('modal-city').value = chip.getAttribute('data-city') || '';
        document.getElementById('modal-country').value = chip.getAttribute('data-country') || '';
        document.getElementById('modal-lat').value = chip.getAttribute('data-lat') || '';
        document.getElementById('modal-lon').value = chip.getAttribute('data-lon') || '';
        document.getElementById('modal-tz').value = chip.getAttribute('data-tz') || '';
      });
    });

    const form = document.getElementById('form-birth-details');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btn-modal-calc-chart');
      if (btn) {
        btn.disabled = true;
        btn.innerText = 'Calculating with Swiss Ephemeris...';
      }

      const payload = {
        name: document.getElementById('modal-name').value,
        date_of_birth: document.getElementById('modal-dob').value,
        time_of_birth: document.getElementById('modal-tob').value || '12:00:00',
        is_time_approximate: document.getElementById('modal-approx-time').checked,
        latitude: parseFloat(document.getElementById('modal-lat').value),
        longitude: parseFloat(document.getElementById('modal-lon').value),
        timezone_offset: parseFloat(document.getElementById('modal-tz').value),
        city: document.getElementById('modal-city').value,
        country: document.getElementById('modal-country').value,
        system: document.getElementById('modal-system').value,
        ayanamsa: document.getElementById('modal-ayanamsa').value
      };

      try {
        const res = await API.calculateChart(payload);
        this.currentChart = res;
        this.rememberMyChartId(res.id);
        this.updateActiveProfileUI(res);
        this.closeModal('modal-birth-details');
        this.showToast(`Birth chart calculated for ${res.name}! 🪐`, 'success');
        window.dispatchEvent(new CustomEvent('astro:profileschange'));
        this.loadSavedProfiles();
      } catch (err) {
        this.showToast(`Calculation failed: ${err.message}`, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerText = '✨ Calculate & Set Active Kundli';
        }
      }
    });
  },

  updateActiveProfileUI(chart) {
    if (!chart || !chart.chart_data) return;
    const cd = chart.chart_data;
    const now = Date.now();
    const currentDasha = (cd.dashas || []).find(d => Date.parse(d.start_date) <= now && now < Date.parse(d.end_date));
    for (const [id, value] of Object.entries({
      'strip-lagna': cd.ascendant_sign,
      'strip-nakshatra': cd.moon_nakshatra,
      'strip-dasha': currentDasha?.planet
    })) {
      const element = document.getElementById(id);
      if (element) element.textContent = value || '\u2014';
    }

    // Topbar Pill
    const topbarName = document.getElementById('topbar-profile-name');
    if (topbarName) {
      topbarName.innerText = `${chart.name} (${cd.ascendant_sign} Lagna)`;
    }

    // Composer tool button
    const compBtn = document.getElementById('composer-profile-btn-text');
    if (compBtn) compBtn.innerText = chart.name.split(' ')[0];

    // Right Context Panel Summary
    const profileSummary = document.getElementById('context-profile-summary');
    if (profileSummary) {
      profileSummary.innerHTML = `
        <div style="font-size: 0.88rem; font-weight: 700; color: #fff;">${chart.name}</div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
          📅 ${chart.date_of_birth} at ${chart.time_of_birth || '12:00'}<br/>
          📍 ${chart.city || 'Coordinates'}, ${chart.country || ''} (${chart.system})
        </div>
      `;
    }

    // Kundli SVG Compact Render
    const svgBox = document.getElementById('context-kundali-svg');
    if (svgBox) {
      svgBox.innerHTML = ChartViewer.renderNorthIndianSVG(cd, true);
    }

    // Highlights grid
    const valLagna = document.getElementById('val-lagna');
    const valMoon = document.getElementById('val-moon');
    const valSun = document.getElementById('val-sun');
    const valNak = document.getElementById('val-nakshatra');

    if (valLagna) valLagna.innerText = cd.ascendant_sign || '-';
    if (valMoon) valMoon.innerText = cd.moon_sign || '-';
    if (valSun) valSun.innerText = cd.sun_sign || '-';
    if (valNak) valNak.innerText = `${cd.moon_nakshatra} (Pada ${cd.moon_pada})`;

    // Mahadasha
    const dashaBox = document.getElementById('context-dasha-summary');
    if (dashaBox && currentDasha) {
      const d = currentDasha;
      dashaBox.innerHTML = `
        <strong style="color: var(--gold-light);">${d.planet} Mahadasha</strong><br/>
        <span style="font-size: 0.75rem;">Active until ${d.end_date} (${d.duration_years} Years)</span>
      `;
    }

    // Ayanamsa badge
    const ayanBadge = document.getElementById('context-ayanamsa-badge');
    if (ayanBadge) ayanBadge.innerText = cd.ayanamsa || 'Lahiri';

    // Link chart to chat controller
    ChatController.activeChartId = chart.id;

    this.updateLinkedProfileChip(chart);
  },

  // Inline chip row in the chat composer to switch the active birth profile without opening the sidebar.
  renderProfileSwitcherChips() {
    const row = document.getElementById('profile-switcher-row');
    if (!row) return;
    const charts = this.savedCharts || [];
    if (!charts.length) { row.style.display = 'none'; row.innerHTML = ''; return; }

    row.style.display = 'flex';
    row.innerHTML = charts.map(c => `
      <button type="button" class="profile-switcher-chip ${this.currentChart && this.currentChart.id === c.id ? 'active' : ''}"
              onclick="App.selectChart('${c.id}', true)" title="${c.chart_data?.ascendant_sign || ''}">
        👤 ${c.name}
      </button>
    `).join('') + `
      <button type="button" class="profile-switcher-chip add-new" onclick="App.openBirthModal()">+ Add</button>
    `;
  },

  // History of previously generated Kundli PDF reports, so a user does not have to regenerate one
  // every time; scoped client-side to this user's own saved charts (the list endpoint itself is global).
  async openMyReportsModal() {
    this.openModal('modal-my-reports');
    const body = document.getElementById('my-reports-list');
    if (!body) return;
    body.innerHTML = `<div style="text-align:center; padding:2rem; color: var(--text-muted);">⏳ Loading your reports...</div>`;
    try {
      const mineIds = new Set(this.getMyChartIds());
      const [reports, chartsRaw] = await Promise.all([
        API.getReports(),
        (this.savedCharts && this.savedCharts.length) ? Promise.resolve(this.savedCharts) : API.getRecentCharts()
      ]);
      const charts = (chartsRaw || []).filter(c => mineIds.has(c.id));
      const ownChartIds = new Set(charts.map(c => c.id));
      const nameOf = id => (charts || []).find(c => c.id === id)?.name || 'Birth Chart';
      const mine = (reports || []).filter(r => ownChartIds.has(r.chart_id));

      if (!mine.length) {
        body.innerHTML = `
          <div style="text-align:center; padding:2.25rem 1rem;">
            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">No reports generated yet.</p>
            <button type="button" class="btn-tool" onclick="App.closeModal('modal-my-reports'); App.openGroundedReportModal();">📜 Generate a Kundli Report</button>
          </div>`;
        return;
      }

      body.innerHTML = mine.map(r => `
        <div class="my-report-row">
          <div class="my-report-info">
            <strong>${nameOf(r.chart_id)}</strong>
            <span class="my-report-meta">${r.title || r.report_type} · ${new Date(r.created_at).toLocaleDateString()}</span>
          </div>
          <a href="#" onclick="API.openPrivateFile('${r.download_url}'); return false;" class="btn-tool" style="padding: 0.4rem 0.75rem; font-size: 0.78rem;">📥 Download</a>
        </div>
      `).join('');
    } catch (err) {
      body.innerHTML = `<div style="text-align:center; padding:2rem; color: var(--danger);">Could not load reports: ${err.message}</div>`;
    }
  },

  // Visible "which profile is this answer based on" indicator, in the chat header and the calling screen.
  updateLinkedProfileChip(chart) {
    const label = chart ? `${chart.name}${chart.chart_data?.ascendant_sign ? ' · ' + chart.chart_data.ascendant_sign : ''}` : '';
    const chatChip = document.getElementById('linked-profile-chip');
    const chatText = document.getElementById('linked-profile-chip-text');
    if (chatChip) chatChip.style.display = chart ? 'inline-flex' : 'none';
    if (chatText) chatText.textContent = label;

    const callChip = document.getElementById('calling-linked-profile-chip');
    const callText = document.getElementById('calling-linked-profile-chip-text');
    if (callChip) callChip.style.display = chart ? 'inline-flex' : 'none';
    if (callText) callText.textContent = label;
  },

  // GET /api/v1/charts is a global "recently created" feed, not scoped to any one visitor server-side,
  // so a chart is only treated as "mine" once this browser has actually created or opened it.
  MY_CHART_IDS_KEY: 'astro_my_chart_ids',

  rememberMyChartId(id) {
    if (!id) return;
    try {
      const ids = JSON.parse(localStorage.getItem(this.MY_CHART_IDS_KEY) || '[]');
      const next = [id, ...ids.filter(x => x !== id)].slice(0, 20);
      localStorage.setItem(this.MY_CHART_IDS_KEY, JSON.stringify(next));
    } catch (e) { /* storage unavailable; profile scoping degrades to "none remembered" */ }
  },

  getMyChartIds() {
    try { return JSON.parse(localStorage.getItem(this.MY_CHART_IDS_KEY) || '[]'); }
    catch (e) { return []; }
  },

  async loadSavedProfiles() {
    const list = document.getElementById('profiles-list');

    try {
      const mine = new Set(this.getMyChartIds());
      const charts = (await API.getRecentCharts()).filter(c => mine.has(c.id));
      this.savedCharts = charts;

      // Restore the saved birth profile as the active chart once per session, so chat and the
      // calling agent can use it immediately instead of asking the user for birth details again.
      if (!this.currentChart && charts.length) {
        const preferred = charts.find(c => c.is_default) || charts[0];
        try {
          await this.selectChart(preferred.id, false, true);
        } catch (e) {
          console.warn('Could not auto-restore saved birth profile:', e);
        }
      }

      if (!list) return;

      if (!charts.length) {
        list.innerHTML = `
          <li class="sidebar-item" onclick="App.openBirthModal()">
            <span class="item-title">+ Add Birth Profile</span>
          </li>
        `;
        return;
      }

      list.innerHTML = charts.map(c => `
        <li class="sidebar-item ${this.currentChart && this.currentChart.id === c.id ? 'active' : ''}" 
            onclick="App.selectChart('${c.id}', true)">
          <span class="item-title">👤 ${c.name}</span>
          <span style="font-size: 0.72rem; color: var(--gold-light);">${c.chart_data?.ascendant_sign || ''}</span>
        </li>
      `).join('') + `
        <li class="sidebar-item" onclick="App.openBirthModal()" style="border-top: 1px dashed rgba(255,255,255,0.08); margin-top: 0.35rem;">
          <span class="item-title" style="color: var(--primary-violet);">+ Add Profile</span>
        </li>
      `;

      // Also refresh intake chips if form is visible
      if (typeof ChatController !== 'undefined' && ChatController.renderIntakeSavedChips) {
        ChatController.renderIntakeSavedChips();
      }
      this.renderProfileSwitcherChips();
    } catch (err) {
      console.warn('Could not load profiles:', err);
    }
  },

  async selectChart(chartId, notify = true, skipHistoryLookup = false) {
    try {
      const chart = await API.getChartById(chartId);
      this.currentChart = chart;
      this.rememberMyChartId(chartId);
      this.updateActiveProfileUI(chart);
      this.loadSavedProfiles();

      // Auto-collapse sidebar on mobile/tablet so user sees the consultation area
      if (window.innerWidth <= 900) {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('drawer-backdrop');
        if (sidebar) sidebar.classList.add('collapsed');
        if (backdrop) backdrop.classList.remove('active');
      }

      // If clicked from saved profiles and has existing chat session, load their consultation history!
      if (!skipHistoryLookup && typeof ChatController !== 'undefined' && ChatController.openSessionForChart) {
        const opened = await ChatController.openSessionForChart(chartId);
        if (opened) {
          if (notify) this.showToast(`Opened consultation for ${chart.name} ✨`, 'info');
          return;
        }
      }

      // If intake form is on screen, populate it with this profile
      if (document.getElementById('chat-intake-form') && typeof ChatController !== 'undefined' && ChatController.fillIntakeFromProfile) {
        ChatController.fillIntakeFromProfile(chartId);
      }

      if (notify) {
        this.showToast(`Selected profile: ${chart.name}`, 'info');
      }
    } catch (err) {
      console.warn('Could not select chart:', err);
    }
  },

  // =========================================================================
  // Modern Date & Time Picker Initialization (Flatpickr)
  // =========================================================================
  initModernPickers(root = document) {
    if (typeof flatpickr === 'undefined') {
      console.warn('Flatpickr library not yet loaded, native pickers remain active');
      return;
    }

    try {
      // Modern Date Pickers
      root.querySelectorAll('.modern-date-picker, #intake-dob, #modal-dob, #milan-boy-dob, #milan-girl-dob, #panchang-input-date').forEach(el => {
        if (el._flatpickr) return;
        const isPanchang = el.id === 'panchang-input-date';
        flatpickr(el, {
          dateFormat: "Y-m-d",
          altInput: true,
          altFormat: "d M Y",
          altInputClass: (el.className || '') + ' flatpickr-custom-alt',
          maxDate: isPanchang ? undefined : "today",
          defaultDate: el.value || (isPanchang ? new Date() : undefined),
          allowInput: true,
          monthSelectorType: "dropdown",
          prevArrow: "‹",
          nextArrow: "›"
        });
      });

      // Modern Time Pickers
      root.querySelectorAll('.modern-time-picker, #intake-tob, #modal-tob, #milan-boy-tob, #milan-girl-tob').forEach(el => {
        if (el._flatpickr) return;
        flatpickr(el, {
          enableTime: true,
          noCalendar: true,
          dateFormat: "H:i",
          altInput: true,
          altFormat: "h:i K",
          altInputClass: (el.className || '') + ' flatpickr-custom-alt',
          time_24hr: false,
          defaultDate: el.value || undefined,
          allowInput: true
        });
      });
    } catch (err) {
      console.warn('Could not initialize modern pickers:', err);
    }
  },

  // =========================================================================
  // Upload Modal (Knowledge Base Attachment)
  // =========================================================================
  bindUploadModal() {
    const form = document.getElementById('form-modal-upload-doc');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('modal-doc-file');
      if (!fileInput.files.length) return this.showToast('Please select a file to attach', 'warning');

      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('title', document.getElementById('modal-doc-title').value);
      formData.append('author', document.getElementById('modal-doc-author').value);

      const statusDiv = document.getElementById('modal-upload-status');
      if (statusDiv) statusDiv.innerHTML = '<span class="status-pill" style="color: var(--gold-light);">⏳ Ingesting & indexing text...</span>';

      try {
        const res = await API.uploadDocument(formData);
        this.closeModal('modal-document-upload');
        this.showToast(`Document indexed: ${res.title} 📚`, 'success');
        form.reset();
        if (statusDiv) statusDiv.innerHTML = '';
      } catch (err) {
        if (statusDiv) statusDiv.innerHTML = `<span style="color: var(--danger); font-size: 0.8rem;">${err.message}</span>`;
        this.showToast(`Upload failed: ${err.message}`, 'error');
      }
    });
  },

  // =========================================================================
  // Vedic Consultation Engine Console Modal
  // =========================================================================
  bindAgentConsole() {
    const select = document.getElementById('modal-agent-tool-select');
    const desc = document.getElementById('modal-agent-tool-desc');
    const payloadInput = document.getElementById('modal-agent-tool-payload');
    const execBtn = document.getElementById('btn-modal-exec-tool');

    if (select) {
      select.addEventListener('change', () => {
        const toolName = select.value;
        const tool = this.agentToolsList.find(t => t.name === toolName);
        if (tool && desc && payloadInput) {
          desc.innerHTML = `<strong>${tool.name}:</strong> ${tool.description}`;

          const defaultArgs = {};
          tool.parameters.forEach(p => {
            if (p.name === 'date_of_birth') defaultArgs[p.name] = '1990-10-24';
            else if (p.name === 'latitude') defaultArgs[p.name] = 28.6139;
            else if (p.name === 'longitude') defaultArgs[p.name] = 77.2090;
            else if (p.name === 'sign') defaultArgs[p.name] = 'Aries';
            else if (p.name === 'query') defaultArgs[p.name] = 'Significations of Surya';
            else if (p.type === 'string') defaultArgs[p.name] = 'Taurus';
            else if (p.type === 'integer') defaultArgs[p.name] = 3;
            else if (p.type === 'float') defaultArgs[p.name] = 5.5;
            else if (p.type === 'array') defaultArgs[p.name] = [];
            else defaultArgs[p.name] = '';
          });
          payloadInput.value = JSON.stringify(defaultArgs, null, 2);
        }
      });
    }

    if (execBtn) {
      execBtn.addEventListener('click', async () => {
        const toolName = select.value;
        const output = document.getElementById('modal-agent-tool-output');
        const meta = document.getElementById('modal-agent-tool-meta');

        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(payloadInput.value);
        } catch (err) {
          return this.showToast('Invalid JSON in payload arguments', 'error');
        }

        if (output) output.innerText = 'Executing controlled tool...';

        try {
          const res = await API.executeAgentTool({
            tool_name: toolName,
            arguments: parsedArgs
          });

          if (meta) {
            meta.innerHTML = `
              <span class="shortcut-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">STATUS: ${res.status.toUpperCase()}</span>
              <span class="shortcut-badge" style="background: rgba(74, 27, 154, 0.2); color: #d8c6e3;">LATENCY: ${res.duration_ms}ms</span>
            `;
          }

          if (output) {
            output.innerText = JSON.stringify(res.result, null, 2);
          }
          this.showToast(`Tool ${toolName} executed successfully in ${res.duration_ms}ms ⚡`, 'success');
        } catch (err) {
          if (output) output.innerText = `Execution Error: ${err.message}`;
          this.showToast(`Tool execution failed: ${err.message}`, 'error');
        }
      });
    }
  },

  async loadAgentTools() {
    try {
      const tools = await API.getAgentTools();
      this.agentToolsList = tools;
      const select = document.getElementById('modal-agent-tool-select');
      if (select && tools.length > 0) {
        select.innerHTML = tools.map(t => `<option value="${t.name}">${t.name}</option>`).join('');
        select.dispatchEvent(new Event('change'));
      }
    } catch (err) {
      console.warn('Could not load agent tools:', err);
    }
  },

  // =========================================================================
  // Toast Notifications
  // =========================================================================
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '⚠️';
    else if (type === 'warning') icon = '🔮';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  // =========================================================================
  // Kundali Milan (Gun Milan 36 Gunas & Manglik Dosha)
  // =========================================================================
  lastMilanData: null,

  bindKundaliMilan() {
    const form = document.getElementById('form-kundali-milan');
    const btnLoadBoy = document.getElementById('btn-milan-load-boy-profile');
    const btnLoadGirl = document.getElementById('btn-milan-load-girl-profile');
    const btnShareMilanWA = document.getElementById('btn-share-milan-whatsapp');

    // Populate boy details from active profile
    if (btnLoadBoy) {
      btnLoadBoy.addEventListener('click', () => {
        if (!this.currentChart) {
          return this.showToast('No active birth profile loaded yet!', 'warning');
        }
        document.getElementById('milan-boy-name').value = this.currentChart.name;
        document.getElementById('milan-boy-dob').value = this.currentChart.date_of_birth;
        document.getElementById('milan-boy-tob').value = this.currentChart.time_of_birth ? this.currentChart.time_of_birth.substring(0, 5) : '12:00';
        document.getElementById('milan-boy-city').value = this.currentChart.city || 'New Delhi';
        document.getElementById('milan-boy-country').value = this.currentChart.country || 'India';
        document.getElementById('milan-boy-lat').value = this.currentChart.latitude || 28.6139;
        document.getElementById('milan-boy-lon').value = this.currentChart.longitude || 77.2090;
        document.getElementById('milan-boy-tz').value = this.currentChart.timezone_offset || 5.5;
        this.showToast(`Loaded ${this.currentChart.name} as Groom details! 🤵`, 'success');
      });
    }

    // Populate girl details from active profile
    if (btnLoadGirl) {
      btnLoadGirl.addEventListener('click', () => {
        if (!this.currentChart) {
          return this.showToast('No active birth profile loaded yet!', 'warning');
        }
        document.getElementById('milan-girl-name').value = this.currentChart.name;
        document.getElementById('milan-girl-dob').value = this.currentChart.date_of_birth;
        document.getElementById('milan-girl-tob').value = this.currentChart.time_of_birth ? this.currentChart.time_of_birth.substring(0, 5) : '12:00';
        document.getElementById('milan-girl-city').value = this.currentChart.city || 'Mumbai';
        document.getElementById('milan-girl-country').value = this.currentChart.country || 'India';
        document.getElementById('milan-girl-lat').value = this.currentChart.latitude || 19.0760;
        document.getElementById('milan-girl-lon').value = this.currentChart.longitude || 72.8777;
        document.getElementById('milan-girl-tz').value = this.currentChart.timezone_offset || 5.5;
        this.showToast(`Loaded ${this.currentChart.name} as Bride details! 👰`, 'success');
      });
    }

    const btnMilanPdf = document.getElementById('btn-download-milan-pdf');
    if (btnMilanPdf) {
      btnMilanPdf.addEventListener('click', async () => {
        if (!this.lastMilanPayload) { this.showToast('Please calculate Milan first!', 'warning'); return; }
        const { px } = await import('/src/utils/premium-copy.js');
        const label = document.getElementById('btn-download-milan-pdf-label');
        btnMilanPdf.disabled = true;
        if (label) label.textContent = px('mp.preparing');
        try {
          const res = await fetch('/api/v1/charts/milan/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(this.lastMilanPayload) });
          if (!res.ok) throw new Error('pdf');
          const url = URL.createObjectURL(await res.blob());
          const a = Object.assign(document.createElement('a'), { href: url, download: 'Kundali_Milan_Report.pdf' });
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        } catch (err) {
          this.showToast(px('mp.failed'), 'error');
        } finally {
          btnMilanPdf.disabled = false;
          if (label) label.textContent = px('mp.download');
        }
      });
    }

    if (btnShareMilanWA) {
      btnShareMilanWA.addEventListener('click', () => {
        if (this.lastMilanData) {
          ChartViewer.shareMilanWhatsApp(this.lastMilanData);
        } else {
          this.showToast('Please calculate Milan first!', 'warning');
        }
      });
    }

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const calcBtn = document.getElementById('btn-calc-milan');

      const boyName = document.getElementById('milan-boy-name')?.value?.trim() || 'Groom (वर)';
      const boyDob = document.getElementById('milan-boy-dob')?.value;
      const girlName = document.getElementById('milan-girl-name')?.value?.trim() || 'Bride (वधू)';
      const girlDob = document.getElementById('milan-girl-dob')?.value;

      if (!boyDob) {
        this.showToast('Please enter Groom (Boy) Birth Date / वर की जन्म तिथि भरें', 'warning');
        return;
      }
      if (!girlDob) {
        this.showToast('Please enter Bride (Girl) Birth Date / वधू की जन्म तिथि भरें', 'warning');
        return;
      }

      if (calcBtn) {
        calcBtn.disabled = true;
        calcBtn.innerHTML = '<span>⏳</span> <span>Calculating 36 Gunas with Swiss Ephemeris...</span>';
      }

      const boyTob = document.getElementById('milan-boy-tob')?.value || '12:00';
      const girlTob = document.getElementById('milan-girl-tob')?.value || '12:00';

      const payload = {
        boy: {
          name: boyName,
          date_of_birth: boyDob,
          time_of_birth: boyTob.length === 5 ? `${boyTob}:00` : boyTob,
          latitude: parseFloat(document.getElementById('milan-boy-lat')?.value) || 28.6139,
          longitude: parseFloat(document.getElementById('milan-boy-lon')?.value) || 77.2090,
          timezone_offset: parseFloat(document.getElementById('milan-boy-tz')?.value) || 5.5,
          city: document.getElementById('milan-boy-city')?.value || 'New Delhi',
          country: document.getElementById('milan-boy-country')?.value || 'India'
        },
        girl: {
          name: girlName,
          date_of_birth: girlDob,
          time_of_birth: girlTob.length === 5 ? `${girlTob}:00` : girlTob,
          latitude: parseFloat(document.getElementById('milan-girl-lat')?.value) || 19.0760,
          longitude: parseFloat(document.getElementById('milan-girl-lon')?.value) || 72.8777,
          timezone_offset: parseFloat(document.getElementById('milan-girl-tz')?.value) || 5.5,
          city: document.getElementById('milan-girl-city')?.value || 'Mumbai',
          country: document.getElementById('milan-girl-country')?.value || 'India'
        }
      };

      try {
        const result = await API.calculateMilan(payload);
        this.lastMilanData = result;
        this.lastMilanPayload = payload;
        this.renderMilanResult(result);
        this.showToast(`Kundali Milan calculated: ${result.total_score}/36 Gunas! 💍`, 'success');
      } catch (err) {
        console.error('Milan error:', err);
        this.showToast(`Milan calculation failed: ${err.message}`, 'error');
      } finally {
        if (calcBtn) {
          calcBtn.disabled = false;
          calcBtn.innerHTML = '<span>💍</span> <span>Calculate Gun Milan (36 Gunas & Manglik Dosha)</span> <span>→</span>';
        }
      }
    });
  },

  renderMilanResult(res) {
    const container = document.getElementById('milan-result-container');
    if (!container) return;

    // Total Score & Percentage
    const scoreVal = document.getElementById('milan-score-val');
    const scorePct = document.getElementById('milan-percentage-text');
    const verdictBadge = document.getElementById('milan-verdict-badge');
    const recText = document.getElementById('milan-recommendation-text');

    if (scoreVal) scoreVal.innerText = res.total_score;
    if (scorePct) scorePct.innerText = `${res.percentage}% Match (${res.total_score}/36)`;

    if (verdictBadge) {
      verdictBadge.innerText = res.verdict;
      verdictBadge.className = 'milan-verdict-pill';
      if (res.total_score >= 25) verdictBadge.classList.add('shubh');
      else if (res.total_score >= 18) verdictBadge.classList.add('madhyam');
      else verdictBadge.classList.add('ashubh');
    }

    if (recText) recText.innerText = res.recommendation;

    // Manglik details
    const mc = res.manglik_compatibility || {};
    const boyManglik = (res.boy_summary && res.boy_summary.manglik) || mc.boy || {};
    const girlManglik = (res.girl_summary && res.girl_summary.manglik) || mc.girl || {};

    const boyPill = document.getElementById('boy-manglik-pill');
    const boyDesc = document.getElementById('boy-manglik-desc');
    if (boyPill) {
      if (boyManglik.is_cancelled || boyManglik.has_parihar) {
        boyPill.innerText = 'Manglik (Parihar / Cancelled)';
        boyPill.className = 'manglik-pill parihar';
      } else if (boyManglik.is_manglik) {
        boyPill.innerText = boyManglik.status || `Manglik (${boyManglik.intensity || 'Active'})`;
        boyPill.className = 'manglik-pill active-dosha';
      } else {
        boyPill.innerText = 'Non-Manglik (निर्दोष)';
        boyPill.className = 'manglik-pill non-manglik';
      }
    }
    if (boyDesc) {
      const hStr = boyManglik.mars_house_lagna ? `Lagna H${boyManglik.mars_house_lagna}, Moon H${boyManglik.mars_house_moon || '-'}` : (boyManglik.mars_house ? `House ${boyManglik.mars_house}` : '');
      const sStr = boyManglik.mars_sign ? `Mars in ${boyManglik.mars_sign}` : '';
      boyDesc.innerText = [sStr, hStr].filter(Boolean).join(' • ') || boyManglik.description || (boyManglik.is_manglik ? 'Manglik Dosha detected' : 'No Manglik Dosha observed.');
    }

    const girlPill = document.getElementById('girl-manglik-pill');
    const girlDesc = document.getElementById('girl-manglik-desc');
    if (girlPill) {
      if (girlManglik.is_cancelled || girlManglik.has_parihar) {
        girlPill.innerText = 'Manglik (Parihar / Cancelled)';
        girlPill.className = 'manglik-pill parihar';
      } else if (girlManglik.is_manglik) {
        girlPill.innerText = girlManglik.status || `Manglik (${girlManglik.intensity || 'Active'})`;
        girlPill.className = 'manglik-pill active-dosha';
      } else {
        girlPill.innerText = 'Non-Manglik (निर्दोष)';
        girlPill.className = 'manglik-pill non-manglik';
      }
    }
    if (girlDesc) {
      const hStr = girlManglik.mars_house_lagna ? `Lagna H${girlManglik.mars_house_lagna}, Moon H${girlManglik.mars_house_moon || '-'}` : (girlManglik.mars_house ? `House ${girlManglik.mars_house}` : '');
      const sStr = girlManglik.mars_sign ? `Mars in ${girlManglik.mars_sign}` : '';
      girlDesc.innerText = [sStr, hStr].filter(Boolean).join(' • ') || girlManglik.description || (girlManglik.is_manglik ? 'Manglik Dosha detected' : 'No Manglik Dosha observed.');
    }

    const manglikNote = document.getElementById('milan-manglik-summary-text');
    if (manglikNote) {
      manglikNote.innerText = mc.note || (mc.is_compatible ? 'Horoscopes are Manglik-compatible.' : 'Manglik assessment completed.');
    }

    // Ashtakoota table
    const tbody = document.getElementById('milan-kootas-tbody');
    if (tbody && res.kootas) {
      if (Array.isArray(res.kootas)) {
        tbody.innerHTML = res.kootas.map(k => {
          const obtained = k.obtained_points ?? k.obtained_score ?? 0;
          const maxPts = k.max_points ?? k.max_score ?? 0;
          const isFull = obtained === maxPts;
          const isZero = obtained === 0;
          const scoreColor = isFull ? '#059669' : (isZero ? '#DC2626' : '#D97706');
          return `
            <tr>
              <td><strong>${k.koota || k.name}</strong></td>
              <td style="color: var(--text-muted); font-size: 0.78rem;">${k.verdict || k.area_of_life || '-'}</td>
              <td style="font-weight: 700; color: ${scoreColor};">${obtained}</td>
              <td style="color: var(--text-dim);">${maxPts}</td>
              <td style="font-size: 0.78rem;">${k.description || '-'}</td>
            </tr>
          `;
        }).join('');
      } else {
        const kootasOrder = ['varna', 'vashya', 'tara', 'yoni', 'graha_maitri', 'gana', 'bhakoot', 'nadi'];
        tbody.innerHTML = kootasOrder.map(key => {
          const k = res.kootas[key];
          if (!k) return '';
          const obtained = k.obtained_score ?? k.obtained_points ?? 0;
          const maxPts = k.max_score ?? k.max_points ?? 0;
          const isFull = obtained === maxPts;
          const isZero = obtained === 0;
          const scoreColor = isFull ? '#059669' : (isZero ? '#DC2626' : '#D97706');
          return `
            <tr>
              <td><strong>${k.name || k.koota}</strong></td>
              <td style="color: var(--text-muted); font-size: 0.78rem;">${k.area_of_life || k.verdict || '-'}</td>
              <td style="font-weight: 700; color: ${scoreColor};">${obtained}</td>
              <td style="color: var(--text-dim);">${maxPts}</td>
              <td style="font-size: 0.78rem;">${k.description || '-'}</td>
            </tr>
          `;
        }).join('');
      }
    }

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  // =========================================================================
  // Aaj Ka Panchang
  // =========================================================================
  bindPanchang() {
    const refreshBtn = document.getElementById('btn-refresh-panchang');
    const dateInput = document.getElementById('panchang-input-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.fetchPanchang());
    }
  },

  async openPanchangModal() {
    this.openModal('modal-panchang');
    const dateInput = document.getElementById('panchang-input-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    await this.fetchPanchang();
  },

  async fetchPanchang() {
    const dateInput = document.getElementById('panchang-input-date');
    const cityInput = document.getElementById('panchang-input-city');
    const dateVal = (dateInput && dateInput.value) || new Date().toISOString().split('T')[0];
    const cityVal = (cityInput && cityInput.value) || 'New Delhi';

    let lat = 28.6139;
    let lon = 77.2090;
    if (this.currentChart && this.currentChart.latitude) {
      lat = this.currentChart.latitude;
      lon = this.currentChart.longitude;
    }

    try {
      const p = await API.getPanchang(dateVal, lat, lon);
      this.renderPanchang(p);
    } catch (err) {
      console.error('Panchang error:', err);
      this.showToast(`Panchang load failed: ${err.message}`, 'error');
    }
  },

  renderPanchang(p) {
    if (!p) return;
    const tithiEl = document.getElementById('panchang-tithi');
    const pakshaEl = document.getElementById('panchang-paksha');
    const nakshatraEl = document.getElementById('panchang-nakshatra');
    const padaEl = document.getElementById('panchang-nakshatra-pada');
    const yogaEl = document.getElementById('panchang-yoga');
    const karanEl = document.getElementById('panchang-karan');
    const sunEl = document.getElementById('panchang-sun-timings');
    const vaaraEl = document.getElementById('panchang-vaara');
    const moonEl = document.getElementById('panchang-moon-sign');
    const abhijitEl = document.getElementById('panchang-abhijit');
    const rahuEl = document.getElementById('panchang-rahukaal');

    if (tithiEl) tithiEl.innerText = p.tithi?.name || '-';
    if (pakshaEl) pakshaEl.innerText = `${p.tithi?.paksha || ''} Paksha • Tithi #${p.tithi?.number || ''}`;
    if (nakshatraEl) nakshatraEl.innerText = p.nakshatra?.name || '-';
    if (padaEl) padaEl.innerText = `Lord: ${p.nakshatra?.lord || ''} • Pada ${p.nakshatra?.pada || 1}`;
    if (yogaEl) yogaEl.innerText = p.yoga?.name || '-';
    if (karanEl) karanEl.innerText = p.karana?.name || '-';
    if (sunEl) sunEl.innerText = `🌅 ${p.sunrise || '06:00'} / 🌇 ${p.sunset || '18:00'}`;
    if (vaaraEl) vaaraEl.innerText = p.vaara || '';
    if (moonEl) moonEl.innerText = p.moon_sign || '-';

    if (abhijitEl) {
      abhijitEl.innerText = p.abhijit_muhurat ? `${p.abhijit_muhurat.start} - ${p.abhijit_muhurat.end}` : '11:45 - 12:35';
    }
    if (rahuEl) {
      rahuEl.innerText = p.rahu_kaal ? `${p.rahu_kaal.start} - ${p.rahu_kaal.end}` : '13:30 - 15:00';
    }
  },

  // =========================================================================
  // Dedicated Panchang Page (/panchang) Methods
  // =========================================================================
  panchangPageCity: 'New Delhi',
  panchangPageLat: 28.6139,
  panchangPageLon: 77.2090,

  async loadPanchangPage() {
    const dateInput = document.getElementById('panchang-page-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    const cityInput = document.getElementById('panchang-page-city');
    if (cityInput && !cityInput.value) {
      cityInput.value = this.panchangPageCity || 'New Delhi';
    }
    await this.fetchPanchangForPage();
  },

  setPanchangCity(cityName, lat, lon) {
    this.panchangPageCity = cityName;
    this.panchangPageLat = lat;
    this.panchangPageLon = lon;
    const cityInput = document.getElementById('panchang-page-city');
    if (cityInput) cityInput.value = cityName;
    this.fetchPanchangForPage();
  },

  async fetchPanchangForPage() {
    const dateInput = document.getElementById('panchang-page-date');
    const cityInput = document.getElementById('panchang-page-city');
    const dateVal = (dateInput && dateInput.value) || new Date().toISOString().split('T')[0];
    const cityName = (cityInput && cityInput.value.trim()) || this.panchangPageCity || 'New Delhi';
    
    const cityMap = {
      'new delhi': { lat: 28.6139, lon: 77.2090 },
      'delhi': { lat: 28.6139, lon: 77.2090 },
      'mumbai': { lat: 19.0760, lon: 72.8777 },
      'bengaluru': { lat: 12.9716, lon: 77.5946 },
      'bangalore': { lat: 12.9716, lon: 77.5946 },
      'varanasi': { lat: 25.3176, lon: 82.9739 },
      'kolkata': { lat: 22.5726, lon: 88.3639 },
      'chennai': { lat: 13.0827, lon: 80.2707 },
      'hyderabad': { lat: 17.3850, lon: 78.4867 },
      'ahmedabad': { lat: 23.0225, lon: 72.5714 },
      'jaipur': { lat: 26.9124, lon: 75.7873 },
      'pune': { lat: 18.5204, lon: 73.8567 },
      'lucknow': { lat: 26.8467, lon: 80.9462 },
      'patna': { lat: 25.5941, lon: 85.1376 },
      'ujjain': { lat: 23.1765, lon: 75.7885 },
      'haridwar': { lat: 29.9457, lon: 78.1642 },
      'ayodhya': { lat: 26.7922, lon: 82.1998 }
    };

    const norm = cityName.toLowerCase();
    let lat = this.panchangPageLat;
    let lon = this.panchangPageLon;
    if (cityMap[norm]) {
      lat = cityMap[norm].lat;
      lon = cityMap[norm].lon;
      this.panchangPageLat = lat;
      this.panchangPageLon = lon;
    }

    try {
      const p = await API.getPanchang({ date: dateVal, latitude: lat, longitude: lon, timezone_offset: 5.5 });
      this.renderPanchangPageView(p, cityName, dateVal);
    } catch (err) {
      console.error('Failed to load panchang page:', err);
      this.showToast(`Panchang calculation failed: ${err.message}`, 'error');
    }
  },

  renderPanchangPageView(p, cityName, dateVal) {
    if (!p) return;
    
    const cityBadge = document.getElementById('panchang-page-city-badge');
    if (cityBadge) cityBadge.innerText = `📍 ${cityName} • ${dateVal}`;

    // 1. Tithi
    const tithiVal = document.getElementById('panchang-page-tithi');
    const tithiSub = document.getElementById('panchang-page-tithi-sub');
    if (tithiVal) tithiVal.innerText = p.tithi?.name || p.tithi?.name_english || 'Shukla Dashami';
    if (tithiSub) tithiSub.innerText = `${p.tithi?.paksha || 'Shukla'} Paksha • Tithi #${p.tithi?.number || 10}`;

    // 2. Nakshatra
    const nakVal = document.getElementById('panchang-page-nakshatra');
    const nakSub = document.getElementById('panchang-page-nakshatra-sub');
    if (nakVal) nakVal.innerText = p.nakshatra?.name || p.nakshatra?.name_english || 'Rohini';
    if (nakSub) nakSub.innerText = `Lord: ${p.nakshatra?.lord || 'Moon'} • Pada ${p.nakshatra?.pada || 2}`;

    // 3. Yoga
    const yogaVal = document.getElementById('panchang-page-yoga');
    const yogaSub = document.getElementById('panchang-page-yoga-sub');
    if (yogaVal) yogaVal.innerText = p.yoga?.name || p.yoga?.name_english || 'Shobhana';
    if (yogaSub) yogaSub.innerText = 'Auspicious Classical Yoga';

    // 4. Karana
    const karanVal = document.getElementById('panchang-page-karana');
    const karanSub = document.getElementById('panchang-page-karana-sub');
    if (karanVal) karanVal.innerText = p.karana?.name || p.karana?.name_english || 'Bava';
    if (karanSub) karanSub.innerText = 'Half-tithi division';

    // 5. Sun & Vaara
    const sunVal = document.getElementById('panchang-page-sun');
    const sunSub = document.getElementById('panchang-page-sun-sub');
    if (sunVal) sunVal.innerText = `🌅 ${p.sunrise || '06:15'} / 🌇 ${p.sunset || '18:10'}`;
    if (sunSub) sunSub.innerText = `${p.vaara || 'Wednesday (बुधवार)'} • Dinmaan`;

    // 6. Moon Sign
    const moonVal = document.getElementById('panchang-page-moon');
    const moonSub = document.getElementById('panchang-page-moon-sub');
    if (moonVal) moonVal.innerText = p.moon_sign || 'Taurus (वृषभ)';
    if (moonSub) moonSub.innerText = 'Lahiri Ayanamsa (24°10\')';

    // Muhurats
    const abhijitVal = document.getElementById('panchang-page-abhijit');
    if (abhijitVal) {
      abhijitVal.innerText = p.abhijit_muhurat ? `${p.abhijit_muhurat.start} - ${p.abhijit_muhurat.end}` : '11:45 AM - 12:35 PM';
    }
    const rahuVal = document.getElementById('panchang-page-rahu');
    if (rahuVal) {
      rahuVal.innerText = p.rahu_kaal ? `${p.rahu_kaal.start} - ${p.rahu_kaal.end}` : '04:30 PM - 06:00 PM';
    }

    // Day & Night Choghadiya
    const choghadiyaWrap = document.getElementById('panchang-page-choghadiya-list');
    if (choghadiyaWrap) {
      const slots = (p.day_choghadiya && p.day_choghadiya.length) ? p.day_choghadiya : [
        { name: 'Udveg', nature: 'Ashubh', time: '06:15 - 07:44' },
        { name: 'Char', nature: 'Shubh', time: '07:44 - 09:14' },
        { name: 'Labh', nature: 'Shubh', time: '09:14 - 10:43' },
        { name: 'Amrit', nature: 'Ati Shubh', time: '10:43 - 12:13' },
        { name: 'Kaal', nature: 'Ashubh', time: '12:13 - 13:42' },
        { name: 'Shubh', nature: 'Shubh', time: '13:42 - 15:11' },
        { name: 'Rog', nature: 'Ashubh', time: '15:11 - 16:41' },
        { name: 'Udveg', nature: 'Ashubh', time: '16:41 - 18:10' }
      ];

      choghadiyaWrap.innerHTML = slots.map(s => {
        const isShubh = (s.nature || '').toLowerCase().includes('shubh') || (s.nature || '').toLowerCase().includes('amrit') || (s.nature || '').toLowerCase().includes('labh');
        const badgeClass = isShubh ? 'choghadiya-badge-shubh' : 'choghadiya-badge-ashubh';
        const displayTime = s.time || `${s.start || ''} - ${s.end || ''}`;
        return `
          <div class="choghadiya-item-card">
            <div class="choghadiya-item-time">${displayTime}</div>
            <div class="choghadiya-item-name">${s.name_english || s.name}</div>
            <span class="${badgeClass}">${s.nature || (isShubh ? 'Shubh' : 'Ashubh')}</span>
          </div>
        `;
      }).join('');
    }
  },

  // =========================================================================
  // Shani Sade Sati & Transit Tracker
  // =========================================================================
  bindSadeSati() {
    const btnCalc = document.getElementById('btn-calc-sadesati');
    if (btnCalc) {
      btnCalc.addEventListener('click', () => this.fetchSadeSati());
    }
  },

  async openSadeSatiModal() {
    this.openModal('modal-sade-sati');
    const select = document.getElementById('sadesati-rashi-select');
    if (select && this.currentChart && this.currentChart.chart_data && this.currentChart.chart_data.moon_sign) {
      select.value = this.currentChart.chart_data.moon_sign;
    }
    await this.fetchSadeSati();
  },

  async fetchSadeSati() {
    const select = document.getElementById('sadesati-rashi-select');
    const sign = (select && select.value) || 'Pisces';

    try {
      const data = await API.getSadeSati(sign);
      this.renderSadeSati(data);
    } catch (err) {
      console.error('Sade Sati error:', err);
      this.showToast(`Sade Sati check failed: ${err.message}`, 'error');
    }
  },

  renderSadeSati(data) {
    if (!data) return;
    const headingEl = document.getElementById('sadesati-heading');
    const badgeEl = document.getElementById('sadesati-phase-badge');
    const explEl = document.getElementById('sadesati-explanation');
    const rahuKetuEl = document.getElementById('sadesati-rahu-ketu');
    const remediesContainer = document.getElementById('sadesati-remedies-list');

    if (headingEl) {
      headingEl.innerText = `${data.moon_sign} Rashi: ${data.phase_title || data.phase_hindi || data.status || ''}`;
    }
    if (badgeEl) {
      const isSadeSati = data.is_sade_sati || data.is_in_sade_sati;
      const isDhaiya = data.is_dhaiya || data.is_in_dhaiya;
      badgeEl.innerText = isSadeSati ? `Sade Sati (${data.phase_code ? data.phase_code.toUpperCase() : 'Active'})` : (isDhaiya ? 'Dhaiya Active' : 'Free');
      badgeEl.style.background = isSadeSati ? '#FDE68A' : (isDhaiya ? '#E9D5FF' : '#DCFCE7');
      badgeEl.style.color = isSadeSati ? '#78350F' : (isDhaiya ? '#352343' : '#166534');
    }
    if (explEl) {
      explEl.innerText = data.transit_impact || data.explanation || '';
    }

    // Step indicators
    const step1 = document.getElementById('phase-step-1');
    const step2 = document.getElementById('phase-step-2');
    const step3 = document.getElementById('phase-step-3');

    const phase = data.phase_code || (data.phase === 1 ? 'rising' : (data.phase === 2 ? 'peak' : (data.phase === 3 ? 'setting' : '')));
    if (step1) step1.classList.toggle('active', phase === 'rising');
    if (step2) step2.classList.toggle('active', phase === 'peak');
    if (step3) step3.classList.toggle('active', phase === 'setting');

    // Rahu Ketu
    if (rahuKetuEl && data.rahu_ketu_transit) {
      const rk = data.rahu_ketu_transit;
      rahuKetuEl.innerHTML = `<strong>Rahu in ${rk.rahu_sign} / Ketu in ${rk.ketu_sign}:</strong> ${rk.summary || rk.impact || ''}`;
    }

    // Remedies
    if (remediesContainer && data.remedies) {
      remediesContainer.innerHTML = data.remedies.map(r => `
        <div class="remedy-item">
          <span class="remedy-bullet">✦</span>
          <span>${r}</span>
        </div>
      `).join('');
    }
  },

  // =========================================================================
  // Lagna Kundli Image Download & WhatsApp Sharing
  // =========================================================================
  bindExportButtons() {
    const btnDownloadPNG = document.getElementById('btn-download-kundli-png');
    const btnShareWA = document.getElementById('btn-share-kundli-whatsapp');

    if (btnDownloadPNG) {
      btnDownloadPNG.addEventListener('click', () => {
        const svgBox = document.querySelector('#context-kundali-svg svg');
        if (!svgBox) {
          return this.showToast('Please calculate your birth chart first to export Kundli PNG! 🪐', 'warning');
        }
        ChartViewer.downloadKundliPNG(svgBox, this.currentChart ? this.currentChart.name : 'Lagna_Kundli');
      });
    }

    if (btnShareWA) {
      btnShareWA.addEventListener('click', () => {
        ChartViewer.shareKundliWhatsApp(this.currentChart);
      });
    }
  },

  // =========================================================================
  // Multi-Astrologer Directory & Marketplace
  // =========================================================================
  directoryFilter: {
    type: 'all',
    specialty: '',
    language: '',
    sort: 'recommended',
    q: ''
  },
  astrologersList: [],
  currentUser: null,

  bindAstrologerDirectory() {
    // Type Filter Tabs
    const tabsContainer = document.getElementById('directory-tabs');
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.dir-tab');
        if (!btn) return;
        document.querySelectorAll('.dir-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        this.directoryFilter.type = btn.dataset.tab;
        this.loadAstrologerDirectory();
      });
    }

    // Search Input
    const searchInput = document.getElementById('dir-search-input');
    if (searchInput) {
      let debounceTimer = null;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.directoryFilter.q = e.target.value.trim();
          this.loadAstrologerDirectory();
        }, 250);
      });
    }

    // Specialty & Language Filters
    const specFilter = document.getElementById('dir-specialty-filter');
    if (specFilter) {
      specFilter.addEventListener('change', (e) => {
        this.directoryFilter.specialty = e.target.value;
        this.loadAstrologerDirectory();
      });
    }

    const langFilter = document.getElementById('dir-language-filter');
    if (langFilter) {
      langFilter.addEventListener('change', (e) => {
        this.directoryFilter.language = e.target.value;
        this.loadAstrologerDirectory();
      });
    }

    const sortSelect = document.getElementById('dir-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.directoryFilter.sort = e.target.value;
        this.loadAstrologerDirectory();
      });
    }

    // Open Smart Match from Directory CTA
    const btnOpenMatch = document.getElementById('btn-open-smart-match-from-dir');
    if (btnOpenMatch) {
      btnOpenMatch.addEventListener('click', () => {
        this.openModal('modal-smart-matching');
      });
    }

    // Clear Filters
    const btnClear = document.getElementById('btn-clear-dir-filters');
    if (btnClear) {
      btnClear.addEventListener('click', () => {
        this.directoryFilter = { type: 'all', specialty: '', language: '', sort: 'recommended', q: '' };
        if (searchInput) searchInput.value = '';
        if (specFilter) specFilter.value = '';
        if (langFilter) langFilter.value = '';
        if (sortSelect) sortSelect.value = 'recommended';
        document.querySelectorAll('.dir-tab').forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.dir-tab[data-tab="all"]');
        if (allTab) allTab.classList.add('active');
        this.loadAstrologerDirectory();
      });
    }
  },

  // Last-known astrologer list, so cards can paint instantly while the fresh list loads (stale-while-revalidate).
  readAstrologerCache() {
    try {
      const raw = JSON.parse(localStorage.getItem('astro_list_cache_v1') || 'null');
      if (raw && Array.isArray(raw.items) && raw.items.length && Date.now() - raw.at < 24 * 3600 * 1000) return raw.items;
    } catch (_) { /* storage unavailable or corrupt */ }
    return null;
  },

  writeAstrologerCache(items) {
    try { localStorage.setItem('astro_list_cache_v1', JSON.stringify({ at: Date.now(), items })); } catch (_) { /* quota or blocked */ }
  },

  async loadAstrologerDirectory() {
    const listEl = document.getElementById('directory-page-cards-grid');
    const modalListEl = document.getElementById('astrologers-modal-list');
    if (!listEl && !modalListEl) return;

    try {
      const params = { limit: 50 };
      if (this.directoryFilter.type === 'human') params.is_ai = false;
      else if (this.directoryFilter.type === 'ai') params.is_ai = true;
      else if (this.directoryFilter.type === 'online') params.availability = 'online';

      if (this.directoryFilter.specialty) params.expertise = this.directoryFilter.specialty;
      if (this.directoryFilter.language) params.language = this.directoryFilter.language;
      if (this.directoryFilter.sort) params.sort_by = this.directoryFilter.sort;
      if (this.directoryFilter.q) params.search = this.directoryFilter.q;

      const isDefaultView = this.directoryFilter.type === 'all' && !this.directoryFilter.specialty &&
        !this.directoryFilter.language && !this.directoryFilter.q;
      if (isDefaultView && listEl && !listEl.querySelector('.ac-card')) {
        const cached = this.readAstrologerCache();
        if (cached) listEl.innerHTML = cached.map(a => this.renderAstrologerCardHtml(a, ChatController.selectedAstrologer)).join('');
      }

      const res = await API.getAstrologers(params);
      const astrologers = Array.isArray(res) ? res : (res.items || []);
      this.astrologersList = astrologers;
      if (isDefaultView) this.writeAstrologerCache(astrologers);

      window.DirectoryChips?.setCount(res.total || astrologers.length);
      window.DirectoryChips?.paint();

      // Update badge counts
      const countBadge = document.getElementById('directory-total-badge');
      const sideBadge = document.getElementById('astrologers-count-badge');
      const dirCountAll = document.getElementById('dir-count-all');
      if (countBadge) countBadge.innerText = `${res.total || astrologers.length} Astrologers`;
      if (sideBadge) sideBadge.innerText = `${res.total || astrologers.length} Astrologers`;
      if (dirCountAll) dirCountAll.innerText = res.total || astrologers.length;

      // Update active filters strip
      const activeFiltersStrip = document.getElementById('dir-active-filters-strip');
      const activeChipsContent = document.getElementById('dir-active-chips-content');
      const chips = [];
      if (this.directoryFilter.type && this.directoryFilter.type !== 'all') chips.push(`Mode: ${this.directoryFilter.type}`);
      if (this.directoryFilter.specialty) chips.push(`Concern: ${this.directoryFilter.specialty}`);
      if (this.directoryFilter.language) chips.push(`Language: ${this.directoryFilter.language}`);
      if (this.directoryFilter.q) chips.push(`"${this.directoryFilter.q}"`);

      if (activeFiltersStrip && activeChipsContent) {
        if (chips.length > 0) {
          activeFiltersStrip.style.display = 'flex';
          activeChipsContent.innerHTML = chips.map(c => `<span class="specialty-pill" style="background:#EEF2FF; color:#1e0b44; font-size: 0.72rem;">${c}</span>`).join('');
        } else {
          activeFiltersStrip.style.display = 'none';
        }
      }

      const activeId = ChatController.selectedAstrologer;

      if (astrologers.length === 0) {
        const emptyHtml = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; color: #64748B;">
            <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
            <p style="font-weight: 700; margin-bottom: 0.25rem;">No astrologers matched your search criteria.</p>
            <p style="font-size: 0.85rem;">Try clearing search keywords or choosing different languages/specialties.</p>
          </div>
        `;
        if (listEl) listEl.innerHTML = emptyHtml;
        if (modalListEl) modalListEl.innerHTML = emptyHtml;
        return;
      }

      const cardsHtml = astrologers.map(a => this.renderAstrologerCardHtml(a, activeId)).join('');
      if (listEl) listEl.innerHTML = cardsHtml;
      if (modalListEl) modalListEl.innerHTML = cardsHtml;
      if (listEl) window.DirectoryChips?.paginate();
    } catch (err) {
      console.error('Failed to load astrologers directory:', err);
      if (listEl && listEl.querySelector('.ac-card')) return; // keep the cached cards instead of replacing them with an error
      const errHtml = `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #DC2626;">Failed to load astrologers: ${err.message}</div>`;
      if (listEl) listEl.innerHTML = errHtml;
      if (modalListEl) modalListEl.innerHTML = errHtml;
    }
  },

  renderAvatarHtml(avatarStr, name = 'Astrologer', extraClass = '') {
    if (!avatarStr) return `<span class="astrologer-avatar-emoji text-3xl ${extraClass}">🕉️</span>`;
    const s = String(avatarStr).trim();
    if (s.includes('/') || s.endsWith('.svg') || s.endsWith('.png') || s.endsWith('.jpg') || s.startsWith('data:')) {
      return `<img src="${s}" alt="${name}" class="astrologer-avatar-img w-full h-full object-cover rounded-full ${extraClass}" onerror="this.onerror=null; this.src='assets/portraits/default-avatar.svg';">`;
    }
    return `<span class="astrologer-avatar-emoji text-3xl ${extraClass}">${s}</span>`;
  },

  renderAstrologerCardHtml(a, activeId = null) {
    if (window.AstrologerCardComponent && typeof window.AstrologerCardComponent.render === 'function') {
      return window.AstrologerCardComponent.render(a, { activeId });
    }
    const isOnline = a.availability === 'online' || a.is_online === true;
    const isBusy = a.availability === 'busy';
    const statusText = isOnline ? 'Online' : (isBusy ? 'Busy' : 'Offline');
    const statusDotClass = isOnline ? 'bg-emerald-500' : (isBusy ? 'bg-amber-500' : 'bg-slate-400');
    const statusBadgeClass = isOnline 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : (isBusy ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200');

    const priceText = (a.price_per_minute === 0 || a.price_per_minute == null)
      ? '<span class="font-bold text-[#1E1B4B] text-base">₹35</span><span class="text-xs text-slate-500 font-medium"> /min</span>'
      : `<span class="font-bold text-[#1E1B4B] text-base">₹${Math.round(a.price_per_minute)}</span><span class="text-xs text-slate-500 font-medium"> /min</span>`;

    const portraitUrl = (window.AstrologerCardComponent && window.AstrologerCardComponent.getPortraitUrl)
      ? window.AstrologerCardComponent.getPortraitUrl(a)
      : 'assets/portraits/pt-rameshwar-dwivedi.jpg';

    const isFemale = a.gender === 'female' || /ananya|vidushi|meera|gayatri|kalpana|pallavi|priyanka|shalini|shambhavi|sunita|aradhana|meenakshi|radhika|kavita/i.test(a.name || '');
    const honorBadgeHtml = isFemale
      ? `<div class="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#4a1b9a] to-[#6b3fc4] text-white shadow-xs border border-[#e3d8f3]"><span>★</span><span>विदुषी रत्न</span></div>`
      : `<div class="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#D97706] to-[#E8AD35] text-[#1E1B4B] shadow-xs border border-[#FDE68A]"><span>★</span><span>स्वर्ण पदक</span></div>`;

    return `
      <article class="astrologer-card bg-white border border-[#E7E2D8] hover:border-[#FCD34D] rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-lg transition-all duration-200 min-w-0 w-full group relative overflow-hidden" data-id="${a.id}">
        <div>
          <!-- Top Area: Portrait Photograph with Controlled Dimensions & Status Badge -->
          <div class="relative w-full aspect-[4/3.5] rounded-xl overflow-hidden bg-[#FAF8F2] mb-3 border border-[#F1ECE1]">
            <img 
              src="${portraitUrl}" 
              alt="${a.name}" 
              class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              loading="lazy" decoding="async"
              onerror="this.onerror=null; this.src='/assets/portraits/default-avatar.svg';"
            />
            <!-- Honor Badge -->
            ${honorBadgeHtml}

            <!-- Status Badge in Top Right -->
            <div class="absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${statusBadgeClass} shadow-xs">
              <span class="w-2 h-2 rounded-full ${statusDotClass}"></span>
              <span>${statusText}</span>
            </div>
          </div>

          <!-- Astrologer Info -->
          <div class="flex flex-col">
            <h3 
              class="font-serif font-bold text-sm sm:text-base text-[#1E1B4B] group-hover:text-[#4a1b9a] transition-colors truncate mb-0.5 cursor-pointer flex items-center gap-1" 
              onclick="window.Router ? window.Router.navigate('/astrologer/${profileSlug}') : (window.location.href='/astrologer/${profileSlug}')"
              title="${a.name}"
            >
              <span>${a.name}</span>
              <span class="text-[#4a1b9a] text-xs shrink-0 font-bold" title="गुरुकुल एवं वैदिक विवि द्वारा सत्यापित">✓</span>
            </h3>

            <!-- Rating & Review Count -->
            <div class="flex items-center gap-1 text-xs text-[#B45309] font-bold mb-1">
              <span>⭐</span>
              <span>${a.rating ? Number(a.rating).toFixed(1) : '4.9'}</span>
              <span class="text-slate-400 font-normal">(${a.reviews_count || a.consultations_count || '1.2k'})</span>
            </div>

            <!-- Specialization & Expertise Line -->
            <div class="text-[11px] text-[#64748B] font-medium truncate mb-3" title="${specialties}">
              ${specialties}
            </div>
          </div>
        </div>

        <!-- Card Footer: Rate & Action Buttons -->
        <div class="pt-3 border-t border-[#F1ECE1] flex flex-col gap-2.5 mt-auto">
          <!-- Price Display & Voice Intro Preview -->
          <div class="flex items-center justify-between">
            <div class="flex items-baseline">
              ${priceText}
            </div>
            <button 
              type="button" 
              class="inline-flex items-center gap-1 text-[11px] font-bold text-[#D97706] bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-2xs hover:scale-105" 
              title="पंडित जी का स्वर सुनें (Audio Voice Intro)"
              onclick="event.stopPropagation(); window.App && window.App.playAstrologerVoice ? window.App.playAstrologerVoice('${a.name}') : (window.ChatController && window.ChatController.playTempleChime && window.ChatController.playTempleChime())"
            >
              <span>▶️</span> <span>सुनें</span>
            </button>
          </div>

          <!-- Dual Action Buttons: Chat & Call -->
          <div class="grid grid-cols-2 gap-2 w-full">
            <button 
              type="button" 
              class="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-gradient-to-r from-[#4a1b9a] to-[#1e0b44] hover:from-[#1e0b44] hover:to-[#1e0b44] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer"
              onclick="window.App && window.App.startConsultationWith ? window.App.startConsultationWith('${profileSlug}') : (window.location.href='/consultation/${profileSlug}')"
            >
              <span>💬</span>
              <span>Chat</span>
            </button>
            <button 
              type="button" 
              class="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-white hover:bg-[#f4eefb] border border-[#4a1b9a] text-[#4a1b9a] font-bold text-xs transition-colors cursor-pointer" 
              onclick="window.App && (window.App.startCallWith ? window.App.startCallWith('${profileSlug}') : window.App.startConsultationWith('${profileSlug}'))"
            >
              <span>📞</span>
              <span>Call</span>
            </button>
          </div>
        </div>
      </article>
    `;
  },

  async loadHomeFeatured() {
    const grid = document.getElementById('home-featured-grid');
    if (!grid) return;
    // Show shimmering placeholders only if grid is empty
    if (!grid.querySelector('.ac-card, .home-ref-astro-card')) grid.innerHTML = '<div class="astro-skeleton"></div>'.repeat(3);

    try {
      if (!this.astrologersList || this.astrologersList.length === 0) {
        const cached = this.readAstrologerCache();
        if (cached && !grid.querySelector('.ac-card, .home-ref-astro-card')) {
          grid.innerHTML = cached.slice(0, 6).map(a => window.AstrologerCardComponent ? window.AstrologerCardComponent.render(a) : this.renderAstrologerCardHtml(a)).join('');
        }
        const res = await API.getAstrologers({ limit: 50 });
        this.astrologersList = Array.isArray(res) ? res : (res.items || []);
        this.writeAstrologerCache(this.astrologersList);
      }
      const featured = (this.astrologersList || []).slice(0, 6);
      if (featured.length > 0) {
        if (window.AstrologerCardComponent && typeof window.AstrologerCardComponent.render === 'function') {
          grid.innerHTML = featured.map(a => window.AstrologerCardComponent.render(a)).join('');
          if (window.AstrologerCardComponent.enhance) window.AstrologerCardComponent.enhance(grid);
        } else {
          grid.innerHTML = featured.map(a => this.renderAstrologerCardHtml(a)).join('');
        }
      }
    } catch (err) {
      console.warn('Failed to load home featured astrologers:', err);
      if (grid.querySelector('.ac-card, .home-ref-astro-card')) return;
      grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 2rem; text-align: center; color: #DC2626;">Failed to load featured astrologers.</div>`;
    }
  },

  async renderProfilePage(slug) {
    let container = document.getElementById('profile-page-content');
    if (!container) {
      setTimeout(() => this.renderProfilePage(slug), 100);
      return;
    }

    // Fast synchronous pre-render if the astrologer is already in memory
    const cached = (this.astrologersList || []).find(x => x.slug === slug || x.id === slug);
    if (cached) {
      this.populateProfileHtml(cached);
    } else {
      const { x, skeleton } = await import('/src/utils/experience.js');
      container.innerHTML = `<div class="exp-profile-loading" role="status" aria-label="${x('loadingProfile')}">${skeleton(3)}</div>`;
    }

    try {
      const a = await (window.API || API).getAstrologerProfile(slug);
      // If astrologersList not loaded yet, fetch in background for similar astrologers
      if (!this.astrologersList || this.astrologersList.length === 0) {
        (window.API || API).getAstrologers({ limit: 24 }).then(res => {
          this.astrologersList = Array.isArray(res) ? res : (res.items || []);
          this.populateProfileHtml(a);
        }).catch(() => {});
      }
      this.populateProfileHtml(a);
    } catch (err) {
      if (!cached) {
        console.error('Failed to load profile for slug:', slug, err);
        const { x, esc } = await import('/src/utils/experience.js').then(async m => ({ x: m.x, esc: (await import('/src/utils/shop.js')).esc }));
        const missing = /not found|404/i.test(err?.message || '');
        container.innerHTML = `
          <div class="exp-empty" role="alert">
            <span aria-hidden="true">✧</span>
            <h3>${esc(x(missing ? 'profileMissing' : 'profileFailed'))}</h3>
            <p>${esc(missing ? x('profileMissingNote') : '')}</p>
            <div class="exp-empty__actions">
              ${missing ? '' : `<button type="button" class="shop-btn shop-btn--line" data-profile-retry>${esc(x('retry'))}</button>`}
              <a href="/astrologers" data-nav-link class="shop-btn shop-btn--gold">${esc(x('browseAll'))}</a>
            </div>
          </div>`;
        container.querySelector('[data-profile-retry]')?.addEventListener('click', () => this.renderProfilePage(slug));
      }
    }
  },

  async populateProfileHtml(a) {
    const container = document.getElementById('profile-page-content');
    if (!container) return;
    const [{ x, fmt }, { esc }] = await Promise.all([import('/src/utils/experience.js'), import('/src/utils/shop.js')]);
    const hi = window.I18n?.currentLang === 'hi';
    const isHuman = a.is_ai === false || a.type === 'human';
    this.profileAstrologer = a;
    window.Seo?.entity({
      title: `${(hi && a.name_hi) || a.name} – ${(hi && a.title_hi) || a.title || ''} | Astro Jyotish`,
      description: ((hi && a.bio_hi) || a.bio || '').slice(0, 155),
      data: { '@context': 'https://schema.org', '@type': 'Person', name: a.name, jobTitle: a.title, description: a.bio || undefined,
        ...(Number(a.rating) > 0 && Number(a.review_count) > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: Number(a.rating).toFixed(1), reviewCount: Number(a.review_count) } } : {}) }
    });
    const name = (hi && a.name_hi) || a.name;
    const title = (hi && a.title_hi) || a.title || '';
    const bio = (hi && a.bio_hi) || a.bio || '';
    const rate = Number(a.price_per_minute) || 0;
    const rating = Number(a.rating) || 0;
    const reviewCount = Number(a.review_count) || 0;
    const consultations = Number(a.consultations_count) || 0;
    const years = Number(a.experience_years) || 0;
    const languages = a.languages || [];
    const specialties = a.specialties || [];
    const status = a.availability === 'online' ? 'statusOnline' : (a.availability === 'busy' ? 'statusBusy' : 'statusOffline');
    const portraitUrl = (window.AstrologerCardComponent && window.AstrologerCardComponent.getPortraitUrl)
      ? window.AstrologerCardComponent.getPortraitUrl(a)
      : (a.avatar && !a.avatar.endsWith('.svg') ? a.avatar : '/assets/portraits/default-avatar.svg');

    // Similar astrologers: same specialties first, then anyone else, up to eight.
    const mine = new Set((a.specialties || []).map(v => String(v).toLowerCase()));
    const pool = (this.astrologersList || []).filter(item => item.id !== a.id);
    const overlap = (item) => (item.specialties || []).filter(v => mine.has(String(v).toLowerCase())).length;
    const similar = pool.map(item => [overlap(item), item]).sort((l, r) => r[0] - l[0]).slice(0, 8).map(pair => pair[1]);
    const { ProfileView } = await import('/src/components/premium/ProfileView.js?v=r28');
    const ctx = { hi, portraitUrl, similar, isHuman };
    container.innerHTML = ProfileView.html(a, ctx);
    ProfileView.bind(container, a, ctx);
    container.querySelector('[data-review-form]')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!this.currentUser) { this.openAuthModal('login'); return; }
      const form = e.target; const btn = form.querySelector('button'); btn.disabled = true;
      try {
        await API.addAstrologerReview(form.dataset.reviewForm, { rating: Number(form.rating.value), comment: form.comment.value.trim() });
        this.showToast(x('reviewThanks'), 'success');
        this.renderProfilePage(a.slug || a.id);
      } catch (err) { this.showToast(err.message, 'error'); btn.disabled = false; }
    });
    this.renderProfileEstimate();
    if (this.currentUser) this.refreshWalletUI();
    if (!this._profileWalletBound) {
      this._profileWalletBound = true;
      window.addEventListener('astro:walletchange', () => this.renderProfileEstimate());
    }
  },

  /** Per-duration cost from the expert's real rate, checked against the signed-in user's real wallet balance. */
  async renderProfileEstimate() {
    const box = document.getElementById('profile-wallet-estimate');
    if (!box) return;
    const { x, fmt } = await import('/src/utils/experience.js');
    const { esc, money } = await import('/src/utils/shop.js');
    const rate = Number(box.dataset.rate) || 0;
    const rows = [15, 30, 60].map(m => `<div><span>${esc(fmt(x('minutesShort'), { n: m }))}</span><strong>${esc(money(rate * m))}</strong></div>`).join('');
    let balanceHtml;
    if (!this.currentUser) {
      balanceHtml = `<p class="exp-muted">${esc(x('signInBalance'))}</p>`;
    } else {
      const balance = Number(this.currentWalletBalance) || 0;
      const need = rate * 15;
      const short = need - balance;
      balanceHtml = `<div class="exp-balance"><span>${esc(x('yourBalance'))}</span><strong>${esc(money(balance))}</strong></div>` + (short > 0
        ? `<p class="exp-warn" role="alert">${esc(fmt(x('lowBalance'), { n: Math.ceil(short), m: 15 }))}</p><button type="button" class="shop-btn shop-btn--gold" onclick="App.openWalletModal()">${esc(x('topUp'))}</button>`
        : `<p class="exp-ok">${esc(fmt(x('enoughBalance'), { b: Math.floor(balance) }))}</p>`);
    }
    box.innerHTML = `<h4>${esc(x('estimateTitle'))}</h4><div class="exp-estimate__grid">${rows}</div>${balanceHtml}`;
  },

  handleHeroSearch(event) {
    if (event) event.preventDefault();
    const input = document.getElementById('hero-search-input');
    const query = input ? input.value.trim() : '';
    if (query) {
      this.directoryFilter.q = query;
      const dirInput = document.getElementById('dir-page-search-input');
      if (dirInput) dirInput.value = query;
    }
    Router.navigate('/astrologers');
  },

  quickSearch(tag) {
    const input = document.getElementById('hero-search-input');
    if (input) input.value = tag;
    this.directoryFilter.q = tag;
    const dirInput = document.getElementById('dir-page-search-input');
    if (dirInput) dirInput.value = tag;
    Router.navigate('/astrologers');
  },

  askShastraAI(questionText) {
    const input = document.getElementById('shastra-ai-input');
    const query = questionText || (input ? input.value.trim() : '');
    if (!query) {
      this.showToast('Please enter an astrological question', 'info');
      return;
    }
    const aiAstrologer = (this.astrologers && this.astrologers.find(a => a.is_ai)) || (this.astrologers && this.astrologers[0]) || { id: 2 };
    this.startChatWithAstrologer(aiAstrologer.id);
    setTimeout(() => {
      const chatInput = document.getElementById('chat-message-input');
      if (chatInput) {
        chatInput.value = query;
        const sendBtn = document.getElementById('btn-send-message');
        if (sendBtn) sendBtn.click();
      }
    }, 450);
  },

  filterDirectoryByCategory(category) {
    this.directoryFilter.specialty = category;
    const select = document.getElementById('dir-filter-specialty');
    if (select) select.value = category;
    Router.navigate('/astrologers');
  },

  onDirectorySearchInput(event) {
    const val = event.target.value.trim();
    this.directoryFilter.q = val;
    this.loadAstrologerDirectory();
  },

  onDirectoryFilterChange() {
    const spec = document.getElementById('dir-filter-specialty');
    const lang = document.getElementById('dir-filter-language');
    const mode = document.getElementById('dir-filter-mode');
    const sort = document.getElementById('dir-filter-sort');

    if (spec) this.directoryFilter.specialty = spec.value;
    if (lang) this.directoryFilter.language = lang.value;
    if (mode) this.directoryFilter.type = mode.value;
    if (sort) this.directoryFilter.sort = sort.value;

    this.loadAstrologerDirectory();
  },

  filterDirectorySubtab(subtab) {
    document.querySelectorAll('.dir-subtab').forEach(b => {
      b.classList.toggle('is-active', b.dataset.dirSubtab === subtab);
    });
    if (subtab === 'all') {
      this.directoryFilter.sort = 'popular';
    } else if (subtab === 'top-rated') {
      this.directoryFilter.sort = 'rating';
    } else if (subtab === 'most-consulted') {
      this.directoryFilter.sort = 'popular';
    } else if (subtab === 'new') {
      this.directoryFilter.sort = 'name';
    }
    this.loadAstrologerDirectory();
  },

  toggleDirectoryFilters() {
    const panel = document.getElementById('dir-filters-panel');
    const button = document.getElementById('dir-mobile-filter-toggle');
    if (!panel || !button) return;
    const open = panel.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(open));
  },

  clearDirectoryFilters() {
    this.directoryFilter = { type: 'all', specialty: '', language: '', sort: 'popular', q: '' };
    const search = document.getElementById('dir-page-search-input');
    const spec = document.getElementById('dir-filter-specialty');
    const lang = document.getElementById('dir-filter-language');
    const mode = document.getElementById('dir-filter-mode');
    const sort = document.getElementById('dir-filter-sort');
    if (search) search.value = '';
    if (spec) spec.value = '';
    if (lang) lang.value = '';
    if (mode) mode.value = 'all';
    if (sort) sort.value = 'popular';
    document.getElementById('dir-filters-panel')?.classList.remove('is-open');
    document.getElementById('dir-mobile-filter-toggle')?.setAttribute('aria-expanded', 'false');
    this.loadAstrologerDirectory();
  },

  toggleFaq(headerElement) {
    const item = headerElement.closest('.faq-item');
    if (item) {
      item.classList.toggle('active');
    }
  },

  toggleMobileMenu() {
    const links = document.querySelector('.site-nav-links');
    if (links) {
      links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
      links.style.flexDirection = 'column';
      links.style.position = 'absolute';
      links.style.top = '68px';
      links.style.left = '0';
      links.style.right = '0';
      links.style.background = '#FFFFFF';
      links.style.padding = '1rem';
      links.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
    }
  },

  onAstrologersLoaded(astrologers) {
    this.astrologersList = astrologers;
    const countBadge = document.getElementById('directory-total-badge') || document.getElementById('astrologers-count-badge');
    const dirCountAll = document.getElementById('dir-count-all');
    if (countBadge) countBadge.innerText = `${astrologers.length} Expert Astrologers`;
    if (dirCountAll) dirCountAll.innerText = astrologers.length;
  },

  // =========================================================================
  // Individual Astrologer Profile View & Reviews
  // =========================================================================
  async showAstrologerProfile(slugOrId) {
    this.openModal('modal-astrologer-profile');
    const container = document.getElementById('astrologer-profile-body');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 3rem 1rem;"><p class="text-muted">Loading profile...</p></div>`;

    try {
      const a = await API.getAstrologerProfile(slugOrId);
      const isOnline = a.availability === 'online';
      const isBusy = a.availability === 'busy';
      const statusClass = isOnline ? 'status-online' : (isBusy ? 'status-busy' : 'status-offline');
      const statusText = isOnline ? '🟢 Online Now' : (isBusy ? '🟡 Busy with Consultation' : '⚪ Currently Offline');
      const typeLabel = a.type === 'human' ? 'Certified Vedic Scholar (Human)' : 'Authentic वैदिक ज्योतिषी';

      const specialtiesHtml = (a.specialties || []).map(s => `<span class="specialty-pill" style="font-size:0.75rem; padding:0.25rem 0.6rem;">${s}</span>`).join('');
      const languagesHtml = (a.languages || []).join(', ');

      const portraitUrl = (window.AstrologerCardComponent && window.AstrologerCardComponent.getPortraitUrl)
        ? window.AstrologerCardComponent.getPortraitUrl(a)
        : (a.avatar && a.avatar.includes('/') ? a.avatar : 'assets/portraits/pt-rameshwar-dwivedi.jpg');

      const formattedRating = (a.rating && Number(a.rating) <= 5 && Number(a.rating) > 0) ? Number(a.rating).toFixed(1) : '4.9';

      // Reviews
      const reviews = a.reviews || [];
      const reviewsHtml = reviews.length > 0
        ? reviews.map(r => `
            <div class="review-card-item">
              <div class="review-header-row">
                <span class="review-user-name">${r.user_name || 'Seeker'} ${r.is_verified ? '<span style="color:#059669; font-size:0.7rem;">✓ Verified Consultation</span>' : ''}</span>
                <span class="review-rating-stars">${'⭐'.repeat(r.rating || 5)}</span>
              </div>
              <div class="review-comment">${r.comment || 'Very insightful and authentic guidance based on Vedic principles.'}</div>
            </div>
          `).join('')
        : `<p class="text-muted" style="font-size: 0.8rem;">No reviews yet. Be the first to consult and review!</p>`;

      container.innerHTML = `
        <div class="profile-modal-layout">
          <!-- Hero Banner -->
          <div class="profile-hero-banner" style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.25rem; background: #FAF8F2; padding: 1rem; border-radius: 1rem; border: 1px solid #E7E2D8;">
            <div class="profile-hero-avatar" style="width: 76px; height: 76px; border-radius: 9999px; overflow: hidden; border: 3px solid #F59E0B; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
              <img src="${portraitUrl}" alt="${a.name}" class="w-full h-full object-cover object-top" onerror="this.onerror=null; this.src='/assets/portraits/default-avatar.svg';" />
            </div>
            <div class="profile-hero-meta" style="flex: 1; min-width: 0;">
              <h3 style="font-size: 1.15rem; font-weight: 800; color: #1E1B4B; margin: 0 0 0.2rem 0; display: flex; align-items: center; gap: 0.4rem;">
                <span>${a.name}</span>
                ${a.is_verified ? '<span class="card-verified-badge" style="font-size: 0.72rem; padding: 0.15rem 0.5rem; background: #DCFCE7; color: #15803D; border-radius: 9999px; font-weight: 700;" title="Verified Astrologer">✓ Verified</span>' : ''}
              </h3>
              <p style="font-size: 0.82rem; color: #64748B; margin: 0 0 0.4rem 0;">
                ${a.title} • <span style="font-weight: 700; color: #4a1b9a;">${typeLabel}</span>
              </p>
              <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <span class="status-pill" style="font-size: 0.72rem; padding: 0.15rem 0.5rem; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 9999px; display: inline-flex; align-items: center; gap: 0.35rem;">
                  <span class="status-dot" style="width: 7px; height: 7px; border-radius: 9999px; background: ${isOnline ? '#10B981' : (isBusy ? '#F59E0B' : '#94A3B8')}"></span>
                  <span>${statusText}</span>
                </span>
                <span style="font-size: 0.76rem; color: #64748B;">🗣️ ${languagesHtml}</span>
              </div>
            </div>
          </div>

          <!-- Quick Stats Grid -->
          <div class="profile-stats-grid">
            <div class="profile-stat-box">
              <div class="profile-stat-val" style="color: #D97706;">⭐ ${formattedRating}</div>
              <div class="profile-stat-lbl">Rating</div>
            </div>
            <div class="profile-stat-box">
              <div class="profile-stat-val">${(a.consultations_count || 1200).toLocaleString()}+</div>
              <div class="profile-stat-lbl">Consultations</div>
            </div>
            <div class="profile-stat-box">
              <div class="profile-stat-val">${a.experience_years || 15}+ Yrs</div>
              <div class="profile-stat-lbl">Experience</div>
            </div>
            <div class="profile-stat-box">
              <div class="profile-stat-val" style="color: #059669;">${a.price_per_minute === 0 ? 'Free' : '₹' + a.price_per_minute + '/m'}</div>
              <div class="profile-stat-lbl">Pricing</div>
            </div>
          </div>

          <!-- Biography & Vedic Lineage -->
          <div>
            <div class="profile-section-title"><span>📜</span> <span>About & Classical Lineage</span></div>
            <div class="profile-bio-box">
              ${a.bio || 'Experienced Vedic Jyotish practitioner dedicated to authentic parashari astrology, birth chart analysis, and remedial guidance.'}
            </div>
          </div>

          <!-- Specialties -->
          <div>
            <div class="profile-section-title"><span>✨</span> <span>Areas of Specialization</span></div>
            <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
              ${specialtiesHtml}
            </div>
          </div>

          <!-- Verified Client Reviews -->
          <div>
            <div class="profile-section-title"><span>💬</span> <span>Verified Client Reviews (${reviews.length})</span></div>
            <div class="reviews-list-container">
              ${reviewsHtml}
            </div>
          </div>

          <!-- Add Review Form -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 0.75rem;">
            <div style="font-size: 0.78rem; font-weight: 700; margin-bottom: 0.4rem;">Add Your Review for ${a.name}</div>
            <form onsubmit="App.submitAstrologerReview('${a.id}', event)" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <select name="rating" class="form-select" style="width: 120px; font-size: 0.78rem;">
                <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                <option value="4">⭐⭐⭐⭐ (4/5)</option>
                <option value="3">⭐⭐⭐ (3/5)</option>
              </select>
              <input type="text" name="comment" placeholder="Share your consultation experience..." required style="flex: 1; min-width: 200px; padding: 0.35rem 0.65rem; border: 1px solid var(--border-subtle); border-radius: 6px; font-size: 0.78rem;">
              <button type="submit" class="btn-new-chat" style="padding: 0.35rem 0.85rem; font-size: 0.78rem;">Post Review</button>
            </form>
          </div>

          <!-- Bottom CTA -->
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end; margin-top: 0.5rem;">
            <button type="button" class="btn-tool modal-close" style="padding: 0.55rem 1rem;">Close</button>
            <button type="button" class="btn-start-consultation" style="padding: 0.55rem 1.5rem;" onclick="ChatController.startConsultationWith('${a.id}')">
              <span>💬</span> <span>Start Consultation with ${a.name}</span> <span>➔</span>
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Error fetching astrologer profile:', err);
      container.innerHTML = `<div style="text-align:center; padding: 2rem; color: #DC2626;">Could not load profile: ${err.message}</div>`;
    }
  },

  async submitAstrologerReview(astrologerId, e) {
    if (e) e.preventDefault();
    const form = e.target;
    const rating = parseInt(form.rating.value) || 5;
    const comment = form.comment.value.trim();

    try {
      await API.addAstrologerReview(astrologerId, {
        rating,
        comment,
        user_name: (this.currentUser && this.currentUser.full_name) || 'Consultation Seeker'
      });
      this.showToast('Thank you! Your verified review has been posted. ⭐', 'success');
      this.showAstrologerProfile(astrologerId);
    } catch (err) {
      this.showToast(`Failed to post review: ${err.message}`, 'error');
    }
  },

  // =========================================================================
  // Smart Astrologer Matching
  // =========================================================================
  bindSmartMatching() {
    // Form is handled via handleSmartMatchSubmit(event)
  },

  async handleSmartMatchSubmit(e) {
    if (e) e.preventDefault();
    const concern = document.getElementById('match-concern')?.value || 'kundli';
    const language = document.getElementById('match-language')?.value || '';
    const mode = document.getElementById('match-mode')?.value || '';
    const maxPrice = document.getElementById('match-price')?.value || '';

    const resultsContainer = document.getElementById('smart-match-results-container');
    const cardsList = document.getElementById('smart-match-cards-list');
    const btnSubmit = document.getElementById('btn-run-smart-match');

    if (btnSubmit) btnSubmit.innerText = 'Analyzing Astrological Alignment... ⚡';
    if (resultsContainer) resultsContainer.style.display = 'block';
    if (cardsList) cardsList.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 1.5rem;"><p class="text-muted">Computing Swiss Ephemeris & domain alignment...</p></div>`;

    try {
      const res = await API.smartMatchAstrologers({
        concern,
        preferred_language: language,
        consultation_mode: mode,
        max_price: maxPrice ? parseFloat(maxPrice) : null
      });

      const matches = res.recommendations || [];
      if (matches.length === 0) {
        cardsList.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 1.5rem; color: var(--text-muted);">No matching astrologers found. Try relaxing the budget or language preference.</div>`;
        return;
      }

      cardsList.innerHTML = matches.map((m, idx) => {
        const a = m.astrologer || {};
        const isTop = idx === 0;
        return `
          <div class="match-card-wrapper ${isTop ? 'top-match' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.5rem;">${a.avatar || '🕉️'}</span>
                <div>
                  <div style="font-size: 0.88rem; font-weight: 700; color: var(--text-heading);">${a.name}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${a.title}</div>
                </div>
              </div>
              <span class="match-score-badge">${m.match_score}% Match</span>
            </div>

            <div class="why-recommended-pill">
              <span>✨</span> <span>${m.why_recommended}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px solid #E2E8F0;">
              <span style="font-size: 0.74rem; font-weight: 700; color: #0F172A;">
                ${a.price_per_minute === 0 ? 'Free Consultation' : '₹' + a.price_per_minute + '/min'}
              </span>
              <button type="button" class="btn-card-chat" onclick="ChatController.startConsultationWith('${a.id}')">
                <span>💬 Consult Now</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Smart match error:', err);
      if (cardsList) cardsList.innerHTML = `<div style="grid-column: 1 / -1; padding: 1.5rem; color: #DC2626;">Matching error: ${err.message}</div>`;
    } finally {
      if (btnSubmit) btnSubmit.innerText = 'Find Best Matching Astrologers ⚡';
    }
  },

  // =========================================================================
  // Consultation Ending Summary & Certified Record
  // =========================================================================
  showConsultationSummary(summary) {
    this.openModal('modal-consultation-summary');
    const container = document.getElementById('consultation-summary-body');
    if (!container) return;

    const insights = (summary.key_insights || []).map(i => `<li style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; font-size: 0.84rem; color: #1E1B4B; line-height: 1.5;"><span style="color: #D97706; font-weight: bold;">✦</span><span>${i}</span></li>`).join('') || '<li style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.84rem; color: #1E1B4B;"><span style="color: #D97706;">✦</span><span>वैदिक परामर्श सफलतापूर्वक संपन्न हुआ। ग्रह गोचर एवं दशा के अनुसार शास्त्रीय मार्गदर्शन प्रदान किया गया।</span></li>';
    const remedies = (summary.remedies_prescribed || []).map(r => `<div style="display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.45rem; font-size: 0.84rem; color: #78350F; line-height: 1.5;"><span style="color: #B45309; font-weight: bold;">🪔</span><span>${r}</span></div>`).join('') || '<div style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.84rem; color: #78350F;"><span style="color: #B45309;">🪔</span><span>नित्य प्रातः सूर्य गायत्री मंत्र का 11 बार जप करें एवं तुलसी जी को जल अर्पित करें।</span></div>';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem; font-family: 'Plus Jakarta Sans', sans-serif;">
        <!-- Astrologer & Meta Bar -->
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 0.85rem 1.15rem; background: linear-gradient(135deg, #FAF8F2 0%, #F5EFEB 100%); border: 1px solid #E7E2D8; border-radius: 14px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.85rem;">
            <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #4a1b9a, #1e0b44); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #FFF; box-shadow: 0 4px 10px rgba(74, 27, 154,0.25);">
              🕉️
            </div>
            <div>
              <div style="font-size: 0.98rem; font-weight: 800; color: #1E1B4B; font-family: 'Cinzel', serif;">
                ${summary.astrologer_name || 'Dr. Radhika Nair (वैदिक ज्योतिषाचार्य)'}
              </div>
              <div style="font-size: 0.76rem; color: #64748B; font-weight: 600;">
                ⏱️ अवधि: ${summary.duration_minutes || 5} मिनट • विषय: ${summary.primary_concern || 'कुण्डली विश्लेषण'} • ✅ सत्यापित वैदिक सत्र
              </div>
            </div>
          </div>
          <span style="font-size: 0.72rem; background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; padding: 0.3rem 0.75rem; border-radius: 999px; font-weight: 800; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: #16A34A;"></span> सत्र संपन्न (Completed)
          </span>
        </div>

        <!-- Key Discussion Points -->
        <div style="background: #FFFFFF; border: 1px solid #E7E2D8; border-radius: 14px; padding: 1rem 1.15rem; box-shadow: 0 2px 8px rgba(33,29,80,0.04);">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 800; color: #1E1B4B; font-size: 0.88rem; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px dashed #E7E2D8;">
            <span style="font-size: 1.1rem;">🔍</span>
            <span>परामर्श मुख्य बिंदु एवं ग्रह गोचर विश्लेषण (Discussion Points)</span>
          </div>
          <ul style="padding: 0; margin: 0; list-style: none;">
            ${insights}
          </ul>
        </div>

        <!-- Prescribed Remedies (शास्त्रीय उपाय) -->
        <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1.5px solid #FCD34D; border-radius: 14px; padding: 1rem 1.15rem; box-shadow: 0 2px 8px rgba(217,119,6,0.06);">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 800; color: #92400E; font-size: 0.88rem; margin-bottom: 0.75rem; padding-bottom: 0.4rem; border-bottom: 1px dashed #F59E0B;">
            <span style="font-size: 1.1rem;">🪔</span>
            <span>शास्त्रीय वैदिक उपाय एवं परिहार (Prescribed Vedic Remedies)</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.2rem;">
            ${remedies}
          </div>
        </div>

        <!-- Next Actions & Followups -->
        <div style="background: #FAF8F2; border: 1px solid #E7E2D8; border-radius: 14px; padding: 1rem 1.15rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-weight: 800; color: #1E1B4B; font-size: 0.88rem; margin-bottom: 0.75rem;">
            <span style="font-size: 1.1rem;">🧭</span>
            <span>अनुशंसित अगले ज्योतिषीय साधन (Recommended Next Tools)</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.65rem;">
            <button type="button" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; background: #FFFFFF; border: 1px solid #D97706; border-radius: 10px; font-size: 0.78rem; font-weight: 700; color: #1E1B4B; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.background='#FFFBEB'" onmouseout="this.style.background='#FFFFFF'" onclick="App.closeModal('modal-consultation-summary'); App.openKundaliMilanModal ? App.openKundaliMilanModal() : App.openModal('modal-kundali-milan');">
              <span>💍</span> <span>गुण मिलान (36 Gunas)</span>
            </button>
            <button type="button" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; background: #FFFFFF; border: 1px solid #4a1b9a; border-radius: 10px; font-size: 0.78rem; font-weight: 700; color: #1E1B4B; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.background='#f4eefb'" onmouseout="this.style.background='#FFFFFF'" onclick="App.closeModal('modal-consultation-summary'); CallingAgentService ? CallingAgentService.downloadAstroDossierPDF() : ReportsController.generateQuickReport();">
              <span>📑</span> <span>कुण्डली PDF रिपोर्ट</span>
            </button>
            <button type="button" style="display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 0.85rem; background: #FFFFFF; border: 1px solid #0284C7; border-radius: 10px; font-size: 0.78rem; font-weight: 700; color: #1E1B4B; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" onmouseover="this.style.background='#F0F9FF'" onmouseout="this.style.background='#FFFFFF'" onclick="App.closeModal('modal-consultation-summary'); App.openSadeSatiModal ? App.openSadeSatiModal() : null;">
              <span>🪐</span> <span>शनि साढ़े साती प्रभाव</span>
            </button>
          </div>
        </div>

        <!-- Star Rating Feedback Form -->
        <div style="background: linear-gradient(135deg, #FAF8F2 0%, #FFFFFF 100%); border: 1.5px solid #FCD34D; border-radius: 14px; padding: 1rem 1.15rem;">
          <div style="font-size: 0.85rem; font-weight: 800; color: #1E1B4B; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>⭐</span> <span>परामर्श अनुभव का मूल्यांकन करें (Rate Consultation)</span>
          </div>
          <form onsubmit="App.submitConsultationFeedback('${summary.consultation_id || ''}', event)" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <select name="rating" style="padding: 0.45rem 0.75rem; border: 1px solid #E7E2D8; border-radius: 8px; font-size: 0.8rem; font-weight: 700; color: #B45309; background: #FFFBEB;">
              <option value="5">⭐⭐⭐⭐⭐ अति उत्तम (Excellent)</option>
              <option value="4">⭐⭐⭐⭐ उत्तम (Good)</option>
              <option value="3">⭐⭐⭐ संतोषजनक (Satisfactory)</option>
            </select>
            <input type="text" name="feedback" placeholder="ज्योतिषी के परामर्श पर अपना अनुभव लिखें..." style="flex: 1; min-width: 180px; padding: 0.45rem 0.85rem; border: 1px solid #E7E2D8; border-radius: 8px; font-size: 0.8rem; background: #FFFFFF; outline: none;">
            <button type="submit" style="padding: 0.45rem 1.15rem; background: linear-gradient(135deg, #4a1b9a, #1e0b44); color: #FFF; font-weight: 800; font-size: 0.8rem; border: none; border-radius: 8px; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 6px rgba(74, 27, 154,0.3);">
              प्रस्तुत करें (Submit)
            </button>
          </form>
        </div>
      </div>
    `;
  },

  async submitConsultationFeedback(consultationId, e) {
    if (e) e.preventDefault();
    if (!consultationId) {
      this.showToast('Thank you for your rating! ⭐', 'success');
      return;
    }
    const form = e.target;
    const rating = parseInt(form.rating.value) || 5;
    const feedback = form.feedback.value.trim();

    try {
      await API.submitConsultationFeedback(consultationId, {
        rating,
        feedback
      });
      this.showToast('Feedback submitted successfully! 🙏', 'success');
    } catch (err) {
      this.showToast(`Feedback error: ${err.message}`, 'error');
    }
  },

  // =========================================================================
  // User Authentication & Saved Kundli Profiles Management
  // =========================================================================
  bindUserAuth() {
    // Session state initialized in checkUserSession
  },

  getUserId() {
    if (this.currentUser && this.currentUser.id) return this.currentUser.id;
    let guestId = localStorage.getItem('astroai_guest_id');
    if (!guestId) {
      guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('astroai_guest_id', guestId);
    }
    return guestId;
  },

  async checkUserSession() {
    const token = localStorage.getItem('astro_access_token');
    if (!token) {
      this.currentUser = null;
      this.updateAuthUI();
      return;
    }

    try {
      const user = await API.getMe();
      this.currentUser = user;
      this.updateAuthUI();
    } catch (err) {
      console.warn('User session invalid:', err);
      localStorage.removeItem('astro_access_token');
      this.currentUser = null;
      this.updateAuthUI();
    }
  },

  updateAuthUI() {
    window.dispatchEvent(new CustomEvent('astro:authchange'));
    const authBtn = document.getElementById('btn-nav-auth');
    const registerBtn = document.getElementById('btn-nav-register');
    const sidebarUserName = document.getElementById('sidebar-user-name');
    const mobileUserLabel = document.getElementById('mobile-user-label');
    const mobileUserCard = document.getElementById('mobile-user-card-wrap');
    const mobileNavAuth = document.getElementById('mobile-nav-auth-buttons');

    if (this.currentUser) {
      const name = this.currentUser.full_name || this.currentUser.email || 'Seeker';
      const firstName = name.split(' ')[0];
      const initial = name.charAt(0).toUpperCase();

      if (authBtn) {
        authBtn.classList.add('logged-in');
        authBtn.innerHTML = `
          <div class="nav-user-pill flex items-center gap-1.5 font-bold text-xs">
            <span class="user-avatar-badge w-5 h-5 rounded-full bg-gradient-to-br from-[#4a1b9a] to-[#1e0b44] text-white flex items-center justify-center text-[10px] shadow-xs">${initial}</span>
            <span class="nav-user-name text-[#1E1B4B]">${firstName}</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          </div>
        `;
        authBtn.title = `${name} (${this.currentUser.email}) - View Profile & Kundli`;
        authBtn.onclick = () => this.openUserAccountModal();
      }

      if (registerBtn) {
        // User requested: No separate "My Profile" button in navbar when logged in.
        // User clicks on [Satya] directly to open profile.
        registerBtn.style.display = 'none';
      }

      if (sidebarUserName) {
        sidebarUserName.innerText = name;
      }

      if (mobileUserLabel) {
        mobileUserLabel.innerText = name;
      }

      if (mobileNavAuth) {
        mobileNavAuth.innerHTML = `
          <button type="button" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#faf6fb] border border-[#e3d8f3] text-[#4a1b9a] font-bold text-xs rounded-xl shadow-xs cursor-pointer" onclick="document.getElementById('mobile-nav-drawer')?.classList.add('translate-x-full'); document.getElementById('mobile-nav-backdrop')?.classList.add('hidden'); App.openUserAccountModal();">
            <span>👤</span> <span>${firstName} (Profile)</span>
          </button>
          <button type="button" class="py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 cursor-pointer" onclick="App.handleLogout();" title="Logout">
            <span>🚪</span> <span>Logout</span>
          </button>
        `;
      }
    } else {
      if (authBtn) {
        authBtn.classList.remove('logged-in');
        const isHi = window.ASTRO_I18N && window.ASTRO_I18N.currentLang === 'hi';
        authBtn.innerHTML = `
          <span>👤</span>
          <span id="nav-user-label" data-i18n="nav_signin">${isHi ? 'लॉग इन' : 'Sign In'}</span>
        `;
        authBtn.title = 'Sign In to Your Account';
        authBtn.onclick = () => this.openAuthModal('login');
      }

      if (registerBtn) {
        registerBtn.style.display = '';
        registerBtn.innerHTML = `<span>✨</span> <span id="nav-register-label">Register</span>`;
        registerBtn.onclick = () => this.openAuthModal('register');
      }

      if (sidebarUserName) {
        sidebarUserName.innerText = 'Login / Register';
      }

      if (mobileUserLabel) {
        mobileUserLabel.innerText = 'Sign In';
      }

      if (mobileNavAuth) {
        mobileNavAuth.innerHTML = `
          <button type="button" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white border border-[#E7E2D8] hover:border-[#4a1b9a] text-[#1E1B4B] font-bold text-xs rounded-xl shadow-2xs cursor-pointer" onclick="document.getElementById('mobile-nav-drawer')?.classList.add('translate-x-full'); document.getElementById('mobile-nav-backdrop')?.classList.add('hidden'); App.openAuthModal('login');">
            <span>👤</span> <span>Sign In</span>
          </button>
          <button type="button" class="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-[#4a1b9a] to-[#1e0b44] text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 cursor-pointer" onclick="document.getElementById('mobile-nav-drawer')?.classList.add('translate-x-full'); document.getElementById('mobile-nav-backdrop')?.classList.add('hidden'); App.openAuthModal('register');">
            <span>✨</span> <span>Register</span>
          </button>
        `;
      }
    }
  },

  renderUserAccountModal() {
    const body = document.getElementById('user-account-modal-body');
    if (!body) return;

    if (!this.currentUser) {
      // Render Login / Register tabs
      body.innerHTML = `
        <div class="auth-tabs-bar">
          <button type="button" class="auth-tab-btn active" id="tab-btn-login" onclick="App.switchAuthTab('login')">
            <span>👤</span> <span>Sign In (लॉग इन)</span>
          </button>
          <button type="button" class="auth-tab-btn" id="tab-btn-register" onclick="App.switchAuthTab('register')">
            <span>✨</span> <span>Register Free Account (नया खाता)</span>
          </button>
        </div>

        <!-- Login Form -->
        <div id="auth-panel-login">
          <form autocomplete="off" onsubmit="App.handleLogin(event)" class="auth-form-card">
            <div class="form-group mb-3">
              <label class="form-label font-bold text-xs text-[#1E1B4B] mb-1 block">Email Address (ईमेल पता)</label>
              <input type="email" id="login-email" class="form-control" placeholder="Enter your email address" required autocomplete="off" value="">
            </div>
            <div class="form-group mb-4">
              <label class="form-label font-bold text-xs text-[#1E1B4B] mb-1 block">Password (पासवर्ड)</label>
              <input type="password" id="login-password" class="form-control" placeholder="Enter your password" required autocomplete="off" value="">
            </div>
            <button type="submit" class="btn-primary-purple w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#4a1b9a] to-[#1e0b44] hover:from-[#1e0b44] hover:to-[#1e0b44] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span>Sign In to Astro Jyotish</span> <span>➔</span>
            </button>
            <p class="text-xs text-center text-[#64748B] mt-3">
              Don't have an account yet? <a href="javascript:void(0)" onclick="App.switchAuthTab('register')" class="text-[#4a1b9a] font-bold hover:underline">Register Free</a>
            </p>
          </form>
        </div>

        <!-- Register Form -->
        <div id="auth-panel-register" style="display: none;">
          <form onsubmit="App.handleRegister(event)" class="auth-form-card">
            <div class="form-group mb-2.5">
              <label class="form-label font-bold text-xs text-[#1E1B4B] mb-1 block">Full Name (पूरा नाम)</label>
              <input type="text" id="reg-name" class="form-control" placeholder="e.g. Satya Prakash" required>
            </div>
            <div class="form-group mb-2.5">
              <label class="form-label font-bold text-xs text-[#1E1B4B] mb-1 block">Email Address (ईमेल)</label>
              <input type="email" id="reg-email" class="form-control" placeholder="e.g. satya@example.com" required>
            </div>
            <div class="form-group mb-2.5">
              <label class="form-label font-bold text-xs text-[#1E1B4B] mb-1 block">Password (सुरक्षित पासवर्ड - Min 8 chars)</label>
              <input type="password" id="reg-password" class="form-control" placeholder="••••••••" required minlength="8">
            </div>
            <div class="form-group mb-4">
              <label class="form-label font-bold text-xs text-[#1E1B4B] mb-1 block">Phone Number (मोबाइल नंबर - Optional)</label>
              <input type="tel" id="reg-phone" class="form-control" placeholder="+91 9876543210">
            </div>
            <button type="submit" class="btn-primary-purple w-full py-2.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-[#4a1b9a] to-[#1e0b44] hover:from-[#1e0b44] hover:to-[#1e0b44] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer">
              <span>Create Free Account (निःशुल्क पंजीकरण)</span> <span>➔</span>
            </button>
            <p class="text-xs text-center text-[#64748B] mt-3">
              Already have an account? <a href="javascript:void(0)" onclick="App.switchAuthTab('login')" class="text-[#4a1b9a] font-bold hover:underline">Sign In</a>
            </p>
          </form>
        </div>
      `;
    } else {
      // Render Logged in user profile and saved profiles management
      const savedProfiles = this.savedCharts || [];
      const profilesTableHtml = savedProfiles.length > 0
        ? `
          <table class="saved-profiles-table">
            <thead>
              <tr>
                <th>Profile Name</th>
                <th>Birth Date</th>
                <th>Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${savedProfiles.map(p => `
                <tr>
                  <td><strong>${p.name || 'Kundli'}</strong></td>
                  <td>${p.date_of_birth || '-'}</td>
                  <td>${p.city || '-'}</td>
                  <td>${p.is_default ? '<span class="badge-default-kundli">★ Default</span>' : '<span class="text-slate-400 text-xs">Saved</span>'}</td>
                  <td>
                    <div class="flex items-center gap-1.5">
                      ${!p.is_default ? `<button class="btn-table-action" onclick="App.setDefaultProfile('${p.id}')">Make Default</button>` : ''}
                      <button class="btn-table-action" onclick="App.selectChart('${p.id}'); App.closeModal('modal-user-account');">Open</button>
                      <button class="btn-table-delete" onclick="App.deleteSavedProfile('${p.id}')" title="Delete Profile">✕</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `
        : `
          <div class="empty-saved-profiles p-6 text-center">
            <span class="text-3xl mb-2 block">🪐</span>
            <p class="text-sm font-semibold text-[#1E1B4B] mb-1">No saved Kundli profiles yet</p>
            <p class="text-xs text-[#64748B] mb-3">Create your personal or family birth charts to get instant astrological insights.</p>
            <button type="button" class="btn-tool-sm inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-[#faf6fb] border border-[#e3d8f3] text-[#4a1b9a] font-bold text-xs hover:bg-[#F3E8FF]" onclick="App.closeModal('modal-user-account'); App.openBirthModal();">
              <span>+ Add First Kundli Profile</span>
            </button>
          </div>
        `;

      const initial = (this.currentUser.full_name || 'U')[0].toUpperCase();
      const currentChartName = this.currentChart ? `${this.currentChart.name} (${this.currentChart.city || 'Active Chart'})` : 'No birth profile linked';

      body.innerHTML = `
        <div class="user-account-wrapper">
          <!-- Profile Header Card (Ultra-Premium Vedic Style) -->
          <div class="user-profile-header-card">
            <div class="user-profile-avatar-large">
              <span>${initial}</span>
            </div>
            <div class="user-profile-meta-large">
              <div class="user-profile-name-row">
                <h3 class="user-profile-fullname">${this.currentUser.full_name || 'Vedic Seeker'}</h3>
                <span class="user-verified-badge">✓ Verified Seeker</span>
              </div>
              <div class="user-contact-row">
                <span class="contact-chip">📧 ${this.currentUser.email || 'seeker@astrojyotish.ai'}</span>
                <span class="contact-chip">📞 ${this.currentUser.phone || '+91 9876543210'}</span>
              </div>
            </div>
            <div class="user-header-actions flex flex-col gap-1.5 shrink-0">
              <button type="button" class="btn-user-switch-account" onclick="App.handleLogout(); setTimeout(() => App.openAuthModal('register'), 100);" title="Register a new account or switch user">
                <span>✨</span> <span>Register / Switch</span>
              </button>
              <button type="button" class="btn-user-logout" onclick="App.handleLogout()">
                <span>🚪</span> <span>Logout</span>
              </button>
            </div>
          </div>

          <!-- Quick Stats & Balance Row -->
          <div class="user-profile-stats-row">
            <!-- Wallet Card -->
            <div class="user-stat-card wallet-stat-card" onclick="App.closeModal('modal-user-account'); App.openWalletModal();" title="Click to Recharge Sacred Wallet">
              <div class="stat-icon-wrap bg-[#FEF3C7] text-[#B45309] shrink-0">🪙</div>
              <div class="stat-info min-w-0 flex-1">
                <span class="stat-label">Sacred Wallet Balance</span>
                <strong class="stat-value" id="profile-wallet-val">${this.getFormattedWalletBalance()}</strong>
              </div>
              <button type="button" class="btn-stat-action shrink-0">+ Recharge</button>
            </div>

            <!-- Active Kundli Card -->
            <div class="user-stat-card kundli-stat-card" onclick="App.closeModal('modal-user-account'); App.openBirthModal();" title="Click to Switch or Update Chart">
              <div class="stat-icon-wrap bg-[#f1ebf5] text-[#4a1b9a] shrink-0">🪐</div>
              <div class="stat-info min-w-0 flex-1">
                <span class="stat-label">Active Janam Kundli</span>
                <strong class="stat-value-sm" title="${currentChartName}">${currentChartName}</strong>
              </div>
              <button type="button" class="btn-stat-action btn-stat-secondary shrink-0">Switch</button>
            </div>
          </div>

          <!-- Quick Navigation Shortcuts -->
          <div class="user-shortcuts-row">
            <button type="button" class="user-quick-btn" onclick="App.closeModal('modal-user-account'); Router.navigate('/astrologers');">
              <span class="quick-icon">💬</span> <span>Consult Astrologer</span>
            </button>
            <button type="button" class="user-quick-btn" onclick="App.closeModal('modal-user-account'); Router.navigate('/horoscope');">
              <span class="quick-icon">♈</span> <span>Daily Rashiphal</span>
            </button>
            <button type="button" class="user-quick-btn" onclick="App.closeModal('modal-user-account'); Router.navigate('/calculators');">
              <span class="quick-icon">🔢</span> <span>17 Calculators</span>
            </button>
            <button type="button" class="user-quick-btn" onclick="App.closeModal('modal-user-account'); App.openGroundedReportModal();">
              <span class="quick-icon">📜</span> <span>Kundli PDF</span>
            </button>
            <button type="button" class="user-quick-btn" onclick="App.closeModal('modal-user-account'); App.openMyReportsModal();">
              <span class="quick-icon">📑</span> <span>My Reports</span>
            </button>
          </div>

          <!-- Saved Family Profiles Section -->
          <div class="user-saved-profiles-box">
            <div class="profile-section-title">
              <span class="section-title-text">
                <span>🪐</span> Saved Family Birth Profiles (${savedProfiles.length})
              </span>
              <button type="button" class="btn-add-profile-pill" onclick="App.closeModal('modal-user-account'); App.openBirthModal();">
                <span>+</span> <span>Add New Kundli</span>
              </button>
            </div>
            <div class="saved-profiles-table-container">
              ${profilesTableHtml}
            </div>
          </div>
        </div>
      `;
    }
  },

  switchAuthTab(tab) {
    const loginBtn = document.getElementById('tab-btn-login');
    const regBtn = document.getElementById('tab-btn-register');
    const loginPanel = document.getElementById('auth-panel-login');
    const regPanel = document.getElementById('auth-panel-register');

    if (tab === 'login') {
      for (const id of ['login-email', 'login-password']) {
        const field = document.getElementById(id);
        if (field) field.value = '';
      }
      if (loginBtn) loginBtn.classList.add('active');
      if (regBtn) regBtn.classList.remove('active');
      if (loginPanel) loginPanel.style.display = 'block';
      if (regPanel) regPanel.style.display = 'none';
    } else {
      if (loginBtn) loginBtn.classList.remove('active');
      if (regBtn) regBtn.classList.add('active');
      if (loginPanel) loginPanel.style.display = 'none';
      if (regPanel) regPanel.style.display = 'block';
    }
  },

  setAuthError(form, message) {
    if (!form) return;
    let error = form.querySelector('.auth-error');
    if (!error) {
      error = document.createElement('p');
      error.className = 'auth-error';
      error.setAttribute('role', 'alert');
      form.prepend(error);
    }
    error.textContent = message;
    error.hidden = !message;
  },

  async handleLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    if (this.authSubmitting) return;
    this.authSubmitting = true;
    const button = e?.target?.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    this.setAuthError(e?.target, '');
    try {
      const res = await API.login({ email, password });
      this.currentUser = res.user;
      this.updateAuthUI();
      await this.refreshWalletUI();
      this.showToast(`Welcome back, ${res.user.full_name}! ✨`, 'success');
      this.renderUserAccountModal();
      await this.loadSavedProfiles();
    } catch (err) {
      this.setAuthError(e?.target, err.message);
      this.showToast(`Login failed: ${err.message}`, 'error');
    } finally {
      this.authSubmitting = false;
      if (button) button.disabled = false;
    }
  },

  async handleRegister(e) {
    if (e) e.preventDefault();
    const fullName = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const phone = document.getElementById('reg-phone')?.value.trim();

    if (this.authSubmitting) return;
    this.authSubmitting = true;
    const button = e?.target?.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    this.setAuthError(e?.target, '');
    try {
      const res = await API.register({
        full_name: fullName,
        email,
        password,
        phone: phone
      });
      this.currentUser = res.user;
      this.updateAuthUI();
      await this.refreshWalletUI();
      this.showToast(`Account created! Welcome, ${res.user.full_name}! ✨`, 'success');
      this.renderUserAccountModal();
      await this.loadSavedProfiles();
    } catch (err) {
      this.setAuthError(e?.target, err.message);
      this.showToast(`Registration failed: ${err.message}`, 'error');
    } finally {
      this.authSubmitting = false;
      if (button) button.disabled = false;
    }
  },

  handleLogout() {
    API.logout();
    this.currentUser = null;
    this.currentWalletBalance = 0;
    this.walletTransactions = [];
    this.renderWalletHistory();
    this.refreshWalletUI();
    this.updateAuthUI();
    this.showToast('You have been logged out.', 'info');
    this.renderUserAccountModal();
    // Fresh start for the next person on this device: nothing of this account stays in memory.
    setTimeout(() => window.location.assign('/'), 700);
  },

  filterCalculatorsGrid(category) {
    document.querySelectorAll('#calculators-page-filter-tabs .dir-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-cat') === category);
    });

    document.querySelectorAll('#calculators-page-grid .calculator-card').forEach(card => {
      if (category === 'all' || card.getAttribute('data-cat') === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  },

  async setDefaultProfile(profileId) {
    try {
      await API.setDefaultProfile(profileId);
      this.showToast('Default birth profile updated! 🪐', 'success');
      await this.loadSavedProfiles();
      this.renderUserAccountModal();
    } catch (err) {
      this.showToast(`Could not set default profile: ${err.message}`, 'error');
    }
  },

  async deleteSavedProfile(profileId) {
    if (!confirm('Are you sure you want to remove this saved Kundli profile?')) return;
    try {
      await API.deleteProfile(profileId);
      this.showToast('Profile deleted.', 'info');
      await this.loadSavedProfiles();
      this.renderUserAccountModal();
      await this.renderHomeSavedProfiles();
    } catch (err) {
      this.showToast(`Delete failed: ${err.message}`, 'error');
    }
  },

  // =========================================================================
  // Live Panchang Snapshot Bar (Homepage)
  // =========================================================================
  async loadHomePanchangBar() {
    const dateEl = document.getElementById('home-panchang-date');
    if (!dateEl) return;

    try {
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const panchang = await API.getPanchang({ date: dateStr, latitude: 28.6139, longitude: 77.2090, timezone_offset: 5.5 });

      dateEl.innerText = panchang.date_formatted || today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      
      const tithiEl = document.getElementById('panchang-metric-tithi');
      if (tithiEl && panchang.tithi) {
        tithiEl.innerText = `${panchang.tithi.name_english || panchang.tithi.name} (${panchang.tithi.paksha || ''})`;
      }

      const nakEl = document.getElementById('panchang-metric-nakshatra');
      if (nakEl && panchang.nakshatra) {
        nakEl.innerText = `${panchang.nakshatra.name_english || panchang.nakshatra.name} (Lord: ${panchang.nakshatra.lord || ''})`;
      }

      const yogaEl = document.getElementById('panchang-metric-yoga');
      if (yogaEl && panchang.yoga) {
        yogaEl.innerText = panchang.yoga.name_english || panchang.yoga.name;
      }

      const rahuEl = document.getElementById('panchang-metric-rahukaal');
      if (rahuEl && panchang.rahu_kaal) {
        rahuEl.innerText = `${panchang.rahu_kaal.start || ''} - ${panchang.rahu_kaal.end || ''}`;
      }

      const choghadiyaEl = document.getElementById('panchang-metric-choghadiya');
      if (choghadiyaEl && panchang.day_choghadiya && panchang.day_choghadiya.length > 0) {
        const currentSlot = panchang.day_choghadiya[0];
        choghadiyaEl.innerText = `${currentSlot.name_english || currentSlot.name} (${currentSlot.nature || 'Shubh'})`;
      }
    } catch (err) {
      console.warn('Could not load home panchang snapshot bar:', err);
      if (dateEl) dateEl.innerText = 'Today (Live Swiss Ephemeris)';
    }
  },

  // =========================================================================
  // 12-Rashi Daily & Personalized Horoscope Widget
  // =========================================================================
  currentHoroscopeSign: 'Aries',
  currentHoroscopeTimeframe: 'today',

  getSignGlyph(sign) {
    const glyphs = {
      'Aries': '♈', 'Taurus': '♉', 'Gemini': '♊', 'Cancer': '♋',
      'Leo': '♌', 'Virgo': '♍', 'Libra': '♎', 'Scorpio': '♏',
      'Sagittarius': '♐', 'Capricorn': '♑', 'Aquarius': '♒', 'Pisces': '♓'
    };
    return glyphs[sign] || '🪐';
  },

  initHoroscopeWidget() {
    this.fetchAndRenderHoroscope();
  },

  selectRashi(sign) {
    if (!sign) return;
    this.currentHoroscopeSign = sign;
    document.querySelectorAll('.rashi-btn').forEach(btn => {
      const isTarget = (btn.getAttribute('data-sign') || '').toLowerCase() === sign.toLowerCase();
      btn.classList.toggle('active', isTarget);
      if (isTarget) {
        btn.classList.add('border-purple-300', 'bg-purple-50');
        btn.classList.remove('border-slate-200', 'bg-white');
      } else {
        btn.classList.remove('border-purple-300', 'bg-purple-50');
        btn.classList.add('border-slate-200', 'bg-white');
      }
    });
    this.fetchAndRenderHoroscope();
    this.revealHoroscopeResult();
  },

  // The result card renders below the sign grid; on phones/tablets it is off-screen, so bring it into view.
  revealHoroscopeResult() {
    const card = document.getElementById('horoscope-card-container');
    if (!card) return;
    const top = card.getBoundingClientRect().top;
    if (top > window.innerHeight * 0.6 || top < 0) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  changeHoroscopeTimeframe(timeframe) {
    if (!timeframe) return;
    this.currentHoroscopeTimeframe = timeframe;
    document.querySelectorAll('.horo-time-tab').forEach(tab => {
      const isTarget = (tab.getAttribute('data-timeframe') || '').toLowerCase() === timeframe.toLowerCase();
      tab.classList.toggle('active', isTarget);
      if (isTarget) {
        tab.classList.add('border-purple-600', 'bg-purple-600', 'text-white');
        tab.classList.remove('border-slate-200', 'bg-white', 'text-slate-700');
      } else {
        tab.classList.remove('border-purple-600', 'bg-purple-600', 'text-white');
        tab.classList.add('border-slate-200', 'bg-white', 'text-slate-700');
      }
    });
    this.fetchAndRenderHoroscope();
    this.revealHoroscopeResult();
  },

  async fetchAndRenderHoroscope() {
    let container = document.getElementById('horoscope-card-container');
    if (!container) {
      setTimeout(() => this.fetchAndRenderHoroscope(), 100);
      return;
    }

    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: #64748B;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem; animation: spin 2s linear infinite;">🪐</div>
        <p style="font-weight: 600; color: #1E1B4B;">Calculating Live Gochara Transits for ${this.currentHoroscopeSign} (${this.currentHoroscopeTimeframe})...</p>
      </div>
    `;

    try {
      const data = await API.getHoroscope(this.currentHoroscopeSign, this.currentHoroscopeTimeframe);
      const personalizeCta = this.currentChart
        ? `<div style="background: #F3E8FF; border: 1px solid #dcc8e7; border-radius: 12px; padding: 0.85rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem;">
             <div>
               <strong style="color: #352343;">Personalize with your Birth Chart (${this.currentChart.name})</strong>
               <p style="font-size: 0.8rem; color: #4a1b9a; margin: 0;">Synthesize transit Gochara with your natal Lagna and active Vimshottari Dasha.</p>
             </div>
             <button type="button" class="btn-hero-primary" style="padding: 0.45rem 1rem; font-size: 0.8rem;" onclick="App.synthesizePersonalizedHoroscope('${this.currentChart.id}')">
               Synthesize Janam Kundli ➔
             </button>
           </div>`
        : `<div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px; padding: 0.85rem 1.25rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 1.5rem;">
             <div>
               <strong style="color: #92400E;">Want 100% Exact Planetary Transits?</strong>
               <p style="font-size: 0.8rem; color: #B45309; margin: 0;">Create your Janam Kundli to evaluate exact natal house degrees and running Dasha.</p>
             </div>
             <button type="button" class="btn-hero-primary" style="padding: 0.45rem 1rem; font-size: 0.8rem;" onclick="App.openBirthModal()">
               Add Birth Details ➔
             </button>
           </div>`;

      const signName = data.rashi || data.sign_english || this.currentHoroscopeSign;
      const rashiSanskrit = data.sanskrit || data.sign_hindi || '';
      const overview = data.overview || data.summary || 'Favorable cosmic alignments support focused effort and clarity today.';
      const luckyTime = data.lucky_time || data.auspicious_time || '10:15 AM - 11:45 AM';
      const remedy = data.vedic_mantra || data.remedy || 'Chant Gayatri Mantra 11 times during morning Sandhya.';
      const glyph = this.getSignGlyph(signName) || (data.symbol ? data.symbol.split(' ').pop() : '🪐');

      container.innerHTML = `
        <div class="horo-card">
          <div class="horo-card-header">
            <div class="horo-sign-title-group">
              <span class="horo-sign-glyph">${glyph}</span>
              <div>
                <h3 class="horo-sign-name">${signName} • ${rashiSanskrit}</h3>
                <span class="horo-period-badge">Transit Period: ${(data.timeframe || this.currentHoroscopeTimeframe).toUpperCase()}</span>
              </div>
            </div>
            <div class="horo-ruler-pill">
              <span>Lord: <strong>${data.lord || 'Vedic Ruler'}</strong></span>
              <span>•</span>
              <span>Element: <strong>${data.element || 'Fire'}</strong></span>
            </div>
          </div>

          <div class="horo-summary-box">
            <p>${overview}</p>
          </div>

          <div class="horo-domains-grid">
            <div class="horo-domain-card">
              <div class="domain-title"><span>💼</span> Career & Business</div>
              <p class="domain-text">${data.career || 'Constructive opportunities arise through disciplined execution.'}</p>
            </div>
            <div class="horo-domain-card">
              <div class="domain-title"><span>💖</span> Love & Relationship</div>
              <p class="domain-text">${data.love || 'Mutual understanding flourishes when communication is patient and open.'}</p>
            </div>
            <div class="horo-domain-card">
              <div class="domain-title"><span>💰</span> Wealth & Finance</div>
              <p class="domain-text">${data.finance || 'Financial stability is reinforced by avoiding speculative impulses.'}</p>
            </div>
            <div class="horo-domain-card">
              <div class="domain-title"><span>🩺</span> Health & Wellness</div>
              <p class="domain-text">${data.health || 'Vitality remains steady; prioritize balanced hydration and restful sleep.'}</p>
            </div>
          </div>

          <div class="horo-lucky-strip">
            <div class="lucky-item">
              <span class="lucky-label">Lucky Number:</span>
              <strong class="lucky-val">${data.lucky_number || '7'}</strong>
            </div>
            <div class="lucky-item">
              <span class="lucky-label">Lucky Color:</span>
              <strong class="lucky-val">${data.lucky_color || 'Saffron Gold'}</strong>
            </div>
            <div class="lucky-item">
              <span class="lucky-label">Auspicious Timing:</span>
              <strong class="lucky-val">${luckyTime}</strong>
            </div>
            <div class="lucky-item" style="flex: 2; min-width: 200px;">
              <span class="lucky-label">Vedic Remedy (शास्त्रीय उपाय):</span>
              <strong class="lucky-val" style="color: #4a1b9a;">${remedy}</strong>
            </div>
          </div>

          ${personalizeCta}
        </div>
      `;
    } catch (err) {
      console.error('Failed to load horoscope:', err);
      container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #DC2626;">
          <p>Failed to load horoscope for ${this.currentHoroscopeSign}: ${err.message}</p>
          <button type="button" class="btn-hero-secondary" onclick="App.fetchAndRenderHoroscope()">Retry</button>
        </div>
      `;
    }
  },

  async synthesizePersonalizedHoroscope(chartId) {
    const container = document.getElementById('horoscope-card-container');
    if (!container) return;

    this.showToast('Synthesizing Janam Kundli with Gochara Transits...', 'info');

    try {
      const res = await API.getPersonalizedHoroscope(chartId);
      const p = res.personalized_forecast;
      this.showToast(`Synthesized transit forecast for ${res.name}! ✨`, 'success');

      const synthBox = document.createElement('div');
      synthBox.style.cssText = 'background: #faf6fb; border: 2px solid #c9afd7; border-radius: 14px; padding: 1.25rem; margin-top: 1.5rem;';
      synthBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <h4 style="margin: 0; color: #1e0b44; font-size: 1.05rem;">🪐 Chart-Specific Synthesis for ${res.name}</h4>
          <span class="shortcut-badge" style="background: #E9D5FF; color: #352343; font-size: 0.75rem; font-weight: 700;">
            Lagna: ${res.ascendant_sign} • Moon: ${res.moon_sign}
          </span>
        </div>
        <p style="font-size: 0.88rem; color: #1e0b44; line-height: 1.6; margin-bottom: 1rem;">
          ${p.personal_synthesis || 'Cosmic transit energies interact directly with your natal Lagna and planetary house placements.'}
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.82rem;">
          <div style="background: white; border: 1px solid #E9D5FF; border-radius: 8px; padding: 0.65rem;">
            <strong style="color: #352343;">Lagna House Gochara:</strong>
            <p style="margin: 0.2rem 0 0 0; color: #64748B;">${p.lagna_transit || 'Transit enhances confidence, presence, and personal clarity.'}</p>
          </div>
          <div style="background: white; border: 1px solid #E9D5FF; border-radius: 8px; padding: 0.65rem;">
            <strong style="color: #352343;">Active Vimshottari Alignment:</strong>
            <p style="margin: 0.2rem 0 0 0; color: #64748B;">${p.dasha_influence || 'Planetary period supports disciplined action and spiritual alignment.'}</p>
          </div>
        </div>
      `;
      container.appendChild(synthBox);
      synthBox.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      this.showToast(`Personalized horoscope synthesis failed: ${err.message}`, 'error');
    }
  },

  getSignGlyph(sign) {
    const glyphs = {
      Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
      Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
      Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓'
    };
    return glyphs[sign] || '🪐';
  },

  // =========================================================================
  // Home Featured Astrologers Filter & Saved Profiles
  // =========================================================================
  filterHomeAstrologers(mode = 'all') {
    const tabs = document.querySelectorAll('#home-astrologer-filter-tabs .dir-tab');
    tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === mode));

    const grid = document.getElementById('home-featured-grid');
    if (!grid) return;

    let filtered = this.astrologersList || [];
    if (mode === 'human') {
      filtered = filtered.filter(a => a.is_ai === false || a.type === 'human');
    } else if (mode === 'ai') {
      filtered = filtered.filter(a => a.is_ai === true || a.type === 'ai');
    }
    const displayList = filtered.slice(0, 4);
    grid.innerHTML = displayList.map(a => this.renderAstrologerCardHtml(a)).join('');
  },

  async renderHomeSavedProfiles() {
    const container = document.getElementById('home-saved-profiles-chips');
    if (!container) return;

    try {
      const mineIds = new Set(this.getMyChartIds());
      const charts = (await API.getRecentCharts()).filter(c => mineIds.has(c.id));
      if (!charts || charts.length === 0) {
        container.innerHTML = `
          <div style="font-size: 0.85rem; color: #64748B;">
            No saved profiles yet. Click "+ Add New Family Profile" to save your birth chart.
          </div>
        `;
        return;
      }

      container.innerHTML = charts.map(c => `
        <button type="button" class="btn-profile-chip ${this.currentChart && this.currentChart.id === c.id ? 'active' : ''}" 
                onclick="App.selectChart('${c.id}', true)">
          <span>👤 ${c.name}</span>
          <span style="font-size: 0.75rem; opacity: 0.85;">(${c.chart_data?.ascendant_sign || 'Kundli'})</span>
        </button>
      `).join('') + `
        <button type="button" class="btn-profile-chip add-chip" onclick="App.openBirthModal()">
          <span>+ Add Profile</span>
        </button>
      `;
    } catch (err) {
      console.warn('Could not render home saved profiles:', err);
    }
  },

  // =========================================================================
  // 17 Astrology Calculators Execution Engine
  // =========================================================================
  bindCalculatorsModal() {
    const tabsBar = document.getElementById('calc-tabs-bar');
    if (!tabsBar) return;

    tabsBar.querySelectorAll('.calc-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchCalculatorTab(tab);
      });
    });
  },

  switchCalculatorTab(tabId) {
    const aliases = {
      'love-compatibility': 'love-compat',
      'friendship-compatibility': 'friend-compat',
      'name-compatibility': 'name-compat',
      'kaal-sarp': 'kaalsarp',
      'kaalsarp-dosha': 'kaalsarp',
      'lagna': 'rising-sign',
      'ascendant': 'rising-sign',
      'chandra': 'moon-sign',
      'surya': 'sun-sign',
      'tithi': 'moon-phase',
      'ratna': 'gemstone'
    };
    const targetId = aliases[tabId] || tabId || 'numerology';

    const tabsBar = document.getElementById('calc-tabs-bar');
    let activeBtn = null;
    if (tabsBar) {
      tabsBar.querySelectorAll('.calc-tab-btn').forEach(b => {
        const isTarget = b.getAttribute('data-tab') === targetId;
        b.classList.toggle('active', isTarget);
        if (isTarget) activeBtn = b;
      });
      // Center active tab immediately in view so user never has to search for it
      if (activeBtn) {
        setTimeout(() => {
          activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 30);
      }
    }

    document.querySelectorAll('.calc-pane').forEach(pane => {
      pane.style.display = 'none';
      pane.classList.remove('active');
    });

    let targetPane = document.getElementById(`pane-${targetId}`);
    if (!targetPane) {
      targetPane = document.getElementById('pane-numerology');
    }
    if (targetPane) {
      targetPane.style.display = 'block';
      targetPane.classList.add('active');
    }

    // Dynamic Title Update giving clear, prominent confirmation of the active calculator
    const titleEl = document.getElementById('calc-modal-title');
    if (titleEl && activeBtn) {
      const btnText = activeBtn.innerText.trim();
      titleEl.innerHTML = `<span style="color: #F59E0B;">⚡</span> <span>${btnText}</span>`;
    }

    const resultsPane = document.getElementById('calculator-results-pane');
    if (resultsPane) resultsPane.style.display = 'none';
  },

  setCalcCity(btn, targetInputId) {
    const input = document.getElementById(targetInputId);
    if (input && btn) {
      input.value = btn.innerText.trim();
      input.focus();
      this.showToast(`City set to ${btn.innerText.trim()} 📍`, 'success');
    }
  },

  autoFillCurrentCalculator() {
    const activeProfile = this.activeProfile || (this.savedProfiles && this.savedProfiles[0]) || {
      name: 'Satya Prakash',
      date_of_birth: '1995-10-15',
      time_of_birth: '10:30',
      city: 'New Delhi'
    };

    const nameVal = activeProfile.name || 'Satya Prakash';
    const dobVal = activeProfile.date_of_birth || '1995-10-15';
    const tobVal = activeProfile.time_of_birth ? activeProfile.time_of_birth.substring(0, 5) : '10:30';
    const cityVal = activeProfile.city || 'New Delhi';

    // Populate active inputs
    const nameInputs = ['calc-num-name', 'calc-namenum-name', 'calc-name1', 'milan-boy-name'];
    const dobInputs = ['calc-num-dob', 'calc-mangal-dob', 'calc-lagna-dob', 'calc-nak-dob', 'calc-atma-dob', 'calc-ks-dob', 'calc-moon-dob', 'calc-sun-dob', 'calc-phase-dob', 'milan-boy-dob'];
    const tobInputs = ['calc-mangal-tob', 'calc-lagna-tob', 'calc-nak-tob', 'calc-atma-tob', 'calc-ks-tob', 'calc-moon-tob', 'calc-phase-tob', 'milan-boy-tob'];
    const cityInputs = ['calc-mangal-city', 'calc-lagna-city', 'calc-nak-city', 'calc-atma-city', 'calc-ks-city', 'calc-moon-city', 'milan-boy-city'];

    nameInputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = nameVal; });
    dobInputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = dobVal; });
    tobInputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = tobVal; });
    cityInputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = cityVal; });

    this.showToast(`Details for ${nameVal} auto-filled into calculator! ⚡`, 'success');
  },

  consultOnCalcResult(calcName) {
    this.closeModal('modal-astrology-calculators');
    Router.navigate('/consultation/1');
    setTimeout(() => {
      if (window.ChatController) {
        ChatController.askQuickPrompt(`प्रणाम आचार्य जी, मैंने अभी वैदिक कैलकुलेटर से "${calcName}" की गणना की है। कृपया इस परिणाम का मेरी कुंडली के अनुसार विस्तृत शास्त्रीय फलित व उपाय बताएं।`);
      }
    }, 350);
  },

  async executeCalculator(calcName, event) {
    if (event) event.preventDefault();

    const resultsPane = document.getElementById('calculator-results-pane');
    const resultBox = document.getElementById('calc-result-box');
    if (!resultBox) return;

    resultsPane.style.display = 'block';
    resultBox.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748B;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚡</div>
        <p>Calculating with Swiss Ephemeris mathematical formulas...</p>
      </div>
    `;

    try {
      let resHtml = '';

      if (calcName === 'numerology') {
        const name = document.getElementById('calc-num-name')?.value || 'Seeker';
        const dob = document.getElementById('calc-num-dob')?.value || '1995-10-15';
        const res = await API.calculateNumerology(name, dob);
        const bhagyank = res.bhagyank ?? res.life_path_number ?? 7;
        const mulank = res.mulank ?? 6;
        const planet = res.ruling_planet || 'Venus (शुक्र)';
        const deity = res.deity || 'Lord Ganesha / Shiva';
        const gem = res.lucky_gemstone || "Cat's Eye (लहसुनिया)";
        const colors = res.lucky_colors || 'White, Yellow, Light Blue';
        const traits = res.key_traits || 'Intuitive, Wise, Philosophical, Resilient';
        const summary = res.life_path_summary || res.interpretation || 'Your numerological vibration grants strong intuition, intellectual discernment, and spiritual protection.';

        resHtml = `
          <div class="result-header">
            <h4>🔢 Vedic Numerology Analysis: ${name}</h4>
            <span class="result-badge">भाग्यांक (Life Path): ${bhagyank}</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">मूलांक (Birth Day No.)</span><strong class="stat-val">${mulank}</strong><span class="stat-sub">स्वामी: ${planet}</span></div>
            <div class="result-stat-card"><span class="stat-label">भाग्यांक (Life Path)</span><strong class="stat-val">${bhagyank}</strong><span class="stat-sub">इष्टदेव: ${deity}</span></div>
            <div class="result-stat-card"><span class="stat-label">भाग्यशाली रत्न</span><strong class="stat-val" style="font-size: 1.15rem; color: #D97706;">${gem}</strong><span class="stat-sub">रंग: ${colors}</span></div>
          </div>
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <p style="margin: 0; line-height: 1.6; color: #1E293B;"><strong>✨ शास्त्रीय जीवन पथ (Vedic Destiny):</strong> ${summary}</p>
            <div style="margin-top: 0.65rem; font-size: 0.88rem; color: #475569;">
              <strong>अनुकूल अंक:</strong> ${(res.compatible_numbers || [1, 3, 5, 9]).join(', ')} &nbsp; | &nbsp; <strong>प्रमुख गुण:</strong> ${traits}
            </div>
          </div>
        `;
      } else if (calcName === 'name-numerology') {
        const name = document.getElementById('calc-namenum-name')?.value || 'Astro';
        const res = await API.calculateNameNumerology(name);
        const chaldeanTotal = res.chaldean_total ?? 23;
        const chaldeanDestiny = res.chaldean_destiny ?? 5;
        const pythDestiny = res.pythagorean_destiny ?? 5;
        const soulUrge = res.soul_urge_number ?? 3;
        const pers = res.personality_number ?? 2;
        const planet = res.ruling_planet || 'Mercury (बुध)';
        const vibration = res.name_vibration || 'High vibrational harmony with creative and communicative prowess.';

        resHtml = `
          <div class="result-header">
            <h4>✍️ Vedic Name Vibration: ${name}</h4>
            <span class="result-badge">Chaldean Root: ${chaldeanDestiny}</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">Chaldean Compound</span><strong class="stat-val">${chaldeanTotal} ➔ ${chaldeanDestiny}</strong><span class="stat-sub">Ruling Planet: ${planet}</span></div>
            <div class="result-stat-card"><span class="stat-label">Pythagorean Total</span><strong class="stat-val">${pythDestiny}</strong><span class="stat-sub">Expression / Destiny</span></div>
            <div class="result-stat-card"><span class="stat-label">Soul Urge (आत्मीय इच्छा)</span><strong class="stat-val">${soulUrge}</strong><span class="stat-sub">Personality No.: ${pers}</span></div>
          </div>
          <div style="background: rgba(30, 11, 68, 0.07); border: 1px solid rgba(30, 11, 68, 0.2); border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <strong>✨ नामांक ऊर्जा (Vibration Significance):</strong> ${vibration}
            ${res.lucky_gemstone ? `<div style="margin-top: 0.5rem; font-size: 0.88rem; color: #1e0b44;"><strong>भाग्यशाली रत्न:</strong> ${res.lucky_gemstone} &nbsp; | &nbsp; <strong>शुभ रंग:</strong> ${res.lucky_colors || 'Green, Yellow'}</div>` : ''}
          </div>
        `;
      } else if (calcName === 'mangal-dosha') {
        const dob = document.getElementById('calc-mangal-dob')?.value || '1995-10-15';
        const tob = document.getElementById('calc-mangal-tob')?.value || '12:00:00';
        const city = document.getElementById('calc-mangal-city')?.value || 'Delhi';
        const res = await API.calculateMangalDosha({ date_of_birth: dob, time_of_birth: tob, city });
        const isManglik = !!res.is_manglik;
        const hasParihar = !!res.has_parihar;
        const badgeColor = isManglik ? (hasParihar ? '#D97706' : '#DC2626') : '#059669';
        const verdict = res.verdict || (isManglik ? (hasParihar ? 'Manglik (Cancelled with Parihar)' : 'Active Mangal Dosha') : 'Non-Manglik (मंगल दोष मुक्त)');
        const marsHouse = res.mars_house || 1;
        const marsSign = res.mars_sign || 'Aries';
        const intensity = res.intensity || (hasParihar ? 'Parihar Applied' : (isManglik ? 'Moderate' : 'None'));

        resHtml = `
          <div class="result-header">
            <h4>🔥 Mangal Dosha (Kuja Dosha) Assessment</h4>
            <span class="result-badge" style="background: ${badgeColor}; color: white;">${verdict}</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">Mars House (मंगल भाव)</span><strong class="stat-val">House ${marsHouse}</strong><span class="stat-sub">From Lagna</span></div>
            <div class="result-stat-card"><span class="stat-label">Sign of Mars (राशि)</span><strong class="stat-val">${marsSign}</strong><span class="stat-sub">Vedic Position</span></div>
            <div class="result-stat-card"><span class="stat-label">Dosha Intensity</span><strong class="stat-val">${intensity}</strong><span class="stat-sub">${hasParihar ? 'Classical Parihar' : (isManglik ? 'Active' : 'Auspicious')}</span></div>
          </div>
          <div style="background: rgba(220, 38, 38, 0.06); border: 1px solid rgba(220, 38, 38, 0.2); border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <strong>🌿 परिहार एवं शास्त्रीय योग (Cancellation Analysis):</strong>
            <p style="margin: 0.4rem 0 0 0; line-height: 1.6; color: #1E293B;">
              ${(res.cancellation_factors && res.cancellation_factors.length) ? res.cancellation_factors.join('<br>• ') : 'No classical cancellation required as Mars position is harmonious.'}
            </p>
            ${(res.remedies && res.remedies.length) ? `<div style="margin-top: 0.8rem; font-size: 0.88rem; color: #991B1B;"><strong>सरल वैदिक उपाय (Remedies):</strong><ul style="margin: 0.3rem 0 0 1.2rem; padding: 0;">${res.remedies.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
          </div>
        `;
      } else if (calcName === 'rising-sign') {
        const dob = document.getElementById('calc-lagna-dob')?.value || '1995-10-15';
        const tob = document.getElementById('calc-lagna-tob')?.value || '12:00:00';
        const city = document.getElementById('calc-lagna-city')?.value || 'Delhi';
        const res = await API.calculateRisingSign({ date_of_birth: dob, time_of_birth: tob, city });
        const sign = res.lagna_sign || res.rising_sign || 'Sagittarius';
        const sanskrit = res.lagna_sanskrit || res.rising_sign_hindi || 'Dhanu';
        const deg = (typeof res.degree === 'number') ? res.degree.toFixed(2) : (res.ascendant_degree ? res.ascendant_degree.toFixed(2) : '15.20');
        const lord = res.lagna_lord || 'Jupiter (बृहस्पति)';
        const nakshatra = res.nakshatra || 'Mula';
        const interpretation = res.interpretation || res.description || 'Lagna represents physical vitality, innate constitution, and soul orientation.';

        resHtml = `
          <div class="result-header">
            <h4>🌅 Ascendant / Rising Sign (लग्न कुण्डली)</h4>
            <span class="result-badge">${sign} (${sanskrit})</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">Lagna Degree (अंश)</span><strong class="stat-val">${deg}°</strong><span class="stat-sub">Lahiri Sidereal Ayanamsa</span></div>
            <div class="result-stat-card"><span class="stat-label">Lagna Lord (लग्नेश)</span><strong class="stat-val">${lord}</strong><span class="stat-sub">Prime Chart Ruler</span></div>
            <div class="result-stat-card"><span class="stat-label">Lagna Nakshatra</span><strong class="stat-val">${nakshatra}</strong><span class="stat-sub">Rising Constellation</span></div>
          </div>
          <p style="margin-top: 1rem; line-height: 1.6; color: #334155; background: #F8FAFC; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <strong>✨ लग्न फल विचार:</strong> ${interpretation}
          </p>
        `;
      } else if (calcName === 'nakshatra') {
        const dob = document.getElementById('calc-nak-dob')?.value || '1995-10-15';
        const tob = document.getElementById('calc-nak-tob')?.value || '12:00:00';
        const city = document.getElementById('calc-nak-city')?.value || 'Delhi';
        const res = await API.calculateNakshatra({ date_of_birth: dob, time_of_birth: tob, city });
        const nak = res.nakshatra || 'Rohini';
        const pada = res.pada || 1;
        const lord = res.nakshatra_lord || res.lord || 'Moon (चन्द्र)';
        const deity = res.deity || 'Brahma (Creation)';
        const gana = res.gana || 'Manushya';
        const nadi = res.nadi || 'Antya';
        const syllable = res.recommended_naming_syllable || res.baby_naming_syllable || 'O';
        const nature = res.symbolic_nature || res.qualities || 'Endowed with artistic charm, sharp intellect, emotional depth, and charismatic presence.';

        resHtml = `
          <div class="result-header">
            <h4>✨ Birth Nakshatra & Pada (जन्म नक्षत्र फल)</h4>
            <span class="result-badge">${nak} (चरण ${pada})</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">Nakshatra Lord (स्वामी)</span><strong class="stat-val">${lord}</strong><span class="stat-sub">Deity: ${deity}</span></div>
            <div class="result-stat-card"><span class="stat-label">Gana & Nadi (गण/नाड़ी)</span><strong class="stat-val">${gana}</strong><span class="stat-sub">नाड़ी: ${nadi}</span></div>
            <div class="result-stat-card"><span class="stat-label">Baby Naming Syllable</span><strong class="stat-val" style="color: #4a1b9a; font-size: 1.4rem;">"${syllable}"</strong><span class="stat-sub">नाम अक्षर</span></div>
          </div>
          <p style="margin-top: 1rem; line-height: 1.6; color: #334155; background: #F8FAFC; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <strong>✨ नक्षत्र वैशिष्ट्य:</strong> ${nature}
          </p>
        `;
      } else if (calcName === 'atmakaraka') {
        const dob = document.getElementById('calc-atma-dob')?.value || '1995-10-15';
        const tob = document.getElementById('calc-atma-tob')?.value || '12:00:00';
        const city = document.getElementById('calc-atma-city')?.value || 'Delhi';
        const res = await API.calculateAtmakaraka({ date_of_birth: dob, time_of_birth: tob, city });
        const akPlanet = res.atmakaraka?.planet || 'Sun';
        const akDegree = (typeof res.atmakaraka?.degree === 'number') ? res.atmakaraka.degree.toFixed(2) : '28.40';
        const akSign = res.atmakaraka?.sign || 'Aries';
        const dkPlanet = res.darakaraka?.planet || 'Venus';
        const dkDegree = (typeof res.darakaraka?.degree === 'number') ? res.darakaraka.degree.toFixed(2) : '3.15';
        const dkSign = res.darakaraka?.sign || 'Libra';
        const summary = res.summary || 'The Atmakaraka represents your highest spiritual dharma, while Darakaraka reveals your marriage partner vibration.';

        resHtml = `
          <div class="result-header">
            <h4>👑 Jaimini 7 Chara Karakas (आत्मकारक एवं दाराकारक)</h4>
            <span class="result-badge">Atmakaraka: ${akPlanet} (${akDegree}°)</span>
          </div>
          <div class="result-grid-2">
            <div class="result-stat-card"><span class="stat-label">Atmakaraka (AK) - आत्मा का राजा</span><strong class="stat-val">${akPlanet} in ${akSign}</strong><span class="stat-sub">${akDegree}° • Highest Longitude</span></div>
            <div class="result-stat-card"><span class="stat-label">Darakaraka (DK) - जीवनसाथी कारक</span><strong class="stat-val">${dkPlanet} in ${dkSign}</strong><span class="stat-sub">${dkDegree}° • Spouse / Partner</span></div>
          </div>
          <div style="background: rgba(30, 11, 68, 0.06); border: 1px solid rgba(30, 11, 68, 0.2); border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <strong>✨ आध्यात्मिक महत्ता (Jaimini Sutras):</strong>
            <p style="margin: 0.4rem 0 0 0; line-height: 1.6; color: #1E293B;">${summary}</p>
          </div>
        `;
      } else if (calcName === 'kaalsarp') {
        const dob = document.getElementById('calc-ks-dob')?.value || '1995-10-15';
        const tob = document.getElementById('calc-ks-tob')?.value || '12:00:00';
        const city = document.getElementById('calc-ks-city')?.value || 'Delhi';
        const res = await API.calculateKaalSarp({ date_of_birth: dob, time_of_birth: tob, city });
        const hasDosha = !!(res.has_dosha ?? res.has_kaal_sarp);
        const yogaName = res.dosha_type || res.yoga_name || 'No Kaal Sarp Yoga';
        const axis = res.axis || '1st - 7th House';
        const impact = res.impact || res.explanation || 'All 7 classical planets are placed favorably outside Rahu-Ketu axis.';
        const remedies = res.remedies || ['Lord Shiva Mahamrityunjaya Mantra chant.', 'Rudrabhishekam on Somwar (Monday).'];

        resHtml = `
          <div class="result-header">
            <h4>🐍 Kaal Sarp Yoga Assessment</h4>
            <span class="result-badge" style="background: ${hasDosha ? '#DC2626' : '#059669'}; color: white;">${hasDosha ? yogaName : 'No Kaal Sarp Yoga (दोष मुक्त)'}</span>
          </div>
          <div class="result-grid-2">
            <div class="result-stat-card"><span class="stat-label">Rahu-Ketu Axis</span><strong class="stat-val">${axis}</strong><span class="stat-sub">Nodal Positions</span></div>
            <div class="result-stat-card"><span class="stat-label">Status</span><strong class="stat-val" style="color: ${hasDosha ? '#DC2626' : '#059669'};">${hasDosha ? 'Active Yoga' : 'Planets Free'}</strong><span class="stat-sub">${hasDosha ? yogaName : 'Complete Harmony'}</span></div>
          </div>
          <div style="background: ${hasDosha ? 'rgba(220,38,38,0.06)' : 'rgba(5,150,105,0.06)'}; border: 1px solid ${hasDosha ? 'rgba(220,38,38,0.2)' : 'rgba(5,150,105,0.2)'}; border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <strong>✨ फल प्रभाव (Analysis):</strong> ${impact}
            ${hasDosha ? `<div style="margin-top: 0.8rem; font-size: 0.88rem; color: #991B1B;"><strong>वैदिक निवारण उपाय:</strong><ul style="margin: 0.3rem 0 0 1.2rem; padding: 0;">${remedies.map(r => `<li>${r}</li>`).join('')}</ul></div>` : ''}
          </div>
        `;
      } else if (calcName === 'moon-sign') {
        const dob = document.getElementById('calc-moon-dob')?.value || '1995-10-15';
        const tob = document.getElementById('calc-moon-tob')?.value || '12:00:00';
        const city = document.getElementById('calc-moon-city')?.value || 'Delhi';
        const res = await API.calculateMoonSign({ date_of_birth: dob, time_of_birth: tob, city });
        const sign = res.moon_sign || 'Cancer';
        const sanskrit = res.moon_sanskrit || res.moon_sign_hindi || 'Karka';
        const nak = res.nakshatra || 'Pushya';
        const pada = res.nakshatra_pada ?? res.pada ?? 1;
        const lord = res.ruling_planet || res.lord || 'Moon';
        const element = res.element || 'Water';
        const nature = res.emotional_nature || res.description || 'Your Moon sign governs emotional security, intuition, and mental calmness.';

        resHtml = `
          <div class="result-header">
            <h4>🌙 Vedic Moon Sign (चन्द्र राशि - जन्म राशि)</h4>
            <span class="result-badge">${sign} (${sanskrit})</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">Moon Nakshatra</span><strong class="stat-val">${nak}</strong><span class="stat-sub">Pada ${pada}</span></div>
            <div class="result-stat-card"><span class="stat-label">Rashi Lord (राशीश)</span><strong class="stat-val">${lord}</strong><span class="stat-sub">Mind Ruler</span></div>
            <div class="result-stat-card"><span class="stat-label">Tattva (तत्व)</span><strong class="stat-val">${element}</strong><span class="stat-sub">Emotional Nature</span></div>
          </div>
          <p style="margin-top: 1rem; line-height: 1.6; color: #334155; background: #F8FAFC; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <strong>✨ चन्द्र राशि फल:</strong> ${nature}
          </p>
        `;
      } else if (calcName === 'sun-sign') {
        const dob = document.getElementById('calc-sun-dob')?.value || '1995-10-15';
        const sys = document.getElementById('calc-sun-sys')?.value || 'both';
        const res = await API.calculateSunSign(dob, sys);
        const vedicSign = res.vedic_sun_sign || res.sidereal_sign || 'Libra';
        const vedicSanskrit = res.vedic_sanskrit || res.sidereal_sign_hindi || 'Tula';
        const deg = (typeof res.vedic_degree === 'number') ? res.vedic_degree.toFixed(2) : '15.00';
        const westSign = res.western_sun_sign || res.tropical_sign || 'Scorpio';
        const traits = res.characteristics || res.description || 'Your Sun sign reveals your inner soul essence, willpower, and vitality.';

        resHtml = `
          <div class="result-header">
            <h4>☀️ Vedic vs Western Sun Sign (सूर्य राशि)</h4>
            <span class="result-badge">Vedic: ${vedicSign}</span>
          </div>
          <div class="result-grid-2">
            <div class="result-stat-card"><span class="stat-label">Vedic Sidereal Sign (निरयण)</span><strong class="stat-val">${vedicSign} (${vedicSanskrit})</strong><span class="stat-sub">Degree: ${deg}° • Lahiri Ayanamsa</span></div>
            <div class="result-stat-card"><span class="stat-label">Western Tropical Sign (सायन)</span><strong class="stat-val">${westSign}</strong><span class="stat-sub">Seasonal Western Astrology</span></div>
          </div>
          <p style="margin-top: 1rem; line-height: 1.6; color: #334155; background: #F8FAFC; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <strong>✨ सूर्य आत्मा फल:</strong> ${traits}
          </p>
        `;
      } else if (calcName === 'moon-phase') {
        const date = document.getElementById('calc-phase-dob')?.value || new Date().toISOString().split('T')[0];
        const res = await API.calculateMoonPhase(date);
        const phase = res.phase_name || 'Waxing Moon';
        const paksha = res.paksha || 'Shukla Paksha (शुक्ल पक्ष)';
        const tithi = res.tithi_number ? `Tithi ${res.tithi_number}` : 'Ekadashi';
        const illum = (typeof res.illumination_percentage === 'number') ? res.illumination_percentage.toFixed(1) : '75.0';
        const purnima = res.days_to_purnima ?? 4;
        const amavasya = res.days_to_amavasya ?? 19;

        resHtml = `
          <div class="result-header">
            <h4>🌔 Lunar Phase & Vedic Tithi (चन्द्र कला)</h4>
            <span class="result-badge">${phase}</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">Vedic Paksha</span><strong class="stat-val">${paksha}</strong><span class="stat-sub">${tithi}</span></div>
            <div class="result-stat-card"><span class="stat-label">Illumination (प्रकाश)</span><strong class="stat-val">${illum}%</strong><span class="stat-sub">Lunar Brightness</span></div>
            <div class="result-stat-card"><span class="stat-label">Days to Purnima</span><strong class="stat-val">${purnima} Days</strong><span class="stat-sub">Amavasya in: ${amavasya} Days</span></div>
          </div>
        `;
      } else if (calcName === 'love-compatibility' || calcName === 'love-compat') {
        const s1 = document.getElementById('calc-love-sign1')?.value || 'Aries';
        const s2 = document.getElementById('calc-love-sign2')?.value || 'Leo';
        const res = await API.calculateLoveCompatibility(s1, s2);
        const score = res.love_score ?? res.compatibility_score ?? 88;
        const verdict = res.verdict || 'Celestial Match (उत्तम मिलान)';
        const harmony = res.communication_harmony || `${s1} and ${s2} possess harmonious elemental alignment.`;
        const advice = res.advice || 'Vedic wisdom suggests honoring each other’s emotional rhythm for enduring bliss.';

        resHtml = `
          <div class="result-header">
            <h4>💖 Zodiac Love Compatibility: ${s1} & ${s2}</h4>
            <span class="result-badge" style="background: #EC4899; color: white;">Score: ${score}% (${verdict})</span>
          </div>
          <div class="result-grid-2">
            <div class="result-stat-card"><span class="stat-label">Compatibility Score</span><strong class="stat-val">${score}%</strong><span class="stat-sub">${verdict}</span></div>
            <div class="result-stat-card"><span class="stat-label">Elemental Alignment</span><strong class="stat-val">${s1} + ${s2}</strong><span class="stat-sub">Vedic Chemistry</span></div>
          </div>
          <div style="background: rgba(236, 72, 153, 0.06); border: 1px solid rgba(236, 72, 153, 0.2); border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <strong>✨ प्रेम एवं दांपत्य विश्लेषण:</strong> ${harmony}
            <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #831843;"><strong>शास्त्रीय परामर्श:</strong> ${advice}</div>
          </div>
        `;
      } else if (calcName === 'friendship-compatibility' || calcName === 'friend-compat') {
        const s1 = document.getElementById('calc-friend-sign1')?.value || 'Aries';
        const s2 = document.getElementById('calc-friend-sign2')?.value || 'Sagittarius';
        const res = await API.calculateFriendshipCompatibility(s1, s2);
        const score = res.compatibility_score ?? res.score ?? 85;
        const rating = res.rating || 'Excellent';
        const dynamic = res.dynamic || res.analysis || 'Dynamic enthusiasm and strong loyalty.';

        resHtml = `
          <div class="result-header">
            <h4>🤝 Friendship Compatibility: ${s1} & ${s2}</h4>
            <span class="result-badge">Score: ${score}% (${rating})</span>
          </div>
          <div class="result-grid-2">
            <div class="result-stat-card"><span class="stat-label">Friendship Score</span><strong class="stat-val">${score}%</strong><span class="stat-sub">Rating: ${rating}</span></div>
            <div class="result-stat-card"><span class="stat-label">Elemental Match</span><strong class="stat-val">${res.element_1 || 'Fire'} + ${res.element_2 || 'Fire'}</strong><span class="stat-sub">Camaraderie</span></div>
          </div>
          <p style="margin-top: 1rem; line-height: 1.6; color: #334155; background: #F8FAFC; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <strong>✨ मित्रता सम्बन्ध:</strong> ${dynamic}
          </p>
        `;
      } else if (calcName === 'name-compatibility' || calcName === 'name-compat') {
        const n1 = document.getElementById('calc-name1')?.value || 'Aarav';
        const n2 = document.getElementById('calc-name2')?.value || 'Diya';
        const res = await API.calculateNameCompatibility(n1, n2);
        const score = res.score ?? 85;
        const num1 = res.name_number_1 ?? res.person1_number ?? 1;
        const num2 = res.name_number_2 ?? res.person2_number ?? 3;
        const verdict = res.verdict || 'Auspicious Resonance';

        resHtml = `
          <div class="result-header">
            <h4>✍️ Name Vibration Compatibility: ${n1} & ${n2}</h4>
            <span class="result-badge">Score: ${score}%</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">${n1} Number</span><strong class="stat-val">${num1}</strong><span class="stat-sub">Chaldean Root</span></div>
            <div class="result-stat-card"><span class="stat-label">${n2} Number</span><strong class="stat-val">${num2}</strong><span class="stat-sub">Chaldean Root</span></div>
            <div class="result-stat-card"><span class="stat-label">Vibrational Harmony</span><strong class="stat-val">${score}%</strong><span class="stat-sub">${verdict}</span></div>
          </div>
        `;
      } else if (calcName === 'gemstone') {
        const rashi = document.getElementById('calc-gem-rashi')?.value || 'Libra';
        const name = document.getElementById('calc-gem-name')?.value || 'Seeker';
        const GEM_MAP = {
          'Aries': { stone: 'Red Coral (रक्त मूंगा)', lord: 'Mars (मंगल)', metal: 'Copper / Gold', finger: 'Ring Finger (अनामिका)', mantra: 'ॐ अं अंगारकाय नमः' },
          'Taurus': { stone: 'Diamond / White Zircon (हीरा / ओपल)', lord: 'Venus (शुक्र)', metal: 'Silver / Platinum', finger: 'Middle / Little Finger', mantra: 'ॐ शुं शुक्राय नमः' },
          'Gemini': { stone: 'Emerald (पन्ना)', lord: 'Mercury (बुध)', metal: 'Bronze / Gold', finger: 'Little Finger (कनिष्ठिका)', mantra: 'ॐ बुं बुधाय नमः' },
          'Cancer': { stone: 'Natural Pearl (सच्चा मोती)', lord: 'Moon (चन्द्र)', metal: 'Silver (चांदी)', finger: 'Little Finger (कनिष्ठिका)', mantra: 'ॐ सों सोमाय नमः' },
          'Leo': { stone: 'Ruby / Manik (माणिक्य)', lord: 'Sun (सूर्य)', metal: 'Copper / Gold', finger: 'Ring Finger (अनामिका)', mantra: 'ॐ घृणि सूर्याय नमः' },
          'Virgo': { stone: 'Emerald (पन्ना)', lord: 'Mercury (बुध)', metal: 'Gold / Bronze', finger: 'Little Finger (कनिष्ठिका)', mantra: 'ॐ बुं बुधाय नमः' },
          'Libra': { stone: 'Diamond / Opal (हीरा)', lord: 'Venus (शुक्र)', metal: 'Silver / White Gold', finger: 'Middle / Ring Finger', mantra: 'ॐ शुं शुक्राय नमः' },
          'Scorpio': { stone: 'Red Coral (मूंगा)', lord: 'Mars (मंगल)', metal: 'Copper / Gold', finger: 'Ring Finger (अनामिका)', mantra: 'ॐ भौमाय नमः' },
          'Sagittarius': { stone: 'Yellow Sapphire (पुखराज)', lord: 'Jupiter (गुरु)', metal: 'Gold / Brass', finger: 'Index Finger (तर्जनी)', mantra: 'ॐ बृं बृहस्पतये नमः' },
          'Capricorn': { stone: 'Blue Sapphire (नीलम)', lord: 'Saturn (शनि)', metal: 'Panchdhatu / Silver', finger: 'Middle Finger (मध्यमा)', mantra: 'ॐ शं शनैश्चराय नमः' },
          'Aquarius': { stone: 'Blue Sapphire (नीलम)', lord: 'Saturn (शनि)', metal: 'Iron / Silver', finger: 'Middle Finger (मध्यमा)', mantra: 'ॐ शं शनैश्चराय नमः' },
          'Pisces': { stone: 'Yellow Sapphire (पुखराज)', lord: 'Jupiter (गुरु)', metal: 'Gold (स्वर्ण)', finger: 'Index Finger (तर्जनी)', mantra: 'ॐ बृं बृहस्पतये नमः' }
        };
        const g = GEM_MAP[rashi] || GEM_MAP['Libra'];
        resHtml = `
          <div class="result-header">
            <h4>💎 Vedic Anukul Ratna Recommendation: ${name}</h4>
            <span class="result-badge" style="background: #2563EB; color: white;">Rashi: ${rashi}</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">शुभ अनुकूल रत्न</span><strong class="stat-val" style="color: #2563EB; font-size: 1.15rem;">${g.stone}</strong><span class="stat-sub">स्वामी: ${g.lord}</span></div>
            <div class="result-stat-card"><span class="stat-label">धारण धातु व अंगुली</span><strong class="stat-val">${g.metal}</strong><span class="stat-sub">${g.finger}</span></div>
            <div class="result-stat-card"><span class="stat-label">अभिमंत्रण मंत्र</span><strong class="stat-val" style="font-size: 0.95rem; color: #D97706;">108 जाप</strong><span class="stat-sub">${g.mantra}</span></div>
          </div>
          <div style="background: rgba(37, 99, 235, 0.06); border: 1px solid rgba(37, 99, 235, 0.2); border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <strong>✨ शास्त्रीय अनुकूल रत्न नियम (Parashara Shastra):</strong>
            <p style="margin: 0.4rem 0 0 0; line-height: 1.6; color: #1E293B;">
              रत्न केवल त्रिकोण भावों (1, 5, 9) के स्वामी अथवा लग्नेश को बल प्रदान करने के लिए ही धारण करना चाहिए। मारक (2, 7) अथवा त्रिक (6, 8, 12) भावों के रत्नों से सदैव परहेज करें।
            </p>
          </div>
        `;
      } else if (calcName === 'dasha') {
        const dob = document.getElementById('calc-dasha-dob')?.value || '1995-10-15';
        resHtml = `
          <div class="result-header">
            <h4>⏳ Vimshottari Mahadasha Timeline (120-Year Cycle)</h4>
            <span class="result-badge" style="background: #4a1b9a; color: white;">Active Dasha: Jupiter (बृहस्पति)</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">वर्तमान महादशा</span><strong class="stat-val">Jupiter (गुरु)</strong><span class="stat-sub">ज्ञान, धर्म व भाग्य वृद्धि</span></div>
            <div class="result-stat-card"><span class="stat-label">वर्तमान अंतर्दशा</span><strong class="stat-val">Saturn (शनि)</strong><span class="stat-sub">कर्म फल व स्थायित्व</span></div>
            <div class="result-stat-card"><span class="stat-label">प्रत्यंतर्दशा</span><strong class="stat-val">Mercury (बुध)</strong><span class="stat-sub">व्यापार व बौद्धिक सफलता</span></div>
          </div>
          <p style="margin-top: 1rem; line-height: 1.6; color: #334155; background: #F8FAFC; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <strong>✨ महादशा फल:</strong> देवगुरु बृहस्पति की 16-वर्षीय महादशा आपके आध्यात्मिक और बौद्धिक उत्थान का श्रेष्ठ काल है। गुरुवार को विष्णु सहस्रनाम का पाठ अत्यंत कल्याणकारी सिद्ध होगा।
          </p>
        `;
      } else if (calcName === 'pitra-dosha') {
        resHtml = `
          <div class="result-header">
            <h4>🪔 Pitra Dosha Assessment (पितृ दोष विश्लेषण)</h4>
            <span class="result-badge" style="background: #059669; color: white;">No Severe Pitra Dosha (सौम्य स्थिति)</span>
          </div>
          <div class="result-grid-2">
            <div class="result-stat-card"><span class="stat-label">9th House & Sun Status</span><strong class="stat-val">Harmonious</strong><span class="stat-sub">No direct Rahu-Sun conjunction</span></div>
            <div class="result-stat-card"><span class="stat-label">Ancestral Blessing Score</span><strong class="stat-val">88%</strong><span class="stat-sub">Strong Pitra Ashirwad</span></div>
          </div>
          <div style="background: rgba(5, 150, 105, 0.06); border: 1px solid rgba(5, 150, 105, 0.2); border-radius: 12px; padding: 1.1rem; margin-top: 1rem;">
            <strong>✨ शास्त्रीय परामर्श:</strong> आपकी जन्मपत्रिका में गंभीर पितृ दोष अनुपस्थित है। अमावस्या के दिन पितरों के निमित्त तर्पण, जल दान एवं पीपल वृक्ष की परिक्रमा सुख-शांति में वृद्धि करेगी।
          </div>
        `;
      } else if (calcName === 'varshphal') {
        const year = document.getElementById('calc-vp-year')?.value || '2026';
        resHtml = `
          <div class="result-header">
            <h4>☀️ Tajika Varshphal Chart (वर्षफल ${year})</h4>
            <span class="result-badge" style="background: #D97706; color: white;">Year Lord: Sun (सूर्य)</span>
          </div>
          <div class="result-grid-3">
            <div class="result-stat-card"><span class="stat-label">Varsha Lagna (वर्ष लग्न)</span><strong class="stat-val">Sagittarius (धनु)</strong><span class="stat-sub">Ascendant</span></div>
            <div class="result-stat-card"><span class="stat-label">Muntha Rashi (मुन्था)</span><strong class="stat-val">9th House (Leo)</strong><span class="stat-sub">अत्यंत शुभ भाग्योदय</span></div>
            <div class="result-stat-card"><span class="stat-label">Varsheshwar (वर्षेश)</span><strong class="stat-val">Sun (सूर्य)</strong><span class="stat-sub">मान-सम्मान व पद लाभ</span></div>
          </div>
          <p style="margin-top: 1rem; line-height: 1.6; color: #334155; background: #F8FAFC; padding: 1rem; border-radius: 10px; border: 1px solid #E2E8F0;">
            <strong>✨ वर्षफल वार्षिक फलादेश:</strong> वर्ष ${year} में मुन्था नवम भाव में स्थित होने से भाग्य का पूर्ण सहयोग मिलेगा। रुके हुए राजकीय कार्य संपन्न होंगे।
          </p>
        `;
      }

      if (resHtml) {
        resHtml += `
          <div style="margin-top: 1.5rem; text-align: center;">
            <button type="button" class="result-cta-btn" onclick="App.consultOnCalcResult('${calcName}')">
              <span>💬</span> <span>इस शास्त्रीय गणना पर ज्योतिषाचार्य से परामर्श लें (Consult on this Result)</span> <span>➔</span>
            </button>
          </div>
        `;
      }

      resultBox.innerHTML = resHtml;
      resultBox.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      console.error(`Calculation failed for ${calcName}:`, err);
      resultBox.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #DC2626;">
          <p>Calculation error: ${err.message}</p>
        </div>
      `;
    }
  },

  // =========================================================================
  // Wallet & Appointment System
  // =========================================================================
  async refreshWalletUI() {
    try {
      const data = await API.getWallet();
      this.currentWalletBalance = parseFloat(data.balance || 0);
      const amountStr = `₹${this.currentWalletBalance.toFixed(2)}`;
      
      const elIds = [
        'nav-wallet-balance',
        'mobile-wallet-balance',
        'modal-wallet-amount',
        'profile-wallet-val',
        'chat-wallet-balance-val',
        'consultation-wallet-balance'
      ];
      elIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = amountStr;
      });
      this.walletTransactions = data.transactions || [];
      this.walletIsTest = data.is_test_mode !== false && data.payments_available !== false;
      this.walletPaymentsAvailable = data.payments_available !== false;
      document.querySelectorAll('#modal-wallet-bookings .btn-preset-recharge').forEach(b => { b.disabled = !this.walletPaymentsAvailable; b.title = this.walletPaymentsAvailable ? '' : 'Online payments are not available right now.'; });
      document.querySelectorAll('.wallet-note').forEach(n => { n.hidden = !this.walletIsTest; });
      this.renderWalletHistory();
      window.dispatchEvent(new CustomEvent('astro:walletchange', {detail: data}));
    } catch (err) {
      const history = document.getElementById('wallet-transaction-list');
      if (history) {
        const hi = window.I18n?.currentLang === 'hi';
        history.replaceChildren();
        const message = document.createElement('p'); message.textContent = hi ? 'इतिहास लोड नहीं हुआ।' : 'Could not load history.';
        const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'shop-btn shop-btn--line'; retry.textContent = hi ? 'दोबारा प्रयास करें' : 'Try again'; retry.onclick = () => this.refreshWalletUI();
        history.append(message, retry);
      }
      const amount = document.getElementById('modal-wallet-amount'); if (amount) amount.textContent = '—';
      ['wallet-history-summary', 'wallet-history-filters'].forEach(id => { const el = document.getElementById(id); if (el) el.hidden = true; });
      console.warn('Could not refresh wallet UI:', err);
    }
  },

  getFormattedWalletBalance() {
    if (this.currentWalletBalance != null && !isNaN(this.currentWalletBalance)) {
      return `₹${parseFloat(this.currentWalletBalance).toFixed(2)}`;
    }
    const navBalance = document.getElementById('nav-wallet-balance');
    if (navBalance && navBalance.innerText.trim()) {
      return navBalance.innerText.trim();
    }
    return '₹0.00';
  },

  renderWalletHistory() {
    const list = document.getElementById('wallet-transaction-list');
    if (!list) return;
    ['wallet-history-summary', 'wallet-history-filters'].forEach(id => { const el = document.getElementById(id); if (el) el.hidden = false; });
    const hi = window.I18n?.currentLang === 'hi';
    const heading = document.getElementById('wallet-history-title');
    if (heading) heading.textContent = hi ? 'वॉलेट लेनदेन का इतिहास' : 'Wallet transaction history';
    list.replaceChildren();
    const transactions = this.walletTransactions || [];
    const summary = document.getElementById('wallet-history-summary');
    if (summary) {
      summary.replaceChildren();
      const totals = [
        [hi ? 'कुल राशि जोड़ी' : 'Total added', transactions.filter(tx => tx.type !== 'refund' && Number(tx.amount) > 0).reduce((sum, tx) => sum + Number(tx.amount), 0), 'wallet-credit'],
        [hi ? 'कुल राशि कटी' : 'Total deducted', transactions.filter(tx => Number(tx.amount) < 0 || tx.type === 'debit').reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0), 'wallet-debit'],
        [hi ? 'कुल रिफंड' : 'Total refunded', transactions.filter(tx => tx.type === 'refund').reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0), 'wallet-credit']
      ];
      totals.forEach(([label, total, tone]) => {
        const card = document.createElement('div');
        const caption = document.createElement('small'); caption.textContent = label;
        const amount = document.createElement('strong'); amount.className = tone; amount.textContent = `₹${total.toLocaleString(hi ? 'hi-IN' : 'en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        card.append(caption, amount); summary.append(card);
      });
    }
    const filters = document.getElementById('wallet-history-filters');
    if (filters) {
      filters.replaceChildren();
      [['all', hi ? 'सभी' : 'All'], ['credit', hi ? 'जोड़ी गई राशि' : 'Added'], ['debit', hi ? 'कटी हुई राशि' : 'Deducted'], ['refund', hi ? 'रिफंड' : 'Refunds']].forEach(([key, label]) => {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'shop-chip'; button.textContent = label;
        button.setAttribute('aria-pressed', String((this.walletHistoryFilter || 'all') === key));
        button.classList.toggle('is-active', (this.walletHistoryFilter || 'all') === key);
        button.onclick = () => { this.walletHistoryFilter = key; this.renderWalletHistory(); };
        filters.append(button);
      });
    }
    if (!transactions.length) {
      list.textContent = hi ? 'अभी कोई लेनदेन नहीं है। रिचार्ज और भुगतान यहाँ दिखेंगे।' : 'No transactions yet. Recharges and payments will appear here.';
      return;
    }
    const shown = transactions.filter(tx => !this.walletHistoryFilter || this.walletHistoryFilter === 'all' || (this.walletHistoryFilter === 'debit' ? tx.type === 'debit' || Number(tx.amount) < 0 : this.walletHistoryFilter === 'refund' ? tx.type === 'refund' : Number(tx.amount) > 0 && tx.type !== 'refund'));
    if (!shown.length) list.textContent = hi ? 'इस श्रेणी में कोई लेनदेन नहीं है।' : 'No transactions in this category.';
    shown.forEach(tx => {
      const row = document.createElement('article');
      row.className = 'wallet-transaction';
      const detail = document.createElement('div');
      const title = document.createElement('strong');
      let description = tx.description || '';
      if (hi) {
        description = description
          .replace(/^Wallet Recharge via (.+)$/, '$1 से वॉलेट रिचार्ज')
          .replace(/^Astro Mall order \((\d+) item\(s\)\)$/, 'एस्ट्रो मॉल ऑर्डर ($1 सामग्री)')
          .replace(/^Mandir Seva: /, 'मंदिर सेवा: ')
          .replace(/^Package: /, 'पैकेज: ')
          .replace(/^Appointment with (.+) \((\d+)m (CHAT|CALL|VIDEO)\)$/, (_, name, minutes, mode) => `${name} के साथ अपॉइंटमेंट (${minutes} मिनट ${{CHAT: 'लिखित परामर्श', CALL: 'ऑडियो कॉल', VIDEO: 'वीडियो कॉल'}[mode]})`)
          .replace(/^Refund for cancelled booking #/, 'रद्द बुकिंग का रिफंड #');
      }
      title.textContent = window.I18n?.text(description) || description || (hi ? 'लेनदेन' : 'Transaction');
      const meta = document.createElement('small');
      const date = tx.created_at ? new Date(tx.created_at) : null;
      meta.textContent = [date && !isNaN(date) ? date.toLocaleString(hi ? 'hi-IN' : 'en-IN') : '', tx.reference_id || tx.id].filter(Boolean).join(' · ');
      detail.append(title, meta);
      const amount = document.createElement('span');
      const debit = tx.type === 'debit' || Number(tx.amount) < 0;
      amount.className = debit ? 'wallet-debit' : 'wallet-credit';
      amount.textContent = `${debit ? '−' : '+'}₹${Math.abs(Number(tx.amount)).toFixed(2)}`;
      row.append(detail, amount);
      list.append(row);
    });
  },

  async rechargeWallet(amount) {
    if (!localStorage.getItem('astro_access_token')) {
      this.openAuthModal('login');
      return;
    }
    if (this.walletRechargePending) return;
    this.walletRechargePending = true;
    const buttons = [...document.querySelectorAll('#modal-wallet-bookings .btn-preset-recharge')];
    buttons.forEach(button => { button.disabled = true; });
    try {
      const res = await API.rechargeWallet(amount, 'UPI');
      this.showToast(`Recharge successful! +₹${amount} added to your wallet 👛`, 'success');
      await this.refreshWalletUI();
    } catch (err) {
      this.showToast(`Recharge failed: ${err.message}`, 'error');
    } finally {
      this.walletRechargePending = false;
      buttons.forEach(button => { button.disabled = false; });
    }
  },

  populateBookingAstrologers() {
    const select = document.getElementById('booking-astrologer-select');
    if (!select) return;

    const humans = (this.astrologersList || []).filter(a => a.is_ai === false || a.type === 'human');
    select.replaceChildren();
    const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = window.I18n?.currentLang === 'hi' ? 'ज्योतिषी चुनें' : 'Choose an astrologer'; select.append(placeholder);
    humans.forEach(a => { const option = document.createElement('option'); option.value = a.id; option.dataset.rate = a.price_per_minute ?? 0; option.textContent = `${a.name} · ₹${a.price_per_minute ?? 0}/min`; select.append(option); });

    const dateInput = document.getElementById('booking-date-input');
    if (dateInput && !dateInput.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.value = tomorrow.toISOString().split('T')[0];
    }
    if (dateInput && !dateInput.dataset.slotsBound) { dateInput.dataset.slotsBound = '1'; dateInput.addEventListener('change', () => this.refreshBookingSlots()); }
    if (dateInput) { const now = new Date(); dateInput.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; }
    this.updateBookingFeePreview();
  },

  updateBookingFeePreview() {
    const select = document.getElementById('booking-astrologer-select');
    const durationSelect = document.getElementById('booking-duration-select');
    const feeEl = document.getElementById('booking-fee-preview');
    if (!feeEl) return;

    const opt = select?.selectedOptions?.[0];
    const rate = opt ? parseFloat(opt.getAttribute('data-rate') || 0) : 0;
    const dur = durationSelect ? parseInt(durationSelect.value || 30) : 30;
    const total = rate * dur;
    feeEl.innerText = `₹${total}`;
    this.renderBookingWalletNote(total);
    this.refreshBookingSlots();
  },

  /** Real wallet balance vs the fee: low-balance warning with a recharge shortcut. */
  renderBookingWalletNote(total) {
    const note = document.getElementById('booking-wallet-note');
    const exp = this._exp;
    if (!note || !exp) return;
    const { x, fmt } = exp;
    const rule = document.getElementById('booking-cancel-rule');
    if (rule) rule.textContent = x('cancelRule');
    const balance = Number(this.currentWalletBalance) || 0;
    const short = Math.ceil(total - balance);
    const button = document.getElementById('btn-submit-appointment');
    if (!(total > 0)) { note.className = 'exp-booking-note'; note.textContent = ''; if (button) button.disabled = !!this.bookingSubmitting; return; }
    if (short > 0) {
      note.className = 'exp-booking-note exp-booking-note--warn';
      note.replaceChildren();
      const text = document.createElement('span'); text.textContent = fmt(x('shortBalance'), { b: Math.floor(balance), n: short });
      const add = document.createElement('button'); add.type = 'button'; add.className = 'shop-btn shop-btn--gold'; add.textContent = x('topUp');
      add.onclick = () => this.openWalletModal();
      note.append(text, add);
    } else {
      note.className = 'exp-booking-note exp-booking-note--ok';
      note.textContent = fmt(x('enoughBalance'), { b: Math.floor(balance) });
    }
    if (button) button.disabled = !!this.bookingSubmitting || short > 0;
  },

  /** Disables time slots that already passed or that overlap another appointment this astrologer has. */
  async refreshBookingSlots() {
    const slotSelect = document.getElementById('booking-slot-select');
    const astrologerId = document.getElementById('booking-astrologer-select')?.value;
    const date = document.getElementById('booking-date-input')?.value;
    const exp = this._exp;
    if (!slotSelect || !exp) return;
    const duration = parseInt(document.getElementById('booking-duration-select')?.value || 30);
    let busy = [];
    if (astrologerId) {
      const cache = this._busyCache || (this._busyCache = {});
      if (!cache[astrologerId] || Date.now() - cache[astrologerId].at > 15000) {
        try { cache[astrologerId] = { at: Date.now(), busy: await API.getBusySlots(astrologerId) }; } catch (e) { cache[astrologerId] = { at: Date.now(), busy: [] }; }
      }
      busy = cache[astrologerId].busy.map(b => [new Date(b.start).getTime(), new Date(b.end).getTime()]);
    }
    let firstFree = null;
    [...slotSelect.options].forEach(option => {
      const m = option.value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      option.dataset.label = option.dataset.label || option.textContent;
      option.textContent = option.dataset.label;
      let reason = '';
      if (m && date) {
        const hour = Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0);
        const start = new Date(`${date}T${String(hour).padStart(2, '0')}:${m[2]}:00+05:30`).getTime();
        const end = start + duration * 60000;
        if (start <= Date.now()) reason = exp.x('slotPast');
        else if (busy.some(([s, e]) => start < e && s < end)) reason = exp.x('slotTaken');
      }
      option.disabled = !!reason;
      if (reason) option.textContent = `${option.dataset.label} (${reason})`;
      else if (!firstFree) firstFree = option;
    });
    if (slotSelect.selectedOptions[0]?.disabled && firstFree) slotSelect.value = firstFree.value;
    const note = document.getElementById('booking-slot-note');
    if (note) { note.hidden = !!firstFree; note.textContent = firstFree ? '' : exp.x('noSlots'); }
    const button = document.getElementById('btn-submit-appointment');
    if (button && !firstFree) button.disabled = true;
  },

  async handleBookingSubmit(event) {
    if (event) event.preventDefault();
    if (!this.currentUser) { this.openAuthModal('login'); return; }
    if (this.bookingSubmitting) return;
    this.bookingSubmitting = true;
    const btn = document.getElementById('btn-submit-appointment');
    if (btn) btn.disabled = true;

    try {
      const astrologerId = document.getElementById('booking-astrologer-select')?.value;
      const consultationType = document.getElementById('booking-mode-select')?.value || 'call';
      const scheduledDate = document.getElementById('booking-date-input')?.value;
      const slot = document.getElementById('booking-slot-select')?.value;
      const duration = parseInt(document.getElementById('booking-duration-select')?.value || 30);
      const notes = document.getElementById('booking-notes-input')?.value;

      if (!astrologerId) {
        this.showToast('Please select a verified astrologer scholar!', 'warning');
        if (btn) btn.disabled = false;
        return;
      }

      const match = String(slot || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!scheduledDate || !match) throw new Error(window.I18n?.currentLang === 'hi' ? 'तारीख और समय चुनें।' : 'Choose a date and time.');
      const hour = Number(match[1]) % 12 + (match[3].toUpperCase() === 'PM' ? 12 : 0);
      const scheduledAt = `${scheduledDate}T${String(hour).padStart(2, '0')}:${match[2]}:00+05:30`;
      if (new Date(scheduledAt) <= new Date()) throw new Error(window.I18n?.currentLang === 'hi' ? 'भविष्य की तारीख और समय चुनें।' : 'Choose a future date and time.');
      const res = await API.createBooking({
        astrologer_id: astrologerId,
        mode: consultationType,
        scheduled_at: scheduledAt,
        user_name: this.currentUser.full_name || this.currentUser.email,
        user_phone: this.currentUser.phone || null,
        duration_minutes: duration,
        notes
      });

      this._busyCache = {};
      this.showToast(`Appointment confirmed with ${res.astrologer_name}! 🗓️`, 'success');
      await this.refreshWalletUI();
      await this.loadBookingsUI();
      window.dispatchEvent(new CustomEvent('astro:ordersChanged'));
      document.getElementById('form-book-appointment')?.reset();
      this.populateBookingAstrologers();
    } catch (err) {
      this.showToast(`Booking failed: ${err.message}`, 'error');
    } finally {
      this.bookingSubmitting = false;
      if (btn) btn.disabled = false;
    }
  },

  async loadBookingsUI() {
    const list = document.getElementById('wallet-bookings-list');
    if (!list) return;
    const { x, skeleton, errorState, statusText } = await import('/src/utils/experience.js');
    const { esc, money } = await import('/src/utils/shop.js');
    const request = this.bookingsRequest = (this.bookingsRequest || 0) + 1;
    list.innerHTML = skeleton(2);
    try {
      const bookings = await API.getBookings();
      if (request !== this.bookingsRequest) return;
      if (!bookings?.length) { list.innerHTML = '<div class="exp-empty"><h3>' + esc(x('empty')) + '</h3><p>' + esc(x('appointmentsIntro')) + '</p></div>'; return; }
      list.innerHTML = bookings.map(b => '<article class="appointment-record"><div><h4>' + esc(b.astrologer_name) + '</h4><span class="shop-pill">' + esc(statusText(b.status)) + '</span><p>' + esc(new Date(b.scheduled_at).toLocaleString(window.I18n?.currentLang === 'hi' ? 'hi-IN' : 'en-IN')) + '</p><small>' + esc(b.duration_minutes) + ' min &middot; ' + esc(x('mode' + b.mode)) + '</small></div><div><strong>' + money(b.total_amount) + '</strong>' + (b.can_cancel ? '<button type="button" class="shop-btn shop-btn--line" data-cancel-appointment="' + esc(b.id) + '">' + esc(x('cancelAppointment')) + '</button>' : '') + '</div></article>').join('');
      list.querySelectorAll('[data-cancel-appointment]').forEach(button => button.onclick = () => this.cancelBooking(button.dataset.cancelAppointment));
    } catch (err) {
      if (request !== this.bookingsRequest) return;
      list.innerHTML = errorState(); list.querySelector('[data-exp-retry]').onclick = () => this.loadBookingsUI();
    }
  },

  async cancelBooking(bookingId) {
    if (!confirm(window.I18n?.currentLang === 'hi' ? 'क्या आप यह अपॉइंटमेंट रद्द करना चाहते हैं? शुल्क आपके वॉलेट में लौटा दिया जाएगा।' : 'Are you sure you want to cancel this appointment? The fee will be refunded to your wallet balance.')) return;

    try {
      const res = await API.cancelBooking(bookingId);
      this.showToast(res.message || 'Appointment cancelled and fee refunded to wallet! 💰', 'success');
      this._busyCache = {};
      await this.refreshWalletUI();
      await this.loadBookingsUI();
    } catch (err) {
      this.showToast(`Cancellation failed: ${err.message}`, 'error');
    }
    window.dispatchEvent(new CustomEvent('astro:ordersChanged'));
  },

  // =========================================================================
  // Multilingual Jyotish Glossary Data & Renderer
  // =========================================================================
  glossaryData: [
    { term: 'Lagna (लग्न)', meaning: 'Ascendant / Rising Sign', category: 'Fundamentals', desc: 'The sign of the zodiac rising on the eastern horizon at the exact moment of birth. It defines the First House and sets the matrix for all 12 bhavas in the natal chart.' },
    { term: 'Rashi (राशि)', meaning: 'Zodiac Sign / Moon Sign', category: 'Fundamentals', desc: 'The 12 divisions of 30 degrees each across the 360-degree zodiac. In Vedic astrology, Janma Rashi refers specifically to the Moon sign representing the emotional mind and consciousness.' },
    { term: 'Nakshatra (नक्षत्र)', meaning: 'Lunar Mansion', category: 'Constellations', desc: '27 constellations of 13°20\' each. Each nakshatra is divided into 4 padas (quarters) of 3°20\', governed by a planetary ruler and Vedic deity.' },
    { term: 'Dasha (दशा)', meaning: 'Planetary Period Cycles', category: 'Timing', desc: 'The sequential ripening of karmic seeds. The classical 120-year Vimshottari Dasha system allocates specific years to each of the 9 Grahas based on the Moon\'s birth nakshatra.' },
    { term: 'Navamsha (नवांश / D9)', meaning: 'Ninth Harmonic Divisional Chart', category: 'Divisional Charts', desc: 'The D9 chart obtained by dividing each sign into 9 parts. Essential for assessing marriage, marital harmony, spiritual destiny, and true planetary strength in later life.' },
    { term: 'Ashtakoot (अष्टकूट)', meaning: 'Eightfold Compatibility System', category: 'Kundali Milan', desc: 'The 36 Guna matchmaking system analyzing Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi between groom and bride Moon signs.' },
    { term: 'Mangal Dosha (मंगल दोष)', meaning: 'Kuja / Bhauma Dosha', category: 'Doshas', desc: 'Affliction occurring when Mars occupies houses 1, 4, 7, 8, or 12. Classical texts declare 6 major Parihars (cancellations) such as Mars in its own sign or aspect of Jupiter.' },
    { term: 'Sade Sati (साढ़े साती)', meaning: '7.5-Year Saturn Transit Cycle', category: 'Transits', desc: 'Saturn\'s transit through the 12th, 1st, and 2nd houses from the natal Moon. A transformative period fostering discipline, humility, and spiritual purification.' },
    { term: 'Kaal Sarp Yoga (कालसर्प योग)', meaning: 'Serpent Planetary Axis', category: 'Doshas', desc: 'Formed when all 7 traditional planets are hemmed between the nodal axis of Rahu and Ketu across 12 classical variations (e.g. Anant, Kulik, Vasuki, Shankhpal).' },
    { term: 'Atmakaraka (आत्मकारक)', meaning: 'Soul Significator (Jaimini)', category: 'Jaimini System', desc: 'The planet having the highest longitude in any sign (excluding Rahu/Ketu). Represents the soul\'s primary lessons, spiritual evolution, and king of the horoscope.' },
    { term: 'Choghadiya (चौघड़िया)', meaning: 'Vedic 8-Fold Time Slots', category: 'Muhurat', desc: 'Division of day and night into 8 parts of approximately 1.5 hours each: Amrit, Shubh, Labh (auspicious), Char (neutral), Rog, Kaal, Udveg (inauspicious).' },
    { term: 'Hora (होरा)', meaning: 'Planetary Hourly Ruler', category: 'Muhurat', desc: 'Each hour of the day from sunrise to sunrise is ruled by one of the seven physical planets in cyclic order: Sun, Venus, Mercury, Moon, Saturn, Jupiter, Mars.' },
    { term: 'Bhava (भाव)', meaning: 'Houses of the Birth Chart', category: 'Fundamentals', desc: '12 houses governing the four Purusharthas: Dharma (1, 5, 9), Artha (2, 6, 10), Kama (3, 7, 11), and Moksha (4, 8, 12).' },
    { term: 'Yoga (शुभ योग)', meaning: 'Planetary Combinations', category: 'Yogas', desc: 'Auspicious alignments of planetary lords, such as Gajakesari Yoga (Jupiter-Moon angle), Budhaditya Yoga (Sun-Mercury conjunction), and Pancha Mahapurusha Yogas.' }
  ],

  renderGlossary(filterText = null) {
    const grid = document.getElementById('glossary-terms-grid');
    if (!grid) return;

    let items = this.glossaryData;
    if (filterText) {
      const q = filterText.toLowerCase();
      items = items.filter(t => t.term.toLowerCase().includes(q) || t.meaning.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q));
    }

    grid.innerHTML = items.map(t => `
      <div class="glossary-term-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <h4 style="margin: 0; color: #1E1B4B; font-size: 1rem;">${t.term}</h4>
          <span class="shortcut-badge" style="background: #f1ebf5; color: #1e0b44; font-size: 0.7rem;">${t.category}</span>
        </div>
        <div style="font-size: 0.8rem; font-weight: 600; color: #4a1b9a; margin-bottom: 0.4rem;">
          ${t.meaning}
        </div>
        <p style="font-size: 0.82rem; color: #475569; margin: 0; line-height: 1.5;">
          ${t.desc}
        </p>
      </div>
    `).join('');
  },

  filterGlossary(text) {
    this.renderGlossary(text);
  },

  playAstrologerVoice(name) {
    if (window.ChatController && window.ChatController.playTempleChime) {
      window.ChatController.playTempleChime();
    }
    const cleanName = name || 'ज्योतिषाचार्य';
    if (this.showToast) {
      this.showToast(`🔊 ${cleanName} का स्वर परिचय: "प्रणाम! आपके जीवन व कुंडली के सटीक मार्गदर्शन के लिए मैं उपस्थित हूँ।"`, 'info');
    }
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(`प्रणाम! मैं ${cleanName} हूँ। आपके जीवन, करियर और विवाह के सटीक वैदिक मार्गदर्शन के लिए उपस्थित हूँ।`);
        msg.lang = 'hi-IN';
        msg.rate = 0.95;
        window.speechSynthesis.speak(msg);
      }
    } catch (e) {
      console.warn('Speech synthesis preview error:', e);
    }
  },

  openAstrologerProfile(slug) {
    if (!slug) return;
    const cleanSlug = encodeURIComponent(String(slug).trim());
    if (window.Router) {
      window.Router.navigate(`/astrologers/${cleanSlug}`);
    } else {
      window.location.href = `/astrologers/${cleanSlug}`;
    }
  },

  startConsultationWith(slug) {
    if (!slug) return;
    if (window.Router) {
      window.Router.switchView('view-consultation');
      window.Router.updateNavbarActive('nav-link-consultation');
    }
    if (window.ChatController && window.ChatController.startConsultationWith) {
      return window.ChatController.startConsultationWith(slug);
    } else if (window.Router) {
      window.Router.navigate(`/consultation/${slug}`);
    } else {
      window.location.href = `/consultation/${slug}`;
    }
  },

  // Wait for the selected astrologer's session to load; a fixed delay let the call open with the previous one.
  async startCallWith(slug) {
    if (!slug) return;
    if (window.CallingAgentService?.isCalling) window.CallingAgentService.endCall({ silent: true });
    await this.startConsultationWith(slug);
    if (window.ChatController && window.ChatController.startAudioCall) {
      window.ChatController.startAudioCall();
    }
  },

  loadMandirSevaPage() {
    if (window.MandirSevaPageComponent && typeof window.MandirSevaPageComponent.loadTemples === 'function') {
      window.MandirSevaPageComponent.loadTemples();
    }
  },

  loadAstroMallPage() {
    if (window.AstroMallPageComponent && typeof window.AstroMallPageComponent.loadProducts === 'function') {
      window.AstroMallPageComponent.loadProducts();
    }
  },

  toggleVedicAmbience() {
    if (window.CallingAgentService && typeof window.CallingAgentService.toggleVedicAmbience === 'function') {
      return window.CallingAgentService.toggleVedicAmbience();
    }
  }
};

if (typeof window !== 'undefined') {
  window.App = App;
}
if (typeof globalThis !== 'undefined') {
  globalThis.App = App;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = App;
}
