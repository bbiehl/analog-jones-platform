import { Locator, Page } from '@playwright/test';

/** Public episodes browse page (`/episodes`): one shelf (scroller) per category/genre. */
export class EpisodesPage {
  readonly heading: Locator;
  readonly shelves: Locator;
  readonly episodeItems: Locator;
  readonly firstEpisodeLink: Locator;
  readonly searchInput: Locator;
  /** The archive results grid (role="list" labelled "Episodes") and its cards. */
  readonly grid: Locator;
  readonly gridItems: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Episodes' });
    // Each episode-scroller renders its shelf as role="list" with role="listitem" cards.
    this.shelves = page.getByRole('list');
    this.episodeItems = page.getByRole('listitem');
    this.firstEpisodeLink = this.episodeItems.first().getByRole('link');
    this.searchInput = page.getByRole('searchbox', { name: /search episodes by title/i });
    this.grid = page.getByRole('list', { name: 'Episodes' });
    this.gridItems = this.grid.getByRole('listitem');
  }

  async goto(): Promise<void> {
    await this.page.goto('/episodes');
  }

  async search(term: string): Promise<void> {
    await this.searchInput.fill(term);
  }

  /** Title of the first rendered card (from its link's accessible name). */
  async firstCardTitle(): Promise<string> {
    return (await this.gridItems.first().getByRole('link').getAttribute('aria-label')) ?? '';
  }

  /** Visible card titles in the archive grid (the `.name` text of each card). */
  async cardTitles(): Promise<string[]> {
    return this.gridItems.locator('.name').allTextContents();
  }

  /** Resolve the episode id from the first poster link's href (`/episodes/:id`). */
  async firstEpisodeId(): Promise<string> {
    const href = await this.firstEpisodeLink.getAttribute('href');
    const id = href?.split('/').filter(Boolean).pop();
    if (!id) throw new Error(`Could not parse episode id from href: ${href}`);
    return id;
  }
}
