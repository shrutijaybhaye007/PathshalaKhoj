/**
 * fix_placement_units.js
 * The 160 top colleges have avg_placement_package stored in raw rupees
 * (e.g. 700000 = ₹7,00,000). The rest of the DB stores in LPA (e.g. 6.5).
 * This script converts those 160 to LPA by dividing by 100000.
 */
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('db/colleges.db');
db.exec('PRAGMA journal_mode=WAL');

const affected=db.prepare('SELECT COUNT(*) as c FROM colleges WHERE avg_placement_package>=100000').get().c;
console.log(`Found ${affected} colleges with placement >= 100000 (stored in raw rupees)`);

// Preview before fixing
console.log('\nBefore fix (first 5):');
db.prepare('SELECT id,name,avg_placement_package FROM colleges WHERE avg_placement_package>=100000 LIMIT 5').all().forEach(r=>
  console.log('  ['+r.id+'] '+r.name.substring(0,40)+' | raw:'+r.avg_placement_package+' => LPA:'+(r.avg_placement_package/100000).toFixed(1))
);

// Apply fix
const result=db.prepare('UPDATE colleges SET avg_placement_package=ROUND(avg_placement_package/100000.0,1) WHERE avg_placement_package>=100000').run();
console.log(`\nUpdated ${result.changes} rows. Placement now stored in LPA for all colleges.`);

// Verify
console.log('\nAfter fix (first 5):');
db.prepare('SELECT id,name,avg_placement_package FROM colleges WHERE id<=5').all().forEach(r=>
  console.log('  ['+r.id+'] '+r.name.substring(0,40)+' | LPA:'+r.avg_placement_package)
);

// Final range check
const stats=db.prepare('SELECT MIN(avg_placement_package) as mn, MAX(avg_placement_package) as mx, AVG(avg_placement_package) as av FROM colleges WHERE avg_placement_package>0').get();
console.log(`\nFinal placement range: ${stats.mn} - ${stats.mx} LPA (avg: ${Math.round(stats.av*10)/10} LPA)`);
console.log('\n✅ Placement unit fix complete.');
