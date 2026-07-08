/**
 * Pathshala Khoj — frontend application logic.
 * Vanilla JS, no build step. Talks to the Express API at /api/*.
 *
 * Features:
 *  - Debounced live search (400ms)
 *  - Stream + entrance exam quick-filter chips
 *  - Advanced filter panel toggle
 *  - URL state sync (shareable filtered URLs)
 *  - Focus trap in modals
 *  - Keyboard shortcut: press "/" to focus search
 *  - Staggered card entry animations
 *  - Shortlist with compare mode (side-by-side table)
 *  - Toast notifications for errors / actions
 *  - Dynamic hero stats from API
 */

const API_BASE = '/api';

// ─── Session ID for anonymous shortlist ────────────────────────────────────
function getSessionId() {
  let id = localStorage.getItem('pk_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('pk_session_id', id);
  }
  return id;
}
const SESSION_ID = getSessionId();

// ─── City quick-filter chips for Maharashtra ──────────────────────────────────
const CITY_CHIPS = [
  { label: '🏙️ Mumbai',  value: 'Mumbai' },
  { label: '🌿 Pune',    value: 'Pune' },
  { label: '🍇 Nashik',  value: 'Nashik' },
  { label: '🐯 Nagpur',  value: 'Nagpur' },
  { label: '🏯 Hyderabad', value: 'Hyderabad' },
  { label: '🌊 Chennai', value: 'Chennai' },
  { label: '🌆 Delhi',   value: 'New Delhi' },
  { label: '🌇 Bengaluru', value: 'Bengaluru' },
];

const EXAM_CHIPS = [
  { label: 'JEE', value: 'JEE' },
  { label: 'NEET', value: 'NEET' },
  { label: 'CAT', value: 'CAT' },
  { label: 'CLAT', value: 'CLAT' },
  { label: 'GATE', value: 'GATE' },
  { label: 'CUET', value: 'CUET' },
  { label: 'BITSAT', value: 'BITSAT' },
  { label: 'XAT', value: 'XAT' },
];

// ─── App state ──────────────────────────────────────────────────────────────
const getCompareList = () => {
  try {
    return JSON.parse(localStorage.getItem('pk_compare') || '[]');
  } catch {
    return [];
  }
};

const initialCompareList = getCompareList();

const state = {
  q:            '',
  stream:       '',
  exam:         '',
  city:         '',
  state_filter: '',
  type:         '',
  naac:         '',
  max_fees:     '',
  sort:         'name',
  page:         1,
  limit:        9,
  shortlistedIds: new Set(),
  compareList: initialCompareList,
  compareIds: new Set(initialCompareList.map(c => c.id)),
  openCollegeId: null,
};

// ─── DOM refs ───────────────────────────────────────────────────────────────
const el = {
  searchForm:         document.getElementById('searchForm'),
  searchInput:        document.getElementById('searchInput'),
  searchClearBtn:     document.getElementById('searchClearBtn'),
  autocompleteSuggestions: document.getElementById('autocompleteSuggestions'),
  timelineChain:      document.getElementById('timelineChain'),
  liveIndicator:      document.getElementById('liveIndicator'),
  streamChips:        document.getElementById('streamChips'),
  cityChipsRow:       document.getElementById('cityChipsRow'),
  examChipsRow:       document.getElementById('examChipsRow'),
  filtersToggleBtn:   document.getElementById('filtersToggleBtn'),
  filtersPanel:       document.getElementById('filtersPanel'),
  filterState:        document.getElementById('filterState'),
  filterCity:         document.getElementById('filterCity'),
  filterType:         document.getElementById('filterType'),
  filterNaac:         document.getElementById('filterNaac'),
  filterFees:         document.getElementById('filterFees'),
  filterSort:         document.getElementById('filterSort'),
  clearFiltersBtn:    document.getElementById('clearFiltersBtn'),
  resultsGrid:        document.getElementById('resultsGrid'),
  resultsHeading:     document.getElementById('resultsHeading'),
  resultsCount:       document.getElementById('resultsCount'),
  emptyState:         document.getElementById('emptyState'),
  emptyStateClearBtn: document.getElementById('emptyStateClearBtn'),
  loadingState:       document.getElementById('loadingState'),
  pagination:         document.getElementById('pagination'),
  detailOverlay:      document.getElementById('detailOverlay'),
  detailContent:      document.getElementById('detailContent'),
  detailCloseBtn:     document.getElementById('detailCloseBtn'),
  navShortlistBtn:    document.getElementById('navShortlistBtn'),
  navStatsText:       document.getElementById('navStatsText'),
  shortlistCount:     document.getElementById('shortlistCount'),
  shortlistOverlay:   document.getElementById('shortlistOverlay'),
  shortlistContent:   document.getElementById('shortlistContent'),
  shortlistCloseBtn:  document.getElementById('shortlistCloseBtn'),
  compareBtn:         document.getElementById('compareBtn'),
  compareOverlay:     document.getElementById('compareOverlay'),
  compareContent:     document.getElementById('compareContent'),
  compareCloseBtn:    document.getElementById('compareCloseBtn'),
  eyebrowText:        document.getElementById('eyebrowText'),
  srAnnounce:         document.getElementById('srAnnounce'),
  toastContainer:     document.getElementById('toastContainer'),
  siteHeader:         document.getElementById('siteHeader'),
  viewGrid:           document.getElementById('viewGrid'),
  themeToggleBtn:     document.getElementById('themeToggleBtn'),
  // Auth & Admin DOM Elements
  loginOverlay:            document.getElementById('loginOverlay'),
  loginCloseBtn:           document.getElementById('loginCloseBtn'),
  loginForm:               document.getElementById('loginForm'),
  loginEmail:              document.getElementById('loginEmail'),
  loginPassword:           document.getElementById('loginPassword'),
  tabLoginBtn:             document.getElementById('tabLoginBtn'),
  tabRegisterBtn:          document.getElementById('tabRegisterBtn'),
  registerForm:            document.getElementById('registerForm'),
  registerName:            document.getElementById('registerName'),
  registerEmail:           document.getElementById('registerEmail'),
  registerPassword:        document.getElementById('registerPassword'),
  openForgotPasswordBtn:   document.getElementById('openForgotPasswordBtn'),
  forgotPasswordOverlay:   document.getElementById('forgotPasswordOverlay'),
  forgotPasswordCloseBtn:  document.getElementById('forgotPasswordCloseBtn'),
  forgotPasswordForm:      document.getElementById('forgotPasswordForm'),
  forgotPasswordEmail:     document.getElementById('forgotPasswordEmail'),
  backToLoginBtn:          document.getElementById('backToLoginBtn'),
  resetPasswordOverlay:    document.getElementById('resetPasswordOverlay'),
  resetPasswordForm:       document.getElementById('resetPasswordForm'),
  resetPasswordToken:      document.getElementById('resetPasswordToken'),
  resetNewPassword:        document.getElementById('resetNewPassword'),
  googleSignInContainer:   document.getElementById('googleSignInContainer'),
  devBypassBtn:            document.getElementById('devBypassBtn'),
  navLoginBtn:             document.getElementById('navLoginBtn'),
  navUserPic:              document.getElementById('navUserPic'),
  navUserName:             document.getElementById('navUserName'),
  profileDropdownContainer: document.getElementById('profileDropdownContainer'),
  profileTriggerBtn:       document.getElementById('profileTriggerBtn'),
  profileDropdownCard:     document.getElementById('profileDropdownCard'),
  dropdownUserName:        document.getElementById('dropdownUserName'),
  dropdownUserEmail:       document.getElementById('dropdownUserEmail'),
  dropdownUserRole:        document.getElementById('dropdownUserRole'),
  dropdownEditProfileBtn:  document.getElementById('dropdownEditProfileBtn'),
  dropdownAdminPortalBtn:  document.getElementById('dropdownAdminPortalBtn'),
  dropdownLogoutBtn:       document.getElementById('dropdownLogoutBtn'),
  
  profileOverlay:          document.getElementById('profileOverlay'),
  profileCloseBtn:         document.getElementById('profileCloseBtn'),
  profileEditForm:         document.getElementById('profileEditForm'),
  profilePicPreview:       document.getElementById('profilePicPreview'),
  profileFormEmail:        document.getElementById('profileFormEmail'),
  profileFormName:         document.getElementById('profileFormName'),
  profileFormPicture:      document.getElementById('profileFormPicture'),
  profileLocalOnlySection: document.getElementById('profileLocalOnlySection'),
  profilePasswordChangeToggle: document.getElementById('profilePasswordChangeToggle'),
  profilePasswordSection:  document.getElementById('profilePasswordSection'),
  profileNewPassword:      document.getElementById('profileNewPassword'),
  profileConfirmNewPassword: document.getElementById('profileConfirmNewPassword'),
  profileFormCancelBtn:    document.getElementById('profileFormCancelBtn'),
  adminOverlay:            document.getElementById('adminOverlay'),
  adminCloseBtn:           document.getElementById('adminCloseBtn'),
  adminCreateNewBtn:       document.getElementById('adminCreateNewBtn'),
  adminSyncDataBtn:        document.getElementById('adminSyncDataBtn'),
  adminListPanel:          document.getElementById('adminListPanel'),
  adminFormPanel:          document.getElementById('adminFormPanel'),
  adminCollegeTableBody:   document.getElementById('adminCollegeTableBody'),
  collegeEditForm:         document.getElementById('collegeEditForm'),
  adminFormTitle:          document.getElementById('adminFormTitle'),
  adminFormName:           document.getElementById('adminFormName'),
  adminFormStream:         document.getElementById('adminFormStream'),
  adminFormCity:           document.getElementById('adminFormCity'),
  adminFormState:          document.getElementById('adminFormState'),
  adminFormPincode:        document.getElementById('adminFormPincode'),
  adminFormType:           document.getElementById('adminFormType'),
  adminFormNaac:           document.getElementById('adminFormNaac'),
  adminFormEstablished:    document.getElementById('adminFormEstablished'),
  adminFormFees:           document.getElementById('adminFormFees'),
  adminFormNirf:           document.getElementById('adminFormNirf'),
  adminFormAvgPlacement:   document.getElementById('adminFormAvgPlacement'),
  adminFormMaxPlacement:   document.getElementById('adminFormMaxPlacement'),
  adminFormDesc:           document.getElementById('adminFormDesc'),
  adminFormGallery:        document.getElementById('adminFormGallery'),
  adminFormPlacementRate:  document.getElementById('adminFormPlacementRate'),
  adminFormCampusSize:     document.getElementById('adminFormCampusSize'),
  adminFormHostel:         document.getElementById('adminFormHostel'),
  adminFormWebsite:        document.getElementById('adminFormWebsite'),
  adminFormContactEmail:   document.getElementById('adminFormContactEmail'),
  adminFormContactPhone:   document.getElementById('adminFormContactPhone'),
  adminFormFacilities:     document.getElementById('adminFormFacilities'),
  adminFormStudentRating:  document.getElementById('adminFormStudentRating'),
  adminFormApplicationDeadline: document.getElementById('adminFormApplicationDeadline'),
  adminFormTopRecruiters:  document.getElementById('adminFormTopRecruiters'),
  adminFormScholarshipsInfo: document.getElementById('adminFormScholarshipsInfo'),
  adminAddCourseBtn:       document.getElementById('adminAddCourseBtn'),
  adminCoursesContainer:   document.getElementById('adminCoursesContainer'),
  adminAddContactBtn:      document.getElementById('adminAddContactBtn'),
  adminContactsContainer:  document.getElementById('adminContactsContainer'),
  adminFormCancelBtn:      document.getElementById('adminFormCancelBtn'),
  // Exams timeline dashboard elements
  adminTabColleges:        document.getElementById('adminTabColleges'),
  adminTabExams:           document.getElementById('adminTabExams'),
  adminCreateNewExamBtn:   document.getElementById('adminCreateNewExamBtn'),
  adminExamsListPanel:     document.getElementById('adminExamsListPanel'),
  adminExamsTableBody:     document.getElementById('adminExamsTableBody'),
  adminExamFormPanel:      document.getElementById('adminExamFormPanel'),
  examEditForm:            document.getElementById('examEditForm'),
  adminExamFormTitle:      document.getElementById('adminExamFormTitle'),
  adminExamFormName:       document.getElementById('adminExamFormName'),
  adminExamFormStream:     document.getElementById('adminExamFormStream'),
  adminExamFormDates:      document.getElementById('adminExamFormDates'),
  adminExamFormStatus:     document.getElementById('adminExamFormStatus'),
  adminExamFormBadge:      document.getElementById('adminExamFormBadge'),
  adminExamFormNote:       document.getElementById('adminExamFormNote'),
  adminExamFormCancelBtn:  document.getElementById('adminExamFormCancelBtn'),
};

// ─── Header scroll class ────────────────────────────────────────────────────
let lastScrollY = window.scrollY;
window.addEventListener('scroll', () => {
  if (el.siteHeader) {
    const currentScrollY = window.scrollY;
    
    // Toggle scrolled state for border and shadow
    el.siteHeader.classList.toggle('scrolled', currentScrollY > 20);
    
    // Hide header on scroll down, show on scroll up (Headroom style)
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      el.siteHeader.style.transform = 'translateY(-100%)';
    } else {
      el.siteHeader.style.transform = 'translateY(0)';
    }
    
    lastScrollY = currentScrollY;
  }
}, { passive: true });

