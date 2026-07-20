const { get, all, run, exec } = require('./connection');

console.log('Inserting Vidyalankar Polytechnic...');

async function seedVidyalankar() {
  try {
    await exec('BEGIN;');
    
    const info = await run(
      `INSERT INTO colleges (
        name, slug, city, state, stream, college_type, 
        established_year, description, website, total_courses,
        avg_fees_per_year, hostel_available, campus_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (slug) DO NOTHING`,
      [
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
      ]
    );
    
    let college = await get('SELECT id FROM colleges WHERE slug = ?', ['vidyalankar-polytechnic-mumbai']);
    if (college) {
      const collegeId = college.id;
      const courses = await all("SELECT id FROM courses WHERE name ILIKE '%Diploma in Computer Science%' OR name ILIKE '%Diploma in Information Technology%' OR name ILIKE '%Diploma in Mechanical Engineering%' OR name ILIKE '%Diploma in Electrical Engineering%'");
      
      let count = 0;
      for (const c of courses) {
        await run(
          `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam, eligibility)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT (college_id, course_id) DO NOTHING`,
          [collegeId, c.id, 55000, 60, null, '10th Pass with 35%']
        );
        count++;
      }
      
      await run('UPDATE colleges SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = ?) WHERE id = ?', [collegeId, collegeId]);
      console.log('Successfully added Vidyalankar Polytechnic with', count, 'courses!');
    }

    await exec('COMMIT;');
  } catch (e) {
    try { await exec('ROLLBACK;'); } catch (_) {}
    console.error('Failed:', e);
  }
}

if (require.main === module) {
  seedVidyalankar().catch(console.error);
}

module.exports = { seedVidyalankar };
