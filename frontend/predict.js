(function() {
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
const predictForm = document.getElementById('predictForm');
const predictResults = document.getElementById('predictResults');
const predictSafe = document.querySelector('#predictSafe .result-list');
const predictTarget = document.querySelector('#predictTarget .result-list');
const predictReach = document.querySelector('#predictReach .result-list');
const predStream = document.getElementById('predStream');
const predBoard = document.getElementById('predBoard');
const predRank = document.getElementById('predRank');

// Wizard Step Navigation Elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const nextStepBtn = document.getElementById('nextStepBtn');
const prevStepBtn = document.getElementById('prevStepBtn');
const streamCards = document.querySelectorAll('.stream-option-card');
const scanningScreen = document.getElementById('scanningScreen');
const scannerText = document.getElementById('scannerText');

// Auth Lock Elements
const authOverlay = document.getElementById('predictorAuthOverlay');
const unlockBtn = document.getElementById('predictorUnlockBtn');

// 1. Initial Authentication Check
function checkPredictorAuth() {
  const token = localStorage.getItem('pk_token');
  if (!token) {
    if (authOverlay) authOverlay.style.display = 'flex';
    if (predictForm) {
      predictForm.style.filter = 'blur(6px)';
      predictForm.style.pointerEvents = 'none';
    }
  } else {
    if (authOverlay) authOverlay.style.display = 'none';
    if (predictForm) {
      predictForm.style.filter = '';
      predictForm.style.pointerEvents = '';
    }
  }
}

// Check on load
checkPredictorAuth();

// Unlock trigger
if (unlockBtn) {
  unlockBtn.addEventListener('click', () => {
    const loginBtn = document.getElementById('navLoginBtn');
    if (loginBtn) loginBtn.click();
  });
}

// 2. Stream Option Card Selector Click handler
if (streamCards && streamCards.length > 0) {
  streamCards.forEach(card => {
    card.addEventListener('click', () => {
      // Toggle active states
      streamCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      // Update hidden select element value
      const val = card.getAttribute('data-value');
      if (predStream) {
        predStream.value = val;
      }
    });
  });
}

// 3. Step transitions
if (nextStepBtn) {
  nextStepBtn.addEventListener('click', () => {
    step1.style.display = 'none';
    step2.style.display = 'block';
  });
}
if (prevStepBtn) {
  prevStepBtn.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'block';
  });
}

// 4. Form Submit Listener (includes scanning screen cycle)
if (predictForm) {
  predictForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Auth Lock Check
    const token = localStorage.getItem('pk_token');
    if (!token) {
      checkPredictorAuth();
      return;
    }
    
    // Hide Form, Show scanning animations
    step2.style.display = 'none';
    scanningScreen.style.display = 'block';
    
    // Cycle Scanner Text labels
    const cycleTexts = [
      "Parsing academic credentials...",
      "Matching with university cutoffs...",
      "Calculating safe & target ranges..."
    ];
    
    let textIndex = 0;
    const interval = setInterval(() => {
      textIndex = (textIndex + 1) % cycleTexts.length;
      if (scannerText) {
        scannerText.textContent = cycleTexts[textIndex];
      }
    }, 550);

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          stream: predStream.value,
          board: predBoard.value,
          rank: predRank.value
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to generate predictions');

      // Simulate a 1.7 second scanner lookup delay
      setTimeout(() => {
        clearInterval(interval);
        scanningScreen.style.display = 'none';
        step1.style.display = 'block'; // reset wizard step for next lookups
        
        // Render matches
        renderPredictResults(json.results);
        
        // Customize the metrics report summary text dynamically
        const summary = document.getElementById('reportSummary');
        if (summary) {
          summary.innerHTML = `Based on your rank of <strong>${parseInt(predRank.value).toLocaleString()}</strong> and board percentage of <strong>${predBoard.value}%</strong>, we matched your profile against <strong>${predStream.value}</strong> databases.`;
        }
        
        predictResults.style.display = 'block';
        predictResults.scrollIntoView({ behavior: 'smooth' });
      }, 1700);

    } catch (err) {
      clearInterval(interval);
      scanningScreen.style.display = 'none';
      step2.style.display = 'block'; // restore form step so they can try again
      alert(err.message);
    }
  });
}

function renderPredictResults(data) {
  // Safe matches column
  if (data.safe && data.safe.length > 0) {
    predictSafe.innerHTML = data.safe.map(createCollegeCard).join('');
    document.getElementById('predictSafe').style.display = 'block';
  } else {
    document.getElementById('predictSafe').style.display = 'none';
  }

  // Target matches column
  if (data.target && data.target.length > 0) {
    predictTarget.innerHTML = data.target.map(createCollegeCard).join('');
    document.getElementById('predictTarget').style.display = 'block';
  } else {
    document.getElementById('predictTarget').style.display = 'none';
  }

  // Reach matches column
  if (data.reach && data.reach.length > 0) {
    predictReach.innerHTML = data.reach.map(createCollegeCard).join('');
    document.getElementById('predictReach').style.display = 'block';
  } else {
    document.getElementById('predictReach').style.display = 'none';
  }

  // Handle case where NO matches found at all
  if (!data.safe.length && !data.target.length && !data.reach.length) {
    predictTarget.innerHTML = '<p style="color: var(--text-3); text-align: center; padding: 20px 0;">No colleges match these criteria. Try adjusting your rank or board scores.</p>';
    document.getElementById('predictTarget').style.display = 'block';
  }
}

function createCollegeCard(c) {
  return `
    <a href="college.html?id=${c.id}" style="display: flex; align-items: center; gap: 16px; background: var(--surface-3); padding: 16px; border-radius: 12px; text-decoration: none; border: 1px solid var(--border-2); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;" onmouseover="this.style.transform='translateX(6px)'; this.style.borderColor='var(--gold)';" onmouseout="this.style.transform='translateX(0)'; this.style.borderColor='var(--border-2)';">
      ${c.logo_url ? `<img src="${escapeHtml(c.logo_url)}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; box-shadow: var(--shadow-sm);" onerror="this.src=''; this.style.display='none';">` : ''}
      <div style="flex: 1;">
        <h4 style="margin: 0; color: var(--text); font-family: var(--font-display); font-size: 15px; font-weight: 750;">${escapeHtml(c.name)}</h4>
        <div style="font-size: 12px; color: var(--text-2); margin-top: 4px;">📍 ${escapeHtml(c.city)}, ${escapeHtml(c.state)} | ★ NIRF: ${escapeHtml(c.nirf_ranking) || 'N/A'}</div>
      </div>
    </a>
  `;
}

})();