import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { CategoryStore } from '../../../../../../../libs/category/category.store';

@Component({
  selector: 'app-category-add',
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './category-add.html',
  styleUrl: './category-add.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryAdd {
  private readonly categoryStore = inject(CategoryStore);
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
    await this.categoryStore.createCategory({ name, slug });
    if (!this.categoryStore.error()) {
      this.router.navigate(['/categories']);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/categories']);
  }
}
