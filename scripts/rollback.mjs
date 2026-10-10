#!/usr/bin/env node
// Cloud Run rollback for the services `pnpm release` deploys. Shifts traffic to
// a named earlier revision, then redeploys Firebase Hosting.
//
// Why the Hosting step: public-app's HTML is CDN-cacheable (see the
// Cache-Control header in projects/public-app/src/server.ts) and every
// revision serves only its own hashed JS/CSS. Shifting Cloud Run traffic alone
// leaves the CDN handing out HTML from the newer build, whose chunks the older
// revision does not have — the page renders but never becomes interactive.
// A Hosting redeploy clears the CDN, which is what `pnpm release` step 7 already
// does on the way forward.
//
// A rolled-back service stays pinned to the named revision. There is no unpin
// command on purpose: unpinning before the fix is deployed would send traffic
// back to the release that was just rolled back. `pnpm release` moves traffic
// to the new revision itself after each deploy (scripts/deploy.mjs step 6).
//
// Not rolled back: Firestore rules and indexes. If the release being rolled
// back changed them, check out the previous Release_ branch and run
// `pnpm deploy:rules`. After the fix release, run `pnpm deploy:rules` again from
// main: the release skips rules that are unchanged since the previous release
// branch, so it would not undo that manual step.
//
// gstack-shortcut(dec-3156e726): covers rollback only; the window between a
// release's Cloud Run step and its Hosting step stays open. Upgrade when a
// stalled page is traced to a missing chunk after a release.
//
// Usage: pnpm rollback --list
//        pnpm rollback [--public <revision>] [--admin <revision>] [--dry-run] [--yes]
//   --list     print each service's serving revision and its recent revisions
//   --public   public-app revision to send 100% of traffic to
//   --admin    admin-app revision to send 100% of traffic to
//              (admin-app is not behind the Hosting CDN, so an admin-only
//              rollback does not redeploy Hosting)
//   --dry-run  print the commands without running them
//   --yes, -y  skip the interactive confirmation gate
//
// The Hosting redeploy publishes the firebase.json in this checkout, so run it
// from a checkout whose firebase.json matches the code being rolled back to.

import { execFileSync, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { parseArgs } from 'node:util';

const PROJECT = 'analog-jones-v2';
const REGION = 'us-central1';
// Admin first, matching the release order in scripts/deploy.mjs.
const SERVICES = [
  { option: 'admin', service: 'admin-app' },
  { option: 'public', service: 'public-app' },
];

function fail(message) {
  console.error(`\nRollback aborted — ${message}`);
  process.exit(1);
}

const failFrom = (err) => fail(err instanceof Error ? err.message : String(err));
process.on('unhandledRejection', failFrom);
process.on('uncaughtException', failFrom);

// Strict: an unknown flag (a typo such as --dryrun) or a flag missing its value
// throws here, before anything runs, instead of being ignored.
const { values: flags } = parseArgs({
  options: {
    list: { type: 'boolean' },
    public: { type: 'string' },
    admin: { type: 'string' },
    'dry-run': { type: 'boolean' },
    yes: { type: 'boolean', short: 'y' },
  },
  strict: true,
  allowPositionals: false,
});
const dryRun = flags['dry-run'] ?? false;

// Capture stdout from a command. Returns trimmed stdout; throws on non-zero exit.
function capture(cmd, cmdArgs) {
  return execFileSync(cmd, cmdArgs, { encoding: 'utf8' }).trim();
}

// Run a command with inherited stdio, or only print it under --dry-run.
// Returns the exit code.
function run(cmd, cmdArgs) {
  console.log(`  $ ${cmd} ${cmdArgs.join(' ')}`);
  if (dryRun) return 0;
  const res = spawnSync(cmd, cmdArgs, { stdio: 'inherit' });
  if (res.error) throw res.error;
  return res.status ?? 1;
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    // No terminal attached (stdin closed): answer nothing, which declines.
    rl.on('close', () => resolve(''));
    rl.question(question, (answer) => {
      resolve(answer.trim());
      rl.close();
    });
  });
}

