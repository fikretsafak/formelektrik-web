# Form Elektrik — Kurumsal Web Sitesi & Yönetim Paneli

Form Elektrik İnş.Müh.A.Ş için kurumsal tanıtım sitesi, blog ve admin yönetim paneli.
**Çatı (umbrella) marka** mimarisi: alt markalar (Li3 Batarya, Epsis EV Charge) ayrı sitelerde; bu siteden yönlendirilir.

## İçerik

- **Ana site** (`/`): Hero, hizmetler, referans projeler, markalar, blog önizleme, randevu CTA, teklif/iletişim formu, footer. Koyu kurumsal tema, mobil öncelikli.
- **Alt sayfalar**: `/hizmet?slug=` (hizmet detay), `/projeler` + `/proje?slug=` (referanslar + galeri/lightbox), `/blog` + `/post?slug=` (blog), `/kvkk`.
- **Admin panel** (`/admin/`): Teklif talepleri, blog, hizmetler, referans projeler (galeri), markalar, randevular, kullanıcılar, ayarlar (SMTP / iletişim bilgileri / Rybbit analytics).
- **API** (Node.js + Express + SQLite): JWT auth, bölüm bazlı yetkilendirme.

## Modüller

| Modül | Açıklama |
|---|---|
| Blog | TinyMCE editör, taslak/yayın, kapak görseli, etiket, çoklu dil (TR/EN), import/export |
| Hizmetler | AG-OG, otomasyon, GES, BESS, e-mobility — ikon, özet, detay |
| Referans Projeler | Müşteri/konum/yıl/kapasite + görsel galeri + öne çıkarma |
| Markalar | Çatı altındaki alt markalar — logo + açıklama + dış link |
| Randevu | Slot tabanlı; admin slot üretir, ziyaretçi randevu alır, onayda ICS'li e-posta |
| Teklif/İletişim (Leads) | Form + admin yönetimi + e-posta bildirimi |
| SMTP | Admin panelinden yapılandırılabilir mail gönderimi |

## Yerel Geliştirme (Windows / macOS / Linux)

Node.js 20+ gerekir.

```bash
# 1) Bağımlılıklar
npm install

# 2) Ortam değişkenleri
cp .env.example .env
# .env içinde JWT_SECRET'i güçlü bir değerle değiştirin:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 3) Veritabanını oluştur (şema + 5 hizmet + 2 marka + default admin)
npm run init-db

# 4) Sunucuyu başlat
npm run dev     # otomatik yeniden yükleme (kod değişince restart)
# veya
npm start
```

Adresler:
- http://localhost:3000 — ana site
- http://localhost:3000/admin — admin paneli
- http://localhost:3000/login.html — giriş

İlk admin girişi `.env` dosyasındaki `DEFAULT_ADMIN_EMAIL` / `DEFAULT_ADMIN_PASSWORD` (varsayılan: `admin@formelektrik.com` / `Admin!2026`).
**İlk girişten sonra şifreyi değiştirin** (panel zorunlu kılar).

## Yapılandırma

Çoğu ayar admin panelinden (**Ayarlar**) yönetilir, DB önceliklidir:

- **SMTP**: host/port/user/pass/from + test maili. Boşsa mail gönderimi atlanır, kayıtlar yine tutulur.
- **İletişim bilgileri**: telefon / e-posta / adres (ana sitede otomatik gösterilir).
- **Rybbit analytics**: `rybbit_script_src` + `rybbit_site_id` (+ alt markalar için `rybbit_site_id_li3`, `rybbit_site_id_epsis`).
  - Frontend script enjeksiyonu şu an devre dışı; Rybbit dosyaları hazır olunca `script.js` içine kanca eklenir. Public uç: `GET /api/settings/public/analytics?site=main|li3|epsis`.

## Mimari

```
Form_Elektrik_Web_Site/
├── index.html, styles.css, script.js   # Ana site
├── hizmet.html, projeler.html, proje.html, kvkk.html
├── blog.html, blog.js, blog.css, post.html
├── login.html, forgot-password.html, reset-password.html
├── assets/
│   ├── main/                # logo-light/dark, favicon
│   └── references/          # referans kurum logoları
├── public/
│   ├── admin/               # Admin SPA (index.html, admin.js, admin.css)
│   └── vendor/tinymce/      # Self-hosted WYSIWYG editör
├── server/
│   ├── index.js             # Express ana
│   ├── db/                  # schema.sql, index.js (migration), init.js (seed)
│   ├── routes/              # auth, leads, posts, services, projects, brands, appointments, settings, uploads, users
│   ├── middleware/          # auth (JWT + permission), validate
│   ├── mailer.js            # SMTP (nodemailer)
│   └── ics.js               # Takvim daveti (.ics)
├── uploads/                 # Yüklenen görseller (kapak, galeri, logo)
└── data/                    # SQLite (formelektrik.db) — git'e dahil değil
```

## Veritabanı

SQLite (`data/formelektrik.db`). Şema `server/db/schema.sql`'de, migration'lar `server/db/index.js`'de idempotenttir (kolon/tablo yoksa eklenir). Yedek: `data/` klasörünü kopyalamak yeterli.

## Notlar

- Diller: TR + EN. İçerik (blog/hizmet/proje) dile göre ayrı satır tutulur; istenen dilde yoksa TR'ye düşülür.
- Slugify Türkçe karakterleri çevirir (ç→c, ş→s, ğ→g, ü→u, ö→o, ı→i, İ→i).
- TinyMCE self-hosted; internet bağımsız çalışır.

---
© 2026 Form Elektrik İnş.Müh.A.Ş — Tüm hakları saklıdır.
