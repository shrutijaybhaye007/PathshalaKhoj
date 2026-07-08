const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'colleges.db');
const db = new DatabaseSync(DB_PATH);

console.log('Starting migration...');

try {
  // Drop the old courses table
  db.exec('DROP TABLE IF EXISTS courses;');
  console.log('Dropped old courses table.');

  // The new schema creation
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS courses (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        name            TEXT NOT NULL,
        level           TEXT NOT NULL,
        duration_years  REAL,
        degree_type     TEXT,
        created_at      TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS college_courses (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        college_id      INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
        course_id       INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        fees_per_year   INTEGER,
        seats           INTEGER,
        entrance_exam   TEXT,
        eligibility     TEXT,
        created_at      TEXT DEFAULT (datetime('now')),
        UNIQUE(college_id, course_id)
    );

    CREATE INDEX IF NOT EXISTS idx_courses_name           ON courses(name);
    CREATE INDEX IF NOT EXISTS idx_cc_college_id          ON college_courses(college_id);
    CREATE INDEX IF NOT EXISTS idx_cc_course_id           ON college_courses(course_id);
  `;
  
  db.exec(schemaSql);
  console.log('Successfully created new courses and college_courses tables.');
} catch (e) {
  console.error('Migration failed:', e);
}
