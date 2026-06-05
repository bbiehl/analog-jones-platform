import { expect, test } from '@playwright/test';

/**
 * Unauthenticated access. Uses the bare `test` (no auth fixture) so no session
 * is seeded — the authGuard should bounce protected routes to /login.
 */
test.describe('Auth guard (unauthenticated)', () => {
  test('redirects a protected route to /login', async ({ page }) => {
    await page.goto('/episodes');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible();
  });

  test('redirects the root to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });
});
