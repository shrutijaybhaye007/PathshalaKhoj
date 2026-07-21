const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { get, run } = require('../db/connection');

const router = express.Router();

const JWT_SECRET       = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '980082756706-bapnctfrc31j3v8o0td0mk27fmnk9c63.apps.googleusercontent.com';

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Helper to hash password using PBKDF2 with 210,000 iterations and sha512
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
      name = userInfo.name;
      picture = userInfo.picture;
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
      name = payload.name;
      picture = payload.picture;
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
        "UPDATE users SET name = ?, picture = ?, updated_at = NOW() WHERE email = ?",
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

    const existingUser = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
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
    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials. If you used Google to sign up, please sign in with Google.' });
    }

    const [salt, storedHash] = user.password_hash.split(':');
    const computedHash = hashPassword(password, salt);

    if (computedHash !== storedHash) {
      return res.status(401).json({ error: 'Invalid credentials.' });
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
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email: rawEmail } = req.body;
    if (!rawEmail) return res.status(400).json({ error: 'Email is required.' });

    const email = rawEmail.trim().toLowerCase();
    const user = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset link was sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString();

    await run('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?', 
        [resetToken, expires, user.id]);

    console.log(`\n=========================================`);
    console.log(`🔐 PASSWORD RESET REQUESTED FOR: ${email}`);
    console.log(`🔗 RESET TOKEN: ${resetToken}`);
    console.log(`=========================================\n`);

    res.json({ success: true, message: 'If an account exists, a reset link was sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const user = await get(
      'SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }

    const salt = crypto.randomBytes(8).toString('hex');
    const hash = hashPassword(newPassword, salt);
    const passwordHash = `${salt}:${hash}`;

    await run(
      'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
      [passwordHash, user.id]
    );

    res.json({ success: true, message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
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
 */
router.put('/profile', require('../middlewares/authMiddleware').requireAuth, async (req, res) => {
  try {
    const { name, picture, newPassword } = req.body;
    const userId = req.user.id;

    const existingUser = await get('SELECT id, password_hash FROM users WHERE id = ?', [userId]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updates = [];
    const params = [];

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
      const salt = crypto.randomBytes(8).toString('hex');
      const hash = hashPassword(newPassword, salt);
      const passwordHash = `${salt}:${hash}`;

      updates.push('password_hash = ?');
      params.push(passwordHash);
    }

    if (updates.length > 0) {
      updates.push("updated_at = NOW()");
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
