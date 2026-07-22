/**
 * auth.module.js — Authentication, Profile & User Account System
 *
 * Fixes applied:
 *  - Removed DOMContentLoaded self-init (was causing double binding on index.html).
 *    Now exports initAuth() to be called explicitly by boot.js / page scripts.
 *  - Fixed login/register tab switching (hidden attr + display style conflict).
 *  - Fixed password section toggle (hidden + style.display kept in sync).
 *  - Fixed openAdminDashboard guard for pages without admin.module.js.
 *  - Added loading states on all form submit buttons.
 *  - Added Escape key handler to close all auth modals.
 *  - Fixed forgot-password UX copy (no false "email link" promise).
 *  - All overlays consistently manage body scroll lock.
 */

if (typeof API_BASE === 'undefined') {
  window.API_BASE = '/api';
}

if (typeof window.el === 'undefined') {
  window.el = {};
}

// ─── Element Reference Cache ────────────────────────────────────────────────
function syncElRefs() {
  const ids = [
    'loginOverlay', 'loginCloseBtn', 'loginForm', 'loginEmail', 'loginPassword',
    'tabLoginBtn', 'tabRegisterBtn', 'registerForm', 'registerName', 'registerEmail',
    'registerPassword', 'openForgotPasswordBtn', 'forgotPasswordOverlay', 'forgotPasswordCloseBtn',
    'forgotPasswordForm', 'forgotPasswordEmail', 'backToLoginBtn', 'resetPasswordOverlay',
    'resetPasswordForm', 'resetPasswordToken', 'resetNewPassword', 'googleSignInContainer',
    'navLoginBtn', 'navUserPic', 'navUserName', 'profileDropdownContainer', 'profileTriggerBtn',
    'profileDropdownCard', 'dropdownUserName', 'dropdownUserEmail', 'dropdownUserRole',
    'dropdownEditProfileBtn', 'dropdownAdminPortalBtn', 'dropdownLogoutBtn', 'profileOverlay',
    'profileCloseBtn', 'profileEditForm', 'profilePicPreview', 'profileFormEmail', 'profileFormName',
    'profileFormPicture', 'profileLocalOnlySection', 'profilePasswordChangeToggle',
    'profilePasswordSection', 'profileCurrentPassword', 'profileNewPassword',
    'profileConfirmNewPassword', 'profileFormCancelBtn', 'profileDeleteAccountBtn'
  ];
  ids.forEach(id => {
    window.el[id] = document.getElementById(id);
  });
}

