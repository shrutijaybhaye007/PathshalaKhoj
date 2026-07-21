process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_VJ4wbkOm5XGK@ep-ancient-bar-au9ix3l3-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const { pool } = require('./connection');

async function go() {
  const r1 = await pool.query('SELECT COUNT(*) as total FROM colleges');
  console.log('Total colleges:', r1.rows[0].total);

  const r2 = await pool.query("SELECT COUNT(*) as total FROM colleges WHERE avg_fees_per_year IS NOT NULL");
  console.log('With fees:', r2.rows[0].total);

  const r3 = await pool.query("SELECT COUNT(*) as total FROM colleges WHERE description IS NOT NULL AND LENGTH(description) > 100");
  console.log('With descriptions:', r3.rows[0].total);

  const r4 = await pool.query('SELECT COUNT(*) as total FROM colleges WHERE nirf_ranking IS NOT NULL');
  console.log('With NIRF ranking:', r4.rows[0].total);

  const r5 = await pool.query('SELECT COUNT(*) as total FROM colleges WHERE website IS NOT NULL');
  console.log('With website:', r5.rows[0].total);

  const r6 = await pool.query('SELECT stream, COUNT(*) as cnt FROM colleges GROUP BY stream ORDER BY cnt DESC LIMIT 10');
  console.log('\nBy stream:');
  r6.rows.forEach(r => console.log(' ', r.stream, ':', r.cnt));

  const r7 = await pool.query('SELECT state, COUNT(*) as cnt FROM colleges GROUP BY state ORDER BY cnt DESC LIMIT 10');
  console.log('\nBy state:');
  r7.rows.forEach(r => console.log(' ', r.state, ':', r.cnt));

  const sample = await pool.query('SELECT name, city, state, naac_grade, avg_fees_per_year, nirf_ranking, description FROM colleges WHERE nirf_ranking IS NOT NULL ORDER BY nirf_ranking ASC LIMIT 10');
  console.log('\nTop NIRF ranked colleges:');
  sample.rows.forEach(c => console.log(' #'+c.nirf_ranking, c.name, '|', c.city, '|', c.naac_grade, '| fees:', c.avg_fees_per_year, '| desc length:', c.description ? c.description.length : 0));

  pool.end();
}
go().catch(e => { console.error('Error:', e.message); process.exit(1); });
