// Recompresses oversized photos in place (same file name and format, so no references change).
// Usage: node scripts/optimize_images.cjs [maxKB=250]
const fs = require('fs'), path = require('path'), sharp = require('sharp');
const ROOT = path.resolve(__dirname, '..', 'website', 'frontend', 'assets');
const LIMIT = (Number(process.argv[2]) || 250) * 1024;
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
sharp.cache(false);
(async () => {
  const files = walk(ROOT).filter(p => /\.(jpe?g)$/i.test(p) && /\/(img|portraits)\//.test(p.split(path.sep).join('/')) && fs.statSync(p).size > LIMIT);
  for (const file of files) {
    const before = fs.statSync(file).size;
    let width = 1600, quality = 80, out;
    do {
      out = await sharp(file).rotate().resize({ width, withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
      width = Math.round(width * 0.85); quality = Math.max(60, quality - 4);
    } while (out.length > LIMIT && width > 600);
    for (let i = 0; ; i++) { try { fs.writeFileSync(file, out); break; } catch (e) { if (i >= 5) throw e; await new Promise(r => setTimeout(r, 400)); } }
    console.log(`${path.relative(ROOT, file)}: ${(before / 1024) | 0} KB -> ${(out.length / 1024) | 0} KB`);
  }
  console.log(`${files.length} file(s) optimized`);
})();
