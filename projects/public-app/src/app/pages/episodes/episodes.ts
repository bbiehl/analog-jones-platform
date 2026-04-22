import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { EpisodeScroller } from '../../episode/episode-scroller/episode-scroller';
import { EpisodeListStore } from '../../episode/episode-list.store';

@Component({
  selector: 'app-episodes',
  imports: [EpisodeScroller],
  templateUrl: './episodes.html',
  styleUrl: './episodes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Episodes implements OnInit {
  private store = inject(EpisodeListStore);

  protected readonly isLoading = this.store.isLoading;
  protected readonly error = this.store.error;
  protected readonly genreEntries = computed(() =>
    Object.entries(this.store.episodesByGenre())
  );
  protected readonly hasEpisodes = computed(() => this.genreEntries().length > 0);
  protected readonly skeletonRows = [0, 1, 2];

  ngOnInit(): void {
    this.store.loadEpisodesByGenre();
  }
}
