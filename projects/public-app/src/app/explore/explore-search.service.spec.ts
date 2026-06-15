import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { CategoryService } from '@aj/core';
import { EpisodeService } from '@aj/core';
import { GenreService } from '@aj/core';
import { TagService } from '@aj/core';
import { Category } from '@aj/core';
import { Episode } from '@aj/core';
import { Genre } from '@aj/core';
import { Tag } from '@aj/core';
import { TransferCacheService } from '@aj/core';
import { ExploreSearchService } from './explore-search.service';

describe('ExploreSearchService', () => {
  let service: ExploreSearchService;

  const makeEpisode = (
    id: string,
    title: string,
    opts: { categories?: Category[]; genres?: Genre[]; tags?: Tag[]; ms?: number } = {},
  ): Episode => ({
    id,
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(opts.ms ?? 0),
    intelligence: null,
    isVisible: true,
    links: {},
    title,
    categories: opts.categories ?? [],
    genres: opts.genres ?? [],
    tags: opts.tags ?? [],
  });

  const episodes: Episode[] = [makeEpisode('e1', 'Hello World'), makeEpisode('e2', 'Second')];
  // Two allowlisted categories plus one ("Misc") that must be filtered out.
  const categories: Category[] = [
    { id: 'c1', name: 'Nerd News', slug: 'nerd-news' },
    { id: 'c2', name: 'Interviews', slug: 'interviews' },
    { id: 'c3', name: 'Misc', slug: 'misc' },
  ];
  const genres: Genre[] = [
    { id: 'g1', name: 'Rock', slug: 'rock' },
    { id: 'g2', name: 'Jazz', slug: 'jazz' },
  ];
  const tags: Tag[] = [
    { id: 't1', name: 'Live', slug: 'live' },
    { id: 't2', name: 'Studio', slug: 'studio' },
  ];

  let mockEpisodeService: {
    getVisibleEpisodeList: ReturnType<typeof vi.fn>;
  };
  let mockCategoryService: { getAllCategories: ReturnType<typeof vi.fn> };
  let mockGenreService: { getAllGenres: ReturnType<typeof vi.fn> };
  let mockTagService: { getAllTags: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockEpisodeService = {
      getVisibleEpisodeList: vi.fn().mockResolvedValue(episodes),
    };
    mockCategoryService = { getAllCategories: vi.fn().mockResolvedValue(categories) };
    mockGenreService = { getAllGenres: vi.fn().mockResolvedValue(genres) };
    mockTagService = { getAllTags: vi.fn().mockResolvedValue(tags) };

    const passThroughCache: Pick<TransferCacheService, 'cached'> = {
      cached: <T>(_key: string, fetcher: () => Promise<T>) => fetcher(),
    };

    TestBed.configureTestingModule({
      providers: [
        ExploreSearchService,
        { provide: EpisodeService, useValue: mockEpisodeService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: GenreService, useValue: mockGenreService },
        { provide: TagService, useValue: mockTagService },
        { provide: TransferCacheService, useValue: passThroughCache },
      ],
    });
    service = TestBed.inject(ExploreSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAutoCompleteOptions', () => {
    it('should combine allowed categories, genres, and tags into typed options', async () => {
      const options = await service.getAutoCompleteOptions();

      expect(options).toEqual([
        { type: 'category', value: 'Nerd News', id: 'c1' },
        { type: 'category', value: 'Interviews', id: 'c2' },
        { type: 'genre', value: 'Rock', id: 'g1' },
        { type: 'genre', value: 'Jazz', id: 'g2' },
        { type: 'tag', value: 'Live', id: 't1' },
        { type: 'tag', value: 'Studio', id: 't2' },
      ]);
    });

    it('should expose only allowlisted categories and exclude others', async () => {
      const options = await service.getAutoCompleteOptions();

      const categoryOptions = options.filter((o) => o.type === 'category');
      expect(categoryOptions.map((o) => o.value)).toEqual(['Nerd News', 'Interviews']);
      expect(categoryOptions.some((o) => o.value === 'Misc')).toBe(false);
    });

    it('should call the three option sources in parallel without fetching episodes', async () => {
      await service.getAutoCompleteOptions();

      expect(mockEpisodeService.getVisibleEpisodeList).not.toHaveBeenCalled();
      expect(mockCategoryService.getAllCategories).toHaveBeenCalledTimes(1);
      expect(mockGenreService.getAllGenres).toHaveBeenCalledTimes(1);
      expect(mockTagService.getAllTags).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when all sources are empty', async () => {
      mockCategoryService.getAllCategories.mockResolvedValueOnce([]);
      mockGenreService.getAllGenres.mockResolvedValueOnce([]);
      mockTagService.getAllTags.mockResolvedValueOnce([]);

      const options = await service.getAutoCompleteOptions();

      expect(options).toEqual([]);
    });
  });

  describe('searchEpisodes', () => {
    it('should filter visible episodes by embedded category id', async () => {
      const match = makeEpisode('e1', 'Hello World', { categories: [categories[0]] });
      mockEpisodeService.getVisibleEpisodeList.mockResolvedValueOnce([
        match,
        makeEpisode('e2', 'Second', { categories: [categories[1]] }),
      ]);

      const result = await service.searchEpisodes({
        type: 'category',
        value: 'Nerd News',
        id: 'c1',
      });

      expect(mockEpisodeService.getVisibleEpisodeList).toHaveBeenCalled();
      expect(result.map((e) => e.id)).toEqual(['e1']);
    });

    it('should return empty array when category option has no id', async () => {
      const result = await service.searchEpisodes({ type: 'category', value: 'Nerd News' });

      expect(mockEpisodeService.getVisibleEpisodeList).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should filter visible episodes by embedded genre id', async () => {
      const match = makeEpisode('e1', 'Hello World', { genres: [genres[0]] });
      mockEpisodeService.getVisibleEpisodeList.mockResolvedValueOnce([
        match,
        makeEpisode('e2', 'Second', { genres: [genres[1]] }),
      ]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock', id: 'g1' });

      expect(mockEpisodeService.getVisibleEpisodeList).toHaveBeenCalled();
      expect(result.map((e) => e.id)).toEqual(['e1']);
    });

    it('should return empty array when genre option has no id', async () => {
      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock' });

      expect(mockEpisodeService.getVisibleEpisodeList).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should filter visible episodes by embedded tag id', async () => {
      const match = makeEpisode('e2', 'Second', { tags: [tags[0]] });
      mockEpisodeService.getVisibleEpisodeList.mockResolvedValueOnce([
        makeEpisode('e1', 'Hello World', { tags: [tags[1]] }),
        match,
      ]);

      const result = await service.searchEpisodes({ type: 'tag', value: 'Live', id: 't1' });

      expect(result.map((e) => e.id)).toEqual(['e2']);
    });

    it('should return empty array when tag option has no id', async () => {
      const result = await service.searchEpisodes({ type: 'tag', value: 'Live' });

      expect(mockEpisodeService.getVisibleEpisodeList).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should sort results by episodeDate descending (newest first)', async () => {
      mockEpisodeService.getVisibleEpisodeList.mockResolvedValueOnce([
        makeEpisode('e1', 'Older', { genres: [genres[0]], ms: 1_000 }),
        makeEpisode('e2', 'Newer', { genres: [genres[0]], ms: 5_000 }),
        makeEpisode('e3', 'Middle', { genres: [genres[0]], ms: 3_000 }),
      ]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock', id: 'g1' });

      expect(result.map((e) => e.id)).toEqual(['e2', 'e3', 'e1']);
    });
  });
});
