require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');

// Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// API routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/leads',         require('./routes/leads'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/projects',      require('./routes/projects'));
app.use('/api/brands',        require('./routes/brands'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/uploads',       require('./routes/uploads'));
app.use('/api/appointments',  require('./routes/appointments'));
app.use('/api/careers',       require('./routes/careers'));
app.use('/api/settings',      require('./routes/settings'));

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Static: uploads
app.use('/uploads', express.static(path.join(ROOT, 'uploads'), { maxAge: '1d' }));

// Static: serve /public assets via /public path
app.use('/public', express.static(path.join(ROOT, 'public')));

// Admin SPA root
// JS/CSS/HTML için no-cache: tarayıcı eski admin.js'i tutup düzeltmeleri kaçırmasın.
const noCacheAssets = (res, filePath) => {
  if (/\.(html|js|css)$/.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
};
app.use('/admin', express.static(path.join(ROOT, 'public/admin'), { setHeaders: noCacheAssets }));

// Main site static files
app.use(express.static(ROOT, {
  extensions: ['html'],
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
  },
}));

// SPA fallback for /admin
app.get('/admin/*', (req, res) => res.sendFile(path.join(ROOT, 'public/admin/index.html')));

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'server_error' });
});

app.listen(PORT, () => {
  console.log(`▶ Form Elektrik sunucusu çalışıyor: http://localhost:${PORT}`);
  console.log(`  Admin paneli: http://localhost:${PORT}/admin`);
});
