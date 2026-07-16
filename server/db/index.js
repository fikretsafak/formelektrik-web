const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, 'formelektrik.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// === Idempotent migration'lar ===
function columnExists(table, column) {
  try {
    const rows = db.prepare(`PRAGMA table_info(${table})`).all();
    return rows.some(r => r.name === column);
  } catch { return false; }
}
function tableExists(table) {
  const row = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`).get(table);
  return !!row;
}
function tableSql(table) {
  const row = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name = ?`).get(table);
  return row ? String(row.sql || '') : '';
}

// users — sonradan eklenen kolonlar
if (tableExists('users') && !columnExists('users', 'avatar_url')) {
  db.exec('ALTER TABLE users ADD COLUMN avatar_url TEXT');
}
if (tableExists('users') && !columnExists('users', 'permissions')) {
  db.exec('ALTER TABLE users ADD COLUMN permissions TEXT');
}
if (tableExists('users') && !columnExists('users', 'must_change_password')) {
  db.exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
}

// posts
if (tableExists('posts') && !columnExists('posts', 'show_cover')) {
  db.exec('ALTER TABLE posts ADD COLUMN show_cover INTEGER NOT NULL DEFAULT 1');
}
if (tableExists('posts') && !columnExists('posts', 'service_id')) {
  db.exec('ALTER TABLE posts ADD COLUMN service_id INTEGER REFERENCES services(id) ON DELETE SET NULL');
}
// services — "Kapağı yazıda göster" alanı (posts ile aynı mantık)
if (tableExists('services') && !columnExists('services', 'show_cover')) {
  db.exec('ALTER TABLE services ADD COLUMN show_cover INTEGER NOT NULL DEFAULT 1');
}
// users — brute-force koruması: hesap-bazlı kilitleme
if (tableExists('users') && !columnExists('users', 'failed_attempts')) {
  db.exec('ALTER TABLE users ADD COLUMN failed_attempts INTEGER NOT NULL DEFAULT 0');
}
if (tableExists('users') && !columnExists('users', 'locked_until')) {
  db.exec('ALTER TABLE users ADD COLUMN locked_until DATETIME');
}
if (tableExists('posts') && tableExists('users')) {
  const firstAdmin = db.prepare(`SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1`).get();
  if (firstAdmin) {
    db.prepare(`UPDATE posts SET author_id = ? WHERE author_id IS NULL`).run(firstAdmin.id);
  }
}
if (tableExists('posts') && /slug\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i.test(tableSql('posts'))) {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    ALTER TABLE posts RENAME TO posts_old_unique_slug;
    CREATE TABLE posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      body TEXT NOT NULL,
      cover_image TEXT,
      show_cover INTEGER NOT NULL DEFAULT 1,
      tags TEXT,
      language TEXT NOT NULL DEFAULT 'tr',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      published_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(slug, language)
    );
    INSERT INTO posts (id, slug, title, excerpt, body, cover_image, show_cover, tags, language, status, author_id, published_at, created_at, updated_at)
      SELECT id, slug, title, excerpt, body, cover_image, COALESCE(show_cover, 1), tags, COALESCE(language, 'tr'), status, author_id, published_at, created_at, updated_at
      FROM posts_old_unique_slug;
    DROP TABLE posts_old_unique_slug;
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, published_at DESC);
    PRAGMA foreign_keys = ON;
  `);
}

// === Hizmetler ===
if (!tableExists('services')) {
  db.exec(`CREATE TABLE IF NOT EXISTS services (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL,
    code        TEXT,
    title       TEXT NOT NULL,
    summary     TEXT,
    body        TEXT NOT NULL DEFAULT '',
    icon        TEXT,
    cover_image TEXT,
    language    TEXT NOT NULL DEFAULT 'tr',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slug, language)
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_services_status ON services(status, language, sort_order)');
}

