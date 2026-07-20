const { run } = require('./connection');

async function addMhtcet() {
  console.log('Adding MHT CET to database...');
  try {
    await run(
      `INSERT INTO timeline_events (id, exam_name, stream, dates_details, status, badge_filter, post_exam_note)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         exam_name = EXCLUDED.exam_name,
         stream = EXCLUDED.stream,
         dates_details = EXCLUDED.dates_details,
         status = EXCLUDED.status,
         badge_filter = EXCLUDED.badge_filter,
         post_exam_note = EXCLUDED.post_exam_note`,
      [
        15,
        'MHT CET 2026',
        'Engineering',
        'Exam Date: May 2 - May 13, 2026 | Registration: Jan - Mar 2026',
        'Upcoming',
        'MHT CET',
        'State common entrance test cell, Maharashtra admissions.'
      ]
    );
    console.log('Successfully added MHT CET to database.');
  } catch (err) {
    console.error('Failed to add MHT CET:', err);
  }
}

if (require.main === module) {
  addMhtcet().catch(console.error);
}

module.exports = { addMhtcet };
