# Devpost submission: copy and paste

## Project name
ClearPaste

## Short description
Press Ctrl+V on any confusing document (a bill, eviction notice, benefits letter, medicine leaflet, or scam text, even as a screenshot) and get it in plain words, in your language, read aloud, with a to-do list, deadline reminders and a scam warning.

## Detailed description

### The problem
Life-changing information arrives in documents many people can't read easily. A hospital bill hides a financial-assistance program in paragraph four. A "3-day notice to pay rent or quit" never says that the clock is already running. A benefits letter buries a mandatory interview, and missing it ends the family's food assistance. Meanwhile scam texts copy the tone of these letters closely and ask for gift cards.

Official documents are usually written far above the reading level that plain-language guidelines recommend (about grade 8 or lower). The people hit hardest are older adults, immigrants, people with dyslexia, cognitive disabilities or low vision, and anyone reading under stress. Misreading costs them late fees, evictions, lost benefits and stolen savings.

### Why it matters
Plenty of tools *summarize* text, but a summary doesn't tell you what to do. People need to know **what this means for them, what they have to do, by when, and whether it's even real**, in their own language, in a format they can actually use.

### How it works
1. **Ctrl+V anywhere.** You can paste text or a screenshot, or drop or upload a photo, PDF, or Word file, or type. Files are read **in your browser** (OCR for photos and scanned PDFs), so they never leave your device.
2. **Privacy shield.** SSNs, card numbers (Luhn-checked), bank numbers and birth dates are replaced with placeholders *before* any AI sees the text.
3. **Two engines working together.** Claude rewrites the document into a strict JSON schema: a one-sentence gist, plain summary, actions with ISO deadlines, key facts, glossary and consequences. At the same time, our own offline NLP engine extracts dates, amounts, contacts and jargon, and runs a rule-based scam detector. The results are merged: the AI writes the words, while deterministic code checks the facts and keeps the user safe (for example, the stricter scam verdict always wins, and glossary terms must really appear in the document).
4. **Output built for action:**
   - **In one sentence**: the single most important thing.
   - **What you need to do**: a checklist with live countdowns and one-tap calendar reminders.
   - **If you do nothing**: the real consequence.
   - **Scam shield**: in a scam, the scammer's demands are never shown as to-dos. You get safety steps instead.
   - **Reading level**: Flesch–Kincaid grade before and after, measured by our server rather than claimed by the AI.
   - **Tap any hard word** in the original to see its meaning.
   - **Ask about it** by typing or speaking. Answers are grounded in the document and come with the exact quote. Spoken questions get spoken answers.
   - **Read it to me**, with word-by-word highlighting in 30 languages, including right-to-left scripts.
5. **Reading settings** include a dyslexia-friendly font, extra spacing, four text sizes, high contrast, dark mode, reduced motion and a reading ruler.
6. **Browser extension.** Select text on any website and press Alt+Shift+V.
7. **Works without AI.** With no API key or no connection to the AI, the offline engine still simplifies, finds deadlines, answers questions and catches scams.

### Challenges
- **Never turning a scam into a to-do list.** An ordinary summarizer would faithfully list "buy $500 in gift cards" as a task. We detect scams with two independent methods and switch the whole output into safety mode.
- **Telling deadlines from other dates.** "Rent for November 1–30" is not a deadline, but "within three (3) days" is. The engine looks at the words around each date and converts relative deadlines into real dates.
- **Trusting the AI only where it's safe.** Every AI field is validated and sanitized, the document is treated as untrusted data to resist prompt injection, and private numbers are masked before they're sent.

### What's next
- Fine-tune a small multilingual model on Adaption's Invent-a-Dataset for fully offline translation.
- Add a WhatsApp/SMS number you can forward letters to.
- Add guided form-filling for the most common applications.
- Partner with legal-aid and community organizations so "Who should I call?" connects to real local help.

## Technologies used
Node.js (zero dependencies), Claude API (structured tool use), JavaScript ES modules, HTML/CSS, Tesseract.js (WebAssembly OCR), pdf.js, mammoth.js, Web Speech API (text-to-speech and speech recognition), Intl API, iCalendar (.ics), Chrome Extension Manifest V3, node:test

---

# Demo video script (~2:45)

| Time | Show | Say |
|---|---|---|
| 0:00–0:20 | A real-looking hospital bill on screen | "This is a hospital bill. Somewhere in here is a deadline, a late fee, and a program that could cancel the whole bill. Millions of people can't find them. Watch." |
| 0:20–0:50 | Copy the bill, switch to ClearPaste, press **Ctrl+V** | "Ctrl+V. That's it." Point to *In one sentence*, then the to-do list: "Pay $482.10 by November 30, in 19 days." Click **Add reminder**. Point to *If you do nothing*. |
| 0:50–1:05 | Reading level card, then tap a highlighted word in the original | "We measure it: several grades easier to read. And every hard word is one tap away." |
| 1:05–1:30 | Change language to **Español** (or Hindi) and click **Read it to me** | "Thirty languages, read aloud, with every word highlighted as it's spoken." |
| 1:30–1:55 | Click **Suspicious text** | "Now the dangerous one. A normal summarizer would turn this into a to-do list: buy gift cards. ClearPaste catches it two different ways and gives you safety steps instead." |
| 1:55–2:15 | Ask with the mic: "Is this real?" | Show the answer and its supporting quote. "Answers come only from the document, with the quote they're based on." |
| 2:15–2:30 | Screenshot a letter and paste the **image** | "Screenshots and phone photos work too, and they're read on your device, so they never leave it." |
| 2:30–2:40 | Open **Reading settings**: dyslexia font, ruler, high contrast | "Built for people with dyslexia and low vision from the start." |
| 2:40–2:50 | Browser extension on a web page | "And on any website, just select the text and press Alt+Shift+V. ClearPaste: barrier, Ctrl+V, access." |
