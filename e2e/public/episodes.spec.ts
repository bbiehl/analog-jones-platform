import { expect, test } from '@playwright/test';
import { EpisodesPage } from '../pages/public/episodes.page';

test.describe('Episodes browse', () => {
  test('renders shelves of episodes from seed data', async ({ page }) => {
    const episodes = new EpisodesPage(page);
    await episodes.goto();

    await expect(episodes.heading).toBeVisible();
    await expect(episodes.episodeItems.first()).toBeVisible();
    expect(await episodes.episodeItems.count()).toBeGreaterThan(0);
  });

  test('clicking an episode opens that episode detail page', async ({ page }) => {
    const episodes = new EpisodesPage(page);
    await episodes.goto();

    const id = await episodes.firstEpisodeId();
    await episodes.firstEpisodeLink.click();

    await expect(page).toHaveURL(new RegExp(`/episodes/${id}$`));
    await expect(page.getByRole('link', { name: /return to archive/i })).toBeVisible();
  });

  test('deep-linking directly to /episodes works', async ({ page }) => {
    const episodes = new EpisodesPage(page);
    await episodes.goto();

    // Deferred shelves load on scroll — bottom of the list still resolves to items.
    await page.mouse.wheel(0, 4000);
    await expect(episodes.episodeItems.first()).toBeVisible();
  });
});
