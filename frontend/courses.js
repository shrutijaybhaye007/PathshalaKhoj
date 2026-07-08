(function() {
// courses.js

const API_BASE = '/api';

const el = {
  coursesGrid: document.getElementById('coursesGrid'),
  searchInput: document.getElementById('courseSearchInput'),
  levelSelect: document.getElementById('courseLevelSelect'),
  examInput: document.getElementById('courseExamInput'),
  searchBtn: document.getElementById('courseSearchBtn'),
  courseSearchClearBtn: document.getElementById('courseSearchClearBtn'),
  courseExamClearBtn: document.getElementById('courseExamClearBtn'),
  courseAutocompleteSuggestions: document.getElementById('courseAutocompleteSuggestions')
};

let currentPage = 1;
let currentLimit = 12;

const loadMoreBtn = document.getElementById('loadMoreBtn');
const loadMoreContainer = document.getElementById('loadMoreContainer');

if (loadMoreBtn) {
  loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    fetchCourses(true);
  });
}

// --- Search Engine Utilities & Helpers ---

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem('pk_recent_course_searches')) || [];
  } catch (e) {
    return [];
  }
}

function saveRecentSearch(query) {
  if (!query || !query.trim()) return;
  let recents = getRecentSearches();
  recents = recents.filter(q => q !== query);
  recents.unshift(query);
  localStorage.setItem('pk_recent_course_searches', JSON.stringify(recents.slice(0, 5)));
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  return escapeHtml(text).replace(regex, '<span class="search-highlight">$1</span>');
}

function closeAutocomplete() {
  if (el.courseAutocompleteSuggestions) {
    el.courseAutocompleteSuggestions.hidden = true;
  }
}

function showRecentSearches() {
  const recents = getRecentSearches();
  if (recents.length === 0) {
    closeAutocomplete();
    return;
  }
  let html = `<div class="recent-searches-header">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    Recent Searches
  </div>`;
  recents.forEach(q => {
    html += `
      <div class="suggestion-item" data-type="recent" data-value="${escapeHtml(q)}">
        <span class="suggestion-icon">⏳</span>
        <div class="suggestion-text">
          <div class="suggestion-name">${escapeHtml(q)}</div>
        </div>
      </div>
    `;
  });
  el.courseAutocompleteSuggestions.innerHTML = html;
  el.courseAutocompleteSuggestions.hidden = false;
  bindSuggestionClicks();
}

const fetchAutocomplete = debounce(async (val) => {
  if (!val.trim()) {
    showRecentSearches();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/courses/autocomplete?q=${encodeURIComponent(val)}`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    renderSuggestions(data, val);
  } catch (e) {
    closeAutocomplete();
  }
}, 300);

function renderSuggestions(data, val) {
  const container = el.courseAutocompleteSuggestions;
  container.innerHTML = '';
  const { courses, colleges } = data;
  const hasCourses = courses && courses.length > 0;
  const hasColleges = colleges && colleges.length > 0;

  if (!hasCourses && !hasColleges) {
    container.hidden = true;
    return;
  }

  let html = '';
  if (hasCourses) {
    html += `<div class="suggestion-group"><div class="suggestion-group-title">Courses</div>`;
    courses.forEach(c => {
      html += `
        <div class="suggestion-item" data-type="course" data-value="${escapeHtml(c.name)}">
          <span class="suggestion-icon">📖</span>
          <div class="suggestion-text">
            <div class="suggestion-name">${highlightMatch(c.name, val)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  if (hasColleges) {
    html += `<div class="suggestion-group"><div class="suggestion-group-title">Colleges Offering Matches</div>`;
    colleges.forEach(col => {
      html += `
        <div class="suggestion-item" data-type="college" data-id="${col.id}">
          <span class="suggestion-icon">🏫</span>
          <div class="suggestion-text">
            <div class="suggestion-name">${highlightMatch(col.name, val)}</div>
            <div class="suggestion-meta">${escapeHtml(col.city)}, ${escapeHtml(col.state)}</div>
          </div>
        </div>
      `;
    });
    html += `</div>`;
  }

  container.innerHTML = html;
  container.hidden = false;
  bindSuggestionClicks();
}

function bindSuggestionClicks() {
  const container = el.courseAutocompleteSuggestions;
  container.querySelectorAll('.suggestion-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      if (type === 'college') {
        window.location.href = `college.html?id=${item.dataset.id}`;
      } else {
        const val = item.dataset.value;
        el.searchInput.value = val;
        saveRecentSearch(val);
        closeAutocomplete();
        if (el.courseSearchClearBtn) el.courseSearchClearBtn.hidden = false;
        fetchCourses(false);
      }
    });
  });
}

