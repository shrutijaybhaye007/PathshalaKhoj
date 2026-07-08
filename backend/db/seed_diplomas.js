const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'colleges.db');
const db = new DatabaseSync(DB_PATH);

console.log('Starting Diploma courses seeding...');

// Master list of Diploma courses grouped by stream
const diplomaCoursesData = {
  'Engineering': [
    { name: 'Diploma in Mechanical Engineering', level: 'Diploma', duration: 3, degree: 'Diploma' },
    { name: 'Diploma in Civil Engineering', level: 'Diploma', duration: 3, degree: 'Diploma' },
    { name: 'Diploma in Computer Science', level: 'Diploma', duration: 3, degree: 'Diploma' },
    { name: 'Diploma in Electrical Engineering', level: 'Diploma', duration: 3, degree: 'Diploma' }
  ],
  'Medical': [
    { name: 'D.Pharm - Diploma in Pharmacy', level: 'Diploma', duration: 2, degree: 'Diploma' },
    { name: 'Diploma in Nursing', level: 'Diploma', duration: 3, degree: 'Diploma' },
    { name: 'Diploma in Medical Lab Technology', level: 'Diploma', duration: 2, degree: 'Diploma' }
  ],
  'Management': [
    { name: 'Diploma in Business Administration', level: 'Diploma', duration: 1, degree: 'Diploma' },
    { name: 'Diploma in Retail Management', level: 'Diploma', duration: 1, degree: 'Diploma' }
  ],
  'Arts': [
    { name: 'Diploma in Fine Arts', level: 'Diploma', duration: 1, degree: 'Diploma' },
    { name: 'Diploma in Digital Marketing', level: 'Diploma', duration: 1, degree: 'Diploma' }
  ],
  'Commerce': [
    { name: 'Diploma in Financial Accounting', level: 'Diploma', duration: 1, degree: 'Diploma' },
    { name: 'Diploma in Taxation', level: 'Diploma', duration: 1, degree: 'Diploma' }
  ],
  'Science': [
    { name: 'Diploma in Information Technology', level: 'Diploma', duration: 3, degree: 'Diploma' }
  ],
  'Law': [
    { name: 'Diploma in Cyber Law', level: 'Diploma', duration: 1, degree: 'Diploma' },
    { name: 'Diploma in Corporate Law', level: 'Diploma', duration: 1, degree: 'Diploma' }
  ],
  'Design': [
    { name: 'Diploma in Graphic Design', level: 'Diploma', duration: 1, degree: 'Diploma' },
    { name: 'Diploma in Fashion Design', level: 'Diploma', duration: 1, degree: 'Diploma' },
    { name: 'Diploma in Interior Design', level: 'Diploma', duration: 1, degree: 'Diploma' }
  ]
};

// Flatten to a master dictionary, preventing duplicates just in case
const uniqueCourses = {};
for (const stream in diplomaCoursesData) {
  for (const c of diplomaCoursesData[stream]) {
    if (!uniqueCourses[c.name]) {
      uniqueCourses[c.name] = { ...c, assignedStream: stream };
    }
  }
}

const masterCoursesList = Object.values(uniqueCourses);

try {
  db.exec('BEGIN TRANSACTION;');
  
  const insertCourseStmt = db.prepare('INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?, ?, ?, ?)');
  
  // Track inserted courses to get their SQLite IDs
  const courseIdMap = {}; // name -> id
  
  for (const c of masterCoursesList) {
    const info = insertCourseStmt.run(c.name, c.level, c.duration, c.degree);
    courseIdMap[c.name] = info.lastInsertRowid;
  }
  
  console.log(`Inserted ${masterCoursesList.length} master Diploma courses.`);
  
  // Fetch all colleges
  const collegesStmt = db.prepare('SELECT id, stream, avg_fees_per_year FROM colleges');
  const colleges = collegesStmt.all();
  console.log(`Found ${colleges.length} colleges.`);
  
  // Map courses to colleges
  const insertMappingStmt = db.prepare(`
    INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const updateCollegeStmt = db.prepare('UPDATE colleges SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = ?) WHERE id = ?');
  
  let totalMappings = 0;
  
  for (const college of colleges) {
    let stream = college.stream;
    
    // Fallback if college stream doesn't exactly match our keys
    if (!diplomaCoursesData[stream]) {
      stream = 'Arts'; // fallback
    }
    
    const availableCourses = diplomaCoursesData[stream] || [];
    
    // Pick 1 to 3 diploma courses for each college. If available courses are less, pick all.
    const numCourses = Math.min(availableCourses.length, Math.floor(Math.random() * 3) + 1);
    
    // Shuffle and pick
    const shuffled = [...availableCourses].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numCourses);
    
    let baseFees = college.avg_fees_per_year ? college.avg_fees_per_year * 0.4 : 40000; // Diplomas are usually cheaper
    
    for (const c of selected) {
      const courseId = courseIdMap[c.name];
      
      const fees = Math.floor(baseFees * (0.8 + Math.random() * 0.4));
      const seats = Math.floor(Math.random() * 60) + 30; // 30 to 90
      const exam = null; // Diplomas usually Merit Based
      const eligibility = '10th / 12th pass';
      
      insertMappingStmt.run(college.id, courseId, fees, seats, exam, eligibility);
      totalMappings++;
    }
    
    updateCollegeStmt.run(college.id, college.id);
  }
  
  db.exec('COMMIT;');
  console.log(`Successfully mapped ${totalMappings} Diploma courses across ${colleges.length} colleges.`);
  
} catch (e) {
  db.exec('ROLLBACK;');
  console.error('Seeding failed:', e);
}
