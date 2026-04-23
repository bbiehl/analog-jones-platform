/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import type { Firestore } from 'firebase/firestore';
import { FIRESTORE } from '../../../../../../libs/shared/firebase.token';
import { RelatedEpisodesService } from './related-episodes.service';

describe('RelatedEpisodesService', () => {
  let service: RelatedEpisodesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RelatedEpisodesService,
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });
    service = TestBed.inject(RelatedEpisodesService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of RelatedEpisodesService', () => {
      expect(service).toBeInstanceOf(RelatedEpisodesService);
    });
  });

  describe('related id extraction', () => {
    it('should extract tag ids and filter out undefined', () => {
      const tags = [{ id: 't1' }, { id: undefined }, { id: 't2' }];

      const ids = tags.map((t) => t.id).filter((id): id is string => !!id);

      expect(ids).toEqual(['t1', 't2']);
    });

    it('should extract genre ids and filter out undefined', () => {
      const genres = [{ id: 'g1' }, { id: undefined }];

      const ids = genres.map((g) => g.id).filter((id): id is string => !!id);

      expect(ids).toEqual(['g1']);
    });
  });

  describe('junction → episode resolution', () => {
    it('should collect unique episodes from junction docs', () => {
      const sourceId = 'ep-source';
      const results = new Map<string, { id: string; title: string; isVisible: boolean }>();
      const junctionDocs = [
        { data: () => ({ episodeId: 'ep1' }) },
        { data: () => ({ episodeId: 'ep2' }) },
        { data: () => ({ episodeId: 'ep1' }) }, // duplicate
      ];
      const episodeSnaps: Record<
        string,
        { id: string; exists: () => boolean; data: () => Record<string, unknown> }
      > = {
        ep1: {
          id: 'ep1',
          exists: () => true,
          data: () => ({ title: 'One', isVisible: true }),
        },
        ep2: {
          id: 'ep2',
          exists: () => true,
          data: () => ({ title: 'Two', isVisible: true }),
        },
      };

      for (const j of junctionDocs) {
        const episodeId = j.data()['episodeId'] as string;
        if (episodeId === sourceId || results.has(episodeId)) continue;

        const snap = episodeSnaps[episodeId];
        if (snap.exists() && snap.data()['isVisible']) {
          results.set(snap.id, { id: snap.id, ...snap.data() } as {
            id: string;
            title: string;
            isVisible: boolean;
          });
        }
      }

      expect(Array.from(results.keys())).toEqual(['ep1', 'ep2']);
    });

    it('should skip the source episode itself', () => {
      const sourceId = 'ep-source';
      const results = new Map<string, unknown>();
      const junctionDocs = [
        { data: () => ({ episodeId: 'ep-source' }) },
        { data: () => ({ episodeId: 'ep1' }) },
      ];

      for (const j of junctionDocs) {
        const episodeId = j.data()['episodeId'] as string;
        if (episodeId === sourceId || results.has(episodeId)) continue;
        results.set(episodeId, { id: episodeId });
      }

      expect(Array.from(results.keys())).toEqual(['ep1']);
    });

    it('should skip episodes that do not exist in firestore', () => {
      const results = new Map<string, unknown>();
      const snaps: {
        id: string;
        exists: () => boolean;
        data: () => Record<string, unknown>;
      }[] = [
        { id: 'ep1', exists: () => true, data: () => ({ isVisible: true }) },
        { id: 'ep2', exists: () => false, data: () => ({}) },
      ];

      for (const snap of snaps) {
        if (snap.exists() && snap.data()['isVisible']) {
          results.set(snap.id, { id: snap.id, ...snap.data() });
        }
      }

      expect(Array.from(results.keys())).toEqual(['ep1']);
    });

    it('should exclude hidden episodes (isVisible: false)', () => {
      const results = new Map<string, unknown>();
      const snaps = [
        { id: 'ep1', exists: () => true, data: () => ({ isVisible: true }) },
        { id: 'ep2', exists: () => true, data: () => ({ isVisible: false }) },
      ];

      for (const snap of snaps) {
        if (snap.exists() && snap.data()['isVisible']) {
          results.set(snap.id, { id: snap.id, ...snap.data() });
        }
      }

      expect(Array.from(results.keys())).toEqual(['ep1']);
    });
  });

  describe('final ordering and limit', () => {
    it('should sort by episodeDate descending and slice to max', () => {
      const max = 2;
      const collected = [
        { id: 'old', episodeDate: { toMillis: () => 100 } },
        { id: 'newest', episodeDate: { toMillis: () => 300 } },
        { id: 'mid', episodeDate: { toMillis: () => 200 } },
      ];

      const result = collected
        .sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis())
        .slice(0, max);

      expect(result.map((r) => r.id)).toEqual(['newest', 'mid']);
    });

    it('should return fewer than max when fewer relations exist', () => {
      const max = 12;
      const collected = [
        { id: 'a', episodeDate: { toMillis: () => 1 } },
        { id: 'b', episodeDate: { toMillis: () => 2 } },
      ];

      const result = collected
        .sort((a, b) => b.episodeDate.toMillis() - a.episodeDate.toMillis())
        .slice(0, max);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('b');
    });

    it('should fall back to genres only when tags do not fill max', () => {
      const max = 3;
      const tagResults = new Map<string, string>([
        ['ep1', 'ep1'],
      ]);

      const shouldFallback = tagResults.size < max;
      if (shouldFallback) {
        tagResults.set('ep2', 'ep2');
        tagResults.set('ep3', 'ep3');
      }

      expect(shouldFallback).toBe(true);
      expect(Array.from(tagResults.keys())).toEqual(['ep1', 'ep2', 'ep3']);
    });

    it('should skip the genre fallback when tags already fill max', () => {
      const max = 2;
      const tagResults = new Map<string, string>([
        ['ep1', 'ep1'],
        ['ep2', 'ep2'],
      ]);

      const shouldFallback = tagResults.size < max;

      expect(shouldFallback).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('should resolve to an empty list when episode has no tags or genres', () => {
      const tagIds = ([] as { id?: string }[])
        .map((t) => t.id)
        .filter((id): id is string => !!id);
      const genreIds = ([] as { id?: string }[])
        .map((g) => g.id)
        .filter((id): id is string => !!id);

      const results = new Map<string, unknown>();
      const final = Array.from(results.values()).slice(0, 12);

      expect(tagIds).toEqual([]);
      expect(genreIds).toEqual([]);
      expect(final).toEqual([]);
    });
  });
});
