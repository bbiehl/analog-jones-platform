import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EpisodeGenreService {
    // createEpisodeGenre
    // this is never called directly, but is used by EpisodeService and GenreService when creating/updating episodes and genres

    // deleteEpisodeGenre
    // this is never called directly, but is used by EpisodeService and GenreService when updating/deleting episodes and genres

    // getEpisodeGenresByEpisodeId
    // for listing the genres of an episode on the episode page and for editing an episode
    // Returns an array of Genre objects, which include the genre data but not the associated episodes

    // getEpisodesByGenreId
    // for listing the episodes of a genre on the genre page
    // Returns an array of Episode objects, which include the episode data but not the associated categories, genres, or tags
}
