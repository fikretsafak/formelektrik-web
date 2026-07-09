const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Public: aktif referans logoları
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, logo_url, url, sort_order FROM reference_logos WHERE is_active = 1 ORDER BY sort_order, id').all();
  res.json({ logos: rows });
});

// Admin: tümü
router.get('/admin/all', authRequired, requireRole('admin'), requirePermission('references'), (req, res) => {
  const rows = db.prepare('SELECT * FROM reference_logos ORDER BY sort_order, id').all();
  res.json({ logos: rows });
});

router.post('/', authRequired, requireRole('admin'), requirePermission('references'), (req, res) => {
  const { name, logo_url, url, sort_order = 0, is_active = 1 } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name_required' });
  const info = db.prepare('INSERT INTO reference_logos (name, logo_url, url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)')
    .run(name, logo_url || null, url || null, Number(sort_order) || 0, is_active ? 1 : 0);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('references'), (req, res) => {
  const existing = db.prepare('SELECT * FROM reference_logos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  db.prepare('UPDATE reference_logos SET name=?, logo_url=?, url=?, sort_order=?, is_active=? WHERE id=?')
    .run(b.name ?? existing.name, b.logo_url ?? existing.logo_url, b.url ?? existing.url,
      b.sort_order !== undefined ? Number(b.sort_order) || 0 : existing.sort_order,
      b.is_active !== undefined ? (b.is_active ? 1 : 0) : existing.is_active, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('references'), (req, res) => {
  db.prepare('DELETE FROM reference_logos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
