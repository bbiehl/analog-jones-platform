import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TagService {
    // getAllTags, for admin listing and for tags page
    // Returns an array of Tag objects, which include the tag data but not the associated episodes
    
    // getTagById, for editing
    // Returns a Tag object, which includes the tag data but not the associated episodes

    // getTagBySlug, for listing the episodes of a tag on the tag page
    // Returns a TagWithRelations, which includes the tag data along with the associated episodes

    // createTag

    // updateTag

    // deleteTag
    // must recursively delete any episodeTag with the tagId
}
