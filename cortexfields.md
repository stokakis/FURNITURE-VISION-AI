# CortexFields API Dokümantasyonu

> Görsel ve video üretimi için birleşik yapay zeka API'si.

## Genel Bilgiler

**Base URL:** `https://router.claude.gg`

### Üretim Endpoint'i

```
POST https://router.claude.gg/api/generate
Content-Type: application/json
Authorization: Bearer YOUR_API_KEY
```

### İstek Yapısı

```json
{
  "model": "model-adı",
  "type": "istek-tipi",
  "params": {
    "...": "modele özgü parametreler"
  }
}
```

### Yanıt Yapısı

```json
{
  "task_id": "f578692c-6475-4d85-b4c2-32a97af506ff",
  "url": "https://router.claude.gg/get/f578692c-6475-4d85-b4c2-32a97af506ff",
  "status": "PROCESSING"
}
```

### Sonuç Sorgulama

```
GET https://router.claude.gg/get/{task_id}
```

```json
{
  "status": "FINISHED",
  "result": ["https://delivery.example.com/results/sample.jpeg"]
}
```

### Durum Değerleri

| Durum | Açıklama |
|-------|----------|
| PROCESSING | İşlem devam ediyor |
| FINISHED | Tamamlandı, sonuç hazır |
| FAILED | İşlem başarısız oldu |
| ERROR | Sistem hatası |
| CANCELLED | İptal edildi |

---

## Görsel Üretimi (image-generation)

### Flux Kontext Pro

`model: flux-kontext-pro` | `type: text-to-image`

Metinden yüksek kaliteli görsel üretir. Opsiyonel referans görsel desteği.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Üretilecek görseli tanımlayan metin |
| input_image | string | hayır | null | Referans görsel URL'i |
| prompt_upsampling | boolean | hayır | false | Prompt otomatik zenginleştirme |
| seed | number | hayır | null | Tekrarlanabilir üretim için |
| guidance | number | hayır | 3 | Prompt uyum katsayısı (1–10) |
| steps | number | hayır | 50 | Üretim adım sayısı (1–100) |
| aspect_ratio | string | hayır | square_1_1 | En/boy oranı |
| safety_tolerance | number | hayır | 2 | İçerik güvenlik filtresi (0–6) |
| output_format | string | hayır | jpeg | jpeg / png |

### Flux Pro v1.1

`model: flux-pro-v1-1` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Üretilecek görseli tanımlayan metin |
| aspect_ratio | string | hayır | square_1_1 | En/boy oranı |
| safety_tolerance | number | hayır | 2 | İçerik güvenlik filtresi (0–6) |
| seed | number | hayır | — | Tekrarlanabilir üretim |
| prompt_upsampling | boolean | hayır | false | Prompt zenginleştirme |
| output_format | string | hayır | — | jpeg / png |

### Flux 2 Pro

`model: flux-2-pro` | `type: text-to-image`

Serbest boyut, max 4 referans görsel.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Üretilecek görseli tanımlayan metin |
| width | number | hayır | 1024 | Genişlik (256–1440 px) |
| height | number | hayır | 768 | Yükseklik (256–1440 px) |
| seed | number | hayır | — | Tekrarlanabilir üretim |
| prompt_upsampling | boolean | hayır | false | Prompt zenginleştirme |
| input_image | string | hayır | — | Referans görsel (Base64) |
| input_image_2 | string | hayır | — | 2. referans görsel |
| input_image_3 | string | hayır | — | 3. referans görsel |
| input_image_4 | string | hayır | — | 4. referans görsel |

### Flux 2 Turbo

`model: flux-2-turbo` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Üretilecek görseli tanımlayan metin |
| image_size.width | number | hayır | 1024 | Genişlik (512–2048 px) |
| image_size.height | number | hayır | 1024 | Yükseklik (512–2048 px) |
| guidance_scale | number | hayır | 2.5 | Prompt uyum katsayısı (1–20) |
| seed | number | hayır | — | Tekrarlanabilir üretim |
| enable_safety_checker | boolean | hayır | true | Güvenlik denetleyici |
| output_format | string | hayır | png | jpeg / png |

