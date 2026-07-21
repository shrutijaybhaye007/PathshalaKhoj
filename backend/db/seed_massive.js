/**
 * seed_massive.js  ⛔ DEPRECATED
 * ─────────────────────────────────────────────────────────────────────────────
 * This file has been retired and disabled.
 *
 * It previously used Math.random() to generate fake fees, placements, and
 * ratings, and sourced college names from the 'indian-colleges' npm package.
 * Those numbers were completely fabricated and have been removed.
 *
 * USE INSTEAD:
 *   node db/seed_aishe.js      ← real AISHE government data (~6-8k colleges)
 *   node db/spot_check_nirf.js ← verify NIRF CSV before enrichment
 *   node db/seed_nirf.js       ← NIRF ranking enrichment (data_verified=true)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

async function seedMassive() {
  throw new Error(
    '⛔ seed_massive.js is deprecated and disabled.\n\n' +
    'This script generated fake fees, placements, and ratings using Math.random().\n' +
    'Use the real-data seeds instead:\n' +
    '  node db/seed_aishe.js    → inserts real AISHE government data\n' +
    '  node db/seed_nirf.js     → enriches with real NIRF rankings\n'
  );
}

if (require.main === module) {
  console.error('');
  console.error('⛔  seed_massive.js is DEPRECATED and has been disabled.');
  console.error('');
  console.error('    It generated fake fees, placements, and ratings using Math.random().');
  console.error('    Use real-data seeds instead:');
  console.error('');
  console.error('      node db/seed_aishe.js      (AISHE government college directory)');
  console.error('      node db/spot_check_nirf.js  (verify NIRF CSV)');
  console.error('      node db/seed_nirf.js        (NIRF ranking enrichment)');
  console.error('');
  process.exit(1);
}

module.exports = { seedMassive };
