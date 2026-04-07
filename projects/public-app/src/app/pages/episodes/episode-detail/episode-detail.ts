import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-episode-detail',
  imports: [],
  templateUrl: './episode-detail.html',
  styleUrl: './episode-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeDetail {}
