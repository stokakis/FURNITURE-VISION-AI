// ================================================
//  FurnitureVision AI – Node.js Local Server + API Proxy
//  ideaepipla.gr  v1.4  (+ PrestaShop /api/kt/* routes)
// ================================================

const http   = require('http');
const https  = require('https');
const fs     = require('fs');
const path   = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;

// ── PrestaShop config ─────────────────────────────
// Set PRESTA_URL and PRESTA_KEY in Railway → Settings → Variables
const PRESTA_URL = (process.env.PRESTA_URL || '').replace(/\/$/, '');
const PRESTA_KEY = process.env.PRESTA_KEY || '';

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

// ═══════════════════════════════════════════════
//  PRESTASHOP INTEGRATION  (Καρτολίνες / kartelaki)
// ═══════════════════════════════════════════════

function prestaAuth() {
  return 'Basic ' + Buffer.from(PRESTA_KEY + ':').toString('base64');
}

// JSON fetch from PrestaShop WebService
function prestaFetch(apiPath) {
  return new Promise((resolve, reject) => {
    const sep     = apiPath.includes('?') ? '&' : '?';
    const fullUrl = PRESTA_URL + apiPath + sep + 'output_format=JSON';
    let parsed;
    try { parsed = new URL(fullUrl); } catch (e) { return reject(e); }
    const proto = fullUrl.startsWith('https') ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port:     parsed.port || (fullUrl.startsWith('https') ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { 'Authorization': prestaAuth() },
    };
    const req = proto.request(opts, upRes => {
      let data = '';
      upRes.on('data', c => data += c);
      upRes.on('end', () => {
        try   { resolve({ status: upRes.statusCode, json: JSON.parse(data) }); }
        catch { resolve({ status: upRes.statusCode, json: null, raw: data }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Binary fetch from PrestaShop (images)
function prestaFetchBinary(apiPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = PRESTA_URL + apiPath;
    let parsed;
    try { parsed = new URL(fullUrl); } catch (e) { return reject(e); }
    const proto = fullUrl.startsWith('https') ? https : http;
    const opts = {
      hostname: parsed.hostname,
      port:     parsed.port || (fullUrl.startsWith('https') ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { 'Authorization': prestaAuth() },
    };
    const req = proto.request(opts, upRes => {
      const chunks = [];
      upRes.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      upRes.on('end', () => resolve({
        status:      upRes.statusCode,
        contentType: upRes.headers['content-type'] || 'image/jpeg',
        data:        Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

// Extract multilingual name field from PrestaShop API response
function extractName(field, langId) {
  langId = langId || 1;
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (Array.isArray(field)) {
    const hit = field.find(n => String(n.id) === String(langId));
    return (hit || field[0] || {}).value || '';
  }
  return '';
}

// ── In-memory product cache ─────────────────────
const ktCache = {
  ready: false, loading: false, loaded: 0, total: 0,
  error: '', products: [], catMap: {},
};

async function loadKtCache() {
  if (ktCache.loading || ktCache.ready) return;
  if (!PRESTA_URL || !PRESTA_KEY) {
    ktCache.error = 'PRESTA_URL or PRESTA_KEY env var not set';
    return;
  }
  ktCache.loading = true; ktCache.error = ''; ktCache.loaded = 0;
  console.log('[KT] Loading product cache from PrestaShop…');

  try {
    const all  = [];
    const bsz  = 250;
    let offset = 0, keepGoing = true;

    while (keepGoing) {
      const r = await prestaFetch(
        `/api/products?display=[id,name,reference,active,associations]&limit=${offset},${bsz}`
      );

      if (r.status !== 200 || !r.json || !r.json.products) {
        keepGoing = false;
        if (all.length === 0) {
          ktCache.error = `PrestaShop API error ${r.status}`;
          ktCache.loading = false;
          return;
        }
      } else {
        for (const p of r.json.products) {
          let imageId = '';
          if (p.associations && p.associations.images && p.associations.images.length > 0) {
            imageId = String(p.associations.images[0].id || '');
          }
          const catIds = ((p.associations && p.associations.categories) || []).map(c => String(c.id));
          all.push({
            id:        String(p.id),
            name:      extractName(p.name),
            reference: p.reference || '',
            active:    String(p.active),
            imageId,
            catIds,
          });
        }
        ktCache.loaded = all.length;
        console.log(`[KT] Loaded ${all.length} products so far…`);
        if (r.json.products.length < bsz) keepGoing = false;
        else offset += bsz;
      }
    }

    ktCache.products = all;
    ktCache.total    = all.length;
    ktCache.ready    = true;
    ktCache.loading  = false;
    console.log(`[KT] Cache ready: ${ktCache.total} products`);
    loadKtCategories(); // fire & forget
  } catch (e) {
    ktCache.error   = e.message;
    ktCache.loading = false;
    console.error('[KT] Cache error:', e.message);
  }
}

async function loadKtCategories() {
  try {
    const r = await prestaFetch('/api/categories?display=[id,name,active]');
    if (r.status === 200 && r.json && r.json.categories) {
      const map = {};
      for (const c of r.json.categories) {
        if (String(c.active) !== '0') map[String(c.id)] = extractName(c.name);
      }
      ktCache.catMap = map;
      console.log(`[KT] Categories loaded: ${Object.keys(map).length}`);
    }
  } catch (e) {
    console.warn('[KT] Categories load error:', e.message);
  }
}

// ── Main server ─────────────────────────────────
const server = http.createServer(async (req, res) => {
  setCORS(res);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  // Pre-flight
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ─────────────────────────────────────────────
  //  PrestaShop / Kartelaki routes
  // ─────────────────────────────────────────────

  // /api/kt/load — trigger cache load, return current status
  if (req.url === '/api/kt/load' && req.method === 'GET') {
    if (!ktCache.ready && !ktCache.loading) loadKtCache(); // fire & forget
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ready: ktCache.ready, loading: ktCache.loading,
      loaded: ktCache.loaded, total: ktCache.total, error: ktCache.error,
    }));
    return;
  }

  // /api/kt/status — return cache status (never triggers load)
  if (req.url === '/api/kt/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      ready: ktCache.ready, loading: ktCache.loading,
      loaded: ktCache.loaded, total: ktCache.total, error: ktCache.error,
    }));
    return;
  }

  // /api/kt/search?q=&cat=&active=
  if (req.url.startsWith('/api/kt/search') && req.method === 'GET') {
    if (!ktCache.ready) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'cache_not_ready', products: [] }));
      return;
    }
    const qs     = new URLSearchParams(req.url.includes('?') ? req.url.split('?')[1] : '');
    const q      = (qs.get('q') || '').toLowerCase().trim();
    const cat    = qs.get('cat') || '';
    const active = qs.get('active');

    let results = ktCache.products;
    if (active === '1')      results = results.filter(p => p.active === '1');
    else if (active === '0') results = results.filter(p => p.active === '0');
    if (cat)  results = results.filter(p => p.catIds.includes(cat));
    if (q)    results = results.filter(p =>
      p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q)
    );

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ products: results.slice(0, 100) }));
    return;
  }

  // /api/kt/categories
  if (req.url === '/api/kt/categories' && req.method === 'GET') {
    const cats = Object.entries(ktCache.catMap)
      .filter(function(e) { return e[1]; })
      .map(function(e) { return { id: e[0], name: e[1] }; })
      .sort(function(a, b) { return a.name.localeCompare(b.name, 'el'); });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ categories: cats }));
    return;
  }

  // /api/kt/thumb/:pid
  if (req.url.startsWith('/api/kt/thumb/') && req.method === 'GET') {
    const pid    = (req.url.split('/')[4] || '').split('?')[0];
    const cached = ktCache.products.find(function(p) { return p.id === pid; });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ imageId: cached ? cached.imageId : '' }));
    return;
  }

  // /api/kt/price/:pid
  if (req.url.startsWith('/api/kt/price/') && req.method === 'GET') {
    const pid = (req.url.split('/')[4] || '').split('?')[0];
    if (!PRESTA_URL || !PRESTA_KEY) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'PrestaShop not configured' }));
      return;
    }
    try {
      const r = await prestaFetch('/api/products/' + pid + '?display=full');
      if (r.status !== 200 || !r.json || !r.json.product) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'product_not_found' }));
        return;
      }
      const p         = r.json.product;
      const basePrice = parseFloat(p.price) || 0;

      let imageId = '';
      if (p.associations && p.associations.images && p.associations.images.length > 0) {
        imageId = String(p.associations.images[0].id || '');
      }

      let origPrice = basePrice, finalPrice = basePrice, discountPct = 0, discountAmount = 0;

      try {
        const sp = await prestaFetch('/api/specific_prices?filter[id_product]=' + pid + '&display=full');
        if (sp.status === 200 && sp.json && sp.json.specific_prices && sp.json.specific_prices.length > 0) {
          const now    = Date.now();
          const active = sp.json.specific_prices.filter(function(s) {
            if (s.from && s.from !== '0000-00-00 00:00:00' && new Date(s.from).getTime() > now) return false;
            if (s.to   && s.to   !== '0000-00-00 00:00:00' && new Date(s.to  ).getTime() < now) return false;
            return true;
          });
          if (active.length > 0) {
            const s0  = active[0];
            const red = parseFloat(s0.reduction) || 0;
            if (parseFloat(s0.price) > 0) {
              // Fixed override price
              finalPrice     = parseFloat(s0.price);
              discountAmount = Math.max(0, basePrice - finalPrice);
              discountPct    = basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;
            } else if (s0.reduction_type === 'percentage') {
              discountPct    = red * 100;
              discountAmount = basePrice * red;
              finalPrice     = basePrice - discountAmount;
            } else if (s0.reduction_type === 'amount') {
              discountAmount = red;
              finalPrice     = Math.max(0, basePrice - red);
              discountPct    = basePrice > 0 ? (red / basePrice) * 100 : 0;
            }
          }
        }
      } catch (spErr) { /* specific_prices optional — ignore errors */ }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        imageId,
        origPrice:      Math.round(origPrice      * 100) / 100,
        finalPrice:     Math.round(finalPrice      * 100) / 100,
        discountPct:    Math.round(discountPct     * 10)  / 10,
        discountAmount: Math.round(discountAmount  * 100) / 100,
      }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // /proxy/presta-image?pid=&iid=&size=
  if (req.url.startsWith('/proxy/presta-image') && req.method === 'GET') {
    const qs   = new URLSearchParams(req.url.includes('?') ? req.url.split('?')[1] : '');
    const pid  = qs.get('pid') || '';
    const iid  = qs.get('iid') || '';
    const size = qs.get('size') || 'small_default';
    if (!pid || !iid || !PRESTA_URL || !PRESTA_KEY) {
      res.writeHead(400, { 'Content-Type': 'text/plain' }); res.end('Missing params'); return;
    }
    try {
      const r = await prestaFetchBinary('/api/images/products/' + pid + '/' + iid + '?size=' + size);
      res.writeHead(r.status, {
        'Content-Type':   r.contentType,
        'Cache-Control':  'public, max-age=86400',
        'Content-Length': r.data.length,
      });
      res.end(r.data);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Image proxy error: ' + e.message);
    }
    return;
  }

  // /proxy/presta/* — generic PrestaShop API proxy (used by kartelaki fetchProductDetails)
  if (req.url.startsWith('/proxy/presta/') && req.method === 'GET') {
    const apiPath = req.url.slice('/proxy/presta'.length); // e.g. /api/products/123?display=full
    if (!PRESTA_URL || !PRESTA_KEY) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'PrestaShop not configured' }));
      return;
    }
    try {
      const r = await prestaFetch(apiPath);
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(r.json));
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // ─────────────────────────────────────────────
  //  Original proxy routes (unchanged)
  // ─────────────────────────────────────────────

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
  console.log('  🪑  FurnitureVision AI  v1.4');
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅  App:    ${url}`);
  console.log(`  🔁  Proxy:  ${url}/proxy/video`);
  console.log(`  🛍  Presta: ${PRESTA_URL || '(not configured — set PRESTA_URL & PRESTA_KEY)'}`);
  console.log(`  📁  Root:   ${ROOT}`);
  console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Press Ctrl+C to stop\n');

  // Open browser on Windows local dev only
  if (process.platform === 'win32') {
    exec(`start ${url}`, err => {
      if (err) console.error('Browser open error:', err.message);
    });
  }
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  ❌  Port ${PORT} already in use — kill the process and retry`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
