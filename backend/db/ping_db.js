require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./connection');
console.log('DATABASE_URL prefix:', (process.env.DATABASE_URL || 'NOT SET').substring(0, 40) + '...');
pool.query('SELECT 1 as ping')
  .then(r => { console.log('DB ping OK:', r.rows[0]); return pool.end(); })
  .catch(e => { console.error('DB ping FAILED:', e.code, e.message); process.exit(1); });
