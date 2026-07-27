// Minimal read-only web fetch: pull a URL and reduce the HTML to plain text so
// it can be dropped into the conversation as reference context. No search API,
// no crawling beyond the single URL requested.

const ENTITIES = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

export function htmlToText(html) {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|br)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#?[a-z0-9]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');
}

export function normalizeUrl(input) {
  const u = (input || '').trim();
  if (!u) return '';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

// Fetch a URL and return readable text, capped at `limit` chars.
export async function fetchPage(input, { limit = 6000, signal } = {}) {
  const url = normalizeUrl(input);
  const res = await fetch(url, {
    signal,
    headers: { 'user-agent': 'pixelcli', accept: 'text/html,text/plain,*/*' },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const body = await res.text();
  const type = res.headers.get('content-type') || '';
  const text = type.includes('html') ? htmlToText(body) : body.trim();
  return { url, text: text.slice(0, limit), truncated: text.length > limit };
}
