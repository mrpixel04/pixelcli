# Release steps

How to cut a pixelcli release. The **same steps apply to every release** — the
first one and every edit after it. Only the version number changes.

pixelcli is distributed as a **prebuilt tarball attached to a GitHub Release**
(not the npm registry, and not `github:` install — a git install runs a build
step that hardened npm blocks). See [CHANGELOG.md](./CHANGELOG.md) and the
"Install" note in [README.md](./README.md).

---

## A. Before you release (local, on `main` after merging your work)

1. **Decide the new version** using SemVer:
   - patch `0.1.0 → 0.1.1`: bug fixes only
   - minor `0.1.0 → 0.2.0`: new features, backward compatible
   - major `0.1.0 → 1.0.0`: breaking changes

2. **Update `CHANGELOG.md`**: move items out of `[Unreleased]` into a new
   `## [x.y.z] — YYYY-MM-DD` section with `### Added` / `### Fixed` / `### Changed`.

3. **Bump the version** (this edits `package.json` and makes a commit + git tag):
   ```sh
   npm version patch    # or: minor / major — pick to match step 1
   ```
   Tip: `npm version` writes the tag as `v0.1.1`. Keep that `v` prefix.

4. **Rebuild the bundle and package the tarball**:
   ```sh
   npm run build                 # refresh dist/cli.js (commit it if it changed)
   npm pack                      # emits pixelcli-x.y.z.tgz in the repo folder
   ```
   The tarball name always matches the version, e.g. `pixelcli-0.1.1.tgz`.

5. **Sanity-check the tarball** (optional but recommended):
   ```sh
   tar tzf pixelcli-x.y.z.tgz    # should list dist/cli.js, package.json, README.md
   npm install -g ./pixelcli-x.y.z.tgz && pixelcli --version && npm rm -g pixelcli
   ```

6. **Push** `main` and the tag to GitHub (from your own terminal — the account
   with push access to `mrpixel04/pixelcli`):
   ```sh
   git push origin main --follow-tags
   ```

---

## B. Create the GitHub Release (current 2026 UI)

1. Open the repo → right sidebar under **"Releases"** → **"Create a new release"**
   (or go to `https://github.com/mrpixel04/pixelcli/releases/new`).

2. **Choose a tag**: click the **"Choose a tag"** dropdown. If you ran
   `npm version` and pushed with `--follow-tags`, pick the existing **`vX.Y.Z`**.
   Otherwise type it and click **"+ Create new tag: vX.Y.Z on publish"**.
   Leave **Target = `main`**.

3. **Release title**: `vX.Y.Z`.

4. **Description**: click **"Generate release notes"**, or paste that version's
   section from `CHANGELOG.md`. Include the install line:
   ```
   npm install -g https://github.com/mrpixel04/pixelcli/releases/download/vX.Y.Z/pixelcli-X.Y.Z.tgz
   ```

5. **Attach the tarball**: in the **"Attach binaries by dropping them here or
   selecting them"** box, drop **`pixelcli-X.Y.Z.tgz`**. Wait for the upload to
   reach 100% and confirm it appears in the asset list.
   ⚠️ The asset filename must stay exactly `pixelcli-X.Y.Z.tgz` or the install
   URL below won't resolve.

6. Leave **"Set as the latest release"** checked; leave **"pre-release"**
   unchecked (check it only for betas).

7. Click **"Publish release"**.

---

## C. Verify the public install

The asset URL is predictable from the tag + filename:

```sh
npm install -g https://github.com/mrpixel04/pixelcli/releases/download/vX.Y.Z/pixelcli-X.Y.Z.tgz
pixelcli --version      # should print pixelcli vX.Y.Z
pixelcli                # launches the TUI
```

Update the version number in the install lines in `README.md` and
`HOW-TO-USE.md` so the docs always point at the latest release.

---

## Quick checklist

- [ ] `CHANGELOG.md` updated for this version
- [ ] `npm version <patch|minor|major>`
- [ ] `npm run build` (dist/cli.js current) + `npm pack`
- [ ] tarball checked (`tar tzf`, optional local install)
- [ ] `git push origin main --follow-tags`
- [ ] GitHub Release created with tag `vX.Y.Z`, tarball attached
- [ ] `npm install -g <release-url>` verified
- [ ] install URLs in README / HOW-TO-USE bumped
