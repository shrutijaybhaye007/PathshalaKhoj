(function() {
const API_BASE = '/api';

// Enforce Auth
const token = localStorage.getItem('pk_token');
const sessionId = localStorage.getItem('pk_session_id') || 'guest';

if (!token) {
  window.location.href = '/?login=true';
}

// ── Toast notification utility (dashboard-local since app.js isn't loaded here) ──
function showToast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span class="toast-msg">${message}</span><button class="toast-close" aria-label="Dismiss">✕</button>`;
  toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, duration);
}

// ── Recently Viewed Tracker ──────────────────────────────────────────────────
function trackRecentlyViewed(college) {
  try {
    let recent = JSON.parse(localStorage.getItem('pk_recently_viewed') || '[]');
    recent = recent.filter(c => c.id !== college.id);
    recent.unshift({ id: college.id, name: college.name, city: college.city, state: college.state, stream: college.stream });
    if (recent.length > 10) recent.pop();
    localStorage.setItem('pk_recently_viewed', JSON.stringify(recent));
  } catch(e) {}
}
function getRecentlyViewed() {
  try { return JSON.parse(localStorage.getItem('pk_recently_viewed') || '[]'); } catch(e) { return []; }
}

// DOM Elements
const el = {
  welcomeName: document.getElementById('dashWelcomeName'),
  profileAvatar: document.getElementById('dashProfileAvatar'),
  profileName: document.getElementById('dashProfileName'),
  profileEmail: document.getElementById('dashProfileEmail'),
  profileRole: document.getElementById('dashProfileRole'),
  shortlistGrid: document.getElementById('dashShortlistGrid'),
  tabs: document.querySelectorAll('.tab-link'),
  sections: document.querySelectorAll('.content-section'),
};

// Global state
let currentUser = null;
let shortlistedColleges = [];

function calculateChance(user, college) {
  if (!user) return null;
  let boardScore = user.board_percentage || 60;
  let baseChance = 50;

  const stream = (college.stream || '').toLowerCase();
  const nirf = college.nirf_ranking || 150;

  if (stream === 'engineering') {
    if (user.jee_rank) {
      const rank = user.jee_rank;
      let targetRank = 150000;
      if (nirf <= 15) targetRank = 10000;
      else if (nirf <= 50) targetRank = 35000;
      else if (nirf <= 100) targetRank = 75000;

      if (rank <= targetRank) {
        baseChance = 80 + Math.min(18, Math.floor((targetRank - rank) / targetRank * 20));
      } else {
        baseChance = Math.max(30, 80 - Math.floor((rank - targetRank) / targetRank * 40));
      }
    } else {
      let reqBoard = 60;
      if (nirf <= 15) reqBoard = 93;
      else if (nirf <= 50) reqBoard = 83;
      else if (nirf <= 100) reqBoard = 73;

      if (boardScore >= reqBoard) {
        baseChance = 75 + Math.min(23, (boardScore - reqBoard) * 2);
      } else {
        baseChance = Math.max(35, 75 - (reqBoard - boardScore) * 3);
      }
    }
  } 
  else if (stream === 'medical') {
    if (user.neet_rank) {
      const rank = user.neet_rank;
      let targetRank = 50000;
      if (nirf <= 15) targetRank = 3000;
      else if (nirf <= 50) targetRank = 12000;
      else if (nirf <= 100) targetRank = 25000;

      if (rank <= targetRank) {
        baseChance = 82 + Math.min(16, Math.floor((targetRank - rank) / targetRank * 15));
      } else {
        baseChance = Math.max(25, 80 - Math.floor((rank - targetRank) / targetRank * 50));
      }
    } else {
      let reqBoard = 65;
      if (nirf <= 15) reqBoard = 95;
      else if (nirf <= 50) reqBoard = 85;
      else if (nirf <= 100) reqBoard = 75;

      if (boardScore >= reqBoard) {
        baseChance = 72 + Math.min(26, (boardScore - reqBoard) * 2);
      } else {
        baseChance = Math.max(30, 72 - (reqBoard - boardScore) * 3);
      }
    }
  }
  else if (stream === 'management') {
    if (user.cat_percentile) {
      const cat = user.cat_percentile;
      let reqCat = 65;
      if (nirf <= 15) reqCat = 95;
      else if (nirf <= 50) reqCat = 88;
      else if (nirf <= 100) reqCat = 78;

      if (cat >= reqCat) {
        baseChance = 78 + Math.min(20, (cat - reqCat) * 1.5);
      } else {
        baseChance = Math.max(30, 78 - (reqCat - cat) * 4);
      }
    } else {
      let reqBoard = 60;
      if (nirf <= 15) reqBoard = 90;
      else if (nirf <= 50) reqBoard = 80;
      else if (nirf <= 100) reqBoard = 70;

      if (boardScore >= reqBoard) {
        baseChance = 75 + Math.min(23, (boardScore - reqBoard) * 2);
      } else {
        baseChance = Math.max(35, 75 - (reqBoard - boardScore) * 3);
      }
    }
  }
  else {
    let reqBoard = 55;
    if (nirf <= 15) reqBoard = 92;
    else if (nirf <= 50) reqBoard = 80;
    else if (nirf <= 100) reqBoard = 70;

    if (boardScore >= reqBoard) {
      baseChance = 80 + Math.min(18, (boardScore - reqBoard) * 1.5);
    } else {
      baseChance = Math.max(40, 80 - (reqBoard - boardScore) * 2);
    }
  }
  return baseChance;
}

function initAcademicProfile() {
  const form = document.getElementById('academicProfileForm');
  const streamSelect = document.getElementById('acadStream');
  const jeeGroup = document.getElementById('jeeGroup');
  const neetGroup = document.getElementById('neetGroup');
  const catGroup = document.getElementById('catGroup');

  if (!form) return;

  function toggleGroups(stream) {
    jeeGroup.style.display = stream === 'Science' ? 'flex' : 'none';
    neetGroup.style.display = stream === 'Science' ? 'flex' : 'none';
    catGroup.style.display = stream === 'Commerce' ? 'flex' : 'none';
  }

  streamSelect.addEventListener('change', (e) => {
    toggleGroups(e.target.value);
  });

  if (currentUser) {
    streamSelect.value = currentUser.academic_stream || '';
    toggleGroups(currentUser.academic_stream);

    document.getElementById('acadJeeRank').value = currentUser.jee_rank || '';
    document.getElementById('acadNeetRank').value = currentUser.neet_rank || '';
    document.getElementById('acadCatPercentile').value = currentUser.cat_percentile || '';
    document.getElementById('acadBoardPercentage').value = currentUser.board_percentage || '';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('saveAcadProfileBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const data = {
      name: currentUser.name,
      academic_stream: streamSelect.value || null,
      jee_rank: document.getElementById('acadJeeRank').value ? parseInt(document.getElementById('acadJeeRank').value) : null,
      neet_rank: document.getElementById('acadNeetRank').value ? parseInt(document.getElementById('acadNeetRank').value) : null,
      cat_percentile: document.getElementById('acadCatPercentile').value ? parseFloat(document.getElementById('acadCatPercentile').value) : null,
      board_percentage: document.getElementById('acadBoardPercentage').value ? parseFloat(document.getElementById('acadBoardPercentage').value) : null
    };

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        currentUser = json.user;
        showToast('Academic profile saved! 🎓', 'success');
        
        const statAcademicStream = document.getElementById('statAcademicStream');
        const statBoardScore = document.getElementById('statBoardScore');
        if (statAcademicStream) {
          statAcademicStream.textContent = currentUser.academic_stream || 'Not Set';
        }
        if (statBoardScore) {
          statBoardScore.textContent = currentUser.board_percentage ? `${currentUser.board_percentage}%` : 'N/A';
        }
        renderShortlist();
        loadRecommendations();
      } else {
        const errJson = await res.json();
        showToast(errJson.error || 'Failed to save academic profile.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Network error saving profile.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Profile';
    }
  });
}

async function loadRecommendations() {
  const grid = document.getElementById('dashRecommendationsGrid');
  if (!grid) return;

  let streamFilter = '';
  if (currentUser && currentUser.academic_stream) {
    if (currentUser.academic_stream === 'Science') streamFilter = 'Engineering';
    else if (currentUser.academic_stream === 'Commerce') streamFilter = 'Management';
    else if (currentUser.academic_stream === 'Arts') streamFilter = 'Law';
  }

  try {
    const url = streamFilter ? `${API_BASE}/colleges?limit=3&stream=${streamFilter}` : `${API_BASE}/colleges?limit=3`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    const json = await res.json();
    const colleges = json.colleges || json.data || [];

    if (colleges.length === 0) {
      grid.innerHTML = '<p class="text-2" style="grid-column: 1 / -1; padding: 24px; text-align: center;">No recommendations available.</p>';
      return;
    }

    grid.innerHTML = '';
    colleges.forEach(col => {
      const card = document.createElement('div');
      card.className = 'dash-shortlist-card glass-card fade-in';
      
      let chanceHtml = '';
      if (currentUser) {
        const chance = calculateChance(currentUser, col);
        if (chance != null) {
          let colorClass = 'var(--rose)';
          let label = 'Reach';
          if (chance >= 75) {
            colorClass = 'var(--sage)';
            label = 'Safe';
          } else if (chance >= 50) {
            colorClass = 'var(--gold)';
            label = 'Target';
          }
          chanceHtml = `
            <div class="admission-probability-container" style="margin-top: 14px; padding: 8px 12px; border-radius: var(--radius-sm); background: rgba(0, 0, 0, 0.02); border-left: 3px solid ${colorClass}; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 11px; font-weight: 600; color: var(--text-2);">Admission Chance:</span>
              <span style="font-size: 12px; font-weight: 800; color: ${colorClass};">${chance}% (${label})</span>
            </div>
          `;
        }
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h3 style="margin: 0 0 4px; font-size: 17px; line-height: 1.3;">${col.name}</h3>
            <p class="text-2" style="margin: 0 0 12px; font-size: 13.5px;">📍 ${col.city}, ${col.state}</p>
            <div style="display:flex; gap:8px;">
              <span class="status-badge neutral" style="font-size: 9px; padding: 2px 6px;">${col.college_type}</span>
              <span class="stream-badge" style="font-size: 9px; padding: 2px 6px;">${col.stream}</span>
            </div>
          </div>
        </div>
        ${chanceHtml}
        <div style="margin-top: 16px;">
          <a href="college.html?id=${col.id}" class="btn btn-outline" style="width: 100%; font-size: 13px; padding: 8px;">Explore Options</a>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Failed to load recommendations:', err);
    grid.innerHTML = '<p class="text-2" style="grid-column: 1 / -1; padding: 24px; text-align: center;">Failed to load recommendations.</p>';
  }
}

async function initDashboard() {
  await fetchUser();
  await fetchShortlist();
  await fetchApplications();
  initAcademicProfile();
  loadRecommendations();
  
  // Setup tabs
  el.tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      el.tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const targetId = tab.getAttribute('href').substring(1);
      el.sections.forEach(sec => {
        sec.style.display = sec.id === targetId ? 'block' : 'none';
      });
    });
  });
}


async function fetchUser() {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Not logged in');
    const data = await res.json();
    currentUser = data.user;
    
    // Update UI
    const name = currentUser.name || 'Student';
    el.welcomeName.textContent = name;
    el.profileName.textContent = name;
    if (currentUser.email) {
      el.profileEmail.textContent = currentUser.email;
      const dropEmail = document.getElementById('dropdownUserEmail');
      if (dropEmail) dropEmail.textContent = currentUser.email;
    }
    
    if (currentUser.picture) {
      el.profileAvatar.src = currentUser.picture;
      el.profileAvatar.style.display = 'block';
    }
    const roleText = currentUser.role === 'admin' ? 'Administrator' : 'Student';
    el.profileRole.textContent = roleText;
    const dropRole = document.getElementById('dropdownUserRole');
    if (dropRole) dropRole.textContent = roleText;

    // ── Member Since — pull from real created_at ──────────────────────────
    const memberSinceEl = document.getElementById('dashMemberSince');
    if (memberSinceEl && currentUser.created_at) {
      const date = new Date(currentUser.created_at);
      memberSinceEl.textContent = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }

    const statAcademicStream = document.getElementById('statAcademicStream');
    const statBoardScore = document.getElementById('statBoardScore');
    if (statAcademicStream) {
      statAcademicStream.textContent = currentUser.academic_stream || 'Not Set';
    }
    if (statBoardScore) {
      statBoardScore.textContent = currentUser.board_percentage ? `${currentUser.board_percentage}%` : 'N/A';
    }

    // ── Render Recently Viewed widget ─────────────────────────────────────
    renderRecentlyViewed();
    
  } catch (err) {
    console.error('Failed to authenticate:', err);
    localStorage.removeItem('pk_token');
    window.location.href = '/?login=true';
  }
}

// --- COMPARE LOGIC ---
const selectedForCompare = new Set();
const dashCompareBtn = document.getElementById('dashCompareBtn');
const compareOverlay = document.getElementById('compareOverlay');
const compareContent = document.getElementById('compareContent');
const compareCloseBtn = document.getElementById('compareCloseBtn');

const currency = (n) =>
  n == null ? 'N/A' : `₹${Number(n).toLocaleString('en-IN')}`;

const escapeHtml = (str) =>
  str == null
    ? ''
    : String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

if (dashCompareBtn) {
  dashCompareBtn.addEventListener('click', openCompareModal);
}
if (compareCloseBtn) {
  compareCloseBtn.addEventListener('click', closeCompareModal);
}
if (compareOverlay) {
  compareOverlay.addEventListener('click', (e) => {
    if (e.target === compareOverlay) closeCompareModal();
  });
}

function updateCompareBtnState() {
  if (!dashCompareBtn) return;
  dashCompareBtn.disabled = selectedForCompare.size < 2;
  dashCompareBtn.textContent = `Compare Selected (${selectedForCompare.size})`;
}

async function openCompareModal() {
  if (selectedForCompare.size < 2) return;
  compareOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  compareContent.innerHTML = '<div class="loader" style="margin: 40px auto;"><div class="loader-ring"></div><div class="loader-ring"></div></div>';
  compareCloseBtn.focus();

  try {
    const ids = [...selectedForCompare].slice(0, 4); // max 4 colleges
    const data = await Promise.all(
      ids.map((id) => fetch(`${API_BASE}/colleges/${id}`).then((r) => r.json()))
    );
    renderCompareTable(data);
  } catch (err) {
    console.error(err);
    compareContent.innerHTML = '<p style="padding:24px; text-align: center;">Could not load comparison data.</p>';
  }
}

function closeCompareModal() {
  compareOverlay.hidden = true;
  document.body.style.overflow = '';
}

function renderCompareTable(colleges) {
  const validFees = colleges.map(c => c.avg_fees_per_year).filter(f => f > 0);
  const minFees = validFees.length ? Math.min(...validFees) : null;

  const validNirf = colleges.map(c => c.nirf_ranking).filter(n => n > 0);
  const bestNirf = validNirf.length ? Math.min(...validNirf) : null;

  const validPlacements = colleges.map(c => c.avg_placement_package).filter(p => p > 0);
  const maxPlacements = validPlacements.length ? Math.max(...validPlacements) : null;

  const validHighestPlacements = colleges.map(c => c.highest_placement_package).filter(p => p > 0);
  const maxHighestPlacements = validHighestPlacements.length ? Math.max(...validHighestPlacements) : null;

  const fields = [
    { label: 'Stream',        fn: (c) => escapeHtml(c.stream) },
    { label: 'Type',          fn: (c) => escapeHtml(c.college_type) },
    { label: 'Affiliation',   fn: (c) => escapeHtml(c.affiliation || '—') },
    { label: 'NAAC Grade',    fn: (c) => c.naac_grade ? `<strong>${escapeHtml(c.naac_grade)}</strong>` : '—' },
    { label: 'Est. Year',     fn: (c) => c.established_year || '—' },
    { 
      label: 'NIRF Rank',     
      fn: (c) => {
        if (!c.nirf_ranking) return '—';
        const isBest = c.nirf_ranking === bestNirf && colleges.length > 1;
        return `<span class="compare-badge-wrapper">${c.nirf_ranking} ${isBest ? '<span class="winner-tag tag-gold"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg> Best Rank</span>' : ''}</span>`;
      } 
    },
    { 
      label: 'Avg Fees / yr',   
      fn: (c) => {
        if (c.avg_fees_per_year == null) return '—';
        const isBest = c.avg_fees_per_year === minFees && colleges.length > 1 && c.avg_fees_per_year > 0;
        return `<span class="compare-badge-wrapper compare-highlight">${currency(c.avg_fees_per_year)} ${isBest ? '<span class="winner-tag tag-green">💸 Lowest Fee</span>' : ''}</span>`;
      } 
    },
    { 
      label: 'Avg Placement', 
      fn: (c) => {
        if (!c.avg_placement_package) return '—';
        const isBest = c.avg_placement_package === maxPlacements && colleges.length > 1;
        return `<span class="compare-badge-wrapper">${c.avg_placement_package} LPA ${isBest ? '<span class="winner-tag tag-indigo"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px; vertical-align: -2px;"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg> Highest Avg</span>' : ''}</span>`;
      } 
    },
    { 
      label: 'Highest Placement', 
      fn: (c) => {
        if (!c.highest_placement_package) return '—';
        const isBest = c.highest_placement_package === maxHighestPlacements && colleges.length > 1;
        return `<span class="compare-badge-wrapper">${c.highest_placement_package} LPA ${isBest ? '<span class="winner-tag tag-indigo">🚀 Highest Max</span>' : ''}</span>`;
      } 
    },
    { label: 'Courses',       fn: (c) => c.total_courses },
    { label: 'Top Courses',   fn: (c) => c.courses.slice(0, 3).map((co) => `<div style="margin-bottom:3px">· ${escapeHtml(co.name)}</div>`).join('') },
    { label: 'Entrance Exams',fn: (c) => [...new Set(c.courses.map((co) => co.entrance_exam).filter(Boolean))].slice(0, 4).join(', ') || '—' },
  ];

  const headerCells = [
    '<th>Field</th>', 
    ...colleges.map((c) => `
      <th>
        <div class="compare-col-header">
          <span class="compare-col-stream">${escapeHtml(c.stream)}</span>
          <div class="compare-col-name">${escapeHtml(c.name)}</div>
          <div class="compare-col-location">📍 ${escapeHtml(c.city)}, ${escapeHtml(c.state)}</div>
        </div>
      </th>
    `)
  ].join('');

  const rows = fields.map(({ label, fn }) => {
    const cells = colleges.map((c) => `<td>${fn(c)}</td>`).join('');
    return `<tr><td class="compare-field-label">${label}</td>${cells}</tr>`;
  }).join('');

  compareContent.innerHTML = `
    <table class="compare-table">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

async function fetchShortlist() {
  try {
    const res = await fetch(`${API_BASE}/shortlist/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch shortlist');
    const json = await res.json();
    shortlistedColleges = json.data || [];
    renderShortlist();
  } catch (err) {
    console.error(err);
    el.shortlistGrid.innerHTML = '<p class="text-2">Error loading your shortlist.</p>';
  }
}

function renderShortlist() {
  const statShortlistedCount = document.getElementById('statShortlistedCount');
  if (statShortlistedCount) {
    statShortlistedCount.textContent = shortlistedColleges.length;
  }

  // Profile Setup Banner check
  const profileBannerContainer = document.getElementById('dashProfileBannerContainer');
  if (profileBannerContainer) {
    if (!currentUser || !currentUser.board_percentage) {
      profileBannerContainer.innerHTML = `
        <div class="glass-card" style="padding: 20px; background: rgba(79, 70, 229, 0.05); border: 1.5px dashed var(--indigo); border-radius: var(--radius-sm); margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 250px;">
            <h4 style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: var(--indigo);">Complete Your Academic Profile</h4>
            <p style="margin: 0; font-size: 13px; color: var(--text-2); line-height: 1.4;">Set your 12th Board percentage and entrance ranks to calculate real-time admission match scores (Safe, Target, or Reach) for all colleges!</p>
          </div>
          <button onclick="window.switchTab('settings')" class="btn btn-primary" style="padding: 8px 16px; font-size: 13px; background: var(--indigo); border-color: var(--indigo); color: #fff;">Setup Now</button>
        </div>
      `;
    } else {
      profileBannerContainer.innerHTML = '';
    }
  }

  if (shortlistedColleges.length === 0) {
    if (dashCompareBtn) dashCompareBtn.style.display = 'none';
    el.shortlistGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg></span>
        <h3 class="empty-state-title">Your shortlist is empty</h3>
        <p class="empty-state-sub">Browse colleges and click the bookmark icon to add them here.</p>
        <a href="/" class="btn btn-primary">Find Colleges</a>
      </div>
    `;
    return;
  }

  if (dashCompareBtn) {
    dashCompareBtn.style.display = shortlistedColleges.length >= 2 ? 'flex' : 'none';
    updateCompareBtnState();
  }

  el.shortlistGrid.innerHTML = '';
  shortlistedColleges.forEach(col => {
    const card = document.createElement('div');
    card.className = 'dash-shortlist-card glass-card fade-in';

    let chanceHtml = '';
    if (currentUser) {
      const chance = calculateChance(currentUser, col);
      if (chance != null) {
        let colorClass = 'var(--rose)';
        let label = 'Reach';
        if (chance >= 75) {
          colorClass = 'var(--sage)';
          label = 'Safe';
        } else if (chance >= 50) {
          colorClass = 'var(--gold)';
          label = 'Target';
        }
        chanceHtml = `
          <div class="admission-probability-container" style="margin-top: 14px; padding: 8px 12px; border-radius: var(--radius-sm); background: rgba(0, 0, 0, 0.02); border-left: 3px solid ${colorClass}; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 600; color: var(--text-2);">Admission Chance:</span>
            <span style="font-size: 13px; font-weight: 800; color: ${colorClass};">${chance}% (${label})</span>
          </div>
        `;
      }
    }

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-2);">
            <input type="checkbox" class="compare-select-checkbox" data-id="${col.id}" ${selectedForCompare.has(col.id) ? 'checked' : ''} style="accent-color: var(--gold); cursor: pointer;" />
            Select to Compare
          </label>
          <h3 style="margin: 0 0 4px; font-size: 18px;">${col.name}</h3>
          <p class="text-2" style="margin: 0 0 12px; font-size: 14px;">${col.city}, ${col.state}</p>
          <div style="display:flex; gap:8px;">
            <span class="status-badge neutral">${col.college_type}</span>
            <span class="stream-badge">${col.stream}</span>
          </div>
        </div>
        <button class="btn-icon" title="Remove" onclick="removeFromShortlist(${col.id})">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
      ${chanceHtml}
      <div style="margin-top: 16px;">
        <a href="college.html?id=${col.id}" class="btn btn-outline" style="width: 100%;">View Full Profile</a>
      </div>
    `;
    el.shortlistGrid.appendChild(card);
  });

  // Attach change listeners to checkboxes
  el.shortlistGrid.querySelectorAll('.compare-select-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = parseInt(cb.getAttribute('data-id'));
      if (cb.checked) {
        if (selectedForCompare.size >= 4) {
          cb.checked = false;
          showToast('You can compare up to 4 colleges at a time.', 'warning');
          return;
        }
        selectedForCompare.add(id);
      } else {
        selectedForCompare.delete(id);
      }
      updateCompareBtnState();
    });
  });
}

window.removeFromShortlist = async function(collegeId) {
  try {
    await fetch(`${API_BASE}/shortlist/${sessionId}/${collegeId}`, { method: 'DELETE' });
    shortlistedColleges = shortlistedColleges.filter(c => c.id !== collegeId);
    selectedForCompare.delete(collegeId);
    renderShortlist();
  } catch(err) {
    console.error('Failed to remove:', err);
  }
};

let myApplications = [];

async function fetchApplications() {
  try {
    const res = await fetch(`${API_BASE}/applications/${sessionId}`);
    if (!res.ok) throw new Error('Failed to fetch applications');
    const json = await res.json();
    myApplications = json.data || [];
    renderApplications();
  } catch (err) {
    console.error(err);
    document.getElementById('dashApplicationsGrid').innerHTML = '<p class="text-2">Error loading your applications.</p>';
  }
}

function renderApplications() {
  const statApplicationsCount = document.getElementById('statApplicationsCount');
  if (statApplicationsCount) {
    statApplicationsCount.textContent = myApplications.length;
  }

  const grid = document.getElementById('dashApplicationsGrid');
  if (myApplications.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></span>
        <h3 class="empty-state-title">No Applications Yet</h3>
        <p class="empty-state-sub">You haven't applied to any colleges using One-Click Apply.</p>
        <a href="/" class="btn btn-primary">Find Colleges to Apply</a>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = '';
  myApplications.forEach(app => {
    const card = document.createElement('div');
    card.className = 'dash-shortlist-card glass-card fade-in';
    
    let statusClass = 'neutral';
    if (app.status === 'Accepted') statusClass = 'success';
    if (app.status === 'Under Review') statusClass = 'warning';
    if (app.status === 'Rejected') statusClass = 'error';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <h3 style="margin: 0 0 4px; font-size: 18px;">${app.name}</h3>
          <p class="text-2" style="margin: 0 0 12px; font-size: 14px;">${app.city}, ${app.state}</p>
          <div style="display:flex; gap:8px;">
            <span class="status-badge ${statusClass}">${app.status}</span>
            <span class="stream-badge">${app.stream}</span>
          </div>
        </div>
  `;
    grid.appendChild(card);
  });
}

// ─── Recently Viewed Section ─────────────────────────────────────────────────
function renderRecentlyViewed() {
  const container = document.getElementById('recentlyViewedSection');
  if (!container) return;
  const recent = getRecentlyViewed();
  if (!recent.length) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';
  const list = document.getElementById('recentlyViewedList');
  if (!list) return;
  list.innerHTML = recent.slice(0, 6).map(c => `
    <a href="college.html?id=${c.id}" class="recently-viewed-chip" onclick="trackRecentlyViewedFromLink(${c.id})">
      <span class="rv-stream">${c.stream || '📚'}</span>
      <span class="rv-name">${c.name}</span>
      <span class="rv-loc text-2">${c.city}, ${c.state}</span>
    </a>
  `).join('');
}

// ─── Notification Bell ───────────────────────────────────────────────────────
function initNotificationBell() {
  const bell = document.getElementById('dashNotifBell');
  const panel = document.getElementById('dashNotifPanel');
  const badge = document.getElementById('dashNotifBadge');
  if (!bell || !panel) return;

  // Load notifications from localStorage (client-side inbox)
  function getNotifs() {
    try { return JSON.parse(localStorage.getItem('pk_notifications') || '[]'); } catch(e) { return []; }
  }
  function saveNotifs(notifs) {
    localStorage.setItem('pk_notifications', JSON.stringify(notifs));
  }

  function renderNotifPanel() {
    const notifs = getNotifs();
    const unread = notifs.filter(n => !n.read).length;
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
    panel.innerHTML = notifs.length === 0
      ? '<div class="notif-empty">🎉 You\'re all caught up!</div>'
      : notifs.slice(0, 10).map(n => `
          <div class="notif-item ${n.read ? '' : 'notif-unread'}" data-id="${n.id}">
            <span class="notif-icon">${n.icon || '🔔'}</span>
            <div class="notif-body">
              <div class="notif-text">${n.message}</div>
              <div class="notif-time text-2">${new Date(n.time).toLocaleString('en-IN', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
            </div>
          </div>`).join('');

    // Mark all as read on open
    const updated = notifs.map(n => ({...n, read: true}));
    saveNotifs(updated);
    badge.style.display = 'none';
  }

  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = panel.classList.toggle('open');
    if (open) renderNotifPanel();
  });
  document.addEventListener('click', (e) => {
    if (!bell.contains(e.target) && !panel.contains(e.target)) panel.classList.remove('open');
  });

  // Show initial unread badge count
  const unread = getNotifs().filter(n => !n.read).length;
  badge.textContent = unread;
  badge.style.display = unread > 0 ? 'flex' : 'none';

  // Expose globally so other parts can push notifications
  window.pushNotification = function(message, icon = '🔔') {
    const notifs = getNotifs();
    notifs.unshift({ id: Date.now(), message, icon, time: new Date().toISOString(), read: false });
    if (notifs.length > 50) notifs.pop();
    saveNotifs(notifs);
    const count = notifs.filter(n => !n.read).length;
    badge.textContent = count;
    badge.style.display = 'flex';
  };
}

