import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { providers } from './providers.js';

const overrideDir = process.env.PIXELCLI_CONFIG_DIR;
// an overridden config dir means a sandboxed profile, so stay out of the Keychain
const isMac = process.platform === 'darwin' && !overrideDir;
const dir = overrideDir ?? path.join(os.homedir(), '.config', 'pixelcli');
const fallbackFile = path.join(dir, 'keys.json');
const service = (provider) => `pixelcli.${provider}`;

function ensureDir() {
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
}

function readFallback() {
  try {
    return JSON.parse(fs.readFileSync(fallbackFile, 'utf8'));
  } catch {
    return {};
  }
}

function writeFallback(obj) {
  ensureDir();
  fs.writeFileSync(fallbackFile, JSON.stringify(obj, null, 2), { mode: 0o600 });
}

function keychainGet(provider) {
  try {
    return execFileSync(
      'security',
      ['find-generic-password', '-a', 'pixelcli', '-s', service(provider), '-w'],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
  } catch {
    return null;
  }
}

function keychainSet(provider, key) {
  execFileSync(
    'security',
    ['add-generic-password', '-a', 'pixelcli', '-s', service(provider), '-w', key, '-U'],
    { stdio: 'ignore' },
  );
}

function keychainDelete(provider) {
  try {
    execFileSync(
      'security',
      ['delete-generic-password', '-a', 'pixelcli', '-s', service(provider)],
      { stdio: 'ignore' },
    );
  } catch {
    /* not present */
  }
}

// Returns { key, source } where source is 'env' | 'keychain' | 'file' | null.
export function getKey(provider) {
  const envName = providers[provider]?.envKey;
  if (envName && process.env[envName]) {
    return { key: process.env[envName], source: 'env' };
  }
  if (isMac) {
    const k = keychainGet(provider);
    if (k) return { key: k, source: 'keychain' };
  }
  const k = readFallback()[provider];
  if (k) return { key: k, source: 'file' };
  return { key: null, source: null };
}

export function setKey(provider, key) {
  if (isMac) {
    keychainSet(provider, key);
    return 'keychain';
  }
  const all = readFallback();
  all[provider] = key;
  writeFallback(all);
  return 'file';
}

export function deleteKey(provider) {
  if (isMac) keychainDelete(provider);
  const all = readFallback();
  delete all[provider];
  writeFallback(all);
}

export function authStatus() {
  return Object.keys(providers).map((p) => {
    const { key, source } = getKey(p);
    return {
      provider: p,
      ready: Boolean(key),
      source,
      masked: key ? `${key.slice(0, 6)}${'·'.repeat(10)}${key.slice(-4)}` : null,
    };
  });
}
