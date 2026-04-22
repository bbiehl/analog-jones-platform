import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-episode-scroller-skeleton',
  imports: [],
  templateUrl: './episode-scroller-skeleton.html',
  styleUrl: './episode-scroller-skeleton.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeScrollerSkeleton {
  protected readonly posters = [0, 1, 2, 3, 4, 5];
}
