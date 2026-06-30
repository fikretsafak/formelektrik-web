require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./index');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('▶ Veritabanı tabloları oluşturuluyor...');
db.exec(schema);
console.log('✓ Şema uygulandı.');

// === Seed: Hizmetler ===
const services = [
  { code: 'ag-og',     icon: 'bolt',          title: 'AG-OG Projelendirme',
    summary: 'Alçak ve orta gerilim elektrik tesisleri için anahtar teslim projelendirme, taahhüt ve devreye alma.' },
  { code: 'otomasyon', icon: 'settings_input_component', title: 'Şebeke Koruma ve Otomasyon',
    summary: 'Koruma röleleri, SCADA, trafo merkezi otomasyonu ve şebeke izleme çözümleri.' },
  { code: 'ges',       icon: 'solar_power',   title: 'Yenilenebilir Enerji (GES)',
    summary: 'Çatı ve arazi tipi güneş enerji santralleri — fizibilite, kurulum ve devreye alma.' },
  { code: 'bess',      icon: 'battery_charging_full', title: 'Enerji Depolama (BESS)',
    summary: 'Batarya enerji depolama sistemleri ile şebeke esnekliği ve enerji yönetimi.' },
  { code: 'emobility', icon: 'ev_station',    title: 'E-Mobility / EV Şarj',
    summary: 'Elektrikli araç şarj altyapısı kurulumu, yük yönetimi ve işletme çözümleri.' },
];

const insertService = db.prepare(`
  INSERT INTO services (slug, code, title, summary, body, icon, language, sort_order, status)
  VALUES (@slug, @code, @title, @summary, '', @icon, 'tr', @sort_order, 'published')
  ON CONFLICT(slug, language) DO UPDATE SET
    code=excluded.code, title=excluded.title, summary=excluded.summary, icon=excluded.icon, sort_order=excluded.sort_order
`);
const svcTxn = db.transaction(items => items.forEach((s, i) =>
  insertService.run({ slug: s.code, code: s.code, title: s.title, summary: s.summary, icon: s.icon, sort_order: i })));
svcTxn(services);
console.log(`✓ ${services.length} hizmet seed edildi.`);

// === Seed: Markalar (çatı altındaki alt markalar) ===
const brands = [
  { name: 'Li3 Batarya',    slug: 'li3',   description: 'Lityum batarya ve enerji depolama çözümleri.', url: 'https://li3.com.tr', logo_url: '' },
  { name: 'Epsis EV Charge', slug: 'epsis', description: 'Elektrikli araç şarj istasyonları ve yönetim platformu.', url: 'https://epsis.com.tr', logo_url: '' },
];
// brands.slug unique değil; mevcut kontrol et
const brandExists = db.prepare('SELECT 1 FROM brands WHERE slug = ? AND language = ?');
const brandTxn = db.transaction(items => items.forEach((b, i) => {
  if (!brandExists.get(b.slug, 'tr')) {
    db.prepare(`INSERT INTO brands (name, slug, description, logo_url, url, language, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, 'tr', ?, 1)`).run(b.name, b.slug, b.description, b.logo_url, b.url, i);
  }
}));
brandTxn(brands);
console.log(`✓ ${brands.length} marka seed edildi.`);

// === Default admin ===
const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@formelektrik.com';
const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin!2026';
const adminName = process.env.DEFAULT_ADMIN_NAME || 'Form Elektrik Admin';

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
if (!existing) {
  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare(`
    INSERT INTO users (email, password, name, role, must_change_password)
    VALUES (?, ?, ?, 'admin', 1)
  `).run(adminEmail, hash, adminName);
  console.log(`✓ Varsayılan admin oluşturuldu: ${adminEmail}`);
  console.log(`  Şifre: ${adminPassword}`);
  console.log('  ⚠ İlk girişten sonra mutlaka şifreyi değiştirin!');
} else {
  console.log(`ℹ Admin zaten mevcut: ${adminEmail}`);
}

console.log('\n✓ Kurulum tamam.');
