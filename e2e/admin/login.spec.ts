import { expect, test } from '@playwright/test';
import { AdminLoginPage } from '../pages/admin/login.page';

/**
 * The /login route has no guard, so it renders for everyone. We assert the
 * sign-in UI is present; the actual Google popup is never driven in e2e
 * (the auth fixture bypasses it — see fixtures/auth.ts).
 */
test.describe('Login page', () => {
  test('renders the Google sign-in button', async ({ page }) => {
    const login = new AdminLoginPage(page);
    await login.goto();
    await expect(login.heading).toBeVisible();
    await expect(login.signInButton).toBeVisible();
  });
});
