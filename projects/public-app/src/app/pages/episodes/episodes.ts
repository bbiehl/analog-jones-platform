import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EpisodeListItem, EpisodeStore } from '@aj/core';
import { EpisodeGrid } from '../../episode/episode-grid/episode-grid';

@Component({
  selector: 'app-episodes',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, EpisodeGrid],
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
  protected readonly episodes = computed(() => this.store.listItems());

  protected readonly filtered = computed<EpisodeListItem[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const episodes = this.episodes();
    if (!term) return episodes;
    return episodes.filter((e) => e.title.toLowerCase().includes(term));
  });

  protected readonly hasResults = computed(() => this.filtered().length > 0);
  protected readonly hasSearch = computed(() => this.searchTerm().trim().length > 0);

  ngOnInit(): void {
    this.store.loadEpisodeListItems();
  }
}
