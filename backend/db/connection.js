/**
 * Database Connection Module for PathshalaKhoj.
 *
 * Supports PostgreSQL (when `DATABASE_URL` is provided) and gracefully falls
 * back to SQLite (`colleges.db`) for local offline development.
 *
 * Exports `get`, `all`, `run`, `exec`, `pool`, `initDb` async functions, preserving
 * identical function signatures across all routes.
 */
const path = require('node:path');
const fs   = require('node:fs');
const { Pool, types } = require('pg');

types.setTypeParser(20, (val) => parseInt(val, 10));
types.setTypeParser(1700, (val) => parseFloat(val));

let rawUrl = process.env.DATABASE_URL || '';

let isPg = false;
let pool = null;
let sqliteDb = null;

if (rawUrl && (rawUrl.startsWith('postgres://') || rawUrl.startsWith('postgresql://'))) {
  isPg = true;

  // Sanitize typos in connection string if user accidentally omitted '?' before params
  let cleanUrl = rawUrl;
  if (!cleanUrl.includes('?') && (cleanUrl.includes('sslmode=') || cleanUrl.includes('channel_binding='))) {
    cleanUrl = cleanUrl.replace(/(sslmode=|channel_binding=)/, '?$1');
  }

  // Parse using standard URL object to reliably extract database name & credentials
  try {
    const u = new URL(cleanUrl);
    const dbName = u.pathname ? u.pathname.replace(/^\//, '').split('?')[0] : 'neondb';
    const isLocal = u.hostname === 'localhost' || u.hostname === '127.0.0.1';

    pool = new Pool({
      host: u.hostname,
      port: u.port ? parseInt(u.port, 10) : 5432,
      user: decodeURIComponent(u.username || 'postgres'),
      password: decodeURIComponent(u.password || ''),
      database: dbName,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });
  } catch (err) {
    pool = new Pool({
      connectionString: cleanUrl,
      ssl: (!cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1'))
        ? { rejectUnauthorized: false }
        : false,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });
  }
} else {
  initSqlite();
}

function initSqlite() {
  if (sqliteDb) return;
  isPg = false;
  const dbPath = path.join(__dirname, 'colleges.db');
  const { DatabaseSync } = require('node:sqlite');
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
}

function isConnRefused(err) {
  if (!err) return false;
  if (err.code === 'ECONNREFUSED' || (err.message && err.message.includes('ECONNREFUSED'))) return true;
  if (err.errors && Array.isArray(err.errors)) {
    return err.errors.some(e => e.code === 'ECONNREFUSED' || (e.message && e.message.includes('ECONNREFUSED')));
  }
  return false;
}

function convertPlaceholders(sql) {
  if (!sql || typeof sql !== 'string') return sql;
  let index = 1;
  return sql.replace(/\?/g, () => `$${index++}`);
}

function adaptSqlAndParamsForSqlite(sql, params = []) {
  if (!sql || typeof sql !== 'string') return { sql, params };
  let adaptedSql = sql;
  let adaptedParams = Array.isArray(params) ? [...params] : [params];

  // Remove ts_rank ordering parameter if present in searchParams
  if (/ORDER BY ts_rank\(c\.search_vector,\s*plainto_tsquery\('english',\s*\?\)\)\s*DESC/gi.test(adaptedSql)) {
    adaptedSql = adaptedSql.replace(/ORDER BY ts_rank\(c\.search_vector,\s*plainto_tsquery\('english',\s*\?\)\)\s*DESC/gi, 'ORDER BY c.name ASC');
    if (adaptedParams.length >= 3) {
      adaptedParams.splice(adaptedParams.length - 3, 1);
    }
  }

  // Replace search_vector clause preserving parameter count (3 params in, 3 params out)
  adaptedSql = adaptedSql.replace(
    /\(c\.search_vector\s*@@\s*plainto_tsquery\('english',\s*\?\)\s*OR\s*c\.name\s+ILIKE\s+\?\s*OR\s*c\.city\s+ILIKE\s+\?\)/gi,
    "(c.name LIKE ? OR c.city LIKE ? OR c.description LIKE ?)"
  );
  adaptedSql = adaptedSql.replace(/c\.search_vector\s*@@\s*plainto_tsquery\('english',\s*\?\)/gi, "(c.name LIKE ? OR c.description LIKE ?)");

  adaptedSql = adaptedSql.replace(/NOW\(\)\s*-\s*INTERVAL\s*'1 day'/gi, "datetime('now', '-1 day')");
  adaptedSql = adaptedSql.replace(/NOW\(\)/gi, "datetime('now')");
  adaptedSql = adaptedSql.replace(/\bILIKE\b/gi, 'LIKE');

  return { sql: adaptedSql, params: adaptedParams };
}

function normalizeParams(params) {
  if (Array.isArray(params)) return params;
  if (params && typeof params === 'object') return [params];
  return [];
}

async function get(sql, params = []) {
  const normalized = normalizeParams(params);
  if (isPg) {
    try {
      const pgSql = convertPlaceholders(sql);
      const res = await pool.query(pgSql, normalized);
      return res.rows[0];
    } catch (err) {
      if (isConnRefused(err)) {
        console.warn('⚠️  PostgreSQL offline on localhost. Using local SQLite database (colleges.db)...');
        initSqlite();
        return get(sql, params);
      }
      throw err;
    }
  } else {
    initSqlite();
    const { sql: sqliteSql, params: sqliteParams } = adaptSqlAndParamsForSqlite(sql, normalized);
    try {
      const row = sqliteDb.prepare(sqliteSql).get(...sqliteParams);
      return row || undefined;
    } catch (e) {
      console.error('SQLite get error:', e.message, 'Query:', sqliteSql);
      return undefined;
    }
  }
}

async function all(sql, params = []) {
  const normalized = normalizeParams(params);
  if (isPg) {
    try {
      const pgSql = convertPlaceholders(sql);
      const res = await pool.query(pgSql, normalized);
      return res.rows;
    } catch (err) {
      if (isConnRefused(err)) {
        console.warn('⚠️  PostgreSQL offline on localhost. Using local SQLite database (colleges.db)...');
        initSqlite();
        return all(sql, params);
      }
      throw err;
    }
  } else {
    initSqlite();
    const { sql: sqliteSql, params: sqliteParams } = adaptSqlAndParamsForSqlite(sql, normalized);
    try {
      return sqliteDb.prepare(sqliteSql).all(...sqliteParams);
    } catch (e) {
      console.error('SQLite all error:', e.message, 'Query:', sqliteSql);
      return [];
    }
  }
}

async function run(sql, params = []) {
  const normalized = normalizeParams(params);
  if (isPg) {
    try {
      let pgSql = convertPlaceholders(sql);
      const trimmed = pgSql.trim();
      const isInsert = /^INSERT\s+/i.test(trimmed);
      if (isInsert && !/\bRETURNING\b/i.test(trimmed)) {
        pgSql += ' RETURNING id';
      }

      const res = await pool.query(pgSql, normalized);
      const lastInsertRowid = (res.rows && res.rows[0] && res.rows[0].id !== undefined) ? res.rows[0].id : null;
      return {
        lastInsertRowid,
        changes: res.rowCount || 0
      };
    } catch (err) {
      if (isConnRefused(err)) {
        console.warn('⚠️  PostgreSQL offline on localhost. Using local SQLite database (colleges.db)...');
        initSqlite();
        return run(sql, params);
      }
      throw err;
    }
  } else {
    initSqlite();
    const { sql: sqliteSql, params: sqliteParams } = adaptSqlAndParamsForSqlite(sql, normalized);
    try {
      const info = sqliteDb.prepare(sqliteSql).run(...sqliteParams);
      return {
        lastInsertRowid: info.lastInsertRowid,
        changes: info.changes
      };
    } catch (e) {
      console.error('SQLite run error:', e.message, 'Query:', sqliteSql);
      return { lastInsertRowid: null, changes: 0 };
    }
  }
}

async function exec(sql) {
  if (isPg) {
    try {
      return await pool.query(sql);
    } catch (err) {
      if (isConnRefused(err)) {
        console.warn('⚠️  PostgreSQL offline on localhost. Using local SQLite database (colleges.db)...');
        initSqlite();
        return exec(sql);
      }
      throw err;
    }
  } else {
    initSqlite();
    return sqliteDb.exec(sql);
  }
}

async function initDb() {
  if (isPg) {
    try {
      const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await pool.query(schemaSql);
    } catch (err) {
      if (isConnRefused(err)) {
        initSqlite();
      }
    }
  }
}

module.exports = { pool, get, all, run, exec, initDb, convertPlaceholders };
