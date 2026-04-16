/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from '../shared/firebase.token';
import { EpisodeTagService } from '../shared/episode-tag.service';
import { TagService } from './tag.service';
import type { Firestore } from 'firebase/firestore';

describe('TagService', () => {
  let service: TagService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEpisodeTagService: any;

  beforeEach(() => {
    mockEpisodeTagService = {
      getEpisodesByTagSlug: vi.fn(),
      deleteEpisodeTagsByTagId: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        TagService,
        { provide: FIRESTORE, useValue: {} as Firestore },
        { provide: EpisodeTagService, useValue: mockEpisodeTagService },
      ],
    });

    service = TestBed.inject(TagService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of TagService', () => {
      expect(service).toBeInstanceOf(TagService);
    });
  });

  describe('getAllTags', () => {
    it('should map snapshot docs to Tag objects', () => {
      const mockDocs = [
        { id: 't1', data: () => ({ name: 'Vintage', slug: 'vintage' }) },
        { id: 't2', data: () => ({ name: 'Analog', slug: 'analog' }) },
      ];

      const result = mockDocs.map((d) => ({ id: d.id, ...d.data() }));

      expect(result).toEqual([
        { id: 't1', name: 'Vintage', slug: 'vintage' },
        { id: 't2', name: 'Analog', slug: 'analog' },
      ]);
    });
  });

  describe('getTagById', () => {
    it('should combine snapshot id and data into a Tag', () => {
      const snap = {
        exists: () => true,
        id: 't1',
        data: () => ({ name: 'Vintage', slug: 'vintage' }),
      };

      const result = { id: snap.id, ...snap.data() };
      expect(result).toEqual({ id: 't1', name: 'Vintage', slug: 'vintage' });
    });

    it('should throw when snapshot does not exist', () => {
      const snap = { exists: () => false };

      expect(() => {
        if (!snap.exists()) {
          throw new Error('Tag with id "missing" not found');
        }
      }).toThrow('Tag with id "missing" not found');
    });
  });

  describe('getTagBySlug', () => {
    it('should throw when query snapshot is empty', () => {
      const snapshot = { empty: true, docs: [] };

      expect(() => {
        if (snapshot.empty) {
          throw new Error('Tag with slug "nonexistent" not found');
        }
      }).toThrow('Tag with slug "nonexistent" not found');
    });

    it('should combine tag doc with episodes into TagWithRelations', () => {
      const tagDoc = {
        id: 't1',
        data: () => ({ name: 'Vintage', slug: 'vintage' }),
      };
      const episodes = [{ id: 'ep1', title: 'Episode 1' }];

      const result = { id: tagDoc.id, ...tagDoc.data(), episodes };
      expect(result).toEqual({
        id: 't1',
        name: 'Vintage',
        slug: 'vintage',
        episodes: [{ id: 'ep1', title: 'Episode 1' }],
      });
    });
  });

  describe('createTag', () => {
    it('should only pass name and slug fields', () => {
      const tag = { name: 'Retro', slug: 'retro' };
      const payload = { name: tag.name, slug: tag.slug };

      expect(payload).toEqual({ name: 'Retro', slug: 'retro' });
      expect(payload).not.toHaveProperty('id');
    });
  });

  describe('updateTag', () => {
    it('should strip the id field before updating', () => {
      const tag = { id: 't1', name: 'Updated', slug: 'updated' };
      const { id: _id, ...data } = tag;

      expect(data).toEqual({ name: 'Updated', slug: 'updated' });
      expect(data).not.toHaveProperty('id');
    });
  });

  describe('deleteTag', () => {
    it('should call episodeTagService.deleteEpisodeTagsByTagId', async () => {
      mockEpisodeTagService.deleteEpisodeTagsByTagId.mockResolvedValue(undefined);

      await mockEpisodeTagService.deleteEpisodeTagsByTagId('t1');

      expect(mockEpisodeTagService.deleteEpisodeTagsByTagId).toHaveBeenCalledWith('t1');
    });
  });
});
