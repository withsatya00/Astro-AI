const path = require('path');
const sharp = require('sharp');

async function createGauHero() {
  const userCowPhoto = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/.user_uploaded/media_1793440195510_daa02470.jpg';
  
  // We want a canvas 1800 x 720
  // Left half: Deep Royal Maroon Burgundy (#3E0B18 -> #20030A)
  // Right half: Real Cow & Calf photo smoothly blending in!
  
  // 1. Resize and crop the cow photo to cover the right 60% of the canvas (1100 x 720)
  const cowRight = await sharp(userCowPhoto)
    .resize(1150, 720, { fit: 'cover', position: 'right' })
    .toBuffer();

  // 2. Create gradient overlay SVG mask that smoothly transitions from solid maroon on left to transparent over the cow
  const overlaySvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="1800" height="720" viewBox="0 0 1800 720">
    <defs>
      <linearGradient id="maroonBlend" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#24040B" stop-opacity="1" />
        <stop offset="38%" stop-color="#2D050E" stop-opacity="0.98" />
        <stop offset="48%" stop-color="#3E0B18" stop-opacity="0.9" />
        <stop offset="62%" stop-color="#3E0B18" stop-opacity="0.5" />
        <stop offset="78%" stop-color="#3E0B18" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#3E0B18" stop-opacity="0" />
      </linearGradient>
      <!-- Bottom & Top subtle vignettes -->
      <linearGradient id="vertVignette" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#20030A" stop-opacity="0.4" />
        <stop offset="50%" stop-color="#20030A" stop-opacity="0" />
        <stop offset="100%" stop-color="#20030A" stop-opacity="0.5" />
      </linearGradient>
    </defs>
    <rect width="1800" height="720" fill="url(#maroonBlend)" />
    <rect width="1800" height="720" fill="url(#vertVignette)" />
  </svg>
  `;

  // 3. Composite base maroon background, the cow on right (left: 650), and overlay mask
  const baseBg = await sharp({
    create: {
      width: 1800,
      height: 720,
      channels: 4,
      background: { r: 36, g: 4, b: 11, alpha: 1 }
    }
  }).png().toBuffer();

  const finalBuffer = await sharp(baseBg)
    .composite([
      { input: cowRight, left: 650, top: 0 },
      { input: Buffer.from(overlaySvg), left: 0, top: 0 }
    ])
    .webp({ quality: 90 })
    .toFile(path.join(__dirname, '..', 'website', 'frontend', 'assets', 'img', 'gau-sewa-hero-v2.webp'));

  console.log('Successfully updated gau-sewa-hero-v2.webp:', finalBuffer);
}

createGauHero().catch(console.error);

