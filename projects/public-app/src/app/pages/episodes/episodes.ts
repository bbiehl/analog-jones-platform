import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Episode } from '@aj/core';
import { EpisodeScroller } from '../../episode/episode-scroller/episode-scroller';
import { EpisodeScrollerSkeleton } from '../../episode/episode-scroller-skeleton/episode-scroller-skeleton';
import { EpisodeListStore } from '../../episode/episode-list.store';

interface ShelfEntry {
  key: string;
  heading: string;
  episodes: Episode[];
}

@Component({
  selector: 'app-episodes',
  imports: [EpisodeScroller, EpisodeScrollerSkeleton],
  templateUrl: './episodes.html',
  styleUrl: './episodes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Episodes implements OnInit {
  private store = inject(EpisodeListStore);

  protected readonly isLoading = this.store.isLoading;
  protected readonly categoryLoaded = this.store.categoryLoaded;
  protected readonly error = this.store.error;
  protected readonly entries = computed<ShelfEntry[]>(() => {
    const categoryEntries = Object.entries(this.store.episodesByCategory()).map(
      ([heading, episodes]) => ({ key: `cat:${heading}`, heading, episodes })
    );
    const genreEntries = Object.entries(this.store.episodesByGenre()).map(
      ([heading, episodes]) => ({ key: `gen:${heading}`, heading, episodes })
    );
    return [...categoryEntries, ...genreEntries];
  });
  protected readonly hasEpisodes = computed(() => this.entries().length > 0);
  protected readonly skeletonScrollers = [0, 1];

  ngOnInit(): void {
    this.store.load();
  }
}
