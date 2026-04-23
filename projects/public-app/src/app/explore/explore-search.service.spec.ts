import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { EpisodeService } from '../../../../../libs/episode/episode.service';
import { GenreService } from '../../../../../libs/genre/genre.service';
import { TagService } from '../../../../../libs/tag/tag.service';
import { EpisodeGenreService } from '../../../../../libs/shared/episode-genre.service';
import { EpisodeTagService } from '../../../../../libs/shared/episode-tag.service';
import { Episode } from '../../../../../libs/episode/episode.model';
import { Genre } from '../../../../../libs/genre/genre.model';
import { Tag } from '../../../../../libs/tag/tag.model';
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
  let mockEpisodeTagService: { getEpisodesByTagSlug: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockEpisodeService = {
      getVisibleEpisodes: vi.fn().mockResolvedValue(episodes),
      getEpisodeById: vi.fn(),
    };
    mockGenreService = { getAllGenres: vi.fn().mockResolvedValue(genres) };
    mockTagService = { getAllTags: vi.fn().mockResolvedValue(tags) };
    mockEpisodeGenreService = { getEpisodesByGenreId: vi.fn().mockResolvedValue([]) };
    mockEpisodeTagService = { getEpisodesByTagSlug: vi.fn().mockResolvedValue([]) };

    TestBed.configureTestingModule({
      providers: [
        ExploreSearchService,
        { provide: EpisodeService, useValue: mockEpisodeService },
        { provide: GenreService, useValue: mockGenreService },
        { provide: TagService, useValue: mockTagService },
        { provide: EpisodeGenreService, useValue: mockEpisodeGenreService },
        { provide: EpisodeTagService, useValue: mockEpisodeTagService },
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

    it('should look up genre by name and fetch episodes by genre id', async () => {
      mockEpisodeGenreService.getEpisodesByGenreId.mockResolvedValueOnce([episodes[0]]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock' });

      expect(mockGenreService.getAllGenres).toHaveBeenCalled();
      expect(mockEpisodeGenreService.getEpisodesByGenreId).toHaveBeenCalledWith('g1');
      expect(result).toEqual([episodes[0]]);
    });

    it('should return empty array when genre name is not found', async () => {
      const result = await service.searchEpisodes({ type: 'genre', value: 'Unknown' });

      expect(mockEpisodeGenreService.getEpisodesByGenreId).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should return empty array when matched genre has no id', async () => {
      mockGenreService.getAllGenres.mockResolvedValueOnce([{ name: 'Rock', slug: 'rock' }]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock' });

      expect(mockEpisodeGenreService.getEpisodesByGenreId).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should look up tag by name and fetch episodes by tag slug', async () => {
      mockEpisodeTagService.getEpisodesByTagSlug.mockResolvedValueOnce([episodes[1]]);

      const result = await service.searchEpisodes({ type: 'tag', value: 'Live' });

      expect(mockTagService.getAllTags).toHaveBeenCalled();
      expect(mockEpisodeTagService.getEpisodesByTagSlug).toHaveBeenCalledWith('live');
      expect(result).toEqual([episodes[1]]);
    });

    it('should return empty array when tag name is not found', async () => {
      const result = await service.searchEpisodes({ type: 'tag', value: 'Unknown' });

      expect(mockEpisodeTagService.getEpisodesByTagSlug).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should sort results by episodeDate descending (newest first)', async () => {
      const older = { ...makeEpisode('e1', 'Older'), episodeDate: Timestamp.fromMillis(1_000) };
      const newer = { ...makeEpisode('e2', 'Newer'), episodeDate: Timestamp.fromMillis(5_000) };
      const middle = { ...makeEpisode('e3', 'Middle'), episodeDate: Timestamp.fromMillis(3_000) };
      mockEpisodeGenreService.getEpisodesByGenreId.mockResolvedValueOnce([older, newer, middle]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock' });

      expect(result.map((e) => e.id)).toEqual(['e2', 'e3', 'e1']);
    });

    it('should dedupe episodes by id', async () => {
      const dup = makeEpisode('e1', 'Hello World');
      mockEpisodeGenreService.getEpisodesByGenreId.mockResolvedValueOnce([
        episodes[0],
        dup,
        episodes[1],
      ]);

      const result = await service.searchEpisodes({ type: 'genre', value: 'Rock' });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toEqual(['e1', 'e2']);
    });
  });
});
