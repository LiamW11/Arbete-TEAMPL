# LinkedIn Job Matcher

En lokal webbapplikation som matchar din LinkedIn-profil mot jobbannonser från Arbetsförmedlingens JobSearch API med hjälp av Ollama AI för semantisk analys.

## 📋 Översikt

### Funktioner
- Ladda upp LinkedIn-profil som PDF
- Sök efter relevanta jobb från Arbetsförmedlingen
- AI-driven semantisk matchning (inte bara keyword-matching)
- Visuell presentation av matchningsresultat (0-100 poäng)
- Detaljerad analys av vad som matchar och vad som saknas

### Teknisk stack
- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **PDF-processing**: Python (pypdf)
- **AI**: Ollama (lokal LLM)
- **Jobbdata**: Arbetsförmedlingens JobSearch API

## 🚀 Installation och uppsättning

### Förutsättningar

1. **Node.js** (v14 eller senare)
   ```bash
   node --version  # Kontrollera version
   ```

2. **Python 3** med pypdf
   ```bash
   python3 --version  # Kontrollera version
   pip install pypdf --break-system-packages
   ```

3. **Ollama** (lokal AI-server)
   - Ladda ner från: https://ollama.ai
   - Installera och starta Ollama
   ```bash
   # macOS/Linux
   ollama serve
   
   # I en annan terminal, ladda ner en modell
   ollama pull llama3.2
   # eller
   ollama pull llama2
   ```

### Steg 1: Installera dependencies

```bash
cd linkedin-job-matcher
npm install
```

### Steg 2: Starta Ollama (om inte redan igång)

```bash
# I en separat terminal
ollama serve
```

Verifiera att Ollama körs:
```bash
curl http://localhost:11434/api/tags
```

### Steg 3: Starta applikationen

```bash
npm start
# eller
npm run dev
```

Servern startar på: **http://localhost:3000**

## 📖 Användning

1. **Öppna webbläsaren**: Gå till `http://localhost:3000`

2. **Ladda upp PDF**: Välj din LinkedIn-profil som PDF
   - Exportera från LinkedIn: Profil → Mer → Spara som PDF
   - Max filstorlek: 10MB

3. **Ange roll**: Skriv in den roll du söker (t.ex. "Frontend Developer")

4. **Analysera**: Klicka på "Analysera matchningar"

5. **Se resultat**: 
   - Varje jobb får en matchningspoäng (0-100)
   - Se vad som matchar din profil
   - Se vad som saknas
   - Läs AI:ns motivering

## 🏗️ Projektstruktur

```
linkedin-job-matcher/
├── package.json              # Node.js dependencies
├── README.md                 # Denna fil
│
├── server/                   # Backend (Node.js)
│   ├── server.js            # Express-server
│   ├── jobsearch.js         # JobSearch API-klient
│   ├── ollama.js            # Ollama AI-klient
│   ├── pdf-processor.js     # PDF-hantering
│   └── extract_pdf_text.py  # Python script för textextraktion
│
└── public/                   # Frontend (Vanilla JS)
    ├── index.html           # Huvudsida
    ├── css/
    │   └── style.css        # Stilar
    └── js/
        └── app.js           # Frontend-logik
```

## 🔧 Konfiguration

### Miljövariabler (valfritt)

Skapa en `.env` fil i projektets rot:

