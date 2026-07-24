import { build } from 'esbuild';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));

await build({
  entryPoints: [path.join(root, 'src/cli.jsx')],
  outfile: path.join(root, 'dist/cli.js'),
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  jsx: 'automatic',
  minify: false,
  // Ink statically imports react-devtools-core (dev only); stub it out.
  alias: { 'react-devtools-core': path.join(root, 'scripts/devtools-stub.js') },
  define: { __PIXELCLI_VERSION__: JSON.stringify(pkg.version) },
  banner: {
    // 1. shebang must be the first line so the bin is directly executable.
    // 2. a transitive CJS dep calls require(); shim it for the ESM bundle.
    js: [
      '#!/usr/bin/env node',
      "import { createRequire as __pixelcliRequire } from 'node:module';",
      'const require = __pixelcliRequire(import.meta.url);',
    ].join('\n'),
  },
});

console.log('built dist/cli.js');
