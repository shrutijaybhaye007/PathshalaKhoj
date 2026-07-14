/**
 * db_audit.js — Comprehensive database quality audit for PathshalaKhoj
 * Run from backend/: node db_audit.js
 */
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'db', 'colleges.db');
const db = new DatabaseSync(DB_PATH);

function q(sql)  { try { return db.prepare(sql).all(); }  catch(e) { return []; } }
function q1(sql) { try { return db.prepare(sql).get();  } catch(e) { return null; } }
function qp(sql, ...p) { try { return db.prepare(sql).get(...p); } catch(e) { return null; } }

console.log('\n' + '='.repeat(70));
console.log('PathshalaKhoj — Database Quality Audit');
console.log('='.repeat(70));

const total = q1('SELECT COUNT(*) as c FROM colleges').c;
const totalCourses = q1('SELECT COUNT(*) as c FROM courses').c;
const totalContacts = q1('SELECT COUNT(*) as c FROM college_contacts')?.c || 0;
const totalReviews  = q1('SELECT COUNT(*) as c FROM college_reviews')?.c || 0;

console.log(`\n📊 TOTALS`);
console.log(`   Colleges  : ${total.toLocaleString()}`);
console.log(`   Courses   : ${totalCourses.toLocaleString()}`);
console.log(`   Contacts  : ${totalContacts.toLocaleString()}`);
console.log(`   Reviews   : ${totalReviews.toLocaleString()}`);

// ── FIELD COMPLETENESS ──────────────────────────────────────────────────────
const fields = [
  'name','description','college_type','stream','state','city','address',
  'naac_grade','nirf_ranking','established_year','avg_fees_per_year',
  'avg_placement_package','total_seats','accreditation',
  'website','contact_email','contact_phone',
  'logo_url','facilities','top_recruiters','scholarships_info',
  'hostel_available','placement_rate'
];

console.log('\n📋 FIELD COMPLETENESS:');
const fieldStats = [];
for (const f of fields) {
  const row = q1(`SELECT COUNT(*) as c FROM colleges WHERE ${f} IS NOT NULL AND TRIM(CAST(${f} AS TEXT)) != '' AND CAST(${f} AS TEXT) != '0'`);
  const filled = row ? row.c : 0;
  const pct = ((filled / total) * 100).toFixed(1);
  fieldStats.push({ field: f, filled, pct: parseFloat(pct) });
}
fieldStats.sort((a,b) => b.pct - a.pct);
for (const s of fieldStats) {
  const bar  = '█'.repeat(Math.round(s.pct / 5)).padEnd(20, '░');
  const warn = s.pct < 10 ? ' ⚠️ CRITICAL' : s.pct < 40 ? ' 🟡 LOW' : '';
  console.log(`   ${s.field.padEnd(25)} ${bar} ${s.pct.toString().padStart(5)}% (${s.filled.toLocaleString()}/${total.toLocaleString()})${warn}`);
}

// ── CORRUPTION CHECKS ───────────────────────────────────────────────────────
console.log('\n🔍 DATA CORRUPTION CHECKS:');
const nullLiteral   = q1("SELECT COUNT(*) as c FROM colleges WHERE name='null' OR name='undefined' OR name LIKE '%{}%'").c;
const shortNames    = q1("SELECT COUNT(*) as c FROM colleges WHERE LENGTH(name) < 5").c;
const dupPairs      = q1("SELECT COUNT(*) as c FROM (SELECT name,state FROM colleges GROUP BY name,state HAVING COUNT(*)>1)").c;
const badFees       = q1("SELECT COUNT(*) as c FROM colleges WHERE avg_fees_per_year > 20000000").c;
const suspectPlac   = q1("SELECT COUNT(*) as c FROM colleges WHERE avg_placement_package > 100 AND avg_placement_package < 10000").c;
const rawRupeePlac  = q1("SELECT COUNT(*) as c FROM colleges WHERE avg_placement_package >= 100000").c;
const noStreamState = q1("SELECT COUNT(*) as c FROM colleges WHERE stream IS NULL OR state IS NULL").c;
const noCourses     = (q1("SELECT COUNT(*) as c FROM colleges WHERE id NOT IN (SELECT DISTINCT college_id FROM courses WHERE college_id IS NOT NULL)") || {c:0}).c;

console.log(`   Names that are 'null'/'undefined'/'{}'  : ${nullLiteral}`);
console.log(`   Names shorter than 5 chars              : ${shortNames}`);
console.log(`   Duplicate (name+state) pairs            : ${dupPairs}`);
console.log(`   Fees > ₹2Cr (wrong unit?)               : ${badFees}`);
console.log(`   Placement 100–10,000 (suspicious range) : ${suspectPlac}`);
console.log(`   Placement ≥ 1 Lakh (raw rupees not LPA) : ${rawRupeePlac}`);
console.log(`   Missing stream OR state                 : ${noStreamState}`);
console.log(`   Colleges with ZERO courses linked       : ${noCourses.toLocaleString()}`);

// ── TYPE DISTRIBUTION ───────────────────────────────────────────────────────
console.log('\n🏛️  TYPE DISTRIBUTION:');
q('SELECT college_type, COUNT(*) as c FROM colleges GROUP BY college_type ORDER BY c DESC').forEach(r =>
  console.log(`   ${(r.college_type||'NULL').padEnd(30)} : ${r.c.toLocaleString()}`)
);

// ── STREAM DISTRIBUTION ─────────────────────────────────────────────────────
console.log('\n📚 STREAM DISTRIBUTION (top 15):');
q('SELECT stream, COUNT(*) as c FROM colleges GROUP BY stream ORDER BY c DESC LIMIT 15').forEach(r =>
  console.log(`   ${(r.stream||'NULL').padEnd(35)} : ${r.c.toLocaleString()}`)
);

