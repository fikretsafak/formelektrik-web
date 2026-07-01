const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { authRequired, requireRole, requirePermission } = require('../middleware/auth');
const { isEmail, isNonEmptyString } = require('../middleware/validate');
const { sendMail, wrapEmail, mailRow, mailTable } = require('../mailer');
const { buildIcs } = require('../ics');

const router = express.Router();

const APP_BASE_URL = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

const bookLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
}

const PRODUCT_NAMES = {
  'ag-og': 'AG-OG Projelendirme',
  otomasyon: 'Şebeke Koruma ve Otomasyon',
  ges: 'Yenilenebilir Enerji (GES)',
  bess: 'Enerji Depolama (BESS)',
  emobility: 'E-Mobility / EV Şarj',
  other: 'Genel',
};
function productLabel(code) {
  return PRODUCT_NAMES[(code || '').trim().toLowerCase()] || (code || '-');
}

// Bir slot 'genel' (product NULL/'') ise her konu için geçerli; aksi halde sadece kendi konusu için.
const PRODUCT_MATCH_SQL = `(product = ? OR product IS NULL OR product = '')`;

// ===== PUBLIC: müsait tarihler =====
// Herhangi bir ürün için müsait slot olan günler (takvimde işaretlenecek günler).
router.get('/dates', (req, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT slot_date FROM available_slots
    WHERE is_booked = 0 AND slot_date >= date('now')
    ORDER BY slot_date
    LIMIT 90
  `).all();
  res.json({ dates: rows.map(r => r.slot_date) });
});

// ===== PUBLIC: bir tarihte müsait slotu olan ÜRÜNLER =====
// Yeni akış: kullanıcı tarihi seçince, o tarihte randevu alınabilen ürünleri gösteririz.
// Genel (product NULL) slot varsa tüm ürünler seçilebilir.
router.get('/products', (req, res) => {
  const { date } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'invalid_date' });
  }
  const rows = db.prepare(`
    SELECT DISTINCT product FROM available_slots
    WHERE slot_date = ? AND is_booked = 0
  `).all(date);

  const hasGeneral = rows.some(r => !r.product);
  let products;
  if (hasGeneral) {
    // Genel slot varsa tüm aktif randevu konuları (başlık) seçilebilir
    products = db.prepare(
      `SELECT title FROM appointment_topics WHERE is_active = 1 ORDER BY sort_order, id`
    ).all().map(r => r.title);
  } else {
    // Sadece o gün slotu olan konu başlıkları
    products = rows.map(r => r.product).filter(Boolean);
  }
  res.json({ products });
});

// ===== PUBLIC: randevu görüşme konuları (admin'den yönetilir) =====
router.get('/topics', (req, res) => {
  const rows = db.prepare(`
    SELECT id, title FROM appointment_topics
    WHERE is_active = 1 ORDER BY sort_order, id
  `).all();
  res.json({ topics: rows });
});

// ===== PUBLIC: belirli gün + ürün için müsait saatler =====
router.get('/slots', (req, res) => {
  const { date, product } = req.query;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'invalid_date' });
  }
  // Ürün (konu başlığı) belirtilmişse: o konunun + genel slotları. Belirtilmemişse: hepsi.
  let rows;
  if (product) {
    rows = db.prepare(`
      SELECT id, slot_time FROM available_slots
      WHERE slot_date = ? AND is_booked = 0 AND ${PRODUCT_MATCH_SQL}
      ORDER BY slot_time
    `).all(date, product);
  } else {
    rows = db.prepare(`
      SELECT id, slot_time FROM available_slots
      WHERE slot_date = ? AND is_booked = 0
      ORDER BY slot_time
    `).all(date);
  }
  res.json({ slots: rows });
});

// ===== PUBLIC: randevu oluştur =====
router.post('/', bookLimiter, async (req, res) => {
  const { slotId, firstName, lastName, email, phone, company, product, notes, topics } = req.body || {};

  if (!slotId || !isNonEmptyString(firstName, 80) || !isNonEmptyString(lastName, 80) ||
      !isEmail(email) || !isNonEmptyString(company, 120)) {
    return res.status(400).json({ error: 'invalid_input' });
  }
  // Telefon zorunlu + en az 7 rakam (fake tek haneli girişleri ele)
  const phoneDigits = String(phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 20) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  // Çoklu görüşme konusu (başlık listesi) → virgüllü string
  const topicsStr = Array.isArray(topics)
    ? topics.map(s => String(s || '').trim()).filter(Boolean).slice(0, 20).join(', ')
    : '';

  const slot = db.prepare('SELECT * FROM available_slots WHERE id = ? AND is_booked = 0').get(slotId);
  if (!slot) return res.status(400).json({ error: 'slot_unavailable' });

  // Slot konuyla (başlık) uyumlu mu? Genel slot (product NULL) her konuya açık;
  // konulu slot yalnız kendi konusu için. (product 'other'/boş → genel kabul)
  // Başlıklar serbest metin olduğu için case-sensitive karşılaştırılır.
  const reqProduct = (product || '').trim();
  if (slot.product && reqProduct && reqProduct !== 'other' && slot.product !== reqProduct) {
    return res.status(400).json({ error: 'slot_unavailable' });
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
  const ua = req.headers['user-agent'] || '';

  const tx = db.transaction(() => {
    db.prepare('UPDATE available_slots SET is_booked = 1 WHERE id = ?').run(slotId);
    const info = db.prepare(`
      INSERT INTO appointments (slot_id, first_name, last_name, email, phone, company, product, notes, topics, user_agent, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      slotId,
      firstName.trim(), lastName.trim(), email.toLowerCase().trim(),
      (phone || '').trim() || null,
      (company || '').trim() || null,
      (product || '').trim() || null,
      (notes || '').trim() || null,
      topicsStr || null,
      ua, ip
    );
    return info.lastInsertRowid;
  });

  let appointmentId;
  try {
    appointmentId = tx();
  } catch (e) {
    return res.status(400).json({ error: 'slot_unavailable' });
  }

  const dateStr = fmtDate(slot.slot_date);
  const timeStr = slot.slot_time;

  // Admin bildirim maili — konu (randevu konusu) bazlı yönlendirme
  // Seçilen konuların kendi notify_email'lerine gider; tanımsızsa genel adrese düşer.
  let notifyTo;
  try {
    const settings = require('./settings');
    // Seçilen konu başlıklarına bağlı bildirim e-postalarını topla
    const selectedTitles = topicsStr
      ? topicsStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    if (selectedTitles.length) {
      const placeholders = selectedTitles.map(() => '?').join(',');
      const rows = db.prepare(
        `SELECT DISTINCT notify_email FROM appointment_topics
         WHERE notify_email IS NOT NULL AND notify_email != '' AND title IN (${placeholders})`
      ).all(...selectedTitles);
      const emails = rows.map(r => r.notify_email).filter(Boolean);
      if (emails.length) notifyTo = [...new Set(emails)].join(', ');
    }
    // Konuya özel adres yoksa genel bildirim adresine düş
    if (!notifyTo) notifyTo = settings.getSetting('appointment_notify_to');
  } catch {}
  if (!notifyTo) notifyTo = process.env.APPOINTMENT_NOTIFY_TO || process.env.LEAD_NOTIFY_TO;
  if (notifyTo) {
    const adminRows = mailTable(
      (topicsStr ? mailRow('Konular', escapeHtml(topicsStr)) : mailRow('Ürün', escapeHtml(productLabel(product)))) +
      mailRow('Tarih', escapeHtml(dateStr)) +
      mailRow('Saat', escapeHtml(timeStr)) +
      mailRow('Ad Soyad', `${escapeHtml(firstName)} ${escapeHtml(lastName)}`) +
      mailRow('E-posta', `<a href="mailto:${escapeHtml(email)}" style="color:#2aa9e0">${escapeHtml(email)}</a>`) +
      mailRow('Telefon', escapeHtml(phone || '-')) +
      mailRow('Şirket', escapeHtml(company || '-')) +
      mailRow('Not', escapeHtml(notes || '-').replace(/\n/g, '<br>'))
    );
    sendMail({
      to: notifyTo,
      subject: `Yeni randevu [${productLabel(product)}] — ${firstName} ${lastName} (${dateStr} ${timeStr})`,
      html: wrapEmail(adminRows, { title: 'Yeni Görüşme Randevusu', preheader: `${firstName} ${lastName} — ${dateStr} ${timeStr}` }),
      replyTo: email,
    }).catch(() => {});
  }

  // Kullanıcıya onay maili
  const userBody = `
    <p style="margin:0 0 16px;color:#4a5573;font-size:15px;line-height:1.7">Merhaba <b>${escapeHtml(firstName)}</b>, görüşme randevunuz başarıyla oluşturuldu.</p>
    <div style="background:#eaf7fd;padding:18px;border-radius:10px;margin:20px 0;border-left:4px solid #2aa9e0">
      <p style="margin:0;font-size:15px;font-weight:700;color:#0f1640">${escapeHtml(dateStr)}</p>
      <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#2aa9e0">${escapeHtml(timeStr)}</p>
      <p style="margin:8px 0 0;color:#4a5573;font-size:13px">30 dakikalık görüşme</p>
    </div>
    <p style="margin:0;color:#4a5573;font-size:14px;line-height:1.7">Randevunuz onaylandığında size ayrıca bilgi vereceğiz. Sorularınız için
      <a href="mailto:info@formelektrik.com" style="color:#2aa9e0">info@formelektrik.com</a> adresine yazabilirsiniz.</p>`;
  sendMail({
    to: email,
    subject: `Randevu Talebiniz Alındı — ${dateStr} ${timeStr}`,
    html: wrapEmail(userBody, { title: 'Randevu Talebiniz Alındı', preheader: `${dateStr} ${timeStr} — 30 dk görüşme` }),
  }).catch(() => {});

  res.status(201).json({ ok: true, id: appointmentId });
});

