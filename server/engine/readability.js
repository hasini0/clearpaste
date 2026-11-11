// Flesch–Kincaid grade level: the standard U.S. readability formula.
// grade = 0.39 × (words / sentences) + 11.8 × (syllables / words) − 15.59

import { splitSentences, tokenize } from './text.js';

export function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, '').replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function gradeLevel(text) {
  const sentences = splitSentences(text);
  const words = tokenize(text);
  if (words.length < 5 || sentences.length === 0) return null;

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const grade = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;
  return Math.round(Math.min(20, Math.max(1, grade)) * 10) / 10;
}

export function describeGrade(grade) {
  if (grade == null) return 'Unknown';
  if (grade <= 5) return 'Very easy';
  if (grade <= 8) return 'Easy';
  if (grade <= 10) return 'Fairly hard';
  if (grade <= 12) return 'Hard';
  if (grade <= 16) return 'College level';
  return 'Expert level';
}

export function readabilityReport(text) {
  const grade = gradeLevel(text);
  return { grade, label: describeGrade(grade) };
}
