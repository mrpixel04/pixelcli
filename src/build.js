import path from 'node:path';

// A filename token looks like `name.ext` or `dir/name.ext`.
function filenameFromInfo(info) {
  const tokens = (info || '').split(/[\s=]+/).filter(Boolean);
  for (const t of tokens) {
    const cleaned = t.replace(/^["'`]|["'`]$/g, '');
    if (/^[\w.@/-]+\.[a-z0-9]+$/i.test(cleaned)) return cleaned;
  }
  return null;
}

// Parse an assistant reply into the set of files it declares. A file is a fenced
// code block whose fence carries a filename, e.g. ```css styles.css  or  ```index.html
// Blocks without a filename are ignored (they stay as chat).
export function parseFiles(text) {
  const out = [];
  if (!text) return out;
  const re = /```([^\n]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(text))) {
    const name = filenameFromInfo(m[1]);
    if (!name) continue;
    out.push({ name, code: m[2].replace(/\n+$/, '') });
  }
  return out;
}

// Resolve `name` under `root`, refusing anything that escapes root (absolute
// paths, `..`). Returns the absolute path or null if unsafe.
export function safeResolve(root, name) {
  const target = path.resolve(root, name);
  const rel = path.relative(root, target);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return target;
}
