import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { EpisodeStore, EpisodeWithRelations } from '@aj/core';
import { SeoService } from '../../../seo/seo.service';
import { ORIGIN } from '../../../seo/origin.token';
import { buildEpisodeSeoInput } from './episode-detail.seo';
import { EpisodeProperties } from '../../../episode/episode-detail/episode-properties/episode-properties';
import { EpisodePropertiesSkeleton } from '../../../episode/episode-detail/episode-properties-skeleton/episode-properties-skeleton';
import { RelatedEpisodeStore } from '../../../episode/episode-detail/related-episode.store';
import { EpisodeScroller } from '../../../episode/episode-scroller/episode-scroller';
import { EpisodeScrollerSkeleton } from '../../../episode/episode-scroller-skeleton/episode-scroller-skeleton';
import { NotFound } from '../../not-found/not-found';

@Component({
  selector: 'app-episode-detail',
  imports: [
    RouterLink,
    EpisodeProperties,
    EpisodePropertiesSkeleton,
    EpisodeScroller,
    EpisodeScrollerSkeleton,
    NotFound,
  ],
  templateUrl: './episode-detail.html',
  styleUrl: './episode-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'episode-detail-page' },
})
export class EpisodeDetail implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly episodeStore = inject(EpisodeStore);
  private readonly relatedStore = inject(RelatedEpisodeStore);
  private readonly seo = inject(SeoService);
  private readonly origin = inject(ORIGIN);

  protected readonly id = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), {
    initialValue: null,
  });

  private readonly resolved = toSignal(
    this.route.data.pipe(map((d) => d['episode'] as EpisodeWithRelations | null | undefined)),
    { initialValue: undefined },
  );
  protected readonly notFound = computed(() => this.resolved() === null);

  protected readonly episode = computed(() => this.episodeStore.selectedEpisode());
  protected readonly loading = computed(() => this.episodeStore.loading());
  protected readonly relatedEpisodes = computed(() => this.relatedStore.relatedEpisodes());
  protected readonly relatedLoading = computed(() => this.relatedStore.loading());
  protected readonly episodeMatchesRoute = computed(() => {
    const id = this.id();
    const ep = this.episode();
    return !!id && !!ep && ep.id === id;
  });

  constructor() {
    effect(() => {
      const id = this.id();
      if (!id) return;
      this.relatedStore.clearRelatedEpisodes();
      if (this.notFound()) return;
      const current = untracked(() => this.episodeStore.selectedEpisode());
      if (current?.id === id) return;
      this.episodeStore.loadEpisodeById(id);
    });

    effect(() => {
      const id = this.id();
      const ep = this.episode();
      if (id && ep && ep.id === id && ep.isVisible) {
        this.relatedStore.loadRelatedEpisodes(ep);
        this.applyEpisodeSeo(ep);
      }
    });
  }

  ngOnDestroy(): void {
    this.episodeStore.clearSelectedEpisode();
    this.relatedStore.clearRelatedEpisodes();
  }

  private applyEpisodeSeo(ep: NonNullable<ReturnType<typeof this.episode>>): void {
    this.seo.setHead(buildEpisodeSeoInput(ep, this.origin));
  }
}