initDashboard();
initNotificationBell();

window.switchTab = function(targetId) {
  const tabBtn = Array.from(el.tabs).find(t => t.getAttribute('href') === `#${targetId}`);
  if (tabBtn) tabBtn.click();
};

// ─── Admin Sync & Live Stats ─────────────────────────────────────────────────

/**
 * Fetches live coverage stats from API and populates the admin metrics
 * and the Data Sync panel coverage bars.
 */
async function loadAdminCoverageStats() {
  try {
    // Fetch total count for the metrics header
    const countRes = await fetch(`${API_BASE}/colleges?limit=1`);
    if (countRes.ok) {
      const countData = await countRes.json();
      const totalEl = document.getElementById('adminTotalColleges');
      if (totalEl && countData.pagination) {
        totalEl.textContent = countData.pagination.total.toLocaleString('en-IN');
      }
    }

    // Fetch coverage breakdown
    const covRes = await fetch(`${API_BASE}/colleges/sync-coverage`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pk_token')}` }
    });
    if (!covRes.ok) return;
    const cov = await covRes.json();

    // Update metrics cards
    const descEl = document.getElementById('adminDescCount');
    const webEl  = document.getElementById('adminWebsiteCount');
    if (descEl && cov.coverage) descEl.textContent = `${cov.coverage.descriptions.count.toLocaleString('en-IN')} (${cov.coverage.descriptions.pct}%)`;
    if (webEl  && cov.coverage) webEl.textContent  = `${cov.coverage.websites.count.toLocaleString('en-IN')} (${cov.coverage.websites.pct}%)`;

    // Update sync panel bars
    if (cov.coverage) {
      const setBar = (pctId, barId, pct) => {
        const pctEl = document.getElementById(pctId);
        const barEl = document.getElementById(barId);
        if (pctEl) pctEl.textContent = `${pct}%`;
        if (barEl) barEl.style.width = `${pct}%`;
      };
      setBar('covDescPct', 'covDescBar', cov.coverage.descriptions.pct);
      setBar('covLogoPct', 'covLogoBar', cov.coverage.logos.pct);
      setBar('covWebPct',  'covWebBar',  cov.coverage.websites.pct);
      setBar('covNaacPct', 'covNaacBar', cov.coverage.naac_grades.pct);
    }
  } catch (err) {
    console.debug('Failed to load admin coverage stats:', err.message);
  }
}

