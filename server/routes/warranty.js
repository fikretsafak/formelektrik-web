// Garanti Sorgulama — gizli /garanti sayfası + Navision ERP entegrasyonu.
//
// Akış (POST /query):
//   1) reCAPTCHA v2 token doğrula (Google siteverify)
//   2) Navision yapılandırılmış mı? Değilse not_configured
//   3) Navision'a seri no ile sorgu (queryNavision adapter)
//   4) Müşteri adı + vergi no BACKEND'de maskelenir (tam veri tarayıcıya gitmez)
//   5) Sorgu DB'ye loglanır (warranty_queries)
//
// Ayarlar `settings` tablosunda; admin panelden düzenlenir (requirePermission('warranty')).
// Sırlar (navision_pass, navision_api_key, recaptcha_secret) GET'te maskelenir, PUT'ta maske korunur.

const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { authRequired, requireRole, requirePermission, userCanAccess } = require('../middleware/auth');
const { getSetting, setSetting } = require('./settings');

const router = express.Router();

// Verilen bölümlerden HERHANGİ birine yetkisi olan admin geçer.
// Loglar hem 'warranty' (tam yetki) hem 'warranty-logs' (sadece görüntüleme) ile erişilebilir.
function requireAnyPermission(...sections) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    if (sections.some(s => userCanAccess(req.user, s))) return next();
    return res.status(403).json({ error: 'forbidden_section' });
  };
}

const MASK = '••••••••';
// Kısa sürede çok sorgu = bot şüphesi. IP başına 60sn'de 10 sorgu.
const queryLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

// Ayar okuma: DB (admin panel) → .env fallback (mailer.js deseni).
function cfg(key, envKey) {
  const v = getSetting(key);
  if (v && String(v).trim()) return String(v).trim();
  return (envKey && process.env[envKey]) ? process.env[envKey] : '';
}

// Admin panelde düzenlenebilen tüm warranty ayar anahtarları.
const WARRANTY_KEYS = [
  'navision_api_url',       // tek-seri canlı test endpoint'i (admin bağlantı testi için)
  'navision_list_url',      // TÜM kayıtları döndüren toplu/liste ucu (günlük sync; boşsa sync no-op)
  'navision_auth_type',     // 'none' | 'basic' | 'bearer'
  'navision_user',          // basic auth kullanıcı
  'navision_pass',          // basic auth şifre (maskeli)
  'navision_api_key',       // bearer/api key (maskeli)
  // API şekli belirsiz → yanıttaki alan yolları admin'den ayarlanır (nokta gösterimi: "data.invoiceDate")
  'navision_field_invoice_date',
  'navision_field_invoice_no',
  'navision_field_warranty_start',
  'navision_field_warranty_end',
  'navision_field_customer_name',
  'navision_field_tax_no',
  'recaptcha_site_key',     // reCAPTCHA v2 site key (public)
  'recaptcha_secret',       // reCAPTCHA v2 secret (maskeli)
];
const SECRET_KEYS = ['navision_pass', 'navision_api_key', 'recaptcha_secret'];

// ---- Maskeleme (backend) ----
// "Ahmet Yılmaz" -> "Ah*** Yı***" ; tek kelimeyse "Ahmet" -> "Ah***"
function maskName(name) {
  if (!name) return '';
  return String(name).trim().split(/\s+/).map(w => {
    if (w.length <= 2) return w[0] ? w[0] + '*' : w;
    return w.slice(0, 2) + '***';
  }).join(' ');
}
// "1234567890" -> "*******890" (son 3 hane açık)
function maskTaxNo(tax) {
  if (!tax) return '';
  const s = String(tax).trim();
  if (s.length <= 3) return '*'.repeat(s.length);
  return '*'.repeat(s.length - 3) + s.slice(-3);
}

