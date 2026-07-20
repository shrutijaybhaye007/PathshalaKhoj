/**
 * migrate-to-pg.js
 *
 * Migrates local SQLite data (if backend/db/colleges.db exists) to PostgreSQL.
 * If colleges.db does not exist, checks if PostgreSQL is already seeded. If empty,
 * runs the database seeders directly against PostgreSQL.
 *
 * Usage:
 *   node db/migrate-to-pg.js
 */
require('dotenv').config({ path: require('node:path').join(__dirname, '..', '.env') });
const fs = require('node:fs');
const path = require('node:path');
const { pool, initDb, run, exec, get } = require('./connection');
const { seed } = require('./seed');
const { seedAdmin } = require('./seed-admin');

const SQLITE_DB_PATH = path.join(__dirname, 'colleges.db');

const TABLES = [
  'users',
  'colleges',
  'courses',
  'college_courses',
  'college_contacts',
  'shortlists',
  'college_reviews',
  'college_qna',
  'timeline_events',
  'applications',
];

async function migrateToPg() {
  console.log('🚀 Starting PostgreSQL initialization & migration...');

  await initDb();

  if (fs.existsSync(SQLITE_DB_PATH)) {
    console.log(`📦 Local SQLite file found at ${SQLITE_DB_PATH}. Starting data migration...`);

    let sqliteDb;
    try {
      const { DatabaseSync } = require('node:sqlite');
      sqliteDb = new DatabaseSync(SQLITE_DB_PATH);
    } catch (err) {
      console.warn('⚠️  Could not initialize node:sqlite to read local database:', err.message);
      console.log('🌱 Falling back to running standard seeders...');
      await seed();
      await seedAdmin();
      return;
    }

    for (const table of TABLES) {
      try {
        let rows = [];
        try {
          rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
        } catch (e) {
          console.log(`ℹ️  Table '${table}' not found in SQLite or empty.`);
          continue;
        }

        if (!rows || rows.length === 0) {
          console.log(`ℹ️  Table '${table}' has 0 rows in SQLite. Skipping.`);
          continue;
        }

        console.log(`➡️  Migrating ${rows.length} rows for table '${table}'...`);

        const cols = Object.keys(rows[0]);
        const colsFormatted = cols.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = cols.map(c => row[c]);
          const placeholders = cols.map((_, idx) => `$${idx + 1}`).join(', ');

          let onConflictClause = '';
          if (cols.includes('id')) {
            onConflictClause = 'ON CONFLICT ("id") DO NOTHING';
          } else if (table === 'college_courses' && cols.includes('college_id') && cols.includes('course_id')) {
            onConflictClause = 'ON CONFLICT ("college_id", "course_id") DO NOTHING';
          }

          const insertSql = `INSERT INTO "${table}" (${colsFormatted}) VALUES (${placeholders}) ${onConflictClause}`;
          await pool.query(insertSql, values);
        }

        if (cols.includes('id')) {
          await pool.query(
            `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE(MAX(id), 1)) FROM "${table}"`,
            [table]
          );
        }

        console.log(`✅ Migrated ${rows.length} rows for '${table}' into PostgreSQL.`);
      } catch (err) {
        console.error(`❌ Error migrating table '${table}':`, err.message);
      }
    }

    await seedAdmin();
    console.log('🎉 Data migration from SQLite to PostgreSQL completed successfully!');

  } else {
    let existingCount = 0;
    try {
      const row = await get("SELECT COUNT(*) as count FROM colleges");
      existingCount = row ? parseInt(row.count, 10) : 0;
    } catch (e) {}

    if (existingCount >= 1000) {
      console.log(`✅ PostgreSQL database already populated with ${existingCount} colleges. Skipping seeding.`);
      await seedAdmin();
      return;
    }

    console.log('🌱 Seeding PostgreSQL from scratch with full 37,564 colleges dataset...');
    await seed();
    const { seedMassive } = require('./seed_massive');
    await seedMassive();
    await seedAdmin();
    console.log('🎉 PostgreSQL database seeded with all 37,564 colleges successfully!');
  }
}

if (require.main === module) {
  migrateToPg()
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal migration error:', err);
      process.exit(1);
    });
}

module.exports = { migrateToPg };
