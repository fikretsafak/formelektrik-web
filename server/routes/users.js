const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isEmail, isNonEmptyString } = require('../middleware/validate');

const { ADMIN_SECTIONS } = require('../middleware/auth');

const router = express.Router();

// permissions girdisini güvenli JSON string'e çevir.
// null/undefined → NULL (tam yetki). Array → geçerli bölümlerle filtrelenmiş JSON.
function normalizePermissions(input) {
  if (input == null) return null;
  if (!Array.isArray(input)) return null;
  const clean = input.filter(s => ADMIN_SECTIONS.includes(s));
  return JSON.stringify(clean);
}

router.get('/', authRequired, requireRole('admin'), requirePermission('users'), (req, res) => {
  const { role, q } = req.query;
  let sql = 'SELECT id, email, name, role, company, phone, avatar_url, is_active, permissions, must_change_password, created_at FROM users WHERE 1=1';
  const params = [];
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (q) { sql += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)'; const l = `%${q}%`; params.push(l, l, l); }
  sql += ' ORDER BY created_at DESC';
  const users = db.prepare(sql).all(...params).map(u => {
    if (typeof u.permissions === 'string') {
      try { u.permissions = JSON.parse(u.permissions); } catch { u.permissions = null; }
    }
    return u;
  });
  res.json({ users });
});

// Kendi profilini getir (avatar dahil)
router.get('/me', authRequired, (req, res) => {
  const u = db.prepare('SELECT id, email, name, role, company, phone, avatar_url, is_active, must_change_password, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!u) return res.status(404).json({ error: 'not_found' });
  u.must_change_password = u.must_change_password ? 1 : 0;
  res.json({ user: u });
});

// Kendi profilini güncelle (name + avatar_url)
router.put('/me', authRequired, (req, res) => {
  const { name, avatar_url, phone, company } = req.body || {};
  db.prepare(`UPDATE users SET
    name = COALESCE(?, name),
    avatar_url = ?,
    phone = COALESCE(?, phone),
    company = COALESCE(?, company),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`).run(
    name && name.trim() ? name.trim() : null,
    avatar_url || null,
    phone ?? null,
    company ?? null,
    req.user.id
  );
  const u = db.prepare('SELECT id, email, name, role, company, phone, avatar_url FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: u });
});

router.get('/:id', authRequired, requireRole('admin'), requirePermission('users'), (req, res) => {
  const u = db.prepare('SELECT id, email, name, role, company, phone, avatar_url, is_active, permissions, must_change_password, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'not_found' });
  if (typeof u.permissions === 'string') {
    try { u.permissions = JSON.parse(u.permissions); } catch { u.permissions = null; }
  }
  const access = db.prepare(`SELECT p.id, p.code, p.name
    FROM user_product_access upa JOIN products p ON p.id = upa.product_id
    WHERE upa.user_id = ?`).all(req.params.id);
  res.json({ user: u, products: access });
});

router.post('/', authRequired, requireRole('admin'), requirePermission('users'), (req, res) => {
  const { email, password, name, role='customer', company, phone, product_ids=[], permissions, must_change_password } = req.body || {};
  if (!isEmail(email) || !isNonEmptyString(name, 120) || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  // permissions yalnız admin rolünde anlamlı; customer için NULL
  const permJson = role === 'admin' ? normalizePermissions(permissions) : null;
  const hash = bcrypt.hashSync(password, 12);
  // Yeni kullanıcı: default olarak ilk girişte şifresini değiştirmek zorunda.
  // Admin checkbox'ı açıkça kapatmadıysa 1.
  const mustChange = must_change_password === false || must_change_password === 0 ? 0 : 1;
  try {
    const info = db.prepare(`INSERT INTO users (email, password, name, role, company, phone, permissions, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(email.toLowerCase().trim(), hash, name, role, company || null, phone || null, permJson, mustChange);
    const userId = info.lastInsertRowid;
    if (Array.isArray(product_ids) && product_ids.length) {
      const ins = db.prepare('INSERT INTO user_product_access (user_id, product_id) VALUES (?, ?)');
      db.transaction(ids => ids.forEach(pid => ins.run(userId, pid)))(product_ids);
    }
    res.status(201).json({ ok: true, id: userId });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'email_exists' });
    throw e;
  }
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('users'), (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id=?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'not_found' });
  const { name, role, company, phone, is_active, password, permissions, must_change_password } = req.body || {};
  const fields = ['name = COALESCE(?, name)', 'role = COALESCE(?, role)', 'company = COALESCE(?, company)',
    'phone = COALESCE(?, phone)', 'is_active = COALESCE(?, is_active)', 'updated_at = CURRENT_TIMESTAMP'];
  const params = [
    name ?? null, role ?? null, company ?? null, phone ?? null,
    is_active !== undefined ? (is_active ? 1 : 0) : null
  ];
  // permissions gönderildiyse güncelle. Sonuç admin değilse NULL'a düşür.
  if (permissions !== undefined) {
    const effectiveRole = role ?? u.role;
    fields.push('permissions = ?');
    params.push(effectiveRole === 'admin' ? normalizePermissions(permissions) : null);
  }
  // Şifre değiştiyse: zorunlu değişim flag'ini de hizala.
  // - Açıkça must_change_password gönderildiyse onu kullan.
  // - Aksi halde admin yeni şifre verdiyse default olarak flag=1 (kullanıcı tekrar değiştirsin).
  if (password && typeof password === 'string' && password.length >= 8) {
    fields.unshift('password = ?');
    params.unshift(bcrypt.hashSync(password, 12));
    const mustChange = must_change_password === false || must_change_password === 0 ? 0 : 1;
    fields.push('must_change_password = ?');
    params.push(mustChange);
  } else if (must_change_password !== undefined) {
    fields.push('must_change_password = ?');
    params.push(must_change_password ? 1 : 0);
  }
  params.push(req.params.id);
  db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
  res.json({ ok: true });
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('users'), (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'cannot_delete_self' });
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

// Product access management
router.put('/:id/products', authRequired, requireRole('admin'), requirePermission('users'), (req, res) => {
  const { product_ids } = req.body || {};
  if (!Array.isArray(product_ids)) return res.status(400).json({ error: 'invalid_input' });
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM user_product_access WHERE user_id = ?').run(req.params.id);
    const ins = db.prepare('INSERT INTO user_product_access (user_id, product_id) VALUES (?, ?)');
    product_ids.forEach(pid => ins.run(req.params.id, pid));
  });
  tx();
  res.json({ ok: true });
});

// Logged-in user: list own product entitlements
router.get('/me/products', authRequired, (req, res) => {
  if (req.user.role === 'admin') {
    res.json({ products: db.prepare('SELECT * FROM products WHERE is_active=1 ORDER BY id').all() });
    return;
  }
  const rows = db.prepare(`SELECT p.*
    FROM user_product_access upa JOIN products p ON p.id = upa.product_id
    WHERE upa.user_id = ? ORDER BY p.id`).all(req.user.id);
  res.json({ products: rows });
});

module.exports = router;
