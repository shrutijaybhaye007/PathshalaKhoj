require('dotenv').config();
const { pool } = require('./connection');

async function fixTitles() {
  await pool.query("UPDATE colleges SET name = 'I.E.S. Institute of Pharmacy, Bhopal' WHERE id = 68576");
  
  // Clean all names starting with '('
  const res = await pool.query("SELECT id, name FROM colleges WHERE name LIKE '(%'");
  for (const c of res.rows) {
    let clean = c.name.replace(/^\([^)]+\)\s*/, '');
    clean = clean.split(/postal address|address:|ph\. no|phone/i)[0].trim();
    clean = clean.replace(/[\s,.\-_]+$/, '');
    if (clean.length >= 3) {
      await pool.query('UPDATE colleges SET name = $1 WHERE id = $2', [clean, c.id]);
    }
  }

  // Verify ID 68576
  const check = await pool.query('SELECT id, name, city, state, placement_rate, contact_email FROM colleges WHERE id = 68576');
  console.table(check.rows);
  await pool.end();
}

fixTitles();
