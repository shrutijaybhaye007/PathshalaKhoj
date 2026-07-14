/**
 * seed-admin.js
 * Creates or updates the admin account using credentials from the .env file.
 *
 * Usage:
 *   node db/seed-admin.js
 *
 * Required .env variables:
 *   ADMIN_EMAIL    — e.g. admin@yourapp.com
 *   ADMIN_PASSWORD — a strong password (min 8 chars)
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });

const crypto = require('node:crypto');
const { get, run } = require('./connection');

const email    = process.env.ADMIN_EMAIL    || 'admin@pathshalakhoj.com';
const password = process.env.ADMIN_PASSWORD;
const name     = process.env.ADMIN_NAME     || 'System Admin';

if (!password) {
  console.error('[seed-admin] ERROR: ADMIN_PASSWORD is not set in your .env file.');
  console.error('[seed-admin] Add ADMIN_PASSWORD=yourStrongPassword to backend/.env and re-run.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('[seed-admin] ERROR: ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

function hashPassword(pwd, salt) {
  return crypto.pbkdf2Sync(pwd, salt, 1000, 64, 'sha512').toString('hex');
}

const salt         = crypto.randomBytes(8).toString('hex');
const hash         = hashPassword(password, salt);
const passwordHash = `${salt}:${hash}`;

const existing = get('SELECT id FROM users WHERE email = ?', [email]);

if (existing) {
  run(
    "UPDATE users SET name = ?, role = 'admin', password_hash = ?, updated_at = datetime('now') WHERE email = ?",
    [name, passwordHash, email]
  );
  console.log(`[seed-admin] ✅ Admin account updated: ${email}`);
} else {
  run(
    'INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)',
    [email, name, 'admin', passwordHash]
  );
  console.log(`[seed-admin] ✅ Admin account created: ${email}`);
}

console.log('[seed-admin] Done. Keep your ADMIN_PASSWORD safe — do not commit it to git.');
