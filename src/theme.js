// Single source of colour. Components never hardcode a colour; they read it
// from here. Ink accepts named colours and hex strings (via chalk).
export const theme = {
  logo: '#c586ff', // pixel violet
  accent: '#4dd0e1',
  faint: 'gray',
  line: 'gray',
  text: 'white',
  system: '#4dd0e1',
  error: '#ff6b6b',
  ok: '#7bd88f',
  warn: '#ffcc66',
  cursor: '#c586ff',
};

// Per-provider accent, keyed by the provider ids in providers.js.
export const providerColor = {
  anthropic: '#d97757',
  deepseek: '#5b8cff',
  openai: '#10a37f',
  google: '#4285f4',
};
