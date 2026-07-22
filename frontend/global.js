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

// Global Toast Notifications & Utility Helpers
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss notification">&#x2715;</button>
  `;
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) closeBtn.addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  if (!toast) return;
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(60px)';
  toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  setTimeout(() => { if (toast && toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

window.showToast = showToast;
window.removeToast = removeToast;
window.escapeHtml = escapeHtml;
window.checkLoginRedirect = checkLoginRedirect;
