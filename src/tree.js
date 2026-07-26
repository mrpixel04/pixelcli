import fs from 'node:fs';
import path from 'node:path';

// Directories that are noise in a project view.
const IGNORE = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.cache',
  '.next',
  '.turbo',
  'vendor',
]);

// Returns a flat list of { depth, name, isDir } for the directory tree under
// root, dirs first then files, alphabetical. Bounded so a huge repo can't stall
// the render or overflow the sidebar.
export function buildTree(root, { maxDepth = 2, maxEntries = 200 } = {}) {
  const out = [];

  function walk(dir, depth) {
    if (depth > maxDepth || out.length >= maxEntries) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries = entries
      .filter((e) => !IGNORE.has(e.name) && !e.name.startsWith('.'))
      .sort((a, b) => {
        const ad = a.isDirectory() ? 0 : 1;
        const bd = b.isDirectory() ? 0 : 1;
        if (ad !== bd) return ad - bd;
        return a.name.localeCompare(b.name);
      });
    for (const e of entries) {
      if (out.length >= maxEntries) break;
      const isDir = e.isDirectory();
      out.push({ depth, name: e.name, isDir });
      if (isDir) walk(path.join(dir, e.name), depth + 1);
    }
  }

  walk(root, 0);
  return out;
}
