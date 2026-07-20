const { get, all, run, exec } = require('./connection');

console.log('Inserting Vidyalankar Institute of Technology (VIT)...');

async function seedVit() {
  try {
    await exec('BEGIN;');
    
    await run(
      `INSERT INTO colleges (
        name, slug, city, state, stream, college_type, 
        established_year, description, website, total_courses,
        avg_fees_per_year, hostel_available, campus_size, naac_grade, affiliation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (slug) DO NOTHING`,
      [
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
        0,
        '11 Acres',
        'A+',
        'University of Mumbai'
      ]
    );

    const college = await get('SELECT id FROM colleges WHERE slug = ?', ['vidyalankar-institute-of-technology-mumbai']);
    if (college) {
      const collegeId = college.id;
      const coursesToMap = [
        { name: 'B.Tech Computer Engineering', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
        { name: 'B.Tech Information Technology', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
        { name: 'B.Tech Electronics and Telecommunication Engineering', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
        { name: 'B.Tech Biomedical Engineering', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 60, exam: 'MHT CET / JEE Main' },
        { name: 'B.Tech Electronics and Computer Science', level: 'UG', duration: 4, degree: 'B.Tech', fees: 155000, seats: 120, exam: 'MHT CET / JEE Main' },
        { name: 'Master of Management Studies (MMS)', level: 'PG', duration: 2, degree: 'MMS', fees: 135000, seats: 120, exam: 'MAH MBA CET / CAT / XAT' },
        { name: 'M.Tech Computer Engineering', level: 'PG', duration: 2, degree: 'M.Tech', fees: 140000, seats: 18, exam: 'GATE' }
      ];

      let count = 0;
      for (const c of coursesToMap) {
        let courseRow = await get('SELECT id FROM courses WHERE name = ?', [c.name]);
        let courseId;
        if (!courseRow) {
          const res = await run('INSERT INTO courses (name, level, duration_years, degree_type) VALUES (?, ?, ?, ?)', [c.name, c.level, c.duration, c.degree]);
          courseId = res.lastInsertRowid;
        } else {
          courseId = courseRow.id;
        }

        await run(
          `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (college_id, course_id) DO NOTHING`,
          [collegeId, courseId, c.fees, c.seats, c.exam, '10+2 with 45% aggregate']
        );
        count++;
      }

      await run('UPDATE colleges SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = ?) WHERE id = ?', [collegeId, collegeId]);
      console.log('Successfully added Vidyalankar Institute of Technology with', count, 'courses!');
    }

    await exec('COMMIT;');
  } catch (e) {
    try { await exec('ROLLBACK;'); } catch (_) {}
    console.error('Failed:', e);
  }
}

if (require.main === module) {
  seedVit().catch(console.error);
}

module.exports = { seedVit };
