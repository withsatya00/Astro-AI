// Install generated originals in both frontend apps without changing profile identities.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

async function main() {
  const records = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const roots = ['website/frontend/assets/portraits', 'ai/frontend/assets/portraits'];
  const hashes = new Set();
  for (const {slug, source} of records) {
    if (!/^[a-z0-9-]+$/.test(slug)) throw new Error('Invalid profile slug');
    const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
    if (hashes.has(hash)) throw new Error(`Repeated photograph: ${slug}`);
    hashes.add(hash);
    const photo = sharp(source).rotate().resize(640, 640, {fit:'cover', position:'centre'});
    const webp = await photo.clone().webp({quality:88}).toBuffer();
    const jpeg = await photo.clone().jpeg({quality:90, mozjpeg:true}).toBuffer();
    for (const root of roots) {
      fs.mkdirSync(path.join(root, 'individual'), {recursive:true});
      fs.writeFileSync(path.join(root, 'individual', `${slug}.webp`), webp);
      fs.writeFileSync(path.join(root, `${slug}.jpg`), jpeg);
    }
  }
  for (const root of roots) {
    const manifestPath = path.join(root, 'individual/index.json');
    const previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
    const slugs = [...new Set([...previous, ...records.map(r => r.slug)])].sort();
    fs.writeFileSync(manifestPath, JSON.stringify(slugs, null, 2) + '\n');
  }
  console.log(`Installed ${records.length} unique portraits in both frontend apps.`);
}
main().catch(error => {console.error(error); process.exitCode=1;});
