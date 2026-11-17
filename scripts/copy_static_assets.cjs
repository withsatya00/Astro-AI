const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, '..', 'website', 'frontend', 'assets');
const destDir = path.resolve(__dirname, '..', 'dist', 'assets');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // Only copy if destination doesn't exist or has different size
    if (!fs.existsSync(dest) || fs.statSync(dest).size !== stats.size) {
      fs.copyFileSync(src, dest);
    }
  }
}

if (fs.existsSync(srcDir) && fs.existsSync(destDir)) {
  copyRecursiveSync(srcDir, destDir);
  console.log('✅ Static assets successfully synced into dist/assets');
} else {
  console.log('⚠️ Source or destination directory missing, skipped asset sync.');
}
