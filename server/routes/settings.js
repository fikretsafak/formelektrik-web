const express = require('express');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');

const router = express.Router();

function getAll() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const obj = {};
  rows.forEach(r => { obj[r.key] = r.value; });
  return obj;
}

function get(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? row.value : null;
}

function set(key, value) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?')
    .run(key, value, value);
}

const DEFAULT_KVKK = {
  tr: {
    title: 'KVKK Aydınlatma Metni',
    updated: 'Bu metin yakında güncellenecektir.',
    body: `<div class="legal-note"><span class="material-symbols-rounded">info</span><span>Bu metin taslak niteliğindedir ve <b>yakında güncellenecektir.</b> Aşağıdaki başlıklar 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) çerçevesinin genel yapısını yansıtır.</span></div>
<h2>1. Veri Sorumlusu</h2><p>6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla Form Elektrik İnş.Müh.A.Ş tarafından işlenebilecektir.</p>
<h2>2. İşlenen Kişisel Veriler</h2><ul><li>Kimlik bilgileri (ad, soyad)</li><li>İletişim bilgileri (e-posta, telefon, şirket/kurum bilgisi)</li><li>Talep ve mesaj içeriğiniz</li><li>İnternet sitemizi kullanımınıza ilişkin teknik kayıtlar ve çerezler</li></ul>
<h2>3. İşlenme Amaçları</h2><p>Kişisel verileriniz taleplerinize cevap verilmesi, teklif ve randevu süreçlerinin yürütülmesi, yasal yükümlülüklerin yerine getirilmesi ve sizinle iletişim kurulması amaçlarıyla işlenmektedir.</p>
<h2>4. Aktarım</h2><p>Kişisel verileriniz yalnızca gerekli olduğu ölçüde ve mevzuata uygun olarak yetkili kişi, kurum ve iş ortaklarıyla paylaşılabilir.</p>
<h2>5. Haklarınız</h2><p>KVKK’nın 11. maddesi kapsamındaki haklarınızı iletişim kanallarımız üzerinden Şirketimize iletebilirsiniz.</p>`,
  },
  en: {
    title: 'Privacy Notice',
    updated: 'This notice will be updated soon.',
    body: `<div class="legal-note"><span class="material-symbols-rounded">info</span><span>This notice is a draft and will be updated soon. It summarizes how Form Elektrik handles personal data under applicable data protection rules.</span></div>
<h2>1. Data Controller</h2><p>Your personal data may be processed by Form Elektrik İnş.Müh.A.Ş as data controller.</p>
<h2>2. Personal Data We Process</h2><ul><li>Identity data such as name and surname</li><li>Contact data such as email, phone, company/organization</li><li>Your request and message content</li><li>Technical website usage records and cookies</li></ul>
<h2>3. Purposes of Processing</h2><p>We process personal data to respond to requests, manage quotation and appointment processes, meet legal obligations, improve our services and contact you.</p>
<h2>4. Transfers</h2><p>Your personal data may be shared with authorized persons, public authorities and business partners only where necessary and in accordance with applicable law.</p>
<h2>5. Your Rights</h2><p>You may contact us through our communication channels to exercise your rights regarding personal data.</p>`,
  },
};

function kvkkPayload(language) {
  const lang = language === 'en' ? 'en' : 'tr';
  const fallback = DEFAULT_KVKK[lang] || DEFAULT_KVKK.tr;
  const trFallback = DEFAULT_KVKK.tr;
  // updated boşsa "yakında güncellenecektir" yerine boş döndür — public sayfa
  // o zaman gizli/nötr gösterir (aşağıda kvkk.html boşsa satırı gizliyor).
  const updatedRaw = get(`kvkk_updated_${lang}`) || (lang !== 'tr' ? get('kvkk_updated_tr') : '');
  return {
    language: lang,
    title: get(`kvkk_title_${lang}`) || (lang !== 'tr' ? get('kvkk_title_tr') : '') || fallback.title || trFallback.title,
    body: get(`kvkk_body_${lang}`) || (lang !== 'tr' ? get('kvkk_body_tr') : '') || fallback.body || trFallback.body,
    updated: updatedRaw || '',
  };
}

