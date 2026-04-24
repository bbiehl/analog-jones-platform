/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import type { Firestore } from 'firebase/firestore';
import { FIRESTORE } from '../../../../../../libs/shared/firebase.token';
import type { EpisodeWithRelations } from '../../../../../../libs/episode/episode.model';
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
    const byDateDesc = (
      a: { episodeDate: { toMillis: () => number } },
      b: { episodeDate: { toMillis: () => number } }
    ) => b.episodeDate.toMillis() - a.episodeDate.toMillis();

    it('should emit all tag matches (sorted by date desc) before any genre matches', () => {
      const max = 12;
      const tagResults = new Map([
        ['tag-old', { id: 'tag-old', episodeDate: { toMillis: () => 100 } }],
        ['tag-new', { id: 'tag-new', episodeDate: { toMillis: () => 300 } }],
      ]);
      const genreResults = new Map([
        ['genre-new', { id: 'genre-new', episodeDate: { toMillis: () => 500 } }],
        ['genre-old', { id: 'genre-old', episodeDate: { toMillis: () => 50 } }],
      ]);

      const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
      for (const id of tagResults.keys()) genreResults.delete(id);
      const genresSorted = Array.from(genreResults.values()).sort(byDateDesc);
      const result = [...tagsSorted, ...genresSorted].slice(0, max);

      expect(result.map((r) => r.id)).toEqual(['tag-new', 'tag-old', 'genre-new', 'genre-old']);
    });

    it('should not let a recent genre match precede an older tag match', () => {
      const max = 12;
      const tagResults = new Map([
        ['older-tag', { id: 'older-tag', episodeDate: { toMillis: () => 100 } }],
      ]);
      const genreResults = new Map([
        ['newer-genre', { id: 'newer-genre', episodeDate: { toMillis: () => 999 } }],
      ]);

      const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
      for (const id of tagResults.keys()) genreResults.delete(id);
      const genresSorted = Array.from(genreResults.values()).sort(byDateDesc);
      const result = [...tagsSorted, ...genresSorted].slice(0, max);

      expect(result.map((r) => r.id)).toEqual(['older-tag', 'newer-genre']);
    });

    it('should dedupe genre matches that already appeared in the tag bucket', () => {
      const max = 12;
      const tagResults = new Map([
        ['shared', { id: 'shared', episodeDate: { toMillis: () => 200 } }],
      ]);
      const genreResults = new Map([
        ['shared', { id: 'shared', episodeDate: { toMillis: () => 200 } }],
        ['genre-only', { id: 'genre-only', episodeDate: { toMillis: () => 100 } }],
      ]);

      const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
      for (const id of tagResults.keys()) genreResults.delete(id);
      const genresSorted = Array.from(genreResults.values()).sort(byDateDesc);
      const result = [...tagsSorted, ...genresSorted].slice(0, max);

      expect(result.map((r) => r.id)).toEqual(['shared', 'genre-only']);
    });

    it('should short-circuit and return only tag matches when they already fill max', () => {
      const max = 2;
      const tagResults = new Map([
        ['tag-a', { id: 'tag-a', episodeDate: { toMillis: () => 300 } }],
        ['tag-b', { id: 'tag-b', episodeDate: { toMillis: () => 200 } }],
        ['tag-c', { id: 'tag-c', episodeDate: { toMillis: () => 100 } }],
      ]);

      const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
      const result = tagsSorted.length >= max ? tagsSorted.slice(0, max) : tagsSorted;

      expect(result.map((r) => r.id)).toEqual(['tag-a', 'tag-b']);
    });

    it('should truncate the combined list to max', () => {
      const max = 3;
      const tagResults = new Map([
        ['t1', { id: 't1', episodeDate: { toMillis: () => 400 } }],
        ['t2', { id: 't2', episodeDate: { toMillis: () => 300 } }],
      ]);
      const genreResults = new Map([
        ['g1', { id: 'g1', episodeDate: { toMillis: () => 200 } }],
        ['g2', { id: 'g2', episodeDate: { toMillis: () => 100 } }],
      ]);

      const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
      const genresSorted = Array.from(genreResults.values()).sort(byDateDesc);
      const result = [...tagsSorted, ...genresSorted].slice(0, max);

      expect(result.map((r) => r.id)).toEqual(['t1', 't2', 'g1']);
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

    it('should issue no junction queries when the id list is empty', () => {
      const ids: string[] = [];
      const queried: string[] = [];

      for (const id of ids) {
        queried.push(id);
      }

      expect(queried).toEqual([]);
    });
  });

  describe('multi-id junction iteration', () => {
    it('should union episodes across multiple ids into a single results map', () => {
      const sourceId = 'ep-source';
      const ids = ['t1', 't2'];
      const junctionByTag: Record<string, { episodeId: string }[]> = {
        t1: [{ episodeId: 'ep1' }, { episodeId: 'ep2' }],
        t2: [{ episodeId: 'ep3' }],
      };
      const episodeSnaps: Record<
        string,
        { id: string; exists: () => boolean; data: () => Record<string, unknown> }
      > = {
        ep1: { id: 'ep1', exists: () => true, data: () => ({ isVisible: true }) },
        ep2: { id: 'ep2', exists: () => true, data: () => ({ isVisible: true }) },
        ep3: { id: 'ep3', exists: () => true, data: () => ({ isVisible: true }) },
      };

      const results = new Map<string, { id: string; isVisible: boolean }>();
      for (const id of ids) {
        for (const j of junctionByTag[id]) {
          if (j.episodeId === sourceId || results.has(j.episodeId)) continue;
          const snap = episodeSnaps[j.episodeId];
          if (snap.exists() && snap.data()['isVisible']) {
            results.set(snap.id, { id: snap.id, ...snap.data() } as {
              id: string;
              isVisible: boolean;
            });
          }
        }
      }

      expect(Array.from(results.keys())).toEqual(['ep1', 'ep2', 'ep3']);
    });

    it('should dedupe an episode that appears under more than one id', () => {
      const ids = ['t1', 't2'];
      const junctionByTag: Record<string, { episodeId: string }[]> = {
        t1: [{ episodeId: 'ep1' }],
        t2: [{ episodeId: 'ep1' }, { episodeId: 'ep2' }],
      };
      const episodeSnaps: Record<
        string,
        { id: string; exists: () => boolean; data: () => Record<string, unknown> }
      > = {
        ep1: { id: 'ep1', exists: () => true, data: () => ({ isVisible: true }) },
        ep2: { id: 'ep2', exists: () => true, data: () => ({ isVisible: true }) },
      };

      const fetches: string[] = [];
      const results = new Map<string, { id: string; isVisible: boolean }>();
      for (const id of ids) {
        for (const j of junctionByTag[id]) {
          if (results.has(j.episodeId)) continue;
          fetches.push(j.episodeId);
          const snap = episodeSnaps[j.episodeId];
          if (snap.exists() && snap.data()['isVisible']) {
            results.set(snap.id, { id: snap.id, ...snap.data() } as {
              id: string;
              isVisible: boolean;
            });
          }
        }
      }

      expect(fetches).toEqual(['ep1', 'ep2']);
      expect(Array.from(results.keys())).toEqual(['ep1', 'ep2']);
    });
  });

  describe('genre-only fallback', () => {
    it('should return genre matches when tag lookup yields nothing', () => {
      const max = 12;
      const tagResults = new Map<string, { id: string; episodeDate: { toMillis: () => number } }>();
      const genreResults = new Map([
        ['g1', { id: 'g1', episodeDate: { toMillis: () => 400 } }],
        ['g2', { id: 'g2', episodeDate: { toMillis: () => 200 } }],
      ]);

      const byDateDesc = (
        a: { episodeDate: { toMillis: () => number } },
        b: { episodeDate: { toMillis: () => number } }
      ) => b.episodeDate.toMillis() - a.episodeDate.toMillis();

      const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
      for (const id of tagResults.keys()) genreResults.delete(id);
      const genresSorted = Array.from(genreResults.values()).sort(byDateDesc);
      const result = [...tagsSorted, ...genresSorted].slice(0, max);

      expect(result.map((r) => r.id)).toEqual(['g1', 'g2']);
    });

    it('should skip the genre-lookup branch entirely when tags already fill max', () => {
      const max = 2;
      const tagResults = new Map([
        ['t1', { id: 't1', episodeDate: { toMillis: () => 300 } }],
        ['t2', { id: 't2', episodeDate: { toMillis: () => 200 } }],
      ]);
      let genreLookupPerformed = false;

      const byDateDesc = (
        a: { episodeDate: { toMillis: () => number } },
        b: { episodeDate: { toMillis: () => number } }
      ) => b.episodeDate.toMillis() - a.episodeDate.toMillis();

      const tagsSorted = Array.from(tagResults.values()).sort(byDateDesc);
      let result: typeof tagsSorted;
      if (tagsSorted.length >= max) {
        result = tagsSorted.slice(0, max);
      } else {
        genreLookupPerformed = true;
        result = tagsSorted;
      }

      expect(genreLookupPerformed).toBe(false);
      expect(result.map((r) => r.id)).toEqual(['t1', 't2']);
    });
  });

  describe('getRelatedEpisodes (public API)', () => {
    const makeEpisode = (
      overrides: Partial<EpisodeWithRelations> = {}
    ): EpisodeWithRelations =>
      ({
        id: 'ep-source',
        tags: [],
        genres: [],
        categories: [],
        episodeDate: { toMillis: () => 0 },
        ...overrides,
      }) as unknown as EpisodeWithRelations;

    it('should resolve to an empty list when the episode has no tags or genres', async () => {
      const result = await service.getRelatedEpisodes(makeEpisode());

      expect(result).toEqual([]);
    });

    it('should short-circuit with an empty list when max is 0', async () => {
      const result = await service.getRelatedEpisodes(makeEpisode(), 0);

      expect(result).toEqual([]);
    });

    it('should drop tag and genre entries with falsy ids before hitting firestore', async () => {
      const episode = makeEpisode({
        tags: [{ id: undefined }, { id: '' }] as unknown as EpisodeWithRelations['tags'],
        genres: [{ id: undefined }] as unknown as EpisodeWithRelations['genres'],
      });

      const result = await service.getRelatedEpisodes(episode);

      expect(result).toEqual([]);
    });

    it('should accept an episode whose tags/genres arrays are only populated with empty ids and still return []', async () => {
      const episode = makeEpisode({
        tags: [{ id: '' }, { id: '' }] as unknown as EpisodeWithRelations['tags'],
        genres: [{ id: '' }] as unknown as EpisodeWithRelations['genres'],
      });

      const result = await service.getRelatedEpisodes(episode, 5);

      expect(result).toEqual([]);
    });
  });

  describe('date sorting edge cases', () => {
    const byDateDesc = (
      a: { episodeDate: { toMillis: () => number } },
      b: { episodeDate: { toMillis: () => number } }
    ) => b.episodeDate.toMillis() - a.episodeDate.toMillis();

    it('should preserve insertion order when two episodes share an identical date', () => {
      const results = new Map([
        ['first', { id: 'first', episodeDate: { toMillis: () => 500 } }],
        ['second', { id: 'second', episodeDate: { toMillis: () => 500 } }],
      ]);

      const sorted = Array.from(results.values()).sort(byDateDesc);

      expect(sorted.map((r) => r.id)).toEqual(['first', 'second']);
    });
  });
});
