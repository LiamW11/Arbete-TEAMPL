PROMPT
Du är en senior fullstack-utvecklare med stark erfarenhet av:
* Node.js
* Vanilla HTML, CSS och JavaScript
* API-integrationer
* AI-drivna analyser
 Mål
Bygg en lokalt körbar webbapplikation som jämför en användares LinkedIn-profil (PDF) mot jobbannonser från Arbetsförmedlingens JobSearch API, och analyserar hur väl profilen matchar varje annons med hjälp av Gemini AI.
Viktigt:
* Applikationen ska köras lokalt i VS Code
* Ingen deployment- eller Netlify-konfiguration ska ingå
* Ingen serverless-logik
* Inga plattformsspecifika filer (`netlify.toml`, functions/, etc.)
 Användarflöde
1. Användaren:
   * laddar upp sin LinkedIn-profil som PDF
   * anger vilken roll den söker (t.ex. “Frontend Developer”)
2. Användaren klickar på “Analysera”
3. Systemet:
   * hämtar jobbannonser via JobSearch API
   * extraherar text från PDF (endast i minnet)
   * analyserar varje annons mot profilen via Gemini
4. UI:t visar per annons:
   * matchningsgrad (0–100)
   * vad som matchar
   * vad som saknas
   * kort och begriplig förklaring
Tekniska krav
Server (Backend)
* Node.js
* Vanlig HTTP-server (t.ex. Express)
* Körs lokalt via `node` eller `npm run dev`
* Hanterar:
   * PDF-upload (i minnet)
   * JobSearch API-anrop
   * Gemini API-anrop
* Ingen databas
* Ingen autentisering
* Stateless per request
Klient (Frontend)
* Vanilla HTML, CSS och JavaScript
* Serveras från backend (t.ex. via `public/`-mapp)
* Enkel, snygg och tydlig layout
* Fokus på funktion och läsbarhet
 Externa API:er
JobSearch API
* Base URL: `https://jobsearch.api.jobtechdev.se/search`
* Ingen API-nyckel
* Fritextsökning baserat på roll
* Hämta 10–20 annonser
Gemini AI
* Används för semantisk analys
* Ska:
   * identifiera krav i jobbannonser
   * jämföra mot hela LinkedIn-profilen
   * visa match / delvis match / saknas
* Returnera:
   * matchningsscore (0–100)
   * tydlig motivering baserad på text
Viktiga riktlinjer för AI-analysen
* Ingen keyword-matching
* Ingen hallucination
* Resonemang ska bygga på faktiskt innehåll
* Resultatet ska vara användbart för en människa
 Leveranskrav
När du svarar ska du:
1. Förklara arkitekturen
2. Visa mapp- och filstruktur
3. Implementera backend
4. Implementera frontend
5. Visa hur Gemini anropas
6. Visa hur appen körs lokalt i VS Code
 Gör INTE:
* Netlify-konfiguration
* Serverless-kod
* Deployment-instruktioner
Bygg detta som en fungerande lokal prototyp.