const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isEmail, isNonEmptyString } = require('../middleware/validate');
const { sendMail } = require('../mailer');

const router = express.Router();

const applyLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
const uploadLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

// ===== CV upload (PUBLIC, kısıtlı) =====
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_CV_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const cvStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, 'cv-' + Date.now() + '-' + Math.round(Math.random() * 1e6) + '-' + safe);
  },
});
const cvUpload = multer({
  storage: cvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_CV_MIME.includes(file.mimetype)) cb(null, true);
    else cb(null, false);
  },
});

// CV yükle + metinden ad/soyad/email/telefon otomatik çıkar
router.post('/upload-cv', uploadLimiter, cvUpload.single('cv'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'invalid_file' });
  const url = `/uploads/${req.file.filename}`;
  let parsed = {};
  try {
    parsed = await extractCvFields(req.file.path, req.file.mimetype);
  } catch { parsed = {}; }
  res.json({ url, originalName: req.file.originalname, parsed });
});

// ===== CV metninden alan çıkarma =====
async function extractCvFields(filePath, mime) {
  let text = '';
  if (mime === 'application/pdf') {
    const { PDFParse } = require('pdf-parse');
    const buf = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: buf });
    const result = await parser.getText();
    text = (result && result.text) || '';
  } else {
    // DOC/DOCX
    const mammoth = require('mammoth');
    const r = await mammoth.extractRawText({ path: filePath });
    text = r.value || '';
  }
  if (!text) return {};

  const out = {};

  // E-posta
  const em = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  if (em) out.email = em[0].trim();

  // Telefon (TR formatları: +90, 0 5xx, 5xx, boşluk/tire/parantez toleranslı)
  const ph = text.match(/(?:\+?90[\s.-]?)?(?:0?\s?)(?:\(?5\d{2}\)?)[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}/);
  if (ph) {
    let digits = ph[0].replace(/[^\d]/g, '').replace(/^0/, '').replace(/^90/, ''); // sadece 10 hane (5xx...)
    if (digits.length >= 10) {
      digits = digits.slice(-10);
      out.phone = `+90 ${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6,8)} ${digits.slice(8,10)}`;
    }
  }

  // Ad-soyad tahmini: ilk anlamlı satır (2-3 kelime, harf ağırlıklı, başlıkvari)
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const stop = /(özgeçmiş|cv|curriculum|resume|tel|telefon|phone|e-?mail|e-?posta|adres|address|linkedin|github|http)/i;
  for (const line of lines.slice(0, 12)) {
    if (line.length < 4 || line.length > 50) continue;
    if (stop.test(line)) continue;
    if (/[@\d/]/.test(line)) continue; // email/sayı/tarih içerenleri atla
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 4) continue;
    // her kelime harf (TR dahil) ile başlamalı
    if (!words.every(w => /^[A-Za-zÇĞİÖŞÜçğıöşü][A-Za-zÇĞİÖŞÜçğıöşü.'-]*$/.test(w))) continue;
    out.firstName = words[0];
    out.lastName = words.slice(1).join(' ');
    break;
  }
  return out;
}

// ===== PUBLIC: aktif ilanlar =====
router.get('/jobs', (req, res) => {
  const rows = db.prepare(`
    SELECT id, title, department, location, type, summary, body, cover_image
    FROM job_postings WHERE is_active = 1 ORDER BY sort_order, id DESC
  `).all();
  res.json({ jobs: rows });
});

router.get('/jobs/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM job_postings WHERE id = ? AND is_active = 1').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ job: row });
});

