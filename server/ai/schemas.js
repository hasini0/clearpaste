// JSON schemas for Claude's structured output (tool inputs).

const str = (description) => ({ type: 'string', description });

export const ANALYSIS_TOOL = {
  name: 'report_plain_language_analysis',
  description: 'Return the plain-language explanation of the document.',
  input_schema: {
    type: 'object',
    properties: {
      docType: str('Kind of document in 1-3 words, e.g. "Medical bill", "Eviction notice", "Suspicious text".'),
      title: str('Short, friendly title for this specific document (max 8 words).'),
      oneLiner: str('The single most important thing to know, in one short sentence.'),
      summary: { type: 'array', items: { type: 'string' }, description: 'What the document says, as 3-6 short plain sentences addressed to "you".' },
      actions: {
        type: 'array',
        description: 'Concrete things the reader must or should do, most urgent first. Empty if none.',
        items: {
          type: 'object',
          properties: {
            task: str('Starts with a verb. e.g. "Call the billing office to ask for a payment plan".'),
            deadline: { type: ['string', 'null'], description: 'YYYY-MM-DD if there is a date for this task, else null.' },
            deadlineText: { type: ['string', 'null'], description: 'The deadline as written for a human, e.g. "March 15, 2026".' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['task', 'deadline', 'priority'],
        },
      },
      keyFacts: {
        type: 'array',
        description: 'Up to 8 important details: amounts, dates, reference numbers, phone numbers, addresses. Values copied exactly.',
        items: { type: 'object', properties: { label: str('Short label'), value: str('Exact value') }, required: ['label', 'value'] },
      },
      glossary: {
        type: 'array',
        description: 'Up to 10 hard words or phrases from the document with plain meanings.',
        items: {
          type: 'object',
          properties: {
            term: str('Copied EXACTLY as it appears in the document, same language and spelling.'),
            meaning: str('Plain explanation in the output language, max 20 words.'),
          },
          required: ['term', 'meaning'],
        },
      },
      ifIgnored: { type: ['string', 'null'], description: 'What happens if the reader does nothing, in one sentence. null if not stated or not relevant.' },
      redFlags: {
        type: 'object',
        description: 'Scam, fraud or predatory-terms assessment.',
        properties: {
          level: { type: 'string', enum: ['none', 'caution', 'danger'] },
          reasons: { type: 'array', items: { type: 'string' } },
        },
        required: ['level', 'reasons'],
      },
    },
    required: ['docType', 'title', 'oneLiner', 'summary', 'actions', 'keyFacts', 'glossary', 'ifIgnored', 'redFlags'],
  },
};

export const ANSWER_TOOL = {
  name: 'answer_from_document',
  description: 'Answer the question using only the document.',
  input_schema: {
    type: 'object',
    properties: {
      found: { type: 'boolean', description: 'true only if the document actually answers the question.' },
      answer: str('Plain-language answer in 1-3 short sentences, in the output language.'),
      quote: str('The exact sentence from the document that supports the answer, copied verbatim. Empty string if not found.'),
    },
    required: ['found', 'answer', 'quote'],
  },
};
