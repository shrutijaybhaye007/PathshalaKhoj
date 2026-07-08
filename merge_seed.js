const fs = require('fs');
const path = require('path');

const seedPath = path.join(__dirname, 'backend', 'db', 'seed.js');
const addPath  = path.join(__dirname, 'backend', 'db', 'seed_extra.js');

let seed  = fs.readFileSync(seedPath,  'utf8');
const extra = fs.readFileSync(addPath, 'utf8');

// Insert extra colleges before the closing ]; that precedes "function seed("
seed = seed.replace(/\n\];\s*\nfunction seed/, '\n' + extra + '\n];\n\nfunction seed');
fs.writeFileSync(seedPath, seed, 'utf8');

const lines = seed.split('\n').length;
console.log('Merged OK. Total lines:', lines);
