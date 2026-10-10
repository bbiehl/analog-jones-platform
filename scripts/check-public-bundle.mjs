#!/usr/bin/env node
// Fails when the firebase/auth SDK is present in the built public-app bundle.
// public-app has no auth; the SDK gets pulled in whenever a file it imports
// (directly or through @aj/core) also imports `firebase/auth`, which costs
// every visitor about 90 kB on first load.
//
// admin-app does bundle firebase/auth, so its build is the positive control:
// if the marker is not found there either, the marker has gone stale and this
// check would pass without guarding anything.
//
// Usage: pnpm check:public-bundle   (after `pnpm build:public && pnpm build:admin`)

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_DIR = 'dist/public-app/browser';
const ADMIN_DIR = 'dist/admin-app/browser';
// The Identity Toolkit hostname only appears in the firebase/auth SDK.
const AUTH_MARKER = 'identitytoolkit';

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Names of the .js files under `dir` (any depth) that contain the marker.
function scan(dir, build) {
  if (!existsSync(dir)) fail(`${dir} not found. Run \`${build}\` first.`);
  const scripts = readdirSync(dir, { recursive: true }).filter((name) => name.endsWith('.js'));
  if (scripts.length === 0) fail(`No .js files in ${dir}; the build output looks wrong.`);
  return {
    count: scripts.length,
    hits: scripts.filter((name) => readFileSync(join(dir, name), 'utf8').includes(AUTH_MARKER)),
  };
}

const control = scan(ADMIN_DIR, 'pnpm build:admin');
if (control.hits.length === 0) {
  fail(
    `"${AUTH_MARKER}" was not found in the admin-app bundle, which does use firebase/auth. ` +
      'The marker no longer detects the SDK; update AUTH_MARKER in scripts/check-public-bundle.mjs.',
  );
}

const publicApp = scan(PUBLIC_DIR, 'pnpm build:public');
if (publicApp.hits.length > 0) {
  fail(
    `firebase/auth is bundled into public-app (${publicApp.hits.join(', ')}). ` +
      'Keep `firebase/auth` imports out of files public-app loads; the auth tokens ' +
      'live in projects/core/src/lib/shared/firebase-auth.token.ts for this reason.',
  );
}

console.log(`✔ public-app bundle has no firebase/auth (${publicApp.count} files checked).`);
