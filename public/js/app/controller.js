// Application flow: text or image in → loading → result. Also re-explains
// the same document when the reading level or language changes.

import { api } from '../core/api.js';
import { $, wait } from '../core/dom.js';
import { getPrefs } from '../core/prefs.js';
import { findLanguage } from '../data/languages.js';
import { fileKind, readDocument } from '../features/documents.js';
import { recognizeText } from '../features/ocr.js';
import { canSpeak, Speaker } from '../features/speech.js';
import { todayISO } from '../ui/format.js';
import { startLoading } from '../ui/loading.js';
import { renderResult } from '../ui/result.js';
import { renderSpeakBar } from '../ui/speakBar.js';
import { toast } from '../ui/toast.js';
import { currentView, showView } from '../ui/views.js';

const MIN_LOADING_MS = 1400; // long enough to read the steps, short enough not to annoy

const state = { text: '', result: null, busy: false };

export const speaker = new Speaker({ onChange: (s) => renderSpeakBar(speaker, s) });

function options() {
  const { level, language } = getPrefs();
  return { level, language };
}

function readAloud(elements) {
  const lang = findLanguage(state.result?.language?.code || 'en');
  speaker.speak(elements, { lang: lang.speech, rate: getPrefs().rate });
}

export function readEverything() {
  if (!canSpeak) return toast('Read-aloud is not supported in this browser.');
  readAloud([...document.querySelectorAll('#result [data-speak]')].filter((el) => !el.closest('.answers')));
}

export async function explainText(text) {
  if (state.busy) return;
  state.busy = true;
  speaker.stop();
  const previousView = currentView();
  showView('loading');
  const loading = startLoading();
  loading.beginAnalysis();

  try {
    const [result] = await Promise.all([api.analyze({ text, ...options() }), wait(MIN_LOADING_MS)]);
    loading.stop();
    state.text = text;
    state.result = result;
    const language = findLanguage(result.language.code);
    renderResult({ ...result, language: { ...language, ...result.language } }, {
      text,
      today: todayISO(),
      lang: result.language.code,
      speechLang: language.speech,
      level: result.level,
      languageCode: options().language,
      canSpeak,
      read: readAloud,
    });
    showView('result', { focus: '#result-title' });
    document.title = `${result.docType} explained · ClearPaste`;
  } catch (err) {
    loading.stop();
    toast(err.message, { error: true });
    showView(previousView === 'result' ? 'result' : 'input');
  } finally {
    state.busy = false;
  }
}

export async function explainImage(file) {
  if (state.busy) return;
  speaker.stop();
  showView('loading');
  const loading = startLoading({ title: 'Reading the words in your image…', ocr: true });
  try {
    const { text, confidence } = await recognizeText(file, (p, label) => loading.setProgress(p, label));
    if (text.replace(/\W/g, '').length < 20 || confidence < 45) {
      throw new Error('We could not read the text in that image clearly. Try a sharper, closer photo with good light, or copy and paste the text instead.');
    }
    loading.stop();
    await explainText(text);
  } catch (err) {
    loading.stop();
    toast(err.message, { error: true });
    showView('input');
  }
}

/** PDFs, Word documents and text files: extract text in the browser. */
export async function explainDocument(file) {
  if (state.busy) return;
  speaker.stop();
  showView('loading');
  const label = { pdf: 'PDF', docx: 'Word document' }[fileKind(file)] || 'file';
  const loading = startLoading({ title: `Opening your ${label}…`, ocr: true });
  try {
    const text = await readDocument(file, (p, step) => loading.setProgress(p, step));
    if (text.replace(/\W/g, '').length < 20) throw new Error(`We could not find any text in that ${label}. Try a photo of it instead, or copy and paste the text.`);
    loading.stop();
    await explainText(text);
  } catch (err) {
    loading.stop();
    toast(err.message, { error: true });
    showView('input');
  }
}

/** Called when the reading level or language changes. */
export function reExplain() {
  if (currentView() === 'result' && state.text) explainText(state.text);
}

export function startOver() {
  speaker.stop();
  state.text = '';
  state.result = null;
  document.title = 'ClearPaste';
  $('#manual-text').value = '';
  showView('input', { focus: '#paste-zone' });
}
