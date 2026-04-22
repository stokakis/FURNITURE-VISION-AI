/* ================================================
   videoGenerator.js – Video Generator Tab
   FurnitureVision AI / ideaepipla.gr  v1.4
   ================================================ */

const VideoGenerator = (() => {

  // State
  let referenceFile  = null;
  let isGenerating   = false;
  let currentJobId   = null;
  let videoServiceOk = null;   // null=unknown, true=ok, false=down

  // DOM refs
  let uploadArea, fileInput, promptInput,
      generateBtn, videoPreview;

  // ── Init ───────────────────────────────────────
  function init() {
    uploadArea   = document.getElementById('videoUploadArea');
    fileInput    = document.getElementById('videoFileInput');
    promptInput  = document.getElementById('videoPrompt');
    generateBtn  = document.getElementById('videoGenerateBtn');
    videoPreview = document.getElementById('videoPreview');

    bindEvents();
  }

  // ── Called when Video tab is opened ───────────
  function onTabOpen() {
    checkVideoService();
  }

  // ── Check video service health ─────────────────
  async function checkVideoService() {
    const banner = document.getElementById('videoServiceBanner');
    if (banner) banner.style.display = 'none';

    try {
      const resp = await fetch('/proxy/check-video-service', { signal: AbortSignal.timeout(8000) });
      const data = await resp.json();

      if (data.ok) {
        videoServiceOk = true;
        showServiceBanner('online', '🟢 Veo video service is online and ready.');
      } else {
        videoServiceOk = false;
        showServiceBanner('offline',
          `🔴 Veo video service is currently unavailable (${data.status || 502}). ` +
          `<a href="https://cortexai.com.tr/status" target="_blank" style="color:#fff;font-weight:700;text-decoration:underline;">Check status ↗</a>`
        );
      }
    } catch {
      videoServiceOk = false;
      showServiceBanner('offline',
        '🔴 Cannot reach Veo service. ' +
        '<a href="https://cortexai.com.tr/status" target="_blank" style="color:#fff;font-weight:700;text-decoration:underline;">Check Cortex AI status ↗</a>'
      );
    }
  }

  // ── Show / hide service banner ─────────────────
  function showServiceBanner(type, html) {
    let banner = document.getElementById('videoServiceBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'videoServiceBanner';
      // Insert at top of video tab section
      const section = document.getElementById('tab-video-generator');
      if (section) section.insertBefore(banner, section.firstChild);
    }

    banner.style.cssText = [
      'display:flex', 'align-items:center', 'gap:10px',
      'padding:10px 16px', 'border-radius:10px', 'font-size:13px',
      'font-weight:500', 'margin-bottom:14px', 'flex-wrap:wrap',
      type === 'online'
        ? 'background:#D1FAE5;color:#065F46;border:1px solid #6EE7B7'
        : 'background:#EF4444;color:#fff;border:1px solid #DC2626'
    ].join(';');

    const refreshBtn = `<button onclick="VideoGenerator._recheckService()" style="margin-left:auto;background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.4);border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;color:inherit;">↻ Recheck</button>`;
    banner.innerHTML = `<span>${html}</span>${refreshBtn}`;
  }

  // ── Bind events ────────────────────────────────
  function bindEvents() {
    // Upload area
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', e => {
      e.preventDefault(); uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    });
    fileInput.addEventListener('change', e => {
      if (e.target.files[0]) handleFileSelect(e.target.files[0]);
    });

    // Quick prompt chips
    document.querySelectorAll('.quick-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        promptInput.value = btn.dataset.prompt;
        promptInput.focus();
        promptInput.dispatchEvent(new Event('input'));
      });
    });

    // Radio pills — CSS :has(input:checked) handles visual state
    document.querySelectorAll('input[name="aspect"], input[name="resolution"]').forEach(radio => {
      radio.addEventListener('change', () => {});
    });

    // Generate button
    generateBtn.addEventListener('click', handleGenerate);
  }

  // ── Handle reference image ─────────────────────
  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    referenceFile = file;

    const reader = new FileReader();
    reader.onload = e => {
      uploadArea.innerHTML = `
        <img class="upload-thumb" src="${e.target.result}" alt="Reference" style="max-height:80px"/>
        <p class="upload-title" style="color:var(--success);font-size:12px">✓ ${file.name}</p>
        <input type="file" id="videoFileInput" accept="image/*" hidden />
      `;
      uploadArea.classList.add('has-image');
      const newInput = uploadArea.querySelector('#videoFileInput');
      newInput.addEventListener('change', e2 => { if (e2.target.files[0]) handleFileSelect(e2.target.files[0]); });
      fileInput = newInput;
    };
    reader.readAsDataURL(file);
  }

  // ── Get current settings ───────────────────────
  function getSettings() {
    const aspectRadio     = document.querySelector('input[name="aspect"]:checked');
    const resolutionRadio = document.querySelector('input[name="resolution"]:checked');
    const durationSel     = document.getElementById('videoDuration');
    const audioToggle     = document.getElementById('videoAudio');

    return {
      aspectRatio:     aspectRadio     ? aspectRadio.value     : '16:9',
      resolution:      resolutionRadio ? resolutionRadio.value : '720p',
      durationSeconds: durationSel     ? parseInt(durationSel.value) : 8,
      generateAudio:   audioToggle     ? audioToggle.checked   : true
    };
  }

  // ── Handle generate ────────────────────────────
  async function handleGenerate() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
      showToast('Please enter a video description', 'warning');
      promptInput.focus();
      return;
    }

    // Warn if service is known to be down (but allow attempt in case it recovered)
    if (videoServiceOk === false) {
      const proceed = confirm(
        'Warning: The Veo video service appears to be down (502).\n\n' +
        'You can still try — it may have recovered.\n\n' +
        'Continue with generation attempt?'
      );
      if (!proceed) return;
    }

    if (isGenerating) return;
    isGenerating = true;

    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Starting…';

    showVideoProgress();

    try {
      const settings = getSettings();
      let referenceBase64 = null;

      if (referenceFile) {
        referenceBase64 = await fileToBase64(referenceFile);
      }

      const fullPrompt = `${prompt}, professional furniture advertisement, high quality cinematic video, suitable for Greek e-shop ideaepipla.gr`;

      showToast('Video generation started – this takes 30 to 120 seconds', 'info', 8000);

      currentJobId = await startVideoGeneration({
        prompt: fullPrompt,
        ...settings,
        referenceBase64
      });

      updateProgressStatus(`Job ID: ${currentJobId} – Polling for result…`, 10);

      const result = await pollVideoStatus(currentJobId, (progress, elapsed) => {
        const sec = Math.round(elapsed);
        updateProgressStatus(`Generating… ${sec}s elapsed`, progress);
      });

      showVideoResult(result.url, prompt);
      showToast('🎬 Video generated! Saved to Gallery.', 'success');

      // Mark service as ok
      videoServiceOk = true;
      showServiceBanner('online', '🟢 Veo video service is online and ready.');

      Gallery.addItem({
        type:       'video',
        url:        result.url,
        name:       `ideaepipla-video-${Date.now()}.mp4`,
        scene:      prompt.substring(0, 40),
        sourceName: referenceFile ? referenceFile.name : ''
      });

    } catch (err) {
      console.error('Video generation error:', err);
      const is502 = err.message.includes('502') || err.message.includes('unavailable') || err.message.includes('temporarily');

      if (is502) {
        videoServiceOk = false;
        showServiceBanner('offline',
          '🔴 Veo video service returned 502. ' +
          '<a href="https://cortexai.com.tr/status" target="_blank" style="color:#fff;font-weight:700;text-decoration:underline;">Check Cortex AI status ↗</a>'
        );

        videoPreview.innerHTML = `
          <div style="text-align:center;padding:40px 20px;width:100%">
            <div style="font-size:48px;margin-bottom:16px">🎬</div>
            <p style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px">Video Service Down (502)</p>
            <p style="font-size:13px;color:var(--text-2);margin-bottom:6px">Ο Veo server του Cortex AI είναι προσωρινά εκτός λειτουργίας.</p>
            <p style="font-size:13px;color:var(--text-2);margin-bottom:24px">Οι εικόνες (Image Editor) λειτουργούν κανονικά.</p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <a href="https://cortexai.com.tr/status" target="_blank"
                 style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:var(--brand);color:#fff;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;">
                📊 Check Status Page ↗
              </a>
              <button onclick="VideoGenerator._recheckService()"
                      style="display:inline-flex;align-items:center;gap:6px;padding:10px 18px;background:transparent;color:var(--brand);border:1.5px solid var(--brand);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
                ↻ Recheck Service
              </button>
            </div>
          </div>
        `;
        showToast('🔴 Video service is down. Check cortexai.com.tr/status', 'error', 10000);
      } else {
        showToast(`Video generation failed: ${err.message}`, 'error', 8000);
        resetPreview();
      }
    } finally {
      isGenerating = false;
      currentJobId = null;
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Generate Video`;
    }
  }

  // ── Progress UI ────────────────────────────────
  function showVideoProgress() {
    videoPreview.innerHTML = `
      <div style="text-align:center;padding:40px 20px;width:100%">
        <div class="spinner" style="margin:0 auto 20px"></div>
        <p id="videoProgressStatus" style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:12px">
          Initializing video generation…
        </p>
        <div class="video-progress" style="max-width:300px;margin:0 auto">
          <div class="video-progress-bar" id="videoProgressBar" style="width:5%"></div>
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:12px">
          Powered by Veo 3.1 – 30–120 seconds
        </p>
      </div>
    `;
  }

  function updateProgressStatus(message, percent) {
    const s = document.getElementById('videoProgressStatus');
    const b = document.getElementById('videoProgressBar');
    if (s) s.textContent = message;
    if (b) b.style.width = `${percent}%`;
  }

  // ── Show result ────────────────────────────────
  function showVideoResult(url) {
    videoPreview.innerHTML = `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;gap:12px;padding:16px">
        <video src="${url}" controls autoplay loop
          style="width:100%;flex:1;border-radius:var(--radius-sm);background:#000;min-height:300px">
        </video>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a href="${url}" download="ideaepipla-video-${Date.now()}.mp4" class="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v6h5.66V9h3.84L12 2z"/></svg>
            Download
          </a>
          <a href="${url}" target="_blank" class="btn-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            Open Tab
          </a>
          <button class="btn-secondary" onclick="VideoGenerator._regenerate()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            Regenerate
          </button>
        </div>
      </div>
    `;
  }

  function resetPreview() {
    videoPreview.innerHTML = `
      <div class="preview-empty">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="2" y="4" width="20" height="16" rx="2.5"/>
          <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" opacity=".4"/>
        </svg>
        <p>Το βίντεό σου θα εμφανιστεί εδώ</p>
        <p class="preview-hint">Generation: 30–120 δευτερόλεπτα</p>
      </div>
    `;
  }

  // ── Public API ─────────────────────────────────
  function _regenerate()     { handleGenerate(); }
  function _recheckService() { checkVideoService(); }

  return { init, onTabOpen, _regenerate, _recheckService };

})();