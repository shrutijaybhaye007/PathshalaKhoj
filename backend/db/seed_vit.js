const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'colleges.db');
const db = new DatabaseSync(DB_PATH);

console.log('Inserting Vidyalankar Institute of Technology (VIT)...');

try {
  db.exec('BEGIN TRANSACTION;');
  
  // 1. Insert College
  const insertCollegeStmt = db.prepare(`
    INSERT INTO colleges (
      name, slug, city, state, stream, college_type, 
      established_year, description, website, total_courses,
      avg_fees_per_year, hostel_available, campus_size, naac_grade, affiliation
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const info = insertCollegeStmt.run(
    'Vidyalankar Institute of Technology', 
    'vidyalankar-institute-of-technology-mumbai',
    'Mumbai',
    'Maharashtra',
    'Engineering',
    'Private',
    1999,
    'Vidyalankar Institute of Technology (VIT) is an engineering degree college in Wadala, Mumbai, affiliated with the University of Mumbai. It offers B.Tech, M.Tech, and MMS programs with state-of-the-art infrastructure.',
    'vit.edu.in',
    0,
    150000,
    0, // Usually doesn't have an on-campus hostel (they provide private PG assistance)
    '11 Acres',
    'A+',
    'University of Mumbai'
  );
  
  const collegeId = info.lastInsertRowid;
  
  // 2. Insert or get master courses
  const insertCourseStmt = db.prepare('INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?, ?, ?, ?)');
  const getCourseStmt = db.prepare('SELECT id FROM courses WHERE name = ?');
  
  const coursesToMap = [
    { name: 'B.Tech Computer Engineering', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
    { name: 'B.Tech Information Technology', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
    { name: 'B.Tech Electronics and Telecommunication Engineering', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
    { name: 'B.Tech Biomedical Engineering', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 60, exam: 'MHT CET / JEE Main' },
    { name: 'B.Tech Electronics and Computer Science', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
    { name: 'Master of Management Studies (MMS)', level: 'PG', duration: 2, degree: 'MMS', fees: 135000, seats: 120, exam: 'MAH MBA CET / CAT / XAT' },
    { name: 'M.Tech Computer Engineering', level: 'PG', duration: 2, degree: 'M.Tech', fees: 140000, seats: 18, exam: 'GATE' }
  ];
  
  const insertMappingStmt = db.prepare(`
    INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  for (const c of coursesToMap) {
    let row = getCourseStmt.get(c.name);
    let courseId;
    if (row) {
      courseId = row.id;
    } else {
      const cInfo = insertCourseStmt.run(c.name, c.level, c.duration, c.degree);
      courseId = cInfo.lastInsertRowid;
    }
    
    insertMappingStmt.run(collegeId, courseId, c.fees, c.seats, c.exam, c.level === 'UG' ? '12th Pass with PCM (45%)' : 'Graduation with 50%');
    count++;
  }
  
  db.prepare('UPDATE colleges SET total_courses = ? WHERE id = ?').run(count, collegeId);
  
  db.exec('COMMIT;');
  console.log('Successfully added Vidyalankar Institute of Technology (VIT) with', count, 'courses mapped!');
} catch (e) {
  db.exec('ROLLBACK;');
  console.error('Failed:', e);
}
