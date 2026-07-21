(function() {
const API_BASE = '/api';

const CONTACT_TYPE_ICONS = {
  phone: '📞',
  email: '✉️',
  website: '🌐',
  facebook: '👥 Facebook',
  twitter: '🐦 Twitter/X',
  linkedin: '💼 LinkedIn',
  instagram: '📸 Instagram',
  youtube: '📺 YouTube'
};

// DOM Elements
const el = {
  loading: document.getElementById('collegeLoading'),
  content: document.getElementById('collegeContent'),
  name: document.getElementById('collegeName'),
  location: document.getElementById('collegeLocation'),
  typeBadge: document.getElementById('collegeTypeBadge'),
  nirf: document.getElementById('collegeNirf'),
  package: document.getElementById('collegePackage'),
  est: document.getElementById('collegeEst'),
  desc: document.getElementById('collegeDescription'),
  affiliation: document.getElementById('collegeAffiliation'),
  naac: document.getElementById('collegeNaac'),
  stream: document.getElementById('collegeStream'),
  fees: document.getElementById('collegeFees'),
  avgPlacement: document.getElementById('collegeAvgPlacement'),
  highPlacement: document.getElementById('collegeHighPlacement'),
  address: document.getElementById('collegeAddress'),
  pincode: document.getElementById('collegePincode'),
  email: document.getElementById('collegeEmail'),
  phone: document.getElementById('collegePhone'),
  websiteBtn: document.getElementById('collegeWebsiteBtn'),
  coursesGrid: document.getElementById('collegeCoursesGrid'),
  placementRate: document.getElementById('collegePlacementRate'),
  campusSize: document.getElementById('collegeCampusSize'),
  hostel: document.getElementById('collegeHostel'),
  facilitiesGrid: document.getElementById('collegeFacilitiesGrid'),
  galleryContainer: document.getElementById('campusGalleryContainer'),
  ratingContainer: document.getElementById('collegeRatingContainer'),
  rating: document.getElementById('collegeRating'),
  deadlineContainer: document.getElementById('collegeDeadlineContainer'),
  deadline: document.getElementById('collegeDeadline'),
  scholarshipsContainer: document.getElementById('collegeScholarshipsContainer'),
  scholarships: document.getElementById('collegeScholarships'),
  recruitersContainer: document.getElementById('collegeRecruitersContainer'),
  recruitersGrid: document.getElementById('collegeRecruitersGrid'),
  tabs: document.querySelectorAll('.tab-link'),
  sections: document.querySelectorAll('.content-section'),
  addToShortlistBtn: document.getElementById('addToShortlistBtn'),
  addToCompareBtn: document.getElementById('addToCompareBtn'),
  entranceExamsContainer: document.getElementById('collegeEntranceExamsContainer'),
  entranceExamsGrid: document.getElementById('collegeEntranceExamsGrid'),
  admissionsDeadline: document.getElementById('collegeAdmissionsDeadline'),
  admissionsDeadlineText: document.getElementById('collegeAdmissionsDeadlineText'),
  reviewsRating: document.getElementById('collegeReviewsRating'),
  heroBanner: document.getElementById('collegeHeroBanner'),
  logoInitials: document.getElementById('collegeLogoInitials'),
  estBadge: document.getElementById('collegeEstBadge'),
  sidebarPhone: document.getElementById('sidebarPhone'),
  sidebarEmail: document.getElementById('sidebarEmail'),
  cutoffsTableBody: document.getElementById('collegeCutoffsTableBody'),
  qnaContainer: document.getElementById('collegeQnaContainer'),
  downloadBrochureBtn: document.getElementById('downloadBrochureBtn'),
  syncWikiBtn: document.getElementById('syncWikiBtn'),
  syncWebsiteBtn: document.getElementById('syncWebsiteBtn'),
  syncReviewsBtn: document.getElementById('syncReviewsBtn'),
  reviewsContainer: document.getElementById('collegeReviewsContainer'),
  reviewsSummary: document.getElementById('collegeReviewsSummary'),
  qnaAskFormContainer: document.getElementById('qnaAskFormContainer'),
  qnaQuestionInput: document.getElementById('qnaQuestionInput'),
  qnaSubmitQuestionBtn: document.getElementById('qnaSubmitQuestionBtn'),
  qnaGuestWarning: document.getElementById('qnaGuestWarning'),
  autoDiscoverBtn: document.getElementById('autoDiscoverBtn'),
  editCollegeBtn: document.getElementById('editCollegeBtn'),
};

let collegeId = null;
let currentCollege = null;

/**
 * formatPlacement(val)
 * Smart formatter for placement package data.
 * - If val >= 1,00,000: stored in rupees → convert to LPA for display (e.g. 450000 → "4.5 LPA")
 * - If val < 1,000: already in LPA (e.g. 6.5 → "6.5 LPA")
 * - Otherwise: treat as rupees
 */
function formatPlacement(val) {
  if (!val || val <= 0) return 'N/A';
  const num = Number(val);
  if (num >= 100000) {
    // Convert rupees to LPA
    const lpa = (num / 100000).toFixed(1).replace(/\.0$/, '');
    return `${lpa} LPA`;
  }
  if (num < 1000) {
    // Already in LPA
    return `${num} LPA`;
  }
  // Ambiguous — show as LPA directly
  return `${num} LPA`;
}


// Parse URL
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('id')) {
  collegeId = urlParams.get('id');
  fetchCollegeDetails(collegeId);
  checkShortlistStatus(collegeId);
  checkCompareStatus(collegeId);
} else {
  showError("No college ID provided.");
}

async function fetchCollegeDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/colleges/${id}`);
    if (!res.ok) throw new Error('Not found');
    const data = await res.json();
    currentCollege = data;
    populateUI(data);
    // Auto-enrich from Wikipedia if data is missing (runs non-blocking in background)
    autoEnrichFromWiki(data);
    // Auto-enrich from Website if data is missing/synthetic (runs non-blocking in background)
    autoEnrichFromWebsite(data);
    // Auto-enrich Location map in background
    autoEnrichLocation(data);
  } catch (err) {
    console.error(err);
    showError("Failed to load college details. It may not exist.");
  }
}

/**
 * autoEnrichFromWiki(data)
 * Silently calls /wiki-preview for colleges with missing/short descriptions.
 * Updates the UI with real Wikipedia data and shows a "Live Data" badge.
 * Saves data to DB automatically via the backend endpoint.
 */
async function autoEnrichFromWiki(data) {
  // Enrich if description is missing/short/synthetic OR if logo is missing/synthetic
  const isSyntheticDesc = data.description && data.description.includes('prestigious institution affiliated');
  const isSyntheticLogo = data.logo_url && (data.logo_url.includes('api.dicebear.com') || data.logo_url.includes('source.unsplash.com'));

  const needsDesc = !data.description || data.description.length < 100 || isSyntheticDesc;
  const needsLogo = !data.logo_url || isSyntheticLogo;

  if (!needsDesc && !needsLogo) return; // Already has both — skip

  try {
    const res = await fetch(`${API_BASE}/colleges/${data.id}/wiki-preview`);
    if (!res.ok) return;
    const wiki = await res.json();
    if (!wiki.success || wiki.already_enriched) return;

    let enriched = false;

    // Update description
    if (wiki.description && needsDesc && el.desc) {
      el.desc.textContent = wiki.description;
      data.description = wiki.description;
      enriched = true;
    }

    // Update logo
    if (wiki.logo_url && needsLogo && el.logoInitials) {
      const img = document.createElement('img');
      img.src = wiki.logo_url;
      img.style.cssText = 'width:100%; height:100%; border-radius:50%; object-fit:cover;';
      img.alt = `${data.name} Logo`;
      img.onerror = () => {}; // Silently ignore broken Wikipedia images
      el.logoInitials.innerHTML = '';
      el.logoInitials.appendChild(img);
      el.logoInitials.style.background = 'none';
      el.logoInitials.style.padding = '0';
      data.logo_url = wiki.logo_url;
      enriched = true;
    }

    // Update established year if missing
    if (wiki.established_year && !data.established_year) {
      data.established_year = wiki.established_year;
      const estBadge = document.getElementById('collegeEstBadge');
      if (estBadge) estBadge.textContent = `Estd. ${wiki.established_year}`;
      if (el.est) el.est.textContent = wiki.established_year;
      enriched = true;
    }

    // Update NAAC grade if missing
    if (wiki.naac_grade && (!data.naac_grade || data.naac_grade === 'N/A')) {
      data.naac_grade = wiki.naac_grade;
      if (el.naac) el.naac.textContent = wiki.naac_grade;
      enriched = true;
    }

    // Update affiliation if missing
    if (wiki.affiliation && (!data.affiliation || data.affiliation === 'N/A')) {
      data.affiliation = wiki.affiliation;
      if (el.affiliation) el.affiliation.textContent = wiki.affiliation;
      enriched = true;
    }

    // Show "Live Data" badge if we updated anything
    if (enriched) showLiveDataBadge();

  } catch (err) {
    // Silently ignore - this is a background enhancement
    console.debug('Wiki auto-enrich skipped:', err.message);
  }
}

/**
 * autoEnrichFromWebsite(data)
 * Silently calls /website-preview to auto-discover and crawl the official college website.
 * Updates the UI with real-time website, socials, meta description, and gallery.
 */
async function autoEnrichFromWebsite(data) {
  const isSyntheticWebsite = (url, slug) => {
    if (!url) return true;
    const cleanSlug = slug.replace(/-+/g, '').substring(0, 15);
    return url.includes(cleanSlug) && url.endsWith('.edu.in');
  };

  const isSynthetic = isSyntheticWebsite(data.website, data.slug);
  let galleryImages = [];
  try {
    galleryImages = data.gallery_images ? (typeof data.gallery_images === 'string' ? JSON.parse(data.gallery_images) : data.gallery_images) : [];
  } catch(e) {}

  // If it's already verified and has gallery images, skip
  if (!isSynthetic && galleryImages.length > 0) return;

  try {
    const res = await fetch(`${API_BASE}/colleges/${data.id}/website-preview`);
    if (!res.ok) return;
    const web = await res.json();
    if (!web.success) return;

    let enriched = false;

    // 1. Update website link in UI
    if (web.website && isSyntheticWebsite(data.website, data.slug)) {
      data.website = web.website;
      const webEl = document.getElementById('collegeWebsite');
      if (webEl) {
        webEl.textContent = web.website.replace(/^https?:\/\//i, '');
        webEl.href = web.website;
      }
      if (el.websiteBtn) {
        el.websiteBtn.style.display = 'flex';
        el.websiteBtn.href = web.website;
      }
      enriched = true;
    }

    // 2. Update Description if meta description discovered
    const isSyntheticD = data.description && data.description.includes('prestigious institution affiliated');
    if (web.description && (isSyntheticD || !data.description) && el.desc) {
      el.desc.textContent = web.description;
      data.description = web.description;
      enriched = true;
    }

    // 3. Render gallery images if scraped
    if (web.gallery_images && Array.isArray(web.gallery_images) && web.gallery_images.length > 0 && el.galleryContainer) {
      data.gallery_images = web.gallery_images;
      el.galleryContainer.innerHTML = web.gallery_images.map((url, i) => `
        <img src="${url}" alt="Campus Photo ${i + 1}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px;" onerror="this.style.display='none';">
      `).join('');
      enriched = true;
    }

    // 4. Update Socials if found
    if (web.socials && Array.isArray(web.socials) && web.socials.length > 0) {
      const contactList = document.getElementById('collegeContactsList');
      if (contactList) {
        const emptyState = contactList.querySelector('.text-3');
        if (emptyState && emptyState.textContent.includes('No contact channels')) {
          contactList.innerHTML = '';
        }
        
        web.socials.forEach(s => {
          const type = s.type;
          const value = s.value;
          if (!document.getElementById(`social-${type.toLowerCase()}`)) {
            const item = document.createElement('li');
            item.id = `social-${type.toLowerCase()}`;
            item.style.marginBottom = '12px';
            item.style.display = 'flex';
            item.style.alignItems = 'flex-start';
            item.style.gap = '8px';
            
            const icon = CONTACT_TYPE_ICONS[type.toLowerCase()] || '👥';
            const label = type.charAt(0).toUpperCase() + type.slice(1);
            item.innerHTML = `
              <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
              <div>
                <strong>${label}:</strong>
                <a href="${value}" target="_blank" style="color: var(--indigo); text-decoration: underline; word-break: break-all;">${value}</a>
              </div>
            `;
            contactList.appendChild(item);
          }
        });
      }
      enriched = true;
    }

    if (enriched) showLiveDataBadge();
  } catch (err) {
    console.debug('Website auto-enrich skipped:', err.message);
  }
}

/**
 * autoEnrichLocation(data)
 * Calls /location-preview to fetch geocoded coordinates in the background,
 * then displays the location map in the sidebar using Leaflet.js.
 */
async function autoEnrichLocation(data) {
  const mapWidget = document.getElementById('collegeMapWidget');
  const mapDiv = document.getElementById('collegeMap');
  if (!mapWidget || !mapDiv) return;

  try {
    const res = await fetch(`${API_BASE}/colleges/${data.id}/location-preview`);
    if (!res.ok) return;
    const location = await res.json();
    if (!location.success || !location.latitude || !location.longitude) return;

    const lat = location.latitude;
    const lon = location.longitude;

    // Show map widget
    mapWidget.style.display = 'block';

    // Update Coordinates Text & Google Maps Link
    const coordsEl = document.getElementById('mapCoordinates');
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    
    const gmapsLink = document.getElementById('googleMapsLink');
    if (gmapsLink) gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

    // Initialize Leaflet map if Leaflet is loaded
    if (typeof L === 'undefined') {
      console.warn('Leaflet library not loaded.');
      return;
    }

    // Set map container height to force layout
    mapDiv.style.height = '200px';

    const map = L.map('collegeMap', {
      center: [lat, lon],
      zoom: 14,
      scrollWheelZoom: false,
      zoomControl: true
    });

    // Load OpenStreetMap Tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add marker pin
    L.marker([lat, lon]).addTo(map)
      .bindPopup(`<b>${data.name}</b><br>${data.city}, ${data.state}`)
      .openPopup();

    // Invalidate size to fix rendering issues inside tabbed panels/containers
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

  } catch (err) {
    console.debug('Location map auto-enrich skipped:', err.message);
  }
}

/**
 * showLiveDataBadge()
 * Shows a small badge near the description to indicate data was
 * fetched in real-time from Wikipedia.
 */
function showLiveDataBadge() {
  if (document.getElementById('liveDataBadge')) return; // Already shown
  const descEl = el.desc;
  if (!descEl) return;
  const badge = document.createElement('div');
  badge.id = 'liveDataBadge';
  badge.innerHTML = `
    <span style="
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05));
      border: 1px solid rgba(16,185,129,0.3);
      color: #059669;
      font-size: 11px; font-weight: 700;
      padding: 4px 10px; border-radius: 20px;
      margin-bottom: 10px; letter-spacing: 0.3px;
    ">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: pulse 2s infinite;">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      Live Data · Enriched from Wikipedia
    </span>
  `;
  descEl.parentNode && descEl.parentNode.insertBefore(badge, descEl);
}



function setSEOTags(data) {
  document.title = `${data.name} - Admissions, Courses & Fees | PathshalaKhoj`;
  
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.name = 'description';
    document.head.appendChild(descMeta);
  }
  descMeta.content = data.description ? data.description.substring(0, 150) + '...' : `Get all details on ${data.name} including admissions, courses, fees, and placements.`;

  const setOg = (property, content) => {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  setOg('og:title', `${data.name} - PathshalaKhoj`);
  setOg('og:description', descMeta.content);
  setOg('og:type', 'website');
  setOg('og:url', window.location.href);
}

function populateUI(data) {
  setSEOTags(data);
  el.loading.style.display = 'none';
  el.content.style.display = 'block';
  
  // Hero
  el.name.textContent = data.name;
  el.location.textContent = `${data.city}, ${data.state}`;
  el.typeBadge.textContent = data.college_type;
  
  el.nirf.textContent = data.nirf_ranking ? `#${data.nirf_ranking}` : 'N/A';
  el.package.textContent = data.avg_placement_package
    ? formatPlacement(data.avg_placement_package)
    : 'N/A';
  if (el.est) el.est.textContent = data.established_year || 'N/A';

  // ── NIRF Verified badge ──────────────────────────────────────────────────
  const existingVerifiedBadge = document.getElementById('nirfVerifiedBadge');
  if (existingVerifiedBadge) existingVerifiedBadge.remove();
  if (data.data_verified) {
    const badge = document.createElement('span');
    badge.id = 'nirfVerifiedBadge';
    badge.className = 'verified-badge';
    badge.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      NIRF Verified
    `;
    // Insert after the college type badge
    if (el.typeBadge && el.typeBadge.parentNode) {
      el.typeBadge.parentNode.insertBefore(badge, el.typeBadge.nextSibling);
    }
  }
  
  if (data.student_rating) {
    el.rating.textContent = data.student_rating;
    el.ratingContainer.style.display = 'flex';
  } else {
    el.ratingContainer.style.display = 'none';
  }
  
  if (data.application_deadline) {
    el.deadline.textContent = data.application_deadline;
    if (el.deadlineContainer) el.deadlineContainer.style.display = 'flex';
  } else {
    if (el.deadlineContainer) el.deadlineContainer.style.display = 'none';
  }
  
  // Details
  el.desc.textContent = data.description || 'No description available.';
  el.affiliation.textContent = data.affiliation || 'N/A';
  el.naac.textContent = data.naac_grade || 'N/A';
  el.stream.textContent = data.stream || 'N/A';
  
  const feesSection = document.getElementById('collegeFeeSection');
  const placementSection = document.getElementById('collegePlacementSection');

  if (data.avg_fees_per_year) {
    if (feesSection) feesSection.style.display = '';
    el.fees.textContent = `₹ ${Number(data.avg_fees_per_year).toLocaleString('en-IN')}`;
  } else if (feesSection) {
    feesSection.style.display = 'none';
  }

  if (data.avg_placement_package) {
    if (placementSection) placementSection.style.display = '';
    el.avgPlacement.textContent  = formatPlacement(data.avg_placement_package);
    el.highPlacement.textContent = data.highest_placement_package
      ? formatPlacement(data.highest_placement_package)
      : 'N/A';
    el.placementRate.textContent = data.placement_rate
      ? `${data.placement_rate}%`
      : 'N/A';
  } else if (placementSection) {
    placementSection.style.display = 'none';
  }
  
  if (data.scholarships_info && el.scholarshipsContainer) {
    el.scholarships.textContent = data.scholarships_info;
    el.scholarshipsContainer.style.display = 'block';
  } else if (el.scholarshipsContainer) {
    el.scholarshipsContainer.style.display = 'none';
  }

  if (data.top_recruiters && el.recruitersContainer) {
    el.recruitersGrid.innerHTML = '';
    const recruiters = data.top_recruiters.split(',').map(r => r.trim()).filter(r => r);
    if (recruiters.length > 0) {
      recruiters.forEach(recruiter => {
        const badge = document.createElement('span');
        badge.className = 'facility-badge';
        badge.style.display = 'inline-flex';
        badge.style.alignItems = 'center';
        badge.style.gap = '6px';
        badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg> ${recruiter}`;
        el.recruitersGrid.appendChild(badge);
      });
      el.recruitersContainer.style.display = 'block';
    } else {
      el.recruitersContainer.style.display = 'none';
    }
  } else if (el.recruitersContainer) {
    el.recruitersContainer.style.display = 'none';
  }
  
  // Location & Contact
  let addressText = data.address || 'N/A';
  addressText = addressText.replace(/\s*-\s*\d{6}\s*$/, '');
  el.address.textContent = addressText;
  el.pincode.textContent = data.pincode || 'N/A';
  // Render Contacts List (with social channels)
  const contactsList = document.getElementById('collegeContactsList');
  if (contactsList) {
    let contactsData = data.contacts || [];
    if (contactsData.length === 0) {
      if (data.contact_phone) contactsData.push({ contact_type: 'phone', contact_value: data.contact_phone, label: 'Admissions Office' });
      if (data.contact_email) contactsData.push({ contact_type: 'email', contact_value: data.contact_email, label: 'Admissions Desk' });
      if (data.website) contactsData.push({ contact_type: 'website', contact_value: data.website, label: 'Official Website' });
    }
    
    if (contactsData.length > 0) {
      contactsList.innerHTML = contactsData.map(c => {
        const icon = CONTACT_TYPE_ICONS[c.contact_type.toLowerCase()] || '📞';
        const label = c.label || c.contact_type.charAt(0).toUpperCase() + c.contact_type.slice(1);
        
        let valHtml = c.contact_value;
        if (c.contact_type === 'email') {
          valHtml = `<a href="mailto:${c.contact_value}" style="color: var(--indigo); text-decoration: underline;">${c.contact_value}</a>`;
        } else if (c.contact_type === 'website' || ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube'].includes(c.contact_type.toLowerCase())) {
          const url = c.contact_value.startsWith('http') ? c.contact_value : `https://${c.contact_value}`;
          valHtml = `<a href="${url}" target="_blank" style="color: var(--indigo); text-decoration: underline; word-break: break-all;">${c.contact_value}</a>`;
        }
        
        return `
          <li id="social-${c.contact_type.toLowerCase()}" style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-size: 16px; flex-shrink: 0;">${icon}</span>
            <div>
              <strong>${label}:</strong> <span>${valHtml}</span>
            </div>
          </li>
        `;
      }).join('');
    } else {
      contactsList.innerHTML = '<li class="text-2">No contact channels listed.</li>';
    }
  }

  if (data.contact_email && el.email) el.email.textContent = data.contact_email;
  if (data.contact_phone && el.phone) el.phone.textContent = data.contact_phone;
  if (data.website && el.websiteBtn) {
    el.websiteBtn.style.display = 'flex';
    el.websiteBtn.href = data.website.startsWith('http') ? data.website : `https://${data.website}`;
  }

  // Campus
  if (el.campusSize) el.campusSize.textContent = data.campus_size || 'N/A';
  if (el.hostel) el.hostel.textContent = (data.hostel_available === 1 || data.hostel_available === true) ? 'Yes' : 'No';
  // Render Courses
  if (el.coursesGrid) {
    if (data.courses) {
      try {
        const courses = typeof data.courses === 'string' ? JSON.parse(data.courses) : data.courses;
        if (Array.isArray(courses) && courses.length > 0) {
          let disclaimerHtml = '';
          if (data.courses_is_fallback) {
            const filterNote = data.courses_filtered_by_type ? ' <em>(Filtered to match degree-granting institution offerings)</em>' : '';
            disclaimerHtml = `
              <div style="grid-column: 1 / -1; background: rgba(245, 166, 35, 0.08); border: 1.5px solid rgba(245, 166, 35, 0.3); border-radius: 10px; padding: 14px 18px; margin-bottom: 12px; display: flex; align-items: flex-start; gap: 12px; font-size: 13.5px; color: var(--text-1);">
                <span style="font-size: 20px; flex-shrink: 0; line-height: 1;">💡</span>
                <div>
                  <strong style="color: #F5A623;">Typical Programs in ${data.stream || 'this Stream'}</strong>
                  <p style="margin: 3px 0 0 0; color: var(--text-2); font-size: 12.5px; line-height: 1.5;">
                    These represent representative programs standardly offered by ${data.stream || 'similar'} institutions in India across Undergraduate, Postgraduate, and Diploma levels. Verified per-course catalog for this institution is being populated.${filterNote}
                  </p>
                </div>
              </div>
            `;
          }

          const levelOrder = ['UG', 'PG', 'Diploma', 'PhD', 'Certificate'];
          const levelLabels = {
            'UG': '🎓 Undergraduate Programs',
            'PG': '📜 Postgraduate Programs',
            'Diploma': '🛠️ Diploma & Vocational Programs',
            'PhD': '🔬 Doctoral (Ph.D.) Programs',
            'Certificate': '🏅 Certificate Courses'
          };

          const grouped = {};
          courses.forEach(c => {
            const lvl = c.level || 'UG';
            if (!grouped[lvl]) grouped[lvl] = [];
            grouped[lvl].push(c);
          });

          let gridHtml = disclaimerHtml;

          levelOrder.forEach(lvl => {
            if (grouped[lvl] && grouped[lvl].length > 0) {
              const items = grouped[lvl];
              const groupHeader = `
                <div style="grid-column: 1 / -1; margin-top: 14px; margin-bottom: 4px; border-bottom: 2px solid var(--border-2); padding-bottom: 6px; display: flex; align-items: center; justify-content: space-between;">
                  <h3 style="font-size: 15px; font-weight: 700; color: var(--text-1); margin: 0; display: flex; align-items: center; gap: 8px;">
                    ${levelLabels[lvl] || lvl}
                  </h3>
                  <span style="font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 12px; background: var(--surface-3); color: var(--text-2);">
                    ${items.length} program${items.length > 1 ? 's' : ''}
                  </span>
                </div>
              `;

              const cardsHtml = items.map(c => {
                const formattedFees = c.fees_per_year ? `₹${c.fees_per_year.toLocaleString('en-IN')}` : (c.is_typical ? 'Contact for details' : 'N/A');
                return `
                  <div class="course-card" style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                      <h4 style="margin:0; font-size:15px; font-weight: 700; color: var(--text); line-height: 1.4;">${c.name}</h4>
                      <span class="stream-badge" style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: rgba(var(--indigo-rgb, 99, 102, 241), 0.1); color: var(--indigo); text-transform: uppercase; font-weight: 600; flex-shrink: 0;">${c.level || 'UG'}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; color: var(--text-2); border-top: 1px dashed var(--border-2); padding-top: 8px; margin-top: 4px;">
                      <div><strong>Fees:</strong> <span style="color: var(--gold); font-weight: 700;">${formattedFees}</span></div>
                      <div><strong>Seats:</strong> <span>${c.seats || 'N/A'}</span></div>
                      <div><strong>Duration:</strong> <span>${c.duration_years || 'N/A'} Yrs</span></div>
                      <div><strong>Exam:</strong> <span style="text-transform: uppercase; font-weight: 600; color: var(--indigo);">${c.entrance_exam || 'Direct / Merit'}</span></div>
                    </div>

                    ${c.eligibility ? `
                    <div style="font-size: 12px; color: var(--text-3); background: var(--surface-3); padding: 8px 10px; border-radius: 6px; margin-top: 4px; line-height: 1.4; border-left: 3px solid var(--border-2);">
                      <strong>Eligibility:</strong> ${c.eligibility}
                    </div>` : ''}
                  </div>
                `;
              }).join('');

              gridHtml += groupHeader + cardsHtml;
            }
          });

          el.coursesGrid.innerHTML = gridHtml;
        } else {
          el.coursesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: var(--surface-2); border-radius: 12px; border: 1px solid var(--border-1);">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="1.5" style="margin-bottom: 12px;">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <h3 class="empty-state-title" style="font-family: var(--font-heading); font-size: 20px; color: var(--text-1); margin-bottom: 6px;">No Courses Listed</h3>
              <p class="empty-state-sub" style="color: var(--text-2); font-size: 14px;">This institution has not listed any course offerings yet.</p>
            </div>
          `;
        }
      } catch(e) {
        el.coursesGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;"><p class="text-2">No courses listed.</p></div>';
      }
    } else {
      el.coursesGrid.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 48px 24px;"><p class="text-2">No courses listed.</p></div>';
    }
  }

  // Render Facilities
  if (el.facilitiesGrid) {
    if (data.facilities) {
      let facilities = [];
      if (typeof data.facilities === 'string') {
        try {
          facilities = JSON.parse(data.facilities);
        } catch(e) {
          facilities = data.facilities.split(',').map(f => f.trim()).filter(f => f);
        }
      } else {
        facilities = data.facilities;
      }
      if (Array.isArray(facilities) && facilities.length > 0) {
        el.facilitiesGrid.innerHTML = facilities.map(f => `
          <span class="facility-badge">${f}</span>
        `).join('');
      } else {
        el.facilitiesGrid.innerHTML = '<p class="text-2">No specific facilities listed.</p>';
      }
    } else {
      el.facilitiesGrid.innerHTML = '<p class="text-2">No specific facilities listed.</p>';
    }
  }

  // Render Dynamic Gallery
  if (el.galleryContainer) {
    if (data.gallery_images && Array.isArray(data.gallery_images) && data.gallery_images.length > 0) {
      el.galleryContainer.innerHTML = data.gallery_images.map((url, i) => `
        <img src="${url}" alt="Campus Photo ${i + 1}" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px;">
      `).join('');
    } else {
      el.galleryContainer.innerHTML = `
        <img src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=400&fit=crop" alt="Campus 1" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px;">
        <img src="https://images.unsplash.com/photo-1519452328131-0e1ce1711202?w=600&h=400&fit=crop" alt="Campus 2" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px;">
        <img src="https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop" alt="Campus 3" style="width: 100%; height: 160px; object-fit: cover; border-radius: 8px;">
      `;
    }
  }

  // Populate Admissions Tab
  if (data.application_deadline && el.admissionsDeadline) {
    el.admissionsDeadlineText.textContent = data.application_deadline;
    el.admissionsDeadline.style.display = 'block';
  } else if (el.admissionsDeadline) {
    el.admissionsDeadline.style.display = 'none';
  }

  if (el.entranceExamsContainer && data.courses) {
    let coursesData = data.courses;
    if (typeof coursesData === 'string') {
      try { coursesData = JSON.parse(coursesData); } catch(e) { coursesData = []; }
    }
    if (Array.isArray(coursesData)) {
      const exams = new Set();
      coursesData.forEach(c => {
        if (c.entrance_exam) {
          c.entrance_exam.split('/').map(e => e.trim()).filter(e => e).forEach(e => exams.add(e));
        }
      });
      if (exams.size > 0) {
        el.entranceExamsGrid.innerHTML = Array.from(exams).map(exam => `
          <span class="facility-badge" style="background: var(--surface-3); border-color: var(--border-2); color: var(--text);">${exam}</span>
        `).join('');
        el.entranceExamsContainer.style.display = 'block';
      } else {
        el.entranceExamsContainer.style.display = 'none';
      }
    }
  }

  // Shiksha dynamic banner photos based on stream
  const banners = {
    'engineering': 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=400&fit=crop',
    'medical': 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=400&fit=crop',
    'management': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=400&fit=crop',
    'law': 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=400&fit=crop',
    'science': 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&h=400&fit=crop',
    'default': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&h=400&fit=crop'
  };
  const streamKey = (data.stream || '').toLowerCase();
  const bannerUrl = banners[streamKey] || banners['default'];
  if (el.heroBanner) {
    el.heroBanner.style.backgroundImage = `url('${bannerUrl}')`;
  }

  // Circular Logo Initials or Image
  if (el.logoInitials) {
    if (data.logo_url) {
      const img = document.createElement('img');
      img.src = data.logo_url;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      img.alt = `${data.name} Logo`;
      
      el.logoInitials.innerHTML = '';
      el.logoInitials.appendChild(img);
      el.logoInitials.style.background = 'none';
      el.logoInitials.style.padding = '0';
    } else {
      el.logoInitials.textContent = getInitials(data.name);
      // Random bg color for initials
      const colors = ['#1A365D', '#2B6CB0', '#2C5282', '#2A4365', '#2F855A', '#276749', '#744210', '#9C4221', '#553C9A', '#B7791F'];
      const idx = (data.id || 0) % colors.length;
      el.logoInitials.style.background = colors[idx];
      el.logoInitials.style.padding = '';
    }
  }

  // Est Year Badge in header
  const estBadge = document.getElementById('collegeEstBadge');
  if (estBadge) {
    estBadge.textContent = data.established_year ? `Estd. ${data.established_year}` : 'Estd. N/A';
  }

  // Sidebar contact helpline sync
  let sidebarPhoneVal = data.contact_phone;
  let sidebarEmailVal = data.contact_email;
  
  if (data.contacts) {
    const foundPhone = data.contacts.find(c => c.contact_type.toLowerCase() === 'phone');
    if (foundPhone) sidebarPhoneVal = foundPhone.contact_value;
    
    const foundEmail = data.contacts.find(c => c.contact_type.toLowerCase() === 'email');
    if (foundEmail) sidebarEmailVal = foundEmail.contact_value;
  }
  
  if (el.sidebarPhone) el.sidebarPhone.textContent = sidebarPhoneVal || 'N/A';
  if (el.sidebarEmail) el.sidebarEmail.textContent = sidebarEmailVal || 'N/A';

  // Dynamic Cutoffs generator
  if (el.cutoffsTableBody && data.courses) {
    let coursesData = data.courses;
    if (typeof coursesData === 'string') {
      try { coursesData = JSON.parse(coursesData); } catch(e) { coursesData = []; }
    }
    if (Array.isArray(coursesData) && coursesData.length > 0) {
      el.cutoffsTableBody.innerHTML = coursesData.map(c => {
        // Mock a closing rank based on NIRF ranking
        const nirfFactor = data.nirf_ranking || 100;
        const seed = (c.name.charCodeAt(0) + c.name.charCodeAt(1)) % 10;
        const rank = Math.floor(nirfFactor * 180 + seed * 2500 + Math.random() * 200);
        return `
          <tr>
            <td><strong>${c.name}</strong></td>
            <td><span class="status-badge" style="background: var(--surface-3); border-color: var(--border-2); color: var(--text); font-size:12px;">${c.entrance_exam || 'Merit Based'}</span></td>
            <td><span style="font-weight: 700; color: var(--gold);">${rank.toLocaleString()}</span></td>
          </tr>
        `;
      }).join('');
    } else {
      el.cutoffsTableBody.innerHTML = '<tr><td colspan="3" style="padding: 16px; text-align: center; color: var(--text-3);">No cutoff data available.</td></tr>';
    }
  }

  // Dynamic Q&A generator based on database
  if (el.qnaContainer) {
    renderQnA(data.qna || [], data.id);
  }


  // Bind brochure download
  if (el.downloadBrochureBtn) {
    // Remove previous listeners if any (clone node)
    const newBtn = el.downloadBrochureBtn.cloneNode(true);
    el.downloadBrochureBtn.parentNode.replaceChild(newBtn, el.downloadBrochureBtn);
    el.downloadBrochureBtn = newBtn;
    el.downloadBrochureBtn.addEventListener('click', (e) => {
      e.preventDefault();
      generateBrochure(data);
    });
  }

  // Bind Edit College Info
  if (el.editCollegeBtn) {
    const newBtn = el.editCollegeBtn.cloneNode(true);
    el.editCollegeBtn.parentNode.replaceChild(newBtn, el.editCollegeBtn);
    el.editCollegeBtn = newBtn;
    el.editCollegeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadCollegeIntoAdminForm(data);
    });
  }

  // Bind Wikipedia sync
  if (el.syncWikiBtn) {
    const newBtn = el.syncWikiBtn.cloneNode(true);
    el.syncWikiBtn.parentNode.replaceChild(newBtn, el.syncWikiBtn);
    el.syncWikiBtn = newBtn;
    el.syncWikiBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      el.syncWikiBtn.disabled = true;
      el.syncWikiBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 50 50" style="animation: spin 1.5s linear infinite; margin-right: 6px; display: inline-block; vertical-align: middle; stroke: var(--text);"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle></svg>
        <span>Syncing...</span>`;
      
      try {
        const res = await fetch(`${API_BASE}/colleges/${data.id}/sync-wiki`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('pk_token')}` }
        });
        const result = await res.json();
        if (res.ok) {
          const fieldsUpdated = result.fields_updated || 0;
          showToast(`✅ Synced ${fieldsUpdated} field${fieldsUpdated !== 1 ? 's' : ''} from Wikipedia!`, 'success');
          if (result.description) {
            el.desc.textContent = result.description;
            data.description = result.description;
            // Remove existing live badge since data is now from authoritative sync
            const badge = document.getElementById('liveDataBadge');
            if (badge) badge.remove();
          }
          if (result.established_year) {
            const estBadge = document.getElementById('collegeEstBadge');
            if (estBadge) estBadge.textContent = `Estd. ${result.established_year}`;
            if (el.est) el.est.textContent = result.established_year;
            data.established_year = result.established_year;
          }
          if (result.logo_url) {
            const img = document.createElement('img');
            img.src = result.logo_url;
            img.style.cssText = 'width:100%; height:100%; border-radius:50%; object-fit:cover;';
            img.alt = `${data.name} Logo`;
            el.logoInitials.innerHTML = '';
            el.logoInitials.appendChild(img);
            el.logoInitials.style.background = 'none';
            el.logoInitials.style.padding = '0';
            data.logo_url = result.logo_url;
          }
          // Update NAAC and affiliation if returned
          if (result.naac_grade && el.naac) {
            el.naac.textContent = result.naac_grade;
            data.naac_grade = result.naac_grade;
          }
          if (result.affiliation && el.affiliation) {
            el.affiliation.textContent = result.affiliation;
            data.affiliation = result.affiliation;
          }
        } else {
          showToast(result.error || 'Failed to sync. Wikipedia page might not match exact name.', 'error');
        }
      } catch (err) {
        showToast('Connection error. Could not sync details.', 'error');
      } finally {
        el.syncWikiBtn.disabled = false;
        el.syncWikiBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 12 12 8 12"></polyline><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>Sync Web Info</span>`;
      }
    });
  }

  // Bind Website sync
  if (el.syncWebsiteBtn) {
    const newBtn = el.syncWebsiteBtn.cloneNode(true);
    el.syncWebsiteBtn.parentNode.replaceChild(newBtn, el.syncWebsiteBtn);
    el.syncWebsiteBtn = newBtn;
    el.syncWebsiteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      el.syncWebsiteBtn.disabled = true;
      el.syncWebsiteBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 50 50" style="animation: spin 1.5s linear infinite; margin-right: 6px; display: inline-block; vertical-align: middle; stroke: var(--text);"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle></svg>
        <span>Crawling...</span>`;
      
      try {
        const res = await fetch(`${API_BASE}/colleges/${data.id}/sync-website`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('pk_token')}` }
        });
        const result = await res.json();
        if (res.ok) {
          showToast(`Synced successfully! Added ${result.new_socials_added} social link channels.`, 'success');
          if (result.description) {
            el.desc.textContent = result.description;
            data.description = result.description;
          }
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast(result.error || 'Failed to crawl website.', 'error');
        }
      } catch (err) {
        console.error('Frontend Sync Error:', err);
        showToast(`Connection error: ${err.message}`, 'error');
      } finally {
        el.syncWebsiteBtn.disabled = false;
        el.syncWebsiteBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          <span>Sync Website</span>`;
      }
    });
  }

  // Bind Auto Discover Website
  if (el.autoDiscoverBtn) {
    const newBtn = el.autoDiscoverBtn.cloneNode(true);
    el.autoDiscoverBtn.parentNode.replaceChild(newBtn, el.autoDiscoverBtn);
    el.autoDiscoverBtn = newBtn;
    el.autoDiscoverBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      el.autoDiscoverBtn.disabled = true;
      el.autoDiscoverBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 50 50" style="animation: spin 1.5s linear infinite; margin-right: 6px; display: inline-block; vertical-align: middle; stroke: var(--text);"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle></svg>
        <span>Discovering...</span>`;
      
      try {
        const res = await fetch(`${API_BASE}/colleges/${data.id}/auto-discover-website`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('pk_token')}` }
        });
        const result = await res.json();
        if (res.ok) {
          showToast(`Successfully auto-discovered! New domain: ${result.new_website}`, 'success');
          setTimeout(() => window.location.reload(), 2000);
        } else {
          showToast(result.error || 'Failed to auto-discover website.', 'error');
        }
      } catch (err) {
        console.error('Frontend Auto-Discover Error:', err);
        showToast(`Connection error: ${err.message}`, 'error');
      } finally {
        el.autoDiscoverBtn.disabled = false;
        el.autoDiscoverBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          <span>Auto-Discover Domain</span>`;
      }
    });
  }

  // Render Student Reviews
  if (el.reviewsContainer) {
    if (data.reviews && data.reviews.length > 0) {
      el.reviewsContainer.innerHTML = data.reviews.map(r => {
        const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
        return `
          <div style="padding: 16px; background: var(--surface-2); border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <strong>${escapeHtml(r.author_name)}</strong> 
              <span style="color: var(--gold);">${stars}</span>
            </div>
            <p class="prose" style="margin: 0; font-size: 14px;">"${escapeHtml(r.review_text)}"</p>
          </div>
        `;
      }).join('');
      
      if (el.reviewsSummary) {
        const streamLabel = data.stream ? data.stream.toLowerCase() : 'academic';
        el.reviewsSummary.textContent = `Student reviews for ${data.name} highlight excellence in its ${streamLabel} programs, supportive teaching faculty, and key opportunities.`;
      }
    } else {
      el.reviewsContainer.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-3); background: var(--surface-2); border-radius: 8px;">
          <span style="font-size: 24px; display: block; margin-bottom: 8px;">📝</span>
          No student reviews synced yet. 
          <span style="display: block; font-size: 12px; margin-top: 4px;">Admin can sync reviews from the action header.</span>
        </div>
      `;
      if (el.reviewsSummary) {
        el.reviewsSummary.textContent = `No reviews have been synchronized for this institution yet.`;
      }
    }
  }

  // Bind Reviews sync
  if (el.syncReviewsBtn) {
    const newBtn = el.syncReviewsBtn.cloneNode(true);
    el.syncReviewsBtn.parentNode.replaceChild(newBtn, el.syncReviewsBtn);
    el.syncReviewsBtn = newBtn;
    el.syncReviewsBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      el.syncReviewsBtn.disabled = true;
      el.syncReviewsBtn.innerHTML = `
        <svg class="spinner" width="18" height="18" viewBox="0 0 50 50" style="animation: spin 1.5s linear infinite; margin-right: 6px; display: inline-block; vertical-align: middle; stroke: var(--text);"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="currentColor"></circle></svg>
        <span>Syncing...</span>`;
      
      try {
        const res = await fetch(`${API_BASE}/colleges/${data.id}/sync-reviews`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('pk_token')}` }
        });
        const result = await res.json();
        if (res.ok) {
          showToast(`Successfully synced Google Student Reviews! 🎉`, 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showToast(result.error || 'Failed to sync student reviews.', 'error');
        }
      } catch (err) {
        showToast('Connection error. Could not sync student reviews.', 'error');
      } finally {
        el.syncReviewsBtn.disabled = false;
        el.syncReviewsBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <span>Sync Reviews</span>`;
      }
    });
  }
  if (data.student_rating && el.reviewsRating) {
    el.reviewsRating.textContent = data.student_rating;
  }
  
  updateSyncWikiVisibility();
  updateQnaAuthVisibility();
  document.title = `${data.name} - PathshalaKhoj`;
}

// Q&A Global State & Functions
let currentCollegeForQna = null;

function renderQnA(qnaArray, collegeId) {
  currentCollegeForQna = collegeId;
  
  if (!el.qnaContainer) return;
  
  if (!qnaArray || qnaArray.length === 0) {
    el.qnaContainer.innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-3); background: var(--surface-2); border-radius: 8px;">
        <span style="font-size: 24px; display: block; margin-bottom: 8px;">🤔</span>
        No questions asked yet. Be the first to ask!
      </div>
    `;
  } else {
    const isAdmin = window.currentUser && window.currentUser.role === 'admin';
    el.qnaContainer.innerHTML = qnaArray.map(qna => `
      <div class="qna-item" style="background: var(--surface-2); padding: 16px; border-radius: 8px;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
          <span style="font-size: 20px;">❓</span>
          <div style="flex: 1;">
            <h4 class="qna-question" style="margin: 0 0 4px; font-size: 15px; color: var(--text);">${escapeHtml(qna.question)}</h4>
            <div style="font-size: 12px; color: var(--text-3);">Asked by <strong>${escapeHtml(qna.author_name)}</strong> on ${new Date(qna.created_at).toLocaleDateString()}</div>
          </div>
        </div>
        
        ${qna.answer ? `
          <div style="display: flex; gap: 12px; padding-left: 12px; border-left: 2px solid var(--primary); margin-left: 14px;">
            <div style="flex: 1;">
              <p class="qna-answer" style="margin: 0 0 4px; font-size: 14px; color: var(--text-2);">${escapeHtml(qna.answer)}</p>
              <div style="font-size: 12px; color: var(--text-3);">Answered by <strong style="color: var(--primary);">${escapeHtml(qna.answered_by)}</strong></div>
            </div>
          </div>
        ` : `
          <div style="padding-left: 32px; font-size: 13px; color: var(--text-3); font-style: italic;">
            Not answered yet.
          </div>
          ${isAdmin ? `
            <div style="padding-left: 32px; margin-top: 12px;" class="admin-reply-box">
              <textarea id="replyInput_${qna.id}" rows="2" placeholder="Write an answer..." style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text); font-family: inherit; resize: vertical; margin-bottom: 8px; font-size: 13px;"></textarea>
              <button class="btn btn-sm" style="background: var(--primary); color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer;" onclick="submitQnaAnswer(${qna.id})">Post Answer</button>
            </div>
          ` : ''}
        `}
      </div>
    `).join('');
  }
}