// ---- reCAPTCHA v2 doğrulama ----
async function verifyRecaptcha(token, remoteIp) {
  const secret = cfg('recaptcha_secret', 'RECAPTCHA_SECRET');
  // Secret yapılandırılmamışsa captcha'yı zorunlu tutma (dev kolaylığı). Prod'da admin doldurur.
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false, skipped: false };
  try {
    const params = new URLSearchParams({ secret, response: token });
    if (remoteIp) params.append('remoteip', remoteIp);
    const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await r.json();
    return { ok: !!data.success, skipped: false };
  } catch {
    return { ok: false, skipped: false };
  }
}

// ---- Navision adapter ----
// API tipi (OData/SOAP/REST) henüz kesin değil. Tüm ERP çağrısı burada izole;
// gerçek endpoint/örnek yanıt gelince yalnızca bu fonksiyon + alan eşleme güncellenir.
// Şimdilik REST-JSON varsayımı: GET <url> (seri no query/path) + opsiyonel auth header.
function getByPath(obj, pathStr) {
  if (!obj || !pathStr) return undefined;
  return pathStr.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

// Ayarlı auth tipine göre ortak istek header'ları.
function buildHeaders() {
  const headers = { 'Accept': 'application/json' };
  const authType = (cfg('navision_auth_type') || 'none').toLowerCase();
  if (authType === 'basic') {
    const user = cfg('navision_user', 'NAVISION_USER');
    const pass = cfg('navision_pass', 'NAVISION_PASS');
    headers['Authorization'] = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  } else if (authType === 'bearer') {
    const key = cfg('navision_api_key');
    if (key) headers['Authorization'] = 'Bearer ' + key;
  }
  return headers;
}

// Tek ERP kaydını iç modele eşle. Alan yolu admin'de tanımlıysa onu, yoksa yaygın adları dene.
function mapRecord(rec) {
  const pick = (settingKey, ...fallbacks) => {
    const p = cfg(settingKey);
    if (p) { const v = getByPath(rec, p); if (v != null) return v; }
    for (const f of fallbacks) { if (rec[f] != null) return rec[f]; }
    return '';
  };
  return {
    serialNo:       pick('navision_field_serial', 'serial', 'serialNo', 'SerialNo', 'seri_no'),
    invoiceDate:    pick('navision_field_invoice_date', 'invoiceDate', 'InvoiceDate', 'fatura_tarihi'),
    invoiceNo:      pick('navision_field_invoice_no', 'invoiceNo', 'InvoiceNo', 'fatura_no'),
    warrantyStart:  pick('navision_field_warranty_start', 'warrantyStart', 'WarrantyStart', 'garanti_baslangic'),
    warrantyEnd:    pick('navision_field_warranty_end', 'warrantyEnd', 'WarrantyEnd', 'garanti_bitis'),
    customerName:   pick('navision_field_customer_name', 'customerName', 'CustomerName', 'musteri_adi'),
    taxNo:          pick('navision_field_tax_no', 'taxNo', 'TaxNo', 'vergi_no'),
  };
}

// Tek seri no ile canlı ERP sorgusu — YALNIZCA admin bağlantı testi (/test) için.
// Public /query artık ERP'ye gitmez; warranty_cache'ten okur.
async function queryNavision(serialNo) {
  const url = cfg('navision_api_url', 'NAVISION_API_URL');
  if (!url) { const e = new Error('not_configured'); e.code = 'not_configured'; throw e; }

  // Seri no'yu URL'e yerleştir: {serial} placeholder varsa değiştir, yoksa query param ekle.
  let reqUrl;
  if (url.includes('{serial}')) {
    reqUrl = url.replace('{serial}', encodeURIComponent(serialNo));
  } else {
    reqUrl = url + (url.includes('?') ? '&' : '?') + 'serial=' + encodeURIComponent(serialNo);
  }

  const r = await fetch(reqUrl, { headers: buildHeaders() });
  if (r.status === 404) return null;                 // kayıt yok
  if (!r.ok) { const e = new Error('erp_error_' + r.status); e.code = 'error'; throw e; }
  const data = await r.json().catch(() => null);
  if (!data) return null;

  // OData/liste yanıtı ise ilk kaydı al (value[]), değilse objenin kendisi.
  const rec = Array.isArray(data) ? data[0]
    : (data.value && Array.isArray(data.value) ? data.value[0] : data);
  if (!rec) return null;
  const m = mapRecord(rec);
  delete m.serialNo; // tek sorgu yanıtında seri no zaten biliniyor
  return m;
}

// ---- Günlük sync: ERP'nin toplu ucundan TÜM kayıtları çekip warranty_cache'i tazele ----
// navision_list_url boşsa no-op. Sonuç/hata `settings`'e yazılır (admin panelde gösterilir).
async function syncWarrantyCache() {
  const listUrl = cfg('navision_list_url', 'NAVISION_LIST_URL');
  if (!listUrl) return { skipped: true, reason: 'no_list_url' };

  let rows;
  try {
    const r = await fetch(listUrl, { headers: buildHeaders() });
    if (!r.ok) throw new Error('erp_error_' + r.status);
    const data = await r.json();
    const list = Array.isArray(data) ? data
      : (data && data.value && Array.isArray(data.value) ? data.value : []);
    rows = list.map(mapRecord).filter(rec => String(rec.serialNo || '').trim());
  } catch (err) {
    const msg = String(err.message || err);
    setSetting('warranty_last_sync_error', msg);
    setSetting('warranty_last_sync', new Date().toISOString());
    return { ok: false, error: msg };
  }

  // Tek transaction: eski cache'i sil, taze kayıtları yaz (ERP'de silinen cache'te kalmaz).
  const replace = db.transaction((recs) => {
    db.prepare('DELETE FROM warranty_cache').run();
    const ins = db.prepare(`INSERT OR REPLACE INTO warranty_cache
      (serial_no, invoice_date, invoice_no, warranty_start, warranty_end, customer_name, tax_no, synced_at)
      VALUES (@serial_no, @invoice_date, @invoice_no, @warranty_start, @warranty_end, @customer_name, @tax_no, datetime('now'))`);
    for (const rec of recs) {
      ins.run({
        serial_no: String(rec.serialNo).trim().slice(0, 120),
        invoice_date: String(rec.invoiceDate || ''),
        invoice_no: String(rec.invoiceNo || ''),
        warranty_start: String(rec.warrantyStart || ''),
        warranty_end: String(rec.warrantyEnd || ''),
        customer_name: String(rec.customerName || ''),
        tax_no: String(rec.taxNo || ''),
      });
    }
  });
  replace(rows);

  setSetting('warranty_last_sync', new Date().toISOString());
  setSetting('warranty_last_sync_count', String(rows.length));
  setSetting('warranty_last_sync_error', '');
  return { ok: true, count: rows.length };
}

function logQuery(serialNo, result, ip) {
  try {
    db.prepare('INSERT INTO warranty_queries (serial_no, result, ip) VALUES (?, ?, ?)')
      .run(String(serialNo || '').slice(0, 120), result, String(ip || '').slice(0, 60));
  } catch { /* log hatası sorguyu bozmasın */ }
}

// ============================================================
// PUBLIC
// ============================================================

// Sayfa açılışında: reCAPTCHA site key + servis aktif mi.
router.get('/config', (req, res) => {
  res.json({
    recaptcha_site_key: cfg('recaptcha_site_key', 'RECAPTCHA_SITE_KEY'),
    configured: !!cfg('navision_api_url', 'NAVISION_API_URL'),
  });
});

// Garanti sorgusu.
router.post('/query', queryLimiter, async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').toString().split(',')[0].trim();
  const serialNo = (req.body && req.body.serialNo ? String(req.body.serialNo) : '').trim();
  const token = req.body && req.body.recaptchaToken;

  if (!serialNo || serialNo.length > 120) {
    return res.status(400).json({ error: 'invalid_serial' });
  }

  // 1) reCAPTCHA
  const cap = await verifyRecaptcha(token, ip);
  if (!cap.ok) {
    logQuery(serialNo, 'captcha_failed', ip);
    return res.status(400).json({ error: 'captcha_failed' });
  }

  // 2) Yerel önbellekten oku (ERP'ye canlı istek YOK — veri günlük sync ile gelir)
  const row = db.prepare('SELECT * FROM warranty_cache WHERE serial_no = ?').get(serialNo);
  if (!row) {
    logQuery(serialNo, 'not_found', ip);
    return res.json({ found: false });
  }
  // 3) Maskeleme (backend) — ham müşteri adı / vergi no tarayıcıya gitmez
  const masked = {
    invoiceDate: row.invoice_date || '',
    invoiceNo: row.invoice_no || '',
    warrantyStart: row.warranty_start || '',
    warrantyEnd: row.warranty_end || '',
    customerName: maskName(row.customer_name),
    taxNo: maskTaxNo(row.tax_no),
  };
  logQuery(serialNo, 'found', ip);
  res.json({ found: true, warranty: masked });
});

