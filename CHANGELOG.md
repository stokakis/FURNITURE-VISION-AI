# FurnitureVision AI – Changelog
## ideaepipla.gr

---

## v1.2.0 – 2026-04-22 (Dual API Strategy)

### 🔧 Αλλαγές
- **config.js**: Προσθήκη `IMAGE_MODEL: 'gemini-3-pro-image-preview'`
- **api.js**: Νέα dual-strategy αρχιτεκτονική για image generation:
  - **Strategy 1 (Primary)**: `beta.vertexapis.com` + `gemini-3-pro-image-preview` → επιστρέφει inline base64 εικόνα
  - **Strategy 2 (Fallback)**: `gemini.vertexapis.com` wrapper → επιστρέφει URL
- **api.js**: `downloadImageFromUrl()` υποστηρίζει πλέον και data URLs (base64)
- **app.js**: Status check ελέγχει πλέον το `beta.vertexapis.com` (το σωστό API)
- **app.js**: Clickable status dot για manual recheck

### 🧪 API Tests (2026-04-22)
| Endpoint | Status | Σημείωση |
|----------|--------|----------|
| `beta.vertexapis.com` (gemini-3-flash-preview) | ✅ 200 | Chat ✅ |
| `beta.vertexapis.com` (gemini-3-pro-image-preview) | ✅ Active | Image generation (returns base64) |
| `gemini.vertexapis.com/api/generate/image` | ⚠️ 502 | Fallback |
| `beta.vertexapis.com` (gemini-3-pro-preview) | ❌ 404 | N/A |
| `beta.vertexapis.com` (gemini-2.5-flash-image-preview) | ❌ 404 | N/A |

---

## v1.1.0 – 2026-04-22 (API Fixes + Local Server)

### 🔧 Διορθώσεις
- **config.js**: Chat model → `gemini-3-flash-preview`
- **api.js**: Chat uses `?key=` query param
- **api.js**: Retry logic για image generation
- **app.js**: API status indicator στο navbar
- **app.js**: Offline banner

### ➕ Νέα Αρχεία
- **server.py**: Python HTTP server (localhost:8080)
- **START_APP.bat**: Double-click εκκίνηση

---

## v1.0.0 – 2026-04-22 (Initial Release)

### Αρχεία
- `index.html`, `css/styles.css`, `js/config.js`, `js/scenes.js`
- `js/api.js`, `js/imageEditor.js`, `js/batchEdit.js`
- `js/videoGenerator.js`, `js/claudeAI.js`, `js/app.js`

### Σκηνές Φόντου (20)
Bedroom, Living Room, Dining, Outdoor, Office/Kids, Studio

---

## 🚀 Εκκίνηση

**Μέθοδος 1 (Συνιστάται):** Double-click `START_APP.bat` → http://localhost:8080

**Μέθοδος 2:** Άνοιξε `index.html` απευθείας στον browser

---

## Μελλοντικές Βελτιώσεις
- [ ] ZIP batch download
- [ ] Ιστορικό εικόνων (localStorage)
- [ ] Custom σκηνές
- [ ] Dark mode
- [ ] WooCommerce integration