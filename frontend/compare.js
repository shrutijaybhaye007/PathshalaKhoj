const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:4000/api'
  : '/api';

// Utility helper to format currency
function formatCurrency(amount) {
  if (amount === 0) return 'Free';
  if (amount == null) return 'N/A';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Utility helper to format salary
function formatPlacement(val) {
  if (!val) return 'N/A';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return `${num.toFixed(1)} LPA`;
}

// Escape html helper
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
  return cleanName.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').substring(0, 3).toUpperCase();
}

// Main loader controller
async function initComparison() {
  const loader = document.getElementById('compareLoader');
  const emptyState = document.getElementById('compareEmptyState');
  const wrapper = document.getElementById('compareWrapper');
  const container = document.getElementById('compareContainer');

  const urlParams = new URLSearchParams(window.location.search);
  const idsParam = urlParams.get('ids');

  if (!idsParam || !idsParam.trim()) {
    loader.style.display = 'none';
    emptyState.style.display = 'block';
    wrapper.style.display = 'none';
    return;
  }

  const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

  if (ids.length === 0) {
    loader.style.display = 'none';
    emptyState.style.display = 'block';
    wrapper.style.display = 'none';
    return;
  }

  try {
    // Fetch details for all selected colleges in parallel
    const colleges = await Promise.all(
      ids.map(id => fetch(`${API_BASE}/colleges/${id}`).then(res => {
        if (!res.ok) throw new Error(`Failed to load college ${id}`);
        return res.json();
      }))
    );

    loader.style.display = 'none';
    wrapper.style.display = 'block';

    renderComparisonTable(colleges, container);
  } catch (err) {
    console.error(err);
    loader.style.display = 'none';
    container.innerHTML = `<p style="text-align:center; padding:48px; color:var(--text-3);">Failed to load comparison data. Please try again.</p>`;
  }
}

