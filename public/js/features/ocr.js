// On-device OCR with Tesseract.js (WebAssembly). The image never leaves
// the browser — only the recognised text is sent for explanation.

import { loadScript } from '../core/loadScript.js';

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

const loadTesseract = () => loadScript(TESSERACT_URL, 'Tesseract');

/**
 * Tesseract reads dark text on a light background best. Screenshots are
 * often dark mode, small, or low-contrast, so we: upscale small images,
 * convert to grayscale, invert dark backgrounds, and stretch contrast.
 */
async function prepareImage(blob) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(3, Math.max(1, 1800 / bitmap.width));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = image.data;
  let sum = 0;
  let min = 255;
  let max = 0;
  for (let i = 0; i < px.length; i += 4) {
    const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    px[i] = gray;
    sum += gray;
  }
  const invert = sum / (px.length / 4) < 128; // mostly dark → dark mode
  for (let i = 0; i < px.length; i += 4) {
    const g = invert ? 255 - px[i] : px[i];
    px[i] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < px.length; i += 4) {
    const g = ((px[i] - min) / range) * 255;
    px[i] = px[i + 1] = px[i + 2] = g;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

/** @param {Blob} image  @param {(fraction:number, label:string)=>void} onProgress */
export async function recognizeText(image, onProgress = () => {}) {
  onProgress(0, 'Loading the text reader');
  const [Tesseract, prepared] = await Promise.all([loadTesseract(), prepareImage(image).catch(() => image)]);
  const { data } = await Tesseract.recognize(prepared, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(m.progress, 'Reading the words in your image');
      else if (typeof m.progress === 'number') onProgress(m.progress * 0.2, 'Getting ready');
    },
  });
  return { text: cleanOcrText(data.text || ''), confidence: data.confidence ?? 0 };
}

function cleanOcrText(text) {
  return text
    .replace(/[|]{2,}/g, ' ')
    .replace(/-\n(?=[a-z])/g, '') // re-join hyphenated line breaks
    .replace(/([^\n.!?:])\n(?=[a-z])/g, '$1 ') // join soft-wrapped lines
    .trim();
}
