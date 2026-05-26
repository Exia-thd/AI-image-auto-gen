# SPEC.md — Chibi Sticker Event App

## Campaign Config

File `config/default.json` cho phép thay đổi nội dung mà không sửa code:

```json
{
  "campaign": {
    "name": "Hà Nội Yên Của Tôi",
    "brand": "La Vie",
    "startDate": "2024-06-01",
    "endDate": "2024-06-30",
    "description": "Chia sẻ góc Yên của bạn, nhận quà thú vị từ La Vie"
  },
  "form": {
    "fields": [
      { "key": "fullName", "label": "Họ và tên", "type": "text", "required": true },
      { "key": "phone", "label": "Số điện thoại", "type": "tel", "required": true },
      { "key": "email", "label": "Email", "type": "email", "required": false },
      { "key": "story", "label": "Câu chuyện của bạn", "type": "textarea", "required": false, "maxLength": 500 }
    ]
  },
  "frames": [
    { "id": "frame1", "name": "Classic", "file": "frame_classic.png" },
    { "id": "frame2", "name": "Vintage", "file": "frame_vintage.png" }
  ],
  "ai": {
    "provider": "openai",
    "model": "gpt-4o",
    "maxRetriesPerUser": 3,
    "spendingLimitUSD": 80,
    "prompt": "SEE BELOW"
  },
  "output": {
    "width": 1080,
    "height": 1080,
    "format": "png",
    "quality": 0.92
  }
}
```

---

## Step 1: Landing Page (`Landing.jsx`)

### UI
- Full-screen mobile layout
- Key Visual ảnh nền (từ `assets/kv/`)
- Logo thương hiệu
- Tên chương trình (from config)
- Thời gian chương trình
- Nút CTA "THAM GIA CHƯƠNG TRÌNH" — nổi bật, lớn, dễ bấm
- Thể lệ chương trình (collapsible hoặc link)

### Logic
- Không có logic phức tạp
- Click CTA → navigate sang Step 2
- Nên có animation nhẹ khi load (fade-in KV, slide-up button)

### Design Notes
- KV image nên là `background-image` với `object-fit: cover`
- Nút CTA tối thiểu 48px height, full-width trên mobile
- Text trắng trên nền ảnh → cần text-shadow hoặc overlay gradient

---

## Step 2: Info Form (`InfoForm.jsx`)

### UI
- Header: logo + tên chương trình (nhỏ hơn Landing)
- Form fields: render từ `config.form.fields`
- Mỗi field: label, input, error message
- Nút "TIẾP TỤC" ở dưới
- Checkbox đồng ý điều khoản

### Logic

```
onSubmit:
  1. Validate all required fields
     - fullName: not empty, min 2 chars
     - phone: Vietnamese phone regex /^(0[2-9]\d{8}|84[2-9]\d{8})$/
     - email: standard email regex (if not empty)
  2. POST /api/submit { fields, timestamp }
  3. Server lưu vào submissions.json (append)
  4. Response OK → navigate Step 3
  5. Response error → hiện toast error
```

### API: POST /api/submit

```
Request:
{
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "a@gmail.com",
  "story": "...",
  "timestamp": "2024-06-15T10:30:00Z"
}

Response 200:
{ "success": true, "id": "uuid-v4" }

Response 400:
{ "success": false, "error": "Số điện thoại không hợp lệ" }
```

### Server Logic (`routes/submit.js`)

```
1. Validate fields
2. Generate UUID cho submission
3. Append to data/submissions.json
4. Return { success: true, id }
```

submissions.json format:
```json
[
  {
    "id": "uuid",
    "fullName": "...",
    "phone": "...",
    "email": "...",
    "story": "...",
    "timestamp": "...",
    "createdAt": "server-timestamp"
  }
]
```

---

## Step 3: Photo Upload (`PhotoUpload.jsx`)

### UI
- Instruction text: "Tải ảnh của bạn lên (1 tấm duy nhất)"
- Hai nút:
  - "Chụp ảnh" → camera capture (`input accept="image/*" capture="environment"`)
  - "Chọn từ thư viện" → file picker (`input accept="image/*"`)
