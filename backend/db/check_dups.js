require('dotenv').config();
const { pool } = require('./connection');

pool.query("SELECT id, name, slug, city, state, data_source, data_verified FROM colleges WHERE name ILIKE '%bombay%'")
  .then(r => {
    console.table(r.rows);
    return pool.end();
  });
