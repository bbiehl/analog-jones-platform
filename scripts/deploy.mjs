#!/usr/bin/env node
// Automated App Hosting deploy orchestrator. Replaces the manual console flow:
// cut a dated release branch from main, roll out admin then public sequentially
// (rollouts can't run concurrently — `rollouts:create` blocks until each is
// terminal, so awaiting them in series serializes the requests for us), then
// deploy rules once (only if they changed) and run the write-defense probe.
//
// We use `firebase apphosting:rollouts:create <backend> --git-branch <branch>`
// to roll out a specific branch directly, so the console "Live branch" setting
// is never touched. The release branch must exist on `origin` (the GitHub repo
// connected to the backends) before rollout — App Hosting builds from there.
//
// Usage: pnpm release [--yes|-y]   (a.k.a. node scripts/deploy.mjs)
//   --yes  skip the interactive confirmation gate (for non-interactive runs)
//
// Named `release`, not `deploy`, in package.json: `pnpm deploy` is a reserved
// pnpm built-in (workspace-package deploy) and would shadow this script.

import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline';

const PROJECT = 'analog-jones-v2';
const ADMIN_BACKEND = 'analog-jones-platform';
const PUBLIC_BACKEND = 'public';
// Admin rolls out first as a lower-traffic smoke test before public.
const ROLLOUT_ORDER = [
  { app: 'admin-app', backend: ADMIN_BACKEND },
  { app: 'public-app', backend: PUBLIC_BACKEND },
];
// A change to any of these — including firestore.indexes.json — flips rulesChanged
// and triggers the deploy. Kept in sync with the `deploy:rules` script's
// `--only firestore:rules,firestore:indexes,storage` list so detection and deploy
// always cover the same surface (rules AND indexes).
const RULES_FILES = ['firestore.rules', 'firestore.indexes.json', 'storage.rules'];

// deploy:rules occasionally aborts on a transient Google API 5xx (e.g. a
// firebaserules 503) even though the rollouts already succeeded. Retry that step
// a few times, with backoff, before giving up.
const RULES_DEPLOY_ATTEMPTS = 3;

const autoYes = process.argv.slice(2).some((arg) => arg === '--yes' || arg === '-y');

function fail(message) {
  console.error(`\nDeploy aborted — ${message}`);
  process.exit(1);
}

// Capture stdout from a command. Returns trimmed stdout; throws on non-zero exit.
function capture(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' }).trim();
}

// Run a command with inherited stdio (streams progress live). Returns exit code.
function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.error) throw res.error;
  return res.status ?? 1;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Run a command, streaming output live AND capturing it (combined stdout+stderr)
// so the caller can classify a failure. Resolves { code, output }.
function runCapturing(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['inherit', 'pipe', 'pipe'] });
    let output = '';
    const tee = (src, dest) =>
      src.on('data', (chunk) => {
        output += chunk;
        dest.write(chunk);
      });
    tee(child.stdout, process.stdout);
    tee(child.stderr, process.stderr);
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