/**
 * initAdminSyncPanel()
 * Wires up the Data Sync tab and all its interactive controls.
 */
function initAdminSyncPanel() {
  const tabSync  = document.getElementById('adminTabSync');
  const tabCols  = document.getElementById('adminTabColleges');
  const tabExams = document.getElementById('adminTabExams');
  const syncPanel = document.getElementById('adminSyncPanel');
  const listPanel = document.getElementById('adminListPanel');
  const examsPanel = document.getElementById('adminExamsListPanel');

  if (!tabSync || !syncPanel) return;

  // Tab switching to include new Data Sync tab
  tabSync.addEventListener('click', () => {
    tabSync.classList.add('active');
    tabCols.classList.remove('active');
    tabExams.classList.remove('active');
    syncPanel.removeAttribute('hidden');
    listPanel.setAttribute('hidden', '');
    if (examsPanel) examsPanel.setAttribute('hidden', '');
    const formPanel = document.getElementById('adminFormPanel');
    const examFormPanel = document.getElementById('adminExamFormPanel');
    if (formPanel) formPanel.setAttribute('hidden', '');
    if (examFormPanel) examFormPanel.setAttribute('hidden', '');
    // Hide action buttons not relevant to sync tab
    const createBtn = document.getElementById('adminCreateNewBtn');
    const createExamBtn = document.getElementById('adminCreateNewExamBtn');
    const syncDataBtn = document.getElementById('adminSyncDataBtn');
    if (createBtn) createBtn.style.display = 'none';
    if (createExamBtn) createExamBtn.style.display = 'none';
    if (syncDataBtn) syncDataBtn.style.display = 'none';
    // Load fresh coverage stats
    loadAdminCoverageStats();
  });

  // Re-show create button when switching back to colleges tab
  tabCols.addEventListener('click', () => {
    syncPanel.setAttribute('hidden', '');
    const createBtn = document.getElementById('adminCreateNewBtn');
    const syncDataBtn = document.getElementById('adminSyncDataBtn');
    if (createBtn) createBtn.style.display = '';
    if (syncDataBtn) syncDataBtn.style.display = 'flex';
  });
  tabExams.addEventListener('click', () => {
    syncPanel.setAttribute('hidden', '');
    const createBtn = document.getElementById('adminCreateNewBtn');
    const syncDataBtn = document.getElementById('adminSyncDataBtn');
    if (createBtn) createBtn.style.display = 'none';
    if (syncDataBtn) syncDataBtn.style.display = 'none';
  });

  // Refresh coverage stats button
  const refreshBtn = document.getElementById('adminRefreshCoverageBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
      loadAdminCoverageStats().finally(() => {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.26l5.58 5.58"/></svg> Refresh Coverage Stats`;
      });
    });
  }

  // Batch sync state
  let batchSyncRunning = false;
  let batchSyncAbort   = false;
  let globalSynced = 0, globalMissed = 0, globalErrors = 0, globalTotal = 0;

  const progressContainer = document.getElementById('adminSyncProgressContainer');
  const progressBar       = document.getElementById('adminSyncProgressBar');
  const progressLabel     = document.getElementById('adminSyncProgressLabel');
  const progressPct       = document.getElementById('adminSyncProgressPct');
  const logEl             = document.getElementById('adminSyncLog');
  const syncedEl          = document.getElementById('adminSyncCountSynced');
  const missedEl          = document.getElementById('adminSyncCountMissed');
  const errorsEl          = document.getElementById('adminSyncCountErrors');
  const totalEl           = document.getElementById('adminSyncCountTotal');
  const batchSyncBtn      = document.getElementById('adminBatchSyncBtn');
  const batchSyncAllBtn   = document.getElementById('adminBatchSyncAllBtn');
  const stopBtn           = document.getElementById('adminBatchSyncStopBtn');
  const streamSelect      = document.getElementById('adminBatchSyncStream');

  function appendLog(text, color = 'var(--text-2)') {
    if (!logEl) return;
    logEl.style.display = 'block';
    const entry = document.createElement('div');
    entry.style.cssText = `color: ${color}; padding: 2px 0; border-bottom: 1px solid var(--border); line-height: 1.5;`;
    entry.textContent = `[${new Date().toLocaleTimeString('en-IN')}] ${text}`;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function updateProgressUI(processed, total) {
    const pct = total > 0 ? Math.round(processed / total * 100) : 0;
    if (progressBar) progressBar.style.width = `${pct}%`;
    if (progressPct) progressPct.textContent = `${pct}%`;
    if (progressLabel) progressLabel.textContent = `Processed ${processed} of ${total} colleges with missing data...`;
    if (syncedEl) syncedEl.textContent = globalSynced;
    if (missedEl) missedEl.textContent = globalMissed;
    if (errorsEl) errorsEl.textContent = globalErrors;
    if (totalEl)  totalEl.textContent  = globalTotal;
  }

  async function runBatch(offset, stream, autoAll = false) {
    batchSyncRunning = true;
    if (progressContainer) progressContainer.style.display = 'block';
    if (stopBtn) stopBtn.style.display = 'flex';
    if (batchSyncBtn) batchSyncBtn.disabled = true;
    if (batchSyncAllBtn) batchSyncAllBtn.disabled = true;

    try {
      const body = { batch_size: 10, offset, stream: stream || undefined };
      const res = await fetch(`${API_BASE}/colleges/sync-batch-wiki`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pk_token')}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        appendLog(`❌ API Error: ${err.error || res.status}`, 'var(--rose)');
        return null;
      }

      const data = await res.json();
      globalTotal = data.total_missing;

      // Log each result
      data.results.forEach(r => {
        if (r.status === 'synced') {
          globalSynced++;
          appendLog(`✅ ${r.name} — ${r.fields_updated} field(s) updated`, '#059669');
        } else if (r.status === 'not_found') {
          globalMissed++;
          appendLog(`⚠️  ${r.name} — Not found on Wikipedia`, '#b45309');
        } else {
          globalErrors++;
          appendLog(`❌ ${r.name} — Error: ${r.error || 'unknown'}`, 'var(--rose)');
        }
      });

      updateProgressUI(offset + data.batch_size, globalTotal);

      // Refresh coverage after each batch
      await loadAdminCoverageStats();

      return data;
    } catch (err) {
      appendLog(`❌ Network error: ${err.message}`, 'var(--rose)');
      return null;
    }
  }

  // Single batch button
  if (batchSyncBtn) {
    batchSyncBtn.addEventListener('click', async () => {
      if (batchSyncRunning) return;
      batchSyncAbort = false;
      globalSynced = 0; globalMissed = 0; globalErrors = 0; globalTotal = 0;
      const stream = streamSelect ? streamSelect.value : '';
      appendLog(`🚀 Starting single batch sync (stream: ${stream || 'All'})...`, 'var(--indigo)');
      await runBatch(0, stream, false);
      batchSyncRunning = false;
      if (batchSyncBtn) batchSyncBtn.disabled = false;
      if (batchSyncAllBtn) batchSyncAllBtn.disabled = false;
      if (stopBtn) stopBtn.style.display = 'none';
      appendLog('✔ Batch complete. Click again for next batch.', '#059669');
      showToast(`Batch sync done! ✅ ${globalSynced} synced, ⚠️ ${globalMissed} not found.`, 'success');
    });
  }

  // Auto-sync all missing button
  if (batchSyncAllBtn) {
    batchSyncAllBtn.addEventListener('click', async () => {
      if (batchSyncRunning) return;
      batchSyncAbort = false;
      batchSyncRunning = true;
      globalSynced = 0; globalMissed = 0; globalErrors = 0; globalTotal = 0;
      const stream = streamSelect ? streamSelect.value : '';
      appendLog(`🚀 Auto-syncing ALL missing colleges (stream: ${stream || 'All'})...`, 'var(--indigo)');

      let offset = 0;
      let hasMore = true;
      let batchCount = 0;

      while (hasMore && !batchSyncAbort) {
        const data = await runBatch(offset, stream, true);
        if (!data) break;

        hasMore = data.has_more;
        offset = data.next_offset;
        batchCount++;

        if (hasMore && !batchSyncAbort) {
          appendLog(`⏳ Batch ${batchCount} done. Waiting 2s before next batch...`, 'var(--text-3)');
          await new Promise(r => setTimeout(r, 2000)); // Pause between batches
        }
      }

      batchSyncRunning = false;
      if (batchSyncBtn) batchSyncBtn.disabled = false;
      if (batchSyncAllBtn) batchSyncAllBtn.disabled = false;
      if (stopBtn) stopBtn.style.display = 'none';

      if (batchSyncAbort) {
        appendLog('⏹ Auto-sync stopped by user.', '#b45309');
        showToast('Sync stopped.', 'warning');
      } else {
        appendLog(`🎉 All batches complete! Total: ✅ ${globalSynced} synced, ⚠️ ${globalMissed} not found, ❌ ${globalErrors} errors.`, '#059669');
        showToast(`Auto-sync complete! ✅ ${globalSynced} colleges enriched.`, 'success');
      }
    });
  }

  // Stop button
  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      batchSyncAbort = true;
      stopBtn.textContent = 'Stopping...';
    });
  }
}