const gcloudRun = (...rest) => ['run', ...rest, '--region', REGION, '--project', PROJECT];

// What is serving now, e.g. "public-app-00022-wgr 100%". A traffic target that
// names a revision instead of following the latest one is pinned.
function serving(service) {
  const described = JSON.parse(
    capture('gcloud', gcloudRun('services', 'describe', service, '--format=json(status.traffic)')),
  );
  const targets = described?.status?.traffic ?? [];
  if (targets.length === 0) return 'no traffic targets';
  return targets
    .map((t) => `${t.revisionName} ${t.percent ?? 0}%${t.latestRevision ? '' : ' (pinned)'}`)
    .join(', ');
}

// --- 1. Pre-flight -----------------------------------------------------------

let gcloudAuthed = false;
try {
  gcloudAuthed = /@/.test(
    capture('gcloud', ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
  );
} catch {
  gcloudAuthed = false;
}
if (!gcloudAuthed) {
  fail(`no active gcloud account. Run \`gcloud auth login\` for ${PROJECT}, then re-run.`);
}

// --- 2. --list ---------------------------------------------------------------

if (flags.list) {
  // --list changes nothing; exiting 0 next to rollback flags would read as a
  // completed rollback.
  if (Object.keys(flags).length > 1) fail('--list cannot be combined with other flags.');
  for (const { service } of SERVICES) {
    console.log(`\n${service} — serving: ${serving(service)}`);
    console.log(
      capture(
        'gcloud',
        gcloudRun(
          'revisions',
          'list',
          '--service',
          service,
          '--limit',
          '5',
          '--format=table(metadata.name,metadata.creationTimestamp,status.conditions[0].status)',
        ),
      ),
    );
  }
  process.exit(0);
}

// --- 3. Resolve targets ------------------------------------------------------

// An empty value (--public "$REV" with REV unset) must not quietly drop a service.
const targets = SERVICES.map((s) => ({ ...s, revision: flags[s.option] })).filter(
  (s) => s.revision !== undefined,
);
for (const { option, revision } of targets) {
  if (revision === '') fail(`--${option} was given an empty revision name.`);
}
if (targets.length === 0) {
  fail(
    'nothing to do. Pass --public <revision> and/or --admin <revision>. ' +
      'Run `pnpm rollback --list` to see revisions.',
  );
}

// A revision that is mistyped, belongs to another service or never became Ready
// would fail mid-rollback with one service already moved, so check all of them
// before moving anything.
for (const { service, revision } of targets) {
  if (!revision.startsWith(`${service}-`)) {
    fail(`revision "${revision}" does not belong to ${service}.`);
  }
  let described;
  try {
    described = JSON.parse(
      execFileSync(
        'gcloud',
        gcloudRun(
          'revisions',
          'describe',
          revision,
          '--format=json(metadata.labels,status.conditions)',
        ),
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
      ),
    );
  } catch (err) {
    const detail = String(err.stderr ?? '').trim() || err.message;
    fail(
      `could not look up revision "${revision}" for ${service}. Run \`pnpm rollback --list\` ` +
        `to see revisions.\n${detail}`,
    );
  }
  const owner = described?.metadata?.labels?.['serving.knative.dev/service'];
  if (owner !== service) {
    fail(`revision "${revision}" belongs to ${owner ?? 'an unknown service'}, not ${service}.`);
  }
  const ready = (described?.status?.conditions ?? []).find((c) => c.type === 'Ready');
  if (ready?.status !== 'True') {
    fail(`revision "${revision}" is not Ready, so it cannot take traffic.`);
  }
}

// Only public-app sits behind the Hosting CDN (firebase.json rewrites to it), so
// an admin-only rollback has no cached HTML to clear and leaves Hosting alone.
const clearCdn = targets.some((t) => t.service === 'public-app');

// The Hosting redeploy publishes the local firebase.json and firebase-public/;
// never ship files that are not committed, including untracked and git-ignored
// ones (Hosting uploads them all the same). `:/` anchors at the repo root.
const checkout = `${capture('git', ['rev-parse', '--abbrev-ref', 'HEAD'])} @ ${capture('git', ['rev-parse', '--short', 'HEAD'])}`;
if (
  clearCdn &&
  capture('git', [
    'status',
    '--porcelain',
    '--untracked-files=all',
    '--ignored',
    '--',
    ':/firebase.json',
    ':/firebase-public',
  ]) !== ''
) {
  fail(
    'firebase.json or firebase-public/ has uncommitted, untracked or ignored files, and the ' +
      'Hosting redeploy would publish them. Commit, stash or remove them, then re-run.',
  );
}

// Firebase auth is needed for the Hosting redeploy; check before moving traffic.
if (clearCdn && !dryRun) {
  let loggedIn = false;
  try {
    const accounts = capture('pnpm', ['exec', 'firebase', 'login:list']);
    loggedIn = !/No authorized accounts/i.test(accounts) && /@/.test(accounts);
  } catch {
    loggedIn = false;
  }
  if (!loggedIn) {
    fail(`no Firebase account is logged in. Run \`pnpm exec firebase login\`, then re-run.`);
  }
}

// --- 4. Confirmation gate ----------------------------------------------------

console.log(dryRun ? '\nDry run — nothing will change.\n' : '');
for (const { service, revision } of targets) {
  console.log(`  ${service}: ${serving(service)}  →  ${revision}`);
}
console.log(
  clearCdn
    ? `  Hosting: firebase deploy --only hosting, firebase.json from ${checkout}`
    : '  Hosting: not redeployed (admin-app is not behind the Hosting CDN)',
);
console.log('  Not rolled back: Firestore rules and indexes.');

if (!dryRun && !flags.yes) {
  const answer = await ask('\nProceed? (y/N) ');
  if (!/^y(es)?$/i.test(answer)) fail('cancelled at the confirmation gate.');
}

// --- 5. Shift Cloud Run traffic ----------------------------------------------

for (const { service, revision } of targets) {
  console.log(`\n▶ ${service} → ${revision}`);
  const code = run(
    'gcloud',
    gcloudRun('services', 'update-traffic', service, '--to-revisions', `${revision}=100`),
  );
  if (code !== 0) {
    fail(
      `gcloud run services update-traffic ${service} exited ${code}. Services listed ` +
        'before it have already moved; the CDN has not been cleared yet.',
    );
  }
}

// --- 6. Firebase Hosting (clears the CDN) ------------------------------------

if (clearCdn) {
  console.log('\n▶ Redeploying Firebase Hosting to clear the CDN…');
  const hostingCode = run('pnpm', [
    'exec',
    'firebase',
    'deploy',
    '--only',
    'hosting',
    '--project',
    PROJECT,
    '--non-interactive',
  ]);
  if (hostingCode !== 0) {
    fail(
      `firebase deploy --only hosting exited ${hostingCode}. Cloud Run traffic has moved, ` +
        'but the CDN may still serve pages from the other build. Re-run ' +
        '`pnpm exec firebase deploy --only hosting` once resolved.',
    );
  }
}

console.log(dryRun ? '\n✔ Dry run complete.' : '\n✔ Rollback complete.');
if (!dryRun) {
  console.log(
    'These services stay pinned until the next `pnpm release`, which moves traffic to ' +
      'the revision it deploys. If the rolled-back release changed Firestore rules or ' +
      'indexes, check out the previous Release_ branch and run `pnpm deploy:rules`; ' +
      'then, after the fix release, run `pnpm deploy:rules` from main, because the ' +
      'release only deploys rules that changed since the previous release branch.',
  );
}