// Theme management is now handled globally in global.js

const currency = (n) =>
  n == null ? 'N/A' : `₹${Number(n).toLocaleString('en-IN')}`;

function formatPlacement(val) {
  if (!val || val <= 0) return 'N/A';
  const num = Number(val);
  if (num >= 100000) {
    const lpa = (num / 100000).toFixed(1).replace(/\.0$/, '');
    return `${lpa} LPA`;
  }
  if (num < 1000) return `${num} LPA`;
  return `${num} LPA`;
}

// ─── Debounce helper ─────────────────────────────────────────────────────────
function debounce(fn, ms) {

  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// ─── URL state sync ──────────────────────────────────────────────────────────
function syncStateFromURL() {
  const p = new URLSearchParams(location.search);
  state.q            = p.get('q')       || '';
  state.stream       = p.get('stream')  || '';
  state.exam         = p.get('exam')    || '';
  state.city         = p.get('city')    || '';
  state.state_filter = p.get('state')   || '';
  state.type         = p.get('type')    || '';
  state.naac         = p.get('naac')    || '';
  state.max_fees     = p.get('max_fees')|| '';
  state.sort         = p.get('sort')    || 'name';
  state.page         = parseInt(p.get('page'), 10) || 1;
  state.openCollegeId = parseInt(p.get('college'), 10) || null;
}

function pushStateToURL() {
  const p = new URLSearchParams();
  if (state.q)            p.set('q',       state.q);
  if (state.stream)       p.set('stream',  state.stream);
  if (state.exam)         p.set('exam',    state.exam);
  if (state.city)         p.set('city',    state.city);
  if (state.state_filter) p.set('state',   state.state_filter);
  if (state.type)         p.set('type',    state.type);
  if (state.naac)         p.set('naac',    state.naac);
  if (state.max_fees)     p.set('max_fees',state.max_fees);
  if (state.openCollegeId) p.set('college', state.openCollegeId);
  if (state.sort && state.sort !== 'name') p.set('sort', state.sort);
  if (state.page > 1)     p.set('page',    state.page);
  const qs = p.toString();
  history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
}

async function init() {
  syncStateFromURL();
  await initUserSession();
  bindAuthEvents();
  
  // Check if redirected from another page to login
  if (new URLSearchParams(window.location.search).get('login') === 'true') {
    if (el.navLoginBtn) el.navLoginBtn.click();
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  // Check if redirected from another page to open admin portal
  if (new URLSearchParams(window.location.search).get('admin') === 'true') {
    if (currentUser && currentUser.role === 'admin') {
      openAdminDashboard();
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  // Check if redirected from another page to open profile settings
  if (new URLSearchParams(window.location.search).get('profile') === 'true') {
    if (currentUser) {
      openProfileModal();
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  bindAdminEvents();
  await Promise.all([
    loadFilterMeta(),
    loadShortlistIds(),
    loadHeroStats(),
  ]);
  buildExamChips();
  buildCityChips();
  bindEvents();
  buildTimeline();
  // Restore UI from URL state
  el.searchInput.value      = state.q;
  el.filterState.value      = state.state_filter;
  el.filterCity.value       = state.city;
  el.filterType.value       = state.type;
  el.filterNaac.value       = state.naac;
  el.filterFees.value       = state.max_fees;
  el.filterSort.value       = state.sort;
  fetchAndRenderColleges();
  
  // Restore detail overlay ONLY when visiting a direct share link (no search query active)
  // If a search query exists, the user wants to see results — don't pop a modal on top
  if (state.openCollegeId && !state.q) {
    openDetail(state.openCollegeId);
  } else if (state.openCollegeId && state.q) {
    // Clear the stale college param from URL so searching works cleanly
    state.openCollegeId = null;
    pushStateToURL();
  }
}

// ─── Hero stats ──────────────────────────────────────────────────────────────
async function loadHeroStats() {
  try {
    const [metaRes, countRes] = await Promise.all([
      fetch(`${API_BASE}/colleges/meta/filters`),
      fetch(`${API_BASE}/colleges?limit=1`),
    ]);
    const meta  = await metaRes.json();
    const count = await countRes.json();
    const total   = count.pagination.total;
    const streams = meta.streams.length;
    const statText = `${total} institutions · ${streams} streams · 2026 admissions`;
    el.eyebrowText.textContent = statText;
    if (el.navStatsText) el.navStatsText.textContent = `${total} colleges live`;
  } catch {
    el.eyebrowText.textContent = 'Updated for 2026 admissions';
    if (el.navStatsText) el.navStatsText.textContent = 'Live';
  }
}

// ─── Filter metadata ─────────────────────────────────────────────────────────
async function loadFilterMeta() {
  try {
    const stateParam = state.state_filter ? `?state=${encodeURIComponent(state.state_filter)}` : '';
    const res  = await fetch(`${API_BASE}/colleges/meta/filters${stateParam}`);
    const meta = await res.json();

    // Stream chips
    el.streamChips.innerHTML = '';
    const allChip = makeStreamChip('All streams', '', state.stream === '');
    el.streamChips.appendChild(allChip);
    const streamIcons = {
      'Engineering':   '⚙️',
      'Medical':       '🏥',
      'Management':    '💼',
      'Law':           '⚖️',
      'Arts':          '🎨',
      'Commerce':      '📈',
      'Science':       '🔬',
      'Design':        '✏️',
      'Junior College':'📚',
    };
    meta.streams.forEach((s) => {
      el.streamChips.appendChild(makeStreamChip(
        `${streamIcons[s] || ''} ${s}`.trim(), s, state.stream === s
      ));
    });

    fillSelect(el.filterState, meta.states,     'Any state');
    // Restore state selection and cascade cities
    if (state.state_filter) {
      el.filterState.value = state.state_filter;
      await refreshCityDropdown(state.state_filter);
    } else {
      fillSelect(el.filterCity,  meta.cities,      'Any city');
    }
    if (state.city) el.filterCity.value = state.city;
    fillSelect(el.filterType,  meta.types,       'Any type');
    fillSelect(el.filterNaac,  meta.naac_grades, 'Any grade');
  } catch (err) {
    showToast('Could not load filter options.', 'error');
  }
}

// ─── Cascade: refresh city dropdown when state changes ───────────────────────
async function refreshCityDropdown(selectedState) {
  try {
    const url = selectedState
      ? `${API_BASE}/colleges/meta/filters?state=${encodeURIComponent(selectedState)}`
      : `${API_BASE}/colleges/meta/filters`;
    const res  = await fetch(url);
    const meta = await res.json();
    fillSelect(el.filterCity, meta.cities, 'Any city');
    if (state.city && meta.cities.includes(state.city)) {
      el.filterCity.value = state.city;
    } else {
      state.city = '';
    }
  } catch { /* non-fatal */ }
}

function fillSelect(selectEl, values, defaultLabel) {
  selectEl.innerHTML = `<option value="">${defaultLabel}</option>`;
  values.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v; opt.textContent = v;
    selectEl.appendChild(opt);
  });
}

function makeStreamChip(label, value, active) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip' + (active ? ' active' : '');
  btn.innerHTML = label;
  btn.dataset.value = value;
  btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  btn.addEventListener('click', () => {
    state.stream = value;
    state.page   = 1;
    document.querySelectorAll('.chip').forEach((c) => {
      const isThis = c === btn;
      c.classList.toggle('active', isThis);
      c.setAttribute('aria-pressed', isThis ? 'true' : 'false');
    });
    fetchAndRenderColleges();
  });
  return btn;
}

// ─── Exam chips ───────────────────────────────────────────────────────────────
function buildExamChips() {
  EXAM_CHIPS.forEach(({ label, value }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'exam-chip' + (state.exam === value ? ' active' : '');
    btn.textContent = label;
    btn.dataset.exam = value;
    btn.setAttribute('aria-pressed', state.exam === value ? 'true' : 'false');
    btn.setAttribute('aria-label', `Filter by ${label} entrance exam`);
    btn.addEventListener('click', () => {
      const isActive = state.exam === value;
      state.exam = isActive ? '' : value;
      state.page = 1;
      document.querySelectorAll('.exam-chip').forEach((c) => {
        const isThis = c === btn && !isActive;
        c.classList.toggle('active', isThis);
        c.setAttribute('aria-pressed', isThis ? 'true' : 'false');
      });
      fetchAndRenderColleges();
    });
    el.examChipsRow.appendChild(btn);
  });
}

// ─── City quick-chips ─────────────────────────────────────────────────────────
function buildCityChips() {
  CITY_CHIPS.forEach(({ label, value }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'exam-chip' + (state.city === value ? ' active' : '');
    btn.innerHTML = label;
    btn.dataset.city = value;
    btn.setAttribute('aria-pressed', state.city === value ? 'true' : 'false');
    btn.setAttribute('aria-label', `Filter by ${value}`);
    btn.addEventListener('click', () => {
      const isActive = state.city === value;
      state.city = isActive ? '' : value;
      state.page = 1;
      // Sync the advanced filter dropdown too
      if (el.filterCity) el.filterCity.value = state.city;
      document.querySelectorAll('#cityChipsRow .exam-chip').forEach((c) => {
        const isThis = c === btn && !isActive;
        c.classList.toggle('active', isThis);
        c.setAttribute('aria-pressed', isThis ? 'true' : 'false');
      });
      fetchAndRenderColleges();
    });
    el.cityChipsRow.appendChild(btn);
  });
}

// ─── Recent Searches & Helpers ────────────────────────────────────────────────
function getRecentSearches() {
  try { return JSON.parse(localStorage.getItem('pk_recent_searches')) || []; } catch { return []; }
}
function saveRecentSearch(query) {
  if (!query || !query.trim()) return;
  let recents = getRecentSearches();
  recents = recents.filter(q => q.toLowerCase() !== query.toLowerCase());
  recents.unshift(query.trim());
  if (recents.length > 5) recents.pop();
  localStorage.setItem('pk_recent_searches', JSON.stringify(recents));
}
function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return escapeHtml(text).replace(regex, '<span class="search-highlight">$1</span>');
}

// ─── Events ───────────────────────────────────────────────────────────────────
function bindEvents() {
  // Submit form
  if (el.searchForm) el.searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.q    = el.searchInput.value.trim();
    saveRecentSearch(state.q);
    state.page = 1;
    fetchAndRenderColleges();
    closeAutocomplete();
  });

  // Debounced live search
  const debouncedSearch = debounce(() => {
    state.q    = el.searchInput.value.trim();
    state.page = 1;
    el.liveIndicator.classList.add('visible');
    fetchAndRenderColleges().finally(() => {
      el.liveIndicator.classList.remove('visible');
    });
  }, 420);

  if (el.searchInput) el.searchInput.addEventListener('input', (e) => {
    if (el.searchClearBtn) el.searchClearBtn.hidden = !e.target.value;
    debouncedSearch();
  });

  // Autocomplete logic
  let activeSuggestionIndex = -1;

  const closeAutocomplete = () => {
    el.autocompleteSuggestions.hidden = true;
    activeSuggestionIndex = -1;
  };

  const showRecentSearches = () => {
    const recents = getRecentSearches();
    if (recents.length === 0) {
      closeAutocomplete();
      return;
    }
    let html = '<div class="recent-searches-header"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:2px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Recent Searches</div>';
    recents.forEach(q => {
      html += `
        <div class="suggestion-item" data-type="recent" data-value="${escapeHtml(q)}">
          <span class="suggestion-icon">🕒</span>
          <div class="suggestion-text">
            <div class="suggestion-name">${escapeHtml(q)}</div>
          </div>
        </div>`;
    });
    el.autocompleteSuggestions.innerHTML = html;
    el.autocompleteSuggestions.hidden = false;
    
    // Bind clicks
    el.autocompleteSuggestions.querySelectorAll('.suggestion-item').forEach((item) => {
      item.addEventListener('click', () => {
        const val = item.dataset.value;
        el.searchInput.value = val;
        if (el.searchClearBtn) el.searchClearBtn.hidden = false;
        state.q = val;
        state.page = 1;
        saveRecentSearch(val);
        fetchAndRenderColleges();
        closeAutocomplete();
      });
    });
  };

  const fetchAutocomplete = debounce(async (val) => {
    if (!val.trim()) {
      showRecentSearches();
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/colleges/autocomplete?q=${encodeURIComponent(val)}`);
      const data = await res.json();
      renderAutocompleteSuggestions(data, val);
    } catch {
      // ignore
    }
  }, 220);

  if (el.searchInput) el.searchInput.addEventListener('focus', (e) => {
    if (el.searchClearBtn) el.searchClearBtn.hidden = !e.target.value;
    if (!e.target.value.trim()) {
      showRecentSearches();
    } else {
      fetchAutocomplete(e.target.value);
    }
  });

  if (el.searchInput) el.searchInput.addEventListener('input', (e) => {
    fetchAutocomplete(e.target.value);
  });

  if (el.searchClearBtn) {
    if (el.searchClearBtn) el.searchClearBtn.addEventListener('click', () => {
      el.searchInput.value = '';
      el.searchClearBtn.hidden = true;
      state.q = '';
      state.page = 1;
      fetchAndRenderColleges();
      el.searchInput.focus();
    });
  }

  if (el.searchInput) el.searchInput.addEventListener('keydown', (e) => {
    const items = el.autocompleteSuggestions.querySelectorAll('.suggestion-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
      updateSuggestionHighlight(items, activeSuggestionIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeSuggestionIndex = (activeSuggestionIndex - 1 + items.length) % items.length;
      updateSuggestionHighlight(items, activeSuggestionIndex);
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex > -1) {
        e.preventDefault();
        items[activeSuggestionIndex].click();
      } else {
        closeAutocomplete();
      }
    } else if (e.key === 'Escape') {
      closeAutocomplete();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-input-wrap')) {
      closeAutocomplete();
    }
  });

  // Advanced filter changes
  [el.filterState, el.filterType, el.filterNaac, el.filterFees, el.filterSort].forEach((sel) => {
    sel.addEventListener('change', () => {
      state.state_filter = el.filterState.value;
      state.type         = el.filterType.value;
      state.naac         = el.filterNaac.value;
      state.max_fees     = el.filterFees.value;
      state.sort         = el.filterSort.value;
      state.page         = 1;
      fetchAndRenderColleges();
    });
  });

  // When state changes, cascade city dropdown and clear old city selection
  el.filterState.addEventListener('change', async () => {
    state.state_filter = el.filterState.value;
    state.city = '';  // reset city when state changes
    el.filterCity.value = '';
    // Sync city chips
    document.querySelectorAll('#cityChipsRow .exam-chip').forEach((c) => {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    await refreshCityDropdown(state.state_filter);
    state.page = 1;
    fetchAndRenderColleges();
  });

  // City dropdown in advanced filters
  el.filterCity.addEventListener('change', () => {
    state.city = el.filterCity.value;
    state.page = 1;
    // Sync city quick-chips
    document.querySelectorAll('#cityChipsRow .exam-chip').forEach((c) => {
      const match = c.dataset.city === state.city;
      c.classList.toggle('active', match);
      c.setAttribute('aria-pressed', match ? 'true' : 'false');
    });
    fetchAndRenderColleges();
  });

  // Clear filters
  if (el.clearFiltersBtn) el.clearFiltersBtn.addEventListener('click', () => {
    state.q = ''; state.stream = ''; state.exam = '';
    state.city = ''; state.state_filter = ''; state.type = '';
    state.naac = ''; state.max_fees = ''; state.sort = 'name'; state.page = 1;
    el.searchInput.value = '';
    el.filterState.value = ''; el.filterCity.value  = '';
    el.filterType.value  = ''; el.filterNaac.value  = '';
    el.filterFees.value  = ''; el.filterSort.value  = 'name';
    document.querySelectorAll('.chip').forEach((c, i) => {
      c.classList.toggle('active', i === 0);
      c.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    });
    document.querySelectorAll('.exam-chip').forEach((c) => {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    refreshCityDropdown('');
    fetchAndRenderColleges();
  });

  // Filters panel toggle
  if (el.filtersToggleBtn) el.filtersToggleBtn.addEventListener('click', () => {
    const expanded = el.filtersToggleBtn.getAttribute('aria-expanded') === 'true';
    el.filtersToggleBtn.setAttribute('aria-expanded', String(!expanded));
    el.filtersPanel.setAttribute('aria-hidden', String(expanded));
    el.filtersPanel.classList.toggle('collapsed', expanded);
    el.filtersPanel.classList.toggle('expanded', !expanded);
  });

  // Detail modal close
  if (el.detailCloseBtn) el.detailCloseBtn.addEventListener('click', closeDetail);
  if (el.detailOverlay) el.detailOverlay.addEventListener('click', (e) => {
    if (e.target === el.detailOverlay) closeDetail();
  });

  // Shortlist drawer
  if (el.navShortlistBtn) el.navShortlistBtn.addEventListener('click', openShortlistDrawer);
  if (el.shortlistCloseBtn) el.shortlistCloseBtn.addEventListener('click', closeShortlistDrawer);
  if (el.shortlistOverlay) el.shortlistOverlay.addEventListener('click', (e) => {
    if (e.target === el.shortlistOverlay) closeShortlistDrawer();
  });

  // Compare
  if (el.compareBtn) el.compareBtn.addEventListener('click', openCompareModal);
  if (el.compareCloseBtn) el.compareCloseBtn.addEventListener('click', closeCompareModal);
  if (el.compareOverlay) el.compareOverlay.addEventListener('click', (e) => {
    if (e.target === el.compareOverlay) closeCompareModal();
  });

  // Empty state clear button
  if (el.emptyStateClearBtn) {
    if (el.emptyStateClearBtn) el.emptyStateClearBtn.addEventListener('click', () => {
      el.clearFiltersBtn.click();
    });
  }

  // View toggle — grid vs list
  if (el.viewGrid && el.viewList) {
    el.viewGrid.addEventListener('click', () => {
      el.viewGrid.classList.add('active');
      el.viewList.classList.remove('active');
      el.resultsGrid.classList.remove('list-view');
    });
    el.viewList.addEventListener('click', () => {
      el.viewList.classList.add('active');
      el.viewGrid.classList.remove('active');
      el.resultsGrid.classList.add('list-view');
    });
  }

  // Global keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!el.compareOverlay.hidden) { closeCompareModal(); return; }
      if (!el.detailOverlay.hidden)  { closeDetail(); return; }
      if (!el.shortlistOverlay.hidden) { closeShortlistDrawer(); return; }
    }
    // "/" focuses search bar (skip if in an input)
    if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      el.searchInput.focus();
      el.searchInput.select();
    }
  });
}

// ─── Fetch + render ──────────────────────────────────────────────────────────
function buildQueryParams() {
  const params = new URLSearchParams();
  if (state.q)            params.set('q',       state.q);
  if (state.stream)       params.set('stream',  state.stream);
  if (state.exam)         params.set('exam',    state.exam);
  if (state.city)         params.set('city',    state.city);
  if (state.state_filter) params.set('state',   state.state_filter);
  if (state.type)         params.set('type',    state.type);
  if (state.naac)         params.set('naac',    state.naac);
  if (state.max_fees)     params.set('max_fees',state.max_fees);
  if (state.sort)         params.set('sort',    state.sort);
  params.set('page',  state.page);
  params.set('limit', state.limit);
  return params;
}

async function fetchAndRenderColleges() {
  // Close any open college detail (new search = user wants results, not a modal)
  if (state.openCollegeId) {
    state.openCollegeId = null;
    el.detailOverlay.hidden = true;
    document.body.style.overflow = '';
  }

  showLoading(true);
  try {
    const params = buildQueryParams();
    const res  = await fetch(`${API_BASE}/colleges?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    renderResults(json.data, json.pagination);
    pushStateToURL();
  } catch (err) {
    console.error('Failed to fetch colleges', err);
    el.resultsGrid.innerHTML = '';
    showToast('Could not load results. Is the server running?', 'error');
    el.resultsCount.textContent = 'Error loading results.';
  } finally {
    showLoading(false);
  }
}


function showLoading(isLoading) {
  el.loadingState.hidden = !isLoading;
  el.resultsGrid.style.opacity = isLoading ? '0.4' : '1';
}

function renderResults(colleges, pagination) {
  // Heading
  if (state.q) {
    el.resultsHeading.textContent = `Results for "${state.q}"`;
  } else if (state.stream) {
    el.resultsHeading.textContent = `${state.stream} colleges`;
  } else if (state.exam) {
    el.resultsHeading.textContent = `Colleges with ${state.exam} intake`;
  } else {
    el.resultsHeading.textContent = 'All colleges';
  }

  const total = pagination.total;
  el.resultsCount.textContent = total === 0
    ? '' : `${total} college${total === 1 ? '' : 's'} found`;

  // SR announcement
  el.srAnnounce.textContent = total === 0
    ? 'No colleges found for these filters.'
    : `${total} college${total === 1 ? '' : 's'} found.`;

  el.resultsGrid.innerHTML = '';
  el.emptyState.hidden = colleges.length > 0;

  colleges.forEach((college, i) => {
    const card = renderCollegeCard(college);
    card.style.animationDelay = `${i * 45}ms`;
    el.resultsGrid.appendChild(card);
  });

  renderPagination(pagination);
}

function getStreamClass(stream) {
  const map = {
    'Junior College': 'stream-junior',
    'Medical':        'stream-medical',
    'Management':     'stream-management',
    'Law':            'stream-law',
  };
  return map[stream] || '';
}

function getNaacStampClass(grade) {
  if (!grade) return '';
  if (grade === 'A++') return 'grade-app';
  if (grade === 'A+')  return 'grade-ap';
  if (grade === 'A')   return 'grade-a';
  return 'grade-b';
}

function renderCollegeCard(college) {
  const card = document.createElement('article');
  card.className = 'college-card';
  card.tabIndex  = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', `View details for ${college.name}`);

  const isShortlisted = state.shortlistedIds.has(college.id);
  const isJunior      = college.stream === 'Junior College';
  const streamClass   = `card-stream-label ${getStreamClass(college.stream)}`;
  const streamLabel   = isJunior ? 'Junior College (XI–XII)' : escapeHtml(college.stream);
  const naacClass     = getNaacStampClass(college.naac_grade);
  const isGovt        = college.college_type === 'Government';
  const feesText      = college.avg_fees_per_year === 0 ? 'Free' : currency(college.avg_fees_per_year);
  const feesClass     = college.avg_fees_per_year === 0 ? 'card-fees free' : 'card-fees';

  // Tags
  let tagsHtml = '';
  if (isGovt)             tagsHtml += `<span class="card-tag card-tag-govt">Government</span>`;
  if (isJunior)           tagsHtml += `<span class="card-tag card-tag-xi">Class XI–XII</span>`;

  card.innerHTML = `
    ${college.naac_grade ? `<div class="card-naac-stamp ${naacClass}">NAAC ${escapeHtml(college.naac_grade)}</div>` : ''}
    <button type="button"
      class="shortlist-toggle ${isShortlisted ? 'active' : ''}"
      aria-label="${isShortlisted ? 'Remove from' : 'Add to'} shortlist"
      data-id="${college.id}">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    </button>
    <button type="button"
      class="compare-toggle ${state.compareIds.has(college.id) ? 'active' : ''}"
      aria-label="${state.compareIds.has(college.id) ? 'Remove from' : 'Add to'} comparison"
      data-id="${college.id}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
    </button>
    <span class="${streamClass}">${streamLabel}</span>
    <div class="card-main">
      <h3 class="card-name">${escapeHtml(college.name)}</h3>
      <p class="card-location">
        <span class="card-location-icon">📍</span>
        ${escapeHtml(college.city)}, ${escapeHtml(college.state)}
      </p>
      <p class="card-desc">${escapeHtml(college.description || '')}</p>
 
      ${(college.nirf_ranking || college.avg_placement_package) ? `
      <div class="card-metrics">
        ${college.nirf_ranking ? `
          <div class="metric-badge metric-nirf" title="NIRF 2025 Ranking">
            <span class="metric-icon">🏆</span>
            <span class="metric-val">NIRF #${college.nirf_ranking}</span>
          </div>` : ''}
        ${college.avg_placement_package ? `
          <div class="metric-badge metric-salary" title="Average Placement Package">
            <span class="metric-icon">💼</span>
            <span class="metric-val">Avg ${formatPlacement(college.avg_placement_package)}</span>
          </div>` : ''}
      </div>` : ''}
 
      ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
    </div>
    <div class="card-footer">
      <div class="card-fees-block">
        <span class="card-fees-label">Avg. fees / year</span>
        <span class="${feesClass}">${feesText}</span>
      </div>
      <span class="card-courses-count">${college.total_courses} course${college.total_courses === 1 ? '' : 's'}</span>
    </div>
  `;
 
  card.addEventListener('click', (e) => {
    if (e.target.closest('.shortlist-toggle') || e.target.closest('.compare-toggle')) return;
    window.location.href = 'college.html?id=' + college.id;
  });
  card.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.shortlist-toggle') && !e.target.closest('.compare-toggle')) {
      e.preventDefault();
      window.location.href = 'college.html?id=' + college.id;
    }
  });
  card.querySelector('.shortlist-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleShortlist(college.id, e.currentTarget);
  });
  card.querySelector('.compare-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCompare(college.id, college.name, e.currentTarget);
  });
 
  return card;
}

