-- ============================================
-- Form Elektrik — Database schema (SQLite)
-- ============================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

-- Users (admin roles — müşteri portalı yok)
CREATE TABLE IF NOT EXISTS users (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT NOT NULL UNIQUE,
  password     TEXT NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'customer')),
  company      TEXT,
  phone        TEXT,
  avatar_url   TEXT,
  permissions  TEXT,                  -- NULL = süper admin (tam yetki), JSON array = kısıtlı
  is_active    INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  failed_attempts INTEGER NOT NULL DEFAULT 0,  -- art arda hatalı giriş sayacı
  locked_until DATETIME,                       -- bu zamana kadar hesap kilitli (brute-force)
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token       TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME,
  ip          TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prt_user ON password_reset_tokens(user_id, expires_at);

-- İletişim / teklif talepleri (leads)
CREATE TABLE IF NOT EXISTS leads (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  company       TEXT,
  products      TEXT NOT NULL,         -- JSON array: ilgilenilen hizmet kodları
  message       TEXT,
  source        TEXT DEFAULT 'website',
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','won','lost')),
  notes         TEXT,
  user_agent    TEXT,
  ip            TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);

-- Blog posts
CREATE TABLE IF NOT EXISTS posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT,
  body          TEXT NOT NULL,         -- HTML (TinyMCE)
  cover_image   TEXT,
  show_cover    INTEGER NOT NULL DEFAULT 1,
  tags          TEXT,                  -- "ag-og, otomasyon, ges"
  language      TEXT NOT NULL DEFAULT 'tr',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  published_at  DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, language)
);

CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, published_at DESC);

-- ============================================
-- HİZMETLER (services) — AG-OG, otomasyon, GES, BESS, e-mobility
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL,
  code          TEXT,                  -- 'ag-og', 'otomasyon', 'ges', 'bess', 'emobility'
  title         TEXT NOT NULL,
  summary       TEXT,                  -- kısa açıklama (kart)
  body          TEXT NOT NULL DEFAULT '', -- HTML (TinyMCE) — detay sayfası
  icon          TEXT,                  -- Material Symbols ikon adı
  cover_image   TEXT,
  show_cover    INTEGER NOT NULL DEFAULT 1, -- kapağı detay sayfasında göster
  language      TEXT NOT NULL DEFAULT 'tr',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, language)
);

CREATE INDEX IF NOT EXISTS idx_services_status ON services(status, language, sort_order);

-- ============================================
-- REFERANS PROJELER (projects) — galeri destekli
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  client        TEXT,                  -- müşteri/kurum
  location      TEXT,                  -- şehir / saha
  year          TEXT,                  -- yıl
  category      TEXT,                  -- hizmet kategorisi (ag-og, ges, ...)
  capacity      TEXT,                  -- teknik değer (örn. 5 MWp, 1250 kVA)
  summary       TEXT,
  body          TEXT NOT NULL DEFAULT '', -- HTML (TinyMCE)
  cover_image   TEXT,                  -- ana görsel
  language      TEXT NOT NULL DEFAULT 'tr',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_featured   INTEGER NOT NULL DEFAULT 0, -- ana sayfa vitrininde göster
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  author_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, language)
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status, language, sort_order);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(is_featured, status);

-- Proje galeri görselleri
CREATE TABLE IF NOT EXISTS project_images (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id    INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url           TEXT NOT NULL,
  caption       TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_images_project ON project_images(project_id, sort_order);

-- ============================================
-- MARKALAR (brands) — çatı altındaki grup şirketleri / alt markalar
-- Li3 Batarya, Epsis EV Charge — ayrı sitelere yönlendirir.
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  slug          TEXT,
  description   TEXT,
  logo_url      TEXT,
  url           TEXT,                  -- dış site linki
  language      TEXT NOT NULL DEFAULT 'tr',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     INTEGER NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active, sort_order);

-- ============================================
-- RANDEVU SİSTEMİ
-- ============================================

-- Müsait slotlar (admin oluşturur)
CREATE TABLE IF NOT EXISTS available_slots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_date     DATE NOT NULL,
  slot_time     TEXT NOT NULL,            -- 'HH:MM'
  product       TEXT,                     -- hizmet kodu; NULL/'' = genel
  is_booked     INTEGER NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_slots_date ON available_slots(slot_date, slot_time);
CREATE INDEX IF NOT EXISTS idx_slots_available ON available_slots(slot_date, is_booked);
CREATE INDEX IF NOT EXISTS idx_slots_product ON available_slots(slot_date, product, is_booked);

-- Randevular
CREATE TABLE IF NOT EXISTS appointments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id           INTEGER NOT NULL REFERENCES available_slots(id) ON DELETE RESTRICT,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  company           TEXT,
  product           TEXT,
  notes             TEXT,
  meeting_link      TEXT,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  user_agent        TEXT,
  ip                TEXT,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created ON appointments(created_at DESC);

-- Duyurular (announcements) — blog benzeri haber/duyuru modülü
CREATE TABLE IF NOT EXISTS announcements (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT NOT NULL,
  title         TEXT NOT NULL,
  excerpt       TEXT,
  body          TEXT NOT NULL DEFAULT '',
  cover_image   TEXT,
  language      TEXT NOT NULL DEFAULT 'tr',
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
  is_popup      INTEGER NOT NULL DEFAULT 0,
  author_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  published_at  DATETIME,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slug, language)
);

CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_slug ON announcements(slug);

-- Ayarlar (SMTP, Rybbit analytics, bildirim adresleri)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- Audit log (admin işlemleri)
CREATE TABLE IF NOT EXISTS audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  entity        TEXT,
  entity_id     INTEGER,
  details       TEXT,
  ip            TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