async function submitQnaAnswer(qnaId) {
  const input = document.getElementById(`replyInput_${qnaId}`);
  if (!input) return;
  const answer = input.value.trim();
  if (!answer) {
    showToast('Answer cannot be empty.', 'error');
    return;
  }
  
  input.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/colleges/qna/${qnaId}/answer`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('pk_token')}`
      },
      body: JSON.stringify({ answer })
    });
    
    if (res.ok) {
      showToast('Answer posted! 🎉', 'success');
      fetchCollegeDetails(currentCollegeForQna);
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to post answer', 'error');
      input.disabled = false;
    }
  } catch (err) {
    showToast('Network error', 'error');
    input.disabled = false;
  }
}

function updateQnaAuthVisibility() {
  if (el.qnaAskFormContainer && el.qnaGuestWarning) {
    if (window.currentUser) {
      el.qnaAskFormContainer.style.display = 'block';
      el.qnaGuestWarning.style.display = 'none';
    } else {
      el.qnaAskFormContainer.style.display = 'none';
      el.qnaGuestWarning.style.display = 'block';
    }
  }
}

// Bind Submit Question
if (el.qnaSubmitQuestionBtn) {
  el.qnaSubmitQuestionBtn.addEventListener('click', async () => {
    if (!currentCollegeForQna) return;
    const question = el.qnaQuestionInput.value.trim();
    if (!question) {
      showToast('Please type a question.', 'error');
      return;
    }

    el.qnaSubmitQuestionBtn.disabled = true;
    el.qnaSubmitQuestionBtn.textContent = 'Submitting...';

    try {
      const res = await fetch(`${API_BASE}/colleges/${currentCollegeForQna}/qna`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pk_token')}`
        },
        body: JSON.stringify({ question })
      });
      if (res.ok) {
        showToast('Question submitted! 🎉', 'success');
        el.qnaQuestionInput.value = '';
        fetchCollegeDetails(currentCollegeForQna);
      } else {
        const err = await res.json();
        showToast(err.error || 'Failed to submit question', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      el.qnaSubmitQuestionBtn.disabled = false;
      el.qnaSubmitQuestionBtn.textContent = 'Submit Question';
    }
  });
}