function renderPagination(pagination) {
  const { page, total_pages } = pagination;
  el.pagination.hidden = total_pages <= 1;
  el.pagination.innerHTML = '';
  if (total_pages <= 1) return;

  const makeBtn = (label, targetPage, opts = {}) => {
    const btn = document.createElement('button');
    btn.innerHTML = label;
    btn.disabled  = !!opts.disabled;
    if (opts.active) btn.classList.add('active');
    btn.setAttribute('aria-label', opts.ariaLabel || label);
    btn.addEventListener('click', () => {
      state.page = targetPage;
      fetchAndRenderColleges();
      el.resultsHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return btn;
  };

  el.pagination.appendChild(makeBtn('&#8249;', Math.max(page - 1, 1), {
    disabled: page === 1, ariaLabel: 'Previous page',
  }));
  const start = Math.max(1, page - 2);
  const end   = Math.min(total_pages, start + 4);
  for (let p = start; p <= end; p++) {
    el.pagination.appendChild(makeBtn(String(p), p, {
      active: p === page, ariaLabel: `Page ${p}`,
    }));
  }
  el.pagination.appendChild(makeBtn('&#8250;', Math.min(page + 1, total_pages), {
    disabled: page === total_pages, ariaLabel: 'Next page',
  }));
}

// ─── Detail modal ─────────────────────────────────────────────────────────────
async function openDetail(collegeId) {
  state.openCollegeId = collegeId;
  pushStateToURL();
  el.detailOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  el.detailContent.innerHTML = `<div class="loading-state"><div class="loader"><div class="loader-ring"></div><div class="loader-ring"></div><div class="loader-ring"></div></div><p>Loading details…</p></div>`;

  // Move focus inside
  el.detailCloseBtn.focus();

  try {
    const res = await fetch(`${API_BASE}/colleges/${collegeId}`);
    if (!res.ok) throw new Error('Not found');
    const college = await res.json();
    renderDetail(college);
    trapFocus(el.detailOverlay.querySelector('.detail-modal'));

    // Track recently viewed (stored in localStorage for dashboard widget)
    try {
      let recent = JSON.parse(localStorage.getItem('pk_recently_viewed') || '[]');
      recent = recent.filter(c => c.id !== college.id);
      recent.unshift({ id: college.id, name: college.name, city: college.city, state: college.state, stream: college.stream });
      if (recent.length > 10) recent.pop();
      localStorage.setItem('pk_recently_viewed', JSON.stringify(recent));
    } catch(e) {}
  } catch {
    el.detailContent.innerHTML = '<p style="padding:24px;">Could not load this college. Please try again.</p>';
    showToast('Failed to load college details.', 'error');
  }
}

function renderDetail(college) {
  const isShortlisted = state.shortlistedIds.has(college.id);
  const isJunior      = college.stream === 'Junior College';

  const coursesRows = college.courses.map((c) => {
    const isXIXII = c.level === 'XI-XII';
    const isUG    = c.level === 'UG';
    const isPG    = c.level === 'PG';
    const isPhD   = c.level === 'PhD';
    let pillClass = 'level-pill';
    if (isXIXII) pillClass += ' level-pill-xixii';
    else if (isUG) pillClass += ' level-pill-ug';
    else if (isPG) pillClass += ' level-pill-pg';
    else if (isPhD) pillClass += ' level-pill-phd';
    const feeDisplay = c.fees_per_year === 0 ? '<span style="color:var(--sage)">Free</span>' : currency(c.fees_per_year);
    return `
      <tr>
        <td>
          <div class="course-name">${escapeHtml(c.name)}</div>
          <span class="${pillClass}">${escapeHtml(c.level)}</span>
        </td>
        <td class="course-meta">${c.duration_years ? c.duration_years + ' yr' : '—'}</td>
        <td class="course-meta">${c.seats ?? '—'}</td>
        <td class="course-meta">${feeDisplay}</td>
        <td class="course-meta">${escapeHtml(c.entrance_exam || '—')}</td>
      </tr>
    `;
  }).join('');

  const contactIcons = { phone: '📞', email: '✉️', website: '🌐', address: '📍' };
  const contactsList = college.contacts.map((c) => {
    let valueHtml = escapeHtml(c.contact_value);
    const icon = contactIcons[c.contact_type] || '📋';
    if (c.contact_type === 'email')
      valueHtml = `<a href="mailto:${escapeHtml(c.contact_value)}">${escapeHtml(c.contact_value)}</a>`;
    if (c.contact_type === 'website')
      valueHtml = `<a href="${escapeHtml(c.contact_value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.contact_value)}</a>`;
    if (c.contact_type === 'phone')
      valueHtml = `<a href="tel:${escapeHtml(c.contact_value)}">${escapeHtml(c.contact_value)}</a>`;
    return `<li><span class="contact-icon">${icon}</span><span class="contact-label">${escapeHtml(c.label || c.contact_type)}</span><span class="contact-value">${valueHtml}</span></li>`;
  }).join('');

  el.detailContent.innerHTML = `
    <div class="detail-hero">
      <div class="hero-bg"></div>
      <div class="hero-content">
        <span class="hero-stream">${escapeHtml(college.stream)}</span>
        <h2 class="hero-title">${escapeHtml(college.name)}</h2>
        <div class="hero-location">
          📍 ${escapeHtml(college.address || college.city + ', ' + college.state)}
        </div>
        <div class="detail-badges" style="margin-top: 12px;">
          ${college.naac_grade ? `<span class="badge badge-naac">⭐ NAAC ${escapeHtml(college.naac_grade)}</span>` : ''}
          <span class="badge badge-type">${escapeHtml(college.college_type)}</span>
          ${college.established_year ? `<span class="badge badge-year">Est. ${college.established_year}</span>` : ''}
        </div>
      </div>
    </div>

    <div class="detail-quick-stats">
      <div class="stat-box">
        <div class="stat-label">Rating</div>
        <div class="stat-val">⭐ ${college.student_rating || 'N/A'}/5</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Campus Size</div>
        <div class="stat-val">🌳 ${escapeHtml(college.campus_size || 'N/A')}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Avg Package</div>
        <div class="stat-val">💼 ${college.avg_placement_package ? formatPlacement(college.avg_placement_package) : 'N/A'}</div>
      </div>
      <div class="stat-box">
        <div class="stat-label">Fees / yr</div>
        <div class="stat-val">💰 ${college.avg_fees_per_year ? currency(college.avg_fees_per_year) : 'N/A'}</div>
      </div>
    </div>

    <div class="college-tabs">
      <button class="tab-btn active" data-target="tab-overview">Overview</button>
      <button class="tab-btn" data-target="tab-courses">Courses & Fees</button>
      <button class="tab-btn" data-target="tab-placements">Placements</button>
      <button class="tab-btn" data-target="tab-contact">Contact</button>
    </div>

    <div class="tab-content active" id="tab-overview">
      <div class="info-card">
        <h3>About College</h3>
        <p class="detail-desc">${escapeHtml(college.description || 'Welcome to ' + college.name + '. A premier institution dedicated to academic excellence.')}</p>
        ${college.affiliation ? `<p class="detail-desc" style="margin-top:8px;"><strong>Affiliation:</strong> ${escapeHtml(college.affiliation)}</p>` : ''}
      </div>
      
      <div class="info-card">
        <h3>Campus Facilities</h3>
        <p>${escapeHtml(college.facilities || 'Standard academic facilities available.')}</p>
      </div>
      
      <div class="info-card">
        <h3>Scholarships</h3>
        <p>${escapeHtml(college.scholarships_info || 'Merit and need-based scholarships available. Contact admissions for details.')}</p>
      </div>
    </div>

    <div class="tab-content" id="tab-courses">
      <div class="info-card">
        <h3 class="detail-section-title">Courses offered (${college.courses.length})</h3>
        <div class="table-responsive">
          <table class="course-table">
            <thead>
              <tr>
                <th>Course</th><th>Duration</th><th>Seats</th>
                <th>Fees / yr</th><th>Entrance exam</th>
              </tr>
            </thead>
            <tbody>${coursesRows || '<tr><td colspan="5">No course data available.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-placements">
      <div class="info-card">
        <h3>Top Recruiters</h3>
        <p style="font-weight:600; color:var(--text); margin-top:8px;">${escapeHtml(college.top_recruiters || 'Top MNCs and domestic corporations.')}</p>
      </div>
      
      <div class="stat-grid-2">
        <div class="info-card text-center">
          <div class="stat-label">Highest Package</div>
          <div class="stat-val-large">${college.highest_placement_package ? formatPlacement(college.highest_placement_package) : 'Contact for details'}</div>
        </div>
        <div class="info-card text-center">
          <div class="stat-label">Average Package</div>
          <div class="stat-val-large">${college.avg_placement_package ? formatPlacement(college.avg_placement_package) : 'Contact for details'}</div>
        </div>
      </div>
    </div>

    <div class="tab-content" id="tab-contact">
      <div class="info-card">
        <h3 class="detail-section-title">Contact &amp; admissions</h3>
        <ul class="contact-list">${contactsList || '<li>No contact details available.</li>'}</ul>
      </div>
      <div class="info-card">
        <h3>Application Deadline</h3>
        <p style="font-weight:600; margin-top:8px; color:var(--red);">📅 ${escapeHtml(college.application_deadline || 'Admissions open for current cycle')}</p>
      </div>
    </div>

    <div class="detail-actions" style="display: flex; gap: 12px; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border-2);">
      <button type="button"
        class="btn-secondary shortlist-detail-btn ${isShortlisted ? 'active' : ''}"
        data-id="${college.id}" style="flex: 1; justify-content: center; gap: 6px;">
        ${isShortlisted ? '★ Shortlisted' : '☆ Add to shortlist'}
      </button>
      <button type="button"
        class="btn-secondary copy-share-link-btn"
        data-id="${college.id}" style="flex: 1; justify-content: center; gap: 6px;">
        🔗 Copy Share Link
      </button>
    </div>
  `;

  // Bind tabs
  const tabBtns = el.detailContent.querySelectorAll('.tab-btn');
  const tabContents = el.detailContent.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      el.detailContent.querySelector('#' + btn.dataset.target).classList.add('active');
    });
  });

  el.detailContent.querySelector('.shortlist-detail-btn').addEventListener('click', (e) => {
    toggleShortlist(college.id, e.currentTarget, true);
  });

  el.detailContent.querySelector('.copy-share-link-btn').addEventListener('click', () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?college=${college.id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => showToast('Share link copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy link.', 'error'));
  });
}

