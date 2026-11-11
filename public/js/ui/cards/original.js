// "Your original document" with every hard term tappable for a plain
// explanation (works with mouse, touch, and keyboard).

import { h } from '../../core/dom.js';
import { card } from './card.js';

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let openPopover = null;

function closePopover() {
  if (!openPopover) return;
  openPopover.button.setAttribute('aria-expanded', 'false');
  openPopover.el.remove();
  openPopover = null;
}

function showPopover(button, term, meaning) {
  const wasOpen = openPopover?.button === button;
  closePopover();
  if (wasOpen) return;

  const id = `pop-${Math.random().toString(36).slice(2, 8)}`;
  const el = h('div', { class: 'popover', id, role: 'tooltip' }, h('strong', {}, term), meaning);
  document.body.append(el);
  const rect = button.getBoundingClientRect();
  const left = Math.min(window.scrollX + rect.left, window.scrollX + document.documentElement.clientWidth - el.offsetWidth - 16);
  el.style.left = `${Math.max(16, left)}px`;
  el.style.top = `${window.scrollY + rect.bottom + 8}px`;
  button.setAttribute('aria-expanded', 'true');
  button.setAttribute('aria-describedby', id);
  openPopover = { button, el };
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopover(); });
document.addEventListener('click', (e) => { if (!e.target.closest?.('.term, .popover')) closePopover(); });
window.addEventListener('resize', closePopover);

function highlight(text, glossary) {
  if (!glossary.length) return [text];
  const meanings = new Map(glossary.map((g) => [g.term.toLowerCase(), g]));
  const terms = [...meanings.keys()].sort((a, b) => b.length - a.length).map(escapeRe);
  const regex = new RegExp(`(${terms.join('|')})`, 'gi');

  const parts = [];
  let last = 0;
  for (const match of text.matchAll(regex)) {
    const entry = meanings.get(match[0].toLowerCase());
    if (!entry) continue;
    parts.push(text.slice(last, match.index));
    parts.push(h('button', {
      class: 'term', type: 'button', 'aria-expanded': 'false',
      onclick: (e) => { e.stopPropagation(); showPopover(e.currentTarget, entry.term, entry.meaning); },
    }, match[0]));
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

export function originalCard(text, result) {
  return card(
    { title: 'Your original document', iconName: 'doc', className: 'original-card' },
    result.glossary.length ? h('p', { class: 'meter-note', style: 'margin-bottom:12px' }, 'Tap any highlighted word to see what it means.') : null,
    h('div', { class: 'original', tabindex: '0', 'aria-label': 'Original document text' }, highlight(text, result.glossary)),
  );
}