function showError(msg) {
  el.loading.innerHTML = `<div class="empty-state">
      <span class="empty-state-icon">⚠️</span>
      <h3 class="empty-state-title">Error</h3>
      <p class="empty-state-sub">${msg}</p>
      <a href="/" class="btn btn-outline" style="margin-top:16px;">Go Home</a>
    </div>`;
}

// Tab Switching Logic
el.tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    el.tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const targetId = tab.getAttribute('href').substring(1);
    el.sections.forEach(sec => {
      sec.style.display = sec.id === targetId ? 'block' : 'none';
    });
  });
});

// Auth sync
// --- PREDICTOR LOGIC ---
const checkChancesBtn = document.getElementById('checkChancesBtn');
const predictorResult = document.getElementById('predictorResult');
const probValue = document.getElementById('probValue');
const probLabel = document.getElementById('probLabel');
const predictorLoginPrompt = document.getElementById('predictorLoginPrompt');

const predictorForm = document.getElementById('predictorForm');
const predExamInputGroup = document.getElementById('predExamInputGroup');
const predExamLabel = document.getElementById('predExamLabel');
const predExamScore = document.getElementById('predExamScore');
const predBoardPercentage = document.getElementById('predBoardPercentage');
const predSubmitBtn = document.getElementById('predSubmitBtn');

