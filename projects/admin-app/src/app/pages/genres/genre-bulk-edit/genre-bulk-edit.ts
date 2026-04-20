import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { GenreStore } from '../../../../../../../libs/genre/genre.store';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import { EpisodeGenreService } from '../../../../../../../libs/shared/episode-genre.service';

@Component({
  selector: 'app-genre-bulk-edit',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './genre-bulk-edit.html',
  styleUrl: './genre-bulk-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreBulkEdit implements OnInit {
  protected readonly genreStore = inject(GenreStore);
  protected readonly episodeStore = inject(EpisodeStore);
  private readonly episodeGenreService = inject(EpisodeGenreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['select', 'title', 'episodeDate', 'isVisible'];

  private genreId = '';
  private initialAssigned = signal<Set<string>>(new Set());
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly saving = signal(false);
  protected readonly loadingJunctions = signal(true);

  protected readonly isDirty = computed(() => {
    const a = this.initialAssigned();
    const b = this.selected();
    if (a.size !== b.size) return true;
    for (const id of a) if (!b.has(id)) return true;
    return false;
  });

  protected readonly allSelected = computed(() => {
    const episodes = this.episodeStore.episodes();
    const sel = this.selected();
    return episodes.length > 0 && episodes.every((e) => e.id && sel.has(e.id));
  });

  protected readonly someSelected = computed(() => {
    const sel = this.selected();
    return sel.size > 0 && !this.allSelected();
  });

  async ngOnInit(): Promise<void> {
    this.genreId = this.route.snapshot.params['id'];
    await Promise.all([
      this.genreStore.loadGenreById(this.genreId),
      this.episodeStore.loadEpisodes(),
      this.loadAssigned(),
    ]);
  }

  private async loadAssigned(): Promise<void> {
    this.loadingJunctions.set(true);
    const ids = await this.episodeGenreService.getEpisodeIdsByGenreId(
      this.route.snapshot.params['id']
    );
    const set = new Set(ids);
    this.initialAssigned.set(set);
    this.selected.set(new Set(set));
    this.loadingJunctions.set(false);
  }

  protected isChecked(episodeId: string | undefined): boolean {
    return !!episodeId && this.selected().has(episodeId);
  }

  protected toggleEpisode(episodeId: string | undefined): void {
    if (!episodeId) return;
    const next = new Set(this.selected());
    if (next.has(episodeId)) {
      next.delete(episodeId);
    } else {
      next.add(episodeId);
    }
    this.selected.set(next);
  }

  protected toggleAll(): void {
    if (this.allSelected()) {
      this.selected.set(new Set());
      return;
    }
    const next = new Set<string>();
    for (const e of this.episodeStore.episodes()) {
      if (e.id) next.add(e.id);
    }
    this.selected.set(next);
  }

  protected async onSave(): Promise<void> {
    if (!this.isDirty() || this.saving()) return;
    this.saving.set(true);
    try {
      await this.episodeGenreService.setEpisodesForGenre(
        this.genreId,
        [...this.selected()]
      );
      this.router.navigate(['/genres']);
    } finally {
      this.saving.set(false);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/genres']);
  }
}
