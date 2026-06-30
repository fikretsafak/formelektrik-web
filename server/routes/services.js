const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isNonEmptyString, slugify } = require('../middleware/validate');

const router = express.Router();

// Public: yayınlanmış hizmetler
router.get('/', (req, res) => {
  const { language = 'tr' } = req.query;
  function build(lang) {
    return db.prepare(`
      SELECT id, slug, code, title, summary, icon, cover_image, language, sort_order
      FROM services
      WHERE status = 'published' AND language = ?
      ORDER BY sort_order, id
    `).all(lang);
  }
  let services = build(language);
  if (!services.length && language !== 'tr') services = build('tr');
  res.json({ services });
});

// Public: tek hizmet
router.get('/:slug', (req, res) => {
  const { language = 'tr' } = req.query;
  let row = db.prepare(`SELECT * FROM services WHERE slug = ? AND language = ? AND status = 'published'`)
    .get(req.params.slug, language);
  if (!row) row = db.prepare(`SELECT * FROM services WHERE slug = ? AND status = 'published'`).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ service: row });
});

// Admin: tümü (taslaklar dahil)
router.get('/admin/all', authRequired, requireRole('admin'), requirePermission('services'), (req, res) => {
  const rows = db.prepare(`SELECT * FROM services ORDER BY language, sort_order, id`).all();
  res.json({ services: rows });
});

router.post('/', authRequired, requireRole('admin'), requirePermission('services'), (req, res) => {
  const { title, summary, body, icon, cover_image, code, language = 'tr', status = 'draft', sort_order = 0, slug } = req.body || {};
  if (!isNonEmptyString(title, 200)) return res.status(400).json({ error: 'invalid_input' });
  const finalSlug = (slug && slugify(slug)) || slugify(title);
  try {
    const info = db.prepare(`
      INSERT INTO services (slug, code, title, summary, body, icon, cover_image, language, sort_order, status, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(finalSlug, code || null, title, summary || null, body || '', icon || null, cover_image || null,
      language, Number(sort_order) || 0, status, req.user.id);
    res.status(201).json({ ok: true, id: info.lastInsertRowid, slug: finalSlug });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('services'), (req, res) => {
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const { title, summary, body, icon, cover_image, code, language, status, sort_order, slug } = req.body || {};
  const next = {
    slug: slug ? slugify(slug) : existing.slug,
    code: code ?? existing.code,
    title: title ?? existing.title,
    summary: summary ?? existing.summary,
    body: body ?? existing.body,
    icon: icon ?? existing.icon,
    cover_image: cover_image ?? existing.cover_image,
    language: language ?? existing.language,
    status: status ?? existing.status,
    sort_order: sort_order === undefined ? existing.sort_order : Number(sort_order) || 0,
  };
  try {
    db.prepare(`UPDATE services SET
      slug=?, code=?, title=?, summary=?, body=?, icon=?, cover_image=?, language=?, status=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?`).run(next.slug, next.code, next.title, next.summary, next.body, next.icon, next.cover_image,
      next.language, next.status, next.sort_order, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('services'), (req, res) => {
  db.prepare('DELETE FROM services WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
