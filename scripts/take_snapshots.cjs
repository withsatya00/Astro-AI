const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { chromium } = require('@playwright/test');

const PORT = 3188;
const ROOT = path.resolve(__dirname, '..', 'website', 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT, safePath);

  function serveFile(targetFile) {
    fs.stat(targetFile, (err, stats) => {
      if (err) {
        if (!path.extname(pathname) || pathname === '/') return serveIndex();
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      if (stats.isDirectory()) {
        const indexPath = path.join(targetFile, 'index.html');
        return fs.stat(indexPath, (indexErr, indexStats) => {
          if (!indexErr && indexStats.isFile()) return serveFile(indexPath);
          return serveIndex();
        });
      }
      const ext = path.extname(targetFile).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(targetFile).pipe(res);
    });
  }

  function serveIndex() {
    const indexPath = path.join(ROOT, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(indexPath).pipe(res);
  }

  serveFile(filePath);
});

(async () => {
  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Server started on http://127.0.0.1:${PORT}`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 960 } });
  const page = await context.newPage();

  const outDir = path.resolve(__dirname, '..', 'scratch');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Navigating to directory...');
  await page.goto(`http://127.0.0.1:${PORT}/astrologers`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'snap_directory_current.png'), fullPage: true });

  console.log('Navigating to profile...');
  await page.goto(`http://127.0.0.1:${PORT}/astrologers/pt-brijesh-pandey`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'snap_profile_current.png'), fullPage: true });

  console.log('Navigating to puja...');
  await page.goto(`http://127.0.0.1:${PORT}/mandir-seva/puja`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, 'snap_puja_current.png'), fullPage: true });

  console.log('Done!');
  await browser.close();
  server.close();
  process.exit(0);
})();
