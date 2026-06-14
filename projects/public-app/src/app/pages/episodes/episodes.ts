import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Episode, EpisodeStore } from '@aj/core';
import { EpisodeGrid } from '../../episode/episode-grid/episode-grid';

@Component({
  selector: 'app-episodes',
  imports: [ReactiveFormsModule, EpisodeGrid],
  templateUrl: './episodes.html',
  styleUrl: './episodes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Episodes implements OnInit {
  private store = inject(EpisodeStore);

  protected readonly searchControl = new FormControl('', { nonNullable: true });
  private readonly searchTerm = toSignal(this.searchControl.valueChanges, { initialValue: '' });

  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly episodes = computed(() => this.store.episodes());

  protected readonly filtered = computed<Episode[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const episodes = this.episodes();
    if (!term) return episodes;
    return episodes.filter((e) => e.title.toLowerCase().includes(term));
  });

  protected readonly hasResults = computed(() => this.filtered().length > 0);
  protected readonly hasSearch = computed(() => this.searchTerm().trim().length > 0);

  ngOnInit(): void {
    this.store.loadVisibleEpisodes();
  }
}
