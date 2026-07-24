// Version is injected at build time by esbuild's `define`. Outside a build
// (e.g. the test loader) the token is undefined, so fall back gracefully.
export const VERSION =
  typeof __PIXELCLI_VERSION__ !== 'undefined' ? __PIXELCLI_VERSION__ : '0.0.0-dev';
export const NAME = 'pixelcli';
