// Floating "Reading aloud" control with pause/resume/stop.

import { $, h, icon } from '../core/dom.js';

export function renderSpeakBar(speaker, state) {
  const bar = $('#speak-bar');
  bar.hidden = state === 'idle';
  if (state === 'idle') return bar.replaceChildren();

  const paused = state === 'paused';
  bar.replaceChildren(
    h('span', { class: 'eq', 'aria-hidden': 'true', style: paused ? 'opacity:.4' : null }, h('i'), h('i'), h('i')),
    h('span', {}, paused ? 'Paused' : 'Reading aloud'),
    h('button', {
      class: 'btn btn-sm',
      type: 'button',
      onclick: () => (paused ? speaker.resume() : speaker.pause()),
    }, icon(paused ? 'play' : 'pause'), paused ? 'Resume' : 'Pause'),
    h('button', { class: 'btn btn-sm', type: 'button', onclick: () => speaker.stop(), 'aria-keyshortcuts': 'Escape' }, icon('stop'), 'Stop'),
  );
}
