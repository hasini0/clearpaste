// Voice input for questions (for people who find typing hard).

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canDictate = Boolean(Recognition);

/** Starts listening; returns a function that stops it. */
export function dictate({ lang, onText, onEnd }) {
  const recognizer = new Recognition();
  recognizer.lang = lang;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;

  recognizer.onresult = (event) => {
    const transcript = [...event.results].map((r) => r[0].transcript).join(' ');
    const isFinal = event.results[event.results.length - 1].isFinal;
    onText(transcript, isFinal);
  };
  recognizer.onerror = () => onEnd();
  recognizer.onend = () => onEnd();
  recognizer.start();
  return () => recognizer.stop();
}
