const { db, all, get, run } = require('./connection');
const fs = require('fs');
const path = require('path');

// Generate random realistic metrics
const getRandomRating = () => parseFloat((3.5 + Math.random() * 1.4).toFixed(1)); // 3.5 to 4.9
const getRandomFees = () => {
    // Stored as integer INR, e.g., 50,000 to 1,500,000
    return Math.floor(Math.random() * 1450000) + 50000;
};
const getRandomPlacement = () => {
    // Stored as REAL LPA, e.g. 3.5 to 22.0
    return parseFloat((3.0 + Math.random() * 19.0).toFixed(1));
};
const getRandomStream = () => {
    const streams = ['Engineering', 'Medical', 'Arts', 'Commerce', 'Law', 'Management', 'Science', 'Design'];
    return streams[Math.floor(Math.random() * streams.length)];
};
const getRandomImage = (slug) => `https://source.unsplash.com/800x600/?college,university,campus,${slug}`;

function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

console.log('Reading massive dataset...');
const dataPath = path.join(__dirname, '../node_modules/indian-colleges/colleges.json');
let rawData;
try {
    rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (e) {
    console.error('Failed to read indian-colleges dataset:', e);
    process.exit(1);
}

console.log(`Loaded ${rawData.length} colleges from dataset.`);

// Ensure we have some default courses to map
let defaultCourses = all('SELECT id, name FROM courses');
if (defaultCourses.length === 0) {
    console.log('No courses found, creating default courses...');
    run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('B.Tech Computer Science', 'UG', 4.0, 'B.Tech')");
    run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('MBA Finance', 'PG', 2.0, 'MBA')");
    run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('MBBS', 'UG', 5.5, 'MBBS')");
    run("INSERT INTO courses (name, level, duration_years, degree_type) VALUES ('BA English', 'UG', 3.0, 'BA')");
    defaultCourses = all('SELECT id, name FROM courses');
}

console.log('Beginning massive seeding process. This may take a minute...');

const insertCollege = db.prepare(`
    INSERT INTO colleges (
        name, slug, city, state, stream, college_type,
        description, avg_fees_per_year, avg_placement_package,
        student_rating, logo_url, total_courses, affiliation
    )
    VALUES (
        @name, @slug, @city, @state, @stream, @college_type,
        @description, @avg_fees_per_year, @avg_placement_package,
        @student_rating, @logo_url, @total_courses, @affiliation
    )
`);

const insertCollegeCourse = db.prepare(`
    INSERT INTO college_courses (college_id, course_id, fees_per_year)
    VALUES (@college_id, @course_id, @fees_per_year)
`);

let insertedCount = 0;
let skippedCount = 0;

// Need to turn off PRAGMAs temporarily or handle transaction inside the DB object
// DatabaseSync transactions are tricky, we'll just run a BEGIN/COMMIT
try {
    const existingSlugs = new Set(
        all('SELECT slug FROM colleges').map(c => c.slug)
    );

    db.exec('BEGIN TRANSACTION');

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

        try {
            // FTS5 tables are automatically populated by the AFTER INSERT triggers defined in schema.sql
            const result = insertCollege.run({
                name: rawName,
                slug: slug,
                city: city,
                state: state,
                stream: stream,
                college_type: collegeType,
                description: description,
                avg_fees_per_year: fees,
                avg_placement_package: getRandomPlacement(),
                student_rating: getRandomRating(),
                logo_url: getRandomImage(slug),
                total_courses: 0, // We'll set this below if we want, or leave it
                affiliation: affiliation
            });

            const collegeId = result.lastInsertRowid;

            // Pick 1 to 3 random courses
            const numCourses = Math.floor(Math.random() * 3) + 1;
            const shuffledCourses = [...defaultCourses].sort(() => 0.5 - Math.random());
            const selectedCourses = shuffledCourses.slice(0, numCourses);

            for (const course of selectedCourses) {
                insertCollegeCourse.run({ college_id: collegeId, course_id: course.id, fees_per_year: fees });
            }

            // Update total_courses denormalized column
            run('UPDATE colleges SET total_courses = ? WHERE id = ?', [numCourses, collegeId]);

            insertedCount++;
        } catch (e) {
            console.error(`Failed to insert ${rawName}:`, e.message);
            skippedCount++;
        }
    }
    
    db.exec('COMMIT');
    
    console.log(`\n✅ Massive Seeding Complete!`);
    console.log(`Successfully inserted: ${insertedCount}`);
    console.log(`Skipped (duplicates/errors): ${skippedCount}`);
    
    const total = get('SELECT count(*) as c FROM colleges').c;
    console.log(`Total Colleges in Database: ${total}`);
} catch (e) {
    db.exec('ROLLBACK');
    console.error('Transaction failed:', e);
}
