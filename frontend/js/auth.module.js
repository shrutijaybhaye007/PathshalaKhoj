/**
 * auth.module.js
 * Authentication state, login/register modals, Google OAuth, and profile management.
 * Loaded after app.js — depends on: API_BASE, el, showToast, state (globals from app.js)
 */

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



  // Profile Trigger Dropdown Toggle
  if (el.profileTriggerBtn && el.profileDropdownCard) {
    el.profileTriggerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = el.profileDropdownCard.hidden;
      el.profileDropdownCard.hidden = !isHidden;
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.toggle('open', isHidden);
      el.profileTriggerBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (el.profileDropdownContainer && !el.profileDropdownContainer.contains(e.target)) {
        el.profileDropdownCard.hidden = true;
        el.profileDropdownContainer.classList.remove('open');
        if (el.profileTriggerBtn) el.profileTriggerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Dropdown Items Action Binding
  if (el.dropdownEditProfileBtn) {
    el.dropdownEditProfileBtn.addEventListener('click', () => {
      if (el.profileDropdownCard) el.profileDropdownCard.hidden = true;
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.remove('open');
      openProfileModal();
    });
  }

  if (el.dropdownAdminPortalBtn) {
    el.dropdownAdminPortalBtn.addEventListener('click', () => {
      if (el.profileDropdownCard) el.profileDropdownCard.hidden = true;
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.remove('open');
      openAdminDashboard();
    });
  }

  if (el.dropdownLogoutBtn) {
    el.dropdownLogoutBtn.addEventListener('click', () => {
      setToken(null);
      currentUser = null;
      updateUserUI();
      showToast('Logged out successfully.', 'info');
      if (el.profileDropdownCard) el.profileDropdownCard.hidden = true;
      if (el.profileDropdownContainer) el.profileDropdownContainer.classList.remove('open');
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
      const configRes = await fetch(`${API_BASE}/auth/config`);
      const config = await configRes.json();
      const client_id = config.googleClientId;

      if (typeof google !== 'undefined' && client_id) {
        let tokenClient = null;

        // Initialize Token Client for Brave & 3rd-party cookie blocking browsers
        if (google.accounts && google.accounts.oauth2) {
          tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: client_id,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                await handleGoogleTokenResponse(tokenResponse.access_token);
              }
            }
          });
        }

        // Initialize standard GIS
        google.accounts.id.initialize({
          client_id: client_id,
          callback: handleGoogleCredentialResponse,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true
        });

        // Render custom button that works seamlessly across all browsers (including Brave)
        if (el.googleSignInContainer) {
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
              if (tokenClient) {
                tokenClient.requestAccessToken({ prompt: 'consent' });
              } else {
                google.accounts.id.prompt();
              }
            });
          }
        }
      } else if (el.googleSignInContainer) {
        console.warn('Google Client ID not configured or SDK unavailable.');
        el.googleSignInContainer.innerHTML = `
          <div style="font-size: 11.5px; color: var(--text-2); text-align: center; padding: 8px 12px; background: var(--surface-2); border: 1.5px dashed var(--border); border-radius: var(--radius-sm); line-height: 1.4;">
            ⚠️ Google Sign In is unconfigured.
          </div>
        `;
      }
    } catch (err) {
      console.error('Failed to fetch auth configuration from server:', err);
    }

    initCompareBarEvents();
  });
}

// Handle Google access_token from TokenClient
async function handleGoogleTokenResponse(accessToken) {
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

// Google OAuth callback receiver for ID Token
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

  // Show password change section only for users with a local (email/password) account.
  // The backend returns has_local_password: true for such users.
  if (currentUser.has_local_password) {
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