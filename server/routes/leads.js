const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isEmail, isNonEmptyString } = require('../middleware/validate');
const { sendMail } = require('../mailer');

const router = express.Router();

const submitLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

router.post('/', submitLimiter, async (req, res) => {
  const { firstName, lastName, email, phone, company, products, message } = req.body || {};

  if (!isNonEmptyString(firstName, 80) || !isNonEmptyString(lastName, 80) ||
      !isEmail(email) || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  // İlgilenilen konular: randevu konusu başlıkları (serbest metin) ya da eski sabit hizmet kodları.
  // DB'den gelen konu başlıklarını da kabul et; her birini kırp + sınırla.
  const cleanProducts = products
    .map(p => String(p || '').trim())
    .filter(Boolean)
    .filter(p => p.length <= 120)
    .slice(0, 20);
  if (cleanProducts.length === 0) return res.status(400).json({ error: 'no_valid_product' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';

  const info = db.prepare(`
    INSERT INTO leads (first_name, last_name, email, phone, company, products, message, user_agent, ip)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    firstName.trim(), lastName.trim(), email.toLowerCase().trim(),
    (phone || '').trim() || null,
    (company || '').trim() || null,
    JSON.stringify(cleanProducts),
    (message || '').trim() || null,
    ua, ip
  );

  // Notify admin (fire-and-forget)
  const notifyTo = process.env.LEAD_NOTIFY_TO;
  if (notifyTo) {
    const subject = `Yeni teklif talebi — ${firstName} ${lastName} (${company || 'şirket belirtilmemiş'})`;
    const html = `
      <h2>Yeni Teklif / İletişim Talebi</h2>
      <table style="border-collapse:collapse">
        <tr><td><b>Ad Soyad</b></td><td>${escapeHtml(firstName)} ${escapeHtml(lastName)}</td></tr>
        <tr><td><b>E-posta</b></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><b>Telefon</b></td><td>${escapeHtml(phone || '-')}</td></tr>
        <tr><td><b>Şirket</b></td><td>${escapeHtml(company || '-')}</td></tr>
        <tr><td><b>İlgilenilen Hizmetler</b></td><td>${cleanProducts.join(', ')}</td></tr>
        <tr><td valign="top"><b>Mesaj</b></td><td>${escapeHtml(message || '-')}</td></tr>
      </table>
    `;
    sendMail({ to: notifyTo, subject, html, replyTo: email }).catch(() => {});
  }

  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

// Admin: list
router.get('/', authRequired, requireRole('admin'), requirePermission('leads'), (req, res) => {
  const { status, q, limit = 50, offset = 0 } = req.query;
  let sql = 'SELECT * FROM leads WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (q) {
    sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR company LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  const rows = db.prepare(sql).all(...params);
  res.json({ leads: rows.map(r => ({ ...r, products: safeJson(r.products, []) })) });
});

router.get('/:id', authRequired, requireRole('admin'), requirePermission('leads'), (req, res) => {
  const row = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ lead: { ...row, products: safeJson(row.products, []) } });
});

router.patch('/:id', authRequired, requireRole('admin'), requirePermission('leads'), (req, res) => {
  const { status, notes } = req.body || {};
  const fields = [];
  const params = [];
  if (status && ['new','contacted','qualified','won','lost'].includes(status)) {
    fields.push('status = ?'); params.push(status);
  }
  if (typeof notes === 'string') { fields.push('notes = ?'); params.push(notes); }
  if (fields.length === 0) return res.status(400).json({ error: 'nothing_to_update' });
  fields.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);
  db.prepare(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('leads'), (req, res) => {
  db.prepare('DELETE FROM leads WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function safeJson(s, fallback) {
  try { return JSON.parse(s); } catch { return fallback; }
}

module.exports = router;
