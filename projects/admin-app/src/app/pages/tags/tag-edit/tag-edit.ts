import { ChangeDetectionStrategy, Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TagStore } from '@aj/core';

@Component({
  selector: 'app-tag-edit',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './tag-edit.html',
  styleUrl: './tag-edit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagEdit implements OnInit, OnDestroy {
  protected readonly tagStore = inject(TagStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
  });

  private tagId = '';

  constructor() {
    effect(() => {
      const tag = this.tagStore.selectedTag();
      if (tag) {
        this.form.patchValue({ name: tag.name, slug: tag.slug });
      }
    });
  }

  ngOnInit(): void {
    this.tagId = this.route.snapshot.params['id'];
    this.tagStore.loadTagById(this.tagId);
  }

  ngOnDestroy(): void {
    this.tagStore.clearSelectedTag();
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
    await this.tagStore.updateTag(this.tagId, { name, slug });
    if (!this.tagStore.error()) {
      this.router.navigate(['/tags']);
    }
  }

  protected onCancel(): void {
    this.router.navigate(['/tags']);
  }
}
