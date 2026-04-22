/* ================================================
   config.js – API Configuration
   FurnitureVision AI / ideaepipla.gr  v1.5
   ================================================ */

const CONFIG = {
  // ── API Key ────────────────────────────────────
  API_KEY: 'sk-76c280d22b924482916336f67a053387',

  // ── Native API (beta.vertexapis.com) ───────────
  NATIVE_API_BASE: 'https://beta.vertexapis.com',
  CHAT_MODEL:      'gemini-3-flash-preview',
  IMAGE_MODEL:     'gemini-3-pro-image-preview',   // default native image model

  // ── Wrapper API (gemini.vertexapis.com) ────────
  IMAGE_API_BASE:  'https://gemini.vertexapis.com',
  IMAGE_ENDPOINT:  '/api/generate/image',
  VIDEO_ENDPOINT:  '/api/generate/video',
  VIDEO_STATUS:    '/api/video/status',
  KEY_STATUS:      '/key/status',

  // ── Router API (router.claude.gg) ─────────────
  ROUTER_BASE:     'https://router.claude.gg',

  // ── Default image model ────────────────────────
  DEFAULT_IMAGE_MODEL: 'gemini-3-pro-image',   // id from IMAGE_MODELS

  // ── Rate Limits ────────────────────────────────
  RATE_HOURLY:  50,
  RATE_DAILY:   500,

  // ── Video polling ──────────────────────────────
  POLL_INTERVAL: 5000,
  POLL_TIMEOUT:  180000,

  // ── Image retry ────────────────────────────────
  IMG_MAX_RETRIES: 2,
  IMG_RETRY_DELAY: 3000,
};

