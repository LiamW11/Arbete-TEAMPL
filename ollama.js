/**
 * Ollama API Client
 * Handles communication with local Ollama instance for AI analysis
 */

const axios = require('axios');

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

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
      timeout: 60000 // 60 second timeout for complex analysis
    });

    if (response.data && response.data.response) {
      return parseAnalysisResponse(response.data.response, job);
    }

    throw new Error('Invalid response from Ollama');
  } catch (error) {
    console.error(`Error analyzing job ${job.id}:`, error.message);
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
  return `Du är en expert på att matcha kandidatprofiler mot jobbannonser.

KANDIDATPROFIL:
${profileText.substring(0, 4000)} // Begränsa till ~4000 tecken

JOBBANNONS:
Titel: ${job.headline}
Arbetsgivare: ${job.employer}
Plats: ${job.location}
Beskrivning: ${job.description.substring(0, 2000)}
${job.requirements ? `Krav: ${job.requirements}` : ''}

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