// ============================================================
// ADMIN (requirePermission('warranty'))
// ============================================================
const adminGuard = [authRequired, requireRole('admin'), requirePermission('warranty')];

// Ayarları getir (sırlar maskeli).
router.get('/settings', ...adminGuard, (req, res) => {
  const out = {};
  WARRANTY_KEYS.forEach(k => {
    const v = getSetting(k) || '';
    out[k] = (SECRET_KEYS.includes(k) && v) ? MASK : v;
  });
  const cacheCount = db.prepare('SELECT COUNT(*) AS n FROM warranty_cache').get().n;
  res.json({
    settings: out,
    sync: {
      lastSync: getSetting('warranty_last_sync') || '',
      lastCount: getSetting('warranty_last_sync_count') || '',
      lastError: getSetting('warranty_last_sync_error') || '',
      cacheCount,
    },
  });
});

// Ayarları güncelle (maske gelen sırları koru).
router.put('/settings', ...adminGuard, (req, res) => {
  const body = req.body || {};
  WARRANTY_KEYS.forEach(k => {
    if (!(k in body)) return;
    let v = body[k];
    if (SECRET_KEYS.includes(k) && v === MASK) return; // maskeyi geri yazma
    setSetting(k, v == null ? '' : String(v));
  });
  res.json({ ok: true });
});

