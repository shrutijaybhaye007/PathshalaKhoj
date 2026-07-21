/**
 * Fix NIRF Rankings - precise single-match per famous college
 * Clears incorrect bulk-matched rankings and re-seeds correctly
 */
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_VJ4wbkOm5XGK@ep-ancient-bar-au9ix3l3-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const { pool } = require('./connection');

// Precise rankings: match by exact name or very specific pattern + city combo
const PRECISE_RANKINGS = [
  // Engineering - IITs
  { exact_name: 'Indian Institute Of Technology Madras', city: 'Chennai', rank: 1 },
  { exact_name: 'Indian Institute Of Technology Delhi', city: 'New Delhi', rank: 2 },
  { exact_name: 'Indian Institute Of Technology Bombay', city: 'Mumbai', rank: 3 },
  { exact_name: 'Indian Institute Of Technology Kanpur', city: 'Kanpur', rank: 4 },
  { exact_name: 'Indian Institute Of Technology Kharagpur', city: 'Kharagpur', rank: 5 },
  { exact_name: 'Indian Institute Of Technology Roorkee', city: 'Roorkee', rank: 6 },
  { exact_name: 'Indian Institute Of Technology Guwahati', city: 'Guwahati', rank: 7 },
  { exact_name: 'Indian Institute Of Technology Hyderabad', city: 'Hyderabad', rank: 8 },
  // NITs
  { exact_name: 'National Institute Of Technology Tiruchirappalli', city: 'Tiruchirappalli', rank: 9 },
  { exact_name: 'National Institute Of Technology Karnataka', city: 'Surathkal', rank: 14 },
  { exact_name: 'National Institute Of Technology Warangal', city: 'Warangal', rank: 17 },
  { exact_name: 'National Institute Of Technology Rourkela', city: 'Rourkela', rank: 22 },
  { exact_name: 'Motilal Nehru National Institute Of Technology', city: 'Prayagraj', rank: 25 },
  { exact_name: 'Vellore Institute Of Technology', city: 'Vellore', rank: 11 },
  { exact_name: 'Manipal Institute Of Technology', city: 'Manipal', rank: 24 },
  { exact_name: 'Delhi Technological University', city: 'New Delhi', rank: 30 },
  { exact_name: 'Thapar Institute Of Engineering And Technology', city: 'Patiala', rank: 37 },
  { exact_name: 'Chandigarh University', city: 'Mohali', rank: 40 },
  { exact_name: 'SRM Institute Of Science And Technology', city: 'Kattankulathur', rank: 35 },
  { exact_name: 'Lovely Professional University', city: 'Phagwara', rank: 55 },
  { exact_name: 'Amrita Vishwa Vidyapeetham', city: 'Coimbatore', rank: 20 },
  // IIMs
  { exact_name: 'Indian Institute Of Management Ahmedabad', city: 'Ahmedabad', rank: 1 },
  { exact_name: 'Indian Institute Of Management Bangalore', city: 'Bangalore', rank: 2 },
  { exact_name: 'Indian Institute Of Management Calcutta', city: 'Kolkata', rank: 3 },
  { exact_name: 'Indian Institute Of Management Lucknow', city: 'Lucknow', rank: 5 },
  { exact_name: 'Indian Institute Of Management Indore', city: 'Indore', rank: 6 },
  // Medical
  { exact_name: 'All India Institute Of Medical Sciences', city: 'New Delhi', rank: 1 },
  { exact_name: 'Christian Medical College', city: 'Vellore', rank: 3 },
  { exact_name: 'Kasturba Medical College', city: 'Manipal', rank: 10 },
  { exact_name: 'Madras Medical College', city: 'Chennai', rank: 12 },
  // Law
  { exact_name: 'National Law School Of India University', city: 'Bengaluru', rank: 1 },
  { exact_name: 'Symbiosis Law School', city: 'Pune', rank: 10 },
  // Design
  { exact_name: 'National Institute Of Fashion Technology', city: 'New Delhi', rank: 2 },
  // Management
  { exact_name: 'Symbiosis Institute Of Business Management', city: 'Pune', rank: 15 },
  { exact_name: 'Xavier Labour Relations Institute', city: 'Jamshedpur', rank: 7 },
];

async function fixRankings() {
  console.log('🔧 Clearing incorrect bulk-matched NIRF rankings...');
  
  // Clear ALL existing rankings first (since they're polluted)
  await pool.query('UPDATE colleges SET nirf_ranking = NULL WHERE nirf_ranking IS NOT NULL');
  console.log('✅ Cleared all existing rankings\n');

  console.log('🏆 Re-seeding precise NIRF rankings...\n');
  let ranked = 0;

  for (const entry of PRECISE_RANKINGS) {
    try {
      // Exact match by name + city
      let result = await pool.query(
        `UPDATE colleges SET nirf_ranking = $1 
         WHERE LOWER(TRIM(name)) = LOWER(TRIM($2)) AND LOWER(TRIM(city)) = LOWER(TRIM($3))
         RETURNING id, name, city`,
        [entry.rank, entry.exact_name, entry.city]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ Ranked #${entry.rank}: ${result.rows[0].name} (${result.rows[0].city})`);
        ranked += result.rows.length;
      } else {
        // Try case-insensitive partial on name + city
        result = await pool.query(
          `UPDATE colleges SET nirf_ranking = $1 
           WHERE name ILIKE $2 AND city ILIKE $3 AND nirf_ranking IS NULL
           RETURNING id, name, city`,
          [entry.rank, `%${entry.exact_name.split(' ').slice(0, 5).join(' ')}%`, `%${entry.city}%`]
        );
        if (result.rows.length === 1) {
          console.log(`✅ Ranked #${entry.rank} (fuzzy): ${result.rows[0].name} (${result.rows[0].city})`);
          ranked++;
        } else if (result.rows.length > 1) {
          // Too many matches, revert
          await pool.query('UPDATE colleges SET nirf_ranking = NULL WHERE name ILIKE $1 AND city ILIKE $2', 
            [`%${entry.exact_name.split(' ').slice(0, 5).join(' ')}%`, `%${entry.city}%`]);
          console.log(`⚠️  Skipped (ambiguous): ${entry.exact_name} - ${result.rows.length} matches`);
        } else {
          console.log(`⚠️  Not found: ${entry.exact_name} in ${entry.city}`);
        }
      }
    } catch(e) {
      console.error(`❌ Error:`, e.message);
    }
  }

  console.log(`\n✅ Total colleges ranked: ${ranked}`);
  
  const r = await pool.query('SELECT COUNT(*) as total FROM colleges WHERE nirf_ranking IS NOT NULL');
  console.log('Total with NIRF ranking in DB:', r.rows[0].total);
  
  const top = await pool.query(`
    SELECT name, city, state, nirf_ranking, naac_grade, stream, avg_fees_per_year 
    FROM colleges WHERE nirf_ranking IS NOT NULL 
    ORDER BY nirf_ranking ASC, stream ASC
  `);
  console.log('\nAll ranked colleges:');
  top.rows.forEach(c => console.log(` #${c.nirf_ranking} [${c.stream}] ${c.name} | ${c.city} | ${c.naac_grade} | ₹${c.avg_fees_per_year}`));
  
  pool.end();
}

fixRankings().catch(e => { console.error('Fatal:', e); process.exit(1); });
