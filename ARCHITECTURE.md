# MarketSync - Komplett Dokumentation

## 📊 ARKITEKTUR

### Systemöversikt
```
┌──────────────────────────────────────────────────────────┐
│                    WEBBLÄSARE                            │
│  ┌────────────────────────────────────────────────┐      │
│  │   Frontend (Vanilla JavaScript)                │      │
│  │   - Formulär för uppladdning                   │      │
│  │   - Resultatvisning                            │      │
│  │   - Filtrering och sortering                   │      │
│  └────────────────┬───────────────────────────────┘      │
└───────────────────┼──────────────────────────────────────┘
                    │ HTTP/FormData
                    ▼
┌──────────────────────────────────────────────────────────┐
│              EXPRESS SERVER (Node.js)                    │
│  ┌─────────────────────────────────────────────────┐     │
│  │  server.js - Huvudserver                        │     │
│  │  - Tar emot PDF + jobbroll                      │     │
│  │  - Koordinerar hela flödet                      │     │
│  └──────┬──────────────────┬───────────────────────┘     │
│         │                  │                             │
│         ▼                  ▼                             │
│  ┌─────────────┐    ┌──────────────┐                     │
│  │ PDF-        │    │  Ollama      │                     │
│  │ Processor   │    │  Client      │                     │
│  └──────┬──────┘    └──────┬───────┘                     │
└─────────┼──────────────────┼─────────────────────────────┘
          │                  │
          ▼                  │
┌─────────────────┐          │
│ Python Script   │          │
│ (pypdf)         │          │
│ - Läser PDF     │          │
│ - Extraherar    │          │
│   text          │          │
└─────────────────┘          │
                             ▼
                    ┌──────────────────┐
                    │  OLLAMA SERVER   │
                    │  (Lokal AI/LLM)  │
                    │  - llama3.2      │
                    │  - llama2        │
                    └──────────────────┘
          
┌──────────────────────────────────────┐
│  ARBETSFÖRMEDLINGEN JOBSEARCH API    │
│  https://jobsearch.api.jobtechdev.se │
│  - Hämtar jobbannonser               │
│  - Ingen autentisering krävs         │
└──────────────────────────────────────┘
```

### Dataflöde

1. **Uppladdning (Frontend → Backend)**
   ```
   User → [Väljer PDF] → [Anger roll] → [Klickar Analysera]
   ↓
   FormData: { resume: File, jobRole: string }
   ↓
   POST /api/analyze
   ```

2. **PDF-textextraktion (Backend)**
   ```
   server.js → pdf-processor.js → extract_pdf_text.py (Python)
   ↓
   PDF → pypdf.PdfReader → Extraherad text (string)
   ↓
   Returnerar till Node.js
   ```

3. **Jobbannonshämtning (Backend)**
   ```
   server.js → jobsearch.js → JobSearch API
   ↓
   GET https://jobsearch.api.jobtechdev.se/search?q={role}&limit=15
   ↓
   Array av jobbobjekt med: id, headline, description, requirements, etc.
   ```

4. **AI-matchning (Backend → Ollama)**
   ```
   För varje jobb:
     server.js → ollama.js → createMatchingPrompt()
     ↓
     Prompt = [Profil + Jobbannons + Instruktioner]
     ↓
     POST http://localhost:11434/api/generate
     ↓
     Ollama analyserar → Returnerar strukturerad text
     ↓
     parseAnalysisResponse() → Strukturerad data:
       {
         score: 0-100,
         matches: [...],
         missing: [...],
         reasoning: "..."
       }
   ```

5. **Resultatpresentation (Backend → Frontend)**
   ```
   server.js → Sorterar resultat efter score
   ↓
   JSON-response till frontend
   ↓
   app.js renderar resultat → HTML cards
   ```

---

## 🗂️ FILSTRUKTUR OCH ANSVAR

