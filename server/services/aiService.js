const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

// Load config
const config = require('../../config/default.json');

let openaiClient = null;

function getClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      return null;
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Generate a chibi sticker from a base64 image
 * @param {string} imageBase64 - Base64 encoded image (may include data URI prefix)
 * @returns {Promise<string>} - Base64 PNG of the generated chibi image
 */
async function generateChibi(imageBase64) {
  const client = getClient();

  // Development mock: return a placeholder if no API key
  if (!client) {
    console.warn('[AI] No OPENAI_API_KEY set — returning mock chibi image');
    return getMockChibiImage();
  }

  // Strip data URI prefix if present
  let base64Data = imageBase64;
  if (base64Data.includes(',')) {
    base64Data = base64Data.split(',')[1];
  }

  // Convert base64 to Buffer
  const imageBuffer = Buffer.from(base64Data, 'base64');

  // Convert buffer to a File-like object for OpenAI SDK
  const { toFile } = require('openai');
  const imageFile = await toFile(imageBuffer, 'photo.png', { type: 'image/png' });

  const prompt = config.ai.prompt;

  try {
    console.log('[AI] Calling OpenAI images.edit API...');
    const response = await client.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });

    // Response contains b64_json or url
    const imageData = response.data[0];

    if (imageData.b64_json) {
      console.log('[AI] Received base64 image response');
      return imageData.b64_json;
    } else if (imageData.url) {
      // Download the image and convert to base64
      console.log('[AI] Received URL response, downloading...');
      const https = require('https');
      const http = require('http');
      const imageBase64Result = await downloadImageAsBase64(imageData.url);
      return imageBase64Result;
    } else {
      throw new Error('Không nhận được dữ liệu ảnh từ API');
    }
  } catch (err) {
    console.error('[AI] Error calling OpenAI:', err.message);

    if (err.status === 400) {
      throw new Error('Ảnh không hợp lệ hoặc vi phạm chính sách nội dung. Vui lòng thử ảnh khác.');
    } else if (err.status === 429) {
      throw new Error('Hệ thống đang bận. Vui lòng thử lại sau ít phút.');
    } else if (err.status === 401) {
      throw new Error('Lỗi xác thực API. Vui lòng liên hệ ban tổ chức.');
    } else if (err.message && err.message.includes('billing')) {
      throw new Error('Tài khoản AI đã hết hạn mức. Vui lòng liên hệ ban tổ chức.');
    }

    throw new Error(`Lỗi tạo sticker: ${err.message || 'Lỗi không xác định'}`);
  }
}

/**
 * Download an image from URL and return as base64 string
 */
function downloadImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? require('https') : require('http');
    protocol.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString('base64'));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Return a mock chibi image (a simple colored PNG) for development
 * Creates a simple 200x200 pink square as a placeholder
 */
function getMockChibiImage() {
  // Return a minimal valid PNG as base64 (1x1 pink pixel scaled)
  // This is a 100x100 solid color PNG generated inline
  const { createCanvas } = tryRequireCanvas();
  if (createCanvas) {
    const canvas = createCanvas(200, 200);
    const ctx = canvas.getContext('2d');
    // Draw a cute placeholder
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(0, 0, 200, 200);
    ctx.fillStyle = '#FF69B4';
    ctx.beginPath();
    ctx.arc(100, 80, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('CHIBI', 75, 85);
    return canvas.toBuffer('image/png').toString('base64');
  }

  // Minimal 1x1 transparent PNG as absolute fallback
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
}

function tryRequireCanvas() {
  try {
    return require('canvas');
  } catch {
    return {};
  }
}

/**
 * Estimated cost per generation request in USD
 */
const COST_PER_REQUEST = 0.06;

module.exports = { generateChibi, COST_PER_REQUEST };
