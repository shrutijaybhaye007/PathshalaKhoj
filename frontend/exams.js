(function() {
const API_BASE = '/api';

// DOM Elements
const el = {
  examsGrid: document.getElementById('examsGrid'),
  examDetailOverlay: document.getElementById('examDetailOverlay'),
  examDetailCloseBtn: document.getElementById('examDetailCloseBtn'),
  examDetailTitle: document.getElementById('examDetailTitle'),
  examDetailStatus: document.getElementById('examDetailStatus'),
  examDetailStream: document.getElementById('examDetailStream'),
  examDetailDates: document.getElementById('examDetailDates'),
  examDetailEligibility: document.getElementById('examDetailEligibility'),
  examDetailSyllabus: document.getElementById('examDetailSyllabus'),
  examDetailNoteContainer: document.getElementById('examDetailNoteContainer'),
  examDetailNote: document.getElementById('examDetailNote'),
  examDetailWebsite: document.getElementById('examDetailWebsite'),
  examDetailCalendarBtn: document.getElementById('examDetailCalendarBtn'),
  examSearchInput: document.getElementById('examSearchInput'),
  examStreamFilters: document.getElementById('examStreamFilters')
};

// State
let allExams = [];
let currentStream = 'All';
let currentSearchQuery = '';

// Rich Mock data map for exam dates and calendar downloads
const EXAM_DETAILS_MAP = {
  'JEE Main': {
    eligibility: 'Must have passed Class 12th board exam or equivalent with Physics, Chemistry, and Mathematics. General category candidates must score at least 75% marks (65% for SC/ST).',
    syllabus: 'Physics (Mechanics, Thermodynamics, Electromagnetism, Modern Physics), Chemistry (Physical, Organic, Inorganic), Mathematics (Algebra, Calculus, Coordinate Geometry, Vectors).',
    website: 'https://jeemain.nta.ac.in/',
    icsStart: '20260122',
    icsEnd: '20260202'
  },
  'NEET': {
    eligibility: 'Must have completed 10+2 with Physics, Chemistry, Biology/Biotechnology, and English as core subjects. Minimum 50% aggregate marks for General category (40% for SC/ST/OBC). Age must be at least 17 years.',
    syllabus: 'Physics (Mechanics, Electrostatics, Optics), Chemistry (Organic, Inorganic, Physical), Biology (Botany, Zoology, Genetics, Ecology).',
    website: 'https://neet.nta.nic.in/',
    icsStart: '20260503',
    icsEnd: '20260503'
  },
  'JEE Advanced': {
    eligibility: 'Must be in the top 2,50,000 successful candidates in JEE Main Paper 1. General category candidates must score at least 75% marks in Class 12th.',
    syllabus: 'JoSAA acts as the common counseling agency for IITs, NITs, IIITs, and other GFTIs. Admissions are based on JEE Main/Advanced ranks.',
    website: 'https://josaa.nic.in/',
    icsStart: '20260517',
    icsEnd: '20260517'
  },
  'CAT': {
    eligibility: 'Must hold a Bachelor’s Degree with at least 50% marks or equivalent CGPA (45% for SC/ST/PwD) from a recognized university.',
    syllabus: 'Verbal Ability & Reading Comprehension (VARC), Data Interpretation & Logical Reasoning (DILR), Quantitative Ability (QA).',
    website: 'https://iimcat.ac.in/',
    icsStart: '20261129',
    icsEnd: '20261129'
  },
  'CLAT': {
    eligibility: 'Must have passed 10+2 or an equivalent examination with a minimum of 45% marks for General/OBC/NRI (40% for SC/ST candidates).',
    syllabus: 'English Language, Current Affairs including General Knowledge, Legal Reasoning, Logical Reasoning, Quantitative Techniques.',
    website: 'https://consortiumofnlus.ac.in/',
    icsStart: '20261206',
    icsEnd: '20261206'
  },
  'GATE': {
    eligibility: 'Must hold a Bachelor’s degree in Engineering, Technology, Architecture, Science, Commerce, or Arts, or be in the 3rd year or higher of any undergraduate program.',
    syllabus: 'General Aptitude (verbal, quantitative, analytical, spatial reasoning) + Subject-specific Engineering/Science questions (e.g. CS, EE, ME, etc.).',
    website: 'https://gate2026.iitr.ac.in/',
    icsStart: '20260207',
    icsEnd: '20260215'
  },
  'BITSAT': {
    eligibility: 'Must have passed Class 12th board exam from a recognized Central/State board with Physics, Chemistry, and Mathematics (or Biology for B.Pharm) and English. Minimum 75% marks in PCM/PCB.',
    syllabus: 'Physics, Chemistry, Mathematics/Biology, English Proficiency, Logical Reasoning.',
    website: 'https://www.bitsadmission.com/',
    icsStart: '20260520',
    icsEnd: '20260626'
  },
  'XAT': {
    eligibility: 'Must hold a Bachelor’s degree of minimum 3 years duration or equivalent in any discipline from a recognized university.',
    syllabus: 'Decision Making, Verbal & Logical Ability, Quantitative Ability & Data Interpretation, General Knowledge, Essay Writing.',
    website: 'https://xatonline.in/',
    icsStart: '20260104',
    icsEnd: '20260104'
  },
  'SNAP': {
    eligibility: 'Must hold a graduate degree from any recognized University / Institution with a minimum of 50% marks (45% for SC/ST candidates).',
    syllabus: 'General English (Reading Comprehension, Verbal Ability), Analytical & Logical Reasoning, Quantitative, Data Interpretation & Data Sufficiency.',
    website: 'https://www.snaptest.org/',
    icsStart: '20261206',
    icsEnd: '20261220'
  },
  'AILET': {
    eligibility: 'Must have passed Senior Secondary School Examination (10+2 System) or equivalent Examination with not less than 45% marks (40% for SC/ST/PwD candidates).',
    syllabus: 'English Language, Current Affairs & General Knowledge, Legal Reasoning, Logical Reasoning, Quantitative Techniques.',
    website: 'https://nationallawuniversitydelhi.in/',
    icsStart: '20261214',
    icsEnd: '20261214'
  },
  'CUET': {
    eligibility: 'Candidates who have passed the Class 12th / equivalent examination or are appearing in 2026 irrespective of their age can appear in the CUET UG 2026 exam.',
    syllabus: 'Language Tests, Domain-Specific Subjects (PCM, PCB, Commerce, Arts), General Test (GK, Current Affairs, Mental Ability).',
    website: 'https://exams.nta.ac.in/CUET-UG/',
    icsStart: '20260515',
    icsEnd: '20260531'
  },
  'NID': {
    eligibility: 'Must have passed or be appearing for the 10+2 (Higher Secondary) examination in any discipline (Science, Commerce, Arts) from a recognized board.',
    syllabus: 'DAT Prelims (Design Aptitude, Creative thinking, Visual analysis) + DAT Mains (Studio Test, Model making, Interview).',
    website: 'https://admissions.nid.edu/',
    icsStart: '20251221',
    icsEnd: '20260430'
  },
  'NIFT': {
    eligibility: 'Must have passed 10+2 level examination or equivalent from a recognized board. Maximum age limit is 24 years as of August 1, 2026.',
    syllabus: 'Creative Ability Test (CAT) + General Ability Test (GAT) + Situation Test / Personal Interview.',
    website: 'https://nift.ac.in/admissions/',
    icsStart: '20260205',
    icsEnd: '20260430'
  },
  'MHT CET': {
    eligibility: 'Must have passed Class 12th / equivalent exam with Physics, Chemistry, and Mathematics (or Biology for Pharmacy) with at least 45% aggregate marks (40% for reserved categories) for candidates from Maharashtra.',
    syllabus: 'Based on Class 11th (20% weightage) and Class 12th (80% weightage) syllabus of Maharashtra State Board. Topics include Physics, Chemistry, Mathematics / Biology.',
    website: 'https://cetcell.mahacet.org/',
    icsStart: '20260502',
    icsEnd: '20260513'
  },
  'KCET': {
    eligibility: 'Must have passed Class 12th / equivalent exam with Physics, Chemistry, and Mathematics/Biology and English. Minimum 45% aggregate (40% for SC/ST/OBC).',
    syllabus: 'Based on First and Second PUC (Class 11 & 12) syllabus of Karnataka Department of Pre-University Education.',
    website: 'https://cetonline.karnataka.gov.in/kea/',
    icsStart: '20260418',
    icsEnd: '20260419'
  },
  'AP EAPCET': {
    eligibility: 'Must have passed 10+2 with Physics, Chemistry, and Mathematics as optional subjects, or equivalent. Minimum 45% aggregate (40% for reserved category).',
    syllabus: 'Intermediate syllabus (Class 11 & 12) of AP Board of Intermediate Education.',
    website: 'https://cets.apsche.ap.gov.in/',
    icsStart: '20260513',
    icsEnd: '20260519'
  },
  'TS EAPCET': {
    eligibility: 'Must have passed 10+2 with Physics, Chemistry, and Mathematics/Biology. Minimum 45% aggregate (40% for reserved categories).',
    syllabus: 'Intermediate syllabus (Class 11 & 12) of Telangana State Board of Intermediate Education.',
    website: 'https://eapcet.tsche.ac.in/',
    icsStart: '20260507',
    icsEnd: '20260511'
  },
  'WBJEE': {
    eligibility: 'Must have passed 10+2 from a recognized board with Physics, Mathematics, and one of Chemistry/Biology/Computer Science. Minimum 45% aggregate (40% for SC/ST/OBC) and must pass English.',
    syllabus: 'Physics, Chemistry, and Mathematics of Class 11 & 12 board level.',
    website: 'https://wbjeeb.nic.in/',
    icsStart: '20260426',
    icsEnd: '20260426'
  },
  'KEAM': {
    eligibility: 'Must have passed 10+2 with at least 45% marks in Physics, Chemistry, and Mathematics combined (40% for reserved category).',
    syllabus: 'Based on Class 11 and Class 12 Physics, Chemistry, and Mathematics.',
    website: 'https://cee.kerala.gov.in/',
    icsStart: '20260601',
    icsEnd: '20260609'
  },
  'GUJCET': {
    eligibility: 'Must have passed 10+2 with Physics and Mathematics (or Biology for Pharmacy) with at least 45% marks (40% for reserved category).',
    syllabus: 'Based on GSEB Class 12 syllabus of Physics, Chemistry, and Mathematics/Biology.',
    website: 'https://gujcet.gseb.org/',
    icsStart: '20260331',
    icsEnd: '20260331'
  }
};

async function fetchExams() {
  try {
    const res = await fetch(`${API_BASE}/exams`);
    if (!res.ok) throw new Error('Failed to fetch exams');
    allExams = await res.json();
    allExams.sort((a, b) => {
      const priority = { 'ongoing': 1, 'upcoming': 2, 'scheduled': 2, 'completed': 3, 'done': 3 };
      const statusA = (a.status || '').toLowerCase();
      const statusB = (b.status || '').toLowerCase();
      return (priority[statusA] || 99) - (priority[statusB] || 99);
    });
    renderExams();
  } catch (err) {
    console.error('Error fetching exams:', err);
    el.examsGrid.innerHTML = `<div class="empty-state" style="grid-column: 1 / -1;">
      <span class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 20 2 20 12 2"></polygon><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg></span>
      <h3 class="empty-state-title">Failed to load</h3>
      <p class="empty-state-sub">Could not connect to the exams server.</p>
    </div>`;
  }
}

function renderExams() {
  // Apply Search & Stream Filters
  const filteredExams = allExams.filter(exam => {
    const matchesStream = currentStream === 'All' || exam.stream.toLowerCase() === currentStream.toLowerCase();
    const query = currentSearchQuery.trim();
    const matchesSearch = !query || 
                          exam.exam_name.toLowerCase().includes(query) ||
                          exam.stream.toLowerCase().includes(query);
    return matchesStream && matchesSearch;
  });

  if (filteredExams.length === 0) {
    el.examsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 48px 24px;">
        <span class="empty-state-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-3);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
        <h3 class="empty-state-title">No Matching Exams</h3>
        <p class="empty-state-sub">We couldn't find any exams matching your filter or search query. Try another keyword!</p>
      </div>`;
    return;
  }

  el.examsGrid.innerHTML = '';
  
  filteredExams.forEach(exam => {
    const card = document.createElement('div');
    card.className = 'exam-card glass-card fade-in';
    
    // Parse status color
    let statusClass = 'neutral';
    const status = (exam.status || '').toLowerCase();
    if (status.includes('ongoing')) statusClass = 'success';
    else if (status.includes('upcoming') || status.includes('scheduled')) statusClass = 'warning';
    else if (status.includes('completed')) statusClass = 'neutral';

    card.innerHTML = `
      <div class="exam-card-header">
        <div class="exam-card-badges">
          <span class="status-badge ${statusClass}">${exam.status}</span>
          <span class="stream-badge">${exam.stream}</span>
        </div>
        <h3 class="exam-name" style="margin: 12px 0 6px; font-size: 20px;">${exam.exam_name}</h3>
      </div>
      <div class="exam-card-body" style="flex-grow: 1;">
        <div class="exam-date-row" style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-size: 14.5px; color: var(--text-2);">
          <span class="icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
          <span>${exam.dates_details}</span>
        </div>
        ${exam.post_exam_note ? `
        <div class="exam-note-row" style="display: flex; align-items: flex-start; gap: 8px; font-size: 13.5px; color: var(--gold); background: rgba(245,166,35,0.05); padding: 8px 12px; border-radius: var(--radius-xs); border-left: 3px solid var(--gold);">
          <span class="icon" style="flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5c0 2 1.5 3 2 5a1 1 0 0 1 1 1h4a1 1 0 0 1 1-1c.5-2 2-3 2-5a5 5 0 0 0-5-5z"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg></span>
          <span>${exam.post_exam_note}</span>
        </div>` : ''}
      </div>
      <div class="exam-card-footer" style="margin-top: 20px; border-top: 1px solid var(--border-2); padding-top: 16px;">
        <button class="btn-secondary view-details-btn" style="width: 100%; justify-content: center; padding: 10px 0;">View Details</button>
      </div>
    `;

    // Attach Details click listener
    card.querySelector('.view-details-btn').addEventListener('click', () => {
      openExamDetailModal(exam);
    });

    el.examsGrid.appendChild(card);
  });
}

function openExamDetailModal(exam) {
  if (!el.examDetailOverlay) return;

  el.examDetailTitle.textContent = exam.exam_name;
  
  // Status Badge Class
  let statusClass = 'status-badge neutral';
  const status = (exam.status || '').toLowerCase();
  if (status.includes('ongoing')) statusClass = 'status-badge success';
  else if (status.includes('upcoming') || status.includes('scheduled')) statusClass = 'status-badge warning';
  el.examDetailStatus.className = statusClass;
  el.examDetailStatus.textContent = exam.status;
  
  el.examDetailStream.textContent = exam.stream;
  el.examDetailDates.textContent = exam.dates_details;

  // Render static rich info
  const details = EXAM_DETAILS_MAP[exam.badge_filter] || {
    eligibility: 'General 10+2 passing requirement from a recognized board.',
    syllabus: 'General stream-related subjects.',
    website: 'https://jeemain.nta.ac.in/',
    icsStart: '20260501',
    icsEnd: '20260501'
  };

  el.examDetailEligibility.textContent = details.eligibility;
  el.examDetailSyllabus.textContent = details.syllabus;
  el.examDetailWebsite.href = details.website;

  // Post exam note
  if (exam.post_exam_note) {
    el.examDetailNoteContainer.style.display = 'block';
    el.examDetailNote.textContent = exam.post_exam_note;
  } else {
    el.examDetailNoteContainer.style.display = 'none';
  }

  // Bind Calendar download event (using cloning to reset old listeners)
  if (el.examDetailCalendarBtn) {
    const newBtn = el.examDetailCalendarBtn.cloneNode(true);
    el.examDetailCalendarBtn.parentNode.replaceChild(newBtn, el.examDetailCalendarBtn);
    el.examDetailCalendarBtn = newBtn;
    el.examDetailCalendarBtn.addEventListener('click', () => {
      downloadIcsFile(exam, details);
    });
  }

  el.examDetailOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  el.examDetailCloseBtn.focus();
}

function downloadIcsFile(exam, details) {
  const start = details.icsStart || '20260501';
  const end = details.icsEnd || start;
  const title = exam.exam_name;
  const desc = details.eligibility || 'Entrance Exam schedule';
  
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PathshalaKhoj//Entrance Exams Hub//EN',
    'BEGIN:VEVENT',
    `UID:${exam.badge_filter}-${start}@pathshalakhoj.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${incrementIcsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc.replace(/,/g, '\\,')}`,
    `URL:${details.website}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  
  const blob = new Blob([icsLines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${exam.badge_filter.replace(/\s+/g, '_')}_schedule.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function incrementIcsDate(dateStr) {
  const y = parseInt(dateStr.substring(0, 4), 10);
  const m = parseInt(dateStr.substring(4, 6), 10) - 1;
  const d = parseInt(dateStr.substring(6, 8), 10);
  const date = new Date(y, m, d + 1);
  
  const newY = date.getFullYear();
  const newM = String(date.getMonth() + 1).padStart(2, '0');
  const newD = String(date.getDate()).padStart(2, '0');
  return `${newY}${newM}${newD}`;
}

function closeExamDetailModal() {
  if (el.examDetailOverlay) {
    el.examDetailOverlay.hidden = true;
    document.body.style.overflow = '';
  }
}

if (el.examDetailCloseBtn) {
  el.examDetailCloseBtn.addEventListener('click', closeExamDetailModal);
}
if (el.examDetailOverlay) {
  el.examDetailOverlay.addEventListener('click', (e) => {
    if (e.target === el.examDetailOverlay) closeExamDetailModal();
  });
}

// Wire up Search Input
if (el.examSearchInput) {
  el.examSearchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase();
    renderExams();
  });
}

// Wire up Stream Filters
if (el.examStreamFilters) {
  el.examStreamFilters.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states
      el.examStreamFilters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentStream = btn.dataset.stream;
      renderExams();
    });
  });
}

// Initial fetch
fetchExams();

})();