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

  test('title search filters the grid and the matching cards still render content', async ({
    page,
  }) => {
    const episodes = new EpisodesPage(page);
    await episodes.goto();
    await expect(episodes.gridItems.first()).toBeVisible();

    // Derive a search token from a real rendered card so the test is seed-robust.
    const firstTitle = await episodes.firstCardTitle();
    const token = firstTitle.split(/\s+/).find((w) => w.length >= 4) ?? firstTitle.split(/\s+/)[0];
    expect(token.length).toBeGreaterThan(0);

    await episodes.search(token);

    // Filtering re-runs the client-side `@for`, recreating each card's
    // `@defer (on immediate; …)` block. The filtered cards must render their
    // titles — a blank/empty grid here would mean the client-render path broke.
    await expect(episodes.gridItems.first()).toBeVisible();
    const titles = await episodes.cardTitles();
    expect(titles.length).toBeGreaterThan(0);
    for (const t of titles) {
      expect(t.trim().length).toBeGreaterThan(0);
      expect(t.toLowerCase()).toContain(token.toLowerCase());
    }
  });
});
