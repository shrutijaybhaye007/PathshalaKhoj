const { get, all, run, exec } = require('./db/connection');

async function fixCourses() {
  console.log('=== college_courses SCHEMA ===');
  const ccCountRow = await get('SELECT COUNT(*) as c FROM college_courses');
  const ccCount = ccCountRow ? parseInt(ccCountRow.c, 10) : 0;
  console.log(`\nTotal rows in college_courses: ${ccCount}`);

  const totalCollegesRow = await get('SELECT COUNT(*) as c FROM colleges');
  const totalCoursesRow  = await get('SELECT COUNT(*) as c FROM courses');
  console.log(`Total colleges: ${totalCollegesRow?.c}, Total courses: ${totalCoursesRow?.c}`);

  if (ccCount === 0) {
    console.log('\n⚠️  college_courses is EMPTY. Creating stream-based course linkages...');
    const allCourses = await all('SELECT id, name, level, degree_type FROM courses');

    const streamCourseMap = {
      'Engineering': allCourses.filter(c=>c.degree_type==='B.Tech'||c.degree_type==='M.Tech'||c.name.toLowerCase().includes('engineering')).map(c=>c.id),
      'Medical':     allCourses.filter(c=>c.name.toLowerCase().includes('medical')||c.name.toLowerCase().includes('pharma')||c.name.toLowerCase().includes('mbbs')||c.name.toLowerCase().includes('nursing')).map(c=>c.id),
      'Management':  allCourses.filter(c=>c.degree_type==='MBA'||c.name.toLowerCase().includes('management')||c.name.toLowerCase().includes('business')).map(c=>c.id),
      'Arts':        allCourses.filter(c=>c.name.toLowerCase().includes('arts')||c.name.toLowerCase().includes('b.a')||c.name.toLowerCase().includes('humanities')).map(c=>c.id),
      'Science':     allCourses.filter(c=>c.name.toLowerCase().includes('science')||c.name.toLowerCase().includes('b.sc')||c.name.toLowerCase().includes('physics')||c.name.toLowerCase().includes('chemistry')).map(c=>c.id),
      'Commerce':    allCourses.filter(c=>c.name.toLowerCase().includes('commerce')||c.name.toLowerCase().includes('b.com')||c.name.toLowerCase().includes('accounting')).map(c=>c.id),
      'Law':         allCourses.filter(c=>c.name.toLowerCase().includes('law')||c.name.toLowerCase().includes('b.l')||c.degree_type==='LLB'||c.degree_type==='LLM').map(c=>c.id),
      'Design':      allCourses.filter(c=>c.name.toLowerCase().includes('design')||c.name.toLowerCase().includes('architecture')).map(c=>c.id),
    };

    const genericCourseIds = allCourses.slice(0,3).map(c=>c.id);
    const colleges = await all('SELECT id, stream FROM colleges');

    let insertCount = 0;
    await exec('BEGIN');
    for (const college of colleges) {
      const courseIds = (streamCourseMap[college.stream] && streamCourseMap[college.stream].length > 0)
        ? streamCourseMap[college.stream]
        : genericCourseIds;
      
      const pick = courseIds.slice(0,3);
      for (const courseId of pick) {
        try {
          await run(
            'INSERT INTO college_courses (college_id, course_id) VALUES (?, ?) ON CONFLICT (college_id, course_id) DO NOTHING',
            [college.id, courseId]
          );
          insertCount++;
        } catch(e) {}
      }
    }
    await exec('COMMIT');
    console.log(`✅ Created ${insertCount.toLocaleString()} college-course linkages`);
  }

  console.log('\nSyncing colleges.total_courses from college_courses...');
  const syncResult = await run(`
    UPDATE colleges 
    SET total_courses = (
      SELECT COUNT(*) FROM college_courses WHERE college_id = colleges.id
    )
  `);
  console.log(`✅ Synced total_courses for colleges`);

  const zeroCourses2Row = await get('SELECT COUNT(*) as c FROM colleges WHERE total_courses=0');
  const avgCoursesRow   = await get('SELECT AVG(total_courses) as a FROM colleges');
  console.log(`\nAfter sync:`);
  console.log(`  Colleges with 0 courses: ${zeroCourses2Row?.c}`);
  console.log(`  Avg courses per college: ${parseFloat(avgCoursesRow?.a || 0).toFixed(1)}`);

  console.log('\n✅ Courses linkage fix complete.');
}

if (require.main === module) {
  fixCourses().catch(console.error);
}

module.exports = { fixCourses };
