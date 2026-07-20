/**
 * db_fix_contacts.js
 * Strategy:
 * 1. NULL out ALL contact_email, contact_phone, website (they're all fake/generic)  
 * 2. Populate real contacts from college_contacts table
 */
const { get, all, run, exec } = require('./db/connection');

async function fixContacts() {
  console.log('Step 1: Clearing all fake contact data...');
  await run("UPDATE colleges SET contact_email=NULL, contact_phone=NULL, website=NULL");
  console.log('  ✅ Cleared contact_email, contact_phone, website for all colleges');

  console.log('\nStep 2: Restoring real contacts from college_contacts table...');
  const realColleges = await all("SELECT DISTINCT college_id FROM college_contacts");
  const realCollegeIds = realColleges.map(r => r.college_id);
  console.log(`  ${realCollegeIds.length} colleges have real contact entries`);

  for (const id of realCollegeIds) {
    await run("UPDATE colleges SET contact_phone=(SELECT contact_value FROM college_contacts WHERE college_id=? AND contact_type='phone' LIMIT 1) WHERE id=?", [id, id]);
    await run("UPDATE colleges SET contact_email=(SELECT contact_value FROM college_contacts WHERE college_id=? AND contact_type='email' LIMIT 1) WHERE id=?", [id, id]);
    await run("UPDATE colleges SET website=(SELECT contact_value FROM college_contacts WHERE college_id=? AND contact_type='website' LIMIT 1) WHERE id=?", [id, id]);
  }
  console.log(`  ✅ Restored contacts for ${realCollegeIds.length} colleges`);

  const totalRow = await get("SELECT COUNT(*) as c FROM colleges");
  const withEmailRow = await get("SELECT COUNT(*) as c FROM colleges WHERE contact_email IS NOT NULL");
  const withPhoneRow = await get("SELECT COUNT(*) as c FROM colleges WHERE contact_phone IS NOT NULL");
  const withWebRow   = await get("SELECT COUNT(*) as c FROM colleges WHERE website IS NOT NULL");

  console.log(`\nFinal contact coverage (${totalRow?.c} colleges):`);
  console.log(`  Email  : ${withEmailRow?.c} real contacts`);
  console.log(`  Phone  : ${withPhoneRow?.c} real contacts`);
  console.log(`  Website: ${withWebRow?.c} real contacts`);

  console.log('\n✅ Contact fix complete.');
}

if (require.main === module) {
  fixContacts().catch(console.error);
}

module.exports = { fixContacts };
