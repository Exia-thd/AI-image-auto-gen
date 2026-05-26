// In-memory rate limiting using Map
const generateWindows = new Map();
const submitWindows = new Map();

/**
 * Rate limit for /api/generate: 1 request per 30 seconds per IP
 */
function generateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 30 * 1000; // 30 seconds

  const entry = generateWindows.get(ip);

  if (entry) {
    const elapsed = now - entry.timestamp;
    if (elapsed < windowMs) {
      const retryAfter = Math.ceil((windowMs - elapsed) / 1000);
      return res.status(429).json({
        success: false,
        error: `Vui lòng đợi ${retryAfter} giây trước khi tạo sticker tiếp theo.`,
        retryAfter
      });
    }
  }

  generateWindows.set(ip, { timestamp: now, count: 1 });
  next();
}

/**
 * Rate limit for /api/submit: 10 requests per minute per IP
 */
function submitLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const entry = submitWindows.get(ip);

  if (entry) {
    const elapsed = now - entry.timestamp;
    if (elapsed < windowMs) {
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((windowMs - elapsed) / 1000);
        return res.status(429).json({
          success: false,
          error: `Quá nhiều yêu cầu. Vui lòng đợi ${retryAfter} giây.`,
          retryAfter
        });
      }
      entry.count++;
    } else {
      submitWindows.set(ip, { timestamp: now, count: 1 });
    }
  } else {
    submitWindows.set(ip, { timestamp: now, count: 1 });
  }

  next();
}

module.exports = { generateLimit, submitLimit };
