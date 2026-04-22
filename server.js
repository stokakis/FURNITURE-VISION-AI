// ================================================
//  FurnitureVision AI – Node.js Local Server + API Proxy
//  ideaepipla.gr  v1.3
// ================================================

const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const { exec } = require('child_process');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
};

// ── CORS helper ─────────────────────────────────
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-goog-api-key, x-api-key');
}

// ── Upstream proxy helper ───────────────────────
function proxyRequest(targetUrl, reqBody, origRes) {
  const parsed = new URL(targetUrl);
  const opts = {
    hostname: parsed.hostname,
    port:     parsed.port || 443,
    path:     parsed.pathname + parsed.search,
    method:   'POST',
    headers: {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(reqBody),
    }
  };

  const upstream = https.request(opts, upRes => {
    let data = '';
    upRes.on('data',  c => data += c);
    upRes.on('end', () => {
      setCORS(origRes);
      origRes.writeHead(upRes.statusCode, { 'Content-Type': 'application/json' });
      origRes.end(data);
    });
  });

  upstream.on('error', err => {
    console.error('Proxy error:', err.message);
    setCORS(origRes);
    origRes.writeHead(502, { 'Content-Type': 'application/json' });
    origRes.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
  });

  upstream.write(reqBody);
  upstream.end();
}

// ── GET proxy helper ────────────────────────────
function proxyGet(targetUrl, origRes) {
  const parsed = new URL(targetUrl);
  const opts = {
    hostname: parsed.hostname,
    port:     parsed.port || 443,
    path:     parsed.pathname + parsed.search,
    method:   'GET',
    headers: { 'Content-Type': 'application/json' }
  };

  const upstream = https.request(opts, upRes => {
    let data = '';
    upRes.on('data',  c => data += c);
    upRes.on('end', () => {
      setCORS(origRes);
      origRes.writeHead(upRes.statusCode, { 'Content-Type': 'application/json' });
      origRes.end(data);
    });
  });

  upstream.on('error', err => {
    setCORS(origRes);
    origRes.writeHead(502, { 'Content-Type': 'application/json' });
    origRes.end(JSON.stringify({ error: `Proxy error: ${err.message}` }));
  });

  upstream.end();
}