const DEFAULT_CEREZ = {
  tr: {
    title: 'Çerez Politikası',
    updated: '',
    body: `<div class="legal-note"><span class="material-symbols-rounded">info</span><span>Bu Çerez Politikası, Form Elektrik İnş.Müh.A.Ş ("Şirket") tarafından işletilen internet sitesinde çerezlerin nasıl kullanıldığını, hangi tür çerezlerin toplandığını ve bu çerezleri nasıl yönetebileceğinizi açıklar.</span></div>
<h2>1. Çerez Nedir?</h2><p>Çerezler (cookies), ziyaret ettiğiniz internet siteleri tarafından tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Çerezler, sitenin düzgün çalışmasını sağlamak, deneyiminizi iyileştirmek ve site kullanımına ilişkin istatistik üretmek için kullanılır.</p>
<h2>2. Hangi Çerezleri Kullanıyoruz?</h2>
<table>
<thead><tr><th>Çerez Türü</th><th>Amaç</th><th>Saklama Süresi</th></tr></thead>
<tbody>
<tr><td><b>Zorunlu Çerezler</b></td><td>Sitenin temel işlevleri için gereklidir: oturum yönetimi, güvenlik (oturum/kimlik doğrulama token'ı), dil tercihinin hatırlanması. Bu çerezler olmadan site düzgün çalışmaz.</td><td>Oturum / 7 gün</td></tr>
<tr><td><b>İşlevsel Çerezler</b></td><td>Tercihlerinizi (dil seçimi, çerez onayınız) hatırlayarak siteyi kişiselleştirir.</td><td>1 yıl</td></tr>
<tr><td><b>Analitik / İstatistik Çerezleri</b></td><td>Site kullanımını anonim olarak ölçmek için kullanılır (Rybbit Analytics — gizlilik odaklı, IP anonimleştirilir, kişisel veri toplamaz). Hangi sayfaların ziyaret edildiğini ve site performansını anlamamıza yardımcı olur.</td><td>1 yıl</td></tr>
<tr><td><b>Pazarlama Çerezleri</b></td><td>Şu anda sitemizde reklam veya pazarlama amaçlı çerez kullanılmamaktadır.</td><td>—</td></tr>
</tbody>
</table>
<h2>3. Üçüncü Taraf Çerezleri</h2><p>Sitemizde analitik amacıyla Rybbit Analytics kullanılmaktadır. Bu hizmet gizlilik odaklıdır; ziyaretçileri tanımlayan kalıcı tanımlayıcılar veya çapraz site takibi yapmaz, IP adreslerini anonimleştirir.</p>
<h2>4. Çerezleri Nasıl Yönetebilirsiniz?</h2><p>Tarayıcınızın ayarlarından çerezleri silebilir, engelleyebilir veya çerez yerleştirilmeden önce uyarı verilmesini sağlayabilirsiniz. Ancak zorunlu çerezleri engellerseniz sitenin bazı bölümleri düzgün çalışmayabilir.</p>
<ul>
<li><b>Chrome:</b> Ayarlar → Gizlilik ve güvenlik → Çerezler ve diğer site verileri</li>
<li><b>Firefox:</b> Ayarlar → Gizlilik ve Güvenlik → Çerezler ve Site Verileri</li>
<li><b>Safari:</b> Tercihler → Gizlilik → Çerezleri yönet</li>
<li><b>Edge:</b> Ayarlar → Çerezler ve site izinleri</li>
</ul>
<h2>5. Kişisel Verilerin Korunması</h2><p>Çerezler aracılığıyla işlenen kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlenmektedir. Ayrıntılı bilgi için <a href="/kvkk">KVKK Aydınlatma Metni</a>'ni inceleyebilirsiniz.</p>
<h2>6. İletişim</h2><p>Çerez politikamıza ilişkin sorularınız için <a href="/#iletisim">iletişim kanallarımız</a> üzerinden bize ulaşabilirsiniz.</p>`,
  },
  en: {
    title: 'Cookie Policy',
    updated: '',
    body: `<div class="legal-note"><span class="material-symbols-rounded">info</span><span>This Cookie Policy explains how Form Elektrik İnş.Müh.A.Ş ("Company") uses cookies on its website, which types of cookies are collected, and how you can manage them.</span></div>
<h2>1. What Are Cookies?</h2><p>Cookies are small text files stored on your device by the websites you visit. They help the site function properly, improve your experience and produce usage statistics.</p>
<h2>2. Which Cookies Do We Use?</h2>
<table>
<thead><tr><th>Cookie Type</th><th>Purpose</th><th>Retention</th></tr></thead>
<tbody>
<tr><td><b>Strictly Necessary</b></td><td>Required for core functionality: session management, security (auth token), remembering language preference. The site cannot work properly without them.</td><td>Session / 7 days</td></tr>
<tr><td><b>Functional</b></td><td>Personalize the site by remembering your preferences (language, cookie consent).</td><td>1 year</td></tr>
<tr><td><b>Analytics</b></td><td>Used to measure site usage anonymously (Rybbit Analytics — privacy-first, IP anonymized, no personal data).</td><td>1 year</td></tr>
<tr><td><b>Marketing</b></td><td>We currently do not use any advertising or marketing cookies.</td><td>—</td></tr>
</tbody>
</table>
<h2>3. Third-Party Cookies</h2><p>We use Rybbit Analytics for analytics. This service is privacy-first; it does not use persistent identifiers or cross-site tracking and anonymizes IP addresses.</p>
<h2>4. How to Manage Cookies</h2><p>You can delete or block cookies through your browser settings. However, blocking strictly necessary cookies may break parts of the site.</p>
<h2>5. Data Protection</h2><p>Personal data processed through cookies is handled under applicable data protection law. See our <a href="/kvkk">Privacy Notice</a> for details.</p>
<h2>6. Contact</h2><p>For questions about this Cookie Policy, please reach us through our <a href="/#iletisim">contact channels</a>.</p>`,
  },
};

