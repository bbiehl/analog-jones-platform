import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { CategoryStore } from '@aj/core';

@Component({
  selector: 'app-categories',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories implements OnInit {
  protected readonly categoryStore = inject(CategoryStore);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['name', 'slug', 'actions'];

  ngOnInit(): void {
    this.categoryStore.loadCategories();
  }

  protected onAdd(): void {
    this.router.navigate(['/categories/add']);
  }

  protected onEdit(id: string): void {
    this.router.navigate(['/categories/edit', id]);
  }

  protected onBulkEdit(id: string): void {
    this.router.navigate(['/categories/bulk-edit', id]);
  }

  protected async onDelete(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this category?')) {
      await this.categoryStore.deleteCategory(id);
    }
  }
}
