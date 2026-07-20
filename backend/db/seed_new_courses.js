const { get, all, run, exec } = require('./connection');

console.log('Starting comprehensive realistic courses seeding...');

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
    { name: 'B.A. Psychology', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. Political Science', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. Economics', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'B.A. Journalism and Mass Communication', level: 'UG', duration: 3, degree: 'B.A.' },
    { name: 'M.A. English', level: 'PG', duration: 2, degree: 'M.A.' },
    { name: 'M.A. Clinical Psychology', level: 'PG', duration: 2, degree: 'M.A.' },
    { name: 'Ph.D in Humanities', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Commerce': [
    { name: 'B.Com General', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'B.Com Honors', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'B.Com Accounting and Finance (BAF)', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'B.Com Banking and Insurance (BBI)', level: 'UG', duration: 3, degree: 'B.Com' },
    { name: 'M.Com Finance', level: 'PG', duration: 2, degree: 'M.Com' },
    { name: 'M.Com Advanced Accountancy', level: 'PG', duration: 2, degree: 'M.Com' }
  ],
  'Science': [
    { name: 'B.Sc Physics', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Chemistry', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Mathematics', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Computer Science', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Information Technology', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Biotechnology', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'B.Sc Microbiology', level: 'UG', duration: 3, degree: 'B.Sc' },
    { name: 'M.Sc Organic Chemistry', level: 'PG', duration: 2, degree: 'M.Sc' },
    { name: 'M.Sc Computer Science', level: 'PG', duration: 2, degree: 'M.Sc' },
    { name: 'Ph.D in Science', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Law': [
    { name: 'BA LLB (Hons)', level: 'UG', duration: 5, degree: 'BA LLB' },
    { name: 'BBA LLB (Hons)', level: 'UG', duration: 5, degree: 'BBA LLB' },
    { name: 'LLB - Bachelor of Laws', level: 'UG', duration: 3, degree: 'LLB' },
    { name: 'LLM Corporate Law', level: 'PG', duration: 1, degree: 'LLM' },
    { name: 'LLM Constitutional Law', level: 'PG', duration: 1, degree: 'LLM' },
    { name: 'Ph.D in Law', level: 'Ph.D', duration: 3, degree: 'Ph.D' }
  ],
  'Design': [
    { name: 'B.Des Fashion Design', level: 'UG', duration: 4, degree: 'B.Des' },
    { name: 'B.Des Industrial Design', level: 'UG', duration: 4, degree: 'B.Des' },
    { name: 'B.Des Communication Design', level: 'UG', duration: 4, degree: 'B.Des' },
    { name: 'M.Des Industrial Design', level: 'PG', duration: 2, degree: 'M.Des' }
  ]
};

async function seedNewCourses() {
  try {
    await exec('BEGIN;');

    const courseIdMap = {};
    for (const [stream, coursesList] of Object.entries(masterCoursesData)) {
      for (const c of coursesList) {
        let existing = await get('SELECT id FROM courses WHERE name = ? AND level = ?', [c.name, c.level]);
        if (!existing) {
          const res = await run(
            'INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?, ?, ?, ?)',
            [c.name, c.level, c.duration, c.degree]
          );
          courseIdMap[c.name] = res.lastInsertRowid;
        } else {
          courseIdMap[c.name] = existing.id;
        }
      }
    }

    const colleges = await all('SELECT id, stream, avg_fees_per_year FROM colleges');
    let totalMappings = 0;

    const getExams = (stream, level) => {
      if (stream === 'Engineering') return level === 'UG' ? 'JEE Main / MHT CET' : 'GATE';
      if (stream === 'Medical') return level === 'UG' ? 'NEET UG' : 'NEET PG';
      if (stream === 'Management') return level === 'PG' ? 'CAT / MAH MBA CET' : 'Merit Based';
      if (stream === 'Law') return 'CLAT / MAH Law CET';
      if (stream === 'Design') return 'NIFT / UCEED';
      return 'Merit Based / University Entrance';
    };

    const getEligibility = (level) => {
      if (level === 'UG') return '10+2 with 50% aggregate';
      if (level === 'PG') return 'Graduation in relevant discipline with 55%';
      if (level === 'Ph.D') return 'Post Graduation with 55%';
      return '10+2 passing certificate';
    };

    for (const college of colleges) {
      let stream = college.stream;
      if (!masterCoursesData[stream]) {
        stream = 'Arts';
      }
      
      const availableCourses = masterCoursesData[stream] || [];
      const numCourses = Math.min(availableCourses.length, Math.floor(Math.random() * 6) + 10);
      const shuffled = [...availableCourses].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numCourses);
      
      let baseFees = college.avg_fees_per_year || 100000;
      
      for (const c of selected) {
        const courseId = courseIdMap[c.name];
        const fees = Math.floor(baseFees * (0.8 + Math.random() * 0.4));
        const seats = Math.floor(Math.random() * 120) + 30;
        const exam = getExams(stream, c.level);
        const eligibility = getEligibility(c.level);
        
        await run(
          `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (college_id, course_id) DO NOTHING`,
          [college.id, courseId, fees, seats, exam, eligibility]
        );
        totalMappings++;
      }
      
      await run('UPDATE colleges SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = ?) WHERE id = ?', [college.id, college.id]);
    }
    
    await exec('COMMIT;');
    console.log(`Successfully mapped ${totalMappings} courses across ${colleges.length} colleges.`);
  } catch (e) {
    try { await exec('ROLLBACK;'); } catch (_) {}
    console.error('Seeding failed:', e);
  }
}

if (require.main === module) {
  seedNewCourses().catch(console.error);
}

module.exports = { seedNewCourses };
