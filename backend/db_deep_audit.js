const {DatabaseSync}=require('node:sqlite');
const db=new DatabaseSync('db/colleges.db');
const q=(s)=>db.prepare(s).all();
const q1=(s)=>db.prepare(s).get();

// Check courses table schema
console.log('=== COURSES TABLE COLUMNS ===');
q("PRAGMA table_info(courses)").forEach(r=>
  console.log('  col:', r.name, '| type:', r.type, '| notnull:', r.notnull, '| dflt:', r.dflt_value)
);

console.log('\n=== COURSES SAMPLE (3 rows) ===');
q('SELECT * FROM courses LIMIT 3').forEach(r=>console.log(JSON.stringify(r)));

console.log('\n=== ALL TABLE NAMES ===');
q("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").forEach(r=>console.log(' ',r.name));

console.log('\n=== COLLEGES TABLE COLUMNS ===');
q("PRAGMA table_info(colleges)").forEach(r=>
  console.log('  col:', r.name, '| type:', r.type)
);

// Dupe check
console.log('\n=== 5 SAMPLE DUPLICATE (name+state) ENTRIES ===');
q(`SELECT name, state, COUNT(*) as cnt FROM colleges 
   GROUP BY name, state HAVING COUNT(*)>1 
   ORDER BY cnt DESC LIMIT 5`).forEach(r=>
  console.log('  "'+r.name.substring(0,40)+'" | '+r.state+' | count:'+r.cnt)
);

// Raw rupee placement
console.log('\n=== ALL 160 RAW-RUPEE PLACEMENT COLLEGES (first 20) ===');
q('SELECT id, name, avg_placement_package, state FROM colleges WHERE avg_placement_package>=100000 LIMIT 20').forEach(r=>
  console.log('  ['+r.id+'] '+r.name.substring(0,45)+' | '+r.avg_placement_package+' | '+r.state)
);
// What is the LPA value?
const raw160 = q('SELECT avg_placement_package FROM colleges WHERE avg_placement_package>=100000');
const asLPA = raw160.map(r=>r.avg_placement_package/100000);
console.log('\n  When divided by 100000 (to get LPA):');
console.log('  Min LPA:', Math.min(...asLPA).toFixed(1), '| Max LPA:', Math.max(...asLPA).toFixed(1), '| Avg LPA:', (asLPA.reduce((a,b)=>a+b,0)/asLPA.length).toFixed(1));

// Check logo_url format
console.log('\n=== LOGO URL SAMPLE (5 rows) ===');
q('SELECT id, name, logo_url FROM colleges LIMIT 5').forEach(r=>
  console.log('  ['+r.id+'] '+r.name.substring(0,30)+' | '+r.logo_url)
);

// College contacts table
console.log('\n=== COLLEGE_CONTACTS COLUMNS ===');
q("PRAGMA table_info(college_contacts)").forEach(r=>
  console.log('  col:', r.name)
);

// Fees range detail
console.log('\n=== FEES SANITY (avg 7.7L seems high) ===');
const feesBuckets = q(`SELECT 
  CASE 
    WHEN avg_fees_per_year IS NULL THEN 'NULL'
    WHEN avg_fees_per_year=0 THEN 'Zero'
    WHEN avg_fees_per_year<30000 THEN 'Under 30K'
    WHEN avg_fees_per_year<100000 THEN '30K-1L'
    WHEN avg_fees_per_year<500000 THEN '1L-5L'
    WHEN avg_fees_per_year<1000000 THEN '5L-10L'
    WHEN avg_fees_per_year<2000000 THEN '10L-20L'
    ELSE 'Over 20L'
  END as bucket, COUNT(*) as c
  FROM colleges GROUP BY bucket ORDER BY MIN(COALESCE(avg_fees_per_year,-1))`);
feesBuckets.forEach(r=>console.log('  '+r.bucket.padEnd(15)+': '+r.c.toLocaleString()));

// Description sample - is it real or generated?
console.log('\n=== 3 DESCRIPTION SAMPLES ===');
q('SELECT id, name, description FROM colleges LIMIT 3').forEach(r=>
  console.log('  ['+r.id+'] '+r.name.substring(0,30)+'\n    '+r.description.substring(0,150)+'...\n')
);

// College contacts
console.log('\n=== CONTACTS SAMPLE ===');
try {
  q('SELECT * FROM college_contacts LIMIT 5').forEach(r=>console.log('  '+JSON.stringify(r)));
} catch(e) { console.log('Error:', e.message); }

// website/email/phone in colleges table vs contacts table
console.log('\n=== WEBSITE/EMAIL/PHONE in COLLEGES table ===');
const withWeb = q1("SELECT COUNT(*) as c FROM colleges WHERE website IS NOT NULL AND website!=''").c;
const withEmail = q1("SELECT COUNT(*) as c FROM colleges WHERE contact_email IS NOT NULL AND contact_email!=''").c;
const withPhone = q1("SELECT COUNT(*) as c FROM colleges WHERE contact_phone IS NOT NULL AND contact_phone!=''").c;
console.log('  website:', withWeb.toLocaleString());
console.log('  email:', withEmail.toLocaleString());
console.log('  phone:', withPhone.toLocaleString());
// Sample
q('SELECT id, name, website, contact_email, contact_phone FROM colleges LIMIT 3').forEach(r=>
  console.log('  ['+r.id+'] '+r.name.substring(0,25)+' | web:'+r.website+' | email:'+r.contact_email+' | ph:'+r.contact_phone)
);
