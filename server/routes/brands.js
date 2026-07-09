const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isNonEmptyString, slugify } = require('../middleware/validate');

const router = express.Router();

// Public: ana sayfa markaları — show_on_homepage işaretli olanlar (umbrella veya partner)
router.get('/', (req, res) => {
  const { language = 'tr' } = req.query;
  const svcStmt = db.prepare('SELECT service_code FROM brand_services WHERE brand_id = ? ORDER BY sort_order, id');
  function build(lang) {
    const rows = db.prepare(`
      SELECT id, name, slug, description, logo_url, url, type, sort_order
      FROM brands WHERE is_active = 1 AND language = ? AND show_on_homepage = 1
      ORDER BY sort_order, id
    `).all(lang);
    rows.forEach(r => { r.services = svcStmt.all(r.id).map(s => s.service_code); });
    return rows;
  }
  let brands = build(language);
  if (!brands.length && language !== 'tr') brands = build('tr');
  res.json({ brands });
});

// Public: hizmet bazlı çözüm ortağı markalar. ?service=<kod> ile filtre.
router.get('/partner', (req, res) => {
  const { service } = req.query;
  const rows = service
    ? db.prepare(`
        SELECT b.id, b.name, b.slug, b.description, b.logo_url, b.url, b.sort_order
        FROM brands b JOIN brand_services bs ON bs.brand_id = b.id
        WHERE b.is_active = 1 AND bs.service_code = ?
        ORDER BY bs.sort_order, b.sort_order, b.id
      `).all(service)
    : db.prepare(`
        SELECT id, name, slug, description, logo_url, url, sort_order
        FROM brands WHERE is_active = 1 AND type = 'partner'
        ORDER BY sort_order, id
      `).all();
  res.json({ brands: rows });
});

// Public: marka detay (slug). Çözüm ortağı detay sayfası bu endpoint'i kullanır.
// NOT: /partner ve /admin/all route'larından SONRA tanımlı — /:slug onları yutmasın.
router.get('/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM brands WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'not_found' });
  const services = db.prepare('SELECT service_code FROM brand_services WHERE brand_id = ? ORDER BY sort_order, id')
    .all(row.id).map(r => r.service_code);
  res.json({ brand: { ...row, services } });
});

// Admin: tümü
router.get('/admin/all', authRequired, requireRole('admin'), requirePermission('brands'), (req, res) => {
  const rows = db.prepare(`SELECT * FROM brands ORDER BY language, sort_order, id`).all();
  // Her markanın ilişkili hizmet kodlarını ekle (admin formunda gösterilir)
  const svcStmt = db.prepare('SELECT service_code FROM brand_services WHERE brand_id = ? ORDER BY sort_order, id');
  rows.forEach(r => { r.services = svcStmt.all(r.id).map(s => s.service_code); });
  res.json({ brands: rows });
});

// brand_services ilişkisini verilen kod listesiyle değiştir (replace)
function setBrandServices(brandId, codes) {
  if (!Array.isArray(codes)) return;
  const clean = [...new Set(codes.map(c => String(c || '').trim()).filter(Boolean))].slice(0, 20);
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM brand_services WHERE brand_id = ?').run(brandId);
    const ins = db.prepare('INSERT OR IGNORE INTO brand_services (brand_id, service_code, sort_order) VALUES (?, ?, ?)');
    clean.forEach((code, i) => ins.run(brandId, code, i));
  });
  tx();
}

router.post('/', authRequired, requireRole('admin'), requirePermission('brands'), (req, res) => {
  const { name, description, body, cover_image, logo_url, url, type, language = 'tr', sort_order = 0, is_active, show_on_homepage, slug, service_codes } = req.body || {};
  if (!isNonEmptyString(name, 120)) return res.status(400).json({ error: 'invalid_input' });
  const finalType = type === 'partner' ? 'partner' : 'umbrella';
  const info = db.prepare(`
    INSERT INTO brands (name, slug, description, body, cover_image, logo_url, url, type, language, sort_order, is_active, show_on_homepage)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, (slug && slugify(slug)) || slugify(name), description || null, body || '', cover_image || null,
    logo_url || null, url || null, finalType,
    language, Number(sort_order) || 0, is_active === undefined ? 1 : (is_active ? 1 : 0),
    show_on_homepage !== undefined ? (show_on_homepage ? 1 : 0) : (finalType === 'umbrella' ? 1 : 0));
  setBrandServices(info.lastInsertRowid, service_codes);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('brands'), (req, res) => {
  const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  const next = {
    name: b.name ?? existing.name,
    slug: b.slug ? slugify(b.slug) : existing.slug,
    description: b.description ?? existing.description,
    body: b.body ?? existing.body,
    cover_image: b.cover_image ?? existing.cover_image,
    logo_url: b.logo_url ?? existing.logo_url,
    url: b.url ?? existing.url,
    type: b.type === undefined ? existing.type : (b.type === 'partner' ? 'partner' : 'umbrella'),
    language: b.language ?? existing.language,
    sort_order: b.sort_order === undefined ? existing.sort_order : Number(b.sort_order) || 0,
    is_active: b.is_active === undefined ? existing.is_active : (b.is_active ? 1 : 0),
    show_on_homepage: b.show_on_homepage === undefined ? existing.show_on_homepage : (b.show_on_homepage ? 1 : 0),
  };
  db.prepare(`UPDATE brands SET
    name=?, slug=?, description=?, body=?, cover_image=?, logo_url=?, url=?, type=?, language=?, sort_order=?, is_active=?, show_on_homepage=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?`).run(next.name, next.slug, next.description, next.body, next.cover_image, next.logo_url, next.url,
    next.type, next.language, next.sort_order, next.is_active, next.show_on_homepage, req.params.id);
  if (b.service_codes !== undefined) setBrandServices(Number(req.params.id), b.service_codes);
  res.json({ ok: true });
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('brands'), (req, res) => {
  db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