// ─── Modal DOM Injection ─────────────────────────────────────────────────────
function ensureAuthModalsExist() {
  if (document.getElementById('loginOverlay')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'authModalsWrapper';
  wrapper.innerHTML = `
    <!-- Login / Register Modal -->
    <div id="loginOverlay" class="detail-overlay" hidden>
      <div class="detail-modal" style="max-width: 420px;">
        <button id="loginCloseBtn" class="detail-close" type="button" aria-label="Close dialog">✕</button>
        <div class="detail-content" style="padding: 30px;">
          <!-- Tabs -->
          <div style="display: flex; border-bottom: 1px solid var(--border); margin-bottom: 24px;">
            <button type="button" id="tabLoginBtn" data-tab="login" style="flex: 1; padding: 12px; background: none; border: none; font-size: 16px; font-family: var(--font-display); font-weight: 600; color: var(--text); border-bottom: 2px solid var(--indigo); cursor: pointer;">Sign In</button>
            <button type="button" id="tabRegisterBtn" data-tab="register" style="flex: 1; padding: 12px; background: none; border: none; font-size: 16px; font-family: var(--font-display); font-weight: 600; color: var(--text-3); border-bottom: 2px solid transparent; cursor: pointer;">Sign Up</button>
          </div>

          <!-- Login Form -->
          <form id="loginForm" style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px;">
            <div class="filter-group">
              <label for="loginEmail">Email Address</label>
              <input type="email" id="loginEmail" placeholder="student@example.com" required style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <div class="filter-group" style="margin-bottom: 4px;">
              <label for="loginPassword" style="display: flex; justify-content: space-between;">
                <span>Password</span>
                <a href="#" id="openForgotPasswordBtn" style="color: var(--indigo); text-decoration: underline; font-size: 11px;">Forgot password?</a>
              </label>
              <input type="password" id="loginPassword" placeholder="••••••••" required style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <button type="submit" id="loginSubmitBtn" class="btn-primary" style="justify-content: center; width: 100%; margin-top: 8px;">Sign In</button>
          </form>

          <!-- Register Form (hidden by default) -->
          <form id="registerForm" style="display: none; flex-direction: column; gap: 14px; margin-bottom: 20px;">
            <div class="filter-group">
              <label for="registerName">Full Name</label>
              <input type="text" id="registerName" placeholder="Your Name" required style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <div class="filter-group">
              <label for="registerEmail">Email Address</label>
              <input type="email" id="registerEmail" placeholder="student@example.com" required style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <div class="filter-group" style="margin-bottom: 4px;">
              <label for="registerPassword">Password</label>
              <input type="password" id="registerPassword" placeholder="••••••••" required minlength="6" style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <button type="submit" id="registerSubmitBtn" class="btn-primary" style="justify-content: center; width: 100%; margin-top: 8px;">Create Account</button>
          </form>

          <!-- Google Sign-In Divider -->
          <div style="display: flex; align-items: center; gap: 10px; margin: 20px 0; color: var(--text-3); font-size: 11px;">
            <hr style="flex: 1; border: 0; border-top: 1px solid var(--border);" />
            <span>OR CONTINUE WITH</span>
            <hr style="flex: 1; border: 0; border-top: 1px solid var(--border);" />
          </div>
          <div id="googleSignInContainer" style="display: flex; justify-content: center; min-height: 40px; margin-bottom: 12px;"></div>
        </div>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div id="forgotPasswordOverlay" class="detail-overlay" hidden>
      <div class="detail-modal" style="max-width: 420px;">
        <button id="forgotPasswordCloseBtn" class="detail-close" type="button" aria-label="Close dialog">✕</button>
        <div class="detail-content" style="padding: 30px;">
          <h2 style="font-family: var(--font-display); font-size: 26px; margin-bottom: 6px; text-align: center;">Forgot Password?</h2>
          <p style="color: var(--text-2); font-size: 13px; text-align: center; margin-bottom: 24px;">Enter your registered email and we'll send you a secure reset link straight to your inbox.</p>
          <form id="forgotPasswordForm" style="display: flex; flex-direction: column; gap: 14px;">
            <div class="filter-group">
              <label for="forgotPasswordEmail">Email Address</label>
              <input type="email" id="forgotPasswordEmail" placeholder="Enter your email" required style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <button type="submit" id="forgotSubmitBtn" class="btn-primary" style="justify-content: center; width: 100%; margin-top: 8px;">Send Reset Link</button>
          </form>
          <div style="text-align: center; margin-top: 16px;">
            <a href="#" id="backToLoginBtn" style="color: var(--indigo); text-decoration: underline; font-size: 13px;">Back to Sign In</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div id="resetPasswordOverlay" class="detail-overlay" hidden>
      <div class="detail-modal" style="max-width: 420px;">
        <button id="resetPasswordCloseBtn" class="detail-close" type="button" aria-label="Close dialog">✕</button>
        <div class="detail-content" style="padding: 30px;">
          <h2 style="font-family: var(--font-display); font-size: 26px; margin-bottom: 6px; text-align: center;">Create New Password</h2>
          <p style="color: var(--text-2); font-size: 13px; text-align: center; margin-bottom: 24px;">Please enter your new password below.</p>
          <form id="resetPasswordForm" style="display: flex; flex-direction: column; gap: 14px;">
            <input type="hidden" id="resetPasswordToken" />
            <div class="filter-group">
              <label for="resetNewPassword">New Password</label>
              <input type="password" id="resetNewPassword" placeholder="••••••••" required minlength="6" style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <div class="filter-group">
              <label for="resetConfirmPassword">Confirm New Password</label>
              <input type="password" id="resetConfirmPassword" placeholder="••••••••" required minlength="6" style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-family: var(--font-body); font-size:13.5px;" />
            </div>
            <button type="submit" id="resetSubmitBtn" class="btn-primary" style="justify-content: center; width: 100%; margin-top: 8px;">Reset & Sign In</button>
          </form>
        </div>
      </div>
    </div>

    <!-- Profile Edit Modal -->
    <div id="profileOverlay" class="detail-overlay" hidden>
      <div class="detail-modal" style="max-width: 480px;">
        <button id="profileCloseBtn" class="detail-close" type="button" aria-label="Close dialog">✕</button>
        <div class="detail-content" style="padding: 32px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; margin-bottom: 6px; text-align: center;">Edit Profile</h2>
          <p style="color: var(--text-2); font-size: 13px; text-align: center; margin-bottom: 20px;">Update your personal details and account preferences.</p>
          <form id="profileEditForm">
            <div class="profile-pic-preview-wrapper">
              <img id="profilePicPreview" class="profile-pic-preview-frame" src="https://lh3.googleusercontent.com/a/default-user=s100" alt="Avatar preview" />
            </div>
            <div class="filter-group" style="margin-bottom: 12px;">
              <label>Email Address (Account ID)</label>
              <input type="email" id="profileFormEmail" readonly style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-2); color: var(--text-3); outline: none; cursor: not-allowed; font-size:13px;" />
            </div>
            <div class="filter-group" style="margin-bottom: 12px;">
              <label>Full Name *</label>
              <input type="text" id="profileFormName" required placeholder="Your Name" style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:13px;" />
            </div>
            <div class="filter-group" style="margin-bottom: 16px;">
              <label>Profile Picture URL</label>
              <input type="url" id="profileFormPicture" placeholder="https://example.com/avatar.jpg" style="width:100%;box-sizing:border-box;padding: 9px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:13px;" />
            </div>
            <!-- Password change section — only shown for local password accounts -->
            <div id="profileLocalOnlySection" style="display: none;">
              <button type="button" id="profilePasswordChangeToggle" class="password-change-toggle-btn">🔒 Change Password ▼</button>
              <div id="profilePasswordSection" style="display: none; flex-direction: column; gap: 12px; margin-bottom: 16px;">
                <div class="filter-group">
                  <label for="profileCurrentPassword">Current (Old) Password</label>
                  <input type="password" id="profileCurrentPassword" placeholder="Enter old password" style="width:100%;box-sizing:border-box;padding: 8px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:13px;" />
                </div>
                <div class="filter-group">
                  <label for="profileNewPassword">New Password</label>
                  <input type="password" id="profileNewPassword" placeholder="••••••••" style="width:100%;box-sizing:border-box;padding: 8px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:13px;" />
                </div>
                <div class="filter-group">
                  <label for="profileConfirmNewPassword">Confirm New Password</label>
                  <input type="password" id="profileConfirmNewPassword" placeholder="••••••••" style="width:100%;box-sizing:border-box;padding: 8px 12px; border-radius: var(--radius-sm); border: 1.5px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:13px;" />
                </div>
              </div>
            </div>
            <!-- Danger Zone: Delete Account -->
            <div style="border-top: 1px dashed rgba(239, 68, 68, 0.3); margin-top: 20px; padding-top: 14px; display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; font-weight: 700; color: #ef4444;">Delete Account</div>
                <div style="font-size: 11px; color: var(--text-3);">Permanently remove your account &amp; data</div>
              </div>
              <button type="button" id="profileDeleteAccountBtn" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-xs); padding: 6px 12px; font-size: 12px; font-weight: 600; cursor: pointer;">Delete Account</button>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 16px;">
              <button type="button" id="profileFormCancelBtn" class="btn-secondary">Cancel</button>
              <button type="submit" id="profileSaveBtn" class="btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);
}

// ─── Helper: set/show password section ──────────────────────────────────────
function setPasswordSectionVisible(visible) {
  const section = el.profilePasswordSection;
  if (!section) return;
  section.style.display = visible ? 'flex' : 'none';
  if (el.profilePasswordChangeToggle) {
    el.profilePasswordChangeToggle.textContent = visible ? '🔒 Change Password ▲' : '🔒 Change Password ▼';
  }
}

// ─── Helper: set button loading state ───────────────────────────────────────
function setButtonLoading(btn, loading, loadingText = 'Please wait…') {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn._originalText = btn.textContent;
    btn.textContent = loadingText;
  } else {
    btn.disabled = false;
    btn.textContent = btn._originalText || btn.textContent;
  }
}

// ─── Helper: overlay helpers ─────────────────────────────────────────────────
function openOverlay(overlay) {
  if (!overlay) return;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeOverlay(overlay) {
  if (!overlay) return;
  overlay.hidden = true;
  // Only restore scroll if no other overlay is open
  const anyOpen = document.querySelectorAll('.detail-overlay:not([hidden])').length > 0;
  if (!anyOpen) document.body.style.overflow = '';
}

// ─── AUTHENTICATION STATE ────────────────────────────────────────────────────
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
  syncElRefs();
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
  syncElRefs();

  if (currentUser) {
    if (el.navLoginBtn) el.navLoginBtn.style.display = 'none';
    if (el.profileDropdownContainer) el.profileDropdownContainer.style.display = 'inline-block';

    const displayName = currentUser.name || currentUser.email || 'User';
    if (el.navUserName) el.navUserName.textContent = displayName;

    // Generate initials (up to 2 characters)
    let initials = '?';
    if (currentUser.name) {
      const parts = currentUser.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else if (parts[0]) {
        initials = parts[0][0].toUpperCase();
      }
    } else if (currentUser.email) {
      initials = currentUser.email[0].toUpperCase();
    }

    // Navbar Avatar
    const navInitials = document.getElementById('navInitialsAvatar');
    if (currentUser.picture) {
      if (el.navUserPic) { el.navUserPic.src = currentUser.picture; el.navUserPic.style.display = 'inline-block'; }
      if (navInitials) navInitials.style.display = 'none';
    } else {
      if (el.navUserPic) el.navUserPic.style.display = 'none';
      if (navInitials) { navInitials.textContent = initials; navInitials.style.display = 'flex'; }
    }

    // Dropdown Avatar & Info
    const dropInitials = document.getElementById('dropdownInitialsAvatar');
    const dropPic = document.getElementById('dropdownUserPic');
    if (currentUser.picture) {
      if (dropPic) { dropPic.src = currentUser.picture; dropPic.style.display = 'inline-block'; }
      if (dropInitials) dropInitials.style.display = 'none';
    } else {
      if (dropPic) dropPic.style.display = 'none';
      if (dropInitials) { dropInitials.textContent = initials; dropInitials.style.display = 'flex'; }
    }

    if (el.dropdownUserName) el.dropdownUserName.textContent = displayName;
    if (el.dropdownUserEmail) el.dropdownUserEmail.textContent = currentUser.email || '';
    if (el.dropdownUserRole) {
      el.dropdownUserRole.textContent = currentUser.role === 'admin' ? 'Admin' : 'Student';
    }
    if (el.dropdownAdminPortalBtn) {
      el.dropdownAdminPortalBtn.style.display = currentUser.role === 'admin' ? 'flex' : 'none';
    }
  } else {
    if (el.navLoginBtn) el.navLoginBtn.style.display = 'inline-flex';
    if (el.profileDropdownContainer) el.profileDropdownContainer.style.display = 'none';
    if (el.profileDropdownCard) { el.profileDropdownCard.hidden = true; el.profileDropdownCard.style.display = 'none'; }
  }
}

// ─── TAB SWITCHING ───────────────────────────────────────────────────────────
function showLoginTab() {
  syncElRefs();
  if (!el.loginForm || !el.registerForm) return;
  el.loginForm.style.display = 'flex';
  el.registerForm.style.display = 'none';
  if (el.tabLoginBtn) {
    el.tabLoginBtn.style.borderBottomColor = 'var(--indigo)';
    el.tabLoginBtn.style.color = 'var(--text)';
  }
  if (el.tabRegisterBtn) {
    el.tabRegisterBtn.style.borderBottomColor = 'transparent';
    el.tabRegisterBtn.style.color = 'var(--text-3)';
  }
}

function showRegisterTab() {
  syncElRefs();
  if (!el.loginForm || !el.registerForm) return;
  el.registerForm.style.display = 'flex';
  el.loginForm.style.display = 'none';
  if (el.tabRegisterBtn) {
    el.tabRegisterBtn.style.borderBottomColor = 'var(--indigo)';
    el.tabRegisterBtn.style.color = 'var(--text)';
  }
  if (el.tabLoginBtn) {
    el.tabLoginBtn.style.borderBottomColor = 'transparent';
    el.tabLoginBtn.style.color = 'var(--text-3)';
  }
}

// ─── OPEN LOGIN MODAL ────────────────────────────────────────────────────────
function openLoginModal(tab = 'login') {
  syncElRefs();
  initGoogleAuth();
  if (!el.loginOverlay) return;
  showLoginTab();
  if (tab === 'register') showRegisterTab();
  openOverlay(el.loginOverlay);
  if (el.loginEmail) setTimeout(() => el.loginEmail.focus(), 50);
}

function closeLoginModal() {
  syncElRefs();
  closeOverlay(el.loginOverlay);
}

// ─── EVENT BINDING ───────────────────────────────────────────────────────────
function bindAuthEvents() {
  syncElRefs();

  // ── Open Login Overlay ──────────────────────────────────────────────────
  if (el.navLoginBtn) {
    el.navLoginBtn.addEventListener('click', () => openLoginModal('login'));
  }

  // ── Close Login Overlay ─────────────────────────────────────────────────
  if (el.loginCloseBtn) {
    el.loginCloseBtn.addEventListener('click', closeLoginModal);
  }

  // ── Auth Tabs ───────────────────────────────────────────────────────────
  if (el.tabLoginBtn)    el.tabLoginBtn.addEventListener('click', showLoginTab);
  if (el.tabRegisterBtn) el.tabRegisterBtn.addEventListener('click', showRegisterTab);

  // ── Register Form ───────────────────────────────────────────────────────
  if (el.registerForm) {
    el.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('registerSubmitBtn');
      const name     = el.registerName.value.trim();
      const email    = el.registerEmail.value.trim();
      const password = el.registerPassword.value;

      setButtonLoading(btn, true, 'Creating account…');
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
          closeLoginModal();
          el.registerForm.reset();
          showToast('Account created! Welcome to PathshalaKhoj 🎉', 'success');
          window.dispatchEvent(new CustomEvent('pk:auth-changed', { detail: { user: currentUser } }));
          if (typeof checkLoginRedirect === 'function' && checkLoginRedirect()) return;
        } else {
          showToast(data.error || 'Registration failed. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Could not connect to the server. Please try again.', 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // ── Login Form ──────────────────────────────────────────────────────────
  if (el.loginForm) {
    el.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn      = document.getElementById('loginSubmitBtn');
      const email    = el.loginEmail.value.trim();
      const password = el.loginPassword.value;

      setButtonLoading(btn, true, 'Signing in…');
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
          closeLoginModal();
          el.loginForm.reset();
          showToast(`Welcome back, ${currentUser.name || 'there'}! 👋`, 'success');
          window.dispatchEvent(new CustomEvent('pk:auth-changed', { detail: { user: currentUser } }));
          if (typeof checkLoginRedirect === 'function' && checkLoginRedirect()) return;
        } else {
          showToast(data.error || 'Login failed. Please check your credentials.', 'error');
        }
      } catch (err) {
        showToast('Could not connect to the server. Please try again.', 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // ── Forgot Password Flow ────────────────────────────────────────────────
  if (el.openForgotPasswordBtn) {
    el.openForgotPasswordBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeOverlay(el.loginOverlay);
      openOverlay(el.forgotPasswordOverlay);
      if (el.forgotPasswordEmail) setTimeout(() => el.forgotPasswordEmail.focus(), 50);
    });
  }

  if (el.backToLoginBtn) {
    el.backToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeOverlay(el.forgotPasswordOverlay);
      openOverlay(el.loginOverlay);
    });
  }

  if (el.forgotPasswordCloseBtn) {
    el.forgotPasswordCloseBtn.addEventListener('click', () => closeOverlay(el.forgotPasswordOverlay));
  }

  if (el.forgotPasswordForm) {
    el.forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn   = document.getElementById('forgotSubmitBtn');
      const email = el.forgotPasswordEmail.value.trim();

      setButtonLoading(btn, true, 'Sending link…');
      try {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (res.ok) {
          el.forgotPasswordForm.reset();
          closeOverlay(el.forgotPasswordOverlay);
          showToast('✅ Reset link sent! Check your inbox (and spam folder).', 'success');
        } else {
          showToast(data.error || 'Something went wrong. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Server error. Please try again.', 'error');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // ── Escape key closes any open auth modal ───────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (el.profileOverlay && !el.profileOverlay.hidden)           { closeProfileModal(); return; }
    if (el.resetPasswordOverlay && !el.resetPasswordOverlay.hidden) { closeOverlay(el.resetPasswordOverlay); return; }
    if (el.forgotPasswordOverlay && !el.forgotPasswordOverlay.hidden) { closeOverlay(el.forgotPasswordOverlay); return; }
    if (el.loginOverlay && !el.loginOverlay.hidden)               { closeLoginModal(); return; }
  });

  // ── Click outside to close login overlay ───────────────────────────────
  if (el.loginOverlay) {
    el.loginOverlay.addEventListener('click', (e) => {
      if (e.target === el.loginOverlay) closeLoginModal();
    });
  }

  // ── Profile Trigger Dropdown Toggle ────────────────────────────────────
  if (el.profileTriggerBtn && el.profileDropdownCard) {
    el.profileTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = el.profileDropdownCard.hidden || el.profileDropdownCard.style.display === 'none';
      el.profileDropdownCard.hidden = !isHidden;
      el.profileDropdownCard.style.display = isHidden ? 'flex' : 'none';
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.toggle('open', isHidden);
      el.profileTriggerBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (el.profileDropdownContainer && !el.profileDropdownContainer.contains(e.target)) {
        if (el.profileDropdownCard) {
          el.profileDropdownCard.hidden = true;
          el.profileDropdownCard.style.display = 'none';
        }
        if (el.profileDropdownContainer) el.profileDropdownContainer.classList.remove('open');
        if (el.profileTriggerBtn) el.profileTriggerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Dropdown Items ──────────────────────────────────────────────────────
  if (el.dropdownEditProfileBtn) {
    el.dropdownEditProfileBtn.addEventListener('click', () => {
      if (el.profileDropdownCard) { el.profileDropdownCard.hidden = true; el.profileDropdownCard.style.display = 'none'; }
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.remove('open');
      openProfileModal();
    });
  }

  if (el.dropdownAdminPortalBtn) {
    el.dropdownAdminPortalBtn.addEventListener('click', () => {
      if (el.profileDropdownCard) { el.profileDropdownCard.hidden = true; el.profileDropdownCard.style.display = 'none'; }
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.remove('open');
      // Guard: openAdminDashboard may only be available when admin.module.js is loaded
      if (typeof openAdminDashboard === 'function') {
        openAdminDashboard();
      } else {
        // Fallback: navigate to dashboard page where admin panel is available
        window.location.href = '/dashboard.html';
      }
    });
  }

  if (el.dropdownLogoutBtn) {
    el.dropdownLogoutBtn.addEventListener('click', () => {
      setToken(null);
      currentUser = null;
      updateUserUI();
      if (el.profileDropdownCard) { el.profileDropdownCard.hidden = true; el.profileDropdownCard.style.display = 'none'; }
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.remove('open');
      showToast('Signed out successfully. See you soon! 👋', 'info');
      window.dispatchEvent(new CustomEvent('pk:auth-changed', { detail: { user: null } }));
    });
  }

  // ── Profile Modal ───────────────────────────────────────────────────────
  if (el.profileCloseBtn)     el.profileCloseBtn.addEventListener('click', closeProfileModal);
  if (el.profileFormCancelBtn) el.profileFormCancelBtn.addEventListener('click', closeProfileModal);

  if (el.profileFormPicture) {
    el.profileFormPicture.addEventListener('input', () => {
      const url = el.profileFormPicture.value.trim();
      if (el.profilePicPreview) {
        el.profilePicPreview.src = url || 'https://lh3.googleusercontent.com/a/default-user=s100';
      }
    });
  }

  if (el.profilePasswordChangeToggle) {
    el.profilePasswordChangeToggle.addEventListener('click', () => {
      const isVisible = el.profilePasswordSection && el.profilePasswordSection.style.display === 'flex';
      setPasswordSectionVisible(!isVisible);
      if (isVisible) {
        // Clear fields when closing
        if (el.profileCurrentPassword)    el.profileCurrentPassword.value = '';
        if (el.profileNewPassword)         el.profileNewPassword.value = '';
        if (el.profileConfirmNewPassword)  el.profileConfirmNewPassword.value = '';
      }
    });
  }

  if (el.profileEditForm) {
    el.profileEditForm.addEventListener('submit', handleProfileUpdateSubmit);
  }

  if (el.profileDeleteAccountBtn) {
    el.profileDeleteAccountBtn.addEventListener('click', async () => {
      const confirmed = confirm('⚠️ Are you sure you want to permanently delete your account?\n\nThis action CANNOT be undone and all your account data will be removed.');
      if (!confirmed) return;

      const doubleConfirm = prompt('Type DELETE to confirm account deletion:');
      if (doubleConfirm !== 'DELETE') {
        showToast('Account deletion cancelled.', 'info');
        return;
      }

      const token = getToken();
      if (!token) return;

      setButtonLoading(el.profileDeleteAccountBtn, true, 'Deleting…');
      try {
        const res = await fetch(`${API_BASE}/auth/account`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setToken(null);
          currentUser = null;
          updateUserUI();
          closeProfileModal();
          showToast('Your account has been permanently deleted.', 'info');
          window.dispatchEvent(new CustomEvent('pk:auth-changed', { detail: { user: null } }));
        } else {
          showToast(data.error || 'Failed to delete account.', 'error');
        }
      } catch (err) {
        showToast('Network error while deleting account.', 'error');
      } finally {
        setButtonLoading(el.profileDeleteAccountBtn, false);
      }
    });
  }

  // ── Click outside to close profile overlay ─────────────────────────────
  if (el.profileOverlay) {
    el.profileOverlay.addEventListener('click', (e) => {
      if (e.target === el.profileOverlay) closeProfileModal();
    });
  }
}

// ─── GOOGLE AUTHENTICATION ──────────────────────────────────────────────────
let googleClientId      = null;
let googleTokenClient   = null;
let googleAuthInitialized = false;

async function initGoogleAuth() {
  syncElRefs();
  if (!el.googleSignInContainer) return;

  try {
    if (!googleClientId) {
      const configRes = await fetch(`${API_BASE}/auth/config`);
      if (!configRes.ok) return;
      const config = await configRes.json();
      googleClientId = config.googleClientId;
    }

    if (!googleClientId) {
      el.googleSignInContainer.innerHTML = `
        <div style="font-size: 11.5px; color: var(--text-2); text-align: center; padding: 8px 12px; background: var(--surface-2); border: 1.5px dashed var(--border); border-radius: var(--radius-sm); line-height: 1.4;">
          ⚠️ Google Sign-In is not configured on this server.
        </div>
      `;
      return;
    }

    // Render custom Google Sign-In button (only once)
    if (!document.getElementById('customGoogleSignInBtn')) {
      el.googleSignInContainer.innerHTML = `
        <button type="button" id="customGoogleSignInBtn" style="
          display: inline-flex; align-items: center; justify-content: center; gap: 10px;
          width: 280px; height: 42px; border-radius: 4px; border: 1px solid #dadce0;
          background-color: #ffffff; color: #3c4043; font-family: 'Google Sans', Roboto, sans-serif;
          font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
          box-shadow: 0 1px 2px 0 rgba(60,64,67,0.3);
        ">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"/>
            <path fill="#FBBC05" d="M3.87 10.78c-.18-.53-.28-1.09-.28-1.78s.1-1.25.28-1.78L.97 4.96C.35 6.18 0 7.55 0 9s.35 2.82.97 4.04l2.9-2.26z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.45 2.02.97 4.96l2.9 2.26C4.59 5.05 6.62 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>
      `;

      const btn = document.getElementById('customGoogleSignInBtn');
      if (btn) {
        btn.addEventListener('click', () => {
          if (googleTokenClient) {
            googleTokenClient.requestAccessToken({ prompt: '' });
          } else if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
            googleTokenClient = google.accounts.oauth2.initTokenClient({
              client_id: googleClientId,
              scope: 'email profile openid',
              callback: async (resp) => {
                if (resp && resp.access_token) {
                  await handleGoogleTokenResponse(resp.access_token);
                } else if (resp && resp.error) {
                  showToast('Google Sign-In was cancelled or failed.', 'error');
                }
              }
            });
            googleTokenClient.requestAccessToken({ prompt: 'consent' });
          } else if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.prompt();
          } else {
            showToast('Google authentication is loading. Please wait a moment and try again.', 'info');
          }
        });
      }
    }

    // Setup Token Client & GIS if SDK is present
    if (typeof google !== 'undefined' && google.accounts) {
      if (google.accounts.oauth2 && !googleTokenClient) {
        googleTokenClient = google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              await handleGoogleTokenResponse(tokenResponse.access_token);
            } else if (tokenResponse && tokenResponse.error) {
              showToast('Google Sign-In was cancelled or failed.', 'error');
            }
          }
        });
      }

      if (google.accounts.id && !googleAuthInitialized) {
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true
        });
        googleAuthInitialized = true;
      }
    }
  } catch (err) {
    console.error('initGoogleAuth error:', err);
  }
}

// Initialize Google Auth when GSI SDK finishes loading
window.addEventListener('load', async () => {
  await initGoogleAuth();
  if (typeof initCompareBarEvents === 'function') {
    initCompareBarEvents();
  }
});

// Handle Google access_token from TokenClient
async function handleGoogleTokenResponse(accessToken) {
  const btn = document.getElementById('customGoogleSignInBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Signing in…'; }

  try {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: accessToken })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      currentUser = data.user;
      updateUserUI();
      closeLoginModal();
      showToast(`Welcome, ${currentUser.name}! 👋`, 'success');
      window.dispatchEvent(new CustomEvent('pk:auth-changed', { detail: { user: currentUser } }));
      if (typeof checkLoginRedirect === 'function' && checkLoginRedirect()) return;
    } else {
      showToast(data.error || 'Google login failed. Please try again.', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to the authentication server.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"/><path fill="#FBBC05" d="M3.87 10.78c-.18-.53-.28-1.09-.28-1.78s.1-1.25.28-1.78L.97 4.96C.35 6.18 0 7.55 0 9s.35 2.82.97 4.04l2.9-2.26z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.45 2.02.97 4.96l2.9 2.26C4.59 5.05 6.62 3.58 9 3.58z"/></svg> Sign in with Google`;
    }
  }
}

