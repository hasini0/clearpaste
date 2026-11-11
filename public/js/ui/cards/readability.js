// "Reading level": proof that the rewrite is easier, measured with the
// Flesch–Kincaid grade formula (computed on the server, not by the AI).

import { h } from '../../core/dom.js';
import { card } from './card.js';

const MAX_GRADE = 18;

function meterRow(label, report, tone) {
  const fill = h('div', { class: `meter-fill ${tone}` });
  // Animate from 0 → value after insertion.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    fill.style.width = `${Math.min(100, (report.grade / MAX_GRADE) * 100)}%`;
  }));
  return h('div', { class: 'meter-row' },
    h('span', { class: 'meter-label' }, label),
    h('div', { class: 'meter-track', role: 'img', 'aria-label': `${label}: grade ${report.grade}, ${report.label}` }, fill),
    h('span', { class: 'meter-value' }, `Grade ${Math.round(report.grade)}`),
  );
}

export function readabilityCard(result, ctx) {
  const { before, after } = result.readability;
  if (!before?.grade) return null;

  const improved = after?.grade != null && after.grade < before.grade;
  const headline = improved
    ? h('p', { 'data-speak': '' },
        h('span', { class: 'big-stat' }, `${Math.round(before.grade - after.grade)} grades`),
        h('br'),
        h('span', { class: 'meter-note' }, `easier to read than the original (${before.label.toLowerCase()} → ${after.label.toLowerCase()}).`))
    : h('p', { class: 'meter-note', 'data-speak': '' },
        after == null
          ? `The original reads at grade ${Math.round(before.grade)} (${before.label.toLowerCase()}). We rewrote it in ${ctx.result.language.name}.`
          : `The original reads at grade ${Math.round(before.grade)} (${before.label.toLowerCase()}).`);

  return card(
    { title: 'Reading level', iconName: 'gauge', ctx },
    h('div', { class: 'meter' },
      headline,
      meterRow('Original', before, 'is-before'),
      after?.grade != null && meterRow('Clear', after, 'is-after'),
      h('p', { class: 'meter-note' }, 'Health and government writing guides recommend grade 8 or lower for the public.'),
    ),
  );
}
