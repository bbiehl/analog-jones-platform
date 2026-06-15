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
- **Firebase** — Auth, Firestore (project: `analog-jones-v2`; Cloud Storage is not used)
- **Playwright** for e2e testing (Chromium, Firefox, WebKit)
- **Prettier** for formatting (single quotes, 100 char width)

### Core Library (`projects/core/`)

Single Angular library at `projects/core/` (package name `@aj/core`, generated via `ng generate library`). All domain services, stores, models, and shared infra live here. Apps consume it via the `@aj/core` path alias resolving directly to `projects/core/src/public-api`, so `ng build`/`ng test`/`ng serve` work on a clean checkout without prebuilding the lib. Run `pnpm build:core` only when you actually need the packaged output in `dist/core`.

Subfolders under `projects/core/src/lib/`:

- `category/`, `episode/`, `genre/`, `tag/`, `user/` — each with `<domain>.model.ts`, `<domain>.service.ts`, `<domain>.store.ts` (+ specs)
- Taxonomy is **embedded denormalized** on the `Episode` document (`categories`/`genres`/`tags` arrays), not stored in junction collections. The `category`/`genre`/`tag` services own propagating name/slug edits and add/remove across episodes; there is no `junction/` folder.
- `shared/` — cross-cutting infra only: `firebase.token.ts` (injection tokens `AUTH`, `FIRESTORE`, and the `*_OPS` SDK-wrapper tokens) and `transfer-state.helpers.ts`
- `styles/` — `theme.scss`, `theme-public.scss` (consumed via Sass `@use`, not exported from `public-api.ts`)

Each domain follows the same pattern:

- `<domain>.store.ts` — `signalStore` with `withState`, `withComputed`, `withMethods`
- `<domain>.service.ts` — Firebase data access

**Lib tests have their own target** — run `ng test core` (or `pnpm test:core`). They do NOT run under admin-app or public-app test targets.

**SEO** lives in `projects/public-app/src/app/seo/` (public-app-only — not part of `@aj/core`).

### Firebase

Each app has `projects/<app>/src/app/firebase.ts` exporting `auth`, `firestore` directly. Uses Firebase modular SDK — NOT `@angular/fire`. Import instances directly in services.

Provided via injection tokens in each app's `app.config.ts`:

- **admin-app**: `AUTH`, `FIRESTORE`
- **public-app**: `FIRESTORE` only (no auth)

Connects to emulators when `environment.useEmulators` is true.

**Static SDK functions are wrapped in injection tokens.** Because `vi.mock()` is banned (see Testing), services do not call `firebase/firestore` or `firebase/auth` static functions directly. Instead they inject:

- `FIRESTORE_OPS` — `collection`, `doc`, `query`, `orderBy`, `where`, `limit`, `getDoc`, `getDocs`, `addDoc`, `updateDoc`, `writeBatch`
- `AUTH_OPS` — `GoogleAuthProvider`, `signInWithPopup`, `signOut`, `onAuthStateChanged`

Both are defined in `projects/core/src/lib/shared/firebase.token.ts` with default factories that return the real implementations, so app code is unaffected. Tests override them via `TestBed.configureTestingModule({ providers: [{ provide: <TOKEN>, useValue: ... }] })` to actually exercise service methods. When a service needs an SDK function not yet on the relevant `*Ops` interface, extend both the interface and the default factory together — both must list every op the service uses.

### Shell Layout

Root shell (`layout/shell/`) wraps all routes:

- `mat-toolbar` for desktop nav
- `mat-sidenav` at `position="end"` for mobile (hamburger at right end)
- `BreakpointObserver` (`Breakpoints.Handset`) drives `isMobile` signal
- Public-app shell has sticky footer with all nav links

## Testing

- Do NOT use `vi.mock()` — this is an Angular toolchain constraint, not a project convention. `@angular/build`'s unit-test builder (used by `ng test`) injects a `vitest-mock-patch` to integrate Vitest with Angular's compilation pipeline; that patch and `vi.mock()`'s module-hoisting/interception mechanism step on each other and produce flaky failures (passes locally, fails in CI, or vice versa). Any Angular project using `@angular/build` + Vitest hits the same issue — it would only go away by switching to Jest or running Vitest outside the Angular builder. Applies equally to core, admin-app, and public-app specs. Mock via TestBed injection tokens instead.
- Mock Firebase by providing fake values for `AUTH`, `FIRESTORE`, `FIRESTORE_OPS`, or `AUTH_OPS` tokens (imported from `@aj/core`) in `TestBed.configureTestingModule`
- Use `vi.stubGlobal()` for browser APIs unavailable in jsdom (`OffscreenCanvas`, `createImageBitmap`)
- Detailed lib testing patterns (domain service / store) live in `projects/core/README.md`

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
  withComputed((store) => ({
    /* derived signals */
  })),
  withMethods((store) => ({
    /* async methods using patchState(store, {...}) */
  })),
);
```

Use `patchState()` for mutations. Never use `mutate`.

## Accessibility

Must pass all AXE checks and meet WCAG AA minimums (focus management, color contrast, ARIA).

## Formatting

Prettier: single quotes, 100 char width.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
- Author a backlog-ready spec/issue → invoke /spec
