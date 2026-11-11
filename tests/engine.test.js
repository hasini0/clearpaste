// Run with: npm test   (uses Node's built-in test runner, no dependencies)

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { answerOffline } from '../server/engine/ask.js';
import { extractDates, extractMoney, findDeadline } from '../server/engine/extract.js';
import { analyzeOffline } from '../server/engine/index.js';
import { countSyllables, gradeLevel } from '../server/engine/readability.js';
import { assessRisk } from '../server/engine/risk.js';
import { simplifySentence } from '../server/engine/simplify.js';
import { splitSentences, textQuality } from '../server/engine/text.js';
import { validateDocumentRequest } from '../server/services/validate.js';
import { luhn, redact } from '../server/privacy/redact.js';
import { sanitizeAI, mergeAnalyses } from '../server/services/merge.js';
import { SAMPLES } from '../public/js/data/samples.js';

const TODAY = '2026-11-10';
const sample = (id) => SAMPLES.find((s) => s.id === id).text;

test('sentence splitter respects abbreviations and times', () => {
  const s = splitSentences('Call Dr. Smith at 8:00 a.m. tomorrow. Bring your I.D. card! Done?');
  assert.deepEqual(s, ['Call Dr. Smith at 8:00 a.m. tomorrow.', 'Bring your I.D. card!', 'Done?']);
});

test('syllables and grade level behave sensibly', () => {
  assert.equal(countSyllables('cat'), 1);
  assert.equal(countSyllables('responsibility'), 6);
  assert.ok(gradeLevel('The cat sat. The dog ran. We had fun.') < 3);
  assert.ok(gradeLevel(sample('eviction')) > 9);
});

test('dates: absolute formats, invalid dates, and relative deadlines', () => {
  const dates = extractDates('Due March 3, 2027 or 03/04/2027 or 2027-03-05. Not 02/30/2027.', TODAY);
  assert.deepEqual(dates.map((d) => d.iso), ['2027-03-03', '2027-03-04', '2027-03-05']);
  assert.equal(findDeadline('Pay within thirty (30) days.', TODAY).iso, '2026-12-10');
  assert.equal(findDeadline('Rent for November 1, 2026 is unpaid.', TODAY), null, 'a period date is not a deadline');
});

test('money gets a meaningful label and skips zero amounts', () => {
  const money = extractMoney('Insurance paid: $2,731.90. Adjustment: $0.00. Amount Due: $482.10');
  assert.deepEqual(money.map((m) => [m.label, m.value]), [['Insurance paid', '$2,731.90'], ['Amount due', '$482.10']]);
});

test('simplifier swaps jargon but keeps phone numbers intact', () => {
  const out = simplifySentence('Prior to the deadline, please remit payment (see enclosed form) to (555) 201-7788.');
  assert.equal(out, 'Before the deadline, please pay to (555) 201-7788.');
});

test('scam detector: scam is danger, real bill is safe', () => {
  assert.equal(assessRisk(sample('scam')).level, 'danger');
  for (const id of ['medical-bill', 'eviction', 'benefits', 'medicine']) {
    assert.equal(assessRisk(sample(id)).level, 'none', id);
  }
});

test('scam analysis never turns the scammer’s demands into to-dos', () => {
  const result = analyzeOffline(sample('scam'), { today: TODAY });
  assert.equal(result.docType, 'Suspicious message');
  assert.ok(result.actions.every((a) => !/gift card.*using|call officer/i.test(a.task)));
  assert.match(result.actions[0].task, /^Do not/);
});

test('medical bill: payment task with the real deadline', () => {
  const result = analyzeOffline(sample('medical-bill'), { today: TODAY });
  assert.equal(result.actions[0].task, 'Pay $482.10 by November 30, 2026');
  assert.equal(result.actions[0].deadline, '2026-11-30');
  assert.ok(result.glossary.some((g) => g.term === 'deductible'));
});

test('privacy shield: hides SSN, valid cards and DOB, then restores masked', () => {
  assert.ok(luhn('4111111111111111'));
  assert.ok(!luhn('4111111111111112'));
  const shield = redact('SSN 123-45-6789, card 4111 1111 1111 1111, Date of birth: 04/12/1958, phone 555-201-7788.');
  assert.equal(shield.hidden, 3);
  assert.ok(!shield.text.includes('123-45-6789') && !shield.text.includes('4111') && !shield.text.includes('1958'));
  assert.ok(shield.text.includes('555-201-7788'), 'phone numbers are kept');
  assert.equal(shield.restore({ note: 'Your SSN [SSN-1]' }).note, 'Your SSN •••• 6789');
});

test('AI output is sanitised and the stricter scam verdict wins', () => {
  const source = 'Send gift cards now. The landlord owns the premises.';
  const ai = sanitizeAI({
    docType: 'Letter', title: 'x', oneLiner: 'y', summary: ['a'], actions: [{ task: 't', deadline: 'tomorrow', priority: 'urgent' }],
    keyFacts: [], glossary: [{ term: 'premises', meaning: 'home' }, { term: 'invented term', meaning: 'nope' }],
    ifIgnored: null, redFlags: { level: 'none', reasons: [] },
  }, source);
  assert.equal(ai.actions[0].deadline, null);
  assert.equal(ai.actions[0].priority, 'medium');
  assert.deepEqual(ai.glossary.map((g) => g.term), ['premises']);

  const offline = analyzeOffline(sample('scam'), { today: TODAY });
  assert.equal(mergeAnalyses(offline, ai).redFlags.level, 'danger');
});

test('offline Q&A finds the grounded answer', () => {
  assert.match(answerOffline(sample('medical-bill'), 'How much do I have to pay?').answer, /482\.10/);
  assert.match(answerOffline(sample('benefits'), 'When is my interview?').answer, /December 8/);
  assert.equal(answerOffline(sample('medicine'), 'What is the capital of France?').found, false);
});

test('garbled OCR text is rejected, real text in any script is accepted', () => {
  assert.throws(() => validateDocumentRequest({ text: 'null\na oy co rE\n: no f= lt\nSe\n4 il' }), /could not read this clearly/);
  for (const text of ['If you do not pay by May 1 we will act.', 'आपका बिल 500 रुपये है। कृपया भुगतान करें।', '您的账单已经逾期，请尽快付款。']) {
    assert.ok(textQuality(text).share >= 0.4, text);
  }
});

test('short texts still get a non-empty summary', () => {
  const result = analyzeOffline('Your package is held. Pick it up at the post office.', { today: TODAY });
  assert.ok(result.summary.length > 0);
});

test('suggested questions get real answers on every valid sample', () => {
  const ask = (id, q) => answerOffline(sample(id), q, TODAY);
  for (const id of ['medical-bill', 'eviction', 'benefits']) {
    for (const q of ['When is the deadline?', 'Who should I contact?', 'What happens if I ignore this?']) {
      assert.ok(ask(id, q).found, `${id}: ${q}`);
    }
  }
  assert.match(ask('benefits', 'When is the deadline?').answer, /December 1, 2026/);
  assert.match(ask('eviction', 'Can I get help paying?').answer, /legal aid/i);
  assert.match(ask('scam', 'Is this real?').answer, /scam/);
  assert.match(ask('medicine', 'Is it safe to crush the tablet?').answer, /crush/);
});
