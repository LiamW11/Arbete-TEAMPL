# 📦 Installationsguide - Uppdaterad extract_pdf_text.py

## ⚡ Snabbstart (3 steg)

### 1. Ersätt din gamla fil
Navigera till din server-mapp där `extract_pdf_text.py` finns (troligen i `server/` eller projektets root) och ersätt den gamla filen med den nya.

**På Windows:**
```cmd
cd C:\path\to\your\project\server
copy extract_pdf_text.py extract_pdf_text.py.backup
# Kopiera sedan den nya extract_pdf_text.py hit
```

**På Mac/Linux:**
```bash
cd /path/to/your/project/server
cp extract_pdf_text.py extract_pdf_text.py.backup
# Kopiera sedan den nya extract_pdf_text.py hit
```

### 2. Verifiera att Python och pypdf fungerar
```bash
python --version  # Ska visa Python 3.x
pip list | grep pypdf  # Ska visa pypdf
```

Om pypdf saknas:
```bash
pip install pypdf --break-system-packages
```

### 3. Testa att det fungerar
```bash
python extract_pdf_text.py din_test_profil.pdf
```

Om du ser text utan UnicodeEncodeError - grattis! Du är klar! 🎉

---

## 🧪 (Valfritt) Kör automatiska tester

Om du vill verifiera att allt fungerar korrekt:

```bash
python test_sanitize.py
```

Förväntat resultat:
```
✅ Alla tester godkända!
```

---

## 🚀 Starta din applikation

Nu kan du starta servern som vanligt:

```bash
# Om du använder npm
npm start

# Eller direkt
node server.js
```

Servern kommer automatiskt använda den uppdaterade `extract_pdf_text.py`.

---

## ✅ Vad händer nu?

När en användare laddar upp en PDF:
1. ✅ PDF läses av pypdf
2. ✅ Text extraheras
3. ✅ **NYT:** Text saneras (specialtecken tas bort)
4. ✅ Clean text skickas till Ollama för analys
5. ✅ Ingen krasch, även med emojis och pilar!

---

## 🐛 Felsökning

### Problem: "ModuleNotFoundError: No module named 'pypdf'"
**Lösning:**
```bash
pip install pypdf --break-system-packages
```

### Problem: "python: command not found"
**Lösning på Windows:**
- Prova `py` istället för `python`
- Eller installera Python från python.org

**Lösning på Mac:**
- Prova `python3` istället för `python`

### Problem: Servern hittar inte extract_pdf_text.py
**Lösning:**
- Kontrollera att filen ligger i samma mapp som `server.js` och `pdf-processor.js`
- Kolla sökvägen i `pdf-processor.js`, rad ~12:
  ```javascript
  const scriptPath = path.join(__dirname, 'extract_pdf_text.py');
  ```

### Problem: Fortfarande får UnicodeEncodeError
**Lösning:**
1. Dubbelkolla att du ersatt rätt fil
2. Starta om servern (Ctrl+C och kör `node server.js` igen)
3. Kontrollera att Python-filen har `sanitize_text()` funktionen:
   ```bash
   grep "def sanitize_text" extract_pdf_text.py
   ```
   Ska visa:
   ```
   def sanitize_text(text):
   ```

---

## 📝 Ingen ändring behövs i:

- ✅ `server.js` - fungerar som det är
- ✅ `pdf-processor.js` - fungerar som det är
- ✅ `ollama.js` - fungerar som det är
- ✅ `app.js` - fungerar som det är
- ✅ `index.html` - fungerar som det är

**Endast `extract_pdf_text.py` behöver uppdateras!**

---

## 📊 Före vs Efter

### ❌ Före (med problem):
```
[1/4] Extracting text from PDF...
Error extracting PDF text: Error: Command failed: python extract_pdf_text.py temp_*.pdf
UnicodeEncodeError: 'charmap' codec can't encode character '\u2794' in position 2860
```

### ✅ Efter (fungerar):
```
[1/4] Extracting text from PDF...
✓ Extracted 4523 characters

[2/4] Searching for jobs...
✓ Found 15 jobs

[3/4] Analyzing matches with Ollama...
  Analyzing job 1/15: Frontend Developer...
  Analyzing job 2/15: Senior React Developer...
...
✓ Analysis complete in 12.3s
```

---

## 💡 Tips

- Backup din gamla `extract_pdf_text.py` innan du ersätter den
- Testa med en PDF som tidigare krashade systemet
- Kolla server-loggarna för att se att allt fungerar
- Om något går fel, kan du alltid återställa från backup

---

## 🎯 Support

Om du stöter på problem:
1. Kolla felsökningssektionen ovan
2. Verifiera att alla dependencies är installerade
3. Kontrollera att rätt Python-version används (Python 3.x)
4. Se till att servern är omstartad efter ändringen

**Lycka till!** 🚀