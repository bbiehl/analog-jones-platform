import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WritableSignal, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { Timestamp } from 'firebase/firestore';

import { Explorer } from './explorer';
import { ExploreSearchStore } from '../../explore/explore-search.store';
import { SearchAutoCompleteOption } from '../../explore/explore.model';
import { Episode } from '@aj/core';

type MockStore = {
  autoCompleteOptions: WritableSignal<SearchAutoCompleteOption[]>;
  selectedSearchOption: WritableSignal<SearchAutoCompleteOption | null>;
  results: WritableSignal<Episode[]>;
  isLoading: WritableSignal<boolean>;
  error: WritableSignal<string | null>;
  loadAutoCompleteOptions: ReturnType<typeof vi.fn>;
  selectSearchOption: ReturnType<typeof vi.fn>;
  clearSearch: ReturnType<typeof vi.fn>;
  searchEpisodes: ReturnType<typeof vi.fn>;
};

function createMockStore(): MockStore {
  return {
    autoCompleteOptions: signal<SearchAutoCompleteOption[]>([]),
    selectedSearchOption: signal<SearchAutoCompleteOption | null>(null),
    results: signal<Episode[]>([]),
    isLoading: signal(false),
    error: signal<string | null>(null),
    loadAutoCompleteOptions: vi.fn().mockResolvedValue(undefined),
    selectSearchOption: vi.fn().mockResolvedValue(undefined),
    clearSearch: vi.fn(),
    searchEpisodes: vi.fn().mockResolvedValue(undefined),
  };
}

function makeEpisode(id: string, title: string): Episode {
  return {
    id,
    createdAt: Timestamp.fromDate(new Date('2024-01-01')),
    episodeDate: Timestamp.fromDate(new Date('2024-06-01')),
    intelligence: null,
    isVisible: true,
    links: {},
    posterUrl: null,
    title,
  };
}

