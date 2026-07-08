const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'colleges.db');
const db = new DatabaseSync(DB_PATH);

console.log('Starting comprehensive realistic courses seeding...');

// Master list of realistic courses grouped by stream
const masterCoursesData = {
  'Engineering': [
    { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Mechanical Engineering', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Civil Engineering', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Electronics and Communication', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Electrical Engineering', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Information Technology', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Chemical Engineering', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Aerospace Engineering', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Biotechnology', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'B.Tech Artificial Intelligence and Data Science', level: 'UG', duration: 4, degree: 'B.Tech' },
    { name: 'M.Tech Computer Science', level: 'PG', duration: 2, degree: 'M.Tech' },
    { name: 'M.Tech Structural Engineering', level: 'PG', duration: 2, degree: 'M.Tech' },
    { name: 'M.Tech VLSI Design', level: 'PG', duration: 2, degree: 'M.Tech' },
    { name: 'M.Tech Thermal Engineering', level: 'PG', duration: 2, degree: 'M.Tech' },
    { name: 'Ph.D in Engineering', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Medical': [
    { name: 'MBBS - Bachelor of Medicine and Bachelor of Surgery', level: 'UG', duration: 5.5, degree: 'MBBS' },
    { name: 'BDS - Bachelor of Dental Surgery', level: 'UG', duration: 5, degree: 'BDS' },
    { name: 'B.Sc Nursing', level: 'UG', duration: 4, degree: 'B.Sc' },
    { name: 'B.Pharm - Bachelor of Pharmacy', level: 'UG', duration: 4, degree: 'B.Pharm' },
    { name: 'BPT - Bachelor of Physiotherapy', level: 'UG', duration: 4.5, degree: 'BPT' },
    { name: 'MD General Medicine', level: 'PG', duration: 3, degree: 'MD' },
    { name: 'MS General Surgery', level: 'PG', duration: 3, degree: 'MS' },
    { name: 'MD Pediatrics', level: 'PG', duration: 3, degree: 'MD' },
    { name: 'MDS Oral and Maxillofacial Surgery', level: 'PG', duration: 3, degree: 'MDS' }
  ],
  'Management': [
    { name: 'MBA - Master of Business Administration', level: 'PG', duration: 2, degree: 'MBA' },
    { name: 'MBA Finance', level: 'PG', duration: 2, degree: 'MBA' },
    { name: 'MBA Marketing', level: 'PG', duration: 2, degree: 'MBA' },
    { name: 'MBA Human Resource Management', level: 'PG', duration: 2, degree: 'MBA' },
    { name: 'BBA - Bachelor of Business Administration', level: 'UG', duration: 3, degree: 'BBA' },
    { name: 'PGDM - Post Graduate Diploma in Management', level: 'PG', duration: 2, degree: 'PGDM' },
    { name: 'BMS - Bachelor of Management Studies', level: 'UG', duration: 3, degree: 'BMS' },
    { name: 'Ph.D in Management', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Arts': [
    { name: 'B.A. English Honors', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. Economics', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. Political Science', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. History', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. Psychology', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. Sociology', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'M.A. English', level: 'PG', duration: 2, degree: 'M.A.' },
    { name: 'M.A. Economics', level: 'PG', duration: 2, degree: 'M.A.' },
    { name: 'Ph.D in Humanities', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Commerce': [
    { name: 'B.Com - Bachelor of Commerce', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'B.Com (Hons.)', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'B.Com Accounting and Finance', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'B.Com Banking and Insurance', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'M.Com - Master of Commerce', level: 'PG', duration: 2, degree: 'M.Com' },
    { name: 'CA - Chartered Accountancy', level: 'Certificate', duration: 4, degree: 'CA' },
    { name: 'CS - Company Secretary', level: 'Certificate', duration: 3, degree: 'CS' }
  ],
  'Science': [
    { name: 'B.Sc Physics', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Chemistry', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Mathematics', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Computer Science', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Information Technology', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Biotechnology', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'M.Sc Physics', level: 'PG', duration: 2, degree: 'M.Sc' },
    { name: 'M.Sc Mathematics', level: 'PG', duration: 2, degree: 'M.Sc' },
    { name: 'Ph.D in Science', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Law': [
    { name: 'BA LLB (Hons.)', level: 'UG', duration: 5, degree: 'BA LLB' },
    { name: 'BBA LLB', level: 'UG', duration: 5, degree: 'BBA LLB' },
    { name: 'LLB - Bachelor of Laws', level: 'UG', duration: 3, degree: 'LLB' },
    { name: 'LLM - Master of Laws', level: 'PG', duration: 2, degree: 'LLM' },
    { name: 'Ph.D in Law', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Design': [
    { name: 'B.Des Fashion Design', level: 'UG', duration: 4, degree: 'B.Des' },
    { name: 'B.Des Interior Design', level: 'UG', duration: 4, degree: 'B.Des' },
    { name: 'B.Des Product Design', level: 'UG', duration: 4, degree: 'B.Des' },
    { name: 'B.Sc Animation and VFX', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'M.Des - Master of Design', level: 'PG', duration: 2, degree: 'M.Des' }
  ]
};

// Flatten to a master dictionary, preventing duplicates just in case
const uniqueCourses = {};
for (const stream in masterCoursesData) {
  for (const c of masterCoursesData[stream]) {
    if (!uniqueCourses[c.name]) {
      uniqueCourses[c.name] = { ...c, assignedStream: stream };
    }
  }
}

const masterCoursesList = Object.values(uniqueCourses);

try {
  // 1. Insert master courses
  db.exec('BEGIN TRANSACTION;');
  
  const insertCourseStmt = db.prepare('INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?, ?, ?, ?)');
  
  // Track inserted courses to get their SQLite IDs
  const courseIdMap = {}; // name -> id
  
  for (const c of masterCoursesList) {
    const info = insertCourseStmt.run(c.name, c.level, c.duration, c.degree);
    courseIdMap[c.name] = info.lastInsertRowid;
  }
  
  console.log(`Inserted ${masterCoursesList.length} master courses.`);
  
  // 2. Fetch all colleges
  const collegesStmt = db.prepare('SELECT id, stream, avg_fees_per_year FROM colleges');
  const colleges = collegesStmt.all();
  console.log(`Found ${colleges.length} colleges.`);
  
  // 3. Map courses to colleges
  const insertMappingStmt = db.prepare(`
    INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const updateCollegeStmt = db.prepare('UPDATE colleges SET total_courses = ? WHERE id = ?');
  
  let totalMappings = 0;
  
  const getExams = (stream, level) => {
    if (stream === 'Engineering' && level === 'UG') return 'JEE Main';
    if (stream === 'Medical' && level === 'UG') return 'NEET UG';
    if (stream === 'Management' && level === 'PG') return 'CAT';
    if (stream === 'Law' && level === 'UG') return 'CLAT';
    return null;
  };
  
  const getEligibility = (level) => {
    if (level === 'UG') return '10+2 with 50% aggregate';
    if (level === 'PG') return 'Graduation with 50%';
    if (level === 'Ph.D') return 'Post Graduation with 55%';
    return '10+2 passing certificate';
  };

  for (const college of colleges) {
    let stream = college.stream;
    
    // Fallback if college stream doesn't exactly match our keys
    if (!masterCoursesData[stream]) {
      stream = 'Arts'; // fallback
    }
    
    const availableCourses = masterCoursesData[stream] || [];
    
    // Pick 10 to 15 courses for each college. If available courses are less, pick all.
    const numCourses = Math.min(availableCourses.length, Math.floor(Math.random() * 6) + 10);
    
    // Shuffle and pick
    const shuffled = [...availableCourses].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, numCourses);
    
    let baseFees = college.avg_fees_per_year || 100000;
    
    for (const c of selected) {
      const courseId = courseIdMap[c.name];
      
      // Slight randomization of fees and seats per course per college
      const fees = Math.floor(baseFees * (0.8 + Math.random() * 0.4));
      const seats = Math.floor(Math.random() * 120) + 30; // 30 to 150
      const exam = getExams(stream, c.level);
      const eligibility = getEligibility(c.level);
      
      insertMappingStmt.run(college.id, courseId, fees, seats, exam, eligibility);
      totalMappings++;
    }
    
    updateCollegeStmt.run(selected.length, college.id);
  }
  
  db.exec('COMMIT;');
  console.log(`Successfully mapped ${totalMappings} courses across ${colleges.length} colleges.`);
  
} catch (e) {
  db.exec('ROLLBACK;');
  console.error('Seeding failed:', e);
}
