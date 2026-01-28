# 🚀 Snabbstartsguide - VS Code

## Steg-för-steg setup i 5 minuter

### 1. Öppna projektet i VS Code

### 2. Installera Python-beroenden
Öppna en terminal i VS Code (`Ctrl+`` eller `Cmd+``) och kör:

```bash
pip install pypdf --break-system-packages
```

Testa att det fungerar:
```bash
python3 server/extract_pdf_text.py --version
```

### 3. Installera Node.js-beroenden
I samma terminal:

```bash
npm install
```

### 4. Starta Ollama
Öppna en **ny terminal** (`Terminal → New Terminal`) och kör:

```bash
ollama serve
```

Låt denna terminal vara öppen. I den **första terminalen**, ladda ner en modell:

```bash
ollama pull llama3.2
```

### 5. Starta applikationen
I den första terminalen:

```bash
npm start
```

### 6. Öppna i webbläsaren
Gå till: **http://localhost:3000**

## ✅ Checklista

- [ ] Python 3 installerat
- [ ] pypdf installerat
- [ ] Node.js installerat
- [ ] npm dependencies installerade
- [ ] Ollama installerat och igång
- [ ] AI-modell nedladdad
- [ ] Server startad på port 3000

## 🎯 Testanvändning

1. Exportera din LinkedIn-profil:
   - Gå till LinkedIn → Din profil
   - Klicka på "Mer" → "Spara som PDF"

2. I appen:
   - Välj PDF-filen
   - Skriv "Frontend Developer" eller liknande
   - Klicka "Analysera matchningar"

3. Vänta ~30-60 sekunder för analys av 15 jobb

## 🔧 VS Code Tips

### Rekommenderade extensions
- **ES7+ React/Redux/React-Native snippets** (för JavaScript)
- **Python** (Microsoft)
- **REST Client** (för API-testning)

### Öppna flera terminaler
1. `Ctrl+Shift+`` (eller `Cmd+Shift+``) för ny terminal
2. Terminal 1: Node.js server (`npm start`)
3. Terminal 2: Ollama (`ollama serve`)
4. Terminal 3: Fri för testning/debugging

### Debugging

**Backend:**
1. Lägg till breakpoints i `server/server.js`
2. Tryck `F5` eller gå till Run → Start Debugging
3. Välj "Node.js" som environment

**Frontend:**
1. Öppna DevTools i webbläsaren (`F12`)
2. Gå till Console för loggar
3. Gå till Network för att se API-anrop

### Live reload
Servern startar om automatiskt om du använder nodemon:

```bash
npm install -g nodemon
nodemon server/server.js
```

## 📝 Vanliga kommandon

```bash
# Starta server
npm start

# Testa API
curl http://localhost:3000/api/health

# Testa jobbsökning
curl "http://localhost:3000/api/test/jobs?q=developer"

# Lista Ollama-modeller
ollama list

# Testa Ollama
curl http://localhost:11434/api/tags

# Se server-loggar (om servern körs)
# Tryck Ctrl+C för att stoppa servern
```

## 🐛 Snabb felsökning

### Portkollision (port 3000 upptagen)
```bash
# Ändra port i server.js eller använd miljövariabel
PORT=3001 npm start
```

### Ollama svarar inte
```bash
# Starta om Ollama
pkill ollama
ollama serve
```

### PDF-extraktion fungerar inte
```bash
# Testa manuellt
python3 server/extract_pdf_text.py /path/to/test.pdf

# Om pypdf saknas
pip install pypdf --break-system-packages
```

### Node modules saknas
```bash
# Rensa och installera om
rm -rf node_modules
npm install
```

## 📊 Prestanda

Förväntade tider:
- PDF-extraktion: ~1-2 sekunder
- Jobbannonshämtning: ~2-3 sekunder
- AI-analys (15 jobb): ~30-60 sekunder
- **Total tid**: ~40-70 sekunder per analys

Tips för snabbare analys:
- Använd mindre modell: `llama3.2` (snabb) istället för `llama2:13b` (långsam men bättre)
- Minska antal jobb i `server/jobsearch.js` (ändra `limit: 15` till `limit: 10`)

## 🎨 Anpassa appen

### Ändra styling
Redigera: `public/css/style.css`
- CSS-variabler i `:root` för färger
- LinkedIn-inspirerat tema

### Ändra AI-beteende
Redigera: `server/ollama.js`
- Funktion: `createMatchingPrompt()`
- Justera temperature i `analyzeJobMatch()` (0.1 = konsekvent, 0.8 = kreativ)

### Ändra antal jobb
Redigera: `server/jobsearch.js`
- Rad: `limit = 15` → ändra till önskat antal

## 🎓 Nästa steg

När du är bekväm med grunderna:
1. Läs igenom backend-koden i `server/`
2. Experimentera med olika AI-prompts
3. Testa olika Ollama-modeller
4. Anpassa frontend-gränssnittet

Lycka till! 🚀
