/* ================================================
   imageEditor.js – Single Image Editor Tab
   FurnitureVision AI / ideaepipla.gr
   ================================================ */

const ImageEditor = (() => {

  // State
  let selectedFile     = null;
  let selectedSceneId  = null;
  let selectedSize     = '1:1';
  let selectedModelId  = CONFIG.DEFAULT_IMAGE_MODEL;
  let lastGeneratedUrl = null;

  // DOM refs (set in init)
  let uploadArea, fileInput, sceneGrid,
      customPrompt, sizeGroup, generateBtn,
      previewArea, previewActions, downloadBtn, regenerateBtn,
      modelSelectorEl;

  // ── Init ───────────────────────────────────────
  function init() {
    uploadArea      = document.getElementById('editorUploadArea');
    fileInput       = document.getElementById('editorFileInput');
    sceneGrid       = document.getElementById('editorSceneGrid');
    customPrompt    = document.getElementById('editorCustomPrompt');
    sizeGroup       = document.getElementById('editorSizeGroup');
    generateBtn     = document.getElementById('editorGenerateBtn');
    previewArea     = document.getElementById('editorPreview');
    previewActions  = document.getElementById('editorPreviewActions');
    downloadBtn     = document.getElementById('editorDownloadBtn');
    regenerateBtn   = document.getElementById('editorRegenerateBtn');
    modelSelectorEl = document.getElementById('editorModelSelector');

    buildSceneGrid();
    buildModelSelector();
    bindEvents();
  }

  // ── Build model selector ───────────────────────
  function buildModelSelector() {
    if (!modelSelectorEl) return;
    modelSelectorEl.innerHTML = IMAGE_MODELS.map(m => `
      <button class="model-card ${m.id === selectedModelId ? 'active' : ''}"
              data-model-id="${m.id}"
              title="${m.desc}\n${m.note}">
        <span class="model-card-name">${m.name}</span>
        <span class="model-card-provider" style="color:${m.providerColor}">${m.provider}</span>
        <span class="model-card-badge" style="background:${m.badgeColor}20;color:${m.badgeColor};border:1px solid ${m.badgeColor}40">${m.badge}</span>
        <span class="model-card-speed">${m.speedLabel}</span>
        ${!m.supportsReference ? '<span class="model-card-warn" title="Δεν υποστηρίζει reference εικόνα">⚠ No Ref</span>' : ''}
      </button>
    `).join('');
    modelSelectorEl.querySelectorAll('.model-card').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedModelId = btn.dataset.modelId;
        modelSelectorEl.querySelectorAll('.model-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateModelInfo();
      });
    });
    updateModelInfo();
  }

  function updateModelInfo() {
    const m = getImageModelById(selectedModelId);
    const infoEl = document.getElementById('editorModelInfo');
    if (!infoEl) return;
    infoEl.innerHTML = `
      <span style="font-weight:600;color:var(--text)">${m.name}</span>
      <span style="color:var(--text-2);font-size:12px">${m.desc}</span>
      ${!m.supportsReference ? '<span style="color:#f59e0b;font-size:11px">⚠️ Reference εικόνα αγνοείται για αυτό το μοντέλο</span>' : ''}
    `;
  }

  // ── Build scene buttons ────────────────────────
  function buildSceneGrid() {
    sceneGrid.innerHTML = '';
    SCENES.forEach(scene => {
      const btn = document.createElement('button');
      btn.className   = 'scene-btn';
      btn.dataset.id  = scene.id;
      btn.title       = scene.name;
      btn.innerHTML   = `<span class="scene-icon">${scene.icon}</span><span>${scene.name}</span>`;
      btn.addEventListener('click', () => selectScene(scene.id, btn));
      sceneGrid.appendChild(btn);
    });
  }

  // ── Scene selection ────────────────────────────
  function selectScene(id, btn) {
    selectedSceneId = (selectedSceneId === id) ? null : id;
    sceneGrid.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
    if (selectedSceneId) btn.classList.add('active');
    updateGenerateBtn();
  }

  // ── Bind events ────────────────────────────────
  function bindEvents() {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', e => {
      e.preventDefault(); uploadArea.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    });
    fileInput.addEventListener('change', e => { if (e.target.files[0]) handleFileSelect(e.target.files[0]); });

    sizeGroup.querySelectorAll('.size-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        sizeGroup.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.size;
      });
    });

    generateBtn.addEventListener('click', handleGenerate);
    downloadBtn.addEventListener('click', () => {
      if (lastGeneratedUrl) {
        const sceneName = selectedSceneId ? (getSceneById(selectedSceneId)?.name || 'bg') : 'custom';
        downloadImageFromUrl(lastGeneratedUrl, `ideaepipla-${sceneName.replace(/\s+/g, '-')}-${Date.now()}.png`);
      }
    });
    regenerateBtn.addEventListener('click', handleGenerate);
    customPrompt.addEventListener('input', updateGenerateBtn);
  }

  // ── Handle file selection ──────────────────────
  function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) { showToast('Please select a valid image file (JPG or PNG)', 'error'); return; }
    selectedFile = file;

    const reader = new FileReader();
    reader.onload = e => {
      // Rebuild upload area with preview
      uploadArea.innerHTML = '';
      uploadArea.classList.add('has-image');

      const inner = document.createElement('div');
      inner.className = 'upload-zone-inner';

      const img = document.createElement('img');
      img.className = 'upload-thumb';
      img.src       = e.target.result;
      img.alt       = file.name;

      const title = document.createElement('p');
      title.className = 'upload-main';
      title.style.color = 'var(--green)';
      title.textContent = `✓ ${file.name}`;

      const hint = document.createElement('p');
      hint.className   = 'upload-hint';
      hint.textContent = `${(file.size / 1024).toFixed(0)} KB – Click to change`;

      const newInput = document.createElement('input');
      newInput.type   = 'file';
      newInput.id     = 'editorFileInput';
      newInput.accept = 'image/*';
      newInput.hidden = true;
      newInput.addEventListener('change', ev => { if (ev.target.files[0]) handleFileSelect(ev.target.files[0]); });

      inner.appendChild(img);
      inner.appendChild(title);
      inner.appendChild(hint);
      inner.appendChild(newInput);
      uploadArea.appendChild(inner);
      fileInput = newInput;
    };
    reader.readAsDataURL(file);
    updateGenerateBtn();
  }

  // ── Update generate button state ───────────────
  function updateGenerateBtn() {
    const hasFile   = !!selectedFile;
    const hasScene  = !!selectedSceneId;
    const hasPrompt = customPrompt.value.trim().length > 0;
    generateBtn.disabled = !(hasFile && (hasScene || hasPrompt));
  }

  // ── Handle generate ────────────────────────────
  async function handleGenerate() {
    if (!selectedFile) { showToast('Please upload a furniture image first', 'warning'); return; }
    if (!selectedSceneId && !customPrompt.value.trim()) {
      showToast('Please choose a background scene or write a custom prompt', 'warning');
      return;
    }

    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    generateBtn.innerHTML = '<div class="spinner-ring" style="width:18px;height:18px;border-width:2px;margin:0 auto"></div>';

    showLoading('Generating Image…', 'AI is adding the background — 5 to 30 seconds');

    try {
      const base64 = await fileToBase64(selectedFile);
      const scene  = getSceneById(selectedSceneId);
      const prompt = buildImagePrompt(scene, customPrompt.value, selectedSize);
      const result = await generateImage({ prompt, referenceBase64: base64, modelId: selectedModelId });

      showResult(result.url);
      showToast('✅ Εικόνα δημιουργήθηκε!', 'success');

      // Save to Gallery
      const sceneName = scene ? scene.name : 'Custom';
      const filename  = `ideaepipla-${sceneName.replace(/\s+/g, '-')}-${Date.now()}.png`;
      Gallery.addItem({ type: 'image', url: result.url, name: filename, scene: sceneName, sourceName: selectedFile.name });

    } catch (err) {
      console.error('Image generation error:', err);
      showToast(`Generation failed: ${err.message}`, 'error');
    } finally {
      hideLoading();
      generateBtn.disabled = false;
      generateBtn.classList.remove('loading');
      generateBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
        Generate Image`;
      updateGenerateBtn();
    }
  }

  // ── Show generated result ──────────────────────
  // Uses createElement + absolute positioning to reliably fill the preview area
  function showResult(url) {
    lastGeneratedUrl = url;

    // Clear previous content and switch to block layout
    previewArea.innerHTML = '';
    previewArea.style.display    = 'block';
    previewArea.style.background = '#000';

    const img = document.createElement('img');
    // Absolute fill so the image always covers the preview container
    img.style.cssText = `
      display: block;
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #1a1a2e;
    `;
    img.alt     = 'Generated furniture background';
    img.onerror = () => {
      previewArea.innerHTML = '';
      previewArea.style.display    = 'flex';
      previewArea.style.background = '';
      const msg = document.createElement('div');
      msg.className  = 'preview-empty';
      msg.innerHTML  = `<p style="color:var(--red)">⚠️ Failed to display image.</p><p class="preview-hint">Try downloading it below.</p>`;
      previewArea.appendChild(msg);
    };

    previewArea.appendChild(img);
    // Set src AFTER append — critical for large data URLs
    setTimeout(() => { img.src = url; }, 0);

    previewActions.style.display = 'flex';
  }

  return { init };

})();