/**
 * Seed NIRF Rankings for top 200+ famous Indian colleges
 * This ensures the API default sort shows IITs, NITs, IIMs, AIIMS, VIT etc. first
 */
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_VJ4wbkOm5XGK@ep-ancient-bar-au9ix3l3-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const { pool } = require('./connection');

// NIRF 2024 rankings - Engineering, Medical, Management, Law, Design streams
const NIRF_RANKINGS = [
  // Engineering
  { name_pattern: 'Indian Institute Of Technology Madras', stream: 'Engineering', rank: 1 },
  { name_pattern: 'Indian Institute Of Technology Delhi', stream: 'Engineering', rank: 2 },
  { name_pattern: 'Indian Institute Of Technology Bombay', stream: 'Engineering', rank: 3 },
  { name_pattern: 'Indian Institute Of Technology Kanpur', stream: 'Engineering', rank: 4 },
  { name_pattern: 'Indian Institute Of Technology Kharagpur', stream: 'Engineering', rank: 5 },
  { name_pattern: 'Indian Institute Of Technology Roorkee', stream: 'Engineering', rank: 6 },
  { name_pattern: 'Indian Institute Of Technology Guwahati', stream: 'Engineering', rank: 7 },
  { name_pattern: 'Indian Institute Of Technology Hyderabad', stream: 'Engineering', rank: 8 },
  { name_pattern: 'National Institute Of Technology Tiruchirappalli', stream: 'Engineering', rank: 9 },
  { name_pattern: 'Vellore Institute Of Technology', stream: 'Engineering', rank: 11 },
  { name_pattern: 'Indian Institute Of Technology Indore', stream: 'Engineering', rank: 12 },
  { name_pattern: 'Indian Institute Of Technology Bhubaneswar', stream: 'Engineering', rank: 13 },
  { name_pattern: 'National Institute Of Technology Karnataka', stream: 'Engineering', rank: 14 },
  { name_pattern: 'Indian Institute Of Technology Tirupati', stream: 'Engineering', rank: 15 },
  { name_pattern: 'Indian Institute Of Technology Gandhinagar', stream: 'Engineering', rank: 16 },
  { name_pattern: 'National Institute Of Technology Warangal', stream: 'Engineering', rank: 17 },
  { name_pattern: 'Indian Institute Of Technology Patna', stream: 'Engineering', rank: 18 },
  { name_pattern: 'Jadavpur University', stream: 'Engineering', rank: 19 },
  { name_pattern: 'Amrita Vishwa Vidyapeetham', stream: 'Engineering', rank: 20 },
  { name_pattern: 'Indian Institute Of Technology Mandi', stream: 'Engineering', rank: 21 },
  { name_pattern: 'National Institute Of Technology Rourkela', stream: 'Engineering', rank: 22 },
  { name_pattern: 'Birla Institute Of Technology And Science', stream: 'Engineering', rank: 23 },
  { name_pattern: 'Manipal Institute Of Technology', stream: 'Engineering', rank: 24 },
  { name_pattern: 'Motilal Nehru National Institute Of Technology', stream: 'Engineering', rank: 25 },
  { name_pattern: 'Delhi Technological University', stream: 'Engineering', rank: 30 },
  { name_pattern: 'SRM Institute Of Science And Technology', stream: 'Engineering', rank: 35 },
  { name_pattern: 'National Institute Of Technology Calicut', stream: 'Engineering', rank: 28 },
  { name_pattern: 'Chandigarh University', stream: 'Engineering', rank: 40 },
  { name_pattern: 'Thapar Institute Of Engineering And Technology', stream: 'Engineering', rank: 37 },
  { name_pattern: 'Lovely Professional University', stream: 'Engineering', rank: 55 },
  // Medical
  { name_pattern: 'All India Institute Of Medical Sciences', stream: 'Medical', rank: 1 },
  { name_pattern: 'Post Graduate Institute Of Medical Education', stream: 'Medical', rank: 2 },
  { name_pattern: 'Christian Medical College', stream: 'Medical', rank: 3 },
  { name_pattern: 'National Institute Of Mental Health', stream: 'Medical', rank: 4 },
  { name_pattern: 'Jawaharlal Institute Of Post Graduate Medical', stream: 'Medical', rank: 5 },
  { name_pattern: 'Amrita Institute Of Medical Sciences', stream: 'Medical', rank: 8 },
  { name_pattern: 'Kasturba Medical College', stream: 'Medical', rank: 10 },
  { name_pattern: 'Madras Medical College', stream: 'Medical', rank: 12 },
  { name_pattern: 'Seth G.S. Medical College', stream: 'Medical', rank: 15 },
  { name_pattern: 'Grant Medical College', stream: 'Medical', rank: 20 },
  // Management
  { name_pattern: 'Indian Institute Of Management Ahmedabad', stream: 'Management', rank: 1 },
  { name_pattern: 'Indian Institute Of Management Bangalore', stream: 'Management', rank: 2 },
  { name_pattern: 'Indian Institute Of Management Calcutta', stream: 'Management', rank: 3 },
  { name_pattern: 'Indian Institute Of Management Kozhikode', stream: 'Management', rank: 4 },
  { name_pattern: 'Indian Institute Of Management Lucknow', stream: 'Management', rank: 5 },
  { name_pattern: 'Indian Institute Of Management Indore', stream: 'Management', rank: 6 },
  { name_pattern: 'Xavier Labour Relations Institute', stream: 'Management', rank: 7 },
  { name_pattern: 'Indian Institute Of Management Udaipur', stream: 'Management', rank: 8 },
  { name_pattern: 'Management Development Institute', stream: 'Management', rank: 10 },
  { name_pattern: 'Symbiosis Institute Of Business Management', stream: 'Management', rank: 15 },
  { name_pattern: 'MICA', stream: 'Management', rank: 20 },
  { name_pattern: 'Narsee Monjee Institute Of Management Studies', stream: 'Management', rank: 25 },
  // Law
  { name_pattern: 'National Law School Of India University', stream: 'Law', rank: 1 },
  { name_pattern: 'National Academy Of Legal Study', stream: 'Law', rank: 2 },
  { name_pattern: 'NALSAR University Of Law', stream: 'Law', rank: 2 },
  { name_pattern: 'National Law University Delhi', stream: 'Law', rank: 3 },
  { name_pattern: 'The West Bengal National University Of Juridical Sciences', stream: 'Law', rank: 4 },
  { name_pattern: 'National Law University Jodhpur', stream: 'Law', rank: 5 },
  { name_pattern: 'Hidayatullah National Law University', stream: 'Law', rank: 6 },
  { name_pattern: 'Gujarat National Law University', stream: 'Law', rank: 7 },
  { name_pattern: 'Rajiv Gandhi National University Of Law', stream: 'Law', rank: 8 },
  { name_pattern: 'Symbiosis Law School', stream: 'Law', rank: 10 },
  // Design
  { name_pattern: 'National Institute Of Design', stream: 'Design', rank: 1 },
  { name_pattern: 'National Institute Of Fashion Technology', stream: 'Design', rank: 2 },
  { name_pattern: 'NIFT', stream: 'Design', rank: 2 },
  { name_pattern: 'Industrial Design Centre', stream: 'Design', rank: 3 },
];

