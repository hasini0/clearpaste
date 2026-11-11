// Tiny DOM helpers. `h()` builds elements safely: strings always become
// text nodes, so document content can never inject HTML.

import { iconSvg } from '../ui/icons.js';

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props || {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of [children].flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** An inline SVG icon (trusted, bundled markup). */
export function icon(name) {
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.style.display = 'contents';
  span.innerHTML = iconSvg(name);
  return span;
}

/** Replaces every <span data-icon="name"> placeholder in the page. */
export function hydrateIcons(root = document) {
  for (const el of $$('[data-icon]', root)) {
    el.replaceWith(icon(el.dataset.icon));
  }
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
