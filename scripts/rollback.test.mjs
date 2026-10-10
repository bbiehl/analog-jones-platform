// Tests for scripts/rollback.mjs. Run with `pnpm test:scripts` (Node's built-in
// test runner). The script is spawned with fake `gcloud`, `pnpm` and `git`
// executables first on PATH, so nothing here can reach Cloud Run or Firebase.
//
// Value: protects=no update-traffic call when a revision is missing, unknown or
//   belongs to the other service, or a flag is misspelled; fails_when=validation
//   moves after the traffic loop, the service-prefix check is dropped or unknown
//   flags are ignored again; why_new=scripts/ had no tests; seam=none
// Value: protects=admin-app then public-app get --to-revisions <rev>=100, then
//   firebase deploy --only hosting; fails_when=order, flag or the hosting step
//   changes; why_new=scripts/ had no tests; seam=none
// Value: protects=--dry-run and --list never invoke update-traffic or firebase
//   deploy; fails_when=run() loses its dryRun early return or --list falls
//   through to target resolution; why_new=scripts/ had no tests; seam=none
// Value: protects=a missing Firebase login or a dirty firebase.json aborts
//   before traffic moves, and a failed traffic shift or hosting deploy exits 1
//   with the partial-state message; fails_when=a pre-flight moves below the
//   traffic loop or an exit code is ignored; why_new=scripts/ had no tests;
//   seam=none

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'rollback.mjs');
const ADMIN_REV = 'admin-app-00001-aaa';
const PUBLIC_REV = 'public-app-00001-bbb';

// Each fake appends its arguments to $FAKE_CALLS, then answers from FAKE_* env.
const FAKES = {
  gcloud: `#!/bin/sh
echo "gcloud $*" >> "$FAKE_CALLS"
case "$1 $2 $3" in
  "auth list "*) [ -n "$FAKE_NO_ACCOUNT" ] || echo "host@example.com" ;;
  "run revisions describe")
    case " $FAKE_REVISIONS " in
      *" $4 "*)
        printf '{"metadata":{"labels":{"serving.knative.dev/service":"%s"}},"status":{"conditions":[{"type":"Ready","status":"%s"}]}}\\n' "\${FAKE_OWNER:-\${4%-*-*}}" "\${FAKE_READY:-True}" ;;
      *) echo "ERROR: (gcloud.run.revisions.describe) Cannot find revision [$4]" >&2; exit 1 ;;
    esac ;;
  "run revisions list") echo "NAME  CREATION_TIMESTAMP  STATUS" ;;
  "run services describe")
    printf '{"status":{"traffic":[{"revisionName":"%s-00009-zzz","percent":100%s}]}}\\n' "$4" "\${FAKE_PINNED-,\\"latestRevision\\":true}" ;;
  "run services update-traffic") exit "\${FAKE_TRAFFIC_EXIT:-0}" ;;
esac
`,
  pnpm: `#!/bin/sh
echo "pnpm $*" >> "$FAKE_CALLS"
case "$3" in
  login:list)
    if [ -n "$FAKE_NO_FIREBASE" ]; then echo "No authorized accounts, run \\"firebase login\\""
    else echo "Logged in as host@example.com"; fi ;;
  deploy) exit "\${FAKE_HOSTING_EXIT:-0}" ;;
esac
`,
  git: `#!/bin/sh
case "$1" in
  status)
    echo "git $*" >> "$FAKE_CALLS"
    [ -z "$FAKE_DIRTY_HOSTING" ] || echo "!! firebase-public/firebase-debug.log" ;;
  rev-parse) case "$2" in --abbrev-ref) echo "main" ;; *) echo "abc1234" ;; esac ;;
esac
`,
};

let dir;
let calls;

before(() => {
  dir = mkdtempSync(join(tmpdir(), 'rollback-test-'));
  calls = join(dir, 'calls.log');
  for (const [name, body] of Object.entries(FAKES)) {
    writeFileSync(join(dir, name), body);
    chmodSync(join(dir, name), 0o755);
  }
});

after(() => rmSync(dir, { recursive: true, force: true }));

beforeEach(() => writeFileSync(calls, ''));

