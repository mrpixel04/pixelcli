# Changelog

All notable changes to pixelcli are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/), and versions follow
[Semantic Versioning](https://semver.org/).

Each GitHub release should link to its section below so the release notes show
exactly what changed.

## [Unreleased]

_Nothing yet._

## [0.1.2] — 2026-07-26

### Fixed

- **Refreshed deprecated model IDs.** DeepSeek retired `deepseek-chat` /
  `deepseek-reasoner` (its API now returns `400 Bad Request` for them); the
  catalog now lists **`deepseek-v4-pro`** and **`deepseek-v4-flash`**. The
  Anthropic entries were updated to current IDs (`claude-sonnet-5`,
  `claude-opus-4-8`, `claude-haiku-4-5-20251001`) and the default model is now
  `claude-sonnet-5`. Because the `/model` picker reads the same catalog, this
  fixes it too.

## [0.1.1] — 2026-07-25

### Added

- **Inline slash-command autocomplete.** Typing `/` at the chat prompt lists
  matching commands with the top match highlighted; **Tab** completes it, and an
  unambiguous prefix (e.g. `/co`) runs without typing the whole word.

### Docs

- **RELEASE-STEP.md** — a repeatable runbook for cutting every release.

## [0.1.0] — 2026-07-25

First release: a global terminal chat client for four providers.

### Added

- **`pixelcli` command**, installable globally so it runs from any folder.
- **Four providers through one UI** — Anthropic, DeepSeek, OpenAI, Google
  (Gemini) — with streaming replies rendered as they arrive.
- **Switch model mid-session** (`^o`) without losing conversation history.
- **Command palette** (`^p`) and **filterable model picker** (`^o`).
- **Key management** — add / delete / inspect keys per provider, stored
  env var → macOS Keychain → `0600` file, never in `config.json`.
- **One-shot mode** (`-p`) that prints to stdout and accepts piped stdin,
  e.g. `git diff | pixelcli -p "write a commit message"`.
- **Flags**: `--models`, `--auth`, `--config`, `--model`, `-v/--version`,
  `-h/--help`.
- **ASCII-art splash banner** shown when a session opens — "Pixelcli",
  "by MrFrankis 2026", and the subtitle "Unit Aplikasi Sokongan".
- **Config persistence** at `~/.config/pixelcli/config.json`; session token
  estimate.
- **Docs**: README overview, HOW-TO-USE.md walkthrough, WAY-FORWARD-TASKS.md
  backlog.
- **Tests**: Ink key handling via ink-testing-library and the streaming
  parsers against a mock SSE server, sandboxed via `PIXELCLI_CONFIG_DIR`.

### Fixed

- **Install no longer builds on the user's machine.** Installing from git
  (`npm install -g github:…`) ran an esbuild build via `prepare` and failed
  wherever npm's lifecycle sandbox blocks scripts or withholds dev tooling
  (`ERR_MODULE_NOT_FOUND: esbuild`, or a half-installed package with no `dist/`).
  Resolved by shipping a committed, self-contained bundle (ink + react inlined,
  runs with no `node_modules`) distributed as a **GitHub Release tarball** that
  needs no lifecycle scripts at all. The git-install form is documented as
  unsupported on hardened npm.
- **Global re-install collision.** A stale `npm link` symlink caused
  `ENOTDIR … rename` on reinstall; documented the clean-up and removed the
  leftover.

### Changed

- Renamed the project from **polycli** to **pixelcli** throughout — command,
  config directory, Keychain service, and the `PIXELCLI_CONFIG_DIR` override.

[Unreleased]: https://github.com/mrpixel04/pixelcli/compare/v0.1.2...HEAD
[0.1.2]: https://github.com/mrpixel04/pixelcli/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/mrpixel04/pixelcli/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/mrpixel04/pixelcli/releases/tag/v0.1.0
