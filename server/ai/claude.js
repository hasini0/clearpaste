// Thin client for the Claude Messages API using forced tool use, which
// guarantees we get back JSON that matches our schema.

import { config } from '../config.js';

const API_URL = 'https://api.anthropic.com/v1/messages';

export class AIError extends Error {}

export async function callTool({ system, messages, tool, maxTokens = 3000 }) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      system,
      messages,
      tools: [tool],
      tool_choice: { type: 'tool', name: tool.name },
    }),
    signal: AbortSignal.timeout(config.aiTimeoutMs),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new AIError(`Claude API ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  const block = data.content?.find((b) => b.type === 'tool_use' && b.name === tool.name);
  if (!block) throw new AIError('Claude did not return structured output.');
  return block.input;
}
