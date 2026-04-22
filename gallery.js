/* ================================================
   gallery.js – Persistent Gallery (IndexedDB)
   FurnitureVision AI / ideaepipla.gr
   ================================================ */

const Gallery = (() => {

  const DB_NAME    = 'FurnitureVisionAI';
  const DB_VERSION = 1;
  const STORE      = 'gallery';

  let db       = null;
  let allItems = [];

  // DOM refs
  let galleryGrid, galleryCount, searchInput,
      filterType, filterScene, clearAllBtn, emptyState;

  // ── Open IndexedDB ──────────────────────────────
  function openDB() {
    return new Promise((resolve, reject) => {
      if (db) { resolve(db); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains(STORE)) {
          const store = d.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('type',      'type',      { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror   = () => reject(req.error);
    });
  }

  async function dbPut(item) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(item);
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  }

  async function dbGetAll() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = d.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => resolve(req.result.sort((a, b) => b.timestamp - a.timestamp));
      req.onerror   = () => reject(req.error);
    });
  }

  async function dbDelete(id) {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  }

  async function dbClear() {
    const d = await openDB();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  }

  // ── Init ───────────────────────────────────────
  function init() {
    galleryGrid  = document.getElementById('galleryGrid');
    galleryCount = document.getElementById('galleryCount');
    searchInput  = document.getElementById('gallerySearch');
    filterType   = document.getElementById('galleryFilterType');
    filterScene  = document.getElementById('galleryFilterScene');
    clearAllBtn  = document.getElementById('galleryClearAll');

    if (!galleryGrid) return; // tab not in DOM yet

    bindEvents();
    loadGallery();
  }

  function bindEvents() {
    searchInput.addEventListener('input',  applyFilter);
    filterType.addEventListener('change',  applyFilter);
    filterScene.addEventListener('change', applyFilter);

    clearAllBtn.addEventListener('click', async () => {
      if (!allItems.length) return;
      if (!confirm(`Delete all ${allItems.length} items from the gallery? This cannot be undone.`)) return;
      await dbClear();
      allItems = [];
      renderGrid(allItems);
      updateCount(0);
      showToast('Gallery cleared', 'info');
    });

    // Modal close
    document.getElementById('galleryModalClose').addEventListener('click', closeModal);
    document.getElementById('galleryModalBg').addEventListener('click', closeModal);

    // Modal download
    document.getElementById('galleryModalDownload').addEventListener('click', () => {
      const modal = document.getElementById('galleryModal');
      const id    = modal.dataset.itemId;
      const item  = allItems.find(i => i.id === id);
      if (item) downloadImageFromUrl(item.url, item.name);
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ── Load gallery from DB ───────────────────────
  async function loadGallery() {
    try {
      allItems = await dbGetAll();
      populateSceneFilter();
      renderGrid(allItems);
      updateCount(allItems.length);
    } catch (err) {
      console.error('Gallery load error:', err);
      if (galleryGrid) galleryGrid.innerHTML = '<p style="padding:20px;color:var(--danger)">Could not load gallery.</p>';
    }
  }

  // ── Populate scene filter dropdown ────────────
  function populateSceneFilter() {
    const scenes = [...new Set(allItems.map(i => i.scene).filter(Boolean))].sort();
    while (filterScene.options.length > 1) filterScene.remove(1);
    scenes.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      filterScene.appendChild(opt);
    });
  }

  // ── Apply search + filters ─────────────────────
  function applyFilter() {
    const q     = searchInput.value.trim().toLowerCase();
    const type  = filterType.value;
    const scene = filterScene.value;

    const filtered = allItems.filter(item => {
      const matchQ = !q ||
        item.name.toLowerCase().includes(q) ||
        (item.scene      && item.scene.toLowerCase().includes(q)) ||
        (item.sourceName && item.sourceName.toLowerCase().includes(q));
      const matchT = !type  || item.type  === type;
      const matchS = !scene || item.scene === scene;
      return matchQ && matchT && matchS;
    });

    renderGrid(filtered);
    updateCount(filtered.length, allItems.length);
  }

  // ── Render grid ────────────────────────────────
  function renderGrid(items) {
    galleryGrid.innerHTML = '';

    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'gallery-empty';
      empty.innerHTML = `
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#C7C7CC" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
        <p>Δεν υπάρχουν αποτελέσματα</p>
        <p style="font-size:12px;color:var(--text-muted)">Δημιούργησε εικόνες ή βίντεο και θα εμφανιστούν εδώ αυτόματα.</p>
      `;
      galleryGrid.appendChild(empty);
      return;
    }

    items.forEach(item => galleryGrid.appendChild(createCard(item)));
  }

  // ── Create gallery card ────────────────────────
  function createCard(item) {
    const card = document.createElement('div');
    card.className = 'gallery-card';
    card.dataset.id = item.id;

    // Media element
    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src   = item.url;
      video.muted = true;
      video.loop  = true;
      video.className = 'gallery-card-media';
      video.addEventListener('mouseenter', () => video.play().catch(() => {}));
      video.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
      card.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.className = 'gallery-card-media';
      img.alt      = item.name;
      img.loading  = 'lazy';
      img.onerror  = () => { img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect fill="%23f5f5f7" width="100%25" height="100%25"/></svg>'; };
      img.src      = item.url;
      card.appendChild(img);
    }

    // Type badge
    const badge = document.createElement('div');
    badge.className = 'gallery-card-badge ' + (item.type === 'video' ? 'badge-video' : 'badge-image');
    badge.textContent = item.type === 'video' ? '🎬 Video' : '🖼 Image';
    card.appendChild(badge);

    // Overlay with buttons
    const overlay = document.createElement('div');
    overlay.className = 'gallery-card-overlay';

    const dlBtn = document.createElement('button');
    dlBtn.className = 'gallery-action-btn';
    dlBtn.title     = 'Download';
    dlBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v6h5.66V9h3.84L12 2z"/></svg>`;
    dlBtn.addEventListener('click', e => {
      e.stopPropagation();
      downloadImageFromUrl(item.url, item.name);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'gallery-action-btn gallery-action-delete';
    delBtn.title     = 'Delete';
    delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12a2 2 0 002 2h8a2 2 0 002-2V7z"/></svg>`;
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await dbDelete(item.id);
      allItems = allItems.filter(i => i.id !== item.id);
      card.style.animation = 'fadeOut .2s ease forwards';
      setTimeout(() => {
        card.remove();
        updateCount(allItems.length);
      }, 200);
      showToast('Διαγράφηκε από τη γκαλερί', 'info', 2000);
    });

    overlay.appendChild(dlBtn);
    overlay.appendChild(delBtn);
    card.appendChild(overlay);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'gallery-card-footer';

    const date = new Date(item.timestamp).toLocaleDateString('el-GR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    footer.innerHTML = `
      <span class="gallery-card-scene" title="${item.scene || 'Custom'}">${item.scene || 'Custom'}</span>
      <span class="gallery-card-date">${date}</span>
    `;
    card.appendChild(footer);

    // Click = full preview
    card.addEventListener('click', () => openModal(item));

    return card;
  }

  // ── Update count label ─────────────────────────
  function updateCount(shown, total) {
    if (total === undefined || shown === total) {
      galleryCount.textContent = `${shown} ${shown === 1 ? 'αρχείο' : 'αρχεία'}`;
    } else {
      galleryCount.textContent = `${shown} από ${total} αρχεία`;
    }
  }

  // ── Modal: open ────────────────────────────────
  function openModal(item) {
    const modal     = document.getElementById('galleryModal');
    const mediaWrap = document.getElementById('galleryModalMedia');
    mediaWrap.innerHTML = '';

    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src      = item.url;
      video.controls = true;
      video.autoplay = true;
      video.className = 'gallery-modal-media';
      mediaWrap.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src       = item.url;
      img.alt       = item.name;
      img.className = 'gallery-modal-media';
      mediaWrap.appendChild(img);
    }

    document.getElementById('galleryModalName').textContent  = item.name;
    document.getElementById('galleryModalScene').textContent = item.scene || 'Custom';
    const date = new Date(item.timestamp).toLocaleString('el-GR');
    document.getElementById('galleryModalDate').textContent  = date;

    modal.dataset.itemId = item.id;
    modal.style.display  = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // ── Modal: close ───────────────────────────────
  function closeModal() {
    const modal = document.getElementById('galleryModal');
    if (modal.style.display === 'none') return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
    // Stop any playing video
    modal.querySelectorAll('video').forEach(v => v.pause());
  }

  // ── Public: add item (called by other modules) ─
  async function addItem({ type = 'image', url, name, scene = '', sourceName = '' }) {
    try {
      const item = {
        id:         `gal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        type,
        url,
        name:       name || `furniture-${Date.now()}.png`,
        scene,
        sourceName,
        timestamp:  Date.now()
      };
      await dbPut(item);
      allItems.unshift(item);

      // Refresh grid if gallery tab is active
      const tab = document.getElementById('tab-gallery');
      if (tab && tab.classList.contains('active')) {
        populateSceneFilter();
        renderGrid(allItems);
        updateCount(allItems.length);
      }

      // Update gallery badge count
      updateNavBadge();
    } catch (err) {
      console.warn('Gallery addItem error:', err);
    }
  }

  // ── Update nav badge ───────────────────────────
  function updateNavBadge() {
    const badge = document.getElementById('galleryNavBadge');
    if (!badge) return;
    badge.textContent = allItems.length;
    badge.style.display = allItems.length > 0 ? 'inline-flex' : 'none';
  }

  // ── Refresh (call when switching to gallery tab) ─
  async function refresh() {
    await loadGallery();
  }

  return { init, addItem, refresh };

})();