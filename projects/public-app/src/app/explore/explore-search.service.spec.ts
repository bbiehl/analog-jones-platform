import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { EpisodeService } from '@aj/core';
import { GenreService } from '@aj/core';
import { TagService } from '@aj/core';
import { EpisodeGenreService } from '@aj/core';
import { EpisodeTagService } from '@aj/core';
import { Episode } from '@aj/core';
import { Genre } from '@aj/core';
import { Tag } from '@aj/core';
import { TransferCacheService } from '@aj/core';
import { ExploreSearchService } from './explore-search.service';

describe('ExploreSearchService', () => {
  let service: ExploreSearchService;

  const makeEpisode = (id: string, title: string): Episode => ({
    id,
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(0),
    intelligence: null,
    isVisible: true,
    links: {},
    posterUrl: null,
    title,
  });

  const episodes: Episode[] = [makeEpisode('e1', 'Hello World'), makeEpisode('e2', 'Second')];
  const genres: Genre[] = [
    { id: 'g1', name: 'Rock', slug: 'rock' },
    { id: 'g2', name: 'Jazz', slug: 'jazz' },
  ];
  const tags: Tag[] = [
    { id: 't1', name: 'Live', slug: 'live' },
    { id: 't2', name: 'Studio', slug: 'studio' },
  ];

  let mockEpisodeService: {
    getVisibleEpisodes: ReturnType<typeof vi.fn>;
    getEpisodeById: ReturnType<typeof vi.fn>;
  };
  let mockGenreService: { getAllGenres: ReturnType<typeof vi.fn> };
  let mockTagService: { getAllTags: ReturnType<typeof vi.fn> };
  let mockEpisodeGenreService: { getEpisodesByGenreId: ReturnType<typeof vi.fn> };
  let mockEpisodeTagService: { getEpisodesByTagId: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockEpisodeService = {
      getVisibleEpisodes: vi.fn().mockResolvedValue(episodes),
      getEpisodeById: vi.fn(),
    };
    mockGenreService = { getAllGenres: vi.fn().mockResolvedValue(genres) };
    mockTagService = { getAllTags: vi.fn().mockResolvedValue(tags) };
    mockEpisodeGenreService = { getEpisodesByGenreId: vi.fn().mockResolvedValue([]) };
    mockEpisodeTagService = { getEpisodesByTagId: vi.fn().mockResolvedValue([]) };

    const passThroughCache: Pick<TransferCacheService, 'cached'> = {
      cached: <T>(_key: string, fetcher: () => Promise<T>) => fetcher(),
    };

    TestBed.configureTestingModule({
      providers: [
        ExploreSearchService,
        { provide: EpisodeService, useValue: mockEpisodeService },
        { provide: GenreService, useValue: mockGenreService },
        { provide: TagService, useValue: mockTagService },
        { provide: EpisodeGenreService, useValue: mockEpisodeGenreService },
        { provide: EpisodeTagService, useValue: mockEpisodeTagService },
        { provide: TransferCacheService, useValue: passThroughCache },
      ],
    });
    service = TestBed.inject(ExploreSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAutoCompleteOptions', () => {
    it('should combine episodes, genres, and tags into typed options', async () => {
      const options = await service.getAutoCompleteOptions();

      expect(options).toEqual([
        { type: 'episode', value: 'Hello World', id: 'e1' },
        { type: 'episode', value: 'Second', id: 'e2' },
        { type: 'genre', value: 'Rock', id: 'g1' },
        { type: 'genre', value: 'Jazz', id: 'g2' },
        { type: 'tag', value: 'Live', id: 't1' },
        { type: 'tag', value: 'Studio', id: 't2' },
      ]);
    });

    it('should call all three sources in parallel', async () => {
      await service.getAutoCompleteOptions();

      expect(mockEpisodeService.getVisibleEpisodes).toHaveBeenCalledTimes(1);
      expect(mockGenreService.getAllGenres).toHaveBeenCalledTimes(1);
      expect(mockTagService.getAllTags).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when all sources are empty', async () => {
      mockEpisodeService.getVisibleEpisodes.mockResolvedValueOnce([]);
      mockGenreService.getAllGenres.mockResolvedValueOnce([]);
      mockTagService.getAllTags.mockResolvedValueOnce([]);

      const options = await service.getAutoCompleteOptions();

      expect(options).toEqual([]);
    });
  });

  describe('searchEpisodes', () => {
    it('should look up episode by id when type is episode', async () => {
      mockEpisodeService.getEpisodeById.mockResolvedValueOnce(episodes[0]);

      const result = await service.searchEpisodes({
        type: 'episode',
        value: 'Hello World',
        id: 'e1',
      });

      expect(mockEpisodeService.getEpisodeById).toHaveBeenCalledWith('e1');
      expect(result).toEqual([episodes[0]]);
    });

    it('should return empty array when episode option has no id', async () => {
      const result = await service.searchEpisodes({ type: 'episode', value: 'Hello World' });

      expect(mockEpisodeService.getEpisodeById).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when episode lookup throws (not found)', async () => {
      mockEpisodeService.getEpisodeById.mockRejectedValueOnce(new Error('not found'));

      const result = await service.searchEpisodes({
        type: 'episode',
        value: 'Hello World',
        id: 'missing',
      });

      expect(result).toEqual([]);
    });

    it('should fetch episodes by genre id directly from the option', async () => {
      mockEpisodeGenreService.getEpisodesByGenreId.mockResolvedValueOnce([episodes[0]]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock', id: 'g1' });

      expect(mockGenreService.getAllGenres).not.toHaveBeenCalled();
      expect(mockEpisodeGenreService.getEpisodesByGenreId).toHaveBeenCalledWith('g1');
      expect(result).toEqual([episodes[0]]);
    });

    it('should return empty array when genre option has no id', async () => {
      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock' });

      expect(mockEpisodeGenreService.getEpisodesByGenreId).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should fetch episodes by tag id directly from the option', async () => {
      mockEpisodeTagService.getEpisodesByTagId.mockResolvedValueOnce([episodes[1]]);

      const result = await service.searchEpisodes({ type: 'tag', value: 'Live', id: 't1' });

      expect(mockTagService.getAllTags).not.toHaveBeenCalled();
      expect(mockEpisodeTagService.getEpisodesByTagId).toHaveBeenCalledWith('t1');
      expect(result).toEqual([episodes[1]]);
    });

    it('should return empty array when tag option has no id', async () => {
      const result = await service.searchEpisodes({ type: 'tag', value: 'Live' });

      expect(mockEpisodeTagService.getEpisodesByTagId).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should sort results by episodeDate descending (newest first)', async () => {
      const older = { ...makeEpisode('e1', 'Older'), episodeDate: Timestamp.fromMillis(1_000) };
      const newer = { ...makeEpisode('e2', 'Newer'), episodeDate: Timestamp.fromMillis(5_000) };
      const middle = { ...makeEpisode('e3', 'Middle'), episodeDate: Timestamp.fromMillis(3_000) };
      mockEpisodeGenreService.getEpisodesByGenreId.mockResolvedValueOnce([older, newer, middle]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock', id: 'g1' });

      expect(result.map((e) => e.id)).toEqual(['e2', 'e3', 'e1']);
    });

    it('should dedupe episodes by id', async () => {
      const dup = makeEpisode('e1', 'Hello World');
      mockEpisodeGenreService.getEpisodesByGenreId.mockResolvedValueOnce([
        episodes[0],
        dup,
        episodes[1],
      ]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock', id: 'g1' });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toEqual(['e1', 'e2']);
    });
  });
});
