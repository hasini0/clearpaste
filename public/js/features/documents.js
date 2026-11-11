// Reads text out of documents in the browser: PDF (pdf.js), Word .docx
// (mammoth) and plain text. Scanned PDFs (pictures of pages, no text layer)
// are rendered and passed to the on-device OCR. Files never leave the device;
// only the extracted text is sent for explanation.

import { loadScript } from '../core/loadScript.js';
import { recognizeText } from './ocr.js';

const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
const MAMMOTH = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';

const MAX_PAGES = 8;
const MAX_OCR_PAGES = 3;

export function fileKind(file) {
  const name = file.name?.toLowerCase() || '';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx') || file.type.includes('wordprocessingml')) return 'docx';
  if (file.type.startsWith('text/') || /\.(txt|md|text|csv)$/.test(name)) return 'text';
  if (name.endsWith('.doc')) return 'old-doc';
  return 'unknown';
}

async function readPdf(file, onProgress) {
  const pdfjsLib = await loadScript(PDFJS, 'pdfjsLib');
  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages = Math.min(pdf.numPages, MAX_PAGES);

  let text = '';
  for (let n = 1; n <= pages; n++) {
    onProgress(n / pages, `Opening page ${n} of ${pages}`);
    const content = await (await pdf.getPage(n)).getTextContent();
    // Keep line breaks: pdf.js marks the end of each line with hasEOL.
    text += content.items.map((item) => item.str + (item.hasEOL ? '\n' : ' ')).join('') + '\n\n';
  }
  if (text.replace(/\s/g, '').length > 40) return text;

  // No text layer → it's a scan. Render pages and read them with OCR.
  let scanned = '';
  const ocrPages = Math.min(pdf.numPages, MAX_OCR_PAGES);
  for (let n = 1; n <= ocrPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = Object.assign(document.createElement('canvas'), { width: viewport.width, height: viewport.height });
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    const { text: pageText } = await recognizeText(blob, (p) => onProgress((n - 1 + p) / ocrPages, `Reading scanned page ${n} of ${ocrPages}`));
    scanned += `${pageText}\n\n`;
  }
  return scanned;
}

async function readDocx(file) {
  const mammoth = await loadScript(MAMMOTH, 'mammoth');
  const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}

/** @returns {Promise<string>} the document's text */
export async function readDocument(file, onProgress = () => {}) {
  switch (fileKind(file)) {
    case 'pdf': return readPdf(file, onProgress);
    case 'docx': return readDocx(file);
    case 'text': return file.text();
    case 'old-doc': throw new Error('Old .doc files are not supported. Save it as .docx or PDF, or copy and paste the text.');
    default: throw new Error('Please use a photo, screenshot, PDF, Word (.docx) or text file.');
  }
}
