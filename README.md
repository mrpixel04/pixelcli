# pixelcli

**One terminal chat UI for Anthropic, DeepSeek, OpenAI and Gemini.** Switch model
mid-conversation without losing the thread — one set of keybinds, one config, one
place your keys live.

```
 ◆ pixelcli v0.1.2                     ~/dev/myapp  ⎇ main  ● claude-sonnet-5

 › explain this stack trace

 ● claude-sonnet-5
   The error comes from calling .map on a value that is undefined at the time…

 ╭──────────────────────────────────────────────────────────────────────────╮
 │ › ask anything, or / for commands                                        │
 ╰──────────────────────────────────────────────────────────────────────────╯
  CHAT   tok ⇡312 ⇣1204        ^o model · ^p commands · ^r stop · ^c quit
```

---

## Why

Every provider ships its own CLI, and they disagree about everything —
keybinds, config location, where keys are stored, how output looks. Running four
of them means four sets of muscle memory and four places a key can leak.
pixelcli is **one client, one config, one keychain entry per provider**.

It is a chat tool, not a coding agent — no file edits, no shell execution,
nothing agentic. That space is well covered elsewhere; this is for switching
models fast and keeping the conversation.

## Features

- **Four providers, one UI** — Anthropic, DeepSeek, OpenAI, Google (Gemini).
- **Streaming replies**, rendered as they arrive.
- **Switch model mid-session** with `^o`; your history is preserved.
- **Command palette** (`^p`) and **model picker** (`^o`), both filterable.
- **Secure key storage** — env var → macOS Keychain → `0600` file, in that order.
  Keys never touch `config.json`.
- **One-shot mode** (`-p`) that prints to stdout and pipes.
- **Fast** — cold start under ~300ms, no daemon.

## Install

Not published to npm — install the prebuilt tarball from a GitHub Release.
`pixelcli` is then on your PATH in **every folder**, and there is no build step:

```sh
npm install -g https://github.com/mrpixel04/pixelcli/releases/download/v0.1.2/pixelcli-0.1.2.tgz
```

Requires **Node 18+**. macOS and Linux today; Windows works apart from Keychain
storage, which falls back to a `0600` file.

> The `npm install -g github:mrpixel04/pixelcli` form is intentionally not the
> recommended path: a git install runs a build/`prepare` step, which hardened
> npm setups block — leaving a broken install. The release tarball is
> self-contained and needs no scripts, so it works everywhere. Full options and
> a step-by-step walkthrough are in **[HOW-TO-USE.md](./HOW-TO-USE.md)**.

## Quick start

```sh
pixelcli            # start a session
/auth               # add a provider key
/model              # pick a default model
```

Then just type and press Enter. See **[HOW-TO-USE.md](./HOW-TO-USE.md)** for
adding keys, choosing models, and every command.

## Keys and config

| What            | Where                                                    |
| --------------- | -------------------------------------------------------- |
| API keys        | env var → macOS Keychain (`pixelcli.<provider>`) → `~/.config/pixelcli/keys.json` |
| Config          | `~/.config/pixelcli/config.json` (safe to commit to dotfiles) |
| Check keys      | `pixelcli --auth`                                        |
| Config path     | `pixelcli --config`                                      |

Detailed key setup per provider (and where to get each key) is in
[HOW-TO-USE.md](./HOW-TO-USE.md#3-add-an-api-key).

## Flags

```sh
pixelcli -p "one-shot question"   # print an answer to stdout, no TUI
pixelcli --model deepseek-v4-flash    # set the model and start
pixelcli --models                 # list models
pixelcli --auth                   # key status
pixelcli --config                 # config file path
pixelcli --version                # version
pixelcli --help                   # usage
```

## Develop

```sh
git clone https://github.com/mrpixel04/pixelcli.git
cd pixelcli
npm install
npm run dev     # build and run
npm test        # key handling + stream parsing
```

Architecture notes and the rules that keep the codebase honest live in
[CLAUDE.md](./CLAUDE.md); the product rationale is in [PRD.md](./PRD.md).

### Adding a provider

1. Add an entry to `providers` in `src/providers.js` (models + env var name).
2. If it speaks the OpenAI chat-completions shape, route it to
   `adapters.openaiCompatible` with its base URL — one line. Otherwise write a
   small adapter that yields text chunks.
3. Add a colour in `src/theme.js`.

Nothing in the UI needs touching — the model picker, header chip and auth panel
all read from that one catalog.

## Roadmap

Planned work and known gaps are tracked in
**[WAY-FORWARD-TASKS.md](./WAY-FORWARD-TASKS.md)** — session persistence,
scrollback, real usage numbers, system prompts, and (maybe) tool calling.

## Release

`dist/cli.js` is a committed, self-contained bundle, distributed as a tarball
attached to a GitHub Release. The full step-by-step (including the GitHub UI) is
in **[RELEASE-STEP.md](./RELEASE-STEP.md)**. In short:

```sh
npm version patch         # bump + tag
npm run build             # refresh dist/cli.js
npm pack                  # emits pixelcli-x.y.z.tgz
# then create a GitHub Release for the tag and attach the .tgz
```

## License

MIT.
