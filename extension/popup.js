// Popup: grabs the selected text (or the page's main text) from the active
// tab and explains it with the ClearPaste server.

const DEFAULT_SERVER = 'http://localhost:3000';
const out = document.getElementById('out');
const serverInput = document.getElementById('server');
const levelSelect = document.getElementById('level');

const el = (tag, props = {}, ...children) => {
  const node = Object.assign(document.createElement(tag), props);
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
};

function show(...nodes) {
  out.replaceChildren(...nodes.flat().filter(Boolean));
}

async function grabText() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selected = String(window.getSelection() || '').trim();
      if (selected.length > 20) return { text: selected, scope: 'selection' };
      const main = document.querySelector('main, article, [role="main"]') || document.body;
      return { text: main.innerText.slice(0, 20000), scope: 'page' };
    },
  });
  return result;
}

function render(r, scope) {
  const danger = r.redFlags.level === 'danger';
  show(
    danger && el('div', { className: 'scam' }, el('strong', {}, 'Warning: this looks like a scam. '), r.redFlags.reasons[0] || ''),
    r.redFlags.level === 'caution' && el('div', { className: 'warn' }, r.redFlags.reasons[0] || 'Double-check this before you act.'),
    el('h2', {}, scope === 'selection' ? 'Your selection, in one sentence' : 'This page, in one sentence'),
    el('p', { className: 'one' }, r.oneLiner),
    r.actions.length && el('h2', {}, danger ? 'Stay safe' : 'What you need to do'),
    r.actions.length && el('ul', {}, r.actions.slice(0, 4).map((a) =>
      el('li', { className: 'task' }, a.task, a.deadlineText && el('span', { className: 'due' }, `Deadline: ${a.deadlineText}`)))),
    r.summary.length && el('h2', {}, 'What it says'),
    r.summary.length && el('ul', {}, r.summary.map((s) => el('li', {}, s))),
    el('button', { onclick: () => speechSynthesis.speak(new SpeechSynthesisUtterance([r.oneLiner, ...r.summary].join(' '))) }, '🔊 Read it to me'),
  );
}

async function run() {
  const { server = DEFAULT_SERVER, level = 'simple', language = 'en' } = await chrome.storage.local.get(['server', 'level', 'language']);
  serverInput.value = server;
  levelSelect.value = level;
  show(el('p', { className: 'muted' }, 'Reading the page…'));

  try {
    const { text, scope } = await grabText();
    if (!text || text.trim().length < 20) {
      return show(el('p', { className: 'muted' }, 'Select some text on the page first, then click ClearPaste again.'));
    }
    const response = await fetch(`${server.replace(/\/$/, '')}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, level, language }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Something went wrong.');
    render(data, scope);
  } catch (err) {
    show(el('p', { className: 'muted' }, err.message.includes('fetch')
      ? `Could not reach the ClearPaste server at ${server}. Is it running?`
      : err.message));
  }
}

serverInput.addEventListener('change', async () => { await chrome.storage.local.set({ server: serverInput.value }); run(); });
levelSelect.addEventListener('change', async () => { await chrome.storage.local.set({ level: levelSelect.value }); run(); });

run();
