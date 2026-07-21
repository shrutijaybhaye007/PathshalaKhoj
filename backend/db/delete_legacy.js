'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./connection');

async function deleteLegacy() {
  console.log('🗑️ Deleting legacy college rows from Neon...\n');
  
  const res = await pool.query("DELETE FROM colleges WHERE data_source = 'legacy'");
  console.log(`✅ Deleted ${res.rowCount} legacy rows.`);
  
  const stats = await pool.query('SELECT count(*) as c FROM colleges');
  console.log(`📊 Remaining colleges in DB: ${stats.rows[0].c}`);
  
  await pool.end();
}

deleteLegacy().catch(e => { console.error('❌', e.message); process.exit(1); });
