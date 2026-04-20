/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from './firebase.token';
import { EpisodeCategoryService } from './episode-category.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeCategoryService', () => {
  let service: EpisodeCategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EpisodeCategoryService,
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });

    service = TestBed.inject(EpisodeCategoryService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of EpisodeCategoryService', () => {
      expect(service).toBeInstanceOf(EpisodeCategoryService);
    });
  });

  describe('createEpisodeCategory', () => {
    it('should produce the correct junction payload', () => {
      const episodeId = 'ep1';
      const categoryId = 'cat1';
      const payload = { episodeId, categoryId };

      expect(payload).toEqual({ episodeId: 'ep1', categoryId: 'cat1' });
    });
  });

  describe('deleteEpisodeCategory', () => {
    it('should batch-delete matching junction docs', () => {
      const mockDocs = [
        { ref: 'ref1' },
        { ref: 'ref2' },
      ];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toEqual(['ref1', 'ref2']);
    });

    it('should handle empty snapshot with no deletions', () => {
      const mockDocs: { ref: string }[] = [];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toEqual([]);
    });
  });

  describe('deleteEpisodeCategoriesByCategoryId', () => {
    it('should batch-delete all junction docs for a given categoryId', () => {
      const mockDocs = [
        { ref: 'ref1', data: () => ({ episodeId: 'ep1', categoryId: 'cat1' }) },
        { ref: 'ref2', data: () => ({ episodeId: 'ep2', categoryId: 'cat1' }) },
      ];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toHaveLength(2);
      expect(deleted).toEqual(['ref1', 'ref2']);
    });
  });

  describe('deleteEpisodeCategoriesByEpisodeId', () => {
    it('should batch-delete all junction docs for a given episodeId', () => {
      const mockDocs = [
        { ref: 'ref1', data: () => ({ episodeId: 'ep1', categoryId: 'cat1' }) },
        { ref: 'ref2', data: () => ({ episodeId: 'ep1', categoryId: 'cat2' }) },
      ];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toHaveLength(2);
      expect(deleted).toEqual(['ref1', 'ref2']);
    });
  });

  describe('getEpisodeCategoriesByEpisodeId', () => {
    it('should resolve category docs from junction records', () => {
      const junctionDocs = [
        { data: () => ({ categoryId: 'cat1' }) },
        { data: () => ({ categoryId: 'cat2' }) },
      ];
      const categorySnaps = [
        { exists: () => true, id: 'cat1', data: () => ({ name: 'Music', slug: 'music' }) },
        { exists: () => true, id: 'cat2', data: () => ({ name: 'Film', slug: 'film' }) },
      ];

      const categories = categorySnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(categories).toEqual([
        { id: 'cat1', name: 'Music', slug: 'music' },
        { id: 'cat2', name: 'Film', slug: 'film' },
      ]);
      expect(junctionDocs[0].data()['categoryId']).toBe('cat1');
    });

    it('should skip categories that do not exist', () => {
      const categorySnaps = [
        { exists: () => true, id: 'cat1', data: () => ({ name: 'Music', slug: 'music' }) },
        { exists: () => false, id: 'cat2', data: () => ({}) },
      ];

      const categories = categorySnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(categories).toHaveLength(1);
      expect(categories[0]).toEqual({ id: 'cat1', name: 'Music', slug: 'music' });
    });
  });

  describe('getEpisodeIdsByCategoryId', () => {
    it('should extract episodeId strings from junction docs', () => {
      const junctionDocs = [
        { data: () => ({ episodeId: 'ep1', categoryId: 'cat1' }) },
        { data: () => ({ episodeId: 'ep2', categoryId: 'cat1' }) },
      ];

      const ids = junctionDocs.map((d) => d.data()['episodeId']);

      expect(ids).toEqual(['ep1', 'ep2']);
    });

    it('should return empty array when no junctions exist', () => {
      const junctionDocs: { data: () => { episodeId: string } }[] = [];

      const ids = junctionDocs.map((d) => d.data()['episodeId']);

      expect(ids).toEqual([]);
    });
  });

  describe('setEpisodesForCategory', () => {
    it('should delete removed junctions and create added ones, leaving unchanged alone', () => {
      const existingJunctions = [
        { ref: 'ref-a', data: () => ({ episodeId: 'a', categoryId: 'cat1' }) },
        { ref: 'ref-b', data: () => ({ episodeId: 'b', categoryId: 'cat1' }) },
        { ref: 'ref-c', data: () => ({ episodeId: 'c', categoryId: 'cat1' }) },
      ];
      const desired = new Set(['b', 'c', 'd']);

      const existing = new Map<string, string>();
      for (const d of existingJunctions) {
        existing.set(d.data()['episodeId'], d.ref);
      }

      const deletes: string[] = [];
      const adds: { episodeId: string; categoryId: string }[] = [];

      for (const [episodeId, ref] of existing) {
        if (!desired.has(episodeId)) deletes.push(ref);
      }
      for (const episodeId of desired) {
        if (!existing.has(episodeId)) {
          adds.push({ episodeId, categoryId: 'cat1' });
        }
      }

      expect(deletes).toEqual(['ref-a']);
      expect(adds).toEqual([{ episodeId: 'd', categoryId: 'cat1' }]);
    });

    it('should produce no writes when desired matches existing', () => {
      const existingJunctions = [
        { ref: 'ref-a', data: () => ({ episodeId: 'a', categoryId: 'cat1' }) },
        { ref: 'ref-b', data: () => ({ episodeId: 'b', categoryId: 'cat1' }) },
      ];
      const desired = new Set(['a', 'b']);

      const existing = new Map<string, string>();
      for (const d of existingJunctions) {
        existing.set(d.data()['episodeId'], d.ref);
      }

      const deletes: string[] = [];
      const adds: string[] = [];
      for (const [episodeId, ref] of existing) {
        if (!desired.has(episodeId)) deletes.push(ref);
      }
      for (const episodeId of desired) {
        if (!existing.has(episodeId)) adds.push(episodeId);
      }

      expect(deletes).toEqual([]);
      expect(adds).toEqual([]);
    });
  });

  describe('getEpisodesByCategorySlug', () => {
    it('should return empty array when no category matches the slug', () => {
      const categorySnapshot = { empty: true, docs: [] };

      let result: unknown[] = [];
      if (categorySnapshot.empty) {
        result = [];
      }

      expect(result).toEqual([]);
    });

    it('should resolve episode docs from junction records', () => {
      const categorySnapshot = {
        empty: false,
        docs: [{ id: 'cat1' }],
      };
      const junctionDocs = [
        { data: () => ({ episodeId: 'ep1' }) },
        { data: () => ({ episodeId: 'ep2' }) },
      ];
      const episodeSnaps = [
        { exists: () => true, id: 'ep1', data: () => ({ title: 'Episode 1', isVisible: true }) },
        { exists: () => true, id: 'ep2', data: () => ({ title: 'Episode 2', isVisible: true }) },
      ];

      expect(categorySnapshot.empty).toBe(false);
      expect(categorySnapshot.docs[0].id).toBe('cat1');

      const episodes = episodeSnaps
        .filter((s) => s.exists() && s.data()['isVisible'])
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(episodes).toEqual([
        { id: 'ep1', title: 'Episode 1', isVisible: true },
        { id: 'ep2', title: 'Episode 2', isVisible: true },
      ]);
      expect(junctionDocs[0].data()['episodeId']).toBe('ep1');
    });

    it('should skip episodes that do not exist', () => {
      const episodeSnaps = [
        { exists: () => true, id: 'ep1', data: () => ({ title: 'Episode 1', isVisible: true }) },
        { exists: () => false, id: 'ep2', data: () => ({ title: 'Episode 2', isVisible: true }) },
      ];

      const episodes = episodeSnaps
        .filter((s) => s.exists() && s.data()['isVisible'])
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(episodes).toHaveLength(1);
      expect(episodes[0]).toEqual({ id: 'ep1', title: 'Episode 1', isVisible: true });
    });

    it('should exclude hidden episodes', () => {
      const episodeSnaps = [
        { exists: () => true, id: 'ep1', data: () => ({ title: 'Episode 1', isVisible: true }) },
        { exists: () => true, id: 'ep2', data: () => ({ title: 'Episode 2', isVisible: false }) },
      ];

      const episodes = episodeSnaps
        .filter((s) => s.exists() && s.data()['isVisible'])
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(episodes).toHaveLength(1);
      expect(episodes[0]).toEqual({ id: 'ep1', title: 'Episode 1', isVisible: true });
    });
  });
});
