/// <reference types="vitest/globals" />
import { TestBed } from '@angular/core/testing';
import { FIRESTORE, FIRESTORE_OPS, FirestoreOps } from '../shared/firebase.token';
import { GenreService } from './genre.service';
import type { Firestore } from 'firebase/firestore';

describe('GenreService', () => {
  let service: GenreService;
  let ops: { [K in keyof FirestoreOps]: ReturnType<typeof vi.fn> };
  const firestore = { __brand: 'fake-firestore' } as unknown as Firestore;

  beforeEach(() => {
    ops = {
      collection: vi.fn((_db, path) => ({ __collection: path })),
      doc: vi.fn((_db, path, id) => ({ __doc: `${path}/${id}` })),
      query: vi.fn((coll, ...constraints) => ({ __query: { coll, constraints } })),
      orderBy: vi.fn((field) => ({ __orderBy: field })),
      where: vi.fn((field, op, value) => ({ __where: { field, op, value } })),
      limit: vi.fn((n) => ({ __limit: n })),
      getDoc: vi.fn(),
      getDocs: vi.fn(),
      addDoc: vi.fn(),
      updateDoc: vi.fn().mockResolvedValue(undefined),
      writeBatch: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GenreService,
        { provide: FIRESTORE, useValue: firestore },
        { provide: FIRESTORE_OPS, useValue: ops as unknown as FirestoreOps },
      ],
    });

    service = TestBed.inject(GenreService);
  });

  describe('service injection', () => {
    it('should be created', () => {
      expect(service).toBeInstanceOf(GenreService);
    });
  });

  describe('getAllGenres', () => {
    it('should query genres ordered by name and map docs to Genre objects', async () => {
      ops.getDocs.mockResolvedValueOnce({
        docs: [
          { id: 'g1', data: () => ({ name: 'Action', slug: 'action' }) },
          { id: 'g2', data: () => ({ name: 'Drama', slug: 'drama' }) },
        ],
      });

      const result = await service.getAllGenres();

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'genres');
      expect(ops.orderBy).toHaveBeenCalledWith('name');
      expect(result).toEqual([
        { id: 'g1', name: 'Action', slug: 'action' },
        { id: 'g2', name: 'Drama', slug: 'drama' },
      ]);
    });

    it('should return [] when there are no docs', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      expect(await service.getAllGenres()).toEqual([]);
    });

    it('should propagate getDocs errors', async () => {
      ops.getDocs.mockRejectedValueOnce(new Error('unavailable'));
      await expect(service.getAllGenres()).rejects.toThrow('unavailable');
    });
  });

  describe('getGenreById', () => {
    it('should return the genre when the snapshot exists', async () => {
      ops.getDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'g1',
        data: () => ({ name: 'Thriller', slug: 'thriller' }),
      });

      const result = await service.getGenreById('g1');

      expect(ops.doc).toHaveBeenCalledWith(firestore, 'genres', 'g1');
      expect(result).toEqual({ id: 'g1', name: 'Thriller', slug: 'thriller' });
    });

    it('should throw when the snapshot does not exist', async () => {
      ops.getDoc.mockResolvedValueOnce({ exists: () => false });
      await expect(service.getGenreById('missing')).rejects.toThrow(
        'Genre with id "missing" not found'
      );
    });

    it('should propagate getDoc errors', async () => {
      ops.getDoc.mockRejectedValueOnce(new Error('permission-denied'));
      await expect(service.getGenreById('g1')).rejects.toThrow('permission-denied');
    });
  });

  describe('createGenre', () => {
    it('should write only name and slug and return the new doc id', async () => {
      ops.addDoc.mockResolvedValueOnce({ id: 'new-id' });

      const result = await service.createGenre({ name: 'Horror', slug: 'horror' });

      expect(ops.addDoc).toHaveBeenCalledWith(
        { __collection: 'genres' },
        { name: 'Horror', slug: 'horror' }
      );
      expect(result).toBe('new-id');
    });

    it('should propagate addDoc errors', async () => {
      ops.addDoc.mockRejectedValueOnce(new Error('quota'));
      await expect(service.createGenre({ name: 'X', slug: 'x' })).rejects.toThrow('quota');
    });
  });

  describe('updateGenre', () => {
    it('should strip the id field before updating', async () => {
      await service.updateGenre('g1', { id: 'g1', name: 'Updated', slug: 'updated' });

      expect(ops.updateDoc).toHaveBeenCalledWith(
        { __doc: 'genres/g1' },
        { name: 'Updated', slug: 'updated' }
      );
    });

    it('should propagate updateDoc errors', async () => {
      ops.updateDoc.mockRejectedValueOnce(new Error('not-found'));
      await expect(service.updateGenre('g1', { name: 'X' })).rejects.toThrow('not-found');
    });
  });

  describe('deleteGenre', () => {
    it('should batch-delete every junction doc plus the genre doc, then commit', async () => {
      const junctionRefs = [{ ref: { __ref: 'eg1' } }, { ref: { __ref: 'eg2' } }];
      ops.getDocs.mockResolvedValueOnce({ docs: junctionRefs });

      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteGenre('g1');

      expect(ops.collection).toHaveBeenCalledWith(firestore, 'episodeGenres');
      expect(ops.where).toHaveBeenCalledWith('genreId', '==', 'g1');
      expect(batch.delete).toHaveBeenCalledTimes(junctionRefs.length + 1);
      expect(batch.delete).toHaveBeenLastCalledWith({ __doc: 'genres/g1' });
      expect(batch.commit).toHaveBeenCalledTimes(1);
    });

    it('should still delete the genre when no junction docs exist', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      const batch = { delete: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
      ops.writeBatch.mockReturnValueOnce(batch);

      await service.deleteGenre('g1');

      expect(batch.delete).toHaveBeenCalledTimes(1);
      expect(batch.delete).toHaveBeenCalledWith({ __doc: 'genres/g1' });
    });

    it('should propagate batch.commit errors', async () => {
      ops.getDocs.mockResolvedValueOnce({ docs: [] });
      const batch = {
        delete: vi.fn(),
        commit: vi.fn().mockRejectedValueOnce(new Error('aborted')),
      };
      ops.writeBatch.mockReturnValueOnce(batch);

      await expect(service.deleteGenre('g1')).rejects.toThrow('aborted');
    });
  });
});
