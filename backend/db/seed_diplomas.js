const { get, all, run, exec } = require('./connection');

console.log('Starting Diploma courses seeding...');

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
    { name: 'Diploma in Interior Design', level: 'Diploma', duration: 1, degree: 'Diploma' }
  ]
};

async function seedDiplomas() {
  try {
    await exec('BEGIN;');

    const courseIdMap = {};
    for (const [stream, coursesList] of Object.entries(diplomaCoursesData)) {
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

    for (const college of colleges) {
      let stream = college.stream;
      if (!diplomaCoursesData[stream]) {
        stream = 'Arts';
      }
      
      const availableCourses = diplomaCoursesData[stream] || [];
      const numCourses = Math.min(availableCourses.length, Math.floor(Math.random() * 3) + 1);
      const shuffled = [...availableCourses].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, numCourses);
      
      let baseFees = college.avg_fees_per_year ? college.avg_fees_per_year * 0.4 : 40000;
      
      for (const c of selected) {
        const courseId = courseIdMap[c.name];
        const fees = Math.floor(baseFees * (0.8 + Math.random() * 0.4));
        const seats = Math.floor(Math.random() * 60) + 30;
        const eligibility = '10th / 12th pass';
        
        await run(
          `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (college_id, course_id) DO NOTHING`,
          [college.id, courseId, fees, seats, null, eligibility]
        );
        totalMappings++;
      }
      
      await run(
        'UPDATE colleges SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = ?) WHERE id = ?',
        [college.id, college.id]
      );
    }
    
    await exec('COMMIT;');
    console.log(`Successfully mapped ${totalMappings} Diploma courses across ${colleges.length} colleges.`);
  } catch (e) {
    try { await exec('ROLLBACK;'); } catch (_) {}
    console.error('Seeding failed:', e);
  }
}

if (require.main === module) {
  seedDiplomas().catch(console.error);
}

module.exports = { seedDiplomas };
