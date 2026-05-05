# CLAUDE.md

## Architecture

Angular v21 multi-project workspace with pnpm. Two apps:
- `public-app` (`projects/public-app/`) — SSR via Express + `@angular/ssr`
- `admin-app` (`projects/admin-app/`) — SSR via Express + `@angular/ssr`

### Key Stack

- **Angular 21** with strict TypeScript (ES2022 target, TS ~5.9)
- **Tailwind CSS v4** via PostCSS (per-project `.postcssrc.json`)
- **Angular Material + CDK** for UI components
- **@ngrx/signals** for state management
- **Vitest** for unit testing (with `jsdom`)
- **Firebase** — Auth, Firestore, Storage (project: `analog-jones-v2`)
- **Playwright** for e2e testing (Chromium, Firefox, WebKit)
- **Prettier** for formatting (single quotes, 100 char width)

### Core Library (`projects/core/`)

Single Angular library at `projects/core/` (package name `@aj/core`, generated via `ng generate library`). All domain services, stores, models, and shared infra live here. Apps consume it via the `@aj/core` path alias resolving directly to `projects/core/src/public-api`, so `ng build`/`ng test`/`ng serve` work on a clean checkout without prebuilding the lib. Run `pnpm build:core` only when you actually need the packaged output in `dist/core`.

Subfolders under `projects/core/src/lib/`:
- `category/`, `episode/`, `genre/`, `tag/`, `user/` — each with `<domain>.model.ts`, `<domain>.service.ts`, `<domain>.store.ts` (+ specs)
- `junction/` — many-to-many services: `episode-category.service.ts`, `episode-genre.service.ts`, `episode-tag.service.ts`
- `shared/` — cross-cutting infra only: `firebase.token.ts` (injection tokens `AUTH`, `FIRESTORE`, `STORAGE`, `STORAGE_OPS`) and `image-upload.service.ts`
- `styles/` — `theme.scss`, `theme-public.scss` (consumed via Sass `@use`, not exported from `public-api.ts`)

Each domain follows the same pattern:
- `<domain>.store.ts` — `signalStore` with `withState`, `withComputed`, `withMethods`
- `<domain>.service.ts` — Firebase data access

**Lib tests have their own target** — run `ng test core` (or `pnpm test:core`). They do NOT run under admin-app or public-app test targets.

**SEO** lives in `projects/public-app/src/app/seo/` (public-app-only — not part of `@aj/core`).

### Firebase

Each app has `projects/<app>/src/app/firebase.ts` exporting `auth`, `firestore`, `storage` directly. Uses Firebase modular SDK — NOT `@angular/fire`. Import instances directly in services.

Provided via injection tokens in each app's `app.config.ts`:
- **admin-app**: `AUTH`, `FIRESTORE`, `STORAGE`
- **public-app**: `FIRESTORE`, `STORAGE` only (no auth)

Connects to emulators when `environment.useEmulators` is true.

**Static SDK functions are wrapped in injection tokens.** Because `vi.mock()` is banned (see Testing), services do not call `firebase/firestore` or `firebase/storage` static functions directly. Instead they inject:
- `FIRESTORE_OPS` — `collection`, `doc`, `query`, `orderBy`, `where`, `limit`, `getDoc`, `getDocs`, `addDoc`, `updateDoc`, `writeBatch`
- `STORAGE_OPS` — `ref`, `uploadBytes`, `getDownloadURL`, `deleteObject`

Both are defined in `projects/core/src/lib/shared/firebase.token.ts` with default factories that return the real implementations, so app code is unaffected. Tests override them via `TestBed.configureTestingModule({ providers: [{ provide: FIRESTORE_OPS, useValue: ... }] })` to actually exercise service methods. Auth statics (`signInWithPopup`, `onAuthStateChanged`, etc.) are not wrapped yet — UserService's auth methods are intentionally left untested.

### Shell Layout

Root shell (`layout/shell/`) wraps all routes:
- `mat-toolbar` for desktop nav
- `mat-sidenav` at `position="end"` for mobile (hamburger at right end)
- `BreakpointObserver` (`Breakpoints.Handset`) drives `isMobile` signal
- Public-app shell has sticky footer with all nav links

## Testing

- Do NOT use `vi.mock()` — this is an Angular toolchain constraint, not a project convention. `@angular/build`'s unit-test builder (used by `ng test`) injects a `vitest-mock-patch` to integrate Vitest with Angular's compilation pipeline; that patch and `vi.mock()`'s module-hoisting/interception mechanism step on each other and produce flaky failures (passes locally, fails in CI, or vice versa). Any Angular project using `@angular/build` + Vitest hits the same issue — it would only go away by switching to Jest or running Vitest outside the Angular builder. Applies equally to core, admin-app, and public-app specs. Mock via TestBed injection tokens instead.
- Mock Firebase by providing fake values for `AUTH`, `FIRESTORE`, `STORAGE`, or `STORAGE_OPS` tokens (imported from `@aj/core`) in `TestBed.configureTestingModule`
- Use `vi.stubGlobal()` for browser APIs unavailable in jsdom (`OffscreenCanvas`, `createImageBitmap`)
- Detailed lib testing patterns (domain service / storage service / junction service / store) live in `projects/core/README.md`

## Angular Rules

- Do NOT set `standalone: true` — it's the default in Angular v20+
- Do NOT use `@HostBinding` / `@HostListener` — use `host: {}` in `@Component`/`@Directive` instead
- Do NOT use `ngClass` or `ngStyle` — use `class` and `style` bindings
- Use native control flow (`@if`, `@for`, `@switch`), not structural directives
- Use `input()` / `output()` functions, not decorators
- `NgOptimizedImage` for all static images (does not work for inline base64)
- `ChangeDetectionStrategy.OnPush` on all components
- Reactive forms over template-driven
- Do not assume globals like `new Date()` are available in templates

## State Management (@ngrx/signals)

```typescript
signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({ /* derived signals */ })),
  withMethods((store) => ({ /* async methods using patchState(store, {...}) */ }))
)
```

Use `patchState()` for mutations. Never use `mutate`.

## Accessibility

Must pass all AXE checks and meet WCAG AA minimums (focus management, color contrast, ARIA).

## Formatting

Prettier: single quotes, 100 char width.