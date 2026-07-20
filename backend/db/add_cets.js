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
    exam_name: 'TG EAPCET 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: May 9 - May 13, 2026',
    status: 'Upcoming',
    badge_filter: 'TG EAPCET',
    post_exam_note: 'Telangana State Council of Higher Education (TSCHE) timeline.'
  },
  {
    id: 19,
    exam_name: 'KEAM 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: June 1 - June 9, 2026 (CBT Mode)',
    status: 'Upcoming',
    badge_filter: 'KEAM',
    post_exam_note: 'Commissioner for Entrance Examinations (CEE) Kerala portal.'
  },
  {
    id: 20,
    exam_name: 'GUJCET 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: Mar 31, 2026',
    status: 'Scheduled',
    badge_filter: 'GUJCET',
    post_exam_note: 'Gujarat Secondary and Higher Secondary Education Board (GSEB).'
  },
  {
    id: 21,
    exam_name: 'WBJEE 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: Apr 26, 2026',
    status: 'Upcoming',
    badge_filter: 'WBJEE',
    post_exam_note: 'West Bengal Joint Entrance Examinations Board.'
  }
];

async function addCets() {
  for (const e of cetExams) {
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
      [e.id, e.exam_name, e.stream, e.dates_details, e.status, e.badge_filter, e.post_exam_note]
    );
  }
  console.log('✅ Added / updated state CET exams in timeline_events.');
}

if (require.main === module) {
  addCets().catch(console.error);
}

module.exports = { addCets };
