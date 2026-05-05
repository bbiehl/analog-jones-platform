import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GenreStore } from '@aj/core';

@Component({
  selector: 'app-genre-edit',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './genre-edit.html',
  styleUrl: './genre-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreEdit implements OnInit, OnDestroy {
  protected readonly genreStore = inject(GenreStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
  });

  private genreId = '';

  constructor() {
    effect(() => {
      const genre = this.genreStore.selectedGenre();
      if (genre) {
        this.form.patchValue({ name: genre.name, slug: genre.slug });
      }
    });
  }

  ngOnInit(): void {
    this.genreId = this.route.snapshot.params['id'];
    this.genreStore.loadGenreById(this.genreId);
  }

  ngOnDestroy(): void {
    this.genreStore.clearSelectedGenre();
  }

  protected onNameInput(): void {
    const name = this.form.controls.name.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    this.form.controls.slug.setValue(slug);
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    const { name, slug } = this.form.getRawValue();
    await this.genreStore.updateGenre(this.genreId, { name, slug });
    if (!this.genreStore.error()) {
      this.router.navigate(['/genres']);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/genres']);
  }
}