// ── Image Models ───────────────────────────────
const IMAGE_MODELS = [
  // ── Cortex Native (beta.vertexapis.com) ────────
  {
    id: 'gemini-3-pro-image',
    name: 'Gemini 3 Pro Image',
    provider: 'Google',
    providerColor: '#00d68f',
    api: 'native',
    modelId: 'gemini-3-pro-image-preview',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: true,
    badge: 'HIGH QUALITY',
    badgeColor: '#7C6FFF',
    desc: 'Υψηλή ποιότητα, ιδανικό για e-shop. Υποστηρίζει reference εικόνα.',
    note: 'Cortex Native API'
  },
  {
    id: 'gemini-25-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    providerColor: '#00d68f',
    api: 'native',
    modelId: 'gemini-2.5-flash-image-preview',
    speed: 'fast',
    speedLabel: '🚀 Fast',
    supportsReference: true,
    badge: 'FAST',
    badgeColor: '#10B981',
    desc: 'Γρήγορο, καλή ποιότητα. Υποστηρίζει reference εικόνα.',
    note: 'Cortex Native API'
  },

  // ── Router (router.claude.gg) ──────────────────
  {
    id: 'gemini-router-image',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    providerColor: '#00d68f',
    api: 'router',
    typeVal: 'gemini-2-5-flash-image-preview',
    modelVal: null,
    speed: 'fast',
    speedLabel: '🚀 Fast',
    supportsReference: false,
    badge: 'ROUTER',
    badgeColor: '#6c5ce7',
    desc: 'Google Gemini 2.5 Flash via router.claude.gg. Μόνο text prompt.',
    note: 'router.claude.gg'
  },
  {
    id: 'imagen3',
    name: 'Imagen 3',
    provider: 'Google',
    providerColor: '#00d68f',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'imagen3',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: false,
    badge: 'HIGH QUALITY',
    badgeColor: '#7C6FFF',
    desc: 'Google Imagen 3 — εξαιρετική ποιότητα φωτορεαλισμού.',
    note: 'router.claude.gg'
  },
  {
    id: 'flux-2-pro',
    name: 'Flux 2 Pro',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'flux-2-pro',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: false,
    badge: 'HIGH QUALITY',
    badgeColor: '#7C6FFF',
    desc: 'Flux 2 Pro — εξαιρετική ποιότητα εικόνας και λεπτομέρεια.',
    note: 'router.claude.gg'
  },
  {
    id: 'flux-2-turbo',
    name: 'Flux 2 Turbo',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'flux-2-turbo',
    speed: 'fast',
    speedLabel: '🚀 Fast',
    supportsReference: false,
    badge: 'FAST',
    badgeColor: '#10B981',
    desc: 'Flux 2 Turbo — γρήγορο και ποιοτικό.',
    note: 'router.claude.gg'
  },
  {
    id: 'flux-kontext-pro',
    name: 'Flux Kontext Pro',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'flux-kontext-pro',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: false,
    badge: 'CONTEXT',
    badgeColor: '#f9c74f',
    desc: 'Flux Kontext Pro — κατανοεί σύνθετες οδηγίες prompt.',
    note: 'router.claude.gg'
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'Banana',
    providerColor: '#f9c74f',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'nano-banana-pro',
    speed: 'fast',
    speedLabel: '🚀 Fast',
    supportsReference: false,
    badge: 'FAST',
    badgeColor: '#10B981',
    desc: 'Nano Banana Pro — γρήγορο T2I. Μόνο prompt, χωρίς reference.',
    note: 'router.claude.gg'
  },
  {
    id: 'nano-banana-flash',
    name: 'Nano Banana Flash',
    provider: 'Banana',
    providerColor: '#f9c74f',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'nano-banana-flash',
    speed: 'ultra-fast',
    speedLabel: '⚡⚡ Ultra Fast',
    supportsReference: false,
    badge: 'FASTEST',
    badgeColor: '#f72585',
    desc: 'Nano Banana Flash — πολύ γρήγορο, βασική ποιότητα.',
    note: 'router.claude.gg'
  },
  {
    id: 'seedream-v5-lite',
    name: 'Seedream V5 Lite',
    provider: 'ByteDance',
    providerColor: '#fd7961',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'seedream-v5-lite',
    speed: 'fast',
    speedLabel: '🚀 Fast',
    supportsReference: false,
    badge: 'NEW',
    badgeColor: '#10B981',
    desc: 'ByteDance Seedream V5 Lite — τελευταίο μοντέλο της σειράς.',
    note: 'router.claude.gg'
  },
  {
    id: 'seedream-v4-5',
    name: 'Seedream 4.5',
    provider: 'ByteDance',
    providerColor: '#fd7961',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'seedream-v4-5',
    speed: 'fast',
    speedLabel: '🚀 Fast',
    supportsReference: false,
    badge: 'STANDARD',
    badgeColor: '#aaa',
    desc: 'ByteDance Seedream 4.5 — αξιόπιστο και γρήγορο.',
    note: 'router.claude.gg'
  },
  {
    id: 'z-image',
    name: 'Z-Image',
    provider: 'Router',
    providerColor: '#6c5ce7',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'z-image',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: false,
    badge: 'STANDARD',
    badgeColor: '#aaa',
    desc: 'Z-Image — γενικής χρήσης text-to-image μοντέλο.',
    note: 'router.claude.gg'
  },

  // ── Extra models from cortexfields.md ──────────
  {
    id: 'flux-2-klein',
    name: 'Flux 2 Klein',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'flux-2-klein',
    speed: 'ultra-fast',
    speedLabel: '⚡⚡ Sub-Second',
    supportsReference: true,
    badge: 'FASTEST',
    badgeColor: '#f72585',
    desc: 'Flux 2 Klein — sub-second generation, υποστηρίζει έως 4 reference εικόνες.',
    note: 'router.claude.gg | cortexfields.md'
  },
  {
    id: 'flux-dev',
    name: 'Flux Dev',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'flux-dev',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: false,
    badge: 'STYLING',
    badgeColor: '#f9c74f',
    desc: 'Flux Dev — styling effects (color, framing, lighting) και χρωματικός έλεγχος.',
    note: 'router.claude.gg | cortexfields.md'
  },
  {
    id: 'hyperflux',
    name: 'HyperFlux',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'hyperflux',
    speed: 'ultra-fast',
    speedLabel: '⚡⚡ Ultra Fast',
    supportsReference: false,
    badge: 'FASTEST',
    badgeColor: '#f72585',
    desc: 'HyperFlux — το πιο γρήγορο μοντέλο της Flux σειράς.',
    note: 'router.claude.gg | cortexfields.md'
  },
  {
    id: 'mystic',
    name: 'Mystic',
    provider: 'Magnific',
    providerColor: '#a855f7',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'mystic',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: true,
    badge: 'ADVANCED',
    badgeColor: '#a855f7',
    desc: 'Mystic — LoRA, style/structure reference, 4K resolution, multiple render engines.',
    note: 'router.claude.gg | cortexfields.md'
  },
  {
    id: 'reimagine-flux',
    name: 'Reimagine Flux',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'reimagine-flux',
    speed: 'fast',
    speedLabel: '🚀 Sync',
    supportsReference: true,
    badge: 'SYNC',
    badgeColor: '#10B981',
    desc: 'Reimagine Flux — ανανεώνει υπάρχουσα εικόνα με prompt. Σύγχρονο API (χωρίς polling).',
    note: 'router.claude.gg | cortexfields.md — SYNC, requires image'
  },
  {
    id: 'flux-pro-v1-1',
    name: 'Flux Pro v1.1',
    provider: 'Black Forest',
    providerColor: '#4cc9f0',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'flux-pro-v1-1',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: false,
    badge: 'PRO',
    badgeColor: '#7C6FFF',
    desc: 'Flux Pro v1.1 — υψηλή ποιότητα με prompt upsampling.',
    note: 'router.claude.gg | cortexfields.md'
  },
  {
    id: 'seedream-v4',
    name: 'Seedream V4',
    provider: 'ByteDance',
    providerColor: '#fd7961',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'seedream-v4',
    speed: 'fast',
    speedLabel: '🚀 Fast',
    supportsReference: false,
    badge: 'STANDARD',
    badgeColor: '#aaa',
    desc: 'ByteDance Seedream V4 — αξιόπιστο και γρήγορο.',
    note: 'router.claude.gg | cortexfields.md'
  },
  {
    id: 'runway-image',
    name: 'RunWay Gen4',
    provider: 'Runway',
    providerColor: '#e11d48',
    api: 'router',
    typeVal: 'text-to-image',
    modelVal: 'runway',
    speed: 'standard',
    speedLabel: '⚡ Standard',
    supportsReference: false,
    badge: 'CINEMATIC',
    badgeColor: '#e11d48',
    desc: 'RunWay Gen4 Image — κινηματογραφική ποιότητα. Χρησιμοποιεί ratio string (π.χ. 1920:1080).',
    note: 'router.claude.gg | cortexfields.md — ratio format: width:height'
  },
];

// Helper: get model by id
function getImageModelById(id) {
  return IMAGE_MODELS.find(m => m.id === id) || IMAGE_MODELS[0];
}

// ── Session usage tracker ──────────────────────
const SESSION = {
  requestCount: 0,
  sessionStart: Date.now(),

  increment() {
    this.requestCount++;
    const elapsed = (Date.now() - this.sessionStart) / 60000;
    if (this.requestCount >= 45 && elapsed < 60) {
      showToast('⚠️ Approaching hourly rate limit (50 req/hr).', 'warning');
    }
  }
};