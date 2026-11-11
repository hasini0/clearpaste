// Answers a follow-up question about a document, grounded in its text.

import { callTool } from '../ai/claude.js';
import { answerSystemPrompt, wrapDocument } from '../ai/prompts.js';
import { ANSWER_TOOL } from '../ai/schemas.js';
import { isAIEnabled } from '../config.js';
import { answerOffline } from '../engine/ask.js';
import { normalize } from '../engine/text.js';
import { redact } from '../privacy/redact.js';
import { todayISO } from './time.js';
import { validateQuestionRequest } from './validate.js';

export async function answerQuestion(body) {
  const { text: raw, question, level, language } = validateQuestionRequest(body);
  const text = normalize(raw);

  if (isAIEnabled()) {
    const shield = redact(text);
    try {
      const ai = shield.restore(await callTool({
        system: answerSystemPrompt({ level, language }),
        messages: [{ role: 'user', content: `${wrapDocument(shield.text)}\n\nQuestion: ${question}` }],
        tool: ANSWER_TOOL,
        maxTokens: 800,
      }));
      return {
        engine: 'claude',
        found: Boolean(ai.found),
        answer: String(ai.answer || ''),
        quote: String(ai.quote || ''),
      };
    } catch (err) {
      console.warn('[ask] AI failed, using offline engine:', err.message);
    }
  }

  return { engine: 'offline', ...answerOffline(text, question, todayISO()) };
}