// ===== ADMIN: randevu listesi =====
router.get('/', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const { status, date, limit = 50, offset = 0 } = req.query;
  let sql = `SELECT a.*, s.slot_date, s.slot_time
             FROM appointments a JOIN available_slots s ON s.id = a.slot_id
             WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (date) { sql += ' AND s.slot_date = ?'; params.push(date); }
  sql += ' ORDER BY s.slot_date DESC, s.slot_time DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json({ appointments: db.prepare(sql).all(...params) });
});

// ===== ADMIN: randevu durumu güncelle =====
router.patch('/:id', authRequired, requireRole('admin'), requirePermission('appointments'), async (req, res) => {
  const { status, meeting_link, cc_email } = req.body || {};
  const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!valid.includes(status)) return res.status(400).json({ error: 'invalid_status' });

  const appt = db.prepare(`
    SELECT a.*, s.slot_date, s.slot_time FROM appointments a
    JOIN available_slots s ON s.id = a.slot_id WHERE a.id = ?
  `).get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'not_found' });

  // meeting_link kolonunu sakla
  if (status === 'confirmed' && meeting_link) {
    db.prepare('UPDATE appointments SET meeting_link = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(meeting_link, status, req.params.id);
  } else {
    db.prepare('UPDATE appointments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(status, req.params.id);
  }

  if (status === 'cancelled') {
    db.prepare('UPDATE available_slots SET is_booked = 0 WHERE id = ?').run(appt.slot_id);
  }

  if (status === 'confirmed' && appt.email) {
    const dateStr = fmtDate(appt.slot_date);
    // ICS için başlangıç/bitiş — local time (Europe/Istanbul UTC+3)
    const [hh, mm] = appt.slot_time.split(':').map(Number);
    const [y, mo, d] = appt.slot_date.split('-').map(Number);
    // Tarihi Europe/Istanbul olarak yorumla → UTC-3 saat
    const startUtc = new Date(Date.UTC(y, mo - 1, d, hh - 3, mm, 0));
    const endUtc = new Date(startUtc.getTime() + 30 * 60 * 1000);

    const organizerFrom = process.env.SMTP_FROM || 'no-reply@formelektrik.com';
    const organizerEmail = (organizerFrom.match(/<([^>]+)>/) || [, organizerFrom])[1];

    const meetingBlock = meeting_link
      ? `<div style="background:#eff6ff;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #6264a7">
          <p style="margin:0 0 8px;font-size:13px;color:#4a5573">📹 Microsoft Teams Toplantısı:</p>
          <a href="${escapeHtml(meeting_link)}" style="display:inline-block;padding:10px 20px;background:#6264a7;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Toplantıya Katıl</a>
          <p style="margin:8px 0 0;font-size:12px;color:#7a849c;word-break:break-all">${escapeHtml(meeting_link)}</p>
        </div>`
      : '';

    const icsContent = buildIcs({
      uid: `appointment-${appt.id}@formelektrik.com`,
      start: startUtc,
      end: endUtc,
      summary: 'Form Elektrik Görüşmesi',
      description: meeting_link ? `Teams toplantı linki: ${meeting_link}` : 'Form Elektrik ile 30 dk görüşme',
      url: meeting_link || undefined,
      organizerEmail,
      organizerName: 'Form Elektrik',
      attendeeEmails: [appt.email, ...(cc_email ? [cc_email] : [])],
    });

    sendMail({
      to: appt.email,
      cc: cc_email || undefined,
      subject: `Randevunuz Onaylandı — ${dateStr} ${appt.slot_time}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f5f7fb;border-radius:12px">
          <div style="background:#0a0e1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px">
            <img src="${LOGO_URL}" alt="Form Elektrik" style="height:36px;display:inline-block" />
          </div>
          <div style="background:#ffffff;padding:32px;border-radius:8px">
            <h2 style="color:#0a1024;font-size:20px;margin:0 0 16px">Merhaba ${escapeHtml(appt.first_name)},</h2>
            <p style="color:#4a5573;line-height:1.6">Görüşme randevunuz <b>onaylanmıştır</b>.</p>
            <div style="background:#ecfdf5;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #10b981">
              <p style="margin:0;font-size:16px;font-weight:700;color:#0a1024">${escapeHtml(dateStr)}</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#10b981">${escapeHtml(appt.slot_time)}</p>
              <p style="margin:8px 0 0;color:#4a5573;font-size:13px">30 dakikalık görüşme</p>
            </div>
            ${meetingBlock}
            <p style="color:#4a5573;line-height:1.6">Bu mailin ekindeki takvim daveti (.ics) ile randevuyu kendi takviminize ekleyebilirsiniz.</p>
          </div>
          <p style="text-align:center;color:#7a849c;font-size:11px;margin-top:16px">© 2026 Form Elektrik. Güç ve Güven.</p>
        </div>
      `,
      attachments: [{
        filename: 'randevu.ics',
        content: icsContent,
        contentType: 'text/calendar; charset=utf-8; method=REQUEST',
      }],
    }).catch(() => {});
  }

  res.json({ ok: true });
});

// ===== ADMIN: randevu sil =====
router.delete('/:id', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const appt = db.prepare('SELECT slot_id FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'not_found' });
  db.prepare('UPDATE available_slots SET is_booked = 0 WHERE id = ?').run(appt.slot_id);
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ===== ADMIN: slot yönetimi =====

// Tüm slotları listele
router.get('/admin/slots', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const { from, to } = req.query;
  let sql = 'SELECT * FROM available_slots WHERE 1=1';
  const params = [];
  if (from) { sql += ' AND slot_date >= ?'; params.push(from); }
  if (to) { sql += ' AND slot_date <= ?'; params.push(to); }
  sql += ' ORDER BY slot_date, slot_time';
  res.json({ slots: db.prepare(sql).all(...params) });
});

// Toplu slot oluştur (tarih aralığı + saat aralığı + ürün)
router.post('/admin/slots', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const { dateFrom, dateTo, timeFrom, timeTo, interval = 30, weekdays, product } = req.body || {};
  if (!dateFrom || !dateTo || !timeFrom || !timeTo) {
    return res.status(400).json({ error: 'invalid_input' });
  }

  if (dateFrom > dateTo) return res.status(400).json({ error: 'invalid_date_range' });

  // product: bir randevu konusu başlığı ya da genel (NULL/boş).
  // Geçerli başlık = aktif appointment_topics içinde olan. Aksi halde genel kabul et.
  const reqProd = (product || '').trim();
  let prod = null;
  if (reqProd) {
    const valid = db.prepare(
      `SELECT 1 FROM appointment_topics WHERE is_active = 1 AND title = ?`
    ).get(reqProd);
    if (valid) prod = reqProd;
  }

  const [startH, startM] = timeFrom.split(':').map(Number);
  const [endH, endM] = timeTo.split(':').map(Number);
  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;
  if (startMin >= endMin) return res.status(400).json({ error: 'invalid_time_range' });

  const allowedDays = weekdays || [1, 2, 3, 4, 5]; // Pzt=1 ... Cum=5

  // Aynı (tarih, saat, ürün) zaten varsa tekrar ekleme (unique constraint yok, elle kontrol)
  const exists = db.prepare(`
    SELECT 1 FROM available_slots
    WHERE slot_date = ? AND slot_time = ? AND (product IS ? OR product = ?)
  `);
  const insert = db.prepare(`
    INSERT INTO available_slots (slot_date, slot_time, product) VALUES (?, ?, ?)
  `);

  function parseLocalDate(str) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function fmtLocalDate(dt) {
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
  }

  const tx = db.transaction(() => {
    let count = 0;
    const d = parseLocalDate(dateFrom);
    const endDate = parseLocalDate(dateTo);
    while (d <= endDate) {
      const dayOfWeek = d.getDay();
      if (allowedDays.includes(dayOfWeek)) {
        const dateStr = fmtLocalDate(d);
        for (let m = startMin; m < endMin; m += interval) {
          // Öğle arası 12:00-13:00 atla (slot başlangıçları)
          if (m >= 12 * 60 && m < 13 * 60) continue;
          const hh = String(Math.floor(m / 60)).padStart(2, '0');
          const mm = String(m % 60).padStart(2, '0');
          const timeStr = `${hh}:${mm}`;
          if (exists.get(dateStr, timeStr, prod, prod)) continue;
          try { insert.run(dateStr, timeStr, prod); count++; } catch {}
        }
      }
      d.setDate(d.getDate() + 1);
    }
    return count;
  });

  const count = tx();
  res.json({ ok: true, created: count });
});

// Tek slot sil
router.delete('/admin/slots/:id', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const slot = db.prepare('SELECT * FROM available_slots WHERE id = ?').get(req.params.id);
  if (!slot) return res.status(404).json({ error: 'not_found' });
  if (slot.is_booked) return res.status(400).json({ error: 'slot_booked' });
  db.prepare('DELETE FROM available_slots WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Tarihe göre toplu slot sil (sadece booked olmayanlar)
router.delete('/admin/slots/date/:date', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const { date } = req.params;
  db.prepare('DELETE FROM available_slots WHERE slot_date = ? AND is_booked = 0').run(date);
  res.json({ ok: true });
});

// ===== ADMIN: randevu konuları CRUD =====
router.get('/admin/topics', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const rows = db.prepare('SELECT * FROM appointment_topics ORDER BY sort_order, id').all();
  res.json({ topics: rows });
});

// Basit e-posta doğrulama (boş bırakılabilir)
function normEmail(v) {
  const s = String(v == null ? '' : v).trim();
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : false; // false = geçersiz
}

router.post('/admin/topics', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const { title, sort_order, is_active, notify_email } = req.body || {};
  if (!isNonEmptyString(title, 120)) return res.status(400).json({ error: 'invalid_input' });
  const mail = normEmail(notify_email);
  if (mail === false) return res.status(400).json({ error: 'invalid_email' });
  const info = db.prepare('INSERT INTO appointment_topics (title, sort_order, is_active, notify_email) VALUES (?, ?, ?, ?)')
    .run(title.trim(), Number(sort_order) || 0, is_active === 0 || is_active === false ? 0 : 1, mail);
  res.status(201).json({ ok: true, id: info.lastInsertRowid });
});

router.put('/admin/topics/:id', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  const { title, sort_order, is_active, notify_email } = req.body || {};
  if (!isNonEmptyString(title, 120)) return res.status(400).json({ error: 'invalid_input' });
  const mail = normEmail(notify_email);
  if (mail === false) return res.status(400).json({ error: 'invalid_email' });
  const exists = db.prepare('SELECT id FROM appointment_topics WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'not_found' });
  db.prepare('UPDATE appointment_topics SET title = ?, sort_order = ?, is_active = ?, notify_email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(title.trim(), Number(sort_order) || 0, is_active === 0 || is_active === false ? 0 : 1, mail, req.params.id);
  res.json({ ok: true });
});

router.delete('/admin/topics/:id', authRequired, requireRole('admin'), requirePermission('appointments'), (req, res) => {
  db.prepare('DELETE FROM appointment_topics WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
