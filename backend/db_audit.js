/**
 * db_audit.js — Comprehensive database quality audit for PathshalaKhoj
 * Run from backend/: node db_audit.js
 */
const { get, all } = require('./db/connection');

async function runAudit() {
  console.log('\n' + '='.repeat(70));
  console.log('PathshalaKhoj — Database Quality Audit');
  console.log('='.repeat(70));

  const totalRow = await get('SELECT COUNT(*) as c FROM colleges');
  const totalCoursesRow = await get('SELECT COUNT(*) as c FROM courses');
  const totalContactsRow = await get('SELECT COUNT(*) as c FROM college_contacts');
  const totalReviewsRow  = await get('SELECT COUNT(*) as c FROM college_reviews');

  const total = totalRow ? parseInt(totalRow.c, 10) : 0;
  const totalCourses = totalCoursesRow ? parseInt(totalCoursesRow.c, 10) : 0;
  const totalContacts = totalContactsRow ? parseInt(totalContactsRow.c, 10) : 0;
  const totalReviews  = totalReviewsRow ? parseInt(totalReviewsRow.c, 10) : 0;

  console.log(`\n📊 TOTALS`);
  console.log(`   Colleges  : ${total.toLocaleString()}`);
  console.log(`   Courses   : ${totalCourses.toLocaleString()}`);
  console.log(`   Contacts  : ${totalContacts.toLocaleString()}`);
  console.log(`   Reviews   : ${totalReviews.toLocaleString()}`);

  const fields = [
    'name','description','college_type','stream','state','city','address',
    'naac_grade','nirf_ranking','established_year','avg_fees_per_year',
    'avg_placement_package','website','contact_email','contact_phone',
    'logo_url','facilities','top_recruiters','scholarships_info',
    'hostel_available','placement_rate'
  ];

  console.log('\n📋 FIELD COMPLETENESS:');
  for (const f of fields) {
    try {
      const row = await get(`SELECT COUNT(*) as c FROM colleges WHERE ${f} IS NOT NULL AND TRIM(CAST(${f} AS TEXT)) != ''`);
      const cnt = row ? parseInt(row.c, 10) : 0;
      const pct = total > 0 ? Math.round(cnt / total * 100) : 0;
      const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5));
      console.log(`   ${f.padEnd(25)} ${bar} ${pct.toString().padStart(3)}%  (${cnt}/${total})`);
    } catch(e) {}
  }
}

if (require.main === module) {
  runAudit().catch(console.error);
}

module.exports = { runAudit };