// ===== PUBLIC: başvuru gönder =====
router.post('/apply', applyLimiter, async (req, res) => {
  const { jobId, firstName, lastName, email, phone, message, cvUrl } = req.body || {};
  if (!isNonEmptyString(firstName, 80) || !isNonEmptyString(lastName, 80) || !isEmail(email)) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  // cvUrl yalnızca kendi upload dizinimizden kabul edilir
  const cleanCv = (typeof cvUrl === 'string' && /^\/uploads\/[A-Za-z0-9._-]+$/.test(cvUrl)) ? cvUrl : null;
  // CV zorunlu
  if (!cleanCv) return res.status(400).json({ error: 'cv_required' });

  let jobTitle = null;
  let jid = null;
  if (jobId) {
    const job = db.prepare('SELECT id, title FROM job_postings WHERE id = ?').get(jobId);
    if (job) { jid = job.id; jobTitle = job.title; }
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';

  const info = db.prepare(`
    INSERT INTO job_applications (job_id, job_title, first_name, last_name, email, phone, cv_url, message, user_agent, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    jid, jobTitle,
    firstName.trim(), lastName.trim(), email.toLowerCase().trim(),
    (phone || '').trim() || null,
    cleanCv,
    (message || '').trim() || null,
    ua, ip
  );

  // Admin bildirim maili
  const notifyTo = process.env.LEAD_NOTIFY_TO || process.env.APPOINTMENT_NOTIFY_TO;
  if (notifyTo) {
    const base = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
    sendMail({
      to: notifyTo,
      subject: `Yeni iş başvurusu — ${firstName} ${lastName}${jobTitle ? ' (' + jobTitle + ')' : ''}`,
      html: `
        <h2>Yeni Kariyer Başvurusu</h2>
        <table style="border-collapse:collapse;font-family:Arial,sans-serif">
          <tr><td style="padding:6px 12px"><b>Pozisyon</b></td><td style="padding:6px 12px">${escapeHtml(jobTitle || 'Genel Başvuru')}</td></tr>
          <tr><td style="padding:6px 12px"><b>Ad Soyad</b></td><td style="padding:6px 12px">${escapeHtml(firstName)} ${escapeHtml(lastName)}</td></tr>
          <tr><td style="padding:6px 12px"><b>E-posta</b></td><td style="padding:6px 12px">${escapeHtml(email)}</td></tr>
          <tr><td style="padding:6px 12px"><b>Telefon</b></td><td style="padding:6px 12px">${escapeHtml(phone || '-')}</td></tr>
          <tr><td style="padding:6px 12px" valign="top"><b>Mesaj</b></td><td style="padding:6px 12px">${escapeHtml(message || '-')}</td></tr>
          ${cleanCv ? `<tr><td style="padding:6px 12px"><b>CV</b></td><td style="padding:6px 12px"><a href="${base}${cleanCv}">${base}${cleanCv}</a></td></tr>` : ''}
        </table>`,
      replyTo: email,
    }).catch(() => {});
  }

  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ===== ADMIN: iş ilanı CRUD =====
router.get('/admin/jobs', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  const rows = db.prepare('SELECT * FROM job_postings ORDER BY sort_order, id DESC').all();
  res.json({ jobs: rows });
});

router.get('/admin/jobs/:id', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  const row = db.prepare('SELECT * FROM job_postings WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ job: row });
});

router.post('/admin/jobs', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  const { title, department, location, type, summary, body, cover_image, is_active, sort_order } = req.body || {};
  if (!isNonEmptyString(title, 160)) return res.status(400).json({ error: 'invalid_input' });
  const info = db.prepare(`
    INSERT INTO job_postings (title, department, location, type, summary, body, cover_image, is_active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title.trim(), (department||'').trim()||null, (location||'').trim()||null, (type||'').trim()||null,
    (summary||'').trim()||null, body || '', (cover_image||'').trim()||null,
    is_active === 0 || is_active === false ? 0 : 1, Number(sort_order) || 0
  );
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/admin/jobs/:id', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  const { title, department, location, type, summary, body, cover_image, is_active, sort_order } = req.body || {};
  if (!isNonEmptyString(title, 160)) return res.status(400).json({ error: 'invalid_input' });
  const exists = db.prepare('SELECT id FROM job_postings WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'not_found' });
  db.prepare(`
    UPDATE job_postings SET title=?, department=?, location=?, type=?, summary=?, body=?, cover_image=?, is_active=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    title.trim(), (department||'').trim()||null, (location||'').trim()||null, (type||'').trim()||null,
    (summary||'').trim()||null, body || '', (cover_image||'').trim()||null,
    is_active === 0 || is_active === false ? 0 : 1, Number(sort_order) || 0, req.params.id
  );
  res.json({ ok: true });
});

router.delete('/admin/jobs/:id', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  db.prepare('DELETE FROM job_postings WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===== ADMIN: başvurular =====
router.get('/admin/applications', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM job_applications WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY created_at DESC LIMIT 200';
  res.json({ applications: db.prepare(sql).all(...params) });
});

router.patch('/admin/applications/:id', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  const { status } = req.body || {};
  const valid = ['new','reviewing','shortlisted','rejected','hired'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'invalid_status' });
  db.prepare('UPDATE job_applications SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/applications/:id', authRequired, requireRole('admin'), requirePermission('careers'), (req, res) => {
  db.prepare('DELETE FROM job_applications WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
