const cheerio = require('cheerio');

async function findWorkingDomain() {
  const query = `Abhinav Education Society Junior College Pune official website`.replace(/ /g, '+');
  const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  
  const html = await searchRes.text();
  const $ = cheerio.load(html);
  
  const candidateUrls = [];
  $('.result__url').each((i, el) => {
    let url = $(el).attr('href');
    if (url && url.includes('uddg=')) {
      try {
        const urlObj = new URL(url.startsWith('//') ? `https:${url}` : url);
        const uddg = urlObj.searchParams.get('uddg');
        if (uddg) url = decodeURIComponent(uddg);
      } catch(e){}
    }
    if (url) candidateUrls.push(url);
  });
  
  console.log('Found candidates:', candidateUrls);
  
  // Exclude directories
  const blocklist = ['wikipedia.org', 'justdial.com', 'shiksha.com', 'collegedunia.com', 'facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 'youtube.com', 'targetstudy.com', 'collegedekho.com', 'careers360.com'];
  
  for (let url of candidateUrls) {
    if (url.includes('?')) url = url.split('?')[0];
    const isBlocked = blocklist.some(b => url.toLowerCase().includes(b));
    if (isBlocked) continue;
    
    console.log(`\nTesting candidate: ${url}`);
    try {
      const res = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(4000)
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        console.log(`=> SUCCESS! Working official domain found: ${url}`);
        return;
      }
    } catch(err) {
      console.log(`Failed: ${err.message}`);
    }
  }
  
  console.log('No working official domains found.');
}

findWorkingDomain();
