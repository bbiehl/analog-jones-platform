import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Timestamp } from 'firebase/firestore';
import { marked } from 'marked';
import { CategoryStore } from '../../../../../../../libs/category/category.store';
import { EpisodeStore } from '../../../../../../../libs/episode/episode.store';
import { GenreStore } from '../../../../../../../libs/genre/genre.store';
import { TagStore } from '../../../../../../../libs/tag/tag.store';

@Component({
  selector: 'app-episode-edit',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './episode-edit.html',
  styleUrl: './episode-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeEdit implements OnInit, OnDestroy {
  protected readonly episodeStore = inject(EpisodeStore);
  protected readonly categoryStore = inject(CategoryStore);
  protected readonly genreStore = inject(GenreStore);
  protected readonly tagStore = inject(TagStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    episodeDate: [new Date(), Validators.required],
    episodeDuration: [0, [Validators.required, Validators.min(1)]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1900)]],
    intelligence: [''],
    isVisible: [false],
    spotifyLink: [''],
    youtubeLink: [''],
    categoryIds: [[] as string[]],
    genreIds: [[] as string[]],
    tagIds: [[] as string[]],
  });

  protected readonly posterFile = signal<File | null>(null);
  protected readonly posterPreview = signal<string | null>(null);
  protected readonly posterRemoved = signal(false);
  protected readonly showMarkdownPreview = signal(false);
  protected readonly submitting = signal(false);
  protected readonly submitError = signal<string | null>(null);

  protected readonly initialLoading = computed(
    () => this.episodeStore.loading() && !this.episodeStore.selectedEpisode()
  );

  private readonly intelligenceValue = toSignal(this.form.controls.intelligence.valueChanges, {
    initialValue: '',
  });

  protected readonly markdownHtml = computed(() => {
    const raw = this.intelligenceValue();
    if (!raw) return '';
    return marked(raw) as string;
  });

  private episodeId = '';

  constructor() {
    effect(() => {
      const episode = this.episodeStore.selectedEpisode();
      if (episode) {
        this.form.patchValue({
          title: episode.title,
          episodeDate: episode.episodeDate.toDate(),
          episodeDuration: episode.episodeDuration,
          year: episode.year,
          intelligence: episode.intelligence ?? '',
          isVisible: episode.isVisible,
          spotifyLink: episode.links.spotify ?? '',
          youtubeLink: episode.links.youtube ?? '',
          categoryIds: episode.categories.map((c) => c.id!),
          genreIds: episode.genres.map((g) => g.id!),
          tagIds: episode.tags.map((t) => t.id!),
        });
        if (episode.posterUrl) {
          this.posterPreview.set(episode.posterUrl);
        }
      }
    });
  }

  ngOnInit(): void {
    this.episodeId = this.route.snapshot.params['id'];
    this.episodeStore.loadEpisodeById(this.episodeId);
    this.categoryStore.loadCategories();
    this.genreStore.loadGenres();
    this.tagStore.loadTags();
  }

  ngOnDestroy(): void {
    this.episodeStore.clearSelectedEpisode();
  }

  protected onPosterSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.posterFile.set(file);
      this.posterRemoved.set(false);
      const reader = new FileReader();
      reader.onload = () => this.posterPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  protected removePoster(): void {
    this.posterFile.set(null);
    this.posterPreview.set(null);
    this.posterRemoved.set(true);
  }

  protected togglePreview(): void {
    this.showMarkdownPreview.update((v) => !v);
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;

    this.submitting.set(true);
    this.submitError.set(null);
    try {
      const v = this.form.getRawValue();
      await this.episodeStore.updateEpisode(
        this.episodeId,
        {
          episodeDate: Timestamp.fromDate(v.episodeDate),
          episodeDuration: v.episodeDuration,
          intelligence: v.intelligence || null,
          isVisible: v.isVisible,
          links: {
            ...(v.spotifyLink ? { spotify: v.spotifyLink } : {}),
            ...(v.youtubeLink ? { youtube: v.youtubeLink } : {}),
          },
          title: v.title,
          year: v.year,
        },
        v.categoryIds,
        v.genreIds,
        v.tagIds,
        this.posterFile() ?? undefined,
        this.posterRemoved()
      );
      const error = this.episodeStore.error();
      if (error) {
        this.submitError.set(error);
      } else {
        this.router.navigate(['/episodes']);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/episodes']);
  }
}
