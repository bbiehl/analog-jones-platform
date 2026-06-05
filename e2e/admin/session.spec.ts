import { adminTest, expect } from '../fixtures/auth';
import { AdminShellPage } from '../pages/admin/shell.page';

/** Verifies the seeded-admin auth fixture actually authenticates past the guard. */
adminTest.describe('Authenticated admin session', () => {
  adminTest('seeded admin lands on the dashboard with the shell', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard$/);

    const shell = new AdminShellPage(page);
    await expect(shell.signOut).toBeVisible();
    await expect(shell.userEmail).toBeVisible();
  });

  adminTest('deep-linking to a protected route is allowed when signed in', async ({ page }) => {
    await page.goto('/episodes');
    await expect(page).toHaveURL(/\/episodes$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Episodes' })).toBeVisible();
  });
});
