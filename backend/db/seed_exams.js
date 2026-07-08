const { run } = require('./connection');

const newExams = [
  {
    id: 6,
    exam_name: 'JEE Advanced 2026',
    stream: 'Engineering',
    dates_details: 'Exam Date: May 17, 2026 | Registration: Apr 2026',
    status: 'Upcoming',
    badge_filter: 'JEE Advanced',
    post_exam_note: 'Admissions to IIT B.Tech programs based on these ranks.'
  },
  {
    id: 7,
    exam_name: 'GATE 2026',
    stream: 'Engineering',
    dates_details: 'Exam: Feb 7 - Feb 15, 2026 | Results: Mar 19, 2026',
    status: 'Completed',
    badge_filter: 'GATE',
    post_exam_note: 'M.Tech admissions and PSU recruitments ongoing.'
  },
  {
    id: 8,
    exam_name: 'BITSAT 2026',
    stream: 'Engineering',
    dates_details: 'Session 1: May 20 - 24, 2026 | Session 2: Jun 22 - 26, 2026',
    status: 'Upcoming',
    badge_filter: 'BITSAT',
    post_exam_note: 'Admissions to BITS Pilani, Goa, and Hyderabad campuses.'
  },
  {
    id: 9,
    exam_name: 'XAT 2026',
    stream: 'Management',
    dates_details: 'Exam Date: Jan 4, 2026 | Results out',
    status: 'Completed',
    badge_filter: 'XAT',
    post_exam_note: 'Check XLRI and partner institutes for cutoff details.'
  },
  {
    id: 10,
    exam_name: 'SNAP 2026',
    stream: 'Management',
    dates_details: 'Test 1: Dec 6 | Test 2: Dec 13 | Test 3: Dec 20, 2026',
    status: 'Scheduled',
    badge_filter: 'SNAP',
    post_exam_note: 'Admissions to Symbiosis MBA programs.'
  },
  {
    id: 11,
    exam_name: 'AILET 2026',
    stream: 'Law',
    dates_details: 'Exam Date: Dec 14, 2026',
    status: 'Scheduled',
    badge_filter: 'AILET',
    post_exam_note: 'For BA LLB / LLM admissions at National Law University Delhi.'
  },
  {
    id: 12,
    exam_name: 'CUET UG 2026',
    stream: 'Science',
    dates_details: 'Exam: May 15 - May 31, 2026',
    status: 'Upcoming',
    badge_filter: 'CUET',
    post_exam_note: 'Central universities common admission test.'
  },
  {
    id: 13,
    exam_name: 'NID DAT 2026',
    stream: 'Design',
    dates_details: 'Prelims: Dec 21, 2025 | Mains: Apr 2026',
    status: 'Ongoing',
    badge_filter: 'NID',
    post_exam_note: 'National Institute of Design admissions portal open.'
  },
  {
    id: 14,
    exam_name: 'NIFT 2026',
    stream: 'Design',
    dates_details: 'Exam Date: Feb 5, 2026 | Situation Test: Apr 2026',
    status: 'Ongoing',
    badge_filter: 'NIFT',
    post_exam_note: 'Situation test/Interview schedule released on NIFT portal.'
  }
];

function seed() {
  console.log('Seeding new exams...');
  for (const exam of newExams) {
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
  console.log('Done seeding new exams.');
}

seed();