- Preview ảnh sau khi chọn (vuông, crop center)
- Drag/pinch để chỉnh vị trí ảnh trong vùng crop (nice-to-have, có thể skip v1)
- Nút "TẠO STICKER" — chỉ enable khi đã chọn ảnh
- Nút "Quay lại" nhỏ ở góc

### Logic

```
onImageSelect:
  1. Read file via FileReader
  2. Fix EXIF orientation (quan trọng cho iOS)
     - Dùng lib: browser-image-compression hoặc tự đọc EXIF
  3. Resize xuống max 1024px (giữ aspect ratio)
     - Dùng OffscreenCanvas hoặc canvas element
  4. Center-crop thành hình vuông 1024x1024
  5. Convert thành base64 JPEG (quality 0.85)
  6. Hiển thị preview

onCreateSticker:
  1. Disable nút, hiện loading
  2. Navigate sang GeneratingView
  3. POST /api/generate { image: base64, phone }
  4. Xử lý response ở GeneratingView
```

### Image Processing Utils (`utils/imageUtils.js`)

```javascript
// Cần implement:

fixOrientation(file) → Promise<Blob>
// Đọc EXIF orientation tag, rotate canvas nếu cần
// iOS Safari thường trả về ảnh bị xoay 90°

resizeImage(blob, maxSize=1024) → Promise<Blob>
// Scale down giữ aspect ratio
// Output JPEG quality 0.85

cropSquare(blob) → Promise<Blob>
// Center-crop thành hình vuông

imageToBase64(blob) → Promise<string>
// Convert blob to data URL

hashImage(base64) → string
// SHA256 hash cho cache key
// Dùng SubtleCrypto API
```

---

## Step 3.5: Generating View (`GeneratingView.jsx`)

### UI
- Animation thú vị trong lúc đợi AI gen (15-30 giây)
- Ý tưởng animation:
  - Ảnh user nhỏ dần, chuyển thành chibi outline
  - Particles/sparkle effect xung quanh
  - Progress bar giả (0→90% trong 25s, 90→100% khi nhận response)
  - Text thay đổi: "Đang phân tích khuôn mặt..." → "Đang vẽ chibi..." → "Sắp xong rồi..."
- Nút "Hủy" nếu đợi quá lâu

### Logic

```
onMount:
  1. Start fake progress bar animation
  2. Gọi POST /api/generate (đã trigger từ Step 3)
  3. onSuccess → navigate Step 4 with chibi image data
  4. onError:
     - Timeout → hiện "Thử lại?" button
     - Rate limit → hiện "Vui lòng đợi X giây"
     - Spending limit → hiện "Chương trình tạm hết lượt, vui lòng quay lại sau"
     - Generic error → hiện "Có lỗi xảy ra, thử lại?"
  5. Retry: quay lại Step 3 với ảnh đã chọn
```

---

## API: POST /api/generate

```
Request:
{
  "image": "data:image/jpeg;base64,...",
  "phone": "0901234567"
}

Response 200:
{
  "success": true,
  "image": "data:image/png;base64,...",
  "cached": false,
  "cost": 0.06
}

Response 429:
{ "success": false, "error": "rate_limit", "retryAfter": 30 }

Response 402:
{ "success": false, "error": "spending_limit" }

Response 400:
{ "success": false, "error": "max_retries", "message": "Bạn đã hết lượt tạo sticker" }

Response 500:
{ "success": false, "error": "ai_error", "message": "..." }
```

### Server Logic (`routes/generate.js`)

```
1. Extract phone, image from body
2. Check rate limit (middleware):
   - 1 request / 30s / IP
   - → 429 if exceeded
3. Check retry count cho phone:
   - Đọc từ data/usage.json
   - phone → count mapping
   - → 400 if count >= MAX_RETRIES_PER_USER
4. Check spending limit:
   - Đọc từ data/spending.json (tổng chi phí tích lũy)
   - → 402 if total >= AI_SPENDING_LIMIT
5. Hash ảnh input → check cache:
   - Hash = SHA256 của base64 image
   - Nếu file data/cache/{hash}.png tồn tại → trả cached image, skip AI call
6. Gọi AI Service:
   - aiService.generateChibi(imageBase64)
   - Timeout: 60s
7. Lưu output vào cache: data/cache/{hash}.png
8. Cập nhật usage.json: phone count +1
9. Cập nhật spending.json: total += estimatedCost
10. Log: timestamp, phone, hash, cost, cached (cho analytics)
11. Trả response
```

