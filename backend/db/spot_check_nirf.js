/**
 * spot_check_nirf.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Picks 10 random rows from backend/db/data/nirf_rankings.csv and prints
 * them to the console so you can manually verify the data against
 * https://www.nirfindia.org/2024/ before running the full seed_nirf.js.
 *
 * This guards against stale-year Kaggle uploads or transcription errors.
 *
 * Usage:  node db/spot_check_nirf.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const path = require('path');
const fs   = require('fs');

const NIRF_FILE = path.join(__dirname, 'data', 'nirf_rankings.csv');

// Simple CSV parser for spot-check (no external deps needed)
function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  // Parse header
  const headers = splitCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const vals = splitCSVLine(lines[i]);
    if (vals.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h.trim()] = (vals[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
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

function pickRandom(arr, n) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * (copy.length - i));
    result.push(copy[idx]);
    copy[idx] = copy[copy.length - i - 1];
  }
  return result;
}

function detectCols(headers) {
  const h = headers.map(x => x.toLowerCase().trim());
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
    score:    find('score'),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n🔍 PathshalaKhoj — NIRF Data Spot-Check');
  console.log('═'.repeat(60));

  if (!fs.existsSync(NIRF_FILE)) {
    console.error(`\n❌ NIRF CSV not found at: ${NIRF_FILE}`);
    console.error('\nDownload options:');
    console.error('  Kaggle: search "NIRF Rankings 2024 combined"');
    console.error('  Manual: copy from https://www.nirfindia.org/2024/');
    console.error('\nSave as: backend/db/data/nirf_rankings.csv\n');
    process.exit(1);
  }

  const content = fs.readFileSync(NIRF_FILE, 'utf8');
  const rows    = parseCSV(content);

  if (rows.length === 0) {
    console.error('❌ No data rows found in CSV. Check the file format.');
    process.exit(1);
  }

  const headers = Object.keys(rows[0]);
  const cols    = detectCols(headers);

  console.log(`\n📂 File: ${NIRF_FILE}`);
  console.log(`   Total rows: ${rows.length}`);
  console.log(`\n📋 Detected columns:`);
  for (const [k, v] of Object.entries(cols)) {
    console.log(`   ${k.padEnd(10)} → "${v || '(not found)'}"`);
  }

  console.log(`\n📊 Headers in file:`);
  console.log(`   ${headers.join(', ')}`);

  const sample = pickRandom(rows, 10);

  console.log('\n' + '─'.repeat(60));
  console.log('🎲 10 RANDOM ROWS — Verify these against nirfindia.org/2024/');
  console.log('─'.repeat(60));

  sample.forEach((row, i) => {
    const rank     = cols.rank     ? row[cols.rank]     : '?';
    const name     = cols.name     ? row[cols.name]     : JSON.stringify(row);
    const city     = cols.city     ? row[cols.city]     : '?';
    const state    = cols.state    ? row[cols.state]    : '?';
    const category = cols.category ? row[cols.category] : '?';
    const score    = cols.score    ? row[cols.score]    : '?';

    console.log(`\n${i + 1}. Rank: ${rank}  |  Category: ${category}`);
    console.log(`   Name:  ${name}`);
    console.log(`   City:  ${city}, ${state}`);
    if (score) console.log(`   Score: ${score}`);
  });

  console.log('\n' + '─'.repeat(60));
  console.log('⚠️  NEXT STEP: Manually verify these rows at:');
  console.log('   https://www.nirfindia.org/2024/EngineeringRanking.html');
  console.log('   https://www.nirfindia.org/2024/ManagementRanking.html');
  console.log('   https://www.nirfindia.org/2024/UniversityRanking.html');
  console.log('   (check rank numbers and institute names match)');
  console.log('\n✅ If the data looks correct, run:  node db/seed_nirf.js');
  console.log('❌ If ranks are wrong (stale year), get the correct dataset first.\n');
}

main();
