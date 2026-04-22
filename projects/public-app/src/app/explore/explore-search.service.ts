import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExploreSearchService {
  // Get search term options for autocomplete
  // Concatenate episode titles, genre names, and tag names into a single array of search term options for the autocomplete component.



  // Get search results based on the query
  // First, search by episode title.
  // Second, search by tags and return episodes that match the tag.
  // Third, search by genres and return episodes that match the genre.
  // Return an array of episodes that match the search query, sorted by relevance.
  // Make sure remove duplicates from the results if an episode matches multiple search criteria.
}
