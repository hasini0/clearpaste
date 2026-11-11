// HTTP client for the ClearPaste server.

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

export const api = {
  health: () => fetch('/api/health').then((r) => r.json()),
  analyze: ({ text, level, language }) => post('/api/analyze', { text, level, language }),
  ask: ({ text, question, level, language }) => post('/api/ask', { text, question, level, language }),
};
