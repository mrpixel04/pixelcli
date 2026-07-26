# How to use pixelcli

A step-by-step guide, from install to first chat. If you just want the short
version: install it, add one API key, run `pixelcli`.

---

## 1. Requirements

- **Node.js 18 or newer** (`node -v` to check). Install from
  [nodejs.org](https://nodejs.org) if you don't have it.
- At least one API key from a provider you pay for: Anthropic, DeepSeek, OpenAI
  or Google (Gemini).

---

## 2. Install

pixelcli is not on the npm registry. Install the prebuilt tarball from a GitHub
Release — after that the `pixelcli` command works in **any folder**:

```sh
npm install -g https://github.com/mrpixel04/pixelcli/releases/download/v0.1.2/pixelcli-0.1.2.tgz
```

The tarball is one self-contained file, so there is no build step and no dev
tooling to install — it just works, even on locked-down npm setups.

> **Why not `npm install -g github:mrpixel04/pixelcli`?** A git install makes npm
> run a build/`prepare` step on your machine. Security-hardened npm setups block
> lifecycle scripts, which leaves a half-installed package (`command not found`).
> The release tarball avoids that entirely. If you specifically want the git
> form and your npm allows scripts, it can work — but the tarball is the
> supported path.

### Installing from a local clone (for development)

```sh
git clone https://github.com/mrpixel04/pixelcli.git
cd pixelcli
npm install        # dev tooling (esbuild, ink) for building/testing
npm run build      # refresh dist/cli.js
npm install -g .   # put pixelcli on your PATH from this clone
```

Check it worked:

```sh
pixelcli --version      # -> pixelcli v0.1.2
```

---

## 3. Add an API key

pixelcli looks for each provider's key in this order, first hit wins:

1. an **environment variable**
2. the **macOS Keychain** (service `pixelcli.<provider>`)
3. `~/.config/pixelcli/keys.json` (mode `0600`, used on Linux/Windows)

### Option A — the built-in key manager (recommended)

Start pixelcli and open the auth panel:

```sh
pixelcli
```

Then press `^p` (Ctrl+P) → choose `/auth`, or just type `/auth` and press Enter.

- `↑ ↓` to move between providers
- `⏎` to type/paste a key for the selected provider
- `d` to delete a stored key
- `esc` to go back

On macOS the key is saved to your Keychain, never to a plaintext file.

### Option B — environment variable

Handy for CI, or if you already manage secrets in your shell profile:

| Provider | Variable            |
| -------- | ------------------- |
| Anthropic| `ANTHROPIC_API_KEY` |
| DeepSeek | `DEEPSEEK_API_KEY`  |
| OpenAI   | `OPENAI_API_KEY`    |
| Gemini   | `GEMINI_API_KEY`    |

```sh
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Where to get a key

| Provider | Get a key at                                   |
| -------- | ---------------------------------------------- |
| Anthropic| https://console.anthropic.com/settings/keys    |
| DeepSeek | https://platform.deepseek.com/api_keys         |
| OpenAI   | https://platform.openai.com/api-keys           |
| Gemini   | https://aistudio.google.com/apikey             |

Check what pixelcli can currently see, without starting the UI:

```sh
pixelcli --auth
```

---

## 4. Pick a model

```sh
pixelcli --models       # list everything available
```

Inside the app, press `^o` (Ctrl+O) to open the model picker, type to filter
(e.g. `opus`, `gpt`, `gemini`), and `⏎` to select. Your choice is remembered as
the default for next time.

Or set it up front from the shell:

```sh
pixelcli --model deepseek-v4-flash
```

---

## 5. Chat

Just start typing at the prompt and press `⏎`. The reply streams in as it
arrives. Switch models mid-conversation with `^o` — your history is kept.

### Keys and chords

| Key  | Does              |
| ---- | ----------------- |
| `^o` | model picker      |
| `^p` | command palette   |
| `^r` | stop streaming    |
| `^c` | quit              |

### Slash commands

| Command  | Does                  |
| -------- | --------------------- |
| `/model` | switch model          |
| `/auth`  | add or remove keys    |
| `/new`   | clear the session     |
| `/cost`  | token usage so far    |
| `/help`  | keybinds and commands |
| `/quit`  | exit                  |

---

## 6. One-shot mode (no UI)

Get a single answer straight to stdout — good for scripts and pipes:

```sh
pixelcli -p "explain what a git rebase does in one sentence"
```

Because it writes plain text, you can pipe things into it:

```sh
git diff | pixelcli -p "write a commit message for this diff"
```

---

## 7. Update or uninstall

```sh
# update: install the latest release tarball again
npm install -g https://github.com/mrpixel04/pixelcli/releases/download/v0.1.2/pixelcli-0.1.2.tgz
npm uninstall -g pixelcli                  # remove it
```

Your keys and config live in `~/.config/pixelcli/` (and the macOS Keychain) and
are left untouched by an uninstall. Remove them by hand if you want a clean slate.

---

## Troubleshooting

- **`pixelcli: command not found`** — your npm global bin folder isn't on PATH.
  Run `npm prefix -g` to find it and add its `bin` to your PATH.
- **`no api key for <provider>`** — add one with `/auth` or the matching env var.
- **A provider error (e.g. `401`, `404`)** — pixelcli shows the provider's own
  message. A `401` means a bad/expired key; a `404` on a model usually means the
  model id is stale — run `pixelcli --models` and pick a current one.
- **`pixelcli needs an interactive terminal`** — you ran it with output
  redirected. Use `-p "..."` for non-interactive output.
