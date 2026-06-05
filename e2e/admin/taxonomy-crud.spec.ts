import { adminTest, expect } from '../fixtures/auth';
import { AdminCategoriesPage } from '../pages/admin/categories.page';

adminTest.describe('Taxonomy CRUD', () => {
  // Track throwaway categories so cleanup runs even if a test fails mid-flow.
  const createdNames: string[] = [];

  adminTest.afterEach(async ({ page }) => {
    if (createdNames.length === 0) return;
    const categories = new AdminCategoriesPage(page);
    await categories.gotoList();
    for (const name of createdNames) {
      const row = categories.rowByName(name);
      if (await row.count()) {
        await categories.deleteByName(name);
      }
    }
    createdNames.length = 0;
  });

  adminTest('category: slug auto-generates, create appears in list, then delete', async ({
    page,
  }) => {
    const name = `E2E Cat ${Date.now()}`;
    const expectedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const categories = new AdminCategoriesPage(page);

    await categories.gotoAdd();
    await categories.nameInput.fill(name);
    // Slug is derived from the name as you type.
    await expect(categories.slugInput).toHaveValue(expectedSlug);

    await categories.saveButton.click();
    await expect(page).toHaveURL(/\/categories$/);
    await expect(categories.rowByName(name)).toBeVisible();
    createdNames.push(name); // register for afterEach cleanup once it exists

    await categories.deleteByName(name);
    await expect(categories.rowByName(name)).toHaveCount(0);
  });

  adminTest('genres list renders', async ({ page }) => {
    await page.goto('/genres');
    await expect(page.getByRole('heading', { level: 1, name: 'Genres' })).toBeVisible();
    await expect(page.locator('table tr[mat-row]').first()).toBeVisible();
  });

  adminTest('tags list renders with pagination control', async ({ page }) => {
    await page.goto('/tags');
    await expect(page.getByRole('heading', { level: 1, name: 'Tags' })).toBeVisible();
    await expect(page.locator('table tr[mat-row]').first()).toBeVisible();
    // Tags list is paginated (unlike categories/genres).
    await expect(page.locator('mat-paginator')).toBeVisible();
  });
});
