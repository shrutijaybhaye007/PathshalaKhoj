require('dotenv').config();
const { pool } = require('./connection');
async function checkQuality() {
  const total = await pool.query('SELECT count(*) FROM colleges');
  const unknownCity = await pool.query("SELECT count(*) FROM colleges WHERE city = 'Unknown' OR city IS NULL OR city = ''");
  const numberedPrefix = await pool.query("SELECT count(*) FROM colleges WHERE name ~ '^[0-9.]+'");
  const noFees = await pool.query("SELECT count(*) FROM colleges WHERE avg_fees_per_year IS NULL");
  const podarDesc = await pool.query("SELECT count(*) FROM colleges WHERE description ILIKE '%podar%'");
  const genericUnknown = await pool.query("SELECT count(*) FROM colleges WHERE name ILIKE '%unknown%' OR name ILIKE '%.param%'");
  
  console.log({
    total: parseInt(total.rows[0].count),
    unknownCity: parseInt(unknownCity.rows[0].count),
    numberedPrefix: parseInt(numberedPrefix.rows[0].count),
    noFees: parseInt(noFees.rows[0].count),
    podarDesc: parseInt(podarDesc.rows[0].count),
    genericUnknown: parseInt(genericUnknown.rows[0].count)
  });
  await pool.end();
}
checkQuality();
