// Footer line: which engine explained it and what happened to private data.

import { h, icon } from '../../core/dom.js';

const KIND_NAMES = { SSN: 'Social Security', CARD: 'card', DOB: 'birth date', BANK: 'bank account' };

export function metaRow(result) {
  const { privacy, stats, engine } = result;
  const privacyText = privacy.mode === 'local'
    ? 'Processed on this server only — nothing was sent to an AI service'
    : privacy.hidden
      ? `${privacy.hidden} private number${privacy.hidden > 1 ? 's' : ''} (${privacy.kinds.map((k) => KIND_NAMES[k]).join(', ')}) hidden before the AI saw it`
      : 'No private numbers found to hide';

  return h('div', { class: 'meta-row' },
    h('span', {}, icon(engine === 'claude' ? 'sparkle' : 'cpu'), engine === 'claude' ? 'Explained by Claude AI, fact-checked by our rules engine' : 'Explained by the ClearPaste offline engine'),
    h('span', {}, icon('shield'), privacyText),
    h('span', {}, icon('clock'), `${stats.words} words in ${(stats.ms / 1000).toFixed(1)}s`),
  );
}
