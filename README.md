# Analog Jones Platform

Angular 21 multi-project workspace powering two SSR apps on Firebase App Hosting, backed by Firestore, Firebase Auth, and Cloud Storage.

## Prerequisites

- Node.js 20+
- pnpm 10.28.2 (pinned via `packageManager`)
- Firebase CLI (installed as a dev dependency; `pnpm exec firebase ...`)

## Projects

- `projects/public-app` — public-facing SSR site
- `projects/admin-app` — internal admin SSR app
- `libs/` — shared domain libraries: `category`, `episode`, `genre`, `tag`, `user`, `shared`, `styles`

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
pnpm build:public
pnpm build:admin
```

SSR servers can be run locally from the build output:

```bash
pnpm serve:ssr:public-app
pnpm serve:ssr:admin-app
```

## Testing

```bash
pnpm test             # public + admin + libs, in parallel
pnpm test:public
pnpm test:admin
pnpm test:libs        # lib specs run under the admin-app test target
pnpm e2e              # Playwright
```

## Deployment

Both apps deploy via Firebase App Hosting using `apphosting.public.yaml` and `apphosting.admin.yaml`. Firestore and Storage rules/indexes are deployed separately:

```bash
pnpm deploy:rules
```

## Tech stack

- Angular 21 (SSR via `@angular/ssr` + Express)
- Tailwind CSS v4, Angular Material + CDK
- `@ngrx/signals` for state management
- Firebase modular SDK (Auth, Firestore, Storage)
- Vitest (unit), Playwright (e2e)

## Further reading

See `.claude/CLAUDE.md` for architecture notes, testing conventions, and Angular coding rules.
