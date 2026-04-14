import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { EpisodeStore } from '../../../../../../libs/episode/episode.store';

@Component({
  selector: 'app-episodes',
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
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

  ngOnInit(): void {
    this.episodeStore.loadEpisodes();
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
