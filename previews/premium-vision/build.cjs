const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const frontend = path.join(root, 'website/frontend');
const assets = {
  logo: 'assets/brand/logo-mark-v3-96.webp',
  expert1: 'assets/portraits/individual/acharya-anand-joshi.webp',
  expert2: 'assets/portraits/individual/acharya-shastri.webp',
  expert3: 'assets/portraits/individual/vidushi-meera-devi.webp',
  expert4: 'assets/portraits/individual/pt-rameshwar-dwivedi.webp',
  product1: 'assets/img/products/rudraksha-5.jpg',
  product2: 'assets/img/products/sphatik-mala.jpg',
  product3: 'assets/img/products/kuber-yantra.jpg',
  product4: 'assets/img/products/emerald.jpg',
  temple1: 'assets/img/temples/kashi-vishwanath-varanasi.jpg',
  temple2: 'assets/img/temples/mahakaleshwar-ujjain.jpg',
  temple3: 'assets/img/temples/somnath-jyotirlinga-gujarat.jpg'
};
let html = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const js = fs.readFileSync(path.join(__dirname, 'preview.js'), 'utf8');
html = html.replace('@@javascript@@', () => js.replace(/<\/script/gi, '<\\/script'));
for (const [key, relative] of Object.entries(assets)) {
  const mime = relative.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const data = 'data:' + mime + ';base64,' + fs.readFileSync(path.join(frontend, relative)).toString('base64');
  html = html.split('@@' + key + '@@').join(data);
}
if (/@@\w+@@/.test(html)) throw Error('Unresolved preview asset');
const output = path.join(root, 'previews/astro-jyotish-premium.html');
fs.writeFileSync(output, html);
fs.writeFileSync(path.join(frontend, 'premium-vision.html'), html);
console.log('Built standalone HTML preview: ' + (Buffer.byteLength(html) / 1024).toFixed(0) + ' KB');
