require('dotenv').config();
const { pool } = require('./connection');

async function run() {
  console.log('🧹 Starting Database Refinement & Deduplication...');
  
  // Find duplicate names
  const dupsQuery = `
    SELECT name, array_agg(id ORDER BY data_verified DESC, id ASC) as ids
    FROM colleges
    GROUP BY name
    HAVING count(*) > 1
  `;
  
  const res = await pool.query(dupsQuery);
  const duplicates = res.rows;
  
  if (duplicates.length === 0) {
    console.log('✅ No duplicates found! Database is clean.');
    await pool.end();
    return;
  }
  
  console.log(`🔍 Found ${duplicates.length} colleges with duplicate names. Cleaning up...`);
  
  let deletedCount = 0;
  for (const row of duplicates) {
    const keepId = row.ids[0]; // The first one is either verified or the oldest
    const deleteIds = row.ids.slice(1);
    
    // Delete the duplicates (cascades to college_courses automatically)
    await pool.query('DELETE FROM colleges WHERE id = ANY($1::int[])', [deleteIds]);
    deletedCount += deleteIds.length;
    
    console.log(`   - Kept "${row.name}" (ID: ${keepId}), deleted ${deleteIds.length} duplicate(s)`);
  }
  
  console.log(`\n✅ Refinement complete! Deleted ${deletedCount} duplicate rows.`);
  await pool.end();
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
