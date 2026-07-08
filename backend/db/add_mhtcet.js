const { run } = require('./connection');

function addMhtcet() {
  console.log('Adding MHT CET to database...');
  try {
    run(
      `INSERT OR REPLACE INTO timeline_events (id, exam_name, stream, dates_details, status, badge_filter, post_exam_note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
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

addMhtcet();
