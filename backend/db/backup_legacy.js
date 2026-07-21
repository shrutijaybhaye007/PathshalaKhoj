/**
 * backup_legacy.js  (lightweight version)
 * Instead of downloading all 38k rows (slow over Neon pooler),
 * this does what actually matters:
 *  1. Counts all legacy rows
 *  2. Finds hand-curated colleges (those with real website/phone/description)
 *  3. Saves those candidates to a review file
 *  4. Saves just ID + name + slug as a lightweight index for restore reference
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs   = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function backup() {
  console.log('📦 Backing up legacy college info from Neon...\n');

  // 1. Stats
  const stats = await pool.query(`
    SELECT
      count(*) as total,
      count(*) FILTER (WHERE data_source='legacy') as legacy,
      count(*) FILTER (WHERE data_source='manual') as manual,
      count(*) FILTER (WHERE data_verified=true) as verified
    FROM colleges
  `);
  const s = stats.rows[0];
  console.log('📊 Current DB state:');
  console.log(`   Total colleges:         ${s.total}`);
  console.log(`   data_source = legacy:   ${s.legacy}`);
  console.log(`   data_source = manual:   ${s.manual}`);
  console.log(`   data_verified = true:   ${s.verified}`);

  // 2. Lightweight ID+name index (fast — no large TEXT columns)
  console.log('\n⬇️  Fetching lightweight ID+name+slug index...');
  const index = await pool.query(
    'SELECT id, name, slug, city, state, college_type, stream FROM colleges ORDER BY id'
  );
  const indexPath = path.join(__dirname, 'data', 'legacy_id_index.json');
  fs.writeFileSync(indexPath, JSON.stringify(index.rows, null, 2), 'utf8');
  const sizeMB = (fs.statSync(indexPath).size / 1048576).toFixed(2);
  console.log(`   ✅ Index saved: ${indexPath} (${index.rows.length} rows, ${sizeMB} MB)`);

  // 3. Hand-curated candidates (colleges with real data you may have added)
  console.log('\n🔍 Finding hand-curated college candidates...');
  const handCurated = await pool.query(`
    SELECT id, name, city, state, website, contact_phone,
           LENGTH(COALESCE(description,'')) as desc_len,
           created_at
    FROM colleges
    WHERE data_source = 'legacy'
      AND (
        (website IS NOT NULL AND website != '' AND website NOT LIKE '%unsplash%')
        OR contact_phone IS NOT NULL
        OR LENGTH(COALESCE(description,'')) > 350
      )
    ORDER BY created_at DESC
    LIMIT 60
  `);

  console.log(`\n   Found ${handCurated.rows.length} candidate(s) with real data:\n`);

  const lines = [
    `Legacy College Review — Generated ${new Date().toISOString()}\n`,
    `Total colleges in DB:  ${s.total}\n`,
    `Legacy rows:           ${s.legacy}\n`,
    `Candidates with real data (website/phone/rich description): ${handCurated.rows.length}\n\n`,
  ];

  if (handCurated.rows.length === 0) {
    console.log('   ✅ None found — all legacy rows appear to be auto-seeded (safe to delete all).');
    lines.push('No hand-curated candidates found.\nAll legacy rows appear to be auto-seeded data — safe to delete.\n');
  } else {
    lines.push('To PROTECT any of these before the delete, run in Neon SQL console:\n');
    lines.push('  UPDATE colleges SET data_source = \'manual\' WHERE id IN (...);\n\n');
    lines.push('--- Candidates ---\n\n');

    handCurated.rows.forEach((r, i) => {
      const line = `${i+1}. ID=${r.id} | ${r.name}\n   Location: ${r.city}, ${r.state}\n   website: ${r.website||'none'} | phone: ${r.contact_phone||'none'} | desc: ${r.desc_len} chars\n   added: ${r.created_at}\n\n`;
      process.stdout.write('   ' + line.split('\n')[0] + '\n');
      lines.push(line);
    });
  }

  const reviewPath = path.join(__dirname, 'data', 'legacy_review.txt');
  fs.writeFileSync(reviewPath, lines.join(''), 'utf8');
  console.log(`\n📋 Review file: ${reviewPath}`);

  await pool.end();

  console.log('\n' + '═'.repeat(55));
  console.log('✅ Backup complete!');
  console.log('─'.repeat(55));
  console.log(`  ID index:    ${indexPath}`);
  console.log(`  Review file: ${reviewPath}`);
  console.log('─'.repeat(55));
  if (handCurated.rows.length === 0) {
    console.log('\n✅ All legacy rows are auto-seeded. Safe to delete.');
    console.log('   Next: run the delete, then seed_aishe.js\n');
  } else {
    console.log('\n⚠️  Review legacy_review.txt and protect any colleges you added.');
    console.log('   Run: UPDATE colleges SET data_source = \'manual\' WHERE id IN (...);');
    console.log('   Then delete: DELETE FROM colleges WHERE data_source = \'legacy\';\n');
  }
}

backup().catch(e => { console.error('❌', e.message); process.exit(1); });
