const jwt = require('jsonwebtoken');
const { get } = require('../db/connection');

// JWT_SECRET is guaranteed to be set: server.js validates and exits if missing.
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Middleware to require valid JWT authentication.
 * Attaches verified user object to req.user.
 */
function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = get('SELECT id, email, name, role FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

/**
 * Middleware to restrict route to administrators only.
 * Must be used AFTER requireAuth.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin privileges required.' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin
};