function hasAcademicData() {
  if (!window.currentUser) return false;
  return !!window.currentUser.board_percentage;
}

function showInlinePredictorForm() {
  checkChancesBtn.style.display = 'none';
  predictorForm.style.display = 'flex';

  const stream = (currentCollege.stream || '').toLowerCase();
  if (stream === 'engineering') {
    predExamInputGroup.style.display = 'flex';
    predExamLabel.textContent = 'JEE Main Rank';
    predExamScore.placeholder = 'e.g. 15000';
    predExamScore.value = window.currentUser.jee_rank || '';
  } else if (stream === 'medical') {
    predExamInputGroup.style.display = 'flex';
    predExamLabel.textContent = 'NEET UG Rank';
    predExamScore.placeholder = 'e.g. 8500';
    predExamScore.value = window.currentUser.neet_rank || '';
  } else if (stream === 'management') {
    predExamInputGroup.style.display = 'flex';
    predExamLabel.textContent = 'CAT Percentile';
    predExamScore.placeholder = 'e.g. 98.5';
    predExamScore.value = window.currentUser.cat_percentile || '';
  } else {
    predExamInputGroup.style.display = 'none';
  }

  predBoardPercentage.value = window.currentUser.board_percentage || '';
}

function calculateChance(user, college) {
  let boardScore = user.board_percentage || 60;
  let baseChance = 50;

  const stream = (college.stream || '').toLowerCase();
  const nirf = college.nirf_ranking || 150;

  if (stream === 'engineering') {
    if (user.jee_rank) {
      const rank = user.jee_rank;
      let targetRank = 150000;
      if (nirf <= 15) targetRank = 10000;
      else if (nirf <= 50) targetRank = 35000;
      else if (nirf <= 100) targetRank = 75000;

      if (rank <= targetRank) {
        baseChance = 80 + Math.min(18, Math.floor((targetRank - rank) / targetRank * 20));
      } else {
        baseChance = Math.max(30, 80 - Math.floor((rank - targetRank) / targetRank * 40));
      }
    } else {
      let reqBoard = 60;
      if (nirf <= 15) reqBoard = 93;
      else if (nirf <= 50) reqBoard = 83;
      else if (nirf <= 100) reqBoard = 73;

      if (boardScore >= reqBoard) {
        baseChance = 75 + Math.min(23, (boardScore - reqBoard) * 2);
      } else {
        baseChance = Math.max(35, 75 - (reqBoard - boardScore) * 3);
      }
    }
  } 
  else if (stream === 'medical') {
    if (user.neet_rank) {
      const rank = user.neet_rank;
      let targetRank = 50000;
      if (nirf <= 15) targetRank = 3000;
      else if (nirf <= 50) targetRank = 12000;
      else if (nirf <= 100) targetRank = 25000;

      if (rank <= targetRank) {
        baseChance = 82 + Math.min(16, Math.floor((targetRank - rank) / targetRank * 15));
      } else {
        baseChance = Math.max(25, 80 - Math.floor((rank - targetRank) / targetRank * 50));
      }
    } else {
      let reqBoard = 65;
      if (nirf <= 15) reqBoard = 95;
      else if (nirf <= 50) reqBoard = 85;
      else if (nirf <= 100) reqBoard = 75;

      if (boardScore >= reqBoard) {
        baseChance = 72 + Math.min(26, (boardScore - reqBoard) * 2);
      } else {
        baseChance = Math.max(30, 72 - (reqBoard - boardScore) * 3);
      }
    }
  }
  else if (stream === 'management') {
    if (user.cat_percentile) {
      const cat = user.cat_percentile;
      let reqCat = 65;
      if (nirf <= 15) reqCat = 95;
      else if (nirf <= 50) reqCat = 88;
      else if (nirf <= 100) reqCat = 78;

      if (cat >= reqCat) {
        baseChance = 78 + Math.min(20, (cat - reqCat) * 1.5);
      } else {
        baseChance = Math.max(30, 78 - (reqCat - cat) * 4);
      }
    } else {
      let reqBoard = 60;
      if (nirf <= 15) reqBoard = 90;
      else if (nirf <= 50) reqBoard = 80;
      else if (nirf <= 100) reqBoard = 70;

      if (boardScore >= reqBoard) {
        baseChance = 75 + Math.min(23, (boardScore - reqBoard) * 2);
      } else {
        baseChance = Math.max(35, 75 - (reqBoard - boardScore) * 3);
      }
    }
  }
  else {
    let reqBoard = 55;
    if (nirf <= 15) reqBoard = 92;
    else if (nirf <= 50) reqBoard = 80;
    else if (nirf <= 100) reqBoard = 70;

    if (boardScore >= reqBoard) {
      baseChance = 80 + Math.min(18, (boardScore - reqBoard) * 1.5);
    } else {
      baseChance = Math.max(40, 80 - (reqBoard - boardScore) * 2);
    }
  }

  return Math.max(10, Math.min(99, Math.round(baseChance)));
}

