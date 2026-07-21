/**
 * compare.js — Bulletproof Side-by-Side College Comparison Controller
 */
'use strict';

// Always use relative API endpoint to avoid CORS/origin mismatches (127.0.0.1 vs localhost)
const API_BASE = '/api';

// Format currency helper
function formatCurrency(amount) {
  if (amount === 0) return 'Free';
  if (amount == null || isNaN(amount)) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format placement salary helper
function formatPlacement(val) {
  if (!val || isNaN(val)) return 'N/A';
  const num = parseFloat(val);
  return `${num.toFixed(1)} LPA`;
}

// Escape HTML helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Get initials helper
function getInitials(name) {
  if (!name) return 'COL';
  const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '');
  const words = cleanName.split(' ').filter(w => w.length > 0);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

let currentIds = [];

// Main comparison initialization
async function initComparison() {
  const loader = document.getElementById('compareLoader');
  const emptyState = document.getElementById('compareEmptyState');
  const wrapper = document.getElementById('compareWrapper');
  const container = document.getElementById('compareContainer');

  setupCompareSearch();

  const urlParams = new URLSearchParams(window.location.search);
  let idsParam = urlParams.get('ids');

  // Fallback: If URL search params missing, check localStorage pk_compare
  if (!idsParam || !idsParam.trim()) {
    try {
      const stored = JSON.parse(localStorage.getItem('pk_compare') || '[]');
      if (Array.isArray(stored) && stored.length > 0) {
        idsParam = stored.map(c => (typeof c === 'object' && c !== null ? c.id : c)).join(',');
      }
    } catch (_) {}
  }

  if (!idsParam || !idsParam.trim()) {
    if (loader) loader.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (wrapper) wrapper.style.display = 'none';
    return;
  }

  // Clean IDs of any non-digit characters (e.g. em-dashes, spaces, symbols)
  currentIds = idsParam.split(',')
    .map(id => parseInt(String(id).replace(/[^0-9]/g, ''), 10))
    .filter(id => !isNaN(id) && id > 0);

  if (currentIds.length === 0) {
    if (loader) loader.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    if (wrapper) wrapper.style.display = 'none';
    return;
  }

  if (loader) loader.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';
  if (wrapper) wrapper.style.display = 'none';

  try {
    // Fetch details for all selected colleges in parallel using relative URL
    const colleges = await Promise.all(
      currentIds.map(async id => {
        const res = await fetch(`${API_BASE}/colleges/${id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
    );

    if (loader) loader.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';

    renderComparisonView(colleges, container);
  } catch (err) {
    console.error('Comparison error:', err);
    if (loader) loader.style.display = 'none';
    if (wrapper) wrapper.style.display = 'block';
    if (container) {
      container.innerHTML = `
        <div style="text-align:center; padding:60px 20px; background:var(--surface); border-radius:var(--radius-lg); border:1.5px solid var(--border); margin-top:20px;">
          <span style="font-size:48px;">⚠️</span>
          <h3 style="font-size:20px; font-family:var(--font-display); color:var(--text); margin:12px 0 8px;">Error Loading Comparison Data</h3>
          <p style="font-size:14px; color:var(--text-2); margin-bottom:20px;">We encountered an issue fetching comparison details for the selected colleges (${escapeHtml(err.message)}).</p>
          <div style="display:flex; justify-content:center; gap:12px;">
            <button onclick="window.location.reload()" class="btn-primary" style="padding:10px 20px; border:none; cursor:pointer;">🔄 Retry Loading</button>
            <a href="/" class="btn-secondary" style="padding:10px 20px; text-decoration:none; display:inline-block;">Back to Colleges</a>
          </div>
        </div>
      `;
    }
  }
}

// Render modern side-by-side comparison table
function renderComparisonView(colleges, container) {
  if (!colleges || colleges.length === 0) return;

  // Calculate best values for winner highlighting
  const validFees = colleges.map(c => c.avg_fees_per_year).filter(f => f && f > 0);
  const minFees = validFees.length ? Math.min(...validFees) : null;

  const validNirf = colleges.map(c => c.nirf_ranking).filter(n => n && n > 0);
  const bestNirf = validNirf.length ? Math.min(...validNirf) : null;

  const validPlacements = colleges.map(c => c.avg_placement_package).filter(p => p && p > 0);
  const maxPlacements = validPlacements.length ? Math.max(...validPlacements) : null;

  const validHighestPlacements = colleges.map(c => c.highest_placement_package).filter(p => p && p > 0);
  const maxHighestPlacements = validHighestPlacements.length ? Math.max(...validHighestPlacements) : null;

  const numCols = colleges.length;
  container.style.setProperty('--compare-cols', numCols);

  // Grouped Comparison Sections
  const sections = [
    {
      category: '🎓 Overview & Accreditation',
      fields: [
        { label: 'Stream', fn: c => `<span class="badge-stream">${escapeHtml(c.stream)}</span>` },
        { label: 'College Type', fn: c => escapeHtml(c.college_type || 'Private') },
        { label: 'Establishment', fn: c => c.established_year ? `Estd. ${c.established_year}` : 'N/A' },
        { label: 'NAAC Grade', fn: c => c.naac_grade ? `<span class="naac-pill">${escapeHtml(c.naac_grade)}</span>` : 'N/A' },
        {
          label: 'NIRF Rank',
          fn: c => {
            if (!c.nirf_ranking) return '<span style="color:var(--text-3);">N/A</span>';
            const isBest = c.nirf_ranking === bestNirf && numCols > 1;
            return `
              <div class="metric-val-wrap">
                <span class="nirf-rank-text">🏆 #${c.nirf_ranking}</span>
                ${isBest ? `<span class="winner-badge winner-nirf">BEST RANK</span>` : ''}
              </div>
            `;
          }
        }
      ]
    },
    {
      category: '💰 Tuition Fees & Financial Aid',
      fields: [
        {
          label: 'Avg Annual Fees',
          fn: c => {
            const isBest = c.avg_fees_per_year === minFees && numCols > 1 && c.avg_fees_per_year > 0;
            return `
              <div class="metric-val-wrap">
                <span class="fee-val-text">${formatCurrency(c.avg_fees_per_year)}</span>
                ${isBest ? `<span class="winner-badge winner-fee">LOWEST FEE</span>` : ''}
              </div>
            `;
          }
        },
        {
          label: 'Scholarships',
          fn: c => c.scholarships_info ? `<span style="font-size:12.5px; line-height:1.4; color:var(--text-2);">${escapeHtml(c.scholarships_info)}</span>` : 'State / Merit Scholarships'
        }
      ]
    },
    {
      category: '💼 Placements & Career ROI',
      fields: [
        {
          label: 'Avg Placement Package',
          fn: c => {
            if (!c.avg_placement_package) return '<span style="color:var(--text-3);">N/A</span>';
            const isBest = c.avg_placement_package === maxPlacements && numCols > 1;
            return `
              <div class="metric-val-wrap">
                <span class="salary-val-text">💼 ${formatPlacement(c.avg_placement_package)}</span>
                ${isBest ? `<span class="winner-badge winner-salary">HIGHEST AVG</span>` : ''}
              </div>
            `;
          }
        },
        {
          label: 'Highest Package',
          fn: c => {
            if (!c.highest_placement_package) return '<span style="color:var(--text-3);">N/A</span>';
            const isBest = c.highest_placement_package === maxHighestPlacements && numCols > 1;
            return `
              <div class="metric-val-wrap">
                <span style="font-weight:700;">🚀 ${formatPlacement(c.highest_placement_package)}</span>
                ${isBest ? `<span class="winner-badge winner-salary">HIGHEST MAX</span>` : ''}
              </div>
            `;
          }
        },
        {
          label: 'Placement Rate',
          fn: c => c.placement_rate ? `<strong>${c.placement_rate}%</strong> placed` : 'N/A'
        },
        {
          label: 'Top Recruiters',
          fn: c => c.top_recruiters ? `<span style="font-size:12.5px; color:var(--text-2);">${escapeHtml(c.top_recruiters)}</span>` : 'N/A'
        }
      ]
    },
    {
      category: '🏫 Campus & Facilities',
      fields: [
        { label: 'Campus Size', fn: c => c.campus_size ? escapeHtml(c.campus_size) : 'N/A' },
        { label: 'Hostel Facility', fn: c => (c.hostel_available === 1 || c.hostel_available === true) ? '✅ Available' : '❌ Not Available' },
        {
          label: 'Campus Facilities',
          fn: c => {
            let list = [];
            if (c.facilities) {
              if (typeof c.facilities === 'string') {
                try {
                  const parsed = JSON.parse(c.facilities);
                  list = Array.isArray(parsed) ? parsed : c.facilities.split(',');
                } catch (_) {
                  list = c.facilities.split(',');
                }
              } else if (Array.isArray(c.facilities)) {
                list = c.facilities;
              }
            }
            list = list.map(f => String(f).trim()).filter(Boolean);
            if (list.length === 0) return '<span style="color:var(--text-3);">Standard Facilities</span>';
            return `
              <div class="facility-chip-group">
                ${list.slice(0, 6).map(f => `<span class="facility-chip">${escapeHtml(f)}</span>`).join('')}
              </div>
            `;
          }
        }
      ]
    },
    {
      category: '📞 Helpline & Official Website',
      fields: [
        {
          label: 'Helpline Contact',
          fn: c => {
            const phone = c.contact_phone || 'N/A';
            const email = c.contact_email || 'N/A';
            return `
              <div class="contact-stack">
                <div>📞 ${escapeHtml(phone)}</div>
                <div style="word-break:break-all;">✉️ ${escapeHtml(email)}</div>
              </div>
            `;
          }
        },
        {
          label: 'Application Deadline',
          fn: c => c.application_deadline ? `<span style="color:#e11d48; font-weight:600;">📅 ${escapeHtml(c.application_deadline)}</span>` : 'N/A'
        },
        {
          label: 'Official Website',
          fn: c => {
            if (!c.website) return 'N/A';
            const url = c.website.startsWith('http') ? c.website : `https://${c.website}`;
            return `<a href="${url}" target="_blank" rel="noopener" class="website-link">Visit Website ↗</a>`;
          }
        }
      ]
    }
  ];

  // Build HTML
  let html = `
    <!-- Sticky College Header Row -->
    <div class="compare-sticky-header">
      <div class="compare-row-header compare-label-cell">
        <span style="font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--text-3); font-weight:700;">Comparing ${colleges.length} Colleges</span>
      </div>
      <div class="compare-values-grid">
        ${colleges.map(c => `
          <div class="compare-college-card">
            <button type="button" class="compare-card-remove" onclick="removeCollege(${c.id})" title="Remove college">✕</button>
            <div class="compare-logo">${getInitials(c.name)}</div>
            <h3 class="compare-name"><a href="college.html?id=${c.id}" style="color:inherit; text-decoration:none;">${escapeHtml(c.name)}</a></h3>
            <p class="compare-loc">📍 ${escapeHtml(c.city)}, ${escapeHtml(c.state)}</p>
            <a href="college.html?id=${c.id}" class="compare-view-btn">View Details ↗</a>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Render Section Accordions / Cards
  sections.forEach(sec => {
    html += `
      <div class="compare-section-card">
        <div class="compare-section-title">${sec.category}</div>
        <div class="compare-section-body">
          ${sec.fields.map(f => `
            <div class="compare-field-row">
              <div class="compare-field-label">${f.label}</div>
              <div class="compare-values-grid">
                ${colleges.map(c => `<div class="compare-value-cell">${f.fn(c)}</div>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// Setup Inline Add College Search Autocomplete
function setupCompareSearch() {
  const input = document.getElementById('compareSearchInput');
  const dropdown = document.getElementById('compareSearchDropdown');
  if (!input || !dropdown) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    if (query.length < 2) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/colleges?q=${encodeURIComponent(query)}&limit=5`);
        const json = await res.json();
        const results = json.data || [];

        if (results.length === 0) {
          dropdown.innerHTML = `<div style="padding:12px 16px; font-size:13px; color:var(--text-3);">No matching colleges found</div>`;
        } else {
          dropdown.innerHTML = results.map(c => `
            <div class="compare-search-item" onclick="addCollegeToCompare(${c.id})">
              <div>
                <strong style="display:block; font-size:13.5px; color:var(--text);">${escapeHtml(c.name)}</strong>
                <span style="font-size:12px; color:var(--text-2);">📍 ${escapeHtml(c.city)}, ${escapeHtml(c.state)}</span>
              </div>
              <button type="button" class="btn-add-compare">+ Add</button>
            </div>
          `).join('');
        }
        dropdown.style.display = 'block';
      } catch (e) {
        console.error(e);
      }
    }, 250);
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  });
}

// Global window helpers for user actions
window.removeCollege = function(collegeId) {
  currentIds = currentIds.filter(id => id !== collegeId);
  try {
    let compareList = JSON.parse(localStorage.getItem('pk_compare') || '[]');
    compareList = compareList.filter(c => c.id !== collegeId);
    localStorage.setItem('pk_compare', JSON.stringify(compareList));
  } catch (_) {}

  if (currentIds.length > 0) {
    window.location.href = `compare.html?ids=${currentIds.join(',')}`;
  } else {
    window.location.href = '/';
  }
};

window.addCollegeToCompare = function(collegeId) {
  if (currentIds.includes(collegeId)) return;
  if (currentIds.length >= 4) {
    alert('You can compare a maximum of 4 colleges at a time.');
    return;
  }
  currentIds.push(collegeId);
  window.location.href = `compare.html?ids=${currentIds.join(',')}`;
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initComparison);
} else {
  initComparison();
}
