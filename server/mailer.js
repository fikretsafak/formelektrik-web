const nodemailer = require('nodemailer');
const db = require('./db');

let transporter = null;
let configured = false;

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

module.exports = { sendMail, isConfigured: () => configured, resetTransporter };