```env
PORT=3000
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Byta AI-modell

I `server/ollama.js`, ändra:
```javascript
const DEFAULT_MODEL = 'llama3.2';  // Byt till annan modell
```

Tillgängliga modeller:
```bash
ollama list
```

## 🧪 Testning

### Testa JobSearch API
```bash
curl "http://localhost:3000/api/test/jobs?q=developer"
```

### Testa system-status
```bash
curl http://localhost:3000/api/health
```

### Testa PDF-extraktion
```bash
python3 server/extract_pdf_text.py /path/to/your/profile.pdf
```

## 🎯 API-endpoints

### `GET /api/health`
Kontrollera systemstatus och Ollama-tillgänglighet

### `POST /api/analyze`
Huvudendpoint för analys
- **Body**: FormData med `resume` (PDF) och `jobRole` (string)
- **Response**: JSON med matchningsresultat

### `GET /api/test/jobs?q=<query>`
Testa JobSearch API direkt

## 🔍 Hur AI-matchningen fungerar

### 1. PDF-extraktion
- Python läser PDF med pypdf
- Extraherar all text från alla sidor
- Returnerar råtext till Node.js

### 2. Jobbannonshämtning
- Söker på Arbetsförmedlingens API
- Hämtar 15 relevanta annonser
- Extraherar titel, beskrivning, krav, etc.

### 3. AI-analys (Ollama)
För varje jobb:
- Skickar både profil och jobbannons till Ollama
- AI analyserar semantiskt (inte bara keywords)
- AI ger strukturerad feedback:
  - Matchningspoäng (0-100)
  - Vad som matchar
  - Vad som saknas
  - Motivering

### 4. Presentation
- Sorterar jobb efter matchningspoäng
- Visuell presentation med färgkodning
- Filtreringsmöjligheter (hög/medium/låg match)

## 💡 Tips

### Optimera profilen
- Se till att din LinkedIn-PDF innehåller:
  - Kompe tenslista
  - Tidigare roller och ansvarsområden
  - Utbildning
  - Projekt

### Bättre sökningar
- Var specifik med rollen: "Frontend Developer React" är bättre än "Developer"
- Prova olika formuleringar om du får få träffar

### AI-prestanda
- Första analysen kan ta längre tid (modellen laddas)
- Efterföljande analyser går snabbare
- Större modeller (t.ex. llama2:13b) ger bättre resultat men är långsammare

## ⚠️ Felsökning

### Problem: "Ollama is not running"
**Lösning**: Starta Ollama i en separat terminal
```bash
ollama serve
```

### Problem: "No text extracted from PDF"
**Lösning**: 
- Kontrollera att PDF:en innehåller text (inte bara bilder)
- Testa extrahering manuellt:
```bash
python3 server/extract_pdf_text.py /path/to/file.pdf
```

### Problem: "Failed to fetch jobs"
**Lösning**: 
- Kontrollera internetanslutning
- Testa API:et direkt:
```bash
curl "https://jobsearch.api.jobtechdev.se/search?q=developer&limit=5"
```

### Problem: Analysen tar för lång tid
**Lösning**:
- Använd en mindre modell: `ollama pull llama3.2` (snabbare än llama2)
- Minska antal jobb i `server/jobsearch.js` (ändra `limit` parameter)

### Problem: Python-fel
**Lösning**:
```bash
# Installera pypdf
pip install pypdf --break-system-packages

# Alternativt, använd virtual environment
python3 -m venv venv
source venv/bin/activate  # På Windows: venv\Scripts\activate
pip install pypdf
```

## 🔒 Säkerhet och integritet

- **Lokal körning**: All data stannar på din dator
- **Ingen databas**: Ingen data sparas mellan sessioner
- **Ollama**: AI-modellen körs lokalt, inget skickas till externa servrar
- **Stateless**: Varje analys är oberoende

## 📝 Utveckling

### Köra i utvecklingsläge
```bash
npm run dev
```

### Loggar
Servern loggar detaljerad information till konsolen:
- PDF-extraktion status
- Antal hittade jobb
- AI-analysframsteg
- Eventuella fel

### Anpassa AI-prompts
Redigera `server/ollama.js`, funktionen `createMatchingPrompt()` för att ändra hur AI analyserar matchningar.

## 📚 Externa resurser

- **Ollama**: https://ollama.ai
- **JobSearch API**: https://jobtechdev.se
- **pypdf**: https://pypdf.readthedocs.io

## 🤝 Licens

MIT License - fri att använda och modifiera

## 📧 Support

Vid problem, kontrollera:
1. Ollama körs: `curl http://localhost:11434/api/tags`
2. Python och pypdf installerat: `python3 -c "import pypdf"`
3. Node.js dependencies: `npm install`
4. Serverlloggar för detaljerade felmeddelanden
