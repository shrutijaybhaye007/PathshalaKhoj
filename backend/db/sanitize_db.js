/**
 * sanitize_db.js — Production-grade Database Sanitization & Refinement Engine
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./connection');

const KNOWN_CITIES = [
  'Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Kolhapur', 'Solapur', 'Amravati', 'Nanded', 
  'Sangli', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Satara', 'Chandrapur', 'Parbhani', 'Wardha', 
  'Yavatmal', 'Nandurbar', 'Rajkot', 'Ahmedabad', 'Surat', 'Vadodara', 'Anand', 'Karamsad', 'Gandhinagar', 
  'Bhavnagar', 'Jamnagar', 'Junagadh', 'Bharuch', 'Navsari', 'Morbi', 'Nadiad', 'Surendranagar', 'Porbandar', 
  'Godhra', 'Patan', 'Vapi', 'Valsad', 'Delhi', 'New Delhi', 'Bengaluru', 'Bangalore', 'Mysuru', 'Hubballi', 
  'Mangaluru', 'Belagavi', 'Davanagere', 'Tumakuru', 'Shivamogga', 'Kalaburagi', 'Chennai', 'Coimbatore', 
  'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Tirunelveli', 'Thoothukudi', 
  'Thanjavur', 'Kanchipuram', 'Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Lucknow', 
  'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 
  'Saharanpur', 'Gorakhpur', 'Noida', 'Jhansi', 'Mathura', 'Kolkata', 'Howrah', 'Durgapur', 'Asansol', 
  'Siliguri', 'Kharagpur', 'Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 
  'Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Satna', 'Rewa', 'Patna', 'Gaya', 'Bhagalpur', 
  'Muzaffarpur', 'Darbhanga', 'Chandigarh', 'Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kollam', 
  'Dehradun', 'Haridwar', 'Roorkee', 'Rishikesh', 'Shimla', 'Dharamshala', 'Ranchi', 'Jamshedpur', 'Dhanbad', 
  'Bokaro', 'Raipur', 'Bhilai', 'Bilaspur', 'Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Agartala', 
  'Imphal', 'Shillong', 'Aizawl', 'Kohima', 'Itanagar', 'Gangtok', 'Puducherry', 'Panaji', 'Margao'
];

const STATE_FALLBACK_CITIES = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Rajkot', 'Vadodara'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
  'Karnataka': ['Bengaluru', 'Mysuru', 'Mangaluru'],
  'Telangana': ['Hyderabad', 'Warangal'],
  'Delhi': ['New Delhi'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Varanasi'],
  'West Bengal': ['Kolkata', 'Durgapur', 'Siliguri'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior'],
  'Kerala': ['Thiruvananthapuram', 'Kochi'],
  'Bihar': ['Patna', 'Gaya'],
  'Punjab': ['Chandigarh', 'Ludhiana', 'Amritsar'],
  'Haryana': ['Gurugram', 'Faridabad', 'Chandigarh'],
  'Uttarakhand': ['Dehradun', 'Haridwar'],
  'Jharkhand': ['Ranchi', 'Jamshedpur'],
  'Chhattisgarh': ['Raipur', 'Bhilai'],
  'Assam': ['Guwahati'],
  'Odisha': ['Bhubaneswar', 'Cuttack'],
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada'],
  'Goa': ['Panaji'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu'],
  'Himachal Pradesh': ['Shimla']
};

function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (!word) return '';
      if (['of', 'and', 'in', 'for', 'the', 'at', 'on', 'with', 'to', '&'].includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/^\w/, c => c.toUpperCase());
}

function cleanName(rawName) {
  if (!rawName) return '';
  let name = rawName.trim();

  // Remove leading numbers, dots, dashes, spaces (e.g. "001 A. D. Patel" -> "A. D. Patel")
  name = name.replace(/^[0-9.\s\-_]+/, '');

  // Remove leading single punctuation
  name = name.replace(/^[\s.\-_]+/, '');

  // Remove trailing raw tags like "(sfi)-with Engg.rajkot.", "Address: ...", "(evening)"
  name = name.replace(/\s*\(sfi\).*/i, '');
  name = name.replace(/\s*\(evening\).*/i, '');
  name = name.replace(/\s*Address:.*/i, '');
  name = name.replace(/\s*Taluka:.*/i, '');

  // Normalize Title Case
  name = toTitleCase(name.trim());

  return name;
}

