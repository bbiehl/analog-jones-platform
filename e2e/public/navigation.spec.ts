import { expect, test } from '@playwright/test';
import { PublicShellPage } from '../pages/public/shell.page';
import { NotFoundPage } from '../pages/public/not-found.page';

test.describe('Shell navigation', () => {
  test('desktop toolbar links navigate between pages', async ({ page }) => {
    const shell = new PublicShellPage(page);
    await page.goto('/');

    await shell.toolbarLink('Episodes').click();
    await expect(page).toHaveURL(/\/episodes$/);

    await shell.toolbarLink('Explorer').click();
    await expect(page).toHaveURL(/\/explorer$/);

    await shell.toolbarLink('Home').click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('footer links reach the secondary pages', async ({ page }) => {
    const shell = new PublicShellPage(page);
    await page.goto('/');

    await shell.footerLink('Contact').click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test.describe('mobile viewport', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('hamburger opens the sidenav and links navigate then close it', async ({ page }) => {
      const shell = new PublicShellPage(page);
      await page.goto('/');

      await expect(shell.hamburger).toBeVisible();
      await shell.openSidenav();
      await expect(shell.sidenav).toBeVisible();

      await shell.sidenavLink('Episodes').click();
      await expect(page).toHaveURL(/\/episodes$/);
      // Sidenav auto-closes on navigation.
      await expect(shell.sidenav).toBeHidden();
    });
  });

  test('unknown route renders the 404 page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');

    const notFound = new NotFoundPage(page);
    await expect(notFound.heading).toBeVisible();
    await notFound.backHome.click();
    await expect(page).toHaveURL(/\/$/);
  });
});
