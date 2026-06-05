import { Locator, Page } from '@playwright/test';

/** Public home page (`/`): hero with featured episode + CTAs. */
export class HomePage {
  readonly heading: Locator;
  readonly playEpisodeCta: Locator;
  readonly enterArchiveCta: Locator;
  readonly featuredMonitor: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.playEpisodeCta = page.getByRole('link', { name: /play episode/i });
    this.enterArchiveCta = page.getByRole('link', { name: /enter the archive/i });
    // The featured monitor links to the episode and is labelled "Open <title>".
    this.featuredMonitor = page.getByRole('link', { name: /^open /i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
