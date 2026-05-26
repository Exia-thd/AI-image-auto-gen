require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const generateRouter = require('./routes/generate');
const submitRouter = require('./routes/submit');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: allow all origins for local event use
app.use(cors());

// Body parsing with 10mb limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api/generate', generateRouter);
app.use('/api/submit', submitRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

// Config endpoint (expose safe config to frontend)
app.get('/api/config', (req, res) => {
  const config = require('../config/default.json');
  res.json({
    campaign: config.campaign,
    form: config.form,
    frames: config.frames,
    output: config.output,
  });
});

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Get local IP address for network access display
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Start server on 0.0.0.0 (accessible via local network IP)
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('');
  console.log('🎨 Chibi Sticker Event App');
  console.log('─────────────────────────────────────');
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIP}:${PORT}`);
  console.log('─────────────────────────────────────');
  console.log(`  OpenAI:  ${process.env.OPENAI_API_KEY ? '✅ Configured' : '⚠️  Not configured (mock mode)'}`);
  console.log('');
});

module.exports = app;
