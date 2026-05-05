import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TagStore } from '@aj/core';

@Component({
  selector: 'app-tag-add',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './tag-add.html',
  styleUrl: './tag-add.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagAdd {
  private readonly tagStore = inject(TagStore);
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
    await this.tagStore.createTag({ name, slug });
    if (!this.tagStore.error()) {
      this.router.navigate(['/tags']);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/tags']);
  }
}