function closeDetail() {
  state.openCollegeId = null;
  pushStateToURL();
  el.detailOverlay.hidden = true;
  document.body.style.overflow = '';
}

// ─── Focus trap ───────────────────────────────────────────────────────────────
function trapFocus(container) {
  const focusable = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }
  container.addEventListener('keydown', handler);
  // Clean up on modal close
  const removeHandler = () => {
    container.removeEventListener('keydown', handler);
    document.removeEventListener('keydown', removeHandler);
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') removeHandler(); });
}

// ─── Shortlist ────────────────────────────────────────────────────────────────
async function loadShortlistIds() {
  try {
    const res  = await fetch(`${API_BASE}/shortlist/${SESSION_ID}`);
    const json = await res.json();
    state.shortlistedIds = new Set(json.data.map((c) => c.id));
    updateShortlistCount();
  } catch {
    // Non-fatal
  }
}

function updateShortlistCount() {
  const count = state.shortlistedIds.size;
  el.shortlistCount.hidden   = count === 0;
  el.shortlistCount.textContent = String(count);
  // Enable compare when ≥ 2 colleges
  el.compareBtn.disabled = count < 2;
}

async function toggleShortlist(collegeId, buttonEl, isDetailButton = false) {
  const wasShortlisted = state.shortlistedIds.has(collegeId);
  try {
    if (wasShortlisted) {
      await fetch(`${API_BASE}/shortlist/${SESSION_ID}/${collegeId}`, { method: 'DELETE' });
      state.shortlistedIds.delete(collegeId);
      showToast('Removed from shortlist.', 'info');
    } else {
      await fetch(`${API_BASE}/shortlist/${SESSION_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ college_id: collegeId }),
      });
      state.shortlistedIds.add(collegeId);
      showToast('Added to shortlist! ★', 'success');
    }
    updateShortlistCount();
    const nowShortlisted = state.shortlistedIds.has(collegeId);
    if (isDetailButton) {
      buttonEl.classList.toggle('active', nowShortlisted);
      buttonEl.textContent = nowShortlisted ? '★ Shortlisted' : '☆ Add to shortlist';
    } else {
      buttonEl.classList.toggle('active', nowShortlisted);
      buttonEl.setAttribute('aria-label', (nowShortlisted ? 'Remove from' : 'Add to') + ' shortlist');
    }
  } catch {
    showToast('Could not update shortlist. Please try again.', 'error');
  }
}

async function openShortlistDrawer() {
  el.shortlistOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  el.shortlistContent.innerHTML = '<div class="loading-state"><div class="spinner"></div></div>';
  el.shortlistCloseBtn.focus();

  try {
    const res  = await fetch(`${API_BASE}/shortlist/${SESSION_ID}`);
    const json = await res.json();
    renderShortlistDrawer(json.data);
    trapFocus(el.shortlistOverlay.querySelector('.shortlist-drawer'));
  } catch {
    el.shortlistContent.innerHTML = '<p style="padding:24px;">Could not load your shortlist.</p>';
    showToast('Failed to load shortlist.', 'error');
  }
}

function renderShortlistDrawer(items) {
  if (items.length === 0) {
    el.shortlistContent.innerHTML = `
      <div class="shortlist-empty">
        <div class="shortlist-empty-icon" aria-hidden="true">⭐</div>
        <p>You haven't shortlisted any colleges yet.</p>
        <p>Tap the ☆ on any college card to save it here for comparison.</p>
      </div>`;
    return;
  }

  el.shortlistContent.innerHTML = items.map((c) => `
    <div class="shortlist-item" data-id="${c.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(c.name)} details">
      <div>
        <p class="shortlist-item-name">${escapeHtml(c.name)}</p>
        <p class="shortlist-item-meta">${escapeHtml(c.city)}, ${escapeHtml(c.state)} &middot; ${currency(c.avg_fees_per_year)}/yr</p>
      </div>
      <button type="button" class="shortlist-remove" data-id="${c.id}" aria-label="Remove ${escapeHtml(c.name)} from shortlist">
        Remove
      </button>
    </div>
  `).join('');

  el.shortlistContent.querySelectorAll('.shortlist-item').forEach((item) => {
    const openFn = () => {
      closeShortlistDrawer();
      openDetail(Number(item.dataset.id));
    };
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('shortlist-remove')) return;
      openFn();
    });
    item.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.classList.contains('shortlist-remove')) {
        e.preventDefault(); openFn();
      }
    });
  });

  el.shortlistContent.querySelectorAll('.shortlist-remove').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = Number(btn.dataset.id);
      try {
        await fetch(`${API_BASE}/shortlist/${SESSION_ID}/${id}`, { method: 'DELETE' });
        state.shortlistedIds.delete(id);
        updateShortlistCount();
        const res  = await fetch(`${API_BASE}/shortlist/${SESSION_ID}`);
        const json = await res.json();
        renderShortlistDrawer(json.data);
        // Sync star buttons in the results grid
        document.querySelectorAll(`.shortlist-toggle[data-id="${id}"]`).forEach((t) => {
          t.classList.remove('active');
        });
        showToast('Removed from shortlist.', 'info');
      } catch {
        showToast('Could not remove from shortlist.', 'error');
      }
    });
  });
}

function closeShortlistDrawer() {
  el.shortlistOverlay.hidden = true;
  document.body.style.overflow = '';
}

// ─── Compare Bar logic ────────────────────────────────────────────────────────
function toggleCompare(collegeId, name, buttonEl) {
  const isComparing = state.compareIds.has(collegeId);
  if (isComparing) {
    state.compareIds.delete(collegeId);
    state.compareList = state.compareList.filter(c => c.id !== collegeId);
    if (buttonEl) buttonEl.classList.remove('active');
    document.querySelectorAll(`.compare-toggle[data-id="${collegeId}"]`).forEach(btn => btn.classList.remove('active'));
    showToast('Removed from comparison.', 'info');
  } else {
    if (state.compareIds.size >= 3) {
      showToast('You can compare a maximum of 3 colleges.', 'warning');
      return;
    }
    state.compareIds.add(collegeId);
    state.compareList.push({ id: collegeId, name: name });
    if (buttonEl) buttonEl.classList.add('active');
    document.querySelectorAll(`.compare-toggle[data-id="${collegeId}"]`).forEach(btn => btn.classList.add('active'));
    showToast('Added to comparison! ⚖️', 'success');
  }
  localStorage.setItem('pk_compare', JSON.stringify(state.compareList));
  updateCompareBar();
}

function updateCompareBar() {
  const bar = document.getElementById('compareBar');
  const countEl = document.getElementById('compareBarCount');
  const thumbsEl = document.getElementById('compareBarThumbs');
  
  if (!bar || !countEl || !thumbsEl) return;

  const list = state.compareList || [];
  countEl.textContent = list.length;

  if (list.length === 0) {
    bar.classList.remove('open');
    return;
  }

  bar.classList.add('open');
  thumbsEl.innerHTML = list.map(c => `
    <span class="compare-thumb" data-id="${c.id}">
      ${escapeHtml(c.name)}
      <span class="compare-thumb-close" onclick="removeCompareFromBar(${c.id})">✕</span>
    </span>
  `).join('');
}

window.removeCompareFromBar = function(collegeId) {
  toggleCompare(collegeId, '', null);
};

function initCompareBarEvents() {
  const clearBtn = document.getElementById('compareClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.compareIds.clear();
      state.compareList = [];
      localStorage.setItem('pk_compare', JSON.stringify([]));
      document.querySelectorAll('.compare-toggle.active').forEach(btn => btn.classList.remove('active'));
      updateCompareBar();
      showToast('Cleared comparison list.', 'info');
    });
  }

  const submitBtn = document.getElementById('compareSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', () => {
      if (state.compareList.length < 2) {
        showToast('Please select at least 2 colleges to compare.', 'warning');
        return;
      }
      const ids = state.compareList.map(c => c.id).join(',');
      window.location.href = `compare.html?ids=${ids}`;
    });
  }

  updateCompareBar();
}

// ─── Compare modal ────────────────────────────────────────────────────────────
async function openCompareModal() {
  if (state.shortlistedIds.size < 2) return;
  el.compareOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  el.compareContent.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Loading comparison…</p></div>';
  el.compareCloseBtn.focus();

  try {
    const ids  = [...state.shortlistedIds].slice(0, 4); // max 4 colleges
    const data = await Promise.all(
      ids.map((id) => fetch(`${API_BASE}/colleges/${id}`).then((r) => r.json()))
    );
    renderCompareTable(data);
    trapFocus(el.compareOverlay.querySelector('.compare-modal'));
  } catch {
    el.compareContent.innerHTML = '<p style="padding:24px;">Could not load comparison data.</p>';
    showToast('Failed to load comparison.', 'error');
  }
}

function renderCompareTable(colleges) {
  // Calculate best values for highlighting
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
        return `<span class="compare-badge-wrapper">${c.nirf_ranking} ${isBest ? '<span class="winner-tag tag-gold">🏆 Best Rank</span>' : ''}</span>`;
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
        return `<span class="compare-badge-wrapper">${formatPlacement(c.avg_placement_package)} ${isBest ? '<span class="winner-tag tag-indigo">📈 Highest Avg</span>' : ''}</span>`;
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

  el.compareContent.innerHTML = `
    <table class="compare-table">
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function closeCompareModal() {
  el.compareOverlay.hidden = true;
  document.body.style.overflow = '';
}

// ─── Toast notifications ─────────────────────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type]}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss notification">&#x2715;</button>
  `;
  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  el.toastContainer.appendChild(toast);
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  toast.style.opacity  = '0';
  toast.style.transform = 'translateX(60px)';
  toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  setTimeout(() => toast.remove(), 300);
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Timeline Events & Helper Functions ───────────────────────────────────────
let dbTimelineEvents = [];

async function buildTimeline() {
  if (!el.timelineChain) return;

  try {
    const res = await fetch(`${API_BASE}/exams`);
    dbTimelineEvents = await res.ok ? await res.json() : [];
    dbTimelineEvents.sort((a, b) => {
      const priority = { 'Ongoing': 1, 'Upcoming': 2, 'Scheduled': 2, 'Completed': 3, 'Done': 3 };
      return (priority[a.status] || 99) - (priority[b.status] || 99);
    });
  } catch (err) {
    console.error('Failed to load dynamic timeline events:', err);
    dbTimelineEvents = [];
  }

  if (dbTimelineEvents.length === 0) {
    el.timelineChain.innerHTML = '<p style="padding:16px; font-size:12px; color:var(--text-3); text-align:center;">No timeline events live.</p>';
    return;
  }

  el.timelineChain.innerHTML = dbTimelineEvents.map(ev => {
    let statusClass = 'status-scheduled';
    let statusLabel = ev.status;

    if (ev.status === 'Ongoing') {
      statusClass = 'status-active';
    } else if (ev.status === 'Upcoming') {
      statusClass = 'status-upcoming';
    } else if (ev.status === 'Completed' || ev.status === 'Done') {
      statusClass = 'status-completed';
      statusLabel = 'Done';
    }

    const hasPostNote = (ev.status === 'Completed' || ev.status === 'Done') && ev.post_exam_note;

    return `
      <div class="timeline-item ${statusClass} ${state.exam === ev.badge_filter ? 'active' : ''}" data-exam="${escapeHtml(ev.badge_filter)}" role="button" tabindex="0" aria-label="Filter by colleges taking ${escapeHtml(ev.exam_name)}">
        <div class="timeline-dot-wrapper">
          <div class="timeline-dot"></div>
          <div class="timeline-line"></div>
        </div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-exam-name">${escapeHtml(ev.exam_name)}</span>
            <span class="timeline-status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
          </div>
          <div class="timeline-stream-info">📚 ${escapeHtml(ev.stream)} admissions</div>
          <div class="timeline-dates">${escapeHtml(ev.dates_details)}</div>
          ${hasPostNote ? `
            <div class="timeline-post-note" style="margin-top: 6px; font-size: 11.5px; color: var(--gold); border-left: 2.5px solid var(--gold); padding-left: 8px; font-style: italic; font-weight: 500; line-height: 1.45;">
              📢 ${escapeHtml(ev.post_exam_note)}
            </div>
          ` : ''}
          <div class="timeline-action-hint">Click to see eligible colleges →</div>
        </div>
      </div>
    `;
  }).join('');

  el.timelineChain.querySelectorAll('.timeline-item').forEach(item => {
    const examValue = item.dataset.exam;

    const applyFilter = () => {
      const isActive = state.exam === examValue;
      state.exam = isActive ? '' : examValue;
      state.page = 1;

      // Sync active state in the exam chips
      document.querySelectorAll('.exam-chip').forEach(chip => {
        const match = chip.dataset.exam === state.exam;
        chip.classList.toggle('active', match);
        chip.setAttribute('aria-pressed', match ? 'true' : 'false');
      });

      // Highlight active timeline items
      el.timelineChain.querySelectorAll('.timeline-item').forEach(tItem => {
        tItem.classList.toggle('active', tItem.dataset.exam === state.exam);
      });

      fetchAndRenderColleges();

      // Scroll to results
      el.resultsHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    item.addEventListener('click', applyFilter);
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        applyFilter();
      }
    });
  });
}

function renderAutocompleteSuggestions(data, query) {
  const container = el.autocompleteSuggestions;
  container.innerHTML = '';
  
  const { colleges, courses, cities } = data;
  const hasColleges = colleges && colleges.length > 0;
  const hasCourses = courses && courses.length > 0;
  const hasCities = cities && cities.length > 0;

  if (!hasColleges && !hasCourses && !hasCities) {
    container.hidden = true;
    return;
  }

  let html = '';

  // Colleges Group
  if (hasColleges) {
    html += `
      <div class="suggestion-group">
        <div class="suggestion-group-title">Colleges</div>
    `;
    colleges.forEach((c) => {
      const nirfBadge = c.nirf_ranking ? `<span class="suggestion-nirf">🏆 NIRF #${c.nirf_ranking}</span>` : '';
      html += `
        <div class="suggestion-item" data-type="college" data-id="${c.id}">
          <span class="suggestion-icon">🏫</span>
          <div class="suggestion-text">
            <div class="suggestion-name">${highlightMatch(c.name, query)}</div>
            <div class="suggestion-meta">${highlightMatch(c.city, query)}, ${escapeHtml(c.state)} · <span class="suggestion-stream">${escapeHtml(c.stream)}</span> ${nirfBadge}</div>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  // Courses Group
  if (hasCourses) {
    html += `
      <div class="suggestion-group">
        <div class="suggestion-group-title">Courses</div>
    `;
    courses.forEach((course) => {
      html += `
        <div class="suggestion-item" data-type="course" data-value="${escapeHtml(course)}">
          <span class="suggestion-icon">📖</span>
          <div class="suggestion-text">
            <div class="suggestion-name">${highlightMatch(course, query)}</div>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  // Cities Group
  if (hasCities) {
    html += `
      <div class="suggestion-group">
        <div class="suggestion-group-title">Cities</div>
    `;
    cities.forEach((cit) => {
      html += `
        <div class="suggestion-item" data-type="city" data-value="${escapeHtml(cit.city)}">
          <span class="suggestion-icon">📍</span>
          <div class="suggestion-text">
            <div class="suggestion-name">${highlightMatch(cit.city, query)}, ${escapeHtml(cit.state)}</div>
          </div>
        </div>`;
    });
    html += `</div>`;
  }

  container.innerHTML = html;
  container.hidden = false;

  // Bind click handlers to items
  container.querySelectorAll('.suggestion-item').forEach((item) => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      if (type === 'college') {
        const id = Number(item.dataset.id);
        openDetail(id);
      } else if (type === 'course') {
        const val = item.dataset.value;
        el.searchInput.value = val;
        state.q = val;
        state.page = 1;
        fetchAndRenderColleges();
      } else if (type === 'city') {
        const val = item.dataset.value;
        el.searchInput.value = val;
        state.q = val;
        state.page = 1;
        fetchAndRenderColleges();
      }
      container.hidden = true;
    });
  });
}

