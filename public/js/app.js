/**
 * LinkedIn Job Matcher - Frontend Application
 */

// State management
const state = {
  currentResults: [],
  currentFilter: 'all'
};

// DOM elements
const elements = {
  uploadForm: document.getElementById('upload-form'),
  uploadSection: document.getElementById('upload-section'),
  loadingSection: document.getElementById('loading-section'),
  resultsSection: document.getElementById('results-section'),
  resultsContainer: document.getElementById('results-container'),
  fileInput: document.getElementById('resume-file'),
  fileLabelText: document.getElementById('file-label-text'),
  jobRoleInput: document.getElementById('job-role'),
  analyzeBtn: document.getElementById('analyze-btn'),
  newAnalysisBtn: document.getElementById('new-analysis-btn'),
  loadingMessage: document.getElementById('loading-message'),
  progressFill: document.getElementById('progress-fill'),
  resultsCount: document.getElementById('results-count'),
  resultsDuration: document.getElementById('results-duration'),
  statusIndicator: document.getElementById('status-indicator'),
  statusText: document.getElementById('status-text')
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeEventListeners();
  checkSystemStatus();
});

/**
 * Initialize all event listeners
 */
function initializeEventListeners() {
  // File input change
  elements.fileInput.addEventListener('change', handleFileSelect);

  // Form submit
  elements.uploadForm.addEventListener('submit', handleFormSubmit);

  // New analysis button
  elements.newAnalysisBtn.addEventListener('click', resetToUpload);

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', handleFilterChange);
  });
}

/**
 * Check system status (Ollama availability)
 */
async function checkSystemStatus() {
  try {
    const response = await fetch('/api/health');
    const data = await response.json();

    if (data.ollama.available) {
      showStatus('System redo - Ollama körs', false);
    } else {
      showStatus('Varning: Ollama körs inte', true);
    }
  } catch (error) {
    showStatus('Kan inte ansluta till server', true);
  }
}

/**
 * Show status message
 */
function showStatus(message, isError = false) {
  elements.statusIndicator.classList.remove('hidden');
  elements.statusText.textContent = message;
  
  const dot = elements.statusIndicator.querySelector('.status-dot');
  if (isError) {
    dot.classList.add('error');
  } else {
    dot.classList.remove('error');
  }
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
  const file = event.target.files[0];
  
  if (file) {
    elements.fileLabelText.textContent = file.name;
  } else {
    elements.fileLabelText.textContent = 'Välj PDF-fil';
  }
}

/**
 * Handle form submission
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  const file = elements.fileInput.files[0];
  const jobRole = elements.jobRoleInput.value.trim();

  if (!file) {
    alert('Vänligen välj en PDF-fil');
    return;
  }

  if (!jobRole) {
    alert('Vänligen ange en jobbroll');
    return;
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('resume', file);
  formData.append('jobRole', jobRole);

  // Show loading state
  showLoading();

  try {
    // Send request
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analys misslyckades');
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      state.currentResults = data.results;
      showResults(data);
    } else {
      alert(data.message || 'Inga jobb hittades');
      resetToUpload();
    }

  } catch (error) {
    console.error('Analysis error:', error);
    alert(`Fel: ${error.message}`);
    resetToUpload();
  }
}

/**
 * Show loading state with progress
 */
function showLoading() {
  elements.uploadSection.classList.add('hidden');
  elements.resultsSection.classList.add('hidden');
  elements.loadingSection.classList.remove('hidden');
  elements.analyzeBtn.disabled = true;

  // Simulate progress
  let progress = 0;
  const messages = [
    'Extraherar text från PDF...',
    'Söker efter relevanta jobb...',
    'Analyserar matchningar med AI...',
    'Beräknar matchningspoäng...',
    'Färdigställer resultat...'
  ];

  const progressInterval = setInterval(() => {
    progress += 2;
    elements.progressFill.style.width = `${Math.min(progress, 90)}%`;

    const messageIndex = Math.floor(progress / 20);
    if (messageIndex < messages.length) {
      elements.loadingMessage.textContent = messages[messageIndex];
    }

    if (progress >= 90) {
      clearInterval(progressInterval);
    }
  }, 300);
}

