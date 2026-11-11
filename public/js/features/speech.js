// Read-aloud with word-by-word highlighting (Web Speech API).
// Each element is wrapped into word <span>s once; the speech engine's
// "boundary" events tell us which word is being spoken.

const synth = window.speechSynthesis;
export const canSpeak = Boolean(synth && window.SpeechSynthesisUtterance);

function wrapWords(el) {
  if (el.dataset.wrapped) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  let offset = 0;
  for (const node of nodes) {
    const parts = node.textContent.split(/(\s+)/);
    const fragment = document.createDocumentFragment();
    for (const part of parts) {
      if (part && !/^\s+$/.test(part)) {
        const span = document.createElement('span');
        span.className = 'w';
        span.dataset.start = offset;
        span.dataset.end = offset + part.length;
        span.textContent = part;
        fragment.append(span);
      } else if (part) {
        fragment.append(part);
      }
      offset += part.length;
    }
    node.replaceWith(fragment);
  }
  el.dataset.wrapped = 'true';
}

function pickVoice(lang) {
  const voices = synth.getVoices();
  const base = lang.split('-')[0];
  return (
    voices.find((v) => v.lang === lang && /natural|premium|enhanced|google/i.test(v.name)) ||
    voices.find((v) => v.lang === lang) ||
    voices.find((v) => v.lang.startsWith(base)) ||
    null
  );
}

export class Speaker {
  constructor({ onChange = () => {} } = {}) {
    this.onChange = onChange;
    this.queue = [];
    this.current = null;
    this.state = 'idle'; // idle | speaking | paused
    this.session = 0;
    if (canSpeak) synth.getVoices(); // warm up the voice list
  }

  speak(elements, { lang = 'en-US', rate = 1 } = {}) {
    if (!canSpeak) return;
    this.stop();
    this.session += 1;
    this.queue = elements.filter((el) => el.textContent.trim());
    this.options = { lang, rate };
    this.#next(this.session);
  }

  #next(session) {
    if (session !== this.session) return;
    this.#clearHighlight();
    const el = this.queue.shift();
    if (!el) return this.#setState('idle');

    wrapWords(el);
    this.current = el;
    el.classList.add('speaking-block');
    el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

    const words = [...el.querySelectorAll('.w')];
    const utterance = new SpeechSynthesisUtterance(el.textContent);
    utterance.lang = this.options.lang;
    utterance.rate = this.options.rate;
    const voice = pickVoice(this.options.lang);
    if (voice) utterance.voice = voice;

    utterance.onboundary = (event) => {
      if (event.name && event.name !== 'word') return;
      const i = event.charIndex;
      words.forEach((w) => w.classList.toggle('is-spoken', +w.dataset.start <= i && i < +w.dataset.end));
    };
    utterance.onend = () => this.#next(session);
    utterance.onerror = () => this.#next(session);

    this.#setState('speaking');
    synth.speak(utterance);
  }

  pause() {
    if (this.state !== 'speaking') return;
    synth.pause();
    this.#setState('paused');
  }

  resume() {
    if (this.state !== 'paused') return;
    synth.resume();
    this.#setState('speaking');
  }

  stop() {
    this.session += 1;
    this.queue = [];
    if (canSpeak) synth.cancel();
    this.#clearHighlight();
    this.#setState('idle');
  }

  #clearHighlight() {
    if (!this.current) return;
    this.current.classList.remove('speaking-block');
    this.current.querySelectorAll('.is-spoken').forEach((w) => w.classList.remove('is-spoken'));
    this.current = null;
  }

  #setState(state) {
    this.state = state;
    this.onChange(state);
  }
}
