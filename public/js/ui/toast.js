// Short, screen-reader-announced messages.

import { $, h } from '../core/dom.js';

export function toast(message, { error = false, duration = 4200 } = {}) {
  const el = h('div', { class: `toast${error ? ' is-error' : ''}`, role: error ? 'alert' : null }, message);
  $('#toast-region').append(el);
  setTimeout(() => el.remove(), duration);
}
