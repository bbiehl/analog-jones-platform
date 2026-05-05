import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { GenreStore } from '@aj/core';

@Component({
  selector: 'app-genres',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  templateUrl: './genres.html',
  styleUrl: './genres.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Genres implements OnInit {
  protected readonly genreStore = inject(GenreStore);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['name', 'slug', 'actions'];

  ngOnInit(): void {
    this.genreStore.loadGenres();
  }

  protected onAdd(): void {
    this.router.navigate(['/genres/add']);
  }

  protected onEdit(id: string): void {
    this.router.navigate(['/genres/edit', id]);
  }

  protected onBulkEdit(id: string): void {
    this.router.navigate(['/genres/bulk-edit', id]);
  }

  protected async onDelete(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this genre?')) {
      await this.genreStore.deleteGenre(id);
    }
  }
}
