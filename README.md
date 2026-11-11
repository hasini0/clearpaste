# ClearPaste

**Press Ctrl+V on anything confusing and understand it in seconds.**

People get bills, eviction notices, benefit letters, medicine leaflets and scam texts written in language they can't easily read. ClearPaste turns any of these into plain words, in the reader's language. It reads the result aloud, lists what they have to do and by when, and warns them when the message is a scam.

Built for the CTRL-V Hackathon: *Barrier → Ctrl+V → Access.*

---

## Why it matters

- Official documents are often written at a college reading level, while public-health and plain-language guides recommend about grade 8 or lower for the general public.
- When someone misreads a letter, it costs them: a missed benefits interview ends food assistance, an ignored 3-day notice becomes an eviction, and a "processing fee" in gift cards empties a savings account.
- The people hit hardest are older adults, immigrants and refugees, people with dyslexia or cognitive disabilities, people with low vision, and anyone reading under stress.

## What it does

| | |
|---|---|
| ⌨️ **Ctrl+V anywhere** | Paste text *or a screenshot* anywhere on the page. You can also drop or upload a **photo, PDF, Word (.docx) or text file**, take a photo with your phone, or type. |
| 📷 **On-device reading** | Photos and screenshots are read with OCR **in the browser** (Tesseract.js), which handles dark-mode screenshots too. PDFs (pdf.js; scanned PDFs fall back to OCR) and Word files (mammoth) are also read on the device. Garbled text is rejected with a clear message instead of a bad explanation. |
| ✨ **In one sentence** | The single most important thing to know, before any detail. |
| ✅ **What you need to do** | A checklist of tasks with live countdowns ("in 19 days") and **one-tap calendar reminders** (.ics, which works with Apple, Google and Outlook). |
| ⚠️ **If you do nothing** | Spells out the consequence, e.g. a late fee, collections or losing benefits. |
| 🛡️ **Scam shield** | Two independent checks: the AI's judgement plus a rule-based detector of known manipulation patterns (gift cards, crypto, arrest threats, secrecy, shortened links). In a scam, the scammer's demands are **never** shown as to-dos; ClearPaste shows safety steps instead. |
| 📊 **Proof it's easier** | Flesch–Kincaid grade before and after, computed on the server rather than self-reported by the AI. |
| 🌍 **30 languages** | Includes right-to-left scripts (Arabic, Urdu, Persian). Dates are formatted for the reader's language. |
| 🔊 **Read it to me** | Text-to-speech with **word-by-word highlighting** in the reader's language, with adjustable speed. |
| 💬 **Ask about it** | Type or **speak** a question ("Can I pay in parts?"). Answers come only from the document and show the quote they're based on. Spoken questions get spoken answers. |
| 📖 **Tap any hard word** | Jargon in the original is highlighted; tap it for a plain explanation. |
| 🔒 **Privacy shield** | SSNs, card numbers (Luhn-validated), bank numbers and birth dates are replaced with placeholders **before** text reaches the AI, then restored in masked form (`•••• 6789`). |
| ♿ **Reading settings** | Dyslexia-friendly font (Lexend), extra letter/word/line spacing, 4 text sizes, high contrast, dark mode, reduced motion, and a **reading ruler**. |
| 🧩 **Browser extension** | Select text on any website and click the icon (or Alt+Shift+V) to get the plain version on the spot. |
| 🖨️ **Print handout** | A clean one-page summary to put on the fridge or bring to an appointment. |
| 📴 **Works without AI** | With no API key, a complete offline NLP engine still simplifies, finds deadlines, amounts and contacts, explains 100+ terms, answers questions and detects scams. |

## Run it

Requires **Node 20+**. There are **no dependencies**, so you don't need `npm install`.

```bash
npm start            # http://localhost:3000  (offline engine)
```

To turn on AI mode (Claude), with translation and higher-quality rewriting:

```bash
cp .env.example .env # then put your key in ANTHROPIC_API_KEY
npm start
```

Run the tests:

```bash
npm test
```

### Browser extension

1. Start the server.
2. Open `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and choose the `extension/` folder.
3. Select text on any page and click the ClearPaste icon. If your server isn't on port 3000, change the server address at the bottom of the popup.

## How it works

```
 Browser                                  Server (Node, zero dependencies)
 ───────                                  ────────────────────────────────
 Ctrl+V / drop / photo / type             POST /api/analyze
   │  image? → Tesseract OCR (on device)    1. validate
   ▼                                        2. offline engine (always runs)
 /api/analyze ──────────────────────────▶      sentences · dates · money · contacts
                                               jargon · actions · scam signals
                                            3. AI on?  privacy shield → Claude
                                               (forced tool-use → strict JSON schema)
                                               → restore masked values → sanitise
                                               → merge (stricter scam verdict wins)
                                            4. readability before/after
 render cards ◀──────────────────────────  JSON
 read aloud · ask · calendar · glossary   POST /api/ask  (grounded Q&A + quote)
```

Design decisions:

- **The AI writes the wording; deterministic code checks the facts and keeps the user safe.** Claude's output is validated against a schema, glossary terms must really appear in the document, deadlines must be valid ISO dates, and the scam verdict takes the stricter of the AI and the rule engine.
- **Prompt-injection resistant.** The document is wrapped in `<document>` tags and treated as data. A scam text that says "ignore previous instructions" doesn't take over the output.
- **Graceful degradation.** If the AI is down, rate-limited or not configured, users still get a full result from the offline engine, and a notice explains why.
- **Accessible by default.** It uses semantic HTML, a skip link, live regions for loading and answers, full keyboard support, visible focus rings, `prefers-reduced-motion` and `prefers-color-scheme` support, 44px touch targets, and the Atkinson Hyperlegible typeface (designed by the Braille Institute for low-vision readers).

## Project structure

```
server/
  index.js, app.js, config.js     entry, routes, env
  http/                           router, JSON body/response, static files
  services/                       analyzer + asker orchestration, merge, validation
  ai/                             Claude client, prompts, JSON schemas
  engine/                         offline NLP: text, readability, extract, jargon,
                                  simplify, actions, classify, risk, ask
  privacy/redact.js               privacy shield (SSN / Luhn cards / DOB / bank)
public/
  index.html
  css/                            tokens, accessibility modes, base, layout, components, print
  js/
    main.js                       bootstraps the page
    app/controller.js             input → loading → result flow
    core/                         DOM helpers, API client, preferences
    features/                     input, OCR, speech, dictation, calendar, ruler
    ui/                           views, loading, dialogs, toasts, formatting
    ui/cards/                     one file per result card
    data/                         languages (shared with server), sample documents
extension/                        Chrome/Edge extension (Manifest V3)
tests/                            node:test unit tests for the engine and privacy shield
```

## Tech

Node.js (no frameworks, no dependencies) · Claude API (structured tool use) · Vanilla JS ES modules · Tesseract.js (WebAssembly OCR) · pdf.js · mammoth.js · Web Speech API (speech synthesis and recognition) · Intl API · iCalendar · Chrome Extension MV3 · `node:test`

All sample documents are fictional.
