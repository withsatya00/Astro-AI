/**
 * Report Generation Controller.
 */

const ReportsController = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    const quickBtn = document.getElementById('btn-quick-generate-report');
    if (quickBtn) {
      quickBtn.addEventListener('click', () => this.generateQuickReport());
    }
  },

  async generateQuickReport() {
    const chart = App.currentChart;
    const statusDiv = document.getElementById('quick-report-status');

    if (!chart || !chart.id) {
      App.showToast('Please enter or select a birth chart first!', 'warning');
      App.openBirthModal();
      return;
    }

    if (statusDiv) {
      statusDiv.innerHTML = '<span class="status-pill" style="font-size: 0.72rem; color: var(--gold-light);">⏳ Compiling Swiss Ephemeris tables & PDF...</span>';
    }

    try {
      const res = await API.generateReport({
        chart_id: chart.id,
        report_type: 'comprehensive_kundali',
        language: 'en'
      });

      if (statusDiv) {
        statusDiv.innerHTML = `
          <a href="${res.download_url}" target="_blank" class="btn-tool active-profile" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            📥 Click to Download PDF (${chart.name})
          </a>
        `;
      }

      App.showToast('Kundali PDF Report compiled successfully! 📑', 'success');
      // Automatically open in new tab
      window.open(res.download_url, '_blank');
    } catch (err) {
      if (statusDiv) {
        statusDiv.innerHTML = `<span style="font-size: 0.72rem; color: var(--danger);">Failed: ${err.message}</span>`;
      }
      App.showToast(`Report generation failed: ${err.message}`, 'error');
    }
  }
};
