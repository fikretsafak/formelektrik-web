const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isNonEmptyString, slugify } = require('../middleware/validate');

const router = express.Router();

// Public: yayınlanmış duyurular (dil filtreli, TR fallback)
router.get('/', (req, res) => {
  const { language = 'tr', limit = 60, offset = 0, q } = req.query;
  function build(lang) {
    let sql = `
      SELECT a.id, a.slug, a.title, a.excerpt, a.cover_image, a.language, a.published_at,
             u.name AS author_name, u.avatar_url AS author_avatar
      FROM announcements a
      LEFT JOIN users u ON u.id = a.author_id
      WHERE a.status = 'published' AND a.language = ?`;
    const params = [lang];
    if (q) { sql += ' AND (a.title LIKE ? OR a.excerpt LIKE ?)'; const like = `%${q}%`; params.push(like, like); }
    sql += ' ORDER BY a.published_at DESC, a.id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    return db.prepare(sql).all(...params);
  }
  let rows = build(language);
  if (!rows.length && language !== 'tr') rows = build('tr');
  res.json({ announcements: rows });
});

// Public: sayfa açılınca gösterilecek popup duyurusu (en son yayınlanmış, is_popup=1)
router.get('/popup', (req, res) => {
  const { language = 'tr' } = req.query;
  function build(lang) {
    return db.prepare(`
      SELECT id, slug, title, excerpt, body, cover_image, language, published_at
      FROM announcements
      WHERE status = 'published' AND is_popup = 1 AND language = ?
      ORDER BY published_at DESC, id DESC LIMIT 1
    `).get(lang);
  }
  let row = build(language);
  if (!row && language !== 'tr') row = build('tr');
  res.json({ announcement: row || null });
});

// Admin: taslak dahil tümü
router.get('/admin/all', authRequired, requireRole('admin'), requirePermission('announcements'), (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar
    FROM announcements a
    LEFT JOIN users u ON u.id = a.author_id
    ORDER BY a.updated_at DESC
  `).all();
  res.json({ announcements: rows });
});

// Public: tek duyuru (slug). /admin/all'dan SONRA tanımlı.
router.get('/:slug', (req, res) => {
  const { language = 'tr' } = req.query;
  function find(lang) {
    return db.prepare(`
      SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar
      FROM announcements a
      LEFT JOIN users u ON u.id = a.author_id
      WHERE a.slug = ? AND a.language = ? AND a.status = 'published'
    `).get(req.params.slug, lang);
  }
  let row = find(language);
  if (!row && language !== 'tr') row = find('tr');
  if (!row) row = db.prepare(`
    SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar
    FROM announcements a
    LEFT JOIN users u ON u.id = a.author_id
    WHERE a.slug = ? AND a.status = 'published'
    ORDER BY CASE a.language WHEN 'tr' THEN 0 ELSE 1 END
    LIMIT 1
  `).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ announcement: row });
});

router.post('/', authRequired, requireRole('admin'), requirePermission('announcements'), (req, res) => {
  const { title, body, excerpt, cover_image, language = 'tr', status = 'draft', slug, is_popup } = req.body || {};
  if (!isNonEmptyString(title, 200)) return res.status(400).json({ error: 'invalid_input' });
  const finalSlug = (slug && slugify(slug)) || slugify(title);
  const publishedAt = status === 'published' ? new Date().toISOString() : null;
  try {
    const info = db.prepare(`
      INSERT INTO announcements (slug, title, excerpt, body, cover_image, language, status, is_popup, author_id, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(finalSlug, title, excerpt || null, body || '', cover_image || null, language, status, is_popup ? 1 : 0, req.user.id, publishedAt);
    res.status(201).json({ ok: true, id: info.lastInsertRowid, slug: finalSlug });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('announcements'), (req, res) => {
  const { title, body, excerpt, cover_image, language, status, slug, is_popup } = req.body || {};
  const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const next = {
    title: title ?? existing.title,
    body: body ?? existing.body,
    excerpt: excerpt ?? existing.excerpt,
    cover_image: cover_image ?? existing.cover_image,
    language: language ?? existing.language,
    status: status ?? existing.status,
    is_popup: is_popup === undefined ? existing.is_popup : (is_popup ? 1 : 0),
    slug: slug ? slugify(slug) : existing.slug,
  };
  const newlyPublished = existing.status !== 'published' && next.status === 'published';
  const publishedAt = newlyPublished ? new Date().toISOString() : existing.published_at;

  try {
    db.prepare(`UPDATE announcements SET
      slug=?, title=?, excerpt=?, body=?, cover_image=?, language=?, status=?, is_popup=?, published_at=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?`).run(next.slug, next.title, next.excerpt, next.body, next.cover_image, next.language, next.status, next.is_popup, publishedAt, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('announcements'), (req, res) => {
  db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
