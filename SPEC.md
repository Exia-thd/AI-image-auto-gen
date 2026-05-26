# Chibi Sticker Event App — SPEC.md

## Product Overview

**Chibi Sticker Event App** is a marketing event web application for the "Hà Nội Yên Của Tôi" campaign by La Vie.

**User Flow:**
1. User scans QR code → opens web app on phone
2. Sees campaign landing page → taps "THAM GIA"
3. Fills in info form (name, phone, email, optional story)
4. Uploads selfie (camera or gallery)
5. AI generates chibi sticker from photo
6. User customizes with brand frame + name
7. Downloads/shares sticker on social media

---

## API Endpoints

### POST /api/submit
Register user info for the campaign.

**Request body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0912345678",
  "email": "user@example.com",
  "story": "Góc yên của tôi là..."
}
```

**Response (success):**
```json
{ "success": true, "id": "uuid-v4", "message": "Đăng ký thành công!" }
```

**Validation:**
- `fullName`: required, min 2 chars
- `phone`: required, Vietnamese phone regex `/^(0[2-9]\d{8}|84[2-9]\d{8})$/`
- `email`: optional, valid email format
- `story`: optional, max 500 chars

### POST /api/generate
Generate a chibi sticker from uploaded photo.

**Request body:**
```json
{
  "phone": "0912345678",
  "image": "<base64 encoded image data URL>"
}
```

**Response (success):**
```json
{
  "success": true,
  "image": "<base64 PNG>",
  "cached": false,
  "cost": 0.06,
  "remainingRetries": 2
}
```

**Error cases:**
- 400: Missing image or phone
- 429: Rate limit exceeded (per-IP or per-user)
- 429: Budget exceeded
- 500: AI service error

### GET /api/health
Health check endpoint.

### GET /api/config
Returns safe frontend config (campaign info, form fields, frames).

---

## Frontend Components

### Landing (Step 1)
- Full-screen gradient background (no real KV image needed)
- Campaign name, brand, description, dates
- "THAM GIA CHƯƠNG TRÌNH" CTA button
- Collapsible "Thể lệ" rules section
- Fade-in animation on load

### InfoForm (Step 2)
- Back button
- Form fields: fullName, phone, email (optional), story (optional)
- Vietnamese phone validation on frontend
- POST /api/submit on form submit
- Terms checkbox (required)
- Error display per field
- Toast notifications for server errors

### PhotoUpload (Step 3)
- Two options: camera (front-facing capture) and gallery
- Preview square image after selection
- Client-side processing: EXIF fix → resize (max 1024px) → center crop → base64
- Max file size: 10MB
- "TẠO STICKER NGAY" button (disabled until image processed)
- Tips for good photos

### GeneratingView (Step 3.5)
- Displayed while API call is in-flight
- Fake progress bar: 0→90% over ~25s, then 100% on response
- Rotating status messages every 3.5s
- "Hủy" cancel button
- Error state with retry option
- Auto-navigates to FrameComposer on success

### FrameComposer (Step 4)
- Canvas-composited preview (1080x1080)
- Frame selector (4 color variants)
- User name input → rendered on canvas
- Download button
- Share button (Web Share API → fallback download)
- Social share shortcuts (Facebook, Twitter, Instagram)
- Hashtag suggestion: #HàNộiYênCủaTôi #LaVie

---

## Canvas Compositing Layers

1. **White background** (1080x1080)
2. **Chibi image** (centered, 8% padding on all sides)
3. **Decorative frame** (border, corner accents, brand pill at bottom)
4. **User name** (colored pill badge at top center)

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| POST /api/generate | 1 request / 30s per IP |
| POST /api/submit | 10 requests / 60s per IP |

Per-user limit: max 3 AI generations per phone number (env: `MAX_RETRIES_PER_USER`).

---

## AI Integration

**Model:** `gpt-image-1` via OpenAI SDK  
**Method:** `client.images.edit({ model, image: File, prompt, n: 1, size: "1024x1024" })`  
**Prompt:** Chibi kawaii anime style, recognizable likeness, white background, full body

**Development mode:** When `OPENAI_API_KEY` is not set, returns a mock image (1x1 transparent PNG).

---

## Data Storage

All data stored as JSON files (no database needed):

| File | Contents |
|------|----------|
| `server/data/submissions.json` | Array of user submissions |
| `server/data/usage.json` | `{ "phone": count }` |
| `server/data/spending.json` | `{ total, limit, requests, history }` |
| `server/data/cache/*.png` | Cached generated images |

---

## Campaign Configuration

Edit `config/default.json` to change:
- Campaign name and brand
- Form fields
- Frame files
- AI model and prompt
- Spending limits
- Output image size

---

## Mobile Requirements

- Mobile-first design (works on iPhone/Android browsers)
- `user-scalable=no` viewport meta
- Safe area insets for notch/home indicator
- Camera access via `<input capture="user">`
- Touch-friendly tap targets (min 44px)
- No external font loading (system fonts)
