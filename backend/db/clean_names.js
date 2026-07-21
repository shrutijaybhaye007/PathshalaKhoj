require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { all, run } = require('./connection');

async function cleanNames() {
  console.log('🔍 Checking for college names with address fragments...');
  
  const allColleges = await all(`SELECT id, name FROM colleges`);
  console.log(`Auditing ${allColleges.length} colleges for address fragments in titles...`);

  let updatedCount = 0;
  for (const c of allColleges) {
    let clean = c.name;
    // Strip house/plot numbers and address fragments like "18 2a2 Pratanager Soregon Road"
    clean = clean.replace(/\s+\d+\s+\d*[a-zA-Z0-9]+\s+[A-Za-z0-9\s]+$/gi, '');
    clean = clean.replace(/\s+\d{2,}\s+[A-Za-z0-9\s]+$/gi, '');
    clean = clean.replace(/\s+18\s+2a2\s+Pratanager\s+Soregon\s+Road$/gi, '');
    clean = clean.replace(/\s+Pratanager\s+Soregon\s+Road$/gi, '');
    clean = clean.trim();

    if (clean !== c.name && clean.length > 5) {
      await run(`UPDATE colleges SET name = $1 WHERE id = $2`, [clean, c.id]);
      updatedCount++;
      console.log(`Cleaned (${c.id}): "${c.name}" -> "${clean}"`);
    }
  }

  console.log(`✅ Cleaned ${updatedCount} college titles in database!`);
  process.exit(0);
}

cleanNames().catch(console.error);
