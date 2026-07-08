const { get, run } = require('./connection');

function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const mhColleges = [
  {
    name: 'College of Engineering Pune (COEP) Tech University',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'Autonomous University (Government of Maharashtra)',
    naac_grade: 'A',
    established_year: 1854,
    description: 'One of the oldest and most prestigious engineering institutes in India, COEP is famed for its stellar academic research, campus culture, and highly selective admission process.',
    address: 'Wellesley Road, Shivajinagar, Pune, Maharashtra',
    pincode: '411005',
    avg_fees_per_year: 90000,
    nirf_ranking: 73,
    avg_placement_package: 7.8,
    highest_placement_package: 38.0,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 90000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 88000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Electronics & Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 90000, entrance_exam: 'MHT CET' },
      { name: 'M.Tech Structural Engineering', level: 'PG', duration_years: 2, seats: 18, fees_per_year: 110000, entrance_exam: 'GATE' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2550-7000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@coep.org.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.coep.org.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Veermata Jijabai Technological Institute (VJTI)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'University of Mumbai',
    naac_grade: 'A',
    established_year: 1887,
    description: 'A premier engineering college in Mumbai known for its top-tier placements, robust alumni network, and competitive student community.',
    address: 'H. R. Mahajani Road, Matunga, Mumbai, Maharashtra',
    pincode: '400019',
    avg_fees_per_year: 82000,
    nirf_ranking: 75,
    avg_placement_package: 8.5,
    highest_placement_package: 44.0,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 82000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Information Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 82000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Electronics Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 82000, entrance_exam: 'MHT CET' },
      { name: 'M.Tech Computer Engineering', level: 'PG', duration_years: 2, seats: 25, fees_per_year: 90000, entrance_exam: 'GATE' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2419-8101', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@vjti.ac.in', label: 'Director Office' },
      { contact_type: 'website', contact_value: 'https://www.vjti.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Institute of Chemical Technology (ICT) Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'Deemed University, AICTE',
    naac_grade: 'A++',
    established_year: 1933,
    description: 'A world-renowned university focused on chemical engineering, chemical technology, pharmacy, and biotechnology research.',
    address: 'Nathalal Parekh Marg, Matunga, Mumbai, Maharashtra',
    pincode: '400019',
    avg_fees_per_year: 85000,
    nirf_ranking: 24,
    avg_placement_package: 8.2,
    highest_placement_package: 42.0,
    courses: [
      { name: 'B.Tech Chemical Engineering', level: 'UG', duration_years: 4, seats: 75, fees_per_year: 85200, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Food Engineering & Technology', level: 'UG', duration_years: 4, seats: 18, fees_per_year: 85200, entrance_exam: 'MHT CET' },
      { name: 'B.Pharm', level: 'UG', duration_years: 4, seats: 30, fees_per_year: 85200, entrance_exam: 'MHT CET' },
      { name: 'M.Tech Chemical Engineering', level: 'PG', duration_years: 2, seats: 20, fees_per_year: 92000, entrance_exam: 'GATE' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-3361-1111', label: 'General Desk' },
      { contact_type: 'email', contact_value: 'registrar@ictmumbai.edu.in', label: 'Registrar Office' },
      { contact_type: 'website', contact_value: 'https://www.ictmumbai.edu.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Jamnalal Bajaj Institute of Management Studies (JBIMS)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Management',
    college_type: 'Government',
    affiliation: 'University of Mumbai',
    naac_grade: 'A',
    established_year: 1965,
    description: 'Popularly known as the "CEO Factory of India," JBIMS is one of the premier business schools offering Master of Management Studies (MMS).',
    address: '164, Backbay Reclamation, H.T. Parekh Marg, Churchgate, Mumbai, Maharashtra',
    pincode: '400020',
    avg_fees_per_year: 300000,
    nirf_ranking: 35,
    avg_placement_package: 28.0,
    highest_placement_package: 44.0,
    courses: [
      { name: 'MMS (Master of Management Studies)', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 300000, entrance_exam: 'MAH CET' },
      { name: 'M.Sc. Finance', level: 'PG', duration_years: 2, seats: 40, fees_per_year: 350000, entrance_exam: 'CAT' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2202-4555', label: 'Admissions Desk' },
      { contact_type: 'email', contact_value: 'admissions@jbims.edu', label: 'Admissions' },
      { contact_type: 'website', contact_value: 'https://www.jbims.edu', label: 'Official Website' }
    ]
  },
  {
    name: 'S.P. Jain Institute of Management and Research (SPJIMR)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Management',
    college_type: 'Private',
    affiliation: 'AICTE',
    naac_grade: 'A',
    established_year: 1981,
    description: 'A leading top-tier business school in Mumbai recognized for its value-based education, global outlook, and strong campus placements.',
    address: "Bhavan's Campus, Munshi Nagar, Dadabhai Road, Andheri West, Mumbai, Maharashtra",
    pincode: '400058',
    avg_fees_per_year: 1050000,
    nirf_ranking: 20,
    avg_placement_package: 33.0,
    highest_placement_package: 53.0,
    courses: [
      { name: 'PGDM (Post Graduate Diploma in Management)', level: 'PG', duration_years: 2, seats: 240, fees_per_year: 1050000, entrance_exam: 'CAT' },
      { name: 'PGPM (PG Program in Management)', level: 'PG', duration_years: 1.5, seats: 120, fees_per_year: 1200000, entrance_exam: 'GMAT' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2623-0396', label: 'General Office' },
      { contact_type: 'email', contact_value: 'admissions.pgdm@spjimr.org', label: 'PGDM Admissions' },
      { contact_type: 'website', contact_value: 'https://www.spjimr.org', label: 'Official Website' }
    ]
  },
  {
    name: 'B.J. Government Medical College (BJMC)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'Maharashtra University of Health Sciences',
    naac_grade: 'A',
    established_year: 1946,
    description: 'A historic medical college in Pune, Maharashtra associated with the Sasoon General Hospitals, providing advanced healthcare training.',
    address: 'Jai Prakash Narayan Road, Pune, Maharashtra',
    pincode: '411001',
    avg_fees_per_year: 125000,
    nirf_ranking: 40,
    avg_placement_package: 8.5,
    highest_placement_package: 18.0,
    courses: [
      { name: 'MBBS (Bachelor of Medicine & Surgery)', level: 'UG', duration_years: 5.5, seats: 250, fees_per_year: 125000, entrance_exam: 'NEET' },
      { name: 'MD General Medicine', level: 'PG', duration_years: 3, seats: 15, fees_per_year: 140000, entrance_exam: 'NEET PG' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2612-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'bjmc-pune@gov.in', label: 'Registrar Office' },
      { contact_type: 'website', contact_value: 'https://www.bjmc.edu.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Government Law College (GLC) Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Law',
    college_type: 'Government',
    affiliation: 'University of Mumbai',
    naac_grade: 'A',
    established_year: 1855,
    description: 'The oldest law school in Asia, GLC Mumbai is known for pioneering legal education in India and boasts a legendary list of alumni including chief justices.',
    address: 'A Road, Churchgate, Mumbai, Maharashtra',
    pincode: '400020',
    avg_fees_per_year: 8000,
    nirf_ranking: 25,
    avg_placement_package: 8.0,
    highest_placement_package: 18.0,
    courses: [
      { name: 'BA LLB 5 Years', level: 'UG', duration_years: 5, seats: 160, fees_per_year: 8000, entrance_exam: 'MHT CET' },
      { name: 'LLB 3 Years', level: 'UG', duration_years: 3, seats: 320, fees_per_year: 6000, entrance_exam: 'MHT CET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2204-7075', label: 'Admissions Desk' },
      { contact_type: 'email', contact_value: 'glcadmissions@gmail.com', label: 'Admissions Mail' },
      { contact_type: 'website', contact_value: 'https://www.glcmumbai.com', label: 'Official Website' }
    ]
  },
  {
    name: 'ILS Law College',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Law',
    college_type: 'Private',
    affiliation: 'Savitribai Phule Pune University',
    naac_grade: 'A+',
    established_year: 1924,
    description: 'A highly recognized law college in Pune offering dynamic moot court competitions, legal clinics, and comprehensive placement programs.',
    address: 'Chiplunkar Road, Law College Road, Pune, Maharashtra',
    pincode: '411004',
    avg_fees_per_year: 40000,
    nirf_ranking: 23,
    avg_placement_package: 7.0,
    highest_placement_package: 16.0,
    courses: [
      { name: 'BA LLB 5 Years', level: 'UG', duration_years: 5, seats: 240, fees_per_year: 40000, entrance_exam: 'MHT CET' },
      { name: 'LLB 3 Years', level: 'UG', duration_years: 3, seats: 160, fees_per_year: 36000, entrance_exam: 'MHT CET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2565-6775', label: 'ILS Admin' },
      { contact_type: 'email', contact_value: 'ilsprincip@gmail.com', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://ilslaw.edu', label: 'Official Website' }
    ]
  }
];

function seed() {
  console.log('Seeding prestigious Maharashtra colleges...');
  for (const col of mhColleges) {
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
      console.log(`Inserted college: ${col.name} with ID: ${collegeId}`);

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
  console.log('Finished seeding Maharashtra colleges.');
}

seed();