/**
 * adminQuickSyncWiki(collegeId, collegeName, rowEl)
 * Called from each per-row sync button in the admin college table.
 * Syncs a single college's Wikipedia info and shows result inline.
 */
window.adminQuickSyncWiki = async function(collegeId, collegeName, btn) {
  btn.disabled = true;
  const origText = btn.innerHTML;
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 50 50" style="animation:spin 1s linear infinite; vertical-align:-2px;" fill="none" stroke="currentColor" stroke-width="5"><circle cx="25" cy="25" r="20"/></svg>`;

  try {
    const res = await fetch(`${API_BASE}/colleges/${collegeId}/sync-wiki`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('pk_token')}` }
    });
    const result = await res.json();
    if (res.ok) {
      btn.innerHTML = '✅';
      btn.style.color = '#059669';
      showToast(`✅ ${collegeName}: ${result.fields_updated || 0} field(s) synced from Wikipedia!`, 'success');
      // Update the data quality indicator in the row
      const dataCell = btn.closest('tr')?.querySelector('.admin-data-indicator');
      if (dataCell && result.description) {
        dataCell.innerHTML = '<span style="color:#059669; font-weight:700;">✓ Has Info</span>';
      }
    } else {
      btn.innerHTML = '⚠️';
      btn.title = result.error || 'Sync failed';
      showToast(result.error || `Could not sync "${collegeName}" from Wikipedia.`, 'warning');
    }
  } catch (err) {
    btn.innerHTML = '❌';
    showToast('Network error during sync.', 'error');
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.innerHTML = origText;
      btn.style.color = '';
    }, 3000);
  }
};

// Initialize admin panel when admin overlay opens
const adminPortalBtn = document.getElementById('dropdownAdminPortalBtn');
if (adminPortalBtn) {
  adminPortalBtn.addEventListener('click', () => {
    // Load live stats whenever admin panel is opened
    setTimeout(() => {
      loadAdminCoverageStats();
      initAdminSyncPanel();
    }, 100);
  }, { once: true }); // Only attach once
}

// Also init sync panel when admin overlay is already open via app.js
const adminOverlay = document.getElementById('adminOverlay');
if (adminOverlay) {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(m => {
      if (m.type === 'attributes' && m.attributeName === 'hidden') {
        if (!adminOverlay.hidden) {
          loadAdminCoverageStats();
          initAdminSyncPanel();
        }
      }
    });
  });
  observer.observe(adminOverlay, { attributes: true });
}

})();