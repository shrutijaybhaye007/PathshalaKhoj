require('dotenv').config();
const { pool } = require('./connection');

async function fixPathankot() {
  await pool.query("UPDATE colleges SET city = 'Pathankot', state = 'Punjab' WHERE name ILIKE '%Pathankot%'");
  const res = await pool.query("SELECT id, name, city, state FROM colleges WHERE name ILIKE '%Pathankot%'");
  console.table(res.rows);
  await pool.end();
}

fixPathankot();
