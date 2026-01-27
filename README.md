# LinkedIn Job Matcher

En lokal webbapplikation som analyserar din LinkedIn-profil mot jobbannonser från Arbetsförmedlingens API med hjälp av Google Gemini AI.

## 🎯 Funktioner

- **PDF-analys**: Ladda upp din LinkedIn-profil som PDF
- **Intelligent matchning**: AI analyserar semantiskt hur väl din profil matchar varje jobb
- **Tydliga insikter**: Se vad som matchar, vad som saknas och en övergripande score (0-100)
- **Realtidsdata**: Hämtar aktuella jobbannonser från Arbetsförmedlingens API

## 🛠️ Teknikstack

**Backend:**
- Node.js + Express
- pdf-parse (PDF-textextraktion)
- Google Generative AI (Gemini)
- dotenv (miljövariabler)

**Frontend:**
- Vanilla HTML, CSS, JavaScript
- Responsiv design
- Ren och modern UI

## 📋 Förutsättningar

- Node.js (v18 eller senare)
- VS Code (rekommenderas)
- Google Gemini API-nyckel (gratis)

## 🚀 Installation

### 1. Klona eller ladda ner projektet

```bash
cd linkedin-job-matcher
```

### 2. Installera dependencies

```bash
npm install
```

### 3. Konfigurera Gemini API

1. Gå till [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Logga in med ditt Google-konto
3. Skapa en API-nyckel (det är gratis)
4. Öppna `.env`-filen i projektet
5. Ersätt `din_gemini_api_nyckel_här` med din faktiska API-nyckel:

```env
GEMINI_API_KEY=AIzaSy...din-nyckel-här
```

### 4. Förbered din LinkedIn-profil

1. Gå till [linkedin.com](https://www.linkedin.com)
2. Klicka på din profilbild → "Visa profil"
3. Klicka på "Mer" → "Spara som PDF"
4. Spara PDF-filen på din dator

## ▶️ Kör applikationen

### Starta servern

```bash
npm start
```

**Eller med auto-reload (rekommenderas för utveckling):**

```bash
npm run dev
```

Servern startar på `http://localhost:3000`

### Öppna i webbläsare

1. Öppna `http://localhost:3000` i din webbläsare
2. Ladda upp din LinkedIn-profil (PDF)
3. Skriv in rollen du söker (t.ex. "Frontend Developer")
4. Klicka på "Analysera matchningar"
5. Vänta medan AI:n analyserar (ca 30-60 sekunder)
6. Se dina resultat!

## 📁 Projektstruktur

```
linkedin-job-matcher/
├── server.js              # Express backend
├── package.json          
├── .env                   # API-nycklar (gitignored)
├── .gitignore            
├── public/
│   ├── index.html         # Frontend UI
│   ├── style.css          # Styling
│   └── app.js             # Client-side logic
└── README.md             
```

## 🔧 Så här fungerar det

### Backend-flöde

1. **PDF-upload**: Användaren laddar upp PDF → Express tar emot via Multer (i minnet)
2. **Textextraktion**: `pdf-parse` extraherar all text från PDF:en
3. **Jobbsökning**: Express anropar Arbetsförmedlingens JobSearch API med användarens roll
4. **AI-analys**: För varje jobb skickas profilen + jobbet till Gemini för analys
5. **Strukturerat svar**: Gemini returnerar JSON med score, matches och missing
6. **Resultat**: Express sorterar efter score och skickar till frontend

### Gemini-prompting

AI:n får ett strukturerat prompt med:
- Hela kandidatens profiltext
- Jobbets titel, beskrivning och krav
- Tydliga instruktioner att returnera JSON
- Regler mot hallucination och falskt positiva

### Frontend

- Ren JavaScript (inga ramverk)
- FormData för filuppladdning
- Fetch API för backend-kommunikation
- Dynamisk rendering av resultat

## 🎨 Användargränssnitt

- **Score-badges**: Färgkodade (grön = 70+, gul = 50-69, röd = <50)
- **Matchningslista**: Vad i profilen som matchar jobbet
- **Gap-analys**: Vad som saknas för ett perfekt match
- **AI-sammanfattning**: Kort förklaring av bedömningen

## 🐛 Felsökning

### "GEMINI_API_KEY not set"
→ Kontrollera att `.env`-filen finns och innehåller din API-nyckel

### "Kunde inte läsa PDF-filen"
→ Se till att filen är en riktig PDF från LinkedIn (inte en skärmdump eller bild)

### "Inga jobb hittades"
→ Prova en mer generisk rollbeskrivning (t.ex. "Developer" istället för "Senior React TypeScript Developer")

### Långsam analys
→ Normalt med 15 jobb tar det ~30-60 sekunder (Gemini analyserar varje jobb individuellt)

### Server startar inte
→ Kör `npm install` igen och kontrollera att Node.js är installerat (`node --version`)

## 📊 API-begränsningar

**JobSearch API:**
- Ingen API-nyckel krävs
- Offentlig och gratis
- Returnerar max 100 resultat per sökning (vi använder 15)

**Gemini API:**
- Gratis tier: 15 requests/minut, 1500 requests/dag
- Vi använder `gemini-1.5-flash` (snabb och kostnadseffektiv)
- 500ms paus mellan requests för att undvika rate limits

## 🔒 Säkerhet

- **Ingen datalagring**: PDF:er processas i minnet och raderas direkt
- **Ingen databas**: Helt stateless
- **Lokalt endast**: Ingen data skickas till externa servrar utom Gemini och JobSearch API
- **Ingen autentisering**: Endast för lokal användning

## 💡 Tips

1. **Optimera din profil**: Se till att din LinkedIn-profil innehåller konkreta exempel och nyckelord
2. **Bred sökning först**: Sök på "Developer" innan "Senior Full Stack TypeScript Developer"
3. **Uppdatera regelbundet**: Kör analysen varje vecka för att se nya jobb
4. **Läs AI:ns resonemang**: Sammanfattningen ger ofta värdefulla insikter

## 🤝 Bidra

Detta är en lokal prototyp. Förbättringsidéer:
- [ ] Spara tidigare sökningar (localStorage)
- [ ] Jämför flera profiler
- [ ] Exportera resultat som PDF
- [ ] Filtrera på plats/företag
- [ ] Visualisera kompetenser (diagram)

## 📄 Licens

MIT License - Använd fritt för personligt bruk

## 🆘 Support

Vid problem:
1. Kolla console i VS Code Terminal för felmeddelanden
2. Kolla browser console (F12) för frontend-fel
3. Verifiera att `.env` är korrekt konfigurerad
4. Testa health endpoint: `http://localhost:3000/api/health`

---

**Skapad för lokalt bruk | Ingen deployment krävs | Körs 100% på din dator**