function updateSuggestionHighlight(items, activeSuggestionIndex) {
  items.forEach((item, idx) => {
    item.classList.toggle('highlighted', idx === activeSuggestionIndex);
    if (idx === activeSuggestionIndex) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

// ─── AUTHENTICATION STATE & LOGIC ──────────────────────────────────────────
let currentUser = null;
let editingCollegeId = null;

function getToken() {
  return localStorage.getItem('pk_token');
}

function setToken(token) {
  if (token) {
    localStorage.setItem('pk_token', token);
  } else {
    localStorage.removeItem('pk_token');
  }
}

async function initUserSession() {
  const token = getToken();
  if (!token) {
    updateUserUI();
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
    } else {
      setToken(null);
      currentUser = null;
    }
  } catch (err) {
    console.error('Failed to restore user session:', err);
    currentUser = null;
  }
  updateUserUI();
}

function updateUserUI() {
  if (currentUser) {
    if (el.navLoginBtn) el.navLoginBtn.style.display = 'none';
    if (el.profileDropdownContainer) el.profileDropdownContainer.style.display = 'inline-block';
    
    // Set user info on header trigger
    if (el.navUserName) el.navUserName.textContent = currentUser.name || currentUser.email;
    if (currentUser.picture && el.navUserPic) {
      el.navUserPic.src = currentUser.picture;
      el.navUserPic.style.display = 'inline-block';
    } else if (el.navUserPic) {
      el.navUserPic.style.display = 'none';
    }

    // Populate dropdown fields
    if (el.dropdownUserName) el.dropdownUserName.textContent = currentUser.name || 'User';
    if (el.dropdownUserEmail) el.dropdownUserEmail.textContent = currentUser.email || '';
    if (el.dropdownUserRole) {
      el.dropdownUserRole.textContent = currentUser.role === 'admin' ? 'Admin' : 'Student';
    }

    // Toggle admin action button in dropdown
    if (currentUser.role === 'admin' && el.dropdownAdminPortalBtn) {
      el.dropdownAdminPortalBtn.style.display = 'flex';
    } else if (el.dropdownAdminPortalBtn) {
      el.dropdownAdminPortalBtn.style.display = 'none';
    }
  } else {
    if (el.navLoginBtn) el.navLoginBtn.style.display = 'inline-flex';
    if (el.profileDropdownContainer) el.profileDropdownContainer.style.display = 'none';
    if (el.profileDropdownCard) el.profileDropdownCard.hidden = true;
  }
}

function bindAuthEvents() {
  // Open Login Overlay
  if (el.navLoginBtn) {
    el.navLoginBtn.addEventListener('click', () => {
      el.loginOverlay.hidden = false;
      document.body.style.overflow = 'hidden';
      el.loginEmail.focus();
    });
  }

  // Close Login Overlay
  if (el.loginCloseBtn) {
    el.loginCloseBtn.addEventListener('click', () => {
      el.loginOverlay.hidden = true;
      document.body.style.overflow = '';
    });
  }

  // Auth Tabs Logic
  if (el.tabLoginBtn && el.tabRegisterBtn) {
    el.tabLoginBtn.addEventListener('click', () => {
      el.tabLoginBtn.style.borderBottomColor = 'var(--indigo)';
      el.tabLoginBtn.style.color = 'var(--text)';
      el.tabRegisterBtn.style.borderBottomColor = 'transparent';
      el.tabRegisterBtn.style.color = 'var(--text-3)';
      el.loginForm.hidden = false;
      el.registerForm.hidden = true;
    });
    
    el.tabRegisterBtn.addEventListener('click', () => {
      el.tabRegisterBtn.style.borderBottomColor = 'var(--indigo)';
      el.tabRegisterBtn.style.color = 'var(--text)';
      el.tabLoginBtn.style.borderBottomColor = 'transparent';
      el.tabLoginBtn.style.color = 'var(--text-3)';
      el.registerForm.hidden = false;
      el.loginForm.hidden = true;
    });
  }

  // Local Registration Form
  if (el.registerForm) {
    el.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = el.registerName.value.trim();
      const email = el.registerEmail.value.trim();
      const password = el.registerPassword.value;
      
      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          setToken(data.token);
          currentUser = data.user;
          updateUserUI();
          el.loginOverlay.hidden = true;
          document.body.style.overflow = '';
          el.registerForm.reset();
          showToast('Account successfully created! Welcome!', 'success');
          if (checkLoginRedirect()) return;
        } else {
          showToast(data.error || 'Registration failed.', 'error');
        }
      } catch (err) {
        showToast('Server error. Could not register.', 'error');
      }
    });
  }

  // Local Login Form (Universal)
  if (el.loginForm) {
    el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = el.loginEmail.value.trim();
      const password = el.loginPassword.value;
      
      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (res.ok) {
          setToken(data.token);
          currentUser = data.user;
          updateUserUI();
          el.loginOverlay.hidden = true;
          document.body.style.overflow = '';
          el.loginForm.reset();
          showToast(`Welcome back, ${currentUser.name}!`, 'success');
          if (checkLoginRedirect()) return;
        } else {
          showToast(data.error || 'Login failed. Please check credentials.', 'error');
        }
      } catch (err) {
        showToast('Server error. Could not authenticate.', 'error');
      }
    });
  }

  // Password Recovery Modals Toggle
  if (el.openForgotPasswordBtn) {
    el.openForgotPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      el.loginOverlay.hidden = true;
      el.forgotPasswordOverlay.hidden = false;
    });
  }
  
  if (el.backToLoginBtn) {
    el.backToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      el.forgotPasswordOverlay.hidden = true;
      el.loginOverlay.hidden = false;
    });
  }
  
  if (el.forgotPasswordCloseBtn) {
    el.forgotPasswordCloseBtn.addEventListener('click', () => {
      el.forgotPasswordOverlay.hidden = true;
      document.body.style.overflow = '';
    });
  }

  // Forgot Password Submit
  if (el.forgotPasswordForm) {
    el.forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = el.forgotPasswordEmail.value.trim();
      
      try {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if (res.ok) {
          showToast('Reset link generated (Check server console for local demo)', 'success');
          el.forgotPasswordOverlay.hidden = true;
          document.body.style.overflow = '';
          el.forgotPasswordForm.reset();
        } else {
          showToast(data.error || 'Failed to request reset.', 'error');
        }
      } catch (err) {
        showToast('Server error.', 'error');
      }
    });
  }

  // Handle auto-opening Reset Modal via URL (?reset_token=abc)
  const urlParams = new URLSearchParams(window.location.search);
  const resetTokenParam = urlParams.get('reset_token');
  if (resetTokenParam && el.resetPasswordOverlay) {
    el.resetPasswordToken.value = resetTokenParam;
    el.resetPasswordOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    
    // Clear token from URL cleanly
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Reset Password Submit
  if (el.resetPasswordForm) {
    el.resetPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = el.resetPasswordToken.value;
      const newPassword = el.resetNewPassword.value;
      
      try {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, newPassword })
        });
        const data = await res.json();
        
        if (res.ok) {
          showToast('Password reset! You can now log in.', 'success');
          el.resetPasswordOverlay.hidden = true;
          el.loginOverlay.hidden = false;
          el.resetPasswordForm.reset();
        } else {
          showToast(data.error || 'Failed to reset password.', 'error');
        }
      } catch (err) {
        showToast('Server error.', 'error');
      }
    });
  }



  // Dropdown Items Action Binding
  if (el.dropdownEditProfileBtn) {
    el.dropdownEditProfileBtn.addEventListener('click', () => {
      el.profileDropdownCard.hidden = true;
      el.profileDropdownContainer.classList.remove('open');
      openProfileModal();
    });
  }

  if (el.dropdownAdminPortalBtn) {
    el.dropdownAdminPortalBtn.addEventListener('click', () => {
      el.profileDropdownCard.hidden = true;
      el.profileDropdownContainer.classList.remove('open');
      openAdminDashboard();
    });
  }



  // Profile Modal Controls
  if (el.profileCloseBtn) {
    el.profileCloseBtn.addEventListener('click', closeProfileModal);
  }
  if (el.profileFormCancelBtn) {
    el.profileFormCancelBtn.addEventListener('click', closeProfileModal);
  }
  if (el.profileFormPicture) {
    el.profileFormPicture.addEventListener('input', () => {
      const url = el.profileFormPicture.value.trim();
      el.profilePicPreview.src = url || 'https://lh3.googleusercontent.com/a/default-user=s100';
    });
  }
  if (el.profilePasswordChangeToggle) {
    el.profilePasswordChangeToggle.addEventListener('click', () => {
      const isHidden = el.profilePasswordSection.hidden;
      el.profilePasswordSection.hidden = !isHidden;
      el.profilePasswordChangeToggle.textContent = isHidden ? '🔒 Change Password ▲' : '🔒 Change Password ▼';
      
      if (!isHidden) {
        el.profileNewPassword.value = '';
        el.profileConfirmNewPassword.value = '';
      }
    });
  }
  if (el.profileEditForm) {
    el.profileEditForm.addEventListener('submit', handleProfileUpdateSubmit);
  }

  // Dev Bypass Action
  if (el.devBypassBtn) {
    el.devBypassBtn.addEventListener('click', async () => {
      // Simulate Google auth token exchange by passing a mock payload
      const mockPayload = {
        email: 'student.bypass@gmail.com',
        name: 'Demo Student',
        picture: 'https://lh3.googleusercontent.com/a/default-user=s100'
      };
      
      const mockCredential = 'header.' + btoa(JSON.stringify(mockPayload)) + '.signature';
      
      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: mockCredential })
        });
        const data = await res.json();
        if (res.ok) {
          setToken(data.token);
          currentUser = data.user;
          updateUserUI();
          el.loginOverlay.hidden = true;
          document.body.style.overflow = '';
          showToast('Demo Student loaded successfully!', 'success');
          if (checkLoginRedirect()) return;
        } else {
          showToast('Bypass authentication failed.', 'error');
        }
      } catch (err) {
        showToast('Connection error during bypass authentication.', 'error');
      }
    });
  }

  // Initialize Google Identity Services dynamically
  window.addEventListener('load', async () => {
    try {
      // Fetch public configuration from backend
      const configRes = await fetch(`${API_BASE}/auth/config`);
      const config = await configRes.json();
      const client_id = config.googleClientId;

      if (typeof google !== 'undefined') {
        if (client_id) {
          google.accounts.id.initialize({
            client_id: client_id,
            callback: handleGoogleCredentialResponse,
            cancel_on_tap_outside: true
          });
          
          google.accounts.id.renderButton(
            el.googleSignInContainer,
            { theme: 'outline', size: 'large', width: 280 }
          );
        } else {
          console.warn('Google Client ID is not configured in backend environment variables. Google Login button disabled.');
          if (el.googleSignInContainer) {
            el.googleSignInContainer.innerHTML = `
              <div style="font-size: 11.5px; color: var(--text-2); text-align: center; padding: 8px 12px; background: var(--surface-2); border: 1.5px dashed var(--border); border-radius: var(--radius-sm); line-height: 1.4;">
                ⚠️ Google Sign In is unconfigured.<br>Please use the <b>Bypass</b> button below.
              </div>
            `;
          }
        }
      } else {
        console.warn('Google GIS SDK not available. Using bypass logins.');
      }
    } catch (err) {
      console.error('Failed to fetch auth configuration from server:', err);
    }

    // Initialize Comparison Bar events
    initCompareBarEvents();
  });
}

