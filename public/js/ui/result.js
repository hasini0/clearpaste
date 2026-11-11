// Assembles the result page from the individual cards.

import { $, h } from '../core/dom.js';
import { actionsCard } from './cards/actions.js';
import { noticesAlert, redFlagsAlert } from './cards/alerts.js';
import { askCard } from './cards/ask.js';
import { factsCard } from './cards/facts.js';
import { glossaryCard } from './cards/glossary.js';
import { heroCard } from './cards/hero.js';
import { metaRow } from './cards/meta.js';
import { originalCard } from './cards/original.js';
import { readabilityCard } from './cards/readability.js';
import { summaryCard } from './cards/summary.js';

/**
 * @param {object} result  response from /api/analyze
 * @param {object} ctx     { text, today, lang, speechLang, level, languageCode, canSpeak, read() }
 */
export function renderResult(result, ctx) {
  const root = $('#result');
  root.lang = result.language.code;
  root.dir = result.language.rtl ? 'rtl' : 'ltr';

  const fullCtx = { ...ctx, result };

  root.replaceChildren(
    h('div', { style: 'display:grid;gap:20px' },
      noticesAlert(result),
      redFlagsAlert(result),
      h('div', { class: 'result-grid' },
        h('div', { class: 'result-main' },
          heroCard(result, fullCtx),
          actionsCard(result, fullCtx),
          summaryCard(result, fullCtx),
          askCard(result, fullCtx),
        ),
        h('div', { class: 'result-side' },
          readabilityCard(result, fullCtx),
          factsCard(result, fullCtx),
        ),
      ),
      // Glossary sits beside the original, where its words are highlighted.
      h('div', { class: 'result-grid' },
        // The original keeps its own language and direction.
        h('div', { class: 'result-main', lang: '', dir: 'auto' }, originalCard(ctx.text, result)),
        h('div', { class: 'result-side' }, glossaryCard(result, fullCtx)),
      ),
      metaRow(result),
    ),
  );
}
