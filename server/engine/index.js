// The offline engine: a complete, deterministic analysis with no network
// calls. Used on its own when no AI key is configured, and as a source of
// verified facts (dates, amounts, scam signals) alongside the AI.

import { findActions, findConsequence } from './actions.js';
import { classifyDocument } from './classify.js';
import { extractContacts, extractDates, extractMoney, extractReferences, findDeadline, formatISO } from './extract.js';
import { assessRisk } from './risk.js';
import { findGlossaryTerms, simplifySentence, summarize } from './simplify.js';
import { splitSentences } from './text.js';

const SUMMARY_SIZE = { simple: 3, standard: 4, detailed: 6 };

export function analyzeOffline(text, { level = 'simple', today }) {
  const sentences = splitSentences(text);
  const redFlags = assessRisk(text);
  const docType = classifyDocument(text, redFlags);
  const money = extractMoney(text);
  const keyFacts = buildKeyFacts(text, money, today);
  const scam = redFlags.level === 'danger';

  // In a scam, the "instructions" are the scammer's demands — never present
  // them as a to-do list. Show protective steps and explain the claims instead.
  const actions = scam ? safetyActions() : withPaymentTask(findActions(sentences, today), sentences, money, today);
  const summary = scam
    ? describeScam(sentences)
    : summaryOrFallback(sentences, level);

  return {
    engine: 'offline',
    docType,
    title: docType,
    oneLiner: buildOneLiner({ docType, money, actions, redFlags }),
    summary,
    actions,
    keyFacts,
    glossary: findGlossaryTerms(text),
    ifIgnored: scam ? 'Nothing bad happens if you ignore a scam. Real agencies contact you by mail and never demand gift cards or crypto.' : findConsequence(sentences),
    redFlags,
  };
}

function buildKeyFacts(text, money, today) {
  const facts = [];
  const seen = new Set();
  const add = (label, value) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    facts.push({ label, value });
  };

  money.slice(0, 4).forEach((m) => add(m.label, m.value));
  extractDates(text, today).filter((d) => !d.relative).slice(0, 3).forEach((d) => add('Date', d.text));
  extractReferences(text).slice(0, 2).forEach((r) => add(r.label, r.value));
  const { phones, emails, links } = extractContacts(text);
  phones.slice(0, 2).forEach((p) => add('Phone', p));
  emails.slice(0, 1).forEach((e) => add('Email', e));
  links.slice(0, 1).forEach((l) => add('Website', l));
  return facts.slice(0, 10);
}

function buildOneLiner({ docType, money, actions, redFlags }) {
  if (redFlags.level === 'danger') {
    return 'This message shows several warning signs of a scam. Do not pay, click, or reply until you check it.';
  }
  const owed = money.find((m) => /due|owe|share|minimum|past|rent/i.test(m.label));
  const deadline = actions.find((a) => a.deadline);
  const article = /^(?:[aeio]|u(?![nst]i))/i.test(docType) ? 'an' : 'a'; // "a utility", "an insurance"
  let line = `This is ${article} ${docType.toLowerCase()}.`;
  if (owed) line += ` It says you owe ${owed.value}.`;
  if (deadline) line += ` The key deadline is ${deadline.deadlineText}.`;
  else if (actions[0]) line += ` The main thing to do: ${actions[0].task.charAt(0).toLowerCase()}${actions[0].task.slice(1)}.`;
  return line;
}

/** "Amount Due: $482.10" + "Payment is due by Nov 30" → "Pay $482.10 by November 30, 2026". */
function withPaymentTask(actions, sentences, money, today) {
  const owed = money.find((m) => /due|owe|share|minimum|past|rent/i.test(m.label));
  const dueSentence = sentences.find((s) => /\b(pay|payment|rent|balance|amount)\b/i.test(s) && findDeadline(s, today));
  if (!owed || !dueSentence) return actions;
  const date = findDeadline(dueSentence, today);
  const when = date.relative ? `${date.text.replace(/\s*\(\d+\)/, '')} (about ${formatISO(date.iso)})` : `by ${date.text}`;
  const task = { task: `Pay ${owed.value} ${when}`, deadline: date.iso, deadlineText: formatISO(date.iso), priority: 'high' };
  return [task, ...actions.filter((a) => a.deadline !== date.iso)].slice(0, 6);
}

function safetyActions() {
  return [
    { task: 'Do not call any phone number or open any link in this message', deadline: null, deadlineText: null, priority: 'high' },
    { task: 'Do not send money, gift cards, crypto, or personal numbers', deadline: null, deadlineText: null, priority: 'high' },
    { task: 'If you are worried, contact the real organization using its official website', deadline: null, deadlineText: null, priority: 'medium' },
    { task: 'Report the message and then delete it', deadline: null, deadlineText: null, priority: 'low' },
  ];
}

function describeScam(sentences) {
  const claim = sentences.find((s) => /\b(suspend|warrant|arrest|won|locked|problem|suspicious|owe)/i.test(s));
  const demand = sentences.find((s) => /\b(gift ?card|bitcoin|crypto|wire|pay|fee)\b/i.test(s));
  return [
    claim && `The message claims: “${simplifySentence(claim, { splitLong: false })}”`,
    demand && `It then asks you to: “${simplifySentence(demand, { splitLong: false })}”`,
    'These are classic signs of a scam. Real organizations do not threaten you or ask for this kind of payment.',
  ].filter(Boolean);
}

/** Short texts (an SMS, a two-line notice) have nothing to rank, so fall
 *  back to the text itself, simplified, rather than an empty card. */
function summaryOrFallback(sentences, level) {
  const picked = summarize(sentences, SUMMARY_SIZE[level] || 3);
  const source = picked.length ? picked : sentences.filter((s) => s.split(/\s+/).length >= 3).slice(0, 3);
  return source.map((s) => simplifySentence(s, { splitLong: level !== 'detailed' }));
}
