require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { all, run } = require('./connection');

async function cleanAgPatil() {
  const list = await all(`SELECT id, name FROM colleges WHERE name ILIKE '%A G Patil%' OR name ILIKE '%A. G. Patil%'`);
  console.log('Target AG Patil records:', list);

  for (const c of list) {
    let clean = c.name;
    clean = clean.replace(/\s+18\s+2a2\s+Pratanager\s+Soregon\s+Road.*/gi, '');
    clean = clean.replace(/\s+Pratanager\s+Soregon\s+Road.*/gi, '');
    clean = clean.replace(/\s+\d+.*$/gi, '');
    clean = clean.trim();
    if (clean !== c.name) {
      await run(`UPDATE colleges SET name = $1 WHERE id = $2`, [clean, c.id]);
      console.log(`Cleaned AG Patil (${c.id}): "${c.name}" -> "${clean}"`);
    }
  }
  process.exit(0);
}

cleanAgPatil().catch(console.error);