### Flux 2 Klein

`model: flux-2-klein` | `type: text-to-image`

Sub-second üretim. Max 4 referans görsel.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Üretilecek görseli tanımlayan metin |
| aspect_ratio | string | hayır | square_1_1 | En/boy oranı (10 seçenek) |
| resolution | string | hayır | 1k | 1k / 2k |
| seed | number | hayır | — | Tekrarlanabilir üretim |
| input_image | string | hayır | — | Stil/konu transferi (Base64) |
| input_image_2/3/4 | string | hayır | — | Ek referans görseller |
| safety_tolerance | number | hayır | 2 | İçerik filtresi (0–5) |
| output_format | string | hayır | — | png / jpeg |

### Flux Dev

`model: flux-dev` | `type: text-to-image`

Stil efektleri ve renk kontrolüyle görsel üretir.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | hayır | Üretilecek görseli tanımlayan metin |
| aspect_ratio | string | hayır | En/boy oranı (10 seçenek) |
| seed | number | hayır | Tekrarlanabilir üretim (1–4294967295) |
| styling.effects.color | string | hayır | softhue / b&w / goldglow / vibrant / coldneon |
| styling.effects.framing | string | hayır | portrait / lowangle / midshot / wideshot / tiltshot / aerial |
| styling.effects.lightning | string | hayır | iridescent / dramatic / goldenhour / longexposure / indorlight / flash / neon |
| styling.colors | array | hayır | 1–5 öge: {color: "#RRGGBB", weight: 0.05–1} |

### HyperFlux

`model: hyperflux` | `type: text-to-image`

Flux ailesinin en hızlı modeli. Flux Dev ile özdeş parametre yapısı.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | hayır | Üretilecek görseli tanımlayan metin |
| aspect_ratio | string | hayır | En/boy oranı |
| seed | number | hayır | Tekrarlanabilir üretim |
| styling | object | hayır | effects (color/framing/lightning), colors |

### Mystic

`model: mystic` | `type: text-to-image`

Gelişmiş AI iş akışı. LoRA, stil ve yapı referansı destekler.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | hayır | — | @karakter sözdizimi desteklenir |
| model | string | hayır | realism | realism / fluid / zen / flexible / super_real / editorial_portraits |
| resolution | string | hayır | 2k | 1k / 2k / 4k |
| aspect_ratio | string | hayır | square_1_1 | 13 seçenek |
| creative_detailing | number | hayır | 33 | 0–100 |
| engine | string | hayır | automatic | automatic / magnific_illusio / magnific_sharpy / magnific_sparkle |
| structure_reference | string | hayır | — | Yapı referansı (Base64) |
| structure_strength | number | hayır | 50 | 0–100 |
| style_reference | string | hayır | — | Stil referansı (Base64) |
| adherence | number | hayır | 50 | 0–100 |
| hdr | number | hayır | 50 | 0–100 |
| filter_nsfw | boolean | hayır | true | Uygunsuz içerik filtresi |
| fixed_generation | boolean | hayır | false | Tekrarlanabilir üretim |
| styling.styles | array | hayır | — | Maks 1 öge: {name, strength (0–200)} |
| styling.characters | array | hayır | — | Maks 1 öge: {id, strength (0–200)} |
| styling.colors | array | hayır | — | 1–5 öge: {color, weight} |

> fluid modeli yalnızca 5 aspect ratio destekler: square_1_1, social_story_9_16, widescreen_16_9, traditional_3_4, classic_4_3

### Reimagine Flux (Beta)

`model: reimagine-flux` | `type: text-to-image`

Mevcut görseli metin promptuyla yeniden hayal ettirir. **Senkron API** — polling gerekmez.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Görselin nasıl yeniden hayal edileceği |
| image | string | EVET | Kaynak görsel URL veya Base64 |

### Seedream 4

`model: seedream-v4` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Üretilecek görseli tanımlayan metin |
| aspect_ratio | string | hayır | square_1_1 | 8 seçenek |
| seed | number | hayır | — | 0–4294967295 |
| enable_safety_checker | boolean | hayır | true | Güvenlik denetleyici |

