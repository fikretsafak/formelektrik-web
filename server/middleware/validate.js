// Lightweight validation helpers — no extra deps

function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isNonEmptyString(v, max = 500) {
  return typeof v === 'string' && v.trim().length > 0 && v.length <= max;
}

function slugify(str) {
  // Türkçe harfleri ÖNCE çevir (NFD bunları parçalamadan).
  const tr = { 'ı': 'i', 'İ': 'i', 'ş': 's', 'Ş': 's', 'ğ': 'g', 'Ğ': 'g',
               'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o', 'ç': 'c', 'Ç': 'c' };
  return String(str || '')
    .replace(/[ıİşŞğĞüÜöÖçÇ]/g, c => tr[c] || c)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function pick(obj, fields) {
  const out = {};
  for (const f of fields) if (obj[f] !== undefined) out[f] = obj[f];
  return out;
}

module.exports = { isEmail, isNonEmptyString, slugify, pick };