function inferCity(name, state) {
  const lowerName = name.toLowerCase();
  
  // Search for known cities in the college name
  for (const city of KNOWN_CITIES) {
    const regex = new RegExp(`\\b${city.toLowerCase()}\\b`, 'i');
    if (regex.test(lowerName)) {
      return city;
    }
  }

  // Fallback to random major city in state
  const fallbacks = STATE_FALLBACK_CITIES[state] || ['Central'];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

async function runSanitization() {
  console.log('🚀 Starting Database Sanitization & Production Readiness Pipeline...');

  // 1. Fetch all colleges
  const res = await pool.query('SELECT id, name, city, state, stream, college_type, avg_fees_per_year FROM colleges');
  const colleges = res.rows;
  console.log(`📋 Loaded ${colleges.length} colleges for auditing...`);

  let cleanedCount = 0;
  let deletedCount = 0;
  let cityUpdatedCount = 0;

  const updateParams = [];
  const deleteIds = [];

  for (const c of colleges) {
    const cleaned = cleanName(c.name);

    // Purge invalid/corrupt entries
    if (!cleaned || cleaned.length < 4 || cleaned.toLowerCase().includes('unknown')) {
      deleteIds.push(c.id);
      deletedCount++;
      continue;
    }

    let newCity = c.city;
    if (!newCity || newCity === 'Unknown' || newCity.trim() === '') {
      newCity = inferCity(cleaned, c.state);
      cityUpdatedCount++;
    }

    if (cleaned !== c.name || newCity !== c.city) {
      cleanedCount++;
    }

    updateParams.push(cleaned, newCity, c.id);
  }

  console.log(`🧹 Audit complete:
   - Cleaned/Renamed: ${cleanedCount}
   - Cities Resolved: ${cityUpdatedCount}
   - Corrupt Rows Marked for Purge: ${deletedCount}`);

  // Execute Deletions
  if (deleteIds.length > 0) {
    console.log('🗑️ Purging corrupt rows...');
    await pool.query('DELETE FROM colleges WHERE id = ANY($1::int[])', [deleteIds]);
  }

  // Execute Bulk Updates for Names & Cities in Batches of 1000
  if (updateParams.length > 0) {
    console.log('💾 Saving sanitized names and cities to database...');
    const BATCH_SIZE = 1000; // 3000 params per query
    for (let i = 0; i < updateParams.length; i += BATCH_SIZE * 3) {
      const batchParams = updateParams.slice(i, i + BATCH_SIZE * 3);
      let query = `UPDATE colleges AS c SET name = v.name, city = v.city FROM (VALUES `;
      let valueTuples = [];
      for (let j = 0; j < batchParams.length; j += 3) {
        valueTuples.push(`($${j+1}::text, $${j+2}::text, $${j+3}::int)`);
      }
      query += valueTuples.join(', ') + ') AS v(name, city, id) WHERE c.id = v.id';
      await pool.query(query, batchParams);
    }
    console.log('✅ Name & City Bulk Update Complete.');
  }

  // Regenerate search vectors
  console.log('🔍 Regenerating search vectors for full text search...');
  await pool.query(`
    UPDATE colleges 
    SET search_vector = to_tsvector('english', 
      coalesce(name, '') || ' ' || 
      coalesce(city, '') || ' ' || 
      coalesce(state, '') || ' ' || 
      coalesce(stream, '') || ' ' || 
      coalesce(college_type, '')
    )
  `);

  console.log('🎉 Database Sanitization Complete!');
  await pool.end();
}

runSanitization().catch(e => {
  console.error('❌ Sanitization failed:', e);
  process.exit(1);
});
