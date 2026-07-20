const { run } = require('./connection');

const updates = [
  { id: 1,  status: 'Completed' },
  { id: 2,  status: 'Completed' },
  { id: 3,  status: 'Ongoing'   },
  { id: 4,  status: 'Scheduled' },
  { id: 5,  status: 'Scheduled' },
  { id: 6,  status: 'Completed' },
  { id: 7,  status: 'Completed' },
  { id: 8,  status: 'Completed' },
  { id: 9,  status: 'Completed' },
  { id: 10, status: 'Scheduled' },
  { id: 11, status: 'Scheduled' },
  { id: 12, status: 'Completed' },
  { id: 13, status: 'Completed' },
  { id: 14, status: 'Completed' },
  { id: 15, status: 'Completed' },
  { id: 16, status: 'Completed' },
  { id: 17, status: 'Completed' },
  { id: 18, status: 'Completed' },
  { id: 19, status: 'Completed' },
  { id: 20, status: 'Completed' },
  { id: 21, status: 'Completed' }
];

async function adjustStatuses() {
  console.log('Adjusting exam statuses to match current date: June 28, 2026...');
  for (const item of updates) {
    try {
      await run(`UPDATE timeline_events SET status = ? WHERE id = ?`, [item.status, item.id]);
      console.log(`Updated exam ID ${item.id} to status: ${item.status}`);
    } catch (err) {
      console.error(`Failed to update exam ID ${item.id}:`, err);
    }
  }
  console.log('Finished adjusting exam statuses.');
}

if (require.main === module) {
  adjustStatuses().catch(console.error);
}

module.exports = { adjustStatuses };
