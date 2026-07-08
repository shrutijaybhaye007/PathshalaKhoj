const { get, run } = require('./connection');

function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const mhCollegesBatch2 = [
  {
    name: 'Walchand College of Engineering (WCE)',
    city: 'Sangli',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'Government-Aided Autonomous, Shivaji University',
    naac_grade: 'A',
    established_year: 1947,
    description: 'A legacy government-aided engineering institution in Sangli, Maharashtra, famous for its strong competitive programming culture and academic excellence.',
    address: 'Vishrambag, Sangli, Maharashtra',
    pincode: '416415',
    avg_fees_per_year: 85000,
    nirf_ranking: 168,
    avg_placement_package: 6.8,
    highest_placement_package: 33.0,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 85000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Information Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 85000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 82000, entrance_exam: 'MHT CET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-233-2300383', label: 'Office' },
      { contact_type: 'email', contact_value: 'info@walchandsangli.ac.in', label: 'General Enquiry' },
      { contact_type: 'website', contact_value: 'http://www.walchandsangli.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Sardar Patel College of Engineering (SPCE)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'Government-Aided Autonomous, University of Mumbai',
    naac_grade: 'A',
    established_year: 1962,
    description: 'Located in Andheri, Mumbai, SPCE is an iconic government-aided autonomous engineering institute offering strong traditional core branch specializations.',
    address: 'Bhavans Campus, Munshi Nagar, Andheri West, Mumbai, Maharashtra',
    pincode: '400058',
    avg_fees_per_year: 84000,
    nirf_ranking: 180,
    avg_placement_package: 7.2,
    highest_placement_package: 30.0,
    courses: [
      { name: 'B.Tech Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 84000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 84000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 84000, entrance_exam: 'MHT CET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2623-2191', label: 'Admissions Office' },
      { contact_type: 'email', contact_value: 'principal@spce.ac.in', label: 'Principal' },
      { contact_type: 'website', contact_value: 'https://www.spce.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Sardar Patel Institute of Technology (SPIT)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'Autonomous, University of Mumbai',
    naac_grade: 'A+',
    established_year: 1995,
    description: 'A top-ranked private engineering institute in Mumbai, SPIT offers state-of-the-art computer science, IT, and electronics facilities.',
    address: 'Munshi Nagar, Andheri West, Mumbai, Maharashtra',
    pincode: '400058',
    avg_fees_per_year: 170000,
    nirf_ranking: 125,
    avg_placement_package: 8.5,
    highest_placement_package: 42.0,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 170000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Computer Science & Eng (AI & ML)', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 170000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Electronics & Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 170000, entrance_exam: 'MHT CET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2670-7025', label: 'Enquiry Office' },
      { contact_type: 'email', contact_value: 'info@spit.ac.in', label: 'Admissions Support' },
      { contact_type: 'website', contact_value: 'https://www.spit.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Pune Institute of Computer Technology (PICT)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'Savitribai Phule Pune University',
    naac_grade: 'A+',
    established_year: 1983,
    description: 'Widely regarded as the top private engineering college in Pune for computer science, coding hackathons, and placement rates.',
    address: 'Survey No. 27, Near Trimurti Chowk, Dhankawadi, Pune, Maharashtra',
    pincode: '411043',
    avg_fees_per_year: 130000,
    nirf_ranking: 130,
    avg_placement_package: 8.2,
    highest_placement_package: 40.0,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 130000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Information Technology', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 130000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Electronics & Telecommunication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 130000, entrance_exam: 'MHT CET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2437-1101', label: 'Administration Desk' },
      { contact_type: 'email', contact_value: 'principal@pict.edu', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://pict.edu', label: 'Official Website' }
    ]
  },
  {
    name: 'Vishwakarma Institute of Technology (VIT) Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'Autonomous, Savitribai Phule Pune University',
    naac_grade: 'A++',
    established_year: 1983,
    description: 'An elite private autonomous college offering diverse undergraduate courses with strong industry partnerships and projects.',
    address: '666, Upper Indiranagar, Bibwewadi, Pune, Maharashtra',
    pincode: '411037',
    avg_fees_per_year: 180000,
    nirf_ranking: 155,
    avg_placement_package: 6.5,
    highest_placement_package: 32.0,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 180000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Artificial Intelligence & Data Science', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 180000, entrance_exam: 'MHT CET' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 175000, entrance_exam: 'MHT CET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2420-2180', label: 'General Desk' },
      { contact_type: 'email', contact_value: 'admissions@vit.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.vit.edu', label: 'Official Website' }
    ]
  },
  {
    name: 'Fergusson College (Autonomous)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Science',
    college_type: 'Private',
    affiliation: 'Autonomous, Savitribai Phule Pune University',
    naac_grade: 'A+',
    established_year: 1885,
    description: 'Fergusson College is a landmark institution in Pune, offering exceptional science and arts degrees on its iconic, sprawling heritage campus.',
    address: 'F.C. Road, Shivajinagar, Pune, Maharashtra',
    pincode: '411004',
    avg_fees_per_year: 12000,
    nirf_ranking: 57,
    avg_placement_package: 4.5,
    highest_placement_package: 12.0,
    courses: [
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 180, fees_per_year: 22000, entrance_exam: '12th Board Marks' },
      { name: 'B.Sc Physics', level: 'UG', duration_years: 3, seats: 80, fees_per_year: 8000, entrance_exam: '12th Board Marks' },
      { name: 'M.Sc Biotechnology', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 65000, entrance_exam: 'CUET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-6765-6000', label: 'Main Office' },
      { contact_type: 'email', contact_value: 'adm.fc@fergusson.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.fergusson.edu', label: 'Official Website' }
    ]
  },
  {
    name: 'Symbiosis Law School (SLS) Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Law',
    college_type: 'Private',
    affiliation: 'Deemed University, Symbiosis International University',
    naac_grade: 'A++',
    established_year: 1977,
    description: 'A top-3 law school in India, SLS Pune is highly regarded for its comprehensive corporate law internships, global moot courts, and excellent placement rates.',
    address: 'Survey No 227, Plot No. 11, Rohan Mithila, Viman Nagar, Pune, Maharashtra',
    pincode: '411014',
    avg_fees_per_year: 380000,
    nirf_ranking: 6,
    avg_placement_package: 8.5,
    highest_placement_package: 20.0,
    courses: [
      { name: 'BBA LLB (Hons) 5 Years', level: 'UG', duration_years: 5, seats: 180, fees_per_year: 380000, entrance_exam: 'SLAT' },
      { name: 'BA LLB (Hons) 5 Years', level: 'UG', duration_years: 5, seats: 120, fees_per_year: 380000, entrance_exam: 'SLAT' },
      { name: 'LLM Corporate Law', level: 'PG', duration_years: 1, seats: 80, fees_per_year: 170000, entrance_exam: 'AILET' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2655-1100', label: 'Law Desk' },
      { contact_type: 'email', contact_value: 'admissions@symbiosislaw.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.symbiosislaw.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Armed Forces Medical College (AFMC)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'Maharashtra University of Health Sciences & Ministry of Defence',
    naac_grade: 'A',
    established_year: 1948,
    description: 'A premier national medical institute operated by the Indian Armed Forces, providing medical training with guaranteed commission as medical officers.',
    address: 'Wanowrie, Pune, Maharashtra',
    pincode: '411040',
    avg_fees_per_year: 32000,
    nirf_ranking: 30,
    avg_placement_package: 12.0,
    highest_placement_package: 22.0,
    courses: [
      { name: 'MBBS (Bachelor of Medicine & Surgery)', level: 'UG', duration_years: 5.5, seats: 150, fees_per_year: 32000, entrance_exam: 'NEET' },
      { name: 'MD Anaesthesiology', level: 'PG', duration_years: 3, seats: 10, fees_per_year: 40000, entrance_exam: 'NEET PG' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2633-4201', label: 'AFMC Desk' },
      { contact_type: 'email', contact_value: 'admissions.afmc@nic.in', label: 'Defence Admissions' },
      { contact_type: 'website', contact_value: 'https://www.afmc.nic.in', label: 'Official Website' }
    ]
  },
  {
    name: 'National Institute of Bank Management (NIBM)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Management',
    college_type: 'Autonomous',
    affiliation: 'Established by RBI, Approved by AICTE',
    naac_grade: 'A',
    established_year: 1969,
    description: 'An autonomous research and training institute established by the Reserve Bank of India, specializing in PGDM (Banking & Financial Services).',
    address: 'NIBM Post Office, Kondhwe Khurd, Pune, Maharashtra',
    pincode: '411048',
    avg_fees_per_year: 800000,
    nirf_ranking: 76,
    avg_placement_package: 15.2,
    highest_placement_package: 24.0,
    courses: [
      { name: 'PGDM (Banking & Financial Services)', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 800000, entrance_exam: 'CAT' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2671-6000', label: 'Admissions Office' },
      { contact_type: 'email', contact_value: 'pgdm@nibmindia.org', label: 'Admissions Support' },
      { contact_type: 'website', contact_value: 'http://www.nibmindia.org', label: 'Official Website' }
    ]
  },
  {
    name: 'Sydenham College of Commerce and Economics',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Commerce',
    college_type: 'Government',
    affiliation: 'University of Mumbai',
    naac_grade: 'A',
    established_year: 1913,
    description: 'The oldest commerce college in India, Sydenham is known for its excellent commerce education and key location in South Mumbai.',
    address: 'B-Road, Churchgate, Mumbai, Maharashtra',
    pincode: '400020',
    avg_fees_per_year: 8000,
    nirf_ranking: 90,
    avg_placement_package: 5.5,
    highest_placement_package: 14.0,
    courses: [
      { name: 'B.Com (Bachelor of Commerce)', level: 'UG', duration_years: 3, seats: 600, fees_per_year: 8000, entrance_exam: '12th Board Marks' },
      { name: 'M.Com', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 10000, entrance_exam: '12th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2204-2897', label: 'Main Desk' },
      { contact_type: 'email', contact_value: 'sydenham@gov.in', label: 'College Office' },
      { contact_type: 'website', contact_value: 'http://www.sydenham.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'R.A. Podar College of Commerce and Economics',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Commerce',
    college_type: 'Private',
    affiliation: 'Autonomous, University of Mumbai',
    naac_grade: 'A+',
    established_year: 1941,
    description: 'An autonomous commerce college in Matunga, Mumbai, known for its academic rigor, cultural activities, and high cutoffs.',
    address: 'L.N. Road, Matunga, Mumbai, Maharashtra',
    pincode: '400019',
    avg_fees_per_year: 10000,
    nirf_ranking: 85,
    avg_placement_package: 5.8,
    highest_placement_package: 13.0,
    courses: [
      { name: 'B.Com (Bachelor of Commerce)', level: 'UG', duration_years: 3, seats: 480, fees_per_year: 10000, entrance_exam: '12th Board Marks' },
      { name: 'Bachelor of Management Studies (BMS)', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 18000, entrance_exam: '12th Board Marks' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2414-3178', label: 'Podar Office' },
      { contact_type: 'email', contact_value: 'podarcollege@gmail.com', label: 'Admissions' },
      { contact_type: 'website', contact_value: 'http://www.rapodar.ac.in', label: 'Official Website' }
    ]
  },
  {
    name: 'Symbiosis Institute of Design (SID)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Design',
    college_type: 'Private',
    affiliation: 'Symbiosis International University',
    naac_grade: 'A',
    established_year: 2004,
    description: 'A leading design institute in Pune offering communication design, industrial design, and fashion communication programs.',
    address: 'Viman Nagar, Pune, Maharashtra',
    pincode: '411014',
    avg_fees_per_year: 420000,
    nirf_ranking: 15,
    avg_placement_package: 6.0,
    highest_placement_package: 14.0,
    courses: [
      { name: 'B.Des Communication Design', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 420000, entrance_exam: 'SEED' },
      { name: 'B.Des Fashion Communication', level: 'UG', duration_years: 4, seats: 40, fees_per_year: 420000, entrance_exam: 'SEED' }
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2655-2200', label: 'SID Desk' },
      { contact_type: 'email', contact_value: 'admissions@sid.edu.in', label: 'Admissions Panel' },
      { contact_type: 'website', contact_value: 'https://www.sid.edu.in', label: 'Official Website' }
    ]
  }
];

function seed() {
  console.log('Seeding Maharashtra colleges Batch 2...');
  for (const col of mhCollegesBatch2) {
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
  console.log('Finished seeding Maharashtra colleges Batch 2.');
}

seed();
