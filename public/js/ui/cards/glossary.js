// "Words explained": every hard term in the document, in plain words.

import { h } from '../../core/dom.js';
import { card } from './card.js';

export function glossaryCard(result, ctx) {
  if (!result.glossary.length) return null;
  return card(
    { title: 'Words explained', iconName: 'chat', ctx },
    h('dl', { class: 'glossary' }, result.glossary.map((g) =>
      h('div', { 'data-speak': '' }, h('dt', {}, g.term), h('dd', {}, g.meaning)),
    )),
  );
}
