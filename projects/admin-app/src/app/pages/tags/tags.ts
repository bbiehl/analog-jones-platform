import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { TagStore } from '../../../../../../libs/tag/tag.store';

@Component({
  selector: 'app-tags',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './tags.html',
  styleUrl: './tags.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tags implements OnInit {
  protected readonly tagStore = inject(TagStore);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['name', 'slug', 'actions'];

  ngOnInit(): void {
    this.tagStore.loadTags();
  }

  protected onAdd(): void {
    this.router.navigate(['/tags/add']);
  }

  protected onEdit(id: string): void {
    this.router.navigate(['/tags/edit', id]);
  }

  protected async onDelete(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this tag?')) {
      await this.tagStore.deleteTag(id);
    }
  }
}