### Seedream 4.5

`model: seedream-v4-5` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Üretilecek görseli tanımlayan metin (maks 4096 karakter) |
| aspect_ratio | string | hayır | square_1_1 | 8 seçenek |
| seed | number | hayır | — | 0–4294967295 |
| enable_safety_checker | boolean | hayır | true | Güvenlik denetleyici |

### Seedream V5 Lite

`model: seedream-v5-lite` | `type: text-to-image`

Seedream 4.5 ile özdeş parametre yapısı.

### RunWay Gen4 Image

`model: runway` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Maks 1000 karakter |
| ratio | string | EVET | width:height formatında (örn. 1920:1080) |
| seed | number | hayır | 0–4294967295 |

Desteklenen ratio değerleri: `1920:1080`, `1080:1920`, `1024:1024`, `1360:768`, `1080:1080`, `1168:880`, `1440:1080`, `1080:1440`, `1808:768`, `2112:912`, `1280:720`, `720:1280`, `720:720`, `960:720`, `720:960`, `1680:720`

### Z-Image

`model: z-image` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Üretilecek görseli tanımlayan metin |
| image_size.width | number | hayır | Genişlik (serbest boyut) |
| image_size.height | number | hayır | Yükseklik (serbest boyut) |

---

## Görsel Düzenleme (image-editing)

### Seedream 4 — Düzenleme

`model: seedream-v4-edit` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Yapılacak değişikliği açıklayan metin |
| image | string | EVET | Düzenlenecek görsel URL veya Base64 |

### Seedream 4.5 — Düzenleme

`model: seedream-v5-lite-edit` | `type: text-to-image`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Yapılacak değişikliği açıklayan metin |
| reference_images | array | EVET | Base64 veya URL; maks 10MB/görsel; maks 4 görsel |
| aspect_ratio | string | hayır | 8 seçenek |
| seed | number | hayır | 0–4294967295 |
| enable_safety_checker | boolean | hayır | true |

### Seedream V5 Lite — Düzenleme

`model: seedream-v5-lite-edit` | `type: text-to-image`

Seedream 4.5 Düzenleme ile özdeş parametre yapısı.

---

## Video Üretimi (video-generation)

### Kling 3 Pro / Standard

`model: kling-v3-pro / kling-v3-std` | `type: video`

T2V ve I2V destekler, multi-shot modu (maks 6 sahne).

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | hayır | — | Maks 2500 karakter; T2V için zorunlu |
| negative_prompt | string | hayır | — | Maks 2500 karakter |
| aspect_ratio | string | hayır | 16:9 | 16:9 / 9:16 / 1:1 |
| duration | number | hayır | 5 | 3–15 saniye |
| cfg_scale | number | hayır | 0.5 | 0–1 |
| generate_audio | boolean | hayır | true | Doğal ses üretimi |
| start_image_url | string | hayır | — | Başlangıç karesi görseli |
| end_image_url | string | hayır | — | Bitiş karesi görseli |
| multi_shot | boolean | hayır | false | Çok sahneli mod |
| shot_type | string | hayır | customize | customize / intelligent |
| multi_prompt | object[] | hayır | — | [{prompt, duration}], maks 6 sahne |
| elements | object[] | hayır | — | [{reference_image_urls, frontal_image_url}] |

### Kling 3 Omni Pro / Standard

`model: kling-v3-omni-pro / kling-v3-omni-std` | `type: video`

Çok modlu: T2V, I2V, element tutarlılığı, video referansı.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | koşullu | T2V için zorunlu; @Image1, @Element1, @Video1 sözdizimi |
| image_url | string | hayır | Başlangıç karesi |
| start_image_url | string | hayır | Alternatif başlangıç karesi |
| end_image_url | string | hayır | Bitiş karesi |
| image_urls | string[] | hayır | Stil referansları; @Image1/@Image2 ile kullanılır |
| elements | object[] | hayır | [{reference_image_urls, frontal_image_url}] |
| multi_prompt | object[] | hayır | Çok sahneli; maks 6 sahne |
| aspect_ratio | string | hayır | 16:9 / 9:16 / 1:1 |
| duration | number | hayır | 3–15 saniye |
| generate_audio | boolean | hayır | Doğal ses üretimi |
| voice_ids | string[] | hayır | Anlatım sesi; << >> ile işaretlenir |

