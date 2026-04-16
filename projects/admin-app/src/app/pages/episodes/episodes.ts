import { ChangeDetectionStrategy, Component, effect, inject, OnInit, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Episode } from '../../../../../../libs/episode/episode.model';
import { EpisodeStore } from '../../../../../../libs/episode/episode.store';

@Component({
  selector: 'app-episodes',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSortModule,
    MatTableModule,
  ],
  templateUrl: './episodes.html',
  styleUrl: './episodes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Episodes implements OnInit {
  protected readonly episodeStore = inject(EpisodeStore);
  private readonly router = inject(Router);

  protected readonly displayedColumns = ['title', 'year', 'episodeDate', 'isVisible', 'actions'];
  protected readonly dataSource = new MatTableDataSource<Episode>([]);
  protected filterValue = '';

  private readonly paginator = viewChild(MatPaginator);
  private readonly sort = viewChild(MatSort);

  constructor() {
    this.dataSource.sortingDataAccessor = (episode: Episode, header: string) => {
      switch (header) {
        case 'title':
          return episode.title.toLowerCase();
        case 'year':
          return episode.year;
        case 'episodeDate':
          return episode.episodeDate.toMillis();
        default:
          return '';
      }
    };

    this.dataSource.filterPredicate = (episode: Episode, filter: string) => {
      return episode.title.toLowerCase().includes(filter);
    };

    effect(() => {
      const episodes = this.episodeStore.episodes();
      this.dataSource.data = episodes;
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
    this.episodeStore.loadEpisodes();
  }

  protected applyFilter(value: string): void {
    this.dataSource.filter = value.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  protected onAdd(): void {
    this.router.navigate(['/episodes/add']);
  }

  protected onEdit(id: string): void {
    this.router.navigate(['/episodes/edit', id]);
  }

  protected async onDelete(id: string): Promise<void> {
    if (confirm('Are you sure you want to delete this episode?')) {
      await this.episodeStore.deleteEpisode(id);
    }
  }

  protected async onToggleVisibility(id: string, isVisible: boolean): Promise<void> {
    await this.episodeStore.toggleEpisodeVisibility(id, isVisible);
  }
}
