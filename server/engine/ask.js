// Offline question answering.
//  1. Common question types ("when", "how much", "who to call", "what if I
//     ignore it", "is this real") are answered with the same extractors the
//     rest of the engine uses, so they work even when the wording differs
//     ("deadline" vs. "due" vs. "no later than").
//  2. Anything else: the best-matching sentence, using word overlap with
//     synonyms.

import { findConsequence } from './actions.js';
import { extractMoney, findDeadline, formatISO } from './extract.js';
import { assessRisk } from './risk.js';
import { simplifySentence } from './simplify.js';
import { contentWords, isHeading, splitSentences, stem } from './text.js';

const PHONE = /(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}|\b1-8\d{2}-[A-Z0-9]{3}-[A-Z0-9]{4}\b|@[\w-]+\./;

const SYNONYMS = {
  deadline: ['due', 'before', 'expire', 'date'],
  contact: ['call', 'phone', 'email', 'reach', 'office'],
  doctor: ['medical', 'physician', 'attention', 'emergency', 'hospital', 'seek'],
  pay: ['due', 'owe', 'amount', 'balance', 'payment', 'fee', 'cost'],
  ignore: ['fail', 'failure', 'result', 'otherwise'],
  appeal: ['disagree', 'hearing', 'review'],
  help: ['assistance', 'aid', 'program', 'support', 'hardship'],
  drink: ['alcohol'],
  miss: ['skip', 'forget'],
};

const found = (answer, quote = '') => ({ found: true, answer, quote });

const INTENTS = [
  {
    name: 'scam-check',
    test: /\b(real|legit(?:imate)?|scam|fake|fraud|trust (?:this|it)|is this safe)\b/i,
    answer: ({ text }) => {
      const risk = assessRisk(text);
      if (risk.level === 'danger') return found(`This is very likely a scam. ${risk.reasons.slice(0, 2).join(' ')} Do not pay, and do not call the number in it.`);
      if (risk.level === 'caution') return found(`Be careful. ${risk.reasons[0]} Check with the organization using contact details from its official website.`);
      return found('We did not find common scam warning signs. To be extra safe, contact the sender using a phone number from their official website, not one in this message.');
    },
  },
  {
    name: 'scam-recovery', // only meaningful when the message is a scam
    test: /\b(report|already paid|already sent|gave them)\b/i,
    answer: ({ text }) => assessRisk(text).level === 'none' ? null : found(
      'If you paid or shared details, call your bank or card company right away and say it was a scam — they may be able to stop it. Then report the message to your local consumer-protection agency or police non-emergency line, and keep a screenshot as proof.'),
  },
  {
    name: 'help',
    test: /\b(help|assistance|afford|can'?t pay|cannot pay|payment plan|support|aid)\b/i,
    answer: ({ sentences }) => {
      const sentence = sentences.find((s) => /\b(financial assistance|charity care|payment plans?|legal aid|hardship|assistance program|free legal)\b/i.test(s));
      return sentence ? found(simplifySentence(sentence), sentence) : null;
    },
  },
  {
    name: 'deadline',
    test: /\b(when|deadline|due date|how long|by what date|how much time|last day)\b/i,
    answer: ({ sentences, today, question }) => {
      // Rank dated sentences: first by words shared with the question
      // ("interview"), then "pay/send BY a date" over "benefits END on".
      const strong = /\b(by|no later than|on or before|due|deadline|within|before)\b/i;
      const asked = new Set(contentWords(question).filter((w) => !/^(deadline|when|date)$/.test(w)));
      const ranked = sentences
        .map((s, i) => ({ s, i, date: findDeadline(s, today), score: 2 * contentWords(s).filter((w) => asked.has(w)).length + (strong.test(s) ? 1 : 0) }))
        .filter((x) => x.date)
        .sort((a, b) => b.score - a.score || a.i - b.i);
      for (const { s: sentence, date } of ranked) {
        const when = date.relative
          ? `about ${formatISO(date.iso)} (${date.text.replace(/\s*\(\d+\)/, '')})`
          : formatISO(date.iso);
        return found(`The key date is ${when}. ${simplifySentence(sentence)}`, sentence);
      }
      return null;
    },
  },
  {
    name: 'amount',
    test: /\b(how much|cost|owe|price|amount|pay)\b/i,
    answer: ({ text, sentences }) => {
      const money = extractMoney(text);
      const owed = money.find((m) => /due|owe|share|minimum|past|rent/i.test(m.label)) || money.find((m) => /fee|payment/i.test(m.label));
      if (!owed) return null;
      return found(`${owed.label}: ${owed.value}.`, sentences.find((s) => s.includes(owed.value)) || '');
    },
  },
  {
    name: 'contact',
    test: /\b(who|contact|call|phone|number|email|reach|talk to)\b/i,
    answer: ({ text, sentences }) => {
      if (assessRisk(text).level === 'danger') {
        return found('Do not contact anyone using the details in this message. If you are worried, use the official website or the number on your card or statement.');
      }
      const sentence = sentences.find((s) => PHONE.test(s) && /\b(call|contact|questions|inquir|reach|phone)\b/i.test(s)) ||
        sentences.find((s) => PHONE.test(s));
      return sentence ? found(simplifySentence(sentence), sentence) : null;
    },
  },
  {
    name: 'consequence',
    test: /\b(ignore|what happens|don'?t|do not|fail|late|nothing)\b/i,
    answer: ({ sentences }) => {
      const original = sentences.find((s) => findConsequence([s]));
      return original ? found(simplifySentence(original), original) : null;
    },
  },
];

function expand(words) {
  const out = new Set(words);
  for (const w of words) {
    for (const [key, list] of Object.entries(SYNONYMS)) {
      const group = [key, ...list].map(stem);
      if (group.includes(w)) group.forEach((s) => out.add(s));
    }
  }
  return out;
}

function bestSentence(sentences, question) {
  const asked = new Set(contentWords(question));
  const expanded = expand([...asked]);
  let best = { score: 0, sentence: null };
  for (const sentence of sentences) {
    if (isHeading(sentence)) continue;
    let score = 0;
    for (const w of new Set(contentWords(sentence))) score += asked.has(w) ? 2 : expanded.has(w) ? 1 : 0;
    if (score > best.score) best = { score, sentence };
  }
  return best.score >= 2 ? best.sentence : null;
}

export function answerOffline(text, question, today) {
  const sentences = splitSentences(text);
  const context = { text, sentences, today, question };

  for (const intent of INTENTS) {
    if (!intent.test.test(question)) continue;
    const result = intent.answer(context);
    if (result) return result;
  }

  const sentence = bestSentence(sentences, question);
  if (sentence) return found(simplifySentence(sentence), sentence);

  return {
    found: false,
    answer: "This document doesn't seem to say. Try asking another way, or ask the sender — their contact details are under “Important details”.",
    quote: '',
  };
}
