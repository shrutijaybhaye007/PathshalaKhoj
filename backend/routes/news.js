const express = require('express');
const Parser = require('rss-parser');
const router = express.Router();

const parser = new Parser({
  customFields: {
    item: ['source']
  }
});

// A pool of high-quality Unsplash education images to assign to news articles
const imagePool = [
  "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1513258496099-48162020ce58?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
];

// Helper to clean up titles from Google News (removes trailing " - SourceName")
function extractSourceFromTitle(title) {
  const parts = title.split(' - ');
  if (parts.length > 1) {
    const source = parts.pop();
    return { title: parts.join(' - '), source };
  }
  return { title, source: 'Education News' };
}

// GET /api/news
router.get('/', async (req, res) => {
  try {
    // Fetch live feed from Google News for India Education
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=Education+India+Exams&hl=en-IN&gl=IN&ceid=IN:en');
    
    // Map RSS items to our frontend News JSON structure
    const newsData = feed.items.slice(0, 15).map((item, index) => {
      // Extract cleaner title and source
      const { title, source: parsedSource } = extractSourceFromTitle(item.title);
      const actualSource = item.source || parsedSource;

      // Formatting the date nicely
      const pubDate = new Date(item.pubDate);
      const formattedDate = isNaN(pubDate) ? item.pubDate : pubDate.toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      // Get deterministic image based on index
      const image = imagePool[index % imagePool.length];

      return {
        id: item.guid || String(index),
        title: title,
        // Google News RSS puts full HTML in content/contentSnippet; we just take a short slice for summary
        summary: item.contentSnippet ? item.contentSnippet.substring(0, 130) + '...' : 'Read the full story to get more details on this important update.',
        source: actualSource,
        date: formattedDate,
        category: 'Update', // General category
        link: item.link,
        image: image
      };
    });

    res.json({ news: newsData });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    res.status(500).json({ error: 'Failed to fetch live news.' });
  }
});

module.exports = router;
