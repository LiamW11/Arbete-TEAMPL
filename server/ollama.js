/**
 * Ollama API Client
 * Handles communication with local Ollama instance for AI analysis
 */

const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

/**
 * Sanitize input text to avoid control characters or problematic sequences
 * - Normalize Unicode to NFC (if available)
 * - Remove NULLs and other non-printable control characters (except \t, \n, \r)
 * - Collapse excessive spaces and newlines
 */
function sanitizeText(input) {
  if (!input && input !== 0) return '';
  let s = String(input);
  if (typeof s.normalize === 'function') {
    try { s = s.normalize('NFC'); } catch (e) { /* ignore normalize errors */ }
  }

  // Remove explicit NULL bytes
  s = s.replace(/\x00/g, '');

  // Replace control characters except tab(\t), LF(\n) and CR(\r) with a space
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');

  // Collapse multiple spaces/tabs into single space
  s = s.replace(/[ \t]{2,}/g, ' ');

  // Collapse 3+ newlines into two (preserve paragraph breaks)
  s = s.replace(/\n{3,}/g, '\n\n');

  // Trim edges
  return s.trim();
}

/**
 * Analyze job match between profile and job posting
 * @param {string} profileText - Full LinkedIn profile text
 * @param {Object} job - Job posting object
 * @returns {Promise<Object>} Match analysis with score and details
 */
async function analyzeJobMatch(profileText, job) {
  const prompt = createMatchingPrompt(profileText, job);
  
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: DEFAULT_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for more consistent analysis
        top_p: 0.9
      }
    }, {
      timeout: 600000 // 60 second timeout for complex analysis
    });

    // Ollama returns { response: '...' } for successful generates
    if (response && response.data && response.data.response) {
      return parseAnalysisResponse(response.data.response, job);
    }

    // If Ollama returned a non-standard structure, include response for debugging
    console.error(`Unexpected Ollama response for job ${job.id}:`, response && response.data ? response.data : response);
    throw new Error('Invalid response from Ollama');
  } catch (error) {
    // If axios got a non-2xx response, include status and body for debugging
    if (error.response) {
      console.error(`Error analyzing job ${job.id}: status=${error.response.status}`);
      try {
        console.error('Ollama response data:', error.response.data);
      } catch (e) {
        console.error('Could not stringify Ollama response body');
      }
    } else {
      console.error(`Error analyzing job ${job.id}:`, error.message);
    }
    return {
      jobId: job.id,
      headline: job.headline,
      employer: job.employer,
      score: 0,
      error: `Analys misslyckades: ${error.message}`
    };
  }
}

/**
 * Create detailed prompt for matching analysis
 */
function createMatchingPrompt(profileText, job) {
  // Sanitize inputs first to avoid control characters or problematic unicode
  const safeProfile = sanitizeText(profileText).substring(0, 4000); // ~4000 chars
  const safeHeadline = sanitizeText(job.headline || 'Ingen titel');
  const safeEmployer = sanitizeText(job.employer || 'Okänd arbetsgivare');
  const safeLocation = sanitizeText(job.location || 'Okänd plats');
  const safeDescription = sanitizeText(job.description || '').substring(0, 2000);
  const safeRequirements = sanitizeText(job.requirements || '');

  return `Du har mycket erfarenhet av att matcha kandidatprofiler mot jobbannonser för att räkna ut hur bra en kandidat passar för en viss roll.

Givet nedanstående kandidatprofil och jobbannons, analysera hur väl kandidaten matchar jobbet.

KANDIDATPROFIL:
${safeProfile}

JOBBANNONS:
Titel: ${safeHeadline}
Arbetsgivare: ${safeEmployer}
Plats: ${safeLocation}
Beskrivning: ${safeDescription}
${safeRequirements ? `Krav: ${safeRequirements}` : ''}

UPPGIFT:
Analysera hur väl kandidatprofilen matchar jobbannonsen. Svara i följande format:

MATCHNINGSPOÄNG: [0-100]

MATCHNINGAR (vad kandidaten har som matchar):
- [Lista konkreta matchningar baserat på faktiskt innehåll]

SAKNAS (vad som krävs men inte finns i profilen):
- [Lista konkreta saker som saknas]

MOTIVERING:
[Kort förklaring på 2-3 meningar om varför denna matchning fick detta betyg]

Viktigt:
- Basera ENDAST analys på faktiskt innehåll i profilen
- Inga antaganden eller gissningar
- Ifall du blir osäker är det bättra att sänka poängen än att gissa högt
- Vara specifik och konkret
- Matcha semantiskt (t.ex. "React" matchar "frontend-utveckling")`;
}

/**
 * Parse Ollama's response into structured data
 */
function parseAnalysisResponse(responseText, job) {
  const result = {
    jobId: job.id,
    headline: job.headline,
    employer: job.employer,
    location: job.location,
    url: job.url,
    score: 0,
    matches: [],
    missing: [],
    reasoning: ''
  };

  try {
    // Extract score
    const scoreMatch = responseText.match(/MATCHNINGSPOÄNG:\s*(\d+)/i);
    if (scoreMatch) {
      result.score = Math.min(100, Math.max(0, parseInt(scoreMatch[1])));
    }

    // Extract matches
    const matchesSection = extractSection(responseText, 'MATCHNINGAR', 'SAKNAS');
    if (matchesSection) {
      result.matches = extractBulletPoints(matchesSection);
    }

    // Extract missing
    const missingSection = extractSection(responseText, 'SAKNAS', 'MOTIVERING');
    if (missingSection) {
      result.missing = extractBulletPoints(missingSection);
    }

    // Extract reasoning
    const reasoningMatch = responseText.match(/MOTIVERING:\s*(.+?)(?:\n\n|$)/is);
    if (reasoningMatch) {
      result.reasoning = reasoningMatch[1].trim();
    }

  } catch (error) {
    console.error('Error parsing Ollama response:', error);
    result.reasoning = 'Kunde inte tolka analysen korrekt.';
  }

  return result;
}

/**
 * Extract a section from the response text
 */
function extractSection(text, startMarker, endMarker) {
  const startRegex = new RegExp(`${startMarker}[:\\s]*\\(?[^:]*?\\)?:?\\s*`, 'i');
  const startMatch = text.match(startRegex);
  
  if (!startMatch) return '';
  
  const startPos = startMatch.index + startMatch[0].length;
  const endRegex = new RegExp(`${endMarker}`, 'i');
  const endMatch = text.substring(startPos).match(endRegex);
  
  const endPos = endMatch ? startPos + endMatch.index : text.length;
  
  return text.substring(startPos, endPos).trim();
}

/**
 * Extract bullet points from text
 */
function extractBulletPoints(text) {
  const lines = text.split('\n');
  const points = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Match lines starting with -, *, •, or numbers
    if (trimmed.match(/^[-*•]\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
      const point = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
      if (point.length > 0) {
        points.push(point);
      }
    }
  }
  
  return points;
}

/**
 * Check if Ollama is running and accessible
 */
async function checkOllamaStatus() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000
    });
    return {
      available: true,
      models: response.data.models || []
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

module.exports = {
  analyzeJobMatch,
  checkOllamaStatus
};