### Kling 3 Motion Control Pro / Standard

`model: kling-v3-motion-control-pro / kling-v3-motion-control-std` | `type: video`

Referans videodan hareketi karakter görseline aktarır.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| image_url | string | EVET | Karakter görseli; JPG/PNG/WEBP; min 300×300px; maks 10MB |
| video_url | string | EVET | Referans video; MP4/MOV/WEBM/M4V; 3–30 saniye |
| prompt | string | hayır | Maks 2500 karakter |
| character_orientation | string | hayır | video (maks 30s çıktı) / image (maks 10s) |
| cfg_scale | number | hayır | 0–1 |

### Kling Elements Pro / Standard

`model: kling-elements-pro / kling-elements-std` | `type: image-to-video`

> Eş zamanlı maksimum 3 istek desteklenir.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| image | string | EVET | Başlangıç karesi; maks 10MB; min 300×300px |
| prompt | string | hayır | Maks 2500 karakter |
| duration | string | hayır | "5" / "10" |
| aspect_ratio | string | hayır | 16:9 / 9:16 / 1:1 |
| negative_prompt | string | hayır | Maks 2500 karakter |
| cfg_scale | number | hayır | 0–1 |

### Kling v2.6 Pro

`model: kling-v3-pro` | `type: video`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Maks 2500 karakter |
| duration | string | EVET | "5" veya "10" (string!) |
| aspect_ratio | string | hayır | widescreen_16_9 / social_story_9_16 / square_1_1 |
| negative_prompt | string | hayır | Maks 2500 karakter |
| cfg_scale | number | hayır | 0–1 |
| generate_audio | boolean | hayır | — |
| image | string | hayır | Base64/URL; I2V modu için |

> KRITIK: duration string olmalıdır: "5" veya "10". Integer gönderilmesi 400 hatası verir.

### Kling v2.6 Motion Control

`model: kling-v3-motion-control-pro` | `type: video`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| image | string | EVET | Base64/URL; maks 10MB |
| duration | string | EVET | "5" veya "10" |
| prompt | string | hayır | — |
| video_url | string | hayır | Referans video URL |
| character_orientation | string | hayır | video / image |

### Kling v2.5 Pro

`model: kling-v2-5-pro` | `type: image-to-video`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Maks 2500 karakter |
| image | string | EVET | Base64/URL; maks 10MB; min 300×300px |
| duration | string | hayır | "5" / "10" |
| aspect_ratio | string | hayır | widescreen_16_9 / social_story_9_16 / square_1_1 |
| cfg_scale | number | hayır | 0–1 |
| negative_prompt | string | hayır | — |

### Kling v2.1 Pro

`model: kling-v2-1-pro` | `type: image-to-video`

Kling v2.5 Pro ile aynı parametre yapısı.

### Kling v2.1 Standard / Master

`model: kling-v2-1-std / kling-v2-1-master` | `type: image-to-video`

Kling v2.1 Pro ile aynı parametre yapısı.

### Kling O1 Pro — Frame Interpolation

`model: kling-o1-pro` | `type: image-to-video`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| first_frame | string | koşullu* | URL veya Base64; min 300×300px; maks 10MB |
| last_frame | string | koşullu* | Aynı kısıtlamalar |
| prompt | string | hayır | Maks 2500 karakter |
| aspect_ratio | string | hayır | 16:9 / 9:16 / 1:1 |
| duration | number | hayır | 5 / 10 saniye |

*first_frame veya last_frame'den en az biri zorunlu.

### Kling O1 Pro — Video Reference

`model: kling-o1-pro` | `type: image-to-video`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Maks 2500 karakter |
| reference_images | array | hayır | Maks 7 referans görsel |
| aspect_ratio | string | hayır | 16:9 / 9:16 / 1:1 |
| duration | number | hayır | 5 / 10 saniye |

