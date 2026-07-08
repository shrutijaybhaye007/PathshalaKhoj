const db = require('better-sqlite3')('../database.sqlite');
const res = db.prepare('SELECT gallery_images FROM colleges WHERE id = 80').get();
console.log(res);
