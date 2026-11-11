// "In one sentence": the single most important thing to know.

import { h } from '../../core/dom.js';
import { card } from './card.js';

export function heroCard(result, ctx) {
  const label = result.title && result.title !== result.docType ? `${result.docType} · ${result.title}` : result.docType;
  return card(
    { title: 'In one sentence', iconName: 'sparkle', className: 'hero-card', ctx, headingId: 'result-title' },
    h('span', { class: 'doc-type' }, label),
    h('p', { class: 'one-liner', 'data-speak': '' }, result.oneLiner),
  );
}
