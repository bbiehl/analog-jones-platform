/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';

import { EpisodeListService } from './episode-list.service';
import {
  CategoryService,
  EpisodeService,
  FIRESTORE,
  FIRESTORE_OPS,
  GenreService,
  TransferCacheService,
} from '@aj/core';
import type { Category, Episode, Genre } from '@aj/core';

function ep(id: string, millis: number, isVisible = true): Episode {
  return {
    id,
    createdAt: Timestamp.fromMillis(0),
    episodeDate: Timestamp.fromMillis(millis),
    intelligence: null,
    isVisible,
    links: {},
    posterUrl: null,
    title: id,
  };
}

type GenreJunction = { genreId: string; episodeId: string };
type CategoryJunction = { categoryId: string; episodeId: string };

function snap<T>(rows: T[]) {
  return {
    docs: rows.map((data) => ({ data: () => data })),
  };
}

describe('EpisodeListService', () => {
  let service: EpisodeListService;
  let mockGenreService: { getAllGenres: ReturnType<typeof vi.fn> };
  let mockCategoryService: { getAllCategories: ReturnType<typeof vi.fn> };
  let mockEpisodeService: { getVisibleEpisodes: ReturnType<typeof vi.fn> };
  let mockOps: {
    collection: ReturnType<typeof vi.fn>;
    getDocs: ReturnType<typeof vi.fn>;
  };
  let mockTransferCache: { cached: ReturnType<typeof vi.fn> };
  let genreJunctionRows: GenreJunction[];
  let categoryJunctionRows: CategoryJunction[];

  beforeEach(() => {
    mockGenreService = { getAllGenres: vi.fn().mockResolvedValue([]) };
    mockCategoryService = { getAllCategories: vi.fn().mockResolvedValue([]) };
    mockEpisodeService = { getVisibleEpisodes: vi.fn().mockResolvedValue([]) };
    genreJunctionRows = [];
    categoryJunctionRows = [];
    mockOps = {
      collection: vi.fn((_db: unknown, name: string) => `${name}-ref`),
      getDocs: vi.fn((ref: string) => {
        if (ref === 'episodeCategories-ref') return Promise.resolve(snap(categoryJunctionRows));
        return Promise.resolve(snap(genreJunctionRows));
      }),
    };
    mockTransferCache = {
      cached: vi.fn((_key: string, fetcher: () => Promise<unknown>) => fetcher()),
    };

    TestBed.configureTestingModule({
      providers: [
        EpisodeListService,
        { provide: GenreService, useValue: mockGenreService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: EpisodeService, useValue: mockEpisodeService },
        { provide: FIRESTORE, useValue: {} },
        { provide: FIRESTORE_OPS, useValue: mockOps },
        { provide: TransferCacheService, useValue: mockTransferCache },
      ],
    });

    service = TestBed.inject(EpisodeListService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of EpisodeListService', () => {
      expect(service).toBeInstanceOf(EpisodeListService);
    });
  });

  describe('getEpisodesByGenre', () => {
    it('should return empty object when no genres exist', async () => {
      mockGenreService.getAllGenres.mockResolvedValue([]);

      const result = await service.getEpisodesByGenre();

      expect(result).toEqual({});
    });

    it('should group episodes by genre name keyed in genre order', async () => {
      const genres: Genre[] = [
        { id: 'g1', name: 'Ambient', slug: 'ambient' },
        { id: 'g2', name: 'Rock', slug: 'rock' },
      ];
      mockGenreService.getAllGenres.mockResolvedValue(genres);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([
        ep('a', 100),
        ep('b', 200),
      ]);
      genreJunctionRows = [
        { genreId: 'g1', episodeId: 'a' },
        { genreId: 'g2', episodeId: 'b' },
      ];

      const result = await service.getEpisodesByGenre();

      expect(Object.keys(result)).toEqual(['Ambient', 'Rock']);
      expect(result['Ambient'][0].id).toBe('a');
      expect(result['Rock'][0].id).toBe('b');
    });

    it('should sort each bucket by episodeDate descending', async () => {
      mockGenreService.getAllGenres.mockResolvedValue([
        { id: 'g1', name: 'Rock', slug: 'rock' },
      ]);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([
        ep('old', 100),
        ep('new', 500),
        ep('mid', 300),
      ]);
      genreJunctionRows = [
        { genreId: 'g1', episodeId: 'old' },
        { genreId: 'g1', episodeId: 'new' },
        { genreId: 'g1', episodeId: 'mid' },
      ];

      const result = await service.getEpisodesByGenre();

      expect(result['Rock'].map((e) => e.id)).toEqual(['new', 'mid', 'old']);
    });

    it('should skip genres with zero visible episodes', async () => {
      mockGenreService.getAllGenres.mockResolvedValue([
        { id: 'g1', name: 'Empty', slug: 'empty' },
        { id: 'g2', name: 'Rock', slug: 'rock' },
      ]);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([ep('a', 100)]);
      genreJunctionRows = [{ genreId: 'g2', episodeId: 'a' }];

      const result = await service.getEpisodesByGenre();

      expect(Object.keys(result)).toEqual(['Rock']);
    });

    it('should skip genres missing an id', async () => {
      mockGenreService.getAllGenres.mockResolvedValue([
        { name: 'Orphan', slug: 'orphan' },
        { id: 'g2', name: 'Rock', slug: 'rock' },
      ] as Genre[]);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([ep('a', 100)]);
      genreJunctionRows = [{ genreId: 'g2', episodeId: 'a' }];

      const result = await service.getEpisodesByGenre();

      expect(Object.keys(result)).toEqual(['Rock']);
    });

    it('should propagate errors from the genre service', async () => {
      mockGenreService.getAllGenres.mockRejectedValue(new Error('boom'));

      await expect(service.getEpisodesByGenre()).rejects.toThrow('boom');
    });
  });

  describe('getEpisodesByFeaturedCategory', () => {
    const featured: Category[] = [
      { id: 'c1', name: 'Nerd News', slug: 'nerd-news' },
      { id: 'c2', name: 'Interviews', slug: 'interviews' },
    ];

    it('should return empty object when no featured categories exist', async () => {
      mockCategoryService.getAllCategories.mockResolvedValue([]);

      const result = await service.getEpisodesByFeaturedCategory();

      expect(result).toEqual({});
    });

    it('should return rows keyed by category name in FEATURED_CATEGORY_SLUGS order', async () => {
      mockCategoryService.getAllCategories.mockResolvedValue([
        // Intentionally ordered opposite to the featured-slug order.
        featured[1],
        featured[0],
        { id: 'c3', name: 'Other', slug: 'other' },
      ]);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([
        ep('a', 100),
        ep('b', 200),
        ep('c', 300),
      ]);
      categoryJunctionRows = [
        { categoryId: 'c1', episodeId: 'a' },
        { categoryId: 'c2', episodeId: 'b' },
        { categoryId: 'c3', episodeId: 'c' },
      ];

      const result = await service.getEpisodesByFeaturedCategory();

      expect(Object.keys(result)).toEqual(['Nerd News', 'Interviews']);
      expect(result['Nerd News'][0].id).toBe('a');
      expect(result['Interviews'][0].id).toBe('b');
    });

    it('should sort each category bucket by episodeDate descending', async () => {
      mockCategoryService.getAllCategories.mockResolvedValue([featured[0]]);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([
        ep('old', 100),
        ep('new', 500),
        ep('mid', 300),
      ]);
      categoryJunctionRows = [
        { categoryId: 'c1', episodeId: 'old' },
        { categoryId: 'c1', episodeId: 'new' },
        { categoryId: 'c1', episodeId: 'mid' },
      ];

      const result = await service.getEpisodesByFeaturedCategory();

      expect(result['Nerd News'].map((e) => e.id)).toEqual(['new', 'mid', 'old']);
    });

    it('should skip featured categories with zero visible episodes', async () => {
      mockCategoryService.getAllCategories.mockResolvedValue(featured);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([ep('a', 100)]);
      categoryJunctionRows = [{ categoryId: 'c2', episodeId: 'a' }];

      const result = await service.getEpisodesByFeaturedCategory();

      expect(Object.keys(result)).toEqual(['Interviews']);
    });

    it('should ignore non-featured categories', async () => {
      mockCategoryService.getAllCategories.mockResolvedValue([
        { id: 'c3', name: 'Other', slug: 'other' },
      ]);
      mockEpisodeService.getVisibleEpisodes.mockResolvedValue([ep('a', 100)]);
      categoryJunctionRows = [{ categoryId: 'c3', episodeId: 'a' }];

      const result = await service.getEpisodesByFeaturedCategory();

      expect(result).toEqual({});
    });
  });
});
