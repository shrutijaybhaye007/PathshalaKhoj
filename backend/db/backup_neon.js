/**
 * Streamlined Chunked Database Backup for Neon PostgreSQL
 */
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_VJ4wbkOm5XGK@ep-ancient-bar-au9ix3l3-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
const { pool } = require('./connection');
const fs = require('fs');
const path = require('path');

async function backupDatabase() {
  console.log('📦 Starting database backup...\n');
  const startTime = Date.now();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const sqlPath  = path.join(backupDir, `neon_backup_${timestamp}.sql`);
  const jsonPath = path.join(backupDir, `neon_backup_${timestamp}.json`);

  const sqlStream  = fs.createWriteStream(sqlPath,  { encoding: 'utf8' });
  const jsonStream = fs.createWriteStream(jsonPath, { encoding: 'utf8' });

  sqlStream.write(`-- PathshalaKhoj Full Neon Database Backup\n-- Generated: ${new Date().toISOString()}\n\n`);
  jsonStream.write('{\n');

  try {
    const tablesList = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    const tables = tablesList.rows.map(r => r.table_name);
    console.log(`Tables (${tables.length}):`, tables.join(', '));

    for (let tIdx = 0; tIdx < tables.length; tIdx++) {
      const table = tables[tIdx];
      const countRes = await pool.query(`SELECT COUNT(*) as count FROM "${table}"`);
      const totalRows = parseInt(countRes.rows[0].count, 10);
      console.log(`  Table '${table}': ${totalRows} rows`);

      jsonStream.write(`  "${table}": [\n`);
      sqlStream.write(`\n-- Table: ${table} (${totalRows} rows)\n`);

      if (totalRows > 0) {
        const colRes = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = $1 ORDER BY ordinal_position
        `, [table]);
        const columns = colRes.rows.map(c => c.column_name);
        const colListStr = columns.map(c => `"${c}"`).join(', ');

        const CHUNK_SIZE = 5000;
        let isFirstJsonRow = true;

        for (let offset = 0; offset < totalRows; offset += CHUNK_SIZE) {
          const chunkRes = await pool.query(
            `SELECT * FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2`,
            [CHUNK_SIZE, offset]
          );

          // Write SQL
          const INSERT_BATCH = 250;
          for (let i = 0; i < chunkRes.rows.length; i += INSERT_BATCH) {
            const batch = chunkRes.rows.slice(i, i + INSERT_BATCH);
            const valueTuples = batch.map(row => {
              const vals = columns.map(col => {
                const val = row[col];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number' || typeof val === 'boolean') return val;
                if (val instanceof Date) return `'${val.toISOString()}'`;
                if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
                return `'${String(val).replace(/'/g, "''")}'`;
              });
              return `(${vals.join(', ')})`;
            });
            sqlStream.write(`INSERT INTO "${table}" (${colListStr}) VALUES\n${valueTuples.join(',\n')}\nON CONFLICT DO NOTHING;\n\n`);
          }

          // Write JSON stream
          for (let r = 0; r < chunkRes.rows.length; r++) {
            const rowStr = JSON.stringify(chunkRes.rows[r]);
            if (!isFirstJsonRow) jsonStream.write(',\n');
            jsonStream.write('    ' + rowStr);
            isFirstJsonRow = false;
          }

          console.log(`    Exported ${Math.min(offset + CHUNK_SIZE, totalRows)} / ${totalRows} rows...`);
        }
      }

      jsonStream.write(`\n  ]${tIdx < tables.length - 1 ? ',' : ''}\n`);
    }

    jsonStream.write('}\n');
    sqlStream.end();
    jsonStream.end();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const sqlSize  = (fs.statSync(sqlPath).size / (1024 * 1024)).toFixed(2);
    const jsonSize = (fs.statSync(jsonPath).size / (1024 * 1024)).toFixed(2);

    console.log(`\n🎉 Backup finished in ${duration}s!`);
    console.log(`📁 SQL Backup:  ${sqlPath} (${sqlSize} MB)`);
    console.log(`📁 JSON Backup: ${jsonPath} (${jsonSize} MB)`);

  } catch (err) {
    console.error('❌ Backup error:', err.message);
  } finally {
    pool.end();
  }
}

backupDatabase();
