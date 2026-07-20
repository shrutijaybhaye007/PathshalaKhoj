const { get, all, run, exec, pool } = require('./connection');

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function cleanCollegeName(rawName) {
    if (!rawName) return "Unknown College";
    let name = rawName;
    
    // 1. Remove (Id: C-...)
    name = name.replace(/\s*\(Id:.*?\)\s*/i, '');
    
    // 2. Strip leading/trailing quotes (both single and double)
    name = name.replace(/^['"\s]+|['"\s]+$/g, '');
    
    // 3. Remove +3
    name = name.replace(/^\+3\s*/i, '');
    name = name.replace(/\(\+3\)/i, '');
    
    // 4. Fix messy dots and commas. 
    // Replace dot or comma that is immediately followed by a lowercase letter with a space.
    name = name.replace(/([a-zA-Z])[\.,]([a-z])/g, '$1 $2');
    
    // 5. Remove trailing comma or address parts
    const addressPatterns = [
      /,\s*Village\b.*/i, /,\s*Dist\b.*/i, /,\s*Taluka\b.*/i, /,\s*Khasra\b.*/i,
      /,\s*Tah\b.*/i, /,\s*Tehsil\b.*/i, /,\s*Post\b.*/i, /,\s*PIN\b.*/i,
      /,\s*NH-?\d+.*/i, /,\s*Gokanya.*/i, /,\s*KARANJA.*/i,
      /,[A-Z\s]+$/ // Matches trailing uppercase text after a comma like ",SATNA"
    ];
    for (const pattern of addressPatterns) {
        name = name.replace(pattern, '');
    }

    // 6. Clean up any weird comma spaces
    name = name.trim().replace(/^,\s*/, '').replace(/,\s*$/, '');

    // 7. Title Case (capitalize first letter of each word)
    name = name.toLowerCase().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return name.trim();
}

async function refineDatabase() {
    console.log('Fetching all colleges from the database...');
    const colleges = await all('SELECT id, name, city FROM colleges');
    console.log(`Found ${colleges.length} colleges.`);

    console.log('Beginning advanced refinement and deduplication process...');
    
    let updatedCount = 0;
    let deletedCount = 0;
    try {
        const batchSize = 100;
        let updateBatch = [];
        
        for (const college of colleges) {
            const cleanedName = cleanCollegeName(college.name);
            const newSlug = slugify(`${cleanedName}-${college.city || 'unknown'}`);
            
            updateBatch.push({ id: college.id, newName: cleanedName, newSlug });
        }
        
        console.log(`Processing ${updateBatch.length} records for slug synchronization...`);
        
        for (let i = 0; i < updateBatch.length; i += batchSize) {
            const chunk = updateBatch.slice(i, i + batchSize);
            
            await Promise.all(chunk.map(async (item) => {
                try {
                    await run('UPDATE colleges SET name = ?, slug = ? WHERE id = ?', [item.newName, item.newSlug, item.id]);
                    updatedCount++;
                } catch (err) {
                    if (err.code === '23505' || err.code === 'SQLITE_CONSTRAINT_UNIQUE' || err.message.includes('UNIQUE constraint failed')) {
                        await run('DELETE FROM colleges WHERE id = ?', [item.id]);
                        deletedCount++;
                    } else {
                        console.error(`❌ Error updating college ID ${item.id}:`, err.message);
                    }
                }
            }));
            
            if (i > 0 && i % 2000 === 0) console.log(`Processed ${i}... (Deleted ${deletedCount} duplicates so far)`);
        }
        
        console.log(`✅ Refinement Complete!`);
        console.log(`- Updated: ${updatedCount} colleges`);
        console.log(`- Deleted (Duplicates): ${deletedCount} colleges`);
    } catch (err) {
        console.error('❌ Error during refinement:', err);
    }
    
    if (pool) {
      await pool.end();
    }
}

if (require.main === module) {
    refineDatabase().catch(console.error);
}

module.exports = { cleanCollegeName, slugify };
