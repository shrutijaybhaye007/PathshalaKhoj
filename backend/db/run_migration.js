/**
 * run_migration.js — one-time migration script
 * Adds data_verified and data_source columns to the colleges table on Neon.
 * Safe to run multiple times (idempotent).
 */
'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('./connection');

async function runMigration() {
  console.log('🔄 Checking and applying migration: data_verified + data_source...\n');

  // Check existing columns
  const r1 = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='colleges' AND column_name='data_verified'"
  );
  const r2 = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='colleges' AND column_name='data_source'"
  );

  console.log('  data_verified column exists:', r1.rows.length > 0);
  console.log('  data_source column exists:  ', r2.rows.length > 0);

  if (r1.rows.length === 0) {
    await pool.query('ALTER TABLE colleges ADD COLUMN IF NOT EXISTS data_verified BOOLEAN DEFAULT false');
    console.log('  ✅ Added data_verified column (default false)');
  } else {
    console.log('  ⏭  data_verified already exists, skipping');
  }

  if (r2.rows.length === 0) {
    await pool.query("ALTER TABLE colleges ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'legacy'");
    await pool.query("UPDATE colleges SET data_source = 'legacy' WHERE data_source IS NULL OR data_source = 'legacy'");
    console.log("  ✅ Added data_source column + backfilled all existing rows to 'legacy'");
  } else {
    console.log('  ⏭  data_source already exists, skipping');
    // Still backfill any NULLs that might exist
    const r = await pool.query("UPDATE colleges SET data_source = 'legacy' WHERE data_source IS NULL");
    if (r.rowCount > 0) console.log(`  ✅ Backfilled ${r.rowCount} NULL data_source rows to 'legacy'`);
  }

  // Record in schema_migrations
  await pool.query(
    "INSERT INTO schema_migrations (name) VALUES ('add_data_verified_and_source_columns') ON CONFLICT (name) DO NOTHING"
  );
  console.log("  ✅ Migration recorded in schema_migrations table");

  // Summary stats
  const total   = await pool.query('SELECT count(*) as c FROM colleges');
  const legacy  = await pool.query("SELECT count(*) as c FROM colleges WHERE data_source = 'legacy'");
  const verified= await pool.query('SELECT count(*) as c FROM colleges WHERE data_verified = true');

  console.log('\n📊 Database summary after migration:');
  console.log(`  Total colleges:           ${total.rows[0].c}`);
  console.log(`  data_source = 'legacy':   ${legacy.rows[0].c}`);
  console.log(`  data_verified = true:     ${verified.rows[0].c}`);

  await pool.end();
  console.log('\n✅ Migration complete!\n');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
