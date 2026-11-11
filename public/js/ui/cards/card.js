// Shared card shell: icon + title, optional "Listen" button that reads the
// card's [data-speak] elements aloud.

import { append, h, icon } from '../../core/dom.js';

export function card({ title, iconName, className = '', ctx, headingId, actions = [] }, ...body) {
  const el = h('section', { class: `card ${className}`.trim(), 'aria-labelledby': headingId || null });
  const listen = ctx?.canSpeak
    ? h('button', {
        class: 'btn btn-sm btn-ghost', type: 'button', 'aria-label': `Listen to “${title}”`,
        onclick: () => ctx.read([...el.querySelectorAll('[data-speak]')]),
      }, icon('speaker'), h('span', {}, 'Listen'))
    : null;

  // append() skips null/false children (native el.append would print "null").
  append(el, [
    h('div', { class: 'card-head' },
      h('h2', { class: 'card-title', id: headingId || null }, icon(iconName), title),
      h('div', { class: 'group', style: 'display:flex;gap:6px;flex-wrap:wrap' }, ...actions, listen),
    ),
    ...body,
  ]);
  return el;
}
