import { Locator, Page } from '@playwright/test';

/** Public episodes browse page (`/episodes`): one shelf (scroller) per category/genre. */
export class EpisodesPage {
  readonly heading: Locator;
  readonly shelves: Locator;
  readonly episodeItems: Locator;
  readonly firstEpisodeLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Episodes' });
    // Each episode-scroller renders its shelf as role="list" with role="listitem" cards.
    this.shelves = page.getByRole('list');
    this.episodeItems = page.getByRole('listitem');
    this.firstEpisodeLink = this.episodeItems.first().getByRole('link');
  }

  async goto(): Promise<void> {
    await this.page.goto('/episodes');
  }

  /** Resolve the episode id from the first poster link's href (`/episodes/:id`). */
  async firstEpisodeId(): Promise<string> {
    const href = await this.firstEpisodeLink.getAttribute('href');
    const id = href?.split('/').filter(Boolean).pop();
    if (!id) throw new Error(`Could not parse episode id from href: ${href}`);
    return id;
  }
}