// Transient = flaky infrastructure worth retrying (Google API 5xx, network
// blips). Deterministic failures (rules compilation errors, 403s) deliberately
// do NOT match, so they fail fast instead of burning every retry.
function isTransient(output) {
  return /HTTP Error:\s*5\d\d|\b5\d\d\b.*(unavailable|internal)|is currently unavailable|temporarily unavailable|deadline exceeded|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(
    output,
  );
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// --- 1. Pre-flight -----------------------------------------------------------

console.log('Fetching latest from origin…');
try {
  capture('git', ['fetch', 'origin', '--prune']);
} catch (err) {
  fail(`git fetch failed: ${err.message}`);
}

// Firebase auth must be present, or every rollout call would prompt/fail.
let loggedIn = false;
try {
  const accounts = capture('pnpm', ['exec', 'firebase', 'login:list']);
  loggedIn = !/No authorized accounts/i.test(accounts) && /@/.test(accounts);
} catch {
  loggedIn = false;
}
if (!loggedIn) {
  fail(
    'no Firebase account is logged in. Run `pnpm exec firebase login` with an account ' +
      `that has App Hosting Admin on ${PROJECT}, then re-run.`,
  );
}

// --- 2. Compute the release branch name --------------------------------------

const now = new Date();
const date = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('-');

function remoteReleaseBranches() {
  // `git ls-remote --heads origin "Release_*"` → lines of "<sha>\trefs/heads/<name>".
  const out = capture('git', ['ls-remote', '--heads', 'origin', 'Release_*']);
  if (!out) return [];
  return out
    .split('\n')
    .map((line) => line.split('\t')[1]?.replace('refs/heads/', ''))
    .filter(Boolean);
}

const existing = remoteReleaseBranches();

const todaysVersions = existing
  .map((name) => {
    const m = name.match(new RegExp(`^Release_${date}\\.(\\d+)$`));
    return m ? Number(m[1]) : null;
  })
  .filter((v) => v !== null);
const version = todaysVersions.length ? Math.max(...todaysVersions) + 1 : 1;
const branch = `Release_${date}.${version}`;

// --- 3. Detect rules changes vs. the previous release branch -----------------

// Most-recent prior release by name (Release_<date>.<v> sorts lexically by date
// then numerically once zero-padded; version is single/low digits in practice,
// so sort by date desc then version desc).
function compareRelease(a, b) {
  const pa = a.match(/^Release_(\d{4}-\d{2}-\d{2})\.(\d+)$/);
  const pb = b.match(/^Release_(\d{4}-\d{2}-\d{2})\.(\d+)$/);
  if (!pa || !pb) return a < b ? 1 : -1;
  if (pa[1] !== pb[1]) return pa[1] < pb[1] ? 1 : -1;
  return Number(pb[2]) - Number(pa[2]);
}

const prevRelease = existing.filter((name) => name !== branch).sort(compareRelease)[0];

let rulesChanged;
let rulesReason;
if (!prevRelease) {
  rulesChanged = true;
  rulesReason = 'no prior release branch found — deploying rules by default';
} else {
  // Compare the rules files between the previous release and what we're about to
  // ship (origin/main). diff --quiet exits 1 when they differ.
  const res = spawnSync(
    'git',
    ['diff', '--quiet', `origin/${prevRelease}`, 'origin/main', '--', ...RULES_FILES],
    { stdio: 'ignore' },
  );
  if (res.status === 0) {
    rulesChanged = false;
    rulesReason = `unchanged since ${prevRelease}`;
  } else if (res.status === 1) {
    rulesChanged = true;
    rulesReason = `changed since ${prevRelease}`;
  } else {
    fail(`could not diff rules files against origin/${prevRelease} (git exit ${res.status}).`);
  }
}

// --- 4. Confirmation gate ----------------------------------------------------

console.log('\n──────────────────────────────────────────────');
console.log('  App Hosting deploy plan');
console.log('──────────────────────────────────────────────');
console.log(`  Project:        ${PROJECT}`);
console.log(`  Release branch: ${branch}  (cut from origin/main)`);
console.log(
  `  Rollout order:  ${ROLLOUT_ORDER.map((r) => `${r.app} [${r.backend}]`).join('  →  ')}`,
);
console.log(`  Rules+indexes:  ${rulesChanged ? 'YES' : 'no'} (${rulesReason})`);
console.log(`  Probe:          probe:write-defenses (after rollouts)`);
console.log('──────────────────────────────────────────────\n');

if (!autoYes) {
  const answer = await ask('Proceed? Type "yes" to continue: ');
  if (answer.toLowerCase() !== 'yes') {
    console.log('Aborted — nothing was changed.');
    process.exit(0);
  }
}

// --- 5. Cut + push the release branch ----------------------------------------
// Push origin/main directly to the new ref — never disturbs the local checkout.

console.log(`\nCreating release branch ${branch} from origin/main…`);
try {
  capture('git', ['push', 'origin', `origin/main:refs/heads/${branch}`]);
} catch (err) {
  fail(`could not push ${branch}: ${err.message}`);
}
console.log(`Pushed ${branch}.`);

// --- 6. Roll out each backend sequentially -----------------------------------

for (const { app, backend } of ROLLOUT_ORDER) {
  console.log(`\n▶ Rolling out ${app} (${backend}) from ${branch}…`);
  const code = run('pnpm', [
    'exec',
    'firebase',
    'apphosting:rollouts:create',
    backend,
    '--git-branch',
    branch,
    '--force',
    '--project',
    PROJECT,
  ]);
  if (code !== 0) {
    fail(
      `rollout for ${app} (${backend}) exited ${code}. ` +
        `The ${branch} branch is pushed; re-run after investigating, or roll out manually.`,
    );
  }
  console.log(`✔ ${app} rollout complete.`);
}

// --- 7. Rules (once, if changed) + probe -------------------------------------

if (rulesChanged) {
  console.log('\n▶ Deploying Firestore/Storage rules + indexes…');
  for (let attempt = 1; ; attempt++) {
    const { code, output } = await runCapturing('pnpm', ['run', 'deploy:rules']);
    if (code === 0) {
      console.log('✔ Rules + indexes deployed.');
      break;
    }

    const transient = isTransient(output);
    const lastAttempt = attempt >= RULES_DEPLOY_ATTEMPTS;
    if (!transient || lastAttempt) {
      fail(
        `deploy:rules exited ${code}` +
          (transient
            ? ` after ${attempt} attempts — transient API errors persisted.`
            : ' — non-transient failure (see output above).') +
          ' Both rollouts already completed, so re-run `pnpm deploy:rules` once resolved' +
          ' (no need to re-run the full release).',
      );
    }

    const backoffMs = 5000 * 2 ** (attempt - 1); // 5s, then 10s
    console.log(
      `\n⚠ deploy:rules hit a transient error (attempt ${attempt}/${RULES_DEPLOY_ATTEMPTS}). ` +
        `Retrying in ${backoffMs / 1000}s…`,
    );
    await sleep(backoffMs);
  }
} else {
  console.log(`\nSkipping rules deploy (${rulesReason}).`);
}

console.log('\n▶ Running write-defense probe…');
const probeCode = run('pnpm', ['run', 'probe:write-defenses']);

// --- 8. Summary --------------------------------------------------------------

console.log('\n──────────────────────────────────────────────');
console.log('  Deploy summary');
console.log('──────────────────────────────────────────────');
console.log(`  Branch:  ${branch}`);
console.log(`  admin-app:  https://${ADMIN_BACKEND}--${PROJECT}.us-central1.hosted.app`);
console.log(`  public-app: https://${PUBLIC_BACKEND}--${PROJECT}.us-central1.hosted.app`);
console.log(`  Rules+indexes:  ${rulesChanged ? 'deployed' : 'unchanged (skipped)'}`);
console.log(`  Probe:   ${probeCode === 0 ? 'PASS' : 'FAIL'}`);
console.log('──────────────────────────────────────────────');

if (probeCode !== 0) {
  fail('write-defense probe FAILED — prod write defenses may have regressed. Investigate now.');
}
console.log('\nDeploy complete.');