describe('Explorer', () => {
  let component: Explorer;
  let fixture: ComponentFixture<Explorer>;
  let loader: HarnessLoader;
  let mockStore: MockStore;

  beforeEach(async () => {
    mockStore = createMockStore();

    await TestBed.configureTestingModule({
      imports: [Explorer],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: ExploreSearchStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Explorer);
    component = fixture.componentInstance;
    loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load autocomplete options on init', () => {
    expect(mockStore.loadAutoCompleteOptions).toHaveBeenCalled();
  });

  it('should render the heading and description', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('Explorer');
    expect(host.querySelector('p')?.textContent).toContain(
      'Search for episodes, genres, and tags.',
    );
  });

  describe('search input', () => {
    it('should render a labelled search input', async () => {
      const input = await loader.getHarness(MatInputHarness);
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('mat-label')?.textContent).toContain('Search');
      expect(await input.getId()).toBeTruthy();
    });

    it('should disable the input while options are loading', async () => {
      mockStore.isLoading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = await loader.getHarness(MatInputHarness);
      expect(await input.isDisabled()).toBe(true);
    });

    it('should enable the input once options have loaded', async () => {
      mockStore.isLoading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      mockStore.isLoading.set(false);
      mockStore.autoCompleteOptions.set([{ type: 'tag', value: 'synth' }]);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = await loader.getHarness(MatInputHarness);
      expect(await input.isDisabled()).toBe(false);
    });

    it('should disable the input when options fail to load', async () => {
      mockStore.error.set('Network error');
      fixture.detectChanges();
      await fixture.whenStable();

      const input = await loader.getHarness(MatInputHarness);
      expect(await input.isDisabled()).toBe(true);
    });

    it('should show a spinner suffix while options are loading', async () => {
      mockStore.isLoading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const spinners = await loader.getAllHarnesses(MatProgressSpinnerHarness);
      expect(spinners.length).toBe(1);
    });

    it('should not render the clear button when the input is empty', async () => {
      const clearButtons = await loader.getAllHarnesses(
        MatButtonHarness.with({ selector: '[aria-label="Clear search"]' }),
      );
      expect(clearButtons.length).toBe(0);
    });

    it('should render a clear button once the input has a value', async () => {
      mockStore.autoCompleteOptions.set([{ type: 'tag', value: 'synth' }]);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = await loader.getHarness(MatInputHarness);
      await input.setValue('syn');

      const clearButton = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Clear search"]' }),
      );
      expect(clearButton).toBeTruthy();
    });

    it('should clear the input and call store.clearSearch when the clear button is clicked', async () => {
      mockStore.autoCompleteOptions.set([{ type: 'tag', value: 'synth' }]);
      fixture.detectChanges();
      await fixture.whenStable();

      const input = await loader.getHarness(MatInputHarness);
      await input.setValue('syn');

      const clearButton = await loader.getHarness(
        MatButtonHarness.with({ selector: '[aria-label="Clear search"]' }),
      );
      await clearButton.click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(await input.getValue()).toBe('');
      expect(mockStore.clearSearch).toHaveBeenCalled();
    });
  });

  describe('autocomplete panel', () => {
    beforeEach(async () => {
      mockStore.autoCompleteOptions.set([
        { type: 'episode', value: 'Episode One' },
        { type: 'episode', value: 'Episode Two' },
        { type: 'genre', value: 'Jazz' },
        { type: 'tag', value: 'synth' },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('should render grouped options when focused', async () => {
      const autocomplete = await loader.getHarness(MatAutocompleteHarness);
      await autocomplete.focus();

      expect(await autocomplete.isOpen()).toBe(true);
      const options = await autocomplete.getOptions();
      const optionTexts = await Promise.all(options.map((o) => o.getText()));
      expect(optionTexts).toEqual(
        expect.arrayContaining(['Episode One', 'Episode Two', 'Jazz', 'synth']),
      );

      const host = fixture.nativeElement as HTMLElement;
      const groupLabels = Array.from(
        document.querySelectorAll('mat-optgroup .mat-mdc-optgroup-label, mat-optgroup label'),
      )
        .map((el) => el.textContent?.trim())
        .filter(Boolean);
      // Fall back to overlay query if host query missed anything.
      const overlayGroupLabels = Array.from(
        document.querySelectorAll('.cdk-overlay-container mat-optgroup'),
      ).map((el) => (el as HTMLElement).getAttribute('label'));
      const visible = new Set([...groupLabels, ...overlayGroupLabels]);
      expect(visible.has('Episodes')).toBe(true);
      expect(visible.has('Genres')).toBe(true);
      expect(visible.has('Tags')).toBe(true);
      // Reference host to quiet unused-var lint.
      expect(host).toBeTruthy();
    });

    it('should filter options by the typed search term', async () => {
      const input = await loader.getHarness(MatInputHarness);
      await input.setValue('jaz');

      const autocomplete = await loader.getHarness(MatAutocompleteHarness);
      const options = await autocomplete.getOptions();
      const texts = await Promise.all(options.map((o) => o.getText()));
      expect(texts).toEqual(['Jazz']);
    });

    it('should call store.selectSearchOption when an option is selected', async () => {
      const autocomplete = await loader.getHarness(MatAutocompleteHarness);
      await autocomplete.focus();
      const options = await autocomplete.getOptions({ text: 'Jazz' });
      await options[0].click();

      expect(mockStore.selectSearchOption).toHaveBeenCalledWith({
        type: 'genre',
        value: 'Jazz',
      });
    });
  });

  describe('results section', () => {
    it('should render the results skeleton while results are loading', async () => {
      mockStore.selectedSearchOption.set({ type: 'genre', value: 'Jazz' });
      mockStore.isLoading.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('app-episode-scroller-skeleton')).toBeTruthy();
    });

    it('should render a results error message', async () => {
      mockStore.selectedSearchOption.set({ type: 'genre', value: 'Jazz' });
      mockStore.error.set('Something broke');
      fixture.detectChanges();
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      const alert = host.querySelector('[role="alert"]');
      expect(alert?.textContent).toContain('Something broke');
    });

    it('should render an empty-state message when a search returns no episodes', async () => {
      mockStore.selectedSearchOption.set({ type: 'genre', value: 'Jazz' });
      mockStore.results.set([]);
      fixture.detectChanges();
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      expect(host.textContent).toContain('No episodes found for "Jazz".');
    });

    it('should render the episode scroller when results are present', async () => {
      mockStore.selectedSearchOption.set({ type: 'genre', value: 'Jazz' });
      mockStore.results.set([makeEpisode('e1', 'First'), makeEpisode('e2', 'Second')]);
      fixture.detectChanges();
      await fixture.whenStable();

      const host = fixture.nativeElement as HTMLElement;
      const scroller = host.querySelector('app-episode-scroller');
      expect(scroller).toBeTruthy();
      expect(scroller?.getAttribute('aria-label')).toBeNull();
      expect(host.querySelector('h2')?.textContent).toContain('Jazz');
      expect(host.textContent).toContain('First');
      expect(host.textContent).toContain('Second');
    });

    it('should not render the results section when no search option is selected', () => {
      const host = fixture.nativeElement as HTMLElement;
      expect(host.querySelector('app-episode-scroller')).toBeNull();
      expect(host.querySelector('app-episode-scroller-skeleton')).toBeNull();
    });
  });
});