function cerezPayload(language) {
  const lang = language === 'en' ? 'en' : 'tr';
  const fallback = DEFAULT_CEREZ[lang] || DEFAULT_CEREZ.tr;
  const trFallback = DEFAULT_CEREZ.tr;
  const updatedRaw = get(`cerez_updated_${lang}`) || (lang !== 'tr' ? get('cerez_updated_tr') : '');
  return {
    language: lang,
    title: get(`cerez_title_${lang}`) || (lang !== 'tr' ? get('cerez_title_tr') : '') || fallback.title || trFallback.title,
    body: get(`cerez_body_${lang}`) || (lang !== 'tr' ? get('cerez_body_tr') : '') || fallback.body || trFallback.body,
    updated: updatedRaw || '',
  };
}

// PUBLIC — site analitik takip config'i (script src + ilgili site id).
// ?site=main|li3|epsis ile hangi sitenin ID'si döneceği seçilir (varsayılan: main).
// Hassas bilgi yok; site bu bilgiyle Rybbit script'ini yükler.
router.get('/public/analytics', (req, res) => {
  const site = req.query.site || 'main';
  const idKey = site === 'li3' ? 'rybbit_site_id_li3'
    : site === 'epsis' ? 'rybbit_site_id_epsis'
    : 'rybbit_site_id';
  res.json({
    script_src: get('rybbit_script_src') || '',
    site_id: get(idKey) || '',
  });
});

// PUBLIC — KVKK / Privacy Notice metni. Admin panelden yönetilir.
router.get('/public/kvkk', (req, res) => {
  res.json({ kvkk: kvkkPayload(req.query.language || 'tr') });
});

// PUBLIC — Çerez Politikası metni. Admin panelden yönetilir.
router.get('/public/cerez', (req, res) => {
  res.json({ cerez: cerezPayload(req.query.language || 'tr') });
});

// PUBLIC — iletişim bilgileri (telefon, e-posta, adres, harita, sosyal). Admin panelden yönetilir.
router.get('/public/contact', (req, res) => {
  res.json({
    phone: get('contact_phone') || '',
    email: get('contact_email') || '',
    address: get('contact_address') || '',
    maps_embed_url: get('maps_embed_url') || '',
    maps_lat: get('maps_lat') || '',
    maps_lng: get('maps_lng') || '',
    social_linkedin: get('social_linkedin') || '',
    social_instagram: get('social_instagram') || '',
    social_youtube: get('social_youtube') || '',
    social_facebook: get('social_facebook') || '',
  });
});

// Admin — sadece KVKK / Privacy Notice metinleri
router.get('/kvkk', authRequired, requireRole('admin'), requirePermission('kvkk'), (req, res) => {
  const all = getAll();
  res.json({ settings: {
    kvkk_title_tr: all.kvkk_title_tr || '',
    kvkk_body_tr: all.kvkk_body_tr || '',
    kvkk_updated_tr: all.kvkk_updated_tr || '',
    kvkk_title_en: all.kvkk_title_en || '',
    kvkk_body_en: all.kvkk_body_en || '',
    kvkk_updated_en: all.kvkk_updated_en || '',
  }});
});

router.put('/kvkk', authRequired, requireRole('admin'), requirePermission('kvkk'), (req, res) => {
  const allowed = ['kvkk_title_tr', 'kvkk_body_tr', 'kvkk_updated_tr', 'kvkk_title_en', 'kvkk_body_en', 'kvkk_updated_en'];
  const body = req.body || {};
  const now = new Date();
  // "Son güncelleme" boş bırakılırsa kayıt anının tarihini otomatik yaz —
  // böylece public sayfada "yakında güncellenecektir" fallback'i tetiklenmez.
  const autoDate = (lang) => now.toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR',
    { day: 'numeric', month: 'long', year: 'numeric' });
  allowed.forEach(k => {
    let v = body[k] || '';
    if (k === 'kvkk_updated_tr' && !v) v = autoDate('tr');
    if (k === 'kvkk_updated_en' && !v) v = autoDate('en');
    set(k, v);
  });
  res.json({ ok: true });
});

