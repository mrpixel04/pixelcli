// Collapse fenced code blocks in an assistant message down to a one-line summary
// so long code doesn't flood the chat. The code still lives in the reply (it can
// be /save-d or auto-written in build mode); this only affects what's shown.
export function collapseCode(content) {
  if (!content) return content;
  let s = content.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_m, info, code) => {
    const lines = code.replace(/\n+$/, '').split('\n').length;
    return `  ▸ ${info.trim() || 'code'} · ${lines} lines`;
  });
  // an unclosed trailing fence — still streaming in
  s = s.replace(/```([^\n]*)\n([\s\S]*)$/, (_m, info, code) => {
    const lines = code.split('\n').length;
    return `  ▸ ${info.trim() || 'code'} · writing… (${lines} lines)`;
  });
  return s;
}
