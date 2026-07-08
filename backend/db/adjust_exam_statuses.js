const { run } = require('./connection');

const updates = [
  { id: 1,  status: 'Completed' }, // JEE Main (Jan/Apr)
  { id: 2,  status: 'Completed' }, // NEET UG (May 3)
  { id: 3,  status: 'Ongoing'   }, // JoSAA Counseling (Starts June 15, currently active in late June)
  { id: 4,  status: 'Scheduled' }, // CAT (Nov 29)
  { id: 5,  status: 'Scheduled' }, // CLAT (Dec 6)
  { id: 6,  status: 'Completed' }, // JEE Advanced (May 17)
  { id: 7,  status: 'Completed' }, // GATE (Feb)
  { id: 8,  status: 'Completed' }, // BITSAT (Session 2 ended Jun 26)
  { id: 9,  status: 'Completed' }, // XAT (Jan 4)
  { id: 10, status: 'Scheduled' }, // SNAP (Dec)
  { id: 11, status: 'Scheduled' }, // AILET (Dec 14)
  { id: 12, status: 'Completed' }, // CUET UG (May 15-31)
  { id: 13, status: 'Completed' }, // NID DAT (Ended Apr)
  { id: 14, status: 'Completed' }, // NIFT (Ended Apr)
  { id: 15, status: 'Completed' }, // MHT CET (May 2-13)
  { id: 16, status: 'Completed' }, // KCET (Apr 18-19)
  { id: 17, status: 'Completed' }, // AP EAPCET (May 13-19)
  { id: 18, status: 'Completed' }, // TS EAPCET (May 7-11)
  { id: 19, status: 'Completed' }, // WBJEE (Apr 26)
  { id: 20, status: 'Completed' }, // KEAM (Jun 1-9)
  { id: 21, status: 'Completed' }  // GUJCET (Mar 31)
];

function adjustStatuses() {
  console.log('Adjusting exam statuses to match current date: June 28, 2026...');
  for (const item of updates) {
    try {
      run(
        `UPDATE timeline_events SET status = ? WHERE id = ?`,
        [item.status, item.id]
      );
      console.log(`Updated exam ID ${item.id} to status: ${item.status}`);
    } catch (err) {
      console.error(`Failed to update exam ID ${item.id}:`, err);
    }
  }
  console.log('Finished adjusting exam statuses.');
}

adjustStatuses();
