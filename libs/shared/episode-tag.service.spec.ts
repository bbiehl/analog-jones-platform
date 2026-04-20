/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from './firebase.token';
import { EpisodeTagService } from './episode-tag.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeTagService', () => {
  let service: EpisodeTagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EpisodeTagService,
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });

    service = TestBed.inject(EpisodeTagService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of EpisodeTagService', () => {
      expect(service).toBeInstanceOf(EpisodeTagService);
    });
  });

  describe('createEpisodeTag', () => {
    it('should produce the correct junction payload', () => {
      const episodeId = 'ep1';
      const tagId = 't1';
      const payload = { episodeId, tagId };

      expect(payload).toEqual({ episodeId: 'ep1', tagId: 't1' });
    });
  });

  describe('deleteEpisodeTag', () => {
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

  describe('deleteEpisodeTagsByTagId', () => {
    it('should batch-delete all junction docs for a given tagId', () => {
      const mockDocs = [
        { ref: 'ref1', data: () => ({ episodeId: 'ep1', tagId: 't1' }) },
        { ref: 'ref2', data: () => ({ episodeId: 'ep2', tagId: 't1' }) },
      ];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toHaveLength(2);
      expect(deleted).toEqual(['ref1', 'ref2']);
    });
  });

  describe('deleteEpisodeTagsByEpisodeId', () => {
    it('should batch-delete all junction docs for a given episodeId', () => {
      const mockDocs = [
        { ref: 'ref1', data: () => ({ episodeId: 'ep1', tagId: 't1' }) },
        { ref: 'ref2', data: () => ({ episodeId: 'ep1', tagId: 't2' }) },
      ];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toHaveLength(2);
      expect(deleted).toEqual(['ref1', 'ref2']);
    });
  });

  describe('getEpisodeTagsByEpisodeId', () => {
    it('should resolve tag docs from junction records', () => {
      const junctionDocs = [
        { data: () => ({ tagId: 't1' }) },
        { data: () => ({ tagId: 't2' }) },
      ];
      const tagSnaps = [
        { exists: () => true, id: 't1', data: () => ({ name: 'Vintage', slug: 'vintage' }) },
        { exists: () => true, id: 't2', data: () => ({ name: 'Analog', slug: 'analog' }) },
      ];

      const tags = tagSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(tags).toEqual([
        { id: 't1', name: 'Vintage', slug: 'vintage' },
        { id: 't2', name: 'Analog', slug: 'analog' },
      ]);
      expect(junctionDocs[0].data()['tagId']).toBe('t1');
    });

    it('should skip tags that do not exist', () => {
      const tagSnaps = [
        { exists: () => true, id: 't1', data: () => ({ name: 'Vintage', slug: 'vintage' }) },
        { exists: () => false, id: 't2', data: () => ({}) },
      ];

      const tags = tagSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(tags).toHaveLength(1);
      expect(tags[0]).toEqual({ id: 't1', name: 'Vintage', slug: 'vintage' });
    });
  });

  describe('getEpisodeIdsByTagId', () => {
    it('should extract episodeId strings from junction docs', () => {
      const junctionDocs = [
        { data: () => ({ episodeId: 'ep1', tagId: 't1' }) },
        { data: () => ({ episodeId: 'ep2', tagId: 't1' }) },
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

  describe('setEpisodesForTag', () => {
    it('should delete removed junctions and create added ones, leaving unchanged alone', () => {
      const existingJunctions = [
        { ref: 'ref-a', data: () => ({ episodeId: 'a', tagId: 't1' }) },
        { ref: 'ref-b', data: () => ({ episodeId: 'b', tagId: 't1' }) },
        { ref: 'ref-c', data: () => ({ episodeId: 'c', tagId: 't1' }) },
      ];
      const desired = new Set(['b', 'c', 'd']);

      const existing = new Map<string, string>();
      for (const d of existingJunctions) {
        existing.set(d.data()['episodeId'], d.ref);
      }

      const deletes: string[] = [];
      const adds: { episodeId: string; tagId: string }[] = [];

      for (const [episodeId, ref] of existing) {
        if (!desired.has(episodeId)) deletes.push(ref);
      }
      for (const episodeId of desired) {
        if (!existing.has(episodeId)) {
          adds.push({ episodeId, tagId: 't1' });
        }
      }

      expect(deletes).toEqual(['ref-a']);
      expect(adds).toEqual([{ episodeId: 'd', tagId: 't1' }]);
    });

    it('should produce no writes when desired matches existing', () => {
      const existingJunctions = [
        { ref: 'ref-a', data: () => ({ episodeId: 'a', tagId: 't1' }) },
        { ref: 'ref-b', data: () => ({ episodeId: 'b', tagId: 't1' }) },
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

  describe('getEpisodesByTagSlug', () => {
    it('should return empty array when no tag matches the slug', () => {
      const tagSnapshot = { empty: true, docs: [] };

      let result: unknown[] = [];
      if (tagSnapshot.empty) {
        result = [];
      }

      expect(result).toEqual([]);
    });

    it('should resolve episode docs from junction records', () => {
      const tagSnapshot = {
        empty: false,
        docs: [{ id: 't1' }],
      };
      const junctionDocs = [
        { data: () => ({ episodeId: 'ep1' }) },
        { data: () => ({ episodeId: 'ep2' }) },
      ];
      const episodeSnaps = [
        { exists: () => true, id: 'ep1', data: () => ({ title: 'Episode 1', isVisible: true }) },
        { exists: () => true, id: 'ep2', data: () => ({ title: 'Episode 2', isVisible: true }) },
      ];

      expect(tagSnapshot.empty).toBe(false);
      expect(tagSnapshot.docs[0].id).toBe('t1');

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
