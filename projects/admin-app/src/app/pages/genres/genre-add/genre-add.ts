import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { GenreStore } from '../../../../../../../libs/genre/genre.store';

@Component({
  selector: 'app-genre-add',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './genre-add.html',
  styleUrl: './genre-add.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenreAdd {
  private readonly genreStore = inject(GenreStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
  });

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
    await this.genreStore.createGenre({ name, slug });
    if (!this.genreStore.error()) {
      this.router.navigate(['/genres']);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/genres']);
  }
}
