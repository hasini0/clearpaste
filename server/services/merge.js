// Cleans up the AI's output and combines it with the offline engine's
// verified signals (the "second opinion" on scams, deadlines and facts).

const LEVEL_RANK = { none: 0, caution: 1, danger: 2 };
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const text = (v, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v, max) => (Array.isArray(v) ? v.slice(0, max) : []);

export function sanitizeAI(ai, sourceText) {
  const lowerSource = sourceText.toLowerCase();
  return {
    docType: text(ai.docType, 60) || 'Document',
    title: text(ai.title, 100),
    oneLiner: text(ai.oneLiner, 300),
    summary: list(ai.summary, 8).map((s) => text(s, 400)).filter(Boolean),
    actions: list(ai.actions, 8)
      .map((a) => ({
        task: text(a?.task, 300),
        deadline: ISO_DATE.test(a?.deadline) ? a.deadline : null,
        deadlineText: text(a?.deadlineText, 60) || null,
        priority: ['high', 'medium', 'low'].includes(a?.priority) ? a.priority : 'medium',
      }))
      .filter((a) => a.task),
    keyFacts: list(ai.keyFacts, 10)
      .map((f) => ({ label: text(f?.label, 60), value: text(f?.value, 160) }))
      .filter((f) => f.label && f.value),
    // Only keep glossary terms that really occur, so we can highlight them.
    glossary: list(ai.glossary, 12)
      .map((g) => ({ term: text(g?.term, 80), meaning: text(g?.meaning, 300) }))
      .filter((g) => g.term && g.meaning && lowerSource.includes(g.term.toLowerCase())),
    ifIgnored: text(ai.ifIgnored, 400) || null,
    redFlags: {
      level: LEVEL_RANK[ai.redFlags?.level] !== undefined ? ai.redFlags.level : 'none',
      reasons: list(ai.redFlags?.reasons, 6).map((r) => text(r, 300)).filter(Boolean),
    },
  };
}

/** AI wording wins; the stricter scam verdict wins; offline facts fill gaps. */
export function mergeAnalyses(offline, ai) {
  const aiRank = LEVEL_RANK[ai.redFlags.level];
  const offRank = LEVEL_RANK[offline.redFlags.level];
  const level = aiRank >= offRank ? ai.redFlags.level : offline.redFlags.level;

  return {
    ...ai,
    engine: 'claude',
    title: ai.title || ai.docType,
    keyFacts: ai.keyFacts.length ? ai.keyFacts : offline.keyFacts,
    glossary: ai.glossary.length ? ai.glossary : offline.glossary,
    redFlags: {
      level,
      reasons: ai.redFlags.reasons.length ? ai.redFlags.reasons : offline.redFlags.reasons,
      advice: level === 'none' ? [] : offline.redFlags.advice.length ? offline.redFlags.advice : defaultAdvice(),
      // The offline detector agreeing with the AI is shown as extra evidence.
      crossChecked: offRank > 0 && aiRank > 0,
    },
  };
}

function defaultAdvice() {
  return [
    'Do not click links, reply, or pay yet.',
    'Contact the organization using a phone number from their official website — not one in this message.',
    'Ask someone you trust before you act.',
  ];
}