// Google OAuth callback receiver
async function handleGoogleCredentialResponse(response) {
  try {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: response.credential })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      currentUser = data.user;
      updateUserUI();
      el.loginOverlay.hidden = true;
      document.body.style.overflow = '';
      showToast(`Welcome, ${currentUser.name}!`, 'success');
      if (checkLoginRedirect()) return;
    } else {
      showToast(data.error || 'Google login failed.', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to authentication server.', 'error');
  }
}

// ─── PROFILE MANAGEMENT CONTROLLER ─────────────────────────────────────────
function openProfileModal() {
  if (!currentUser) return;
  
  el.profileFormEmail.value = currentUser.email || '';
  el.profileFormName.value = currentUser.name || '';
  el.profileFormPicture.value = currentUser.picture || '';
  el.profilePicPreview.src = currentUser.picture || 'https://lh3.googleusercontent.com/a/default-user=s100';

  // Toggle password update options (local admin accounts only)
  if (currentUser.email === 'admin@pathshalakhoj.com') {
    el.profileLocalOnlySection.style.display = 'block';
  } else {
    el.profileLocalOnlySection.style.display = 'none';
  }

  el.profilePasswordSection.hidden = true;
  if (el.profilePasswordChangeToggle) {
    el.profilePasswordChangeToggle.textContent = '🔒 Change Password ▼';
  }
  el.profileNewPassword.value = '';
  el.profileConfirmNewPassword.value = '';

  el.profileOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeProfileModal() {
  el.profileOverlay.hidden = true;
  document.body.style.overflow = '';
}

async function handleProfileUpdateSubmit(e) {
  e.preventDefault();

  const token = getToken();
  if (!token) {
    showToast('Session expired. Please log in again.', 'error');
    return;
  }

  const name = el.profileFormName.value.trim();
  const picture = el.profileFormPicture.value.trim();
  const newPassword = el.profileNewPassword.value;
  const confirmPassword = el.profileConfirmNewPassword.value;

  if (!el.profilePasswordSection.hidden && (newPassword || confirmPassword)) {
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
  }

  const bodyData = {
    name,
    picture: picture || null
  };

  if (!el.profilePasswordSection.hidden && newPassword) {
    bodyData.new_password = newPassword;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(bodyData)
    });

    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      updateUserUI();
      closeProfileModal();
      showToast('Profile updated successfully.', 'success');
    } else {
      showToast(data.error || 'Failed to update profile.', 'error');
    }
  } catch {
    showToast('Network error while updating profile.', 'error');
  }
}

