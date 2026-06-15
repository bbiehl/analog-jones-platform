import { Locator, Page } from '@playwright/test';

/** Public explorer page (`/explorer`): autocomplete search over genres and tags. */
export class ExplorerPage {
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly clearButton: Locator;
  readonly autocompletePanel: Locator;
  readonly options: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Explorer' });
    // Target the input by its combobox role: the mat-autocomplete panel shares
    // the same accessible name (its aria-labelledby points at the form-field
    // label), so a plain getByLabel matches both and trips strict mode.
    this.searchInput = page.getByRole('combobox', { name: 'Search genres and tags' });
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
