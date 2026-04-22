/* ================================================
   scenes.js – Background Scene Definitions
   FurnitureVision AI / ideaepipla.gr  v1.5
   ================================================ */

const SCENES = [
  // ── STUDIO / WHITE ─────────────────────────────
  {
    id: 'white-studio',
    name: 'White Studio',
    icon: '⬜',
    category: 'studio',
    prompt: 'Pure white seamless photo studio background, soft diffused professional studio lighting, subtle soft shadow beneath furniture, clean e-commerce product photography setup, minimal and crisp'
  },
  {
    id: 'soft-shadow-studio',
    name: 'Soft Shadow Studio',
    icon: '🌫️',
    category: 'studio',
    prompt: 'Clean light grey seamless studio backdrop, gentle soft directional shadows on smooth floor, professional product photography lighting, elegant minimalist atmosphere, high-end furniture catalog background, subtle gradient'
  },
  {
    id: 'warm-studio',
    name: 'Warm Studio',
    icon: '🟡',
    category: 'studio',
    prompt: 'Warm white studio setting, soft warm light with gentle golden tones, smooth light beige floor, subtle natural shadow, professional lifestyle product photography, cozy elegant atmosphere'
  },
  {
    id: 'focused-extension',
    name: 'Focused Extension',
    icon: '✨',
    category: 'studio',
    prompt: 'Elegant minimalist Greek interior, seamless light grey background, subtle shadow gradient on polished floor, sophisticated ambient lighting, premium furniture showcase photography, luxury e-shop product presentation'
  },
  {
    id: 'dark-luxury',
    name: 'Dark Luxury',
    icon: '🖤',
    category: 'studio',
    prompt: 'Dark luxury studio background, deep charcoal grey seamless backdrop, dramatic moody lighting with soft spotlight on furniture, high contrast premium product photography, sophisticated dark atmosphere for luxury furniture'
  },

  // ── BEDROOM ──────────────────────────────────
  {
    id: 'metal-bed',
    name: 'E-shop Metal Bed',
    icon: '🛏️',
    category: 'bedroom',
    prompt: 'Modern Greek bedroom interior, white smooth walls, light oak parquet wooden floor, soft neutral bedding, minimal elegant decor, professional e-shop product photography, natural daylight from window, clean and airy atmosphere, high quality commercial photography background'
  },
  {
    id: 'wooden-bed',
    name: 'E-shop Wooden Bed',
    icon: '🛏️',
    category: 'bedroom',
    prompt: 'Warm Scandinavian-Greek bedroom interior, white walls with wooden accents, herringbone parquet floor, cozy neutral tones, soft ambient lighting, lifestyle product photography for furniture e-shop, minimal decorative elements, professional commercial background'
  },
  {
    id: 'fabric-bed',
    name: 'E-shop Fabric Bed',
    icon: '🛏️',
    category: 'bedroom',
    prompt: 'Elegant modern bedroom, soft grey and white color palette, smooth plastered walls, light colored wooden floor, luxurious linen bedding, soft diffused lighting, premium furniture e-shop photography background, Greek home interior style'
  },
  {
    id: 'nightstand',
    name: 'E-shop Nightstand',
    icon: '🌙',
    category: 'bedroom',
    prompt: 'Minimalist bedroom corner, white walls, light wooden parquet floor, soft bedside lamp glow, small potted plant, neutral tones, professional product photography setting for Greek furniture e-shop, clean background'
  },
  {
    id: 'wardrobe',
    name: 'E-shop Wardrobe',
    icon: '🚪',
    category: 'bedroom',
    prompt: 'Spacious bright bedroom interior, white walls, light oak parquet flooring, tall ceiling, natural daylight, minimal decor, professional e-shop product photography background for wardrobes, Greek contemporary home style, clean and elegant'
  },
  {
    id: 'dresser',
    name: 'E-shop Dresser',
    icon: '🪞',
    category: 'bedroom',
    prompt: 'Contemporary Greek bedroom, smooth white wall background, light wooden floor, elegant minimalist styling, soft natural window light, small mirror and plant accents, professional furniture photography for e-commerce, clean product background'
  },

  // ── LIVING ROOM ───────────────────────────────
  {
    id: 'sofa-modern',
    name: 'Modern Living Room',
    icon: '🛋️',
    category: 'living',
    prompt: 'Modern Greek living room interior, white walls, light oak herringbone floor, large windows with natural light, minimal Scandinavian decor, neutral color palette, professional e-shop product photography background, high-end furniture showcase'
  },
  {
    id: 'sofa-cozy',
    name: 'Cozy Living Room',
    icon: '🏠',
    category: 'living',
    prompt: 'Cozy contemporary living room, warm white walls, medium oak parquet floor, soft warm lighting, decorative pillows visible, Greek home atmosphere, lifestyle furniture photography for e-shop, welcoming and elegant background'
  },
  {
    id: 'coffee-table',
    name: 'Living Room Corner',
    icon: '☕',
    category: 'living',
    prompt: 'Stylish living room corner, white walls, light wooden floor, green plant accent, natural afternoon light, clean minimal background for furniture product photography, Greek interior design style, professional e-commerce backdrop'
  },
  {
    id: 'tv-unit',
    name: 'E-shop TV Unit',
    icon: '📺',
    category: 'living',
    prompt: 'Modern Greek living room wall setting, clean white wall, light parquet floor, minimal artwork hint, soft ambient lighting, professional product photo background for TV units and media furniture, contemporary e-shop style'
  },

  // ── DINING ────────────────────────────────────
  {
    id: 'dining-table',
    name: 'E-shop Dining Table',
    icon: '🍽️',
    category: 'dining',
    prompt: 'Bright modern Greek dining area, white walls, light oak floor, large window with natural daylight, minimal table setting, Scandinavian-Mediterranean fusion style, professional furniture e-shop photography background, clean and elegant'
  },
  {
    id: 'dining-chairs',
    name: 'E-shop Dining Chairs',
    icon: '🪑',
    category: 'dining',
    prompt: 'Contemporary Greek dining room, smooth white walls, herringbone light wood flooring, pendant light hint above, natural bright light, minimal elegant setting, professional product photography background for chairs, e-commerce quality'
  },

  // ── OUTDOOR ────────────────────────────────────
  {
    id: 'outdoor-terrace',
    name: 'Greek Terrace',
    icon: '🌊',
    category: 'outdoor',
    prompt: 'Beautiful Greek Mediterranean terrace, whitewashed stone floor, Aegean sea view in the background, bright blue sky, warm golden sunlight, potted olive trees, professional outdoor furniture photography for Greek e-shop, summer lifestyle feel'
  },
  {
    id: 'outdoor-garden',
    name: 'Greek Garden',
    icon: '🌿',
    category: 'outdoor',
    prompt: 'Elegant Greek garden setting, lush green Mediterranean plants, stone tile patio, warm afternoon sunlight with soft shadows, natural organic background, professional outdoor furniture photography for e-shop, relaxed lifestyle atmosphere'
  },
  {
    id: 'outdoor-balcony',
    name: 'Greek Balcony',
    icon: '🏙️',
    category: 'outdoor',
    prompt: 'Modern Greek apartment balcony, city or sea view, clean white railing, marble-look floor tiles, warm evening light, contemporary urban lifestyle, professional product photography background for balcony and outdoor furniture'
  },
  {
    id: 'plastic-outdoor',
    name: 'Plastic Outdoor',
    icon: '📦',
    category: 'outdoor',
    prompt: 'Clean outdoor setting, light stone patio floor, bright natural daylight, minimal outdoor background, professional product photography for plastic and resin furniture, Greek home exterior, clear and crisp background'
  },
  {
    id: 'summer-pool',
    name: 'Summer Pool',
    icon: '🏊',
    category: 'outdoor',
    prompt: 'Luxurious Greek villa pool area, crystal blue pool water in background, white marble tiles, bright Mediterranean summer sun, palm tree shadows, aspirational lifestyle background for outdoor and poolside furniture photography'
  },

  // ── OFFICE / KIDS ──────────────────────────────
  {
    id: 'home-office',
    name: 'Home Office',
    icon: '💼',
    category: 'office',
    prompt: 'Modern Greek home office interior, white walls, light wooden floor, natural daylight from window, clean minimal desk setup, professional work-from-home atmosphere, e-shop product photography background for office furniture'
  },
  {
    id: 'kids-room',
    name: 'Kids Room',
    icon: '🧸',
    category: 'kids',
    prompt: 'Bright cheerful Greek kids bedroom, white walls with soft pastel accents, light colored wooden floor, playful but minimal decoration, warm natural light, professional product photography background for children furniture, safe and cozy atmosphere'
  },

  // ── SPECIAL ────────────────────────────────────
  {
    id: 'loft-concrete',
    name: 'Urban Loft',
    icon: '🏗️',
    category: 'studio',
    prompt: 'Modern urban loft interior, exposed concrete walls, polished concrete floor, industrial minimal style, soft overhead lighting, high ceilings, contemporary architectural background for furniture photography, moody urban chic atmosphere'
  },
  {
    id: 'marble-luxury',
    name: 'Marble Luxury',
    icon: '💎',
    category: 'studio',
    prompt: 'Ultra-luxury interior, white Carrara marble floor and walls, golden accent details, soft glowing ambient light, high-end lifestyle furniture photography background, premium Greek villa aesthetic, aspirational luxury atmosphere'
  },
];