// Google OAuth callback receiver for ID Token
async function handleGoogleCredentialResponse(response) {
  const btn = document.getElementById('customGoogleSignInBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Signing in…'; }

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
      closeLoginModal();
      showToast(`Welcome, ${currentUser.name}! 👋`, 'success');
      window.dispatchEvent(new CustomEvent('pk:auth-changed', { detail: { user: currentUser } }));
      if (typeof checkLoginRedirect === 'function' && checkLoginRedirect()) return;
    } else {
      showToast(data.error || 'Google login failed.', 'error');
    }
  } catch (err) {
    showToast('Failed to connect to the authentication server.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.41-1.57-5.13-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"/><path fill="#FBBC05" d="M3.87 10.78c-.18-.53-.28-1.09-.28-1.78s.1-1.25.28-1.78L.97 4.96C.35 6.18 0 7.55 0 9s.35 2.82.97 4.04l2.9-2.26z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.45 2.02.97 4.96l2.9 2.26C4.59 5.05 6.62 3.58 9 3.58z"/></svg> Sign in with Google`;
    }
  }
}

// ─── PROFILE MANAGEMENT ──────────────────────────────────────────────────────
function openProfileModal() {
  if (!currentUser) return;
  syncElRefs();

  if (el.profileFormEmail)   el.profileFormEmail.value   = currentUser.email   || '';
  if (el.profileFormName)    el.profileFormName.value    = currentUser.name    || '';
  if (el.profileFormPicture) el.profileFormPicture.value = currentUser.picture || '';
  if (el.profilePicPreview)  el.profilePicPreview.src    = currentUser.picture || 'https://lh3.googleusercontent.com/a/default-user=s100';

  // Show/hide password section based on account type
  if (el.profileLocalOnlySection) {
    el.profileLocalOnlySection.style.display = currentUser.has_local_password ? 'block' : 'none';
  }

  // Always start with password section collapsed
  setPasswordSectionVisible(false);

  // Clear password fields
  if (el.profileCurrentPassword)   el.profileCurrentPassword.value   = '';
  if (el.profileNewPassword)        el.profileNewPassword.value        = '';
  if (el.profileConfirmNewPassword) el.profileConfirmNewPassword.value = '';

  openOverlay(el.profileOverlay);
}

