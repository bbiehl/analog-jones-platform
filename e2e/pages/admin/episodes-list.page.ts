import { Locator, Page, expect } from '@playwright/test';

/** Admin episodes list (`/episodes`): filterable, sortable, paginated table. */
export class AdminEpisodesListPage {
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly filterInput: Locator;
  readonly rows: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Episodes' });
    this.addButton = page.getByRole('button', { name: 'Add Episode' });
    this.filterInput = page.getByLabel('Filter by title');
    this.rows = page.locator('table tr[mat-row]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/episodes');
  }

  rowByTitle(title: string): Locator {
    return this.rows.filter({ hasText: title });
  }

  async filter(term: string): Promise<void> {
    await this.filterInput.fill(term);
  }

  /** Delete the row matching `title`, accepting the native confirm() dialog. */
  async deleteByTitle(title: string): Promise<void> {
    const row = this.rowByTitle(title);
    this.page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Delete episode' }).click();
    await expect(row).toHaveCount(0);
  }
}
