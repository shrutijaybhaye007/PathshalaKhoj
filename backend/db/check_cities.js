process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_VJ4wbkOm5XGK@ep-ancient-bar-au9ix3l3-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const { pool } = require('./connection');

async function check() {
  // Check what names exist for these famous institutions
  const patterns = [
    'IIT Kharagpur',
    'IIT Roorkee',
    'IIT Guwahati',
    'IIT Hyderabad',
    'NIT Karnataka',
    'NIT Warangal',
    'NIT Rourkela',
    'NIT Calicut',
    'NIT Allahabad',
    'Delhi Tech',
    'Chandigarh',
    'SRM',
    'Lovely',
    'Amrita',
    'Thapar',
    'XLRI',
    'BITS Pilani',
    'Manipal',
    'IIM Calcutta',
    'IIM Lucknow',
    'IIM Indore',
    'NIFT',
    'XLRI',
    'AILET',
    'NALSAR',
    'Jadavpur',
  ];

  for (const pattern of patterns) {
    const r = await pool.query(
      'SELECT id, name, city, state FROM colleges WHERE name ILIKE $1 ORDER BY name LIMIT 2',
      [`%${pattern}%`]
    );
    if (r.rows.length === 0) {
      console.log(`NOT FOUND: ${pattern}`);
    } else {
      r.rows.forEach(c => console.log(`FOUND "${pattern}": "${c.name}" | city="${c.city}" | state="${c.state}"`));
    }
  }
  pool.end();
}

check().catch(console.error);
