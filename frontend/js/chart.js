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
        <text x="${pt.x}" y="${pt.y - 10}" fill="#fbbf24" font-size="${hFontSize}" font-weight="700" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">H${h}</text>
        <text x="${pt.x}" y="${pt.y + 6}" fill="#f8fafc" font-size="${pFontSize}" font-weight="600" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${text}</text>
      `;
    }

    return `
      <svg class="${isCompact ? 'kundali-svg-compact' : 'kundali-svg'}" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
        <!-- Outer Box -->
        <rect x="8" y="8" width="384" height="384" fill="rgba(15, 12, 28, 0.6)" stroke="#8b5cf6" stroke-width="2" rx="4" />
        
        <!-- Diagonals -->
        <line x1="8" y1="8" x2="392" y2="392" stroke="#6d28d9" stroke-width="1.5" />
        <line x1="392" y1="8" x2="8" y2="392" stroke="#6d28d9" stroke-width="1.5" />
        
        <!-- Central Inner Diamond -->
        <polygon points="200,8 392,200 200,392 8,200" fill="rgba(124, 58, 237, 0.08)" stroke="#8b5cf6" stroke-width="1.5" />
        
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
  }
};
