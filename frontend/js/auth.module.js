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