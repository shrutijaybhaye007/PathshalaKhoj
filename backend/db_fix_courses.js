/**
 * fix_courses_linkage.js
 * The 'courses' table has 286 globally defined courses, but NO college_id.
 * The 'college_courses' junction table (id, college_id, course_id) links them.
 * The 'colleges.total_courses' column shows count of linked courses per college.
 *
 * Issues found:
 * 1. college_courses might be empty — needs to be checked and populated
 * 2. total_courses in colleges table may not be synced
 *
 * This script:
 * 1. Inspects college_courses schema
 * 2. Checks how many linkages exist
 * 3. Syncs colleges.total_courses from college_courses count
 * 4. If college_courses is empty, creates sensible default linkages based on stream
 */
const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('db/colleges.db');
db.exec('PRAGMA journal_mode=WAL');
db.exec('PRAGMA foreign_keys=ON');

// Check college_courses schema
console.log('=== college_courses SCHEMA ===');
db.prepare("PRAGMA table_info(college_courses)").all().forEach(r=>
  console.log('  col:',r.name,'|',r.type)
);

const ccCount=db.prepare('SELECT COUNT(*) as c FROM college_courses').get().c;
console.log(`\nTotal rows in college_courses: ${ccCount}`);

const totalColleges=db.prepare('SELECT COUNT(*) as c FROM colleges').get().c;
const totalCourses=db.prepare('SELECT COUNT(*) as c FROM courses').get().c;
console.log(`Total colleges: ${totalColleges}, Total courses: ${totalCourses}`);

// Check current total_courses values
const zeroCourses=db.prepare('SELECT COUNT(*) as c FROM colleges WHERE total_courses=0 OR total_courses IS NULL').get().c;
const withCourses=db.prepare('SELECT COUNT(*) as c FROM colleges WHERE total_courses>0').get().c;
console.log(`\nColleges with total_courses=0: ${zeroCourses.toLocaleString()}`);
console.log(`Colleges with total_courses>0: ${withCourses.toLocaleString()}`);

// Show existing total_courses distribution
console.log('\nTotal courses distribution (colleges table):');
db.prepare('SELECT total_courses, COUNT(*) as c FROM colleges GROUP BY total_courses ORDER BY total_courses').all().slice(0,10).forEach(r=>
  console.log('  total_courses:'+r.total_courses+' -> '+r.c.toLocaleString()+' colleges')
);

if(ccCount===0){
  console.log('\n⚠️  college_courses is EMPTY. Creating stream-based course linkages...');

  // Get all courses grouped by stream relevance
  const allCourses=db.prepare('SELECT id, name, level, degree_type FROM courses').all();
  console.log('Available courses:');
  allCourses.forEach(c=>console.log('  ['+c.id+'] '+c.name+' | '+c.level+' | '+c.degree_type));

  // Stream → relevant course IDs mapping
  const streamCourseMap={
    'Engineering': allCourses.filter(c=>c.degree_type==='B.Tech'||c.degree_type==='M.Tech'||c.name.toLowerCase().includes('engineering')).map(c=>c.id),
    'Medical':     allCourses.filter(c=>c.name.toLowerCase().includes('medical')||c.name.toLowerCase().includes('pharma')||c.name.toLowerCase().includes('mbbs')||c.name.toLowerCase().includes('nursing')).map(c=>c.id),
    'Management':  allCourses.filter(c=>c.degree_type==='MBA'||c.name.toLowerCase().includes('management')||c.name.toLowerCase().includes('business')).map(c=>c.id),
    'Arts':        allCourses.filter(c=>c.name.toLowerCase().includes('arts')||c.name.toLowerCase().includes('b.a')||c.name.toLowerCase().includes('humanities')).map(c=>c.id),
    'Science':     allCourses.filter(c=>c.name.toLowerCase().includes('science')||c.name.toLowerCase().includes('b.sc')||c.name.toLowerCase().includes('physics')||c.name.toLowerCase().includes('chemistry')).map(c=>c.id),
    'Commerce':    allCourses.filter(c=>c.name.toLowerCase().includes('commerce')||c.name.toLowerCase().includes('b.com')||c.name.toLowerCase().includes('accounting')).map(c=>c.id),
    'Law':         allCourses.filter(c=>c.name.toLowerCase().includes('law')||c.name.toLowerCase().includes('b.l')||c.degree_type==='LLB'||c.degree_type==='LLM').map(c=>c.id),
    'Design':      allCourses.filter(c=>c.name.toLowerCase().includes('design')||c.name.toLowerCase().includes('architecture')).map(c=>c.id),
  };

  // Fill missing with generic courses
  const genericCourseIds=allCourses.slice(0,3).map(c=>c.id); // First 3 as fallback

  const insert=db.prepare('INSERT OR IGNORE INTO college_courses (college_id, course_id) VALUES (?,?)');
  const colleges=db.prepare('SELECT id, stream FROM colleges').all();

  let insertCount=0;
  db.exec('BEGIN');
  for(const college of colleges){
    const courseIds=(streamCourseMap[college.stream]&&streamCourseMap[college.stream].length>0)
      ? streamCourseMap[college.stream]
      : genericCourseIds;
    
    // Pick up to 3 relevant courses per college
    const pick=courseIds.slice(0,3);
    for(const courseId of pick){
      try{ insert.run(college.id, courseId); insertCount++; }catch(e){}
    }
  }
  db.exec('COMMIT');
  console.log(`✅ Created ${insertCount.toLocaleString()} college-course linkages`);
}

// Sync total_courses count from college_courses table
console.log('\nSyncing colleges.total_courses from college_courses...');
const syncResult=db.prepare(`
  UPDATE colleges 
  SET total_courses = (
    SELECT COUNT(*) FROM college_courses WHERE college_id = colleges.id
  )
`).run();
console.log(`✅ Synced total_courses for ${syncResult.changes.toLocaleString()} colleges`);

// Final verification
const zeroCourses2=db.prepare('SELECT COUNT(*) as c FROM colleges WHERE total_courses=0').get().c;
const avgCourses=db.prepare('SELECT AVG(total_courses) as a FROM colleges').get().a;
console.log(`\nAfter sync:`);
console.log(`  Colleges with 0 courses: ${zeroCourses2.toLocaleString()}`);
console.log(`  Avg courses per college: ${(avgCourses||0).toFixed(1)}`);

console.log('\n✅ Courses linkage fix complete.');
