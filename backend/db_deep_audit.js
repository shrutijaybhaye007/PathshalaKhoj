const { get, all } = require('./db/connection');

async function deepAudit() {
  console.log('=== COURSES TABLE COLUMNS ===');
  const courseCols = await all("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses'");
  courseCols.forEach(r => console.log('  col:', r.column_name, '| type:', r.data_type));

  console.log('\n=== COURSES SAMPLE (3 rows) ===');
  const sampleCourses = await all('SELECT * FROM courses LIMIT 3');
  sampleCourses.forEach(r => console.log(JSON.stringify(r)));

  console.log('\n=== ALL TABLE NAMES ===');
  const tables = await all("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  tables.forEach(r => console.log(' ', r.table_name));

  console.log('\n=== COLLEGES TABLE COLUMNS ===');
  const collegeCols = await all("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'colleges'");
  collegeCols.forEach(r => console.log('  col:', r.column_name, '| type:', r.data_type));

  console.log('\n=== 5 SAMPLE DUPLICATE (name+state) ENTRIES ===');
  const dupes = await all(`SELECT name, state, COUNT(*) as cnt FROM colleges 
     GROUP BY name, state HAVING COUNT(*)>1 
     ORDER BY cnt DESC LIMIT 5`);
  dupes.forEach(r => console.log('  "' + r.name.substring(0,40) + '" | ' + r.state + ' | count:' + r.cnt));

  console.log('\n=== RAW-RUPEE PLACEMENT COLLEGES (first 20) ===');
  const raw160 = await all('SELECT id, name, avg_placement_package, state FROM colleges WHERE avg_placement_package>=100000 LIMIT 20');
  raw160.forEach(r => console.log('  [' + r.id + '] ' + r.name.substring(0,45) + ' | ' + r.avg_placement_package + ' | ' + r.state));

  if (raw160.length > 0) {
    const asLPA = raw160.map(r => parseFloat(r.avg_placement_package) / 100000);
    console.log('\n  When divided by 100000 (to get LPA):');
    console.log('  Min LPA:', Math.min(...asLPA).toFixed(1), '| Max LPA:', Math.max(...asLPA).toFixed(1), '| Avg LPA:', (asLPA.reduce((a,b)=>a+b,0)/asLPA.length).toFixed(1));
  }
}

if (require.main === module) {
  deepAudit().catch(console.error);
}

module.exports = { deepAudit };
