# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `pnpm start` / `ng serve` — serve the default project (public-app) on localhost
- `ng serve admin-app` — serve the admin app
- `pnpm build` / `ng build` — production build (output: `dist/`)
- `pnpm run serve:ssr:public-app` — run SSR server after build (`node dist/public-app/server/server.mjs`)
- `pnpm test` / `ng test` — run unit tests (Vitest)
- `ng test public-app` / `ng test admin-app` — run tests for a specific project

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
- **Firebase** (installed, integration in progress)
- **Prettier** for formatting (single quotes, 100 char width)

### Component selector prefix

All components use the `app` prefix (e.g., `selector: 'app-feature-name'`).

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
