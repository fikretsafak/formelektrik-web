const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Public: aktif kilometre taşları (kurumsal sayfa)
router.get('/', (req, res) => {
  const { language = 'tr' } = req.query;
  let rows = db.prepare(
    'SELECT id, year, title, description, icon FROM milestones WHERE is_active = 1 AND language = ? ORDER BY sort_order, id'
  ).all(language);
  if (!rows.length && language !== 'tr') {
    rows = db.prepare(
      'SELECT id, year, title, description, icon FROM milestones WHERE is_active = 1 AND language = ? ORDER BY sort_order, id'
    ).all('tr');
  }
  res.json({ milestones: rows });
});

// Admin: tümü
router.get('/admin/all', authRequired, requireRole('admin'), requirePermission('milestones'), (req, res) => {
  const rows = db.prepare('SELECT * FROM milestones ORDER BY language, sort_order, id').all();
  res.json({ milestones: rows });
});

router.post('/', authRequired, requireRole('admin'), requirePermission('milestones'), (req, res) => {
  const { year, title, description, icon = 'flag', language = 'tr', sort_order = 0, is_active } = req.body || {};
  if (!year || !title) return res.status(400).json({ error: 'invalid_input' });
  const info = db.prepare(
    'INSERT INTO milestones (year, title, description, icon, language, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(year, title, description || null, icon, language, Number(sort_order) || 0, is_active === undefined ? 1 : (is_active ? 1 : 0));
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('milestones'), (req, res) => {
  const existing = db.prepare('SELECT * FROM milestones WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });
  const b = req.body || {};
  const next = {
    year: b.year ?? existing.year,
    title: b.title ?? existing.title,
    description: b.description ?? existing.description,
    icon: b.icon ?? existing.icon,
    language: b.language ?? existing.language,
    sort_order: b.sort_order === undefined ? existing.sort_order : Number(b.sort_order) || 0,
    is_active: b.is_active === undefined ? existing.is_active : (b.is_active ? 1 : 0),
  };
  db.prepare(
    'UPDATE milestones SET year=?, title=?, description=?, icon=?, language=?, sort_order=?, is_active=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
  ).run(next.year, next.title, next.description, next.icon, next.language, next.sort_order, next.is_active, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('milestones'), (req, res) => {
  db.prepare('DELETE FROM milestones WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
