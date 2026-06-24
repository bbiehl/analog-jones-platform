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

  test('selected suggestion renders result cards with titles, not a blank list', async ({
    page,
  }) => {
    // The explorer results grid is created entirely on the client (it never
    // exists in the SSR DOM), so it exercises the regular `@defer` trigger. This
    // guards the `@defer (on immediate; hydrate on viewport)` fix: with only a
    // `hydrate` trigger the block would fall back to the default `on idle` and
    // render a visible-but-empty list here — present container, zero cards.
    const explorer = new ExplorerPage(page);
    await explorer.goto();

    // Pick the first option whose selection yields a non-empty result set, so the
    // assertion isn't defeated by a genre/tag that legitimately has no episodes.
    await explorer.search('a');
    await expect(explorer.options.first()).toBeVisible();
    const optionCount = await explorer.options.count();
    let matched = false;
    for (let i = 0; i < optionCount; i++) {
      await explorer.options.nth(i).click();
      if (
        await explorer.resultCards
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        matched = true;
        break;
      }
      await explorer.search('a'); // reopen the panel for the next candidate
      await expect(explorer.options.first()).toBeVisible();
    }
    expect(matched, 'expected at least one suggestion to return episodes').toBe(true);

    expect(await explorer.resultCards.count()).toBeGreaterThan(0);
    expect((await explorer.firstResultTitle()).trim().length).toBeGreaterThan(0);
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
