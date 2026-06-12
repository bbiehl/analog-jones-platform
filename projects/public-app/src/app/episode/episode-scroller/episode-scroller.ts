import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Episode } from '@aj/core';

@Component({
  selector: 'app-episode-scroller',
  imports: [DatePipe, UpperCasePipe, RouterLink],
  templateUrl: './episode-scroller.html',
  styleUrl: './episode-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeScroller {
  readonly episodes = input.required<Episode[]>();
  readonly heading = input<string | null>(null);
  readonly eyebrow = input<string | null>(null);
  readonly seeAllLabel = input<string | null>(null);
  readonly seeAllLink = input<string | any[] | null>(null);
  readonly ariaLabel = input<string>('Episodes');
  readonly routerPrefix = input<string>('/episodes');

  protected toDate(episode: Episode): Date {
    return episode.episodeDate.toDate();
  }
}
