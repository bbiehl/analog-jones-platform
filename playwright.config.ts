import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Tests run against the Firebase emulator suite (seeded from `seed-data/`) plus
 * both Angular dev servers: public-app on :4200 and admin-app on :4300.
 * Specs are split by app into `e2e/public/` and `e2e/admin/`, each driven by a
 * dedicated project whose `baseURL` points at the matching dev server.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env['CI'] ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* One project per app. Chromium only for now; firefox/webkit stay configured
   * (see commented entries) and can be added per project when needed. */
  projects: [
    {
      name: 'public',
      testDir: './e2e/public',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['PUBLIC_BASE_URL'] ?? 'http://localhost:4200',
      },
    },
    {
      name: 'admin',
      testDir: './e2e/admin',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env['ADMIN_BASE_URL'] ?? 'http://localhost:4300',
      },
    },

    /* Cross-browser coverage — enable when needed.
    {
      name: 'public-firefox',
      testDir: './e2e/public',
      use: { ...devices['Desktop Firefox'], baseURL: 'http://localhost:4200' },
    },
    {
      name: 'public-webkit',
      testDir: './e2e/public',
      use: { ...devices['Desktop Safari'], baseURL: 'http://localhost:4200' },
    },
    */
  ],

  /* Start Firebase emulators and both dev servers before running tests.
   * The emulators import the source-of-truth seed data; do not export from tests. */
  webServer: [
    {
      command: 'firebase emulators:start --import=./seed-data',
      port: 4000,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
    {
      command: 'ng serve public-app --port 4200',
      port: 4200,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
    {
      command: 'ng serve admin-app --port 4300',
      port: 4300,
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
