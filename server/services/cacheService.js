const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '../data/cache');

// Ensure cache directory exists on module load
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Get cached image by hash
 * @param {string} hash - SHA256 hash (first 16 chars)
 * @returns {Buffer|null} - Image buffer or null if not found
 */
function get(hash) {
  const filePath = path.join(CACHE_DIR, `${hash}.png`);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
  } catch (err) {
    console.error(`[Cache] Error reading cache for hash ${hash}:`, err.message);
  }
  return null;
}

/**
 * Store image buffer in cache
 * @param {string} hash - SHA256 hash (first 16 chars)
 * @param {Buffer} imageBuffer - PNG image buffer
 */
function set(hash, imageBuffer) {
  const filePath = path.join(CACHE_DIR, `${hash}.png`);
  try {
    fs.writeFileSync(filePath, imageBuffer);
    console.log(`[Cache] Saved cache entry: ${hash}`);
  } catch (err) {
    console.error(`[Cache] Error writing cache for hash ${hash}:`, err.message);
  }
}

module.exports = { get, set };
