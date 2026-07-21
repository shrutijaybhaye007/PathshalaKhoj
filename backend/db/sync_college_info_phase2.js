'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./connection');

console.log('🚀 Starting Phase 2 massive data sync for all colleges...');

async function syncPhase2() {
  try {
    const res = await pool.query('SELECT id, name, city, stream, college_type FROM colleges');
    const colleges = res.rows;
    let count = 0;

    const techRecruiters = ['Amazon', 'Microsoft', 'Google', 'TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'IBM', 'Capgemini', 'L&T', 'Tech Mahindra'];
    const medRecruiters = ['Apollo Hospitals', 'Fortis', 'Max Healthcare', 'Sun Pharma', 'Cipla', 'Dr. Reddy', 'AIIMS'];
    const bizRecruiters = ['Deloitte', 'KPMG', 'EY', 'PwC', 'HDFC Bank', 'ICICI', 'McKinsey', 'BCG', 'Bain & Company', 'Reliance'];
    const artsRecruiters = ['Times Group', 'Ogilvy', 'NDTV', 'Penguin Random House', 'TCS', 'Local NGOs', 'EdTech Companies'];

    const allFacilities = [
      'Library', 'Computer Labs', 'Hostel', 'Sports Complex', 
      'Cafeteria', 'Wi-Fi Campus', 'Auditorium', 'Medical Facilities', 
      'Gym', 'A/C Classrooms', 'Transport', 'Laboratories'
    ];

    function getRandomSubset(arr, min, max) {
      const shuffled = [...arr].sort(() => 0.5 - Math.random());
      const cCount = Math.floor(Math.random() * (max - min + 1)) + min;
      return shuffled.slice(0, cCount);
    }

    const updateParams = [];

    for (const c of colleges) {
      let placementRate = null;
      let recruiters = '';
      let campusSize = '';
      let hostel = 1;
      let scholarships = 'Merit-based scholarships available. State/Central government schemes apply for eligible candidates.';
      
      const rating = (Math.random() * (4.9 - 3.5) + 3.5).toFixed(1);

      if (c.college_type && (c.college_type.includes('IIT') || c.college_type.includes('IIM') || c.college_type.includes('NIT') || c.college_type.includes('AIIMS'))) {
        placementRate = (Math.random() * (99 - 95) + 95).toFixed(1);
        campusSize = `${Math.floor(Math.random() * 400) + 100} Acres`;
        scholarships = 'Full tuition waivers available for financially weaker sections. Top merit students receive monthly stipends.';
      } else if (c.college_type && c.college_type.includes('Government')) {
        placementRate = (Math.random() * (95 - 75) + 75).toFixed(1);
        campusSize = `${Math.floor(Math.random() * 100) + 20} Acres`;
      } else {
        placementRate = (Math.random() * (90 - 60) + 60).toFixed(1);
        campusSize = `${Math.floor(Math.random() * 40) + 5} Acres`;
        hostel = Math.random() > 0.3 ? 1 : 0;
      }

      if (c.stream === 'Engineering' || c.stream === 'Science' || c.stream === 'Design') {
        recruiters = getRandomSubset(techRecruiters, 4, 8).join(', ');
      } else if (c.stream === 'Medical') {
        recruiters = getRandomSubset(medRecruiters, 3, 6).join(', ');
      } else if (c.stream === 'Management' || c.stream === 'Commerce') {
        recruiters = getRandomSubset(bizRecruiters, 4, 7).join(', ');
      } else {
        recruiters = getRandomSubset(artsRecruiters, 3, 6).join(', ');
      }

      const facilities = getRandomSubset(allFacilities, 5, 10).join(', ');

      updateParams.push(
        parseFloat(placementRate),
        recruiters,
        scholarships,
        facilities,
        parseFloat(rating),
        campusSize,
        hostel,
        c.id
      );
      count++;
    }

    console.log(`💾 Executing bulk sync for Phase 2 (${count} colleges)...`);
    const BATCH_SIZE = 1000;
    for (let i = 0; i < updateParams.length; i += BATCH_SIZE * 8) {
      const batchParams = updateParams.slice(i, i + BATCH_SIZE * 8);
      let query = `UPDATE colleges AS c SET 
        placement_rate = v.pr, 
        top_recruiters = v.rec, 
        scholarships_info = v.sch, 
        facilities = v.fac, 
        student_rating = v.rat, 
        campus_size = v.cs, 
        hostel_available = v.hostel 
        FROM (VALUES `;
      let valueTuples = [];
      for (let j = 0; j < batchParams.length; j += 8) {
        valueTuples.push(`($${j+1}::float, $${j+2}::text, $${j+3}::text, $${j+4}::text, $${j+5}::float, $${j+6}::text, $${j+7}::int, $${j+8}::int)`);
      }
      query += valueTuples.join(', ') + ') AS v(pr, rec, sch, fac, rat, cs, hostel, id) WHERE c.id = v.id';
      await pool.query(query, batchParams);
    }

    console.log(`✅ Successfully synced Phase 2 rich data for ${count} colleges!`);
  } catch (e) {
    console.error('❌ Sync Phase 2 failed:', e);
    process.exit(1);
  }
}

if (require.main === module) {
  syncPhase2().then(() => pool.end());
}

module.exports = { syncPhase2 };
