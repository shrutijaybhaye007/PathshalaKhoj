const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const { get, run } = require('../db/connection');

const router = express.Router();

const JWT_SECRET       = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '980082756706-bapnctfrc31j3v8o0td0mk27fmnk9c63.apps.googleusercontent.com';
const SITE_URL         = (process.env.SITE_URL || 'https://pathshalakhoj.onrender.com').replace(/\/$/, '');

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// ─── Email transporter ────────────────────────────────────────────────────────
function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });
}

async function sendPasswordResetEmail(toEmail, resetToken, userName) {
  const resetLink = `${SITE_URL}/reset-password.html?token=${resetToken}`;
  const firstName = (userName || toEmail).split(' ')[0];

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a3e 0%,#2d2d6b 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#F5A623;font-size:28px;font-weight:800;letter-spacing:-0.5px;">PathshalaKhoj</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">India's College Discovery Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;color:#1a1a3e;font-size:22px;font-weight:700;">Hi ${firstName},</h2>
              <p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.6;">
                We received a request to reset the password for your PathshalaKhoj account. Click the button below to set a new password.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}" style="display:inline-block;background:#F5A623;color:#1a1a3e;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                  Reset My Password
                </a>
              </div>
              <p style="margin:0 0 12px;color:#718096;font-size:13px;line-height:1.6;">
                This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
              </p>
              <p style="margin:0;color:#a0aec0;font-size:12px;word-break:break-all;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${resetLink}" style="color:#4f46e5;">${resetLink}</a>
              </p>
            </td>
          </tr>
          <tr>
              <p style="margin:0;color:#a0aec0;font-size:12px;">
                © 2026 PathshalaKhoj · <a href="${SITE_URL}" style="color:#4f46e5;text-decoration:none;">pathshalakhoj.onrender.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const errors = [];

  // 1a. Try Gmail Apps Script Webhook (Sends directly from Gmail over HTTPS Port 443 — 100% Inbox Delivery)
  const gmailWebhookUrl = (process.env.GMAIL_WEBHOOK_URL || '').trim().replace(/^["']|["']$/g, '');
  const senderEmail = (process.env.SMTP_USER || 'itme28563@gmail.com').trim().replace(/^["']|["']$/g, '');

  if (gmailWebhookUrl) {
    try {
      const gRes = await fetch(gmailWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject: 'Reset your PathshalaKhoj password',
          html: htmlContent
        }),
        signal: AbortSignal.timeout(10000)
      });
      console.log(`🔍 Gmail Webhook Status: ${gRes.status}`);
      if (gRes.ok || gRes.status === 302 || gRes.status === 200) {
        console.log(`✅ Reset email sent via Gmail Webhook to ${toEmail}`);
        return { sent: true, provider: 'gmail-webhook' };
      } else {
        errors.push({ provider: 'gmail-webhook', status: gRes.status });
      }
    } catch (gErr) {
      console.error('❌ Gmail Webhook Error:', gErr.message);
      errors.push({ provider: 'gmail-webhook', detail: gErr.message });
    }
  }

  // 1b. Try SendGrid REST API
  const sendgridApiKey = (process.env.SENDGRID_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (sendgridApiKey) {
    try {
      const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sendgridApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: toEmail }] }],
          from: { email: senderEmail, name: 'PathshalaKhoj' },
          subject: 'Reset your PathshalaKhoj password',
          content: [{ type: 'text/html', value: htmlContent }]
        }),
        signal: AbortSignal.timeout(8000)
      });
      if (sgRes.ok || sgRes.status === 202) {
        console.log(`✅ Reset email sent via SendGrid API to ${toEmail}`);
        return { sent: true, provider: 'sendgrid' };
      } else {
        const sgData = await sgRes.json().catch(() => ({}));
        console.error('❌ SendGrid API Error:', sgRes.status, sgData);
        errors.push({ provider: 'sendgrid', status: sgRes.status, detail: sgData });
      }
    } catch (sgErr) {
      console.error('❌ SendGrid API Error:', sgErr.message);
      errors.push({ provider: 'sendgrid', detail: sgErr.message });
    }
  }

  // 1b. Try Brevo REST API
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (brevoApiKey && brevoApiKey.startsWith('xkeysib-')) {
    try {
      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'PathshalaKhoj', email: senderEmail },
          to: [{ email: toEmail }],
          subject: 'Reset your PathshalaKhoj password',
          htmlContent: htmlContent
        }),
        signal: AbortSignal.timeout(8000)
      });
      const brevoData = await brevoRes.json();
      console.log(`🔍 Brevo REST API Status: ${brevoRes.status}`, JSON.stringify(brevoData));
      if (brevoRes.ok) {
        console.log(`✅ Reset email sent via Brevo REST API to ${toEmail} (messageId: ${brevoData.messageId})`);
        return { sent: true, provider: 'brevo-rest', messageId: brevoData.messageId };
      } else {
        console.error('❌ Brevo REST API Error:', brevoData);
        errors.push({ provider: 'brevo-rest', status: brevoRes.status, detail: brevoData });
      }
    } catch (brevoErr) {
      console.error('❌ Brevo REST API Error:', brevoErr.message);
      errors.push({ provider: 'brevo-rest', detail: brevoErr.message });
    }
  }

  // 1b. Try Brevo SMTP Relay (if xsmtpsib- key)
  if (brevoApiKey && brevoApiKey.startsWith('xsmtpsib-')) {
    try {
      const brevoTransporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
          user: (process.env.BREVO_SMTP_USER || senderEmail).trim(),
          pass: brevoApiKey
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
      await brevoTransporter.sendMail({
        from: `"PathshalaKhoj" <${senderEmail}>`,
        to: toEmail,
        subject: 'Reset your PathshalaKhoj password',
        html: htmlContent
      });
      console.log(`✅ Reset email sent via Brevo SMTP Relay to ${toEmail}`);
      return { sent: true, provider: 'brevo-smtp' };
    } catch (brevoSmtpErr) {
      console.error('❌ Brevo SMTP Relay Error:', brevoSmtpErr.message);
      errors.push({ provider: 'brevo-smtp', detail: brevoSmtpErr.message });
    }
  }

  // 2. Try Resend HTTP API (HTTPS port 443)
  if (process.env.RESEND_API_KEY) {
    try {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'PathshalaKhoj <onboarding@resend.dev>',
          to: [toEmail],
          subject: 'Reset your PathshalaKhoj password',
          html: htmlContent
        })
      });
      const resendData = await resendRes.json();
      console.log(`🔍 Resend API Status: ${resendRes.status}`, JSON.stringify(resendData));
      if (resendRes.ok) {
        console.log(`✅ Reset email sent via Resend API to ${toEmail} (id: ${resendData.id})`);
        return { sent: true, provider: 'resend' };
      } else {
        console.error('❌ Resend API Error:', resendData);
        errors.push({ provider: 'resend', status: resendRes.status, detail: resendData });
      }
    } catch (resendErr) {
      console.error('❌ Resend API Fetch Error:', resendErr.message);
      errors.push({ provider: 'resend', detail: resendErr.message });
    }
  }

  // 3. Try Nodemailer SMTP
  const transporter = createTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"PathshalaKhoj" <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: 'Reset your PathshalaKhoj password',
        html: htmlContent,
        text: `Hi ${firstName},\n\nClick this link to reset your PathshalaKhoj password:\n${resetLink}\n\nLink expires in 1 hour.`
      });
      console.log(`✅ Reset email sent via SMTP to ${toEmail}`);
      return { sent: true, provider: 'smtp' };
    } catch (smtpErr) {
      console.error(`❌ SMTP Send Error to ${toEmail}:`, smtpErr.message);
      errors.push({ provider: 'smtp', detail: smtpErr.message });
    }
  }

  console.log('\n=========================================');
  console.log(`🔐 PASSWORD RESET REQUESTED FOR: ${toEmail}`);
  console.log(`🔗 RESET LINK: ${resetLink}`);
  console.log('=========================================\n');
  return { fallback: true, errors };
}

