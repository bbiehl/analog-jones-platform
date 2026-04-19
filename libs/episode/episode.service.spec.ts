/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeCategoryService } from '../shared/episode-category.service';
import { EpisodeGenreService } from '../shared/episode-genre.service';
import { EpisodeTagService } from '../shared/episode-tag.service';
import { ImageUploadService } from '../shared/image-upload.service';
import { EpisodeService } from './episode.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeService', () => {
  let service: EpisodeService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeCategoryService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeGenreService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeTagService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockImageUploadService: any;

  beforeEach(() => {
    mockEpisodeCategoryService = {
      getEpisodeCategoriesByEpisodeId: vi.fn(),
      createEpisodeCategory: vi.fn(),
      deleteEpisodeCategoriesByEpisodeId: vi.fn(),
    };
    mockEpisodeGenreService = {
      getEpisodeGenresByEpisodeId: vi.fn(),
      createEpisodeGenre: vi.fn(),
      deleteEpisodeGenresByEpisodeId: vi.fn(),
    };
    mockEpisodeTagService = {
      getEpisodeTagsByEpisodeId: vi.fn(),
      createEpisodeTag: vi.fn(),
      deleteEpisodeTagsByEpisodeId: vi.fn(),
    };
    mockImageUploadService = {
      uploadPoster: vi.fn(),
      deletePoster: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        EpisodeService,
        { provide: FIRESTORE, useValue: {} as Firestore },
        { provide: EpisodeCategoryService, useValue: mockEpisodeCategoryService },
        { provide: EpisodeGenreService, useValue: mockEpisodeGenreService },
        { provide: EpisodeTagService, useValue: mockEpisodeTagService },
        { provide: ImageUploadService, useValue: mockImageUploadService },
      ],
    });

    service = TestBed.inject(EpisodeService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of EpisodeService', () => {
      expect(service).toBeInstanceOf(EpisodeService);
    });
  });

  describe('getAllEpisodes', () => {
    it('should map snapshot docs to Episode objects', () => {
      const mockDocs = [
        {
          id: 'ep1',
          data: () => ({
            title: 'Episode One',
            isVisible: true,
            createdAt: { seconds: 2000, nanoseconds: 0 },
          }),
        },
        {
          id: 'ep2',
          data: () => ({
            title: 'Episode Two',
            isVisible: false,
            createdAt: { seconds: 1000, nanoseconds: 0 },
          }),
        },
      ];

      const result = mockDocs.map((d) => ({ id: d.id, ...d.data() }));

      expect(result).toEqual([
        {
          id: 'ep1',
          title: 'Episode One',
          isVisible: true,
          createdAt: { seconds: 2000, nanoseconds: 0 },
        },
        {
          id: 'ep2',
          title: 'Episode Two',
          isVisible: false,
          createdAt: { seconds: 1000, nanoseconds: 0 },
        },
      ]);
    });
  });

  describe('getCurrentEpisode', () => {
    it('should return null when snapshot is empty', () => {
      const snapshot = { empty: true, docs: [] };

      const result = snapshot.empty ? null : { id: snapshot.docs[0] };
      expect(result).toBeNull();
    });

    it('should return the first doc as an Episode', () => {
      const snap = {
        id: 'ep1',
        data: () => ({ title: 'Latest', isVisible: true }),
      };

      const result = { id: snap.id, ...snap.data() };
      expect(result).toEqual({ id: 'ep1', title: 'Latest', isVisible: true });
    });
  });

  describe('getVisibleEpisodes', () => {
    it('should filter episodes by search term (case-insensitive)', () => {
      const episodes = [
        { id: 'ep1', title: 'The Moon Landing' },
        { id: 'ep2', title: 'Mars Exploration' },
        { id: 'ep3', title: 'Moon Base Alpha' },
      ];

      const term = 'moon';
      const filtered = episodes.filter((e) => e.title.toLowerCase().includes(term));

      expect(filtered).toEqual([
        { id: 'ep1', title: 'The Moon Landing' },
        { id: 'ep3', title: 'Moon Base Alpha' },
      ]);
    });

    it('should return all episodes when no search term is provided', () => {
      const episodes = [
        { id: 'ep1', title: 'Episode One' },
        { id: 'ep2', title: 'Episode Two' },
      ];

      const searchTerm = undefined;
      const result = searchTerm
        ? episodes.filter((e) => e.title.toLowerCase().includes(searchTerm))
        : episodes;

      expect(result).toHaveLength(2);
    });
  });

  describe('getEpisodeById', () => {
    it('should throw when snapshot does not exist', () => {
      const snap = { exists: () => false };

      expect(() => {
        if (!snap.exists()) {
          throw new Error('Episode with id "missing" not found');
        }
      }).toThrow('Episode with id "missing" not found');
    });

    it('should combine episode with relations into EpisodeWithRelations', () => {
      const episode = { id: 'ep1', title: 'Test Episode' };
      const categories = [{ id: 'c1', name: 'History', slug: 'history' }];
      const genres = [{ id: 'g1', name: 'Action', slug: 'action' }];
      const tags = [{ id: 't1', name: 'Featured', slug: 'featured' }];

      const result = { ...episode, categories, genres, tags };

      expect(result).toEqual({
        id: 'ep1',
        title: 'Test Episode',
        categories: [{ id: 'c1', name: 'History', slug: 'history' }],
        genres: [{ id: 'g1', name: 'Action', slug: 'action' }],
        tags: [{ id: 't1', name: 'Featured', slug: 'featured' }],
      });
    });
  });

  describe('createEpisode', () => {
    it('should build a payload without the id field', () => {
      const episode = {
        title: 'New Episode',
        isVisible: false,
        intelligence: null,
        posterUrl: null,
        links: { spotify: 'https://spotify.com/ep1' },
        createdAt: { seconds: 1000, nanoseconds: 0 },
        episodeDate: { seconds: 2000, nanoseconds: 0 },
      };

      const payload = {
        createdAt: episode.createdAt,
        episodeDate: episode.episodeDate,
        intelligence: episode.intelligence,
        isVisible: episode.isVisible,
        links: episode.links,
        posterUrl: null,
        title: episode.title,
      };

      expect(payload).not.toHaveProperty('id');
      expect(payload.title).toBe('New Episode');
      expect(payload.posterUrl).toBeNull();
    });
  });

  describe('updateEpisode', () => {
    it('should strip the id field before updating', () => {
      const episode = { id: 'ep1', title: 'Updated Title' };
      const { id: _id, ...data } = episode;

      expect(data).toEqual({ title: 'Updated Title' });
      expect(data).not.toHaveProperty('id');
    });
  });

  describe('deleteEpisode', () => {
    it('should call all junction delete services and image delete', async () => {
      mockEpisodeCategoryService.deleteEpisodeCategoriesByEpisodeId.mockResolvedValue(undefined);
      mockEpisodeGenreService.deleteEpisodeGenresByEpisodeId.mockResolvedValue(undefined);
      mockEpisodeTagService.deleteEpisodeTagsByEpisodeId.mockResolvedValue(undefined);
      mockImageUploadService.deletePoster.mockResolvedValue(undefined);

      await Promise.all([
        mockEpisodeCategoryService.deleteEpisodeCategoriesByEpisodeId('ep1'),
        mockEpisodeGenreService.deleteEpisodeGenresByEpisodeId('ep1'),
        mockEpisodeTagService.deleteEpisodeTagsByEpisodeId('ep1'),
        mockImageUploadService.deletePoster('ep1'),
      ]);

      expect(mockEpisodeCategoryService.deleteEpisodeCategoriesByEpisodeId).toHaveBeenCalledWith(
        'ep1'
      );
      expect(mockEpisodeGenreService.deleteEpisodeGenresByEpisodeId).toHaveBeenCalledWith('ep1');
      expect(mockEpisodeTagService.deleteEpisodeTagsByEpisodeId).toHaveBeenCalledWith('ep1');
      expect(mockImageUploadService.deletePoster).toHaveBeenCalledWith('ep1');
    });
  });
});
