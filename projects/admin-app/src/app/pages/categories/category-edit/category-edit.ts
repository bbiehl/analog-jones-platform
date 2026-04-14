import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoryStore } from '../../../../../../../libs/category/category.store';

@Component({
  selector: 'app-category-edit',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-edit.html',
  styleUrl: './category-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryEdit implements OnInit, OnDestroy {
  protected readonly categoryStore = inject(CategoryStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
  });

  private categoryId = '';

  constructor() {
    effect(() => {
      const category = this.categoryStore.selectedCategory();
      if (category) {
        this.form.patchValue({ name: category.name, slug: category.slug });
      }
    });
  }

  ngOnInit(): void {
    this.categoryId = this.route.snapshot.params['id'];
    this.categoryStore.loadCategoryById(this.categoryId);
  }

  ngOnDestroy(): void {
    this.categoryStore.clearSelectedCategory();
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
    await this.categoryStore.updateCategory(this.categoryId, { name, slug });
    this.router.navigate(['/categories']);
  }

  protected onCancel(): void {
    this.router.navigate(['/categories']);
  }
}