### MiniMax Hailuo 2.3 1080p

`model: minimax-hailuo-2-3-1080p-fast` | `type: image-to-video`

> KRITIK: duration yalnızca 6 (integer) kabul eder.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 2000 karakter |
| first_frame_image | string | hayır | — | URL veya Base64; JPG/PNG; kısa kenar >300px; maks 20MB |
| last_frame_image | string | hayır | — | Aynı kısıtlamalar |
| duration | number | hayır | 6 | Yalnızca 6 |
| prompt_optimizer | boolean | hayır | true | — |

### MiniMax Hailuo 02 1080p

`model: minimax-hailuo-02-1080p` | `type: image-to-video`

MiniMax Hailuo 2.3 ile aynı parametre yapısı.

### MiniMax Live

`model: minimax-video-01-live` | `type: image-to-video`

MiniMax Hailuo 2.3 ile aynı parametre yapısı.

### LTX Video 2.0 Pro

`model: ltx-2-pro` | `type: text-to-video`

4K'ya kadar çözünürlük, opsiyonel ses üretimi.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 2000 karakter |
| resolution | string | hayır | 1080p | 1080p / 1440p / 2160p |
| duration | number | hayır | 6 | 6 / 8 / 10 (integer) |
| fps | number | hayır | 25 | 25 / 50 (50fps: maks 10s) |
| generate_audio | boolean | hayır | false | Senkronize ses üretimi |
| seed | number | hayır | — | 0–4294967295 |

### LTX Video 2.0 Fast

`model: ltx-2-fast` | `type: text-to-video`

