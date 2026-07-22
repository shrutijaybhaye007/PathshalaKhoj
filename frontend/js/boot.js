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
if (typeof init === 'function') init();
if (typeof initAuth === 'function') initAuth();
