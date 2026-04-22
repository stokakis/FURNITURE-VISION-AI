/* ================================================
   api.js – Cortex AI / Vertex API Integration
   FurnitureVision AI / ideaepipla.gr
   ================================================ */

// ── Utility: file → base64 ──────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBase64(dataUrl) {
  return dataUrl.split(',')[1];
}

// ── Download helper ─────────────────────────────
async function downloadImageFromUrl(url, filename) {
  try {
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'furniture-ai.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } else {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl; a.download = filename || 'furniture-ai.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }
  } catch { window.open(url, '_blank'); }
}

// ── Generate Image (model-aware) ───────────────
async function generateImage({ prompt, referenceBase64 = null, modelId = null }) {
  SESSION.increment();
  const model = getImageModelById(modelId || CONFIG.DEFAULT_IMAGE_MODEL);

  if (model.api === 'router') {
    return await generateImageRouter({ prompt, referenceBase64, model });
  }

  // Native: use specified modelId or default
  try {
    const result = await generateImageNative({ prompt, referenceBase64, overrideModel: model.modelId });
    if (result) return result;
  } catch (err) {
    console.warn('Native image API failed, trying wrapper…', err.message);
  }
  return await generateImageWrapper({ prompt, referenceBase64 });
}

// ── Router image generation (router.claude.gg) ──
async function generateImageRouter({ prompt, referenceBase64, model }) {
  const body = {
    _apiKey: CONFIG.API_KEY,
    prompt
  };

  // Set type and model based on model definition
  if (model.typeVal) body.type = model.typeVal;
  if (model.modelVal) body.model = model.modelVal;

  // Add aspect ratio (router uses snake_case)
  // Derive from prompt's --ar hint if present
  const arMatch = prompt.match(/--ar\s+([\d:]+)/);
  if (arMatch) {
    body.aspect_ratio = arToRouterFormat(arMatch[1]);
  }

  // Router models generally don't support reference images
  // but we include it if the model supports it
  if (referenceBase64 && model.supportsReference) {
    body.reference_image = referenceBase64;
  }

  const resp = await fetch('/proxy/router/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });

  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `Router API ${resp.status}`);

  // Sync result
  if (data.status === 'FINISHED' || (data.data && !data.task_id)) {
    const url = extractRouterImageUrl(data);
    if (url) return { success: true, url, source: 'router' };
  }

  // Async: poll for result
  const taskId = data.task_id || (data.data && data.data.task_id);
  if (!taskId) throw new Error('No task_id in router response');

  // Poll up to 90s
  const start = Date.now();
  while (Date.now() - start < 90000) {
    await sleep(3000);
    const pollResp = await fetch(`/proxy/router/poll/${taskId}?key=${encodeURIComponent(CONFIG.API_KEY)}`);
    const pollData = await pollResp.json();

    if (pollData.status === 'FINISHED' || (pollData.data && !pollData.task_id)) {
      const url = extractRouterImageUrl(pollData);
      if (url) return { success: true, url, source: 'router' };
    }
    if (pollData.status === 'FAILED' || pollData.error) {
      throw new Error(pollData.error || 'Router image generation failed');
    }
  }
  throw new Error('Router image generation timed out (90s)');
}

// Extract image URL from router.claude.gg response
// Handles all documented response shapes from cortexfields.md + router.claude.gg
function extractRouterImageUrl(data) {
  // cortexfields.md format: { status:"FINISHED", result: ["https://..."] }
  if (Array.isArray(data.result) && data.result[0]) return data.result[0];
  // Simple url field
  if (typeof data.url === 'string' && data.url.startsWith('http')) return data.url;
  // Nested data.url
  if (data.data?.url) return data.data.url;
  // Array of data objects
  if (Array.isArray(data.data) && data.data[0]?.url) return data.data[0].url;
  if (Array.isArray(data.data) && typeof data.data[0] === 'string') return data.data[0];
  // images array
  if (data.images?.[0]?.url) return data.images[0].url;
  if (typeof data.images?.[0] === 'string') return data.images[0];
  // String data
  if (typeof data.data === 'string' && data.data.startsWith('http')) return data.data;
  // output array (some models)
  if (Array.isArray(data.output) && data.output[0]) return data.output[0];
  // base64
  if (data.data?.base64) return `data:image/png;base64,${data.data.base64}`;
  if (data.base64) return `data:image/png;base64,${data.base64}`;
  // Log full data for debugging
  console.warn('[Router] Unknown response shape:', JSON.stringify(data).substring(0, 200));
  return null;
}