// ── STATE DISTRIBUTION ──────────────────────────────────────────────────────
console.log('\n🗺️  STATE DISTRIBUTION (top 15):');
q('SELECT state, COUNT(*) as c FROM colleges GROUP BY state ORDER BY c DESC LIMIT 15').forEach(r =>
  console.log(`   ${(r.state||'NULL').padEnd(35)} : ${r.c.toLocaleString()}`)
);

// ── FEES DISTRIBUTION ───────────────────────────────────────────────────────
console.log('\n💰 FEES DISTRIBUTION:');
const feesStats = q1('SELECT MIN(avg_fees_per_year) as mn, MAX(avg_fees_per_year) as mx, AVG(avg_fees_per_year) as av FROM colleges WHERE avg_fees_per_year > 0');
if (feesStats) {
  console.log(`   Min (non-zero) : ₹${Number(feesStats.mn).toLocaleString('en-IN')}`);
  console.log(`   Max            : ₹${Number(feesStats.mx).toLocaleString('en-IN')}`);
  console.log(`   Avg (non-zero) : ₹${Math.round(feesStats.av).toLocaleString('en-IN')}`);
}
q(`SELECT CASE
    WHEN avg_fees_per_year IS NULL THEN 'NULL'
    WHEN avg_fees_per_year = 0 THEN 'Free/Zero'
    WHEN avg_fees_per_year < 30000 THEN '< ₹30K'
    WHEN avg_fees_per_year < 100000 THEN '₹30K-1L'
    WHEN avg_fees_per_year < 500000 THEN '₹1L-5L'
    WHEN avg_fees_per_year < 2000000 THEN '₹5L-20L'
    ELSE '₹20L+ (check unit)'
  END as bucket, COUNT(*) as c
  FROM colleges GROUP BY bucket ORDER BY MIN(COALESCE(avg_fees_per_year,-1))`).forEach(r =>
  console.log(`   ${r.bucket.padEnd(20)}: ${r.c.toLocaleString()}`)
);

// ── PLACEMENT DISTRIBUTION ──────────────────────────────────────────────────
console.log('\n💼 PLACEMENT PACKAGE DISTRIBUTION:');
const placStats = q1('SELECT MIN(avg_placement_package) as mn, MAX(avg_placement_package) as mx, AVG(avg_placement_package) as av FROM colleges WHERE avg_placement_package > 0');
if (placStats) {
  console.log(`   Min (non-zero) : ${placStats.mn}`);
  console.log(`   Max            : ${placStats.mx}`);
  console.log(`   Avg (non-zero) : ${Math.round(placStats.av)}`);
}
q(`SELECT CASE
    WHEN avg_placement_package IS NULL OR avg_placement_package = 0 THEN 'Not set'
    WHEN avg_placement_package BETWEEN 1 AND 99 THEN '1-99 LPA (normal range)'
    WHEN avg_placement_package BETWEEN 100 AND 9999 THEN '100-9999 (suspicious)'
    WHEN avg_placement_package >= 10000 AND avg_placement_package < 100000 THEN '10K-1L (likely wrong unit)'
    WHEN avg_placement_package >= 100000 THEN '>1L (raw rupees?)'
    ELSE 'Other'
  END as bucket, COUNT(*) as c
  FROM colleges GROUP BY bucket ORDER BY MIN(COALESCE(avg_placement_package,-1))`).forEach(r =>
  console.log(`   ${r.bucket.padEnd(30)}: ${r.c.toLocaleString()}`)
);

// ── DESCRIPTION QUALITY ─────────────────────────────────────────────────────
const withDesc = q1("SELECT COUNT(*) as c FROM colleges WHERE description IS NOT NULL AND LENGTH(description) > 50").c;
const avgDescLen = q1("SELECT AVG(LENGTH(description)) as a FROM colleges WHERE description IS NOT NULL AND LENGTH(description)>0")?.a || 0;
console.log(`\n📝 DESCRIPTION QUALITY:`);
console.log(`   With desc > 50 chars : ${withDesc.toLocaleString()} (${((withDesc/total)*100).toFixed(1)}%)`);
console.log(`   Avg description len  : ${Math.round(avgDescLen)} chars`);

// ── SAMPLE BAD RECORDS ──────────────────────────────────────────────────────
console.log('\n🔬 5 SAMPLE RECORDS MISSING MOST DATA:');
q(`SELECT id, name, college_type, stream, state, avg_fees_per_year, avg_placement_package, naac_grade
   FROM colleges
   WHERE (description IS NULL OR description='')
     AND (naac_grade IS NULL)
     AND (avg_fees_per_year IS NULL OR avg_fees_per_year=0)
   LIMIT 5`).forEach((r,i) =>
  console.log(`   ${i+1}. [${r.id}] ${(r.name||'').substring(0,45)} | ${r.stream||'-'} | ${r.state||'-'}`)
);

// ── SCORE ──────────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(70));
const critical = fieldStats.filter(f => ['name','stream','state','city','college_type'].includes(f.field));
const avgC = (critical.reduce((a,b)=>a+b.pct,0)/critical.length).toFixed(1);
const avgA = (fieldStats.reduce((a,b)=>a+b.pct,0)/fieldStats.length).toFixed(1);
console.log(`📈 DATA QUALITY SCORE:`);
console.log(`   Critical fields avg (name/stream/state/city/type): ${avgC}%`);
console.log(`   All fields average completeness                  : ${avgA}%`);
console.log('='.repeat(70));
