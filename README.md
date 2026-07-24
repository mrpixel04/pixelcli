# pixelcli

One terminal chat UI for Anthropic, DeepSeek, OpenAI and Gemini. Switch model
mid-conversation without losing the thread.

```
 ◆ pixelcli v0.1.0                     ~/dev/myapp  ⎇ main  ● claude-sonnet-4-6

 › explain this stack trace

 ● claude-sonnet-4-6
   The error comes from calling .map on a value that is undefined at the time…

 ╭──────────────────────────────────────────────────────────────────────────╮
 │ › ask anything, or / for commands                                        │
 ╰──────────────────────────────────────────────────────────────────────────╯
  CHAT   tok ⇡312 ⇣1204        ^o model · ^p commands · ^r stop · ^c quit
```

## Install

Not published to npm. Install globally straight from GitHub — after this,
`pixelcli` is on your PATH and runs from any folder.

```sh
# from the repo (builds and links the global bin)
git clone https://github.com/mrpixel04/pixelcli.git
cd pixelcli
npm install -g .
```

Or in one line from the repo, which builds on install:

```sh
npm install -g github:mrpixel04/pixelcli
```

Or from a release tarball, which ships prebuilt:

```sh
npm install -g https://github.com/mrpixel04/pixelcli/releases/download/v0.1.0/pixelcli-0.1.0.tgz
```

Requires Node 18 or newer. macOS and Linux today; Windows works apart from
Keychain storage, which falls back to a `0600` file.

## First run

```sh
pixelcli          # start a session
/auth             # add a provider key
/model            # pick a default model
```

## Keys

Checked in this order, first hit wins:

1. Environment variable — `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`,
   `OPENAI_API_KEY`, `GEMINI_API_KEY`
2. macOS Keychain, under service `pixelcli.<provider>`
3. `~/.config/pixelcli/keys.json`, mode `0600`

Keys are never written to `config.json`. To inspect what pixelcli can see:

```sh
pixelcli --auth
```

## Commands

| Command  | Does                    |
| -------- | ----------------------- |
| `/model` | switch model            |
| `/auth`  | add or remove keys      |
| `/new`   | clear the session       |
| `/cost`  | token usage so far      |
| `/help`  | keybinds and commands   |
| `/quit`  | exit                    |

## Keys and chords

`^p` commands · `^o` model picker · `^r` stop streaming · `^c` quit

`^m` is deliberately unused — terminals send it as Enter, so it can never be
bound to anything.

## Flags

```sh
pixelcli -p "one-shot question"   # print an answer to stdout, no TUI
pixelcli --model deepseek-chat    # set the model and start
pixelcli --models                 # list models
pixelcli --auth                   # key status
pixelcli --config                 # config file path
```

Because `-p` writes plain text to stdout, it pipes:

```sh
git diff | pixelcli -p "write a commit message for this diff"
```

## Adding a provider

1. Add an entry to `providers` in `src/providers.js` with its models and env
   var name.
2. If it speaks the OpenAI chat-completions shape, route it to
   `adapters.openaiCompatible` with its base URL — that is a one-line change.
   Otherwise write a small adapter that yields text chunks.
3. Add a colour in `src/theme.js`.

Nothing in the UI needs touching. The model picker, header chip and auth panel
all read from that one catalog.

## Develop

```sh
npm install
npm run dev     # build and run
npm test        # key handling + stream parsing
```

`npm test` drives real key events through the app with `ink-testing-library`
and runs the stream parsers against a mock SSE server that deliberately splits a
frame across chunks.

## Release

```sh
npm version patch
npm pack                  # builds dist/, emits pixelcli-x.y.z.tgz
gh release create v0.1.0 pixelcli-0.1.0.tgz
```
