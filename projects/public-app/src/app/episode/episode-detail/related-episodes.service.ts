import { inject, Injectable } from '@angular/core';
import { Episode, EpisodeService } from '@aj/core';

@Injectable({ providedIn: 'root' })
export class RelatedEpisodesService {
  private episodeService = inject(EpisodeService);

  async getRelatedEpisodes(episode: Episode, max = 12): Promise<Episode[]> {
    if (max <= 0) return [];

    const tagIds = new Set(episode.tags.map((t) => t.id).filter((id): id is string => !!id));
    if (tagIds.size === 0) return [];

    // Embedded tags live on each episode now, so a single (cached) visible-list
    // read replaces the former per-tag episodeTags junction fan-out.
    const episodes = await this.episodeService.getVisibleEpisodeList();
    return episodes
      .filter((e) => e.id !== episode.id && e.tags.some((t) => t.id && tagIds.has(t.id)))
      .sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis())
      .slice(0, max);
  }
}
