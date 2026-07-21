require('dotenv').config();
const { pool } = require('./connection');
async function run() {
  await pool.query("INSERT INTO colleges (name, slug, city, state, data_source, data_verified, stream, college_type) VALUES ('Generic Government College', 'generic-govt-college', 'Pune', 'Maharashtra', 'aishe', false, 'Science', 'Government College'), ('Small Regional Institute', 'small-regional', 'Nagpur', 'Maharashtra', 'aishe', false, 'Arts', 'Private College') ON CONFLICT DO NOTHING");
  await pool.end();
}
run();
