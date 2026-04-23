import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-explorer',
  imports: [],
  templateUrl: './explorer.html',
  styleUrl: './explorer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Explorer {
  // On init, load the search term options for the autocomplete component by calling the ExploreSearchStore.
}
