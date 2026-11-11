// Entry point: wires the page together. No framework, no build step.

import { explainDocument, explainImage, explainText, readEverything, reExplain, speaker, startOver } from './app/controller.js';
import { api } from './core/api.js';
import { $, $$, h, hydrateIcons, icon } from './core/dom.js';
import { applyPrefs, getPrefs, onPrefsChange, setPref } from './core/prefs.js';
import { LANGUAGES } from './data/languages.js';
import { SAMPLES } from './data/samples.js';
import { setupInput } from './features/input.js';
import { setRuler } from './features/ruler.js';
import { setupPrefsDialog } from './ui/prefsDialog.js';
import { showView } from './ui/views.js';

function setupOptions() {
  const select = $('#language');
  select.replaceChildren(...LANGUAGES.map((l) =>
    h('option', { value: l.code }, l.native === l.name ? l.name : `${l.native} — ${l.name}`)));

  const prefs = getPrefs();
  select.value = prefs.language;
  $(`#level-${prefs.level}`).checked = true;

  select.addEventListener('change', () => { setPref('language', select.value); reExplain(); });
  $$('input[name="level"]').forEach((radio) =>
    radio.addEventListener('change', () => { setPref('level', radio.value); reExplain(); }));
}

function setupSamples() {
  $('#sample-list').replaceChildren(...SAMPLES.map((sample) =>
    h('li', {}, h('button', { class: 'chip', type: 'button', onclick: () => explainText(sample.text) },
      h('span', { class: 'chip-icon' }, icon(sample.icon)), sample.label))));
}

async function setupEngineBadge() {
  const badge = $('#engine-badge');
  try {
    const { ai } = await api.health();
    badge.className = `badge ${ai ? 'badge-ai' : 'badge-offline'}`;
    badge.textContent = ai ? 'AI on · 30 languages' : 'Offline engine';
    badge.title = ai ? 'Explanations by Claude, checked by our rules engine' : 'Running without AI. Add an API key to enable translation.';
  } catch {
    badge.textContent = 'Server offline';
  }
}

function setupChrome() {
  // Show ⌘ instead of Ctrl on Apple devices.
  if (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) {
    $$('[data-mod]').forEach((el) => { el.textContent = '⌘'; });
  }

  const header = $('#site-header');
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 4), { passive: true });

  $('#btn-new').addEventListener('click', startOver);
  $('#btn-read-all').addEventListener('click', readEverything);
  $('#btn-print').addEventListener('click', () => window.print());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && speaker.state !== 'idle') speaker.stop();
  });
}

function init() {
  applyPrefs();
  hydrateIcons();
  setupOptions();
  setupSamples();
  setupChrome();
  setupPrefsDialog();
  setupInput({ onText: explainText, onImage: explainImage, onDocument: explainDocument });
  setupEngineBadge();

  setRuler(getPrefs().ruler);
  onPrefsChange((prefs, key) => { if (key === 'ruler') setRuler(prefs.ruler); });

  showView('input');
}

init();
