const { get, run } = require('./connection');

function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const mhJuniors = [
  {
    name: "St. Xavier's College (Junior College)",
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Government',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: 'A',
    established_year: 1869,
    description: 'An iconic heritage institution in South Mumbai, St. Xavier\'s Junior College offers highly sought-after Class XI & XII programs in Arts and Science with extremely high cutoffs.',
    address: '5, Mahapalika Marg, Dhobi Talao, Fort, Mumbai, Maharashtra',
    pincode: '400001',
    avg_fees_per_year: 2500,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Arts', level: 'Junior', duration_years: 2, seats: 360, fees_per_year: 1500, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Science', level: 'Junior', duration_years: 2, seats: 360, fees_per_year: 2500, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2262-0661', label: 'College Enquiry' },
      { contact_type: 'email', contact_value: 'webmaster@xaviers.edu', label: 'Web Desk' },
      { contact_type: 'website', contact_value: 'https://www.xaviers.edu', label: 'Official Website' }
    ]
  },
  {
    name: 'D.G. Ruparel College of Arts, Science and Commerce (Junior College)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Government',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: 'A',
    established_year: 1952,
    description: 'Located in Matunga West, Ruparel Junior College is legendary for producing state rankers in Class 12th Board Exams (HSC), especially in the Science stream.',
    address: 'Senapati Bapat Marg, Matunga West, Mumbai, Maharashtra',
    pincode: '400016',
    avg_fees_per_year: 3000,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Science', level: 'Junior', duration_years: 2, seats: 480, fees_per_year: 3000, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Commerce', level: 'Junior', duration_years: 2, seats: 360, fees_per_year: 2500, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2430-3733', label: 'General Office' },
      { contact_type: 'website', contact_value: 'http://www.ruparel.edu', label: 'Official Website' }
    ]
  },
  {
    name: 'Mithibai College of Arts, Chauhan Institute of Science (Junior College)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: 'A',
    established_year: 1961,
    description: 'A highly famous junior college in Vile Parle, Mumbai, Mithibai is a cultural hub that offers outstanding academic courses in Arts, Science, and Commerce.',
    address: 'Bhaktivedanta Swami Marg, Vile Parle West, Mumbai, Maharashtra',
    pincode: '400056',
    avg_fees_per_year: 8000,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Arts', level: 'Junior', duration_years: 2, seats: 300, fees_per_year: 7000, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Science', level: 'Junior', duration_years: 2, seats: 400, fees_per_year: 8500, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Commerce', level: 'Junior', duration_years: 2, seats: 500, fees_per_year: 8000, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-4233-9000', label: 'Mithibai Desk' },
      { contact_type: 'website', contact_value: 'https://www.mithibai.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Fergusson College (Junior College)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: 'A+',
    established_year: 1885,
    description: 'The junior college wing of Fergusson College offers premium standard 11th and 12th instruction for Arts and Science streams in Pune.',
    address: 'F.C. Road, Shivajinagar, Pune, Maharashtra',
    pincode: '411004',
    avg_fees_per_year: 4000,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Arts', level: 'Junior', duration_years: 2, seats: 240, fees_per_year: 3500, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Science', level: 'Junior', duration_years: 2, seats: 360, fees_per_year: 4500, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-6765-6000', label: 'Main Office' },
      { contact_type: 'website', contact_value: 'https://www.fergusson.edu', label: 'Official Website' }
    ]
  },
  {
    name: 'Symbiosis School (Junior College)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: 'A',
    established_year: 1983,
    description: 'Symbiosis Junior College Pune offers specialized and comprehensive Class XI & XII training focused on Commerce and Arts with outstanding board results.',
    address: 'Senapati Bapat Road, Pune, Maharashtra',
    pincode: '411004',
    avg_fees_per_year: 20000,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Arts', level: 'Junior', duration_years: 2, seats: 120, fees_per_year: 18000, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Commerce', level: 'Junior', duration_years: 2, seats: 240, fees_per_year: 20000, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2565-2332', label: 'Administration Office' },
      { contact_type: 'website', contact_value: 'https://symbiosisschools.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Laxmanrao Apte Junior College',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Government',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1955,
    description: 'A reputed government-aided junior college located in Deccan Gymkhana, Pune, well-known for its strict academic discipline and Science cutoffs.',
    address: 'Deccan Gymkhana, Pune, Maharashtra',
    pincode: '411004',
    avg_fees_per_year: 2000,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Science', level: 'Junior', duration_years: 2, seats: 240, fees_per_year: 2000, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Arts', level: 'Junior', duration_years: 2, seats: 120, fees_per_year: 1500, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2567-5456', label: 'Apte Enquiry Office' }
    ]
  },
  {
    name: 'Nowrosjee Wadia College (Junior College)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: 'A',
    established_year: 1932,
    description: 'A legacy junior college in Pune offering comprehensive Higher Secondary (HSC) classes in Science and Arts.',
    address: '19, Late Principal V. K. Joag Path, Pune, Maharashtra',
    pincode: '411001',
    avg_fees_per_year: 3000,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Science', level: 'Junior', duration_years: 2, seats: 480, fees_per_year: 3000, entrance_exam: '10th Board Marks' },
      { name: 'Class XI & XII Arts', level: 'Junior', duration_years: 2, seats: 240, fees_per_year: 2200, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2616-2944', label: 'Wadia Desk' },
      { contact_type: 'website', contact_value: 'https://nowrosjeewadiacollege.edu.in', label: 'Official Website' }
    ]
  },
  {
    name: 'PACE Junior Science College',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1999,
    description: 'An integrated junior college in Mumbai popular for synchro-coaching that prepares students for Maharashtra Boards as well as JEE Main/Advanced and NEET.',
    address: 'Andheri West, Mumbai, Maharashtra',
    pincode: '400053',
    avg_fees_per_year: 120000,
    nirf_ranking: null,
    avg_placement_package: null,
    highest_placement_package: null,
    courses: [
      { name: 'Class XI & XII Science (Integrated)', level: 'Junior', duration_years: 2, seats: 360, fees_per_year: 120000, entrance_exam: '10th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2624-1515', label: 'PACE Admissions' },
      { contact_type: 'website', contact_value: 'https://iitianspace.com', label: 'Official Website' }
    ]
  }
];

