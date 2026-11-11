// "What it says": the document rewritten as a few plain sentences.

import { h } from '../../core/dom.js';
import { card } from './card.js';

export function summaryCard(result, ctx) {
  return card(
    { title: 'What it says', iconName: 'book', ctx },
    result.summary.length
      ? h('ul', { class: 'bullets' }, result.summary.map((line) => h('li', { 'data-speak': '' }, line)))
      : h('p', { class: 'card-empty', 'data-speak': '' }, 'This text is too short to summarize. The sentence above says what it means.'),
  );
}
