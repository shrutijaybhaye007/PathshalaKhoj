const { get, all, run, exec } = require('./connection');
const fs = require('fs');
const path = require('path');
const { cleanCollegeName } = require('./refine_db');

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

        const collegesToInsert = [];
        for (const item of rawData) {
            let rawName = cleanCollegeName(item.college || "Unknown College");

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
            
            collegesToInsert.push({
                rawName, slug, city, state, stream, collegeType,
                description, fees, placement: getRandomPlacement(),
                rating: getRandomRating(), image: getRandomImage(slug), numCourses, affiliation
            });
        }

        const batchSize = 500;
        for (let i = 0; i < collegesToInsert.length; i += batchSize) {
            const batch = collegesToInsert.slice(i, i + batchSize);
            const values = [];
            const placeholders = [];
            for (const col of batch) {
                values.push(col.rawName, col.slug, col.city, col.state, col.stream, col.collegeType, col.description, col.fees, col.placement, col.rating, col.image, col.numCourses, col.affiliation);
                placeholders.push(`(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            }
            const insertSql = `INSERT INTO colleges (name, slug, city, state, stream, college_type, description, avg_fees_per_year, avg_placement_package, student_rating, logo_url, total_courses, affiliation) VALUES ${placeholders.join(', ')} ON CONFLICT (slug) DO NOTHING`;
            await run(insertSql, values);
            insertedCount += batch.length;
        }

        const allCollegesInDb = await all('SELECT id, slug FROM colleges');
        const slugToId = new Map((allCollegesInDb || []).map(c => [c.slug, c.id]));
        
        const coursesValues = [];
        for (const col of collegesToInsert) {
            const collegeId = slugToId.get(col.slug);
            if (!collegeId) continue;
            const selectedCourses = defaultCourses.slice(0, col.numCourses);
            for (const course of selectedCourses) {
                coursesValues.push({ collegeId, courseId: course.id, fees: col.fees });
            }
        }

        for (let i = 0; i < coursesValues.length; i += batchSize) {
            const batch = coursesValues.slice(i, i + batchSize);
            const values = [];
            const placeholders = [];
            for (const c of batch) {
                values.push(c.collegeId, c.courseId, c.fees);
                placeholders.push(`(?, ?, ?)`);
            }
            const insertSql = `INSERT INTO college_courses (college_id, course_id, fees_per_year) VALUES ${placeholders.join(', ')} ON CONFLICT (college_id, course_id) DO NOTHING`;
            await run(insertSql, values);
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
