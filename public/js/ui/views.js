// Switches between the input, loading and result views, moving the shared
// options bar into the right slot and managing keyboard focus.

import { $, $$ } from '../core/dom.js';

let current = 'input';

export const currentView = () => current;

export function showView(name, { focus } = {}) {
  current = name;
  for (const view of $$('main > .view')) view.hidden = view.id !== `view-${name}`;

  const slot = $(`[data-options-slot="${name}"]`);
  const options = $('#options');
  options.hidden = !slot;
  if (slot && options.parentElement !== slot) slot.append(options);

  window.scrollTo({ top: 0 });
  if (focus) $(focus)?.focus({ preventScroll: true });
}