```
linkedin-job-matcher/
│
├── package.json                    # Node.js dependencies och scripts
├── README.md                       # Huvuddokumentation
├── QUICKSTART.md                   # Snabbstartsguide för VS Code
├── .gitignore                      # Git ignore-regler
│
├── server/                         # BACKEND (Node.js)
│   │
│   ├── server.js                   # ⭐ HUVUDSERVER
│   │   • Express-server setup
│   │   • Endpoint: POST /api/analyze (huvudlogik)
│   │   • Endpoint: GET /api/health (statuscheck)
│   │   • Endpoint: GET /api/test/jobs (testning)
│   │   • Koordinerar hela analysflödet
│   │   • Använder: multer för PDF-uppladdning
│   │
│   ├── jobsearch.js                # JobSearch API-klient
│   │   • searchJobs(query, limit)
│   │   • Anropar Arbetsförmedlingens API
│   │   • Parsear och formaterar jobbdata
│   │   • Returnerar: Array av jobbobjekt
│   │
│   ├── ollama.js                   # ⭐ OLLAMA AI-KLIENT
│   │   • analyzeJobMatch(profile, job)
│   │   • createMatchingPrompt() - Bygger prompt
│   │   • parseAnalysisResponse() - Parsear AI-svar
│   │   • checkOllamaStatus() - Verifierar Ollama
│   │   • Kommunicerar med lokal Ollama-server
│   │
│   ├── pdf-processor.js            # PDF-hantering
│   │   • extractTextFromPDF(path)
│   │   • isValidPDF(filename, mimetype)
│   │   • Anropar Python-script för extraktion
│   │
│   └── extract_pdf_text.py         # ⭐ PYTHON PDF-EXTRAKTION
│       • Använder: pypdf library
│       • Läser PDF-fil
│       • Extraherar all text från alla sidor
│       • Returnerar: Plain text till stdout
│
└── public/                         # FRONTEND (Vanilla JS)
    │
    ├── index.html                  # Huvudsida (HTML)
    │   • Uppladdningsformulär
    │   • Laddningsindikator
    │   • Resultatsektion
    │   • Filter-knappar
    │
    ├── css/
    │   └── style.css               # ⭐ STILAR
    │       • LinkedIn-inspirerat tema
    │       • Responsiv design
    │       • CSS-variabler för färger
    │       • Job cards, score badges, etc.
    │
    └── js/
        └── app.js                  # ⭐ FRONTEND-LOGIK
            • State management
            • Event handlers
            • API-kommunikation (fetch)
            • Resultatrendering
            • Filtreringslogik
```

---

## 🔧 MODULER OCH FUNKTIONER

### Backend (Node.js)

#### **server.js** - Huvudserver
```javascript
// Viktiga funktioner:

POST /api/analyze
  ├─ Validerar uppladdad PDF och jobbroll
  ├─ Extraherar text från PDF (via pdf-processor)
  ├─ Hämtar jobbannonser (via jobsearch)
  ├─ Analyserar varje jobb (via ollama)
  └─ Returnerar sorterade resultat

GET /api/health
  └─ Kollar Ollama-status

GET /api/test/jobs?q=<query>
  └─ Testar JobSearch API
```

#### **ollama.js** - AI-integration
```javascript
analyzeJobMatch(profileText, job)
  ├─ Bygger detaljerad prompt
  ├─ Skickar till Ollama API
  ├─ Parsear strukturerat svar
  └─ Returnerar: { score, matches, missing, reasoning }

createMatchingPrompt(profile, job)
  └─ Skapar instruktioner för AI
      • Inkluderar profil (max 4000 tecken)
      • Inkluderar jobbannons (max 2000 tecken)
      • Ber om specifikt format

parseAnalysisResponse(text)
  └─ Extraherar:
      • MATCHNINGSPOÄNG: [nummer]
      • MATCHNINGAR: [lista]
      • SAKNAS: [lista]
      • MOTIVERING: [text]
```

#### **jobsearch.js** - Jobbhämtning
```javascript
searchJobs(query, limit)
  └─ GET request till JobSearch API
  └─ Returnerar formaterade jobbobjekt:
      {
        id, headline, employer, location,
        description, requirements, url
      }
```

#### **pdf-processor.js** - PDF-hantering
```javascript
extractTextFromPDF(pdfPath)
  ├─ Anropar Python-script med execFile
  ├─ Väntar på stdout (extraherad text)
  └─ Returnerar text eller error
```

#### **extract_pdf_text.py** - Python-script
```python
from pypdf import PdfReader

def extract_text_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text
```

### Frontend (JavaScript)

#### **app.js** - Frontend-logik
```javascript
// State
state = {
  currentResults: [],
  currentFilter: 'all'
}

// Huvudfunktioner:

handleFormSubmit(event)
  ├─ Skapar FormData
  ├─ POST /api/analyze
  ├─ Visar loading-state
  └─ Renderar resultat

renderResults()
  ├─ Filtrerar resultat baserat på state.currentFilter
  ├─ Skapar job-cards för varje jobb
  └─ Infogar i DOM

createJobCard(job)
  └─ Bygger HTML för ett jobb:
      • Header (titel, företag, plats, score)
      • Matchningar (grön lista)
      • Saknas (röd lista)
      • Motivering (italic box)
      • Länk till annons

filterResults(results, filter)
  └─ 'high': score >= 70
      'medium': 40 <= score < 70
      'low': score < 40
      'all': alla
```

