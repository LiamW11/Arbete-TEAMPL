// DOM elements
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');

const analysisForm = document.getElementById('analysisForm');
const profileFile = document.getElementById('profileFile');
const fileName = document.getElementById('fileName');
const roleInput = document.getElementById('roleInput');

const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

const resultsSummary = document.getElementById('resultsSummary');
const resultsGrid = document.getElementById('resultsGrid');
const errorMessage = document.getElementById('errorMessage');

const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');

// Update file name display
profileFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    fileName.textContent = file.name;
  } else {
    fileName.textContent = 'Ingen fil vald';
  }
});

// Handle form submission
analysisForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const file = profileFile.files[0];
  const role = roleInput.value.trim();
  
  if (!file || !role) {
    showError('Vänligen fyll i alla fält');
    return;
  }
  
  // Validate file type
  if (file.type !== 'application/pdf') {
    showError('Vänligen ladda upp en PDF-fil');
    return;
  }
  
  await analyzeProfile(file, role);
});

// Analyze profile
async function analyzeProfile(file, role) {
  try {
    // Show loading state
    showLoading();
    
    // Prepare form data
    const formData = new FormData();
    formData.append('profile', file);
    formData.append('role', role);
    
    // Step 1: Reading PDF
    await sleep(500);
    completeStep(step1);
    activateStep(step2);
    
    // Send to backend
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ett fel uppstod vid analysen');
    }
    
    // Step 2: Fetching jobs
    await sleep(500);
    completeStep(step2);
    activateStep(step3);
    
    const data = await response.json();
    
    // Step 3: Analyzing
    await sleep(1000);
    completeStep(step3);
    
    // Show results
    displayResults(data.results, role);
    
  } catch (error) {
    console.error('Analysis error:', error);
    showError(error.message);
  }
}

// Display results
function displayResults(results, role) {
  // Calculate statistics
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const highMatches = results.filter(r => r.score >= 70).length;
  
  // Summary
  resultsSummary.innerHTML = `
    <h3>Hittade ${results.length} jobb för "${role}"</h3>
    <p>Genomsnittlig matchning: <strong>${avgScore}%</strong> | 
       ${highMatches} jobb med 70%+ matchning</p>
  `;
  
  // Job cards
  resultsGrid.innerHTML = results.map(job => createJobCard(job)).join('');
  
  // Show results section
  hideAll();
  resultsSection.classList.remove('hidden');
}

// Create job card HTML
function createJobCard(job) {
  const scoreClass = job.score >= 70 ? 'high' : job.score >= 50 ? 'medium' : 'low';
  
  const matchesHtml = job.matches.length > 0 
    ? `<ul>${job.matches.map(m => `<li>${m}</li>`).join('')}</ul>`
    : '<p style="color: #999; font-style: italic;">Ingen specifik matchning identifierad</p>';
    
  const missingHtml = job.missing.length > 0
    ? `<ul>${job.missing.map(m => `<li>${m}</li>`).join('')}</ul>`
    : '<p style="color: #999; font-style: italic;">Inga större gap identifierade</p>';
  
  return `
    <div class="job-card">
      <div class="job-header">
        <div class="job-title">
          <h3>${escapeHtml(job.jobTitle)}</h3>
          <div class="job-company">${escapeHtml(job.employer)}</div>
          <div class="job-location">📍 ${escapeHtml(job.location)}</div>
        </div>
        <div class="score-badge ${scoreClass}">
          ${job.score}%
        </div>
      </div>
      
      <div class="job-summary">
        ${escapeHtml(job.summary)}
      </div>
      
      <div class="job-details">
        <div class="detail-section matches">
          <h4>✅ Vad som matchar</h4>
          ${matchesHtml}
        </div>
        
        <div class="detail-section missing">
          <h4>❌ Vad som saknas</h4>
          ${missingHtml}
        </div>
      </div>
      
      ${job.url ? `<a href="${escapeHtml(job.url)}" target="_blank" class="job-link">Se annonsen →</a>` : ''}
    </div>
  `;
}

// Show loading state
function showLoading() {
  hideAll();
  resetSteps();
  activateStep(step1);
  loadingSection.classList.remove('hidden');
}

// Show error
function showError(message) {
  hideAll();
  errorMessage.textContent = message;
  errorSection.classList.remove('hidden');
}

// Show upload form
function showUploadForm() {
  hideAll();
  uploadSection.classList.remove('hidden');
}

// Hide all sections
function hideAll() {
  uploadSection.classList.add('hidden');
  loadingSection.classList.add('hidden');
  resultsSection.classList.add('hidden');
  errorSection.classList.add('hidden');
}

// Step management
function activateStep(step) {
  step.classList.add('active');
}

function completeStep(step) {
  step.classList.remove('active');
  step.classList.add('completed');
}

function resetSteps() {
  [step1, step2, step3].forEach(step => {
    step.classList.remove('active', 'completed');
  });
}

// Utility: Sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners for reset buttons
newAnalysisBtn.addEventListener('click', () => {
  analysisForm.reset();
  fileName.textContent = 'Ingen fil vald';
  showUploadForm();
});

tryAgainBtn.addEventListener('click', () => {
  showUploadForm();
});

// Check API health on load
async function checkHealth() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();
    
    if (!data.geminiConfigured) {
      console.warn('⚠️ Gemini API key not configured. Please add it to .env file.');
    }
  } catch (error) {
    console.error('Health check failed:', error);
  }
}

checkHealth();
