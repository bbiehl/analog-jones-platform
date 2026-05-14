# Analog Jones Platform

Angular 21 multi-project workspace powering two SSR apps on Firebase App Hosting, backed by Firestore, Firebase Auth, and Cloud Storage.

## Prerequisites

- Node.js 20+
- pnpm 10.28.2 (pinned via `packageManager`)
- Firebase CLI (installed as a dev dependency; `pnpm exec firebase ...`)

## Projects

- `projects/public-app` — public-facing SSR site
- `projects/admin-app` — internal admin SSR app
- `projects/core` — shared Angular library exposing all domain services/stores via `@aj/core` (subfolders: `category`, `episode`, `genre`, `tag`, `user`, `junction`, `shared`, `styles`)

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
pnpm e2e              # Playwright
```

## Deployment

Both apps deploy via Firebase App Hosting using `apphosting.public.yaml` and `apphosting.admin.yaml`. Firestore and Storage rules/indexes are deployed separately:

```bash
pnpm deploy:rules
```

## Operational checks

```bash
pnpm probe:write-defenses   # verify unauthorized writes to prod Firestore + Storage are rejected
```

Sends token-less create/update/delete REST calls against sentinel paths; exits 0 only if every probe is rejected (rules + any App Check enforcement holding). The denial source (rules vs. App Check) is intentionally opaque — what matters is the combined write defense.

## Public client config in this repo

`projects/*/src/environments/environment*.ts` contains two values that look sensitive but are intentionally committed:

- **`firebaseConfig`** (apiKey, projectId, appId, etc.) — the Firebase Web SDK requires these in the browser to reach the project. They are identifiers, not secrets. Access is gated by Firestore/Storage **security rules** and **Firebase Authentication**, not by hiding the config. See [Firebase docs: "Is it safe to expose Firebase apiKey to the public?"](https://firebase.google.com/docs/projects/api-keys).
- **`recaptchaSiteKey`** — reCAPTCHA Enterprise *site* keys are designed to be public. The matching *secret* key never leaves Google's servers. The site key is bound to the registered domains (App Hosting URLs + custom domains), so it can't be reused from a different origin.

The defense against a malicious clone of this repo is:
1. **Security rules** (`firestore.rules`, `storage.rules`) — only authorized users can read/write protected paths.
2. **Firebase App Check** with reCAPTCHA Enterprise — once enforced, Firestore and Storage reject requests that don't carry a valid attestation token, and tokens are only issuable from the registered origins.

**Never commit:** service-account JSON keys, Firebase Admin SDK credentials, reCAPTCHA *secret* keys, or any value with `private_key` / `client_secret` in it.

## Tech stack

- Angular 21 (SSR via `@angular/ssr` + Express)
- Tailwind CSS v4, Angular Material + CDK
- `@ngrx/signals` for state management
- Firebase modular SDK (Auth, Firestore, Storage)
- Vitest (unit), Playwright (e2e)

## Further reading

See `.claude/CLAUDE.md` for architecture notes, testing conventions, and Angular coding rules.
