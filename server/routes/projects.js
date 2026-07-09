const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isNonEmptyString, slugify } = require('../middleware/validate');

const router = express.Router();

// Esnek proje özellikleri: gelen değeri [{label,value}] dizisine normalize edip JSON string döner.
// Boş label/value atılır; null = özellik yok.
function parseSpecs(v) {
  let arr = v;
  if (typeof v === 'string') {
    if (!v.trim()) return null;
    try { arr = JSON.parse(v); } catch { return null; }
  }
  if (!Array.isArray(arr)) return null;
  const clean = arr
    .map(x => ({
      label: String(x && x.label != null ? x.label : '').trim().slice(0, 60),
      value: String(x && x.value != null ? x.value : '').trim().slice(0, 200),
      // İkon: yalnızca güvenli karakterler (Material Symbol adı: harf + alt çizgi)
      icon: String(x && x.icon != null ? x.icon : '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 40),
    }))
    .filter(x => x.label && x.value)
    .slice(0, 30);
  return clean.length ? JSON.stringify(clean) : null;
}

// Public: yayınlanmış projeler (opsiyonel featured / category filtresi)
router.get('/', (req, res) => {
  const { language = 'tr', featured, category, limit = 60, offset = 0 } = req.query;
  function build(lang) {
    let sql = `SELECT id, slug, title, client, location, year, category, capacity, specs, summary,
                      cover_image, language, is_featured, sort_order
               FROM projects WHERE status = 'published' AND language = ?`;
    const params = [lang];
    if (featured === '1' || featured === 'true') sql += ' AND is_featured = 1';
    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY sort_order, id DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    return db.prepare(sql).all(...params);
  }
  let projects = build(language);
  if (!projects.length && language !== 'tr') projects = build('tr');
  res.json({ projects });
});

// Public: tek proje + galeri
router.get('/:slug', (req, res) => {
  const { language = 'tr' } = req.query;
  let project = db.prepare(`SELECT * FROM projects WHERE slug = ? AND language = ? AND status = 'published'`)
    .get(req.params.slug, language);
  if (!project) project = db.prepare(`SELECT * FROM projects WHERE slug = ? AND status = 'published'`).get(req.params.slug);
  if (!project) return res.status(404).json({ error: 'not_found' });
  const images = db.prepare(`SELECT id, url, caption, sort_order FROM project_images WHERE project_id = ? ORDER BY sort_order, id`)
    .all(project.id);
  res.json({ project, images });
});

// Public: projeler by brand ID
router.get('/by-brand/:brandId', (req, res) => {
  const { language = 'tr' } = req.query;
  function build(lang) {
    return db.prepare(`
      SELECT p.id, p.slug, p.title, p.client, p.location, p.year, p.category, p.capacity, p.specs,
             p.summary, p.cover_image, p.language, p.is_featured, p.sort_order
      FROM projects p JOIN project_brands pb ON pb.project_id = p.id
      WHERE pb.brand_id = ? AND p.status = 'published' AND p.language = ?
      ORDER BY p.sort_order, p.id DESC LIMIT 20
    `).all(req.params.brandId, lang);
  }
  let projects = build(language);
  if (!projects.length && language !== 'tr') projects = build('tr');
  res.json({ projects });
});

// Admin: tümü
router.get('/admin/all', authRequired, requireRole('admin'), requirePermission('projects'), (req, res) => {
  const rows = db.prepare(`SELECT * FROM projects ORDER BY language, sort_order, id DESC`).all();
  res.json({ projects: rows });
});

// Admin: tek proje + galeri (düzenleme için)
router.get('/admin/:id', authRequired, requireRole('admin'), requirePermission('projects'), (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'not_found' });
  const images = db.prepare(`SELECT id, url, caption, sort_order FROM project_images WHERE project_id = ? ORDER BY sort_order, id`)
    .all(project.id);
  const brand_ids = db.prepare('SELECT brand_id FROM project_brands WHERE project_id = ?').all(project.id).map(r => r.brand_id);
  res.json({ project, images, brand_ids });
});