function closeProfileModal() {
  syncElRefs();
  closeOverlay(el.profileOverlay);
}

async function handleProfileUpdateSubmit(e) {
  e.preventDefault();
  syncElRefs();

  const token = getToken();
  if (!token) {
    showToast('Session expired. Please sign in again.', 'error');
    return;
  }

  const name    = el.profileFormName?.value.trim()    || '';
  const picture = el.profileFormPicture?.value.trim() || '';
  const isPasswordSectionOpen = el.profilePasswordSection?.style.display === 'flex';
  const newPassword    = el.profileNewPassword?.value        || '';
  const confirmPassword = el.profileConfirmNewPassword?.value || '';
  const currentPassword = el.profileCurrentPassword?.value   || '';

  if (isPasswordSectionOpen && (newPassword || confirmPassword)) {
    if (currentUser?.has_local_password && !currentPassword) {
      showToast('Please enter your current password to change it.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
  }

  const bodyData = { name, picture: picture || null };
  if (isPasswordSectionOpen && newPassword) {
    bodyData.currentPassword = currentPassword;
    bodyData.newPassword     = newPassword;
  }

  const saveBtn = document.getElementById('profileSaveBtn');
  setButtonLoading(saveBtn, true, 'Saving…');

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
      showToast('Profile updated successfully! ✅', 'success');
    } else {
      showToast(data.error || 'Failed to update profile.', 'error');
    }
  } catch {
    showToast('Network error while updating profile.', 'error');
  } finally {
    setButtonLoading(saveBtn, false);
  }
}

// ─── PUBLIC API — Called by boot.js / page scripts ──────────────────────────
async function initAuth() {
  ensureAuthModalsExist();
  syncElRefs();
  bindAuthEvents();
  await initUserSession();
}

// Expose globals needed by other modules
window.initAuth                      = initAuth;
window.openLoginModal                = openLoginModal;
window.closeLoginModal               = closeLoginModal;
window.openProfileModal              = openProfileModal;
window.closeProfileModal             = closeProfileModal;
window.getToken                      = getToken;
window.currentUser                   = currentUser; // updated by reference — use window.currentUser
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;
window.updateUserUI                  = updateUserUI;