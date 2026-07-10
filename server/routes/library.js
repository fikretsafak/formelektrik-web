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
r.post('/register', (req, res) => {
  const { name, surname, email, company, phone, message } = req.body;
  if (!isNonEmptyString(name) || !isNonEmptyString(surname) || !isEmail(email))
    return res.status(400).json({ error: 'name, surname, email required' });
  const existing = db.prepare('SELECT id FROM library_registrations WHERE email=? AND status=?').get(email, 'pending');
  if (existing) return res.status(409).json({ error: 'already_pending' });
  db.prepare(`INSERT INTO library_registrations (name,surname,email,company,phone,message) VALUES (?,?,?,?,?,?)`)
    .run(name.trim(), surname.trim(), email.trim().toLowerCase(), company||null, phone||null, message||null);
  res.json({ ok: true });
});

// Download (auth required)
r.get('/:id/download', authRequired, (req, res) => {
  const doc = db.prepare('SELECT * FROM library_documents WHERE id=? AND status=?').get(req.params.id, 'published');
  if (!doc) return res.status(404).json({ error: 'not_found' });
  // is_public docs: anyone logged in can download. Otherwise check access.
  if (!doc.is_public && req.user.role !== 'admin' && !canDownload(req.user.id, doc.id))
    return res.status(403).json({ error: 'no_access' });
  const filePath = path.resolve(__dirname, '../../', doc.file_url.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'file_missing' });
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
  const { title, slug, description, brand_id, document_type, file_url, file_size, is_public, language, status } = req.body;
  if (!isNonEmptyString(title) || !file_url) return res.status(400).json({ error: 'title and file required' });
  const s = slug ? slugify(slug) : slugify(title);
  const info = db.prepare(`INSERT INTO library_documents (title,slug,description,brand_id,document_type,file_url,file_size,is_public,language,status)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(title.trim(), s, description||null, brand_id||null, document_type||'datasheet', file_url, file_size||null, is_public?1:0, language||'tr', status||'draft');
  res.json({ id: info.lastInsertRowid });
});

// Update
r.put('/:id', ...admin, (req, res) => {
  const existing = db.prepare('SELECT * FROM library_documents WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { title, slug, description, brand_id, document_type, file_url, file_size, is_public, language, status } = req.body;
  db.prepare(`UPDATE library_documents SET title=?,slug=?,description=?,brand_id=?,document_type=?,file_url=?,file_size=?,is_public=?,language=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(
      title ?? existing.title, slug ? slugify(slug) : existing.slug,
      description ?? existing.description, brand_id ?? existing.brand_id,
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
r.put('/admin/registrations/:id', ...adminUsers, (req, res) => {
  const reg = db.prepare('SELECT * FROM library_registrations WHERE id=?').get(req.params.id);
  if (!reg) return res.status(404).json({ error: 'not_found' });
  const { action, brand_ids } = req.body; // action: 'approve' | 'reject'
  if (action === 'reject') {
    db.prepare("UPDATE library_registrations SET status='rejected', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(reg.id);
    return res.json({ ok: true });
  }
  if (action !== 'approve') return res.status(400).json({ error: 'invalid action' });

  // Approve: create user + assign access
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

  // Assign brand access
  if (Array.isArray(brand_ids) && brand_ids.length) {
    const ins = db.prepare('INSERT OR IGNORE INTO library_user_brands (user_id, brand_id) VALUES (?,?)');
    const tx = db.transaction(() => brand_ids.forEach(bid => ins.run(userId, bid)));
    tx();
  }
  res.json({ ok: true, user_id: userId, password: existing ? null : password });
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
