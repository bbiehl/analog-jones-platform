import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CategoryService {
    // getAllCategories, for admin listing and for categories page
    // Returns an array of Category objects, which include the category data but not the associated episodes

    // getCategoryById, for editing a category in the admin panel
    // Returns a Category object, which includes the category data but not the associated episodes

    // getCategoryBySlug, for listing the episodes of a category on the category page
    // Returns an array of CategoryWithRelations objects, which includes the category data along with the associated episodes

    // createCategory

    // updateCategory

    // deleteCategory
    // must recursively delete any episodeCategory with the categoryId
}