// ─── ADMIN DASHBOARD CONTROLLER ────────────────────────────────────────────
let editingExamId = null;
let activeAdminTab = 'colleges'; // 'colleges' | 'exams'

function bindAdminEvents() {
  if (el.navAdminDashboardBtn) {
    el.navAdminDashboardBtn.addEventListener('click', openAdminDashboard);
  }
  if (el.adminCloseBtn) {
    el.adminCloseBtn.addEventListener('click', closeAdminDashboard);
  }
  if (el.adminCreateNewBtn) {
    el.adminCreateNewBtn.addEventListener('click', openCreateCollegeForm);
  }
  
  if (el.adminSyncDataBtn) {
    el.adminSyncDataBtn.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to run a massive data sync across all colleges? This will automatically populate missing placement data, deadlines, rankings, and infrastructure metrics.')) return;
      
      const originalText = el.adminSyncDataBtn.innerHTML;
      el.adminSyncDataBtn.innerHTML = '<span class="spinner" style="width:14px; height:14px; display:inline-block; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></span> Syncing...';
      el.adminSyncDataBtn.disabled = true;
      
      try {
        const token = localStorage.getItem('pk_token');
        const res = await fetch('/api/colleges/sync', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (res.ok) {
          showToast(data.message || 'Global Sync successful! All N/A fields have been populated.', 'success');
          if (typeof fetchAdminColleges === 'function') fetchAdminColleges();
        } else {
          showToast(data.error || 'Failed to sync data.', 'error');
        }
      } catch (err) {
        console.error(err);
        showToast('Network error during data sync.', 'error');
      } finally {
        el.adminSyncDataBtn.innerHTML = originalText;
        el.adminSyncDataBtn.disabled = false;
      }
    });
  }
  if (el.adminCreateNewExamBtn) {
    el.adminCreateNewExamBtn.addEventListener('click', openCreateExamForm);
  }

  // Form cancels
  if (el.adminFormCancelBtn) {
    el.adminFormCancelBtn.addEventListener('click', () => {
      el.adminFormPanel.hidden = true;
      el.adminListPanel.hidden = false;
    });
  }
  if (el.adminExamFormCancelBtn) {
    el.adminExamFormCancelBtn.addEventListener('click', () => {
      el.adminExamFormPanel.hidden = true;
      el.adminExamsListPanel.hidden = false;
    });
  }

  // Row Adders
  if (el.adminAddCourseBtn) {
    el.adminAddCourseBtn.addEventListener('click', () => appendCourseRow());
  }
  if (el.adminAddContactBtn) {
    el.adminAddContactBtn.addEventListener('click', () => appendContactRow());
  }

  // Tab switching
  if (el.adminTabColleges) {
    el.adminTabColleges.addEventListener('click', () => switchAdminTab('colleges'));
  }
  if (el.adminTabExams) {
    el.adminTabExams.addEventListener('click', () => switchAdminTab('exams'));
  }

  // Submit Handlers
  if (el.collegeEditForm) {
    el.collegeEditForm.addEventListener('submit', handleCollegeFormSubmit);
  }
  if (el.examEditForm) {
    el.examEditForm.addEventListener('submit', handleExamFormSubmit);
  }
  // Setup Search and Filter in Admin College list
  const searchInput = document.getElementById('adminCollegeSearchInput');
  const streamFilter = document.getElementById('adminCollegeStreamFilter');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => loadAdminCollegesList(), 300));
  }
  if (streamFilter) {
    streamFilter.addEventListener('change', () => loadAdminCollegesList());
  }
}

async function openAdminDashboard() {
  el.adminOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  switchAdminTab('colleges');
}

function closeAdminDashboard() {
  el.adminOverlay.hidden = true;
  document.body.style.overflow = '';
}

function switchAdminTab(tab) {
  activeAdminTab = tab;
  
  // Update tab styling
  el.adminTabColleges.classList.toggle('active', tab === 'colleges');
  el.adminTabExams.classList.toggle('active', tab === 'exams');
  
  // Update visibility of add buttons
  el.adminCreateNewBtn.style.display = tab === 'colleges' ? 'inline-flex' : 'none';
  el.adminCreateNewExamBtn.style.display = tab === 'exams' ? 'inline-flex' : 'none';
  
  // Hide form panels
  el.adminFormPanel.hidden = true;
  el.adminExamFormPanel.hidden = true;

  if (tab === 'colleges') {
    el.adminListPanel.hidden = false;
    el.adminExamsListPanel.hidden = true;
    loadAdminCollegesList();
  } else {
    el.adminListPanel.hidden = true;
    el.adminExamsListPanel.hidden = false;
    loadAdminExamsList();
  }
}

async function loadAdminCollegesList() {
  if (!el.adminCollegeTableBody) return;
  el.adminCollegeTableBody.innerHTML = '<tr><td colspan="5" style="padding: 24px; text-align: center; color: var(--text-2);">Loading colleges list…</td></tr>';
  
  const searchVal = document.getElementById('adminCollegeSearchInput')?.value || '';
  const streamVal = document.getElementById('adminCollegeStreamFilter')?.value || '';

  let url = `${API_BASE}/colleges?limit=100`;
  if (searchVal) {
    url += `&q=${encodeURIComponent(searchVal)}`;
  }
  if (streamVal) {
    url += `&stream=${encodeURIComponent(streamVal)}`;
  }

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.colleges || data.colleges.length === 0) {
      el.adminCollegeTableBody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-2);">No colleges found. Adjust filters or click "Add New" to get started.</td></tr>';
      return;
    }

    el.adminCollegeTableBody.innerHTML = data.colleges.map(c => {
      const hasInfo  = c.description && c.description.length > 80;
      const hasLogo  = c.logo_url && c.logo_url.length > 5;
      const dataStatus = hasInfo
        ? '<span class="admin-data-indicator" style="color:#059669; font-weight:700; font-size:11px;">✓ Has Info</span>'
        : '<span class="admin-data-indicator" style="color:var(--rose); font-size:11px;">✗ Missing</span>';
      return `
        <tr style="border-bottom: 1px solid var(--border); vertical-align: middle;">
          <td style="padding: 12px 16px; font-weight: 600; color: var(--text);">${escapeHtml(c.name)}</td>
          <td style="padding: 12px 16px; color: var(--text-2);">${escapeHtml(c.city)}, ${escapeHtml(c.state)}</td>
          <td style="padding: 12px 16px;"><span class="badge badge-type" style="padding: 3px 8px; font-size:11px;">${escapeHtml(c.stream)}</span></td>
          <td style="padding: 12px 16px;">${dataStatus}</td>
          <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
            <button type="button" class="btn-secondary admin-sync-wiki-btn" data-id="${c.id}" data-name="${escapeHtml(c.name)}" title="Quick Sync Wikipedia Info" style="padding: 4px 8px; font-size: 11px; margin-right: 4px; border-color: var(--indigo); color: var(--indigo);">🔄 Sync</button>
            <button type="button" class="btn-secondary admin-sync-web-btn" data-id="${c.id}" title="Crawl Official Website" style="padding: 4px 8px; font-size: 11px; margin-right: 4px; border-color: #10b981; color: #10b981;">🔗 Site</button>
            <button type="button" class="btn-secondary admin-edit-btn" data-id="${c.id}" style="padding: 4px 10px; font-size: 11px; margin-right: 6px;">✏️ Edit</button>
            <button type="button" class="btn-secondary admin-delete-btn" data-id="${c.id}" style="padding: 4px 10px; font-size: 11px; color: var(--rose); border-color: rgba(204,68,68,0.25);">🗑️ Delete</button>
          </td>
        </tr>
      `;
    }).join('');

    el.adminCollegeTableBody.querySelectorAll('.admin-sync-wiki-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof window.adminQuickSyncWiki === 'function') {
          window.adminQuickSyncWiki(btn.dataset.id, btn.dataset.name, btn);
        }
      });
    });

    el.adminCollegeTableBody.querySelectorAll('.admin-sync-web-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ ...';
        showToast('Crawling official website...', 'info');
        try {
          const res = await fetch(`${API_BASE}/colleges/${btn.dataset.id}/sync-website`, { method: 'POST' });
          const result = await res.json();
          if (res.ok) {
            showToast(`Website crawled successfully! Added ${result.new_socials_added || 0} social contacts. 🎉`, 'success');
          } else {
            showToast(result.error || 'Failed to crawl website.', 'error');
          }
        } catch {
          showToast('Network error during website crawl.', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = '🔗 Site';
        }
      });
    });

    el.adminCollegeTableBody.querySelectorAll('.admin-sync-rev-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = '⏳ ...';
        showToast('Syncing Google student reviews...', 'info');
        try {
          const res = await fetch(`${API_BASE}/colleges/${btn.dataset.id}/sync-reviews`, { method: 'POST' });
          const result = await res.json();
          if (res.ok) {
            showToast('Google Reviews synced successfully! 🎉', 'success');
          } else {
            showToast(result.error || 'Failed to sync reviews.', 'error');
          }
        } catch {
          showToast('Network error during reviews sync.', 'error');
        } finally {
          btn.disabled = false;
          btn.textContent = '📝 Reviews';
        }
      });
    });

    el.adminCollegeTableBody.querySelectorAll('.admin-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => loadCollegeIntoForm(Number(btn.dataset.id)));
    });

    el.adminCollegeTableBody.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteCollegeAction(Number(btn.dataset.id)));
    });

  } catch (err) {
    el.adminCollegeTableBody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--rose);">Failed to load colleges.</td></tr>';
  }
}

function openCreateCollegeForm() {
  editingCollegeId = null;
  el.adminFormTitle.textContent = 'Add New College';
  el.collegeEditForm.reset();
  el.adminCoursesContainer.innerHTML = '';
  el.adminContactsContainer.innerHTML = '';
  
  appendCourseRow();
  appendContactRow();
  
  el.adminListPanel.hidden = true;
  el.adminFormPanel.hidden = false;
}

async function loadCollegeIntoForm(id) {
  try {
    const res = await fetch(`${API_BASE}/colleges/${id}`);
    if (!res.ok) throw new Error();
    const college = await res.json();
    
    editingCollegeId = id;
    el.adminFormTitle.textContent = `Edit College: ${college.name}`;
    
    el.adminFormName.value = college.name || '';
    el.adminFormStream.value = college.stream || 'Engineering';
    el.adminFormCity.value = college.city || '';
    el.adminFormState.value = college.state || '';
    el.adminFormPincode.value = college.pincode || '';
    el.adminFormType.value = college.college_type || 'Government';
    el.adminFormNaac.value = college.naac_grade || '';
    el.adminFormEstablished.value = college.established_year || '';
    el.adminFormFees.value = college.avg_fees_per_year || '';
    el.adminFormNirf.value = college.nirf_ranking || '';
    el.adminFormAvgPlacement.value = college.avg_placement_package || '';
    el.adminFormMaxPlacement.value = college.highest_placement_package || '';
    el.adminFormDesc.value = college.description || '';
    el.adminFormGallery.value = college.gallery_images && Array.isArray(college.gallery_images) ? college.gallery_images.join(', ') : '';
    
    el.adminFormPlacementRate.value = college.placement_rate || '';
    el.adminFormCampusSize.value = college.campus_size || '';
    el.adminFormHostel.value = college.hostel_available !== undefined && college.hostel_available !== null ? (college.hostel_available ? '1' : '0') : '';
    el.adminFormWebsite.value = college.website || '';
    el.adminFormContactEmail.value = college.contact_email || '';
    el.adminFormContactPhone.value = college.contact_phone || '';
    
    // Parse facilities if it's a JSON string
    if (college.facilities) {
      try {
        const facArr = typeof college.facilities === 'string' ? JSON.parse(college.facilities) : college.facilities;
        el.adminFormFacilities.value = Array.isArray(facArr) ? facArr.join(', ') : '';
      } catch (e) {
        el.adminFormFacilities.value = '';
      }
    } else {
      el.adminFormFacilities.value = '';
    }

    el.adminFormStudentRating.value = college.student_rating || '';
    el.adminFormApplicationDeadline.value = college.application_deadline || '';
    el.adminFormTopRecruiters.value = college.top_recruiters || '';
    el.adminFormScholarshipsInfo.value = college.scholarships_info || '';

    el.adminCoursesContainer.innerHTML = '';
    if (college.courses && college.courses.length > 0) {
      college.courses.forEach(c => appendCourseRow(c));
    } else {
      appendCourseRow();
    }

    el.adminContactsContainer.innerHTML = '';
    if (college.contacts && college.contacts.length > 0) {
      college.contacts.forEach(c => appendContactRow(c));
    } else {
      appendContactRow();
    }

    el.adminListPanel.hidden = true;
    el.adminFormPanel.hidden = false;
  } catch {
    showToast('Failed to fetch college details for editing.', 'error');
  }
}