function seed() {
  console.log('Seeding Maharashtra Junior Colleges...');
  for (const col of mhJuniors) {
    const slug = slugify(col.name, col.city);
    try {
      // 1. Insert College
      const colRes = run(
        `INSERT OR REPLACE INTO colleges (
          name, slug, city, state, stream, college_type, affiliation, naac_grade, established_year,
          description, address, pincode, avg_fees_per_year, nirf_ranking, avg_placement_package,
          highest_placement_package, total_courses
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          col.name,
          slug,
          col.city,
          col.state,
          col.stream,
          col.college_type,
          col.affiliation,
          col.naac_grade,
          col.established_year,
          col.description,
          col.address,
          col.pincode,
          col.avg_fees_per_year,
          col.nirf_ranking,
          col.avg_placement_package,
          col.highest_placement_package,
          col.courses.length
        ]
      );
      
      const collegeId = colRes.lastInsertRowid;
      console.log(`Inserted Junior College: ${col.name} with ID: ${collegeId}`);

      // Clean old records for this college id if overwrite
      run(`DELETE FROM college_courses WHERE college_id = ?`, [collegeId]);
      run(`DELETE FROM college_contacts WHERE college_id = ?`, [collegeId]);

      // 2. Insert Courses
      for (const crs of col.courses) {
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
      console.log(`  Added ${col.courses.length} courses.`);

      // 3. Insert Contacts
      for (const con of col.contacts) {
        run(
          `INSERT INTO college_contacts (college_id, contact_type, contact_value, label)
           VALUES (?, ?, ?, ?)`,
          [collegeId, con.contact_type, con.contact_value, con.label]
        );
      }
      console.log(`  Added ${col.contacts.length} contacts.`);

    } catch (err) {
      console.error(`Failed to insert college ${col.name}:`, err);
    }
  }
  console.log('Finished seeding Maharashtra Junior Colleges.');
}

seed();
