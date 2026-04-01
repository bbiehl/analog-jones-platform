# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `pnpm run dev:public` — start Firebase emulators + public-app dev server concurrently
- `pnpm run dev:admin` — start Firebase emulators + admin-app dev server concurrently
- `pnpm start` / `ng serve` — serve public-app only (no emulators)
- `ng serve admin-app` — serve admin-app only (no emulators)
- `pnpm build` / `ng build` — production build (output: `dist/`)
- `pnpm run serve:ssr:public-app` — run SSR server after build (`node dist/public-app/server/server.mjs`)
- `pnpm test` / `ng test` — run unit tests (Vitest)
- `ng test public-app` / `ng test admin-app` — run tests for a specific project
- `ng e2e` — run Playwright e2e tests (starts emulators + dev server automatically)
- `firebase emulators:start` — start Firebase emulators standalone
- `pnpm run deploy:rules` — deploy Firestore & Storage rules to production

## Architecture

This is an **Angular v21 multi-project workspace** managed by Angular CLI with **pnpm**.

### Projects

| Project | Path | SSR | Purpose |
|---|---|---|---|
| `public-app` | `projects/public-app/` | Yes (Express + `@angular/ssr`) | Public-facing site |
| `admin-app` | `projects/admin-app/` | No | Admin dashboard |

### Key Stack

- **Angular 21** with strict TypeScript (ES2022 target, TS ~5.9)
- **Tailwind CSS v4** via PostCSS (per-project `.postcssrc.json`)
- **Angular Material + CDK** for UI components
- **@ngrx/signals** for state management
- **Vitest** for unit testing (with `jsdom`)
- **Firebase** — Auth, Firestore, Storage (project: `analog-jones-v2`)
- **Playwright** for e2e testing (Chromium, Firefox, WebKit)
- **Prettier** for formatting (single quotes, 100 char width)

### Component selector prefix

All components use the `app` prefix (e.g., `selector: 'app-feature-name'`).

### Firebase & Emulators

Each app has a `firebase.ts` initialization file (`projects/<app>/src/app/firebase.ts`) that connects to local emulators when `environment.useEmulators` is true.

- **Emulator ports**: Auth (9099), Firestore (8080), Storage (9199), UI (4000)
- **Firestore rules** (`firestore.rules`): public read, admin-only write (checked via `isAdmin` field on user doc)
- **Storage rules** (`storage.rules`): public read, admin-only write

### Environment Configuration

Each app has two environment files:
- `environments/environment.ts` — dev (`production: false`, `useEmulators: true`)
- `environments/environment.prod.ts` — prod (`production: true`, `useEmulators: false`)

Angular CLI handles file replacement for production builds via `angular.json` `fileReplacements`.

### E2E Testing

Playwright config is at root `playwright.config.ts`. Tests live in `e2e/`. The config auto-starts Firebase emulators and the dev server. Base URL: `http://localhost:4200`.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
