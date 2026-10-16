/**
 * AstroAI Agent Main Application Orchestrator.
 * AstroTalk-Inspired Chat-First Interface Controller.
 */

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

const App = {
  currentChart: null,
  agentToolsList: [],

  async init() {
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


    // Initial data fetch
    await this.refreshTelemetry();
    await this.loadSavedProfiles();
    await this.loadAgentTools();
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

    // Auto-collapse panels on mobile initial load so chat is fully visible
    if (window.innerWidth <= 900) {
      closeAllDrawers();
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

    // Context panel toggles
    if (btnToggleContext && contextPanel) {
      btnToggleContext.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const isCollapsed = contextPanel.classList.contains('collapsed');
        if (isCollapsed) {
          contextPanel.classList.remove('collapsed');
          if (window.innerWidth <= 900) {
            if (sidebar) sidebar.classList.add('collapsed');
            if (drawerBackdrop) drawerBackdrop.classList.add('active');
          }
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

    // Astrologer Openers
    [shortcutAstrologer, topbarAstrologer].forEach(btn => {
      if (btn) btn.addEventListener('click', () => ChatController.openAstrologerModal());
    });

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
          const text = `📜 *AstroAI - Shastriya Grounded Report* 📜\n👑 *Yogas:* ${yogasStr}\n⭐ *Summary:* ${r.executive_summary}\n✨ Check on AstroAI: https://astrotalk.ai`;
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
        ReportsController.generateQuickReport();
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
          text.innerText = 'Demo Mode (Offline)';
        } else {
          dot.className = 'status-dot';
          text.innerText = 'Live Gemini AI';
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
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      });
    });

    // Close on overlay backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
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
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  },

  openBirthModal() {
    this.openModal('modal-birth-details');
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
        this.updateActiveProfileUI(res);
        this.closeModal('modal-birth-details');
        this.showToast(`Birth chart calculated for ${res.name}! 🪐`, 'success');
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
    if (dashaBox && cd.dashas && cd.dashas.length > 0) {
      const d = cd.dashas[0];
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
  },

  async loadSavedProfiles() {
    const list = document.getElementById('profiles-list');
    if (!list) return;

    try {
      const charts = await API.getRecentCharts();
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
    } catch (err) {
      console.warn('Could not load profiles:', err);
    }
  },

  async selectChart(chartId, notify = true) {
    try {
      const chart = await API.getChartById(chartId);
      this.currentChart = chart;
      this.updateActiveProfileUI(chart);
      this.loadSavedProfiles();

      // If intake form is on screen, populate it
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
  // AI Agent Console Modal
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
              <span class="shortcut-badge" style="background: rgba(124, 58, 237, 0.2); color: #c4b5fd;">LATENCY: ${res.duration_ms}ms</span>
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
      if (calcBtn) {
        calcBtn.disabled = true;
        calcBtn.innerHTML = '<span>⏳</span> <span>Calculating 36 Gunas with Swiss Ephemeris...</span>';
      }

      const payload = {
        boy_name: document.getElementById('milan-boy-name').value,
        boy_dob: document.getElementById('milan-boy-dob').value,
        boy_tob: document.getElementById('milan-boy-tob').value || '12:00:00',
        boy_lat: parseFloat(document.getElementById('milan-boy-lat').value) || 28.6139,
        boy_lon: parseFloat(document.getElementById('milan-boy-lon').value) || 77.2090,
        boy_tz: parseFloat(document.getElementById('milan-boy-tz').value) || 5.5,
        boy_city: document.getElementById('milan-boy-city').value || 'New Delhi',
        boy_country: document.getElementById('milan-boy-country').value || 'India',

        girl_name: document.getElementById('milan-girl-name').value,
        girl_dob: document.getElementById('milan-girl-dob').value,
        girl_tob: document.getElementById('milan-girl-tob').value || '12:00:00',
        girl_lat: parseFloat(document.getElementById('milan-girl-lat').value) || 19.0760,
        girl_lon: parseFloat(document.getElementById('milan-girl-lon').value) || 72.8777,
        girl_tz: parseFloat(document.getElementById('milan-girl-tz').value) || 5.5,
        girl_city: document.getElementById('milan-girl-city').value || 'Mumbai',
        girl_country: document.getElementById('milan-girl-country').value || 'India',
        system: 'Vedic',
        ayanamsa: 'Lahiri'
      };

      try {
        const result = await API.calculateMilan(payload);
        this.lastMilanData = result;
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
      badgeEl.style.color = isSadeSati ? '#78350F' : (isDhaiya ? '#6B21A8' : '#166534');
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
  }
};
