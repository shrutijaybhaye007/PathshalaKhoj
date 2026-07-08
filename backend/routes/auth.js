const express = require('express');
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { get, run } = require('../db/connection');

const router = express.Router();

// Read environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'pk_fallback_jwt_secret_key_12984';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';

const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Helper to hash password using PBKDF2
function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

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
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'No credential token provided.' });
    }

    let email, name, picture;

    // Graceful bypass/development helper if GOOGLE_CLIENT_ID is not configured
    if (!GOOGLE_CLIENT_ID) {
      console.warn('WARNING: GOOGLE_CLIENT_ID is not set in env. Simulating auth for testing.');
      // Extract payload from decoded JWT header/body (since it's a JWT anyway)
      try {
        const payloadBase64 = credential.split('.')[1];
        const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch {
        // Fallback demo user if token isn't a valid JWT
        email = 'demo.user@gmail.com';
        name = 'Demo Student';
        picture = '';
      }
    } else {
      // Real Google verification
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    if (!email) {
      return res.status(400).json({ error: 'Failed to extract email from Google credential.' });
    }

    // Check if user exists in database
    let user = get('SELECT id, email, name, picture, role FROM users WHERE email = ?', [email]);

    if (!user) {
      // Create user as a standard 'user'
      const result = run(
        'INSERT INTO users (email, name, picture, role) VALUES (?, ?, ?, ?)',
        [email, name, picture, 'user']
      );
      user = {
        id: result.lastInsertRowid,
        email,
        name,
        picture,
        role: 'user'
      };
    } else {
      // Update name and picture if they changed
      run(
        'UPDATE users SET name = ?, picture = ?, updated_at = datetime(\'now\') WHERE email = ?',
        [name, picture, email]
      );
      user.name = name;
      user.picture = picture;
    }

    // Sign session JWT
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
 * Registers a new local user with email and password.
 */
router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existingUser = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = crypto.randomBytes(8).toString('hex');
    const hash = hashPassword(password, salt);
    const passwordHash = `${salt}:${hash}`;

    const result = run(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)',
      [email, name, passwordHash, 'user']
    );

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role: 'user', name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: result.lastInsertRowid, email, name, role: 'user' }
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
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = get('SELECT id, email, name, role, password_hash FROM users WHERE email = ?', [email]);
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
 * Generates a reset token and simulates email delivery.
 */
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      // Return success anyway to prevent email enumeration attacks
      return res.json({ success: true, message: 'If an account exists, a reset link was sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    run('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?', 
        [resetToken, expires, user.id]);

    // Simulate email delivery for local MVP
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
 * Accepts reset token and new password.
 */
router.post('/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Valid token and a password of at least 6 characters are required.' });
    }

    const user = get('SELECT id, password_reset_expires FROM users WHERE password_reset_token = ?', [token]);
    if (!user || new Date(user.password_reset_expires) < new Date()) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired.' });
    }

    const salt = crypto.randomBytes(8).toString('hex');
    const hash = hashPassword(newPassword, salt);
    const newHashString = `${salt}:${hash}`;

    run('UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?', 
        [newHashString, user.id]);

    res.json({ success: true, message: 'Password has been successfully reset.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

/**
 * GET /api/auth/me
 * Validates JWT authorization header and returns user details.
 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch fresh user state from DB
    const user = get('SELECT id, email, name, picture, role, jee_rank, neet_rank, cat_percentile, board_percentage, academic_stream FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Session expired or invalid token.' });
  }
});

/**
 * PUT /api/auth/profile
 * Update logged-in user profile details (name, picture, password).
 */
router.put('/profile', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = get('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }

    const { name, picture, new_password, jee_rank, neet_rank, cat_percentile, board_percentage, academic_stream } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const updates = ['name = ?', 'picture = ?', 'updated_at = datetime(\'now\')'];
    const params = [name, picture || null];

    if (jee_rank !== undefined) {
      updates.push('jee_rank = ?');
      params.push(jee_rank ? parseInt(jee_rank) : null);
    }
    if (neet_rank !== undefined) {
      updates.push('neet_rank = ?');
      params.push(neet_rank ? parseInt(neet_rank) : null);
    }
    if (cat_percentile !== undefined) {
      updates.push('cat_percentile = ?');
      params.push(cat_percentile ? parseFloat(cat_percentile) : null);
    }
    if (board_percentage !== undefined) {
      updates.push('board_percentage = ?');
      params.push(board_percentage ? parseFloat(board_percentage) : null);
    }
    if (academic_stream !== undefined) {
      updates.push('academic_stream = ?');
      params.push(academic_stream || null);
    }

    // Handle password update if user is local and provided a new password
    if (new_password) {
      if (!user.password_hash) {
        return res.status(400).json({ error: 'Google accounts cannot change password here.' });
      }
      
      if (new_password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      // Generate new salt and hash using built-in PBKDF2
      const salt = crypto.randomBytes(8).toString('hex');
      const hash = hashPassword(new_password, salt);
      const newHashString = `${salt}:${hash}`;
      
      updates.push('password_hash = ?');
      params.push(newHashString);
    }

    params.push(user.id);
    run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedUser = get('SELECT id, email, name, picture, role, jee_rank, neet_rank, cat_percentile, board_percentage, academic_stream FROM users WHERE id = ?', [user.id]);
    res.json({ user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(401).json({ error: 'Failed to update profile. Invalid session token.' });
  }
});

module.exports = router;