// ─── Helper: hash password ────────────────────────────────────────────────────
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 210000, 64, 'sha512').toString('hex');
}

// Strict email format validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * GET /api/auth/config
 * Returns public authentication configuration (Google Client ID).
 */
router.get('/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID || null });
});

/**
 * POST /api/auth/google
 * Verifies Google OAuth token, finds or creates user, and returns JWT.
 */
router.post('/google', async (req, res) => {
  try {
    const { credential, access_token } = req.body;
    if (!credential && !access_token) {
      return res.status(400).json({ error: 'No credential or access token provided.' });
    }

    let rawEmail, name, picture;

    if (access_token) {
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (!userInfoRes.ok) {
        return res.status(401).json({ error: 'Invalid or expired Google access token.' });
      }
      const userInfo = await userInfoRes.json();
      rawEmail = userInfo.email;
      name     = userInfo.name;
      picture  = userInfo.picture;
    } else {
      if (!googleClient) {
        return res.status(503).json({
          error: 'Google Sign-In is not configured on this server. Please use email/password login.',
        });
      }
      const ticket = await googleClient.verifyIdToken({
        idToken:  credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      rawEmail = payload.email;
      name     = payload.name;
      picture  = payload.picture;
    }

    if (!rawEmail) {
      return res.status(400).json({ error: 'Failed to extract email from Google profile.' });
    }

    const email = rawEmail.trim().toLowerCase();
    let user = await get('SELECT id, email, name, picture, role FROM users WHERE email = ?', [email]);

    if (!user) {
      const result = await run(
        'INSERT INTO users (email, name, picture, role) VALUES (?, ?, ?, ?)',
        [email, name, picture || null, 'user']
      );
      user = { id: result.lastInsertRowid, email, name, picture: picture || null, role: 'user' };
    } else {
      await run(
        'UPDATE users SET name = ?, picture = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
        [name, picture || null, email]
      );
      user.name    = name;
      user.picture = picture || null;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google.' });
  }
});

/**
 * POST /api/auth/register
 * Registers a new local user with email and password after strict validation.
 */
router.post('/register', async (req, res) => {
  try {
    const { email: rawEmail, password, name } = req.body;
    if (!rawEmail || !password || !name) {
      return res.status(400).json({ error: 'Full name, email address, and password are required.' });
    }

    const email = rawEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g. student@gmail.com).' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = await get('SELECT id, name, password_hash FROM users WHERE email = ?', [email]);
    if (existingUser) {
      if (!existingUser.password_hash) {
        // Google-only user: add local password
        const salt = crypto.randomBytes(8).toString('hex');
        const hash = hashPassword(password, salt);
        const passwordHash = `${salt}:${hash}`;

        await run(
          'UPDATE users SET password_hash = ?, name = COALESCE(name, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [passwordHash, name.trim(), existingUser.id]
        );

        const token = jwt.sign(
          { id: existingUser.id, email, role: 'user', name: existingUser.name || name.trim() },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.status(200).json({
          token,
          user: { id: existingUser.id, email, name: existingUser.name || name.trim(), role: 'user' }
        });
      }
      return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    const salt = crypto.randomBytes(8).toString('hex');
    const hash = hashPassword(password, salt);
    const passwordHash = `${salt}:${hash}`;

    const result = await run(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
      [email, name.trim(), passwordHash, 'user']
    );

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role: 'user', name: name.trim() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: result.lastInsertRowid, email, name: name.trim(), role: 'user' }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

/**
 * POST /api/auth/login
 * Validates local email/password, returns JWT for ANY role.
 */
router.post('/login', async (req, res) => {
  try {
    const { email: rawEmail, password } = req.body;
    if (!rawEmail || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const email = rawEmail.trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const user = await get('SELECT id, email, name, role, password_hash FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.password_hash) {
      return res.status(401).json({
        error: 'This account was created via Google Sign-In. Please sign in with Google, or use "Forgot password?" to set a local password.'
      });
    }

    const parts = user.password_hash.split(':');
    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Invalid password configuration. Please reset your password.' });
    }

    const [salt, storedHash] = parts;
    const computedHash = hashPassword(password, salt);

    if (computedHash !== storedHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Login processing failed.' });
  }
});

/**
 * POST /api/auth/forgot-password
 * Generates a reset token, stores it, and sends a real email with a reset link.
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required.' });

    const email = rawEmail.trim().toLowerCase();

    const user = await get('SELECT id, name FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({
        error: 'No account registered with that email address. Please check spelling or click "Sign Up" to create an account.'
      });
    }

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const expires     = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await run(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetToken, expires, user.id]
    );

    // Send email via Brevo / SMTP API
    try {
      const dispatch = await sendPasswordResetEmail(email, resetToken, user.name);
      console.log('📧 Password reset email result:', dispatch);
    } catch (emailErr) {
      console.error('📧 Email dispatch error:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Reset link sent! Please check your inbox (and spam folder).'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
});

/**
 * POST /api/auth/reset-password
 * Verifies the token from the email link and updates the password.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await get(
      'SELECT id, password_reset_expires FROM users WHERE password_reset_token = ?',
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid reset link. Please request a new one.' });
    }

    if (!user.password_reset_expires || new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
    }

    const salt = crypto.randomBytes(8).toString('hex');
    const hash = hashPassword(newPassword, salt);
    const passwordHash = `${salt}:${hash}`;

    await run(
      'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ success: true, message: 'Password updated successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

/**
 * POST /api/auth/change-password
 * Authenticated route to change password (requires old password).
 */
router.post('/change-password', require('../middlewares/authMiddleware').requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await get('SELECT id, password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required.' });
      }
      const [salt, storedHash] = user.password_hash.split(':');
      if (hashPassword(currentPassword, salt) !== storedHash) {
        return res.status(400).json({ error: 'Incorrect current password.' });
      }
    }

    const newSalt = crypto.randomBytes(8).toString('hex');
    const newHash = hashPassword(newPassword, newSalt);
    const passwordHash = `${newSalt}:${newHash}`;

    await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [passwordHash, user.id]);

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', require('../middlewares/authMiddleware').requireAuth, async (req, res) => {
  try {
    const user = await get('SELECT id, email, name, picture, role, password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const has_local_password = Boolean(user.password_hash);
    delete user.password_hash;
    res.json({ user: { ...user, has_local_password } });
  } catch (err) {
    console.error('GET /api/auth/me error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

/**
 * PUT /api/auth/profile
 * Update name, picture, and optionally change password.
 */
router.put('/profile', require('../middlewares/authMiddleware').requireAuth, async (req, res) => {
  try {
    const { name, picture, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const existingUser = await get('SELECT id, password_hash FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updates = [];
    const params  = [];

    if (name !== undefined && typeof name === 'string' && name.trim().length > 0) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (picture !== undefined) {
      updates.push('picture = ?');
      params.push(picture ? picture.trim() : null);
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters.' });
      }

      if (existingUser.password_hash) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current (old) password is required to change password.' });
        }
        const [salt, storedHash] = existingUser.password_hash.split(':');
        if (hashPassword(currentPassword, salt) !== storedHash) {
          return res.status(400).json({ error: 'Incorrect current password. Please try again.' });
        }
      }

      const salt = crypto.randomBytes(8).toString('hex');
      const hash = hashPassword(newPassword, salt);
      updates.push('password_hash = ?');
      params.push(`${salt}:${hash}`);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(userId);
      await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const updatedUser = await get('SELECT id, email, name, picture, role, password_hash FROM users WHERE id = ?', [userId]);
    const has_local_password = Boolean(updatedUser.password_hash);
    delete updatedUser.password_hash;

    res.json({
      message: 'Profile updated successfully.',
      user: { ...updatedUser, has_local_password }
    });
  } catch (err) {
    console.error('PUT /api/auth/profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

/**
 * DELETE /api/auth/account
 * Permanently deletes the authenticated user's account.
 */
router.delete('/account', require('../middlewares/authMiddleware').requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    await run('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ success: true, message: 'Your account has been deleted successfully.' });
  } catch (err) {
    console.error('DELETE /api/auth/account error:', err);
    res.status(500).json({ error: 'Failed to delete account. Please try again.' });
  }
});

module.exports = router;

