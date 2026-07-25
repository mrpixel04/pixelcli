# Way-forward tasks

Backlog for pixelcli, roughly in priority order. Pulled from the PRD roadmap,
the known gaps, and things surfaced while packaging. Check items off as they land.

---

## Now — needed for a clean public v0.1.0

- [ ] **Fix push access to the official remote.** The machine's stored git
      credential is for another GitHub account, so pushes to
      `mrpixel04/pixelcli` return `403`. Authenticate as `mrpixel04` (install
      `gh` and `gh auth login`, or store a personal access token), then push
      `main`.
- [ ] **Verify every model id in `src/providers.js`** against each provider's
      current docs. They came from training data and may be stale — a wrong id
      is a `404` that reads like a pixelcli bug.
- [ ] **Cut the first GitHub release** so the tarball install line works:
      `npm version patch && npm pack && gh release create v0.1.0 pixelcli-0.1.0.tgz`.
- [ ] **New-user install smoke test** on a clean machine/account: install via
      `npm install -g github:mrpixel04/pixelcli`, add a key, chat, one-shot,
      switch model — log any error or bug.

## Soon — quality and reach

- [ ] **CI**: run `npm test` on push (GitHub Actions), plus a build check.
- [ ] **Windows pass**: exercise the `0600` file key fallback; nobody has run it.
- [ ] **MIT LICENSE file** to match `package.json`.
- [ ] **`--verbose` / error detail** flag for debugging provider responses.

---

## v0.2 — make long sessions usable

- [ ] Persist sessions to `~/.local/share/pixelcli/sessions/`, resume with `/resume`.
- [ ] Scrollback viewport (Ink redraws the whole tree, so this needs a viewport,
      not a scroll listener).
- [ ] Read real usage numbers off the final stream frame instead of the
      chars ÷ 4 estimate.
- [ ] `--refresh-models` that hits each provider's list endpoint where one exists.

## v0.3 — system prompts and context

- [ ] `/system` to set a persistent system prompt per session.
- [ ] Read `PIXELCLI.md` from the working directory as ambient context.
- [ ] Pipe stdin into an interactive session, not just `-p`.

## v0.4 — tools, maybe

- [ ] Normalise tool calling across the four providers behind one adapter shape.
- [ ] Start read-only: file read, grep. Nothing that writes without confirmation.

---

## Known gaps (tracked, not yet scheduled)

- Token counts are estimates (chars ÷ 4), not the provider's own usage numbers.
- No automatic retry or fallback between providers (deliberate for v1).
- No cost-in-currency estimate — token counts only, since pricing drifts.

## Done

- [x] Package as an installable CLI named `pixelcli` with a global `bin`.
- [x] esbuild build, six components, config/theme/meta, one-shot `-p` mode.
- [x] Tests: Ink key handling + stream parsers against a mock SSE server.
- [x] Rename `polycli` → `pixelcli` throughout.
