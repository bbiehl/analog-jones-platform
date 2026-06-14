import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Episode } from '@aj/core';

@Component({
  selector: 'app-episode-grid',
  imports: [DatePipe, UpperCasePipe, RouterLink],
  templateUrl: './episode-grid.html',
  styleUrl: './episode-grid.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeGrid {
  readonly episodes = input<Episode[]>([]);
  readonly heading = input<string | null>(null);
  readonly ariaLabel = input<string>('Episodes');
  readonly routerPrefix = input<string>('/episodes');
  readonly loading = input<boolean>(false);

  protected readonly skeletonSlots = [0, 1, 2, 3, 4, 5];

  protected toDate(episode: Episode): Date {
    return episode.episodeDate.toDate();
  }
}
