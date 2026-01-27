/**
 * JobSearch API Client
 * Fetches job postings from Arbetsförmedlingens JobSearch API
 */

const axios = require('axios');

const JOBSEARCH_BASE_URL = 'https://jobsearch.api.jobtechdev.se';

/**
 * Search for jobs by title/role
 * @param {string} query - Job title or role to search for
 * @param {number} limit - Maximum number of results (default: 15)
 * @returns {Promise<Array>} Array of job postings
 */
async function searchJobs(query, limit = 15) {
  try {
    const response = await axios.get(`${JOBSEARCH_BASE_URL}/search`, {
      params: {
        q: query,
        limit: limit,
        offset: 0
      },
      headers: {
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (response.data && response.data.hits) {
      return response.data.hits.map(hit => ({
        id: hit.id,
        headline: hit.headline || 'Ingen titel',
        employer: hit.employer?.name || 'Okänd arbetsgivare',
        location: hit.workplace_address?.municipality || 'Okänd plats',
        description: hit.description?.text || hit.description?.text_formatted || '',
        requirements: extractRequirements(hit),
        published: hit.publication_date,
        url: hit.webpage_url || hit.application_details?.url || null
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching jobs from JobSearch API:', error.message);
    throw new Error(`Failed to fetch jobs: ${error.message}`);
  }
}

/**
 * Extract requirements from job posting
 * @param {Object} hit - Job posting object
 * @returns {string} Combined requirements text
 */
function extractRequirements(hit) {
  const parts = [];
  
  if (hit.must_have?.skills) {
    const skills = hit.must_have.skills.map(s => s.label).join(', ');
    parts.push(`Krav: ${skills}`);
  }
  
  if (hit.nice_to_have?.skills) {
    const skills = hit.nice_to_have.skills.map(s => s.label).join(', ');
    parts.push(`Meriterande: ${skills}`);
  }
  
  if (hit.experience_required !== undefined && hit.experience_required) {
    parts.push('Erfarenhet krävs');
  }
  
  return parts.join('. ');
}

module.exports = {
  searchJobs
};
