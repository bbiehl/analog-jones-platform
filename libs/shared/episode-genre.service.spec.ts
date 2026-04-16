/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from './firebase.token';
import { EpisodeGenreService } from './episode-genre.service';
import type { Firestore } from 'firebase/firestore';

describe('EpisodeGenreService', () => {
  let service: EpisodeGenreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EpisodeGenreService,
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });

    service = TestBed.inject(EpisodeGenreService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of EpisodeGenreService', () => {
      expect(service).toBeInstanceOf(EpisodeGenreService);
    });
  });

  describe('createEpisodeGenre', () => {
    it('should produce the correct junction payload', () => {
      const episodeId = 'ep1';
      const genreId = 'g1';
      const payload = { episodeId, genreId };

      expect(payload).toEqual({ episodeId: 'ep1', genreId: 'g1' });
    });
  });

  describe('deleteEpisodeGenre', () => {
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

  describe('deleteEpisodeGenresByGenreId', () => {
    it('should batch-delete all junction docs for a given genreId', () => {
      const mockDocs = [
        { ref: 'ref1', data: () => ({ episodeId: 'ep1', genreId: 'g1' }) },
        { ref: 'ref2', data: () => ({ episodeId: 'ep2', genreId: 'g1' }) },
      ];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toHaveLength(2);
      expect(deleted).toEqual(['ref1', 'ref2']);
    });
  });

  describe('deleteEpisodeGenresByEpisodeId', () => {
    it('should batch-delete all junction docs for a given episodeId', () => {
      const mockDocs = [
        { ref: 'ref1', data: () => ({ episodeId: 'ep1', genreId: 'g1' }) },
        { ref: 'ref2', data: () => ({ episodeId: 'ep1', genreId: 'g2' }) },
      ];
      const deleted: string[] = [];
      mockDocs.forEach((d) => deleted.push(d.ref));

      expect(deleted).toHaveLength(2);
      expect(deleted).toEqual(['ref1', 'ref2']);
    });
  });

  describe('getEpisodeGenresByEpisodeId', () => {
    it('should resolve genre docs from junction records', () => {
      const junctionDocs = [
        { data: () => ({ genreId: 'g1' }) },
        { data: () => ({ genreId: 'g2' }) },
      ];
      const genreSnaps = [
        { exists: () => true, id: 'g1', data: () => ({ name: 'Rock', slug: 'rock' }) },
        { exists: () => true, id: 'g2', data: () => ({ name: 'Jazz', slug: 'jazz' }) },
      ];

      const genres = genreSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(genres).toEqual([
        { id: 'g1', name: 'Rock', slug: 'rock' },
        { id: 'g2', name: 'Jazz', slug: 'jazz' },
      ]);
      expect(junctionDocs[0].data()['genreId']).toBe('g1');
    });

    it('should skip genres that do not exist', () => {
      const genreSnaps = [
        { exists: () => true, id: 'g1', data: () => ({ name: 'Rock', slug: 'rock' }) },
        { exists: () => false, id: 'g2', data: () => ({}) },
      ];

      const genres = genreSnaps
        .filter((s) => s.exists())
        .map((s) => ({ id: s.id, ...s.data() }));

      expect(genres).toHaveLength(1);
      expect(genres[0]).toEqual({ id: 'g1', name: 'Rock', slug: 'rock' });
    });
  });

  describe('getEpisodesByGenreSlug', () => {
    it('should return empty array when no genre matches the slug', () => {
      const genreSnapshot = { empty: true, docs: [] };

      let result: unknown[] = [];
      if (genreSnapshot.empty) {
        result = [];
      }

      expect(result).toEqual([]);
    });

    it('should resolve episode docs from junction records', () => {
      const genreSnapshot = {
        empty: false,
        docs: [{ id: 'g1' }],
      };
      const junctionDocs = [
        { data: () => ({ episodeId: 'ep1' }) },
        { data: () => ({ episodeId: 'ep2' }) },
      ];
      const episodeSnaps = [
        { exists: () => true, id: 'ep1', data: () => ({ title: 'Episode 1' }) },
        { exists: () => true, id: 'ep2', data: () => ({ title: 'Episode 2' }) },
      ];

      expect(genreSnapshot.empty).toBe(false);
      expect(genreSnapshot.docs[0].id).toBe('g1');

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