---

## 🚀 KÖRNINGSINSTRUKTIONER

### Förberedelser

1. **Installera Python-beroenden**
   ```bash
   pip install pypdf --break-system-packages
   ```

2. **Installera Node.js-beroenden**
   ```bash
   cd linkedin-job-matcher
   npm install
   ```

3. **Starta Ollama**
   ```bash
   # Terminal 1
   ollama serve
   
   # Terminal 2
   ollama pull llama3.2
   ```

### Starta applikationen

```bash
# I projektmappen
npm start
```

Servern startar på: `http://localhost:3000`

### Användning

1. Öppna webbläsaren: `http://localhost:3000`
2. Ladda upp LinkedIn-PDF
3. Skriv jobbroll (t.ex. "Frontend Developer")
4. Klicka "Analysera matchningar"
5. Vänta ~40-70 sekunder
6. Se resultat med matchningspoäng

---

## 🎯 OLLAMA INTEGRATION - DETALJERAD FÖRKLARING

### Hur Ollama används

**Ollama** är en lokal AI-server som kör stora språkmodeller (LLM) lokalt på din dator. Detta betyder:
- ✅ Ingen data skickas till externa servrar
- ✅ Gratis att använda
- ✅ Snabb och privat
- ❌ Kräver bra hårdvara (minst 8GB RAM)

### Tillgängliga modeller

```bash
# Lista installerade modeller
ollama list

# Populära modeller för denna app:
ollama pull llama3.2      # Snabb, liten (3GB)
ollama pull llama2        # Medium (7GB)
ollama pull llama2:13b    # Bäst kvalitet (13GB, långsam)
```

### API-anrop till Ollama

**Endpoint**: `POST http://localhost:11434/api/generate`

**Request-format**:
```javascript
{
  model: "llama3.2",
  prompt: "Din prompt här...",
  stream: false,  // Vänta på komplett svar
  options: {
    temperature: 0.3,  // Låg = konsekvent, Hög = kreativ
    top_p: 0.9
  }
}
```

**Response-format**:
```javascript
{
  model: "llama3.2",
  response: "AI:ns textgenererade svar...",
  done: true
}
```

### Prompt-design

**Vår prompt i `createMatchingPrompt()`**:

```
Du är en expert på att matcha kandidatprofiler mot jobbannonser.

KANDIDATPROFIL:
[Hela LinkedIn-profilen, max 4000 tecken]

JOBBANNONS:
Titel: Frontend Developer
Arbetsgivare: Tech Company AB
Beskrivning: [Jobbeskrivning...]
Krav: React, TypeScript, 3+ års erfarenhet

UPPGIFT:
Analysera hur väl kandidaten matchar jobbet.
Svara i följande format:

MATCHNINGSPOÄNG: [0-100]

MATCHNINGAR:
- [Konkreta exempel från profilen]

SAKNAS:
- [Vad som krävs men saknas]

MOTIVERING:
[2-3 meningar om varför]
```

**Varför detta format fungerar**:
- ✅ Tydlig struktur gör parsing enkel
- ✅ AI får exakt instruktion om vad som förväntas
- ✅ Tvingar AI att basera sig på faktiskt innehåll
- ✅ Strukturen gör det lätt att extrahera data

### Response-parsing

**I `parseAnalysisResponse()`**:

1. **Extrahera score**: Regex för `MATCHNINGSPOÄNG: (\d+)`
2. **Extrahera matchningar**: Hitta sektion mellan "MATCHNINGAR" och "SAKNAS", dela på bullet points
3. **Extrahera saknas**: Hitta sektion mellan "SAKNAS" och "MOTIVERING"
4. **Extrahera motivering**: Regex för text efter "MOTIVERING:"

### Temperature och kreativitet

```javascript
temperature: 0.3  // Rekommenderat för denna app
```

**Temperature-skala**:
- `0.0-0.3`: Deterministisk, konsekvent (bra för matchning)
- `0.4-0.7`: Balanserad
- `0.8-1.0`: Kreativ, varierad (dåligt för matchning)

