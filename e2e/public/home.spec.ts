import { expect, test } from '@playwright/test';
import { HomePage } from '../pages/public/home.page';

test.describe('Home', () => {
  test('renders the hero with a featured episode and CTAs', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await expect(home.heading).toContainText('ANALOG');
    // Featured episode resolves from seed data → "Play episode" links to its detail route.
    await expect(home.playEpisodeCta).toBeVisible();
    await expect(home.playEpisodeCta).toHaveAttribute('href', /\/episodes\/.+/);
    await expect(home.enterArchiveCta).toBeVisible();
  });

  test('"Enter the archive" navigates to the episodes page', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    await home.enterArchiveCta.click();
    await expect(page).toHaveURL(/\/episodes$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Episodes' })).toBeVisible();
  });

  test('featured monitor links through to the episode detail page', async ({ page }) => {
    const home = new HomePage(page);
    await home.goto();

    const href = await home.playEpisodeCta.getAttribute('href');
    await home.featuredMonitor.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });
});
