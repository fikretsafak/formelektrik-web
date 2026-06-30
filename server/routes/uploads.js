const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + '-' + safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// Admin uploads (kapak görselleri, proje galerisi, marka logoları)
router.post('/', authRequired, requireRole('admin'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  res.json({
    url: `/uploads/${req.file.filename}`,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mime: req.file.mimetype,
  });
});

module.exports = router;
