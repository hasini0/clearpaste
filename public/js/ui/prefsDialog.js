// "Reading settings" dialog. Every control applies instantly.

import { $, h, icon } from '../core/dom.js';
import { getPrefs, setPref } from '../core/prefs.js';

function segmented(name, label, options, value, onPick) {
  return h('div', { class: 'segmented', role: 'radiogroup', 'aria-label': label },
    options.map(([val, text, aria]) => [
      h('input', {
        type: 'radio', name, id: `${name}-${val}`, value: val, checked: val === value,
        onchange: () => onPick(val),
      }),
      h('label', { for: `${name}-${val}`, 'aria-label': aria || null }, text),
    ]),
  );
}

function toggle(id, title, description, checked, onToggle) {
  return h('div', { class: 'pref' },
    h('label', { class: 'pref-text', for: id }, h('strong', {}, title), h('span', {}, description)),
    h('input', { class: 'switch', type: 'checkbox', role: 'switch', id, checked, onchange: (e) => onToggle(e.target.checked) }),
  );
}

function row(title, description, control) {
  return h('div', { class: 'pref' },
    h('div', { class: 'pref-text' }, h('strong', {}, title), h('span', {}, description)),
    control,
  );
}

export function setupPrefsDialog() {
  const dialog = $('#prefs-dialog');

  const render = () => {
    const p = getPrefs();
    dialog.replaceChildren(
      h('div', { class: 'dialog-head' },
        h('h2', { id: 'prefs-title' }, 'Reading settings'),
        h('button', { class: 'btn btn-ghost btn-icon', type: 'button', 'aria-label': 'Close settings', onclick: () => dialog.close() }, icon('x')),
      ),
      h('div', { class: 'dialog-body' },
        row('Text size', 'Make all text bigger.',
          segmented('textSize', 'Text size', [
            ['normal', 'A', 'Normal'], ['large', 'A+', 'Large'], ['larger', 'A++', 'Larger'], ['largest', 'A+++', 'Largest'],
          ], p.textSize, (v) => setPref('textSize', v))),
        row('Colors', 'Light, dark, or match your device.',
          segmented('theme', 'Color theme', [['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], p.theme, (v) => setPref('theme', v))),
        toggle('pref-contrast', 'High contrast', 'Pure black and white with strong outlines.', p.contrast === 'high',
          (on) => setPref('contrast', on ? 'high' : 'normal')),
        toggle('pref-font', 'Dyslexia-friendly font', 'Lexend — a typeface designed to make reading easier.', p.font === 'lexend',
          (on) => setPref('font', on ? 'lexend' : 'default')),
        toggle('pref-spacing', 'Extra spacing', 'More space between letters, words and lines.', p.spacing === 'wide',
          (on) => setPref('spacing', on ? 'wide' : 'normal')),
        toggle('pref-ruler', 'Reading ruler', 'Highlights one line at a time to help you keep your place.', p.ruler,
          (on) => setPref('ruler', on)),
        toggle('pref-motion', 'Reduce motion', 'Turn off animations.', p.motion === 'reduce',
          (on) => setPref('motion', on ? 'reduce' : 'auto')),
        row('Voice speed', 'How fast “Read it to me” talks.',
          h('input', {
            class: 'range', type: 'range', min: '0.6', max: '1.4', step: '0.1', value: String(p.rate),
            'aria-label': 'Voice speed', oninput: (e) => setPref('rate', Number(e.target.value)),
          })),
      ),
    );
  };

  $('#open-prefs').addEventListener('click', () => {
    render();
    dialog.showModal();
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); }); // backdrop click
}
