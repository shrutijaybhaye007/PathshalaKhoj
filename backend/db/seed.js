/**
 * Seeds the database with 45+ Indian institutions spanning Engineering,
 * Medical, Management, Law, Arts, Commerce, Science, Design streams,
 * AND Junior Colleges for Class XI–XII students.
 *
 * Run with: npm run seed
 * Safe to re-run: wipes and re-inserts each time.
 */
const { get, run, exec } = require('./connection');
const { initDb } = require('./init');

function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const colleges = [
  // ============================================================
  // ENGINEERING
  // ============================================================
  {
    name: 'Indian Institute of Technology Bombay',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'AICTE, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1958,
    description: 'One of India\'s premier engineering and technology institutes, known for cutting-edge research and a highly competitive JEE Advanced admission process.',
    address: 'Powai, Mumbai, Maharashtra',
    pincode: '400076',
    avg_fees_per_year: 250000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 250000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 110, fees_per_year: 230000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 245000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 150000, entrance_exam: 'GATE' },
      { name: 'PhD Engineering', level: 'PhD', duration_years: 4, seats: 40, fees_per_year: 50000, entrance_exam: 'Institute Interview' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2572-2545', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@iitb.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.iitb.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Indian Institute of Technology Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'AICTE, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1961,
    description: 'A leading technology institute in the national capital offering undergraduate and postgraduate engineering programs with strong industry connections.',
    address: 'Hauz Khas, New Delhi',
    pincode: '110016',
    avg_fees_per_year: 245000,
    courses: [
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 100, fees_per_year: 245000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 95, fees_per_year: 245000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech VLSI Design', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 140000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2659-1717', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@admin.iitd.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://home.iitd.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Indian Institute of Technology Madras',
    city: 'Chennai',
    state: 'Tamil Nadu',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'AICTE, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1959,
    description: 'Consistently ranked India\'s #1 engineering institution, known for world-class research, a sprawling forested campus, and strong alumni network.',
    address: 'Sardar Patel Road, Adyar, Chennai',
    pincode: '600036',
    avg_fees_per_year: 255000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 130, fees_per_year: 255000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Aerospace Engineering', level: 'UG', duration_years: 4, seats: 50, fees_per_year: 250000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Artificial Intelligence', level: 'PG', duration_years: 2, seats: 45, fees_per_year: 160000, entrance_exam: 'GATE' },
      { name: 'PhD Computational Engineering', level: 'PhD', duration_years: 4, seats: 30, fees_per_year: 45000, entrance_exam: 'Institute Interview' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-44-2257-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@iitm.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.iitm.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Technology Tiruchirappalli',
    city: 'Tiruchirappalli',
    state: 'Tamil Nadu',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'AICTE, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1964,
    description: 'A top NIT known for its core engineering branches and consistently strong placement record across sectors.',
    address: 'Tanjore Main Road, National Highway 83, Tiruchirappalli',
    pincode: '620015',
    avg_fees_per_year: 165000,
    courses: [
      { name: 'B.Tech Civil Engineering', level: 'UG', duration_years: 4, seats: 100, fees_per_year: 160000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 165000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Structural Engineering', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 105000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-431-250-3000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nitt.edu', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nitt.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Birla Institute of Technology and Science Pilani',
    city: 'Pilani',
    state: 'Rajasthan',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'UGC, Deemed University',
    naac_grade: 'A',
    established_year: 1964,
    description: 'A top-ranked private deemed university known for its flexible engineering curriculum, dual degree programs, and highly active student clubs.',
    address: 'Vidya Vihar, Pilani',
    pincode: '333031',
    avg_fees_per_year: 220000,
    courses: [
      { name: 'B.E. Computer Science', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 220000, entrance_exam: 'BITSAT' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 150, fees_per_year: 215000, entrance_exam: 'BITSAT' },
      { name: 'M.E. Software Systems', level: 'PG', duration_years: 2, seats: 50, fees_per_year: 180000, entrance_exam: 'BITS HD Admission Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-1596-242-210', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@pilani.bits-pilani.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.bits-pilani.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Vellore Institute of Technology',
    city: 'Vellore',
    state: 'Tamil Nadu',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'UGC, Deemed University',
    naac_grade: 'A++',
    established_year: 1984,
    description: 'A large private deemed university offering engineering and technology programs with significant international student enrolment and global tie-ups.',
    address: 'Katpadi, Vellore',
    pincode: '632014',
    avg_fees_per_year: 215000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 600, fees_per_year: 215000, entrance_exam: 'VITEEE' },
      { name: 'B.Tech Information Technology', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 210000, entrance_exam: 'VITEEE' },
      { name: 'B.Tech Artificial Intelligence and Machine Learning', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 220000, entrance_exam: 'VITEEE' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 150000, entrance_exam: 'VITMEE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-416-220-2020', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admission@vit.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://vit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Delhi Technological University',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'AICTE, State University',
    naac_grade: 'A',
    established_year: 1941,
    description: 'One of Delhi\'s largest and oldest engineering universities, formerly Delhi College of Engineering, offering highly sought-after undergraduate programs.',
    address: 'Shahbad Daulatpur, Main Bawana Road, Delhi',
    pincode: '110042',
    avg_fees_per_year: 190000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 190000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Software Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 185000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Information Technology', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 120000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2787-1018', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@dtu.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.dtu.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Jadavpur University',
    city: 'Kolkata',
    state: 'West Bengal',
    stream: 'Engineering',
    college_type: 'Government',
    affiliation: 'AICTE, State University',
    naac_grade: 'A++',
    established_year: 1955,
    description: 'A premier state university in West Bengal, highly ranked nationally for engineering and the humanities, known for its research output and affordable fees.',
    address: '188, Raja S.C. Mullick Road, Kolkata',
    pincode: '700032',
    avg_fees_per_year: 40000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 40000, entrance_exam: 'WBJEE' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 38000, entrance_exam: 'WBJEE' },
      { name: 'M.E. Computer Science', level: 'PG', duration_years: 2, seats: 40, fees_per_year: 30000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-33-2414-6000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@jadavpuruniversity.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://jadavpuruniversity.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MEDICAL
  // ============================================================
  {
    name: 'All India Institute of Medical Sciences Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'NMC, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1956,
    description: 'India\'s foremost public medical institution, offering MBBS, postgraduate medical degrees, nursing, and allied health sciences programs with world-class faculty.',
    address: 'Ansari Nagar, New Delhi',
    pincode: '110029',
    avg_fees_per_year: 6000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 125, fees_per_year: 6000, entrance_exam: 'NEET-UG' },
      { name: 'MD General Medicine', level: 'PG', duration_years: 3, seats: 12, fees_per_year: 10000, entrance_exam: 'NEET-PG / INI-CET' },
      { name: 'B.Sc Nursing', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 15000, entrance_exam: 'AIIMS Nursing Entrance' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2658-8500', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'deanoffice@aiims.edu', label: 'Dean\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.aiims.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Christian Medical College Vellore',
    city: 'Vellore',
    state: 'Tamil Nadu',
    stream: 'Medical',
    college_type: 'Private',
    affiliation: 'NMC, TN Dr. MGR Medical University',
    naac_grade: 'A',
    established_year: 1900,
    description: 'A renowned private medical college and hospital with a long history of clinical excellence, missionary roots, and outstanding patient care.',
    address: 'Ida Scudder Road, Vellore',
    pincode: '632004',
    avg_fees_per_year: 55000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 100, fees_per_year: 55000, entrance_exam: 'NEET-UG' },
      { name: 'B.Sc Allied Health Sciences', level: 'UG', duration_years: 4, seats: 40, fees_per_year: 60000, entrance_exam: 'CMC Entrance Test' },
      { name: 'MD Paediatrics', level: 'PG', duration_years: 3, seats: 8, fees_per_year: 70000, entrance_exam: 'NEET-PG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-416-228-1000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@cmcvellore.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.cmch-vellore.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Grant Medical College',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'Maharashtra University of Health Sciences',
    naac_grade: 'A',
    established_year: 1845,
    description: 'One of India\'s oldest medical colleges, attached to the JJ Group of Hospitals, offering MBBS and postgraduate medical specializations.',
    address: 'Sir J.J. Hospital Compound, Byculla, Mumbai',
    pincode: '400008',
    avg_fees_per_year: 20000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 200, fees_per_year: 20000, entrance_exam: 'NEET-UG' },
      { name: 'MD Surgery', level: 'PG', duration_years: 3, seats: 15, fees_per_year: 25000, entrance_exam: 'NEET-PG' },
      { name: 'B.Sc Nursing', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 18000, entrance_exam: 'NEET-UG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2373-5555', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'deangmc@gmail.com', label: 'Dean\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.grantmedicalcollege.in', label: 'Official Website' },
    ],
  },
  {
    name: 'JIPMER Puducherry',
    city: 'Puducherry',
    state: 'Puducherry',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'NMC, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1823,
    description: 'Jawaharlal Institute of Postgraduate Medical Education and Research — one of India\'s oldest and most prestigious medical institutions with near-zero fees.',
    address: 'Dhanvantari Nagar, Puducherry',
    pincode: '605006',
    avg_fees_per_year: 5000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 150, fees_per_year: 5000, entrance_exam: 'NEET-UG' },
      { name: 'MD Radiology', level: 'PG', duration_years: 3, seats: 6, fees_per_year: 8000, entrance_exam: 'INI-CET' },
      { name: 'B.Sc Nursing', level: 'UG', duration_years: 4, seats: 50, fees_per_year: 6000, entrance_exam: 'JIPMER Nursing Entrance' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-413-229-6000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@jipmer.edu.in', label: 'Director\'s Office' },
      { contact_type: 'website', contact_value: 'https://jipmer.edu.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MANAGEMENT
  // ============================================================
  {
    name: 'Indian Institute of Management Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    stream: 'Management',
    college_type: 'Government',
    affiliation: 'AICTE, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1961,
    description: 'India\'s top-ranked business school, renowned for its case-method MBA pedagogy, global faculty research, and an extraordinarily competitive admission process.',
    address: 'Vastrapur, Ahmedabad',
    pincode: '380015',
    avg_fees_per_year: 1200000,
    courses: [
      { name: 'MBA (Post Graduate Programme)', level: 'PG', duration_years: 2, seats: 395, fees_per_year: 1200000, entrance_exam: 'CAT' },
      { name: 'PGPX (Executive MBA)', level: 'PG', duration_years: 1, seats: 90, fees_per_year: 2900000, entrance_exam: 'GMAT/GRE' },
      { name: 'PhD Management', level: 'PhD', duration_years: 4, seats: 30, fees_per_year: 100000, entrance_exam: 'Institute Interview' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-79-6632-4444', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'pgp@iima.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.iima.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Indian Institute of Management Bangalore',
    city: 'Bengaluru',
    state: 'Karnataka',
    stream: 'Management',
    college_type: 'Government',
    affiliation: 'AICTE, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1973,
    description: 'A top-tier IIM known for its quantitative approach to management, strong entrepreneurship culture, and placement in global consulting and finance.',
    address: 'Bannerghatta Road, Bengaluru',
    pincode: '560076',
    avg_fees_per_year: 1100000,
    courses: [
      { name: 'MBA (Post Graduate Programme in Management)', level: 'PG', duration_years: 2, seats: 450, fees_per_year: 1100000, entrance_exam: 'CAT' },
      { name: 'Executive MBA (PGPEM)', level: 'PG', duration_years: 1, seats: 60, fees_per_year: 2500000, entrance_exam: 'GMAT + Work Experience' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-80-2699-3000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'pgp.admissions@iimb.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.iimb.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'XLRI — Xavier School of Management',
    city: 'Jamshedpur',
    state: 'Jharkhand',
    stream: 'Management',
    college_type: 'Private',
    affiliation: 'AICTE, Autonomous',
    naac_grade: 'A++',
    established_year: 1949,
    description: 'One of India\'s oldest business schools, known for its BM and HRM programs, Jesuit ethos, and consistent top-10 placement record.',
    address: 'Circuit House Area, Jamshedpur',
    pincode: '831001',
    avg_fees_per_year: 1300000,
    courses: [
      { name: 'MBA Business Management (BM)', level: 'PG', duration_years: 2, seats: 180, fees_per_year: 1300000, entrance_exam: 'XAT' },
      { name: 'MBA Human Resource Management (HRM)', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 1300000, entrance_exam: 'XAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-657-398-3000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@xlri.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.xlri.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Symbiosis Institute of Business Management',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Management',
    college_type: 'Private',
    affiliation: 'Symbiosis International Deemed University',
    naac_grade: 'A',
    established_year: 1978,
    description: 'A well-known private business school in Pune offering MBA programs with a focus on industry-aligned specializations and an international campus environment.',
    address: 'Senapati Bapat Road, Pune',
    pincode: '411004',
    avg_fees_per_year: 1100000,
    courses: [
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 180, fees_per_year: 1100000, entrance_exam: 'SNAP' },
      { name: 'MBA Healthcare Management', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 1000000, entrance_exam: 'SNAP' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2528-0833', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@sibm.edu.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.sibmpune.edu.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // LAW
  // ============================================================
  {
    name: 'National Law School of India University',
    city: 'Bengaluru',
    state: 'Karnataka',
    stream: 'Law',
    college_type: 'Autonomous',
    affiliation: 'Bar Council of India',
    naac_grade: 'A',
    established_year: 1986,
    description: 'India\'s first National Law University and consistently the top-ranked law school in the country, admitting students via the CLAT examination.',
    address: 'Nagarbhavi, Bengaluru',
    pincode: '560072',
    avg_fees_per_year: 295000,
    courses: [
      { name: 'BA LLB (Hons)', level: 'UG', duration_years: 5, seats: 80, fees_per_year: 295000, entrance_exam: 'CLAT' },
      { name: 'LLM', level: 'PG', duration_years: 1, seats: 20, fees_per_year: 150000, entrance_exam: 'CLAT PG' },
      { name: 'PhD Law', level: 'PhD', duration_years: 3, seats: 15, fees_per_year: 80000, entrance_exam: 'Institute Interview' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-80-2316-0533', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nls.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nls.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Faculty of Law, University of Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Law',
    college_type: 'Government',
    affiliation: 'Bar Council of India, University of Delhi',
    naac_grade: 'A',
    established_year: 1924,
    description: 'One of India\'s oldest and most respected law faculties, offering integrated and postgraduate law degrees in the heart of Delhi\'s legal ecosystem.',
    address: 'Chhatra Marg, University of Delhi North Campus',
    pincode: '110007',
    avg_fees_per_year: 20000,
    courses: [
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 1100, fees_per_year: 20000, entrance_exam: 'DU LLB Entrance' },
      { name: 'LLM', level: 'PG', duration_years: 1, seats: 200, fees_per_year: 22000, entrance_exam: 'DU LLM Entrance' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2766-7861', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'lawfaculty@law.du.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://lawfaculty.du.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'NALSAR University of Law',
    city: 'Hyderabad',
    state: 'Telangana',
    stream: 'Law',
    college_type: 'Autonomous',
    affiliation: 'Bar Council of India',
    naac_grade: 'A',
    established_year: 1998,
    description: 'A leading National Law University in Hyderabad, ranked among India\'s top law schools, known for its clinical legal education and moot court culture.',
    address: 'Justice City, Shameerpet, Hyderabad',
    pincode: '500101',
    avg_fees_per_year: 220000,
    courses: [
      { name: 'BA LLB (Hons)', level: 'UG', duration_years: 5, seats: 100, fees_per_year: 220000, entrance_exam: 'CLAT' },
      { name: 'LLM', level: 'PG', duration_years: 1, seats: 30, fees_per_year: 120000, entrance_exam: 'CLAT PG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-40-2349-8100', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'info@nalsar.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.nalsar.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // ARTS
  // ============================================================
  {
    name: 'St. Stephen\'s College',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Arts',
    college_type: 'Autonomous',
    affiliation: 'University of Delhi',
    naac_grade: 'A++',
    established_year: 1881,
    description: 'A historic liberal arts and sciences college affiliated with Delhi University, renowned for rigorous humanities programs and producing prominent alumni.',
    address: 'University Road, New Delhi',
    pincode: '110007',
    avg_fees_per_year: 45000,
    courses: [
      { name: 'BA (Hons) English', level: 'UG', duration_years: 3, seats: 30, fees_per_year: 45000, entrance_exam: 'CUET' },
      { name: 'BA (Hons) Economics', level: 'UG', duration_years: 3, seats: 30, fees_per_year: 45000, entrance_exam: 'CUET' },
      { name: 'B.Sc (Hons) Physics', level: 'UG', duration_years: 3, seats: 25, fees_per_year: 48000, entrance_exam: 'CUET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2766-6418', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@ststephens.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.ststephens.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Jawaharlal Nehru University',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Arts',
    college_type: 'Government',
    affiliation: 'UGC, Central University',
    naac_grade: 'A++',
    established_year: 1969,
    description: 'A leading central university known for its social sciences, languages, and international studies programs, with one of the lowest fee structures for a premier institution.',
    address: 'New Mehrauli Road, New Delhi',
    pincode: '110067',
    avg_fees_per_year: 12000,
    courses: [
      { name: 'MA Political Science', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 12000, entrance_exam: 'CUET-PG' },
      { name: 'MA Economics', level: 'PG', duration_years: 2, seats: 50, fees_per_year: 12000, entrance_exam: 'CUET-PG' },
      { name: 'PhD International Relations', level: 'PhD', duration_years: 4, seats: 20, fees_per_year: 15000, entrance_exam: 'CUET-PG + Interview' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2670-4040', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'rector@mail.jnu.ac.in', label: 'Rector\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.jnu.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Loyola College',
    city: 'Chennai',
    state: 'Tamil Nadu',
    stream: 'Arts',
    college_type: 'Private',
    affiliation: 'University of Madras',
    naac_grade: 'A++',
    established_year: 1925,
    description: 'A well-regarded autonomous college offering a wide range of arts, science, and commerce programs with strong focus on values-based education.',
    address: 'Sterling Road, Nungambakkam, Chennai',
    pincode: '600034',
    avg_fees_per_year: 30000,
    courses: [
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 30000, entrance_exam: 'Merit-based' },
      { name: 'BA English Literature', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 28000, entrance_exam: 'Merit-based' },
      { name: 'MA Social Work', level: 'PG', duration_years: 2, seats: 40, fees_per_year: 35000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-44-2817-8200', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@loyolacollege.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.loyolacollege.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Lady Shri Ram College for Women',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Arts',
    college_type: 'Government',
    affiliation: 'University of Delhi',
    naac_grade: 'A++',
    established_year: 1956,
    description: 'One of India\'s premier women\'s colleges, affiliated to Delhi University, known for excellence in humanities, social sciences, and commerce education.',
    address: 'Lajpat Nagar IV, New Delhi',
    pincode: '110024',
    avg_fees_per_year: 28000,
    courses: [
      { name: 'BA (Hons) Political Science', level: 'UG', duration_years: 3, seats: 50, fees_per_year: 28000, entrance_exam: 'CUET' },
      { name: 'BA (Hons) Psychology', level: 'UG', duration_years: 3, seats: 40, fees_per_year: 28000, entrance_exam: 'CUET' },
      { name: 'B.Com (Hons)', level: 'UG', duration_years: 3, seats: 108, fees_per_year: 26000, entrance_exam: 'CUET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2644-4000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@lsr.edu.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.lsr.edu.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // COMMERCE
  // ============================================================
  {
    name: 'Shri Ram College of Commerce',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Commerce',
    college_type: 'Government',
    affiliation: 'University of Delhi',
    naac_grade: 'A++',
    established_year: 1926,
    description: 'India\'s top-ranked commerce college, known for B.Com (Hons) and Economics programs, high cutoffs, and a vibrant student body.',
    address: 'Maurice Nagar, University of Delhi North Campus',
    pincode: '110007',
    avg_fees_per_year: 22000,
    courses: [
      { name: 'B.Com (Hons)', level: 'UG', duration_years: 3, seats: 252, fees_per_year: 22000, entrance_exam: 'CUET' },
      { name: 'BA (Hons) Economics', level: 'UG', duration_years: 3, seats: 50, fees_per_year: 22000, entrance_exam: 'CUET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2766-7853', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@srcc.du.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.srcc.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Narsee Monjee College of Commerce and Economics',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Commerce',
    college_type: 'Private',
    affiliation: 'University of Mumbai',
    naac_grade: 'A',
    established_year: 1964,
    description: 'A leading commerce and management college in Mumbai with strong industry tie-ups, placement support, and a busy co-curricular culture.',
    address: 'Vile Parle, Mumbai',
    pincode: '400056',
    avg_fees_per_year: 35000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 300, fees_per_year: 35000, entrance_exam: 'Merit-based' },
      { name: 'BMS (Bachelor of Management Studies)', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 60000, entrance_exam: 'Merit-based' },
      { name: 'M.Com', level: 'PG', duration_years: 2, seats: 80, fees_per_year: 40000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2670-4486', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'info@nmcollege.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.nmcollege.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Hansraj College',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Commerce',
    college_type: 'Government',
    affiliation: 'University of Delhi',
    naac_grade: 'A++',
    established_year: 1948,
    description: 'A highly sought-after constituent college of Delhi University, offering strong programs in commerce, science, and humanities with competitive CUET cutoffs.',
    address: 'Mahatma Hans Raj Marg, Malka Ganj, New Delhi',
    pincode: '110007',
    avg_fees_per_year: 24000,
    courses: [
      { name: 'B.Com (Hons)', level: 'UG', duration_years: 3, seats: 300, fees_per_year: 24000, entrance_exam: 'CUET' },
      { name: 'B.Sc (Hons) Mathematics', level: 'UG', duration_years: 3, seats: 75, fees_per_year: 24000, entrance_exam: 'CUET' },
      { name: 'BA (Hons) Economics', level: 'UG', duration_years: 3, seats: 75, fees_per_year: 24000, entrance_exam: 'CUET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2725-5391', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@hansrajcollege.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.hansrajcollege.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // SCIENCE
  // ============================================================
  {
    name: 'Indian Institute of Science',
    city: 'Bengaluru',
    state: 'Karnataka',
    stream: 'Science',
    college_type: 'Government',
    affiliation: 'UGC, Institute of National Importance',
    naac_grade: 'A++',
    established_year: 1909,
    description: 'India\'s top-ranked research university for science and engineering, offering integrated PhD and research-focused undergraduate programs on a 400-acre campus.',
    address: 'CV Raman Avenue, Bengaluru',
    pincode: '560012',
    avg_fees_per_year: 30000,
    courses: [
      { name: 'BS Research (4-year)', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 30000, entrance_exam: 'KVPY/JEE/NEET' },
      { name: 'Integrated PhD Physical Sciences', level: 'PhD', duration_years: 5, seats: 40, fees_per_year: 25000, entrance_exam: 'JEST/JGEEBILS' },
      { name: 'MTech in Computational and Data Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 35000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-80-2293-2001', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@iisc.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.iisc.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Fergusson College',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Science',
    college_type: 'Autonomous',
    affiliation: 'Savitribai Phule Pune University',
    naac_grade: 'A++',
    established_year: 1885,
    description: 'A historic autonomous college in Pune known for strong science programs, a heritage campus, and producing several prominent scientists and public figures.',
    address: 'Shivajinagar, Pune',
    pincode: '411004',
    avg_fees_per_year: 18000,
    courses: [
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 80, fees_per_year: 18000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Biotechnology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 20000, entrance_exam: 'Merit-based' },
      { name: 'M.Sc Statistics', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 22000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2565-3284', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@fergusson.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.fergusson.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Presidency College',
    city: 'Kolkata',
    state: 'West Bengal',
    stream: 'Science',
    college_type: 'Government',
    affiliation: 'Presidency University',
    naac_grade: 'A',
    established_year: 1817,
    description: 'One of the oldest and most distinguished colleges in India, with a rich legacy of producing Nobel laureates and national leaders across science and humanities.',
    address: '86/1, College Street, Kolkata',
    pincode: '700073',
    avg_fees_per_year: 15000,
    courses: [
      { name: 'B.Sc (Hons) Physics', level: 'UG', duration_years: 3, seats: 50, fees_per_year: 15000, entrance_exam: 'Presidency Entrance Test' },
      { name: 'B.Sc (Hons) Chemistry', level: 'UG', duration_years: 3, seats: 40, fees_per_year: 15000, entrance_exam: 'Presidency Entrance Test' },
      { name: 'M.Sc Physics', level: 'PG', duration_years: 2, seats: 25, fees_per_year: 18000, entrance_exam: 'CUET-PG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-33-2241-3603', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principalpresidency@gmail.com', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.presiuniv.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // DESIGN
  // ============================================================
  {
    name: 'National Institute of Fashion Technology',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Design',
    college_type: 'Government',
    affiliation: 'Ministry of Textiles, Govt. of India',
    naac_grade: 'A',
    established_year: 1986,
    description: 'India\'s premier fashion and design institute offering programs in fashion design, textile design, and fashion management across multiple campuses.',
    address: 'Hauz Khas, New Delhi',
    pincode: '110016',
    avg_fees_per_year: 280000,
    courses: [
      { name: 'B.Des Fashion Design', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 280000, entrance_exam: 'NIFT Entrance Exam' },
      { name: 'B.Des Textile Design', level: 'UG', duration_years: 4, seats: 40, fees_per_year: 260000, entrance_exam: 'NIFT Entrance Exam' },
      { name: 'M.F.Tech Fashion Technology', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 220000, entrance_exam: 'NIFT Entrance Exam' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2696-5080', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@nift.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.nift.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Design',
    city: 'Ahmedabad',
    state: 'Gujarat',
    stream: 'Design',
    college_type: 'Government',
    affiliation: 'Ministry of Commerce and Industry, Govt. of India',
    naac_grade: 'A',
    established_year: 1961,
    description: 'A globally recognized design institute offering interdisciplinary undergraduate and postgraduate design education and applied design research.',
    address: 'Paldi, Ahmedabad',
    pincode: '380007',
    avg_fees_per_year: 350000,
    courses: [
      { name: 'B.Des', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 350000, entrance_exam: 'NID DAT' },
      { name: 'M.Des', level: 'PG', duration_years: 2.5, seats: 90, fees_per_year: 300000, entrance_exam: 'NID DAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-79-2662-3692', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@nid.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.nid.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Srishti Manipal Institute of Art, Design and Technology',
    city: 'Bengaluru',
    state: 'Karnataka',
    stream: 'Design',
    college_type: 'Private',
    affiliation: 'Manipal Academy of Higher Education',
    naac_grade: 'A',
    established_year: 1996,
    description: 'A progressive design and technology school known for its interdisciplinary approach, studio culture, and strong emphasis on creative entrepreneurship.',
    address: 'Yelahanka, Bengaluru',
    pincode: '560064',
    avg_fees_per_year: 360000,
    courses: [
      { name: 'B.Des Communication Design', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 360000, entrance_exam: 'Srishti Entrance Exam' },
      { name: 'B.Des Interaction Design', level: 'UG', duration_years: 4, seats: 45, fees_per_year: 360000, entrance_exam: 'Srishti Entrance Exam' },
      { name: 'M.Des', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 280000, entrance_exam: 'Srishti Entrance Exam' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-80-6629-5555', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@srishti.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.srishtimanipalinstitute.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // JUNIOR COLLEGES — CLASS XI–XII (Higher Secondary)
  // ============================================================
  {
    name: 'Ruia College — Junior Section (XI–XII)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Government',
    affiliation: 'Maharashtra State Board (HSC), University of Mumbai',
    naac_grade: 'A++',
    established_year: 1937,
    description: 'Ramnarain Ruia Autonomous College is among Mumbai\'s most respected junior colleges, offering Science and Commerce streams for Class XI–XII under the Maharashtra HSC Board.',
    address: 'Matunga, Mumbai, Maharashtra',
    pincode: '400019',
    avg_fees_per_year: 8000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 320, fees_per_year: 8000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 8000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 250, fees_per_year: 7000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2414-0657', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@ruiacollege.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.ruiacollege.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Jai Hind College — Junior Section (XI–XII)',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC), University of Mumbai',
    naac_grade: 'A',
    established_year: 1948,
    description: 'A well-known junior and degree college in South Mumbai offering Commerce, Arts, and Science streams at the HSC level with excellent co-curricular activities.',
    address: 'A Road, Churchgate, Mumbai',
    pincode: '400020',
    avg_fees_per_year: 18000,
    courses: [
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 480, fees_per_year: 18000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Arts', level: 'XI-XII', duration_years: 2, seats: 240, fees_per_year: 16000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Science', level: 'XI-XII', duration_years: 2, seats: 160, fees_per_year: 18000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2204-0476', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@jaihindcollege.com', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://jaihindcollege.com', label: 'Official Website' },
    ],
  },
  {
    name: 'Sri Chaitanya Junior College',
    city: 'Hyderabad',
    state: 'Telangana',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Telangana State Board of Intermediate Education',
    naac_grade: null,
    established_year: 1986,
    description: 'One of India\'s largest and most reputed junior college chains for Class XI–XII, known for its intensive IIT-JEE and NEET coaching integrated with the Intermediate curriculum.',
    address: 'Madhapur, Hyderabad, Telangana',
    pincode: '500081',
    avg_fees_per_year: 120000,
    courses: [
      { name: 'Class XI – MPC (Maths, Physics, Chemistry)', level: 'XI-XII', duration_years: 2, seats: 500, fees_per_year: 120000, entrance_exam: 'Sri Chaitanya Scholarship Test / Merit' },
      { name: 'Class XI – BiPC (Biology, Physics, Chemistry)', level: 'XI-XII', duration_years: 2, seats: 400, fees_per_year: 115000, entrance_exam: 'Sri Chaitanya Scholarship Test / Merit' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-40-2311-5555', label: 'Admissions Helpline' },
      { contact_type: 'email', contact_value: 'admissions@srichaitanya.net', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.srichaitanya.net', label: 'Official Website' },
    ],
  },
  {
    name: 'Narayana Junior College',
    city: 'Vijayawada',
    state: 'Andhra Pradesh',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Andhra Pradesh Board of Intermediate Education',
    naac_grade: null,
    established_year: 1979,
    description: 'A premier junior college network known for rigorous Class XI–XII programs with embedded JEE Main, JEE Advanced, and NEET preparation for science students.',
    address: 'Governorpet, Vijayawada, Andhra Pradesh',
    pincode: '520002',
    avg_fees_per_year: 100000,
    courses: [
      { name: 'Class XI – MPC (JEE track)', level: 'XI-XII', duration_years: 2, seats: 600, fees_per_year: 100000, entrance_exam: 'Narayana Scholarship Test' },
      { name: 'Class XI – BiPC (NEET track)', level: 'XI-XII', duration_years: 2, seats: 500, fees_per_year: 95000, entrance_exam: 'Narayana Scholarship Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-866-248-0000', label: 'Admissions Helpline' },
      { contact_type: 'email', contact_value: 'info@narayanagroup.com', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.narayanagroup.com', label: 'Official Website' },
    ],
  },
  {
    name: 'DPS RK Puram — Senior Secondary (XI–XII)',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'CBSE Board',
    naac_grade: null,
    established_year: 1972,
    description: 'Delhi Public School, R.K. Puram is one of India\'s most reputed senior secondary schools, offering Science, Commerce, and Humanities streams under the CBSE board for Class XI–XII.',
    address: 'Sector 4, R.K. Puram, New Delhi',
    pincode: '110022',
    avg_fees_per_year: 55000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 300, fees_per_year: 55000, entrance_exam: 'Merit / Class X Marks' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 55000, entrance_exam: 'Merit / Class X Marks' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 250, fees_per_year: 50000, entrance_exam: 'Merit / Class X Marks' },
      { name: 'Class XI – Humanities', level: 'XI-XII', duration_years: 2, seats: 150, fees_per_year: 50000, entrance_exam: 'Merit / Class X Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2617-0505', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@dpsrkp.net', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.dpsrkp.net', label: 'Official Website' },
    ],
  },
  {
    name: 'Kendriya Vidyalaya Sangathan — Model School (XI–XII)',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Junior College',
    college_type: 'Government',
    affiliation: 'CBSE Board, Ministry of Education',
    naac_grade: null,
    established_year: 1963,
    description: 'The flagship Kendriya Vidyalaya of the KVS chain, offering affordable Class XI–XII education in Science, Commerce, and Humanities for children of Central Government employees and open merit students.',
    address: 'Andrews Ganj, New Delhi',
    pincode: '110049',
    avg_fees_per_year: 3000,
    courses: [
      { name: 'Class XI – Science', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 3000, entrance_exam: 'Merit / Class X Marks' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 160, fees_per_year: 3000, entrance_exam: 'Merit / Class X Marks' },
      { name: 'Class XI – Humanities', level: 'XI-XII', duration_years: 2, seats: 120, fees_per_year: 3000, entrance_exam: 'Merit / Class X Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-2461-5015', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'kvsangathan@kvsangathan.nic.in', label: 'KVS HQ' },
      { contact_type: 'website', contact_value: 'https://kvsangathan.nic.in', label: 'Official Website' },
    ],
  },
  {
    name: 'MCC Campus — Madras Christian College Higher Secondary',
    city: 'Chennai',
    state: 'Tamil Nadu',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Tamil Nadu State Board (HSC)',
    naac_grade: null,
    established_year: 1837,
    description: 'The higher secondary wing of the prestigious Madras Christian College, offering Class XI–XII programs in Science, Commerce, and Arts on a sprawling suburban campus.',
    address: 'MCC Campus, Tambaram East, Chennai',
    pincode: '600059',
    avg_fees_per_year: 25000,
    courses: [
      { name: 'Class XI – Science (PCM Group)', level: 'XI-XII', duration_years: 2, seats: 180, fees_per_year: 25000, entrance_exam: 'Merit / Class X Marks' },
      { name: 'Class XI – Science (PCB Group)', level: 'XI-XII', duration_years: 2, seats: 150, fees_per_year: 25000, entrance_exam: 'Merit / Class X Marks' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 120, fees_per_year: 22000, entrance_exam: 'Merit / Class X Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-44-2239-4000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mcc.edu.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.mcc.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'FIITJEE Junior College (XI–XII + JEE)',
    city: 'New Delhi',
    state: 'Delhi',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'CBSE Board',
    naac_grade: null,
    established_year: 1992,
    description: 'FIITJEE\'s flagship integrated program combining Class XI–XII CBSE curriculum with intensive coaching for JEE Main and JEE Advanced, producing consistent IIT selectors.',
    address: '29-A, Kalu Sarai, Sarvapriya Vihar, New Delhi',
    pincode: '110016',
    avg_fees_per_year: 350000,
    courses: [
      { name: 'Class XI–XII + JEE Main & Advanced (4-year Pinnacle)', level: 'XI-XII', duration_years: 2, seats: 300, fees_per_year: 350000, entrance_exam: 'FIITJEE Admission Test (FSAT)' },
      { name: 'Class XI–XII + JEE Main (2-year Integrated)', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 280000, entrance_exam: 'FIITJEE Admission Test (FSAT)' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-11-4917-3333', label: 'Admissions Helpline' },
      { contact_type: 'email', contact_value: 'admission@fiitjee.com', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.fiitjee.com', label: 'Official Website' },
    ],
  },
  {
    name: 'Allen Career Institute (XI–XII + NEET/JEE)',
    city: 'Kota',
    state: 'Rajasthan',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Rajasthan Board (RBSE) / CBSE',
    naac_grade: null,
    established_year: 1988,
    description: 'India\'s largest coaching-cum-school institution in Kota, providing Class XI–XII education integrated with NEET-UG, JEE Main, and JEE Advanced preparation for lakhs of students annually.',
    address: 'Sanskriti Bhawan, 7, CP-6, Indra Vihar, Kota',
    pincode: '324005',
    avg_fees_per_year: 180000,
    courses: [
      { name: 'Class XI–XII + JEE Main & Advanced', level: 'XI-XII', duration_years: 2, seats: 2000, fees_per_year: 180000, entrance_exam: 'ALLEN Scholarship Test' },
      { name: 'Class XI–XII + NEET-UG', level: 'XI-XII', duration_years: 2, seats: 2000, fees_per_year: 175000, entrance_exam: 'ALLEN Scholarship Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-744-270-1333', label: 'Admissions Helpline' },
      { contact_type: 'email', contact_value: 'info@allen.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.allen.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Resonance Junior College (XI–XII + JEE)',
    city: 'Kota',
    state: 'Rajasthan',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'CBSE Board',
    naac_grade: null,
    established_year: 2001,
    description: 'A leading coaching-integrated junior college in Kota\'s competitive education hub, offering Class XI–XII with dedicated preparation tracks for JEE and NEET.',
    address: 'CG Tower, Talwandi, Kota',
    pincode: '324005',
    avg_fees_per_year: 160000,
    courses: [
      { name: 'Class XI–XII + JEE Advanced (ResoFAST)', level: 'XI-XII', duration_years: 2, seats: 1200, fees_per_year: 160000, entrance_exam: 'ResoFAST Scholarship Test' },
      { name: 'Class XI–XII + NEET-UG (ResoMED)', level: 'XI-XII', duration_years: 2, seats: 1000, fees_per_year: 150000, entrance_exam: 'ResoFAST Scholarship Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-744-240-5500', label: 'Admissions Helpline' },
      { contact_type: 'email', contact_value: 'admissions@resonance.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.resonance.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Pune International Centre (XI–XII Humanities)',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 2000,
    description: 'A boutique junior college in Pune specialising in the Arts and Humanities stream for Class XI–XII, offering small-batch teaching and strong preparation for CUET-based university admissions.',
    address: 'Aundh, Pune, Maharashtra',
    pincode: '411007',
    avg_fees_per_year: 45000,
    courses: [
      { name: 'Class XI – Arts / Humanities', level: 'XI-XII', duration_years: 2, seats: 80, fees_per_year: 45000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Commerce with CUET Prep', level: 'XI-XII', duration_years: 2, seats: 60, fees_per_year: 48000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2588-8800', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@pic.edu.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.pic.edu.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — ENGINEERING (MUMBAI)
  // ============================================================
  {
    name: 'Veermata Jijabai Technological Institute',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Autonomous',
    affiliation: 'University of Mumbai, AICTE',
    naac_grade: 'A+',
    established_year: 1887,
    description: 'One of India\'s oldest and most prestigious engineering colleges, VJTI is a pioneer institution in Mumbai known for its strong alumni network and excellent placements in core engineering sectors.',
    address: 'H.R. Mahajani Marg, Matunga, Mumbai',
    pincode: '400019',
    avg_fees_per_year: 110000,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 110000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Electronics Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 110000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 108000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.Tech Computer Engineering', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 95000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2419-8101', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@vjti.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.vjti.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Sardar Patel College of Engineering',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Autonomous',
    affiliation: 'University of Mumbai, AICTE',
    naac_grade: 'A',
    established_year: 1962,
    description: 'A well-regarded autonomous engineering college in Andheri, Mumbai, offering undergraduate and postgraduate engineering programs with strong industry connections and research output.',
    address: 'Bhavan\'s Campus, Munshi Nagar, Andheri (W), Mumbai',
    pincode: '400058',
    avg_fees_per_year: 135000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 135000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 130000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 128000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2670-7440', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@spce.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.spce.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'DJ Sanghvi College of Engineering',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'University of Mumbai, AICTE',
    naac_grade: 'A',
    established_year: 1994,
    description: 'One of Mumbai\'s top private engineering colleges under the SVKMgroup, known for its computer science and IT programs, active placement cell, and modern campus infrastructure.',
    address: 'Vile Parle (W), Mumbai',
    pincode: '400056',
    avg_fees_per_year: 155000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Artificial Intelligence and Data Science', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 165000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 150000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-4235-5000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@djsce.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.djsce.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'KJ Somaiya College of Engineering',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'University of Mumbai, AICTE',
    naac_grade: 'A',
    established_year: 1983,
    description: 'A popular engineering college in Vidyavihar, Mumbai, part of the Somaiya Vidyavihar University ecosystem, known for its research labs, industry partnerships, and competitive placements.',
    address: 'Vidyavihar, Mumbai',
    pincode: '400077',
    avg_fees_per_year: 160000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 160000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 155000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Information Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 158000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.E. Computer Engineering', level: 'PG', duration_years: 2, seats: 18, fees_per_year: 120000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-6726-3000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@somaiya.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://kjsce.somaiya.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Thadomal Shahani Engineering College',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'University of Mumbai, AICTE',
    naac_grade: 'A',
    established_year: 1983,
    description: 'A well-established private engineering college in Bandra, Mumbai, offering a range of undergraduate programs in engineering with good placement statistics and a vibrant campus life.',
    address: 'T.L. Road, Bandra (W), Mumbai',
    pincode: '400050',
    avg_fees_per_year: 148000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 148000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 145000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 142000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2640-8748', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'tsec@tsec.edu', label: 'Enquiry Email' },
      { contact_type: 'website', contact_value: 'https://www.tsec.edu', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — ENGINEERING (PUNE)
  // ============================================================
  {
    name: 'College of Engineering Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Autonomous',
    affiliation: 'Savitribai Phule Pune University, AICTE',
    naac_grade: 'A++',
    established_year: 1854,
    description: 'One of Asia\'s oldest engineering colleges (est. 1854), COEP Technological University is a premier institution in Pune consistently producing top engineers and researchers.',
    address: 'Wellesley Road, Shivajinagar, Pune',
    pincode: '411005',
    avg_fees_per_year: 100000,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 100000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 98000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Civil Engineering', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 95000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.Tech Computer Engineering', level: 'PG', duration_years: 2, seats: 24, fees_per_year: 80000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2550-7000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@coep.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.coeptech.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'MIT College of Engineering Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'Savitribai Phule Pune University, AICTE',
    naac_grade: 'A+',
    established_year: 1983,
    description: 'A flagship institution of the MIT Group of Institutions, offering a wide range of undergraduate and postgraduate engineering programs with modern infrastructure and industry-ready curriculum.',
    address: 'Paud Road, Kothrud, Pune',
    pincode: '411038',
    avg_fees_per_year: 160000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 160000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. AI and Data Science', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 165000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.E. Computer Engineering', level: 'PG', duration_years: 2, seats: 24, fees_per_year: 120000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-3027-1100', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mitcoe.edu.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.mitcoe.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Pune Institute of Computer Technology',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'Savitribai Phule Pune University, AICTE',
    naac_grade: 'A+',
    established_year: 1983,
    description: 'PICT is a leading computer science-focused engineering college in Pune, renowned for its software engineering programs, strong coding culture, and consistently top placements in the IT sector.',
    address: 'Survey No. 27, Near Trimurti Chowk, Dhankawadi, Pune',
    pincode: '411043',
    avg_fees_per_year: 145000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 145000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Information Technology', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 142000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.E. Computer Engineering', level: 'PG', duration_years: 2, seats: 24, fees_per_year: 110000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2437-0290', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@pict.edu', label: 'Director\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.pict.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Vishwakarma Institute of Technology',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Autonomous',
    affiliation: 'Savitribai Phule Pune University, AICTE',
    naac_grade: 'A+',
    established_year: 1983,
    description: 'VIT Pune is an autonomous engineering college in the heart of Pune, offering a rich mix of technical programs, state-of-the-art labs, and strong industry-academia partnerships.',
    address: '666, Upper Indiranagar, Bibwewadi, Pune',
    pincode: '411037',
    avg_fees_per_year: 132000,
    courses: [
      { name: 'B.Tech Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 132000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 128000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 125000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2440-5000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@vit.edu', label: 'Director\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.vit.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Symbiosis Institute of Technology',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Engineering',
    college_type: 'Private',
    affiliation: 'Symbiosis International Deemed University, AICTE',
    naac_grade: 'A',
    established_year: 2008,
    description: 'Part of the Symbiosis family, SIT Pune offers modern engineering programs with international exposure, industry-integrated curriculum, and a cosmopolitan campus environment.',
    address: 'Gram Lavale, Mulshi, Pune',
    pincode: '412115',
    avg_fees_per_year: 290000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 290000, entrance_exam: 'SET / MHT-CET' },
      { name: 'B.Tech Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 280000, entrance_exam: 'SET / MHT-CET' },
      { name: 'M.Tech Computer Science and Engineering', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 220000, entrance_exam: 'GATE / SET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-3916-6800', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@sitpune.edu.in', label: 'Director\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.sitpune.edu.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — MEDICAL (MUMBAI)
  // ============================================================
  {
    name: 'Seth GS Medical College and KEM Hospital',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'Maharashtra University of Health Sciences',
    naac_grade: 'A',
    established_year: 1926,
    description: 'One of the most prestigious government medical colleges in India, attached to the iconic KEM Hospital. Known for high-quality clinical training and its role in public health research.',
    address: 'Acharya Donde Marg, Parel, Mumbai',
    pincode: '400012',
    avg_fees_per_year: 22000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 250, fees_per_year: 22000, entrance_exam: 'NEET-UG' },
      { name: 'MD Internal Medicine', level: 'PG', duration_years: 3, seats: 15, fees_per_year: 28000, entrance_exam: 'NEET-PG' },
      { name: 'MS General Surgery', level: 'PG', duration_years: 3, seats: 12, fees_per_year: 28000, entrance_exam: 'NEET-PG' },
      { name: 'B.Sc Nursing', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 18000, entrance_exam: 'NEET-UG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2410-7000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'deangsmc@gmail.com', label: 'Dean\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.gsmc.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Lokmanya Tilak Municipal Medical College',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'Maharashtra University of Health Sciences',
    naac_grade: 'A',
    established_year: 1964,
    description: 'Municipal medical college attached to Sion Hospital, LTMMC is a well-reputed government institution offering MBBS and postgraduate specializations at highly subsidized fees.',
    address: 'Dr. Babasaheb Ambedkar Road, Sion, Mumbai',
    pincode: '400022',
    avg_fees_per_year: 20000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 175, fees_per_year: 20000, entrance_exam: 'NEET-UG' },
      { name: 'MD Pathology', level: 'PG', duration_years: 3, seats: 8, fees_per_year: 25000, entrance_exam: 'NEET-PG' },
      { name: 'B.Sc Nursing', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 15000, entrance_exam: 'NEET-UG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2408-7000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'ltmmcprincipal@gmail.com', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.ltmmc.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Topiwala National Medical College',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'Maharashtra University of Health Sciences',
    naac_grade: null,
    established_year: 1921,
    description: 'Attached to B.Y.L. Nair Charitable Hospital, TNMC is one of Mumbai\'s oldest medical colleges offering MBBS and specialty medical programs at near-zero cost.',
    address: 'Dr. A. L. Nair Road, Mumbai Central, Mumbai',
    pincode: '400008',
    avg_fees_per_year: 18000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 200, fees_per_year: 18000, entrance_exam: 'NEET-UG' },
      { name: 'MD Obstetrics and Gynaecology', level: 'PG', duration_years: 3, seats: 10, fees_per_year: 22000, entrance_exam: 'NEET-PG' },
      { name: 'B.Sc Nursing', level: 'UG', duration_years: 4, seats: 50, fees_per_year: 14000, entrance_exam: 'NEET-UG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2308-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'deantnmc@gmail.com', label: 'Dean\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.tnmc.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — MEDICAL (PUNE)
  // ============================================================
  {
    name: 'Armed Forces Medical College',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Government',
    affiliation: 'Maharashtra University of Health Sciences, Ministry of Defence',
    naac_grade: 'A',
    established_year: 1948,
    description: 'AFMC Pune is India\'s premier defence medical college, offering MBBS at no cost to sponsored armed forces candidates and a few civilian seats through NEET.',
    address: 'Sholapur Road, Wanowrie, Pune',
    pincode: '411040',
    avg_fees_per_year: 0,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 150, fees_per_year: 0, entrance_exam: 'NEET-UG + AFMC Interview' },
      { name: 'MD General Medicine', level: 'PG', duration_years: 3, seats: 10, fees_per_year: 0, entrance_exam: 'NEET-PG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2670-5000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'commandant@afmc.nic.in', label: 'Commandant\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.afmc.nic.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Bharati Vidyapeeth Medical College Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Medical',
    college_type: 'Private',
    affiliation: 'Maharashtra University of Health Sciences',
    naac_grade: 'A',
    established_year: 1989,
    description: 'A well-regarded private medical college in Pune, part of the Bharati Vidyapeeth group, offering MBBS and postgraduate medical specializations with attached teaching hospital.',
    address: 'Dhankawadi, Pune-Satara Road, Pune',
    pincode: '411043',
    avg_fees_per_year: 1000000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 150, fees_per_year: 1000000, entrance_exam: 'NEET-UG' },
      { name: 'MD Paediatrics', level: 'PG', duration_years: 3, seats: 6, fees_per_year: 600000, entrance_exam: 'NEET-PG' },
      { name: 'B.Sc Nursing', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 90000, entrance_exam: 'NEET-UG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2437-4455', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@bvdumc.edu.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.bvucoem.edu.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — MANAGEMENT (MUMBAI)
  // ============================================================
  {
    name: 'Jamnalal Bajaj Institute of Management Studies',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Management',
    college_type: 'Government',
    affiliation: 'University of Mumbai',
    naac_grade: 'A++',
    established_year: 1965,
    description: 'Popularly known as JBIMS, this is Maharashtra\'s top-ranked government business school. Part of University of Mumbai, it is known for an extremely competitive MMS program accepted on CET score.',
    address: 'Churchgate, Mumbai',
    pincode: '400020',
    avg_fees_per_year: 350000,
    courses: [
      { name: 'MMS (Master of Management Studies)', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 350000, entrance_exam: 'MAH-MBA-CET / CAT / CMAT' },
      { name: 'M.Sc Finance', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 120000, entrance_exam: 'MAH-MBA-CET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2202-8088', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@jbims.edu', label: 'Director\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.jbims.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'SP Jain Institute of Management and Research',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Management',
    college_type: 'Private',
    affiliation: 'AICTE, Autonomous',
    naac_grade: 'A++',
    established_year: 1981,
    description: 'A globally ranked business school in Mumbai, SP Jain is known for its flagship PGDM program, ethics-based management education, and strong placements in consulting, FMCG, and finance.',
    address: 'Munshi Nagar, Dadabhai Road, Andheri (W), Mumbai',
    pincode: '400058',
    avg_fees_per_year: 1900000,
    courses: [
      { name: 'PGDM (Post Graduate Diploma in Management)', level: 'PG', duration_years: 2, seats: 240, fees_per_year: 1900000, entrance_exam: 'CAT / XAT / GMAT' },
      { name: 'PGDM Executive', level: 'PG', duration_years: 1, seats: 80, fees_per_year: 1600000, entrance_exam: 'GMAT + Work Experience' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-6145-0000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@spjimr.org', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.spjimr.org', label: 'Official Website' },
    ],
  },
  {
    name: 'NMIMS School of Business Management',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Management',
    college_type: 'Private',
    affiliation: 'SVKM\'s NMIMS Deemed University, AICTE',
    naac_grade: 'A+',
    established_year: 1981,
    description: 'The flagship business school of NMIMS University, offering one of India\'s most sought-after MBA programs admitted via NMAT. Known for Finance and Marketing specializations.',
    address: 'Vile Parle (W), Mumbai',
    pincode: '400056',
    avg_fees_per_year: 1450000,
    courses: [
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 520, fees_per_year: 1450000, entrance_exam: 'NMAT by GMAC' },
      { name: 'MBA Pharmaceutical Management', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 900000, entrance_exam: 'NMAT by GMAC' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-4235-5555', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@nmims.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.nmims.edu/sbm', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — LAW (MUMBAI + PUNE)
  // ============================================================
  {
    name: 'Government Law College Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Law',
    college_type: 'Government',
    affiliation: 'Bar Council of India, University of Mumbai',
    naac_grade: 'A',
    established_year: 1855,
    description: 'India\'s oldest law college (est. 1855), GLC Mumbai is a premier government institution known for producing India\'s top legal luminaries, politicians, and jurists at very affordable fees.',
    address: 'Churchgate, Mumbai',
    pincode: '400020',
    avg_fees_per_year: 5000,
    courses: [
      { name: 'LLB (3-year)', level: 'UG', duration_years: 3, seats: 900, fees_per_year: 5000, entrance_exam: 'MH-LLB Entrance Test' },
      { name: 'BA LLB (5-year)', level: 'UG', duration_years: 5, seats: 120, fees_per_year: 6000, entrance_exam: 'MH-LLB Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2281-9002', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@glcmumbai.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.glcmumbai.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'ILS Law College',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Law',
    college_type: 'Autonomous',
    affiliation: 'Bar Council of India, Savitribai Phule Pune University',
    naac_grade: 'A',
    established_year: 1924,
    description: 'The Indian Law Society\'s Law College is one of Maharashtra\'s oldest and most reputed law institutions, offering integrated and traditional LLB programs in a heritage campus setting.',
    address: 'Law College Road, Pune',
    pincode: '411004',
    avg_fees_per_year: 12000,
    courses: [
      { name: 'BA LLB (5-year)', level: 'UG', duration_years: 5, seats: 180, fees_per_year: 12000, entrance_exam: 'Merit / Entrance Test' },
      { name: 'LLB (3-year)', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 10000, entrance_exam: 'Merit / Entrance Test' },
      { name: 'LLM', level: 'PG', duration_years: 1, seats: 60, fees_per_year: 15000, entrance_exam: 'Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2565-7537', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'secretary@ilslaw.edu', label: 'Secretary\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.ilslaw.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Symbiosis Law School Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Law',
    college_type: 'Private',
    affiliation: 'Symbiosis International Deemed University, Bar Council of India',
    naac_grade: 'A',
    established_year: 1977,
    description: 'A leading private law school in Pune under Symbiosis, known for its integrated BA LLB and BBA LLB programs, moot court tradition, and strong corporate and IP law placements.',
    address: 'Senapati Bapat Road, Pune',
    pincode: '411004',
    avg_fees_per_year: 400000,
    courses: [
      { name: 'BA LLB (5-year)', level: 'UG', duration_years: 5, seats: 120, fees_per_year: 400000, entrance_exam: 'SLAT (Symbiosis Law Admission Test)' },
      { name: 'BBA LLB (5-year)', level: 'UG', duration_years: 5, seats: 60, fees_per_year: 420000, entrance_exam: 'SLAT' },
      { name: 'LLM', level: 'PG', duration_years: 1, seats: 30, fees_per_year: 280000, entrance_exam: 'SLAT PG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2520-3290', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@symlaw.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.symlaw.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — ARTS / SCIENCE (MUMBAI)
  // ============================================================
  {
    name: 'St. Xavier\'s College Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Arts',
    college_type: 'Autonomous',
    affiliation: 'University of Mumbai',
    naac_grade: 'A++',
    established_year: 1869,
    description: 'One of Mumbai\'s most prestigious autonomous colleges, St. Xavier\'s offers liberal arts and science programs in a stunning Gothic-style campus in the heart of South Mumbai.',
    address: '5, Mahapalika Marg, Near CST, Mumbai',
    pincode: '400001',
    avg_fees_per_year: 40000,
    courses: [
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 40000, entrance_exam: 'Merit-based' },
      { name: 'BA English', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 38000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Physics', level: 'UG', duration_years: 3, seats: 50, fees_per_year: 42000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Life Sciences', level: 'UG', duration_years: 3, seats: 50, fees_per_year: 42000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2262-0661', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@xaviers.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://xaviers.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Elphinstone College',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Arts',
    college_type: 'Government',
    affiliation: 'University of Mumbai',
    naac_grade: 'A',
    established_year: 1856,
    description: 'One of Mumbai\'s oldest government colleges, Elphinstone College is celebrated for its rich academic tradition, heritage building, and affordable undergraduate arts and science programs.',
    address: '156, Mahapalika Marg, Mumbai',
    pincode: '400001',
    avg_fees_per_year: 10000,
    courses: [
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'BA History', level: 'UG', duration_years: 3, seats: 100, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Mathematics', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 10000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2265-7891', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@elphinstone.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.elphinstonecollege.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Wilson College',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Arts',
    college_type: 'Private',
    affiliation: 'University of Mumbai',
    naac_grade: 'A',
    established_year: 1832,
    description: 'One of Mumbai\'s oldest colleges (est. 1832), Wilson College is a private minority institution offering arts, science, and commerce programs in a historic Gothic campus at Chowpatty.',
    address: 'Chowpatty Seaface, Mumbai',
    pincode: '400007',
    avg_fees_per_year: 22000,
    courses: [
      { name: 'BA Psychology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 22000, entrance_exam: 'Merit-based' },
      { name: 'BA Sociology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 22000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Chemistry', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 25000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2361-4771', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@wilsoncollege.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.wilsoncollege.edu', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — COMMERCE (MUMBAI)
  // ============================================================
  {
    name: 'HR College of Commerce and Economics',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Commerce',
    college_type: 'Private',
    affiliation: 'University of Mumbai',
    naac_grade: 'A+',
    established_year: 1961,
    description: 'One of Mumbai\'s top commerce colleges under the SVKM group, HR College is known for B.Com, BMS, and BAF programs with competitive cutoffs and active student activities.',
    address: 'Vidyanagari, Churchgate, Mumbai',
    pincode: '400020',
    avg_fees_per_year: 48000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 48000, entrance_exam: 'Merit-based' },
      { name: 'BMS (Bachelor of Management Studies)', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 65000, entrance_exam: 'Merit-based' },
      { name: 'BAF (Banking, Accounting and Finance)', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 52000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2202-1604', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@hrcollege.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.hrcollege.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Mithibai College of Arts, Science and Commerce',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Commerce',
    college_type: 'Private',
    affiliation: 'University of Mumbai',
    naac_grade: 'A+',
    established_year: 1961,
    description: 'A hugely popular autonomous college in Vile Parle, Mithibai is famous for its buzzing campus life, multiple festivals, and strong arts, commerce, and science programs.',
    address: 'Vile Parle (W), Mumbai',
    pincode: '400056',
    avg_fees_per_year: 42000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 480, fees_per_year: 42000, entrance_exam: 'Merit-based' },
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 40000, entrance_exam: 'Merit-based' },
      { name: 'BMS (Bachelor of Management Studies)', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 58000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Information Technology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 45000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2619-3476', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mithibai.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.mithibai.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — COMMERCE / SCIENCE (PUNE)
  // ============================================================
  {
    name: 'Brihan Maharashtra College of Commerce',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Commerce',
    college_type: 'Autonomous',
    affiliation: 'Savitribai Phule Pune University',
    naac_grade: 'A+',
    established_year: 1943,
    description: 'BMCC is Pune\'s most prominent commerce college, known for B.Com, BBA, and MBA programs. Its central location, heritage status, and affordable fees make it highly sought-after.',
    address: 'Shivajinagar, Pune',
    pincode: '411005',
    avg_fees_per_year: 15000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 600, fees_per_year: 15000, entrance_exam: 'Merit-based' },
      { name: 'BBA (Bachelor of Business Administration)', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 35000, entrance_exam: 'Merit-based' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 60000, entrance_exam: 'MAH-MBA-CET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2553-7680', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@bmcc.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.bmcc.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Abasaheb Garware College',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Science',
    college_type: 'Autonomous',
    affiliation: 'Savitribai Phule Pune University',
    naac_grade: 'A',
    established_year: 1945,
    description: 'A well-regarded autonomous college in Karve Road, Pune, known for its science programs, research activity, and a broad range of undergraduate offerings in sciences and arts.',
    address: 'Karve Road, Pune',
    pincode: '411004',
    avg_fees_per_year: 16000,
    courses: [
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 80, fees_per_year: 16000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Mathematics', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 14000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Microbiology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 16000, entrance_exam: 'Merit-based' },
      { name: 'M.Sc Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 20000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2543-6418', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@agcollege.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.agcollege.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — DESIGN (MUMBAI + PUNE)
  // ============================================================
  {
    name: 'Sir JJ School of Art',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Design',
    college_type: 'Government',
    affiliation: 'University of Mumbai, Government of Maharashtra',
    naac_grade: 'A',
    established_year: 1857,
    description: 'One of India\'s oldest and most renowned art and design institutions, Sir JJ School of Art has produced generations of India\'s finest painters, sculptors, architects, and designers.',
    address: 'Sir JJ Marg, Byculla, Mumbai',
    pincode: '400001',
    avg_fees_per_year: 25000,
    courses: [
      { name: 'B.F.A. Applied Arts', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 25000, entrance_exam: 'JJ Entrance Exam' },
      { name: 'B.F.A. Painting', level: 'UG', duration_years: 4, seats: 40, fees_per_year: 22000, entrance_exam: 'JJ Entrance Exam' },
      { name: 'M.F.A. Applied Arts', level: 'PG', duration_years: 2, seats: 20, fees_per_year: 30000, entrance_exam: 'JJ Entrance Exam' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2373-1969', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'jjschool@gmail.com', label: 'Enquiry Email' },
      { contact_type: 'website', contact_value: 'https://www.sirjjschoolofart.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Symbiosis Institute of Design',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Design',
    college_type: 'Private',
    affiliation: 'Symbiosis International Deemed University',
    naac_grade: 'A',
    established_year: 2005,
    description: 'A leading design school in Pune under Symbiosis, offering undergraduate and postgraduate programs in product design, communication design, and fashion design with a modern studio campus.',
    address: 'Symbiosis Infotech Campus, Plot No 15, Rajiv Gandhi Infotech Park, Hinjewadi, Pune',
    pincode: '411057',
    avg_fees_per_year: 380000,
    courses: [
      { name: 'B.Des Communication Design', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 380000, entrance_exam: 'SID Entrance Exam' },
      { name: 'B.Des Product Design', level: 'UG', duration_years: 4, seats: 40, fees_per_year: 380000, entrance_exam: 'SID Entrance Exam' },
      { name: 'M.Des', level: 'PG', duration_years: 2, seats: 25, fees_per_year: 300000, entrance_exam: 'SID Entrance Exam' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-6622-9900', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@sid.edu.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.sid.edu.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — JUNIOR COLLEGES / XI–XII (MUMBAI)
  // ============================================================
  {
    name: 'St. Xavier\'s Junior College (HSC) Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Autonomous',
    affiliation: 'Maharashtra State Board (HSC), University of Mumbai',
    naac_grade: null,
    established_year: 1869,
    description: 'The junior college wing of the prestigious St. Xavier\'s College Mumbai, offering Science, Commerce, and Arts for Class XI–XII with extremely high merit cutoffs and a vibrant student culture.',
    address: '5, Mahapalika Marg, Near CST, Mumbai',
    pincode: '400001',
    avg_fees_per_year: 38000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 38000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 160, fees_per_year: 38000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 240, fees_per_year: 35000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Arts', level: 'XI-XII', duration_years: 2, seats: 120, fees_per_year: 32000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2262-0661', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@xaviers.edu', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://xaviers.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'KC College Junior Section (HSC) Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1954,
    description: 'Hyderabad (Sind) National Collegiate Board\'s KC College is among South Mumbai\'s top junior colleges, known for its Science and Commerce streams and a highly competitive admissions process.',
    address: 'Vidyanagari, Churchgate, Mumbai',
    pincode: '400020',
    avg_fees_per_year: 30000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 30000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 120, fees_per_year: 30000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 280, fees_per_year: 28000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2202-1546', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'info@kccollege.edu.in', label: 'Enquiry Email' },
      { contact_type: 'website', contact_value: 'https://www.kccollege.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Mithibai Junior College (HSC) Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1961,
    description: 'One of Mumbai\'s most vibrant and popular junior colleges in Vile Parle, Mithibai Junior offers Science, Commerce, and Arts for Class XI–XII with a famous cultural festival tradition.',
    address: 'Vile Parle (W), Mumbai',
    pincode: '400056',
    avg_fees_per_year: 35000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 320, fees_per_year: 35000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 35000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 400, fees_per_year: 32000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Arts', level: 'XI-XII', duration_years: 2, seats: 160, fees_per_year: 28000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2619-3476', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mithibai.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.mithibai.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Bhavan\'s College Junior Section (HSC) Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1946,
    description: 'Bharatiya Vidya Bhavan\'s Andheri college is a trusted and affordable junior college in suburban Mumbai offering Science, Commerce, and Arts for Class XI–XII students.',
    address: 'Munshi Nagar, Andheri (W), Mumbai',
    pincode: '400058',
    avg_fees_per_year: 20000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 240, fees_per_year: 20000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 160, fees_per_year: 20000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 320, fees_per_year: 18000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2670-5981', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@bhavans.info', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.bhavans.info', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — JUNIOR COLLEGES / XI–XII (PUNE)
  // ============================================================
  {
    name: 'BMCC Junior College (HSC) Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Autonomous',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1943,
    description: 'The junior college wing of Brihan Maharashtra College of Commerce, one of Pune\'s most sought-after junior colleges for Commerce and Arts streams, with very affordable fees.',
    address: 'Shivajinagar, Pune',
    pincode: '411005',
    avg_fees_per_year: 12000,
    courses: [
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 480, fees_per_year: 12000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Arts', level: 'XI-XII', duration_years: 2, seats: 240, fees_per_year: 10000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Science', level: 'XI-XII', duration_years: 2, seats: 160, fees_per_year: 13000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2553-7680', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@bmcc.ac.in', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.bmcc.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Modern College Junior Section (HSC) Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1962,
    description: 'Modern Education Society\'s Modern College is one of Pune\'s largest junior colleges, offering Science, Commerce, and Arts streams with good infrastructure and an active student community.',
    address: 'Shivajinagar, Pune',
    pincode: '411005',
    avg_fees_per_year: 14000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 400, fees_per_year: 14000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 280, fees_per_year: 14000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 480, fees_per_year: 12000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2553-5818', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@modernpune.com', label: 'Principal\'s Office' },
      { contact_type: 'website', contact_value: 'https://www.modernpune.com', label: 'Official Website' },
    ],
  },
  {
    name: 'Abhinav Education Society Junior College Pune',
    city: 'Pune',
    state: 'Maharashtra',
    stream: 'Junior College',
    college_type: 'Private',
    affiliation: 'Maharashtra State Board (HSC)',
    naac_grade: null,
    established_year: 1978,
    description: 'A respected junior college in Narayan Peth, Pune, offering Science, Commerce, and Arts for Class XI–XII. Known for discipline, good teaching standards, and reasonable fees.',
    address: 'Narayan Peth, Pune',
    pincode: '411030',
    avg_fees_per_year: 16000,
    courses: [
      { name: 'Class XI – Science (PCM)', level: 'XI-XII', duration_years: 2, seats: 160, fees_per_year: 16000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Science (PCB)', level: 'XI-XII', duration_years: 2, seats: 120, fees_per_year: 16000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI – Commerce', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 14000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2445-4567', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'info@abhinaveducation.in', label: 'Enquiry Email' },
      { contact_type: 'website', contact_value: 'https://www.abhinaveducation.in', label: 'Official Website' },
    ],
  },
  // ============================================================
  // MAHARASHTRA — MORE MUMBAI
  // ============================================================
  {
    name: 'Institute of Chemical Technology',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Autonomous', affiliation: 'UGC, Deemed University', naac_grade: 'A++',
    established_year: 1933,
    description: 'ICT Mumbai (formerly UDCT) is a globally recognised institute for chemical engineering and applied sciences, consistently ranked among the top chemical technology schools worldwide.',
    address: 'Nathalal Parekh Marg, Matunga, Mumbai', pincode: '400019', avg_fees_per_year: 70000,
    courses: [
      { name: 'B.Tech Chemical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 70000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Food Engineering and Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 68000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.Tech Chemical Engineering', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 55000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-3361-1111', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@ictmumbai.edu.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.ictmumbai.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Fr. Conceicao Rodrigues College of Engineering',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1984,
    description: 'Fr. CRCE Bandra is one of the well-regarded private engineering institutions in Mumbai, known for strong IT and Computer Engineering programs and good campus culture.',
    address: 'Fr. Agnel Ashram, Bandra (W), Mumbai', pincode: '400050', avg_fees_per_year: 150000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 150000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Information Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 148000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 145000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2642-3499', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@frcrce.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.frcrce.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Sardar Patel Institute of Technology',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1991,
    description: "SPIT is a premier private engineering college in Andheri (Mumbai) under the Bhavan's group, known for strong industry placements and excellent Computer Engineering programs.",
    address: "Bhavan's Campus, Andheri (W), Mumbai", pincode: '400058', avg_fees_per_year: 152000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 152000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 148000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Information Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 150000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2670-9000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@spit.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.spit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Welingkar Institute of Management Development and Research',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Management',
    college_type: 'Private', affiliation: 'AICTE, University of Mumbai', naac_grade: 'A',
    established_year: 1977,
    description: 'Welingkar Institute is one of the leading management schools in Mumbai offering an innovative PGDM curriculum with focus on design thinking, innovation, and entrepreneurship.',
    address: 'L. Napoo Road, Matunga (C.Rly.), Mumbai', pincode: '400019', avg_fees_per_year: 800000,
    courses: [
      { name: 'PGDM', level: 'PG', duration_years: 2, seats: 240, fees_per_year: 800000, entrance_exam: 'CAT / XAT / CMAT / ATMA' },
      { name: 'PGDM Executive', level: 'PG', duration_years: 1, seats: 60, fees_per_year: 600000, entrance_exam: 'Work Experience + Interview' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2419-8300', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'pgdm@welingkar.org', label: 'PGDM Admissions' },
      { contact_type: 'website', contact_value: 'https://www.welingkar.org', label: 'Official Website' },
    ],
  },
  {
    name: 'Sophia College for Women',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Arts',
    college_type: 'Private', affiliation: 'University of Mumbai', naac_grade: 'A++',
    established_year: 1941,
    description: 'A prestigious women-only college in South Mumbai run by the Society of Jesus, offering arts, science, and commerce programs in a serene heritage campus.',
    address: 'Bhulabhai Desai Road, Mumbai', pincode: '400026', avg_fees_per_year: 35000,
    courses: [
      { name: 'BA English', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 35000, entrance_exam: 'Merit-based' },
      { name: 'BA Sociology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 35000, entrance_exam: 'Merit-based' },
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 32000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 38000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2363-1811', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@sophiacollege.org', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.sophiacollege.org', label: 'Official Website' },
    ],
  },
  {
    name: 'VG Vaze College of Arts Science and Commerce',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Science',
    college_type: 'Private', affiliation: 'University of Mumbai', naac_grade: 'A',
    established_year: 1965,
    description: 'One of the most popular colleges in Mulund, VG Vaze offers science, arts, and commerce programs with a vibrant campus life and strong science department.',
    address: 'Mithagar Road, Mulund (E), Mumbai', pincode: '400081', avg_fees_per_year: 26000,
    courses: [
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 26000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Biotechnology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 28000, entrance_exam: 'Merit-based' },
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 22000, entrance_exam: 'Merit-based' },
      { name: 'BA Mass Media', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 30000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2163-3488', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@vazecollege.net', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.vazecollege.net', label: 'Official Website' },
    ],
  },
  {
    name: 'Mulund College of Commerce Junior Section',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Junior College',
    college_type: 'Private', affiliation: 'Maharashtra State Board (HSC)', naac_grade: null,
    established_year: 1964,
    description: 'MCC Mulund is a popular junior college in Mumbai offering Commerce and Science streams at affordable fees with active co-curricular programs.',
    address: 'T.H. Kataria Marg, Mulund (W), Mumbai', pincode: '400080', avg_fees_per_year: 25000,
    courses: [
      { name: 'Class XI Commerce', level: 'XI-XII', duration_years: 2, seats: 480, fees_per_year: 25000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI Science PCM', level: 'XI-XII', duration_years: 2, seats: 240, fees_per_year: 27000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI Arts', level: 'XI-XII', duration_years: 2, seats: 120, fees_per_year: 22000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2167-0371', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mccmulund.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.mccmulund.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — MORE PUNE
  // ============================================================
  {
    name: 'MIT World Peace University',
    city: 'Pune', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'MIT-WPU, AICTE', naac_grade: 'A+',
    established_year: 2017,
    description: 'MIT World Peace University is a futuristic university in Pune offering engineering, management, and liberal arts programs with a unique emphasis on global citizenship and innovation.',
    address: 'S. No. 124, Paud Road, Kothrud, Pune', pincode: '411038', avg_fees_per_year: 220000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering AI ML', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 220000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Electronics and Computer Science', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 215000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'MBA Innovation and Entrepreneurship', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 280000, entrance_exam: 'MAH-MBA-CET / CAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-7117-7104', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@mitwpu.edu.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.mitwpu.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Symbiosis College of Arts and Commerce',
    city: 'Pune', state: 'Maharashtra', stream: 'Commerce',
    college_type: 'Private', affiliation: 'Savitribai Phule Pune University', naac_grade: 'A',
    established_year: 1983,
    description: 'A leading co-educational arts and commerce college under the Symbiosis group, known for dynamic student culture, international exposure, and modern facilities in Pune.',
    address: 'Senapati Bapat Road, Pune', pincode: '411016', avg_fees_per_year: 60000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 480, fees_per_year: 60000, entrance_exam: 'Merit-based' },
      { name: 'BA', level: 'UG', duration_years: 3, seats: 240, fees_per_year: 55000, entrance_exam: 'Merit-based' },
      { name: 'M.Com', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 40000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2567-3243', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@symbiosis.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.symbiosis.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'SP College Pune',
    city: 'Pune', state: 'Maharashtra', stream: 'Science',
    college_type: 'Government', affiliation: 'Savitribai Phule Pune University', naac_grade: 'A+',
    established_year: 1916,
    description: 'Sir Parashurambhau College is one of the oldest and most prestigious colleges in Pune, known for excellence in science and arts programs and a beautiful heritage campus.',
    address: 'Tilak Road, Sadashiv Peth, Pune', pincode: '411030', avg_fees_per_year: 12000,
    courses: [
      { name: 'B.Sc Physics', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 12000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Chemistry', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 12000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Mathematics', level: 'UG', duration_years: 3, seats: 75, fees_per_year: 11000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Electronics', level: 'UG', duration_years: 3, seats: 45, fees_per_year: 13000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2443-6350', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@spcollege.edu.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.spcollege.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Indira College of Engineering and Management Pune',
    city: 'Pune', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Savitribai Phule Pune University, AICTE', naac_grade: 'A',
    established_year: 1999,
    description: 'ICEM Pune is a growing private engineering college offering multiple engineering disciplines with modern infrastructure and active placement support.',
    address: 'Parandwadi, Maval, Pune', pincode: '410506', avg_fees_per_year: 130000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 130000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 125000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 120000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-21-3522-3170', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@indiraicem.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.indiraicem.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Saraswati Junior College Pune',
    city: 'Pune', state: 'Maharashtra', stream: 'Junior College',
    college_type: 'Private', affiliation: 'Maharashtra State Board (HSC)', naac_grade: null,
    established_year: 1970,
    description: 'Saraswati Junior College is a trusted name for Class XI-XII in Pune, known for excellent Science and Commerce stream results and dedicated faculty.',
    address: 'Deccan Gymkhana, Pune', pincode: '411004', avg_fees_per_year: 20000,
    courses: [
      { name: 'Class XI Science PCM', level: 'XI-XII', duration_years: 2, seats: 280, fees_per_year: 20000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI Science PCB', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 20000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI Commerce', level: 'XI-XII', duration_years: 2, seats: 360, fees_per_year: 18000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2567-5000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'info@saraswatipune.ac.in', label: 'Enquiry Email' },
      { contact_type: 'website', contact_value: 'https://www.saraswatipune.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — SANGLI, NASHIK, NAGPUR, NAVI MUMBAI, THANE
  // AURANGABAD, KOLHAPUR, AMRAVATI
  // ============================================================
  {
    name: 'Walchand College of Engineering Sangli',
    city: 'Sangli', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Autonomous', affiliation: 'Shivaji University, AICTE', naac_grade: 'A+',
    established_year: 1947,
    description: 'Walchand College of Engineering is one of the oldest autonomous engineering institutes in Maharashtra with a strong tradition in core disciplines and research.',
    address: 'Vishrambag, Sangli', pincode: '416415', avg_fees_per_year: 95000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 95000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 92000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.E. Machine Design', level: 'PG', duration_years: 2, seats: 18, fees_per_year: 70000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-233-230-1321', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@walchandsangli.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.walchandsangli.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'KK Wagh College of Engineering Nashik',
    city: 'Nashik', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Savitribai Phule Pune University, AICTE', naac_grade: 'A',
    established_year: 1984,
    description: 'K.K. Wagh College is one of the leading private engineering colleges in Nashik, known for strong core programs and industry linkages with the manufacturing hub.',
    address: 'Hirabai Haridas Vidyanagari, Amrutdham, Nashik', pincode: '422003', avg_fees_per_year: 120000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 120000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 115000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 118000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-253-259-0577', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@kkwagh.edu.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.kkwagh.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'HPT Arts and RYK Science College Nashik',
    city: 'Nashik', state: 'Maharashtra', stream: 'Science',
    college_type: 'Government', affiliation: 'Savitribai Phule Pune University', naac_grade: 'A',
    established_year: 1948,
    description: 'One of the oldest and most respected colleges in Nashik, renowned for its arts, science, and commerce programs with very low fees and excellent academic results.',
    address: 'Govindnagar, Nashik', pincode: '422009', avg_fees_per_year: 10000,
    courses: [
      { name: 'B.Sc Physics', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 11000, entrance_exam: 'Merit-based' },
      { name: 'BA', level: 'UG', duration_years: 3, seats: 240, fees_per_year: 8000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-253-231-3491', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@hptryk.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.hptryk.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Visvesvaraya National Institute of Technology Nagpur',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1960,
    description: 'VNIT Nagpur is a premier NIT in central India named after M. Visvesvaraya, known for strong engineering programs, research facilities, and vibrant student life.',
    address: 'South Ambazari Road, Nagpur', pincode: '440010', avg_fees_per_year: 155000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-280-1071', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@vnit.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.vnit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Shri Ramdeobaba College of Engineering and Management',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'RTM Nagpur University, AICTE', naac_grade: 'A+',
    established_year: 1984,
    description: 'RCOEM (Ramdeobaba) is the most prominent private engineering college in Nagpur, known for exceptional placements, modern labs, and strong computer science programs.',
    address: 'Gittikhadan, Katol Road, Nagpur', pincode: '440013', avg_fees_per_year: 130000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 130000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 125000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 120000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 120000, entrance_exam: 'MAH-MBA-CET / CAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-233-2543', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@rknec.edu', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.rknec.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Government Medical College Nagpur',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Medical',
    college_type: 'Government', affiliation: 'Maharashtra University of Health Sciences', naac_grade: null,
    established_year: 1947,
    description: 'Government Medical College Nagpur, attached to Mayo Hospital, is one of the oldest medical institutions in Vidarbha providing MBBS and PG education at subsidised fees.',
    address: 'Medical Square, Nagpur', pincode: '440003', avg_fees_per_year: 20000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 200, fees_per_year: 20000, entrance_exam: 'NEET-UG' },
      { name: 'MD General Medicine', level: 'PG', duration_years: 3, seats: 12, fees_per_year: 25000, entrance_exam: 'NEET-PG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-254-2802', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'gmcnagpur@gmail.com', label: 'Dean Office' },
      { contact_type: 'website', contact_value: 'https://www.gmcnagpur.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'YCCE Nagpur (Yeshwantrao Chavan College of Engineering)',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Government', affiliation: 'RTM Nagpur University, AICTE', naac_grade: 'A',
    established_year: 1984,
    description: 'YCCE Nagpur is a well-known government-aided engineering college in Vidarbha with affordable fees and strong computer science and mechanical engineering programs.',
    address: 'Wanadongri, Hingna Road, Nagpur', pincode: '441110', avg_fees_per_year: 55000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 55000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electrical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 52000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 52000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-298-0070', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@ycce.edu', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.ycce.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Terna Engineering College',
    city: 'Navi Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1994,
    description: 'Terna Engineering College in Nerul, Navi Mumbai, is a well-regarded private institution offering engineering programs with good placement support.',
    address: 'Sector 22, Nerul, Navi Mumbai', pincode: '400706', avg_fees_per_year: 145000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 145000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 140000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 142000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2771-5748', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@terna.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.terna.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Pillai College of Engineering',
    city: 'Navi Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1999,
    description: 'Managed by the Mahatma Education Society, Pillai College of Engineering in New Panvel is a growing engineering college known for innovative teaching and good industry connections.',
    address: 'Dr. K.M. Vasudevan Pillai Campus, New Panvel, Navi Mumbai', pincode: '410206', avg_fees_per_year: 138000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 138000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 135000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 130000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2745-6100', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mes.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.mes.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Thane College of Arts and Science',
    city: 'Thane', state: 'Maharashtra', stream: 'Commerce',
    college_type: 'Private', affiliation: 'University of Mumbai', naac_grade: 'A',
    established_year: 1968,
    description: 'One of the most established colleges in Thane offering affordable arts, science, and commerce undergraduate programs with a long tradition of academic excellence.',
    address: 'Naupada, Thane (W)', pincode: '400602', avg_fees_per_year: 22000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 22000, entrance_exam: 'Merit-based' },
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 18000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 25000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2540-2222', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@tcas.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.tcas.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Government College of Engineering Aurangabad',
    city: 'Aurangabad', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Government', affiliation: 'Dr. Babasaheb Ambedkar Marathwada University, AICTE', naac_grade: 'A',
    established_year: 1960,
    description: 'GCOEA is the premier government engineering college in Marathwada, offering affordable quality engineering education in the historic city of Aurangabad.',
    address: 'Station Road, Aurangabad', pincode: '431001', avg_fees_per_year: 55000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 55000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 52000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 50000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-240-233-1683', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@gcoea.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.gcoea.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Dr. Babasaheb Ambedkar Marathwada University',
    city: 'Aurangabad', state: 'Maharashtra', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1958,
    description: 'Named after Dr. B.R. Ambedkar, BAMU is a prominent state university in Marathwada offering humanities, social sciences, science, and management programs.',
    address: 'University Campus, Aurangabad', pincode: '431004', avg_fees_per_year: 8000,
    courses: [
      { name: 'BA Political Science', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 8000, entrance_exam: 'Merit-based' },
      { name: 'MA History', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Chemistry', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 9000, entrance_exam: 'Merit-based' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 60000, entrance_exam: 'MAH-MBA-CET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-240-240-0431', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@bamu.net', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.bamu.net', label: 'Official Website' },
    ],
  },
  {
    name: 'DY Patil College of Engineering Kolhapur',
    city: 'Kolhapur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Shivaji University, AICTE', naac_grade: 'A',
    established_year: 1983,
    description: 'D.Y. Patil College of Engineering in Kolhapur is a well-established institution in southern Maharashtra with quality engineering programs and ties to local industries.',
    address: 'Kasaba Bawada, Kolhapur', pincode: '416006', avg_fees_per_year: 100000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 100000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 98000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 95000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-231-268-8009', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@dypcoek.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.dypcoek.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Rajaram College Kolhapur',
    city: 'Kolhapur', state: 'Maharashtra', stream: 'Commerce',
    college_type: 'Government', affiliation: 'Shivaji University', naac_grade: 'A+',
    established_year: 1946,
    description: 'One of the oldest and most prestigious colleges in Kolhapur, known for arts, commerce, and science programs, a beautiful campus, and proud alumni tradition.',
    address: 'Kolhapur, Maharashtra', pincode: '416001', avg_fees_per_year: 9000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 9000, entrance_exam: 'Merit-based' },
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 8000, entrance_exam: 'Merit-based' },
      { name: 'M.Com', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 11000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-231-265-1024', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@rajaramcollege.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.rajaramcollege.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'SIPNA College of Engineering and Technology',
    city: 'Amravati', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Sant Gadge Baba Amravati University, AICTE', naac_grade: 'A',
    established_year: 1999,
    description: 'SIPNA is one of the leading private engineering colleges in Amravati, offering undergraduate and postgraduate programs with modern labs and placement support.',
    address: 'Tapadia Nagar, Amravati', pincode: '444603', avg_fees_per_year: 95000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 95000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 92000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 90000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-721-256-2622', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@sipna.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.sipna.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — UTTAR PRADESH
  // ============================================================
  {
    name: 'Indian Institute of Technology Kanpur',
    city: 'Kanpur', state: 'Uttar Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1959,
    description: 'IIT Kanpur is one of the foremost engineering institutes in India, known for pioneering research, world-class faculty, and producing global leaders in technology and entrepreneurship.',
    address: 'IIT Campus, Kanpur', pincode: '208016', avg_fees_per_year: 240000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 100, fees_per_year: 240000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 235000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Aerospace Engineering', level: 'UG', duration_years: 4, seats: 45, fees_per_year: 240000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 40, fees_per_year: 130000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-512-259-0151', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@iitk.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.iitk.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Banaras Hindu University',
    city: 'Varanasi', state: 'Uttar Pradesh', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, Central University', naac_grade: 'A++',
    established_year: 1916,
    description: 'One of the largest residential universities in Asia, BHU offers programs in arts, science, engineering, medicine, and management on its sprawling campus in Varanasi.',
    address: 'Lanka, Varanasi', pincode: '221005', avg_fees_per_year: 15000,
    courses: [
      { name: 'BA Hons Sanskrit', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 15000, entrance_exam: 'CUET' },
      { name: 'MA Philosophy', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 18000, entrance_exam: 'CUET-PG' },
      { name: 'B.Tech Computer Science', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 120000, entrance_exam: 'JEE Main' },
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 100, fees_per_year: 25000, entrance_exam: 'NEET-UG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-542-236-8558', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@bhu.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.bhu.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Motilal Nehru National Institute of Technology Allahabad',
    city: 'Prayagraj', state: 'Uttar Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1961,
    description: 'MNNIT Allahabad is a premier NIT in UP known for engineering excellence, active research culture, and strong placement record in IT and core sectors.',
    address: 'Teliarganj, Prayagraj', pincode: '211004', avg_fees_per_year: 150000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-532-227-1073', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@mnnit.ac.in', label: 'Director Office' },
      { contact_type: 'website', contact_value: 'https://www.mnnit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Aligarh Muslim University',
    city: 'Aligarh', state: 'Uttar Pradesh', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, Central University', naac_grade: 'A+',
    established_year: 1875,
    description: 'One of the most historic central universities in India offering programs in arts, sciences, law, medicine, and engineering with a rich cultural heritage.',
    address: 'Aligarh', pincode: '202002', avg_fees_per_year: 20000,
    courses: [
      { name: 'BA Hons Political Science', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 20000, entrance_exam: 'AMU Entrance Test' },
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 100, fees_per_year: 25000, entrance_exam: 'NEET-UG + AMU Quota' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 15000, entrance_exam: 'AMU Entrance Test' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 40000, entrance_exam: 'CAT + AMU Entrance' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-571-270-0920', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@amu.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.amu.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — RAJASTHAN
  // ============================================================
  {
    name: 'Malaviya National Institute of Technology Jaipur',
    city: 'Jaipur', state: 'Rajasthan', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A+',
    established_year: 1963,
    description: 'MNIT Jaipur is a premier NIT in Rajasthan known for strong engineering programs and good placements, named after Pandit Madan Mohan Malaviya.',
    address: 'J.L.N. Marg, Jaipur', pincode: '302017', avg_fees_per_year: 155000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-141-252-9065', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@mnit.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.mnit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'University of Rajasthan',
    city: 'Jaipur', state: 'Rajasthan', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1947,
    description: 'One of the oldest and largest state universities in north India, offering extensive programs in arts, science, commerce, law, and management.',
    address: 'JLN Marg, Jaipur', pincode: '302004', avg_fees_per_year: 8000,
    courses: [
      { name: 'BA Hons Economics', level: 'UG', duration_years: 3, seats: 200, fees_per_year: 8000, entrance_exam: 'Merit-based' },
      { name: 'MA History', level: 'PG', duration_years: 2, seats: 100, fees_per_year: 10000, entrance_exam: 'Entrance Test' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 12000, entrance_exam: 'Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-141-270-7177', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'vc@uniraj.ac.in', label: 'Vice-Chancellor Office' },
      { contact_type: 'website', contact_value: 'https://www.uniraj.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Manipal University Jaipur',
    city: 'Jaipur', state: 'Rajasthan', stream: 'Engineering',
    college_type: 'Private', affiliation: 'UGC, Deemed University', naac_grade: 'A',
    established_year: 2011,
    description: 'A campus of the prestigious Manipal group in Rajasthan offering engineering, management, and design programs with strong industry exposure.',
    address: 'Dehmi Kalan, Jaipur-Ajmer Expressway, Jaipur', pincode: '303007', avg_fees_per_year: 200000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 200000, entrance_exam: 'MET / JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 195000, entrance_exam: 'MET / JEE Main' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 300000, entrance_exam: 'CAT / MAT / CMAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-141-399-9100', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@jaipur.manipal.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.jaipur.manipal.edu', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — PUNJAB AND CHANDIGARH
  // ============================================================
  {
    name: 'Punjab Engineering College',
    city: 'Chandigarh', state: 'Chandigarh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Deemed University', naac_grade: 'A',
    established_year: 1947,
    description: 'PEC Chandigarh is one of north India oldest engineering colleges now a deemed university, known for strong engineering programs and excellent placement record.',
    address: 'Sector 12, Chandigarh', pincode: '160012', avg_fees_per_year: 120000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 120000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 115000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 118000, entrance_exam: 'JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-172-274-4231', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@pec.edu.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.pec.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Thapar Institute of Engineering and Technology',
    city: 'Patiala', state: 'Punjab', stream: 'Engineering',
    college_type: 'Private', affiliation: 'UGC, Deemed University', naac_grade: 'A',
    established_year: 1956,
    description: 'Thapar Institute is a highly ranked private deemed university in Punjab known for rigorous engineering programs and consistently strong placement outcomes.',
    address: 'Bhadson Road, Patiala', pincode: '147004', avg_fees_per_year: 230000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 230000, entrance_exam: 'JEE Main' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 225000, entrance_exam: 'JEE Main' },
      { name: 'M.E. Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 150000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-175-239-3021', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@thapar.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.thapar.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Panjab University',
    city: 'Chandigarh', state: 'Chandigarh', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A+',
    established_year: 1882,
    description: 'One of the oldest and most prestigious universities in India, Panjab University offers comprehensive programs in arts, sciences, law, business, and engineering.',
    address: 'Sector 14, Chandigarh', pincode: '160014', avg_fees_per_year: 15000,
    courses: [
      { name: 'BA Hons English', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 15000, entrance_exam: 'Merit-based' },
      { name: 'MA Political Science', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 18000, entrance_exam: 'Entrance Test' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 20000, entrance_exam: 'Entrance Test' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 80000, entrance_exam: 'CAT / MAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-172-253-4818', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@pu.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.puchd.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — MADHYA PRADESH
  // ============================================================
  {
    name: 'Indian Institute of Technology Indore',
    city: 'Indore', state: 'Madhya Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 2009,
    description: 'IIT Indore is a rapidly growing IIT with world-class faculty, modern infrastructure, and strong research output in central India.',
    address: 'Khandwa Road, Simrol, Indore', pincode: '453552', avg_fees_per_year: 220000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 220000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 218000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 20, fees_per_year: 120000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-731-660-3000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@iiti.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.iiti.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Technology Bhopal',
    city: 'Bhopal', state: 'Madhya Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A+',
    established_year: 1960,
    description: 'MANIT Bhopal is a prominent NIT in India offering quality engineering programs in the state capital with a sprawling 650-acre campus.',
    address: 'Bhopal', pincode: '462003', avg_fees_per_year: 148000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 145000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 142000, entrance_exam: 'JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-755-405-1000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@manit.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.manit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Devi Ahilya Vishwavidyalaya Indore',
    city: 'Indore', state: 'Madhya Pradesh', stream: 'Commerce',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1964,
    description: 'DAVV Indore is a prominent state university known for its School of Commerce and Institute of Management, offering programs in commerce, science, engineering, and law.',
    address: 'Takshashila Campus, Khandwa Road, Indore', pincode: '452001', avg_fees_per_year: 12000,
    courses: [
      { name: 'B.Com Hons', level: 'UG', duration_years: 3, seats: 240, fees_per_year: 12000, entrance_exam: 'Merit-based' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 50000, entrance_exam: 'CAT / MAT' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 10000, entrance_exam: 'Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-731-276-9321', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@dauniv.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.dauniv.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — KERALA
  // ============================================================
  {
    name: 'College of Engineering Trivandrum',
    city: 'Thiruvananthapuram', state: 'Kerala', stream: 'Engineering',
    college_type: 'Government', affiliation: 'APJ Abdul Kalam Technological University, AICTE', naac_grade: 'A',
    established_year: 1939,
    description: 'CET is the oldest and most prestigious engineering college in Kerala, known for rigorous academics, strong alumni network, and consistently top placements.',
    address: 'Engineering College P.O., Thiruvananthapuram', pincode: '695016', avg_fees_per_year: 65000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 65000, entrance_exam: 'KEAM' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 63000, entrance_exam: 'KEAM' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 18, fees_per_year: 45000, entrance_exam: 'GATE / KMAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-471-251-5568', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@cet.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.cet.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Technology Calicut',
    city: 'Kozhikode', state: 'Kerala', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1961,
    description: 'NIT Calicut is a top-ranked NIT set in a lush campus, known for its research output and consistent NIRF top-10 ranking among all NITs in India.',
    address: 'NIT Campus P.O., Calicut', pincode: '673601', avg_fees_per_year: 152000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 152000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Artificial Intelligence', level: 'PG', duration_years: 2, seats: 25, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-495-228-6101', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nitc.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nitc.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — BIHAR AND ODISHA
  // ============================================================
  {
    name: 'National Institute of Technology Patna',
    city: 'Patna', state: 'Bihar', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A',
    established_year: 1886,
    description: 'NIT Patna is one of the oldest engineering institutions in India, offering undergraduate and postgraduate programs in engineering and technology.',
    address: 'Ashok Rajpath, Patna', pincode: '800005', avg_fees_per_year: 145000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 145000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 142000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 140000, entrance_exam: 'JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-612-237-1715', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nitp.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nitp.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Technology Rourkela',
    city: 'Rourkela', state: 'Odisha', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1961,
    description: 'NIT Rourkela is among the top NITs in India, known for its beautiful campus, vibrant student life, research output, and strong placements.',
    address: 'Rourkela', pincode: '769008', avg_fees_per_year: 155000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Metallurgical and Materials Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-661-246-2020', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nitrkl.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nitrkl.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'KIIT University',
    city: 'Bhubaneswar', state: 'Odisha', stream: 'Engineering',
    college_type: 'Private', affiliation: 'UGC, Deemed University', naac_grade: 'A++',
    established_year: 1992,
    description: 'Kalinga Institute of Industrial Technology is a top-ranked private deemed university in Odisha, known for its large campus, strong engineering programs, and excellent placements.',
    address: 'Campus 14, KIIT Road, Bhubaneswar', pincode: '751024', avg_fees_per_year: 290000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 720, fees_per_year: 290000, entrance_exam: 'KIITEE / JEE Main' },
      { name: 'B.Tech Electronics and Electrical Engineering', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 285000, entrance_exam: 'KIITEE / JEE Main' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 180, fees_per_year: 350000, entrance_exam: 'CAT / XAT / CMAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-674-272-5113', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'kiit@kiit.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.kiit.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — ASSAM AND NORTH EAST
  // ============================================================
  {
    name: 'Indian Institute of Technology Guwahati',
    city: 'Guwahati', state: 'Assam', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1994,
    description: 'IIT Guwahati is a premier IIT on a stunning 285-hectare campus beside the Brahmaputra, known for research excellence and as the gateway to higher education in north-east India.',
    address: 'North Guwahati, Guwahati', pincode: '781039', avg_fees_per_year: 235000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 100, fees_per_year: 235000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 232000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 130000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-361-258-2000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@iitg.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.iitg.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Gauhati University',
    city: 'Guwahati', state: 'Assam', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1948,
    description: 'Gauhati University is the premier state university of Assam offering programs in arts, sciences, commerce, and law — the academic hub for north-east India.',
    address: 'Gopinath Bordoloi Nagar, Guwahati', pincode: '781014', avg_fees_per_year: 10000,
    courses: [
      { name: 'BA Political Science', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'MA Assamese', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 12000, entrance_exam: 'Entrance Test' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 15000, entrance_exam: 'Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-361-257-0412', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@gauhati.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.gauhati.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — SOUTH INDIA
  // ============================================================
  {
    name: 'PSG College of Technology',
    city: 'Coimbatore', state: 'Tamil Nadu', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Anna University, AICTE', naac_grade: 'A++',
    established_year: 1951,
    description: 'PSG College of Technology is a highly reputed autonomous engineering college in Coimbatore, among the top private engineering institutions in Tamil Nadu.',
    address: 'Peelamedu, Coimbatore', pincode: '641004', avg_fees_per_year: 90000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 90000, entrance_exam: 'TNEA' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 88000, entrance_exam: 'TNEA' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 85000, entrance_exam: 'TNEA' },
      { name: 'M.E. Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 60000, entrance_exam: 'GATE / TANCET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-422-434-4000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@psgtech.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.psgtech.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Amrita School of Engineering Coimbatore',
    city: 'Coimbatore', state: 'Tamil Nadu', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Amrita Vishwa Vidyapeetham, AICTE', naac_grade: 'A++',
    established_year: 1994,
    description: 'Part of Amrita Vishwa Vidyapeetham, ranked among the top 10 universities in India, offering cutting-edge engineering programs with strong research and global collaborations.',
    address: 'Ettimadai, Coimbatore', pincode: '641112', avg_fees_per_year: 195000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 195000, entrance_exam: 'AEEE / JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 190000, entrance_exam: 'AEEE / JEE Main' },
      { name: 'M.Tech Cyber Security', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 140000, entrance_exam: 'GATE / AEEE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-422-265-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@amrita.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.amrita.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'RV College of Engineering',
    city: 'Bengaluru', state: 'Karnataka', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Visvesvaraya Technological University, AICTE', naac_grade: 'A+',
    established_year: 1963,
    description: 'RVCE Bengaluru is one of the top private engineering colleges in Karnataka, known for excellent computer science programs, strong industry tie-ups, and NIRF top-100 ranking.',
    address: 'Mysore Road, RV Vidyaniketan Post, Bengaluru', pincode: '560059', avg_fees_per_year: 200000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 200000, entrance_exam: 'KCET / COMEDK' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 195000, entrance_exam: 'KCET / COMEDK' },
      { name: 'B.E. Information Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 198000, entrance_exam: 'KCET / COMEDK' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-80-6717-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@rvce.edu.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.rvce.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Manipal Institute of Technology',
    city: 'Manipal', state: 'Karnataka', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Manipal Academy of Higher Education, AICTE', naac_grade: 'A++',
    established_year: 1957,
    description: 'MIT Manipal is the flagship engineering school of Manipal Academy, one of the top private deemed universities in India, known for global curriculum and excellent placements.',
    address: 'Manipal, Udupi District, Karnataka', pincode: '576104', avg_fees_per_year: 280000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 360, fees_per_year: 280000, entrance_exam: 'MET / JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 275000, entrance_exam: 'MET / JEE Main' },
      { name: 'B.Tech Mechatronics', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 278000, entrance_exam: 'MET / JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 200000, entrance_exam: 'GATE / MET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-820-292-5506', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@manipal.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://manipal.edu/mit.html', label: 'Official Website' },
    ],
  },
  {
    name: 'Osmania University',
    city: 'Hyderabad', state: 'Telangana', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1918,
    description: 'Osmania University is one of south India oldest and largest universities, offering diverse programs in arts, sciences, commerce, law, and engineering from its historic campus.',
    address: 'Osmania University Road, Hyderabad', pincode: '500007', avg_fees_per_year: 8000,
    courses: [
      { name: 'BA Hons History', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 8000, entrance_exam: 'TSICET / Merit-based' },
      { name: 'MA Economics', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 10000, entrance_exam: 'TSICET' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 12000, entrance_exam: 'TSLAW Entrance' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 60000, entrance_exam: 'TSICET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-40-2768-2363', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@osmania.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.osmania.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Anna University',
    city: 'Chennai', state: 'Tamil Nadu', stream: 'Engineering',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A++',
    established_year: 1978,
    description: 'Anna University Chennai is a premier technical university and one of the largest in India, affiliating 500+ engineering colleges across Tamil Nadu with top-tier main campus programs.',
    address: 'Sardar Patel Road, Guindy, Chennai', pincode: '600025', avg_fees_per_year: 75000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 75000, entrance_exam: 'TNEA' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 72000, entrance_exam: 'TNEA' },
      { name: 'M.E. Computer Science and Engineering', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 55000, entrance_exam: 'TANCET / GATE' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 60000, entrance_exam: 'TANCET / CAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-44-2235-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@annauniv.edu', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.annauniv.edu', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — MORE MUMBAI
  // ============================================================
  {
    name: 'Institute of Chemical Technology',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Autonomous', affiliation: 'UGC, Deemed University', naac_grade: 'A++',
    established_year: 1933,
    description: 'ICT Mumbai (formerly UDCT) is a globally recognised institute for chemical engineering and applied sciences, consistently ranked among the top chemical technology schools worldwide.',
    address: 'Nathalal Parekh Marg, Matunga, Mumbai', pincode: '400019', avg_fees_per_year: 70000,
    courses: [
      { name: 'B.Tech Chemical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 70000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Food Engineering and Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 68000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.Tech Chemical Engineering', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 55000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-3361-1111', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@ictmumbai.edu.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.ictmumbai.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Fr. Conceicao Rodrigues College of Engineering',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1984,
    description: 'Fr. CRCE Bandra is one of the well-regarded private engineering institutions in Mumbai, known for strong IT and Computer Engineering programs and good campus culture.',
    address: 'Fr. Agnel Ashram, Bandra (W), Mumbai', pincode: '400050', avg_fees_per_year: 150000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 150000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Information Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 148000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 145000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2642-3499', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@frcrce.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.frcrce.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Sardar Patel Institute of Technology',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1991,
    description: "SPIT is a premier private engineering college in Andheri (Mumbai) under the Bhavan's group, known for strong industry placements and excellent Computer Engineering programs.",
    address: "Bhavan's Campus, Andheri (W), Mumbai", pincode: '400058', avg_fees_per_year: 152000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 152000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 148000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Information Technology', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 150000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2670-9000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@spit.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.spit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Welingkar Institute of Management Development and Research',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Management',
    college_type: 'Private', affiliation: 'AICTE, University of Mumbai', naac_grade: 'A',
    established_year: 1977,
    description: 'Welingkar Institute is one of the leading management schools in Mumbai offering an innovative PGDM curriculum with focus on design thinking, innovation, and entrepreneurship.',
    address: 'L. Napoo Road, Matunga (C.Rly.), Mumbai', pincode: '400019', avg_fees_per_year: 800000,
    courses: [
      { name: 'PGDM', level: 'PG', duration_years: 2, seats: 240, fees_per_year: 800000, entrance_exam: 'CAT / XAT / CMAT / ATMA' },
      { name: 'PGDM Executive', level: 'PG', duration_years: 1, seats: 60, fees_per_year: 600000, entrance_exam: 'Work Experience + Interview' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2419-8300', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'pgdm@welingkar.org', label: 'PGDM Admissions' },
      { contact_type: 'website', contact_value: 'https://www.welingkar.org', label: 'Official Website' },
    ],
  },
  {
    name: 'Sophia College for Women',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Arts',
    college_type: 'Private', affiliation: 'University of Mumbai', naac_grade: 'A++',
    established_year: 1941,
    description: 'A prestigious women-only college in South Mumbai run by the Society of Jesus, offering arts, science, and commerce programs in a serene heritage campus.',
    address: 'Bhulabhai Desai Road, Mumbai', pincode: '400026', avg_fees_per_year: 35000,
    courses: [
      { name: 'BA English', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 35000, entrance_exam: 'Merit-based' },
      { name: 'BA Sociology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 35000, entrance_exam: 'Merit-based' },
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 32000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 38000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2363-1811', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@sophiacollege.org', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.sophiacollege.org', label: 'Official Website' },
    ],
  },
  {
    name: 'VG Vaze College of Arts Science and Commerce',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Science',
    college_type: 'Private', affiliation: 'University of Mumbai', naac_grade: 'A',
    established_year: 1965,
    description: 'One of the most popular colleges in Mulund, VG Vaze offers science, arts, and commerce programs with a vibrant campus life and strong science department.',
    address: 'Mithagar Road, Mulund (E), Mumbai', pincode: '400081', avg_fees_per_year: 26000,
    courses: [
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 26000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Biotechnology', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 28000, entrance_exam: 'Merit-based' },
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 22000, entrance_exam: 'Merit-based' },
      { name: 'BA Mass Media', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 30000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2163-3488', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@vazecollege.net', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.vazecollege.net', label: 'Official Website' },
    ],
  },
  {
    name: 'Mulund College of Commerce Junior Section',
    city: 'Mumbai', state: 'Maharashtra', stream: 'Junior College',
    college_type: 'Private', affiliation: 'Maharashtra State Board (HSC)', naac_grade: null,
    established_year: 1964,
    description: 'MCC Mulund is a popular junior college in Mumbai offering Commerce and Science streams at affordable fees with active co-curricular programs.',
    address: 'T.H. Kataria Marg, Mulund (W), Mumbai', pincode: '400080', avg_fees_per_year: 25000,
    courses: [
      { name: 'Class XI Commerce', level: 'XI-XII', duration_years: 2, seats: 480, fees_per_year: 25000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI Science PCM', level: 'XI-XII', duration_years: 2, seats: 240, fees_per_year: 27000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
      { name: 'Class XI Arts', level: 'XI-XII', duration_years: 2, seats: 120, fees_per_year: 22000, entrance_exam: 'Merit / SSC Marks (FYJC Portal)' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2167-0371', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mccmulund.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.mccmulund.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — MORE PUNE
  // ============================================================
  {
    name: 'MIT World Peace University',
    city: 'Pune', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'MIT-WPU, AICTE', naac_grade: 'A+',
    established_year: 2017,
    description: 'MIT World Peace University is a futuristic university in Pune offering engineering, management, and liberal arts programs with a unique emphasis on global citizenship and innovation.',
    address: 'S. No. 124, Paud Road, Kothrud, Pune', pincode: '411038', avg_fees_per_year: 220000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering AI ML', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 220000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.Tech Electronics and Computer Science', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 215000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'MBA Innovation and Entrepreneurship', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 280000, entrance_exam: 'MAH-MBA-CET / CAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-7117-7104', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@mitwpu.edu.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.mitwpu.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Symbiosis College of Arts and Commerce',
    city: 'Pune', state: 'Maharashtra', stream: 'Commerce',
    college_type: 'Private', affiliation: 'Savitribai Phule Pune University', naac_grade: 'A',
    established_year: 1983,
    description: 'A leading co-educational arts and commerce college under the Symbiosis group, known for dynamic student culture, international exposure, and modern facilities in Pune.',
    address: 'Senapati Bapat Road, Pune', pincode: '411016', avg_fees_per_year: 60000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 480, fees_per_year: 60000, entrance_exam: 'Merit-based' },
      { name: 'BA', level: 'UG', duration_years: 3, seats: 240, fees_per_year: 55000, entrance_exam: 'Merit-based' },
      { name: 'M.Com', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 40000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2567-3243', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@symbiosis.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.symbiosis.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'SP College Pune',
    city: 'Pune', state: 'Maharashtra', stream: 'Science',
    college_type: 'Government', affiliation: 'Savitribai Phule Pune University', naac_grade: 'A+',
    established_year: 1916,
    description: 'Sir Parashurambhau College is one of the oldest and most prestigious colleges in Pune, known for excellence in science and arts programs and a beautiful heritage campus.',
    address: 'Tilak Road, Sadashiv Peth, Pune', pincode: '411030', avg_fees_per_year: 12000,
    courses: [
      { name: 'B.Sc Physics', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 12000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Chemistry', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 12000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Mathematics', level: 'UG', duration_years: 3, seats: 75, fees_per_year: 11000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Electronics', level: 'UG', duration_years: 3, seats: 45, fees_per_year: 13000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2443-6350', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@spcollege.edu.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.spcollege.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Indira College of Engineering and Management Pune',
    city: 'Pune', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Savitribai Phule Pune University, AICTE', naac_grade: 'A',
    established_year: 1999,
    description: 'ICEM Pune is a growing private engineering college offering multiple engineering disciplines with modern infrastructure and active placement support.',
    address: 'Parandwadi, Maval, Pune', pincode: '410506', avg_fees_per_year: 130000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 130000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 125000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 120000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-21-3522-3170', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@indiraicem.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.indiraicem.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Saraswati Junior College Pune',
    city: 'Pune', state: 'Maharashtra', stream: 'Junior College',
    college_type: 'Private', affiliation: 'Maharashtra State Board (HSC)', naac_grade: null,
    established_year: 1970,
    description: 'Saraswati Junior College is a trusted name for Class XI-XII in Pune, known for excellent Science and Commerce stream results and dedicated faculty.',
    address: 'Deccan Gymkhana, Pune', pincode: '411004', avg_fees_per_year: 20000,
    courses: [
      { name: 'Class XI Science PCM', level: 'XI-XII', duration_years: 2, seats: 280, fees_per_year: 20000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI Science PCB', level: 'XI-XII', duration_years: 2, seats: 200, fees_per_year: 20000, entrance_exam: 'Merit / SSC Marks' },
      { name: 'Class XI Commerce', level: 'XI-XII', duration_years: 2, seats: 360, fees_per_year: 18000, entrance_exam: 'Merit / SSC Marks' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-20-2567-5000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'info@saraswatipune.ac.in', label: 'Enquiry Email' },
      { contact_type: 'website', contact_value: 'https://www.saraswatipune.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // MAHARASHTRA — SANGLI, NASHIK, NAGPUR, NAVI MUMBAI, THANE
  // AURANGABAD, KOLHAPUR, AMRAVATI
  // ============================================================
  {
    name: 'Walchand College of Engineering Sangli',
    city: 'Sangli', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Autonomous', affiliation: 'Shivaji University, AICTE', naac_grade: 'A+',
    established_year: 1947,
    description: 'Walchand College of Engineering is one of the oldest autonomous engineering institutes in Maharashtra with a strong tradition in core disciplines and research.',
    address: 'Vishrambag, Sangli', pincode: '416415', avg_fees_per_year: 95000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 95000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 92000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'M.E. Machine Design', level: 'PG', duration_years: 2, seats: 18, fees_per_year: 70000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-233-230-1321', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@walchandsangli.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.walchandsangli.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'KK Wagh College of Engineering Nashik',
    city: 'Nashik', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Savitribai Phule Pune University, AICTE', naac_grade: 'A',
    established_year: 1984,
    description: 'K.K. Wagh College is one of the leading private engineering colleges in Nashik, known for strong core programs and industry linkages with the manufacturing hub.',
    address: 'Hirabai Haridas Vidyanagari, Amrutdham, Nashik', pincode: '422003', avg_fees_per_year: 120000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 120000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 115000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 118000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-253-259-0577', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@kkwagh.edu.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.kkwagh.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'HPT Arts and RYK Science College Nashik',
    city: 'Nashik', state: 'Maharashtra', stream: 'Science',
    college_type: 'Government', affiliation: 'Savitribai Phule Pune University', naac_grade: 'A',
    established_year: 1948,
    description: 'One of the oldest and most respected colleges in Nashik, renowned for its arts, science, and commerce programs with very low fees and excellent academic results.',
    address: 'Govindnagar, Nashik', pincode: '422009', avg_fees_per_year: 10000,
    courses: [
      { name: 'B.Sc Physics', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 11000, entrance_exam: 'Merit-based' },
      { name: 'BA', level: 'UG', duration_years: 3, seats: 240, fees_per_year: 8000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-253-231-3491', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@hptryk.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.hptryk.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Visvesvaraya National Institute of Technology Nagpur',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1960,
    description: 'VNIT Nagpur is a premier NIT in central India named after M. Visvesvaraya, known for strong engineering programs, research facilities, and vibrant student life.',
    address: 'South Ambazari Road, Nagpur', pincode: '440010', avg_fees_per_year: 155000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-280-1071', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@vnit.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.vnit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Shri Ramdeobaba College of Engineering and Management',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'RTM Nagpur University, AICTE', naac_grade: 'A+',
    established_year: 1984,
    description: 'RCOEM (Ramdeobaba) is the most prominent private engineering college in Nagpur, known for exceptional placements, modern labs, and strong computer science programs.',
    address: 'Gittikhadan, Katol Road, Nagpur', pincode: '440013', avg_fees_per_year: 130000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 130000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 125000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 120000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 120000, entrance_exam: 'MAH-MBA-CET / CAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-233-2543', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@rknec.edu', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.rknec.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Government Medical College Nagpur',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Medical',
    college_type: 'Government', affiliation: 'Maharashtra University of Health Sciences', naac_grade: null,
    established_year: 1947,
    description: 'Government Medical College Nagpur, attached to Mayo Hospital, is one of the oldest medical institutions in Vidarbha providing MBBS and PG education at subsidised fees.',
    address: 'Medical Square, Nagpur', pincode: '440003', avg_fees_per_year: 20000,
    courses: [
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 200, fees_per_year: 20000, entrance_exam: 'NEET-UG' },
      { name: 'MD General Medicine', level: 'PG', duration_years: 3, seats: 12, fees_per_year: 25000, entrance_exam: 'NEET-PG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-254-2802', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'gmcnagpur@gmail.com', label: 'Dean Office' },
      { contact_type: 'website', contact_value: 'https://www.gmcnagpur.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'YCCE Nagpur (Yeshwantrao Chavan College of Engineering)',
    city: 'Nagpur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Government', affiliation: 'RTM Nagpur University, AICTE', naac_grade: 'A',
    established_year: 1984,
    description: 'YCCE Nagpur is a well-known government-aided engineering college in Vidarbha with affordable fees and strong computer science and mechanical engineering programs.',
    address: 'Wanadongri, Hingna Road, Nagpur', pincode: '441110', avg_fees_per_year: 55000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 55000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electrical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 52000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 52000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-712-298-0070', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@ycce.edu', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.ycce.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Terna Engineering College',
    city: 'Navi Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1994,
    description: 'Terna Engineering College in Nerul, Navi Mumbai, is a well-regarded private institution offering engineering programs with good placement support.',
    address: 'Sector 22, Nerul, Navi Mumbai', pincode: '400706', avg_fees_per_year: 145000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 145000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 140000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 142000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2771-5748', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@terna.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.terna.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Pillai College of Engineering',
    city: 'Navi Mumbai', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'University of Mumbai, AICTE', naac_grade: 'A',
    established_year: 1999,
    description: 'Managed by the Mahatma Education Society, Pillai College of Engineering in New Panvel is a growing engineering college known for innovative teaching and good industry connections.',
    address: 'Dr. K.M. Vasudevan Pillai Campus, New Panvel, Navi Mumbai', pincode: '410206', avg_fees_per_year: 138000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 138000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 135000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 130000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2745-6100', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@mes.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.mes.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Thane College of Arts and Science',
    city: 'Thane', state: 'Maharashtra', stream: 'Commerce',
    college_type: 'Private', affiliation: 'University of Mumbai', naac_grade: 'A',
    established_year: 1968,
    description: 'One of the most established colleges in Thane offering affordable arts, science, and commerce undergraduate programs with a long tradition of academic excellence.',
    address: 'Naupada, Thane (W)', pincode: '400602', avg_fees_per_year: 22000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 22000, entrance_exam: 'Merit-based' },
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 18000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Computer Science', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 25000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-22-2540-2222', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@tcas.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.tcas.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Government College of Engineering Aurangabad',
    city: 'Aurangabad', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Government', affiliation: 'Dr. Babasaheb Ambedkar Marathwada University, AICTE', naac_grade: 'A',
    established_year: 1960,
    description: 'GCOEA is the premier government engineering college in Marathwada, offering affordable quality engineering education in the historic city of Aurangabad.',
    address: 'Station Road, Aurangabad', pincode: '431001', avg_fees_per_year: 55000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 55000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 52000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 50000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-240-233-1683', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@gcoea.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.gcoea.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Dr. Babasaheb Ambedkar Marathwada University',
    city: 'Aurangabad', state: 'Maharashtra', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1958,
    description: 'Named after Dr. B.R. Ambedkar, BAMU is a prominent state university in Marathwada offering humanities, social sciences, science, and management programs.',
    address: 'University Campus, Aurangabad', pincode: '431004', avg_fees_per_year: 8000,
    courses: [
      { name: 'BA Political Science', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 8000, entrance_exam: 'Merit-based' },
      { name: 'MA History', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'B.Sc Chemistry', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 9000, entrance_exam: 'Merit-based' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 60000, entrance_exam: 'MAH-MBA-CET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-240-240-0431', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@bamu.net', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.bamu.net', label: 'Official Website' },
    ],
  },
  {
    name: 'DY Patil College of Engineering Kolhapur',
    city: 'Kolhapur', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Shivaji University, AICTE', naac_grade: 'A',
    established_year: 1983,
    description: 'D.Y. Patil College of Engineering in Kolhapur is a well-established institution in southern Maharashtra with quality engineering programs and ties to local industries.',
    address: 'Kasaba Bawada, Kolhapur', pincode: '416006', avg_fees_per_year: 100000,
    courses: [
      { name: 'B.E. Computer Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 100000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 98000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 95000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-231-268-8009', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@dypcoek.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.dypcoek.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Rajaram College Kolhapur',
    city: 'Kolhapur', state: 'Maharashtra', stream: 'Commerce',
    college_type: 'Government', affiliation: 'Shivaji University', naac_grade: 'A+',
    established_year: 1946,
    description: 'One of the oldest and most prestigious colleges in Kolhapur, known for arts, commerce, and science programs, a beautiful campus, and proud alumni tradition.',
    address: 'Kolhapur, Maharashtra', pincode: '416001', avg_fees_per_year: 9000,
    courses: [
      { name: 'B.Com', level: 'UG', duration_years: 3, seats: 360, fees_per_year: 9000, entrance_exam: 'Merit-based' },
      { name: 'BA Economics', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 8000, entrance_exam: 'Merit-based' },
      { name: 'M.Com', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 11000, entrance_exam: 'Merit-based' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-231-265-1024', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@rajaramcollege.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.rajaramcollege.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'SIPNA College of Engineering and Technology',
    city: 'Amravati', state: 'Maharashtra', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Sant Gadge Baba Amravati University, AICTE', naac_grade: 'A',
    established_year: 1999,
    description: 'SIPNA is one of the leading private engineering colleges in Amravati, offering undergraduate and postgraduate programs with modern labs and placement support.',
    address: 'Tapadia Nagar, Amravati', pincode: '444603', avg_fees_per_year: 95000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 95000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Electronics and Telecommunication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 92000, entrance_exam: 'MHT-CET / JEE Main' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 90000, entrance_exam: 'MHT-CET / JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-721-256-2622', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@sipna.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.sipna.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — UTTAR PRADESH
  // ============================================================
  {
    name: 'Indian Institute of Technology Kanpur',
    city: 'Kanpur', state: 'Uttar Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1959,
    description: 'IIT Kanpur is one of the foremost engineering institutes in India, known for pioneering research, world-class faculty, and producing global leaders in technology and entrepreneurship.',
    address: 'IIT Campus, Kanpur', pincode: '208016', avg_fees_per_year: 240000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 100, fees_per_year: 240000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 235000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Aerospace Engineering', level: 'UG', duration_years: 4, seats: 45, fees_per_year: 240000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 40, fees_per_year: 130000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-512-259-0151', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@iitk.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.iitk.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Banaras Hindu University',
    city: 'Varanasi', state: 'Uttar Pradesh', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, Central University', naac_grade: 'A++',
    established_year: 1916,
    description: 'One of the largest residential universities in Asia, BHU offers programs in arts, science, engineering, medicine, and management on its sprawling campus in Varanasi.',
    address: 'Lanka, Varanasi', pincode: '221005', avg_fees_per_year: 15000,
    courses: [
      { name: 'BA Hons Sanskrit', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 15000, entrance_exam: 'CUET' },
      { name: 'MA Philosophy', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 18000, entrance_exam: 'CUET-PG' },
      { name: 'B.Tech Computer Science', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 120000, entrance_exam: 'JEE Main' },
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 100, fees_per_year: 25000, entrance_exam: 'NEET-UG' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-542-236-8558', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@bhu.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.bhu.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Motilal Nehru National Institute of Technology Allahabad',
    city: 'Prayagraj', state: 'Uttar Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1961,
    description: 'MNNIT Allahabad is a premier NIT in UP known for engineering excellence, active research culture, and strong placement record in IT and core sectors.',
    address: 'Teliarganj, Prayagraj', pincode: '211004', avg_fees_per_year: 150000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-532-227-1073', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'director@mnnit.ac.in', label: 'Director Office' },
      { contact_type: 'website', contact_value: 'https://www.mnnit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Aligarh Muslim University',
    city: 'Aligarh', state: 'Uttar Pradesh', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, Central University', naac_grade: 'A+',
    established_year: 1875,
    description: 'One of the most historic central universities in India offering programs in arts, sciences, law, medicine, and engineering with a rich cultural heritage.',
    address: 'Aligarh', pincode: '202002', avg_fees_per_year: 20000,
    courses: [
      { name: 'BA Hons Political Science', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 20000, entrance_exam: 'AMU Entrance Test' },
      { name: 'MBBS', level: 'UG', duration_years: 5.5, seats: 100, fees_per_year: 25000, entrance_exam: 'NEET-UG + AMU Quota' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 60, fees_per_year: 15000, entrance_exam: 'AMU Entrance Test' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 40000, entrance_exam: 'CAT + AMU Entrance' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-571-270-0920', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@amu.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.amu.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — RAJASTHAN
  // ============================================================
  {
    name: 'Malaviya National Institute of Technology Jaipur',
    city: 'Jaipur', state: 'Rajasthan', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A+',
    established_year: 1963,
    description: 'MNIT Jaipur is a premier NIT in Rajasthan known for strong engineering programs and good placements, named after Pandit Madan Mohan Malaviya.',
    address: 'J.L.N. Marg, Jaipur', pincode: '302017', avg_fees_per_year: 155000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-141-252-9065', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@mnit.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.mnit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'University of Rajasthan',
    city: 'Jaipur', state: 'Rajasthan', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1947,
    description: 'One of the oldest and largest state universities in north India, offering extensive programs in arts, science, commerce, law, and management.',
    address: 'JLN Marg, Jaipur', pincode: '302004', avg_fees_per_year: 8000,
    courses: [
      { name: 'BA Hons Economics', level: 'UG', duration_years: 3, seats: 200, fees_per_year: 8000, entrance_exam: 'Merit-based' },
      { name: 'MA History', level: 'PG', duration_years: 2, seats: 100, fees_per_year: 10000, entrance_exam: 'Entrance Test' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 12000, entrance_exam: 'Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-141-270-7177', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'vc@uniraj.ac.in', label: 'Vice-Chancellor Office' },
      { contact_type: 'website', contact_value: 'https://www.uniraj.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Manipal University Jaipur',
    city: 'Jaipur', state: 'Rajasthan', stream: 'Engineering',
    college_type: 'Private', affiliation: 'UGC, Deemed University', naac_grade: 'A',
    established_year: 2011,
    description: 'A campus of the prestigious Manipal group in Rajasthan offering engineering, management, and design programs with strong industry exposure.',
    address: 'Dehmi Kalan, Jaipur-Ajmer Expressway, Jaipur', pincode: '303007', avg_fees_per_year: 200000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 200000, entrance_exam: 'MET / JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 195000, entrance_exam: 'MET / JEE Main' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 300000, entrance_exam: 'CAT / MAT / CMAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-141-399-9100', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@jaipur.manipal.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.jaipur.manipal.edu', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — PUNJAB AND CHANDIGARH
  // ============================================================
  {
    name: 'Punjab Engineering College',
    city: 'Chandigarh', state: 'Chandigarh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Deemed University', naac_grade: 'A',
    established_year: 1947,
    description: 'PEC Chandigarh is one of north India oldest engineering colleges now a deemed university, known for strong engineering programs and excellent placement record.',
    address: 'Sector 12, Chandigarh', pincode: '160012', avg_fees_per_year: 120000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 120000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Mechanical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 115000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 118000, entrance_exam: 'JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-172-274-4231', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@pec.edu.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.pec.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Thapar Institute of Engineering and Technology',
    city: 'Patiala', state: 'Punjab', stream: 'Engineering',
    college_type: 'Private', affiliation: 'UGC, Deemed University', naac_grade: 'A',
    established_year: 1956,
    description: 'Thapar Institute is a highly ranked private deemed university in Punjab known for rigorous engineering programs and consistently strong placement outcomes.',
    address: 'Bhadson Road, Patiala', pincode: '147004', avg_fees_per_year: 230000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 230000, entrance_exam: 'JEE Main' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 225000, entrance_exam: 'JEE Main' },
      { name: 'M.E. Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 150000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-175-239-3021', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@thapar.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.thapar.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'Panjab University',
    city: 'Chandigarh', state: 'Chandigarh', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A+',
    established_year: 1882,
    description: 'One of the oldest and most prestigious universities in India, Panjab University offers comprehensive programs in arts, sciences, law, business, and engineering.',
    address: 'Sector 14, Chandigarh', pincode: '160014', avg_fees_per_year: 15000,
    courses: [
      { name: 'BA Hons English', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 15000, entrance_exam: 'Merit-based' },
      { name: 'MA Political Science', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 18000, entrance_exam: 'Entrance Test' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 20000, entrance_exam: 'Entrance Test' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 80000, entrance_exam: 'CAT / MAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-172-253-4818', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@pu.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.puchd.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — MADHYA PRADESH
  // ============================================================
  {
    name: 'Indian Institute of Technology Indore',
    city: 'Indore', state: 'Madhya Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 2009,
    description: 'IIT Indore is a rapidly growing IIT with world-class faculty, modern infrastructure, and strong research output in central India.',
    address: 'Khandwa Road, Simrol, Indore', pincode: '453552', avg_fees_per_year: 220000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 220000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 218000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 20, fees_per_year: 120000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-731-660-3000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@iiti.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.iiti.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Technology Bhopal',
    city: 'Bhopal', state: 'Madhya Pradesh', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A+',
    established_year: 1960,
    description: 'MANIT Bhopal is a prominent NIT in India offering quality engineering programs in the state capital with a sprawling 650-acre campus.',
    address: 'Bhopal', pincode: '462003', avg_fees_per_year: 148000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 145000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 142000, entrance_exam: 'JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-755-405-1000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@manit.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.manit.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Devi Ahilya Vishwavidyalaya Indore',
    city: 'Indore', state: 'Madhya Pradesh', stream: 'Commerce',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1964,
    description: 'DAVV Indore is a prominent state university known for its School of Commerce and Institute of Management, offering programs in commerce, science, engineering, and law.',
    address: 'Takshashila Campus, Khandwa Road, Indore', pincode: '452001', avg_fees_per_year: 12000,
    courses: [
      { name: 'B.Com Hons', level: 'UG', duration_years: 3, seats: 240, fees_per_year: 12000, entrance_exam: 'Merit-based' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 50000, entrance_exam: 'CAT / MAT' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 10000, entrance_exam: 'Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-731-276-9321', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@dauniv.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.dauniv.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — KERALA
  // ============================================================
  {
    name: 'College of Engineering Trivandrum',
    city: 'Thiruvananthapuram', state: 'Kerala', stream: 'Engineering',
    college_type: 'Government', affiliation: 'APJ Abdul Kalam Technological University, AICTE', naac_grade: 'A',
    established_year: 1939,
    description: 'CET is the oldest and most prestigious engineering college in Kerala, known for rigorous academics, strong alumni network, and consistently top placements.',
    address: 'Engineering College P.O., Thiruvananthapuram', pincode: '695016', avg_fees_per_year: 65000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 65000, entrance_exam: 'KEAM' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 63000, entrance_exam: 'KEAM' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 18, fees_per_year: 45000, entrance_exam: 'GATE / KMAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-471-251-5568', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@cet.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.cet.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Technology Calicut',
    city: 'Kozhikode', state: 'Kerala', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1961,
    description: 'NIT Calicut is a top-ranked NIT set in a lush campus, known for its research output and consistent NIRF top-10 ranking among all NITs in India.',
    address: 'NIT Campus P.O., Calicut', pincode: '673601', avg_fees_per_year: 152000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 152000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 148000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Artificial Intelligence', level: 'PG', duration_years: 2, seats: 25, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-495-228-6101', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nitc.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nitc.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — BIHAR AND ODISHA
  // ============================================================
  {
    name: 'National Institute of Technology Patna',
    city: 'Patna', state: 'Bihar', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A',
    established_year: 1886,
    description: 'NIT Patna is one of the oldest engineering institutions in India, offering undergraduate and postgraduate programs in engineering and technology.',
    address: 'Ashok Rajpath, Patna', pincode: '800005', avg_fees_per_year: 145000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 145000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Electrical Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 142000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Civil Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 140000, entrance_exam: 'JEE Main' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-612-237-1715', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nitp.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nitp.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'National Institute of Technology Rourkela',
    city: 'Rourkela', state: 'Odisha', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1961,
    description: 'NIT Rourkela is among the top NITs in India, known for its beautiful campus, vibrant student life, research output, and strong placements.',
    address: 'Rourkela', pincode: '769008', avg_fees_per_year: 155000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 155000, entrance_exam: 'JEE Main' },
      { name: 'B.Tech Metallurgical and Materials Engineering', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 150000, entrance_exam: 'JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 100000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-661-246-2020', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@nitrkl.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.nitrkl.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'KIIT University',
    city: 'Bhubaneswar', state: 'Odisha', stream: 'Engineering',
    college_type: 'Private', affiliation: 'UGC, Deemed University', naac_grade: 'A++',
    established_year: 1992,
    description: 'Kalinga Institute of Industrial Technology is a top-ranked private deemed university in Odisha, known for its large campus, strong engineering programs, and excellent placements.',
    address: 'Campus 14, KIIT Road, Bhubaneswar', pincode: '751024', avg_fees_per_year: 290000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 720, fees_per_year: 290000, entrance_exam: 'KIITEE / JEE Main' },
      { name: 'B.Tech Electronics and Electrical Engineering', level: 'UG', duration_years: 4, seats: 240, fees_per_year: 285000, entrance_exam: 'KIITEE / JEE Main' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 180, fees_per_year: 350000, entrance_exam: 'CAT / XAT / CMAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-674-272-5113', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'kiit@kiit.ac.in', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.kiit.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — ASSAM AND NORTH EAST
  // ============================================================
  {
    name: 'Indian Institute of Technology Guwahati',
    city: 'Guwahati', state: 'Assam', stream: 'Engineering',
    college_type: 'Government', affiliation: 'AICTE, Institute of National Importance', naac_grade: 'A++',
    established_year: 1994,
    description: 'IIT Guwahati is a premier IIT on a stunning 285-hectare campus beside the Brahmaputra, known for research excellence and as the gateway to higher education in north-east India.',
    address: 'North Guwahati, Guwahati', pincode: '781039', avg_fees_per_year: 235000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 100, fees_per_year: 235000, entrance_exam: 'JEE Advanced' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 80, fees_per_year: 232000, entrance_exam: 'JEE Advanced' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 130000, entrance_exam: 'GATE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-361-258-2000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@iitg.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.iitg.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Gauhati University',
    city: 'Guwahati', state: 'Assam', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1948,
    description: 'Gauhati University is the premier state university of Assam offering programs in arts, sciences, commerce, and law — the academic hub for north-east India.',
    address: 'Gopinath Bordoloi Nagar, Guwahati', pincode: '781014', avg_fees_per_year: 10000,
    courses: [
      { name: 'BA Political Science', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 10000, entrance_exam: 'Merit-based' },
      { name: 'MA Assamese', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 12000, entrance_exam: 'Entrance Test' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 15000, entrance_exam: 'Entrance Test' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-361-257-0412', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@gauhati.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.gauhati.ac.in', label: 'Official Website' },
    ],
  },

  // ============================================================
  // PAN-INDIA — SOUTH INDIA
  // ============================================================
  {
    name: 'PSG College of Technology',
    city: 'Coimbatore', state: 'Tamil Nadu', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Anna University, AICTE', naac_grade: 'A++',
    established_year: 1951,
    description: 'PSG College of Technology is a highly reputed autonomous engineering college in Coimbatore, among the top private engineering institutions in Tamil Nadu.',
    address: 'Peelamedu, Coimbatore', pincode: '641004', avg_fees_per_year: 90000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 90000, entrance_exam: 'TNEA' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 88000, entrance_exam: 'TNEA' },
      { name: 'B.E. Mechanical Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 85000, entrance_exam: 'TNEA' },
      { name: 'M.E. Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 60000, entrance_exam: 'GATE / TANCET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-422-434-4000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@psgtech.ac.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.psgtech.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Amrita School of Engineering Coimbatore',
    city: 'Coimbatore', state: 'Tamil Nadu', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Amrita Vishwa Vidyapeetham, AICTE', naac_grade: 'A++',
    established_year: 1994,
    description: 'Part of Amrita Vishwa Vidyapeetham, ranked among the top 10 universities in India, offering cutting-edge engineering programs with strong research and global collaborations.',
    address: 'Ettimadai, Coimbatore', pincode: '641112', avg_fees_per_year: 195000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 195000, entrance_exam: 'AEEE / JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 190000, entrance_exam: 'AEEE / JEE Main' },
      { name: 'M.Tech Cyber Security', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 140000, entrance_exam: 'GATE / AEEE' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-422-265-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@amrita.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://www.amrita.edu', label: 'Official Website' },
    ],
  },
  {
    name: 'RV College of Engineering',
    city: 'Bengaluru', state: 'Karnataka', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Visvesvaraya Technological University, AICTE', naac_grade: 'A+',
    established_year: 1963,
    description: 'RVCE Bengaluru is one of the top private engineering colleges in Karnataka, known for excellent computer science programs, strong industry tie-ups, and NIRF top-100 ranking.',
    address: 'Mysore Road, RV Vidyaniketan Post, Bengaluru', pincode: '560059', avg_fees_per_year: 200000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 200000, entrance_exam: 'KCET / COMEDK' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 195000, entrance_exam: 'KCET / COMEDK' },
      { name: 'B.E. Information Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 198000, entrance_exam: 'KCET / COMEDK' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-80-6717-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'principal@rvce.edu.in', label: 'Principal Office' },
      { contact_type: 'website', contact_value: 'https://www.rvce.edu.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Manipal Institute of Technology',
    city: 'Manipal', state: 'Karnataka', stream: 'Engineering',
    college_type: 'Private', affiliation: 'Manipal Academy of Higher Education, AICTE', naac_grade: 'A++',
    established_year: 1957,
    description: 'MIT Manipal is the flagship engineering school of Manipal Academy, one of the top private deemed universities in India, known for global curriculum and excellent placements.',
    address: 'Manipal, Udupi District, Karnataka', pincode: '576104', avg_fees_per_year: 280000,
    courses: [
      { name: 'B.Tech Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 360, fees_per_year: 280000, entrance_exam: 'MET / JEE Main' },
      { name: 'B.Tech Electronics and Communication', level: 'UG', duration_years: 4, seats: 180, fees_per_year: 275000, entrance_exam: 'MET / JEE Main' },
      { name: 'B.Tech Mechatronics', level: 'UG', duration_years: 4, seats: 60, fees_per_year: 278000, entrance_exam: 'MET / JEE Main' },
      { name: 'M.Tech Computer Science', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 200000, entrance_exam: 'GATE / MET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-820-292-5506', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'admissions@manipal.edu', label: 'Admissions Office' },
      { contact_type: 'website', contact_value: 'https://manipal.edu/mit.html', label: 'Official Website' },
    ],
  },
  {
    name: 'Osmania University',
    city: 'Hyderabad', state: 'Telangana', stream: 'Arts',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A',
    established_year: 1918,
    description: 'Osmania University is one of south India oldest and largest universities, offering diverse programs in arts, sciences, commerce, law, and engineering from its historic campus.',
    address: 'Osmania University Road, Hyderabad', pincode: '500007', avg_fees_per_year: 8000,
    courses: [
      { name: 'BA Hons History', level: 'UG', duration_years: 3, seats: 120, fees_per_year: 8000, entrance_exam: 'TSICET / Merit-based' },
      { name: 'MA Economics', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 10000, entrance_exam: 'TSICET' },
      { name: 'LLB', level: 'UG', duration_years: 3, seats: 90, fees_per_year: 12000, entrance_exam: 'TSLAW Entrance' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 120, fees_per_year: 60000, entrance_exam: 'TSICET' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-40-2768-2363', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@osmania.ac.in', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.osmania.ac.in', label: 'Official Website' },
    ],
  },
  {
    name: 'Anna University',
    city: 'Chennai', state: 'Tamil Nadu', stream: 'Engineering',
    college_type: 'Government', affiliation: 'UGC, State University', naac_grade: 'A++',
    established_year: 1978,
    description: 'Anna University Chennai is a premier technical university and one of the largest in India, affiliating 500+ engineering colleges across Tamil Nadu with top-tier main campus programs.',
    address: 'Sardar Patel Road, Guindy, Chennai', pincode: '600025', avg_fees_per_year: 75000,
    courses: [
      { name: 'B.E. Computer Science and Engineering', level: 'UG', duration_years: 4, seats: 120, fees_per_year: 75000, entrance_exam: 'TNEA' },
      { name: 'B.E. Electronics and Communication', level: 'UG', duration_years: 4, seats: 90, fees_per_year: 72000, entrance_exam: 'TNEA' },
      { name: 'M.E. Computer Science and Engineering', level: 'PG', duration_years: 2, seats: 30, fees_per_year: 55000, entrance_exam: 'TANCET / GATE' },
      { name: 'MBA', level: 'PG', duration_years: 2, seats: 60, fees_per_year: 60000, entrance_exam: 'TANCET / CAT' },
    ],
    contacts: [
      { contact_type: 'phone', contact_value: '+91-44-2235-8000', label: 'General Enquiry' },
      { contact_type: 'email', contact_value: 'registrar@annauniv.edu', label: 'Registrar' },
      { contact_type: 'website', contact_value: 'https://www.annauniv.edu', label: 'Official Website' },
    ],
  }
];

async function seed() {
  await initDb();

  // Wipe existing data and reset identity sequences (children first due to FK constraints)
  await exec('TRUNCATE TABLE college_contacts, college_courses, shortlists, college_reviews, college_qna, applications, courses, colleges RESTART IDENTITY CASCADE;');

  const uniqueColleges = [];
  const seenSlugs = new Set();
  for (const college of colleges) {
    const slug = slugify(college.name, college.city);
    if (!seenSlugs.has(slug)) {
      seenSlugs.add(slug);
      uniqueColleges.push(college);
    }
  }

  await exec('BEGIN;');
  for (const college of uniqueColleges) {
    const slug = slugify(college.name, college.city);

    let nirf = college.nirf_ranking;
    let avgPlacement = college.avg_placement_package;
    let highestPlacement = college.highest_placement_package;

    if (nirf === undefined) {
      const isIIT = college.name.includes('Indian Institute of Technology');
      const isNIT = college.name.includes('National Institute of Technology');
      const isBITS = college.name.includes('Birla Institute of Technology');
      const isIIM = college.name.includes('Indian Institute of Management');
      const isAIIMS = college.name.includes('All India Institute of Medical Sciences');
      const isNLUs = college.name.includes('National Law School') || college.name.includes('NALSAR') || college.name.includes('National Law University');

      if (isIIT) {
        if (college.name.includes('Bombay')) { nirf = 3; avgPlacement = 21.82; highestPlacement = 65.0; }
        else if (college.name.includes('Delhi')) { nirf = 2; avgPlacement = 20.5; highestPlacement = 58.0; }
        else if (college.name.includes('Madras')) { nirf = 1; avgPlacement = 22.0; highestPlacement = 66.0; }
        else { nirf = 8; avgPlacement = 18.0; highestPlacement = 50.0; }
      } else if (isNIT) {
        if (college.name.includes('Tiruchirappalli')) { nirf = 9; avgPlacement = 12.5; highestPlacement = 42.0; }
        else { nirf = 25; avgPlacement = 9.5; highestPlacement = 30.0; }
      } else if (isBITS) {
        nirf = 20; avgPlacement = 15.6; highestPlacement = 48.0;
      } else if (isIIM) {
        if (college.name.includes('Ahmedabad')) { nirf = 1; avgPlacement = 32.8; highestPlacement = 75.0; }
        else if (college.name.includes('Bangalore')) { nirf = 2; avgPlacement = 31.5; highestPlacement = 72.0; }
        else { nirf = 6; avgPlacement = 26.0; highestPlacement = 55.0; }
      } else if (isAIIMS) {
        nirf = 1; avgPlacement = 18.0; highestPlacement = 35.0;
      } else if (isNLUs) {
        nirf = 3; avgPlacement = 16.0; highestPlacement = 28.0;
      } else if (college.stream === 'Engineering') {
        nirf = college.college_type === 'Government' ? 62 : 124;
        avgPlacement = college.college_type === 'Government' ? 7.2 : 5.1;
        highestPlacement = college.college_type === 'Government' ? 22.0 : 14.5;
      } else if (college.stream === 'Management') {
        nirf = college.college_type === 'Government' ? 45 : 88;
        avgPlacement = college.college_type === 'Government' ? 12.0 : 7.8;
        highestPlacement = college.college_type === 'Government' ? 26.0 : 18.0;
      } else if (college.stream === 'Medical') {
        nirf = college.college_type === 'Government' ? 18 : 42;
        avgPlacement = college.college_type === 'Government' ? 10.5 : 8.0;
        highestPlacement = college.college_type === 'Government' ? 20.0 : 15.0;
      } else if (college.stream === 'Law') {
        nirf = college.college_type === 'Government' ? 15 : 35;
        avgPlacement = college.college_type === 'Government' ? 9.5 : 6.0;
        highestPlacement = college.college_type === 'Government' ? 18.0 : 12.0;
      } else if (college.stream === 'Arts' || college.stream === 'Commerce' || college.stream === 'Science') {
        nirf = college.college_type === 'Government' ? 38 : 95;
        avgPlacement = college.college_type === 'Government' ? 4.8 : 3.5;
        highestPlacement = college.college_type === 'Government' ? 12.0 : 8.5;
      } else {
        nirf = null;
        avgPlacement = null;
        highestPlacement = null;
      }
    }

    const result = await run(
      `INSERT INTO colleges
        (name, slug, city, state, stream, college_type, affiliation, naac_grade,
         established_year, description, address, pincode, avg_fees_per_year,
         nirf_ranking, avg_placement_package, highest_placement_package, total_courses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        college.name, slug, college.city, college.state, college.stream,
        college.college_type, college.affiliation, college.naac_grade,
        college.established_year, college.description, college.address,
        college.pincode, college.avg_fees_per_year,
        nirf, avgPlacement, highestPlacement, college.courses.length,
      ]
    );

    const collegeId = result.lastInsertRowid;

    for (const course of college.courses) {
      let courseRow = await get('SELECT id FROM courses WHERE name = ? AND level = ?', [course.name, course.level]);
      let courseId;
      if (courseRow) {
        courseId = courseRow.id;
      } else {
        const degreeMatch = course.name.match(/^(B\.Tech|M\.Tech|MBA|MBBS|B\.Sc|M\.Sc|PhD|B\.E\.|M\.E\.|BBA|LLB|LLM)/i);
        const degreeType = degreeMatch ? degreeMatch[1] : null;
        
        const insResult = await run(
          `INSERT INTO courses (name, level, duration_years, degree_type)
           VALUES (?, ?, ?, ?)`,
          [course.name, course.level, course.duration_years, degreeType]
        );
        courseId = insResult.lastInsertRowid;
      }

      await run(
        `INSERT INTO college_courses (college_id, course_id, fees_per_year, seats, entrance_exam)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT (college_id, course_id) DO UPDATE SET
           fees_per_year = EXCLUDED.fees_per_year,
           seats = EXCLUDED.seats,
           entrance_exam = EXCLUDED.entrance_exam`,
        [collegeId, courseId, course.fees_per_year, course.seats, course.entrance_exam]
      );
    }

    for (const contact of college.contacts) {
      await run(
        `INSERT INTO college_contacts (college_id, contact_type, contact_value, label)
         VALUES (?, ?, ?, ?)`,
        [collegeId, contact.contact_type, contact.contact_value, contact.label]
      );
    }
  }
  await exec('COMMIT;');

  console.log(`✅ Seeded ${colleges.length} colleges with courses and contacts.`);
  console.log(`   Streams: Engineering, Medical, Management, Law, Arts, Commerce, Science, Design, Junior College (XI–XII)`);
}

if (require.main === module) {
  seed().catch(console.error);
}

module.exports = { seed };