// Helper: get scene by id
function getSceneById(id) {
  return SCENES.find(s => s.id === id) || null;
}

// Helper: group scenes by category
function getScenesByCategory() {
  const groups = {};
  SCENES.forEach(scene => {
    if (!groups[scene.category]) groups[scene.category] = [];
    groups[scene.category].push(scene);
  });
  return groups;
}

// Build full prompt for image generation
function buildImagePrompt(scene, customPrompt, aspectRatio) {
  let base = scene ? scene.prompt : '';
  if (customPrompt && customPrompt.trim()) base = customPrompt.trim();

  const arMap = { '1:1': '--ar 1:1', '16:9': '--ar 16:9', '9:16': '--ar 9:16', '4:3': '--ar 4:3' };
  const arHint = arMap[aspectRatio] || '';
  const suffix = 'photorealistic, high resolution, professional commercial photography, suitable for Greek furniture e-shop product listing';

  return `${base}, ${suffix} ${arHint}`.trim();
}

// Map aspect ratio to router.claude.gg format
function arToRouterFormat(ar) {
  const map = { '1:1': 'square_1_1', '16:9': 'widescreen_16_9', '9:16': 'social_story_9_16', '4:3': 'traditional_3_4', '2:3': 'portrait_2_3' };
  return map[ar] || 'square_1_1';
}