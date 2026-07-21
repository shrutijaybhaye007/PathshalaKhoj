/**
 * seed_aishe.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Seeds the colleges table with real AISHE (All India Survey on Higher
 * Education) data from the government's institutional directory.
 *
 * DATA FILE REQUIRED:
 *   backend/db/data/aishe_colleges.xlsx
 *   Download from: https://aishe.gov.in/ → Reports → AISHE Final Report
 *   or from: https://aikosh.indiaai.gov.in/ (search "AISHE Institutional Directory")
 *
 * IMPORTANT — NO FAKE DATA:
 *   This script inserts real government data only. All financial and contact
 *   fields are set to NULL. data_verified = false for all rows inserted here.
 *   Run seed_nirf.js afterwards to set data_verified = true for NIRF-ranked colleges.
 *
 * RUN ORDER:
 *   1. node db/seed_aishe.js
 *   2. node db/spot_check_nirf.js   (manual verification step)
 *   3. node db/seed_nirf.js
 *
 * Usage: node db/seed_aishe.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path  = require('path');
const fs    = require('fs');
const XLSX  = require('xlsx');
const { get, all, run, exec, pool } = require('./connection');

// ─── Paths ──────────────────────────────────────────────────────────────────
const DATA_DIR         = path.join(__dirname, 'data');
const AISHE_FILE       = path.join(DATA_DIR, 'aishe_colleges.xlsx');
const AMBIGUOUS_FILE   = path.join(DATA_DIR, 'review_ambiguous.txt');
const FILTERED_FILE    = path.join(DATA_DIR, 'filtered_out_sample.txt');

// ─── Acronyms to preserve uppercase in title-case ───────────────────────────
const UPPERCASE_ACRONYMS = new Set([
  'iit', 'nit', 'iim', 'aiims', 'nlu', 'bits', 'bhu', 'amu', 'du', 'iiit',
  'iiser', 'niser', 'nid', 'nift', 'xlri', 'tiss', 'irma', 'isb', 'isi',
  'iisc', 'iifm', 'niftem', 'nitttr', 'sliet', 'nerist', 'nit', 'nia',
  'icar', 'iari', 'ivri', 'ndri', 'iiim', 'icmr', 'drdo',
]);

// ─── Address fragment patterns to strip ─────────────────────────────────────
const ADDRESS_PATTERNS = [
  /,\s*village\b.*/i,  /,\s*dist\b.*/i,   /,\s*taluka\b.*/i,
  /,\s*khasra\b.*/i,  /,\s*tah\b.*/i,    /,\s*tehsil\b.*/i,
  /,\s*post\b.*/i,    /,\s*pin\b.*/i,    /,\s*nh-?\d+.*/i,
  /,\s*p\.?o\.?\b.*/i, /,\s*via\b.*/i,
  /,\s*[A-Z\s]{5,}$/,   // trailing uppercase location text e.g. ",SATNA"
];

