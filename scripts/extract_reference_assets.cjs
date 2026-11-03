const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

(async () => {
  const userImgPath = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/.user_uploaded/media_1793698129212_1b6ead21.jpg';
  const outDir = path.resolve(__dirname, '../website/frontend/assets/img');
  const portraitsDir = path.resolve(__dirname, '../website/frontend/assets/portraits');

  const metadata = await sharp(userImgPath).metadata();
  console.log(`Image size: ${metadata.width}x${metadata.height}`);

  const w = metadata.width;
  const h = metadata.height;

  // 1. Hero Artwork (Sage + Zodiac Mandala + Astrolabe)
  // In Desktop view (left side):
  // Let's extract the hero illustration on the right of the desktop hero section
  // Left: ~37% to 71% of width; Top: ~13% to 47% of height
  const heroLeft = Math.round(w * 0.365);
  const heroTop = Math.round(h * 0.125);
  const heroWidth = Math.round(w * 0.345);
  const heroHeight = Math.round(h * 0.35);

  await sharp(userImgPath)
    .extract({ left: heroLeft, top: heroTop, width: heroWidth, height: heroHeight })
    .toFile(path.join(outDir, 'vedic-sage-hero.webp'));

  console.log('✅ Extracted vedic-sage-hero.webp');

  // Also crop the mobile hero illustration (it is centered on the mobile frame)
  // In mobile view (right side):
  // x: ~74% to 98% of w, y: ~42% to 61% of h
  const mobLeft = Math.round(w * 0.745);
  const mobTop = Math.round(h * 0.42);
  const mobWidth = Math.round(w * 0.23);
  const mobHeight = Math.round(h * 0.185);

  await sharp(userImgPath)
    .extract({ left: mobLeft, top: mobTop, width: mobWidth, height: mobHeight })
    .toFile(path.join(outDir, 'vedic-sage-hero-mobile.webp'));

  console.log('✅ Extracted vedic-sage-hero-mobile.webp');

  // Astrologer avatars
  // 1. Acharya Devendra Ji
  await sharp(userImgPath)
    .extract({ left: Math.round(w * 0.038), top: Math.round(h * 0.768), width: Math.round(w * 0.055), height: Math.round(w * 0.055) })
    .toFile(path.join(portraitsDir, 'acharya-devendra-ref.jpg'));

  // 2. Dr. Meera Sharma
  await sharp(userImgPath)
    .extract({ left: Math.round(w * 0.208), top: Math.round(h * 0.768), width: Math.round(w * 0.055), height: Math.round(w * 0.055) })
    .toFile(path.join(portraitsDir, 'dr-meera-sharma-ref.jpg'));

  // 3. Pandit Raghav Joshi
  await sharp(userImgPath)
    .extract({ left: Math.round(w * 0.378), top: Math.round(h * 0.768), width: Math.round(w * 0.055), height: Math.round(w * 0.055) })
    .toFile(path.join(portraitsDir, 'pandit-raghav-ref.jpg'));

  // 4. Acharya Nitin Trivedi
  await sharp(userImgPath)
    .extract({ left: Math.round(w * 0.548), top: Math.round(h * 0.768), width: Math.round(w * 0.055), height: Math.round(w * 0.055) })
    .toFile(path.join(portraitsDir, 'acharya-nitin-ref.jpg'));

  console.log('✅ All reference portraits extracted!');
})();