function rollback(args, { env = {}, input = '' } = {}) {
  const res = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: 'utf8',
    input,
    env: {
      ...process.env,
      PATH: `${dir}${delimiter}${process.env.PATH}`,
      FAKE_CALLS: calls,
      FAKE_REVISIONS: `${ADMIN_REV} ${PUBLIC_REV}`,
      ...env,
    },
  });
  return { code: res.status, out: res.stdout + res.stderr, calls: readFileSync(calls, 'utf8') };
}

const mutating = (log) =>
  log.split('\n').filter((line) => /update-traffic|firebase deploy/.test(line));

test('aborts before moving traffic when a revision does not exist', () => {
  const res = rollback(['--public', 'public-app-00404-nope', '--admin', ADMIN_REV, '--yes']);
  assert.equal(res.code, 1);
  assert.match(res.out, /could not look up revision "public-app-00404-nope" for public-app/);
  assert.match(res.out, /Cannot find revision \[public-app-00404-nope\]/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts when a revision belongs to the other service', () => {
  const res = rollback(['--public', ADMIN_REV, '--yes']);
  assert.equal(res.code, 1);
  assert.match(res.out, /does not belong to public-app/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts when a service flag has no revision', () => {
  const res = rollback(['--public', '--yes']);
  assert.equal(res.code, 1);
  assert.match(res.out, /Rollback aborted/);
  assert.equal(res.calls, '');
});

test('aborts on an unknown flag instead of ignoring it', () => {
  const res = rollback(['--public', PUBLIC_REV, '--dryrun', '--yes']);
  assert.equal(res.code, 1);
  assert.match(res.out, /Rollback aborted — .*--dryrun/);
  assert.equal(res.calls, '');
});

test('aborts when a revision is not Ready', () => {
  const res = rollback(['--public', PUBLIC_REV, '--admin', ADMIN_REV, '--yes'], {
    env: { FAKE_READY: 'False' },
  });
  assert.equal(res.code, 1);
  assert.match(res.out, /is not Ready/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts when the revision is labelled for a different service', () => {
  const res = rollback(['--public', PUBLIC_REV, '--yes'], {
    env: { FAKE_OWNER: 'public-app-staging' },
  });
  assert.equal(res.code, 1);
  assert.match(res.out, /belongs to public-app-staging, not public-app/);
  assert.deepEqual(mutating(res.calls), []);
});

test('--list refuses to run next to rollback flags', () => {
  const res = rollback(['--list', '--public', PUBLIC_REV, '--yes']);
  assert.equal(res.code, 1);
  assert.match(res.out, /--list cannot be combined with other flags/);
  assert.deepEqual(mutating(res.calls), []);
});

test('an admin-only rollback leaves Hosting alone', () => {
  const res = rollback(['--admin', ADMIN_REV, '--yes'], { env: { FAKE_DIRTY_HOSTING: '1' } });
  assert.equal(res.code, 0);
  const steps = mutating(res.calls);
  assert.equal(steps.length, 1);
  assert.match(steps[0], new RegExp(`update-traffic admin-app --to-revisions ${ADMIN_REV}=100`));
  assert.match(res.out, /Hosting: not redeployed/);
  assert.doesNotMatch(res.calls, /login:list|git status/);
});

test('aborts with nothing to do when no target is given', () => {
  const res = rollback([]);
  assert.equal(res.code, 1);
  assert.match(res.out, /nothing to do/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts when no gcloud account is active', () => {
  const res = rollback(['--public', PUBLIC_REV, '--yes'], { env: { FAKE_NO_ACCOUNT: '1' } });
  assert.equal(res.code, 1);
  assert.match(res.out, /no active gcloud account/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts before moving traffic when no Firebase account is logged in', () => {
  const res = rollback(['--public', PUBLIC_REV, '--admin', ADMIN_REV, '--yes'], {
    env: { FAKE_NO_FIREBASE: '1' },
  });
  assert.equal(res.code, 1);
  assert.match(res.out, /no Firebase account is logged in/);
  assert.match(res.calls, /login:list/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts before moving traffic when firebase.json has uncommitted changes', () => {
  const res = rollback(['--public', PUBLIC_REV, '--yes'], { env: { FAKE_DIRTY_HOSTING: '1' } });
  assert.equal(res.code, 1);
  assert.match(res.out, /firebase-public\/ has uncommitted, untracked or ignored files/);
  assert.match(res.calls, /git status --porcelain --untracked-files=all --ignored/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts when the confirmation gate is declined', () => {
  const res = rollback(['--public', PUBLIC_REV], { input: 'n\n' });
  assert.equal(res.code, 1);
  assert.match(res.out, /cancelled at the confirmation gate/);
  assert.deepEqual(mutating(res.calls), []);
});

test('aborts with a message when stdin is closed at the confirmation gate', () => {
  const res = rollback(['--public', PUBLIC_REV]);
  assert.equal(res.code, 1);
  assert.match(res.out, /cancelled at the confirmation gate/);
  assert.deepEqual(mutating(res.calls), []);
});

test('proceeds when the confirmation gate is answered y', () => {
  const res = rollback(['--public', PUBLIC_REV], { input: 'y\n' });
  assert.equal(res.code, 0);
  assert.equal(mutating(res.calls).length, 2);
  assert.match(res.out, /Rollback complete/);
});

test('aborts when a revision value is empty instead of dropping that service', () => {
  const res = rollback(['--public', '', '--admin', ADMIN_REV, '--yes']);
  assert.equal(res.code, 1);
  assert.match(res.out, /--public was given an empty revision name/);
  assert.deepEqual(mutating(res.calls), []);
});

test('--list prints serving and recent revisions and changes nothing', () => {
  const res = rollback(['--list'], { env: { FAKE_PINNED: '' } });
  assert.equal(res.code, 0);
  assert.match(res.out, /admin-app — serving: admin-app-00009-zzz 100% \(pinned\)/);
  assert.match(res.out, /public-app — serving: public-app-00009-zzz 100% \(pinned\)/);
  assert.match(res.calls, /gcloud run revisions list --service admin-app --limit 5/);
  assert.deepEqual(mutating(res.calls), []);
  assert.doesNotMatch(res.calls, /login:list/);
});

test('--dry-run prints the plan and the commands and changes nothing', () => {
  const res = rollback(['--admin', ADMIN_REV, '--public', PUBLIC_REV, '--dry-run']);
  assert.equal(res.code, 0);
  assert.match(res.out, new RegExp(`update-traffic admin-app --to-revisions ${ADMIN_REV}=100`));
  assert.match(res.out, new RegExp(`update-traffic public-app --to-revisions ${PUBLIC_REV}=100`));
  assert.match(res.out, /firebase deploy --only hosting/);
  assert.match(res.out, /firebase\.json from main @ abc1234/);
  assert.match(res.out, /Not rolled back: Firestore rules and indexes/);
  assert.doesNotMatch(res.out, /\(pinned\)/);
  assert.deepEqual(mutating(res.calls), []);
  assert.doesNotMatch(res.calls, /login:list/);
});

test('shifts admin-app, then public-app, then redeploys Hosting', () => {
  const res = rollback(['--public', PUBLIC_REV, '--admin', ADMIN_REV, '--yes']);
  assert.equal(res.code, 0);
  const steps = mutating(res.calls);
  assert.equal(steps.length, 3);
  assert.match(steps[0], new RegExp(`update-traffic admin-app --to-revisions ${ADMIN_REV}=100`));
  assert.match(steps[1], new RegExp(`update-traffic public-app --to-revisions ${PUBLIC_REV}=100`));
  assert.match(steps[2], /pnpm exec firebase deploy --only hosting --project analog-jones-v2/);
  assert.match(res.out, /stay pinned until the next `pnpm release`/);
});

test('stops before Hosting when a traffic shift fails', () => {
  const res = rollback(['--admin', ADMIN_REV, '--public', PUBLIC_REV, '--yes'], {
    env: { FAKE_TRAFFIC_EXIT: '7' },
  });
  assert.equal(res.code, 1);
  assert.match(res.out, /update-traffic admin-app exited 7/);
  assert.equal(mutating(res.calls).length, 1);
});

test('exits 1 and says the CDN may be stale when the Hosting redeploy fails', () => {
  const res = rollback(['--public', PUBLIC_REV, '--yes'], { env: { FAKE_HOSTING_EXIT: '3' } });
  assert.equal(res.code, 1);
  assert.match(res.out, /firebase deploy --only hosting exited 3/);
  assert.match(res.out, /CDN may still serve pages from the other build/);
});
