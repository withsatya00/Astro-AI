const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '../website/frontend');
const srcDir = path.resolve(__dirname, '../website/frontend/src');

function walk(dir, exts = ['.jsx', '.js', '.html', '.css']) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (item !== 'node_modules' && item !== '.git') {
        files = files.concat(walk(fullPath, exts));
      }
    } else if (exts.includes(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

const files = walk(srcDir);
const assetRegex = /(?:src=["']|href=["']|url\(["']?|photo:\s*["']|image_url:\s*["']|img:\s*["']|image:\s*["'])(\/(?:assets|img)\/[^"'\)\s]+)/g;

const missing = [];
let totalFound = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = assetRegex.exec(content)) !== null) {
    const assetPath = match[1].split('?')[0];
    const diskPath = path.join(publicDir, assetPath.replace(/^\//, ''));
    totalFound++;
    if (!fs.existsSync(diskPath)) {
      missing.push({
        file: path.relative(path.resolve(__dirname, '..'), file),
        asset: assetPath,
        expectedDiskPath: diskPath,
      });
    }
  }
}

console.log(`\n--- SCAN RESULTS ---`);
console.log(`TOTAL FOUND VALID ASSETS: ${totalFound - missing.length}`);
console.log(`TOTAL MISSING ASSETS FOUND: ${missing.length}\n`);

if (missing.length > 0) {
  missing.forEach((m) => {
    console.log(`[MISSING] in ${m.file} -> ${m.asset}`);
  });
} else {
  console.log('ALL ASSET REFERENCES EXIST ON DISK!');
}