function renderComparisonTable(colleges, container) {
  // 1. Calculate best metrics for highlighting
  const validFees = colleges.map(c => c.avg_fees_per_year).filter(f => f > 0);
  const minFees = validFees.length ? Math.min(...validFees) : null;

  const validNirf = colleges.map(c => c.nirf_ranking).filter(n => n > 0);
  const bestNirf = validNirf.length ? Math.min(...validNirf) : null;

  const validPlacements = colleges.map(c => c.avg_placement_package).filter(p => p > 0);
  const maxPlacements = validPlacements.length ? Math.max(...validPlacements) : null;

  const validHighestPlacements = colleges.map(c => c.highest_placement_package).filter(p => p > 0);
  const maxHighestPlacements = validHighestPlacements.length ? Math.max(...validHighestPlacements) : null;

  // Set grid column count CSS variable
  container.style.setProperty('--compare-cols', colleges.length);

  // 2. Define rows
  const fields = [
    {
      label: 'Header Info',
      isHeader: true,
      fn: (c) => {
        const initials = getInitials(c.name);
        return `
          <div class="compare-college-header">
            <button class="compare-remove-btn" onclick="removeCollege(${c.id})" title="Remove from comparison">✕</button>
            <div class="logo-box" style="width: 50px; height: 50px; border-radius: 12px; background: var(--gold-dim); color: var(--gold); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px;">
              ${initials}
            </div>
            <h3 style="font-size: 15px; font-weight: 700; color: var(--text); margin: 0; line-height: 1.4;">${escapeHtml(c.name)}</h3>
            <span style="font-size: 12px; color: var(--text-2);">📍 ${escapeHtml(c.city)}, ${escapeHtml(c.state)}</span>
          </div>
        `;
      }
    },
    { label: 'Stream', fn: (c) => escapeHtml(c.stream) },
    { label: 'College Type', fn: (c) => escapeHtml(c.college_type || 'Private') },
    { label: 'Established', fn: (c) => c.established_year || 'N/A' },
    { label: 'NAAC Grade', fn: (c) => c.naac_grade ? `<strong>${escapeHtml(c.naac_grade)}</strong>` : 'N/A' },
    {
      label: 'NIRF Ranking',
      fn: (c) => {
        if (!c.nirf_ranking) return 'N/A';
        const isBest = c.nirf_ranking === bestNirf && colleges.length > 1;
        return `
          <span style="font-weight: 600;">#${c.nirf_ranking}</span>
          ${isBest ? `<div style="font-size: 10px; color: var(--indigo); font-weight: 700; margin-top: 4px;">🏆 BEST RANK</div>` : ''}
        `;
      }
    },
    {
      label: 'Avg. Fees / Year',
      fn: (c) => {
        const isBest = c.avg_fees_per_year === minFees && colleges.length > 1 && c.avg_fees_per_year > 0;
        return `
          <span style="font-weight: 700; color: var(--gold);">${formatCurrency(c.avg_fees_per_year)}</span>
          ${isBest ? `<div style="font-size: 10px; color: #10b981; font-weight: 700; margin-top: 4px;">💸 LOWEST FEE</div>` : ''}
        `;
      }
    },
    {
      label: 'Avg. Placement',
      fn: (c) => {
        if (!c.avg_placement_package) return 'N/A';
        const isBest = c.avg_placement_package === maxPlacements && colleges.length > 1;
        return `
          <span style="font-weight: 600;">${formatPlacement(c.avg_placement_package)}</span>
          ${isBest ? `<div style="font-size: 10px; color: var(--indigo); font-weight: 700; margin-top: 4px;">📈 HIGHEST AVG</div>` : ''}
        `;
      }
    },
    {
      label: 'Highest Placement',
      fn: (c) => {
        if (!c.highest_placement_package) return 'N/A';
        const isBest = c.highest_placement_package === maxHighestPlacements && colleges.length > 1;
        return `
          <span style="font-weight: 600;">${formatPlacement(c.highest_placement_package)}</span>
          ${isBest ? `<div style="font-size: 10px; color: var(--indigo); font-weight: 700; margin-top: 4px;">🚀 HIGHEST MAX</div>` : ''}
        `;
      }
    },
    {
      label: 'Hostel Facility',
      fn: (c) => (c.hostel_available === 1 || c.hostel_available === true) ? 'Yes' : 'No'
    },
    {
      label: 'Campus Size',
      fn: (c) => c.campus_size ? `${escapeHtml(c.campus_size)}` : 'N/A'
    },
    {
      label: 'Facilities',
      fn: (c) => {
        let facilities = [];
        if (c.facilities) {
          try {
            facilities = typeof c.facilities === 'string' ? JSON.parse(c.facilities) : c.facilities;
          } catch {
            facilities = c.facilities.split(',').map(f => f.trim()).filter(Boolean);
          }
        }
        if (!Array.isArray(facilities) || facilities.length === 0) return '—';
        return `
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${facilities.slice(0, 5).map(f => `<span style="font-size: 10.5px; padding: 2px 6px; border-radius: 4px; background: var(--surface-3); border: 1.5px solid var(--border-2);">${escapeHtml(f)}</span>`).join('')}
          </div>
        `;
      }
    },
    {
      label: 'Contact Info',
      fn: (c) => {
        let email = 'N/A';
        let phone = 'N/A';
        if (c.contacts && c.contacts.length > 0) {
          const emailContact = c.contacts.find(con => con.contact_type.toLowerCase().includes('email'));
          const phoneContact = c.contacts.find(con => con.contact_type.toLowerCase().includes('phone') || con.contact_type.toLowerCase().includes('mobile') || con.contact_type.toLowerCase().includes('call'));
          if (emailContact) email = emailContact.contact_value;
          if (phoneContact) phone = phoneContact.contact_value;
        }
        return `
          <div style="font-size: 12.5px; display: flex; flex-direction: column; gap: 4px; color: var(--text-2);">
            <div>📞 ${escapeHtml(phone)}</div>
            <div style="word-break: break-all;">✉️ ${escapeHtml(email)}</div>
          </div>
        `;
      }
    },
    {
      label: 'Official Website',
      fn: (c) => {
        if (!c.website) return 'N/A';
        const url = c.website.startsWith('http') ? c.website : `https://${c.website}`;
        return `<a href="${url}" target="_blank" style="color: var(--indigo); text-decoration: underline; font-weight: 600;">Visit Website ↗</a>`;
      }
    }
  ];

  // 3. Render
  container.innerHTML = fields.map(field => `
    <div class="compare-row" style="${field.isHeader ? 'align-items: flex-end; padding-bottom: 24px; border-bottom: 2px solid var(--border-2);' : ''}">
      <div class="compare-label" style="${field.isHeader ? 'padding-bottom: 30px;' : ''}">${field.label}</div>
      <div class="compare-values">
        ${colleges.map(c => `<div class="compare-value">${field.fn(c)}</div>`).join('')}
      </div>
    </div>
  `).join('');
}

// Global removal helper called from header close button
window.removeCollege = function(collegeId) {
  const urlParams = new URLSearchParams(window.location.search);
  const idsParam = urlParams.get('ids');
  if (!idsParam) return;

  const ids = idsParam.split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id) && id !== collegeId);

  // Sync back to local storage compare list
  try {
    let compareList = JSON.parse(localStorage.getItem('pk_compare') || '[]');
    compareList = compareList.filter(c => c.id !== collegeId);
    localStorage.setItem('pk_compare', JSON.stringify(compareList));
  } catch (e) {
    console.error(e);
  }

  if (ids.length > 0) {
    window.location.href = `compare.html?ids=${ids.join(',')}`;
  } else {
    window.location.href = '/';
  }
};

document.addEventListener('DOMContentLoaded', initComparison);