// === Referans projeler + galeri ===
if (!tableExists('projects')) {
  db.exec(`CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    slug        TEXT NOT NULL,
    title       TEXT NOT NULL,
    client      TEXT,
    location    TEXT,
    year        TEXT,
    category    TEXT,
    capacity    TEXT,
    summary     TEXT,
    body        TEXT NOT NULL DEFAULT '',
    cover_image TEXT,
    language    TEXT NOT NULL DEFAULT 'tr',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slug, language)
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status, language, sort_order)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured, status)');
}
// Esnek proje özellikleri — dinamik etiket/değer listesi (JSON). Sabit kolonlar geriye uyum için durur.
if (tableExists('projects') && !columnExists('projects', 'specs')) {
  db.exec('ALTER TABLE projects ADD COLUMN specs TEXT');
  // Tek seferlik backfill: eski sabit alanları (client/location/year/capacity) specs dizisine çevir
  const rows = db.prepare("SELECT id, client, location, year, capacity FROM projects WHERE specs IS NULL").all();
  const upd = db.prepare('UPDATE projects SET specs = ? WHERE id = ?');
  for (const r of rows) {
    const items = [];
    if (r.client)   items.push({ label: 'Müşteri',  value: String(r.client) });
    if (r.location) items.push({ label: 'Konum',    value: String(r.location) });
    if (r.year)     items.push({ label: 'Yıl',      value: String(r.year) });
    if (r.capacity) items.push({ label: 'Kapasite', value: String(r.capacity) });
    if (items.length) upd.run(JSON.stringify(items), r.id);
  }
}
if (!tableExists('project_images')) {
  db.exec(`CREATE TABLE IF NOT EXISTS project_images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    caption     TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images(project_id, sort_order)');
}

// === Markalar (alt markalar / grup şirketleri) ===
if (!tableExists('brands')) {
  db.exec(`CREATE TABLE IF NOT EXISTS brands (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    slug        TEXT,
    description TEXT,
    logo_url    TEXT,
    url         TEXT,
    language    TEXT NOT NULL DEFAULT 'tr',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_active   INTEGER NOT NULL DEFAULT 1,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active, sort_order)');
}
// Markalara çözüm ortağı detay alanları: TinyMCE içeriği, kapak, tip (çatı/ortak)
if (tableExists('brands') && !columnExists('brands', 'body')) {
  db.exec("ALTER TABLE brands ADD COLUMN body TEXT NOT NULL DEFAULT ''");
}
if (tableExists('brands') && !columnExists('brands', 'cover_image')) {
  db.exec('ALTER TABLE brands ADD COLUMN cover_image TEXT');
}
// type: 'umbrella' = çatı markalar (Li3/Epsis, ana sayfa), 'partner' = hizmet çözüm ortağı
if (tableExists('brands') && !columnExists('brands', 'type')) {
  db.exec("ALTER TABLE brands ADD COLUMN type TEXT NOT NULL DEFAULT 'umbrella'");
}

// country: markanın menşe ülkesi (kurumsal sayfada gösterilir)
if (tableExists('brands') && !columnExists('brands', 'country')) {
  db.exec("ALTER TABLE brands ADD COLUMN country TEXT");
}

// show_on_homepage: partner markalar da anasayfada gösterilebilsin
if (tableExists('brands') && !columnExists('brands', 'show_on_homepage')) {
  db.exec("ALTER TABLE brands ADD COLUMN show_on_homepage INTEGER NOT NULL DEFAULT 0");
  // Mevcut umbrella markalar varsayılan olarak anasayfada gösterilsin
  db.exec("UPDATE brands SET show_on_homepage = 1 WHERE type IS NULL OR type = 'umbrella'");
}

// Marka ↔ hizmet ilişkisi (bir marka birden çok hizmette çözüm ortağı olabilir)
if (!tableExists('brand_services')) {
  db.exec(`CREATE TABLE IF NOT EXISTS brand_services (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    brand_id     INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    service_code TEXT NOT NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    UNIQUE(brand_id, service_code)
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_brand_services ON brand_services(service_code, sort_order)');
}

// === Randevu sistemi ===
if (!tableExists('available_slots')) {
  db.exec(`CREATE TABLE IF NOT EXISTS available_slots (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_date  DATE NOT NULL,
    slot_time  TEXT NOT NULL,
    product    TEXT,
    is_booked  INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_slots_date ON available_slots(slot_date, slot_time)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_slots_available ON available_slots(slot_date, is_booked)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_slots_product ON available_slots(slot_date, product, is_booked)');
}
if (tableExists('available_slots') && !columnExists('available_slots', 'product')) {
  db.exec('ALTER TABLE available_slots ADD COLUMN product TEXT');
  db.exec('CREATE INDEX IF NOT EXISTS idx_slots_product ON available_slots(slot_date, product, is_booked)');
}

if (!tableExists('appointments')) {
  db.exec(`CREATE TABLE IF NOT EXISTS appointments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    slot_id    INTEGER NOT NULL REFERENCES available_slots(id) ON DELETE RESTRICT,
    first_name TEXT NOT NULL,
    last_name  TEXT NOT NULL,
    email      TEXT NOT NULL,
    phone      TEXT,
    company    TEXT,
    product    TEXT,
    notes      TEXT,
    meeting_link TEXT,
    status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
    user_agent TEXT,
    ip         TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(slot_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments(created_at DESC)');
}
if (tableExists('appointments') && !columnExists('appointments', 'meeting_link')) {
  db.exec('ALTER TABLE appointments ADD COLUMN meeting_link TEXT');
}
// Çoklu görüşme konusu — seçilen konu başlıkları (virgülle)
if (tableExists('appointments') && !columnExists('appointments', 'topics')) {
  db.exec('ALTER TABLE appointments ADD COLUMN topics TEXT');
}

// === Randevu konuları (admin'den yönetilir, çoklu seçilebilir) ===
if (!tableExists('appointment_topics')) {
  db.exec(`CREATE TABLE IF NOT EXISTS appointment_topics (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_appt_topics_active ON appointment_topics(is_active, sort_order)');
}
// Her konuya özel bildirim e-postası (randevu bu konuyla gelince mail buraya gider)
if (tableExists('appointment_topics') && !columnExists('appointment_topics', 'notify_email')) {
  db.exec('ALTER TABLE appointment_topics ADD COLUMN notify_email TEXT');
}
// İlk kurulumda boşsa varsayılan konuları seed et
if (tableExists('appointment_topics')) {
  const cnt = db.prepare('SELECT COUNT(*) AS c FROM appointment_topics').get().c;
  if (cnt === 0) {
    const ins = db.prepare('INSERT INTO appointment_topics (title, sort_order) VALUES (?, ?)');
    ['Şebeke Koruma ve Otomasyon', 'Yenilenebilir Enerji (GES)', 'Enerji Depolama (BESS)', 'E-Mobility / EV Şarj']
      .forEach((title, i) => ins.run(title, i));
  }
}

// === Kariyer: iş ilanları + başvurular ===
if (!tableExists('job_postings')) {
  db.exec(`CREATE TABLE IF NOT EXISTS job_postings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    department  TEXT,
    location    TEXT,
    type        TEXT,                  -- 'full-time' / 'part-time' / 'intern' / serbest
    summary     TEXT,
    body        TEXT NOT NULL DEFAULT '',
    cover_image TEXT,
    is_active   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_jobs_active ON job_postings(is_active, sort_order)');
}
if (!tableExists('job_applications')) {
  db.exec(`CREATE TABLE IF NOT EXISTS job_applications (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id      INTEGER REFERENCES job_postings(id) ON DELETE SET NULL,
    job_title   TEXT,                  -- başvuru anındaki ilan başlığı (snapshot)
    first_name  TEXT NOT NULL,
    last_name   TEXT NOT NULL,
    email       TEXT NOT NULL,
    phone       TEXT,
    cv_url      TEXT,
    message     TEXT,
    status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','shortlisted','rejected','hired')),
    user_agent  TEXT,
    ip          TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_applications_status ON job_applications(status, created_at DESC)');
}

// === Duyurular (announcements) — blog benzeri haber/duyuru modülü ===
if (!tableExists('announcements')) {
  db.exec(`CREATE TABLE IF NOT EXISTS announcements (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    slug         TEXT NOT NULL,
    title        TEXT NOT NULL,
    excerpt      TEXT,
    body         TEXT NOT NULL DEFAULT '',
    cover_image  TEXT,
    language     TEXT NOT NULL DEFAULT 'tr',
    status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    is_popup     INTEGER NOT NULL DEFAULT 0,
    author_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    published_at DATETIME,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(slug, language)
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status, published_at DESC)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_announcements_slug ON announcements(slug)');
}
// Sayfa açılınca popup olarak gösterilecek mi
if (tableExists('announcements') && !columnExists('announcements', 'is_popup')) {
  db.exec('ALTER TABLE announcements ADD COLUMN is_popup INTEGER NOT NULL DEFAULT 0');
}
if (tableExists('announcements') && /slug\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i.test(tableSql('announcements'))) {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    ALTER TABLE announcements RENAME TO announcements_old_unique_slug;
    CREATE TABLE announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      excerpt TEXT,
      body TEXT NOT NULL DEFAULT '',
      cover_image TEXT,
      language TEXT NOT NULL DEFAULT 'tr',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      is_popup INTEGER NOT NULL DEFAULT 0,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      published_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(slug, language)
    );
    INSERT INTO announcements (id, slug, title, excerpt, body, cover_image, language, status, is_popup, author_id, published_at, created_at, updated_at)
      SELECT id, slug, title, excerpt, body, cover_image, COALESCE(language, 'tr'), status, COALESCE(is_popup, 0), author_id, published_at, created_at, updated_at
      FROM announcements_old_unique_slug;
    DROP TABLE announcements_old_unique_slug;
    CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_announcements_slug ON announcements(slug);
    PRAGMA foreign_keys = ON;
  `);
}

// === Proje ↔ Marka ilişkisi ===
if (!tableExists('project_brands')) {
  db.exec(`CREATE TABLE IF NOT EXISTS project_brands (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    brand_id   INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    UNIQUE(project_id, brand_id)
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_project_brands_project ON project_brands(project_id)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_project_brands_brand ON project_brands(brand_id)');
}

// === Ayarlar ===
if (!tableExists('settings')) {
  db.exec(`CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  )`);
}

// === Garanti sorgu logları ===
// Gizli /garanti sayfasından yapılan Navision garanti sorguları burada tutulur.
// Kişisel veri saklamaz; yalnızca seri no + sonuç durumu + IP + zaman (kötüye kullanım takibi).
if (!tableExists('warranty_queries')) {
  db.exec(`CREATE TABLE IF NOT EXISTS warranty_queries (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_no  TEXT,
    result     TEXT,                        -- 'found' | 'not_found' | 'error' | 'not_configured' | 'captcha_failed'
    ip         TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
}

// === Garanti önbelleği (ERP'den günlük sync) ===
// Public sorgu ERP'ye değil buraya gider; ham veri sync ile doldurulur, sorguda maskelenir.
if (!tableExists('warranty_cache')) {
  db.exec(`CREATE TABLE IF NOT EXISTS warranty_cache (
    serial_no       TEXT PRIMARY KEY,
    invoice_date    TEXT,
    invoice_no      TEXT,
    warranty_start  TEXT,
    warranty_end    TEXT,
    customer_name   TEXT,   -- ham (sorguda maskelenir)
    tax_no          TEXT,   -- ham (sorguda maskelenir)
    synced_at       TEXT DEFAULT (datetime('now'))
  )`);
}

// === Kilometre Taşları (Timeline) ===
if (!tableExists('milestones')) {
  db.exec(`CREATE TABLE IF NOT EXISTS milestones (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    year       TEXT NOT NULL,
    title      TEXT NOT NULL,
    description TEXT,
    icon       TEXT NOT NULL DEFAULT 'flag',
    language   TEXT NOT NULL DEFAULT 'tr',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec('CREATE INDEX IF NOT EXISTS idx_milestones_active ON milestones(is_active, sort_order)');
  // Mevcut hardcoded verileri seed et
  const ms = db.prepare('INSERT INTO milestones (year, title, description, icon, sort_order) VALUES (?, ?, ?, ?, ?)');
  [
    ['2000', 'Şirket Kuruluşu', 'Form Elektrik kuruldu.', 'flag', 0],
    ['2008', 'Thytronic & Jean Müller', 'Thytronic ve Jean Müller temsilciliği başladı.', 'handshake', 1],
    ['2010', 'Thyeast (MENA)', 'Thyeast ortak girişimi kuruldu (MENA bölgesi).', 'public', 2],
    ['2012', 'NOJA Power & Horstmann', 'NOJA Power ve Horstmann temsilciliği alındı.', 'bolt', 3],
    ['2015', 'Jean Müller Türkiye JV', 'Jean Müller Türkiye ortak girişimi (JV) kuruldu.', 'precision_manufacturing', 4],
    ['2021', 'Li3 Depolama', 'Li3 enerji depolama departmanı kuruldu.', 'battery_charging_full', 5],
    ['2022', 'EPSIS Lisansı', 'EPSIS EPDK şarj ağı işletmeci lisansı alındı.', 'verified', 6],
    ['2023', 'İlk Entegre DC Şarj', 'Türkiye\'nin ilk entegre depolamalı DC şarj istasyonu.', 'ev_station', 7],
    ['2025', 'Smilics', 'Smilics Türkiye temsilciliği başladı.', 'monitoring', 8],
  ].forEach(r => ms.run(...r));
}

// === Referans Logoları (Bize Güvenen Kurumlar) ===
if (!tableExists('reference_logos')) {
  db.exec(`CREATE TABLE IF NOT EXISTS reference_logos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    logo_url   TEXT,
    url        TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  // Mevcut statik logoları seed et
  const seed = db.prepare('INSERT INTO reference_logos (name, logo_url, sort_order) VALUES (?, ?, ?)');
  ['socar','world-bank','bedas','ayedas','baskent-edas','dicle-elektrik','uedas','yedas',
   'gdz-elektrik','aras-elektrik','ck-enerji','erciyes-anadolu','astor','sanko','dogus',
   'antalya-buyuksehir','ego','gaski','ilbank','karacabey-belediyesi','nero-industries','siskom-enerji','gamador',
   'bogazici-elektrik'].forEach((n, i) => seed.run(n, `/assets/references/${n}.png`, i));
}

// === Teknik Kütüphane: Belgeler ===
if (!tableExists('library_documents')) {
  db.exec(`CREATE TABLE library_documents (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    slug          TEXT NOT NULL,
    description   TEXT,
    brand_id      INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL DEFAULT 'datasheet'
                  CHECK (document_type IN ('datasheet','manual','certificate','catalog','software')),
    file_url      TEXT NOT NULL,
    file_size     INTEGER,
    is_public     INTEGER NOT NULL DEFAULT 0,
    language      TEXT NOT NULL DEFAULT 'tr',
    status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE INDEX idx_libdocs_status ON library_documents(status)`);
  db.exec(`CREATE INDEX idx_libdocs_brand ON library_documents(brand_id)`);
  db.exec(`CREATE INDEX idx_libdocs_slug ON library_documents(slug)`);
}
// Ürün adı (opsiyonel): belge hangi ürüne ait
if (tableExists('library_documents') && !columnExists('library_documents', 'product_name')) {
  db.exec(`ALTER TABLE library_documents ADD COLUMN product_name TEXT`);
}
if (tableExists('library_documents') && !columnExists('library_documents', 'download_count')) {
  db.exec(`ALTER TABLE library_documents ADD COLUMN download_count INTEGER NOT NULL DEFAULT 0`);
}

// === Teknik Kütüphane: Kayıt Başvuruları ===
if (!tableExists('library_registrations')) {
  db.exec(`CREATE TABLE library_registrations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    surname    TEXT NOT NULL,
    email      TEXT NOT NULL,
    company    TEXT,
    phone      TEXT,
    message    TEXT,
    status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  db.exec(`CREATE INDEX idx_libreg_status ON library_registrations(status, created_at DESC)`);
  db.exec(`CREATE INDEX idx_libreg_email ON library_registrations(email)`);
}

// === Teknik Kütüphane: Kullanıcı ↔ Belge Erişimi ===
if (!tableExists('library_user_documents')) {
  db.exec(`CREATE TABLE library_user_documents (
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, document_id)
  )`);
}

// === Teknik Kütüphane: Kullanıcı ↔ Marka Erişimi ===
if (!tableExists('library_user_brands')) {
  db.exec(`CREATE TABLE library_user_brands (
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, brand_id)
  )`);
}

// === Blog ↔ Kütüphane Belge İlişkisi ===
if (!tableExists('post_library_documents')) {
  db.exec(`CREATE TABLE post_library_documents (
    post_id     INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    document_id INTEGER NOT NULL REFERENCES library_documents(id) ON DELETE CASCADE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (post_id, document_id)
  )`);
}

module.exports = db;
