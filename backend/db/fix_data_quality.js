/**
 * fix_data_quality.js
 * 1. Re-aligns cities to their correct Indian states.
 * 2. Strips embedded postal addresses, phone numbers, and secretary contacts from college titles.
 * 3. Regenerates full-text search vectors.
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./connection');

const CITY_STATE_MAP = {
  // Madhya Pradesh
  'bhopal': 'Madhya Pradesh', 'indore': 'Madhya Pradesh', 'gwalior': 'Madhya Pradesh', 
  'ujjain': 'Madhya Pradesh', 'jabalpur': 'Madhya Pradesh', 'seoni': 'Madhya Pradesh', 
  'ratlam': 'Madhya Pradesh', 'sagar': 'Madhya Pradesh', 'satna': 'Madhya Pradesh', 'rewa': 'Madhya Pradesh',
  
  // Punjab
  'pathankot': 'Punjab', 'amritsar': 'Punjab', 'ludhiana': 'Punjab', 'jalandhar': 'Punjab', 
  'patiala': 'Punjab', 'bathinda': 'Punjab', 'mohali': 'Punjab', 'hoshiarpur': 'Punjab',
  
  // Maharashtra
  'nagpur': 'Maharashtra', 'mumbai': 'Maharashtra', 'pune': 'Maharashtra', 'nashik': 'Maharashtra', 
  'aurangabad': 'Maharashtra', 'thane': 'Maharashtra', 'kolhapur': 'Maharashtra', 'solapur': 'Maharashtra', 
  'amravati': 'Maharashtra', 'nanded': 'Maharashtra', 'sangli': 'Maharashtra', 'jalgaon': 'Maharashtra', 
  'akola': 'Maharashtra', 'latur': 'Maharashtra', 'dhule': 'Maharashtra', 'ahmednagar': 'Maharashtra',
  
  // Uttar Pradesh
  'noida': 'Uttar Pradesh', 'greater noida': 'Uttar Pradesh', 'ghaziabad': 'Uttar Pradesh', 
  'lucknow': 'Uttar Pradesh', 'kanpur': 'Uttar Pradesh', 'agra': 'Uttar Pradesh', 
  'varanasi': 'Uttar Pradesh', 'meerut': 'Uttar Pradesh', 'prayagraj': 'Uttar Pradesh', 
  'bareilly': 'Uttar Pradesh', 'aligarh': 'Uttar Pradesh', 'moradabad': 'Uttar Pradesh', 
  'saharanpur': 'Uttar Pradesh', 'gorakhpur': 'Uttar Pradesh', 'jhansi': 'Uttar Pradesh', 'mathura': 'Uttar Pradesh',
  
  // Gujarat
  'ahmedabad': 'Gujarat', 'rajkot': 'Gujarat', 'surat': 'Gujarat', 'vadodara': 'Gujarat', 
  'anand': 'Gujarat', 'karamsad': 'Gujarat', 'gandhinagar': 'Gujarat', 'bhavnagar': 'Gujarat', 
  'jamnagar': 'Gujarat', 'junagadh': 'Gujarat', 'bharuch': 'Gujarat', 'navsari': 'Gujarat',
  
  // Odisha
  'dhenkanal': 'Odisha', 'bhubaneswar': 'Odisha', 'cuttack': 'Odisha', 'rourkela': 'Odisha', 
  'sambalpur': 'Odisha', 'puri': 'Odisha',
  
  // Tamil Nadu
  'coimbatore': 'Tamil Nadu', 'chennai': 'Tamil Nadu', 'madurai': 'Tamil Nadu', 
  'tiruchirappalli': 'Tamil Nadu', 'salem': 'Tamil Nadu', 'tiruppur': 'Tamil Nadu', 
  'erode': 'Tamil Nadu', 'vellore': 'Tamil Nadu', 'tirunelveli': 'Tamil Nadu',
  
  // Karnataka
  'bengaluru': 'Karnataka', 'bangalore': 'Karnataka', 'mysuru': 'Karnataka', 
  'hubballi': 'Karnataka', 'mangaluru': 'Karnataka', 'belagavi': 'Karnataka', 
  'davanagere': 'Karnataka', 'tumakuru': 'Karnataka', 'shivamogga': 'Karnataka',
  
  // Telangana
  'hyderabad': 'Telangana', 'warangal': 'Telangana', 'nizamabad': 'Telangana', 
  'khammam': 'Telangana', 'karimnagar': 'Telangana', 'secunderabad': 'Telangana',
  
  // Rajasthan
  'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan', 'kota': 'Rajasthan', 
  'bikaner': 'Rajasthan', 'ajmer': 'Rajasthan', 'udaipur': 'Rajasthan',
  
  // Delhi
  'delhi': 'Delhi', 'new delhi': 'Delhi'
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

function cleanTitle(rawName) {
  if (!rawName) return '';
  let name = rawName.trim();

  // Strip leading symbols like "+" or "." or "-"
  name = name.replace(/^[\s+.\-_]+/, '');

  // Strip parenthesized address info e.g. "(i.e.s.institute of Pharmacy, Ratibarh Road, Bhopal) Postal Address-..."
  if (name.toLowerCase().includes('postal address') || name.toLowerCase().includes('address:') || name.toLowerCase().includes('ph. no')) {
    // Extract name before first 'Postal Address' or 'Address:'
    name = name.split(/postal address|address:|ph\. no|phone/i)[0];
  }

  // If name has parens with addresses/roads/zones/contacts, strip them
  name = name.replace(/\(([^)]*?(?:road|postal|address|bhopal|nagar|ph\.|zone|secretary|society|arcade|taluka|dist)[^)]*?)\)/gi, '');
  
  // Strip trailing notes/codes
  name = name.replace(/\s*-\s*secretary.*/i, '');
  name = name.replace(/\s*-\s*president.*/i, '');
  name = name.replace(/,\s*[a-z0-9\s.\-_]+(?:road|nagar|arcade|bhopal|pune|mumbai|delhi|ph\.).*$/i, '');

  // Strip trailing non-word chars
  name = name.replace(/[\s,.\-_]+$/, '').trim();

  return toTitleCase(name);
}

