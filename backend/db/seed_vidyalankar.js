const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'colleges.db');
const db = new DatabaseSync(DB_PATH);

console.log('Inserting Vidyalankar Polytechnic...');

try {
  db.exec('BEGIN TRANSACTION;');
  
  const insertCollegeStmt = db.prepare(`
    INSERT INTO colleges (
      name, slug, city, state, stream, college_type, 
      established_year, description, website, total_courses,
      avg_fees_per_year, hostel_available, campus_size
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const info = insertCollegeStmt.run(
    'Vidyalankar Polytechnic', 
    'vidyalankar-polytechnic-mumbai',
    'Mumbai',
    'Maharashtra',
    'Engineering',
    'Private',
    2002,
    'Vidyalankar Polytechnic is a premier engineering college in Mumbai offering high-quality technical education and diploma courses.',
    'vpt.edu.in',
    0,
    55000,
    0,
    '11 Acres'
  );
  
  const collegeId = info.lastInsertRowid;
  
  // Find diploma courses to map
  const coursesStmt = db.prepare("SELECT id FROM courses WHERE name LIKE '%Diploma in Computer Science%' OR name LIKE '%Diploma in Information Technology%' OR name LIKE '%Diploma in Mechanical Engineering%' OR name LIKE '%Diploma in Electrical Engineering%'");
  const courses = coursesStmt.all();
  
  const insertMappingStmt = db.prepare(`
    INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  let count = 0;
  for (const c of courses) {
    insertMappingStmt.run(collegeId, c.id, 55000, 60, null, '10th Pass with 35%');
    count++;
  }
  
  db.prepare('UPDATE colleges SET total_courses = ? WHERE id = ?').run(count, collegeId);
  
  db.exec('COMMIT;');
  console.log('Successfully added Vidyalankar Polytechnic with', count, 'courses!');
} catch (e) {
  db.exec('ROLLBACK;');
  console.error('Failed:', e);
}
