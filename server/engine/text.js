// Low-level text utilities: normalising, sentence splitting, tokenising.

const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'st', 'no', 'vs', 'etc', 'e.g', 'i.e', 'inc', 'ltd', 'co', 'jr', 'sr',
  'u.s', 'a.m', 'p.m', 'dept', 'approx', 'apt', 'ave', 'blvd', 'mg', 'fig', 'jan', 'feb', 'mar',
  'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'ph', 'tel', 'ext',
]);

export const STOPWORDS = new Set(
  ('a an and are as at be been but by can do does for from had has have he her his how i if in into is it its ' +
    'me my no not of on or our she so that the their them then there these they this to was we were what when ' +
    'where which who why will with would you your yours about any all also am may must shall should could ' +
    'than too very just over under up out off more most other such only own same few each both').split(' '),
);

export function normalize(text) {
  return String(text)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const BULLET = /^\s*(?:[-•*▪●–]|\(?\d{1,2}[.)])\s+/;

/** Re-joins prose that was hard-wrapped (PDFs, emails, OCR): a line that
 *  is long and doesn't end in punctuation continues on the next line. */
function joinWrappedLines(text) {
  const lines = [];
  for (const line of text.split('\n')) {
    const prev = lines[lines.length - 1];
    const continues = prev && line.trim() && !BULLET.test(line) &&
      prev.length >= 35 && !/[.!?:]["')\]]?$/.test(prev) && !isHeading(prev);
    if (continues) lines[lines.length - 1] = `${prev} ${line.trim()}`;
    else lines.push(line);
  }
  return lines.filter((l) => l.trim());
}

/** Splits text into sentences, treating each line as a boundary and
 *  ignoring periods that belong to common abbreviations. */
export function splitSentences(text) {
  const sentences = [];
  const push = (s) => {
    const trimmed = s.trim();
    if (trimmed) sentences.push(trimmed);
  };

  for (const rawLine of joinWrappedLines(normalize(text))) {
    const line = rawLine.replace(/^\s*(?:[-•*▪●–]|\(?\d{1,2}[.)])\s+/, '').trim();
    if (!line) continue;

    const boundary = /[.!?]+["')\]]?(?=\s+|$)/g;
    let start = 0;
    let match;
    while ((match = boundary.exec(line))) {
      const before = line.slice(start, match.index);
      const lastWord = (before.match(/([A-Za-z.]+)$/) || [])[1] || '';
      const nextIsLower = /^\s+[a-z]/.test(line.slice(match.index + match[0].length));
      const isInitialism = /^(?:[A-Za-z]\.)+[A-Za-z]$/.test(lastWord) && nextIsLower; // "I.D. card"
      const isAbbrev = match[0] === '.' && (ABBREVIATIONS.has(lastWord.toLowerCase()) || /^[A-Z]$/.test(lastWord) || isInitialism);
      if (isAbbrev) continue;
      const end = match.index + match[0].length;
      push(line.slice(start, end));
      start = end;
    }
    if (start < line.length) push(line.slice(start));
  }
  return sentences;
}

export function tokenize(text) {
  return String(text).toLowerCase().match(/[a-z][a-z'-]*/g) || [];
}

/** Very light stemmer — good enough for matching "paying" with "pay". */
export function stem(word) {
  return word.replace(/(?:ing|ed|es|s|ly)$/, '') || word;
}

export function contentWords(text) {
  return tokenize(text).filter((w) => w.length > 2 && !STOPWORDS.has(w)).map(stem);
}

export function wordCount(text) {
  return (String(text).match(/\S+/g) || []).length;
}

/** A token "looks real" if it is a number, or mostly letters (3+ for Latin
 *  script, 2+ for others like Devanagari or Chinese). Garbled OCR such as
 *  "rE f= lt" fails this. */
function isRealToken(token) {
  const core = token.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '');
  if (!core) return false;
  if (/^\d[\d,.:/-]*%?$/.test(core)) return true;
  const letters = core.match(/[\p{L}\p{M}]/gu)?.length || 0;
  if (letters / core.length < 0.8) return false;
  return /\p{Script=Latin}/u.test(core) ? letters >= 3 : letters >= 2;
}

/** How much of the text looks like real words (catches garbled OCR). */
export function textQuality(text) {
  const tokens = String(text).split(/\s+/).filter(Boolean);
  const real = tokens.filter(isRealToken).length;
  return { tokens: tokens.length, real, share: tokens.length ? real / tokens.length : 0 };
}

export function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function isHeading(sentence) {
  const letters = sentence.replace(/[^A-Za-z]/g, '');
  return letters.length > 3 && letters === letters.toUpperCase() && wordCount(sentence) <= 8;
}
