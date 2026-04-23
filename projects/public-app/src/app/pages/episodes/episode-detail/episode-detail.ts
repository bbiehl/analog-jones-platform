import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import { EpisodeProperties } from '../../../episode/episode-detail/episode-properties/episode-properties';
import { EpisodePropertiesSkeleton } from '../../../episode/episode-detail/episode-properties-skeleton/episode-properties-skeleton';
import { RelatedEpisodeStore } from '../../../episode/episode-detail/related-episode.store';
import { EpisodeScroller } from '../../../episode/episode-scroller/episode-scroller';
import { EpisodeScrollerSkeleton } from '../../../episode/episode-scroller-skeleton/episode-scroller-skeleton';

@Component({
  selector: 'app-episode-detail',
  imports: [
    RouterLink,
    EpisodeProperties,
    EpisodePropertiesSkeleton,
    EpisodeScroller,
    EpisodeScrollerSkeleton,
  ],
  templateUrl: './episode-detail.html',
  styleUrl: './episode-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'episode-detail-page' },
})
export class EpisodeDetail implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly episodeStore = inject(EpisodeStore);
  private readonly relatedStore = inject(RelatedEpisodeStore);

  protected readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: null,
  });

  protected readonly episode = computed(() => this.episodeStore.selectedEpisode());
  protected readonly loading = computed(() => this.episodeStore.loading());
  protected readonly relatedEpisodes = computed(() => this.relatedStore.relatedEpisodes());
  protected readonly relatedLoading = computed(() => this.relatedStore.loading());

  protected readonly caseNumber = computed(() => {
    const id = this.id();
    if (!id) return '— — — — — —';
    return id.slice(0, 6).toUpperCase();
  });

  private previousLoading = false;

  constructor() {
    effect(() => {
      const id = this.id();
      if (id) this.episodeStore.loadEpisodeById(id);
    });

    effect(() => {
      const id = this.id();
      const ep = this.episode();
      if (id && ep && ep.id === id && ep.isVisible) {
        this.relatedStore.loadRelatedEpisodes(ep);
      }
    });

    effect(() => {
      const id = this.id();
      const loading = this.loading();
      const wasLoading = this.previousLoading;
      this.previousLoading = loading;

      if (!id || !wasLoading || loading) return;

      const ep = this.episode();
      const error = this.episodeStore.error();
      if (error || !ep || ep.id !== id || !ep.isVisible) {
        this.router.navigateByUrl('/not-found');
      }
    });
  }

  ngOnDestroy(): void {
    this.episodeStore.clearSelectedEpisode();
    this.relatedStore.clearRelatedEpisodes();
  }
}