**Varför låg temperature?**:
- Vi vill ha konsekventa bedömningar
- Samma profil + jobb bör ge samma score
- Mindre risk för "hallucinations"

---

## 🔍 SEMANTISK MATCHNING

### Vad är semantisk matchning?

**Keyword-matching (DÅLIGT)**:
```
Profil: "Jag har jobbat med JavaScript och byggde responsiva webbplatser"
Jobbkrav: "React experience required"
→ INGEN MATCH (React finns inte i profilen)
```

**Semantisk matchning (BRA)**:
```
Profil: "Jag har jobbat med JavaScript och byggde responsiva webbplatser"
Jobbkrav: "React experience required"
→ PARTIELL MATCH (JavaScript-erfarenhet är relaterat till React)
→ AI förstår kontext och kan resonera
```

### Hur AI resonerar

**Exempel på AI-analys**:

```
Profil: "5 år som fullstack-utvecklare. Vue.js, Node.js, MongoDB"
Jobb: "React Developer, REST APIs, PostgreSQL"

AI:s resonemang:
✓ MATCH: JavaScript-ramverk (Vue → React är liknande)
✓ MATCH: Backend-erfarenhet (Node.js → REST APIs)
± DELVIS: Databaser (MongoDB → PostgreSQL, båda är databaser)
✗ SAKNAS: Specifik React-erfarenhet
✗ SAKNAS: PostgreSQL-erfarenhet

Score: 65/100 (Stark kandidat med överlappande kompetenser)
```

### Fördelar med Ollama för denna app

1. **Förståelse av kontext**: AI ser helheten, inte bara keywords
2. **Flexibilitet**: Kan matcha liknande teknologier (React/Vue)
3. **Resonemang**: Förklarar *varför* något matchar eller inte
4. **Nyanserad scoring**: Inte bara 0 eller 100, utan graderad 0-100
5. **Lokal körning**: Ingen data läcker, snabbt, gratis

---

## 📝 EXEMPEL PÅ KOMPLETT ANALYS

### Input

**PDF (LinkedIn-profil)**:
```
John Doe
Senior Frontend Developer

Erfarenhet:
• Tech Startup AB (2020-2024): Byggde React-applikationer
• Digital Agency (2018-2020): Vue.js och WordPress

Kompetenser:
JavaScript, React, Vue, HTML, CSS, Git, Figma
```

**Jobbroll**: "Frontend Developer"

### Jobbannons (från JobSearch API)

```
Titel: Senior Frontend Developer
Företag: Innovation Labs
Plats: Stockholm
Beskrivning: Vi söker en erfaren frontend-utvecklare med 
stark erfarenhet av React och TypeScript.
Krav: React, TypeScript, Testing, Agile
```

### AI-analys (från Ollama)

**Ollama returnerar**:
```
MATCHNINGSPOÄNG: 75

MATCHNINGAR:
- Stark React-erfarenhet (4 år på Tech Startup AB)
- Frontend-fokus med HTML, CSS, JavaScript
- Erfarenhet från moderna tech-startups
- Kännedom om designverktyg (Figma)

SAKNAS:
- TypeScript-erfarenhet nämns inte explicit
- Testing/testramverk nämns inte
- Agile/Scrum nämns inte

MOTIVERING:
Kandidaten har solid frontend-erfarenhet med React som är 
huvudkravet. Saknar dock TypeScript och testing vilket är 
viktiga kompetenser för rollen. Med kort uppdatering inom 
dessa områden skulle kandidaten vara mycket väl lämpad.
```

### Frontend-rendering

**Resultatet visas som**:

```
┌─────────────────────────────────────────────┐
│ Senior Frontend Developer            [75]  │
│ Innovation Labs                             │
│ Stockholm                                   │
│                                             │
│ ✓ MATCHNINGAR                               │
│ • Stark React-erfarenhet (4 år)            │
│ • Frontend-fokus med HTML, CSS, JS         │
│ • Erfarenhet från moderna startups         │
│                                             │
│ − SAKNAS                                    │
│ • TypeScript-erfarenhet                    │
│ • Testing/testramverk                      │
│ • Agile/Scrum                              │
│                                             │
│ 💬 MOTIVERING                               │
│ "Kandidaten har solid frontend-erfarenhet  │
│  med React. Saknar dock TypeScript och     │
│  testing vilket är viktiga kompetenser."   │
│                                             │
│ [Visa annons →]                            │
└─────────────────────────────────────────────┘
```

---

