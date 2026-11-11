// Scam / caution banner and service notices.

import { h, icon } from '../../core/dom.js';

export function redFlagsAlert(result) {
  const { level, reasons, advice = [], crossChecked } = result.redFlags;
  if (level === 'none') return null;

  const danger = level === 'danger';
  return h('section', { class: `alert alert-${danger ? 'danger' : 'caution'}`, role: 'alert' },
    h('h2', {}, icon(danger ? 'alert' : 'info'), danger ? 'Warning: this looks like a scam' : 'Double-check this before you act'),
    reasons.length && h('ul', {}, reasons.map((r) => h('li', { 'data-speak': '' }, r))),
    advice.length && h('p', { class: 'advice', 'data-speak': '' }, advice.join(' ')),
    crossChecked && h('span', { class: 'verified' }, icon('shield'), 'Flagged by both the AI and our rule-based scam detector'),
  );
}

export function noticesAlert(result) {
  if (!result.notices?.length) return null;
  return h('div', { class: 'alert alert-info', role: 'status' }, result.notices.map((n) => h('p', {}, n)));
}
