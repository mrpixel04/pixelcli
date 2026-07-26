import { test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { render } from 'ink-testing-library';
import App from '../src/app.jsx';

// Ink parses one key per chunk; a multi-byte chunk looks like a paste. So type
// keystrokes one at a time, exactly as a real terminal delivers them — with a
// beat between keys so each state update commits before the next arrives (a
// real terminal never delivers a burst faster than React can render).
async function type(stdin, s) {
  for (const ch of s) {
    stdin.write(ch);
    await new Promise((r) => setTimeout(r, 4));
  }
}

const CTRL_O = '';
const CTRL_P = '';
const ESC = '';

const settle = () => new Promise((r) => setTimeout(r, 20));

test('renders the header with the pixelcli brand and default model', async () => {
  const { lastFrame, unmount } = render(<App />);
  await settle();
  assert.match(lastFrame(), /pixelcli/);
  assert.match(lastFrame(), /claude-sonnet-5/);
  unmount();
});

test('^o opens the model picker and filtering narrows the list', async () => {
  const { stdin, lastFrame, unmount } = render(<App />);
  await settle();
  stdin.write(CTRL_O);
  await settle();
  assert.match(lastFrame(), /switch model/);
  assert.match(lastFrame(), /gpt-4o/); // unfiltered list shows every provider

  await type(stdin, 'opus');
  await settle();
  assert.match(lastFrame(), /claude-opus-4-8/);
  assert.doesNotMatch(lastFrame(), /gpt-4o/); // filtered out
  unmount();
});

test('^p opens the command palette; esc returns to chat', async () => {
  const { stdin, lastFrame, unmount } = render(<App />);
  await settle();
  stdin.write(CTRL_P);
  await settle();
  assert.match(lastFrame(), /\/model/);
  assert.match(lastFrame(), /\/auth/);

  stdin.write(ESC);
  await settle();
  assert.match(lastFrame(), /ask anything/); // back on the chat prompt
  unmount();
});

test('typing lands in the draft and Enter on a slash command routes it', async () => {
  const { stdin, lastFrame, unmount } = render(<App />);
  await settle();
  await type(stdin, 'hello there');
  await settle();
  assert.match(lastFrame(), /hello there/);

  // clear the draft, then run /help via the input line
  await type(stdin, ''.repeat('hello there'.length));
  await settle();
  await type(stdin, '/help');
  stdin.write('\r');
  await settle();
  assert.match(lastFrame(), /keybinds and commands|\^p commands/);
  unmount();
});

test('typing /m suggests /model and Tab completes it', async () => {
  const { stdin, lastFrame, unmount } = render(<App />);
  await settle();
  await type(stdin, '/m');
  await settle();
  assert.match(lastFrame(), /\/model/);
  assert.match(lastFrame(), /tab to complete/);

  stdin.write('\t'); // Tab
  await settle();
  assert.match(lastFrame(), /\/model/); // completed into the input
  assert.doesNotMatch(lastFrame(), /tab to complete/); // suggestions dismissed
  unmount();
});

test('an unambiguous slash prefix runs without full typing (/co -> /cost)', async () => {
  const { stdin, lastFrame, unmount } = render(<App />);
  await settle();
  await type(stdin, '/co');
  stdin.write('\r');
  await settle();
  assert.match(lastFrame(), /tokens \(estimated\)/); // /cost output
  unmount();
});

test('sidebar shows the project tree and ^b toggles it off', async () => {
  const { stdin, lastFrame, unmount } = render(<App />);
  await settle();
  assert.match(lastFrame(), /project/); // sidebar header
  assert.match(lastFrame(), /src/); // a directory from the tree
  stdin.write('\x02'); // ^b
  await settle();
  assert.doesNotMatch(lastFrame(), /project/); // sidebar hidden
  unmount();
});
