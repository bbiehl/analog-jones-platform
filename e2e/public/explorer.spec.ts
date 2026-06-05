import { expect, test } from '@playwright/test';
import { ExplorerPage } from '../pages/public/explorer.page';

test.describe('Explorer search', () => {
  test('typing surfaces grouped autocomplete suggestions', async ({ page }) => {
    const explorer = new ExplorerPage(page);
    await explorer.goto();
    await expect(explorer.heading).toBeVisible();

    await explorer.search('a');
    await expect(explorer.autocompletePanel).toBeVisible();
    await expect(explorer.options.first()).toBeVisible();
  });

  test('selecting a suggestion shows matching episode results', async ({ page }) => {
    const explorer = new ExplorerPage(page);
    await explorer.goto();

    await explorer.search('a');
    await expect(explorer.options.first()).toBeVisible();
    await explorer.options.first().click();

    // A results scroller (role="list") renders for the selected option.
    await expect(page.getByRole('list').first()).toBeVisible();
  });

  test('clear button resets the search field', async ({ page }) => {
    const explorer = new ExplorerPage(page);
    await explorer.goto();

    await explorer.search('a');
    await expect(explorer.clearButton).toBeVisible();
    await explorer.clearButton.click();
    await expect(explorer.searchInput).toHaveValue('');
  });
});