function appendCourseRow(course = null) {
  const container = el.adminCoursesContainer;
  const row = document.createElement('div');
  row.className = 'admin-course-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1.5fr 1fr 1fr 1fr 1fr 1.2fr auto';
  row.style.gap = '8px';
  row.style.alignItems = 'center';
  row.style.marginBottom = '6px';

  row.innerHTML = `
    <input type="text" class="c-name" placeholder="Course Name" required value="${course ? escapeHtml(course.name) : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
    <select class="c-level" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;">
      <option value="UG" ${course && course.level === 'UG' ? 'selected' : ''}>UG</option>
      <option value="PG" ${course && course.level === 'PG' ? 'selected' : ''}>PG</option>
      <option value="XI-XII" ${course && course.level === 'XI-XII' ? 'selected' : ''}>XI-XII</option>
      <option value="PhD" ${course && course.level === 'PhD' ? 'selected' : ''}>PhD</option>
      <option value="Diploma" ${course && course.level === 'Diploma' ? 'selected' : ''}>Diploma</option>
    </select>
    <input type="number" class="c-fees" placeholder="Fees / Year" value="${course && course.fees_per_year != null ? course.fees_per_year : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
    <input type="number" class="c-seats" placeholder="Seats" value="${course && course.seats != null ? course.seats : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
    <input type="number" step="0.5" class="c-duration" placeholder="Duration (yrs)" value="${course && course.duration_years != null ? course.duration_years : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
    <input type="text" class="c-exam" placeholder="Entrance Exam" value="${course && course.entrance_exam ? escapeHtml(course.entrance_exam) : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
    <button type="button" class="btn-secondary row-remove-btn" style="padding: 6px 10px; font-size: 11px; color: var(--rose); border-color: rgba(204,68,68,0.25);">✕</button>
  `;

  row.querySelector('.row-remove-btn').addEventListener('click', () => {
    row.remove();
  });

  container.appendChild(row);
}

function appendContactRow(contact = null) {
  const container = el.adminContactsContainer;
  const row = document.createElement('div');
  row.className = 'admin-contact-row';
  row.style.display = 'grid';
  row.style.gridTemplateColumns = '1.2fr 2fr 1.5fr auto';
  row.style.gap = '8px';
  row.style.alignItems = 'center';
  row.style.marginBottom = '6px';

  row.innerHTML = `
    <select class="con-type" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;">
      <option value="phone" ${contact && contact.contact_type === 'phone' ? 'selected' : ''}>Phone</option>
      <option value="email" ${contact && contact.contact_type === 'email' ? 'selected' : ''}>Email</option>
      <option value="website" ${contact && contact.contact_type === 'website' ? 'selected' : ''}>Website</option>
      <option value="address" ${contact && contact.contact_type === 'address' ? 'selected' : ''}>Address</option>
    </select>
    <input type="text" class="con-value" placeholder="Value (e.g. +91 99..., admissions@...)" required value="${contact ? escapeHtml(contact.contact_value) : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
    <input type="text" class="con-label" placeholder="Label (e.g. Admissions, Enquiry)" value="${contact && contact.label ? escapeHtml(contact.label) : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
    <button type="button" class="btn-secondary row-remove-btn" style="padding: 6px 10px; font-size: 11px; color: var(--rose); border-color: rgba(204,68,68,0.25);">✕</button>
  `;

  row.querySelector('.row-remove-btn').addEventListener('click', () => {
    row.remove();
  });

  container.appendChild(row);
}

async function handleCollegeFormSubmit(e) {
  e.preventDefault();
  
  const token = getToken();
  if (!token) {
    showToast('Session expired. Please log in again.', 'error');
    return;
  }

  const courses = [];
  el.adminCoursesContainer.querySelectorAll('.admin-course-row').forEach(row => {
    const name = row.querySelector('.c-name').value.trim();
    if (!name) return;
    courses.push({
      name,
      level: row.querySelector('.c-level').value,
      fees_per_year: parseInt(row.querySelector('.c-fees').value, 10) || 0,
      seats: parseInt(row.querySelector('.c-seats').value, 10) || null,
      duration_years: parseFloat(row.querySelector('.c-duration').value) || null,
      entrance_exam: row.querySelector('.c-exam').value.trim() || null
    });
  });

  const contacts = [];
  el.adminContactsContainer.querySelectorAll('.admin-contact-row').forEach(row => {
    const val = row.querySelector('.con-value').value.trim();
    if (!val) return;
    contacts.push({
      contact_type: row.querySelector('.con-type').value,
      contact_value: val,
      label: row.querySelector('.con-label').value.trim() || null
    });
  });

  let facArr = null;
  const facVal = el.adminFormFacilities.value.trim();
  if (facVal) {
    facArr = facVal.split(',').map(s => s.trim()).filter(s => s);
  }

  const bodyData = {
    name: el.adminFormName.value.trim(),
    stream: el.adminFormStream.value,
    city: el.adminFormCity.value.trim(),
    state: el.adminFormState.value.trim(),
    pincode: el.adminFormPincode.value.trim() || null,
    college_type: el.adminFormType.value,
    naac_grade: el.adminFormNaac.value.trim() || null,
    established_year: parseInt(el.adminFormEstablished.value, 10) || null,
    avg_fees_per_year: parseInt(el.adminFormFees.value, 10) || null,
    nirf_ranking: parseInt(el.adminFormNirf.value, 10) || null,
    avg_placement_package: parseFloat(el.adminFormAvgPlacement.value) || null,
    highest_placement_package: parseFloat(el.adminFormMaxPlacement.value) || null,
    description: el.adminFormDesc.value.trim() || null,
    gallery_images: el.adminFormGallery.value.trim() ? el.adminFormGallery.value.split(',').map(u => u.trim()).filter(u => u) : null,
    placement_rate: parseFloat(el.adminFormPlacementRate.value) || null,
    campus_size: el.adminFormCampusSize.value.trim() || null,
    hostel_available: el.adminFormHostel.value === '1' ? true : (el.adminFormHostel.value === '0' ? false : null),
    website: el.adminFormWebsite.value.trim() || null,
    contact_email: el.adminFormContactEmail.value.trim() || null,
    contact_phone: el.adminFormContactPhone.value.trim() || null,
    facilities: facArr ? JSON.stringify(facArr) : null,
    student_rating: parseFloat(el.adminFormStudentRating.value) || null,
    application_deadline: el.adminFormApplicationDeadline.value.trim() || null,
    top_recruiters: el.adminFormTopRecruiters.value.trim() || null,
    scholarships_info: el.adminFormScholarshipsInfo.value.trim() || null,
    courses,
    contacts
  };

  try {
    let res;
    if (editingCollegeId) {
      res = await fetch(`${API_BASE}/colleges/${editingCollegeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
    } else {
      res = await fetch(`${API_BASE}/colleges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
    }

    if (res.ok) {
      showToast(editingCollegeId ? 'College details updated successfully.' : 'New college added successfully.', 'success');
      el.adminFormPanel.hidden = true;
      el.adminListPanel.hidden = false;
      await loadAdminCollegesList();
      fetchAndRenderColleges();
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save college details.', 'error');
    }
  } catch {
    showToast('Failed to save. Connection error.', 'error');
  }
}

async function deleteCollegeAction(id) {
  const token = getToken();
  if (!token) return;

  if (!confirm('Are you absolutely sure you want to delete this college? This action cannot be undone and will delete all associated courses and contacts.')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/colleges/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      showToast('College deleted successfully.', 'success');
      await loadAdminCollegesList();
      fetchAndRenderColleges();
    } else {
      showToast('Failed to delete college.', 'error');
    }
  } catch {
    showToast('Network error while deleting college.', 'error');
  }
}

// ─── ADMIN TIMELINE EXAMS FUNCTIONS ───────────────────────────────────────
async function loadAdminExamsList() {
  if (!el.adminExamsTableBody) return;
  el.adminExamsTableBody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-2);">Loading exams list…</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/exams`);
    const data = await res.json();

    if (data.length === 0) {
      el.adminExamsTableBody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-2);">No exams found. Click "Add New Exam" to create one.</td></tr>';
      return;
    }

    el.adminExamsTableBody.innerHTML = data.map(ev => `
      <tr style="border-bottom: 1px solid var(--border); vertical-align: middle;">
        <td style="padding: 12px 16px; font-weight: 600; color: var(--text);">${escapeHtml(ev.exam_name)}</td>
        <td style="padding: 12px 16px; color: var(--text-2);">${escapeHtml(ev.stream)}</td>
        <td style="padding: 12px 16px;">
          <span class="badge ${ev.status === 'Completed' || ev.status === 'Done' ? 'badge-govt' : 'badge-nirf'}" style="padding: 3px 8px; font-size:11px;">
            ${escapeHtml(ev.status)}
          </span>
        </td>
        <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
          <button type="button" class="btn-secondary exam-edit-btn" data-id="${ev.id}" style="padding: 4px 10px; font-size: 11px; margin-right: 6px;">✏️ Edit</button>
          <button type="button" class="btn-secondary exam-delete-btn" data-id="${ev.id}" style="padding: 4px 10px; font-size: 11px; color: var(--rose); border-color: rgba(204,68,68,0.25);">🗑️ Delete</button>
        </td>
      </tr>
    `).join('');

    el.adminExamsTableBody.querySelectorAll('.exam-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => loadExamIntoForm(Number(btn.dataset.id)));
    });

    el.adminExamsTableBody.querySelectorAll('.exam-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteExamAction(Number(btn.dataset.id)));
    });

  } catch (err) {
    el.adminExamsTableBody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--rose);">Failed to load exams.</td></tr>';
  }
}

function openCreateExamForm() {
  editingExamId = null;
  el.adminExamFormTitle.textContent = 'Add New Exam Details';
  el.examEditForm.reset();
  
  el.adminExamsListPanel.hidden = true;
  el.adminExamFormPanel.hidden = false;
}

async function loadExamIntoForm(id) {
  try {
    // Find exam details from local cached array loaded earlier, or fetch
    const exam = dbTimelineEvents.find(e => e.id === id);
    if (!exam) return;

    editingExamId = id;
    el.adminExamFormTitle.textContent = `Edit Exam: ${exam.exam_name}`;

    el.adminExamFormName.value = exam.exam_name || '';
    el.adminExamFormStream.value = exam.stream || 'Engineering';
    el.adminExamFormDates.value = exam.dates_details || '';
    el.adminExamFormStatus.value = exam.status || 'Scheduled';
    el.adminExamFormBadge.value = exam.badge_filter || '';
    el.adminExamFormNote.value = exam.post_exam_note || '';

    el.adminExamsListPanel.hidden = true;
    el.adminExamFormPanel.hidden = false;
  } catch {
    showToast('Failed to load exam data.', 'error');
  }
}

async function handleExamFormSubmit(e) {
  e.preventDefault();

  const token = getToken();
  if (!token) return;

  const bodyData = {
    exam_name: el.adminExamFormName.value.trim(),
    stream: el.adminExamFormStream.value,
    dates_details: el.adminExamFormDates.value.trim(),
    status: el.adminExamFormStatus.value,
    badge_filter: el.adminExamFormBadge.value.trim(),
    post_exam_note: el.adminExamFormNote.value.trim() || null
  };

  try {
    let res;
    if (editingExamId) {
      res = await fetch(`${API_BASE}/exams/${editingExamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
    } else {
      res = await fetch(`${API_BASE}/exams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
    }

    if (res.ok) {
      showToast(editingExamId ? 'Exam timetable updated.' : 'Exam added to timeline.', 'success');
      el.adminExamFormPanel.hidden = true;
      el.adminExamsListPanel.hidden = false;
      await loadAdminExamsList();
      buildTimeline(); // update dynamic timeline
    } else {
      const data = await res.json();
      showToast(data.error || 'Failed to save exam details.', 'error');
    }
  } catch {
    showToast('Failed to save exam. Network error.', 'error');
  }
}

async function deleteExamAction(id) {
  const token = getToken();
  if (!token) return;

  if (!confirm('Are you sure you want to remove this exam from the upcoming timeline?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/exams/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      showToast('Exam deleted successfully.', 'success');
      await loadAdminExamsList();
      buildTimeline();
    } else {
      showToast('Failed to delete exam.', 'error');
    }
  } catch {
    showToast('Network error while deleting exam.', 'error');
  }
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();

// --- Mobile Navigation ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const headerNav = document.getElementById('headerNav');

if (mobileMenuBtn && headerNav) {
  const overlay = document.createElement('div');
  overlay.className = 'mobile-menu-overlay';
  document.body.appendChild(overlay);

  function toggleMenu() {
    headerNav.classList.toggle('menu-open');
    overlay.classList.toggle('open');
    document.body.style.overflow = headerNav.classList.contains('menu-open') ? 'hidden' : '';
  }

  mobileMenuBtn.addEventListener('click', toggleMenu);
  overlay.addEventListener('click', toggleMenu);
}

function checkLoginRedirect() {
  const p = new URLSearchParams(window.location.search);
  const redirect = p.get('redirect');
  if (redirect) {
    try {
      const url = new URL(redirect, window.location.origin);
      if (url.origin === window.location.origin) {
        window.location.href = redirect;
        return true;
      }
    } catch (e) {}
  }
  return false;
}