async function fetchCourses(append = false) {
  if (!el.coursesGrid) return;
  
  if (!append) {
    currentPage = 1;
    el.coursesGrid.innerHTML = '<div class="loading-spinner">Loading courses...</div>';
    if (loadMoreContainer) loadMoreContainer.style.display = 'none';
  } else {
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
  }

  const q = el.searchInput.value.trim();
  const level = el.levelSelect.value;
  const exam = el.examInput.value.trim();

  let queryUrl = `${API_BASE}/courses?page=${currentPage}&limit=${currentLimit}&`;
  if (q) queryUrl += `q=${encodeURIComponent(q)}&`;
  if (level) queryUrl += `level=${encodeURIComponent(level)}&`;
  if (exam) queryUrl += `entrance_exam=${encodeURIComponent(exam)}&`;

  try {
    const res = await fetch(queryUrl);
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    
    if (append) {
      loadMoreBtn.textContent = 'Load More Courses';
      loadMoreBtn.disabled = false;
    }
    
    renderCourses(data.data, append);
    
    if (data.pagination) {
      if (data.pagination.page < data.pagination.total_pages) {
        if (loadMoreContainer) loadMoreContainer.style.display = 'block';
      } else {
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
      }
    }
  } catch (err) {
    console.error('Failed to fetch courses:', err);
    if (!append) {
      el.coursesGrid.innerHTML = '<div class="no-results" style="color:var(--error);">Failed to load courses. Please try again later.</div>';
    }
  }
}

function renderCourses(courses, append = false) {
  if (!courses || courses.length === 0) {
    if (!append) {
      el.coursesGrid.innerHTML = `
          <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 64px 24px; background: var(--surface-2); border-radius: 12px; border: 1px solid var(--border-1);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="1" style="margin-bottom: 16px;">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3 class="empty-state-title" style="font-family: var(--font-heading); font-size: 24px; color: var(--text-1); margin-bottom: 8px;">No Courses Found</h3>
            <p class="empty-state-sub" style="color: var(--text-2);">Try adjusting your search criteria or clearing filters.</p>
          </div>
        `;
    }
    return;
  }

  const html = courses.map(c => {
    const levelLower = (c.level || 'ug').toLowerCase();
    let badgeClass = 'level-ug';
    if (levelLower === 'pg') badgeClass = 'level-pg';
    else if (levelLower === 'ph.d' || levelLower === 'phd') badgeClass = 'level-phd';
    else if (levelLower === 'diploma') badgeClass = 'level-diploma';

    return `
      <div class="course-card fade-in">
        <div>
          <span class="course-badge ${badgeClass}">${escapeHtml(c.level || 'UG')}</span>
          <h3 class="course-title">${escapeHtml(c.name)}</h3>
          <div class="course-college">
            <span>Offered by</span>
            <a class="course-college-link" href="college.html?id=${c.college_id}">${escapeHtml(c.college_name || 'College')}</a>
          </div>
        </div>
        
        <div class="course-details">
          <div class="detail-item">
            <span class="detail-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              Duration
            </span>
            <span class="detail-value">${c.duration_years ? c.duration_years + ' Years' : 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              Total Seats
            </span>
            <span class="detail-value">${c.seats || 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              Avg. Fees
            </span>
            <span class="detail-value" style="color: var(--gold); font-weight: 700;">${c.fees_per_year ? '₹' + c.fees_per_year.toLocaleString('en-IN') + '/yr' : 'N/A'}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Exam
            </span>
            <span class="detail-value">${escapeHtml(c.entrance_exam || 'Merit Based')}</span>
          </div>
        </div>
        
        <a class="course-action-btn" href="college.html?id=${c.college_id}">
          View Institution
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </a>
      </div>
    `;
  }).join('');

  if (append) {
    el.coursesGrid.insertAdjacentHTML('beforeend', html);
  } else {
    el.coursesGrid.innerHTML = html;
  }
}

