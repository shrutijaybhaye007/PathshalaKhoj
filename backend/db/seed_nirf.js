/**
 * seed_nirf.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Enriches college rows (inserted by seed_aishe.js) with NIRF ranking data.
 *
 * DATA FILE REQUIRED:
 *   backend/db/data/nirf_rankings.csv
 *   Download from Kaggle: search "NIRF Rankings 2024 combined"
 *   OR manually compile from https://www.nirfindia.org/2024/
 *
 * ⚠️  RUN spot_check_nirf.js FIRST and verify the data before running this.
 *
 * WHAT THIS SETS:
 *   - nirf_ranking  → integer rank from the CSV
 *   - data_verified → true
 *
 * WHAT THIS LEAVES NULL (per project spec — no fabricated data):
 *   - avg_fees_per_year
 *   - avg_placement_package
 *   - highest_placement_package
 *
 * MATCHING STRATEGY (3 tiers):
 *   Tier 1 — slug match:     slugify(nirf_name + '-' + nirf_city)
 *   Tier 2 — exact name:     LOWER(TRIM(name)) = LOWER(TRIM(nirf_name))
 *   Tier 3 — fuzzy (words):  word-overlap ratio ≥ 0.75, same state
 *
 * Usage:  node db/seed_nirf.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const path = require('path');
const fs   = require('fs');
const { get, all, run, pool } = require('./connection');

// ─── Paths ───────────────────────────────────────────────────────────────────
const DATA_DIR      = path.join(__dirname, 'data');
const NIRF_FILE     = path.join(DATA_DIR, 'nirf_rankings.csv');
const FUZZY_FILE    = path.join(DATA_DIR, 'nirf_fuzzy_matches.txt');
const UNMATCHED_FILE= path.join(DATA_DIR, 'nirf_unmatched.txt');

// ─── CSV Parser (no external deps) ──────────────────────────────────────────
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    if (vals.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim(); });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current  = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ─── Column detection ─────────────────────────────────────────────────────────
function detectNirfCols(headers) {
  const h = headers.map(x => String(x || '').toLowerCase().trim());
  const find = (...candidates) => {
    for (const c of candidates) {
      const col = headers.find((_, i) => h[i].includes(c));
      if (col) return col;
    }
    return null;
  };
  return {
    rank:     find('rank', 'ranking'),
    name:     find('institute name', 'institution name', 'college name', 'name'),
    city:     find('city', 'location', 'district'),
    state:    find('state'),
    category: find('category', 'stream', 'type'),
  };
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

// ─── Normalize for matching ───────────────────────────────────────────────────
function normalizeName(name) {
  return String(name || '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Word-overlap fuzzy score (Jaccard-like) ──────────────────────────────────
const STOP_WORDS = new Set([
  'of', 'and', 'the', 'for', 'in', 'at', 'a', 'an', 'is', 'to',
  'college', 'institute', 'university', 'technology', 'sciences',
  'management', 'engineering', 'arts', 'science'
]);

function wordTokens(name) {
  return normalizeName(name).split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function wordOverlapScore(a, b) {
  const ta = new Set(wordTokens(a));
  const tb = new Set(wordTokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const w of ta) if (tb.has(w)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union > 0 ? intersection / union : 0;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seedNirf() {
  console.log('\n🏆 PathshalaKhoj — NIRF Ranking Enrichment');
  console.log('═'.repeat(55));

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(NIRF_FILE)) {
    console.error(`\n❌ NIRF CSV not found at: ${NIRF_FILE}`);
    console.error('Run: node db/spot_check_nirf.js first for download instructions.');
    process.exit(1);
  }

  // ── Parse CSV ──
  console.log(`\n📂 Loading: ${NIRF_FILE}`);
  const content  = fs.readFileSync(NIRF_FILE, 'utf8');
  const nerfRows = parseCSV(content);

  if (nerfRows.length === 0) {
    console.error('❌ No rows found in NIRF CSV.');
    process.exit(1);
  }
  console.log(`   NIRF rows loaded: ${nerfRows.length}`);

  const headers = Object.keys(nerfRows[0]);
  const cols    = detectNirfCols(headers);
  console.log('\n📋 Column mapping:');
  for (const [k, v] of Object.entries(cols)) {
    console.log(`   ${k.padEnd(10)} → "${v || '(not found)'}"`);
  }

  if (!cols.name || !cols.rank) {
    console.error('❌ Could not detect required "name" and "rank" columns.');
    console.error('   Headers:', headers.join(', '));
    process.exit(1);
  }

  // ── Load all college rows for matching ──
  console.log('\n📥 Loading colleges from database...');
  const dbColleges = await all(
    'SELECT id, name, slug, city, state FROM colleges'
  );
  console.log(`   Colleges in DB: ${dbColleges.length.toLocaleString()}`);

  // Build lookup maps for fast matching
  const slugToCollege = new Map(dbColleges.map(c => [c.slug, c]));
  const normToCollege = new Map(dbColleges.map(c => [normalizeName(c.name), c]));

  // ── Match and update ──
  let matchedExact  = 0;
  let matchedName   = 0;
  let matchedFuzzy  = 0;
  let unmatched     = 0;

  const fuzzyLog    = [`NIRF Enrichment — Fuzzy Matches (confidence < 0.85)\nGenerated: ${new Date().toISOString()}\n\n`];
  const unmatchedLog= [`NIRF Enrichment — Unmatched Institutes\nGenerated: ${new Date().toISOString()}\n\n`];

  let rowNum = 0;
  for (const row of nerfRows) {
    rowNum++;
    if (rowNum % 100 === 0) process.stdout.write(`\r   Processing: ${rowNum} / ${nerfRows.length}`);

    const nerfName = String(row[cols.name] || '').trim();
    const nerfCity = cols.city  ? String(row[cols.city]  || '').trim() : '';
    const nerfState= cols.state ? String(row[cols.state] || '').trim() : '';
    const rankRaw  = String(row[cols.rank]  || '').trim();
    const category = cols.category ? String(row[cols.category] || '').trim() : '';

    if (!nerfName || !rankRaw) continue;

    const rank = parseInt(rankRaw, 10);
    if (isNaN(rank) || rank <= 0) continue;

    let matched    = null;
    let matchTier  = null;
    let confidence = 1.0;

    // Tier 1: slug match
    const candidateSlug = slugify(`${nerfName}-${nerfCity}`);
    if (slugToCollege.has(candidateSlug)) {
      matched    = slugToCollege.get(candidateSlug);
      matchTier  = 'slug';
    }

    // Tier 2: exact normalized name match
    if (!matched) {
      const normKey = normalizeName(nerfName);
      if (normToCollege.has(normKey)) {
        matched   = normToCollege.get(normKey);
        matchTier = 'name';
      }
    }

    // Tier 3: fuzzy word-overlap, filtered by same state
    if (!matched) {
      let bestScore  = 0;
      let bestCollege= null;

      const stateFilter = nerfState.toLowerCase();
      const candidates  = stateFilter
        ? dbColleges.filter(c => c.state && c.state.toLowerCase().includes(stateFilter))
        : dbColleges;

      for (const c of candidates) {
        const score = wordOverlapScore(nerfName, c.name);
        if (score > bestScore) {
          bestScore   = score;
          bestCollege = c;
        }
      }

      if (bestScore >= 0.75) {
        matched    = bestCollege;
        matchTier  = 'fuzzy';
        confidence = bestScore;
      }
    }

    if (matched) {
      // Update the matched college
      await run(
        `UPDATE colleges
         SET nirf_ranking  = ?,
             data_verified = true
         WHERE id = ?`,
        [rank, matched.id]
      );

      if (matchTier === 'slug' || matchTier === 'name') {
        matchTier === 'slug' ? matchedExact++ : matchedName++;
      } else {
        matchedFuzzy++;
        if (confidence < 0.85) {
          fuzzyLog.push(
            `NIRF: "${nerfName}" (${nerfCity}, ${nerfState}) Rank #${rank}\n` +
            `  → DB:   "${matched.name}" (${matched.city}, ${matched.state})\n` +
            `  Confidence: ${(confidence * 100).toFixed(1)}%  |  Category: ${category}\n\n`
          );
        }
      }
    } else {
      unmatched++;
      unmatchedLog.push(
        `${unmatched}. ${nerfName} (${nerfCity}, ${nerfState}) — Rank #${rank}  |  ${category}\n`
      );
    }
  }
  console.log(''); // newline after progress

  // ── Write review files ──
  fs.writeFileSync(FUZZY_FILE,     fuzzyLog.join(''),     'utf8');
  fs.writeFileSync(UNMATCHED_FILE, unmatchedLog.join(''), 'utf8');

  // ── Final stats ──
  const verifiedRow = await get('SELECT count(*) as c FROM colleges WHERE data_verified = true');
  const totalRow    = await get('SELECT count(*) as c FROM colleges');

  console.log('\n' + '═'.repeat(55));
  console.log('✅ NIRF Enrichment Complete!');
  console.log('─'.repeat(55));
  console.log(`  Total NIRF rows:        ${nerfRows.length}`);
  console.log(`  Matched (slug):         ${matchedExact}`);
  console.log(`  Matched (name):         ${matchedName}`);
  console.log(`  Matched (fuzzy):        ${matchedFuzzy}  (see nirf_fuzzy_matches.txt)`);
  console.log(`  Unmatched:              ${unmatched}  (see nirf_unmatched.txt)`);
  console.log('─'.repeat(55));
  console.log(`  data_verified = true:   ${verifiedRow ? verifiedRow.c : '?'}`);
  console.log(`  Total colleges in DB:   ${totalRow ? totalRow.c : '?'}`);
  console.log('═'.repeat(55));
  console.log('\n📋 Review files:');
  console.log(`  Fuzzy matches:  ${FUZZY_FILE}`);
  console.log(`  Unmatched:      ${UNMATCHED_FILE}`);
  console.log('\n📋 Next: start the dev server and verify the UI.');
  console.log('   NIRF-matched colleges → "✅ NIRF Verified" badge');
  console.log('   Unverified colleges   → no fee/placement shown\n');

  if (pool) await pool.end();
}

if (require.main === module) {
  seedNirf().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { seedNirf };
