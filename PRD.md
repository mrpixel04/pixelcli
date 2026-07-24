# pixelcli — PRD

Status: v0.1.0 built, untagged. Written 2026-07-24.

## What this is

A terminal chat UI that talks to Anthropic, DeepSeek, OpenAI and Gemini through
one interface, with one set of keybinds, so switching model does not mean
switching tool. Built for my own daily use first; public on GitHub because
there is no reason to keep it private.

## Why

Each provider ships its own CLI. They disagree about keybinds, config file
location, where keys are stored, and what the output looks like. Running four
of them means four sets of muscle memory and four places a key can leak. One
client, one config, one keychain entry per provider.

## Who it's for

Me, primarily. Secondarily: anyone who pays for two or more model APIs and
works in a terminal. Not aimed at people who want a coding agent — that space
is well covered by Claude Code and opencode, and competing there is not the
point.

## v1 scope (built)

- Chat with streaming output from all four providers
- Switch model mid-session without losing conversation history
- Model picker and command palette, both filterable
- Key management: add, delete, inspect source
- One-shot mode (`-p`) that writes to stdout and pipes
- Session-local token estimate

## Explicitly out of scope for v1

- File read/edit tools
- Shell execution
- Anything agentic — tool loops, planning, multi-step execution
- Session persistence across restarts
- MCP

These were cut to get something usable quickly, not because they are bad ideas.
Tool calling is the obvious v0.3 candidate, but it is a much larger surface:
every provider expresses tools differently, and the adapter layer would need to
normalise both the request and the streamed response.

## Decisions made, and why

**Node + Ink.** Fastest to write and iterate. The cost is a 1.4mb bundle and a
Node 18+ requirement on the user's machine, which is acceptable for a developer
tool. Go + Bubble Tea would give a single binary with no runtime dependency —
worth revisiting if install friction turns out to matter.

**GitHub releases only, no npm registry.** `npm pack` produces a tarball that
installs globally from a release URL. No package name to squat, no publish
credentials to manage, no obligation to anyone downstream.

**Keys in the OS keychain, never in config.json.** Config and credentials are
separate files with separate lifetimes. Config is safe to commit to a dotfiles
repo; keys never touch disk in plaintext on macOS.

**One provider catalog drives the whole UI.** The model picker, header chip and
auth panel all read from `providers` in `src/providers.js`. Adding a provider
should not require touching a component.

**Own the input line.** Dropped `ink-text-input` after finding it swallows every
control chord except `^c`. Owning ~25 lines is cheaper than fighting a
dependency on the most-touched component in the app.

## Requirements

### Must

- Streaming output, rendered as it arrives, never buffered to completion
- `^c` always exits; `^r` always aborts an in-flight stream
- A missing key produces an instruction, not a stack trace
- Provider API errors surface the provider's own message
- Tests never touch the real config or keychain
- Model switch preserves history and is visible in the header

### Should

- Cold start under 300ms
- Work on any terminal that supports 256 colours
- Degrade rather than crash outside a git repo, or with no config

### Won't (v1)

- Retry or fall back between providers automatically
- Estimate cost in currency — token counts only, since pricing changes and
  being wrong about money is worse than being silent about it

## Known gaps

1. **Model IDs are unverified.** They came from training data and may be stale
   or wrong. Check each provider's docs before tagging v0.1.0. A wrong ID
   produces a 404 that reads like a bug in pixelcli.
2. **Windows is untested.** The keychain path falls back to a `0600` file,
   which is correct behaviour, but nobody has run it.
3. **No scrollback.** Long sessions run off the top of the terminal. Ink
   redraws the whole tree, so this needs a viewport, not a scroll listener.
4. **Token counts are estimates** (chars ÷ 4), not the provider's own usage
   numbers, which arrive in the final SSE frame and are currently discarded.

## Roadmap

**v0.2 — make long sessions usable**
- Persist sessions to `~/.local/share/pixelcli/sessions/`, resume with `/resume`
- Scrollback viewport
- Read real usage numbers off the final stream frame
- Verify model IDs, add a `--refresh-models` that hits each provider's list
  endpoint where one exists

**v0.3 — system prompts and context**
- `/system` to set a persistent system prompt per session
- Read `PIXELCLI.md` from the working directory as ambient context, the way
  agentic CLIs read their own files
- Pipe stdin into a session, not just `-p`

**v0.4 — tools, maybe**
- Normalise tool calling across the four providers behind one adapter shape
- Start read-only: file read, grep. Nothing that writes without confirmation.

## Success

I stop opening the other CLIs. That's it.
