const path = require('path');
const sharp = require('sharp');

const svg = `
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1800 720' width='1800' height='720'>
  <defs>
    <radialGradient id='space' cx='80%' cy='45%' r='80%'>
      <stop offset='0%' stop-color='#4A0A1C'/>
      <stop offset='40%' stop-color='#2B040F'/>
      <stop offset='70%' stop-color='#1D030A'/>
      <stop offset='100%' stop-color='#100105'/>
    </radialGradient>
    <radialGradient id='goldGlow' cx='50%' cy='50%' r='50%'>
      <stop offset='0%' stop-color='#D9A441' stop-opacity='0.45'/>
      <stop offset='60%' stop-color='#D9A441' stop-opacity='0.1'/>
      <stop offset='100%' stop-color='#D9A441' stop-opacity='0'/>
    </radialGradient>
    <linearGradient id='vignette' x1='0%' y1='0%' x2='100%' y2='0%'>
      <stop offset='0%' stop-color='#120206' stop-opacity='0.98'/>
      <stop offset='40%' stop-color='#120206' stop-opacity='0.85'/>
      <stop offset='65%' stop-color='#120206' stop-opacity='0.3'/>
      <stop offset='100%' stop-color='#120206' stop-opacity='0'/>
    </linearGradient>
  </defs>

  <rect width='1800' height='720' fill='url(#space)'/>
  <circle cx='1350' cy='360' r='380' fill='url(#goldGlow)'/>

  <!-- Celestial Zodiac Ring on Right -->
  <g transform='translate(1350, 360)' stroke='#D9A441' fill='none'>
    <circle r='320' stroke-width='2' stroke-opacity='0.85'/>
    <circle r='280' stroke-width='1.5' stroke-opacity='0.6'/>
    <circle r='180' stroke-width='1' stroke-dasharray='4,4' stroke-opacity='0.5'/>
    <circle r='120' stroke-width='1.5' stroke-opacity='0.75'/>
    <circle r='60' stroke-width='1' stroke-opacity='0.4'/>

    <!-- 12 Radiating Constellation Spokes -->
    ${[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => `
      <line x1='0' y1='0' x2='${320 * Math.cos(deg * Math.PI / 180)}' y2='${320 * Math.sin(deg * Math.PI / 180)}' stroke-opacity='0.35' stroke-width='1'/>
    `).join('')}

    <!-- 12 Vedic Rashi Glyphs & Constellations -->
    ${[
      { deg: 15, glyph: '♈' },
      { deg: 45, glyph: '♉' },
      { deg: 75, glyph: '♊' },
      { deg: 105, glyph: '♋' },
      { deg: 135, glyph: '♌' },
      { deg: 165, glyph: '♍' },
      { deg: 195, glyph: '♎' },
      { deg: 225, glyph: '♏' },
      { deg: 255, glyph: '♐' },
      { deg: 285, glyph: '♑' },
      { deg: 315, glyph: '♒' },
      { deg: 345, glyph: '♓' }
    ].map(r => {
      const rad = r.deg * Math.PI / 180;
      const x = 230 * Math.cos(rad);
      const y = 230 * Math.sin(rad);
      return `<g transform='translate(${x}, ${y})'>
        <circle r='20' fill='#24040B' fill-opacity='0.85' stroke='#D9A441' stroke-width='1.5' stroke-opacity='0.9'/>
        <text text-anchor='middle' dy='6' fill='#F6E0A8' font-family='sans-serif' font-size='16' font-weight='bold'>${r.glyph}</text>
      </g>`;
    }).join('')}

    <!-- Center Kundli Yantra -->
    <rect x='-42' y='-42' width='84' height='84' transform='rotate(45)' stroke='#F6E0A8' stroke-width='2' fill='#340612' fill-opacity='0.7'/>
    <text text-anchor='middle' dy='9' fill='#D9A441' font-family='serif' font-size='26' font-weight='bold'>ॐ</text>
  </g>

  <!-- Left Side Gradient Vignette for Text Readability -->
  <rect width='1800' height='720' fill='url(#vignette)'/>
</svg>
`;

sharp(Buffer.from(svg))
  .webp({ quality: 90 })
  .toFile(path.join(__dirname, '..', 'website', 'frontend', 'assets', 'img', 'horoscope-banner.webp'))
  .then(info => console.log('Successfully created horoscope-banner.webp:', info));

