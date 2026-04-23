import { TestBed } from '@angular/core/testing';
import { ExploreSearchService } from './explore-search.service';
import { ExploreSearchStore } from './explore-search.store';
import { SearchAutoCompleteOption } from './explore.model';
import { Episode } from '../../../../../libs/episode/episode.model';
import { Timestamp } from 'firebase/firestore';

describe('ExploreSearchStore', () => {
  let store: InstanceType<typeof ExploreSearchStore>;

  const mockOptions: SearchAutoCompleteOption[] = [
    { type: 'episode', value: 'Hello World' },
    { type: 'genre', value: 'Rock' },
    { type: 'tag', value: 'Live' },
  ];

  const mockEpisodes: Episode[] = [
    {
      id: 'e1',
      createdAt: Timestamp.fromMillis(0),
      episodeDate: Timestamp.fromMillis(0),
      intelligence: null,
      isVisible: true,
      links: {},
      posterUrl: null,
      title: 'Hello World',
    },
  ];

  const mockExploreSearchService = {
    getAutoCompleteOptions: vi.fn().mockResolvedValue(mockOptions),
    searchEpisodes: vi.fn().mockResolvedValue(mockEpisodes),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExploreSearchStore,
        { provide: ExploreSearchService, useValue: mockExploreSearchService },
      ],
    });
    store = TestBed.inject(ExploreSearchStore);
    vi.clearAllMocks();
    mockExploreSearchService.getAutoCompleteOptions.mockResolvedValue(mockOptions);
    mockExploreSearchService.searchEpisodes.mockResolvedValue(mockEpisodes);
  });

  it('should have correct initial state', () => {
    expect(store.autoCompleteOptions()).toEqual([]);
    expect(store.selectedSearchOption()).toBeNull();
    expect(store.results()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should run a search via ExploreSearchService and populate results', async () => {
    await store.selectSearchOption(mockOptions[0]);

    expect(mockExploreSearchService.searchEpisodes).toHaveBeenCalledWith(mockOptions[0]);
    expect(store.selectedSearchOption()).toEqual(mockOptions[0]);
    expect(store.results()).toEqual(mockEpisodes);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should toggle isLoading around the search call', async () => {
    let resolveFn!: (eps: Episode[]) => void;
    mockExploreSearchService.searchEpisodes.mockReturnValueOnce(
      new Promise<Episode[]>((resolve) => {
        resolveFn = resolve;
      })
    );

    const pending = store.selectSearchOption(mockOptions[0]);
    await Promise.resolve();
    expect(store.isLoading()).toBe(true);

    resolveFn(mockEpisodes);
    await pending;
    expect(store.isLoading()).toBe(false);
  });

  it('should set error and clear isLoading on failure', async () => {
    mockExploreSearchService.searchEpisodes.mockRejectedValueOnce(new Error('boom'));

    await store.selectSearchOption(mockOptions[0]);

    expect(store.error()).toBe('boom');
    expect(store.isLoading()).toBe(false);
  });

  it('should load autocomplete options', async () => {
    await store.loadAutoCompleteOptions();

    expect(mockExploreSearchService.getAutoCompleteOptions).toHaveBeenCalled();
    expect(store.autoCompleteOptions()).toEqual(mockOptions);
    expect(store.isLoading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should set error when autocomplete options fail to load', async () => {
    mockExploreSearchService.getAutoCompleteOptions.mockRejectedValueOnce(new Error('nope'));

    await store.loadAutoCompleteOptions();

    expect(store.autoCompleteOptions()).toEqual([]);
    expect(store.error()).toBe('nope');
    expect(store.isLoading()).toBe(false);
  });
});
