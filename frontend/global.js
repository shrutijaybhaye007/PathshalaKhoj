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

    // Create close button inside the nav panel
    const mobileCloseBtn = document.createElement('button');
    mobileCloseBtn.type = 'button';
    mobileCloseBtn.className = 'mobile-nav-close';
    mobileCloseBtn.setAttribute('aria-label', 'Close menu');
    mobileCloseBtn.innerHTML = '&#x2715;'; // ✕
    headerNav.insertBefore(mobileCloseBtn, headerNav.firstChild);

    function openMobileMenu() {
      headerNav.classList.add('menu-open');
      mobileOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      mobileCloseBtn.focus();
    }
    function closeMobileMenu() {
      headerNav.classList.remove('menu-open');
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
      mobileMenuBtn.focus();
    }

    mobileMenuBtn.addEventListener('click', () => {
      headerNav.classList.contains('menu-open') ? closeMobileMenu() : openMobileMenu();
    });
    mobileCloseBtn.addEventListener('click', closeMobileMenu);
    mobileOverlay.addEventListener('click', closeMobileMenu);
    // Escape key closes menu
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && headerNav.classList.contains('menu-open')) closeMobileMenu();
    });
    // Close on nav link click (single-page style) — excluding the close button itself
    headerNav.querySelectorAll('a').forEach(el => {
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
      // Keep aria-expanded in sync for screen readers
      profileTriggerBtn.setAttribute('aria-expanded', String(isHidden));
      if (profileDropdownContainer) {
        profileDropdownContainer.classList.toggle('open', isHidden);
      }
    });

    document.addEventListener('click', (e) => {
      if (profileDropdownContainer && !profileDropdownContainer.contains(e.target)) {
        profileDropdownCard.hidden = true;
        profileTriggerBtn.setAttribute('aria-expanded', 'false');
        profileDropdownContainer.classList.remove('open');
      }
    });
  }

  // --- Sign In Button Styling ---
  const navLoginBtn = document.getElementById('navLoginBtn');
  if (navLoginBtn) {
    navLoginBtn.classList.add('btn-signin');
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