// ── Native image generation (beta.vertexapis.com) ─
async function generateImageNative({ prompt, referenceBase64, overrideModel }) {
  const modelToUse = overrideModel || CONFIG.IMAGE_MODEL;
  const parts = [];
  if (referenceBase64) {
    const mimeMatch = referenceBase64.match(/^data:([^;]+);base64,/);
    const mimeType  = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    parts.push({ inlineData: { mimeType, data: dataUrlToBase64(referenceBase64) } });
    parts.push({ text: `Using the furniture item in this image as reference, place it in the following background scene. Keep the furniture exactly as-is, only replace/add the background: ${prompt}` });
  } else {
    parts.push({ text: prompt });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 1.0, topP: 0.95 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' }
    ]
  };

  const url = `${CONFIG.NATIVE_API_BASE}/v1/projects/test/locations/global/publishers/google/models/${CONFIG.IMAGE_MODEL}:generateContent?key=${CONFIG.API_KEY}`;
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Native image API ${response.status}: ${errText.substring(0, 100)}`);
  }

  const data = await response.json();
  for (const part of (data?.candidates?.[0]?.content?.parts || [])) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || 'image/png';
      return { success: true, url: `data:${mime};base64,${part.inlineData.data}`, source: 'native' };
    }
  }
  const textPart = (data?.candidates?.[0]?.content?.parts || []).find(p => p.text);
  throw new Error(textPart ? `Model returned text: ${textPart.text.substring(0, 80)}` : 'No image data in response');
}

// ── Wrapper image generation (gemini.vertexapis.com) ─
async function generateImageWrapper({ prompt, referenceBase64, referenceUrl }) {
  const maxAttempts = CONFIG.IMG_MAX_RETRIES + 1;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) await sleep(CONFIG.IMG_RETRY_DELAY);
    try {
      const body = { prompt };
      if (referenceBase64) body.referenceBase64 = referenceBase64;
      if (referenceUrl)   body.referenceUrl    = referenceUrl;

      const response = await fetch(`${CONFIG.IMAGE_API_BASE}${CONFIG.IMAGE_ENDPOINT}?key=${CONFIG.API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.API_KEY}`, 'x-api-key': CONFIG.API_KEY },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `Wrapper API ${response.status}`;
        try { const j = JSON.parse(errText); errMsg = j.error || j.message || errMsg; } catch {}
        if (response.status >= 400 && response.status < 500) throw new Error(errMsg);
        lastError = new Error(errMsg); continue;
      }

      const data = await response.json();
      if (!data.success || !data.url) { lastError = new Error(data.error || 'No URL in response'); continue; }
      return { ...data, source: 'wrapper' };

    } catch (err) {
      if (attempt === maxAttempts) throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('Image generation failed after all retries');
}

// ── Start Video Generation ──────────────────────
// Routes through local Node.js proxy to avoid CORS / network blocks
async function startVideoGeneration({ prompt, aspectRatio, resolution, durationSeconds, generateAudio, referenceBase64 }) {
  SESSION.increment();

  const body = {
    prompt,
    aspectRatio:      aspectRatio     || '16:9',
    resolution:       resolution      || '1080p',
    durationSeconds:  durationSeconds || 8,
    generateAudio:    generateAudio !== undefined ? generateAudio : true,
    personGeneration: 'allow_adult',
    model:            'veo-3.1-generate',
    // Proxy meta-fields (stripped server-side before forwarding)
    _apiKey:    CONFIG.API_KEY,
    _endpoint:  `${CONFIG.IMAGE_API_BASE}${CONFIG.VIDEO_ENDPOINT}`
  };
  if (referenceBase64) body.referenceBase64 = referenceBase64;

  // Use local proxy endpoint — avoids browser CORS restriction
  const proxyUrl = `${window.location.origin}/proxy/video`;

  const response = await fetch(proxyUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Video API ${response.status}`;
    try { const j = JSON.parse(errText); errMsg = j.error || j.message || errMsg; } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  if (!data.jobId) throw new Error('No jobId in video response');
  return data.jobId;
}

// ── Poll Video Status ───────────────────────────
async function pollVideoStatus(jobId, onProgress) {
  const start = Date.now();
  while (true) {
    if (Date.now() - start > CONFIG.POLL_TIMEOUT) throw new Error('Video generation timed out');
    await sleep(CONFIG.POLL_INTERVAL);

    // Use proxy for status too
    const proxyUrl = `${window.location.origin}/proxy/video-status/${jobId}?key=${encodeURIComponent(CONFIG.API_KEY)}&base=${encodeURIComponent(CONFIG.IMAGE_API_BASE)}`;

    const res    = await fetch(proxyUrl);
    const status = await res.json();

    if (status.url)   return status;
    if (status.error) throw new Error(status.error);

    const elapsed  = (Date.now() - start) / 1000;
    const progress = Math.min(95, Math.round((elapsed / 90) * 100));
    if (onProgress) onProgress(progress, elapsed);
  }
}

// ── Chat with Gemini ────────────────────────────
async function chatWithGemini(messages) {
  SESSION.increment();

  const systemMsg = messages[0]?.role === 'model' ? messages[0].content : '';
  const chatMsgs  = messages.slice(systemMsg ? 1 : 0);

  const contents = [];
  if (systemMsg) {
    contents.push({ role: 'user',  parts: [{ text: `[System]: ${systemMsg}` }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
  }
  chatMsgs.forEach(m => {
    contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] });
  });

  const body = {
    contents,
    generationConfig: { temperature: 1.0, maxOutputTokens: 4096, topP: 0.95 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'OFF' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'OFF' },
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'OFF' }
    ]
  };

  const url = `${CONFIG.NATIVE_API_BASE}/v1/projects/test/locations/global/publishers/google/models/${CONFIG.CHAT_MODEL}:generateContent?key=${CONFIG.API_KEY}`;
  const response = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Chat API ${response.status}`;
    try { const j = JSON.parse(errText); errMsg = j.error?.message || j.message || errMsg; } catch {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Gemini');
  return text;
}

// ── Utilities ────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Toast ────────────────────────────────────────
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${message}</span><button class="toast-close" onclick="this.parentElement.remove()">×</button>`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentElement) { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; setTimeout(() => toast.remove(), 300); } }, duration);
}

function showLoading(title = 'Generating...', sub = 'Please wait...') {
  document.getElementById('loadingTitle').textContent = title;
  document.getElementById('loadingSub').textContent   = sub;
  document.getElementById('loadingOverlay').style.display = 'flex';
}
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}