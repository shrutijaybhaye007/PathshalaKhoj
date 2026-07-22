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
    service: 'gmail',
    auth: { user, pass }
  });
}

async function sendPasswordResetEmail(toEmail, resetToken, userName) {
  const transporter = createTransporter();
  const resetLink = `${SITE_URL}/reset-password.html?token=${resetToken}`;

  if (!transporter) {
    // Fallback: log to console in dev / if SMTP not configured
    console.log('\n=========================================');
    console.log(`🔐 PASSWORD RESET REQUESTED FOR: ${toEmail}`);
    console.log(`🔗 RESET LINK: ${resetLink}`);
    console.log('=========================================\n');
    return { fallback: true };
  }

  const firstName = (userName || toEmail).split(' ')[0];

  await transporter.sendMail({
    from: `"PathshalaKhoj" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Reset your PathshalaKhoj password',
    html: `
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
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a3e 0%,#2d2d6b 100%);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#F5A623;font-size:28px;font-weight:800;letter-spacing:-0.5px;">PathshalaKhoj</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">India's College Discovery Platform</p>
            </td>
          </tr>
          <!-- Body -->
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
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e8ecf0;text-align:center;">
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
    `,
    text: `Hi ${firstName},\n\nWe received a request to reset your PathshalaKhoj password.\n\nClick this link to reset it (expires in 1 hour):\n${resetLink}\n\nIf you didn't request this, ignore this email.\n\n— PathshalaKhoj Team`
  });

  return { sent: true };
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

    // Always respond with success to prevent email enumeration attacks
    const user = await get('SELECT id, name FROM users WHERE email = ?', [email]);
    if (!user) {
      // Don't reveal if the email exists or not
      return res.json({
        success: true,
        message: 'If an account exists for that email, a reset link has been sent.'
      });
    }

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const expires     = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    await run(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?',
      [resetToken, expires, user.id]
    );

    try {
      await sendPasswordResetEmail(email, resetToken, user.name);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
      // Still respond — token is stored so user can try again
    }

    res.json({
      success: true,
      message: 'If an account exists for that email, a reset link has been sent.'
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

module.exports = router;
