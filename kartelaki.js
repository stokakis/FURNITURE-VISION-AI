/* ================================================
   kartelaki.js – Price Tag Generator  v2.0
   4-slot A4 layout · per-slot editing · global styling
   FurnitureVision AI / ideaepipla.gr
   ================================================ */

const Kartelaki = (() => {
  'use strict';

  const PAPER = { A4: { w: 794, h: 1123 }, A5: { w: 559, h: 794 } };
  const RENDER_SCALE = 2;

  const FONT_OPTIONS = [
    { label: 'Inter',     value: 'Inter,sans-serif' },
    { label: 'Arial',     value: 'Arial,sans-serif' },
    { label: 'Georgia',   value: 'Georgia,serif' },
    { label: 'Verdana',   value: 'Verdana,sans-serif' },
    { label: 'Trebuchet', value: "'Trebuchet MS',sans-serif" },
  ];

  const ZONE_CONFIG = {
    title:      { sizeProp: 'titleFontSize',      defaultSize: 16, colorProp: 'textColor',       fontProp: null,                  alignProp: 'titleAlign',      boldProp: 'titleBold',      italicProp: 'titleItalic',      defaultBold: true  },
    subtitle:   { sizeProp: 'subtitleFontSize',   defaultSize: 11, colorProp: 'subtitleColor',   fontProp: 'subtitleFontFamily',  alignProp: 'subtitleAlign',   boldProp: 'subtitleBold',   italicProp: 'subtitleItalic',   defaultBold: false },
    dimensions: { sizeProp: 'dimensionsFontSize', defaultSize: 11, colorProp: 'dimensionsColor', fontProp: 'dimensionsFontFamily', alignProp: 'dimensionsAlign', boldProp: 'dimensionsBold', italicProp: 'dimensionsItalic', defaultBold: false },
    colors:     { sizeProp: 'colorsFontSize',     defaultSize: 11, colorProp: 'colorsColor',     fontProp: 'colorsFontFamily',    alignProp: 'colorsAlign',     boldProp: 'colorsBold',     italicProp: 'colorsItalic',     defaultBold: false },
    origPrice:  { sizeProp: 'origPriceFontSize',  defaultSize: 12, colorProp: 'origPriceColor',  fontProp: null,                  alignProp: null,              boldProp: 'origPriceBold',  italicProp: 'origPriceItalic',  defaultBold: false },
    finalPrice: { sizeProp: 'finalPriceFontSize', defaultSize: 36, colorProp: 'priceColor',      fontProp: null,                  alignProp: null,              boldProp: null,             italicProp: null,               defaultBold: true  },
    footer:     { sizeProp: 'footerFontSize',     defaultSize: 11, colorProp: 'footerColor',     fontProp: 'footerFontFamily',    alignProp: null,              boldProp: 'footerBold',     italicProp: 'footerItalic',     defaultBold: false },
  };

  const ZONE_LABELS = {
    title: 'Τίτλος', subtitle: 'Ελεύθερο κείμενο', dimensions: 'Διαστάσεις',
    colors: 'Χρώμα', origPrice: 'Αρχ. Τιμή', finalPrice: 'Τελ. Τιμή', footer: 'Footer',
  };
  /* ── SETUP / PRESET SYSTEM ── */
  const KT_SETUPS_KEY = 'kt_setups_v1';

  // Properties captured in a setup (no product/image data, only style+layout)
  const SETUP_GLOBAL_PROPS = ['size','orientation','pageBg','accentColor','globalText','slotBg','dividerColor','fontFamily','brandText','showBrand'];
  const SETUP_SLOT_STYLE = [
    'titleFontSize','titleAlign','infoFontSize','infoFontFamily','infoColor',
    'subtitleFontSize','subtitleFontFamily','subtitleColor','subtitleAlign',
    'dimensionsFontSize','dimensionsFontFamily','dimensionsColor','dimensionsAlign',
    'colorsFontSize','colorsFontFamily','colorsColor','colorsAlign',
    'footerFontSize','footerFontFamily','footerColor',
    'origPriceColor','origPriceFontSize','finalPriceFontSize','priceColor','textColor',
    'slotBg','positions',
  ];

  function setupGetAll() {
    try { return JSON.parse(localStorage.getItem(KT_SETUPS_KEY) || '{}'); } catch { return {}; }
  }
  function setupSaveAll(obj) {
    try { localStorage.setItem(KT_SETUPS_KEY, JSON.stringify(obj)); } catch {}
  }
  function setupCapture() {
    const snap = {};
    SETUP_GLOBAL_PROPS.forEach(k => { snap[k] = st[k]; });
    snap.slots = st.slots.map(slot => {
      const s = {};
      SETUP_SLOT_STYLE.forEach(k => { if (slot[k] !== undefined) s[k] = JSON.parse(JSON.stringify(slot[k])); });
      return s;
    });
    return snap;
  }
  function setupApply(snap) {
    if (!snap) return;
    SETUP_GLOBAL_PROPS.forEach(k => { if (snap[k] !== undefined) st[k] = snap[k]; });
    if (Array.isArray(snap.slots)) {
      snap.slots.forEach((s, i) => {
        if (!st.slots[i]) return;
        SETUP_SLOT_STYLE.forEach(k => { if (s[k] !== undefined) st.slots[i][k] = JSON.parse(JSON.stringify(s[k])); });
      });
    }
  }
  function setupRefreshUI() {
    const sel = document.getElementById('kt-setup-select');
    if (!sel) return;
    const setups = setupGetAll();
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Επιλογή Setup —</option>' +
      Object.keys(setups).sort().map(n =>
        '<option value="' + n.replace(/"/g,'&quot;') + '"' + (n === cur ? ' selected' : '') + '>' + n + '</option>'
      ).join('');
  }
  function setupSave(name) {
    if (!name) return;
    const all = setupGetAll();
    all[name] = setupCapture();
    setupSaveAll(all);
    setupRefreshUI();
    const sel = document.getElementById('kt-setup-select');
    if (sel) sel.value = name;
  }
  function setupLoad(name) {
    if (!name) return;
    const all = setupGetAll();
    if (!all[name]) return;
    setupApply(all[name]);
    renderSlotButtons(); renderSlotEditor(); renderCanvas();
    // Sync global color inputs
    ['kt-g-pagebg','kt-g-accent','kt-g-text','kt-g-slotbg','kt-g-divider'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const map = {'kt-g-pagebg':'pageBg','kt-g-accent':'accentColor','kt-g-text':'globalText','kt-g-slotbg':'slotBg','kt-g-divider':'dividerColor'};
      el.value = st[map[id]] || el.value;
    });
    const brandEl = document.getElementById('kt-g-brand');
    if (brandEl) brandEl.value = st.brandText || '';
    const fontEl = document.getElementById('kt-g-font');
    if (fontEl) fontEl.value = st.fontFamily || '';
  }
  function setupDelete(name) {
    if (!name) return;
    const all = setupGetAll();
    delete all[name];
    setupSaveAll(all);
    setupRefreshUI();
  }



  function emptySlot() {
    return {
      product: null, img: null, showImg: false,
      title: '', subtitle: '', origPrice: '', finalPrice: '',
      discountPct: 0, discountLabel: '', showDiscount: true,
      dimensions: '', colors: '', footerText: '',
      slotBg: '', textColor: '', priceColor: '',
      titleFontSize: 0, titleAlign: 'center',
      // per-element styling (shared info* kept as legacy fallback)
      infoFontSize: 11, infoFontFamily: '', infoColor: '',
      subtitleFontSize: 0, subtitleFontFamily: '', subtitleColor: '', subtitleAlign: 'center',
      dimensionsFontSize: 0, dimensionsFontFamily: '', dimensionsColor: '', dimensionsAlign: 'left',
      colorsFontSize: 0, colorsFontFamily: '', colorsColor: '', colorsAlign: 'left',
      footerFontSize: 0, footerFontFamily: '', footerColor: '',
      origPriceColor: '', origPriceFontSize: 0,
      finalPriceFontSize: 0,
      positions: {}, // field -> {px,py} relative to slot (0-1)
    };
  }

  let st = {
    size: 'A4', orientation: 'portrait', activeSlot: 0,
    rows: 2, cols: 2,
    slots: [emptySlot(), emptySlot(), emptySlot(), emptySlot()],
    pageBg: '#ffffff', accentColor: '#7C6FFF', globalText: '#1a1a2e',
    slotBg: '#f8f7ff', dividerColor: '#d1d5db',
    fontFamily: 'Inter,sans-serif',
    brandText: 'ideaepipla.gr', showBrand: true,
    cacheReady: false, cacheLoading: false,
    filterActive: '1', filterCat: 0, searchResults: [],
  };

  let canvas, ctx, canvasWrap, searchInput, searchResultsEl;
  let _zones = [], _selectedZone = null;
  let _drag = null; // { slotIdx, field, startMX, startMY, startPX, startPY }

  /* ── GEOMETRY ── */
  function getDims() {
    const p  = PAPER[st.size];
    const lw = st.orientation === 'portrait' ? p.w : p.h;
    const lh = st.orientation === 'portrait' ? p.h : p.w;
    return { lw, lh, pw: lw * RENDER_SCALE, ph: lh * RENDER_SCALE };
  }
  function headerH(lh) { return Math.round(lh * 0.055); }
  function footerH(lh) { return Math.round(lh * 0.040); }
  function getSlotRect(idx, lw, lh) {
    const hdr = headerH(lh), ftr = footerH(lh);
    const inner = lh - hdr - ftr;
    const cols = st.cols || 2, rows = st.rows || 2;
    const col = idx % cols, row = Math.floor(idx / cols);
    return { x: col * (lw/cols), y: hdr + row * (inner/rows), w: lw/cols, h: inner/rows };
  }

  /* ── CANVAS RENDERING ── */
  function renderCanvas() {
    if (!canvas) return;
    _zones = [];
    const { lw, lh, pw, ph } = getDims();
    canvas.width = pw; canvas.height = ph;
    canvas.style.width = lw + 'px'; canvas.style.height = lh + 'px';
    ctx.save();
    ctx.scale(RENDER_SCALE, RENDER_SCALE);

    ctx.fillStyle = st.pageBg;
    ctx.fillRect(0, 0, lw, lh);

    const hdr = headerH(lh), ftr = footerH(lh);

    ctx.fillStyle = st.accentColor;
    ctx.fillRect(0, 0, lw, hdr);
    if (st.showBrand && st.brandText) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold ' + Math.round(hdr * 0.56) + 'px ' + st.fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText(st.brandText, lw / 2, hdr * 0.74);
    }

    ctx.fillStyle = st.accentColor;
    ctx.fillRect(0, lh - ftr, lw, ftr);

    const totalSlots = (st.rows||2) * (st.cols||2);
    for (let i = 0; i < totalSlots; i++) drawSlot(i, lw, lh);
    drawDividers(lw, lh);
    // Drag highlight
    if (_drag || _selectedZone) {
      const hz = _drag ? _zones.find(z => z.field === (_drag && _drag.field) && z.slotIdx === (_drag && _drag.slotIdx)) : _zones.find(z => z.field === _selectedZone.field && z.slotIdx === _selectedZone.slotIdx);
      if (hz) {
        ctx.strokeStyle = 'rgba(124,111,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(hz.x + 1, hz.y + 1, hz.w - 2, hz.h - 2);
        ctx.setLineDash([]);
      }
    }

    if (!_renderClean) {
      const r = getSlotRect(st.activeSlot, lw, lh);
      ctx.strokeStyle = st.accentColor;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 4]);
      ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  function drawDividers(lw, lh) {
    const hdr = headerH(lh), ftr = footerH(lh);
    const inner = lh - hdr - ftr;
    const cols = st.cols || 2, rows = st.rows || 2;
    ctx.strokeStyle = st.dividerColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    for (let c = 1; c < cols; c++) {
      ctx.beginPath(); ctx.moveTo(lw*c/cols, hdr); ctx.lineTo(lw*c/cols, lh - ftr); ctx.stroke();
    }
    for (let r = 1; r < rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, hdr + inner*r/rows); ctx.lineTo(lw, hdr + inner*r/rows); ctx.stroke();
    }
  }

  function drawSlot(idx, lw, lh) {
    const slot = st.slots[idx];
    const r    = getSlotRect(idx, lw, lh);
    const pad  = 10;
    const cx   = r.x + r.w / 2;

    // Slot background
    ctx.fillStyle = slot.slotBg || st.slotBg;
    ctx.fillRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);

    if (!slot.product) { drawEmptySlot(idx, r); return; }

    const dPct    = parseFloat(slot.discountPct) || 0;
    const infoFam = slot.infoFontFamily || st.fontFamily;
    const infoClr = slot.infoColor || slot.textColor || st.globalText;
    const infoSz  = slot.infoFontSize
      ? Math.max(6, Math.min(200, slot.infoFontSize))
      : 11;
    const titleSz = slot.titleFontSize
      ? Math.max(6, Math.min(200, slot.titleFontSize))
      : Math.max(10, Math.min(26, r.h * 0.062));
    const textClr = slot.textColor || st.globalText;

    // ── Image (only when showImg) ────────────────────────────────────────
    let contentY = r.y + pad;
    if (slot.showImg) {
      const imgH = Math.round(r.h * 0.35);
      const imgW = r.w - pad * 2;
      ctx.save();
      if (slot.img) {
        roundedClip(ctx, r.x + pad, contentY, imgW, imgH, 6);
        ctx.clip();
        const ir = slot.img.width / slot.img.height;
        const cr = imgW / imgH;
        let iw, ih, ix, iy;
        if (ir > cr) { ih = imgH; iw = ih * ir; ix = r.x + pad + (imgW - iw) / 2; iy = contentY; }
        else         { iw = imgW; ih = iw / ir; ix = r.x + pad; iy = contentY + (imgH - ih) / 2; }
        ctx.drawImage(slot.img, ix, iy, iw, ih);
      } else {
        ctx.fillStyle = '#ede9ff';
        roundedClip(ctx, r.x + pad, contentY, imgW, imgH, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(124,111,255,0.35)';
        ctx.font = Math.round(imgH * 0.28) + 'px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪱', cx, contentY + imgH * 0.64);
      }
      ctx.restore();
      contentY += imgH + 8;
    }

    // ── TITLE ────────────────────────────────────────────────────────────
    {
      const titleAlign = slot.titleAlign || 'center';
      ctx.fillStyle = textClr;
      const _tW = (slot.titleBold !== undefined ? slot.titleBold : true) ? '900' : '600';
      const _tS = slot.titleItalic ? 'italic ' : '';
      ctx.font = _tS + _tW + ' ' + titleSz + 'px ' + st.fontFamily;
      ctx.textAlign = titleAlign;
      const titleAncX = titleAlign === 'left' ? r.x + pad : titleAlign === 'right' ? r.x + r.w - pad : cx;
      const titleStr = slot.title || slot.product.name || '';
      const pos = slot.positions && slot.positions.title;
      const drawY = pos ? r.y + pos.py * r.h : contentY;
      const drawX = pos ? r.x + pos.px * r.w : titleAncX;
      const tLines = drawWrappedText(titleStr, drawX, drawY + titleSz, r.w - pad * 2, titleSz * 1.25);
      const titleZoneH = titleSz * 1.25 * (tLines + 1) + 2;
      _zoneAdd(idx, 'title', drawX - (r.w - pad*2)/2, drawY, r.w - pad * 2, titleZoneH);
      if (!pos) contentY += titleZoneH;
    }

    // ── SUBTITLE (free text) ─────────────────────────────────────────────
    if (slot.subtitle) {
      const subSz  = slot.subtitleFontSize  ? Math.max(6, slot.subtitleFontSize)  : (slot.infoFontSize ? Math.max(6, slot.infoFontSize) : 11);
      const subFam = slot.subtitleFontFamily || slot.infoFontFamily || st.fontFamily;
      const subClr = slot.subtitleColor     || slot.infoColor      || slot.textColor || st.globalText;
      const subAlign = slot.subtitleAlign || 'center';
      const subAncXDef = subAlign === 'left' ? r.x + pad : subAlign === 'right' ? r.x + r.w - pad : cx;
      const subPos = slot.positions && slot.positions.subtitle;
      const subDrawX = subPos ? r.x + subPos.px * r.w : subAncXDef;
      const subDrawY = subPos ? r.y + subPos.py * r.h : contentY;
      ctx.fillStyle = subClr;
      const _subW = slot.subtitleBold ? '700' : '400';
      const _subS = slot.subtitleItalic ? 'italic ' : '';
      ctx.font = _subS + _subW + ' ' + subSz + 'px ' + subFam;
      ctx.textAlign = subAlign;
      const subLines = drawWrappedText(slot.subtitle, subDrawX, subDrawY + subSz, r.w - pad * 2, subSz * 1.3);
      const subH = subSz * 1.3 * (subLines + 1) + 2;
      _zoneAdd(idx, 'subtitle', subDrawX - (r.w-pad*2)/2, subDrawY, r.w - pad * 2, subH);
      if (!subPos) contentY += subH;
    }

    // ── ΔΙΑΣΤ. ───────────────────────────────────────────────────────────
    if (slot.dimensions) {
      const dimSz    = slot.dimensionsFontSize  ? Math.max(6, slot.dimensionsFontSize)  : (slot.infoFontSize ? Math.max(6, slot.infoFontSize) : 11);
      const dimFam   = slot.dimensionsFontFamily || slot.infoFontFamily || st.fontFamily;
      const dimClr   = slot.dimensionsColor      || slot.infoColor      || slot.textColor || st.globalText;
      const dimAlign = slot.dimensionsAlign || 'left';
      const dimPos = slot.positions && slot.positions.dimensions;
      const dimBaseX = dimAlign === 'right' ? r.x + r.w - pad : dimAlign === 'center' ? cx : r.x + pad;
      const dimBaseY = dimPos ? r.y + dimPos.py * r.h : contentY;
      const dimBaseXFinal = dimPos ? r.x + dimPos.px * r.w : dimBaseX;
      ctx.fillStyle = dimClr;
      let dimLines;
      if (dimAlign === 'left') {
        ctx.font = '700 ' + dimSz + 'px ' + dimFam; ctx.textAlign = 'left';
        const label1 = 'ΔΙΑΣΤ.: ';
        const lw1 = ctx.measureText(label1).width;
        ctx.fillText(label1, dimBaseXFinal, dimBaseY + dimSz);
        const _dimVW = slot.dimensionsBold ? '700' : '400';
        const _dimVS = slot.dimensionsItalic ? 'italic ' : '';
        ctx.font = _dimVS + _dimVW + ' ' + dimSz + 'px ' + dimFam;
        dimLines = drawWrappedText(slot.dimensions, dimBaseXFinal + lw1, dimBaseY + dimSz, r.w - pad * 2 - lw1, dimSz * 1.3);
      } else {
        const _dimEW = slot.dimensionsBold ? '700' : '600';
        const _dimES = slot.dimensionsItalic ? 'italic ' : '';
        ctx.font = _dimES + _dimEW + ' ' + dimSz + 'px ' + dimFam; ctx.textAlign = dimAlign;
        dimLines = drawWrappedText('ΔΙΑΣΤ.: ' + slot.dimensions, dimBaseXFinal, dimBaseY + dimSz, r.w - pad * 2, dimSz * 1.3);
      }
      const dimH = dimSz * 1.3 * (dimLines + 1) + 1;
      _zoneAdd(idx, 'dimensions', dimBaseXFinal - (r.w-pad*2)/2, dimBaseY, r.w - pad * 2, dimH);
      if (!dimPos) contentY += dimH;
    }

    // ── ΧΡΩΜΑ ────────────────────────────────────────────────────────────
    if (slot.colors) {
      const colSz    = slot.colorsFontSize  ? Math.max(6, slot.colorsFontSize)  : (slot.infoFontSize ? Math.max(6, slot.infoFontSize) : 11);
      const colFam   = slot.colorsFontFamily || slot.infoFontFamily || st.fontFamily;
      const colClr   = slot.colorsColor      || slot.infoColor      || slot.textColor || st.globalText;
      const colAlign = slot.colorsAlign || 'left';
      const colPos = slot.positions && slot.positions.colors;
      const colBaseX = colAlign === 'right' ? r.x + r.w - pad : colAlign === 'center' ? cx : r.x + pad;
      const colBaseY = colPos ? r.y + colPos.py * r.h : contentY;
      const colBaseXFinal = colPos ? r.x + colPos.px * r.w : colBaseX;
      ctx.fillStyle = colClr;
      let colLines;
      if (colAlign === 'left') {
        ctx.font = '700 ' + colSz + 'px ' + colFam; ctx.textAlign = 'left';
        const label2 = 'ΧΡΩΜΑ: ';
        const lw2 = ctx.measureText(label2).width;
        ctx.fillText(label2, colBaseXFinal, colBaseY + colSz);
        const _colVW = slot.colorsBold ? '700' : '400';
        const _colVS = slot.colorsItalic ? 'italic ' : '';
        ctx.font = _colVS + _colVW + ' ' + colSz + 'px ' + colFam;
        colLines = drawWrappedText(slot.colors, colBaseXFinal + lw2, colBaseY + colSz, r.w - pad * 2 - lw2, colSz * 1.3);
      } else {
        const _colEW = slot.colorsBold ? '700' : '600';
        const _colES = slot.colorsItalic ? 'italic ' : '';
        ctx.font = _colES + _colEW + ' ' + colSz + 'px ' + colFam; ctx.textAlign = colAlign;
        colLines = drawWrappedText('ΧΡΩΜΑ: ' + slot.colors, colBaseXFinal, colBaseY + colSz, r.w - pad * 2, colSz * 1.3);
      }
      const colH = colSz * 1.3 * (colLines + 1) + 4;
      _zoneAdd(idx, 'colors', colBaseXFinal - (r.w-pad*2)/2, colBaseY, r.w - pad * 2, colH);
      if (!colPos) contentY += colH;
    }

    // ── DISCOUNT BADGE (top-right) ────────────────────────────────────────
    if (dPct > 0.5 && slot.showDiscount !== false) {
      const br  = Math.min(r.w, r.h) * 0.085;
      const bxC = r.x + r.w - pad - br;
      const byC = r.y + pad + br;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 4;
      ctx.fillStyle = '#e53e3e';
      ctx.beginPath(); ctx.arc(bxC, byC, br, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = '900 ' + Math.round(br * 0.52) + 'px ' + st.fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText(slot.discountLabel || ('-' + Math.round(dPct) + '%'), bxC, byC + br * 0.2);
    }

    // ── Calculate remaining space for prices ──────────────────────────────
    const footerSz   = slot.footerText ? infoSz * 1.3 + 4 : 0;
    const bottomY    = r.y + r.h - pad - footerSz;
    const spaceLeft  = bottomY - contentY;

    // ORIGINAL PRICE — "ΑΠΟ Xε"
    if (slot.origPrice) {
      const origSz = slot.origPriceFontSize ? Math.max(6, slot.origPriceFontSize) : Math.max(9, Math.min(16, r.h * 0.038));
      const origTxt = 'ΑΠΟ ' + formatPrice(slot.origPrice) + '€';
      ctx.fillStyle = slot.origPriceColor || '#1a1a1a';
      const _origW = slot.origPriceBold ? '900' : '600';
      const _origS = slot.origPriceItalic ? 'italic ' : '';
      ctx.font = _origS + _origW + ' ' + origSz + 'px ' + st.fontFamily;
      ctx.textAlign = 'center';
      const finalSzTmp = slot.finalPriceFontSize ? Math.max(10, slot.finalPriceFontSize) : Math.max(20, Math.min(60, spaceLeft * 0.52));
      const origYDefault = bottomY - finalSzTmp * 1.15 - origSz;
      const origPos = slot.positions && slot.positions.origPrice;
      const origDrawX = origPos ? r.x + origPos.px * r.w : cx;
      const origY     = origPos ? r.y + origPos.py * r.h : origYDefault;
      ctx.fillText(origTxt, origDrawX, origY);
      _zoneAdd(idx, 'origPrice', origDrawX - r.w * 0.4, origY - origSz * 1.2, r.w * 0.8, origSz * 2.5);
    }

    // FINAL PRICE — large red
    if (slot.finalPrice) {
      const finalSz = slot.finalPriceFontSize
        ? Math.max(10, Math.min(200, slot.finalPriceFontSize))
        : Math.max(20, Math.min(60, spaceLeft * 0.52));
      ctx.fillStyle = slot.priceColor || '#e53e3e';
      ctx.font = '900 ' + finalSz + 'px ' + st.fontFamily;
      ctx.textAlign = 'center';
      const finalYDefault = bottomY - (slot.footerText ? 2 : 0);
      const finalPos = slot.positions && slot.positions.finalPrice;
      const finalDrawX = finalPos ? r.x + finalPos.px * r.w : cx;
      const finalY     = finalPos ? r.y + finalPos.py * r.h : finalYDefault;
      ctx.fillText(formatPrice(slot.finalPrice) + '€', finalDrawX, finalY);
      _zoneAdd(idx, 'finalPrice', finalDrawX - r.w * 0.45, finalY - finalSz, r.w * 0.9, finalSz * 1.2);
    }

    // FOOTER TEXT (e.g. ΣΥΝΑΡΜΟΛΟΓΗΣΗ: +25€)
    if (slot.footerText) {
      const ftSz  = slot.footerFontSize  ? Math.max(6, slot.footerFontSize)  : (slot.infoFontSize ? Math.max(6, slot.infoFontSize) : 11);
      const ftFam = slot.footerFontFamily || slot.infoFontFamily || st.fontFamily;
      const ftClr = slot.footerColor      || slot.infoColor      || slot.textColor || st.globalText;
      const ftPos = slot.positions && slot.positions.footer;
      const footerYDefault = r.y + r.h - pad * 0.8;
      const footerDrawX = ftPos ? r.x + ftPos.px * r.w : cx;
      const footerY     = ftPos ? r.y + ftPos.py * r.h : footerYDefault;
      ctx.fillStyle = ftClr;
      const _ftW = slot.footerBold ? '700' : '400';
      const _ftS = slot.footerItalic ? 'italic ' : '';
      ctx.font = _ftS + _ftW + ' ' + ftSz + 'px ' + ftFam;
      ctx.textAlign = 'center';
      ctx.fillText(slot.footerText, footerDrawX, footerY);
      _zoneAdd(idx, 'footer', footerDrawX - (r.w-pad*2)/2, footerY - ftSz, r.w - pad * 2, ftSz * 1.5);
    }
  }
  function drawEmptySlot(idx, r) {
    const labels = Array.from({length: (st.rows||2)*(st.cols||2)}, (_,i) => 'Θέση '+(i+1));
    const isSel = idx === st.activeSlot;
    ctx.fillStyle = isSel ? 'rgba(124,111,255,0.10)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
    ctx.font = Math.round(r.h * 0.09) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = isSel ? 'rgba(124,111,255,0.55)' : 'rgba(0,0,0,0.15)';
    ctx.fillText('+', r.x + r.w/2, r.y + r.h * 0.44);
    ctx.fillStyle = isSel ? st.accentColor : 'rgba(0,0,0,0.22)';
    ctx.font = (isSel ? '700' : '400') + ' ' + Math.round(r.h * 0.054) + 'px ' + st.fontFamily;
    ctx.fillText(labels[idx], r.x + r.w/2, r.y + r.h * 0.60);
    if (isSel) {
      ctx.fillStyle = 'rgba(124,111,255,0.6)';
      ctx.font = '400 ' + Math.round(r.h * 0.040) + 'px ' + st.fontFamily;
      ctx.fillText('Αναζήτησε προϊόν →', r.x + r.w/2, r.y + r.h * 0.72);
    }
  }

  function drawWrappedText(text, x, y, maxW, lineH) {
    const words = (text || '').split(' ');
    let line = '', count = 0;
    for (const w of words) {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), x, y); y += lineH; line = w + ' '; count++;
        if (count >= 2) { ctx.fillText(line.trim() + '…', x, y); return count + 1; }
      } else { line = test; }
    }
    ctx.fillText(line.trim(), x, y);
    return count;
  }

  function roundedClip(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function _zoneAdd(slotIdx, field, x, y, w, h) {
    _zones.push({ slotIdx, field, x, y, w: Math.max(w, 0), h: Math.max(h, 4) });
  }

  function formatPrice(v) {
    const s = String(v || '');
    if (!s) return '';
    const n = parseFloat(s.replace(',', '.'));
    if (isNaN(n)) return s;
    // show decimals only if the user typed them
    if (s.includes('.') || (s.includes(',') && s.indexOf(',') < s.length - 1)) {
      return n.toFixed(2).replace('.', ',');
    }
    return String(Math.round(n));
  }
  function escHtml(s) {
    return String(s || '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
  }
  function sanitizeFilename(s) {
    return (s || 'kartelaki').replace(/[^\w ]/g, '_').replace(/\s+/g, '_').slice(0, 40);
  }

  /* ── SLOT MANAGEMENT ── */
  function setActiveSlot(idx) {
    st.activeSlot = idx;
    const lbl = document.getElementById('kt-active-slot-num');
    if (lbl) lbl.textContent = idx + 1;
    renderSlotEditor();
    renderCanvas();
  }

  function renderSlotButtons() {
    const wrap = document.getElementById('kt-slot-btns');
    if (!wrap) return;
    const labels = ['↖ Θέση 1', '↗ Θέση 2', '↙ Θέση 3', '↘ Θέση 4'];
    wrap.innerHTML = labels.map((lbl, i) => {
      const slot = st.slots[i];
      const hasProd = !!slot.product;
      const name = hasProd ? (slot.product.name.slice(0, 18) + (slot.product.name.length > 18 ? '…' : '')) : 'Κενό';
      return '<button class="kt-slot-btn ' + (i === st.activeSlot ? 'active' : '') + ' ' + (hasProd ? 'has-product' : '') + '" data-slot="' + i + '">' +
        '<span class="kt-slot-num">' + lbl + '</span>' +
        '<span class="kt-slot-prod">' + escHtml(name) + '</span>' +
        '</button>';
    }).join('');
    wrap.querySelectorAll('.kt-slot-btn').forEach(b => {
      b.addEventListener('click', () => setActiveSlot(parseInt(b.dataset.slot)));
    });
  }

  function renderSlotEditor() {
    const panel = document.getElementById('kt-slot-editor');
    if (!panel) return;
    const idx = st.activeSlot;
    const slot = st.slots[idx];

    if (!slot.product) {
      panel.innerHTML = '<div class="kt-editor-empty">Επίλεξε προϊόν από την αναζήτηση για τη Θέση ' + (idx + 1) + '</div>';
      return;
    }

    panel.innerHTML =
      '<div class="kt-editor-title">✏️ Θέση ' + (idx + 1) + ' — Επεξεργασία</div>' +
      '<div class="kt-editor-row">' +
        '<label class="kt-editor-label">Τίτλος</label>' +
        '<input class="kt-editor-input" id="ked-title" type="text" value="' + escHtml(slot.title || slot.product.name) + '" placeholder="Τίτλος…" />' +
      '</div>' +
      '<div class="kt-editor-row">' +
        '<label class="kt-editor-label">Ελεύθερο κείμενο (subtitle)</label>' +
        '<input class="kt-editor-input" id="ked-subtitle" type="text" value="' + escHtml(slot.subtitle) + '" placeholder="π.χ. ΚΟΜΟΔΙΝΟ 3 ΣΥΡΤΑΡΙΑ" />' +
      '</div>' +

      '<div class="kt-card-title" style="font-size:11px;margin:10px 0 4px;color:#7C6FFF">&#x1F4CF; Πληροφορίες</div>' +
      '<div class="kt-editor-row">' +
        '<label class="kt-editor-label">ΔΙΑΣΤΑΣΕΙΣ:</label>' +
        '<input class="kt-editor-input" id="ked-dimensions" type="text" value="' + escHtml(slot.dimensions) + '" placeholder="π.χ. 92x45x180 εκ." />' +
      '</div>' +
      '<div class="kt-editor-row">' +
        '<label class="kt-editor-label">ΧΡΩΜΑΤΑ:</label>' +
        '<input class="kt-editor-input" id="ked-colors" type="text" value="' + escHtml(slot.colors) + '" placeholder="π.χ. Λευκό, Φυσικό" />' +
      '<div class="kt-editor-colors" style="margin-bottom:6px">' +
        '<div class="kt-color-item">' +
          '<label>Χρώμα πληρ.</label>' +
          '<input type="color" id="ked-infocolor" value="' + (slot.infoColor || slot.textColor || st.globalText) + '" />' +
          '<button class="kt-reset-color" data-for="ked-infocolor" data-prop="infoColor" title="Επαναφορά">&#8634;</button>' +
        '</div>' +
      '</div>' +
      '<div class="kt-editor-2col">' +
        '<div class="kt-editor-row">' +
          '<label class="kt-editor-label">Αρχική τιμή (€)</label>' +
          '<input class="kt-editor-input" id="ked-orig" type="number" step="0.01" min="0" value="' + slot.origPrice + '" placeholder="0.00" />' +
        '</div>' +
        '<div class="kt-editor-row">' +
          '<label class="kt-editor-label">Τελική τιμή (€)</label>' +
          '<input class="kt-editor-input" id="ked-final" type="number" step="0.01" min="0" value="' + slot.finalPrice + '" placeholder="0.00" />' +
        '</div>' +
      '</div>' +
      '<div class="kt-editor-2col">' +
        '<div class="kt-editor-row">' +
          '<label class="kt-editor-label">Έκπτωση %</label>' +
          '<input class="kt-editor-input" id="ked-pct" type="number" step="1" min="0" max="99" value="' + (Math.round(slot.discountPct) || '') + '" placeholder="αυτόματο" />' +
        '</div>' +
        '<div class="kt-editor-row">' +
          '<label class="kt-editor-label">Κείμενο badge</label>' +
          '<input class="kt-editor-input" id="ked-label" type="text" value="' + escHtml(slot.discountLabel) + '" placeholder="-50%" />' +
        '</div>' +
      '</div>' +
      '<div class="kt-editor-row">' +
        '<label class="kt-editor-label">' +
          '<input type="checkbox" id="ked-showbadge" ' + (slot.showDiscount !== false ? 'checked' : '') + ' style="margin-right:5px">' +
          'Εμφάνιση badge έκπτωσης' +
        '</label>' +
      '</div>' +
      '<div class="kt-editor-row">' +
        '<label class="kt-editor-label">' +
          '<input type="checkbox" id="ked-showimg" ' + (slot.showImg ? 'checked' : '') + ' style="margin-right:5px">' +
          '🖼 Εμφάνιση εικόνας στο A4' +
        '</label>' +
      '</div>' +
      '<div class="kt-editor-colors">' +
        '<div class="kt-color-item">' +
          '<label>Bg θέσης</label>' +
          '<input type="color" id="ked-slotbg" value="' + (slot.slotBg || st.slotBg) + '" />' +
          '<button class="kt-reset-color" data-for="ked-slotbg" data-prop="slotBg" title="Επαναφορά">↺</button>' +
        '</div>' +
        '<div class="kt-color-item">' +
          '<label>Χρώμα τίτλου</label>' +
          '<input type="color" id="ked-txtcolor" value="' + (slot.textColor || st.globalText) + '" />' +
          '<button class="kt-reset-color" data-for="ked-txtcolor" data-prop="textColor" title="Επαναφορά">↺</button>' +
        '</div>' +
        '<div class="kt-color-item">' +
          '<label>Χρώμα τιμής</label>' +
          '<input type="color" id="ked-pricecolor" value="' + (slot.priceColor || st.accentColor) + '" />' +
          '<button class="kt-reset-color" data-for="ked-pricecolor" data-prop="priceColor" title="Επαναφορά">↺</button>' +
        '</div>' +
      '</div>' +
      '<div class="kt-editor-row">' +
        '<label class="kt-editor-label">Κείμενο κάτω (footer)</label>' +
        '<input class="kt-editor-input" id="ked-footer" type="text" value="' + escHtml(slot.footerText) + '" placeholder="π.χ. ΣΥΝΑΡΜΟΛΟΓΗΣΗ: +25€" />' +
      '</div>' +
      '<button class="kt-del-slot-btn" id="ked-delete">🗑 Αφαίρεση προϊόντος</button>';

    const sync = () => renderCanvas();
    const title = document.getElementById('ked-title');
    title && title.addEventListener('input', () => { slot.title = title.value; sync(); });
    const subEl = document.getElementById('ked-subtitle');
    subEl && subEl.addEventListener('input', () => { slot.subtitle = subEl.value; sync(); });

    const dimEl = document.getElementById('ked-dimensions');
    dimEl && dimEl.addEventListener('input', () => { slot.dimensions = dimEl.value; sync(); });
    const colEl = document.getElementById('ked-colors');
    colEl && colEl.addEventListener('input', () => { slot.colors = colEl.value; sync(); });


    const infoColorEl = document.getElementById('ked-infocolor');
    infoColorEl && infoColorEl.addEventListener('input', e => { slot.infoColor = e.target.value; sync(); });
    const footerEl = document.getElementById('ked-footer');
    footerEl && footerEl.addEventListener('input', () => { slot.footerText = footerEl.value; sync(); });
    const orig = document.getElementById('ked-orig');
    orig && orig.addEventListener('input', () => { slot.origPrice = orig.value; recalcDiscount(); sync(); });
    const finEl = document.getElementById('ked-final');
    finEl && finEl.addEventListener('input', () => { slot.finalPrice = finEl.value; recalcDiscount(); sync(); });
    const pct = document.getElementById('ked-pct');
    pct && pct.addEventListener('input', () => { slot.discountPct = parseFloat(pct.value) || 0; sync(); });
    const labelEl = document.getElementById('ked-label');
    labelEl && labelEl.addEventListener('input', () => { slot.discountLabel = labelEl.value; sync(); });
    const showBadge = document.getElementById('ked-showbadge');
    showBadge && showBadge.addEventListener('change', e => { slot.showDiscount = e.target.checked; sync(); });
    const showImgChk = document.getElementById('ked-showimg');
    showImgChk && showImgChk.addEventListener('change', async e => {
      slot.showImg = e.target.checked;
      if (slot.showImg && !slot.img && slot.product && slot.product.imageId) {
        await loadProductImage(slot.product.id, slot.product.imageId, slot);
      }
      renderCanvas();
    });
    const slotbg = document.getElementById('ked-slotbg');
    slotbg && slotbg.addEventListener('input', e => { slot.slotBg = e.target.value; sync(); });
    const txtc = document.getElementById('ked-txtcolor');
    txtc && txtc.addEventListener('input', e => { slot.textColor = e.target.value; sync(); });
    const pricec = document.getElementById('ked-pricecolor');
    pricec && pricec.addEventListener('input', e => { slot.priceColor = e.target.value; sync(); });

    panel.querySelectorAll('.kt-reset-color').forEach(btn => {
      btn.addEventListener('click', () => {
        slot[btn.dataset.prop] = '';
        const el = document.getElementById(btn.dataset.for);
        const prop = btn.dataset.prop;
        let defVal = st.accentColor;
        if (prop === 'slotBg') defVal = st.slotBg;
        else if (prop === 'textColor') defVal = st.globalText;
        else if (prop === 'infoColor') defVal = slot.textColor || st.globalText;
        if (el) el.value = defVal;
        slot[prop] = '';
        sync();
      });
    });

    const delBtn = document.getElementById('ked-delete');
    delBtn && delBtn.addEventListener('click', () => {
      st.slots[idx] = emptySlot();
      renderSlotButtons(); renderSlotEditor(); renderCanvas();
    });

    function recalcDiscount() {
      const o = parseFloat(slot.origPrice), f = parseFloat(slot.finalPrice);
      if (o > 0 && f > 0 && f < o) {
        slot.discountPct = ((o - f) / o) * 100;
        const pEl = document.getElementById('ked-pct');
        if (pEl) pEl.value = Math.round(slot.discountPct);
      }
    }
  }

  /* ── CACHE & SEARCH ── */
  function showCacheStatus(msg, isError) {
    if (!searchResultsEl) return;
    searchResultsEl.innerHTML = '<div class="' + (isError ? 'kt-search-error' : 'kt-search-loading') + '">' +
      (isError ? '&#10060; ' : '<div class="kt-spinner"></div> ') + escHtml(msg) + '</div>';
  }

  async function pollCacheReady(cb) {
    try {
      const r = await fetch('/api/kt/status');
      const d = await r.json();
      if (d.ready) { st.cacheReady = true; updateCacheStatusUI(d); cb && cb(); return; }
      if (d.error && !d.loading) { updateCacheStatusUI(d); return; }
      updateCacheStatusUI(d);
      setTimeout(() => pollCacheReady(cb), 1500);
    } catch { setTimeout(() => pollCacheReady(cb), 2000); }
  }

  function updateCacheStatusUI(d) {
    const bar = document.getElementById('kt-cache-bar');
    if (!bar) return;
    if (d.ready) {
      bar.innerHTML = '<span class="kt-cache-ok">&#10003; ' + d.total + ' προϊόντα φορτώθηκαν</span>';
      bar.style.display = 'flex';
      loadCategoriesUI();
      const fc = document.getElementById('kt-filter-controls');
      if (fc) fc.style.display = 'flex';
    } else if (d.loading) {
      bar.innerHTML = '<div class="kt-spinner" style="width:11px;height:11px"></div><span>Φόρτωση… ' + d.loaded + ' προϊόντα</span>';
      bar.style.display = 'flex';
    } else if (d.error) {
      bar.innerHTML = '<span class="kt-cache-err">&#10060; ' + escHtml(d.error) + '</span>';
      bar.style.display = 'flex';
    }
  }

  async function loadCategoriesUI() {
    try {
      const r = await fetch('/api/kt/categories');
      const d = await r.json();
      const sel = document.getElementById('kt-cat-select');
      if (!sel) return;
      sel.innerHTML = '<option value="">Όλες οι κατηγορίες</option>' +
        (d.categories || []).map(c => '<option value="' + c.id + '">' + escHtml(c.name) + '</option>').join('');
    } catch {}
  }

  let _searchTimer;
  async function searchProducts(query) {
    if (!st.cacheReady) { showCacheStatus('Φόρτωση προϊόντων…', false); return; }
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query || '' });
        if (st.filterCat)    params.set('cat', st.filterCat);
        if (st.filterActive) params.set('active', st.filterActive);
        const r = await fetch('/api/kt/search?' + params.toString());
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const data = await r.json();
        if (data.error === 'cache_not_ready') { showCacheStatus('Φόρτωση…', false); return; }
        st.searchResults = data.products || [];
        renderSearchResults(st.searchResults);
      } catch (e) {
        if (searchResultsEl) searchResultsEl.innerHTML = '<div class="kt-search-error">&#10060; ' + escHtml(e.message) + '</div>';
      }
    }, 180);
  }

  async function fetchProductDetails(pid) {
    try {
      const r = await fetch('/proxy/presta/api/products/' + pid + '?display=full');
      if (!r.ok) return null;
      const d = await r.json();
      return d && d.product ? d.product : null;
    } catch { return null; }
  }

  function renderSearchResults(products) {
    if (!searchResultsEl) return;
    if (!products.length) {
      searchResultsEl.innerHTML = '<div class="kt-search-empty">Δεν βρέθηκαν προϊόντα.</div>'; return;
    }
    // Render with emoji placeholder first, then lazy-load thumbnails
    searchResultsEl.innerHTML = products.map((p, i) => {
      const icon = p.active === '1' ? '🪱' : '📦';
      return '<div class="kt-product-item" data-index="' + i + '" data-pid="' + p.id + '">' +
        '<div class="kt-product-thumb"><span class="kt-thumb-icon">' + icon + '</span></div>' +
        '<div class="kt-product-info">' +
          '<div class="kt-product-name">' + escHtml(p.name) + '</div>' +
          (p.reference ? '<div class="kt-product-ref">Κωδ: ' + escHtml(p.reference) + '</div>' : '') +
          (p.active !== '1' ? '<div class="kt-product-ref" style="color:#ef4444">Ανενεργό</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
    searchResultsEl.querySelectorAll('.kt-product-item').forEach(el => {
      el.addEventListener('click', () => selectProduct(st.searchResults[parseInt(el.dataset.index)]));
    });
    // Lazy-load thumbnails asynchronously (limited to first 20 visible results)
    const items = Array.from(searchResultsEl.querySelectorAll('.kt-product-item')).slice(0, 20);
    items.forEach(el => {
      const pid = el.dataset.pid;
      if (!pid) return;
      const thumb = el.querySelector('.kt-product-thumb');
      fetch('/api/kt/thumb/' + pid)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d && d.imageId && thumb) {
            const src = '/proxy/presta-image?pid=' + pid + '&iid=' + d.imageId + '&size=small_default';
            const img = new Image();
            img.className = 'kt-thumb-img';
            img.loading = 'lazy';
            img.onerror = () => {};
            img.onload  = () => { thumb.innerHTML = ''; thumb.appendChild(img); };
            img.src = src;
          }
        })
        .catch(() => {});
    });
  }

  async function selectProduct(cached) {
    if (!cached) return;
    const idx  = st.activeSlot;
    const slot = st.slots[idx];

    // Immediate fill from cache data
    slot.product = { id: cached.id, name: cached.name, reference: cached.reference || '' };
    slot.title = cached.name;
    slot.img = null; slot.showImg = false;
    slot.origPrice = ''; slot.finalPrice = ''; slot.discountPct = 0; slot.discountLabel = ''; slot.subtitle = ''; slot.dimensions = ''; slot.colors = ''; slot.footerText = ''; slot.positions = {};
    renderSlotButtons(); renderSlotEditor(); renderCanvas();

    // Fetch full price + imageId from dedicated endpoint
    try {
      const r = await fetch('/api/kt/price/' + cached.id);
      if (!r.ok) return;
      const d = await r.json();
      if (d.error) return;

      slot.product.imageId  = d.imageId || '';
      slot.origPrice        = d.origPrice  > 0 ? String(d.origPrice)  : '';
      slot.finalPrice       = d.finalPrice > 0 ? String(d.finalPrice) : '';
      slot.discountPct      = d.discountPct  || 0;
      slot.discountAmount   = d.discountAmount || 0;
      // Auto-label: prefer amount if clean, else percentage
      if (!slot.discountLabel) {
        if (d.discountPct > 0.5) {
          slot.discountLabel = '-' + Math.round(d.discountPct) + '%';
        }
      }
      renderSlotEditor(); renderCanvas();
    } catch (e) {
      console.warn('[Kartelaki] price fetch failed:', e.message);
    }
  }

  async function loadProductImage(pid, iid, slot) {
    return new Promise(res => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload  = () => { slot.img = img; res(); };
      img.onerror = () => { slot.img = null; res(); };
      img.src = '/proxy/presta-image?pid=' + pid + '&iid=' + iid + '&size=large_default';
    });
  }

  /* ── EXPORT ── */
  let _renderClean = false;
  function renderCanvasClean() {
    const saved = _selectedZone, savedDrag = _drag;
    _selectedZone = null; _drag = null;
    _renderClean = true;
    renderCanvas();
    _renderClean = false;
    _selectedZone = saved; _drag = savedDrag;
  }

  function exportPNG() {
    renderCanvasClean();
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'kartelakia_A4.png';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    }, 'image/png');
  }

  async function exportPDF() {
    renderCanvasClean();
    // Use pdf-lib for correct A4/A5 dimensions
    if (!window.PDFLib) {
      try { await loadScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js'); }
      catch { showToast('Αποτυχία φόρτωσης PDF-lib.', 'error'); return; }
    }
    try {
      const { PDFDocument } = window.PDFLib;
      // A4: 595.28 x 841.89 pt  |  A5: 419.53 x 595.28 pt
      const sizes = { A4: [595.28, 841.89], A5: [419.53, 595.28] };
      const [pw, ph] = sizes[st.size] || sizes.A4;
      const isLandscape = st.orientation === 'landscape';
      const pageW = isLandscape ? ph : pw;
      const pageH = isLandscape ? pw : ph;

      const pdfDoc = await PDFDocument.create();
      const page   = pdfDoc.addPage([pageW, pageH]);

      // Convert canvas to PNG bytes
      const pngDataUrl = canvas.toDataURL('image/png');
      const base64 = pngDataUrl.split(',')[1];
      const pngBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const pngImage = await pdfDoc.embedPng(pngBytes);

      page.drawImage(pngImage, { x: 0, y: 0, width: pageW, height: pageH });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'kartelakia_' + st.size + '.pdf';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch(e) {
      showToast('Σφάλμα PDF: ' + e.message, 'error');
    }
  }

  function printCard() {
    renderCanvasClean();
    const imgData = canvas.toDataURL('image/png');
    const { lw, lh } = getDims();
    const win = window.open('', '_blank');
    if (!win) { showToast('Απενεργοποίησε τον popup-blocker.', 'warning'); return; }
    win.document.write('<!DOCTYPE html><html><head><title>Καρτελάκια</title><style>*{margin:0;padding:0}body{display:flex;justify-content:center;align-items:center;min-height:100vh}img{max-width:100%;max-height:100vh}@media print{body{display:block}img{width:100%;height:auto}}</style></head><body><img src="' + imgData + '" width="' + lw + '" height="' + lh + '" /><script>window.onload=function(){setTimeout(function(){window.print();},200);}<\/script></body></html>');
    win.document.close();
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  /* ── UI BUILDER ── */
  function buildUI() {
    const section = document.getElementById('tab-kartelaki');
    if (!section) return;

    const fontOpts = FONT_OPTIONS.map(f => '<option value="' + f.value + '"' + (f.value === st.fontFamily ? ' selected' : '') + '>' + f.label + '</option>').join('');

    section.innerHTML =
      '<div class="kt-layout">' +
      '<div class="kt-controls">' +

      // ── Paper & Grid ──
      '<div class="kt-card">' +
        '<div class="kt-card-title"><span class="kt-title-icon">◱</span> Σελίδα</div>' +
        '<div class="kt-card-body">' +
          '<div class="kt-ctrl-row"><span class="kt-ctrl-label">Μέγεθος</span>' +
            '<div class="kt-seg" id="kt-size-seg">' +
              '<button class="kt-seg-btn' + (st.size==='A4'?' active':'') + '" data-val="A4">A4</button>' +
              '<button class="kt-seg-btn' + (st.size==='A5'?' active':'') + '" data-val="A5">A5</button>' +
            '</div></div>' +
          '<div class="kt-ctrl-row" style="margin-top:4px"><span class="kt-ctrl-label">Προσανατολισμός</span>' +
            '<div class="kt-seg" id="kt-orient-seg">' +
              '<button class="kt-seg-btn' + (st.orientation==='portrait'?' active':'') + '" data-val="portrait">Portrait</button>' +
              '<button class="kt-seg-btn' + (st.orientation==='landscape'?' active':'') + '" data-val="landscape">Landscape</button>' +
            '</div></div>' +
          '<div class="kt-ctrl-row" style="margin-top:4px"><span class="kt-ctrl-label">Πλέγμα</span>' +
            '<div class="kt-grid-inputs">' +
              '<label>Γρ.</label>' +
              '<input class="kt-grid-input" id="kt-grid-rows" type="number" min="1" max="4" value="' + (st.rows||2) + '" />' +
              '<label>Στ.</label>' +
              '<input class="kt-grid-input" id="kt-grid-cols" type="number" min="1" max="4" value="' + (st.cols||2) + '" />' +
            '</div></div>' +
        '</div>' +
      '</div>' +

      // ── Στυλ Σελίδας (accordion) ──
      '<div class="kt-card is-accordion">' +
        '<div class="kt-card-title"><span class="kt-title-icon">🎨</span> Στυλ Σελίδας<span class="kt-title-arrow">▾</span></div>' +
        '<div class="kt-card-body">' +
          '<div class="kt-editor-colors" style="margin-bottom:8px">' +
            '<div class="kt-color-item"><label>Φόντο</label><input type="color" id="kt-g-pagebg" value="' + st.pageBg + '" /></div>' +
            '<div class="kt-color-item"><label>Accent</label><input type="color" id="kt-g-accent" value="' + st.accentColor + '" /></div>' +
            '<div class="kt-color-item"><label>Κείμενο</label><input type="color" id="kt-g-text" value="' + st.globalText + '" /></div>' +
            '<div class="kt-color-item"><label>Slot bg</label><input type="color" id="kt-g-slotbg" value="' + st.slotBg + '" /></div>' +
            '<div class="kt-color-item"><label>Γραμμές</label><input type="color" id="kt-g-divider" value="' + st.dividerColor + '" /></div>' +
          '</div>' +
          '<div class="kt-editor-row"><label class="kt-editor-label">Font</label><select class="kt-cat-select" id="kt-g-font">' + fontOpts + '</select></div>' +
          '<div class="kt-editor-row" style="margin-top:6px"><label class="kt-editor-label">Brand text</label><input class="kt-editor-input" id="kt-g-brand" type="text" value="' + escHtml(st.brandText) + '" placeholder="ideaepipla.gr" /></div>' +
        '</div>' +
      '</div>' +

      // ── Setups ──
      '<div class="kt-card">' +
        '<div class="kt-card-title"><span class="kt-title-icon">💾</span> Setups</div>' +
        '<div class="kt-card-body">' +
          '<div class="kt-setup-row">' +
            '<select id="kt-setup-select" class="kt-cat-select" style="flex:1;min-width:0"></select>' +
            '<button class="kt-setup-btn kt-setup-load" id="kt-setup-load" title="Φόρτωση">▶</button>' +
            '<button class="kt-setup-btn kt-setup-del"  id="kt-setup-del"  title="Διαγραφή">🗑</button>' +
          '</div>' +
          '<div class="kt-setup-row" style="margin-top:6px">' +
            '<input id="kt-setup-name" class="kt-editor-input" type="text" placeholder="Όνομα setup…" style="flex:1;min-width:0" />' +
            '<button class="kt-setup-btn kt-setup-save" id="kt-setup-save" title="Αποθήκευση">💾</button>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // ── Αναζήτηση Προϊόντος ──
      '<div class="kt-card">' +
        '<div class="kt-card-title"><span class="kt-title-icon">🔍</span> Προϊόν — Θέση <span id="kt-active-slot-num">1</span></div>' +
        '<div class="kt-card-body">' +
          '<div class="kt-cache-bar" id="kt-cache-bar" style="display:none"></div>' +
          '<div class="kt-filter-controls" id="kt-filter-controls" style="display:none">' +
            '<select class="kt-cat-select" id="kt-cat-select" style="flex:1"><option value="">Όλες οι κατηγορίες</option></select>' +
            '<div class="kt-seg kt-active-seg" id="kt-active-seg" style="flex:none">' +
              '<button class="kt-seg-btn active" data-val="1" title="Ενεργά">✅</button>' +
              '<button class="kt-seg-btn" data-val="0" title="Ανενεργά">⛔</button>' +
              '<button class="kt-seg-btn" data-val="" title="Όλα">📋</button>' +
            '</div>' +
          '</div>' +
          '<div class="kt-search-wrap" style="margin-top:6px">' +
            '<input class="kt-search-input" id="kt-search" type="text" placeholder="Αναζήτηση προϊόντος…" autocomplete="off" />' +
          '</div>' +
          '<div class="kt-results" id="kt-results"><div class="kt-search-hint">Φόρτωση προϊόντων…</div></div>' +
        '</div>' +
      '</div>' +

      // ── Επεξεργασία Θέσης ──
      '<div class="kt-card" id="kt-slot-editor-card">' +
        '<div class="kt-card-title"><span class="kt-title-icon">✏️</span> Επεξεργασία</div>' +
        '<div class="kt-card-body">' +
          '<div id="kt-slot-editor"><div class="kt-editor-empty">Κλικ σε θέση του καμβά για επεξεργασία</div></div>' +
        '</div>' +
      '</div>' +

      '</div>' + // end .kt-controls

      '<div class="kt-canvas-panel">' +
        '<div class="kt-canvas-topbar">' +
          '<span class="kt-canvas-hint">Κλικ = επιλογή · Drag = μετακίνηση κειμένου · Dbl-click = reset θέσης</span>' +
          '<span class="kt-version-badge">v2.1</span>' +
          '<button class="kt-reset-btn" id="kt-clear-all">✕ Καθαρισμός</button>' +
        '</div>' +
        '<div class="kt-canvas-wrap" id="kt-canvas-wrap">' +
          '<canvas id="kt-canvas"></canvas>' +
          // toolbar injected into body in init()
        '</div>' +
        '<div class="kt-export-bar">' +
          '<button class="kt-btn-export png" id="kt-export-png">PNG</button>' +
          '<button class="kt-btn-export pdf" id="kt-export-pdf">PDF</button>' +
          '<button class="kt-btn-export print" id="kt-export-print">🖨 Εκτύπωση</button>' +
        '</div>' +
      '</div>' +

      '</div>'; // end .kt-layout
  }

  function _showTextToolbar(zone, canvasRect, lw, lh) {
    const tb = document.getElementById('kt-text-toolbar');
    if (!tb) return;
    const slot = st.slots[zone.slotIdx];
    const cfg  = ZONE_CONFIG[zone.field];
    if (!cfg) return;
    _selectedZone = zone;

    // Position toolbar above the zone (fixed to viewport)
    const scaleX = canvasRect.width  / lw;
    const scaleY = canvasRect.height / lh;
    const tbH = 48;
    const tbLeft = Math.max(8, canvasRect.left + zone.x * scaleX);
    const tbTop  = Math.max(8, canvasRect.top  + zone.y * scaleY - tbH - 8);

    tb.style.position = 'fixed';
    tb.style.display = 'flex';
    tb.style.left = tbLeft + 'px';
    tb.style.top  = tbTop + 'px';

    document.getElementById('ktt-label').textContent = ZONE_LABELS[zone.field] || zone.field;

    const kttFont = document.getElementById('ktt-font');
    const kttSize = document.getElementById('ktt-size');
    const kttColor = document.getElementById('ktt-color');

    if (kttFont) {
      const hasFontProp = !!cfg.fontProp;
      kttFont.style.display = hasFontProp ? '' : 'none';
      if (hasFontProp) kttFont.value = slot[cfg.fontProp] || st.fontFamily;
    }
    const hasSz = !!cfg.sizeProp;
    const sizeEl = document.getElementById('ktt-size');
    if (sizeEl) {
      const szBtn1 = document.getElementById('ktt-size-dec');
      const szBtn2 = document.getElementById('ktt-size-inc');
      if (szBtn1) szBtn1.style.display = hasSz ? '' : 'none';
      if (szBtn2) szBtn2.style.display = hasSz ? '' : 'none';
      if (hasSz) sizeEl.value = (slot[cfg.sizeProp] > 0 ? slot[cfg.sizeProp] : null) || cfg.defaultSize || 11;
    }
    const colorEl = document.getElementById('ktt-color');
    if (colorEl && cfg.colorProp) colorEl.value = slot[cfg.colorProp] || st.globalText;
    const alignDiv = tb.querySelector('.ktt-align');
    if (alignDiv) {
      const hasAlign = !!cfg.alignProp;
      alignDiv.style.display = hasAlign ? 'flex' : 'none';
      if (hasAlign) {
        tb.querySelectorAll('.ktt-align-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.align === (slot[cfg.alignProp] || 'center')));
      }
    }
    const _kttB = document.getElementById('ktt-bold');
    const _kttI = document.getElementById('ktt-italic');
    if (_kttB) {
      const _hasBold = !!cfg.boldProp;
      _kttB.style.display = _hasBold ? '' : 'none';
      if (_hasBold) _kttB.classList.toggle('active', slot[cfg.boldProp] !== undefined ? !!slot[cfg.boldProp] : !!cfg.defaultBold);
    }
    if (_kttI) {
      const _hasItalic = !!cfg.italicProp;
      _kttI.style.display = _hasItalic ? '' : 'none';
      if (_hasItalic) _kttI.classList.toggle('active', !!slot[cfg.italicProp]);
    }
  }
  function _hideTextToolbar() {
    const tb = document.getElementById('kt-text-toolbar');
    if (tb) tb.style.display = 'none';
    _selectedZone = null;
  }

  /* ── INIT ── */
  function init() {
    buildUI();

    // Inject toolbar as direct child of body to avoid stacking context issues
    // (backdrop-filter / transform on ancestors break position:fixed)
    if (!document.getElementById('kt-text-toolbar')) {
      const _tbEl = document.createElement('div');
      _tbEl.innerHTML = '<div id="kt-text-toolbar" class="kt-text-toolbar" style="display:none">' +
        '<span class="ktt-label" id="ktt-label">—</span>' +
        '<div class="ktt-sep"></div>' +
        '<select id="ktt-font" class="ktt-select">' +
          '<option value="">Font…</option>' +
          '<option value="Outfit,sans-serif">Outfit</option>' +
          '<option value="Inter,sans-serif">Inter</option>' +
          '<option value="Arial,sans-serif">Arial</option>' +
          '<option value="Georgia,serif">Georgia</option>' +
          '<option value="Verdana,sans-serif">Verdana</option>' +
        '</select>' +
        '<div class="ktt-sep"></div>' +
        '<button class="ktt-sz-btn" id="ktt-size-dec">−</button>' +
        '<input class="ktt-sz" id="ktt-size" type="number" min="6" max="200" />' +
        '<button class="ktt-sz-btn" id="ktt-size-inc">+</button>' +
        '<div class="ktt-sep"></div>' +
        '<input class="ktt-color" id="ktt-color" type="color" />' +
        '<div class="ktt-sep"></div>' +
        '<button class="ktt-fmt-btn" id="ktt-bold" title="Έντονα"><b>B</b></button>' +
        '<button class="ktt-fmt-btn ktt-italic-btn" id="ktt-italic" title="Πλάγια"><i>I</i></button>' +
        '<div class="ktt-sep"></div>' +
        '<div class="ktt-align">' +
          '<button class="ktt-align-btn" data-align="left">≡</button>' +
          '<button class="ktt-align-btn" data-align="center">≡</button>' +
          '<button class="ktt-align-btn" data-align="right">≡</button>' +
        '</div>' +
        '<button class="ktt-close" id="ktt-close">✕</button>' +
      '</div>';
      document.body.appendChild(_tbEl.firstElementChild);
    }

    canvas     = document.getElementById('kt-canvas');
    if (!canvas) return;
    ctx        = canvas.getContext('2d');
    canvasWrap = document.getElementById('kt-canvas-wrap');
    searchInput     = document.getElementById('kt-search');
    searchResultsEl = document.getElementById('kt-results');

    renderSlotButtons();
    renderSlotEditor();

    // ── Setup events ──
    const setupSelEl   = document.getElementById('kt-setup-select');
    const setupNameEl  = document.getElementById('kt-setup-name');
    const setupLoadBtn = document.getElementById('kt-setup-load');
    const setupSaveBtn = document.getElementById('kt-setup-save');
    const setupDelBtn  = document.getElementById('kt-setup-del');
    if (setupSelEl)   setupRefreshUI();
    if (setupLoadBtn) setupLoadBtn.addEventListener('click', () => { setupLoad(setupSelEl ? setupSelEl.value : ''); });
    if (setupSaveBtn) setupSaveBtn.addEventListener('click', () => {
      const n = (setupNameEl ? setupNameEl.value.trim() : '') || prompt('Όνομα setup:');
      if (n) { setupSave(n); if (setupNameEl) setupNameEl.value = ''; }
    });
    if (setupDelBtn) setupDelBtn.addEventListener('click', () => {
      const n = setupSelEl ? setupSelEl.value : '';
      if (n && confirm('Διαγραφή setup "' + n + '";')) setupDelete(n);
    });

    // ── Accordion toggle ──
    document.querySelectorAll('.kt-card.is-accordion .kt-card-title').forEach(title => {
      title.addEventListener('click', () => title.closest('.kt-card').classList.toggle('open'));
    });

    // ── Size / Orientation ──
    document.querySelectorAll('#kt-size-seg .kt-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#kt-size-seg .kt-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); st.size = btn.dataset.val; renderCanvas();
      });
    });

    // ── Grid rows/cols ──
    const gridRowsEl = document.getElementById('kt-grid-rows');
    const gridColsEl = document.getElementById('kt-grid-cols');
    function applyGrid() {
      const r = Math.max(1, Math.min(4, parseInt(gridRowsEl.value) || 2));
      const c = Math.max(1, Math.min(4, parseInt(gridColsEl.value) || 2));
      const total = r * c;
      while (st.slots.length < total) st.slots.push(emptySlot());
      st.rows = r; st.cols = c;
      renderSlotEditor(); renderCanvas();
    }
    gridRowsEl && gridRowsEl.addEventListener('change', applyGrid);
    gridColsEl && gridColsEl.addEventListener('change', applyGrid);

    document.querySelectorAll('#kt-orient-seg .kt-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#kt-orient-seg .kt-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); st.orientation = btn.dataset.val; renderCanvas();
      });
    });

    const gBind = (id, prop) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', e => { st[prop] = e.target.value; renderCanvas(); });
    };
    gBind('kt-g-pagebg',  'pageBg');
    gBind('kt-g-accent',  'accentColor');
    gBind('kt-g-text',    'globalText');
    gBind('kt-g-slotbg',  'slotBg');
    gBind('kt-g-divider', 'dividerColor');
    gBind('kt-g-font',    'fontFamily');
    gBind('kt-g-brand',   'brandText');

    // Text-toolbar event wiring
    const kttFont  = document.getElementById('ktt-font');
    const kttSize  = document.getElementById('ktt-size');
    const kttColor = document.getElementById('ktt-color');
    const kttSzDec = document.getElementById('ktt-size-dec');
    const kttSzInc = document.getElementById('ktt-size-inc');
    function kttChangeSize(delta) {
      if (!_selectedZone) return;
      const slot = st.slots[_selectedZone.slotIdx];
      const cfg = ZONE_CONFIG[_selectedZone.field];
      if (!cfg || !cfg.sizeProp) return;
      const cur = parseFloat(kttSize.value) || cfg.defaultSize || 12;
      const nxt = Math.max(6, Math.min(200, cur + delta));
      kttSize.value = nxt;
      slot[cfg.sizeProp] = nxt;
      renderCanvas();
    }
    if (kttSzDec) kttSzDec.addEventListener('click', ev => { ev.stopPropagation(); kttChangeSize(-1); });
    if (kttSzInc) kttSzInc.addEventListener('click', ev => { ev.stopPropagation(); kttChangeSize(1); });
    if (kttFont) kttFont.addEventListener('change', () => {
      if (!_selectedZone) return;
      const slot = st.slots[_selectedZone.slotIdx];
      const cfg = ZONE_CONFIG[_selectedZone.field];
      if (cfg && cfg.fontProp) { slot[cfg.fontProp] = kttFont.value; renderCanvas(); }
    });
    if (kttSize) kttSize.addEventListener('input', () => {
      if (!_selectedZone) return;
      const slot = st.slots[_selectedZone.slotIdx];
      const cfg = ZONE_CONFIG[_selectedZone.field];
      if (cfg && cfg.sizeProp) { slot[cfg.sizeProp] = parseFloat(kttSize.value) || 0; renderCanvas(); }
    });
    if (kttColor) kttColor.addEventListener('input', () => {
      if (!_selectedZone) return;
      const slot = st.slots[_selectedZone.slotIdx];
      const cfg = ZONE_CONFIG[_selectedZone.field];
      if (cfg && cfg.colorProp) { slot[cfg.colorProp] = kttColor.value; renderCanvas(); renderSlotEditor(); }
    });
    document.querySelectorAll('.ktt-align-btn').forEach(btn => {
      btn.addEventListener('click', ev => {
        ev.stopPropagation();
        if (!_selectedZone) return;
        const slot = st.slots[_selectedZone.slotIdx];
        const cfg = ZONE_CONFIG[_selectedZone.field];
        if (cfg && cfg.alignProp) {
          slot[cfg.alignProp] = btn.dataset.align;
          document.querySelectorAll('.ktt-align-btn').forEach(b => b.classList.toggle('active', b === btn));
          renderCanvas();
        }
      });
    });
    const kttCloseBtn = document.getElementById('ktt-close');
    if (kttCloseBtn) kttCloseBtn.addEventListener('click', ev => { ev.stopPropagation(); _hideTextToolbar(); });
    const kttBoldEvt = document.getElementById('ktt-bold');
    const kttItalicEvt = document.getElementById('ktt-italic');
    if (kttBoldEvt) kttBoldEvt.addEventListener('click', ev => {
      ev.stopPropagation();
      if (!_selectedZone) return;
      const slot = st.slots[_selectedZone.slotIdx];
      const cfg = ZONE_CONFIG[_selectedZone.field];
      if (!cfg || !cfg.boldProp) return;
      const cur = slot[cfg.boldProp] !== undefined ? slot[cfg.boldProp] : cfg.defaultBold;
      slot[cfg.boldProp] = !cur;
      kttBoldEvt.classList.toggle('active', !!slot[cfg.boldProp]);
      renderCanvas();
    });
    if (kttItalicEvt) kttItalicEvt.addEventListener('click', ev => {
      ev.stopPropagation();
      if (!_selectedZone) return;
      const slot = st.slots[_selectedZone.slotIdx];
      const cfg = ZONE_CONFIG[_selectedZone.field];
      if (!cfg || !cfg.italicProp) return;
      slot[cfg.italicProp] = !slot[cfg.italicProp];
      kttItalicEvt.classList.toggle('active', !!slot[cfg.italicProp]);
      renderCanvas();
    });

    let _justDragged = false;
    canvas.addEventListener('dblclick', e => {
      const rect = canvas.getBoundingClientRect();
      const { lw, lh } = getDims();
      const mx = (e.clientX - rect.left) * (lw / rect.width);
      const my = (e.clientY - rect.top)  * (lh / rect.height);
      const hit = _zones.find(z => mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h);
      if (hit) {
        const slot = st.slots[hit.slotIdx];
        if (slot.positions) delete slot.positions[hit.field];
        renderCanvas();
      }
    });
    canvas.addEventListener('click', e => {
      if (_justDragged) { _justDragged = false; return; }
      const rect = canvas.getBoundingClientRect();
      const { lw, lh } = getDims();
      const mx = (e.clientX - rect.left) * (lw / rect.width);
      const my = (e.clientY - rect.top)  * (lh / rect.height);
      // Zone hit-test first
      const hit = _zones.find(z => mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h);
      if (hit) {
        _selectedZone = hit;
        setActiveSlot(hit.slotIdx);
        _showTextToolbar(hit, rect, lw, lh);
        return;
      }
      // Fallback: slot selection
      _hideTextToolbar();
      for (let i = 0; i < 4; i++) {
        const r = getSlotRect(i, lw, lh);
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          setActiveSlot(i); break;
        }
      }
    });

    canvas.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      _dragMoved = false;
      const rect = canvas.getBoundingClientRect();
      const { lw, lh } = getDims();
      const mx = (e.clientX - rect.left) * (lw / rect.width);
      const my = (e.clientY - rect.top)  * (lh / rect.height);
      const hit = _zones.find(z => mx >= z.x && mx <= z.x + z.w && my >= z.y && my <= z.y + z.h);
      if (hit) {
        const slot = st.slots[hit.slotIdx];
        const sr = getSlotRect(hit.slotIdx, lw, lh);
        const curPos = slot.positions && slot.positions[hit.field];
        _drag = {
          slotIdx: hit.slotIdx, field: hit.field,
          startMX: mx, startMY: my,
          startPX: curPos ? curPos.px : (hit.x + hit.w / 2 - sr.x) / sr.w,
          startPY: curPos ? curPos.py : (hit.y + hit.h / 2 - sr.y) / sr.h,
          sr,
        };
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    let _dragMoved = false;
    canvas.addEventListener('mousemove', e => {
      if (!_drag) return;
      const rect = canvas.getBoundingClientRect();
      const { lw, lh } = getDims();
      const mx = (e.clientX - rect.left) * (lw / rect.width);
      const my = (e.clientY - rect.top)  * (lh / rect.height);
      const dx = mx - _drag.startMX, dy = my - _drag.startMY;
      if (Math.abs(dx) < 3 && Math.abs(dy) < 3) return; // dead zone
      _dragMoved = true;
      const slot = st.slots[_drag.slotIdx];
      const sr = _drag.sr;
      const newPX = Math.max(0.05, Math.min(0.95, _drag.startPX + dx / sr.w));
      const newPY = Math.max(0.05, Math.min(0.98, _drag.startPY + dy / sr.h));
      if (!slot.positions) slot.positions = {};
      slot.positions[_drag.field] = { px: newPX, py: newPY };
      renderCanvas();
    });

    const stopDrag = () => {
      if (_drag) {
        if (_dragMoved) _justDragged = true;
        _drag = null; _dragMoved = false;
        canvas.style.cursor = 'crosshair';
      }
    };
    canvas.addEventListener('mouseup', e => stopDrag());
    canvas.addEventListener('mouseleave', () => stopDrag(false));

    document.getElementById('kt-clear-all') && document.getElementById('kt-clear-all').addEventListener('click', () => {
      if (!confirm('Καθαρισμός όλων των θέσεων;')) return;
      st.slots = [emptySlot(), emptySlot(), emptySlot(), emptySlot()];
      st.activeSlot = 0;
      renderSlotButtons(); renderSlotEditor(); renderCanvas();
    });

    searchInput && searchInput.addEventListener('input', () => searchProducts(searchInput.value.trim()));
    searchInput && searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchProducts(searchInput.value.trim()); });

    document.querySelectorAll('#kt-active-seg .kt-seg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#kt-active-seg .kt-seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); st.filterActive = btn.dataset.val;
        searchProducts(searchInput ? searchInput.value.trim() : '');
      });
    });

    const catSel = document.getElementById('kt-cat-select');
    catSel && catSel.addEventListener('change', e => {
      st.filterCat = parseInt(e.target.value) || 0;
      searchProducts(searchInput ? searchInput.value.trim() : '');
    });

    document.getElementById('kt-export-png')   && document.getElementById('kt-export-png').addEventListener('click', exportPNG);
    document.getElementById('kt-export-pdf')   && document.getElementById('kt-export-pdf').addEventListener('click', exportPDF);
    document.getElementById('kt-export-print') && document.getElementById('kt-export-print').addEventListener('click', printCard);

    fetch('/api/kt/load').then(r => r.json()).then(d => {
      updateCacheStatusUI(d);
      if (!d.ready) {
        setTimeout(() => pollCacheReady(() => searchProducts('')), 800);
      } else {
        st.cacheReady = true; searchProducts('');
      }
    }).catch(() => {
      if (searchResultsEl) searchResultsEl.innerHTML = '<div class="kt-search-error">&#10060; Αδυναμία σύνδεσης</div>';
    });

    renderCanvas();
  }

  return { init, onTabOpen: () => renderCanvas() };

})();
