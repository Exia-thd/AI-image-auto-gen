const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const { generateLimit } = require('../middleware/rateLimit');
const cacheService = require('../services/cacheService');
const { generateChibi, COST_PER_REQUEST } = require('../services/aiService');

// Giới hạn số AI request chạy đồng thời — tránh hammering OpenAI khi nhiều người quét QR cùng lúc
const MAX_CONCURRENT_AI = 3;
let activeAiRequests = 0;

// Data file paths
const DATA_DIR = path.join(__dirname, '../data');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');
const SPENDING_FILE = path.join(DATA_DIR, 'spending.json');

// Initialize data files if they don't exist
function initDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USAGE_FILE)) {
    fs.writeFileSync(USAGE_FILE, JSON.stringify({}), 'utf8');
  }
  if (!fs.existsSync(SPENDING_FILE)) {
    fs.writeFileSync(
      SPENDING_FILE,
      JSON.stringify({ total: 0, limit: 80, requests: 0, history: [] }),
      'utf8'
    );
  }
}

initDataFiles();

function readUsage() {
  try {
    const raw = fs.readFileSync(USAGE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeUsage(data) {
  fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readSpending() {
  try {
    const raw = fs.readFileSync(SPENDING_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { total: 0, limit: 80, requests: 0, history: [] };
  }
}

function writeSpending(data) {
  fs.writeFileSync(SPENDING_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// POST /api/generate
router.post('/', generateLimit, async (req, res) => {
  try {
    const { phone, image } = req.body;

    // Validate inputs
    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp ảnh để tạo sticker.',
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp số điện thoại.',
      });
    }

    // Check per-user retry limit
    const maxRetries = parseInt(process.env.MAX_RETRIES_PER_USER || '3', 10);
    const usage = readUsage();
    const userCount = usage[phone] || 0;

    if (userCount >= maxRetries) {
      return res.status(429).json({
        success: false,
        error: `Bạn đã sử dụng hết ${maxRetries} lượt tạo sticker. Cảm ơn bạn đã tham gia!`,
        limitReached: true,
      });
    }

    // Check global spending limit
    const spendingLimit = parseFloat(process.env.AI_SPENDING_LIMIT || '80');
    const spending = readSpending();
    if (spending.total >= spendingLimit) {
      return res.status(429).json({
        success: false,
        error: 'Chương trình đã đạt giới hạn ngân sách. Vui lòng liên hệ ban tổ chức.',
        budgetExceeded: true,
      });
    }

    // Hash the image for cache lookup
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const hash = crypto
      .createHash('sha256')
      .update(base64Data)
      .digest('hex')
      .substring(0, 16);

    console.log(`[Generate] Request from phone: ${phone}, image hash: ${hash}`);

    // Check cache
    const cached = cacheService.get(hash);
    if (cached) {
      console.log(`[Generate] Cache hit for hash: ${hash}`);
      const cachedBase64 = cached.toString('base64');
      return res.json({
        success: true,
        image: cachedBase64,
        cached: true,
        cost: 0,
      });
    }

    // Generate chibi via AI
    console.log(`[Generate] Cache miss — calling AI for hash: ${hash}`);

    if (activeAiRequests >= MAX_CONCURRENT_AI) {
      console.log(`[Generate] Server busy: ${activeAiRequests}/${MAX_CONCURRENT_AI} concurrent AI requests`);
      return res.status(503).json({
        success: false,
        error: 'Hệ thống đang bận, vui lòng thử lại sau 30 giây.',
        retryAfter: 30,
      });
    }

    activeAiRequests++;
    let chibiBase64;
    try {
      chibiBase64 = await generateChibi(image);
    } catch (aiError) {
      console.error('[Generate] AI error:', aiError.message);
      return res.status(500).json({
        success: false,
        error: aiError.message || 'Lỗi tạo sticker. Vui lòng thử lại.',
      });
    } finally {
      activeAiRequests--;
    }

    // Save to cache
    const imageBuffer = Buffer.from(chibiBase64, 'base64');
    cacheService.set(hash, imageBuffer);

    // Update usage count for this phone
    usage[phone] = userCount + 1;
    writeUsage(usage);

    // Update spending
    const updatedSpending = readSpending();
    updatedSpending.total = parseFloat((updatedSpending.total + COST_PER_REQUEST).toFixed(4));
    updatedSpending.requests = (updatedSpending.requests || 0) + 1;
    updatedSpending.history = updatedSpending.history || [];
    updatedSpending.history.push({
      timestamp: new Date().toISOString(),
      phone,
      hash,
      cost: COST_PER_REQUEST,
    });
    writeSpending(updatedSpending);

    console.log(
      `[Generate] Success. Total spent: $${updatedSpending.total}, requests: ${updatedSpending.requests}`
    );

    return res.json({
      success: true,
      image: chibiBase64,
      cached: false,
      cost: COST_PER_REQUEST,
      remainingRetries: maxRetries - (userCount + 1),
    });
  } catch (err) {
    console.error('[Generate] Unexpected error:', err);
    return res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.',
    });
  }
});

module.exports = router;
