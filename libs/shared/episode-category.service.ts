import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EpisodeCategoryService {
    // createEpisodeCategory
    // this is never called directly, but is used by EpisodeService and CategoryService when creating/updating episodes and categories

    // deleteEpisodeCategory
    // this is never called directly, but is used by EpisodeService and CategoryService when updating/deleting episodes and categories

    // getEpisodeCategoriesByEpisodeId
    // this is never called directly, but is used by EpisodeService when getting an episode by ID to include the categories of the episode
    // for listing the categories of an episode on the episode page and for editing an episode
    // Returns an array of Category objects, which include the category data but not the associated episodes

    // getEpisodesByCategorySlug
    // this is never called directly, but is used by CategoryService when getting a category by slug to include the episodes of the category
    // for listing the episodes of a category on the category page
    // Returns an array of Episode objects, which include the episode data but not the associated categories, genres, or tags
}
