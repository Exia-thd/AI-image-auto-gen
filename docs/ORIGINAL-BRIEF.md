# Chibi Sticker Event App

## Overview

Web app cho sự kiện marketing: người tham gia quét QR → điền thông tin → upload ảnh selfie → AI gen chibi sticker → ghép vào frame thương hiệu → tải về / chia sẻ.

Chạy local tại sự kiện: Node.js server trên laptop, user kết nối cùng wifi, QR trỏ vào IP local.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js (Node.js)
- **AI API**: OpenAI GPT-4o image generation (gọi qua internet từ server)
- **Storage**: Local filesystem (ảnh cache), JSON file (form data)
- **No database** — không cần DB cho sự kiện ngắn hạn

## Project Structure

```
chibi-event/
├── CLAUDE.md
├── SPEC.md
├── package.json
├── server/
│   ├── index.js              # Express server entry
│   ├── routes/
│   │   ├── generate.js       # POST /api/generate — gọi AI API
│   │   └── submit.js         # POST /api/submit — lưu form data
│   ├── services/
│   │   ├── aiService.js      # Gọi OpenAI API, xử lý response
│   │   └── cacheService.js   # Hash-based cache cho AI output
│   ├── middleware/
│   │   └── rateLimit.js      # Rate limit per IP/phone
│   └── data/
│       ├── submissions.json  # Form data log
│       └── cache/            # Cached AI-generated images
├── client/
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx           # Router + step management
│   │   ├── components/
│   │   │   ├── Landing.jsx       # Step 1: KV + nút tham gia
│   │   │   ├── InfoForm.jsx      # Step 2: Form thông tin
│   │   │   ├── PhotoUpload.jsx   # Step 3: Upload + crop ảnh
│   │   │   ├── GeneratingView.jsx # Step 3.5: Loading animation
│   │   │   ├── FrameComposer.jsx # Step 4: Ghép frame + download/share
│   │   │   └── ui/
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       └── LoadingSpinner.jsx
│   │   ├── hooks/
│   │   │   ├── useImageCrop.js   # Crop + resize logic
│   │   │   └── useCanvas.js      # Canvas compositing
│   │   ├── utils/
│   │   │   ├── imageUtils.js     # Resize, EXIF fix, hash
│   │   │   └── shareUtils.js     # Web Share API + fallback
│   │   └── assets/
│   │       ├── frames/           # Frame PNG files (transparent)
│   │       └── kv/               # Key visual images
│   └── public/
│       └── favicon.ico
├── config/
│   └── default.json          # Campaign config (xem SPEC.md)
└── scripts/
    └── setup.sh              # Install deps + check env
```

## Commands

```bash
# Install
npm install

# Development (concurrent server + client)
npm run dev

# Production (build client + serve)
npm run build
npm start

# Chạy tại sự kiện
# 1. Kết nối laptop vào wifi sự kiện
# 2. Đặt OPENAI_API_KEY trong .env
# 3. npm start
# 4. Truy cập http://<laptop-ip>:3000
# 5. Tạo QR code trỏ vào URL trên
```

## Environment Variables

```
OPENAI_API_KEY=sk-...          # Required
PORT=3000                       # Default 3000
MAX_RETRIES_PER_USER=3          # Giới hạn gen per SĐT
AI_SPENDING_LIMIT=80            # USD, tự động dừng khi hết
```

## Coding Conventions

- Vietnamese comments cho business logic, English cho technical comments
- Error messages hiển thị cho user bằng tiếng Việt
- Mobile-first responsive (95% user sẽ dùng điện thoại)
- Mọi async operation cần try-catch + user-friendly error
- Console.log spending mỗi lần gọi AI API để theo dõi chi phí

## Constraints

- Ảnh upload resize xuống max 1024px trước khi gửi AI (tiết kiệm cost + tốc độ)
- Canvas output 1080x1080 (vuông, phù hợp social media)
- Response timeout cho AI API: 60 giây
- Cache AI output theo SHA256 hash của ảnh input
- Rate limit: 1 request / 30 giây / IP
