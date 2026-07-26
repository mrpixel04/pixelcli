export const providers = {
  anthropic: {
    label: 'anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    keyHint: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    models: [
      { id: 'claude-sonnet-5', context: '200k' },
      { id: 'claude-opus-4-8', context: '200k' },
      { id: 'claude-haiku-4-5-20251001', context: '200k' },
    ],
  },
  deepseek: {
    label: 'deepseek',
    envKey: 'DEEPSEEK_API_KEY',
    keyHint: 'sk-...',
    docsUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-v4-pro', context: '128k' },
      { id: 'deepseek-v4-flash', context: '128k' },
    ],
  },
  openai: {
    label: 'openai',
    envKey: 'OPENAI_API_KEY',
    keyHint: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', context: '128k' },
      { id: 'gpt-4o-mini', context: '128k' },
    ],
  },
  google: {
    label: 'google',
    envKey: 'GEMINI_API_KEY',
    keyHint: 'AIza...',
    docsUrl: 'https://aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.0-flash', context: '1m' },
      { id: 'gemini-1.5-pro', context: '2m' },
    ],
  },
};

export function allModels() {
  const out = [];
  for (const [key, p] of Object.entries(providers)) {
    for (const m of p.models) out.push({ provider: key, ...m });
  }
  return out;
}

export function providerOf(modelId) {
  for (const [key, p] of Object.entries(providers)) {
    if (p.models.some((m) => m.id === modelId)) return key;
  }
  return 'anthropic';
}

export async function* sse(res) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split('\n\n');
    buf = parts.pop() ?? '';
    for (const part of parts) {
      for (const line of part.split('\n')) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          yield JSON.parse(payload);
        } catch {
          /* keepalive or partial frame */
        }
      }
    }
  }
}

async function assertOk(res) {
  if (res.ok) return;
  let detail = '';
  try {
    const body = await res.json();
    detail = body?.error?.message ?? JSON.stringify(body).slice(0, 200);
  } catch {
    detail = await res.text().catch(() => '');
  }
  throw new Error(`${res.status} ${res.statusText}${detail ? ` — ${detail}` : ''}`);
}

// Each adapter takes ({ model, apiKey, messages, signal }) and returns an async
// iterator of plain text chunks. messages is [{ role: 'user'|'assistant', content }].
// baseUrl is injectable so the mock-server tests can point an adapter at localhost.
export const adapters = {
  async *anthropic({ baseUrl = 'https://api.anthropic.com', model, apiKey, messages, signal }) {
    const res = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model, max_tokens: 4096, stream: true, messages }),
    });
    await assertOk(res);
    for await (const evt of sse(res)) {
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
        yield evt.delta.text;
      }
    }
  },

  async *openaiCompatible({ baseUrl, model, apiKey, messages, signal }) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, stream: true, messages }),
    });
    await assertOk(res);
    for await (const evt of sse(res)) {
      const delta = evt.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  },

  async *google({
    baseUrl = 'https://generativelanguage.googleapis.com',
    model,
    apiKey,
    messages,
    signal,
  }) {
    const url =
      `${baseUrl}/v1beta/models/${model}` +
      `:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`;
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const res = await fetch(url, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents }),
    });
    await assertOk(res);
    for await (const evt of sse(res)) {
      const text = evt.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
      if (text) yield text;
    }
  },
};

export function streamChat({ provider, model, apiKey, messages, signal }) {
  switch (provider) {
    case 'anthropic':
      return adapters.anthropic({ model, apiKey, messages, signal });
    case 'deepseek':
      return adapters.openaiCompatible({
        baseUrl: 'https://api.deepseek.com',
        model,
        apiKey,
        messages,
        signal,
      });
    case 'openai':
      return adapters.openaiCompatible({
        baseUrl: 'https://api.openai.com/v1',
        model,
        apiKey,
        messages,
        signal,
      });
    case 'google':
      return adapters.google({ model, apiKey, messages, signal });
    default:
      throw new Error(`unknown provider: ${provider}`);
  }
}
