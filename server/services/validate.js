// Input validation for API requests. Throws ValidationError (→ HTTP 400).

import { config } from '../config.js';
import { findLanguage } from '../../public/js/data/languages.js';
import { textQuality } from '../engine/text.js';

export class ValidationError extends Error {}

export const LEVELS = ['simple', 'standard', 'detailed'];

export function validateDocumentRequest(body) {
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (text.length < 20) throw new ValidationError('Please paste a bit more text — at least a sentence or two.');
  const quality = textQuality(text);
  if (quality.real < 3 || quality.share < 0.4) {
    throw new ValidationError('We could not read this clearly — it looks garbled. If it was a photo, try a sharper, closer, well-lit one, or copy and paste the text instead.');
  }

  return {
    text: text.slice(0, config.maxInputChars),
    truncated: text.length > config.maxInputChars,
    level: LEVELS.includes(body.level) ? body.level : 'simple',
    language: findLanguage(body.language),
  };
}

export function validateQuestionRequest(body) {
  const doc = validateDocumentRequest(body);
  const question = typeof body?.question === 'string' ? body.question.trim().slice(0, 500) : '';
  if (question.length < 2) throw new ValidationError('Please type a question.');
  return { ...doc, question };
}
