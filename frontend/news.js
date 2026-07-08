(function() {
// =====================================================================
// news.js - PathshalaKhoj Education News Logic
// =====================================================================

// --- Theme management is handled globally in global.js ---
const el = {
  newsGrid: document.getElementById('newsGrid')
};

// --- Render News ---
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function renderNews() {
  if (!el.newsGrid) return;
  
  try {
    const res = await fetch('/api/news');
    if (!res.ok) throw new Error('Failed to fetch news');
    const data = await res.json();
    const newsData = data.news;
    
    let html = '';
    
    if (!newsData || newsData.length === 0) {
      html = '<div class="loading-state" style="grid-column: 1 / -1;"><p>No latest news found right now.</p></div>';
    } else {
      newsData.forEach((item, index) => {
        const isFeatured = index === 0 ? 'news-card-featured' : '';
        html += `
          <article class="news-card ${isFeatured}">
            <div class="news-img-wrapper">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" class="news-img">
              <span class="news-category-badge">${escapeHtml(item.category)}</span>
            </div>
            <div class="news-content">
              <div class="news-meta">
                <span class="news-source">🏢 ${escapeHtml(item.source)}</span>
                <span class="news-date">📅 ${escapeHtml(item.date)}</span>
              </div>
              <h3 class="news-title">${escapeHtml(item.title)}</h3>
              <p class="news-summary">${escapeHtml(item.summary)}</p>
              <a href="${escapeHtml(item.link)}" target="_blank" rel="noopener noreferrer" class="news-read-more">Read Full Story <span>→</span></a>
            </div>
          </article>
        `;
      });
    }
    
    el.newsGrid.innerHTML = html;
  } catch (error) {
    console.error('News error:', error);
    el.newsGrid.innerHTML = '<div class="loading-state" style="grid-column: 1 / -1;"><p>Could not load the latest news. Please try again later.</p></div>';
  }
}

// Init
renderNews();


})();