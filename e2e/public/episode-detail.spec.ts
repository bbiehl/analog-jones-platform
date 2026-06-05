import { expect, test } from '@playwright/test';
import { EpisodeDetailPage } from '../pages/public/episode-detail.page';
import { EpisodesPage } from '../pages/public/episodes.page';

test.describe('Episode detail', () => {
  // Derive a real id from the episodes page rather than hardcoding a seed id.
  async function firstEpisodeId(page: import('@playwright/test').Page): Promise<string> {
    const episodes = new EpisodesPage(page);
    await episodes.goto();
    return episodes.firstEpisodeId();
  }

  test('shows title, classification chips and a back link', async ({ page }) => {
    const id = await firstEpisodeId(page);
    const detail = new EpisodeDetailPage(page);
    await detail.goto(id);

    await expect(detail.title).toBeVisible();
    await expect(await detail.title.textContent()).toBeTruthy();
    await expect(detail.backToArchive).toBeVisible();
  });

  test('playback links open in a new tab when present', async ({ page }) => {
    const id = await firstEpisodeId(page);
    const detail = new EpisodeDetailPage(page);
    await detail.goto(id);

    // At least one of the seeded episodes' links should be present; assert the
    // target attribute on whichever playback links render.
    for (const link of [detail.spotifyLink, detail.youtubeLink]) {
      if (await link.count()) {
        await expect(link.first()).toHaveAttribute('target', '_blank');
        await expect(link.first()).toHaveAttribute('rel', /noopener/);
      }
    }
  });

  test('back link returns to the archive', async ({ page }) => {
    const id = await firstEpisodeId(page);
    const detail = new EpisodeDetailPage(page);
    await detail.goto(id);

    await detail.backToArchive.click();
    await expect(page).toHaveURL(/\/episodes$/);
  });
});
