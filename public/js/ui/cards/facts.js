// "Important details": amounts, dates, reference and phone numbers, each
// one tap to copy (or call).

import { h, icon } from '../../core/dom.js';
import { toast } from '../toast.js';
import { card } from './card.js';

const PHONE = /^\+?[\d\s().-]{7,}$/;

async function copy(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast(`Copied ${value}`);
  } catch {
    toast('Could not copy — select the text and copy it instead.');
  }
}

function factValue(fact, safeToCall) {
  if (safeToCall && PHONE.test(fact.value)) {
    return h('a', { href: `tel:${fact.value.replace(/[^\d+]/g, '')}` }, fact.value);
  }
  return fact.value; // links are never made clickable: they could be phishing
}

export function factsCard(result, ctx) {
  if (!result.keyFacts.length) return null;
  const safeToCall = result.redFlags.level === 'none';

  return card(
    { title: 'Important details', iconName: 'key', ctx },
    h('dl', { class: 'facts' }, result.keyFacts.map((fact) =>
      h('div', { class: 'fact', 'data-speak': '' },
        h('dt', {}, fact.label),
        h('dd', {}, factValue(fact, safeToCall)),
        h('button', { class: 'btn btn-ghost copy', type: 'button', 'aria-label': `Copy ${fact.label}`, onclick: () => copy(fact.value) }, icon('copy')),
      ),
    )),
  );
}
