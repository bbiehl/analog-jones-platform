import { Locator, Page } from '@playwright/test';

/** Admin shell: toolbar nav (Dashboard/Users/Episodes/Categories/Genres/Tags) + sign out. */
export class AdminShellPage {
  readonly toolbarNav: Locator;
  readonly signOut: Locator;
  readonly userEmail: Locator;

  constructor(private readonly page: Page) {
    this.toolbarNav = page.getByRole('navigation', { name: 'Main navigation' });
    this.signOut = page.getByRole('button', { name: 'Sign out' });
    this.userEmail = page.getByText('brad@test.com');
  }

  navLink(label: string): Locator {
    return this.toolbarNav.getByRole('link', { name: label });
  }
}