/**
 * Show results
 */
function showResults(data) {
  elements.loadingSection.classList.add('hidden');
  elements.resultsSection.classList.remove('hidden');

  // Update meta information
  elements.resultsCount.textContent = `${data.totalJobs} jobb analyserade`;
  elements.resultsDuration.textContent = `${data.duration}s`;

  // Reset filter
  state.currentFilter = 'all';
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === 'all');
  });

  // Render results
  renderResults();
}

/**
 * Render job results
 */
function renderResults() {
  const filteredResults = filterResults(state.currentResults, state.currentFilter);
  
  elements.resultsContainer.innerHTML = '';

  if (filteredResults.length === 0) {
    elements.resultsContainer.innerHTML = `
      <div class="card text-center">
        <p>Inga jobb matchar det valda filtret.</p>
      </div>
    `;
    return;
  }

  filteredResults.forEach(job => {
    const jobCard = createJobCard(job);
    elements.resultsContainer.appendChild(jobCard);
  });
}

/**
 * Filter results based on score
 */
function filterResults(results, filter) {
  switch (filter) {
    case 'high':
      return results.filter(r => r.score >= 70);
    case 'medium':
      return results.filter(r => r.score >= 40 && r.score < 70);
    case 'low':
      return results.filter(r => r.score < 40);
    case 'all':
    default:
      return results;
  }
}

/**
 * Create job card element
 */
function createJobCard(job) {
  const card = document.createElement('div');
  card.className = 'job-card';

  const scoreClass = getScoreClass(job.score);
  
  card.innerHTML = `
    <div class="job-header">
      <div class="job-info">
        <h3>${escapeHtml(job.headline)}</h3>
        <div class="job-company">${escapeHtml(job.employer)}</div>
        <div class="job-location">${escapeHtml(job.location)}</div>
      </div>
      <div class="score-badge ${scoreClass}">
        ${job.score}
      </div>
    </div>

    <div class="job-details">
      ${job.matches && job.matches.length > 0 ? `
        <div class="detail-section">
          <h4>Matchningar</h4>
          <ul class="detail-list matches-list">
            ${job.matches.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${job.missing && job.missing.length > 0 ? `
        <div class="detail-section">
          <h4>Saknas</h4>
          <ul class="detail-list missing-list">
            ${job.missing.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

      ${job.reasoning ? `
        <div class="detail-section">
          <h4>Motivering</h4>
          <div class="reasoning">${escapeHtml(job.reasoning)}</div>
        </div>
      ` : ''}
    </div>

    ${job.url ? `
      <div class="job-footer">
        <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-view-job">
          Visa annons →
        </a>
      </div>
    ` : ''}
  `;

  return card;
}

/**
 * Get score class for styling
 */
function getScoreClass(score) {
  if (score >= 70) return 'score-high';
  if (score >= 40) return 'score-medium';
  return 'score-low';
}

/**
 * Handle filter change
 */
function handleFilterChange(event) {
  const filter = event.target.dataset.filter;
  state.currentFilter = filter;

  // Update active state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  // Re-render results
  renderResults();
}

/**
 * Reset to upload view
 */
function resetToUpload() {
  elements.loadingSection.classList.add('hidden');
  elements.resultsSection.classList.add('hidden');
  elements.uploadSection.classList.remove('hidden');
  elements.analyzeBtn.disabled = false;

  // Reset form
  elements.uploadForm.reset();
  elements.fileLabelText.textContent = 'Välj PDF-fil';
  elements.progressFill.style.width = '0%';

  // Clear results
  state.currentResults = [];
  state.currentFilter = 'all';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format duration
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
