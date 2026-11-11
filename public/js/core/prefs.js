// Reader preferences: stored per browser, applied as data-* attributes on
// <html> so CSS (css/modes.css) does all the visual work.

import { LANGUAGES } from '../data/languages.js';

const STORAGE_KEY = 'clearpaste.prefs.v1';

function guessLanguage() {
  const code = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGUAGES.some((l) => l.code === code) ? code : 'en';
}

export const DEFAULTS = Object.freeze({
  theme: 'auto', // auto | light | dark
  textSize: 'normal', // normal | large | larger | largest
  font: 'default', // default | lexend
  spacing: 'normal', // normal | wide
  contrast: 'normal', // normal | high
  motion: 'auto', // auto | reduce
  ruler: false,
  rate: 1,
  level: 'simple',
  language: guessLanguage(),
});

const listeners = new Set();
let prefs = load();

function load() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* private mode: ignore */ }
}

export function applyPrefs() {
  const root = document.documentElement;
  if (prefs.theme === 'auto') root.removeAttribute('data-theme');
  else root.dataset.theme = prefs.theme;
  root.dataset.textSize = prefs.textSize;
  root.dataset.font = prefs.font;
  root.dataset.spacing = prefs.spacing;
  root.dataset.contrast = prefs.contrast;
  root.dataset.motion = prefs.motion;
}

export const getPrefs = () => prefs;

export function setPref(key, value) {
  if (prefs[key] === value) return;
  prefs = { ...prefs, [key]: value };
  save();
  applyPrefs();
  listeners.forEach((fn) => fn(prefs, key));
}

export function onPrefsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
