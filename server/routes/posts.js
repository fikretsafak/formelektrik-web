const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isNonEmptyString, slugify } = require('../middleware/validate');

const router = express.Router();

// Public: list published posts (yazar join + opsiyonel arama/yazar filtresi)
router.get('/', (req, res) => {
  const { language = 'tr', tag, q, author, limit = 20, offset = 0 } = req.query;
  function build(lang) {
    let sql = `SELECT p.id, p.slug, p.title, p.excerpt, p.cover_image, p.tags, p.language, p.published_at,
                      p.author_id, u.name AS author_name, u.avatar_url AS author_avatar,
                      LENGTH(p.body) AS body_length
               FROM posts p
               LEFT JOIN users u ON u.id = p.author_id
               WHERE p.status = 'published' AND p.language = ?`;
    const params = [lang];
    if (tag) { sql += ' AND p.tags LIKE ?'; params.push(`%${tag}%`); }
    if (author) { sql += ' AND p.author_id = ?'; params.push(Number(author)); }
    if (q) {
      sql += ' AND (p.title LIKE ? OR p.excerpt LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like);
    }
    sql += ' ORDER BY p.published_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    return { sql, params };
  }
  let { sql, params } = build(language);
  let posts = db.prepare(sql).all(...params);
  // Fallback: istenen dilde yazı yoksa diğer dilleri de göster
  if (!posts.length && language !== 'tr') {
    ({ sql, params } = build('tr'));
    posts = db.prepare(sql).all(...params);
  }
  res.json({ posts });
});

// Yayınlanmış yazısı olan tüm yazarlar (filtreleme için)
router.get('/authors', (req, res) => {
  const { language = 'tr' } = req.query;
  const rows = db.prepare(`
    SELECT u.id, u.name, COUNT(p.id) AS post_count
    FROM users u
    JOIN posts p ON p.author_id = u.id
    WHERE p.status = 'published' AND p.language = ?
    GROUP BY u.id
    ORDER BY post_count DESC, u.name
  `).all(language);
  res.json({ authors: rows });
});

router.get('/:slug', (req, res) => {
  const { language = 'tr' } = req.query;
  function find(lang) {
    return db.prepare(`
      SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar
      FROM posts p
      LEFT JOIN users u ON u.id = p.author_id
      WHERE p.slug = ? AND p.language = ? AND p.status = 'published'
    `).get(req.params.slug, lang);
  }
  let row = find(language);
  if (!row && language !== 'tr') row = find('tr');
  if (!row) row = db.prepare(`
    SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar
    FROM posts p
    LEFT JOIN users u ON u.id = p.author_id
    WHERE p.slug = ? AND p.status = 'published'
    ORDER BY CASE p.language WHEN 'tr' THEN 0 ELSE 1 END
    LIMIT 1
  `).get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'not_found' });
  res.json({ post: row });
});

