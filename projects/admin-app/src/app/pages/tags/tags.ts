import { ChangeDetectionStrategy, Component, effect, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Tag } from '../../../../../../libs/tag/tag.model';
import { TagStore } from '../../../../../../libs/tag/tag.store';

@Component({
  selector: 'app-tags',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './tags.html',
  styleUrl: './tags.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tags implements OnInit {
  protected readonly tagStore = inject(TagStore);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['name', 'slug', 'actions'];
  protected readonly dataSource = new MatTableDataSource<Tag>([]);
  protected filterValue = '';

  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  constructor() {
    this.dataSource.sortingDataAccessor = (tag: Tag, header: string) => {
      switch (header) {
        case 'name':
          return tag.name.toLowerCase();
        case 'slug':
          return tag.slug.toLowerCase();
        default:
          return '';
      }
    };

    this.dataSource.filterPredicate = (tag: Tag, filter: string) => {
      return tag.name.toLowerCase().includes(filter) || tag.slug.toLowerCase().includes(filter);
    };

    effect(() => {
      const tags = this.tagStore.tags();
      this.dataSource.data = tags;
    });

    effect(() => {
      const paginatorRef = this.paginator();
      if (paginatorRef) this.dataSource.paginator = paginatorRef;
    });

    effect(() => {
      const sortRef = this.sort();
      if (sortRef) this.dataSource.sort = sortRef;
    });
  }

  ngOnInit(): void {
    this.tagStore.loadTags();
  }

  protected onAdd(): void {
    this.router.navigate(['/tags/add']);
  }

  protected onEdit(id: string): void {
    this.router.navigate(['/tags/edit', id]);
  }

  protected onBulkEdit(id: string): void {
    this.router.navigate(['/tags/bulk-edit', id]);
  }

  protected applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  protected async onDelete(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this tag?')) {
      await this.tagStore.deleteTag(id);
    }
  }
}
