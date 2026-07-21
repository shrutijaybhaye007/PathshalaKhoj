/**
 * seed_courses.js
 * Universal Course, Fee, Exam, and Placement Data Seeder
 * Populates 100% of colleges in the database with stream-accurate courses & fee structures.
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./connection');

const predefinedCourses = [
  { name: 'B.Tech Computer Science', level: 'UG', duration: 4, type: 'B.Tech', stream: 'Engineering' },
  { name: 'B.Tech Mechanical', level: 'UG', duration: 4, type: 'B.Tech', stream: 'Engineering' },
  { name: 'B.Tech Electronics', level: 'UG', duration: 4, type: 'B.Tech', stream: 'Engineering' },
  { name: 'MBBS', level: 'UG', duration: 5.5, type: 'MBBS', stream: 'Medical' },
  { name: 'BDS', level: 'UG', duration: 5, type: 'BDS', stream: 'Dental' },
  { name: 'MBA', level: 'PG', duration: 2, type: 'MBA', stream: 'Management' },
  { name: 'BBA', level: 'UG', duration: 3, type: 'BBA', stream: 'Management' },
  { name: 'BA LLB', level: 'UG', duration: 5, type: 'BA LLB', stream: 'Law' },
  { name: 'LLM', level: 'PG', duration: 2, type: 'LLM', stream: 'Law' },
  { name: 'B.Sc Physics', level: 'UG', duration: 3, type: 'B.Sc', stream: 'Science' },
  { name: 'B.Sc Mathematics', level: 'UG', duration: 3, type: 'B.Sc', stream: 'Science' },
  { name: 'BA Economics', level: 'UG', duration: 3, type: 'BA', stream: 'Arts' },
  { name: 'BA History', level: 'UG', duration: 3, type: 'BA', stream: 'Arts' },
  { name: 'B.Com', level: 'UG', duration: 3, type: 'B.Com', stream: 'Commerce' },
  { name: 'M.Com', level: 'PG', duration: 2, type: 'M.Com', stream: 'Commerce' },
  { name: 'B.Pharm', level: 'UG', duration: 4, type: 'B.Pharm', stream: 'Pharmacy' },
  { name: 'M.Pharm', level: 'PG', duration: 2, type: 'M.Pharm', stream: 'Pharmacy' }
];

async function run() {
  console.log('🌱 Starting Universal Course & Fee Seeding Pipeline (All Colleges)...');

  // 1. Insert predefined courses
  console.log('📚 Initializing base degree courses...');
  const courseIds = {};
  for (const c of predefinedCourses) {
    const res = await pool.query(
      `INSERT INTO courses (name, level, duration_years, degree_type) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [c.name, c.level, c.duration, c.type]
    );
    if (res.rowCount > 0) {
      courseIds[c.name] = res.rows[0].id;
    } else {
      const existing = await pool.query('SELECT id FROM courses WHERE name = $1', [c.name]);
      if (existing.rowCount > 0) courseIds[c.name] = existing.rows[0].id;
    }
  }

  // 2. Fetch ALL colleges
  console.log('🔍 Fetching ALL colleges in database...');
  const res = await pool.query('SELECT id, name, stream, college_type, avg_fees_per_year FROM colleges');
  const colleges = res.rows;
  console.log(`📋 Total colleges to enrich: ${colleges.length}`);

  const collegesUpdateParams = [];
  const coursesInsertParams = [];
  let updatedCount = 0;

  for (const c of colleges) {
    let exams = [];
    let avgFees = c.avg_fees_per_year;
    let avgPlacement = 0;
    let assignedCourses = [];

    const n = c.name.toLowerCase();
    const isGovt = c.college_type && c.college_type.includes('Government');

    // -- HEURISTICS FOR ALL COLLEGES --
    if (c.stream === 'Engineering') {
      assignedCourses = ['B.Tech Computer Science', 'B.Tech Mechanical', 'B.Tech Electronics'];
      if (n.includes('indian institute of technology') || n.includes(' iit ')) {
        exams = ['JEE Advanced'];
        if (!avgFees) avgFees = 200000 + Math.random() * 50000;
        avgPlacement = 15 + Math.random() * 10;
      } else if (n.includes('national institute of technology') || n.includes(' nit ')) {
        exams = ['JEE Main'];
        if (!avgFees) avgFees = 120000 + Math.random() * 50000;
        avgPlacement = 8 + Math.random() * 5;
      } else if (isGovt) {
        exams = ['JEE Main', 'State CET'];
        if (!avgFees) avgFees = 45000 + Math.random() * 35000;
        avgPlacement = 4 + Math.random() * 3;
      } else {
        exams = ['JEE Main', 'BITSAT', 'VITEEE', 'State CET'];
        exams = [exams[Math.floor(Math.random() * exams.length)]];
        if (!avgFees) avgFees = 140000 + Math.random() * 140000;
        avgPlacement = 3.5 + Math.random() * 4;
      }
    } 
    else if (c.stream === 'Medical') {
      assignedCourses = ['MBBS'];
      exams = ['NEET'];
      if (n.includes('all india institute') || n.includes('aiims') || isGovt) {
        if (!avgFees) avgFees = 15000 + Math.random() * 35000;
        avgPlacement = 10 + Math.random() * 5;
      } else {
        if (!avgFees) avgFees = 600000 + Math.random() * 600000;
        avgPlacement = 6 + Math.random() * 4;
      }
    }
    else if (c.stream === 'Management') {
      assignedCourses = ['MBA', 'BBA'];
      if (n.includes('indian institute of management') || n.includes(' iim ')) {
        exams = ['CAT'];
        if (!avgFees) avgFees = 1500000 + Math.random() * 800000;
        avgPlacement = 20 + Math.random() * 12;
      } else {
        exams = ['CAT', 'MAT', 'XAT', 'CMAT'];
        exams = [exams[Math.floor(Math.random() * exams.length)]];
        if (!avgFees) avgFees = 180000 + Math.random() * 300000;
        avgPlacement = 5 + Math.random() * 4;
      }
    }
    else if (c.stream === 'Law') {
      assignedCourses = ['BA LLB', 'LLM'];
      if (n.includes('national law')) {
        exams = ['CLAT'];
        if (!avgFees) avgFees = 200000 + Math.random() * 80000;
        avgPlacement = 10 + Math.random() * 5;
      } else {
        exams = ['CLAT', 'LSAT'];
        if (!avgFees) avgFees = 80000 + Math.random() * 120000;
        avgPlacement = 4 + Math.random() * 3;
      }
    }
    else if (c.stream === 'Pharmacy') {
      assignedCourses = ['B.Pharm', 'M.Pharm'];
      exams = ['NEET', 'State CET'];
      if (!avgFees) avgFees = 50000 + Math.random() * 80000;
      avgPlacement = 3.5 + Math.random() * 2;
    }
    else {
      // Arts, Science, Commerce, Dental
      if (c.stream === 'Science') assignedCourses = ['B.Sc Physics', 'B.Sc Mathematics'];
      else if (c.stream === 'Arts') assignedCourses = ['BA Economics', 'BA History'];
      else if (c.stream === 'Commerce') assignedCourses = ['B.Com', 'M.Com'];
      else if (c.stream === 'Dental') assignedCourses = ['BDS'];
      else assignedCourses = ['B.Sc Physics', 'BA Economics', 'B.Com'];
      
      exams = ['CUET', 'Merit Based'];
      exams = [exams[Math.floor(Math.random() * exams.length)]];
      if (!avgFees) avgFees = 15000 + Math.random() * 45000;
      avgPlacement = 2.5 + Math.random() * 2;
    }

    avgFees = Math.floor(avgFees / 1000) * 1000;
    avgPlacement = parseFloat((Math.floor(avgPlacement * 10) / 10).toFixed(1));

    collegesUpdateParams.push(avgFees, avgPlacement, assignedCourses.length, c.id);
    
    for (const cName of assignedCourses) {
      const cid = courseIds[cName];
      if (cid) {
        const courseFee = avgFees + (Math.floor(Math.random() * 10) * 1000 - 5000);
        coursesInsertParams.push(c.id, cid, Math.max(courseFee, 5000), exams[0], 60 + Math.floor(Math.random() * 100));
      }
    }
    updatedCount++;
  }

  console.log(`   Processed ${updatedCount} colleges. Executing bulk updates in database...`);

  // Bulk Update Colleges in batches of 1000 (4000 params)
  if (collegesUpdateParams.length > 0) {
    const BATCH_SIZE = 1000;
    for (let i = 0; i < collegesUpdateParams.length; i += BATCH_SIZE * 4) {
      const batchParams = collegesUpdateParams.slice(i, i + BATCH_SIZE * 4);
      let updateQuery = `
        UPDATE colleges AS c 
        SET avg_fees_per_year = v.fees, 
            avg_placement_package = v.placement, 
            total_courses = v.total
        FROM (VALUES `;
        
      let valueStrings = [];
      for (let j = 0; j < batchParams.length; j += 4) {
        valueStrings.push(`($${j+1}::int, $${j+2}::float, $${j+3}::int, $${j+4}::int)`);
      }
      updateQuery += valueStrings.join(', ') + ') AS v(fees, placement, total, id) WHERE c.id = v.id';
      
      await pool.query(updateQuery, batchParams);
    }
    console.log('   ✅ Bulk updated colleges table (100% complete)');
  }

  // Bulk Insert college_courses in batches of 1000 (5000 params)
  if (coursesInsertParams.length > 0) {
    const BATCH_SIZE = 1000;
    for (let i = 0; i < coursesInsertParams.length; i += BATCH_SIZE * 5) {
      const batchParams = coursesInsertParams.slice(i, i + BATCH_SIZE * 5);
      let insertQuery = `INSERT INTO college_courses (college_id, course_id, fees_per_year, entrance_exam, seats) VALUES `;
      let valueStrings = [];
      for (let j = 0; j < batchParams.length; j += 5) {
        valueStrings.push(`($${j+1}::int, $${j+2}::int, $${j+3}::int, $${j+4}::text, $${j+5}::int)`);
      }
      insertQuery += valueStrings.join(', ') + ' ON CONFLICT DO NOTHING';
      
      await pool.query(insertQuery, batchParams);
    }
    console.log(`   ✅ Bulk inserted ${coursesInsertParams.length / 5} relational courses`);
  }

  console.log(`\n🎉 Universal Course & Fee Seeding Complete for ALL ${updatedCount} colleges!`);
  await pool.end();
}

run().catch(e => { console.error('❌', e.message); process.exit(1); });
