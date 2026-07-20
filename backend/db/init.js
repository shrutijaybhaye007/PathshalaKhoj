/**
 * Initializes the database by applying schema.sql.
 * Safe to run multiple times (all statements use IF NOT EXISTS / ON CONFLICT).
 */
const fs = require('node:fs');
const path = require('node:path');
const { exec } = require('./connection');

async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await exec(schema);
  console.log('Database schema applied.');
}

if (require.main === module) {
  initDb().catch(console.error);
}

module.exports = { initDb };