// Admin: full listing including drafts
router.get('/admin/all', authRequired, requireRole('admin'), requirePermission('posts'), (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.name AS author_name, u.avatar_url AS author_avatar
    FROM posts p
    LEFT JOIN users u ON u.id = p.author_id
    ORDER BY p.updated_at DESC
  `).all();
  res.json({ posts: rows });
});

router.post('/', authRequired, requireRole('admin'), requirePermission('posts'), (req, res) => {
  const { title, body, excerpt, cover_image, show_cover, tags, language = 'tr', status = 'draft', slug } = req.body || {};
  if (!isNonEmptyString(title, 200) || !isNonEmptyString(body, 200000)) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  const finalSlug = (slug && slugify(slug)) || slugify(title);
  const publishedAt = status === 'published' ? new Date().toISOString() : null;
  const showCoverInt = show_cover === undefined ? 1 : (show_cover ? 1 : 0);
  try {
    const info = db.prepare(`
      INSERT INTO posts (slug, title, excerpt, body, cover_image, show_cover, tags, language, status, author_id, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(finalSlug, title, excerpt || null, body, cover_image || null, showCoverInt, tags || null, language, status, req.user.id, publishedAt);
    res.status(201).json({ ok: true, id: info.lastInsertRowid, slug: finalSlug });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.put('/:id', authRequired, requireRole('admin'), requirePermission('posts'), (req, res) => {
  const { title, body, excerpt, cover_image, show_cover, tags, language, status, slug } = req.body || {};
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not_found' });

  const next = {
    title: title ?? existing.title,
    body: body ?? existing.body,
    excerpt: excerpt ?? existing.excerpt,
    cover_image: cover_image ?? existing.cover_image,
    show_cover: show_cover === undefined ? existing.show_cover : (show_cover ? 1 : 0),
    tags: tags ?? existing.tags,
    language: language ?? existing.language,
    status: status ?? existing.status,
    slug: slug ? slugify(slug) : existing.slug,
  };
  const newlyPublished = existing.status !== 'published' && next.status === 'published';
  const publishedAt = newlyPublished ? new Date().toISOString() : existing.published_at;

  try {
    db.prepare(`UPDATE posts SET
      slug=?, title=?, excerpt=?, body=?, cover_image=?, show_cover=?, tags=?, language=?, status=?, published_at=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?`).run(next.slug, next.title, next.excerpt, next.body, next.cover_image, next.show_cover, next.tags, next.language, next.status, publishedAt, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'slug_exists' });
    throw e;
  }
});

router.delete('/:id', authRequired, requireRole('admin'), requirePermission('posts'), (req, res) => {
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Benzersiz slug üret (parent yok, global unique)
function uniqueSlug(base, language = 'tr') {
  let slug = base, n = 1;
  while (db.prepare('SELECT 1 FROM posts WHERE slug = ? AND language = ?').get(slug, language)) {
    n++; slug = `${base}-${n}`;
  }
  return slug;
}

// ===== Çoğalt (duplicate) — taslak kopya oluştur =====
router.post('/:id/duplicate', authRequired, requireRole('admin'), requirePermission('posts'), (req, res) => {
  const src = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!src) return res.status(404).json({ error: 'not_found' });
  const newTitle = src.title + ' (kopya)';
  const newSlug = uniqueSlug(slugify(src.slug || src.title) + '-kopya', src.language || 'tr');
  const info = db.prepare(`
    INSERT INTO posts (slug, title, excerpt, body, cover_image, show_cover, tags, language, status, author_id, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, NULL)
  `).run(newSlug, newTitle, src.excerpt, src.body, src.cover_image, src.show_cover, src.tags, src.language, req.user.id);
  res.status(201).json({ ok: true, id: info.lastInsertRowid, slug: newSlug });
});

// ===== Yedek al (export) — tüm yazıları JSON döndür =====
router.get('/admin/export', authRequired, requireRole('admin'), requirePermission('posts'), (req, res) => {
  const posts = db.prepare(`
    SELECT slug, title, excerpt, body, cover_image, show_cover, tags, language, status, published_at, created_at, updated_at
    FROM posts ORDER BY id
  `).all();
  res.json({ version: 1, exported_at: new Date().toISOString(), count: posts.length, posts });
});

// ===== İçe aktar (import) — JSON'dan yazıları geri yükle =====
// mode: 'skip' (varolan slug atla) | 'overwrite' (varsa güncelle)
router.post('/admin/import', authRequired, requireRole('admin'), requirePermission('posts'), (req, res) => {
  const { posts, mode = 'skip' } = req.body || {};
  if (!Array.isArray(posts)) return res.status(400).json({ error: 'invalid_input' });

  const insert = db.prepare(`
    INSERT INTO posts (slug, title, excerpt, body, cover_image, show_cover, tags, language, status, author_id, published_at)
    VALUES (@slug, @title, @excerpt, @body, @cover_image, @show_cover, @tags, @language, @status, @author_id, @published_at)
  `);
  const update = db.prepare(`
    UPDATE posts SET title=@title, excerpt=@excerpt, body=@body, cover_image=@cover_image,
      show_cover=@show_cover, tags=@tags, language=@language, status=@status,
      published_at=@published_at, updated_at=CURRENT_TIMESTAMP
    WHERE slug=@slug AND language=@language
  `);
  const findBySlug = db.prepare('SELECT id FROM posts WHERE slug = ? AND language = ?');

  let imported = 0, updated = 0, skipped = 0;
  const tx = db.transaction(() => {
    posts.forEach(p => {
      if (!p || !p.title || !p.body) { skipped++; return; }
      const row = {
        slug: (p.slug && slugify(p.slug)) || slugify(p.title),
        title: p.title, excerpt: p.excerpt || null, body: p.body,
        cover_image: p.cover_image || null,
        show_cover: p.show_cover === 0 ? 0 : 1,
        tags: p.tags || null, language: p.language || 'tr',
        status: ['draft', 'published'].includes(p.status) ? p.status : 'draft',
        author_id: req.user.id,
        published_at: p.published_at || (p.status === 'published' ? new Date().toISOString() : null),
      };
      const exists = findBySlug.get(row.slug, row.language);
      if (exists) {
        if (mode === 'overwrite') { update.run(row); updated++; }
        else skipped++;
      } else {
        insert.run(row); imported++;
      }
    });
  });
  tx();
  res.json({ ok: true, imported, updated, skipped });
});

module.exports = router;