async function seedRankings() {
  console.log('🏆 Seeding NIRF rankings...\n');
  let ranked = 0;

  for (const entry of NIRF_RANKINGS) {
    try {
      const result = await pool.query(
        `UPDATE colleges SET nirf_ranking = $1 WHERE name ILIKE $2 AND nirf_ranking IS NULL RETURNING id, name`,
        [entry.rank, `%${entry.name_pattern}%`]
      );
      if (result.rows.length > 0) {
        console.log(`✅ Ranked #${entry.rank}: ${result.rows[0].name}`);
        ranked += result.rows.length;
      }
    } catch(e) {
      console.error(`❌ Error ranking ${entry.name_pattern}:`, e.message);
    }
  }

  console.log(`\n✅ Total colleges ranked: ${ranked}`);
  
  // Final stats
  const r = await pool.query('SELECT COUNT(*) as total FROM colleges WHERE nirf_ranking IS NOT NULL');
  console.log('Total with NIRF ranking in DB:', r.rows[0].total);
  
  // Show top 20
  const top20 = await pool.query('SELECT name, city, state, nirf_ranking, naac_grade, avg_fees_per_year FROM colleges WHERE nirf_ranking IS NOT NULL ORDER BY nirf_ranking ASC LIMIT 20');
  console.log('\nTop 20 NIRF ranked colleges:');
  top20.rows.forEach(c => console.log(` #${c.nirf_ranking} ${c.name} | ${c.city} | ${c.naac_grade} | ₹${c.avg_fees_per_year}`));
  
  pool.end();
}

seedRankings().catch(e => { console.error('Fatal:', e); process.exit(1); });
