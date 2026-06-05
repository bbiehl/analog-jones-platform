import { Locator, Page, expect } from '@playwright/test';

/**
 * Admin categories pages — the list (`/categories`) and the add form
 * (`/categories/add`). Genres and tags follow the same pattern/markup.
 */
export class AdminCategoriesPage {
  readonly heading: Locator;
  readonly addButton: Locator;
  readonly rows: Locator;
  // Add form
  readonly nameInput: Locator;
  readonly slugInput: Locator;
  readonly saveButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Categories' });
    this.addButton = page.getByRole('button', { name: 'Add Category' });
    this.rows = page.locator('table tr[mat-row]');
    this.nameInput = page.getByLabel('Name');
    this.slugInput = page.getByLabel('Slug');
    this.saveButton = page.getByRole('button', { name: 'Save' });
  }

  async gotoList(): Promise<void> {
    await this.page.goto('/categories');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/categories/add');
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  /** Delete the row matching `name`, accepting the native confirm() dialog. */
  async deleteByName(name: string): Promise<void> {
    const row = this.rowByName(name);
    this.page.once('dialog', (d) => d.accept());
    await row.getByRole('button', { name: 'Delete category' }).click();
    await expect(row).toHaveCount(0);
  }
}
