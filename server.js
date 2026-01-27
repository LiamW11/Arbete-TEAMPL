import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const PORT = 3000;

// Konfigurera multer för in-memory PDF-upload
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB
});

// Initiera Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Servera statiska filer
app.use(express.static('public'));
app.use(express.json());

/**
 * Hämta jobbannonser från Arbetsförmedlingens API
 */
async function fetchJobs(role, limit = 15) {
  try {
    const url = `https://jobsearch.api.jobtechdev.se/search?q=${encodeURIComponent(role)}&limit=${limit}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`JobSearch API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Extrahera relevant information
    return data.hits.map(hit => ({
      id: hit.id,
      title: hit.headline,
      employer: hit.employer?.name || 'Okänd arbetsgivare',
      description: hit.description?.text || '',
      requirements: hit.description?.text || '',
      location: hit.workplace_address?.municipality || 'Ej angivet',
      url: hit.webpage_url || ''
    }));
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

/**
 * Extrahera text från PDF i minnet
 */
async function extractPdfText(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Kunde inte läsa PDF-filen');
  }
}

/**
 * Analysera matchning mellan profil och jobb med Gemini
 */
async function analyzeMatch(profileText, job) {
  const prompt = `Du är en rekryteringsexpert som analyserar hur väl en kandidats LinkedIn-profil matchar ett jobb.

**KANDIDATENS PROFIL:**
${profileText}

**JOBANNONS:**
Titel: ${job.title}
Företag: ${job.employer}
Beskrivning: ${job.description}

**UPPGIFT:**
Analysera matchningen mellan kandidatens profil och jobbannonsen. Ge ett ärligt och faktabaserat svar.

Returnera ENDAST ett JSON-objekt (ingen annan text) med följande struktur:
{
  "score": [ett tal mellan 0-100],
  "matches": [
    "kompetens/erfarenhet som kandidaten HAR och som matchar jobbet"
  ],
  "missing": [
    "kompetens/krav som jobbet efterfrågar men som INTE syns i profilen"
  ],
  "summary": "En kort sammanfattning (2-3 meningar) om varför denna score gavs"
}

**VIKTIGA REGLER:**
- Basera analysen ENDAST på faktiskt innehåll i profilen
- Anta INTE att kandidaten har kompetenser som inte nämns
- Var ärlig om vad som saknas
- Score ska reflektera övergripande matchning
- Skriv på svenska
- Returnera ENDAST JSON, ingen annan text`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Ta bort eventuella markdown-kodblock
    const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(cleanedText);
    
    return {
      jobId: job.id,
      jobTitle: job.title,
      employer: job.employer,
      location: job.location,
      url: job.url,
      score: analysis.score,
      matches: analysis.matches,
      missing: analysis.missing,
      summary: analysis.summary
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    return {
      jobId: job.id,
      jobTitle: job.title,
      employer: job.employer,
      location: job.location,
      url: job.url,
      score: 0,
      matches: [],
      missing: ['Kunde inte analysera detta jobb'],
      summary: 'Ett fel uppstod vid analysen'
    };
  }
}

/**
 * Huvudendpoint: Analysera profil mot jobb
 */
app.post('/api/analyze', upload.single('profile'), async (req, res) => {
  try {
    // Validera input
    if (!req.file) {
      return res.status(400).json({ error: 'Ingen PDF-fil uppladdad' });
    }
    
    if (!req.body.role) {
      return res.status(400).json({ error: 'Ingen roll angiven' });
    }
    
    const role = req.body.role;
    
    console.log(`Analyzing profile for role: ${role}`);
    
    // 1. Extrahera text från PDF
    console.log('Extracting PDF text...');
    const profileText = await extractPdfText(req.file.buffer);
    
    if (!profileText || profileText.length < 50) {
      return res.status(400).json({ error: 'PDF:en verkar vara tom eller oläsbar' });
    }
    
    console.log(`Profile text extracted: ${profileText.length} characters`);
    
    // 2. Hämta jobbannonser
    console.log('Fetching jobs...');
    const jobs = await fetchJobs(role);
    
    if (jobs.length === 0) {
      return res.status(404).json({ error: 'Inga jobb hittades för denna roll' });
    }
    
    console.log(`Found ${jobs.length} jobs`);
    
    // 3. Analysera varje jobb med Gemini
    console.log('Analyzing matches with Gemini...');
    const analyses = [];
    
    for (const job of jobs) {
      console.log(`Analyzing: ${job.title} at ${job.employer}`);
      const analysis = await analyzeMatch(profileText, job);
      analyses.push(analysis);
      
      // Liten paus mellan API-anrop för att undvika rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Sortera efter score
    analyses.sort((a, b) => b.score - a.score);
    
    console.log('Analysis complete!');
    
    res.json({
      success: true,
      totalJobs: analyses.length,
      results: analyses
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Ett fel uppstod vid analysen', 
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    geminiConfigured: !!process.env.GEMINI_API_KEY 
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  WARNING: GEMINI_API_KEY not set in .env file!\n');
  }
});
