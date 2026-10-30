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
          <a href="#" onclick="API.openPrivateFile('${res.download_url}'); return false;" class="btn-tool active-profile" style="width: 100%; justify-content: center; margin-top: 0.35rem;">
            📥 Click to Download PDF (${chart.name})
          </a>
        `;
      }

      App.showToast('Kundali PDF Report compiled successfully! 📑', 'success');
      // Automatically open in new tab
      API.openPrivateFile(res.download_url);
    } catch (err) {
      if (statusDiv) {
        statusDiv.innerHTML = `<span style="font-size: 0.72rem; color: var(--danger);">Failed: ${err.message}</span>`;
      }
      App.showToast(`Report generation failed: ${err.message}`, 'error');
    }
  },

  exportConsultationDocument() {
    const chart = (window.App && window.App.currentChart) || null;
    const history = (window.ChatController && window.ChatController.messages) || [];
    const astrologer = (window.ChatController && window.ChatController.currentAstrologer) || { name: "Acharya Shastri", title: "Vedic Astrologer" };

    if (!history || history.length === 0) {
      if (window.App) {
        window.App.showToast("No active consultation messages to export yet!", "warning");
      }
      return;
    }

    const clientName = chart ? chart.name : "Seeker";
    const dob = chart ? chart.date_of_birth : "N/A";
    const tob = chart ? chart.time_of_birth : "N/A";
    const city = chart ? chart.city || chart.birthplace || "N/A" : "N/A";
    const lagna = chart ? chart.ascendant_sign : "N/A";
    const moon = chart ? chart.moon_sign : "N/A";
    const nakshatra = chart ? chart.moon_nakshatra : "N/A";

    let chatHtml = "";
    history.forEach((m) => {
      const isUser = m.role === "user";
      const sender = isUser ? clientName : astrologer.name;
      const bg = isUser ? "#EFF6FF" : "#F8FAFC";
      const border = isUser ? "#BFDBFE" : "#E2E8F0";
      chatHtml += `
        <div style="margin-bottom: 1rem; padding: 0.75rem 1rem; background: ${bg}; border: 1px solid ${border}; border-radius: 8px;">
          <div style="font-weight: 700; font-size: 0.85rem; color: #1E293B; margin-bottom: 0.25rem;">${sender}:</div>
          <div style="font-size: 0.9rem; line-height: 1.5; color: #334155; white-space: pre-wrap;">${m.content || ''}</div>
        </div>
      `;
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      if (window.App) window.App.showToast("Please allow popups to export consultation document!", "warning");
      return;
    }

    const docContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>वैदिक ज्योतिष परामर्श विवरण (Jyotish Patrika) - ${clientName}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; padding: 2rem; color: #0F172A; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #E2E8F0; padding-bottom: 1rem; margin-bottom: 1.5rem; }
          .badge { display: inline-block; padding: 0.25rem 0.6rem; background: #FEF3C7; color: #92400E; font-weight: 700; border-radius: 999px; font-size: 0.75rem; }
          .details-table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; font-size: 0.85rem; }
          .details-table td { padding: 0.4rem 0.6rem; border: 1px solid #E2E8F0; }
          .details-table th { background: #F1F5F9; text-align: left; padding: 0.4rem 0.6rem; border: 1px solid #E2E8F0; }
          @media print {
            .no-print { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
          <button onclick="window.print()" style="padding: 0.5rem 1rem; background: #4a1b9a; color: #FFF; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">🖨️ Print / Save as PDF</button>
          <span style="font-size: 0.8rem; color: #64748B;">🕉️ प्रामाणिक पराशर वैदिक ज्योतिष पीठ</span>
        </div>
        <div class="header">
          <span class="badge">🕉️ प्रामाणिक वैदिक ज्योतिष परामर्श पत्रिका</span>
          <h1 style="margin: 0.5rem 0 0.25rem; font-size: 1.5rem; color: #1E1B4B;">वैदिक ज्योतिष परामर्श विवरण (Consultation Patrika)</h1>
          <p style="margin: 0; font-size: 0.85rem; color: #64748B;">परामर्शदाता ज्योतिषाचार्य: <strong>${astrologer.name}</strong> • महर्षि पराशर वैदिक पद्धति</p>
        </div>

        <table class="details-table">
          <tr>
            <th>Seeker Name / नाम</th>
            <td><strong>${clientName}</strong></td>
            <th>Date of Birth / जन्म तिथि</th>
            <td>${dob}</td>
          </tr>
          <tr>
            <th>Time of Birth / जन्म समय</th>
            <td>${tob}</td>
            <th>Birth Location / जन्म स्थान</th>
            <td>${city}</td>
          </tr>
          <tr>
            <th>Ascendant (Lagna)</th>
            <td><strong style="color: #4a1b9a;">${lagna}</strong></td>
            <th>Moon Sign (Rashi)</th>
            <td><strong style="color: #0284C7;">${moon} (${nakshatra})</strong></td>
          </tr>
        </table>

        <h3 style="font-size: 1.1rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.4rem; color: #1E293B;">Dialogue & Guidance Transcript</h3>
        ${chatHtml}

        <div style="margin-top: 2rem; border-top: 1px dashed #CBD5E1; padding-top: 1rem; text-align: center; font-size: 0.75rem; color: #94A3B8;">
          यह ज्योतिषीय परामर्श महर्षि पराशर होरा शास्त्र एवं प्रामाणिक वैदिक पंचांग गणना पर आधारित है • Astro Jyotish
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docContent);
    printWindow.document.close();
    if (window.App) {
      window.App.showToast("Consultation Patrika opened! Click 'Print / Save as PDF' to save.", "success");
    }
  }
};

// Expose globally: app.js checks window.ReportsController before wiring the grounded-report PDF button.
window.ReportsController = ReportsController;

