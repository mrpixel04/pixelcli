# CLAUDE.md

Guidance for working in this repo. Read `PRD.md` for scope and intent.

## What this is

A terminal chat UI (Node + Ink) that talks to Anthropic, DeepSeek, OpenAI and
Gemini through one interface. v1 is chat and model switching only — no file
tools, no shell execution, nothing agentic. Keep it that way unless the PRD
roadmap says otherwise.

## Commands

```sh
npm install
npm run build     # esbuild bundle -> dist/cli.js
npm run dev       # build and run
npm test          # key handling + stream parsing, both sandboxed
npm pack          # builds dist/, emits the release tarball
```

`npm test` is fast and covers the parts that break silently. Run it before
every commit. It does not need network or API keys.

## Layout

```
src/
  cli.jsx           flag parsing, one-shot -p mode, renders <App/>
  app.jsx           all state, ALL key handling, view switching
  providers.js      provider catalog + the four streaming adapters
  auth.js           key storage: env -> keychain -> file
  config.js         ~/.config/polycli/config.json
  theme.js          colours, including per-provider accents
  components/       presentational only, no key handling
test/
  keys.test.jsx     drives real key events via ink-testing-library
  stream.test.mjs   the four parsers against a mock SSE server
docs/
  layout-preview.html   the approved layout, opened in a browser
```

## Rules that matter

**All key handling lives in `app.jsx`'s single `useInput`.** Components render
and nothing else. This is not stylistic — see the ink-text-input gotcha below.

**The provider catalog drives the UI.** `providers` in `src/providers.js` feeds
the model picker, the header chip and the auth panel. Adding a provider means
adding a catalog entry and a colour in `theme.js`. If you find yourself editing
a component to add a provider, the catalog is wrong.

**Adapters yield text chunks and nothing else.** Each returns an async iterator
of strings. Providers that speak the OpenAI chat-completions shape route to
`adapters.openaiCompatible` with a base URL — that is a one-line addition.
Anthropic and Gemini have their own because their wire formats differ.

**Never let tests touch real state.** `POLYCLI_CONFIG_DIR` overrides the config
directory, and setting it also makes `auth.js` skip the macOS Keychain
entirely. The test script sets it to a `mktemp -d`. This exists because an
early test run overwrote a real config file.

**Errors are instructions.** A missing key says "run /auth to add one". A
provider error surfaces the provider's own message via `assertOk`. No stack
traces in the UI.

## Gotchas already paid for

Do not rediscover these.

**`ink-text-input` swallows control chords.** It filters only `^c`; every other
ctrl chord gets inserted into the value as a raw byte, so `^o` and `^p` silently
broke. Removed. `components/Prompt.jsx` is a pure renderer and `app.jsx` owns
the keys. Do not reintroduce the dependency.

**`^m` can never be bound.** Terminals transmit it as carriage return, so it is
indistinguishable from Enter. The model picker is `^o`. Same applies to `^i`
(tab) and `^[` (escape).

**Ink parses one key per chunk.** A multi-byte chunk is a paste, not a keypress,
so `key.return` is not set and the raw `\r` lands in the value. `editLine`
strips control bytes from anything that arrives as a chunk. Tests must send
keystrokes one at a time — `test/keys.test.jsx` has a `type()` helper for this.

**Testing through a pty lies.** `printf '\017' | script -qec ...` mangles the
byte and produced a convincing false failure for `^o`. Use
`ink-testing-library`, which delivers keys the way Ink actually receives them.

**esbuild + ESM needs two shims.** Ink statically imports `react-devtools-core`
(aliased to `scripts/devtools-stub.js`) and a transitive dep calls `require`
(shimmed via `createRequire` in the banner). Both live in `scripts/build.mjs`.

**`getKey()` shells out to `security` on macOS.** Never call it during render.
`app.jsx` memoises it on `[provider, authRows]`.

## Conventions

- Sentence case in all UI copy. No exclamation marks, no "successfully".
- Colours come from `theme.js`. No hex literals in components.
- Keybind hints in the status line must match reality — they have drifted once.
- 2-space indent, single quotes, semicolons. Match surrounding code.

## Before tagging a release

1. Verify every model ID in `providers.js` against the provider's current docs.
   These came from training data and go stale. A wrong ID produces a 404 that
   reads like a polycli bug.
2. `npm test`
3. `npm pack` and check the tarball contains only `dist/cli.js`, `package.json`,
   `README.md`
4. Install the tarball globally and run `--models`, `--auth`, and a real chat
5. `npm version patch && git push --tags` — the release workflow packs and
   attaches the tarball

## When adding a provider

1. Entry in `providers` — models, env var name, key hint, docs URL
2. Colour in `theme.js`
3. Route it in `streamChat`. OpenAI-compatible is one line; anything else needs
   an adapter that yields text chunks.
4. Add it to the mock in `test/stream.test.mjs`

Nothing in `components/` should need to change.
