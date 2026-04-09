import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EpisodeTagService {
    // createEpisodeTag
    // this is never called directly, but is used by EpisodeService and TagService when creating/updating episodes and tags

    // deleteEpisodeTag
    // this is never called directly, but is used by EpisodeService and TagService when updating/deleting episodes and tags

    // getEpisodeTagsByEpisodeId
    // this is never called directly, but is used by EpisodeService when listing the tags of an episode on the episode page and for editing an episode
    // Returns an array of Tag objects, which include the tag data but not the associated episodes
    // for listing the tags of an episode on the episode page and for editing an episode
    // Returns an array of Tag objects, which include the tag data but not the associated episodes

    // getEpisodesByTagSlug
    // for listing the episodes of a tag on the tag page
    // Returns an array of Episode objects, which include the episode data but not the associated categories, genres, or tags
}
