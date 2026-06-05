import { Locator, Page } from '@playwright/test';

/** Admin login page (`/login`). The real Google popup is not driven in e2e. */
export class AdminLoginPage {
  readonly heading: Locator;
  readonly signInButton: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Admin' });
    this.signInButton = page.getByRole('button', { name: /sign in with google/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }
}
