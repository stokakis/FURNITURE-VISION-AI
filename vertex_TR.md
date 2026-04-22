# Vertex AI API Documentation

> gemini.vertexapis.com & beta.vertexapis.com - Google Gemini Modelleri

---

## Genel Bilgiler

Google Cloud Vertex AI modelleri için iki farklı erişim noktası sunulmaktadır:

### 1. gemini.vertexapis.com (Wrapper API)
- Basitleştirilmiş, yüksek seviyeli görüntü ve video üretim API'si
- Senkron görüntü üretimi (5-15 saniye)
- Asenkron video üretimi (polling ile, 30-120 saniye)

### 2. beta.vertexapis.com (Native API)
- Google'ın orijinal Vertex AI API formatı
- Gemini 3 Pro/Flash modelleri
- Chat completions, görüntü üretimi

---

## GEMINI.VERTEXAPIS.COM

Base URL: https://gemini.vertexapis.com

### Authentication (3 yöntem)
```
Authorization: Bearer VERTEX_API_KEY
```
veya
```
x-api-key: VERTEX_API_KEY
```
veya
```
?key=VERTEX_API_KEY
```

### Rate Limits
- Saatlik: 50 istek
- Günlük: 500 istek
- Kontrol: GET /key/status

### Endpoint'ler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | /health | API sağlık kontrolü |
| GET | /key/status | API key durumu ve kalan kullanım |
| POST | /api/generate/image | Senkron görüntü üretimi |
| POST | /api/generate/video | Asenkron video üretimi başlat |
| GET | /api/video/status/{jobId} | Video job durumu |

---

## GEMINI IMAGE GENERATION (Senkron)

Endpoint: POST https://gemini.vertexapis.com/api/generate/image

Ortalama süre: 5-15 saniye

Parametreler:
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | Evet | Üretilecek görüntünün açıklaması |
| referenceUrl | string | Hayır | Referans görsel URL'i |
| referenceBase64 | string | Hayır | Referans görsel Base64 (data:image/... prefix ile) |

İstek Örneği:
```json
{
  "prompt": "A beautiful sunset over mountains"
}
```

Referans Görsel ile:
```json
{
  "prompt": "Make this image more colorful",
  "referenceUrl": "https://example.com/image.jpg"
}
```

Yanıt:
```json
{
  "success": true,
  "path": "/images/generated_image.png",
  "url": "https://gemini.vertexapis.com/images/generated_image.png"
}
```

### cURL Örneği
```bash
curl -X POST https://gemini.vertexapis.com/api/generate/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VERTEX_API_KEY" \
  -d '{
    "prompt": "A futuristic city at night"
  }'
```

---

## VEO 3.1 GEMINI VIDEO GENERATION (Asenkron)

Endpoint: POST https://gemini.vertexapis.com/api/generate/video
Status: GET https://gemini.vertexapis.com/api/video/status/{jobId}

Ortalama süre: 30-120 saniye

### 2 Adımlı Akış:
1. İstek gönder → jobId al
2. Polling ile sonucu takip et (5-10 saniyede bir)

Parametreler:
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | Evet | Video açıklaması |
| aspectRatio | string | Hayır | 16:9, 9:16, 1:1 |
| resolution | string | Hayır | 720p, 1080p |
| durationSeconds | integer | Hayır | Video süresi (varsayılan: 8) |
| generateAudio | boolean | Hayır | Ses üret |
| personGeneration | string | Hayır | allow_adult |
| negativePrompt | string | Hayır | Negatif prompt |
| seed | integer | Hayır | Rastgelelik tohumu |
| model | string | Hayır | veo-3.1-generate |
| referenceBase64 | string | Hayır | Base64 referans görsel (I2V) |

İstek Örneği:
```json
{
  "prompt": "Cinematic nature documentary",
  "aspectRatio": "16:9",
  "resolution": "1080p",
  "durationSeconds": 8,
  "generateAudio": true,
  "model": "veo-3.1-generate"
}
```

### JavaScript Polling Örneği
```javascript
const API_KEY = "YOUR_VERTEX_API_KEY";
const BASE = "https://gemini.vertexapis.com";

// Adım 1: İş başlat
const videoResponse = await fetch(`${BASE}/api/generate/video`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`
  },
  body: JSON.stringify({ prompt: "Birds flying at sunset" })
});
const job = await videoResponse.json();
const jobId = job.jobId;

