import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ExploreSearchService {
  // Get search term options for autocomplete
  // Concatenate episode titles, genre names, and tag names into a single array of search term options for the autocomplete component.
  // Each search term option should include the type (episode, genre, or tag) and the corresponding data (e.g., episode title, genre name, or tag name). Use SearchAutoCompleteOption interface.

  
  // Get search results based on the query
  // Return an array of episodes that match the selected autocomplete option (SearchAutoCompleteOption), sorted by relevance.
  // Make sure remove duplicates from the results if an episode matches multiple search criteria.
}
