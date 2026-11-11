// Loads a third-party script once, on demand (keeps first page load tiny).

const cache = new Map();

export function loadScript(url, globalName) {
  if (window[globalName]) return Promise.resolve(window[globalName]);
  if (!cache.has(url)) {
    cache.set(url, new Promise((resolve, reject) => {
      const script = Object.assign(document.createElement('script'), { src: url, async: true });
      script.onload = () => resolve(window[globalName]);
      script.onerror = () => {
        cache.delete(url);
        reject(new Error('Could not load a helper. Check your internet connection and try again.'));
      };
      document.head.append(script);
    }));
  }
  return cache.get(url);
}
