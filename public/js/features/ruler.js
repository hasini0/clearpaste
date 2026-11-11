// Reading ruler: dims everything except a band around the line you are
// reading. Follows the mouse, touch, and keyboard focus.

import { $ } from '../core/dom.js';

let active = false;

function moveTo(y) {
  $('#reading-ruler').style.top = `${y}px`;
}

const onPointer = (e) => moveTo(e.clientY);
const onFocus = (e) => {
  const rect = e.target.getBoundingClientRect?.();
  if (rect) moveTo(rect.top + rect.height / 2);
};

export function setRuler(enabled) {
  if (enabled === active) return;
  active = enabled;
  const ruler = $('#reading-ruler');
  ruler.hidden = !enabled;
  const method = enabled ? 'addEventListener' : 'removeEventListener';
  window[method]('pointermove', onPointer, { passive: true });
  document[method]('focusin', onFocus);
  if (enabled) moveTo(window.innerHeight / 2);
}
