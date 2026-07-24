import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { sse, adapters } from '../src/providers.js';

// A Response-like object whose body streams the given byte chunks in order.
function fakeRes(chunks) {
  let i = 0;
  return {
    ok: true,
    body: {
      getReader() {
        return {
          read() {
            if (i < chunks.length) {
              return Promise.resolve({ done: false, value: new TextEncoder().encode(chunks[i++]) });
            }
            return Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    },
  };
}

async function collect(iter) {
  const out = [];
  for await (const x of iter) out.push(x);
  return out;
}

// Serve a fixed SSE body once, on any path, then close. Returns the base URL.
function mockServer(bodyText) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.end(bodyText);
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ base: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

test('sse reassembles a frame split across chunks', async () => {
  // the `data: {...}` frame is deliberately cut in the middle of the JSON
  const events = await collect(
    sse(fakeRes(['data: {"a":', '1,"b":2}\n\n', 'data: {"c":3}\n\n'])),
  );
  assert.deepEqual(events, [{ a: 1, b: 2 }, { c: 3 }]);
});

test('sse skips keepalives, blanks and [DONE]', async () => {
  const events = await collect(
    sse(fakeRes([': keepalive\n\n', 'data: [DONE]\n\n', 'data: {"ok":true}\n\n'])),
  );
  assert.deepEqual(events, [{ ok: true }]);
});

test('anthropic adapter yields only text_delta text', async () => {
  const body =
    'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}\n\n' +
    'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}\n\n' +
    'data: {"type":"message_stop"}\n\n';
  const { base, close } = await mockServer(body);
  try {
    const out = await collect(
      adapters.anthropic({ baseUrl: base, model: 'x', apiKey: 'k', messages: [] }),
    );
    assert.equal(out.join(''), 'Hello');
  } finally {
    close();
  }
});

test('openai-compatible adapter yields choices[].delta.content', async () => {
  const body =
    'data: {"choices":[{"delta":{"content":"foo"}}]}\n\n' +
    'data: {"choices":[{"delta":{"content":"bar"}}]}\n\n' +
    'data: [DONE]\n\n';
  const { base, close } = await mockServer(body);
  try {
    const out = await collect(
      adapters.openaiCompatible({ baseUrl: base, model: 'x', apiKey: 'k', messages: [] }),
    );
    assert.equal(out.join(''), 'foobar');
  } finally {
    close();
  }
});

test('google adapter joins candidate parts', async () => {
  const body =
    'data: {"candidates":[{"content":{"parts":[{"text":"gem"}]}}]}\n\n' +
    'data: {"candidates":[{"content":{"parts":[{"text":"ini"}]}}]}\n\n';
  const { base, close } = await mockServer(body);
  try {
    const out = await collect(
      adapters.google({ baseUrl: base, model: 'x', apiKey: 'k', messages: [] }),
    );
    assert.equal(out.join(''), 'gemini');
  } finally {
    close();
  }
});
