const cheerio = require('cheerio');
fetch('https://html.duckduckgo.com/html/?q=Abhinav+Education+Society+Junior+College+Pune+official+website', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  }
})
.then(r => r.text())
.then(html => {
  const $ = cheerio.load(html);
  const topUrl = $('.result__url').first().attr('href');
  console.log('Top URL:', topUrl);
})
.catch(console.error);
