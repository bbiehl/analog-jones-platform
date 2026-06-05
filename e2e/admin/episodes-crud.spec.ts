import { adminTest, expect } from '../fixtures/auth';
import { AdminEpisodesListPage } from '../pages/admin/episodes-list.page';
import { AdminEpisodeFormPage } from '../pages/admin/episode-form.page';

adminTest.describe('Episodes CRUD', () => {
  // Track throwaway episodes so cleanup runs even if a test fails mid-flow
  // (a leaked visible episode would pollute retries and public-app reads).
  const createdTitles: string[] = [];

  adminTest.afterEach(async ({ page }) => {
    if (createdTitles.length === 0) return;
    const list = new AdminEpisodesListPage(page);
    await list.goto();
    for (const title of createdTitles) {
      const row = list.rowByTitle(title);
      if (await row.count()) {
        await list.deleteByTitle(title);
      }
    }
    createdTitles.length = 0;
  });

  adminTest('lists seeded episodes', async ({ page }) => {
    const list = new AdminEpisodesListPage(page);
    await list.goto();
    await expect(list.heading).toBeVisible();
    await expect(list.rows.first()).toBeVisible();
  });

  adminTest('Save stays disabled until the required title is provided', async ({ page }) => {
    const form = new AdminEpisodeFormPage(page);
    await form.gotoAdd();

    await expect(form.saveButton).toBeDisabled();
    await form.fillTitle('Temp');
    await expect(form.saveButton).toBeEnabled();
  });

  adminTest('create → appears in list → filter → toggle visibility → delete', async ({ page }) => {
    const title = `E2E Episode ${Date.now()}`;
    const list = new AdminEpisodesListPage(page);
    const form = new AdminEpisodeFormPage(page);

    // Create
    await form.gotoAdd();
    await form.fillTitle(title);
    await form.save();
    await expect(page).toHaveURL(/\/episodes$/);
    await expect(list.rowByTitle(title)).toBeVisible();
    createdTitles.push(title); // register for afterEach cleanup once it exists

    // Filter narrows to the new row
    await list.filter(title);
    await expect(list.rows).toHaveCount(1);
    await expect(list.rowByTitle(title)).toBeVisible();

    // Toggle visibility on the throwaway row (avoids mutating seed episodes)
    const toggle = list.rowByTitle(title).getByRole('switch');
    await toggle.click();
    await expect(toggle).toBeChecked();

    // Delete (cleanup) — accepts the native confirm dialog
    await list.deleteByTitle(title);
    await expect(list.rowByTitle(title)).toHaveCount(0);
  });
});