// ── Main server ─────────────────────────────────
const server = http.createServer((req, res) => {
  setCORS(res);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Pre-flight
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── /proxy/router/generate  →  router.claude.gg image generation ──
  if (req.url === '/proxy/router/generate' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const apiKey  = payload._apiKey || '';
        delete payload._apiKey;

        const parsed  = new URL('https://router.claude.gg/api/generate');
        const reqBody = JSON.stringify(payload);
        const opts = {
          hostname: parsed.hostname, port: 443,
          path: parsed.pathname, method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(reqBody),
            'Authorization': `Bearer ${apiKey}`
          }
        };
        const upstream = https.request(opts, upRes => {
          let data = ''; upRes.on('data', c => data += c);
          upRes.on('end', () => {
            setCORS(res);
            res.writeHead(upRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
            console.log(`[ROUTER GEN] ${upRes.statusCode} — ${data.substring(0,100)}`);
          });
        });
        upstream.on('error', err => {
          setCORS(res); res.writeHead(502, {'Content-Type':'application/json'});
          res.end(JSON.stringify({ error: err.message }));
        });
        upstream.write(reqBody); upstream.end();
      } catch(e) {
        setCORS(res); res.writeHead(400, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // ── /proxy/router/poll/:taskId  →  router.claude.gg poll ──
  if (req.url.startsWith('/proxy/router/poll/') && req.method === 'GET') {
    const parts  = req.url.split('/');
    const taskId = parts[4];
    const qs     = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    const apiKey = params.get('key') || '';

    const opts = {
      hostname: 'router.claude.gg', port: 443,
      path: `/get/${taskId}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    };
    const upstream = https.request(opts, upRes => {
      let data = ''; upRes.on('data', c => data += c);
      upRes.on('end', () => {
        setCORS(res);
        res.writeHead(upRes.statusCode, { 'Content-Type': 'application/json' });
        res.end(data);
      });
    });
    upstream.on('error', err => {
      setCORS(res); res.writeHead(502, {'Content-Type':'application/json'});
      res.end(JSON.stringify({ error: err.message }));
    });
    upstream.end();
    return;
  }

  // ── /proxy/check-video-service  →  lightweight health check ──
  if (req.url === '/proxy/check-video-service' && req.method === 'GET') {
    const testUrl = 'https://gemini.vertexapis.com/health';
    const opts = { hostname: 'gemini.vertexapis.com', port: 443, path: '/health', method: 'GET' };
    const upstream = https.request(opts, upRes => {
      let data = ''; upRes.on('data', c => data += c);
      upRes.on('end', () => {
        setCORS(res);
        const ok = upRes.statusCode >= 200 && upRes.statusCode < 300;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok, status: upRes.statusCode, body: data.substring(0, 200) }));
        console.log(`[VIDEO HEALTH] ${upRes.statusCode} — ${ok ? 'OK' : 'DOWN'}`);
      });
    });
    upstream.on('error', err => {
      setCORS(res);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, status: 0, error: err.message }));
      console.error(`[VIDEO HEALTH] Network error: ${err.message}`);
    });
    upstream.end();
    return;
  }

  // ── /proxy/video  →  POST video generation with fallback ──
  if (req.url.startsWith('/proxy/video') && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const payload  = JSON.parse(body);
        const apiKey   = payload._apiKey || '';
        const endpoint = payload._endpoint || 'https://gemini.vertexapis.com/api/generate/video';
        delete payload._apiKey;
        delete payload._endpoint;

        // Try up to 3 times with 4s delay between attempts
        const MAX_RETRIES = 3;
        let lastStatus = 0;
        let lastBody   = '';

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          if (attempt > 1) {
            console.log(`[PROXY VIDEO] Retry ${attempt}/${MAX_RETRIES} after 4s…`);
            await new Promise(r => setTimeout(r, 4000));
          }

          const result = await new Promise(resolve => {
            const targetUrl = `${endpoint}?key=${apiKey}`;
            console.log(`[PROXY VIDEO] Attempt ${attempt} → ${endpoint}`);

            const parsed = new URL(targetUrl);
            const reqBody = JSON.stringify(payload);
            const opts = {
              hostname: parsed.hostname,
              port: 443,
              path: parsed.pathname + parsed.search,
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(reqBody),
                'Authorization': `Bearer ${apiKey}`,
                'x-api-key': apiKey
              }
            };
            const upstream = https.request(opts, upRes => {
              let data = '';
              upRes.on('data', c => data += c);
              upRes.on('end', () => resolve({ status: upRes.statusCode, data }));
            });
            upstream.on('error', err => resolve({ status: 0, data: JSON.stringify({ error: err.message }) }));
            upstream.write(reqBody);
            upstream.end();
          });

          lastStatus = result.status;
          lastBody   = result.data;

          // Success
          if (result.status >= 200 && result.status < 300) {
            setCORS(res);
            res.writeHead(result.status, { 'Content-Type': 'application/json' });
            res.end(result.data);
            return;
          }

          // 4xx = don't retry (client error)
          if (result.status >= 400 && result.status < 500) break;

          // 5xx = retry
          console.warn(`[PROXY VIDEO] Got ${result.status}, will retry…`);
        }

        // All retries exhausted
        console.error(`[PROXY VIDEO] All retries failed. Last status: ${lastStatus}`);
        setCORS(res);

        let errMsg = `Video API returned ${lastStatus}`;
        if (lastStatus === 502 || lastStatus === 503) {
          errMsg = 'The video generation service is temporarily unavailable (502). Please try again in a few minutes.';
        }
        try {
          const j = JSON.parse(lastBody);
          if (j.error || j.message) errMsg = j.error || j.message;
        } catch {}

        res.writeHead(lastStatus || 502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: errMsg }));

      } catch (e) {
        setCORS(res);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request: ' + e.message }));
      }
    });
    return;
  }

  // ── /proxy/video-status/:jobId  →  GET status ──
  if (req.url.startsWith('/proxy/video-status/') && req.method === 'GET') {
    const parts  = req.url.split('/');
    const jobId  = parts[3];
    const qs     = req.url.includes('?') ? req.url.split('?')[1] : '';
    const params = new URLSearchParams(qs);
    const apiKey = params.get('key') || '';
    const base   = params.get('base') || 'https://gemini.vertexapis.com';

    const targetUrl = `${base}/api/video/status/${jobId}?key=${apiKey}`;
    console.log(`[PROXY STATUS] → ${targetUrl}`);
    proxyGet(targetUrl, res);
    return;
  }

  // ── Static file serving ──────────────────────
  let filePath = path.join(ROOT, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  const ext    = path.extname(filePath).toLowerCase();
  const mime   = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`404 Not Found: ${req.url}`);
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  🪑  FurnitureVision AI  v1.3');
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅  App:    ${url}`);
  console.log(`  🔁  Proxy:  ${url}/proxy/video`);
  console.log(`  📁  Root:   ${ROOT}`);
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Press Ctrl+C to stop\n');

  exec(`start ${url}`, err => {
    if (err) console.error('Browser open error:', err.message);
  });
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ❌  Port ${PORT} already in use — kill the process and retry`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});