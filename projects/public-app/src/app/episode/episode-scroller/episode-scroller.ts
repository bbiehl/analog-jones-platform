import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-episode-scroller',
  imports: [],
  templateUrl: './episode-scroller.html',
  styleUrl: './episode-scroller.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeScroller {}
