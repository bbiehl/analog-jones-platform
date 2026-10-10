// Tests for scripts/deploy.mjs argument handling. Run with `pnpm test:scripts`.
// The script is spawned with fake `git`, `gcloud` and `pnpm` executables first
// on PATH, so nothing here can reach origin, Cloud Run or Firebase.
//
// Value: protects=`pnpm release` aborts on an unknown flag before any git,
//   gcloud or firebase command runs; fails_when=flag parsing goes back to
//   ignoring what it does not recognise, so `--dry-run --yes` starts a real
//   release; why_new=scripts/deploy.mjs had no tests; seam=none

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'deploy.mjs');

let dir;
let calls;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'deploy-test-'));
  calls = join(dir, 'calls.log');
  writeFileSync(calls, '');
  // Every fake only records that it was called, then fails.
  for (const name of ['git', 'gcloud', 'pnpm']) {
    writeFileSync(join(dir, name), `#!/bin/sh\necho "${name} $*" >> "$FAKE_CALLS"\nexit 1\n`);
    chmodSync(join(dir, name), 0o755);
  }
});

after(() => rmSync(dir, { recursive: true, force: true }));

beforeEach(() => writeFileSync(calls, ''));

for (const args of [['--dry-run', '--yes'], ['--dryrun'], ['extra']]) {
  test(`aborts before running anything when given ${args.join(' ')}`, () => {
    const res = spawnSync(process.execPath, [SCRIPT, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${dir}${delimiter}${process.env.PATH}`,
        FAKE_CALLS: calls,
      },
    });
    assert.equal(res.status, 1);
    assert.match(res.stderr, /Deploy aborted/);
    assert.equal(readFileSync(calls, 'utf8'), '');
  });
}

// The fake git exits 1, so an accepted flag gets as far as the first pre-flight
// command and stops there.
for (const flag of ['--yes', '-y']) {
  test(`accepts ${flag} and starts the pre-flight`, () => {
    const res = spawnSync(process.execPath, [SCRIPT, flag], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${dir}${delimiter}${process.env.PATH}`,
        FAKE_CALLS: calls,
      },
    });
    assert.equal(res.status, 1);
    assert.match(res.stderr, /git fetch failed/);
    assert.match(readFileSync(calls, 'utf8'), /^git fetch origin --prune\n/);
  });
}
