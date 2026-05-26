const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { submitLimit } = require('../middleware/rateLimit');

const SUBMISSIONS_FILE = path.join(__dirname, '../data/submissions.json');

// Vietnamese phone regex
const PHONE_REGEX = /^(0[2-9]\d{8}|84[2-9]\d{8})$/;

function readSubmissions() {
  try {
    if (!fs.existsSync(SUBMISSIONS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(SUBMISSIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSubmissions(data) {
  const dir = path.dirname(SUBMISSIONS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// POST /api/submit
router.post('/', submitLimit, (req, res) => {
  try {
    const { fullName, phone, email, story } = req.body;
    const errors = {};

    // Validate fullName
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    // Validate phone
    if (!phone || typeof phone !== 'string') {
      errors.phone = 'Vui lòng nhập số điện thoại.';
    } else {
      const normalizedPhone = phone.replace(/\s+/g, '').replace(/^(\+84)/, '84');
      if (!PHONE_REGEX.test(normalizedPhone)) {
        errors.phone = 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam.';
      }
    }

    // Validate email (optional)
    if (email && typeof email === 'string' && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.email = 'Địa chỉ email không hợp lệ.';
      }
    }

    // Validate story length (optional)
    if (story && typeof story === 'string' && story.length > 500) {
      errors.story = 'Câu chuyện không được vượt quá 500 ký tự.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        errors,
      });
    }

    // Generate unique ID
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    const submission = {
      id,
      timestamp,
      fullName: fullName.trim(),
      phone: phone.replace(/\s+/g, ''),
      email: email ? email.trim() : '',
      story: story ? story.trim() : '',
      ip: req.ip || req.connection.remoteAddress || 'unknown',
    };

    // Append to submissions.json
    const submissions = readSubmissions();
    submissions.push(submission);
    writeSubmissions(submissions);

    console.log(`[Submit] New submission: ${id} from ${submission.phone}`);

    return res.json({
      success: true,
      id,
      message: 'Đăng ký thành công!',
    });
  } catch (err) {
    console.error('[Submit] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Đã xảy ra lỗi. Vui lòng thử lại.',
    });
  }
});

module.exports = router;
