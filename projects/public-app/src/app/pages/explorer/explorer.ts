import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EpisodeScroller } from '../../episode/episode-scroller/episode-scroller';
import { EpisodeScrollerSkeleton } from '../../episode/episode-scroller-skeleton/episode-scroller-skeleton';
import { ExploreSearchStore } from '../../explore/explore-search.store';
import { SearchAutoCompleteOption } from '../../explore/explore.model';

interface OptionGroup {
  label: string;
  options: SearchAutoCompleteOption[];
}

const GROUP_ORDER: { type: SearchAutoCompleteOption['type']; label: string }[] = [
  { type: 'episode', label: 'Episodes' },
  { type: 'genre', label: 'Genres' },
  { type: 'tag', label: 'Tags' },
];

@Component({
  selector: 'app-explorer',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    EpisodeScroller,
    EpisodeScrollerSkeleton,
  ],
  templateUrl: './explorer.html',
  styleUrl: './explorer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Explorer implements OnInit {
  private store = inject(ExploreSearchStore);

  protected readonly searchControl = new FormControl<string | SearchAutoCompleteOption>('', {
    nonNullable: true,
  });

  private readonly searchText = toSignal(this.searchControl.valueChanges, {
    initialValue: this.searchControl.value,
  });

  protected readonly autoCompleteOptions = this.store.autoCompleteOptions;
  protected readonly results = this.store.results;
  protected readonly isLoading = this.store.isLoading;
  protected readonly error = this.store.error;
  protected readonly selectedSearchOption = this.store.selectedSearchOption;

  protected readonly optionsLoaded = computed(() => this.autoCompleteOptions().length > 0);
  protected readonly optionsLoading = computed(
    () => this.isLoading() && !this.selectedSearchOption() && !this.optionsLoaded()
  );
  protected readonly optionsError = computed(() =>
    !this.optionsLoaded() && !this.selectedSearchOption() ? this.error() : null
  );
  protected readonly resultsLoading = computed(
    () => this.isLoading() && !!this.selectedSearchOption()
  );
  protected readonly resultsError = computed(() =>
    this.selectedSearchOption() ? this.error() : null
  );

  protected readonly groupedOptions = computed<OptionGroup[]>(() => {
    const raw = this.searchText();
    const term = (typeof raw === 'string' ? raw : raw?.value ?? '').trim().toLowerCase();
    const all = this.autoCompleteOptions();
    const matches = term
      ? all.filter((o) => o.value.toLowerCase().includes(term))
      : all;
    return GROUP_ORDER.map(({ type, label }) => ({
      label,
      options: matches.filter((o) => o.type === type),
    })).filter((g) => g.options.length > 0);
  });

  ngOnInit(): void {
    this.store.loadAutoCompleteOptions();
  }

  protected displayFn = (option: SearchAutoCompleteOption | string | null): string => {
    if (!option) return '';
    return typeof option === 'string' ? option : option.value;
  };

  protected onOptionSelected(event: MatAutocompleteSelectedEvent): void {
    const option = event.option.value as SearchAutoCompleteOption;
    this.store.selectSearchOption(option);
  }
}
