// BM25 retrieval over knowledge passages, with synonym expansion.
// Returns ranked passages plus a 0–1 confidence so the conversation layer
// can tell a real answer from a knowledge gap.

import { contentWords, stem } from '../../engine/text.js';
import { loadArticles } from './loader.js';
import { SYNONYM_GROUPS } from './synonyms.js';

const K1 = 1.4;
const B = 0.75;
const HEADING_BOOST = 2; // words in a section heading count double

const SYNONYMS = new Map();
for (const group of SYNONYM_GROUPS) {
  const stems = group.map(stem);
  for (const s of stems) SYNONYMS.set(s, new Set([...(SYNONYMS.get(s) || []), ...stems]));
}

function termsOf(passage) {
  const heading = contentWords(passage.heading);
  return [...Array(HEADING_BOOST).fill(heading).flat(), ...contentWords(passage.articleTitle), ...contentWords(passage.text)];
}

export function buildIndex(articles = loadArticles()) {
  const passages = articles.flatMap((a) => a.passages);
  const docs = passages.map((p) => {
    const terms = termsOf(p);
    const tf = new Map();
    for (const t of terms) tf.set(t, (tf.get(t) || 0) + 1);
    return { passage: p, tf, length: terms.length };
  });
  const df = new Map();
  for (const d of docs) for (const t of d.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const avgLength = docs.reduce((s, d) => s + d.length, 0) / Math.max(1, docs.length);
  return { articles, passages, docs, df, avgLength, byId: new Map(passages.map((p) => [p.id, p])) };
}

function idf(index, term) {
  const n = index.df.get(term) || 0;
  return Math.log(1 + (index.docs.length - n + 0.5) / (n + 0.5));
}

function expandQuery(query) {
  const exact = contentWords(query);
  const weights = new Map();
  for (const t of exact) weights.set(t, 1);
  for (const t of exact) {
    for (const syn of SYNONYMS.get(t) || []) if (!weights.has(syn)) weights.set(syn, 0.6);
  }
  return weights;
}

/**
 * @returns {{ results: Array<{passage, score}>, confidence: number, matchedTerms: string[] }}
 */
export function search(index, query, { limit = 4, preferArticles = [] } = {}) {
  const weights = expandQuery(query);
  const matched = new Set();
  const scored = index.docs.map((doc) => {
    let score = 0;
    for (const [term, weight] of weights) {
      const f = doc.tf.get(term);
      if (!f) continue;
      matched.add(term);
      score += weight * idf(index, term) * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * doc.length) / index.avgLength)));
    }
    if (score > 0 && preferArticles.includes(doc.passage.articleId)) score *= 1.35;
    return { passage: doc.passage, score };
  });

  const results = scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
  const asked = [...weights.entries()].filter(([, w]) => w === 1).map(([t]) => t);
  const coverage = asked.length ? asked.filter((t) => matched.has(t)).length / asked.length : 0;
  const top = results[0]?.score || 0;
  // Confidence blends how strong the best match is with how much of the
  // question it explains. Tuned so off-topic questions land below 0.35.
  const confidence = Math.min(1, (top / 9) * 0.6 + coverage * 0.4);
  return { results, confidence: Number(confidence.toFixed(2)), matchedTerms: [...matched] };
}