function setProjectBrands(projectId, ids) {
  if (!Array.isArray(ids)) return;
  const clean = [...new Set(ids.map(Number).filter(n => n > 0))].slice(0, 50);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM project_brands WHERE project_id = ?').run(projectId);
    const ins = db.prepare('INSERT OR IGNORE INTO project_brands (project_id, brand_id) VALUES (?, ?)');
    clean.forEach(bid => ins.run(projectId, bid));
  });
  tx();
}

router.post('/', authRequired, requireRole('admin'), requirePermission('projects'), (req, res) => {
  const { title, client, location, year, category, capacity, specs, summary, body, cover_image,
    language = 'tr', status = 'draft', is_featured, sort_order = 0, slug, brand_ids } = req.body || {};
  if (!isNonEmptyString(title, 200)) return res.status(400).json({ error: 'invalid_input' });
  const finalSlug = (slug && slugify(slug)) || slugify(title);
  try {
    const info = db.prepare(`
      INSERT INTO projects (slug, title, client, location, year, category, capacity, specs, summary, body,
        cover_image, language, sort_order, is_featured, status, author_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(finalSlug, title, client || null, location || null, year || null, category || null,
      capacity || null, parseSpecs(specs), summary || null, body || '', cover_image || null, language,
      Number(sort_order) || 0, is_featured ? 1 : 0, status, req.user.id);
    setProjectBrands(info.lastInsertRowid, brand_ids);
    res.status(201).json({ ok: true, id: info.lastInsertRowid, slug: finalSlug });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('projects'), (req, res) => {
  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  const next = {
    slug: b.slug ? slugify(b.slug) : existing.slug,
    title: b.title ?? existing.title,
    client: b.client ?? existing.client,
    location: b.location ?? existing.location,
    year: b.year ?? existing.year,
    category: b.category ?? existing.category,
    capacity: b.capacity ?? existing.capacity,
    specs: b.specs !== undefined ? parseSpecs(b.specs) : existing.specs,
    summary: b.summary ?? existing.summary,
    body: b.body ?? existing.body,
    cover_image: b.cover_image ?? existing.cover_image,
    language: b.language ?? existing.language,
    status: b.status ?? existing.status,
    is_featured: b.is_featured === undefined ? existing.is_featured : (b.is_featured ? 1 : 0),
    sort_order: b.sort_order === undefined ? existing.sort_order : Number(b.sort_order) || 0,
  };
  try {
    db.prepare(`UPDATE projects SET
      slug=?, title=?, client=?, location=?, year=?, category=?, capacity=?, specs=?, summary=?, body=?,
      cover_image=?, language=?, status=?, is_featured=?, sort_order=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?`).run(next.slug, next.title, next.client, next.location, next.year, next.category,
      next.capacity, next.specs, next.summary, next.body, next.cover_image, next.language, next.status,
      next.is_featured, next.sort_order, req.params.id);
    if (req.body.brand_ids !== undefined) setProjectBrands(Number(req.params.id), req.body.brand_ids);
    res.json({ ok: true });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('projects'), (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);  // galeri ON DELETE CASCADE
  res.json({ ok: true });
});

// ===== Galeri yönetimi =====
// Görsel ekle (url önceden /api/uploads ile yüklenir)
router.post('/:id/images', authRequired, requireRole('admin'), requirePermission('projects'), (req, res) => {
  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ error: 'not_found' });
  const { url, caption, sort_order = 0 } = req.body || {};
  if (!isNonEmptyString(url, 1000)) return res.status(400).json({ error: 'invalid_input' });
  const info = db.prepare(`INSERT INTO project_images (project_id, url, caption, sort_order) VALUES (?, ?, ?, ?)`)
    .run(project.id, url, caption || null, Number(sort_order) || 0);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

// Görsel sil
router.delete('/:id/images/:imgId', authRequired, requireRole('admin'), requirePermission('projects'), (req, res) => {
  db.prepare('DELETE FROM project_images WHERE id = ? AND project_id = ?').run(req.params.imgId, req.params.id);
  res.json({ ok: true });
});

module.exports = router;