// Admin — Çerez Politikası metinleri
router.get('/cerez', authRequired, requireRole('admin'), requirePermission('cerez'), (req, res) => {
  const all = getAll();
  res.json({ settings: {
    cerez_title_tr: all.cerez_title_tr || '',
    cerez_body_tr: all.cerez_body_tr || '',
    cerez_updated_tr: all.cerez_updated_tr || '',
    cerez_title_en: all.cerez_title_en || '',
    cerez_body_en: all.cerez_body_en || '',
    cerez_updated_en: all.cerez_updated_en || '',
  }});
});

router.put('/cerez', authRequired, requireRole('admin'), requirePermission('cerez'), (req, res) => {
  const allowed = ['cerez_title_tr', 'cerez_body_tr', 'cerez_updated_tr', 'cerez_title_en', 'cerez_body_en', 'cerez_updated_en'];
  const body = req.body || {};
  const now = new Date();
  const autoDate = (lang) => now.toLocaleDateString(lang === 'en' ? 'en-GB' : 'tr-TR',
    { day: 'numeric', month: 'long', year: 'numeric' });
  allowed.forEach(k => {
    let v = body[k] || '';
    if (k === 'cerez_updated_tr' && !v) v = autoDate('tr');
    if (k === 'cerez_updated_en' && !v) v = autoDate('en');
    set(k, v);
  });
  res.json({ ok: true });
});

// GET — tüm ayarları getir (şifre/key maskelenmiş)
router.get('/', authRequired, requireRole('admin'), requirePermission('settings'), (req, res) => {
  const all = getAll();
  if (all.smtp_pass) all.smtp_pass = '••••••••';
  if (all.rybbit_api_key) all.rybbit_api_key = '••••••••';
  res.json({ settings: all });
});

// PUT — ayarları güncelle
router.put('/', authRequired, requireRole('admin'), requirePermission('settings'), (req, res) => {
  const allowed = ['smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass', 'smtp_from', 'appointment_notify_to',
    'appointment_notify_otomasyon', 'appointment_notify_ges',
    'appointment_notify_bess', 'appointment_notify_emobility',
    'lead_notify_email', 'career_notify_email',
    'contact_phone', 'contact_email', 'contact_address',
    'kvkk_title_tr', 'kvkk_body_tr', 'kvkk_updated_tr', 'kvkk_title_en', 'kvkk_body_en', 'kvkk_updated_en',
    'cerez_title_tr', 'cerez_body_tr', 'cerez_updated_tr', 'cerez_title_en', 'cerez_body_en', 'cerez_updated_en',
    'maps_embed_url', 'maps_lat', 'maps_lng', 'social_linkedin', 'social_instagram', 'social_youtube', 'social_facebook',
    'rybbit_script_src', 'rybbit_site_id',
    'rybbit_site_id_li3', 'rybbit_site_id_epsis',
    'rybbit_api_base', 'rybbit_api_key'];
  const body = req.body || {};
  Object.entries(body).forEach(([k, v]) => {
    if (!allowed.includes(k)) return;
    if (k === 'smtp_pass' && v === '••••••••') return;
    if (k === 'rybbit_api_key' && v === '••••••••') return;
    set(k, v || '');
  });
  try { require('../mailer').resetTransporter(); } catch {}
  res.json({ ok: true });
});

// POST /test — test maili gönder
router.post('/test-mail', authRequired, requireRole('admin'), requirePermission('settings'), async (req, res) => {
  const { to } = req.body || {};
  if (!to) return res.status(400).json({ error: 'missing_to' });
  const { sendMail } = require('../mailer');
  const result = await sendMail({
    to,
    subject: 'Form Elektrik SMTP Test',
    html: '<h2>SMTP Test</h2><p>Bu bir test mailidir. Mail ayarlarınız doğru çalışıyor!</p>',
    text: 'SMTP Test - Mail ayarlarınız doğru çalışıyor.',
  });
  if (result.sent) return res.json({ ok: true, id: result.id });
  if (result.skipped) return res.status(400).json({ error: 'smtp_not_configured' });
  return res.status(500).json({ error: result.error || 'send_failed' });
});

module.exports = router;
module.exports.getSetting = get;
module.exports.getAllSettings = getAll;
