import { Locator, Page } from '@playwright/test';

/** Public episode detail page (`/episodes/:id`). */
export class EpisodeDetailPage {
  readonly title: Locator;
  readonly backToArchive: Locator;
  readonly classification: Locator;
  readonly spotifyLink: Locator;
  readonly youtubeLink: Locator;
  readonly relatedEpisodes: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByRole('heading', { level: 1 });
    this.backToArchive = page.getByRole('link', { name: /return to archive/i });
    this.classification = page.getByLabel('Classification');
    this.spotifyLink = page.getByRole('link', { name: /listen on spotify/i });
    this.youtubeLink = page.getByRole('link', { name: /watch on youtube/i });
    this.relatedEpisodes = page.getByRole('region', { name: 'Related episodes' });
  }

  async goto(id: string): Promise<void> {
    await this.page.goto(`/episodes/${id}`);
  }
}
