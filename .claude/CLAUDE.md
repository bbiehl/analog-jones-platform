# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `pnpm run dev:public` — start Firebase emulators + public-app dev server concurrently
- `pnpm run dev:admin` — start Firebase emulators + admin-app dev server concurrently
- `pnpm start` / `ng serve` — serve public-app only (no emulators)
- `ng serve admin-app` — serve admin-app only (no emulators)
- `pnpm build` / `ng build` — production build (output: `dist/`)
- `pnpm run serve:ssr:public-app` — run SSR server after build (`node dist/public-app/server/server.mjs`)
- `pnpm test` / `ng test` — run all unit tests (Vitest) across both apps and libs concurrently
- `ng test public-app` / `ng test admin-app` — run tests for a specific project
- `ng test admin-app --include '**/image-upload*'` — run a single test file (glob pattern)
- `ng e2e` — run Playwright e2e tests (starts emulators + dev server automatically)
- `firebase emulators:start` — start Firebase emulators standalone
- `pnpm run dev:all` — start Firebase emulators + both public-app (4200) and admin-app (4300) dev servers
- `pnpm run emulators:stop` — kill emulator processes by port
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

### Shell Layout Pattern

Both apps use a root shell component (`layout/shell/`) that wraps all page routes:
- `mat-toolbar` for top navigation (shows nav links on desktop)
- `mat-sidenav` with `position="end"` for mobile navigation (hamburger icon at right end of toolbar)
- `BreakpointObserver` (CDK `Breakpoints.Handset`) drives the `isMobile` signal to toggle between toolbar links and sidenav
- All page routes are lazy-loaded children of the shell route
- Public-app shell includes a sticky footer with all nav links

### Routing

Routes are defined in `app.routes.ts` per app. All feature components use `loadComponent` for lazy loading. The root `App` component in both apps is just an inline `<router-outlet />`.

**Public-app SSR**: `app.routes.server.ts` sets `RenderMode.Client` for parameterized routes (`episodes/:id`, `tags/:id`) and `RenderMode.Prerender` for all static routes. New parameterized routes must be added here to avoid prerender build failures.

### Shared Libraries (`libs/`)

Domain libraries live in `libs/` — one per domain: `category/`, `episode/`, `genre/`, `tag/`, `user/`, plus `shared/` for cross-cutting concerns and `styles/` for shared CSS.

Each domain lib follows the pattern:
- `<domain>.store.ts` — `@ngrx/signals` signal store (`signalStore` with `withState`, `withComputed`, `withMethods`)
- `<domain>.service.ts` — Firebase data access service

The `libs/shared/` directory contains:
- `firebase.token.ts` — Injection tokens (`AUTH`, `FIRESTORE`, `STORAGE`, `STORAGE_OPS`) for Firebase services
- Junction services for many-to-many relationships (`episode-category`, `episode-genre`, `episode-tag`)
- `image-upload.service.ts` — Image compression and Firebase Storage upload

**Lib tests run under admin-app**: The `admin-app` test target includes `libs/**/*.spec.ts` via its `angular.json` config. Public-app does not run lib tests.

### Signal Stores (@ngrx/signals)

All domain stores use the same pattern:
```typescript
signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({ /* derived signals */ })),
  withMethods((store) => ({ /* async methods using patchState(store, {...}) */ }))
)
```

Stores manage loading/error state manually. Use `patchState()` for mutations — never `mutate`.

### Component selector prefix

All components use the `app` prefix (e.g., `selector: 'app-feature-name'`).

### Firebase & Emulators

Each app has a `firebase.ts` initialization file (`projects/<app>/src/app/firebase.ts`) that exports `auth`, `firestore`, and `storage` instances directly. Uses the Firebase modular SDK (`firebase/app`, `firebase/auth`, etc.) — NOT `@angular/fire`. Import these instances directly in services. Connects to local emulators when `environment.useEmulators` is true.

Firebase instances are provided via injection tokens defined in `libs/shared/firebase.token.ts` and registered in each app's `app.config.ts`:
- **admin-app** provides `AUTH`, `FIRESTORE`, `STORAGE` (full read/write access)
- **public-app** provides only `FIRESTORE` and `STORAGE` (read-only, no auth)

- **Emulator ports**: Auth (9099), Firestore (8080), Storage (9199), UI (4000)
- **Firestore rules** (`firestore.rules`): public read, admin-only write (checked via `role` field on user doc)
- **Storage rules** (`storage.rules`): public read, admin-only write

### Environment Configuration

Each app has two environment files:
- `environments/environment.ts` — dev (`production: false`, `useEmulators: true`)
- `environments/environment.prod.ts` — prod (`production: true`, `useEmulators: false`)

Angular CLI handles file replacement for production builds via `angular.json` `fileReplacements`.

### E2E Testing

Playwright config is at root `playwright.config.ts`. Tests live in `e2e/`. The config auto-starts Firebase emulators and the dev server. Base URL: `http://localhost:4200`.

## Testing

- Do NOT use `vi.mock()` — it conflicts with `@angular/build`'s vitest-mock-patch and causes flaky failures. Instead, mock dependencies via TestBed injection tokens.
- Mock Firebase services by providing fake values for `AUTH`, `FIRESTORE`, `STORAGE`, or `STORAGE_OPS` tokens in `TestBed.configureTestingModule({ providers: [...] })`
- Use `vi.stubGlobal()` for browser APIs not available in jsdom (e.g., `OffscreenCanvas`, `createImageBitmap`)
- Test files use `/// <reference types="vitest/globals" />` for global `vi`, `describe`, `expect`, etc.

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
