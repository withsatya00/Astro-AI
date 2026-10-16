/**
 * Birth Chart Visualization Engine (North Indian Diamond Kundali + Data Cards).
 */

const ChartViewer = {
  // Planet abbreviation mapping
  planetAbbr: {
    'Sun': 'Su', 'Moon': 'Mo', 'Mars': 'Ma', 'Mercury': 'Me',
    'Jupiter': 'Ju', 'Venus': 'Ve', 'Saturn': 'Sa', 'Rahu': 'Ra',
    'Ketu': 'Ke', 'Uranus': 'Ur', 'Neptune': 'Ne', 'Pluto': 'Pl'
  },

  renderNorthIndianSVG(chartData, isCompact = false) {
    if (!chartData) {
      return '<p class="text-muted" style="text-align: center; font-size: 0.8rem;">No chart data.</p>';
    }

    const planets = chartData.planets || [];
    const ascSign = chartData.ascendant_sign || 'Aries';
    
    // Group planets by house (1-12)
    const housePlanets = {};
    for (let i = 1; i <= 12; i++) housePlanets[i] = [];
    
    planets.forEach(p => {
      const h = p.house || 1;
      const abbr = this.planetAbbr[p.name] || p.name.substring(0, 2);
      const retro = p.is_retrograde ? '(R)' : '';
      if (housePlanets[h]) {
        housePlanets[h].push(`${abbr}${retro}`);
      }
    });

    // Approximate label coordinates for the 12 houses in a 400x400 North Indian diamond chart
    const houseCoords = {
      1:  { x: 200, y: 155 },  // Lagna (top center diamond)
      2:  { x: 100, y: 75 },   // Top-left triangle
      3:  { x: 50,  y: 125 },  // Upper-left corner
      4:  { x: 125, y: 200 },  // Left diamond
      5:  { x: 50,  y: 280 },  // Lower-left corner
      6:  { x: 100, y: 330 },  // Bottom-left triangle
      7:  { x: 200, y: 255 },  // Bottom center diamond
      8:  { x: 300, y: 330 },  // Bottom-right triangle
      9:  { x: 350, y: 280 },  // Lower-right corner
      10: { x: 275, y: 200 },  // Right diamond
      11: { x: 350, y: 125 },  // Upper-right corner
      12: { x: 300, y: 75 }    // Top-right triangle
    };

    let planetTexts = '';
    const hFontSize = isCompact ? "9" : "10";
    const pFontSize = isCompact ? "10" : "11";

    for (let h = 1; h <= 12; h++) {
      const pt = houseCoords[h];
      const items = housePlanets[h];
      const text = items.length > 0 ? items.join(' ') : '';
      planetTexts += `
        <text x="${pt.x}" y="${pt.y - 10}" fill="#d97706" font-size="${hFontSize}" font-weight="700" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">H${h}</text>
        <text x="${pt.x}" y="${pt.y + 6}" fill="#1f2937" font-size="${pFontSize}" font-weight="600" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${text}</text>
      `;
    }

    return `
      <svg class="${isCompact ? 'kundali-svg-compact' : 'kundali-svg'}" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer Box -->
        <rect x="8" y="8" width="384" height="384" fill="#ffffff" stroke="#c4b5fd" stroke-width="1.5" rx="6" />
        
        <!-- Diagonals -->
        <line x1="8" y1="8" x2="392" y2="392" stroke="#ddd6fe" stroke-width="1.2" />
        <line x1="392" y1="8" x2="8" y2="392" stroke="#ddd6fe" stroke-width="1.2" />
        
        <!-- Central Inner Diamond -->
        <polygon points="200,8 392,200 200,392 8,200" fill="#f5f3ff" stroke="#a78bfa" stroke-width="1.5" />
        
        <!-- House and Planet Text Labels -->
        ${planetTexts}
      </svg>
    `;
  },

  renderPlanetaryTable(planets) {
    if (!planets || !planets.length) return '<p class="text-muted">No planetary data available.</p>';
    
    let rows = planets.map(p => {
      const retroBadge = p.is_retrograde ? '<span class="shortcut-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">Vakri (R)</span>' : '<span class="shortcut-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">Direct</span>';
      return `
        <tr>
          <td><strong>${p.name}</strong></td>
          <td>${p.sign}</td>
          <td>${p.degree_in_sign.toFixed(2)}°</td>
          <td>House ${p.house}</td>
          <td>${p.nakshatra}</td>
          <td>Pada ${p.pada}</td>
          <td>${retroBadge}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="overflow-x: auto;">
        <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
              <th style="padding: 0.5rem; text-align: left;">Planet</th>
              <th style="padding: 0.5rem; text-align: left;">Sign</th>
              <th style="padding: 0.5rem; text-align: left;">Degree</th>
              <th style="padding: 0.5rem; text-align: left;">House</th>
              <th style="padding: 0.5rem; text-align: left;">Nakshatra</th>
              <th style="padding: 0.5rem; text-align: left;">Pada</th>
              <th style="padding: 0.5rem; text-align: left;">Motion</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  },

  // Download high-resolution Lagna Kundli PNG image
  downloadKundliPNG(svgElementOrSelector, profileName = 'Janam_Kundli') {
    let svgElem = null;
    if (typeof svgElementOrSelector === 'string') {
      svgElem = document.querySelector(svgElementOrSelector);
    } else if (svgElementOrSelector instanceof SVGElement) {
      svgElem = svgElementOrSelector;
    }

    if (!svgElem) {
      // Fallback: search in context panel
      svgElem = document.querySelector('#context-kundali-svg svg') || document.querySelector('.kundali-svg');
    }

    if (!svgElem) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Please calculate your birth chart first to download Kundli image!', 'warning');
      }
      return;
    }

    try {
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElem);

      // Ensure proper namespaces
      if (!svgString.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 900;
      canvas.width = size;
      canvas.height = size + 160;

      // Draw premium dark/celestial card background
      const grad = ctx.createLinearGradient(0, 0, size, size);
      grad.addColorStop(0, '#0f0c20');
      grad.addColorStop(1, '#1e163b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gold decorative border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

      // Card Header
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ AstroAI - Lagna Kundali (D1) ✨', size / 2, 70);

      const activeName = (window.App && window.App.currentChart && window.App.currentChart.name) || profileName;
      const cd = (window.App && window.App.currentChart && window.App.currentChart.chart_data) || {};
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${activeName} • Lagna: ${cd.ascendant_sign || 'Aries'} • Rashi: ${cd.moon_sign || 'Taurus'}`, size / 2, 110);

      // Draw SVG onto canvas
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Draw centered Kundli diagram
        const chartW = size - 120;
        const chartH = chartW;
        const chartX = 60;
        const chartY = 140;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(chartX, chartY, chartW, chartH);
        ctx.drawImage(img, chartX, chartY, chartW, chartH);

        // Footer branding
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Computed via Swiss Ephemeris NASA JPL Astronomical Calculations • AstroAI Platform', size / 2, canvas.height - 35);

        URL.revokeObjectURL(blobURL);

        // Trigger Instant Download
        const link = document.createElement('a');
        link.download = `${activeName.replace(/\s+/g, '_')}_Lagna_Kundli.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        if (window.App && window.App.showToast) {
          window.App.showToast('Kundli PNG downloaded successfully! 🪐', 'success');
        }
      };

      img.src = blobURL;
    } catch (err) {
      console.error('Error generating Kundli PNG:', err);
      if (window.App && window.App.showToast) {
        window.App.showToast('Could not export Kundli image: ' + err.message, 'error');
      }
    }
  },

  // Share Janam Kundli summary on WhatsApp
  shareKundliWhatsApp(chart = null) {
    const c = chart || (window.App && window.App.currentChart);
    if (!c) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Please calculate or select a birth profile first!', 'warning');
      }
      return;
    }

    const cd = c.chart_data || {};
    const text = 
`🔮 *AstroAI - Authentic Janam Kundli Summary* 🔮
👤 *Name:* ${c.name}
📅 *Date of Birth:* ${c.date_of_birth} (${c.time_of_birth || '12:00'})
📍 *Birthplace:* ${c.city || 'Birth City'}, ${c.country || 'India'}
━━━━━━━━━━━━━━━━━━
🪐 *Lagna (Ascendant):* ${cd.ascendant_sign || '-'} (${cd.ascendant_nakshatra || ''})
🌙 *Chandra Rashi (Moon):* ${cd.moon_sign || '-'} (${cd.moon_nakshatra || ''})
☀️ *Surya Rashi (Sun):* ${cd.sun_sign || '-'}
⚡ *Ayanamsa:* ${cd.ayanamsa || 'Lahiri'} (NASA Swiss Ephemeris)
━━━━━━━━━━━━━━━━━━
✨ Consult personal AI Astrologer on AstroAI:
https://astrotalk.ai`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  },

  // Share Kundali Milan report on WhatsApp
  shareMilanWhatsApp(milanData) {
    if (!milanData) return;
    const text = 
`💍 *AstroAI - Authentic Kundali Milan Report* 💍
🤵 *Groom (वर):* ${milanData.boy_name}
👰 *Bride (वधू):* ${milanData.girl_name}
━━━━━━━━━━━━━━━━━━
⭐ *Gun Milan Score:* ${milanData.total_score} / 36.0 Gunas (${milanData.percentage}%)
✅ *Verdict:* ${milanData.verdict}
🛡️ *Manglik Status:* ${milanData.manglik_compatibility?.note || 'Checked'}
💬 *Recommendation:* ${milanData.recommendation}
━━━━━━━━━━━━━━━━━━
✨ Check complete 8 Kootas & Kundali Milan on AstroAI:
https://astrotalk.ai`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  },

  // Open and render Classical Grounded Report (Chart-to-RAG Fusion)
  async openGroundedReportModal(chart = null) {
    const c = chart || (window.App && window.App.currentChart);
    if (!c) {
      if (window.App && window.App.showToast) {
        window.App.showToast('Please enter or select a birth profile first!', 'warning');
      }
      if (window.App && window.App.openBirthModal) {
        window.App.openBirthModal();
      }
      return;
    }

    const modal = document.getElementById('modal-grounded-report');
    if (!modal) return;
    modal.classList.add('active');

    const container = document.getElementById('grounded-report-container');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1rem;">
          <div style="margin: 0 auto 1.25rem auto; width: 42px; height: 42px; border: 3.5px solid #FEF3C7; border-top-color: #D97706; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <h4 style="font-size: 1.05rem; color: #1E1B4B; margin-bottom: 0.35rem;">Computing Precision Astrological Alignments...</h4>
          <p class="text-muted" style="font-size: 0.84rem;">Scanning 287 Classical Chunks (BPHS, Phaladeepika, Saravali) for matching Shastriya Yogas.</p>
        </div>
      `;
    }

    try {
      const lang = (window.App && window.App.currentLanguage) || 'en';
      let reportData;
      if (c.id && c.id !== 'temp') {
        reportData = await API.getGroundedReport(c.id, lang);
      } else {
        reportData = await API.generateGroundedReport({
          name: c.name,
          date_of_birth: c.date_of_birth,
          time_of_birth: c.time_of_birth || '12:00:00',
          is_time_approximate: c.is_time_approximate || false,
          latitude: c.latitude || 28.6139,
          longitude: c.longitude || 77.2090,
          timezone_offset: c.timezone_offset || 5.5,
          city: c.city || 'New Delhi',
          country: c.country || 'India',
          system: 'Vedic',
          ayanamsa: 'Lahiri'
        }, lang);
      }

      this.currentGroundedReport = reportData;
      this.renderGroundedReportHTML(reportData, c);
    } catch (err) {
      console.error('Error fetching grounded report:', err);
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #DC2626;">
            <p><strong>Failed to load Grounded Report:</strong> ${err.message}</p>
          </div>
        `;
      }
    }
  },

  renderGroundedReportHTML(report, chart) {
    const container = document.getElementById('grounded-report-container');
    if (!container || !report) return;

    const facts = report.astronomical_facts || {};
    const yogas = (report.detected_yogas_summary && report.detected_yogas_summary.yogas) || [];
    const kuja = (report.detected_yogas_summary && report.detected_yogas_summary.kuja_dosha) || {};
    const sadeSati = (report.detected_yogas_summary && report.detected_yogas_summary.sade_sati) || {};
    const dasha = (report.detected_yogas_summary && report.detected_yogas_summary.current_dasha) || {};
    const citations = report.citations || [];

    // Render Yogas Cards
    let yogasHtml = '';
    if (yogas.length > 0) {
      yogasHtml = yogas.map(y => `
        <div class="grounded-yoga-card">
          <div class="grounded-yoga-header">
            <span class="grounded-yoga-name">✨ ${y.yoga_name}</span>
            <span class="grounded-yoga-badge">${y.category || 'Yoga'}</span>
          </div>
          <div style="font-size: 0.72rem; color: #92400E; font-weight: 600; margin-bottom: 0.25rem;">
            Planets: ${y.planet || '-'} in House ${y.house || '-'} (${y.strength || 'High'} Strength)
          </div>
          <div class="grounded-yoga-desc">${y.description || ''}</div>
        </div>
      `).join('');
    } else {
      yogasHtml = `<p class="text-muted" style="font-size: 0.82rem;">Foundational planetary alignments without major standard Raja/Mahapurusha yogas.</p>`;
    }

    // Render Citations
    let citationsHtml = '';
    if (citations.length > 0) {
      citationsHtml = citations.map(c => `
        <div class="grounded-citation-card">
          <div class="grounded-citation-header">
            <span class="grounded-citation-source">📖 ${c.source_title}</span>
            <span class="grounded-citation-section">${c.section_title || 'General'}</span>
          </div>
          <div class="grounded-citation-text">${c.excerpt.substring(0, 320)}...</div>
        </div>
      `).join('');
    } else {
      citationsHtml = `<p class="text-muted" style="font-size: 0.82rem;">General classical knowledge applied.</p>`;
    }

    // Kuja Dosha string
    let kujaStr = 'No adverse Kuja Dosha detected from Lagna or Moon.';
    if (kuja.has_kuja_dosha) {
      const cancels = (kuja.cancellations && kuja.cancellations.length > 0) 
        ? `<br/><span style="color: #047857; font-weight: 600;">Classical Mitigation: ${kuja.cancellations.join(', ')}</span>`
        : '';
      kujaStr = `Mars situated in House ${kuja.mars_house} (${kuja.mars_sign}). Affliction Status: <strong>${kuja.affliction_level}</strong>${cancels}`;
    }

    // Sade Sati string
    let sadeSatiStr = sadeSati.is_active
      ? `<strong>${sadeSati.phase}</strong>: ${sadeSati.description}`
      : `Saturn currently in Pisces is in a supportive or neutral transit position relative to your Moon.`;

    container.innerHTML = `
      <!-- Hero Ribbon -->
      <div class="grounded-hero-card">
        <div class="grounded-hero-title">
          <span>${chart.name || 'Client'} - ${report.report_title || 'Janam Kundli Report'}</span>
          <span style="font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; border-radius: 999px;">NASA Swiss Ephemeris</span>
        </div>
        <div class="grounded-hero-facts">
          <div class="grounded-fact-chip">Lagna: <strong>${facts.ascendant_sign || '-'}</strong> (${facts.ascendant_nakshatra || ''} Pada ${facts.ascendant_pada || ''})</div>
          <div class="grounded-fact-chip">Moon (Rashi): <strong>${facts.moon_sign || '-'}</strong> (${facts.moon_nakshatra || ''} Pada ${facts.moon_pada || ''})</div>
          <div class="grounded-fact-chip">Sun Sign: <strong>${facts.sun_sign || '-'}</strong></div>
          <div class="grounded-fact-chip">Navamsha Lagna: <strong>${facts.navamsha_lagna || '-'}</strong></div>
          <div class="grounded-fact-chip">Ayanamsa: <strong>Lahiri</strong></div>
        </div>
      </div>

      <!-- Executive Summary Box -->
      <div class="grounded-summary-box">
        <div class="grounded-summary-title">🌟 Classical Synthesis Summary (शास्त्रीय सारांश)</div>
        <p class="grounded-summary-text">${report.executive_summary || ''}</p>
      </div>

      <!-- Detected Classical Yogas -->
      <div class="grounded-section-title">
        <span>👑</span> Detected Classical Yogas & Alignments (${yogas.length} Formations)
      </div>
      <div class="grounded-yogas-grid">
        ${yogasHtml}
      </div>

      <!-- Kuja Dosha & Shani Sade Sati -->
      <div class="grounded-section-title">
        <span>🛡️</span> Karmic & Planetary Transits Status
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: var(--radius-sm); padding: 0.85rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: #92400E; margin-bottom: 0.35rem;">🔥 Kuja Dosha (Manglik) Status</div>
          <div style="font-size: 0.8rem; color: #334155;">${kujaStr}</div>
        </div>
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: var(--radius-sm); padding: 0.85rem;">
          <div style="font-size: 0.82rem; font-weight: 700; color: #4338CA; margin-bottom: 0.35rem;">🪐 Shani Sade Sati / Dhaiya Status</div>
          <div style="font-size: 0.8rem; color: #334155;">${sadeSatiStr}</div>
        </div>
      </div>

      <!-- Active Vimshottari Mahadasha -->
      <div class="grounded-section-title">
        <span>⏳</span> Active Vimshottari Mahadasha
      </div>
      <div style="background: #F3E8FF; border: 1px solid #D8B4FE; border-radius: var(--radius-sm); padding: 0.85rem; margin-bottom: 1.25rem;">
        <div style="font-size: 0.85rem; font-weight: 700; color: #6B21A8; margin-bottom: 0.25rem;">
          Currently Running: ${dasha.active_planet || 'Planetary'} Mahadasha
        </div>
        <div style="font-size: 0.78rem; color: #581C87;">
          Period: ${dasha.start_date || '-'} to ${dasha.end_date || '-'} (${dasha.duration_years || '-'} Years)
        </div>
      </div>

      <!-- Classical Citations & Shastras -->
      <div class="grounded-section-title">
        <span>📚</span> Authentic Classical Citations (Retrieved from 287 Chunks)
      </div>
      <div class="grounded-citations-list">
        ${citationsHtml}
      </div>

      <!-- Authentic Upay & Gemstone Rules -->
      <div class="grounded-section-title">
        <span>🕉️</span> Authentic Vedic Remedies (शास्त्रीय उपाय एवं रत्न परामर्श)
      </div>
      <div style="background: #FFFDF5; border: 1.5px solid #FCD34D; border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
        <div style="font-size: 0.82rem; color: #78350F; line-height: 1.5;">
          <p style="margin: 0 0 0.5rem 0;">💎 <strong>Anukul Ratna Principle:</strong> Wear gemstones ONLY for functional benefics (Lords of 1st, 5th, or 9th houses). Never wear stones for Maraka (2, 7) or Dusthana (6, 8, 12) lords.</p>
          <p style="margin: 0 0 0.5rem 0;">📿 <strong>Vedic Stotram:</strong> Recite <em>Aditya Hridaya Stotram</em> at sunrise on Sundays for vitality; <em>Mahamrityunjaya Mantra</em> for health and Saturn pacification; <em>Vishnu Sahasranama</em> for overall harmony.</p>
          <p style="margin: 0;">🌾 <strong>Satvik Daan:</strong> Offer appropriate grains and charitable commodities directly to genuinely needy recipients with humility on days corresponding to challenged planets.</p>
        </div>
      </div>

      <div style="font-size: 0.72rem; color: #94A3B8; text-align: center; margin-top: 1rem;">
        ${report.disclaimer || ''}
      </div>
    `;
  }
};

