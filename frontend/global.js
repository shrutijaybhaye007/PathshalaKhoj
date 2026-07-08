/**
 * global.js
 * Handles global UI logic: Theme Toggle, Mobile Nav, Profile Dropdown, and Authentication Sync.
 * This should be loaded on every page.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Theme Toggle Logic ---
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  
  function applyThemeGlobally(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pk_theme', theme);
    if (themeToggleBtn) {
      themeToggleBtn.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'
      );
      themeToggleBtn.title =
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  // Initialize theme states on load
  const savedTheme = localStorage.getItem('pk_theme') || 'light';
  applyThemeGlobally(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyThemeGlobally(next);
    });
  }

  // --- Mobile Menu Logic ---
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const headerNav = document.getElementById('headerNav');
  if (mobileMenuBtn && headerNav) {
    // Create overlay backdrop
    const mobileOverlay = document.createElement('div');
    mobileOverlay.className = 'mobile-menu-overlay';
    document.body.appendChild(mobileOverlay);

    function openMobileMenu() {
      headerNav.classList.add('menu-open');
      mobileOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileMenu() {
      headerNav.classList.remove('menu-open');
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    mobileMenuBtn.addEventListener('click', () => {
      headerNav.classList.contains('menu-open') ? closeMobileMenu() : openMobileMenu();
    });
    mobileOverlay.addEventListener('click', closeMobileMenu);
    // Close on nav link click (single-page style)
    headerNav.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', closeMobileMenu);
    });
  }

  // --- Profile Dropdown Logic ---
  const profileDropdownContainer = document.getElementById('profileDropdownContainer');
  const profileTriggerBtn = document.getElementById('profileTriggerBtn');
  const profileDropdownCard = document.getElementById('profileDropdownCard');

  if (profileTriggerBtn && profileDropdownCard) {
    profileTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = profileDropdownCard.hidden;
      profileDropdownCard.hidden = !isHidden;
      if (profileDropdownContainer) {
        profileDropdownContainer.classList.toggle('open', isHidden);
      }
    });

    document.addEventListener('click', (e) => {
      if (profileDropdownContainer && !profileDropdownContainer.contains(e.target)) {
        profileDropdownCard.hidden = true;
        profileDropdownContainer.classList.remove('open');
      }
    });
  }

  // --- Auth Sync Logic ---
  async function syncAuthGlobal() {
    const token = localStorage.getItem('pk_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        
        const navLoginBtn = document.getElementById('navLoginBtn');
        const navUserPic = document.getElementById('navUserPic');
        const navUserName = document.getElementById('navUserName');
        const dropdownUserName = document.getElementById('dropdownUserName');
        const dropdownUserEmail = document.getElementById('dropdownUserEmail');
        const dropdownUserRole = document.getElementById('dropdownUserRole');
        
        if (navLoginBtn) navLoginBtn.style.display = 'none';
        if (profileDropdownContainer) profileDropdownContainer.style.display = 'inline-block';
        
        if (user.picture && navUserPic) {
          navUserPic.src = user.picture;
          navUserPic.style.display = 'inline-block';
        }
        if (navUserName) navUserName.textContent = user.name || 'User';
        if (dropdownUserName) dropdownUserName.textContent = user.name || 'User';
        if (dropdownUserEmail) dropdownUserEmail.textContent = user.email || '';
        if (dropdownUserRole) dropdownUserRole.textContent = user.role === 'admin' ? 'Administrator' : 'Student';
        
        const dropdownAdminPortalBtn = document.getElementById('dropdownAdminPortalBtn');
        if (dropdownAdminPortalBtn) {
          dropdownAdminPortalBtn.style.display = user.role === 'admin' ? 'flex' : 'none';
        }
        
        window.currentUser = user; // Expose globally for other scripts
        document.dispatchEvent(new CustomEvent('authSynced', { detail: user }));
      } else {
        localStorage.removeItem('pk_token');
      }
    } catch (err) {
      console.error('Auth sync failed:', err);
    }
  }

  syncAuthGlobal();

  // --- Logout Logic ---
  const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
  if (dropdownLogoutBtn) {
    dropdownLogoutBtn.addEventListener('click', () => {
      localStorage.removeItem('pk_token');
      window.location.reload();
    });
  }

  // --- Global Sign In Redirect ---
  const navLoginBtn = document.getElementById('navLoginBtn');
  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', () => {
      // If we are on index.html, it handles modal. Otherwise redirect.
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/?login=true&redirect=' + encodeURIComponent(window.location.href);
      }
    });
  }

  // --- Admin Dashboard Redirect ---
  const dropdownAdminPortalBtn = document.getElementById('dropdownAdminPortalBtn');
  if (dropdownAdminPortalBtn) {
    dropdownAdminPortalBtn.addEventListener('click', () => {
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/?admin=true';
      }
    });
  }

  // --- Profile Settings Redirect ---
  const dropdownEditProfileBtn = document.getElementById('dropdownEditProfileBtn');
  if (dropdownEditProfileBtn) {
    dropdownEditProfileBtn.addEventListener('click', () => {
      if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
        window.location.href = '/?profile=true';
      }
    });
  }

  // --- Admin Metrics Auto-Populate ---
  async function populateAdminMetrics() {
    const adminOverlay = document.getElementById('adminOverlay');
    if (!adminOverlay) return;

    let collegesEl = null;
    let examsEl = null;
    let placementEl = null;

    const divs = adminOverlay.getElementsByTagName('div');
    for (let i = 0; i < divs.length; i++) {
      const txt = divs[i].textContent.trim();
      if (txt === 'Colleges' && divs[i].nextElementSibling) {
        collegesEl = divs[i].nextElementSibling;
      } else if (txt === 'Active Exams' && divs[i].nextElementSibling) {
        examsEl = divs[i].nextElementSibling;
      } else if (txt === 'Avg Placement' && divs[i].nextElementSibling) {
        placementEl = divs[i].nextElementSibling;
      }
    }

    if (!collegesEl || !examsEl || !placementEl) return;

    try {
      const res = await fetch('/api/colleges/stats');
      if (res.ok) {
        const stats = await res.json();
        collegesEl.textContent = Number(stats.collegesCount).toLocaleString('en-IN');
        examsEl.textContent = `${stats.examsCount} Events`;
        placementEl.textContent = `${stats.avgPlacement} LPA`;
      }
    } catch (err) {
      console.error('Failed to populate admin metrics:', err);
    }
  }

  populateAdminMetrics();

});
