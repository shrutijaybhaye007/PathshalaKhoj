const { get, run } = require('./connection');

function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const mdCollege = {
  name: 'Maharshi Dayanand College of Arts, Science and Commerce (MD College)',
  city: 'Mumbai',
  state: 'Maharashtra',
  stream: 'Junior College',
  college_type: 'Private',
  affiliation: 'Maharashtra State Board (HSC) & University of Mumbai',
  naac_grade: 'A',
  established_year: 1962,
  description: 'Situated in Parel, Mumbai, Maharshi Dayanand College (popularly known as MD College) is a landmark institution offering quality junior college and degree courses to students in central Mumbai.',
  address: '25, Dr. S.S. Rao Road, Parel, Mumbai, Maharashtra',
  pincode: '400012',
  avg_fees_per_year: 6000,
  nirf_ranking: null,
  avg_placement_package: null,
  highest_placement_package: null,
  courses: [
    { name: 'Class XI & XII Commerce', level: 'Junior', duration_years: 2, seats: 480, fees_per_year: 2200, entrance_exam: '10th Board Marks' },
    { name: 'Class XI & XII Science', level: 'Junior', duration_years: 2, seats: 360, fees_per_year: 2500, entrance_exam: '10th Board Marks' },
    { name: 'Bachelor of Commerce (B.Com)', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 6000, entrance_exam: '12th Board Marks' },
    { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 24000, entrance_exam: '12th Board Marks' }
  ],
  contacts: [
    { contact_type: 'phone', contact_value: '+91-22-2410-4541', label: 'MD College Office' },
    { contact_type: 'email', contact_value: 'principal@mdcollege.in', label: 'Principal Office' },
    { contact_type: 'website', contact_value: 'https://www.mdcollege.in', label: 'Official Website' }
  ]
};

function seed() {
  console.log('Adding Maharshi Dayanand College...');
  const slug = slugify(mdCollege.name, mdCollege.city);
  try {
    const colRes = run(
      `INSERT OR REPLACE INTO colleges (
        name, slug, city, state, stream, college_type, affiliation, naac_grade, established_year,
        description, address, pincode, avg_fees_per_year, nirf_ranking, avg_placement_package,
        highest_placement_package, total_courses
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        mdCollege.name,
        slug,
        mdCollege.city,
        mdCollege.state,
        mdCollege.stream,
        mdCollege.college_type,
        mdCollege.affiliation,
        mdCollege.naac_grade,
        mdCollege.established_year,
        mdCollege.description,
        mdCollege.address,
        mdCollege.pincode,
        mdCollege.avg_fees_per_year,
        mdCollege.nirf_ranking,
        mdCollege.avg_placement_package,
        mdCollege.highest_placement_package,
        mdCollege.courses.length
      ]
    );
    
    const collegeId = colRes.lastInsertRowid;
    console.log(`Inserted college: ${mdCollege.name} with ID: ${collegeId}`);

    // Clean old records
    run(`DELETE FROM college_courses WHERE college_id = ?`, [collegeId]);
    run(`DELETE FROM college_contacts WHERE college_id = ?`, [collegeId]);

    // Insert Courses
    for (const crs of mdCollege.courses) {
      // Find or create course in master courses table
      let courseRow = get('SELECT id FROM courses WHERE name = ? AND level = ?', [crs.name, crs.level]);
      let courseId;
      if (courseRow) {
        courseId = courseRow.id;
      } else {
        const degreeMatch = crs.name.match(/^(B\.Tech|M\.Tech|MBA|MBBS|B\.Sc|M\.Sc|PhD|B\.E\.|M\.E\.|BBA|LLB|LLM)/i);
        const degreeType = degreeMatch ? degreeMatch[1] : null;
        
        const insResult = run(
          `INSERT INTO courses (name, level, duration_years, degree_type)
           VALUES (?, ?, ?, ?)`,
          [crs.name, crs.level, crs.duration_years, degreeType]
        );
        courseId = insResult.lastInsertRowid;
      }

      // Link college to course in college_courses
      run(
        `INSERT OR REPLACE INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam)
         VALUES (?, ?, ?, ?, ?)`,
        [collegeId, courseId, crs.fees_per_year, crs.seats, crs.entrance_exam]
      );
    }
    console.log(`  Added ${mdCollege.courses.length} courses.`);

    // Insert Contacts
    for (const con of mdCollege.contacts) {
      run(
        `INSERT INTO college_contacts (college_id, contact_type, contact_value, label)
         VALUES (?, ?, ?, ?)`,
        [collegeId, con.contact_type, con.contact_value, con.label]
      );
    }
    console.log(`  Added ${mdCollege.contacts.length} contacts.`);

  } catch (err) {
    console.error(`Failed to insert college ${mdCollege.name}:`, err);
  }
}

seed();
