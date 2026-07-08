const { run } = require('./connection');

const cetExams = [
  {
    id: 16,
    exam_name: 'KCET 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: Apr 18 - 19, 2026 | Registration: Feb 2026',
    status: 'Upcoming',
    badge_filter: 'KCET',
    post_exam_note: 'Karnataka Examinations Authority (KEA) admission timeline.'
  },
  {
    id: 17,
    exam_name: 'AP EAPCET 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: May 13 - May 19, 2026',
    status: 'Upcoming',
    badge_filter: 'AP EAPCET',
    post_exam_note: 'Admissions to engineering, agriculture and pharmacy in Andhra Pradesh.'
  },
  {
    id: 18,
    exam_name: 'TS EAPCET 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: May 7 - May 11, 2026',
    status: 'Upcoming',
    badge_filter: 'TS EAPCET',
    post_exam_note: 'Admissions to engineering, agriculture and pharmacy in Telangana.'
  },
  {
    id: 19,
    exam_name: 'WBJEE 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: Apr 26, 2026',
    status: 'Upcoming',
    badge_filter: 'WBJEE',
    post_exam_note: 'West Bengal Joint Entrance Examinations Board admissions.'
  },
  {
    id: 20,
    exam_name: 'KEAM 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: June 1 - June 9, 2026',
    status: 'Upcoming',
    badge_filter: 'KEAM',
    post_exam_note: 'Office of the Commissioner for Entrance Examinations, Kerala.'
  },
  {
    id: 21,
    exam_name: 'GUJCET 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: Mar 31, 2026',
    status: 'Upcoming',
    badge_filter: 'GUJCET',
    post_exam_note: 'Gujarat Secondary and Higher Secondary Education Board (GSEB).'
  }
];

function seed() {
  console.log('Seeding state CET exams...');
  for (const exam of cetExams) {
    try {
      run(
        `INSERT OR REPLACE INTO timeline_events (id, exam_name, stream, dates_details, status, badge_filter, post_exam_note)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [exam.id, exam.exam_name, exam.stream, exam.dates_details, exam.status, exam.badge_filter, exam.post_exam_note]
      );
      console.log(`Seeded: ${exam.exam_name}`);
    } catch (err) {
      console.error(`Failed to seed ${exam.exam_name}:`, err);
    }
  }
  console.log('Done seeding state CET exams.');
}

seed();
