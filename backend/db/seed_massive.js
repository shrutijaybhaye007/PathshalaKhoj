const { get, all, run, exec } = require('./connection');
const fs = require('fs');
const path = require('path');

const getRandomRating = () => parseFloat((3.5 + Math.random() * 1.4).toFixed(1));
const getRandomFees = () => Math.floor(Math.random() * 1450000) + 50000;
const getRandomPlacement = () => parseFloat((3.0 + Math.random() * 19.0).toFixed(1));
const getRandomStream = () => {
    const streams = ['Engineering', 'Medical', 'Arts', 'Commerce', 'Law', 'Management', 'Science', 'Design'];
    return streams[Math.floor(Math.random() * streams.length)];
};
const getRandomImage = (slug) => `https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80`;

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

async function seedMassive() {
    console.log('Reading massive dataset...');
    const dataPath = path.join(__dirname, '../node_modules/indian-colleges/colleges.json');
    let rawData;
    try {
        rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (e) {
        console.error('Failed to read indian-colleges dataset:', e.message);
        return;
    }

    console.log(`Loaded ${rawData.length} colleges from dataset.`);

    let defaultCourses = await all('SELECT id, name FROM courses');
    if (!defaultCourses || defaultCourses.length === 0) {
        console.log('No courses found, creating default courses...');
        await run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('B.Tech Computer Science', 'UG', 4.0, 'B.Tech')");
        await run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('MBA Finance', 'PG', 2.0, 'MBA')");
        await run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('MBBS', 'UG', 5.5, 'MBBS')");
        await run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('BA English', 'UG', 3.0, 'BA')");
        defaultCourses = await all('SELECT id, name FROM courses');
    }

    console.log('Beginning deadlock-free massive seeding process...');

    let insertedCount = 0;
    let skippedCount = 0;

    try {
        const existingSlugsList = await all('SELECT slug FROM colleges');
        const existingSlugs = new Set((existingSlugsList || []).map(c => c.slug));

        await exec('BEGIN;');

        for (const item of rawData) {
            let rawName = item.college || "Unknown College";
            rawName = rawName.replace(/\s*\(Id:.*?\)\s*/i, '').trim();

            const city = item.district || "Unknown City";
            const state = item.state || "Unknown State";
            const collegeType = item.college_type || "Private";
            const affiliation = item.university || "";
            const stream = getRandomStream();
            
            const description = `This is a prestigious institution affiliated with ${affiliation || "a recognized university"}, located in ${city}, ${state}. It offers excellent programs in ${stream}.`;

            let slug = slugify(`${rawName}-${city}`);
            if (!slug) continue;

            if (existingSlugs.has(slug)) {
                skippedCount++;
                continue;
            }

            existingSlugs.add(slug);
            const fees = getRandomFees();
            const numCourses = Math.floor(Math.random() * 3) + 1;

            try {
                const result = await run(`
                    INSERT INTO colleges (
                        name, slug, city, state, stream, college_type,
                        description, avg_fees_per_year, avg_placement_package,
                        student_rating, logo_url, total_courses, affiliation
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    rawName, slug, city, state, stream, collegeType,
                    description, fees, getRandomPlacement(),
                    getRandomRating(), getRandomImage(slug), numCourses, affiliation
                ]);

                const collegeId = result.lastInsertRowid;

                if (collegeId && defaultCourses.length > 0) {
                    const selectedCourses = defaultCourses.slice(0, numCourses);
                    for (const course of selectedCourses) {
                        await run(`
                            INSERT INTO college_courses (college_id, course_id, fees_per_year)
                            VALUES (?, ?, ?)
                            ON CONFLICT (college_id, course_id) DO NOTHING
                        `, [collegeId, course.id, fees]);
                    }
                }

                insertedCount++;
            } catch (e) {
                skippedCount++;
            }
        }
        
        await exec('COMMIT;');
        
        console.log(`\n✅ Massive Seeding Complete!`);
        console.log(`Successfully inserted: ${insertedCount}`);
        console.log(`Skipped (duplicates/errors): ${skippedCount}`);
        
        const totalRow = await get('SELECT count(*) as c FROM colleges');
        console.log(`Total Colleges in Database: ${totalRow ? totalRow.c : 0}`);
    } catch (e) {
        try { await exec('ROLLBACK;'); } catch (_) {}
        console.error('Transaction error during massive seed:', e.message);
    }
}

if (require.main === module) {
    seedMassive().catch(console.error);
}

module.exports = { seedMassive };
