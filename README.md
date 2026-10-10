# Analog Jones Platform

Angular 22 multi-project workspace powering two SSR apps on Cloud Run (public-app fronted by the Firebase Hosting CDN), backed by Firestore, Firebase Auth, and Cloud Storage.

## Prerequisites

- Node.js 22+ (the deploy image runs `node:22-slim`)
- pnpm 10.28.2 (pinned via `packageManager`)
- Firebase CLI (installed as a dev dependency; `pnpm exec firebase ...`)

## Projects

- `projects/public-app` — public-facing SSR site
- `projects/admin-app` — internal admin SSR app
- `projects/core` — shared Angular library exposing all domain services/stores via `@aj/core` (subfolders: `category`, `episode`, `genre`, `tag`, `user`, `shared`, `styles`)

## Getting started

```bash
pnpm install
pnpm dev:all          # emulators + both apps (public on :4200, admin on :4300)
# or run one at a time:
pnpm dev:public
pnpm dev:admin
```

## Firebase emulators

Emulator data lives in `seed-data/` and is imported automatically by the `dev:*` scripts.

```bash
pnpm emulators:start  # start emulators without any app
pnpm emulators:save   # export current emulator state back to seed-data/
pnpm emulators:stop   # kill processes on emulator ports
```

## Building

```bash
pnpm build:core      # required before either app build (apps consume @aj/core from dist/)
pnpm build:public    # chains build:core automatically
pnpm build:admin     # chains build:core automatically
pnpm check:public-bundle   # after build:public + build:admin: fails if firebase/auth is in the public-app bundle
```

SSR servers can be run locally from the build output:

```bash
pnpm serve:ssr:public-app
pnpm serve:ssr:admin-app
```

## Testing

```bash
pnpm test             # public + admin + core, in parallel
pnpm test:public
pnpm test:admin
pnpm test:core        # runs the @aj/core library spec target
pnpm test:rules       # Firestore security rules, run against the firestore emulator
pnpm test:scripts     # release scripts (rollback), run against fake gcloud/pnpm/git
pnpm e2e              # Playwright
```

## Deployment

Both apps run on Cloud Run (one root `Dockerfile` builds both; the runtime `APP` env selects which `server.mjs` runs). `public-app` is fronted by the Firebase Hosting CDN via the catch-all rewrite in `firebase.json`. The whole release is automated:

```bash
pnpm release          # or `pnpm release --yes` to skip the confirmation prompt
```

With gstack, `/land-and-deploy` merges the PR, waits for CI, and afterwards verifies the Cloud Run revision and https://analogjonestof.com. It does not run the deploy itself: `pnpm release --yes` is still the step that ships, run right after the merge. Its settings live in the root `CLAUDE.md` under "Deploy Configuration".

> Named `release`, not `deploy`, because `pnpm deploy` is a reserved pnpm built-in (it would error with `ERR_PNPM_NOTHING_TO_DEPLOY`).

`pnpm release` (`scripts/deploy.mjs`):

1. Cuts a dated release branch `Release_YYYY-MM-DD.V` from the latest `origin/main` (auto-incrementing `V` for same-day re-cuts) and pushes it as an immutable deploy record. It also tags that commit `v<VERSION>` (from the `VERSION` file on `origin/main`); an existing tag is never moved, and a tag problem never blocks the deploy.
2. Builds + deploys **admin-app then public-app sequentially** to Cloud Run via `gcloud run deploy --source` from a throwaway git worktree pinned to the `origin/main` commit (so it ships `origin/main` verbatim without touching the local checkout). Per-service caps mirror the old config: public `--max-instances 10 --memory 512Mi`, admin `--max-instances 3 --memory 256Mi`. Only `APP` is updated via `--update-env-vars`, so other env vars survive. After each service deploys, `gcloud run services update-traffic <service> --to-latest` routes traffic to the new revision, which also unpins a service that was rolled back.
3. Deploys Firebase Hosting (the CDN rewrite → `public-app`).
4. Deploys rules **only if** `firestore.rules` or `firestore.indexes.json` changed since the previous release branch, then runs the write-defense probe once.

`--yes` (`-y`) is the only flag. Any other flag aborts the release before anything runs; there is no dry-run mode.

**Prerequisites:** an active `gcloud auth login` account with Cloud Run Admin + Cloud Build Editor on `analog-jones-v2`, and `pnpm exec firebase login` with an account that can deploy Firestore/Storage rules and Hosting.

To deploy only Firestore/Storage rules and indexes without a full release:

```bash
pnpm deploy:rules
```

To roll back a release (`scripts/rollback.mjs`), pin one or both Cloud Run services to an earlier revision:

```bash
pnpm rollback --list                                   # serving + recent revisions per service
pnpm rollback --public <revision> --admin <revision>   # either flag alone also works
```

Add `--dry-run` to print the commands without running them, or `--yes` to skip the confirmation prompt. When public-app is among the targets, the script also redeploys Firebase Hosting to clear the CDN; an admin-only rollback leaves Hosting alone. A rolled-back service stays pinned to that revision until the next `pnpm release`. Firestore rules and indexes are not rolled back. The full procedure is in the root `CLAUDE.md` under "Custom deploy hooks".

## Operational checks

```bash
pnpm probe:write-defenses   # verify unauthorized writes to prod Firestore + Storage are rejected
```

Sends token-less create/update/delete REST calls against sentinel paths; exits 0 only if every probe is rejected (rules + any App Check enforcement holding). The denial source (rules vs. App Check) is intentionally opaque — what matters is the combined write defense.

## Public client config in this repo

`projects/*/src/environments/environment*.ts` contains two values that look sensitive but are intentionally committed:

- **`firebaseConfig`** (apiKey, projectId, appId, etc.) — the Firebase Web SDK requires these in the browser to reach the project. They are identifiers, not secrets. Access is gated by Firestore/Storage **security rules** and **Firebase Authentication**, not by hiding the config. See [Firebase docs: "Is it safe to expose Firebase apiKey to the public?"](https://firebase.google.com/docs/projects/api-keys).
- **`recaptchaSiteKey`** — reCAPTCHA Enterprise _site_ keys are designed to be public. The matching _secret_ key never leaves Google's servers. The site key is bound to the registered domains (App Hosting URLs + custom domains), so it can't be reused from a different origin.

The defense against a malicious clone of this repo is:

1. **Security rules** (`firestore.rules`, `storage.rules`) — only authorized users can read/write protected paths.
2. **Firebase App Check** with reCAPTCHA Enterprise — once enforced, Firestore and Storage reject requests that don't carry a valid attestation token, and tokens are only issuable from the registered origins.

**Never commit:** service-account JSON keys, Firebase Admin SDK credentials, reCAPTCHA _secret_ keys, or any value with `private_key` / `client_secret` in it.

## Tech stack

- Angular 22 (SSR via `@angular/ssr` + Express)
- Tailwind CSS v4, Angular Material + CDK
- `@ngrx/signals` for state management
- Firebase modular SDK (Auth, Firestore, Storage)
- Vitest (unit), Playwright (e2e)

## Further reading

See `CLAUDE.md` for architecture notes, testing conventions, and Angular coding rules.
