# Chibi Sticker Event App — CLAUDE.md

## Project Overview
A marketing event web app where users scan a QR code, fill out a form, upload a selfie, and get an AI-generated chibi sticker composited with a brand frame to download and share.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS (in `client/`)
- **Backend**: Express.js + Node.js (in `server/`)
- **AI**: OpenAI `gpt-image-1` via `images.edit` endpoint
- **Storage**: Local filesystem + JSON files

## Project Structure
```
/
├── server/           # Express backend
│   ├── index.js      # Entry point, port 3000
│   ├── routes/       # generate.js, submit.js
│   ├── services/     # aiService.js, cacheService.js
│   ├── middleware/   # rateLimit.js
│   └── data/         # JSON data files + cache/
├── client/           # Vite + React frontend
│   ├── src/
│   │   ├── components/  # Landing, InfoForm, PhotoUpload, GeneratingView, FrameComposer
│   │   ├── hooks/       # useImageCrop, useCanvas
│   │   └── utils/       # imageUtils, shareUtils
│   └── public/
├── config/
│   └── default.json  # Campaign config
└── scripts/
    └── setup.sh
```

## Development Commands
```bash
# Install all dependencies
npm run install:all

# Run dev (server + client concurrently)
npm run dev

# Build client for production
npm run build

# Production start
npm run start
```

## Environment Variables
Copy `.env.example` to `.env` and fill in:
```
OPENAI_API_KEY=sk-...       # Required for real AI generation
PORT=3000                   # Server port
MAX_RETRIES_PER_USER=3      # Max AI generations per phone number
AI_SPENDING_LIMIT=80        # Max USD spend
```

## Key Architecture Decisions

### AI Flow (aiService.js)
- Uses `openai.images.edit` with `gpt-image-1` model
- Requires image as File/Buffer (not base64 string directly)
- Uses `toFile()` from openai package to convert base64 Buffer → File
- Falls back to mock response when `OPENAI_API_KEY` is not set (development)
- Cost tracked at $0.06/request in `server/data/spending.json`

### Rate Limiting
- Per-user: max 3 generations per phone number (configurable)
- Per-IP: 1 generate request per 30 seconds (in-memory Map)
- Per-IP: 10 submit requests per minute

### Caching
- Image cache keyed by SHA-256 hash of input image (first 16 chars)
- Cached PNGs stored in `server/data/cache/`

### User Flow (Steps)
1. **Landing** (step 1) — Campaign info, CTA
2. **InfoForm** (step 2) — Name, phone, email, story → POST /api/submit
3. **PhotoUpload** (step 3) — Camera/gallery, EXIF fix, resize, crop → triggers generate
4. **GeneratingView** (step 3.5) — Progress bar, rotating messages, handles API response
5. **FrameComposer** (step 4) — Canvas compositing, frame selector, name overlay, download/share

### Image Processing (client/src/utils/imageUtils.js)
- `fixOrientation`: manual EXIF parsing (no external lib)
- `resizeImage`: canvas-based, max 1024px, JPEG 0.85
- `cropSquare`: center crop to square
- `imageToBase64`: FileReader to data URL
- `hashImage`: SubtleCrypto SHA-256

## Vietnamese Phone Validation
Regex: `/^(0[2-9]\d{8}|84[2-9]\d{8})$/`

## Data Files
- `server/data/submissions.json` — Array of form submissions
- `server/data/usage.json` — `{ phone: count }` for per-user limits
- `server/data/spending.json` — `{ total, limit, requests, history }`
- `server/data/cache/` — Cached PNG files (gitignored)
