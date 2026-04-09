import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GenreService {
    // getAllGenres, for admin listing and for genres page
    // Returns an array of Genre objects, which include the genre data but not the associated episodes
    
    // getGenreById, for editing a genre in the admin panel
    // Returns a Genre object, which includes the genre data but not the associated episodes

    // getGenreBySlug, for listing the episodes of a genre on the genre page
    // Returns an array of GenreWithRelations objects, which includes the genre data along with the associated episodes

    // createGenre

    // updateGenre

    // deleteGenre
    // must recursively delete any episodeGenre with the genreId
}
