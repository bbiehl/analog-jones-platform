import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RelatedEpisodesService {
  // Using episodeId, fetch related episodes based first on shared tags, then on shared genres.
  // Return an array of visible, related episodes, sorted by episodeDate.
}
