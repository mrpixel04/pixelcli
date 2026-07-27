import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { extractLastCode, resolveFilename } from '../src/save.js';
import { htmlToText, normalizeUrl, fetchPage } from '../src/web.js';

test('extractLastCode pulls the last fenced block', () => {
  const msg = 'here:\n```html\n<h1>hi</h1>\n```\nthen\n```js\nconsole.log(1)\n```';
  assert.equal(extractLastCode(msg), 'console.log(1)');
});

test('extractLastCode falls back to whole text when there is no fence', () => {
  assert.equal(extractLastCode('just prose'), 'just prose');
  assert.equal(extractLastCode(''), null);
});

test('resolveFilename defaults to .html, keeps a given extension', () => {
  assert.equal(resolveFilename(''), 'output.html');
  assert.equal(resolveFilename('page'), 'page.html');
  assert.equal(resolveFilename('app.js'), 'app.js');
  assert.equal(resolveFilename('  notes.md  '), 'notes.md');
});

test('htmlToText strips scripts, styles and tags; decodes entities', () => {
  const html =
    '<html><head><style>x{}</style><script>bad()</script></head>' +
    '<body><h1>Title</h1><p>Hello &amp; world</p></body></html>';
  const t = htmlToText(html);
  assert.match(t, /Title/);
  assert.match(t, /Hello & world/);
  assert.doesNotMatch(t, /bad\(\)/);
  assert.doesNotMatch(t, /[<>]/);
});

test('normalizeUrl adds https when missing', () => {
  assert.equal(normalizeUrl('example.com'), 'https://example.com');
  assert.equal(normalizeUrl('http://x.com'), 'http://x.com');
});

test('fetchPage returns readable text from a page', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<h1>Doc</h1><p>Body text here</p>');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    const page = await fetchPage(`http://127.0.0.1:${port}`, { limit: 1000 });
    assert.match(page.text, /Doc/);
    assert.match(page.text, /Body text here/);
    assert.equal(page.truncated, false);
  } finally {
    server.close();
  }
});

test('fetchPage throws on a non-ok response', async () => {
  const server = http.createServer((req, res) => {
    res.writeHead(404);
    res.end('nope');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  try {
    await assert.rejects(() => fetchPage(`http://127.0.0.1:${port}`), /404/);
  } finally {
    server.close();
  }
});
