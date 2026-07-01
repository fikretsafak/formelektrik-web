const nodemailer = require('nodemailer');
const db = require('./db');

let transporter = null;
let configured = false;

const APP_BASE_URL = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
// Not: logo-light.png projede yok; gerçek logo logo.png (beyaz zeminde iyi durur).
const MAIL_LOGO_URL = `${APP_BASE_URL}/assets/main/logo.png`;

// Ortak e-posta şablonu — logo başlık + içerik + "cevaplamayın" alt bilgisi.
// Tüm bildirim mailleri (lead/randevu/kariyer) bunu kullanır.
function wrapEmail(bodyHtml, { title = 'Form Elektrik', preheader = '' } = {}) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#1a2340;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0">${preheader}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f7;padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 28px -14px rgba(15,22,64,0.25)">
        <tr><td style="background:linear-gradient(135deg,#0f1640,#1b2a6b);padding:26px 32px;text-align:center">
          <img src="${MAIL_LOGO_URL}" alt="Form Elektrik" height="40" style="height:40px;display:inline-block;background:#fff;border-radius:8px;padding:6px 12px">
        </td></tr>
        <tr><td style="padding:32px">
          <h2 style="margin:0 0 18px;font-size:19px;color:#0f1640;font-family:Arial,Helvetica,sans-serif">${escapeHtmlMail(title)}</h2>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 32px;background:#f6f8fc;border-top:1px solid #e6ebf3">
          <p style="margin:0 0 6px;font-size:12px;color:#8a93a8;line-height:1.6">
            Bu e-posta Form Elektrik web sitesi üzerinden otomatik olarak oluşturulmuştur.
            <b>Lütfen bu iletiyi yanıtlamayınız</b> — bu adres yalnızca bildirim gönderimi içindir.
          </p>
          <p style="margin:0;font-size:12px;color:#aab2c5">© ${year} Form Elektrik İnş.Müh.A.Ş — Tüm hakları saklıdır.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Şablon içinde kullanılacak tablo satırı yardımcıları (tutarlı stil)
function mailRow(label, value) {
  return `<tr>
    <td style="padding:9px 0;font-size:13px;color:#6b7386;width:150px;vertical-align:top">${escapeHtmlMail(label)}</td>
    <td style="padding:9px 0;font-size:14px;color:#1a2340;vertical-align:top">${value}</td>
  </tr>`;
}
function mailTable(rowsHtml) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rowsHtml}</table>`;
}
function escapeHtmlMail(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function dbSetting(key) {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? row.value : null;
  } catch { return null; }
}

function getTransporter() {
  if (transporter) return transporter;
  // Önce DB'den oku, yoksa .env'den
  const host = dbSetting('smtp_host') || process.env.SMTP_HOST;
  if (!host) {
    configured = false;
    return null;
  }
  const port = Number(dbSetting('smtp_port') || process.env.SMTP_PORT || 587);
  const secure = String(dbSetting('smtp_secure') || process.env.SMTP_SECURE) === 'true';
  const user = dbSetting('smtp_user') || process.env.SMTP_USER;
  const pass = dbSetting('smtp_pass') || process.env.SMTP_PASS;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });
  configured = true;
  return transporter;
}

function resetTransporter() {
  transporter = null;
  configured = false;
}

async function sendMail({ to, cc, subject, html, text, replyTo, attachments, icalEvent }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] SMTP yapılandırılmamış, atlandı. Konu: ${subject}`);
    return { skipped: true };
  }
  const from = dbSetting('smtp_from') || process.env.SMTP_FROM || 'Form Elektrik <no-reply@formelektrik.com>';
  try {
    const info = await t.sendMail({ from, to, cc, subject, html, text, replyTo, attachments, icalEvent });
    return { sent: true, id: info.messageId };
  } catch (err) {
    console.error('[mailer] gönderim hatası:', err.message);
    return { error: err.message };
  }
}

module.exports = { sendMail, isConfigured: () => configured, resetTransporter, wrapEmail, mailRow, mailTable };
