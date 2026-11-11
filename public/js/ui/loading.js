// Loading view: shows the pipeline steps as they happen, so waiting feels
// purposeful (and screen readers hear what's going on).

import { $, h } from '../core/dom.js';

const ANALYSIS_STEPS = [
  'Reading the text',
  'Hiding private numbers',
  'Finding dates, amounts and contacts',
  'Checking for scam warning signs',
  'Rewriting it in plain words',
];

export function startLoading({ title = 'Reading your document…', ocr = false } = {}) {
  const list = $('#loading-steps');
  const progress = $('#ocr-progress');
  $('#loading-title').textContent = title;
  progress.hidden = !ocr;
  progress.firstElementChild.style.width = '0%';

  const items = ANALYSIS_STEPS.map((label) => h('li', {}, label));
  list.replaceChildren(...items);
  list.hidden = ocr;

  let step = 0;
  const mark = () => items.forEach((li, i) => {
    li.className = i < step ? 'is-done' : i === step ? 'is-active' : '';
  });
  let timer = null;

  return {
    /** OCR phase → analysis phase */
    beginAnalysis() {
      $('#loading-title').textContent = 'Reading your document…';
      progress.hidden = true;
      list.hidden = false;
      step = 0;
      mark();
      timer = setInterval(() => {
        if (step < items.length - 1) { step++; mark(); }
      }, 650);
    },
    setProgress(fraction, label) {
      progress.firstElementChild.style.width = `${Math.round(fraction * 100)}%`;
      if (label) $('#loading-title').textContent = `${label}…`;
    },
    stop() {
      clearInterval(timer);
      step = items.length;
      mark();
    },
  };
}
