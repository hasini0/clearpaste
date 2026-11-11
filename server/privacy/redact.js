// "Privacy shield": replaces sensitive identifiers with placeholder tokens
// before any text is sent to an AI provider, then puts the real values back
// into the AI's answer. The AI never sees SSNs, card numbers or birthdays.

const RULES = [
  { kind: 'SSN', re: /\b\d{3}-\d{2}-\d{4}\b/g },
  { kind: 'CARD', re: /\b(?:\d[ -]?){13,19}\b/g, check: (v) => luhn(v.replace(/\D/g, '')) },
  { kind: 'DOB', re: /\b(date of birth|dob|born on|birth date)\s*[:\-]?\s*([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4}|[A-Z][a-z]+\.? \d{1,2},? \d{4})/gi, group: 2 },
  { kind: 'BANK', re: /\b(routing|account|acct|iban)\s*(?:number|no\.?|#)?\s*[:#]?\s*([0-9]{6,17}|[A-Z]{2}\d{2}[A-Z0-9]{10,30})\b/gi, group: 2 },
];

export function luhn(digits) {
  if (digits.length < 13) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

export function redact(text) {
  const tokens = new Map(); // token → original
  const counts = {};
  let output = text;

  for (const rule of RULES) {
    output = output.replace(rule.re, (...args) => {
      const match = args[0];
      const value = rule.group ? args[rule.group] : match;
      if (!value || (rule.check && !rule.check(value))) return match;
      counts[rule.kind] = (counts[rule.kind] || 0) + 1;
      const token = `[${rule.kind}-${counts[rule.kind]}]`;
      tokens.set(token, value);
      return match.replace(value, token);
    });
  }

  const hidden = [...tokens.keys()].length;
  return {
    text: output,
    hidden,
    kinds: Object.keys(counts),
    restore: (value) => restoreDeep(value, tokens),
  };
}

function restoreDeep(value, tokens) {
  if (typeof value === 'string') {
    return value.replace(/\[(?:SSN|CARD|DOB|BANK)-\d+\]/g, (t) => (tokens.has(t) ? maskForDisplay(tokens.get(t)) : t));
  }
  if (Array.isArray(value)) return value.map((v) => restoreDeep(v, tokens));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, restoreDeep(v, tokens)]));
  }
  return value;
}

/** Even in our own UI we only show the last 4 characters. */
function maskForDisplay(original) {
  const tail = original.replace(/\W/g, '').slice(-4);
  return `•••• ${tail}`;
}