async function runFixes() {
  console.log('🛠️ Starting Data Quality Realignment & Address Stripping...');

  const res = await pool.query('SELECT id, name, city, state FROM colleges');
  const colleges = res.rows;
  console.log(`📋 Auditing ${colleges.length} colleges for state realignment and name cleaning...`);

  let nameCleaned = 0;
  let stateRealigned = 0;

  const updateParams = [];

  for (const c of colleges) {
    let newName = cleanTitle(c.name);
    let newState = c.state;

    // Check if city matches known state mapping
    if (c.city) {
      const cityKey = c.city.trim().toLowerCase();
      if (CITY_STATE_MAP[cityKey]) {
        newState = CITY_STATE_MAP[cityKey];
      }
    }

    if (!newName || newName.length < 3) {
      newName = c.name; // Keep fallback if clean over-stripped
    }

    if (newName !== c.name) nameCleaned++;
    if (newState !== c.state) stateRealigned++;

    updateParams.push(newName, newState, c.id);
  }

  console.log(`📊 Audit summary:
   - Names Cleaned/Stripped: ${nameCleaned}
   - States Re-aligned: ${stateRealigned}`);

  if (updateParams.length > 0) {
    console.log('💾 Saving realigned states and clean titles to database...');
    const BATCH_SIZE = 1000;
    for (let i = 0; i < updateParams.length; i += BATCH_SIZE * 3) {
      const batchParams = updateParams.slice(i, i + BATCH_SIZE * 3);
      let query = `UPDATE colleges AS c SET name = v.name, state = v.state FROM (VALUES `;
      let valueTuples = [];
      for (let j = 0; j < batchParams.length; j += 3) {
        valueTuples.push(`($${j+1}::text, $${j+2}::text, $${j+3}::int)`);
      }
      query += valueTuples.join(', ') + ') AS v(name, state, id) WHERE c.id = v.id';
      await pool.query(query, batchParams);
    }
    console.log('✅ Bulk update finished.');
  }

  console.log('🔍 Regenerating search vectors...');
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

  console.log('🎉 Data Quality Fixes Complete!');
  await pool.end();
}

runFixes().catch(e => {
  console.error('❌ Data fix failed:', e);
  process.exit(1);
});
