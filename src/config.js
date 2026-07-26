import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// PIXELCLI_CONFIG_DIR overrides the config location; the test suite points it at
// a mktemp dir so a test run can never touch the real config.
const overrideDir = process.env.PIXELCLI_CONFIG_DIR;
const dir = overrideDir ?? path.join(os.homedir(), '.config', 'pixelcli');
const file = path.join(dir, 'config.json');

const DEFAULTS = { model: 'claude-sonnet-5' };

export function loadConfig() {
  try {
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveConfig(patch) {
  const next = { ...loadConfig(), ...patch };
  try {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.writeFileSync(file, JSON.stringify(next, null, 2), { mode: 0o600 });
  } catch {
    /* keep the in-memory config if disk is not writable */
  }
  return next;
}

export function configPath() {
  return file;
}
