// Every way a document can come in: Ctrl+V anywhere (text or screenshot),
// drag & drop, file/camera picker, the clipboard button, or typing.

import { $ } from '../core/dom.js';
import { toast } from '../ui/toast.js';
import { fileKind } from './documents.js';

const isEditable = (el) => el?.closest?.('input, textarea, [contenteditable="true"], select');

export function setupInput({ onText, onImage, onDocument }) {
  const zone = $('#paste-zone');

  const flash = () => {
    zone.classList.remove('is-flash');
    void zone.offsetWidth; // restart animation
    zone.classList.add('is-flash');
  };

  const handleFile = async (file) => {
    if (!file) return;
    const kind = fileKind(file);
    if (kind === 'image') return onImage(file);
    if (kind === 'unknown') return toast('Please use a photo, screenshot, PDF, Word (.docx) or text file.', { error: true });
    onDocument(file);
  };

  // 1. Ctrl+V / ⌘V anywhere (except while typing in a field).
  document.addEventListener('paste', (event) => {
    if (isEditable(event.target)) return;
    const items = [...(event.clipboardData?.items || [])];
    const text = event.clipboardData?.getData('text/plain') || '';
    // Real text wins: Word and some apps also put a picture of the text on
    // the clipboard, and reading the text directly is always more accurate.
    if (text.trim().length >= 20) {
      event.preventDefault();
      flash();
      return onText(text, 'paste');
    }
    // Otherwise a screenshot, or a file copied in Finder/Explorer.
    const file = items.find((item) => item.kind === 'file')?.getAsFile();
    if (file) {
      event.preventDefault();
      flash();
      return handleFile(file);
    }
    if (text.trim()) {
      event.preventDefault();
      onText(text, 'paste');
    }
  });

  // 2. Drag & drop anywhere on the page.
  const overlay = $('#drop-overlay');
  let depth = 0;
  window.addEventListener('dragenter', (e) => { if (e.dataTransfer?.types.includes('Files')) { depth++; overlay.hidden = false; } });
  window.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) overlay.hidden = true; });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    depth = 0;
    overlay.hidden = true;
    handleFile(e.dataTransfer?.files?.[0]);
  });

  // 3. File / camera picker.
  const fileInput = $('#file-input');
  fileInput.addEventListener('change', () => {
    handleFile(fileInput.files[0]);
    fileInput.value = '';
  });

  // 4. "Paste from clipboard" button (for people who don't use shortcuts).
  $('#btn-clipboard').addEventListener('click', async () => {
    try {
      if (navigator.clipboard?.read) {
        for (const item of await navigator.clipboard.read()) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) return onImage(await item.getType(imageType));
        }
      }
      const text = await navigator.clipboard.readText();
      if (text.trim()) return onText(text, 'clipboard');
      toast('Your clipboard is empty. Copy some text or take a screenshot first.');
    } catch {
      toast('Your browser blocked clipboard access. Press Ctrl + V instead, or use “Type it”.');
    }
  });

  // 5. Type or paste into a text box.
  const form = $('#manual-form');
  const typeButton = $('#btn-type');
  typeButton.addEventListener('click', () => {
    form.hidden = !form.hidden;
    typeButton.setAttribute('aria-expanded', String(!form.hidden));
    if (!form.hidden) $('#manual-text').focus();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = $('#manual-text').value;
    if (text.trim().length < 20) return toast('Please add a bit more text — at least a sentence or two.');
    onText(text, 'typed');
  });

  // Enter/Space on the focused paste zone opens the clipboard flow.
  zone.addEventListener('keydown', (e) => {
    if (e.target === zone && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      $('#btn-clipboard').click();
    }
  });
}
