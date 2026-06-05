import { Locator, Page } from '@playwright/test';

/** Public explorer page (`/explorer`): autocomplete search over episodes/genres/tags. */
export class ExplorerPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly clearButton: Locator;
  readonly autocompletePanel: Locator;
  readonly options: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Explorer' });
    this.searchInput = page.getByLabel('Search for episodes, genres, and tags');
    this.clearButton = page.getByRole('button', { name: 'Clear search' });
    // mat-autocomplete renders its panel as role="listbox" in a CDK overlay.
    this.autocompletePanel = page.getByRole('listbox');
    this.options = this.autocompletePanel.getByRole('option');
  }

  async goto(): Promise<void> {
    await this.page.goto('/explorer');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.click();
    await this.searchInput.fill(term);
  }
}
