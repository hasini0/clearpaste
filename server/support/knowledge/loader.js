// Loads the knowledge base: one Markdown file per article, with a small
// front-matter block. Each "## " section becomes a passage — the unit we
// retrieve, cite and show to the customer.
//
// These same .md files are the "authorized content" uploaded to eGain, so
// the knowledge the agent is trained on and the one this server answers
// from can never drift apart.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ARTICLES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'articles');

function parseFrontMatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const [key, ...rest] = line.split(':');
    if (key && rest.length) meta[key.trim()] = rest.join(':').trim();
  }
  return { meta, body: raw.slice(match[0].length) };
}

function splitSections(body) {
  return body
    .split(/^## /m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [heading, ...lines] = chunk.split('\n');
      return { heading: heading.trim(), text: lines.join(' ').replace(/\s+/g, ' ').trim() };
    });
}

export function parseArticle(raw, file = '') {
  const { meta, body } = parseFrontMatter(raw);
  const id = meta.id || path.basename(file, '.md');
  const sections = splitSections(body);
  return {
    id,
    title: meta.title || id,
    intents: (meta.intents || '').split(',').map((s) => s.trim()).filter(Boolean),
    url: `/help/${id}`,
    passages: sections.map((section, i) => ({
      id: `${id}#${i + 1}`,
      articleId: id,
      articleTitle: meta.title || id,
      heading: section.heading,
      text: section.text,
    })),
  };
}

export function loadArticles(dir = ARTICLES_DIR) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => parseArticle(readFileSync(path.join(dir, file), 'utf8'), file));
}