function runChancePrediction() {
  predictorForm.style.display = 'none';
  predictorResult.style.display = 'block';
  checkChancesBtn.style.display = 'none';
  
  const targetProb = calculateChance(window.currentUser, currentCollege);

  let current = 0;
  const interval = setInterval(() => {
    current += 2;
    if (current >= targetProb) {
      current = targetProb;
      clearInterval(interval);
      
      if (targetProb >= 80) {
        probLabel.className = 'status-badge success';
        probLabel.textContent = 'High Chance';
      } else if (targetProb >= 55) {
        probLabel.className = 'status-badge warning';
        probLabel.textContent = 'Moderate Chance';
      } else {
        probLabel.className = 'status-badge neutral';
        probLabel.textContent = 'Low Chance';
      }
    }
    probValue.textContent = current;
  }, 20);
}

if (checkChancesBtn) {
  checkChancesBtn.addEventListener('click', () => {
    if (!window.currentUser) {
      predictorLoginPrompt.style.display = 'block';
      return;
    }
    predictorLoginPrompt.style.display = 'none';
    
    if (hasAcademicData()) {
      checkChancesBtn.disabled = true;
      checkChancesBtn.textContent = 'Calculating...';
      setTimeout(runChancePrediction, 1000);
    } else {
      showInlinePredictorForm();
    }
  });
}

