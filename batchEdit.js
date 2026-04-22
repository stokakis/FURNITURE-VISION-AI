/* ================================================
   batchEdit.js – Batch Processing Tab
   FurnitureVision AI / ideaepipla.gr  v1.5
   ================================================ */

const BatchEdit = (() => {

  // State
  let images          = [];
  let selectedScenes  = [];
  let selectedSize    = '1:1';
  let selectedModelId = CONFIG.DEFAULT_IMAGE_MODEL;
  let isProcessing    = false;

  // DOM refs
  let uploadArea, fileInput, sceneGrid, sizeGroup,
      generateBtn, clearBtn, batchGrid, batchCount,
      batchDone, batchPending, batchResults, batchResultsGrid,
      downloadAllBtn, modelSelectorEl;

  // ── Init ───────────────────────────────────────
  function init() {
    uploadArea       = document.getElementById('batchUploadArea');
    fileInput        = document.getElementById('batchFileInput');
    sceneGrid        = document.getElementById('batchSceneGrid');
    sizeGroup        = document.getElementById('batchSizeGroup');
    generateBtn      = document.getElementById('batchGenerateBtn');
    clearBtn         = document.getElementById('batchClearBtn');
    batchGrid        = document.getElementById('batchGrid');
    batchCount       = document.getElementById('batchCount');
    batchDone        = document.getElementById('batchDone');
    batchPending     = document.getElementById('batchPending');
    batchResults     = document.getElementById('batchResults');
    batchResultsGrid = document.getElementById('batchResultsGrid');
    downloadAllBtn   = document.getElementById('downloadAllBtn');
    modelSelectorEl  = document.getElementById('batchModelSelector');

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
        ${!m.supportsReference ? '<span class="model-card-warn">⚠ No Ref</span>' : ''}
      </button>
    `).join('');
    modelSelectorEl.querySelectorAll('.model-card').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedModelId = btn.dataset.modelId;
        modelSelectorEl.querySelectorAll('.model-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateBatchModelInfo();
      });
    });
    updateBatchModelInfo();
  }

  function updateBatchModelInfo() {
    const m = getImageModelById(selectedModelId);
    const infoEl = document.getElementById('batchModelInfo');
    if (!infoEl) return;
    infoEl.innerHTML = `
      <span style="font-weight:600;color:var(--text)">${m.name}</span>
      <span style="color:var(--text-2);font-size:12px">${m.desc}</span>
      ${!m.supportsReference ? '<span style="color:#f59e0b;font-size:11px">⚠️ Reference εικόνα αγνοείται για αυτό το μοντέλο</span>' : ''}
    `;
  }

  // ── Build scene grid (multi-select) ───────────
  function buildSceneGrid() {
    sceneGrid.innerHTML = '';
    SCENES.forEach(scene => {
      const btn = document.createElement('button');
      btn.className  = 'scene-btn';
      btn.dataset.id = scene.id;
      btn.innerHTML  = `<span class="scene-icon">${scene.icon}</span><span>${scene.name}</span>`;
      btn.addEventListener('click', () => toggleScene(scene.id, btn));
      sceneGrid.appendChild(btn);
    });
  }

  // ── Toggle scene in multi-select ──────────────
  function toggleScene(id, btn) {
    const idx = selectedScenes.indexOf(id);
    if (idx === -1) {
      selectedScenes.push(id);
      btn.classList.add('multi-active');
    } else {
      selectedScenes.splice(idx, 1);
      btn.classList.remove('multi-active');
    }
    updateGenerateBtn();
  }

  // ── Bind events ────────────────────────────────
  function bindEvents() {
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', e => {
      e.preventDefault(); uploadArea.classList.remove('drag-over');
      handleFiles(Array.from(e.dataTransfer.files));
    });
    fileInput.addEventListener('change', e => handleFiles(Array.from(e.target.files)));

    sizeGroup.querySelectorAll('.size-btn, .size-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        sizeGroup.querySelectorAll('.size-btn, .size-pill').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedSize = btn.dataset.size;
      });
    });

    generateBtn.addEventListener('click', handleBatchGenerate);
    clearBtn.addEventListener('click', clearAll);
    downloadAllBtn.addEventListener('click', downloadAll);
  }

  // ── Handle added files ─────────────────────────
  function handleFiles(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) { showToast('No valid image files found', 'warning'); return; }

    imageFiles.forEach(file => {
      images.push({
        id:        `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        name:      file.name,
        status:    'pending',
        resultUrl: null
      });
    });

    renderBatchGrid();
    updateStats();
    updateGenerateBtn();
  }

  // ── Render batch image grid ────────────────────
  function renderBatchGrid() {
    if (!images.length) {
      batchGrid.innerHTML = `
        <div class="batch-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="1">
            <rect x="2" y="6" width="20" height="14" rx="2"/>
            <path d="M16 2H8L6 6h12l-2-4z"/>
          </svg>
          <p>No images added yet</p>
        </div>`;
      return;
    }

    batchGrid.innerHTML = '';
    images.forEach(img => {
      const item = document.createElement('div');
      item.className = 'batch-item';
      item.id        = `bitem-${img.id}`;

      const statusIcons = { pending: '⏳', processing: '⚙️', done: '✓', error: '✗' };

      const reader = new FileReader();
      reader.onload = e => {
        const thumb = document.createElement('img');
        thumb.src = e.target.result;
        thumb.alt = img.name;

        const removeBtn = document.createElement('button');
        removeBtn.className  = 'batch-item-remove';
        removeBtn.dataset.id = img.id;
        removeBtn.title      = 'Remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', ev => {
          ev.stopPropagation();
          removeImage(img.id);
        });

        const statusEl = document.createElement('div');
        statusEl.className = `batch-item-status ${img.status}`;
        statusEl.textContent = statusIcons[img.status];

        const infoEl = document.createElement('div');
        infoEl.className   = 'batch-item-info';
        infoEl.textContent = img.name;

        item.appendChild(thumb);
        item.appendChild(removeBtn);
        item.appendChild(statusEl);
        item.appendChild(infoEl);
      };
      reader.readAsDataURL(img.file);

      batchGrid.appendChild(item);
    });
  }

  // ── Update single item status ──────────────────
  function updateItemStatus(id, status) {
    const img = images.find(i => i.id === id);
    if (img) img.status = status;

    const item = document.getElementById(`bitem-${id}`);
    if (!item) return;

    const statusEl = item.querySelector('.batch-item-status');
    if (statusEl) {
      const icons = { pending: '⏳', processing: '⚙️', done: '✓', error: '✗' };
      statusEl.className   = `batch-item-status ${status}`;
      statusEl.textContent = icons[status] || '';
    }
    updateStats();
  }

  // ── Remove image ───────────────────────────────
  function removeImage(id) {
    if (isProcessing) return;
    images = images.filter(i => i.id !== id);
    renderBatchGrid();
    updateStats();
    updateGenerateBtn();
  }

  // ── Clear all ──────────────────────────────────
  function clearAll() {
    if (isProcessing) { showToast('Cannot clear while processing', 'warning'); return; }
    images         = [];
    selectedScenes = [];
    sceneGrid.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('multi-active'));
    batchResults.style.display  = 'none';
    batchResultsGrid.innerHTML  = '';
    renderBatchGrid();
    updateStats();
    updateGenerateBtn();
  }

  // ── Update stats display ───────────────────────
  function updateStats() {
    batchCount.textContent   = `Images (${images.length})`;
    const done    = images.filter(i => i.status === 'done').length;
    const pending = images.filter(i => i.status === 'pending').length;
    batchDone.textContent    = `${done} done`;
    batchPending.textContent = `${pending} pending`;
  }

  // ── Update generate button ─────────────────────
  function updateGenerateBtn() {
    generateBtn.disabled = isProcessing || images.length === 0 || selectedScenes.length === 0;
  }

  // ── Batch generate ─────────────────────────────
  async function handleBatchGenerate() {
    if (!images.length)        { showToast('Add images first', 'warning'); return; }
    if (!selectedScenes.length){ showToast('Select at least one background scene', 'warning'); return; }

    isProcessing = true;
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px"></div> Processing…';

    // Progress bar
    let progressWrap = document.getElementById('batchProgressWrap');
    if (!progressWrap) {
      progressWrap = document.createElement('div');
      progressWrap.id        = 'batchProgressWrap';
      progressWrap.className = 'batch-progress-wrap';
      progressWrap.innerHTML = '<div class="batch-progress-fill" id="batchProgressFill" style="width:0%"></div>';
      generateBtn.parentElement.insertBefore(progressWrap, generateBtn.nextSibling);
    }
    const progressFill = document.getElementById('batchProgressFill');

    // Reset statuses
    images.forEach(img => { img.status = 'pending'; img.resultUrl = null; });
    renderBatchGrid();

    const results = [];
    const total   = images.length * selectedScenes.length;
    let   done    = 0;

    const modelName = getImageModelById(selectedModelId)?.name || selectedModelId;
    showToast(`Starting batch: ${images.length} × ${selectedScenes.length} = ${total} generations (${modelName})`, 'info');

    for (const img of images) {
      for (const sceneId of selectedScenes) {
        const scene = getSceneById(sceneId);
        updateItemStatus(img.id, 'processing');

        try {
          const base64 = await fileToBase64(img.file);
          const prompt = buildImagePrompt(scene, '', selectedSize);
          const result = await generateImage({ prompt, referenceBase64: base64, modelId: selectedModelId });

          img.resultUrl = result.url;
          updateItemStatus(img.id, 'done');

          const filename = `${img.name.replace(/\.[^.]+$/, '')}_${scene.name.replace(/\s+/g, '-')}.png`;

          results.push({
            name:      filename,
            url:       result.url,
            sceneName: scene.name,
            imgName:   img.name
          });

          // Save to Gallery
          Gallery.addItem({
            type:       'image',
            url:        result.url,
            name:       filename,
            scene:      scene.name,
            sourceName: img.name
          });

          showToast(`✓ ${img.name} → ${scene.name}`, 'success', 2000);

        } catch (err) {
          updateItemStatus(img.id, 'error');
          showToast(`✗ Failed: ${img.name} (${scene.name}) – ${err.message}`, 'error', 5000);
          console.error('Batch error:', err);
        }

        done++;
        progressFill.style.width = `${Math.round((done / total) * 100)}%`;
        updateStats();

        if (done < total) await sleep(800);
      }
    }

    // Show results section
    if (results.length > 0) {
      renderResults(results);
      batchResults.style.display = 'block';
      showToast(`Batch complete! ${results.length}/${total} generated. Saved to Gallery 🖼`, 'success', 6000);
    }

    isProcessing = false;
    generateBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
      Generate Images`;
    updateGenerateBtn();
  }

  // ── Render results grid ────────────────────────
  function renderResults(results) {
    batchResultsGrid.innerHTML = '';

    results.forEach(r => {
      const item = document.createElement('div');
      item.className = 'result-item';

      const img = document.createElement('img');
      img.alt     = r.name;
      img.loading = 'lazy';
      img.onerror = () => {
        img.style.display = 'none';
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'height:150px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-muted)';
        placeholder.textContent   = 'Preview unavailable';
        item.insertBefore(placeholder, item.firstChild);
      };
      item.appendChild(img);
      img.src = r.url;

      const footer = document.createElement('div');
      footer.className = 'result-item-footer';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'result-item-name';
      nameSpan.title     = r.name;
      nameSpan.textContent = r.sceneName;

      const dlBtn = document.createElement('button');
      dlBtn.className = 'result-download-btn';
      dlBtn.title     = 'Download';
      dlBtn.textContent = '⬇';
      dlBtn.addEventListener('click', () => downloadImageFromUrl(r.url, r.name));

      footer.appendChild(nameSpan);
      footer.appendChild(dlBtn);
      item.appendChild(footer);

      batchResultsGrid.appendChild(item);
    });
  }

  // ── Download all results ───────────────────────
  async function downloadAll() {
    const btns = batchResultsGrid.querySelectorAll('.result-download-btn');
    if (!btns.length) return;
    showToast(`Downloading ${btns.length} images…`, 'info');
    const results = [];
    batchResultsGrid.querySelectorAll('.result-item').forEach(item => {
      const img  = item.querySelector('img');
      const name = item.querySelector('.result-item-name');
      if (img) results.push({ url: img.src, name: (name ? name.title : 'furniture.png') });
    });
    for (const r of results) {
      await downloadImageFromUrl(r.url, r.name);
      await sleep(400);
    }
  }

  return { init };

})();