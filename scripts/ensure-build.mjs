// `prepare` hook. The shipped bundle dist/cli.js is committed and
// self-contained, so on a normal install it already exists — we skip the build
// entirely (no esbuild, no dev tooling needed on the user's machine). We only
// build when the bundle is missing (e.g. a fresh dev clone that stripped it).
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = path.join(root, 'dist', 'cli.js');

if (existsSync(out) && statSync(out).size > 0) {
  console.log('pixelcli: prebuilt dist/cli.js present — skipping build');
} else {
  console.log('pixelcli: no bundle found — building with esbuild');
  await import('./build.mjs');
}
