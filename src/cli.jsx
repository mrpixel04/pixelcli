import React from 'react';
import { render } from 'ink';
import process from 'node:process';

import App from './app.jsx';
import { NAME, VERSION } from './meta.js';
import { providers, allModels, providerOf, streamChat } from './providers.js';
import { getKey, authStatus } from './auth.js';
import { loadConfig, saveConfig, configPath } from './config.js';

function parse(argv) {
  const opts = { prompt: null, model: null, rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-p' || a === '--print') opts.prompt = argv[++i] ?? '';
    else if (a === '--model') opts.model = argv[++i];
    else if (a === '--models') opts.models = true;
    else if (a === '--auth') opts.auth = true;
    else if (a === '--config') opts.config = true;
    else if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-v' || a === '--version') opts.version = true;
    else opts.rest.push(a);
  }
  // `pixelcli -p question words` — treat trailing bare words as the prompt too.
  if (opts.prompt === '' && opts.rest.length) opts.prompt = opts.rest.join(' ');
  return opts;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => (data += c));
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

const HELP = `${NAME} v${VERSION} — one terminal chat UI for Anthropic, DeepSeek, OpenAI and Gemini

usage
  ${NAME}                      start an interactive session
  ${NAME} -p "question"        one-shot answer to stdout (pipes)
  git diff | ${NAME} -p "..."  pipe stdin in as context

flags
  -p, --print <text>   print an answer and exit, no TUI
      --model <id>     set the model (persisted) then start
      --models         list available models
      --auth           show key status per provider
      --config         print the config file path
  -h, --help           this help
  -v, --version        version

keys are read env -> keychain -> ~/.config/pixelcli/keys.json, first hit wins.`;

function printModels() {
  for (const [name, p] of Object.entries(providers)) {
    process.stdout.write(`${name}\n`);
    for (const m of p.models) process.stdout.write(`  ${m.id}  (${m.context})\n`);
  }
}

function printAuth() {
  for (const r of authStatus()) {
    const state = r.ready ? `${r.masked}  (${r.source})` : 'not set';
    process.stdout.write(`${r.provider.padEnd(11)} ${state}\n`);
  }
}

async function oneShot(text, modelOverride) {
  const cfg = loadConfig();
  const model = modelOverride ?? cfg.model;
  const provider = providerOf(model);
  const { key } = getKey(provider);
  if (!key) {
    process.stderr.write(
      `no api key for ${provider}. run \`${NAME} --auth\`, or set ${providers[provider].envKey}.\n`,
    );
    process.exit(1);
  }

  const piped = process.stdin.isTTY ? '' : await readStdin();
  const content = piped ? `${piped}\n\n${text}` : text;

  try {
    for await (const chunk of streamChat({
      provider,
      model,
      apiKey: key,
      messages: [{ role: 'user', content }],
    })) {
      process.stdout.write(chunk);
    }
    process.stdout.write('\n');
  } catch (err) {
    process.stderr.write(`${provider}: ${err.message}\n`);
    process.exit(1);
  }
}

async function main() {
  const opts = parse(process.argv.slice(2));

  if (opts.help) return void process.stdout.write(`${HELP}\n`);
  if (opts.version) return void process.stdout.write(`${NAME} v${VERSION}\n`);
  if (opts.models) return void printModels();
  if (opts.auth) return void printAuth();
  if (opts.config) return void process.stdout.write(`${configPath()}\n`);

  if (opts.model) {
    const known = allModels().some((m) => m.id === opts.model);
    if (!known) {
      process.stderr.write(
        `unknown model "${opts.model}". run \`${NAME} --models\` to list them.\n`,
      );
      process.exit(1);
    }
    saveConfig({ model: opts.model });
  }

  if (opts.prompt !== null) return void (await oneShot(opts.prompt, opts.model));

  if (!process.stdout.isTTY) {
    process.stderr.write(`${NAME} needs an interactive terminal. use -p for one-shot output.\n`);
    process.exit(1);
  }

  const { waitUntilExit } = render(<App />);
  await waitUntilExit();
}

main();
