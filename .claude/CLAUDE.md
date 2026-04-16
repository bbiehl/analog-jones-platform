# CLAUDE.md

## Architecture

Angular v21 multi-project workspace with pnpm. Two apps:
- `public-app` (`projects/public-app/`) — SSR via Express + `@angular/ssr`
- `admin-app` (`projects/admin-app/`) — SSR via Express + `@angular/ssr`

### Shared Libraries (`libs/`)

One lib per domain: `category/`, `episode/`, `genre/`, `tag/`, `user/`, `shared/`, `styles/`.

Each domain lib:
- `<domain>.store.ts` — `signalStore` with `withState`, `withComputed`, `withMethods`
- `<domain>.service.ts` — Firebase data access

`libs/shared/` has injection tokens (`AUTH`, `FIRESTORE`, `STORAGE`, `STORAGE_OPS`) and junction services for many-to-many relationships.

**Lib tests run under admin-app only** — `admin-app` test target includes `libs/**/*.spec.ts`. Public-app does not.

### Firebase

Each app has `projects/<app>/src/app/firebase.ts` exporting `auth`, `firestore`, `storage` directly. Uses Firebase modular SDK — NOT `@angular/fire`. Import instances directly in services.

Provided via injection tokens in each app's `app.config.ts`:
- **admin-app**: `AUTH`, `FIRESTORE`, `STORAGE`
- **public-app**: `FIRESTORE`, `STORAGE` only (no auth)

Connects to emulators when `environment.useEmulators` is true.

### Shell Layout

Root shell (`layout/shell/`) wraps all routes:
- `mat-toolbar` for desktop nav
- `mat-sidenav` at `position="end"` for mobile (hamburger at right end)
- `BreakpointObserver` (`Breakpoints.Handset`) drives `isMobile` signal
- Public-app shell has sticky footer with all nav links

## Testing

- Do NOT use `vi.mock()` — conflicts with `@angular/build`'s vitest-mock-patch, causes flaky failures. Mock via TestBed injection tokens instead.
- Mock Firebase by providing fake values for `AUTH`, `FIRESTORE`, `STORAGE`, or `STORAGE_OPS` tokens in `TestBed.configureTestingModule`
- Use `vi.stubGlobal()` for browser APIs unavailable in jsdom (`OffscreenCanvas`, `createImageBitmap`)

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