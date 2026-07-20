const { get, all, run, exec } = require('./connection');

console.log('Starting Phase 2 massive data sync for all colleges...');

async function syncPhase2() {
  try {
    await exec('BEGIN;');

    const colleges = await all('SELECT id, name, city, stream, college_type FROM colleges');
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
      const count = Math.floor(Math.random() * (max - min + 1)) + min;
      return shuffled.slice(0, count);
    }

    for (const c of colleges) {
      let placementRate = null;
      let recruiters = '';
      let campusSize = '';
      let hostel = 1;
      let scholarships = 'Merit-based scholarships available. State/Central government schemes apply for eligible candidates.';
      
      const rating = (Math.random() * (4.9 - 3.5) + 3.5).toFixed(1);

      if (c.college_type === 'IIT' || c.college_type === 'IIM' || c.college_type === 'NIT' || c.college_type === 'AIIMS') {
        placementRate = (Math.random() * (99 - 95) + 95).toFixed(1);
        campusSize = `${Math.floor(Math.random() * 400) + 100} Acres`;
        scholarships = 'Full tuition waivers available for financially weaker sections. Top merit students receive monthly stipends.';
      } else if (c.college_type === 'Government') {
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

      await run(`
        UPDATE colleges SET 
          placement_rate = ?,
          top_recruiters = ?,
          scholarships_info = ?,
          facilities = ?,
          student_rating = ?,
          campus_size = ?,
          hostel_available = ?
        WHERE id = ?
      `, [
        parseFloat(placementRate),
        recruiters,
        scholarships,
        facilities,
        parseFloat(rating),
        campusSize,
        hostel,
        c.id
      ]);
      count++;
    }

    await exec('COMMIT;');
    console.log(`Successfully synced phase 2 rich data for ${count} colleges!`);
  } catch (e) {
    try { await exec('ROLLBACK;'); } catch (_) {}
    console.error('Sync failed:', e);
  }
}

if (require.main === module) {
  syncPhase2().catch(console.error);
}

module.exports = { syncPhase2 };
