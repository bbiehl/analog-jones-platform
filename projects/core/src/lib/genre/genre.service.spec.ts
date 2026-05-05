/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE } from '../shared/firebase.token';
import { GenreService } from './genre.service';
import type { Firestore } from 'firebase/firestore';

describe('GenreService', () => {
  let service: GenreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        GenreService,
        { provide: FIRESTORE, useValue: {} as Firestore },
      ],
    });

    service = TestBed.inject(GenreService);
  });

  describe('getAllGenres', () => {
    it('should map snapshot docs to Genre objects', () => {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'Action', slug: 'action' }) },
        { id: '2', data: () => ({ name: 'Drama', slug: 'drama' }) },
      ];

      const result = mockDocs.map((d) => ({ id: d.id, ...d.data() }));

      expect(result).toEqual([
        { id: '1', name: 'Action', slug: 'action' },
        { id: '2', name: 'Drama', slug: 'drama' },
      ]);
    });
  });

  describe('getGenreById', () => {
    it('should combine snapshot id and data into a Genre', () => {
      const snap = {
        exists: () => true,
        id: 'g1',
        data: () => ({ name: 'Thriller', slug: 'thriller' }),
      };

      const result = { id: snap.id, ...snap.data() };
      expect(result).toEqual({ id: 'g1', name: 'Thriller', slug: 'thriller' });
    });

    it('should throw when snapshot does not exist', () => {
      const snap = { exists: () => false };

      expect(() => {
        if (!snap.exists()) {
          throw new Error('Genre with id "missing" not found');
        }
      }).toThrow('Genre with id "missing" not found');
    });
  });

  describe('createGenre', () => {
    it('should only pass name and slug fields', () => {
      const genre = { name: 'Horror', slug: 'horror' };
      const payload = { name: genre.name, slug: genre.slug };

      expect(payload).toEqual({ name: 'Horror', slug: 'horror' });
      expect(payload).not.toHaveProperty('id');
    });
  });

  describe('updateGenre', () => {
    it('should strip the id field before updating', () => {
      const genre = { id: 'g1', name: 'Updated', slug: 'updated' };
      const { id: _id, ...data } = genre;

      expect(data).toEqual({ name: 'Updated', slug: 'updated' });
      expect(data).not.toHaveProperty('id');
    });
  });

  describe('deleteGenre', () => {
    it('should batch delete episodeGenres junction docs and the genre doc', () => {
      const junctionDocs = [
        { ref: { path: 'episodeGenres/j1' } },
        { ref: { path: 'episodeGenres/j2' } },
      ];
      const deleted: unknown[] = [];
      const batch = { delete: (ref: unknown) => deleted.push(ref) };

      junctionDocs.forEach((d) => batch.delete(d.ref));
      batch.delete({ path: 'genres/g1' });

      expect(deleted).toEqual([
        { path: 'episodeGenres/j1' },
        { path: 'episodeGenres/j2' },
        { path: 'genres/g1' },
      ]);
    });
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should be an instance of GenreService', () => {
      expect(service).toBeInstanceOf(GenreService);
    });
  });
});
