/**
 * admin.module.js
 * Admin dashboard: college CRUD, exam CRUD, Wikipedia sync, coverage metrics.
 * Loaded after auth.module.js — depends on: API_BASE, el, currentUser, showToast (globals)
 */

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
    const colleges = data.colleges || data.data || [];
    
    if (!colleges || colleges.length === 0) {
      el.adminCollegeTableBody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: var(--text-2);">No colleges found. Adjust filters or click "Add New" to get started.</td></tr>';
      return;
    }

    el.adminCollegeTableBody.innerHTML = colleges.map(c => {
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
      if (typeof fetchAndRenderColleges === 'function') {
        fetchAndRenderColleges();
      }
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
      if (typeof fetchAndRenderColleges === 'function') {
        fetchAndRenderColleges();
      }
    } else {
      showToast('Failed to delete college.', 'error');
    }
  } catch {
    showToast('Network error while deleting college.', 'error');
  }
}

// ─── ADMIN TIMELINE EXAMS FUNCTIONS ───────────────────────────────────────
let adminExamsCache = [];

async function loadAdminExamsList() {
  if (!el.adminExamsTableBody) return;
  el.adminExamsTableBody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-2);">Loading exams list…</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/exams`);
    const data = await res.json();
    adminExamsCache = Array.isArray(data) ? data : (data.data || []);

    if (adminExamsCache.length === 0) {
      el.adminExamsTableBody.innerHTML = '<tr><td colspan="4" style="padding: 24px; text-align: center; color: var(--text-2);">No exams found. Click "Add New Exam" to create one.</td></tr>';
      return;
    }

    el.adminExamsTableBody.innerHTML = adminExamsCache.map(ev => `
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
    const list = (typeof dbTimelineEvents !== 'undefined') ? dbTimelineEvents : adminExamsCache;
    const exam = list.find(e => e.id === id);
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
      if (typeof buildTimeline === 'function') buildTimeline();
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
      if (typeof buildTimeline === 'function') buildTimeline();
    } else {
      showToast('Failed to delete exam.', 'error');
    }
  } catch {
    showToast('Network error while deleting exam.', 'error');
  }
}
