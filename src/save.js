import path from 'node:path';

// Pull the last fenced code block from an assistant message. If there is no
// fence, fall back to the whole message (so prose can be saved too).
export function extractLastCode(text) {
  if (!text) return null;
  const blocks = [...text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)];
  if (blocks.length) return blocks[blocks.length - 1][1].replace(/\n+$/, '');
  return text.trim() || null;
}

// Resolve the target filename. Default extension is .html when the user names a
// file without one; a bare `/save` writes output.html.
export function resolveFilename(arg) {
  const name = (arg || '').trim();
  if (!name) return 'output.html';
  if (!path.extname(name)) return `${name}.html`;
  return name;
}
