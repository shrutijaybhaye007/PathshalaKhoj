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
  return crypto.pbkdf2Sync(pwd, salt, 210000, 64, 'sha512').toString('hex');
}

async function seedAdmin() {
  const targetEmail = (process.env.ADMIN_EMAIL || 'admin@pathshalakhoj.com').trim().toLowerCase();
  const targetPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'System Admin';

  if (!targetPassword) {
    console.error('[seed-admin] ERROR: ADMIN_PASSWORD is not set.');
    return;
  }

  if (targetPassword.length < 8) {
    console.error('[seed-admin] ERROR: ADMIN_PASSWORD must be at least 8 characters.');
    return;
  }

  const salt         = crypto.randomBytes(8).toString('hex');
  const hash         = hashPassword(targetPassword, salt);
  const passwordHash = `${salt}:${hash}`;

  const userByEmail = await get('SELECT id, role FROM users WHERE LOWER(email) = ?', [targetEmail]);

  if (userByEmail) {
    await run(
      "UPDATE users SET name = ?, role = 'admin', password_hash = ?, updated_at = NOW() WHERE id = ?",
      [adminName, passwordHash, userByEmail.id]
    );
    console.log(`[seed-admin] ✅ Admin account updated for ${targetEmail}`);
  } else {
    const existingAdmin = await get("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
    if (existingAdmin) {
      await run(
        "UPDATE users SET email = ?, name = ?, password_hash = ?, updated_at = NOW() WHERE id = ?",
        [targetEmail, adminName, passwordHash, existingAdmin.id]
      );
      console.log(`[seed-admin] ✅ Updated existing admin email to ${targetEmail}`);
    } else {
      await run(
        "INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, 'admin', ?)",
        [targetEmail, adminName, passwordHash]
      );
      console.log(`[seed-admin] ✅ Created new admin account for ${targetEmail}`);
    }
  }
}

if (require.main === module) {
  seedAdmin().catch((err) => {
    console.error('[seed-admin] Error:', err);
    process.exit(1);
  });
}

module.exports = { seedAdmin };
