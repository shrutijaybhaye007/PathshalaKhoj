/**
 * fix_contacts_fast.js
 * Fast version: Uses WAL + batched transactions to quickly fix contact data.
 * 
 * Strategy:
 * 1. NULL out ALL contact_email, contact_phone, website (they're all fake/generic)  
 * 2. Populate real contacts from college_contacts table (only ~490 real entries)
 */
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('db/colleges.db');
db.exec('PRAGMA journal_mode=WAL');
db.exec('PRAGMA synchronous=NORMAL');

console.log('Step 1: Clearing all fake contact data in ONE statement...');
// Fastest: update all in one go with no WHERE clause
db.exec('BEGIN');
db.exec("UPDATE colleges SET contact_email=NULL, contact_phone=NULL, website=NULL");
db.exec('COMMIT');
console.log('  ✅ Cleared contact_email, contact_phone, website for all colleges');

// Step 2: Copy real contacts from college_contacts table
console.log('\nStep 2: Restoring real contacts from college_contacts table...');
const realCollegeIds = db.prepare("SELECT DISTINCT college_id FROM college_contacts").all().map(r=>r.college_id);
console.log(`  ${realCollegeIds.length} colleges have real contact entries`);

const setPhone = db.prepare("UPDATE colleges SET contact_phone=(SELECT contact_value FROM college_contacts WHERE college_id=? AND contact_type='phone' LIMIT 1) WHERE id=?");
const setEmail = db.prepare("UPDATE colleges SET contact_email=(SELECT contact_value FROM college_contacts WHERE college_id=? AND contact_type='email' LIMIT 1) WHERE id=?");
const setWeb   = db.prepare("UPDATE colleges SET website=(SELECT contact_value FROM college_contacts WHERE college_id=? AND contact_type='website' LIMIT 1) WHERE id=?");

db.exec('BEGIN');
for(const id of realCollegeIds){
  setPhone.run(id, id);
  setEmail.run(id, id);
  setWeb.run(id, id);
}
db.exec('COMMIT');
console.log(`  ✅ Restored contacts for ${realCollegeIds.length} colleges`);

// Final stats
const total = db.prepare("SELECT COUNT(*) as c FROM colleges").get().c;
const withEmail = db.prepare("SELECT COUNT(*) as c FROM colleges WHERE contact_email IS NOT NULL").get().c;
const withPhone = db.prepare("SELECT COUNT(*) as c FROM colleges WHERE contact_phone IS NOT NULL").get().c;
const withWeb   = db.prepare("SELECT COUNT(*) as c FROM colleges WHERE website IS NOT NULL").get().c;

console.log(`\nFinal contact coverage (${total.toLocaleString()} colleges):`);
console.log(`  Email  : ${withEmail.toLocaleString()} real contacts`);
console.log(`  Phone  : ${withPhone.toLocaleString()} real contacts`);
console.log(`  Website: ${withWeb.toLocaleString()} real contacts`);

// Verify samples
console.log('\nSample colleges WITH real contacts:');
db.prepare('SELECT id, name, contact_phone, contact_email, website FROM colleges WHERE contact_email IS NOT NULL LIMIT 5').all().forEach(r=>
  console.log('  ['+r.id+'] '+r.name.substring(0,35)+'\n    ph:'+r.contact_phone+' | em:'+r.contact_email)
);

console.log('\n✅ Contact fix complete.');
