// "Ask about this document": grounded Q&A with a supporting quote, typed
// or spoken. Spoken questions get spoken answers.

import { api } from '../../core/api.js';
import { append, h, icon } from '../../core/dom.js';
import { canDictate, dictate } from '../../features/dictation.js';
import { card } from './card.js';

const SUGGESTIONS = {
  'Suspicious message': ['Is this real?', 'How do I report this?', 'What if I already paid?'],
  'Medicine leaflet': ['Can I drink alcohol with this?', 'What if I miss a dose?', 'When should I see a doctor?'],
  default: ['When is the deadline?', 'How much do I have to pay?', 'Who should I contact?', 'What happens if I ignore this?'],
};

export function askCard(result, ctx) {
  const answers = h('div', { class: 'answers', 'aria-live': 'polite' });
  const input = h('input', {
    class: 'ask-input', type: 'text', id: 'ask-input', autocomplete: 'off',
    placeholder: 'Ask anything, e.g. “Can I pay in parts?”', 'aria-label': 'Your question about this document',
  });
  let spoken = false;

  async function ask(question) {
    question = question.trim();
    if (!question) return;
    input.value = '';
    const pending = h('div', { class: 'qa-a' }, 'Thinking…');
    const qa = h('div', { class: 'qa' }, h('div', { class: 'qa-q' }, question), pending);
    answers.prepend(qa);

    try {
      const res = await api.ask({ text: ctx.text, question, level: ctx.level, language: ctx.languageCode });
      const answer = h('p', { 'data-speak': '' }, res.answer);
      pending.replaceChildren();
      append(pending, [answer, res.quote && h('blockquote', {}, `“${res.quote}”`)]);
      pending.classList.toggle('is-missing', !res.found);
      if (spoken && ctx.canSpeak) ctx.read([answer]);
    } catch (err) {
      pending.textContent = err.message;
      pending.classList.add('is-missing');
    } finally {
      spoken = false;
    }
  }

  let stopListening = null;
  const mic = canDictate
    ? h('button', {
        class: 'btn btn-icon mic', type: 'button', 'aria-label': 'Ask with your voice', 'aria-pressed': 'false',
        onclick: () => {
          if (stopListening) return stopListening();
          mic.classList.add('is-listening');
          mic.setAttribute('aria-pressed', 'true');
          stopListening = dictate({
            lang: ctx.speechLang,
            onText: (text, isFinal) => {
              input.value = text;
              if (isFinal) { spoken = true; ask(text); }
            },
            onEnd: () => {
              stopListening = null;
              mic.classList.remove('is-listening');
              mic.setAttribute('aria-pressed', 'false');
            },
          });
        },
      }, icon('mic'))
    : null;

  const form = h('form', { class: 'ask-form', onsubmit: (e) => { e.preventDefault(); ask(input.value); } },
    input, mic,
    h('button', { class: 'btn btn-primary btn-icon', type: 'submit', 'aria-label': 'Ask' }, icon('send')),
  );

  const suggestions = SUGGESTIONS[result.docType] || SUGGESTIONS.default;
  return card(
    { title: 'Ask about this document', iconName: 'chat', className: 'ask-card', ctx },
    form,
    // Suggestions are English; with AI on, answers come back in the chosen language.
    h('div', { class: 'suggestions' }, suggestions.map((q) => h('button', { class: 'suggestion', type: 'button', onclick: () => ask(q) }, q))),
    answers,
  );
}
