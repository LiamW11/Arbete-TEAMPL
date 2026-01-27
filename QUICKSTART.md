# 🚀 Snabbstart

## Steg 1: Installera
```bash
cd linkedin-job-matcher
npm install
```

## Steg 2: API-nyckel
1. Gå till: https://makersuite.google.com/app/apikey
2. Skapa gratis API-nyckel
3. Öppna `.env` och lägg till nyckeln:
   ```
   GEMINI_API_KEY=din-nyckel-här
   ```

## Steg 3: Förbered PDF
1. LinkedIn.com → Din profil → Mer → Spara som PDF

## Steg 4: Starta
```bash
npm start
```

## Steg 5: Använd
1. Öppna: http://localhost:3000
2. Ladda upp PDF
3. Skriv roll (t.ex. "Frontend Developer")
4. Klicka "Analysera matchningar"
5. Vänta 30-60 sekunder
6. Se dina resultat! 🎉

---

## Arkitektur
```
Browser (HTML/CSS/JS)
    ↓ upload PDF + role
Express Server (Node.js)
    ↓ extract text
pdf-parse
    ↓ fetch jobs
JobSearch API (Arbetsförmedlingen)
    ↓ analyze match
Gemini AI (Google)
    ↓ results
Browser (visa matchningar)
```

## Dataflöde
1. PDF → Text extraktion (i minnet)
2. Text → JobSearch API → Hämta 15 jobb
3. För varje jobb: Profil + Jobb → Gemini → Analys
4. Resultat sorteras efter score (0-100)
5. Visas med färgkodade badges (🟢 70+, 🟡 50-69, 🔴 <50)

## Filstruktur
```
linkedin-job-matcher/
├── server.js          ← Backend (Express + Gemini + JobSearch)
├── package.json       
├── .env              ← Din API-nyckel här!
├── public/
│   ├── index.html    ← UI
│   ├── style.css     ← Design
│   └── app.js        ← Frontend-logik
└── README.md         
```

## Viktiga endpoints
- `GET /` → Serverar index.html
- `POST /api/analyze` → Huvudfunktion (upload + analys)
- `GET /api/health` → Kolla API-status

## Gemini-prompting
AI:n får:
```
KANDIDATENS PROFIL:
[hela PDF-texten]

JOBANNONS:
Titel: [titel]
Beskrivning: [text]

UPPGIFT:
Returnera JSON med:
- score (0-100)
- matches (vad som passar)
- missing (vad som saknas)
- summary (kort förklaring)
```

## Vanliga frågor

**Q: Varför tar det så lång tid?**  
A: 15 jobb × Gemini-analys = ~30-60 sekunder. Varje jobb analyseras individuellt.

**Q: Kostar Gemini pengar?**  
A: Gratis tier räcker gott (15 req/min, 1500 req/dag).

**Q: Sparas min PDF någonstans?**  
A: Nej! All processning sker i minnet och raderas direkt.

**Q: Kan jag deploya detta?**  
A: Ja, men du måste lägga till .env-hantering för produktionsmiljön.

**Q: Fungerar det med svenska jobb?**  
A: Ja! JobSearch API är från Arbetsförmedlingen och Gemini förstår svenska perfekt.

---

**🎯 Nu är du redo att börja!**
