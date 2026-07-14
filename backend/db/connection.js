/**
 * Database connection module.
 *
 * Uses Node.js's built-in `node:sqlite` module (stable as of Node 22.5+,
 * no native compilation / no separate DB server required) so this project
 * runs anywhere with zero setup.
 *
 * IMPORTANT FOR PRODUCTION / OTHER SQL ENGINES:
 * Every query in this app goes through the helpers exported here
 * (get, all, run, exec). If you want to swap to MySQL or PostgreSQL,
 * you only need to rewrite THIS file (e.g. using `mysql2` or `pg`) and
 * keep the same function names/signatures — routes/db code do not change.
 */

const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'colleges.db');

const db = new DatabaseSync(DB_PATH);

// Sensible defaults for a small SQL app
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

try {
  db.exec('ALTER TABLE colleges ADD COLUMN logo_url TEXT;');
} catch (e) {
  // Column already exists
}

// Create indexes for performance
try {
  db.exec('CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_colleges_city ON colleges(city);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_colleges_stream ON colleges(stream);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);');
  db.exec('CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);');

  // FTS5 Virtual Table for Intelligent Search
  db.exec(`CREATE VIRTUAL TABLE IF NOT EXISTS colleges_fts USING fts5(id UNINDEXED, name, city, state, description);`);

  // Triggers to keep FTS synchronized
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS colleges_ai AFTER INSERT ON colleges BEGIN
      INSERT INTO colleges_fts(id, name, city, state, description) 
      VALUES (new.id, new.name, new.city, new.state, new.description);
    END;
    CREATE TRIGGER IF NOT EXISTS colleges_ad AFTER DELETE ON colleges BEGIN
      DELETE FROM colleges_fts WHERE id = old.id;
    END;
    CREATE TRIGGER IF NOT EXISTS colleges_au AFTER UPDATE ON colleges BEGIN
      DELETE FROM colleges_fts WHERE id = old.id;
      INSERT INTO colleges_fts(id, name, city, state, description) 
      VALUES (new.id, new.name, new.city, new.state, new.description);
    END;
  `);

  // ── total_courses auto-sync triggers ────────────────────────────────────
  // These keep colleges.total_courses in sync whenever college_courses rows
  // are inserted or deleted — no manual sync needed after admin edits.
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS cc_ai_sync AFTER INSERT ON college_courses BEGIN
      UPDATE colleges
      SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = NEW.college_id)
      WHERE id = NEW.college_id;
    END;
    CREATE TRIGGER IF NOT EXISTS cc_ad_sync AFTER DELETE ON college_courses BEGIN
      UPDATE colleges
      SET total_courses = (SELECT COUNT(*) FROM college_courses WHERE college_id = OLD.college_id)
      WHERE id = OLD.college_id;
    END;
  `);
} catch (e) {
  console.error('Index/FTS/trigger creation failed:', e);
}

// ── Schema Migrations ──────────────────────────────────────────────────────
// Tracks which DB migrations have been applied. Each migration runs exactly
// once. To add a new column or index, add a new entry below.
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL UNIQUE,
      applied_at TEXT DEFAULT (datetime('now'))
    );
  `);

  const migrations = [
    {
      name: 'M001_idx_nirf_ranking',
      sql:  'CREATE INDEX IF NOT EXISTS idx_colleges_nirf ON colleges(nirf_ranking);',
    },
    {
      name: 'M002_idx_fees_placement',
      sql: `CREATE INDEX IF NOT EXISTS idx_colleges_fees ON colleges(avg_fees_per_year);
            CREATE INDEX IF NOT EXISTS idx_colleges_placement ON colleges(avg_placement_package);`,
    },
    {
      name: 'M003_idx_college_courses_composite',
      sql: 'CREATE INDEX IF NOT EXISTS idx_cc_composite ON college_courses(college_id, course_id);',
    },
    {
      name: 'M004_idx_users_email',
      sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
    },
    {
      name: 'M005_idx_shortlists_composite',
      sql: 'CREATE INDEX IF NOT EXISTS idx_shortlists_composite ON shortlists(session_id, college_id);',
    },
  ];

  for (const { name, sql } of migrations) {
    const already = db.prepare('SELECT id FROM schema_migrations WHERE name = ?').get(name);
    if (!already) {
      try {
        db.exec(sql);
        db.prepare('INSERT INTO schema_migrations (name) VALUES (?)').run(name);
      } catch (e) {
        console.warn(`Migration ${name} skipped:`, e.message);
      }
    }
  }

} catch (e) {
  console.warn('Migrations system error:', e.message);
}

/**
 * Run a SELECT that returns a single row (or undefined).
 * @param {string} sql
 * @param {Array|Object} params
 */
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...normalizeParams(params));
}

/**
 * Run a SELECT that returns all matching rows.
 * @param {string} sql
 * @param {Array|Object} params
 */
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...normalizeParams(params));
}

/**
 * Run an INSERT / UPDATE / DELETE.
 * Returns { lastInsertRowid, changes }.
 * @param {string} sql
 * @param {Array|Object} params
 */
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.run(...normalizeParams(params));
}

/**
 * Execute raw SQL with no parameters (DDL, multi-statement scripts).
 * @param {string} sql
 */
function exec(sql) {
  return db.exec(sql);
}

function normalizeParams(params) {
  if (Array.isArray(params)) return params;
  if (params && typeof params === 'object') return [params];
  return [];
}

module.exports = { db, get, all, run, exec, DB_PATH };
