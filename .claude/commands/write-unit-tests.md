Write unit tests for the file(s) I provide using Vitest for Angular.

Rules:
- If a `.spec.ts` file does not exist, create it as `[filename].spec.ts` (e.g. `my-service.spec.ts`) co-located with the source file
- If a `.spec.ts` file already exists, add tests to it without removing existing ones
- Use Vitest (`import { describe, it, expect, vi, beforeEach } from 'vitest'`) — never jasmine or jest
- Use Angular's `TestBed` for components, directives, and services that require DI
- Use `ChangeDetectionStrategy.OnPush`-aware patterns: call `fixture.detectChanges()` after signal updates
- Lib tests (`libs/**/*.spec.ts`) run under admin-app only — do not add lib specs expecting public-app to pick them up

Mocking:
- Do NOT use `vi.mock()` — it conflicts with `@angular/build`'s vitest-mock-patch and causes flaky failures. Mock via TestBed providers / injection tokens instead.
- Mock Firebase by providing fake values for the `AUTH`, `FIRESTORE`, `STORAGE`, and `STORAGE_OPS` tokens (from `libs/shared/`) in `TestBed.configureTestingModule({ providers: [...] })`
- Mock other services by providing `{ provide: SomeService, useValue: { method: vi.fn() } }`
- Use `vi.fn()` / `vi.spyOn()` for individual functions
- Use `vi.stubGlobal()` for browser APIs unavailable in jsdom (e.g. `OffscreenCanvas`, `createImageBitmap`); reset with `vi.unstubAllGlobals()` in `afterEach` if needed

Signal stores (`@ngrx/signals`):
- Provide the store via `TestBed.inject(SomeStore)` after configuring providers for its dependencies
- Assert on signal values by calling them: `expect(store.items()).toEqual([...])`
- Test `withMethods` actions by invoking them and asserting the resulting state via `patchState`-driven signals

Test coverage — write tests for each category:
1. Happy paths — correct inputs produce expected outputs/state
2. Edge cases — boundary values, empty arrays, null/undefined inputs, empty strings
3. Error states — thrown errors, Firebase errors, rejected promises/observables
4. For UI testing, use Angular Material harnesses when possible.

Coverage tooling: uses `@vitest/coverage-v8`. Remind me to install if not present:
// pnpm add -D @vitest/coverage-v8

Reference existing specs for patterns:
- Service with Firestore: `libs/episode/episode.service.spec.ts`
- Signal store: `libs/episode/episode.store.spec.ts`
- Junction service: `libs/shared/episode-tag.service.spec.ts`
