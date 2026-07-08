const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('C:\\Users\\Sanket\\Documents\\Bucket List\\college-finder\\backend\\ddg_dump.html'));
const urls = [];
$('.result-snippet').each((i, el) => {
  urls.push($(el).attr('href'));
});
console.log(urls.join('\n'));