// Son sorgu logları — 'warranty' veya 'warranty-logs' yetkisi yeterli.
router.get('/logs', authRequired, requireRole('admin'), requireAnyPermission('warranty', 'warranty-logs'), (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
  const rows = db.prepare(
    'SELECT id, serial_no, result, ip, created_at FROM warranty_queries ORDER BY id DESC LIMIT ?'
  ).all(limit);
  res.json({ logs: rows });
});

// Bağlantı testi — verilen (veya kayıtlı) seri no ile Navision'a canlı sorgu dener.
router.post('/test', ...adminGuard, async (req, res) => {
  const serialNo = (req.body && req.body.serialNo ? String(req.body.serialNo) : 'TEST').trim();
  try {
    const rec = await queryNavision(serialNo);
    res.json({ ok: true, found: !!rec, raw: rec || null });
  } catch (err) {
    res.status(err.code === 'not_configured' ? 503 : 502)
      .json({ ok: false, error: err.code === 'not_configured' ? 'not_configured' : 'erp_error', detail: String(err.message || '') });
  }
});

// Manuel sync — admin panelden "Şimdi Senkronize Et".
router.post('/sync', ...adminGuard, async (req, res) => {
  const result = await syncWarrantyCache();
  if (result.skipped) return res.status(400).json({ ok: false, error: 'no_list_url' });
  if (!result.ok) return res.status(502).json({ ok: false, error: 'erp_error', detail: result.error });
  res.json({ ok: true, count: result.count });
});

module.exports = router;
module.exports.syncWarrantyCache = syncWarrantyCache;
