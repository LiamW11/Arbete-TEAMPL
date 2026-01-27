/**
 * LinkedIn Job Matcher Server
 * Main Express server that handles PDF uploads, job search, and AI matching
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const { searchJobs } = require('./jobsearch');
const { analyzeJobMatch, checkOllamaStatus } = require('./ollama');
const { extractTextFromPDF, isValidPDF } = require('./pdf-processor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Configure multer for memory storage (no disk writes)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (isValidPDF(file.originalname, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Endast PDF-filer är tillåtna'));
    }
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  const ollamaStatus = await checkOllamaStatus();
  
  res.json({
    status: 'ok',
    ollama: ollamaStatus
  });
});

/**
 * Main analysis endpoint
 * Handles PDF upload, job search, and AI matching
 */
app.post('/api/analyze', upload.single('resume'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate inputs
    if (!req.file) {
      return res.status(400).json({ error: 'Ingen PDF-fil uppladdad' });
    }

    const { jobRole } = req.body;
    if (!jobRole || jobRole.trim().length === 0) {
      return res.status(400).json({ error: 'Jobbroll måste anges' });
    }

    console.log(`\n=== Starting analysis ===`);
    console.log(`Role: ${jobRole}`);
    console.log(`PDF: ${req.file.originalname} (${req.file.size} bytes)`);

    // Step 1: Extract text from PDF
    console.log('\n[1/4] Extracting text from PDF...');
    const tempFilePath = path.join(__dirname, `temp_${Date.now()}.pdf`);
    
    try {
      // Write buffer to temporary file
      await fs.writeFile(tempFilePath, req.file.buffer);
      
      // Extract text
      const profileText = await extractTextFromPDF(tempFilePath);
      
      // Clean up temp file
      await fs.unlink(tempFilePath);
      
      console.log(`✓ Extracted ${profileText.length} characters`);

      if (profileText.length < 100) {
        return res.status(400).json({ 
          error: 'PDF innehåller för lite text. Kontrollera att filen innehåller din profil.' 
        });
      }

      // Step 2: Search for jobs
      console.log('\n[2/4] Searching for jobs...');
      const jobs = await searchJobs(jobRole, 2);
      console.log(`✓ Found ${jobs.length} jobs`);

      if (jobs.length === 0) {
        return res.json({
          message: 'Inga jobb hittades för den angivna rollen',
          results: []
        });
      }

      // Step 3: Analyze matches with Ollama
      console.log('\n[3/4] Analyzing matches with Ollama...');
      const results = [];
      
      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        console.log(`  Analyzing job ${i + 1}/${jobs.length}: ${job.headline}...`);
        
        const analysis = await analyzeJobMatch(profileText, job);
        results.push(analysis);
      }

      // Step 4: Sort by score
      console.log('\n[4/4] Sorting results...');
      results.sort((a, b) => b.score - a.score);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✓ Analysis complete in ${duration}s`);
      console.log(`Top score: ${results[0]?.score || 0}`);

      res.json({
        success: true,
        jobRole: jobRole,
        totalJobs: results.length,
        results: results,
        duration: duration
      });

    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempFilePath);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw error;
    }

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Något gick fel vid analysen',
      details: error.message
    });
  }
});

/**
 * Test endpoint for JobSearch API
 */
app.get('/api/test/jobs', async (req, res) => {
  try {
    const query = req.query.q || 'developer';
    const jobs = await searchJobs(query, 5);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║  LinkedIn Job Matcher Server                       ║
╠════════════════════════════════════════════════════╣
║  Server running: http://localhost:${PORT}           ║
║  Status: http://localhost:${PORT}/api/health        ║
╠════════════════════════════════════════════════════╣
║  Requirements:                                     ║
║  • Ollama running on http://localhost:11434        ║
║  • Python 3 with pypdf installed                   ║
║    (pip install pypdf --break-system-packages)     ║
╚════════════════════════════════════════════════════╝
  `);
  
  // Check Ollama status on startup
  checkOllamaStatus().then(status => {
    if (status.available) {
      console.log('✓ Ollama is running');
      if (status.models && status.models.length > 0) {
        console.log(`  Available models: ${status.models.map(m => m.name).join(', ')}`);
      }
    } else {
      console.warn('⚠ WARNING: Ollama is not running!');
      console.warn('  Start Ollama with: ollama serve');
      console.warn(`  Error: ${status.error}`);
    }
  });
});

module.exports = app;
