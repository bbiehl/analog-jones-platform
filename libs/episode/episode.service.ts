import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EpisodeService {
    // getAllEpisodes, for admin listing
    // Returns an array of Episode objects, which include the episode data but not the associated categories, genres, or tags

    // toggleEpisodeVisibility, for admin listing
    // this is used by the admin listing to toggle the visibility of an episode on the episodes page

    // getCurrentEpisode, for listing on the home page
    // Returns an Episode object, which include the episode data but not the associated categories, genres, or tags
    // This should return the most recent episode that is visible on the episodes page, or null if there are no visible episodes

    // getRecentEpisodes, for listing on the home page
    // Returns an array of Episode objects, which include the episode data but not the associated categories, genres, or tags
    // Episodes should be ordered by createdAt, with the most recent episode first, and limited to 5 episodes
    // Episodes should only be returned if they are visible on the episodes page

    // getVisibleEpisodes, for listing on the episodes page
    // Returns an array of Episode objects, which include the episode data but not the associated categories, genres, or tags
    // This should be paginated, and filtered by a search term if provided

    // getEpisodeById, for editing and for episode page
    // Returns an EpisodeWithRelations, which includes the episode data along with the associated categories, genres, and tags

    // createEpisode
    // must recursively create any episodeCategory, episodeGenre, episodeTag after the episode is created and has an episodeId

    // updateEpisode
    // must recursively create/delete any episodeCategory, episodeGenre, episodeTag associated with the episodeId if any of those fields are updated

    // deleteEpisode
    // must recursively delete any episodeCategory, episodeGenre, episodeTag with the episodeId

}
