// Pulls structured facts out of free text: dates, money, phone numbers,
// emails, web links and reference numbers.

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const NUMBER_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  fourteen: 14, fifteen: 15, twenty: 20, thirty: 30, sixty: 60, ninety: 90,
};

const pad = (n) => String(n).padStart(2, '0');
const toISO = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

function isValidDate(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return toISO(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

const DEADLINE_BEFORE = /\b(by|before|no later than|on or before|due(?: on| date)?|deadline|until|expires?(?: on)?|ends? on|end on|scheduled for)\s*[:\-]?\s*$/i;

/** The date in a sentence that is actually a deadline ("by March 3"), if any. */
export function findDeadline(sentence, today) {
  return extractDates(sentence, today).find(
    (d) => d.relative || DEADLINE_BEFORE.test(sentence.slice(Math.max(0, d.index - 30), d.index)),
  ) || null;
}

export function formatISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${names[m - 1]} ${d}, ${y}`;
}

const monthIndex = (name) => MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1;

/** Finds absolute dates (several formats) and "within N days" phrases. */
export function extractDates(text, today) {
  const found = [];
  const add = (index, raw, y, m, d, relative = false) => {
    if (isValidDate(y, m, d)) found.push({ index, text: raw, iso: toISO(y, m, d), relative });
  };

  const patterns = [
    [new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'gi'), (m) => [+m[3], monthIndex(m[1]), +m[2]]],
    [new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\.?,?\\s+(\\d{4})\\b`, 'gi'), (m) => [+m[3], monthIndex(m[2]), +m[1]]],
    [/\b(\d{4})-(\d{2})-(\d{2})\b/g, (m) => [+m[1], +m[2], +m[3]]],
    [/\b(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/g, (m) => [m[3].length === 2 ? 2000 + +m[3] : +m[3], +m[1], +m[2]]],
  ];

  for (const [regex, toParts] of patterns) {
    for (const match of text.matchAll(regex)) add(match.index, match[0], ...toParts(match));
  }

  if (today) {
    const relative = /\bwithin\s+(\d+|[a-z]+)\s*(?:\(\d+\)\s*)?(calendar\s+|business\s+)?days?\b/gi;
    for (const match of text.matchAll(relative)) {
      const n = /^\d+$/.test(match[1]) ? +match[1] : NUMBER_WORDS[match[1].toLowerCase()];
      if (!n) continue;
      const days = match[2]?.toLowerCase().startsWith('business') ? Math.ceil(n * 1.4) : n;
      const iso = addDays(today, days);
      const [y, m, d] = iso.split('-').map(Number);
      add(match.index, match[0], y, m, d, true);
    }
  }

  return found.sort((a, b) => a.index - b.index);
}

const MONEY_RE = /(?:USD\s?|US\$|\$|€|£|₹|Rs\.?\s?)\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?(?!\d)|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s?(?:dollars|USD|euros|rupees)\b/gi;
const MONEY_LABELS = [
  ['total amount due', 'Total amount due'], ['amount due', 'Amount due'], ['balance due', 'Balance due'],
  ['you owe', 'You owe'], ['patient responsibility', 'Your share'], ['your responsibility', 'Your share'],
  ['minimum payment', 'Minimum payment'], ['past due', 'Past-due amount'], ['late fee', 'Late fee'],
  ['monthly rent', 'Monthly rent'], ['rent', 'Rent'], ['deposit', 'Deposit'], ['fee', 'Fee'],
  ['penalty', 'Penalty'], ['copay', 'Copay'], ['deductible', 'Deductible'], ['insurance paid', 'Insurance paid'],
  ['total charges', 'Total charges'], ['salary', 'Salary'], ['refund', 'Refund'], ['benefit', 'Benefit amount'],
  ['payment', 'Payment'], ['total', 'Total'], ['balance', 'Balance'],
];

export function extractMoney(text) {
  const results = [];
  for (const match of text.matchAll(MONEY_RE)) {
    if (!/[1-9]/.test(match[0])) continue; // skip $0.00
    const context = text.slice(Math.max(0, match.index - 60), match.index).toLowerCase();
    let label = 'Amount';
    let bestPos = -1;
    for (const [needle, name] of MONEY_LABELS) {
      const pos = context.lastIndexOf(needle);
      if (pos > bestPos) { bestPos = pos; label = name; }
    }
    // "$86.40 is past due" — the label can come after the amount too.
    if (label === 'Amount') {
      const after = text.slice(match.index + match[0].length, match.index + match[0].length + 30).toLowerCase();
      if (/^\s*(?:is\s+)?(?:now\s+)?(?:past due|overdue)/.test(after)) label = 'Past-due amount';
      else if (/^\s*(?:is\s+)?(?:now\s+)?due/.test(after)) label = 'Amount due';
    }
    results.push({ index: match.index, value: match[0].trim(), label });
  }
  return results;
}

export function extractContacts(text) {
  const phones = [...text.matchAll(/(?<![\d-])(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?![\d-])|\b1-8\d{2}-[A-Z0-9]{3}-[A-Z0-9]{4}\b/g)]
    .map((m) => m[0].trim());
  const emails = [...text.matchAll(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g)].map((m) => m[0]);
  const links = [...text.matchAll(/\b(?:https?:\/\/|www\.)[^\s)>"']+|\b[a-z0-9-]+\.(?:gov|org|com|net|info|xyz|top|click|ly)\/[^\s)>"']*/gi)]
    .map((m) => m[0].replace(/[.,;]$/, ''));
  return { phones: unique(phones), emails: unique(emails), links: unique(links) };
}

const REF_RE = /\b(account|acct|case|claim|policy|invoice|reference|ref|member|patient|file|confirmation|order|tracking)\s*(?:number|no\.?|#|id)?\s*[:#]?\s*([A-Z0-9][A-Z0-9-]{3,})\b/gi;

export function extractReferences(text) {
  const refs = [];
  for (const match of text.matchAll(REF_RE)) {
    if (!/\d/.test(match[2])) continue; // must contain a digit
    const kind = match[1].toLowerCase().replace(/^acct$/, 'account').replace(/^ref$/, 'reference');
    refs.push({ label: `${kind.charAt(0).toUpperCase()}${kind.slice(1)} number`, value: match[2] });
  }
  return uniqueBy(refs, (r) => r.value);
}

function unique(items) {
  return [...new Set(items)];
}

function uniqueBy(items, keyOf) {
  const seen = new Set();
  return items.filter((item) => !seen.has(keyOf(item)) && seen.add(keyOf(item)));
}
