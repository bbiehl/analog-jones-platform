import { Locator, Page } from '@playwright/test';

/** Admin episode add/edit form (`/episodes/add`, `/episodes/edit/:id`). */
export class AdminEpisodeFormPage {
  readonly titleInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly titleRequiredError: Locator;

  constructor(private readonly page: Page) {
    this.titleInput = page.getByLabel('Title');
    this.saveButton = page.getByRole('button', { name: /^save/i });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    this.titleRequiredError = page.getByText('Title is required');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/episodes/add');
  }

  async fillTitle(title: string): Promise<void> {
    await this.titleInput.fill(title);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }
}