### AI Service (`services/aiService.js`)

```javascript
// OpenAI GPT-4o Image Generation
//
// Gọi: POST https://api.openai.com/v1/images/generations
// hoặc Chat Completions with image input + image output
//
// Flow:
// 1. Nhận base64 JPEG từ route
// 2. Gọi OpenAI API:

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: AI_PROMPT  // xem mục Prompt Engineering bên dưới
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: "high"
          }
        }
      ]
    }
  ],
  // Nếu dùng image generation endpoint thì khác
  // Cần check API docs mới nhất tại thời điểm implement
});

// 3. Extract generated image từ response
// 4. Nếu API trả về URL → fetch về thành base64
// 5. Return base64 PNG
```

### Cache Service (`services/cacheService.js`)

```javascript
// Hash-based file cache
//
// get(hash) → Buffer | null
//   Đọc file data/cache/{hash}.png
//
// set(hash, imageBuffer) → void
//   Ghi file data/cache/{hash}.png
//
// Hash = SHA256(base64_image_string).substring(0, 16)
//   16 chars đủ unique cho vài ngàn ảnh
```

---

## AI Prompt Engineering

### Main Prompt (đặt trong config)

```
Transform this person's photo into a cute chibi sticker with the following requirements:

STYLE:
- Chibi/kawaii anime style
- Big head (approximately 60% of body), small cute body
- Large expressive eyes with sparkle/highlight
- Simplified but recognizable facial features of the person
- Clean bold outlines suitable for sticker use
- Soft pastel coloring with vibrant accents

REQUIREMENTS:
- MUST maintain recognizable likeness to the person (hair color, hairstyle, skin tone, glasses if wearing, distinctive features)
- Pure white background (for easy background removal)
- Full body visible (head to toe)
- Character facing forward or slight 3/4 angle
- Happy/cheerful expression
- Size: character should fill 80% of the image area

DO NOT:
- Add text or watermarks
- Add complex backgrounds or scenery
- Make the character look generic — it must resemble the specific person
- Use realistic proportions — keep it chibi
```

### Prompt Variants (test từng cái để chọn)

Có thể thêm variants tùy campaign:
- Thêm outfit: "Character wearing a white La Vie branded t-shirt"
- Thêm props: "Character holding a water bottle"
- Thêm theme: "Character surrounded by small flower/nature elements"

### Testing Checklist

Trước sự kiện, test prompt với:
- [ ] Ảnh selfie ánh sáng tốt
- [ ] Ảnh selfie ánh sáng yếu / tối
- [ ] Ảnh có kính
- [ ] Ảnh có tóc dài / ngắn / nhuộm màu
- [ ] Ảnh nhiều người (nên reject hoặc warning)
- [ ] Ảnh không phải người (reject)

---

## Step 4: Frame Composer (`FrameComposer.jsx`)

### UI
- Hiển thị ảnh chibi đã gen, ghép trong frame
- Frame selector (nếu có nhiều frame): scroll ngang thumbnails
- Preview canvas lớn ở giữa
- Drag chibi trong frame để chỉnh vị trí (nice-to-have)
- Text field nhỏ: "Tên hiển thị trên frame" (render lên canvas)
- Hai nút:
  - "TẢI XUỐNG" — download PNG
  - "HOÀN THÀNH" — trigger share flow
- Row share icons: Zalo, Messenger, Instagram (dùng Web Share API)

### Canvas Compositing Logic (`hooks/useCanvas.js`)

