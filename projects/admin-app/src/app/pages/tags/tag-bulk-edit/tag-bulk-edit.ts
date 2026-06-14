import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TagService, TagStore } from '@aj/core';
import { EpisodeStore } from '@aj/core';

@Component({
  selector: 'app-tag-bulk-edit',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './tag-bulk-edit.html',
  styleUrl: './tag-bulk-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagBulkEdit implements OnInit {
  protected readonly tagStore = inject(TagStore);
  protected readonly episodeStore = inject(EpisodeStore);
  private readonly tagService = inject(TagService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['select', 'title', 'episodeDate', 'isVisible'];

  private tagId = '';
  private initialAssigned = signal<Set<string>>(new Set());
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly saving = signal(false);
  protected readonly loadingJunctions = signal(true);
  protected readonly junctionError = signal<string | null>(null);
  protected readonly filter = signal('');

  // Episodes narrowed by the title filter; drives the table and select-all so
  // both reflect only the rows the user can currently see.
  protected readonly filteredEpisodes = computed(() => {
    const term = this.filter().trim().toLowerCase();
    const episodes = this.episodeStore.episodes();
    if (!term) return episodes;
    return episodes.filter((e) => e.title.toLowerCase().includes(term));
  });

  protected readonly isDirty = computed(() => {
    const a = this.initialAssigned();
    const b = this.selected();
    if (a.size !== b.size) return true;
    for (const id of a) if (!b.has(id)) return true;
    return false;
  });

  protected readonly allSelected = computed(() => {
    const episodes = this.filteredEpisodes();
    const sel = this.selected();
    return episodes.length > 0 && episodes.every((e) => e.id && sel.has(e.id));
  });

  protected readonly someSelected = computed(() => {
    const episodes = this.filteredEpisodes();
    const sel = this.selected();
    return episodes.some((e) => e.id && sel.has(e.id)) && !this.allSelected();
  });

  async ngOnInit(): Promise<void> {
    this.tagId = this.route.snapshot.params['id'];
    await Promise.all([this.tagStore.loadTagById(this.tagId), this.episodeStore.loadEpisodes()]);
    this.loadAssigned();
  }

  // Current membership is derived from the episodes' embedded tags, which
  // loadEpisodes() has already fetched — no separate junction read.
  private loadAssigned(): void {
    this.loadingJunctions.set(true);
    this.junctionError.set(null);
    const ids = this.episodeStore
      .episodes()
      .filter((e) => e.id && e.tags.some((t) => t.id === this.tagId))
      .map((e) => e.id!);
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
    const episodes = this.filteredEpisodes();
    const next = new Set(this.selected());
    if (this.allSelected()) {
      for (const e of episodes) if (e.id) next.delete(e.id);
    } else {
      for (const e of episodes) if (e.id) next.add(e.id);
    }
    this.selected.set(next);
  }

  protected async onSave(): Promise<void> {
    if (!this.isDirty() || this.saving()) return;
    const tag = this.tagStore.selectedTag();
    if (!tag) return;
    this.saving.set(true);
    try {
      await this.tagService.setEpisodesForTag(tag, [...this.selected()]);
      this.router.navigate(['/tags']);
    } finally {
      this.saving.set(false);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/tags']);
  }
}