// ─── Name Cleaning ───────────────────────────────────────────────────────────
function cleanAisheName(rawName) {
  if (!rawName || typeof rawName !== 'string') return 'Unknown College';
  let name = rawName.trim();

  // Strip leading bracketed abbreviations like "(a.b.m.s.) " or "(AIIMS) "
  name = name.replace(/^\s*\([^)]{1,25}\)\s+/g, '');

  // Strip embedded AISHE codes like "C-12345" or "C-12345678"
  name = name.replace(/\bC-\d{4,10}\b/g, '');

  // Strip Id references
  name = name.replace(/\s*\(Id:.*?\)\s*/gi, '');
  name = name.replace(/^\+3\s*/i, '').replace(/\(\+3\)/gi, '');

  // Strip leading/trailing stray quotes
  name = name.replace(/^['"]+|['"]+$/g, '');

  // Strip address fragments
  for (const pat of ADDRESS_PATTERNS) {
    name = name.replace(pat, '');
  }

  // Clean trailing comma/space
  name = name.trim().replace(/^,\s*/, '').replace(/,\s*$/, '');

  // Collapse multiple spaces
  name = name.replace(/\s{2,}/g, ' ').trim();

  if (!name || name.length < 3) return 'Unknown College';

  // Title case with acronym preservation
  name = name.toLowerCase().split(/\s+/).map(word => {
    const lower = word.replace(/[^a-z0-9]/g, '');
    if (UPPERCASE_ACRONYMS.has(lower)) return word.toUpperCase();
    // Preserve all-caps short words that look like acronyms (2-5 chars)
    if (rawName.includes(word.toUpperCase()) && word.length <= 5 && /^[a-z]+$/.test(word)) {
      return word.toUpperCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');

  return name.trim();
}

// ─── Slugify ─────────────────────────────────────────────────────────────────
function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// ─── College Type Mapping ─────────────────────────────────────────────────────
function mapCollegeType(management) {
  if (!management) return 'Private';
  const m = management.toLowerCase();
  if (m.includes('central government') || m.includes('state government') ||
      m.includes('government') && !m.includes('deemed') && !m.includes('aided')) {
    return 'Government';
  }
  if (m.includes('government aided') || m.includes('state government aided') ||
      m.includes('private aided')) {
    return 'Government'; // Aided = effectively government-supported
  }
  if (m.includes('deemed')) return 'Deemed';
  if (m.includes('institute of national importance') ||
      m.includes('central university') || m.includes('state university') ||
      m.includes('national importance')) {
    return 'Autonomous';
  }
  if (m.includes('private')) return 'Private';
  return 'Private';
}

// ─── Stream Mapping ───────────────────────────────────────────────────────────
function mapStream(collegeType, institutionName) {
  if (!collegeType) return { stream: 'Science', ambiguous: true };
  const ct = collegeType.toLowerCase();
  const nm = (institutionName || '').toLowerCase();

  if (ct.includes('engineering') || ct.includes('technology') ||
      nm.includes('engineering') || nm.includes('technology') ||
      nm.includes('polytechnic') || nm.includes(' iit ') || nm.includes('nit ')) {
    return { stream: 'Engineering', ambiguous: false };
  }
  if (ct.includes('medical') || ct.includes('dental') || ct.includes('ayush') ||
      ct.includes('ayurveda') || ct.includes('homeopathy') || ct.includes('unani') ||
      nm.includes('medical') || nm.includes(' aiims') || nm.includes('dental')) {
    return { stream: 'Medical', ambiguous: false };
  }
  if (ct.includes('pharmacy') || nm.includes('pharmacy') || nm.includes('pharmaceutical')) {
    return { stream: 'Medical', ambiguous: false };
  }
  if (ct.includes('nursing') || nm.includes('nursing') || nm.includes('paramedic')) {
    return { stream: 'Medical', ambiguous: false };
  }
  if (ct.includes('law') || nm.includes(' law ') || nm.includes('legal') ||
      nm.includes('nlu') || nm.includes('national law')) {
    return { stream: 'Law', ambiguous: false };
  }
  if (ct.includes('management') || ct.includes('commerce') ||
      nm.includes(' iim ') || nm.includes('management') || nm.includes('business school') ||
      nm.includes('b-school') || nm.includes('mba')) {
    return { stream: 'Management', ambiguous: false };
  }
  if (ct.includes('architecture') || ct.includes('planning') ||
      nm.includes('architecture') || nm.includes('design') ||
      nm.includes('nid') || nm.includes('nift')) {
    return { stream: 'Design', ambiguous: false };
  }
  if (ct.includes('agriculture') || ct.includes('veterinary') ||
      nm.includes('agricultural') || nm.includes('veterinary') ||
      nm.includes('horticulture') || nm.includes('forestry')) {
    return { stream: 'Science', ambiguous: false };
  }
  if (ct.includes('education') || ct.includes('teacher') ||
      nm.includes('b.ed') || nm.includes('teacher training') || nm.includes('bed college')) {
    return { stream: 'Arts', ambiguous: false };
  }
  if (ct.includes('physical education') || ct.includes('sports')) {
    return { stream: 'Arts', ambiguous: false };
  }
  // Arts & Science / General / Multi-disciplinary → default Science, flag as ambiguous
  return { stream: 'Science', ambiguous: true };
}

// ─── Filtering Logic ──────────────────────────────────────────────────────────
function shouldInclude(row) {
  const name   = (row.name || '').toLowerCase();
  const ct     = (row.collegeType || '').toLowerCase();
  const mgmt   = (row.management || '').toLowerCase();
  const year   = row.establishedYear;

  // Always INCLUDE: Institutions of National Importance, Central Univ, IIT/NIT/IIM etc.
  const isElite = /\biit\b|\bnit\b|\biim\b|\baiims\b|\bnlu\b|\bbits\b|\biiit\b|\biiser\b|\bniser\b|\bnid\b|\bnift\b|\biisc\b|\btiss\b/.test(name);
  if (isElite) return true;

  // Always INCLUDE: Government/Government-aided colleges regardless of age
  if (mgmt.includes('government') || mgmt.includes('central university') ||
      mgmt.includes('state university')) return true;

  // Always INCLUDE: Engineering, Medical, Law, Management, Architecture streams (any age)
  const isProStream = /engineering|technology|medical|dental|law|management|architecture|pharmacy|nursing/.test(ct);
  if (isProStream) return true;

  // Always INCLUDE: colleges established before 2006
  if (year && year <= 2005) return true;

  // EXCLUDE: pure diploma/ITI/polytechnic with no degree-level program
  const isDiplomaOnly = /\bpolytechnic\b|\diploma institute\b|\biti\b|\bindustrial training institute\b/.test(name);
  if (isDiplomaOnly && !name.includes('engineering college')) return false;

  // EXCLUDE: very new private Arts & Science colleges (low-quality proliferation tier)
  const isNewPrivateArts = (
    (mgmt.includes('private unaided') || mgmt.includes('private-unaided')) &&
    year && year > 2015 &&
    (ct.includes('arts') || ct.includes('general') || ct.includes('multi'))
  );
  if (isNewPrivateArts) return false;

  // EXCLUDE: colleges established after 2018 (likely unaccredited)
  if (year && year > 2018) return false;

  return true;
}

// ─── Column name auto-detection ───────────────────────────────────────────────
function detectColumns(headers) {
  const h = headers.map(x => String(x || '').toLowerCase().trim());
  const find = (...candidates) => {
    for (const c of candidates) {
      const idx = h.findIndex(x => x.includes(c));
      if (idx >= 0) return headers[idx];
    }
    return null;
  };
  return {
    name:        find('name of institution', 'institution name', 'college name', 'name'),
    state:       find('state', 'state name'),
    district:    find('district', 'city', 'dist'),
    year:        find('year of establishment', 'established year', 'year estab'),
    location:    find('location', 'urban/rural', 'rural/urban'),
    collegeType: find('college type', 'type of college', 'type of institution'),
    management:  find('management', 'management type'),
    affiliation: find('affiliated university name', 'university name', 'affiliated to'),
    aisheCode:   find('aishe code', 'aishe', 'code'),
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seedAishe() {
  console.log('\n🏛️  PathshalaKhoj — AISHE Government Data Seeder');
  console.log('═'.repeat(55));

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Check data file
  if (!fs.existsSync(AISHE_FILE)) {
    console.error(`\n❌ AISHE data file not found at:\n   ${AISHE_FILE}`);
    console.error('\nPlease download it from:');
    console.error('  https://aishe.gov.in/ → Reports → AISHE Final Report');
    console.error('  OR: https://aikosh.indiaai.gov.in/ (search "AISHE Institutional Directory")');
    console.error('\nSave it as: backend/db/data/aishe_colleges.xlsx\n');
    process.exit(1);
  }

  // ── Load workbook ──
  console.log(`\n📂 Loading: ${AISHE_FILE}`);
  const workbook = XLSX.readFile(AISHE_FILE, { cellDates: true });

  // Use first sheet (or find a sheet with "college" or "institution" in name)
  let sheetName = workbook.SheetNames[0];
  for (const sn of workbook.SheetNames) {
    if (/college|institution|directory/i.test(sn)) { sheetName = sn; break; }
  }
  console.log(`   Sheet: "${sheetName}"`);
  console.log(`   Available sheets: ${workbook.SheetNames.join(', ')}`);

  const sheet = workbook.Sheets[sheetName];
  const rows  = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rows || rows.length === 0) {
    console.error('❌ No rows found in the Excel file. Check the sheet structure.');
    process.exit(1);
  }

  console.log(`   Rows parsed: ${rows.length.toLocaleString()}`);

  // ── Detect column mapping ──
  const headers = Object.keys(rows[0]);
  const cols    = detectColumns(headers);
  console.log('\n📋 Detected column mapping:');
  for (const [key, val] of Object.entries(cols)) {
    console.log(`   ${key.padEnd(12)} → "${val || '(not found)'}"`);
  }

  if (!cols.name) {
    console.error('\n❌ Cannot find institution name column. Headers found:');
    console.error('  ', headers.join(', '));
    console.error('\nPlease check the AISHE file and update detectColumns() if needed.');
    process.exit(1);
  }

  // ── Pre-load existing slugs ──
  console.log('\n🔍 Loading existing slugs from database...');
  const existingRows = await all('SELECT slug FROM colleges');
  const existingSlugs = new Set((existingRows || []).map(r => r.slug));
  console.log(`   Existing slugs: ${existingSlugs.size.toLocaleString()}`);

  // ── Process rows ──
  console.log('\n⚙️  Processing AISHE rows...');

  const toInsert    = [];
  const ambiguous   = [];
  const filteredOut = [];
  const slugSet     = new Set(existingSlugs); // track new slugs too

  let rowNum = 0;
  for (const row of rows) {
    rowNum++;
    if (rowNum % 5000 === 0) process.stdout.write(`\r   Processed ${rowNum.toLocaleString()} / ${rows.length.toLocaleString()}`);

    const rawName      = String(row[cols.name] || '').trim();
    const state        = String(row[cols.state]      || '').trim();
    const district     = String(row[cols.district]   || '').trim();
    const yearRaw      = row[cols.year] ? String(row[cols.year]).trim() : '';
    const collegeType  = String(row[cols.collegeType] || '').trim();
    const management   = String(row[cols.management]  || '').trim();
    const affiliation  = String(row[cols.affiliation] || '').trim();
    const aisheCode    = cols.aisheCode ? String(row[cols.aisheCode] || '').trim() : '';

    if (!rawName || rawName.length < 3) continue;

    // Parse year
    let establishedYear = null;
    const yearNum = parseInt(yearRaw, 10);
    if (!isNaN(yearNum) && yearNum > 1800 && yearNum <= new Date().getFullYear()) {
      establishedYear = yearNum;
    }

    const city = district || 'Unknown';

    // Filter
    const rowData = { name: rawName, collegeType, management, establishedYear };
    if (!shouldInclude(rowData)) {
      filteredOut.push({ rawName, state, city, collegeType, management, establishedYear });
      continue;
    }

    // Clean name
    const cleanedName = cleanAisheName(rawName);
    if (!cleanedName || cleanedName === 'Unknown College') continue;

    // Stream
    const { stream, ambiguous: isAmbiguous } = mapStream(collegeType, cleanedName);
    if (isAmbiguous) {
      ambiguous.push({ name: cleanedName, city, state, collegeType, management, stream });
    }

    // College type
    const collegeTypeMapped = mapCollegeType(management || collegeType);

    // Slug (with collision handling)
    let baseSlug = slugify(`${cleanedName}-${city}`);
    if (!baseSlug) baseSlug = slugify(cleanedName);
    if (!baseSlug) continue;

    let finalSlug = baseSlug;
    let suffix = 2;
    while (slugSet.has(finalSlug)) {
      finalSlug = `${baseSlug}-${suffix}`;
      suffix++;
    }
    slugSet.add(finalSlug);

    toInsert.push({
      name:          cleanedName,
      slug:          finalSlug,
      city,
      state,
      stream,
      college_type:  collegeTypeMapped,
      affiliation:   affiliation || null,
      established_year: establishedYear,
      data_verified: false,
      data_source:   'aishe',
      // All financial/contact fields are NULL — no fake data
      avg_fees_per_year:         null,
      avg_placement_package:     null,
      highest_placement_package: null,
      nirf_ranking:              null,
      contact_phone:             null,
      contact_email:             null,
    });
  }
  console.log(''); // newline after progress

  // ── Write review files ──
  console.log(`\n📝 Writing review files...`);

  // Ambiguous stream file
  const ambigLines = [`AISHE Seed — Ambiguous Stream Assignments\nGenerated: ${new Date().toISOString()}\nTotal: ${ambiguous.length}\n\n`];
  ambiguous.forEach((r, i) => {
    ambigLines.push(`${i + 1}. ${r.name} (${r.city}, ${r.state})\n   College Type: ${r.collegeType} | Management: ${r.management}\n   → Assigned stream: ${r.stream}\n`);
  });
  fs.writeFileSync(AMBIGUOUS_FILE, ambigLines.join(''), 'utf8');
  console.log(`   Ambiguous stream: ${AMBIGUOUS_FILE} (${ambiguous.length} entries)`);

  // Random 30-row sample of filtered-out colleges
  const sample = filteredOut.length <= 30
    ? filteredOut
    : [...filteredOut].sort(() => Math.random() - 0.5).slice(0, 30);
  const filteredLines = [
    `AISHE Seed — Filtered-Out Colleges Sample (30 random)\nGenerated: ${new Date().toISOString()}\nTotal filtered out: ${filteredOut.length}\n\nReview these to verify the filtering rules aren't dropping good colleges.\n\n`
  ];
  sample.forEach((r, i) => {
    filteredLines.push(`${i + 1}. ${r.rawName}\n   State: ${r.state} | City: ${r.city}\n   Type: ${r.collegeType} | Mgmt: ${r.management} | Year: ${r.establishedYear || 'N/A'}\n\n`);
  });
  fs.writeFileSync(FILTERED_FILE, filteredLines.join(''), 'utf8');
  console.log(`   Filtered-out sample: ${FILTERED_FILE} (${sample.length} of ${filteredOut.length} shown)`);

  if (toInsert.length === 0) {
    console.error('\n❌ No colleges to insert after filtering. Check filter logic or data file.');
    if (pool) await pool.end();
    process.exit(1);
  }

  // ── Batch INSERT ──
  console.log(`\n⬆️  Inserting ${toInsert.length.toLocaleString()} colleges into database...`);
  console.log('   (Batch size: 500 rows, ON CONFLICT DO NOTHING)');

  const BATCH = 500;
  let inserted = 0;
  let skipped  = 0;

  try {
    await exec('BEGIN');

    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);

      const placeholders = [];
      const values       = [];
      let   paramIdx     = 1;

      for (const c of batch) {
        // 12 value columns
        placeholders.push(
          `($${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},` +
          `$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++},` +
          `$${paramIdx++},$${paramIdx++},$${paramIdx++},$${paramIdx++})`
        );
        values.push(
          c.name, c.slug, c.city, c.state,
          c.stream, c.college_type, c.affiliation, c.established_year,
          c.data_verified, c.data_source,
          c.avg_fees_per_year, c.nirf_ranking
        );
      }

      const sql = `
        INSERT INTO colleges
          (name, slug, city, state, stream, college_type, affiliation, established_year,
           data_verified, data_source, avg_fees_per_year, nirf_ranking)
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (slug) DO NOTHING
      `;

      // Use pool directly for parameterised multi-row inserts
      // (avoids run()'s RETURNING id overhead for large batches)
      const res = await pool.query(sql, values);
      const batchInserted = res.rowCount || 0;
      inserted += batchInserted;
      skipped  += (batch.length - batchInserted);

      if ((i / BATCH) % 5 === 0) {
        process.stdout.write(`\r   Inserted: ${inserted.toLocaleString()} / ${toInsert.length.toLocaleString()}`);
      }
    }

    await exec('COMMIT');
    console.log(''); // newline
  } catch (err) {
    try { await exec('ROLLBACK'); } catch (_) {}
    console.error('\n❌ Transaction error:', err.message);
    if (pool) await pool.end();
    process.exit(1);
  }

  // ── Final summary ──
  const totalRow = await get('SELECT count(*) as c FROM colleges');
  const verifiedRow = await get('SELECT count(*) as c FROM colleges WHERE data_verified = true');

  console.log('\n' + '═'.repeat(55));
  console.log('✅ AISHE Seeding Complete!');
  console.log('─'.repeat(55));
  console.log(`  Parsed from AISHE:      ${rows.length.toLocaleString()}`);
  console.log(`  Filtered out:           ${filteredOut.length.toLocaleString()}`);
  console.log(`  Attempted to insert:    ${toInsert.length.toLocaleString()}`);
  console.log(`  Actually inserted:      ${inserted.toLocaleString()}`);
  console.log(`  Skipped (slug dup):     ${skipped.toLocaleString()}`);
  console.log(`  Ambiguous stream:       ${ambiguous.length.toLocaleString()} (see review_ambiguous.txt)`);
  console.log('─'.repeat(55));
  console.log(`  Total in DB now:        ${(totalRow ? totalRow.c : '?').toLocaleString()}`);
  console.log(`  data_verified = true:   ${(verifiedRow ? verifiedRow.c : 0).toLocaleString()}`);
  console.log('═'.repeat(55));
  console.log('\n📋 Next steps:');
  console.log('  1. Review backend/db/data/filtered_out_sample.txt');
  console.log('     Check if any legit colleges were incorrectly excluded.');
  console.log('  2. Review backend/db/data/review_ambiguous.txt');
  console.log('     Manually reclassify stream for colleges you know better.');
  console.log('  3. Run: node db/spot_check_nirf.js');
  console.log('     Verify NIRF CSV data before the enrichment pass.\n');

  if (pool) await pool.end();
}

if (require.main === module) {
  seedAishe().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { seedAishe };
