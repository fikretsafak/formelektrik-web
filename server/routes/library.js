const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authRequired, requireRole, requirePermission, optionalAuth } = require('../middleware/auth');
const { isEmail, isNonEmptyString, slugify } = require('../middleware/validate');

const r = express.Router();
const admin = [authRequired, requireRole('admin'), requirePermission('library')];
const adminUsers = [authRequired, requireRole('admin'), requirePermission('library-users')];

// --- helpers ---
function canDownload(userId, docId) {
  const direct = db.prepare('SELECT 1 FROM library_user_documents WHERE user_id=? AND document_id=?').get(userId, docId);
  if (direct) return true;
  const brand = db.prepare(`SELECT 1 FROM library_user_brands lub
    JOIN library_documents ld ON ld.brand_id=lub.brand_id
    WHERE lub.user_id=? AND ld.id=?`).get(userId, docId);
  return !!brand;
}

// Başvuru onayla: kullanıcı oluştur/bul + marka erişimi ver + yeni kullanıcıya şifre maili gönder.
// Döner: { userId, password (yeni kullanıcıysa), mailSent, isNew }
async function approveRegistration(reg, brandIds = []) {
  const password = crypto.randomBytes(4).toString('hex');
  const hash = bcrypt.hashSync(password, 12);
  const existing = db.prepare('SELECT id FROM users WHERE email=?').get(reg.email);
  let userId;
  if (existing) {
    userId = existing.id;
  } else {
    const info = db.prepare(`INSERT INTO users (name,email,password,role,is_active,must_change_password) VALUES (?,?,?,?,?,?)`)
      .run(`${reg.name} ${reg.surname}`, reg.email, hash, 'customer', 1, 1);
    userId = info.lastInsertRowid;
  }
  db.prepare("UPDATE library_registrations SET status='approved', user_id=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(userId, reg.id);

  if (Array.isArray(brandIds) && brandIds.length) {
    const ins = db.prepare('INSERT OR IGNORE INTO library_user_brands (user_id, brand_id) VALUES (?,?)');
    db.transaction(() => brandIds.forEach(bid => ins.run(userId, bid)))();
  }

  let mailSent = false;
  if (!existing) {
    try {
      const { sendMail, wrapEmail } = require('../mailer');
      const html = wrapEmail(`
        <p style="margin:0 0 14px">Merhaba ${reg.name},</p>
        <p style="margin:0 0 14px">Form Elektrik Teknik Kütüphane başvurunuz onaylandı. Aşağıdaki bilgilerle giriş yapabilirsiniz:</p>
        <table style="margin:16px 0;border-collapse:collapse">
          <tr><td style="padding:6px 16px 6px 0;color:#6b7180">E-posta</td><td style="font-weight:600">${reg.email}</td></tr>
          <tr><td style="padding:6px 16px 6px 0;color:#6b7180">Geçici Şifre</td><td style="font-weight:600;font-family:monospace;font-size:16px">${password}</td></tr>
        </table>
        <p style="color:#6b7180;font-size:14px">Güvenliğiniz için ilk girişte şifrenizi değiştirmeniz istenecektir.</p>
        <p style="margin-top:20px"><a href="https://formelektrik.com/teknik-kutuphane" style="background:#2aa9e0;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block">Teknik Kütüphaneye Git</a></p>
      `, { title: 'Teknik Kütüphane Erişiminiz Onaylandı', preheader: 'Giriş bilgileriniz hazır' });
      const result = await sendMail({
        to: reg.email,
        subject: 'Teknik Kütüphane Erişiminiz Onaylandı — Form Elektrik',
        html,
        text: `Merhaba ${reg.name},\n\nTeknik Kütüphane başvurunuz onaylandı.\nE-posta: ${reg.email}\nGeçici Şifre: ${password}\n\nGiriş: https://formelektrik.com/teknik-kutuphane`,
      });
      mailSent = !!result.sent;
    } catch (e) { mailSent = false; }
  }
  return { userId, password: existing ? null : password, mailSent, isNew: !existing };
}

// ============ PUBLIC ============

// List published documents
r.get('/', (req, res) => {
  const { brand_id, type, q, language = 'tr', limit = 50, offset = 0 } = req.query;
  let where = [`ld.status='published'`];
  const params = [];
  if (brand_id) { where.push('ld.brand_id=?'); params.push(brand_id); }
  if (type) { where.push('ld.document_type=?'); params.push(type); }
  if (q) { where.push("(ld.title LIKE ? OR ld.description LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (language && language !== 'all') { where.push('ld.language=?'); params.push(language); }
  const w = where.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) as c FROM library_documents ld WHERE ${w}`).get(...params).c;
  params.push(+limit, +offset);
  const docs = db.prepare(`SELECT ld.*, b.name as brand_name, b.logo_url as brand_logo
    FROM library_documents ld LEFT JOIN brands b ON b.id=ld.brand_id
    WHERE ${w} ORDER BY ld.created_at DESC LIMIT ? OFFSET ?`).all(...params);
  res.json({ documents: docs, total });
});

// Brands that have documents
r.get('/brands', (_req, res) => {
  const brands = db.prepare(`SELECT b.id, b.name, b.slug, b.logo_url, COUNT(ld.id) as doc_count
    FROM brands b JOIN library_documents ld ON ld.brand_id=b.id AND ld.status='published'
    WHERE b.is_active=1 GROUP BY b.id ORDER BY b.sort_order, b.name`).all();
  res.json({ brands });
});

// Public registration
r.post('/register', async (req, res) => {
  const { name, surname, email, company, phone, message } = req.body;
  if (!isNonEmptyString(name) || !isNonEmptyString(surname) || !isEmail(email))
    return res.status(400).json({ error: 'name, surname, email required' });
  const existing = db.prepare('SELECT id FROM library_registrations WHERE email=? AND status=?').get(email, 'pending');
  if (existing) return res.status(409).json({ error: 'already_pending' });
  const info = db.prepare(`INSERT INTO library_registrations (name,surname,email,company,phone,message) VALUES (?,?,?,?,?,?)`)
    .run(name.trim(), surname.trim(), email.trim().toLowerCase(), company||null, phone||null, message||null);

  // Otomatik onay açıksa hemen onayla + şifre mail gönder
  const autoRow = db.prepare("SELECT value FROM settings WHERE key='library_auto_approve'").get();
  if (autoRow && autoRow.value === '1') {
    const reg = db.prepare('SELECT * FROM library_registrations WHERE id=?').get(info.lastInsertRowid);
    try { await approveRegistration(reg, []); return res.json({ ok: true, auto_approved: true }); }
    catch (e) { /* onay/mail başarısızsa başvuru pending kalır */ }
  }
  res.json({ ok: true });
});

// Download — is_public belgeler giriş gerektirmez, diğerleri auth + erişim kontrolü
r.get('/:id/download', optionalAuth, (req, res) => {
  const doc = db.prepare('SELECT * FROM library_documents WHERE id=? AND status=?').get(req.params.id, 'published');
  if (!doc) return res.status(404).json({ error: 'not_found' });
  // Açık erişim: herkes indirebilir. Değilse: giriş zorunlu + erişim kontrolü.
  if (!doc.is_public) {
    if (!req.user) return res.status(401).json({ error: 'auth_required' });
    if (req.user.role !== 'admin' && !canDownload(req.user.id, doc.id))
      return res.status(403).json({ error: 'no_access' });
  }
  const filePath = path.resolve(__dirname, '../../', doc.file_url.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file_missing' });
  db.prepare('UPDATE library_documents SET download_count = COALESCE(download_count,0) + 1 WHERE id=?').run(doc.id);
  const ext = path.extname(doc.file_url);
  res.setHeader('Content-Disposition', `attachment; filename="${slugify(doc.title)}${ext}"`);
  fs.createReadStream(filePath).pipe(res);
});

// My access (customer)
r.get('/my-access', authRequired, (req, res) => {
  const docIds = db.prepare('SELECT document_id FROM library_user_documents WHERE user_id=?')
    .all(req.user.id).map(r => r.document_id);
  const brandIds = db.prepare('SELECT brand_id FROM library_user_brands WHERE user_id=?')
    .all(req.user.id).map(r => r.brand_id);
  res.json({ document_ids: docIds, brand_ids: brandIds });
});

// ============ ADMIN ============

// All docs (incl draft)
r.get('/admin/all', ...admin, (_req, res) => {
  const docs = db.prepare(`SELECT ld.*, b.name as brand_name
    FROM library_documents ld LEFT JOIN brands b ON b.id=ld.brand_id
    ORDER BY ld.created_at DESC`).all();
  res.json({ documents: docs });
});

// Create
r.post('/', ...admin, (req, res) => {
  const { title, slug, description, brand_id, product_name, document_type, file_url, file_size, is_public, language, status } = req.body;
  if (!isNonEmptyString(title) || !file_url) return res.status(400).json({ error: 'title and file required' });
  const s = slug ? slugify(slug) : slugify(title);
  const info = db.prepare(`INSERT INTO library_documents (title,slug,description,brand_id,product_name,document_type,file_url,file_size,is_public,language,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(title.trim(), s, description||null, brand_id||null, product_name||null, document_type||'datasheet', file_url, file_size||null, is_public?1:0, language||'tr', status||'draft');
  res.json({ id: info.lastInsertRowid });
});

// Update
r.put('/:id', ...admin, (req, res) => {
  const existing = db.prepare('SELECT * FROM library_documents WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { title, slug, description, brand_id, product_name, document_type, file_url, file_size, is_public, language, status } = req.body;
  db.prepare(`UPDATE library_documents SET title=?,slug=?,description=?,brand_id=?,product_name=?,document_type=?,file_url=?,file_size=?,is_public=?,language=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(
      title ?? existing.title, slug ? slugify(slug) : existing.slug,
      description ?? existing.description, brand_id ?? existing.brand_id,
      product_name !== undefined ? (product_name||null) : existing.product_name,
      document_type ?? existing.document_type, file_url ?? existing.file_url,
      file_size ?? existing.file_size, is_public !== undefined ? (is_public?1:0) : existing.is_public,
      language ?? existing.language, status ?? existing.status, req.params.id
    );
  res.json({ ok: true });
});

// Delete
r.delete('/:id', ...admin, (req, res) => {
  db.prepare('DELETE FROM library_documents WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// --- Registrations ---
r.get('/admin/registrations', ...adminUsers, (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM library_registrations';
  const params = [];
  if (status) { sql += ' WHERE status=?'; params.push(status); }
  sql += ' ORDER BY created_at DESC';
  res.json({ registrations: db.prepare(sql).all(...params) });
});

// Approve / reject
r.put('/admin/registrations/:id', ...adminUsers, async (req, res) => {
  const reg = db.prepare('SELECT * FROM library_registrations WHERE id=?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'not_found' });
  const { action, brand_ids } = req.body; // action: 'approve' | 'reject'
  if (action === 'reject') {
    db.prepare("UPDATE library_registrations SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(reg.id);
    return res.json({ ok: true });
  }
  if (action !== 'approve') return res.status(400).json({ error: 'invalid action' });
  const r2 = await approveRegistration(reg, brand_ids || []);
  res.json({ ok: true, user_id: r2.userId, password: r2.password, mail_sent: r2.mailSent });
});

// Otomatik onay ayarı — aç/kapa
r.get('/admin/auto-approve', ...adminUsers, (_req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key='library_auto_approve'").get();
  res.json({ enabled: row ? row.value === '1' : false });
});
r.put('/admin/auto-approve', ...adminUsers, (req, res) => {
  const v = req.body && req.body.enabled ? '1' : '0';
  db.prepare("INSERT INTO settings (key,value) VALUES ('library_auto_approve',?) ON CONFLICT(key) DO UPDATE SET value=?").run(v, v);
  res.json({ ok: true, enabled: v === '1' });
});

// --- Access management ---
r.get('/admin/access/:userId', ...adminUsers, (req, res) => {
  const uid = req.params.userId;
  const brandIds = db.prepare('SELECT brand_id FROM library_user_brands WHERE user_id=?').all(uid).map(r => r.brand_id);
  const docIds = db.prepare('SELECT document_id FROM library_user_documents WHERE user_id=?').all(uid).map(r => r.document_id);
  res.json({ brand_ids: brandIds, document_ids: docIds });
});

r.put('/admin/access/:userId', ...adminUsers, (req, res) => {
  const uid = req.params.userId;
  const { brand_ids = [], document_ids = [] } = req.body;
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM library_user_brands WHERE user_id=?').run(uid);
    db.prepare('DELETE FROM library_user_documents WHERE user_id=?').run(uid);
    const insBrand = db.prepare('INSERT INTO library_user_brands (user_id,brand_id) VALUES (?,?)');
    brand_ids.forEach(bid => insBrand.run(uid, bid));
    const insDoc = db.prepare('INSERT INTO library_user_documents (user_id,document_id) VALUES (?,?)');
    document_ids.forEach(did => insDoc.run(uid, did));
  });
  tx();
  res.json({ ok: true });
});

// --- Customer users list (for access management dropdown) ---
r.get('/admin/customers', ...adminUsers, (_req, res) => {
  const users = db.prepare("SELECT id, name, email FROM users WHERE role='customer' AND is_active=1 ORDER BY name").all();
  res.json({ users });
});

module.exports = r;
