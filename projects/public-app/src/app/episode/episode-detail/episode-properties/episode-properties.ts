import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-episode-properties',
  imports: [],
  templateUrl: './episode-properties.html',
  styleUrl: './episode-properties.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeProperties {
  // Display episode properties.
  // title, episideDate, intelligence (markdown), poster image, spotify/youtube links, categories, genres, tags.

  
}