```javascript
// Canvas pipeline:
//
// Layer order (bottom to top):
// 1. Background color hoặc pattern (từ frame)
// 2. Chibi sticker image (positioned & scaled)
// 3. Frame overlay PNG (transparent, chứa border + branding)
// 4. User name text (nếu có)
//
// Implementation:

function compositeImage({ chibiBase64, frameUrl, userName, outputSize }) {
  const canvas = document.createElement('canvas');
  canvas.width = outputSize;   // 1080
  canvas.height = outputSize;  // 1080
  const ctx = canvas.getContext('2d');

  // 1. White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw chibi (centered, with padding for frame border)
  // Chibi vùng safe area: inset 10% mỗi bên
  const padding = canvas.width * 0.1;
  const chibiSize = canvas.width - (padding * 2);
  const chibiImg = await loadImage(chibiBase64);
  ctx.drawImage(chibiImg, padding, padding, chibiSize, chibiSize);

  // 3. Frame overlay (full size, trùm lên trên)
  const frameImg = await loadImage(frameUrl);
  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

  // 4. User name (nếu có, vẽ ở vùng designated trên frame)
  if (userName) {
    ctx.font = 'bold 36px "Be Vietnam Pro", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(userName, canvas.width / 2, canvas.height - 60);
  }

  return canvas.toDataURL('image/png', 0.92);
}
```

### Download Logic

```javascript
function downloadImage(dataUrl, filename) {
  const link = document.createElement('a');
  link.download = filename || 'chibi-sticker.png';
  link.href = dataUrl;
  link.click();
}
```

### Share Logic (`utils/shareUtils.js`)

```javascript
async function shareImage(dataUrl, title) {
  // Convert data URL to Blob
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], 'chibi-sticker.png', { type: 'image/png' });

  // Thử Web Share API trước (hoạt động trên mobile)
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: title || 'Chibi Sticker của tôi',
        text: 'Xem sticker chibi của mình nè!',
        files: [file]
      });
      return { success: true, method: 'native' };
    } catch (err) {
      if (err.name === 'AbortError') return { success: false, method: 'cancelled' };
    }
  }

  // Fallback: download file
  downloadImage(dataUrl);
  return { success: true, method: 'download' };
}
```

---

## Rate Limiting (`middleware/rateLimit.js`)

```javascript
// In-memory rate limit (đủ cho local server)
//
// Strategy: token bucket per IP
// - 1 request / 30 giây cho /api/generate
// - 10 requests / phút cho /api/submit
//
// Implementation: Map<ip, { lastRequest: timestamp }>
// Không cần Redis cho local deployment

const limits = new Map();

function rateLimit(windowMs, maxRequests) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const record = limits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count++;
    limits.set(key, record);

    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({
        success: false,
        error: 'rate_limit',
        retryAfter
      });
    }

    next();
  };
}
```

---

## Spending Tracker

File `data/spending.json`:
```json
{
  "total": 0,
  "limit": 80,
  "requests": 0,
  "history": [
    { "timestamp": "...", "phone": "...", "cost": 0.06 }
  ]
}
```

Server check trước mỗi AI call:
- `total >= limit` → reject 402
- Sau mỗi call: `total += estimatedCost`, `requests += 1`
- Log mỗi dòng vào `history` để audit

Ước tính cost per request:
- GPT-4o image input: ~$0.01 (1024px image)
- GPT-4o image output: ~$0.04-0.06
- Total: ~$0.05-0.07 per request → dùng $0.06 làm estimate

---

## Frame Asset Spec

Frame PNG cần đáp ứng:
- Kích thước: 1080x1080 pixels
- Format: PNG-32 (with alpha channel)
- Vùng trong suốt ở giữa: để lộ ảnh chibi
- Vùng solid: border, branding, decorations
- Safe area cho chibi: ít nhất 800x800 center
- Nếu có text zone: đánh dấu vị trí Y cho tên user

Đặt tên: `frame_{id}.png` trong `client/src/assets/frames/`

Designer cung cấp frame → dev chỉ cần bỏ vào thư mục + cập nhật config.

---

## Local Server Setup cho Sự Kiện

### Trước sự kiện
1. Clone repo, `npm install`
2. Tạo `.env` với `OPENAI_API_KEY`
3. Bỏ frame PNG vào `client/src/assets/frames/`
4. Cập nhật `config/default.json` theo campaign
5. Test: `npm run dev`, mở http://localhost:3000
6. Test AI gen với vài ảnh mẫu

### Ngày sự kiện
1. Mang laptop, cắm sạc
2. Kết nối wifi sự kiện (hoặc phát hotspot 4G)
3. Xác nhận laptop IP: `hostname -I` hoặc `ipconfig`
4. `npm start`
5. Tạo QR code: https://qr.io/ → nhập `http://{IP}:3000`
6. In QR code hoặc hiển thị trên màn hình lớn
7. Test 1 lần từ điện thoại trước khi mở cho khách