T2V ve I2V. 6–20 saniye süre. 4K'ya kadar.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 2000 karakter |
| image | string | hayır | — | I2V modu için başlangıç karesi |
| resolution | string | hayır | 1080p | 1080p / 1440p / 2160p |
| duration | number | hayır | 6 | 6–20 (2'li adımlar; >10s yalnızca 1080p/25fps) |
| fps | number | hayır | 25 | 25 / 50 (50fps: maks 10s) |
| generate_audio | boolean | hayır | false | Senkronize ses üretimi |
| seed | number | hayır | — | 0–4294967295 |

### OmniHuman 1.5

`model: omni-human-1-5` | `type: video`

Ses dosyasıyla insan figürü animasyonu.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| image_url | string | EVET | — | jpg/jpeg/png/webp; insan figürü içermeli |
| audio_url | string | EVET | — | MP3/OGG/WAV/M4A/AAC; 720p maks 60s, 1080p maks 30s |
| prompt | string | hayır | — | Hareket/ifade yönlendirmesi; maks 2000 karakter |
| turbo_mode | boolean | hayır | false | Hızlı üretim, düşük kalite |
| resolution | string | hayır | 1080p | 720p / 1080p |

### VFX — Video Görsel Efektleri

`model: vfx` | `type: video`

Mevcut videoya sinematik görsel efekt uygular.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| video | string | EVET | — | Halka açık video URL (MP4/MOV/WebM) |
| filter_type | number | hayır | 1 | 1–8 |
| fps | number | hayır | 24 | 1–60 |
| bloom_filter_contrast | number | hayır | — | Yalnızca filter_type=7 |
| motion_filter_kernel_size | number | hayır | — | Yalnızca filter_type=2 |
| motion_filter_decay_factor | number | hayır | — | Yalnızca filter_type=2 |

Filtre tipleri: 1=Film Grain, 2=Motion Blur, 3=Fish Eye, 4=VHS, 5=Shake, 6=VGA, 7=Bloom, 8=Anamorphic Lens

### WAN 2.7 Text-to-Video

`model: wan-2-7-t2v` | `type: text-to-video`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 5000 karakter |
| negative_prompt | string | hayır | — | Maks 500 karakter |
| audio_url | string | hayır | — | WAV/MP3; 2–30s; maks 15MB |
| aspect_ratio | string | hayır | 16:9 | 16:9 / 9:16 / 1:1 / 4:3 / 3:4 |
| resolution | string | hayır | 1080P | 720P / 1080P |
| duration | number | hayır | 5 | 2–15 saniye |
| seed | number | hayır | — | 0–2147483647 |
| additional_settings.prompt_extend | boolean | hayır | true | AI prompt genişletme |

### WAN 2.7 Image-to-Video

`model: wan-2-7-i2v` | `type: image-to-video`

3 mod: ilk kare animasyonu, ilk+son kare geçişi, video uzatma.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | hayır | Maks 5000 karakter |
| negative_prompt | string | hayır | Maks 500 karakter |
| start_image_url | string | koşullu* | JPEG/PNG/BMP/WEBP; 240–8000px; maks 20MB |
| end_image_url | string | hayır | Bitiş karesi |
| video_url | string | koşullu* | MP4/MOV; 2–10s; maks 100MB |
| audio_url | string | hayır | WAV/MP3; 2–30s; maks 15MB |
| resolution | string | hayır | 720P / 1080P |
| duration | number | hayır | 2–15 saniye |
| seed | number | hayır | 0–2147483647 |
| additional_settings.prompt_extend | boolean | hayır | AI prompt genişletme |

*start_image_url veya video_url'den biri zorunlu.

### WAN 2.5 Text-to-Video (480p/720p/1080p)

`model: wan-2-5-t2v-480p / wan-2-5-t2v-720p / wan-2-5-t2v-1080p` | `type: text-to-video`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 800 karakter |
| duration | string | hayır | "5" | "5" / "10" |
| negative_prompt | string | hayır | — | Maks 500 karakter |
| enable_prompt_expansion | boolean | hayır | true | AI prompt genişletme |
| seed | number | hayır | — | 0–2147483647 |

### WAN 2.5 Image-to-Video (480p/720p/1080p)

`model: wan-2-5-i2v-480p / wan-2-5-i2v-720p / wan-2-5-i2v-1080p` | `type: image-to-video`

WAN 2.5 T2V ile aynı parametre yapısı; ek olarak `image` (zorunlu) alanı eklenir.

### WAN v2.6 Text-to-Video

`model: wan-v2-6-text` | `type: text-to-video`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 2000 karakter |
| size | string | hayır | 1920*1080 | 1920*1080 / 1080*1920 / 1440*1440 / 1632*1248 / 1248*1632 |
| duration | string | hayır | "5" | "5" / "10" / "15" |
| negative_prompt | string | hayır | — | Maks 1000 karakter |
| enable_prompt_expansion | boolean | hayır | false | AI prompt genişletme |
| shot_type | string | hayır | single | single / multi |
| seed | number | hayır | -1 | -1–2147483647 |

### WAN v2.6 Image-to-Video

`model: wan-v2-6-image` | `type: image-to-video`

WAN v2.6 Text ile aynı; ek olarak `image` (zorunlu, URL; JPEG/PNG/WebP; 240–8000px; maks 10MB) alanı eklenir.

### WAN v2.6 1080p

`model: wan-v2-6-1080p` | `type: image-to-video`

WAN v2.6 Image ile özdeş parametre yapısı; çıktı 1080p.

### WAN v2.6 720p

`model: wan-v2-6-720p` | `type: image-to-video`

WAN v2.6 Image ile özdeş parametre yapısı; çıktı 720p.

### Seedance 1.5 Pro (480p/720p/1080p)

`model: seedance-1-5-pro-480p / seedance-1-5-pro-720p / seedance-1-5-pro-1080p` | `type: video`

T2V ve I2V. Senkronize ses üretimi.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 2000 karakter |
| image | string | hayır | — | URL veya Base64; sağlanırsa I2V modu |
| duration | string | hayır | "5" | "5" / "10" |
| aspect_ratio | string | hayır | widescreen_16_9 | 7 seçenek |
| camera_fixed | boolean | hayır | false | Kamera sabit |
| frames_per_second | number | hayır | 24 | Yalnızca 24 |
| seed | number | hayır | -1 | -1–4294967295 |

### Seedance Pro 1080p

`model: seedance-pro-1080p` | `type: image-to-video`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 2000 karakter |
| image | string | hayır | — | URL veya Base64 |
| duration | string | hayır | "5" | "5" / "10" |
| aspect_ratio | string | hayır | widescreen_16_9 | 7 seçenek |
| camera_fixed | boolean | hayır | false | Kamera sabit |
| frames_per_second | number | hayır | 24 | Yalnızca 24 |
| seed | number | hayır | -1 | -1–4294967295 |

### PixVerse V5

`model: pixverse-v5` | `type: image-to-video`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| image | string | EVET | URL veya Base64 |
| prompt | string | hayır | Hareket/stil açıklaması |

### RunWay Gen 4.5

`model: runway-4-5` | `type: text-to-video / image-to-video`

T2V parametreleri:

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | Maks 2000 karakter |
| ratio | string | hayır | 1280:720 | 1280:720 / 720:1280 / 1104:832 / 960:960 / 832:1104 |
| duration | number | hayır | 5 | 5 / 8 / 10 |

I2V için `image` (EVET) ve `seed` (hayır) ek parametreleri eklenir.

### RunWay Gen4 Turbo

`model: runway-gen4-turbo` | `type: image-to-video`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| image | string | EVET | — | HTTPS URL veya Base64; JPEG/PNG/WebP |
| prompt | string | EVET | — | Maks 2000 karakter |
| ratio | string | hayır | 1280:720 | 1280:720 / 720:1280 / 1104:832 / 960:960 / 832:1104 |
| duration | number | hayır | 5 | 5 / 8 / 10 |
| seed | number | hayır | — | 0–4294967295 |

### RunWay Act Two

`model: runway-act-two` | `type: video`

Karakter performans videosu. Referans videodan hareket aktarımı.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| image | string | koşullu* | Karakter görseli URL veya Base64 |
| video | string | koşullu* | Karakter videosu URL veya Base64 |
| reference_video | string | EVET | Hareket alınacak referans video |

*image veya video'dan biri zorunlu.

---

## Referanslı Video (reference-to-video)

### WAN 2.7 Reference-to-Video

`model: wan-2-7-r2v` | `type: reference-to-video`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| prompt | string | EVET | — | "Image 1", "Video 1" referans etiketleri kullan |
| image_urls | array | koşullu* | — | JPEG/PNG/BMP/WEBP; 240–8000px; maks 20MB |
| video_urls | array | koşullu* | — | MP4/MOV; maks 100MB |
| start_image_url | string | hayır | — | İlk kare |
| aspect_ratio | string | hayır | 16:9 | 16:9 / 9:16 / 1:1 / 4:3 / 3:4 |
| resolution | string | hayır | 1080P | 720P / 1080P |
| duration | number | hayır | 5 | 2–10 saniye |

*image_urls + video_urls toplamı maks 5; en az biri zorunlu.

---

## Dudak Senkronizasyonu (lip-sync)

### Latent Sync

`model: latent-sync` | `type: lip-sync`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| video | string | EVET | Senkronize edilecek video URL |
| audio | string | EVET | Ses dosyası URL; MP3/WAV/AAC |

### Veed Fabric 1.0

`model: veed-fabric-1-0` | `type: lip-sync`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| image_url | string | EVET | Portre görseli URL; ön cepheli, net yüz |
| audio_url | string | EVET | Ses URL; MP3/WAV/M4A |
| resolution | string | EVET | "720p" (1280×720) / "480p" (854×480) |

### Veed Fabric 1.0 Fast

`model: veed-fabric-1-0-fast` | `type: lip-sync`

Veed Fabric 1.0 ile özdeş parametre yapısı; daha hızlı işlem.

---

## Müzik Üretimi (music-generation)

### ElevenLabs Müzik

`model: elevenlabs` | `type: music-generation`

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| prompt | string | EVET | Tür, ruh hali, enstrüman, tempo belirtin. Maks 2500 karakter |
| music_length_seconds | number | EVET | 10–240 saniye |

---

## Ses Efektleri (sound-effects)

### Ses Efektleri

`model: sound-effects` | `type: sound-effects`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| text | string | EVET | — | Maks 2500 karakter |
| duration_seconds | number | EVET | — | 0.5–22 saniye |
| loop | boolean | hayır | false | Döngüsel ses efekti |
| prompt_influence | number | hayır | 0.3 | 0–1 |

---

## Ses İzolasyonu (audio-isolation)

### Ses İzolasyonu

`model: audio-isolation` | `type: audio-isolation`

Çıktı WAV formatında döner.

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| description | string | EVET | — | İzole edilecek sesin doğal dil tanımı |
| audio | string | koşullu* | — | WAV/MP3/FLAC/OGG/M4A |
| video | string | koşullu* | — | MP4/MOV/WEBM/AVI |
| x1 | number | hayır | 0 | Video çerçeve sol koordinatı |
| y1 | number | hayır | 0 | Video çerçeve üst koordinatı |
| x2 | number | hayır | 0 | Video çerçeve sağ koordinatı |
| y2 | number | hayır | 0 | Video çerçeve alt koordinatı |
| sample_fps | number | hayır | 2 | 1–5 FPS |
| reranking_candidates | number | hayır | 1 | 1–8; yüksek = daha iyi kalite |
| predict_spans | boolean | hayır | false | Anlık sesler için daha iyi izolasyon |

*audio veya video'dan biri zorunlu; ikisi aynı anda kullanılamaz.

---

## Seslendirme (voiceover)

### Seslendirme (Text-to-Speech)

`model: voiceover` | `type: voiceover`

| Parametre | Tip | Zorunlu | Varsayılan | Açıklama |
|-----------|-----|---------|------------|----------|
| text | string | EVET | — | UTF-8; 1–40.000 karakter |
| voice_id | string | EVET | — | Ses kütüphanesi kimliği |
| model | string | hayır | eleven_turbo_v2_5 | AI ses sentez modeli |
| stability | number | hayır | 0.5 | 0.0–1.0 (0=ifadeli, 1=tutarlı) |
| similarity_boost | number | hayır | 0.2 | 0.0–1.0 |
| speed | number | hayır | 1.0 | 0.7–1.2 |
| use_speaker_boost | boolean | hayır | true | Ses netliği geliştirme |

> Örnek voice_id: `21m00Tcm4TlvDq8ikWAM` (Rachel — sakin, profesyonel kadın sesi)

---

## Aspect Ratio Referans Tablosu

### Görsel Modeller (Seedream, Flux Pro, Flux Dev, HyperFlux)

| Değer | Oran |
|-------|------|
| square_1_1 | 1:1 |
| widescreen_16_9 | 16:9 |
| social_story_9_16 | 9:16 |
| portrait_2_3 | 2:3 |
| traditional_3_4 | 3:4 |
| standard_3_2 | 3:2 |
| classic_4_3 | 4:3 |
| cinematic_21_9 | 21:9 |

### Video Modeller (Kling)

| Değer | Oran |
|-------|------|
| widescreen_16_9 | 16:9 |
| social_story_9_16 | 9:16 |
| square_1_1 | 1:1 |

### Seedance Pro (7 seçenek)

| Değer | Oran |
|-------|------|
| film_horizontal_21_9 | 21:9 |
| widescreen_16_9 | 16:9 |
| classic_4_3 | 4:3 |
| square_1_1 | 1:1 |
| traditional_3_4 | 3:4 |
| social_story_9_16 | 9:16 |
| film_vertical_9_21 | 9:21 |

### WAN v2.6 (size string)

| Değer | Oran |
|-------|------|
| 1920*1080 | 16:9 |
| 1080*1920 | 9:16 |
| 1440*1440 | 1:1 |
| 1632*1248 | 4:3 |
| 1248*1632 | 3:4 |

### RunWay Gen 4.5 (ratio string)

| Değer | Oran |
|-------|------|
| 1280:720 | 16:9 Yatay |
| 720:1280 | 9:16 Dikey |
| 1104:832 | 4:3 |
| 960:960 | 1:1 |
| 832:1104 | 3:4 |