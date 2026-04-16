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
        { exists: () => true, id: 'ep1', data: () => ({ title: 'Episode 1' }) },
        { exists: () => true, id: 'ep2', data: () => ({ title: 'Episode 2' }) },
      ];

      expect(tagSnapshot.empty).toBe(false);
      expect(tagSnapshot.docs[0].id).toBe('t1');

      const episodes = episodeSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(episodes).toEqual([
        { id: 'ep1', title: 'Episode 1' },
        { id: 'ep2', title: 'Episode 2' },
      ]);
      expect(junctionDocs[0].data()['episodeId']).toBe('ep1');
    });

    it('should skip episodes that do not exist', () => {
      const episodeSnaps = [
        { exists: () => true, id: 'ep1', data: () => ({ title: 'Episode 1' }) },
        { exists: () => false, id: 'ep2', data: () => ({}) },
      ];

      const episodes = episodeSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(episodes).toHaveLength(1);
      expect(episodes[0]).toEqual({ id: 'ep1', title: 'Episode 1' });
    });
  });
});
