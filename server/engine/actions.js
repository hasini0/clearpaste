// Finds what the reader has to do, by when, and what happens if they don't.

import { findDeadline, formatISO } from './extract.js';
import { simplifySentence } from './simplify.js';
import { capitalize, isHeading, wordCount } from './text.js';

const ACTION_CUE = /\b(you must|you need to|you should|please|required|must be|need to|you are required|be sure to|make sure|call|contact|submit|return|bring|pay|sign|send|complete|respond|appeal|apply|schedule|take|do not|avoid|stop|keep|fill out|visit|log in|request|ask for)\b/i;
const MUST_CUE = /\b(must|required|need to|no later than|deadline|failure to|will be|or else)\b/i;
const DEADLINE_CUE = /\b(by|before|scheduled|no later than|on or before|due|deadline|until|within|expires?|ends?)\b/i;
const CONSEQUENCE_CUE = /\b(failure to|if you do not|if you don't|if you fail|in the event that you fail|if (?:payment|rent|this) is not|otherwise(?! directed)|will result in|may result in|could result in|or we will|we may|will be (?:sent|referred|terminated|reported|charged))\b/i;

const LEAD_INS = /^(?:please\s+(?:be sure to\s+)?|you (?:must|need to|should|are required to|will need to)\s+|be sure to\s+|make sure (?:to|that you)\s+|it is (?:important|required) that you\s+)/i;

function toTask(sentence) {
  let task = simplifySentence(sentence, { splitLong: false }).replace(/[.!]+$/, '');
  task = task.replace(LEAD_INS, '').replace(/\bplease\s+/i, '');
  // Drop polite openers like "To avoid late fees, " but keep the reason later
  if (wordCount(task) > 26) task = task.split(/[,;](?=\s)/)[0];
  return capitalize(task.trim());
}

export function findActions(sentences, today, limit = 6) {
  const actions = [];
  for (const sentence of sentences) {
    if (isHeading(sentence) || wordCount(sentence) < 4 || !ACTION_CUE.test(sentence)) continue;
    if (CONSEQUENCE_CUE.test(sentence) && !/\b(please|you must|you need to)\b/i.test(sentence)) continue;

    const date = DEADLINE_CUE.test(sentence) ? findDeadline(sentence, today) : null;
    actions.push({
      task: toTask(sentence),
      deadline: date?.iso || null,
      deadlineText: date ? formatISO(date.iso) : null,
      priority: MUST_CUE.test(sentence) || date ? 'high' : 'medium',
    });
  }

  const unique = actions.filter((a, i) => actions.findIndex((b) => b.task === a.task) === i);
  return unique
    .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'high' ? -1 : 1))
    .slice(0, limit);
}

export function findConsequence(sentences) {
  const hit = sentences.find((s) => CONSEQUENCE_CUE.test(s) && wordCount(s) >= 5);
  return hit ? simplifySentence(hit) : null;
}
