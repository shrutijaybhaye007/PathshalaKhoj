const path = require('path');
const { exec } = require('./connection');

console.log('Starting migration...');

async function runMigration() {
  try {
    const schemaSql = `
      DROP TABLE IF EXISTS college_courses CASCADE;
      DROP TABLE IF EXISTS courses CASCADE;

      CREATE TABLE IF NOT EXISTS courses (
          id              SERIAL PRIMARY KEY,
          name            TEXT NOT NULL,
          level           TEXT NOT NULL,
          duration_years  DOUBLE PRECISION,
          degree_type     TEXT,
          created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS college_courses (
          id              SERIAL PRIMARY KEY,
          college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
          course_id       INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          fees_per_year   INTEGER,
          seats           INTEGER,
          entrance_exam   TEXT,
          eligibility     TEXT,
          created_at      TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(college_id, course_id)
      );

      CREATE INDEX IF NOT EXISTS idx_courses_name           ON courses(name);
      CREATE INDEX IF NOT EXISTS idx_cc_college_id          ON college_courses(college_id);
      CREATE INDEX IF NOT EXISTS idx_cc_course_id           ON college_courses(course_id);
    `;
    
    await exec(schemaSql);
    console.log('Successfully created new courses and college_courses tables.');
  } catch (e) {
    console.error('Migration failed:', e);
  }
}

runMigration();
