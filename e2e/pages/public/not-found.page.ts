import { Locator, Page } from '@playwright/test';

/** Public 404 page (wildcard route → NotFound component). */
export class NotFoundPage {
  readonly heading: Locator;
  readonly backHome: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: '404' });
    this.backHome = page.getByRole('link', { name: 'Back to Home' });
  }
}
