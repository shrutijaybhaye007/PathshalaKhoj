/**
 * db_fix_placement.js
 * Converts any raw rupee values (>= 100000) to LPA by dividing by 100000.
 */
const { get, all, run } = require('./db/connection');

async function fixPlacement() {
  const affectedRow = await get('SELECT COUNT(*) as c FROM colleges WHERE avg_placement_package>=100000');
  const affected = affectedRow ? parseInt(affectedRow.c, 10) : 0;
  console.log(`Found ${affected} colleges with placement >= 100000 (stored in raw rupees)`);

  const result = await run('UPDATE colleges SET avg_placement_package=ROUND(CAST(avg_placement_package AS NUMERIC)/100000.0, 1) WHERE avg_placement_package>=100000');
  console.log(`\nUpdated rows. Placement now stored in LPA for all colleges.`);

  const stats = await get('SELECT MIN(avg_placement_package) as mn, MAX(avg_placement_package) as mx, AVG(avg_placement_package) as av FROM colleges WHERE avg_placement_package>0');
  if (stats) {
    console.log(`\nFinal placement range: ${stats.mn} - ${stats.mx} LPA (avg: ${Math.round(parseFloat(stats.av)*10)/10} LPA)`);
  }
  console.log('\n✅ Placement unit fix complete.');
}

if (require.main === module) {
  fixPlacement().catch(console.error);
}

module.exports = { fixPlacement };
