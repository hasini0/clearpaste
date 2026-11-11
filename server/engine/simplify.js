// Rule-based simplification + extractive summarisation for the offline engine.

import { GLOSSARY, PHRASE_SWAPS, WORD_SWAPS } from './jargon.js';
import { capitalize, contentWords, isHeading, wordCount } from './text.js';

const NUMBER_WORD_PAREN = /\b(one|two|three|four|five|six|seven|eight|nine|ten|fourteen|fifteen|twenty|thirty|forty-five|sixty|ninety) \(\d+\)/gi;

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const PHRASE_RULES = PHRASE_SWAPS.map(([from, to]) => [new RegExp(`\\b${escapeRe(from)}\\b`, 'gi'), to]);
const WORD_RULE = new RegExp(`\\b(${Object.keys(WORD_SWAPS).map(escapeRe).join('|')})\\b`, 'gi');

const keepCase = (original, replacement) =>
  original[0] === original[0].toUpperCase() && original[0] !== original[0].toLowerCase()
    ? capitalize(replacement)
    : replacement;

/** Rewrites one sentence with shorter words and phrases. */
export function simplifySentence(sentence, { splitLong = true } = {}) {
  let s = sentence
    .replace(NUMBER_WORD_PAREN, '$1') // "thirty (30) days" → "thirty days"
    .replace(/\s*\((?=[^)]*[a-z]{3})[^)]{0,80}\)/gi, ''); // drop wordy asides

  for (const [regex, to] of PHRASE_RULES) s = s.replace(regex, (m) => keepCase(m, to));
  s = s.replace(WORD_RULE, (m) => keepCase(m, WORD_SWAPS[m.toLowerCase()]));

  s = s.replace(/\s{2,}/g, ' ').replace(/\s+([,.;:!?])/g, '$1').replace(/,\s*,/g, ',').trim();

  if (splitLong && wordCount(s) > 20) {
    s = s
      .replace(/;\s+([a-z])/g, (_, c) => `. ${c.toUpperCase()}`)
      .replace(/,\s+(but|which)\s+/i, (_, w) => `. ${w.toLowerCase() === 'which' ? 'This' : 'But'} `);
  }
  return capitalize(s);
}

const SKIP = /^(dear|sincerely|regards|thank you|yours|page \d|to whom|re:|subject:|from:|sent:|date:)/i;

/** Picks the most informative sentences and returns them in reading order. */
export function summarize(sentences, count) {
  const freq = new Map();
  for (const s of sentences) for (const w of contentWords(s)) freq.set(w, (freq.get(w) || 0) + 1);

  const scored = sentences.map((s, index) => {
    const words = contentWords(s);
    const length = wordCount(s);
    if (length < 5 || length > 70 || isHeading(s) || SKIP.test(s)) return { s, index, score: -1 };
    let score = words.reduce((sum, w) => sum + (freq.get(w) || 0), 0) / Math.sqrt(words.length || 1);
    if (/[$€£₹]\s?\d/.test(s)) score += 2;
    if (/\b\d{1,2}[/,]|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d/i.test(s)) score += 1.5;
    if (/\b(must|required|need to|please|deadline|due)\b/i.test(s)) score += 1.5;
    if (index < 4) score += 1;
    return { s, index, score };
  });

  return scored
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .sort((a, b) => a.index - b.index)
    .map((x) => x.s);
}

const escapeTerm = (t) => new RegExp(`\\b${escapeRe(t)}\\b`, 'i');
const GLOSSARY_RULES = Object.entries(GLOSSARY).map(([term, meaning]) => ({ term, meaning, re: escapeTerm(term) }));

/** Returns glossary terms that appear in the text, as written in the text. */
export function findGlossaryTerms(text, limit = 12) {
  const hits = [];
  for (const { meaning, re } of GLOSSARY_RULES) {
    const match = text.match(re);
    if (match) hits.push({ term: match[0], meaning, index: match.index });
  }
  // Prefer longer terms when one term contains another ("amount due" vs "due").
  const filtered = hits.filter((h) => !hits.some((o) => o !== h && o.term.length > h.term.length && o.term.toLowerCase().includes(h.term.toLowerCase())));
  return filtered.sort((a, b) => a.index - b.index).slice(0, limit).map(({ term, meaning }) => ({ term, meaning }));
}