// Utility for basic escaping if not present in global.js
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setupSuggestionsKeyboardNavigation() {
  el.searchInput.addEventListener('keydown', (e) => {
    const container = el.courseAutocompleteSuggestions;
    if (container.hidden) return;
    const items = container.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;

    let activeIdx = Array.from(items).findIndex(item => item.classList.contains('highlighted'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (activeIdx !== -1) items[activeIdx].classList.remove('highlighted');
      activeIdx = (activeIdx + 1) % items.length;
      items[activeIdx].classList.add('highlighted');
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIdx !== -1) items[activeIdx].classList.remove('highlighted');
      activeIdx = (activeIdx - 1 + items.length) % items.length;
      items[activeIdx].classList.add('highlighted');
      items[activeIdx].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (activeIdx !== -1) {
        e.preventDefault();
        items[activeIdx].click();
      }
    } else if (e.key === 'Escape') {
      closeAutocomplete();
    }
  });
}

function setupClearButtons() {
  if (el.courseSearchClearBtn) {
    el.courseSearchClearBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      el.courseSearchClearBtn.hidden = true;
      el.searchInput.focus();
      closeAutocomplete();
      fetchCourses(false);
    });
  }
  if (el.courseExamClearBtn) {
    el.courseExamClearBtn.addEventListener('click', () => {
      el.examInput.value = '';
      el.courseExamClearBtn.hidden = true;
      el.examInput.focus();
      fetchCourses(false);
    });
  }
  
  el.searchInput.addEventListener('input', (e) => {
    if (el.courseSearchClearBtn) el.courseSearchClearBtn.hidden = !e.target.value;
  });
  el.examInput.addEventListener('input', (e) => {
    if (el.courseExamClearBtn) el.courseExamClearBtn.hidden = !e.target.value;
  });
}

function setupKeyboardFocusShortcut() {
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== el.searchInput && document.activeElement !== el.examInput) {
      e.preventDefault();
      el.searchInput.focus();
      el.searchInput.select();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (el.searchBtn) {
    el.searchBtn.addEventListener('click', () => {
      saveRecentSearch(el.searchInput.value);
      closeAutocomplete();
      fetchCourses(false);
    });
  }
  
  if (el.searchInput) {
    el.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        saveRecentSearch(el.searchInput.value);
        closeAutocomplete();
        fetchCourses(false);
      }
    });
    el.searchInput.addEventListener('focus', (e) => {
      if (e.target.value.trim() === '') {
        showRecentSearches();
      } else {
        fetchAutocomplete(e.target.value);
      }
    });
    el.searchInput.addEventListener('input', (e) => {
      fetchAutocomplete(e.target.value);
    });
  }

  if (el.examInput) {
    el.examInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        closeAutocomplete();
        fetchCourses(false);
      }
    });
  }

  // Debounced search on input/typing
  const debouncedSearch = debounce(() => {
    fetchCourses(false);
  }, 400);

  if (el.searchInput) {
    el.searchInput.addEventListener('input', debouncedSearch);
  }
  if (el.examInput) {
    el.examInput.addEventListener('input', debouncedSearch);
  }
  if (el.levelSelect) {
    el.levelSelect.addEventListener('change', () => {
      fetchCourses(false);
    });
  }

  // Close autocomplete on click outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.courses-search-field')) {
      closeAutocomplete();
    }
  });

  setupSuggestionsKeyboardNavigation();
  setupClearButtons();
  setupKeyboardFocusShortcut();

  // Initial load
  fetchCourses();
});

})();