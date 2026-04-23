import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-episode-detail',
  imports: [],
  templateUrl: './episode-detail.html',
  styleUrl: './episode-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeDetail {
  // Load episode by ID (EpisodeWithRelations) from route params via the EpisodeStore in libs. If the episode is not found, route to the "not found" page.
  // If the episode is not visible, route to the "not found" page.
  // Load EpisodeWithRelations, which includes categories, genres, and tags for the episode. This will be used to find related episodes and display episode properties.
  // Load related episodes using the RelatedEpisode.store in libs.

  // Display episode properties via the EpisodeProperties component.
  // If the episode is loading, display the EpisodeDetailSkeleton component.


  // Display related episodes via the EpisodeScroller component.
  // If there are no related episodes, display a message encouraging users to explore other episodes.
  // If the related episodes are loading, display the EpisodeScrollerSkeleton component.

  
}
