const { get, all, run, exec, pool } = require('./connection');

function cleanCollegeName(rawName) {
    if (!rawName) return "Unknown College";
    let name = rawName;
    
    // 1. Remove (Id: C-...)
    name = name.replace(/\s*\(Id:.*?\)\s*/i, '');
    
    // 2. Strip leading/trailing quotes (both single and double)
    name = name.replace(/^['"\s]+|['"\s]+$/g, '');
    
    // 3. Remove trailing comma or address parts
    const addressPatterns = [
      /,\s*Village\b.*/i,
      /,\s*Dist\b.*/i,
      /,\s*Taluka\b.*/i,
      /,\s*Khasra\b.*/i,
      /,\s*Tah\b.*/i,
      /,\s*Tehsil\b.*/i,
      /,\s*Post\b.*/i,
      /,\s*PIN\b.*/i,
      /,\s*NH-?\d+.*/i,
      /,\s*Gokanya.*/i, // Catch the specific indore one
      /,\s*KARANJA.*/i
    ];
    for (const pattern of addressPatterns) {
        name = name.replace(pattern, '');
    }

    // 4. Clean up any weird comma spaces
    name = name.trim().replace(/^,\s*/, '').replace(/,\s*$/, '');

    // 5. Title Case (capitalize first letter of each word)
    name = name.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return name.trim();
}

async function refineDatabase() {
    console.log('Fetching all colleges from the database...');
    const colleges = await all('SELECT id, name FROM colleges');
    console.log(`Found ${colleges.length} colleges.`);

    console.log('Beginning refinement process...');
    await exec('BEGIN;');
    
    let updatedCount = 0;
    try {
        const batchSize = 500;
        let updateBatch = [];
        
        for (const college of colleges) {
            const cleanedName = cleanCollegeName(college.name);
            if (cleanedName !== college.name) {
                // Name needs update
                updateBatch.push({ id: college.id, newName: cleanedName });
            }
        }
        
        console.log(`${updateBatch.length} colleges need their names refined.`);
        
        for (const item of updateBatch) {
            await run('UPDATE colleges SET name = ? WHERE id = ?', [item.newName, item.id]);
            updatedCount++;
            if (updatedCount % 5000 === 0) console.log(`Updated ${updatedCount}...`);
        }
        
        await exec('COMMIT;');
        console.log(`✅ Successfully refined ${updatedCount} colleges in the database!`);
    } catch (err) {
        await exec('ROLLBACK;');
        console.error('❌ Error during refinement:', err);
    }
    
    if (pool) {
      await pool.end();
    }
}

if (require.main === module) {
    refineDatabase().catch(console.error);
}

module.exports = { cleanCollegeName };
