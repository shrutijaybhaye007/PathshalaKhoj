/**
 * boot.js — Application entry point
 *
 * This is the LAST script loaded on index.html. By the time this runs,
 * all other scripts are ready:
 *   global.js          — theme, nav, shared UI helpers
 *   app.js             — core search, filters, cards, shortlist, compare
 *   js/auth.module.js  — initAuth, openLoginModal, handleGoogleCredentialResponse
 *   js/admin.module.js — bindAdminEvents, openAdminDashboard, loadAdminCollegesList
 *
 * Calling init() + initAuth() here guarantees every function it depends on is defined.
 */
(async () => {
  // Initialize authentication state first (defines currentUser, attaches auth event listeners)
  if (typeof initAuth === 'function') await initAuth();
  
  // Then initialize the main application logic, which relies on currentUser
  if (typeof init === 'function') await init();
})();