## ⚙️ ANPASSNING OCH KONFIGURATION

### Ändra AI-modell

**I `server/ollama.js`**:
```javascript
const DEFAULT_MODEL = 'llama3.2';  // Byt till 'llama2' eller 'llama2:13b'
```

### Ändra antal jobb

**I `server/jobsearch.js`**:
```javascript
async function searchJobs(query, limit = 15) {  // Ändra 15 till önskat antal
```

### Ändra temperature

**I `server/ollama.js`**:
```javascript
options: {
  temperature: 0.3,  // 0.1 = mer konsekvent, 0.7 = mer kreativ
```

### Anpassa prompts

**I `server/ollama.js`, funktion `createMatchingPrompt()`**:
```javascript
return `Du är en expert...  // Ändra instruktioner här
```

**Tips för bättre prompts**:
- Var specifik med vad du vill ha
- Ge exempel på önskat format
- Använd CAPS för viktiga sektioner
- Be om strukturerat svar (lättare att parsea)

### Ändra färger (Frontend)

**I `public/css/style.css`**:
```css
:root {
  --primary-color: #0a66c2;  /* LinkedIn-blå */
  --success-color: #057642;  /* Grön för matchningar */
  --danger-color: #cc1016;   /* Röd för saknas */
}
```

---

## 🐛 FELSÖKNING OCH DEBUGGING

### Backend-logging

**Servern loggar detaljerat**:
```
=== Starting analysis ===
Role: Frontend Developer
PDF: johndoe_linkedin.pdf (234589 bytes)

[1/4] Extracting text from PDF...
✓ Extracted 3542 characters

[2/4] Searching for jobs...
✓ Found 15 jobs

[3/4] Analyzing matches with Ollama...
  Analyzing job 1/15: Senior Frontend Developer...
  Analyzing job 2/15: React Developer...
  ...

[4/4] Sorting results...
✓ Analysis complete in 47.3s
Top score: 82
```

### Frontend-debugging

**Öppna DevTools (F12)**:

**Console**: Se alla loggar från `app.js`
```javascript
console.log('Sending request:', formData);
console.log('Received results:', data);
```

**Network**: Se API-anrop
```
POST /api/analyze
Status: 200 OK
Response: {...}
```

### Vanliga fel och lösningar

**1. "Ollama is not running"**
```bash
# Lösning:
ollama serve
```

**2. "No text extracted from PDF"**
```bash
# Testa manuellt:
python3 server/extract_pdf_text.py /path/to/file.pdf

# Om inget syns, är PDF:en bildbaserad (OCR krävs)
```

**3. "Failed to fetch jobs"**
```bash
# Testa API direkt:
curl "https://jobsearch.api.jobtechdev.se/search?q=developer&limit=5"
```

**4. Analysen tar för lång tid**
```
# Lösningar:
1. Använd mindre modell: llama3.2 istället för llama2:13b
2. Minska antal jobb (ändra limit i jobsearch.js)
3. Öka temperature lite (snabbare men mindre noggrant)
```

---

## 📚 TEKNISK STACK - SAMMANFATTNING

| Komponent | Teknologi | Syfte |
|-----------|-----------|-------|
| Backend | Node.js + Express | HTTP-server, API-endpoints |
| PDF-processing | Python + pypdf | Textextraktion från PDF |
| Frontend | Vanilla JavaScript | UI och användarinteraktion |
| AI/LLM | Ollama (llama3.2) | Semantisk matchning |
| Jobbdata | JobSearch API | Hämta jobbannonser |
| Filuppladdning | Multer | Hantera PDF-uppladdningar |
| HTTP-klient | Axios | API-anrop till Ollama och JobSearch |
| Styling | CSS3 | Responsiv design, LinkedIn-tema |

---

## 🎓 LÄRRESURSER

### För nybörjare

1. **Node.js och Express**: https://expressjs.com
2. **Vanilla JavaScript**: https://javascript.info
3. **Ollama**: https://ollama.ai/docs
4. **JobSearch API**: https://jobtechdev.se/docs

### För vidare utveckling

1. **Lägg till databas**: Spara resultat i SQLite/PostgreSQL
2. **Autentisering**: Lägg till användarkonton
3. **Bättre PDF**: Använd pdfplumber för bättre extraktion
4. **Batch-analys**: Analysera flera profiler samtidigt
5. **CV-uppdateringsförslag**: Låt AI föreslå förbättringar av CV

---

**Lycka till med din MarketSync!** 🚀