### Monitor trong sự kiện
- Mở terminal thứ 2, chạy: `watch -n 5 cat data/spending.json`
- Xem realtime chi phí + số lượt gen
- Nếu chi phí gần limit → nâng limit trong .env hoặc thông báo MC

### Khi sự kiện kết thúc
- Copy `data/submissions.json` → giao client danh sách người tham gia
- Copy `data/spending.json` → report chi phí
- Thư mục `data/cache/` có thể xóa

---

## Error Handling Matrix

| Lỗi | User thấy | Action |
|------|-----------|--------|
| Ảnh quá lớn (>10MB) | "Ảnh quá lớn, vui lòng chọn ảnh khác" | Block ở client |
| Không phải ảnh | "Vui lòng chọn file ảnh (JPG, PNG)" | Validate MIME type |
| AI API timeout | "Đang tải lâu hơn bình thường..." → "Thử lại?" | Auto-retry 1 lần, rồi hỏi user |
| AI API error | "Có lỗi xảy ra, vui lòng thử lại" | Log error, cho retry |
| Rate limit | "Vui lòng đợi {X} giây" | Hiện countdown |
| Hết lượt (per user) | "Bạn đã hết lượt tạo sticker" | Chuyển thẳng sang "Cảm ơn" page |
| Spending limit | "Chương trình tạm hết lượt, quay lại sau nhé!" | Disable nút gen |
| Mất mạng (server→AI) | "Không kết nối được, kiểm tra internet" | Server detect, trả 503 |
| Mất mạng (user→server) | "Mất kết nối, vui lòng kiểm tra wifi" | Client detect offline |

---

## Performance Notes

- Ảnh resize PHẢI xảy ra ở client trước khi upload (giảm từ 5MB → 200KB)
- Canvas compositing xảy ra ở client (không tốn server resource)
- Server chỉ làm proxy gọi AI API + cache
- Concurrent requests: Express có thể handle 50+ concurrent nếu AI API không throttle
- Nếu quá nhiều người cùng lúc: queue requests, serve theo FIFO

---

## Phase Implementation Order (cho Claude Code)

Chạy từng phase, test xong phase trước mới sang phase sau:

### Phase 1: Project Setup + Landing
```
Prompt: "Set up the project structure as defined in CLAUDE.md. 
Create package.json with React 18 + Vite + Tailwind for client, 
Express for server. Implement Landing.jsx with a placeholder KV image, 
campaign info from config, and CTA button. Mobile-first responsive."
```

### Phase 2: Info Form + Submit API
```
Prompt: "Implement InfoForm.jsx rendering fields from config.form.fields. 
Add Vietnamese phone validation. Create POST /api/submit route that 
appends to submissions.json. Add form validation error UI."
```

### Phase 3: Photo Upload + Image Processing
```
Prompt: "Implement PhotoUpload.jsx with camera capture and file picker. 
Add imageUtils.js with EXIF orientation fix, resize to 1024px, 
center-crop to square, and base64 conversion. Show preview after processing."
```

### Phase 4: AI Generation Backend
```
Prompt: "Implement POST /api/generate route with:
- Rate limiting middleware (1 req/30s per IP)
- Usage tracking per phone number
- Spending tracker
- SHA256 cache check/save
- OpenAI API call with the chibi prompt from SPEC.md
- Proper error handling for all failure modes
Use placeholder/mock response for testing if no API key."
```

### Phase 5: Generating View + Frame Composer
```
Prompt: "Implement GeneratingView.jsx with fake progress bar and fun 
loading messages. Implement FrameComposer.jsx with Canvas compositing: 
draw chibi + overlay frame PNG + optional user name. Add download button 
and Web Share API with fallback."
```

### Phase 6: Polish + Testing
```
Prompt: "Add:
- Loading states and transitions between steps
- Error toasts/modals for all error cases in the matrix
- Back navigation between steps
- iOS Safari compatibility fixes
- Test the full flow end-to-end
- Add console.log spending tracker"
```
