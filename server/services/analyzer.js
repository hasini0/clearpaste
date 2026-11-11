// Orchestrates one analysis:
//   1. validate input   2. run the offline engine (always)
//   3. if AI is configured: redact → Claude → restore → merge
//   4. measure readability before and after

import { callTool } from '../ai/claude.js';
import { analysisSystemPrompt, wrapDocument } from '../ai/prompts.js';
import { ANALYSIS_TOOL } from '../ai/schemas.js';
import { isAIEnabled } from '../config.js';
import { analyzeOffline } from '../engine/index.js';
import { readabilityReport } from '../engine/readability.js';
import { normalize } from '../engine/text.js';
import { redact } from '../privacy/redact.js';
import { mergeAnalyses, sanitizeAI } from './merge.js';
import { todayISO } from './time.js';
import { validateDocumentRequest } from './validate.js';

export async function analyzeDocument(body) {
  const started = Date.now();
  const { text: raw, truncated, level, language } = validateDocumentRequest(body);
  const text = normalize(raw);
  const today = todayISO();

  const offline = analyzeOffline(text, { level, today });
  let result = offline;
  let privacy = { mode: 'local', hidden: 0, kinds: [] };
  const notices = [];

  if (truncated) notices.push('This document was very long, so we only read the first part.');

  if (isAIEnabled()) {
    const shield = redact(text);
    privacy = { mode: 'ai', hidden: shield.hidden, kinds: shield.kinds };
    try {
      const ai = await callTool({
        system: analysisSystemPrompt({ level, language, today }),
        messages: [{ role: 'user', content: wrapDocument(shield.text) }],
        tool: ANALYSIS_TOOL,
      });
      result = mergeAnalyses(offline, sanitizeAI(shield.restore(ai), text));
    } catch (err) {
      console.warn('[analyze] AI failed, using offline engine:', err.message);
      notices.push('The AI service was not available, so we used our offline engine instead.');
    }
  }

  if (result.engine === 'offline' && language.code !== 'en') {
    notices.push(`Translation to ${language.name} needs AI mode. Showing English for now.`);
  }

  const outputLanguage = result.engine === 'claude' ? language : { code: 'en', name: 'English' };
  const asSentence = (s) => (/[.!?”"]$/.test(s) ? s : `${s}.`);
  const rewritten = [result.oneLiner, ...result.summary, ...result.actions.map((a) => a.task)].filter(Boolean).map(asSentence).join(' ');

  return {
    ...result,
    language: outputLanguage,
    level,
    readability: {
      before: readabilityReport(text),
      // Grade formulas only work for English text.
      after: outputLanguage.code === 'en' ? readabilityReport(rewritten) : null,
    },
    stats: {
      words: (text.match(/\S+/g) || []).length,
      ms: Date.now() - started,
    },
    privacy,
    notices,
  };
}
