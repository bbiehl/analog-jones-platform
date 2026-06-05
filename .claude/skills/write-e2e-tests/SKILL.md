---
name: write-e2e-tests
description: Write or extend Playwright end-to-end tests for `public-app` and `admin-app` in this workspace. Use when the user asks for an e2e test, browser test, user-flow test, or Playwright spec for a route, page, or feature. Tests run against the Firebase emulator suite seeded from `seed-data/`. Follows a Page Object Model under `e2e/pages/` and covers happy paths, edge cases, and selected user-facing error states only.
---

# write-e2e-tests

Write Playwright e2e tests for the route or feature the user provides. Tests run against the Firebase emulator suite, populated from `seed-data/` on emulator start. Default browser project is `chromium`; `firefox` and `webkit` are also configured in `playwright.config.ts`.

## File placement

- Specs live under `e2e/<app>/<feature>.spec.ts` — split by app: `e2e/public/` or `e2e/admin/`.
- Page objects live under `e2e/pages/<app>/<page>.page.ts`.
- Shared fixtures (auth, custom test factories) live under `e2e/fixtures/`.
- Persisted auth `storageState` files live under `e2e/.auth/` (gitignored).
- If a spec for the feature already exists, **add** tests to it without removing existing ones.

## Running tests

- Full run: `pnpm e2e` (builds `@aj/core`, then `ng e2e`).
- Single file: `pnpm exec playwright test e2e/public/episode-detail.spec.ts`.
- Debug UI: `pnpm exec playwright test --ui`.
- Local dev URLs (when emulators are running): public-app at `http://localhost:4200`, admin-app at `http://localhost:4300`.
- Playwright's `webServer` currently boots only the emulators and `public-app` on `:4200`. To run admin-app specs, add a second `webServer` entry running `ng serve admin-app --port 4300`. Do **not** add a second emulator entry — share the existing one.
- Admin-app specs should target `http://localhost:4300` either via a Playwright project with `use: { baseURL: 'http://localhost:4300' }` or via absolute URLs in the page object's `goto()`.

## Emulators and seed data

- Tests rely on `seed-data/` being imported by the emulator (already wired into the `webServer` `firebase emulators:start` entry — note that the production command should include `--import=./seed-data` if missing).
- Known seeded entities (see `seed-data/auth_export/accounts.json`):
  - User `brad@test.com` (displayName "Brad")
  - User `otter.orange.259@example.com` (displayName "Otter Orange")
  - Episode documents (including the *Princess Bride* analysis), plus `episodeTags` / `episodeGenres` / `episodeCategories` junctions, and storage blobs.
- Do NOT mutate seed entities other tests depend on. If a test must write, create a fresh document with a unique id and clean it up in `afterEach` or `afterAll`.
- Do NOT export emulator state from a test workflow. Never run `pnpm emulators:save` or `firebase emulators:export` from this skill — `seed-data/` is source-of-truth and is updated outside of test runs.
- Tests must leave the emulator process clean. Rely on Playwright's `webServer` lifecycle to stop it; in CI set `reuseExistingServer: false`. If a stray emulator lingers locally, recover with `pnpm emulators:stop` (which kills the configured emulator ports).

## Auth

- Public-app tests: no auth required.
- Admin-app tests: bypass the Google sign-in popup by minting an emulator ID token via the Auth emulator REST endpoint and persisting it via Playwright `storageState`.
- Codify this once in `e2e/fixtures/auth.ts`:

  ```ts
  // e2e/fixtures/auth.ts
  import { test as base, expect, request } from '@playwright/test';

  type Fixtures = { adminPage: import('@playwright/test').Page };

  export const adminTest = base.extend<Fixtures>({
    storageState: async ({}, use) => {
      const ctx = await request.newContext();
      const res = await ctx.post(
        'http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=fake-api-key',
        {
          data: {
            postBody: 'providerId=google.com&id_token=fake-google-id-token-for-brad',
            requestUri: 'http://localhost',
            returnIdpCredential: true,
            returnSecureToken: true,
          },
        },
      );
      expect(res.ok()).toBeTruthy();
      // Persist the resulting auth state so the admin app picks it up on boot.
      await use({ cookies: [], origins: [/* hydrate localStorage with the emulator token here */] });
    },
  });

  export { expect };
  ```

  Tune the `signInWithIdp` payload against the seeded Brad account; persist the IdP response into the storage origin the admin-app reads on boot.

- Use `adminTest` (not the bare `test`) in any admin-app spec that requires being logged in.

## Page Object Model

- One class per route under `e2e/pages/<app>/`.
- Constructor takes `page: Page`. Expose locators as `readonly` properties and actions as methods:

  ```ts
  // e2e/pages/public/episode-detail.page.ts
  import { Page, Locator } from '@playwright/test';

  export class EpisodeDetailPage {
    readonly heading: Locator;
    readonly tagList: Locator;
    constructor(private readonly page: Page) {
      this.heading = page.getByRole('heading', { level: 1 });
      this.tagList = page.getByRole('list', { name: /tags/i });
    }
    async goto(id: string) {
      await this.page.goto(`/episodes/${id}`);
    }
  }
  ```

- Prefer role / label / text locators (`getByRole`, `getByLabel`, `getByText`) over CSS selectors. Fall back to `data-testid` only when semantics are insufficient — and add the `data-testid` to the component as part of the same change.

## Test coverage — write tests in each category

1. **Happy paths** — primary user journey for the feature. At least one spec per route.
2. **Edge cases** — empty states, very long content, missing optional fields, mobile viewport (the shell uses `BreakpointObserver` for the `Breakpoints.Handset` swap), keyboard navigation, deep-linking directly to a route.
3. **Error states (selective)** — only user-facing error UX that is part of the product:
   - 404 / not-found pages
   - Form validation messages
   - Auth-denied redirects (e.g., admin routes when unauthenticated)

   Do NOT use `page.route()` to simulate Firestore/network/server failures in e2e — that path is brittle and belongs in unit tests against the service layer.

## Accessibility

- Assert on roles and labels, not DOM structure — this keeps tests aligned with AXE / WCAG AA expectations the project must meet.
- `@axe-core/playwright` checks on key pages are a nice-to-have follow-up, not required by this skill.

## Reference files

- Playwright config: `playwright.config.ts`
- Existing example spec: `e2e/example.spec.ts`
- Seeded users: `seed-data/auth_export/accounts.json`
- Emulator ports: `firebase.json`

## Workflow

1. Identify the app (`public-app` vs `admin-app`) and the route(s) under test.
2. Read the relevant component, route, and any existing spec or page object for the feature.
3. Check `seed-data/` (or browse the emulator UI at `http://localhost:4000`) for fixtures the test can rely on.
4. Create or extend the page object under `e2e/pages/<app>/`.
5. Write the spec under `e2e/<app>/<feature>.spec.ts` covering at minimum a happy path and one edge case. Add error-state coverage only if it falls in the selective list above.
6. For admin-app, import `adminTest` from `e2e/fixtures/auth.ts` and target `http://localhost:4300`.
7. Run the targeted spec: `pnpm exec playwright test <path>`. Iterate until green on chromium.
8. After the run, confirm no emulator or dev-server processes remain on the configured ports — run `pnpm emulators:stop` if any lingered.
9. Report what was added (specs, page objects, fixtures) and which coverage categories it hits.
