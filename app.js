/* ================================================
   app.js – Main Application Entry Point
   FurnitureVision AI / ideaepipla.gr  v1.3
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Initialize all modules ─────────────────────
  ImageEditor.init();
  BatchEdit.init();
  VideoGenerator.init();
  ClaudeAI.init();
  Gallery.init();

  // ── Sidebar Navigation ─────────────────────────
  const navItems    = document.querySelectorAll('.nav-item');
  const tabSections = document.querySelectorAll('.tab-section');
  const topbarTitle = document.getElementById('topbarTitle');

  const tabTitles = {
    'image-editor':    'Image Editor',
    'batch-edit':      'Batch Edit',
    'video-generator': 'Video Generator',
    'gallery':         '🖼 Gallery',
    'claude-ai':       'AI Assistant'
  };

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      if (!target) return;

      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabSections.forEach(s => s.classList.remove('active'));
      const section = document.getElementById(`tab-${target}`);
      if (section) section.classList.add('active');

      if (topbarTitle) topbarTitle.textContent = tabTitles[target] || target;

      // Refresh gallery on open
      if (target === 'gallery') Gallery.refresh();

      // Check video service when tab opened
      if (target === 'video-generator') VideoGenerator.onTabOpen();

      // Close sidebar on mobile
      if (window.innerWidth <= 860) {
        document.getElementById('sidebar').classList.remove('open');
      }
    });
  });

  // ── Sidebar toggle (mobile) ────────────────────
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar       = document.getElementById('sidebar');

  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', e => {
    if (window.innerWidth <= 860 &&
        !sidebar.contains(e.target) &&
        !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // ── Tips Panel ─────────────────────────────────
  const toggleTipsBtn = document.getElementById('toggleAssistant');
  const tipsPanel     = document.getElementById('assistantSidebar');
  const closeTipsBtn  = document.getElementById('closeSidebar');

  toggleTipsBtn.addEventListener('click', () => {
    const isOpen = tipsPanel.style.display !== 'none';
    tipsPanel.style.display = isOpen ? 'none' : 'block';
    toggleTipsBtn.style.color = isOpen ? '' : 'var(--brand)';
  });

  closeTipsBtn.addEventListener('click', () => {
    tipsPanel.style.display = 'none';
    toggleTipsBtn.style.color = '';
  });

  // ── Keyboard shortcuts ─────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      // Close gallery modal
      const gModal = document.getElementById('galleryModal');
      if (gModal && gModal.style.display !== 'none') return;
      // Close loading overlay
      const overlay = document.getElementById('loadingOverlay');
      if (overlay && overlay.style.display !== 'none') hideLoading();
      // Close tips
      tipsPanel.style.display = 'none';
    }
  });

  // ── API Status Check on startup ────────────────
  checkApiStatus();

  console.log('%c🪑 FurnitureVision AI v1.3', 'color:#7C6FFF;font-weight:bold;font-size:16px');
  console.log('%c✅ Sidebar UI | IndexedDB Gallery | Veo 3.1 Video', 'color:#10B981;font-size:12px');
});

// ── API Status ──────────────────────────────────
async function checkApiStatus() {
  const dot   = document.getElementById('apiStatusIndicator');
  const label = document.getElementById('apiStatusLabel');
  const widget = document.getElementById('apiStatusDot');

  if (label) label.textContent = 'Checking…';
  if (dot)   dot.className = 'api-status-dot';

  // Click to re-check
  if (widget && !widget._bound) {
    widget._bound = true;
    widget.addEventListener('click', checkApiStatus);
  }

  try {
    const url  = `${CONFIG.NATIVE_API_BASE}/v1/projects/test/locations/global/publishers/google/models/${CONFIG.CHAT_MODEL}:generateContent?key=${CONFIG.API_KEY}`;
    const body = { contents: [{ role: 'user', parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 5 } };
    const res  = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000)
    });

    if (res.ok) {
      if (dot)   { dot.className = 'api-status-dot online'; }
      if (label)   label.textContent = 'API Online';
      showToast('✅ API connected — ready to generate!', 'success', 3000);
    } else {
      if (dot)   dot.className = 'api-status-dot';
      if (label) label.textContent = `API ${res.status}`;
      showToast(`⚠️ API returned ${res.status}`, 'warning');
    }
  } catch (err) {
    if (dot)   { dot.className = 'api-status-dot offline'; }
    if (label) label.textContent = 'API Offline';
    showToast('⚠️ Cannot reach API. Use START_APP.bat to avoid CORS errors.', 'error', 8000);
  }
}