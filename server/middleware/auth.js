const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function readToken(req) {
  // Try Authorization header first, then cookie
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  if (req.cookies && req.cookies.token) return req.cookies.token;
  return null;
}

function authRequired(req, res, next) {
  const token = readToken(req);
  if (!token) return res.status(401).json({ error: 'unauthenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, name, role, is_active, permissions FROM users WHERE id = ?').get(payload.id);
    if (!user || !user.is_active) return res.status(401).json({ error: 'inactive_or_missing' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid_token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' });
    next();
  };
}

// Admin paneli bölüm kodları (nav data-route ile aynı).
// 'dashboard' ve 'profile' her admin kullanıcısına açık (yetki gerektirmez).
const ADMIN_SECTIONS = ['leads', 'posts', 'announcements', 'services', 'projects', 'brands', 'appointments', 'careers', 'users', 'kvkk', 'kvkk-politikasi', 'basvuru-formu', 'calisan-adayi', 'imha-politikasi', 'cerez', 'settings'];

function getUserPermissions(user) {
  // NULL/yoksa = tam yetki (süper admin). Aksi halde JSON array.
  if (!user || user.permissions == null || user.permissions === '') return null; // null = hepsi
  try {
    const arr = JSON.parse(user.permissions);
    return Array.isArray(arr) ? arr : null;
  } catch { return null; }
}

function userCanAccess(user, section) {
  if (!user) return false;
  if (user.role !== 'admin') return false;
  const perms = getUserPermissions(user);
  if (perms === null) return true; // süper admin
  if (section === 'dashboard' || section === 'profile') return true;
  return perms.includes(section);
}

// Belirli bir admin bölümüne erişim iznini zorunlu kılar.
function requirePermission(section) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    if (!userCanAccess(req.user, section)) return res.status(403).json({ error: 'forbidden_section', section });
    next();
  };
}

function optionalAuth(req, res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, email, name, role, is_active, permissions FROM users WHERE id = ?').get(payload.id);
    if (user && user.is_active) req.user = user;
  } catch (_) { /* ignore */ }
  next();
}

module.exports = {
  signToken, authRequired, requireRole, optionalAuth,
  requirePermission, userCanAccess, getUserPermissions, ADMIN_SECTIONS,
};