if (predSubmitBtn) {
  predSubmitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const boardVal = parseFloat(predBoardPercentage.value);
    const examVal = parseFloat(predExamScore.value);

    if (isNaN(boardVal) || boardVal < 0 || boardVal > 100) {
      alert('Please enter a valid Class 12th Board percentage (0-100).');
      return;
    }

    predSubmitBtn.disabled = true;
    predSubmitBtn.textContent = 'Saving & Calculating...';

    const stream = (currentCollege.stream || '').toLowerCase();
    const token = localStorage.getItem('pk_token');
    const updateData = {
      name: window.currentUser.name,
      board_percentage: boardVal
    };

    if (stream === 'engineering') {
      updateData.jee_rank = examVal || null;
      updateData.academic_stream = 'Science';
    } else if (stream === 'medical') {
      updateData.neet_rank = examVal || null;
      updateData.academic_stream = 'Science';
    } else if (stream === 'management') {
      updateData.cat_percentile = examVal || null;
      updateData.academic_stream = 'Commerce';
    }

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        const json = await res.json();
        window.currentUser = json.user;
      }
    } catch (err) {
      console.error('Failed to save profile during prediction:', err);
    }

    setTimeout(runChancePrediction, 1000);
  });
}

// --- APPLY NOW LOGIC ---
const applyNowBtn = document.getElementById('applyNowBtn');
if (applyNowBtn) {
  applyNowBtn.addEventListener('click', async () => {
    if (!window.currentUser) {
      window.location.href = '/?login=true';
      return;
    }
    
    applyNowBtn.disabled = true;
    applyNowBtn.innerHTML = '<span>Submitting...</span>';
    
    const sessionId = localStorage.getItem('pk_session_id');
    try {
      const res = await fetch(`${API_BASE}/applications/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ college_id: collegeId })
      });
      
      if (res.ok) {
        applyNowBtn.className = 'btn btn-primary success';
        applyNowBtn.style.backgroundColor = '#10b981';
        applyNowBtn.style.borderColor = '#10b981';
        applyNowBtn.innerHTML = '<span>Applied Successfully! ✓</span>';
      } else {
        throw new Error('Failed');
      }
    } catch(err) {
      alert("Failed to submit application. Please try again later.");
      applyNowBtn.disabled = false;
      applyNowBtn.innerHTML = '<span>Apply Now 🚀</span>';
    }
  });
}

// --- SHORTLIST LOGIC ---
function setShortlistedState(isShortlisted) {
  if (!el.addToShortlistBtn) return;
  if (isShortlisted) {
    el.addToShortlistBtn.classList.add('active');
    el.addToShortlistBtn.style.color = 'var(--gold)';
    el.addToShortlistBtn.style.borderColor = 'var(--gold)';
    el.addToShortlistBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
      <span>Saved ✓</span>`;
  } else {
    el.addToShortlistBtn.classList.remove('active');
    el.addToShortlistBtn.style.color = 'var(--text)';
    el.addToShortlistBtn.style.borderColor = 'var(--border-2)';
    el.addToShortlistBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
      <span>Save</span>`;
  }
}

async function checkShortlistStatus(id) {
  const sessionId = localStorage.getItem('pk_session_id') || ('sess_' + Math.random().toString(36).substring(2, 15));
  if (!localStorage.getItem('pk_session_id')) {
    localStorage.setItem('pk_session_id', sessionId);
  }
  try {
    const res = await fetch(`${API_BASE}/shortlist/${sessionId}`);
    if (res.ok) {
      const json = await res.json();
      const isShortlisted = json.data.some(c => c.id === parseInt(id));
      setShortlistedState(isShortlisted);
    }
  } catch (err) {
    console.error('Failed to check shortlist status:', err);
  }
}

if (el.addToShortlistBtn) {
  el.addToShortlistBtn.addEventListener('click', async () => {
    const sessionId = localStorage.getItem('pk_session_id') || ('sess_' + Math.random().toString(36).substring(2, 15));
    if (!localStorage.getItem('pk_session_id')) {
      localStorage.setItem('pk_session_id', sessionId);
    }
    const isCurrentlyActive = el.addToShortlistBtn.classList.contains('active');
    try {
      if (isCurrentlyActive) {
        // Delete from shortlist
        const res = await fetch(`${API_BASE}/shortlist/${sessionId}/${collegeId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          setShortlistedState(false);
        }
      } else {
        // Add to shortlist
        const res = await fetch(`${API_BASE}/shortlist/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ college_id: collegeId })
        });
        if (res.ok) {
          setShortlistedState(true);
        }
      }
    } catch (err) {
      console.error('Failed to toggle shortlist:', err);
    }
  });
}

// --- COMPARE LOGIC FOR DETAIL PAGE ---
function getCompareList() {
  try {
    return JSON.parse(localStorage.getItem('pk_compare') || '[]');
  } catch {
    return [];
  }
}

function setComparedState(isCompared) {
  if (!el.addToCompareBtn) return;
  if (isCompared) {
    el.addToCompareBtn.classList.add('active');
    el.addToCompareBtn.style.color = 'var(--indigo)';
    el.addToCompareBtn.style.borderColor = 'var(--indigo)';
    el.addToCompareBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
      <span>Compared ✓</span>`;
  } else {
    el.addToCompareBtn.classList.remove('active');
    el.addToCompareBtn.style.color = 'var(--text)';
    el.addToCompareBtn.style.borderColor = 'var(--border-2)';
    el.addToCompareBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
      <span>Compare</span>`;
  }
}

function checkCompareStatus(id) {
  const compareList = getCompareList();
  const isCompared = compareList.some(c => c.id === parseInt(id));
  setComparedState(isCompared);
}

if (el.addToCompareBtn) {
  el.addToCompareBtn.addEventListener('click', () => {
    let compareList = getCompareList();
    const idNum = parseInt(collegeId);
    const isCurrentlyComparing = compareList.some(c => c.id === idNum);

    if (isCurrentlyComparing) {
      compareList = compareList.filter(c => c.id !== idNum);
      localStorage.setItem('pk_compare', JSON.stringify(compareList));
      setComparedState(false);
      showToast('Removed from comparison.', 'info');
    } else {
      if (compareList.length >= 3) {
        showToast('You can compare a maximum of 3 colleges.', 'warning');
        return;
      }
      const collegeName = currentCollege ? currentCollege.name : (document.getElementById('collegeName')?.textContent || 'College');
      compareList.push({ id: idNum, name: collegeName });
      localStorage.setItem('pk_compare', JSON.stringify(compareList));
      setComparedState(true);
      showToast('Added to comparison! ⚖️', 'success');
      
      if (compareList.length >= 2) {
        setTimeout(() => {
          if (confirm('You have selected colleges to compare. Would you like to go to the comparison page now?')) {
            const ids = compareList.map(c => c.id).join(',');
            window.location.href = `compare.html?ids=${ids}`;
          }
        }, 800);
      }
    }
  });
}


function getInitials(name) {
  if (!name) return 'COL';
  const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '');
  return cleanName.split(' ').filter(w => w.length > 0).map(w => w[0]).join('').substring(0, 3).toUpperCase();
}

function generateBrochure(data) {
  const logoText = getInitials(data.name);
  let coursesList = [];
  try {
    coursesList = (typeof data.courses === 'string' ? JSON.parse(data.courses) : data.courses) || [];
  } catch(e) {
    coursesList = [];
  }
  
  let facilitiesList = [];
  try {
    facilitiesList = (typeof data.facilities === 'string' ? JSON.parse(data.facilities) : data.facilities) || [];
  } catch(e) {
    if (typeof data.facilities === 'string') {
      facilitiesList = data.facilities.split(',').map(f => f.trim()).filter(f => f);
    } else {
      facilitiesList = [];
    }
  }
  
  const uniqueExams = Array.from(new Set(coursesList.map(c => c.entrance_exam).filter(e => e)));
  
  let parsedContacts = [];
  try {
    parsedContacts = (typeof data.contacts === 'string' ? JSON.parse(data.contacts) : data.contacts) || [];
  } catch(e) {}

  let brochureEmail = data.contact_email;
  let brochurePhone = data.contact_phone;
  let brochureWeb = data.website;

  parsedContacts.forEach(c => {
    if (!brochureEmail && c.contact_type === 'email') brochureEmail = c.contact_value;
    if (!brochurePhone && c.contact_type === 'phone') brochurePhone = c.contact_value;
    if (!brochureWeb && c.contact_type === 'website') brochureWeb = c.contact_value;
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${data.name} - Official Brochure</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #2D3748; line-height: 1.6; padding: 40px; background: #F7FAFC; margin: 0; }
    .brochure { max-width: 800px; margin: 0 auto; background: #FFF; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #1A365D 0%, #2B6CB0 100%); color: #FFF; padding: 48px; position: relative; }
    .logo { width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid #FFF; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; margin-bottom: 20px; text-transform: uppercase; }
    .title { font-size: 32px; margin: 0 0 10px; font-weight: 800; }
    .meta { font-size: 16px; opacity: 0.9; }
    .content { padding: 48px; }
    .section-title { font-size: 20px; color: #1A365D; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin-top: 32px; margin-bottom: 16px; font-weight: 700; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item { margin-bottom: 12px; }
    .info-label { font-size: 12px; text-transform: uppercase; color: #718096; font-weight: 700; }
    .info-val { font-size: 16px; font-weight: 600; }
    .badge { display: inline-block; padding: 4px 10px; background: #EDF2F7; border-radius: 4px; font-size: 13px; font-weight: 600; margin-right: 6px; margin-bottom: 6px; color: #2D3748; }
    .course-item { padding: 12px; border: 1px solid #E2E8F0; border-radius: 6px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EDF2F7; background: #F7FAFC; }
    @media print {
      body { padding: 0; background: none; }
      .brochure { box-shadow: none; border: none; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="brochure">
    <div class="header">
      <div class="logo">${logoText}</div>
      <h1 class="title">${data.name}</h1>
      <div class="meta">${data.city}, ${data.state} | Estd. ${data.established_year || 'N/A'}</div>
    </div>
    <div class="content">
      <div class="section-title">About the Institution</div>
      <p>${data.description || 'No description available.'}</p>
      
      <div class="section-title">Quick Facts</div>
      <div class="grid">
        <div class="info-item"><div class="info-label">Affiliation</div><div class="info-val">${data.affiliation || 'N/A'}</div></div>
        <div class="info-item"><div class="info-label">NAAC Grade</div><div class="info-val">${data.naac_grade || 'N/A'}</div></div>
        <div class="info-item"><div class="info-label">NIRF Ranking</div><div class="info-val">${data.nirf_ranking ? '#' + data.nirf_ranking : 'N/A'}</div></div>
        ${data.avg_fees_per_year ? `<div class="info-item"><div class="info-label">Average Annual Fees</div><div class="info-val">₹ ${data.avg_fees_per_year.toLocaleString()}</div></div>` : ''}
        ${data.avg_placement_package ? `<div class="info-item"><div class="info-label">Avg Placement Package</div><div class="info-val">${data.avg_placement_package} LPA</div></div>` : ''}
        <div class="info-item"><div class="info-label">Campus Size</div><div class="info-val">${data.campus_size || 'N/A'}</div></div>
      </div>
      
      <div class="section-title">Programs Offered</div>
      <div>
        ${coursesList.map(c => `
          <div class="course-item">
            <div>
              <strong style="color: #1A365D;">${c.name}</strong>
              <div style="font-size: 12px; color: #718096; margin-top: 2px;">Duration: ${c.duration_years || c.duration || 'N/A'} Years | Seats: ${c.seats || 'N/A'}</div>
            </div>
            <div style="font-weight: 700; color: #B7791F;">${c.fees_per_year ? '₹ ' + c.fees_per_year.toLocaleString() + ' /yr' : 'N/A'}</div>
          </div>
        `).join('') || '<p>No courses listed.</p>'}
      </div>

      <div class="section-title">Facilities & Infrastructure</div>
      <div style="margin-top: 10px;">
        ${facilitiesList.map(f => `<span class="badge">${f}</span>`).join('') || '<p>No facilities listed.</p>'}
      </div>
      
      <div class="section-title">Admissions & Contact Helpline</div>
      <p>Admissions for the current academic session are actively open. Entrance exams accepted: <strong>${uniqueExams.length > 0 ? uniqueExams.join(', ') : 'Merit Based'}</strong>.</p>
      <div style="margin-top: 16px; padding: 16px; background: #F7FAFC; border-radius: 6px; border-left: 4px solid #1A365D;">
        <div><strong>Admissions Email:</strong> ${brochureEmail || 'N/A'}</div>
        <div style="margin-top: 6px;"><strong>Helpline Phone:</strong> ${brochurePhone || 'N/A'}</div>
        <div style="margin-top: 6px;"><strong>Official Website:</strong> ${brochureWeb || 'N/A'}</div>
      </div>
    </div>
    <div class="footer">
      Generated officially by PathshalaKhoj — India's Premier College Directory.
    </div>
  </div>
</body>
</html>`;
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${data.name.replace(/[^a-zA-Z0-9]/g, '_')}_Brochure.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Toast Notification Helpers ---
function showToast(message, type = 'info', duration = 3500) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icons[type]}</span>
    <span class="toast-msg">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss notification">&#x2715;</button>
  `;
  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
  toastContainer.appendChild(toast);
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(toast) {
  toast.style.opacity  = '0';
  toast.style.transform = 'translateX(60px)';
  toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  setTimeout(() => toast.remove(), 300);
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#039;');
}

function updateSyncWikiVisibility() {
  const displayVal = (window.currentUser && window.currentUser.role === 'admin') ? 'flex' : 'none';
  if (el.syncWikiBtn) el.syncWikiBtn.style.display = displayVal;
  if (el.syncWebsiteBtn) el.syncWebsiteBtn.style.display = displayVal;
  if (el.autoDiscoverBtn) el.autoDiscoverBtn.style.display = displayVal;
  if (el.syncReviewsBtn) el.syncReviewsBtn.style.display = displayVal;
  if (el.editCollegeBtn) el.editCollegeBtn.style.display = displayVal;
}

document.addEventListener('authSynced', () => {
  updateSyncWikiVisibility();
  updateQnaAuthVisibility();
  if (currentCollegeForQna) {
    // Reload to re-render admin buttons if auth state changes
    fetchCollegeDetails(currentCollegeForQna); 
  }
});


// --- Live Campus Feed Logic ---
const styleId = 'live-feed-dynamic-styles';
if (!document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    .live-feed-link {
      color: #E8EDF5 !important; /* Dark mode default text color */
    }
    .live-feed-link:visited {
      color: #E8EDF5 !important;
    }
    [data-theme="light"] .live-feed-link {
      color: #0F172A !important; /* Light mode text color */
    }
    [data-theme="light"] .live-feed-link:visited {
      color: #0F172A !important;
    }
  `;
  document.head.appendChild(style);
}

async function fetchLiveFeed(id) {
  const container = document.getElementById('liveFeedContainer');
  if (!container) return;
  
  try {
    const res = await fetch(`${API_BASE}/colleges/${id}/live-updates`);
    if (!res.ok) throw new Error('Live feed fetch failed');
    const json = await res.json();
    
    if (json.data && json.data.length > 0) {
      container.innerHTML = json.data.map(item => {
        const isDummy = !item.link || item.link === '#';
        const hrefAttr = isDummy ? '' : `href="${escapeHtml(item.link)}"`;
        const targetAttr = isDummy ? '' : 'target="_blank"';
        return `
        <div class="live-feed-item">
          <a ${hrefAttr} ${targetAttr} class="live-feed-link" style="cursor: ${isDummy ? 'default' : 'pointer'};">
            ${escapeHtml(item.text)}
          </a>
        </div>
        `;
      }).join('');
    } else {
      container.innerHTML = '<div style="text-align: center; color: var(--text-2); padding: 10px 0;">No active notices found at this time.</div>';
    }
  } catch (e) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-2); padding: 10px 0;">Failed to synchronize with the official website.</div>';
  }
}

// Call fetchLiveFeed if collegeId exists after page load
document.addEventListener('DOMContentLoaded', () => {
  if (typeof collegeId !== 'undefined' && collegeId) {
    fetchLiveFeed(collegeId);
  } else {
    // If collegeId is set asynchronously, we can listen for authSynced or another event, 
    // but fetchCollegeDetails is called directly on load. Let's patch fetchCollegeDetails or just call it directly since collegeId is parsed synchronously at the top of the script.
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      fetchLiveFeed(id);
    }
  }
});

  // --- Admin Editing Portal in Details Page ---
  const adminEl = {
    overlay: document.getElementById('adminOverlay'),
    closeBtn: document.getElementById('adminCloseBtn'),
    cancelBtn: document.getElementById('adminFormCancelBtn'),
    form: document.getElementById('collegeEditForm'),
    title: document.getElementById('adminFormTitle'),
    name: document.getElementById('adminFormName'),
    stream: document.getElementById('adminFormStream'),
    city: document.getElementById('adminFormCity'),
    state: document.getElementById('adminFormState'),
    pincode: document.getElementById('adminFormPincode'),
    type: document.getElementById('adminFormType'),
    naac: document.getElementById('adminFormNaac'),
    established: document.getElementById('adminFormEstablished'),
    fees: document.getElementById('adminFormFees'),
    nirf: document.getElementById('adminFormNirf'),
    avgPlacement: document.getElementById('adminFormAvgPlacement'),
    maxPlacement: document.getElementById('adminFormMaxPlacement'),
    desc: document.getElementById('adminFormDesc'),
    gallery: document.getElementById('adminFormGallery'),
    placementRate: document.getElementById('adminFormPlacementRate'),
    campusSize: document.getElementById('adminFormCampusSize'),
    hostel: document.getElementById('adminFormHostel'),
    website: document.getElementById('adminFormWebsite'),
    contactEmail: document.getElementById('adminFormContactEmail'),
    contactPhone: document.getElementById('adminFormContactPhone'),
    facilities: document.getElementById('adminFormFacilities'),
    studentRating: document.getElementById('adminFormStudentRating'),
    applicationDeadline: document.getElementById('adminFormApplicationDeadline'),
    topRecruiters: document.getElementById('adminFormTopRecruiters'),
    scholarshipsInfo: document.getElementById('adminFormScholarshipsInfo'),
    addCourseBtn: document.getElementById('adminAddCourseBtn'),
    coursesContainer: document.getElementById('adminCoursesContainer'),
    addContactBtn: document.getElementById('adminAddContactBtn'),
    contactsContainer: document.getElementById('adminContactsContainer')
  };

  function appendAdminCourseRow(course = null) {
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

    row.querySelector('.row-remove-btn').addEventListener('click', () => row.remove());
    adminEl.coursesContainer.appendChild(row);
  }

  function appendAdminContactRow(contact = null) {
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
      <input type="text" class="con-value" placeholder="Value" required value="${contact ? escapeHtml(contact.contact_value) : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
      <input type="text" class="con-label" placeholder="Label" value="${contact && contact.label ? escapeHtml(contact.label) : ''}" style="padding: 6px 10px; border-radius: var(--radius-xs); border: 1px solid var(--border-2); background: var(--surface-3); color: var(--text); outline: none; font-size:12px;" />
      <button type="button" class="btn-secondary row-remove-btn" style="padding: 6px 10px; font-size: 11px; color: var(--rose); border-color: rgba(204,68,68,0.25);">✕</button>
    `;

    row.querySelector('.row-remove-btn').addEventListener('click', () => row.remove());
    adminEl.contactsContainer.appendChild(row);
  }

  function loadCollegeIntoAdminForm(college) {
    adminEl.title.textContent = `Edit College: ${college.name}`;
    
    adminEl.name.value = college.name || '';
    adminEl.stream.value = college.stream || 'Engineering';
    adminEl.city.value = college.city || '';
    adminEl.state.value = college.state || '';
    adminEl.pincode.value = college.pincode || '';
    adminEl.type.value = college.college_type || 'Government';
    adminEl.naac.value = college.naac_grade || '';
    adminEl.established.value = college.established_year || '';
    adminEl.fees.value = college.avg_fees_per_year || '';
    adminEl.nirf.value = college.nirf_ranking || '';
    adminEl.avgPlacement.value = college.avg_placement_package || '';
    adminEl.maxPlacement.value = college.highest_placement_package || '';
    adminEl.desc.value = college.description || '';
    adminEl.gallery.value = college.gallery_images && Array.isArray(college.gallery_images) ? college.gallery_images.join(', ') : '';
    
    adminEl.placementRate.value = college.placement_rate || '';
    adminEl.campusSize.value = college.campus_size || '';
    adminEl.hostel.value = college.hostel_available !== undefined && college.hostel_available !== null ? (college.hostel_available ? '1' : '0') : '';
    adminEl.website.value = college.website || '';
    adminEl.contactEmail.value = college.contact_email || '';
    adminEl.contactPhone.value = college.contact_phone || '';
    
    if (college.facilities) {
      try {
        const facArr = typeof college.facilities === 'string' ? JSON.parse(college.facilities) : college.facilities;
        adminEl.facilities.value = Array.isArray(facArr) ? facArr.join(', ') : '';
      } catch (e) {
        adminEl.facilities.value = '';
      }
    } else {
      adminEl.facilities.value = '';
    }

    adminEl.studentRating.value = college.student_rating || '';
    adminEl.applicationDeadline.value = college.application_deadline || '';
    adminEl.topRecruiters.value = college.top_recruiters || '';
    adminEl.scholarshipsInfo.value = college.scholarships_info || '';

    adminEl.coursesContainer.innerHTML = '';
    if (college.courses && college.courses.length > 0) {
      college.courses.forEach(c => appendAdminCourseRow(c));
    } else {
      appendAdminCourseRow();
    }

    adminEl.contactsContainer.innerHTML = '';
    if (college.contacts && college.contacts.length > 0) {
      college.contacts.forEach(c => appendAdminContactRow(c));
    } else {
      appendAdminContactRow();
    }

    adminEl.overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    // Directly show the form panel and hide the list panel
    const listPanel = document.getElementById('adminListPanel');
    const formPanel = document.getElementById('adminFormPanel');
    if (listPanel) listPanel.hidden = true;
    if (formPanel) formPanel.hidden = false;
  }

  function closeAdminForm() {
    adminEl.overlay.hidden = true;
    document.body.style.overflow = '';
  }

  // Set up listeners for the admin form
  if (adminEl.closeBtn) adminEl.closeBtn.addEventListener('click', closeAdminForm);
  if (adminEl.cancelBtn) adminEl.cancelBtn.addEventListener('click', closeAdminForm);
  if (adminEl.addCourseBtn) adminEl.addCourseBtn.addEventListener('click', () => appendAdminCourseRow());
  if (adminEl.addContactBtn) adminEl.addContactBtn.addEventListener('click', () => appendAdminContactRow());

  if (adminEl.form) {
    adminEl.form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const token = localStorage.getItem('pk_token');
      if (!token) {
        showToast('Session expired. Please log in again.', 'error');
        return;
      }

      const courses = [];
      adminEl.coursesContainer.querySelectorAll('.admin-course-row').forEach(row => {
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
      adminEl.contactsContainer.querySelectorAll('.admin-contact-row').forEach(row => {
        const val = row.querySelector('.con-value').value.trim();
        if (!val) return;
        contacts.push({
          contact_type: row.querySelector('.con-type').value,
          contact_value: val,
          label: row.querySelector('.con-label').value.trim() || null
        });
      });

      let facArr = null;
      const facVal = adminEl.facilities.value.trim();
      if (facVal) {
        facArr = facVal.split(',').map(s => s.trim()).filter(s => s);
      }

      const bodyData = {
        name: adminEl.name.value.trim(),
        stream: adminEl.stream.value,
        city: adminEl.city.value.trim(),
        state: adminEl.state.value.trim(),
        pincode: adminEl.pincode.value.trim() || null,
        college_type: adminEl.type.value,
        naac_grade: adminEl.naac.value.trim() || null,
        established_year: parseInt(adminEl.established.value, 10) || null,
        avg_fees_per_year: parseInt(adminEl.fees.value, 10) || null,
        nirf_ranking: parseInt(adminEl.nirf.value, 10) || null,
        avg_placement_package: parseFloat(adminEl.avgPlacement.value) || null,
        highest_placement_package: parseFloat(adminEl.maxPlacement.value) || null,
        description: adminEl.desc.value.trim() || null,
        gallery_images: adminEl.gallery.value.trim() ? adminEl.gallery.value.split(',').map(u => u.trim()).filter(u => u) : null,
        placement_rate: parseFloat(adminEl.placementRate.value) || null,
        campus_size: adminEl.campusSize.value.trim() || null,
        hostel_available: adminEl.hostel.value === '1' ? true : (adminEl.hostel.value === '0' ? false : null),
        website: adminEl.website.value.trim() || null,
        contact_email: adminEl.contactEmail.value.trim() || null,
        contact_phone: adminEl.contactPhone.value.trim() || null,
        facilities: facArr ? JSON.stringify(facArr) : null,
        student_rating: parseFloat(adminEl.studentRating.value) || null,
        application_deadline: adminEl.applicationDeadline.value.trim() || null,
        top_recruiters: adminEl.topRecruiters.value.trim() || null,
        scholarships_info: adminEl.scholarshipsInfo.value.trim() || null,
        courses,
        contacts
      };

      try {
        const res = await fetch(`${API_BASE}/colleges/${currentCollege.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(bodyData)
        });

        if (res.ok) {
          showToast('College details updated successfully. Reloading...', 'success');
          closeAdminForm();
          setTimeout(() => window.location.reload(), 1500);
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to save college details.', 'error');
        }
      } catch (err) {
        showToast('Connection error. Failed to update college details.', 'error');
      }
    });
  }

})();