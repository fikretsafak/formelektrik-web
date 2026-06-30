const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { signToken, authRequired } = require('../middleware/auth');
const { isEmail } = require('../middleware/validate');
const { sendMail, isConfigured: mailerConfigured } = require('../mailer');

const router = express.Router();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 saat
const APP_BASE_URL = (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// Katman 1 — IP bazlı: 15 dk'da 10 başarısız deneme. Başarılı giriş sayılmaz
// (skipSuccessfulRequests), böylece meşru kullanıcı limitini doldurmaz.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_attempts' },
});

// Katman 2 — hesap bazlı kilit (IP rotasyonuna karşı):
// art arda MAX_FAILED hatalı şifre → hesap LOCK_MS süre kilitli.
const MAX_FAILED = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 dk

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!isEmail(email) || typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'invalid_credentials' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !user.is_active) return res.status(401).json({ error: 'invalid_credentials' });

  // Hesap kilitli mi? (locked_until gelecekteyse reddet — şifre doğru olsa bile)
  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    const retryAfter = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 1000);
    return res.status(429).json({ error: 'account_locked', retry_after: retryAfter });
  }

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) {
    // Başarısız: sayacı artır; eşiğe ulaşınca hesabı kilitle
    const failed = (user.failed_attempts || 0) + 1;
    if (failed >= MAX_FAILED) {
      const lockedUntil = new Date(Date.now() + LOCK_MS).toISOString();
      db.prepare('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?')
        .run(failed, lockedUntil, user.id);
      return res.status(429).json({ error: 'account_locked', retry_after: Math.ceil(LOCK_MS / 1000) });
    }
    db.prepare('UPDATE users SET failed_attempts = ? WHERE id = ?').run(failed, user.id);
    return res.status(401).json({ error: 'invalid_credentials' });
  }

  // Başarılı: sayacı + kilidi sıfırla
  if (user.failed_attempts || user.locked_until) {
    db.prepare('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);
  }

  const token = signToken(user);
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({
    token,
    user: {
      id: user.id, email: user.email, name: user.name, role: user.role,
      must_change_password: user.must_change_password ? 1 : 0,
    },
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', authRequired, (req, res) => {
  const u = db.prepare('SELECT id, email, name, role, company, phone, avatar_url, permissions, must_change_password FROM users WHERE id = ?').get(req.user.id);
  const user = u || req.user;
  // permissions: JSON string → array; NULL = tam yetki (null gönder)
  if (user && typeof user.permissions === 'string') {
    try { user.permissions = JSON.parse(user.permissions); } catch { user.permissions = null; }
  }
  if (user) user.must_change_password = user.must_change_password ? 1 : 0;
  res.json({ user });
});

// ============================================
// Şifremi Unuttum
// ============================================

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/forgot-password', forgotLimiter, async (req, res) => {
  const { email } = req.body || {};
  // Bilgi sızıntısı önleme: e-posta veritabanında yoksa da "başarılı" yanıt veriyoruz
  const respondOk = () => res.json({ ok: true });

  if (!isEmail(email)) return respondOk();

  const user = db.prepare('SELECT id, email, name, is_active FROM users WHERE email = ?')
    .get(email.toLowerCase().trim());
  if (!user || !user.is_active) return respondOk();

  // Eski kullanılmamış token'ları temizle (aynı kullanıcı için)
  db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL")
    .run(user.id);

  // Yeni token üret
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;

  db.prepare(`INSERT INTO password_reset_tokens (token, user_id, expires_at, ip)
              VALUES (?, ?, ?, ?)`)
    .run(token, user.id, expiresAt, ip);

  const resetUrl = `${APP_BASE_URL}/reset-password.html?token=${token}`;

  // Mail gönder (fire-and-forget — SMTP yoksa atlanır)
  const mailResult = await sendMail({
    to: user.email,
    subject: 'Form Elektrik — Şifre sıfırlama isteği',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:20px;background:#f5f7fb;border-radius:12px">
        <div style="background:#0a0e1a;padding:24px;border-radius:8px;text-align:center;margin-bottom:24px">
          <img src="${APP_BASE_URL}/assets/main/logo-light.png" alt="Form Elektrik" style="height:36px;display:inline-block" />
        </div>
        <div style="background:#ffffff;padding:32px;border-radius:8px">
          <h2 style="color:#0a1024;font-size:20px;margin:0 0 16px">Merhaba ${escapeHtml(user.name)},</h2>
          <p style="color:#4a5573;line-height:1.6">
            Form Elektrik hesabınız için şifre sıfırlama talebi aldık. Yeni şifre belirlemek için aşağıdaki butona tıklayın:
          </p>
          <div style="text-align:center;margin:28px 0">
            <a href="${resetUrl}"
               style="display:inline-block;padding:14px 28px;background:linear-gradient(135deg,#00d4ff,#4d9fff);
                      color:#001428;text-decoration:none;font-weight:700;border-radius:100px;font-size:14px">
              Şifreyi Sıfırla
            </a>
          </div>
          <p style="color:#7a849c;font-size:13px;line-height:1.6">
            Veya bu bağlantıyı tarayıcınıza yapıştırın:<br>
            <a href="${resetUrl}" style="color:#0091c2;word-break:break-all">${resetUrl}</a>
          </p>
          <div style="border-top:1px solid #e5e8ef;margin-top:24px;padding-top:16px;color:#7a849c;font-size:12px;line-height:1.6">
            <p>Bu link <b>1 saat</b> içinde geçerliliğini yitirecektir.</p>
            <p>Eğer bu talebi siz oluşturmadıysanız, bu e-postayı dikkate almayın — şifreniz değişmez.</p>
          </div>
        </div>
        <p style="text-align:center;color:#7a849c;font-size:11px;margin-top:16px">
          © 2026 Form Elektrik. Güç ve Güven.
        </p>
      </div>
    `,
    text: `Merhaba ${user.name},\n\nŞifrenizi sıfırlamak için bu bağlantıya tıklayın (1 saat geçerli):\n${resetUrl}\n\nBu talebi siz oluşturmadıysanız, bu maili dikkate almayın.\n\n— Form Elektrik`,
  });

  if (mailResult && mailResult.error) {
    console.error('[forgot-password] mail hatası:', mailResult.error);
  }

  respondOk();
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || token.length < 32) {
    return res.status(400).json({ error: 'invalid_token' });
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'password_too_short' });
  }

  const row = db.prepare(`
    SELECT t.token, t.user_id, t.expires_at, t.used_at, u.email, u.name
    FROM password_reset_tokens t
    JOIN users u ON u.id = t.user_id
    WHERE t.token = ?
  `).get(token);

  if (!row) return res.status(400).json({ error: 'invalid_token' });
  if (row.used_at) return res.status(400).json({ error: 'token_used' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'token_expired' });
  }

  const hash = bcrypt.hashSync(password, 12);
  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET password = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(hash, row.user_id);
    db.prepare('UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE token = ?')
      .run(token);
  });
  tx();

  res.json({ ok: true });
});

// Token geçerlilik kontrolü (UI için)
router.get('/reset-password/verify', (req, res) => {
  const token = req.query.token;
  if (typeof token !== 'string' || token.length < 32) {
    return res.json({ valid: false, reason: 'invalid' });
  }
  const row = db.prepare(`
    SELECT user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?
  `).get(token);
  if (!row) return res.json({ valid: false, reason: 'not_found' });
  if (row.used_at) return res.json({ valid: false, reason: 'used' });
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return res.json({ valid: false, reason: 'expired' });
  }
  res.json({ valid: true });
});

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

router.post('/change-password', authRequired, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ error: 'password_too_short' });
  }
  const row = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(currentPassword || '', row.password)) {
    return res.status(401).json({ error: 'current_password_wrong' });
  }
  if (bcrypt.compareSync(newPassword, row.password)) {
    return res.status(400).json({ error: 'same_as_current' });
  }
  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare('UPDATE users SET password = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hash, req.user.id);
  res.json({ ok: true });
});

module.exports = router;
