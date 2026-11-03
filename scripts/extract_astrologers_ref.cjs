const sharp = require('sharp');
const path = require('path');

(async () => {
  const userImgPath = 'C:/Users/og/.gemini/antigravity/brain/00a78fb2-1be1-4dbe-8148-844b57e1517e/.user_uploaded/media_1793699059650_9b8dc47e.jpg';
  const outDir = path.resolve(__dirname, '../website/frontend/assets/img');

  const metadata = await sharp(userImgPath).metadata();
  const w = metadata.width;
  const h = metadata.height;

  // Clean crop avoiding the top ivory edge
  const heroLeft = Math.round(w * 0.386);
  const heroTop = Math.round(h * 0.129);
  const heroWidth = Math.round(w * 0.308);
  const heroHeight = Math.round(h * 0.201);

  await sharp(userImgPath)
    .extract({ left: heroLeft, top: heroTop, width: heroWidth, height: heroHeight })
    .toFile(path.join(outDir, 'astrologers-hero-banner-ref.webp'));

  console.log('✅ Clean cropped astrologers-hero-banner-ref.webp');
})();
