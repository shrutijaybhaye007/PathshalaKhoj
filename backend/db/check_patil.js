require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { get, all } = require('./connection');

async function checkPatil() {
  const list = await all(`SELECT id, name, city, state FROM colleges WHERE name ILIKE '%Patil%' AND (name ILIKE '%Ag%' OR name ILIKE '%Solapur%' OR name ILIKE '%Technology%') LIMIT 5`);
  console.log('College records:', list);
  process.exit(0);
}

checkPatil().catch(console.error);
