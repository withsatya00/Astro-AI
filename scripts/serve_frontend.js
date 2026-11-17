/**
 * Robust, zero-dependency static file server with Single Page Application (SPA) routing fallback
 * and API proxy support for backend at http://localhost:8002.
 * 
 * Automatically detects and serves production React bundles from /dist when available,
 * while seamlessly serving static assets from /website/frontend.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = parseInt(process.env.PORT || '3000', 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '8002', 10);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const FRONTEND_DIR = path.resolve(__dirname, '..', 'website', 'frontend');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

function hasDist() {
  return fs.existsSync(path.join(DIST_DIR, 'index.html'));
}

const server = http.createServer((req, res) => {
  // CORS & No-Cache Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // Proxy /api/ requests to Python backend if reachable
  if (pathname.startsWith('/api/') || pathname === '/api') {
    const proxyReq = http.request({
      hostname: '127.0.0.1',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${BACKEND_PORT}`
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend unreachable on port ' + BACKEND_PORT, detail: err.message }));
    });

    req.pipe(proxyReq);
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  // Normalize path & prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const isDistMode = hasDist();

  function serveIndex() {
    const indexPath = isDistMode
      ? path.join(DIST_DIR, 'index.html')
      : path.join(FRONTEND_DIR, 'index.html');

    fs.stat(indexPath, (err, stats) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('index.html not found');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': stats.size
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      const stream = fs.createReadStream(indexPath);
      stream.on('error', () => res.end());
      stream.pipe(res);
    });
  }

  // SPA Route: If path has no extension, serve index.html directly
  const ext = path.extname(safePath).toLowerCase();
  if (!ext || safePath === '' || safePath === '.' || safePath === '/' || safePath === '\\') {
    return serveIndex();
  }

  // Static File resolution: check dist first, then website/frontend
  let targetFile = null;
  if (isDistMode) {
    const distTarget = path.join(DIST_DIR, safePath);
    if (fs.existsSync(distTarget) && !fs.statSync(distTarget).isDirectory()) {
      targetFile = distTarget;
    }
  }

  if (!targetFile) {
    const frontendTarget = path.join(FRONTEND_DIR, safePath);
    if (fs.existsSync(frontendTarget) && !fs.statSync(frontendTarget).isDirectory()) {
      targetFile = frontendTarget;
    }
  }

  if (!targetFile) {
    // Check root directory as well (for favicon, robots.txt, etc.)
    const rootTarget = path.join(path.resolve(__dirname, '..'), safePath);
    if (fs.existsSync(rootTarget) && !fs.statSync(rootTarget).isDirectory()) {
      targetFile = rootTarget;
    }
  }

  if (!targetFile) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found: ' + safePath);
    return;
  }

  fs.stat(targetFile, (err, stats) => {
    if (err || stats.isDirectory()) {
      return serveIndex();
    }

    const fileExt = path.extname(targetFile).toLowerCase();
    const contentType = MIME_TYPES[fileExt] || 'application/octet-stream';

    const range = req.headers.range;
    if (range && stats.size > 0) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
      const chunksize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
      });
      const stream = fs.createReadStream(targetFile, { start, end });
      stream.pipe(res);
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes'
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(targetFile);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('Server Error');
    });
    stream.pipe(res);
  });
});

// Protect server process from unhandled stream errors
server.on('clientError', (err, socket) => {
  if (err.code === 'ECONNRESET' || !socket.writable) {
    return;
  }
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Astro Jyotish Frontend running at http://localhost:${PORT}`);
  console.log(`📁 Dist Mode: ${hasDist() ? 'ACTIVE (Serving compiled React bundle)' : 'INACTIVE (Serving raw source)'}`);
  console.log(`📁 Primary Dist: ${DIST_DIR}`);
  console.log(`📁 Static Fallback: ${FRONTEND_DIR}\n`);
});