// Adım 2: Polling
const pollVideo = async () => {
  while (true) {
    const statusRes = await fetch(
      `${BASE}/api/video/status/${jobId}`,
      { headers: { "Authorization": `Bearer ${API_KEY}` } }
    );
    const status = await statusRes.json();

    if (status.url) {
      console.log("Video URL:", status.url);
      return status;
    } else if (status.error) {
      throw new Error(status.error);
    }

    await new Promise(r => setTimeout(r, 5000));
  }
};
await pollVideo();
```

---

## BETA.VERTEXAPIS.COM (Native Vertex API)

Base URL: https://beta.vertexapis.com

### Authentication
```
x-goog-api-key: YOUR_VERTEX_API_KEY
Content-Type: application/json
```

### Rate Limits
- Günlük: 3500 istek

### Desteklenen Modeller

| Model ID | Model Adı | Hız | Kalite |
|----------|-----------|-----|--------|
| gemini-3-pro-preview | Gemini 3 Pro | Yavaş | Mükemmel |
| gemini-3-flash-preview | Gemini 3 Flash | Hızlı | İyi |
| gemini-2.5-flash-image-preview | Gemini 2.5 Flash Image | Hızlı | İyi |
| gemini-3-pro-image-preview | Gemini 3 Pro Image | Yavaş | Mükemmel |

---

## GEMINI 3 PRO CHAT COMPLETIONS

Endpoint: POST https://beta.vertexapis.com/v1/projects/test/locations/global/publishers/google/models/gemini-3-pro-preview:generateContent

Parametreler:
| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| contents | array | Evet | Mesaj listesi (role, parts) |
| generationConfig.temperature | float | Hayır | Varsayılan 1.0 |
| generationConfig.maxOutputTokens | integer | Hayır | Maksimum 65535 |
| generationConfig.topP | float | Hayır | Varsayılan 0.95 |
| generationConfig.thinkingConfig.thinkingBudget | integer | Hayır | -1 (sınırsız) |
| tools | array | Hayır | googleSearch vb. |
| safetySettings | array | Hayır | Güvenlik ayarları |

İstek Örneği:
```json
{
  "contents": [
    { "role": "user", "parts": [{ "text": "Kuantum bilgisayarları basitçe açıkla" }] }
  ],
  "generationConfig": {
    "temperature": 1.0,
    "maxOutputTokens": 65535,
    "topP": 0.95,
    "thinkingConfig": { "thinkingBudget": -1 }
  },
  "tools": [{ "googleSearch": {} }],
  "safetySettings": [
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "OFF" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "OFF" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "OFF" },
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "OFF" }
  ]
}
```

---

## GEMINI IMAGE GENERATION (beta.vertexapis.com)

Endpoint: POST https://beta.vertexapis.com/v1/projects/test/locations/global/publishers/google/models/{modelId}:generateContent

Model ID'ler:
- gemini-2.5-flash-image-preview (hızlı)
- gemini-3-pro-image-preview (yüksek kalite)

İstek Örneği:
```json
{
  "contents": [{
    "role": "user",
    "parts": [
      { "text": "A cyberpunk cat wearing neon sunglasses --ar 1:1" }
    ]
  }],
  "generationConfig": {
    "temperature": 1.0,
    "topP": 0.95
  },
  "safetySettings": [
    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" }
  ]
}
```

**NOT:** Aspect ratio için prompt'a `--ar 16:9` gibi ekleyebilirsiniz.

---

## HATA KODLARI

### gemini.vertexapis.com
| Kod | Anlam | Açıklama |
|-----|-------|----------|
| 400 | Bad Request | Zorunlu alan eksik (ör. prompt) |
| 401 | Unauthorized | API key eksik veya geçersiz format |
| 403 | Forbidden | Geçersiz API key |
| 429 | Too Many Requests | Rate limit aşıldı |
| 500 | Internal Server Error | Sunucu hatası |

### beta.vertexapis.com
| Kod | Anlam | Açıklama |
|-----|-------|----------|
| 400 | Invalid request | Request body formatını kontrol edin |
| 401 | Unauthorized | x-goog-api-key header'ını kontrol edin |
| 429 | Rate limit | 1-2 dakika bekleyip tekrar deneyin |
| 500 | Server error | Tekrar deneyin |

---

© 2026 Cortex AI
