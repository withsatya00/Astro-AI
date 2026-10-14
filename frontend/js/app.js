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

    // Initialize sub-controllers
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

    // Sidebar toggles
    if (btnToggleSidebar && sidebar) {
      btnToggleSidebar.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
    if (btnCloseSidebar && sidebar) {
      btnCloseSidebar.addEventListener('click', () => {
        sidebar.classList.add('collapsed');
      });
    }

    // Context panel toggles
    if (btnToggleContext && contextPanel) {
      btnToggleContext.addEventListener('click', () => {
        contextPanel.classList.toggle('collapsed');
      });
    }
    if (btnCloseContext && contextPanel) {
      btnCloseContext.addEventListener('click', () => {
        contextPanel.classList.add('collapsed');
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

    // Shortcuts
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
  }
};
